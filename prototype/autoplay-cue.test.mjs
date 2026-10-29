import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createCueHolds} from './holds.js';

const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const part=(from,to)=>source.slice(source.indexOf(from),source.indexOf(to));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const bus=()=>({gain:{value:1,setTargetAtTime(v){this.value=v;}},connect(){},disconnect(){}});
function fixture(t){
 const engine=new AudioEngine(),read=deferred(),entered=deferred();
 const old={id:'old',title:'Old',bpm:120,duration:48,cues:[],analyzed:true};
 const next={id:'next',title:'Next',bpm:120,duration:48,cues:[{position:2}],plays:0,analyzed:true,file:{async arrayBuffer(){entered.resolve();await read.promise;return new ArrayBuffer(1);}}};
 const d={index:0,track:old,position:48,cue:0,rate:1,playing:false,repeat:false,mode:'INT',keylock:false,keyShift:0,loop:false,reverse:false};
 const state={decks:[d],settings:{},autoplay:true,fx:[[],[]],flip:{deck:-1},history:[],prepare:[]};
 engine.ctx={currentTime:1,sampleRate:48000,decodeAudioData:async()=>({duration:48,sampleRate:48000}),createGain:bus,createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},start(){},stop(){}})};
 engine.nodes=Array.from({length:4},()=>({deckInput:bus(),gain:bus(),high:bus(),filter:bus(),level:1,trim:1}));
 engine.resume=async()=>{};engine.applyChannelFX=async()=>{};engine.configureFX=()=>{};
 const cancel={cancelDeck(){}},scope={engine,state,createCueHolds,playbackIntents:{record(){}},tempoSliders:{cancel(){}},autoplayRequests:new WeakMap(),playRequests:new WeakMap(),deckLoadRequests:new WeakMap(),faderStarts:new Map(),
  instantDouble:{cancelDeck(){},pending:()=>false},pitchPlay:{...cancel,latch:()=>false},deckScratchControls:cancel,loopPads:cancel,manualLoops:cancel,slicer:cancel,stemSlipControls:cancel,
  smartSync:createSmartSync({engine,state}),syncMaster:{started(){}},filtered:()=>[old,next],trackById:id=>[old,next].find(t=>t.id===id),trackGain:{refresh(){}},
  quantized:(_,p)=>p,flipAutomation:{record(){},stop(){}},api:{refreshCueControls(){}},persist(){},renderDecks(){},renderTracks(){},refreshTransportControls(){},drawWaves(){},notify:message=>assert.fail(message)};
 const code=source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+part('async function load(index,','\nconst deckKeyShift=')+'\n'+part('async function play(','\nfunction deckQuantize(')+'\n'+part('const cueHolds = createCueHolds({','\napi.cueHolds =')+'\n'+part('engine.onEnd = async (d) => {','\nfunction tick()')+'\nglobalThis.holds=cueHolds;globalThis.pressPlay=play;';
 vm.runInNewContext(code,scope);
 t.after(()=>{read.resolve();engine.pause(d);});
 return{d,engine,scope,read,entered,end:()=>engine.onEnd(d)};
}
test('pending Autoplay cannot latch a newer temporary Cue audition',async t=>{
 const f=fixture(t),end=f.end();await f.entered.promise;
 const audition=f.scope.holds.press('cue',f.d);await new Promise(r=>setImmediate(r));
 assert.equal(f.d.processing,true);assert.equal(f.engine.bufferLoads.has('next'),true);
 f.read.resolve();await Promise.all([end,audition]);assert.equal(f.d.playing,true);
 await f.scope.holds.release('cue');assert.equal(f.d.playing,false);assert.equal(f.engine.voices.size,0);
});
test('released hot-cue audition cannot be restarted by an older Autoplay load',async t=>{
 const f=fixture(t),end=f.end();await f.entered.promise;
 const audition=f.scope.holds.press('hot',f.d,0);await new Promise(r=>setImmediate(r));
 assert.equal(f.d.processing,true);await f.scope.holds.release('hot');
 f.read.resolve();await Promise.all([end,audition]);assert.equal(f.d.playing,false);assert.equal(f.engine.voices.size,0);assert.equal(f.d.position,2);
});
test('explicit Cue plus Play still latches during shared decoding',async t=>{
 const f=fixture(t),end=f.end();await f.entered.promise;
 const audition=f.scope.holds.press('cue',f.d);await new Promise(r=>setImmediate(r));
 await f.scope.pressPlay(f.d);await f.scope.holds.release('cue');
 f.read.resolve();await Promise.all([end,audition]);assert.equal(f.d.playing,true);assert.equal(f.engine.voices.size,1);
});
test('creating or deleting an empty hot-cue slot does not cancel pending Autoplay',async t=>{
 const f=fixture(t),end=f.end();await f.entered.promise;
 await f.scope.holds.press('create',f.d,1);assert(f.d.track.cues[1]);
 await f.scope.holds.press('remove',f.d,1,true);assert.equal(f.d.track.cues[1],null);
 assert.equal(f.scope.autoplayRequests.has(f.d),true);f.read.resolve();await end;assert.equal(f.d.playing,true);
});
