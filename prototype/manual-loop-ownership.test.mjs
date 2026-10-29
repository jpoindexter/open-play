import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createManualLoops} from './manual-loops.js';
import {createLoopPads} from './loop-pads.js';

// Actual ManualLoops, AudioEngine and app Load; generated AudioBuffer with the
// existing keylock-loop-window controlled Worker/graph. No DSP/native/UI/audio
// quality or physical-input proof. The held Worker is a real async boundary.
async function fixture(){
 const originalGlobals={Worker:globalThis.Worker,AudioBuffer:globalThis.AudioBuffer};
 const jobs=[],starts=[];let entered,completeRenders=false;
 const reached=new Promise(resolve=>entered=resolve);
 class Buffer{
  constructor({length,numberOfChannels,sampleRate}){Object.assign(this,{length,numberOfChannels,sampleRate,duration:length/sampleRate});this.channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));}
  getChannelData(c){return this.channels[c];}copyToChannel(data,c){this.channels[c].set(data);}
 }
 globalThis.AudioBuffer=Buffer;
 globalThis.Worker=class{
  postMessage(data){jobs.push({worker:this,data});if(jobs.length===1||completeRenders)queueMicrotask(()=>this.onmessage({data:{channels:data.channels}}));else entered();}
  terminate(){this.terminated=true;}
 };
 const bus=()=>({gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){}});
 const engine=new AudioEngine(),old={id:'old-generated',bpm:120,grid:0,duration:30,cues:[],analyzed:true,savedLoops:[{start:1,end:2}]},replacement={id:'new-generated',bpm:90,grid:0,duration:30,cues:[],analyzed:true,savedLoops:[]};
 const deck={index:0,track:old,position:6.5,rate:1,playing:false,keylock:true,keyShift:-12,loop:true,loopIn:6,loopOut:8,loopLength:4,sync:false,stemSlip:'off'};
 const state={decks:[deck],settings:{'Sync Mode':'Off'},fx:[[],[]],flip:{deck:-1},focus:0};
 const buffer=new Buffer({length:1440000,numberOfChannels:1,sampleRate:48000});
 engine.ctx={currentTime:1,sampleRate:48000,createGain:bus,createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},stop(){},start(when,offset){starts.push({when,offset});}})};
 engine.nodes=[{deckInput:bus(),input:bus(),gain:bus()}];engine.resume=async()=>{};engine.buffer=async()=>buffer;engine.applyChannelFX=async()=>{};engine.setCross=()=>{};engine.configureFX=()=>{};engine.setDeckTrackGain=()=>{};
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);engine.retireVoiceAt=()=>{};
 const manual=createManualLoops({state,engine}),smartSync=createSmartSync({engine,state}),cancel={cancelDeck(){}};
 const scope={state,engine,smartSync,manualLoops:manual,tempoSliders:{cancel(){}},trackById:id=>id===replacement.id?replacement:null,autoplayRequests:new WeakMap(),playRequests:new WeakMap(),deckLoadRequests:new WeakMap(),faderStarts:new Map(),instantDouble:cancel,cueHolds:cancel,deckScratchControls:cancel,pitchPlay:cancel,loopPads:cancel,slicer:cancel,stemSlipControls:cancel,trackGain:{refresh(){}},notify:message=>assert.fail(message),renderDecks(){},renderTracks(){},drawWaves(){}};
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8'),load=app.slice(app.indexOf('async function load(index,'),app.indexOf('\nconst deckKeyShift='));
 vm.runInNewContext(app.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+load+'\nglobalThis.actualLoad=load;',scope);
 const cleanup=()=>{
  try{engine.pause(deck);manual.cancelDeck(deck);engine.keylockRenderer.clear();
   assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert.equal(engine.retiringVoices.size,0);
   assert.equal(deck.playing,false);assert.equal(deck.processing,false);assert(jobs.every(job=>job.worker.terminated));
  }finally{Object.assign(globalThis,originalGlobals);}
 };
 try{
  await engine.start(deck);engine.ctx.currentTime=1.1;
  assert.equal(deck.playing,true);assert.equal(jobs.length,1);assert.ok(engine.voices.get(0).renderWindow);
 }catch(error){cleanup();throw error;}
 return{engine,deck,manual,jobs,starts,reached,replacement,load:()=>scope.actualLoad(0,replacement.id,{skipDouble:true}),cleanup,
  releaseRenders(){completeRenders=true;for(const {worker,data}of jobs.slice(1))if(!worker.terminated)worker.onmessage({data:{channels:data.channels}});}};
}

for(const action of ['Load','Stop'])test(`${action} revokes saved-loop recall across pending rendered-loop preparation`,async()=>{
 const f=await fixture(),{engine,deck,manual,jobs,starts}=f;
 try{
  const voice=engine.voices.get(0),pending=manual.recall(deck,0);await f.reached;
  assert.equal(jobs.length,2);assert.equal(engine.voices.get(0),voice,'Preparation must retain the original voice');
  assert.equal(deck.processing,true);assert.equal(starts.length,1);
  const queued=action==='Stop'?manual.recall(deck,0):null;
  if(action==='Load')assert.equal(await f.load(),true);else engine.pause(deck);
  const after={position:deck.position,loopLength:deck.loopLength,token:engine.startTokens.get(0)};
  assert.equal(await pending,false);if(queued)assert.equal(await queued,false,'Pre-Stop queued recall must lose admission');
  assert.equal(deck.position,after.position,'Canceled recall cannot seek the stopped/replacement deck');
  assert.equal(deck.loopLength,after.loopLength,'Canceled bounds cannot rewrite loop length after cancellation');
  assert.equal(engine.startTokens.get(0),after.token,'No stale follow-up seek/start may claim another token');
  if(action==='Load'){assert.equal(deck.track,f.replacement);assert.equal(deck.position,0);assert.equal(deck.loopLength,4);}
  assert.equal(deck.playing,false);assert.equal(deck.processing,false);assert.equal(engine.voices.size,0);
  assert.equal(starts.length,1,'Canceled recall must not queue a restart');assert.equal(jobs[1].worker.terminated,true);
  if(action==='Stop'){
   assert.equal(await manual.recall(deck,0),true,'Fresh input after Stop must remain accepted');
   assert.equal(deck.position,1);assert.equal(deck.loopLength,2);assert.equal(deck.playing,false);assert.equal(starts.length,1);
  }
 }finally{f.cleanup();}
});

test('successful queued recalls carry their own real engine token advances',async()=>{
 const f=await fixture(),{engine,deck,manual}=f;
 try{
  deck.track.savedLoops[1]={start:11,end:12};deck.loopEdit='in';
  const first=manual.recall(deck,0),noop=manual.move(deck,1),second=manual.recall(deck,1);
  await f.reached;const admitted=engine.startTokens.get(0);f.releaseRenders();
  assert.deepEqual(await Promise.all([first,noop,second]),[true,false,true]);
  assert(engine.startTokens.get(0)>admitted);assert(f.starts.length>2);
  assert.equal(deck.position,11);assert.equal(deck.loopIn,11);assert.equal(deck.loopOut,12);
  assert.equal(deck.loopLength,2);assert.equal(deck.playing,true);
 }finally{f.cleanup();}
});

test('pending Loop Roll release yields to a newer saved-loop recall without its old seek',async()=>{
 const f=await fixture(),{engine,deck,jobs}=f,state={decks:[deck],deckCount:1,focus:0,settings:{}},loopPads=createLoopPads({state,engine}),seeks=[];
 const until=async check=>{const end=Date.now()+3000;while(!check()){assert(Date.now()<end,'Actual loop preparation not reached');await new Promise(resolve=>setImmediate(resolve));}};
 const seek=engine.seek.bind(engine);engine.seek=(d,p)=>{seeks.push(p);return seek(d,p);};
 try{
  deck.tab='Loops';deck.loopPadMode='saved';deck.track.savedLoops[1]={start:11,end:12};
  const hold=loopPads.hold('roll',deck,0,{length:4,ignoreBeatJump:true});await until(()=>jobs.length===2);
  jobs[1].worker.onmessage({data:{channels:jobs[1].data.channels}});await hold;
  // A cold prior-loop render gives release a real pending Worker boundary.
  engine.keylockRenderer.clear();const release=loopPads.release('roll');await until(()=>jobs.length>=3);
  const app=readFileSync(new URL('./app.js',import.meta.url),'utf8'),scope={state,engine,manualLoops:f.manual,loopPads,notify:m=>assert.fail(m),refreshLoopDecks(){}};
  vm.runInNewContext(app.slice(app.indexOf('async function deckAction('),app.indexOf('\nlet importTail='))+'\nglobalThis.savedPad=deckAction;',scope);
  const newer=scope.savedPad('pad',0,{dataset:{pad:'1'}});await until(()=>jobs.length>=4);
  f.releaseRenders();assert.equal(await newer,true,'Old roll release canceled the newer saved-loop recall');
  const voice=engine.voices.get(0),token=engine.startTokens.get(0);await release;
  assert.deepEqual(seeks,[11],'Older release must not seek its background clock');assert.equal(deck.position,11);assert.equal(deck.loopIn,11);assert.equal(deck.loopOut,12);
  assert.equal(engine.voices.get(0),voice);assert.equal(engine.startTokens.get(0),token);assert.equal(deck.playing,true);
 }finally{f.releaseRenders();f.cleanup();}
});
