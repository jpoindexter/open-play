import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createSyncMaster} from './sync-master.js';
import {createSyncTempoRequests} from './sync-tempo-requests.js';
import {createTempoSlider} from './tempo-slider.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const outcome=p=>p.then(()=>({ok:true}),error=>({ok:false,name:error.name}));
function fixture(mode){
 const entered=deferred(),resume=deferred(),engine=new AudioEngine(),notices=[];
 const track={id:'follower',title:'Follower',bpm:120,grid:0,duration:30,cues:[],analyzed:true};
 const d={index:1,track,position:3,anchorPosition:3,anchorTime:1,rate:1.05,pitchRange:8,keylock:true,playing:true,sync:true,syncState:'beat',syncRole:'secondary'};
 const leader={...d,index:0,track:{...track,id:'leader',bpm:126},rate:1,keylock:false,playing:false,syncState:'armed',syncRole:'primary'};
 const state={decks:[leader,d],settings:{'Sync Mode':mode,'Maintain Sync on Track Load':true},fx:[[],[]],flip:{deck:-1},focus:1};
 engine.ctx={currentTime:1};engine.nodes=[{},{}];engine.resume=async()=>{entered.resolve();await resume.promise;};
 engine.buffer=async()=>({duration:30,sampleRate:44100});engine.applyChannelFX=async()=>{};engine.configureFX=()=>{};
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.voices.set(1,{sources:[]});
 const smartSync=createSmartSync({engine,state}),syncMaster=createSyncMaster({decks:()=>state.decks});syncMaster.select(leader);smartSync.setMaster(leader);
 const tempoSliders=createTempoSlider({setRate:(deck,rate)=>engine.setRate(deck,rate)});
 engine.onRateRequest=createSyncTempoRequests({engine,state,smartSync,slicer:{changeRates:(_changes,run)=>run()},participants:()=>[],master:()=>syncMaster.master(),cancelGUI:deck=>tempoSliders.cancel(deck)});
 const cancel={cancelDeck(){}},scope={state,engine,smartSync,tempoSliders,trackById:id=>id===track.id?track:null,autoplayRequests:new WeakMap(),playRequests:new WeakMap(),deckLoadRequests:new WeakMap(),faderStarts:new Map(),
  instantDouble:cancel,cueHolds:cancel,deckScratchControls:cancel,pitchPlay:cancel,loopPads:cancel,manualLoops:cancel,slicer:cancel,stemSlipControls:cancel,trackGain:{refresh(){}},notify:message=>{notices.push(message);},renderDecks(){},renderTracks(){},drawWaves(){}};
 vm.runInNewContext(source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+source.slice(source.indexOf('async function load(index,'),source.indexOf('\nconst deckKeyShift='))+'\nglobalThis.actualLoad=load;',scope);
 return{d,track,state,leader,engine,smartSync,tempoSliders,entered,resume,scope,notices};
}
test('accepted same-track Load settles old group before rearm, retires queued inputs and permits fresh tempo',async()=>{
 for(const [mode,direct]of [['Smart Sync',false],['Smart Sync',true],['Simple Sync',true]]){
  const f=fixture(mode),{d,track,state,leader,engine,smartSync,tempoSliders,entered,resume,scope}=f,smart=mode==='Smart Sync';
  try{
   const first=outcome(tempoSliders.set(d,1));await entered.promise;
   const queued=outcome(direct?engine.onRateRequest(d,1.07):tempoSliders.set(d,2));
   state.settings['Lock Playing Deck']=true;assert.equal(await scope.actualLoad(1,track.id,{skipDouble:true}),undefined);
   assert.equal(d.playing,true);assert.equal(engine.transforms.get(1).signal.aborted,false);assert.match(f.notices[0],/Playing deck locked/);
   state.settings['Lock Playing Deck']=false;
   // Deliberately leave the real engine.start resume gate closed throughout Load.
   let deadline;const timed=new Promise((_,reject)=>deadline=setTimeout(()=>reject(Error('Load waited for an unabortable old preparation')),1000));
   let loaded;try{loaded=await Promise.race([scope.actualLoad(1,track.id,{skipDouble:true}),timed]);}finally{clearTimeout(deadline);}
   assert.equal(loaded,true);if(smart)assert.equal(smartSync.captureTempo(),126);assert.equal(leader.rate,1);assert.equal(d.rate,1.05);
   assert.equal(d.playing,false);assert.equal(d.processing,false);assert.equal(d.sync,true);assert.equal(d.syncState,smart?'armed':'beat');assert.equal(d.position,0);
   assert.deepEqual(await Promise.all([first,queued]),[{ok:false,name:'AbortError'},{ok:false,name:'AbortError'}]);
   await tempoSliders.set(d,1);assert.equal(d.rate,1.06);assert.ok(Math.abs(leader.rate*126-127.2)<1e-9);if(smart)assert.equal(smartSync.captureTempo(),127.2);
   resume.resolve();await new Promise(r=>setImmediate(r));assert.equal(d.rate,1.06);if(smart)assert.equal(smartSync.captureTempo(),127.2);
   assert.equal(d.playing,false);assert.equal(engine.voices.size,0);
  }finally{resume.resolve();for(const deck of state.decks)engine.pause(deck);}
 }
});

test('global silence retires queued GUI and shared tempo inputs before fresh ownership',async()=>{
 for(const direct of [false,true]){
  const f=fixture('Smart Sync'),{d,leader,engine,smartSync,tempoSliders,entered,resume}=f;
  const bus=()=>({connect(){},disconnect(){}});
  for(const node of engine.nodes)Object.assign(node,{high:bus(),filter:bus()});engine.setCross=()=>{};
  try{
   const first=outcome(tempoSliders.set(d,1));await entered.promise;
   const queued=outcome(direct?engine.onRateRequest(d,1.07):tempoSliders.set(d,2));
   engine.silence();
   assert.deepEqual(await Promise.all([first,queued]),[{ok:false,name:'AbortError'},{ok:false,name:'AbortError'}]);
   assert.equal(smartSync.captureTempo(),126);assert.equal(d.rate,1.05);assert.equal(leader.rate,1);
   assert.equal(d.playing,false);assert.equal(d.processing,false);assert.equal(engine.voices.size,0);
   await tempoSliders.set(d,1);assert.equal(d.rate,1.06);assert.equal(smartSync.captureTempo(),127.2);
   smartSync.reset();smartSync.tempo(leader,90/126);
   resume.resolve();await new Promise(resolve=>setImmediate(resolve));
   assert.equal(smartSync.captureTempo(),90);assert.equal(d.rate,1.06);assert.equal(engine.voices.size,0);assert.equal(d.playing,false);
  }finally{resume.resolve();engine.silence();}
 }
});

test('global silence rollback cannot overwrite a newer reset tempo',async()=>{
 const f=fixture('Smart Sync'),{d,leader,engine,smartSync,entered,resume}=f;
 const bus=()=>({connect(){},disconnect(){}});
 for(const node of engine.nodes)Object.assign(node,{high:bus(),filter:bus()});engine.setCross=()=>{};
 try{
  const first=outcome(engine.onRateRequest(d,1.06));await entered.promise;
  const queued=outcome(engine.onRateRequest(d,1.07));
  engine.silence();smartSync.reset();smartSync.tempo(leader,90/126);
  assert.deepEqual(await Promise.all([first,queued]),[{ok:false,name:'AbortError'},{ok:false,name:'AbortError'}]);
  assert.equal(smartSync.captureTempo(),90);
  resume.resolve();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(smartSync.captureTempo(),90);assert.equal(d.playing,false);assert.equal(d.processing,false);assert.equal(engine.voices.size,0);
 }finally{resume.resolve();engine.silence();}
});
