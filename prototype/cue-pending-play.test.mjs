import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createCueHolds} from './holds.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const part=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const bus=()=>({gain:{value:1,setTargetAtTime(v){this.value=v;}},connect(){},disconnect(){}});
test('temporary Cue sets paused position during pending Play; matched Cue still auditions',async t=>{
 const read=deferred(),entered=deferred(),engine=new AudioEngine();
 const track={id:'current',title:'Current',bpm:120,duration:48,cues:[],plays:0,analyzed:true,file:{async arrayBuffer(){entered.resolve();await read.promise;return new ArrayBuffer(1);}}};
 const d={index:0,track,position:3,cue:0,rate:1,playing:false,repeat:false,mode:'INT',keylock:false,keyShift:0,loop:false,reverse:false};
 const state={decks:[d],settings:{'Sync Mode':'Off'},fx:[[],[]],flip:{deck:-1},history:[],prepare:[]};
 engine.ctx={currentTime:1,sampleRate:48000,decodeAudioData:async()=>({duration:48,sampleRate:48000}),createGain:bus,createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},start(){},stop(){}})};
 engine.nodes=Array.from({length:4},()=>({deckInput:bus(),gain:bus(),high:bus(),filter:bus(),level:1,trim:1}));
 engine.resume=async()=>{};engine.applyChannelFX=async()=>{};engine.configureFX=()=>{};
 const cancel={cancelDeck(){}},scope={engine,state,createCueHolds,playbackIntents:{record(){}},autoplayRequests:new WeakMap(),playRequests:new WeakMap(),
  instantDouble:{cancelDeck(){},pending:()=>false},pitchPlay:{...cancel,latch:()=>false},slicer:cancel,stemSlipControls:cancel,loopPads:{...cancel,rolling:()=>false},
  smartSync:createSmartSync({engine,state}),syncMaster:{started(){}},quantized:(_,p)=>p,
  flipAutomation:{record(){}},api:{refreshCueControls(){}},persist(){},renderDecks(){},renderTracks(){},refreshTransportControls(){},notify:m=>assert.fail(m)};
 vm.runInNewContext(source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+part('async function play(','\nfunction deckQuantize(')+'\n'+part('const cueHolds = createCueHolds({','\napi.cueHolds =')+'\nglobalThis.holds=cueHolds;globalThis.pressPlay=play;',scope);
 t.after(()=>{read.resolve();engine.pause(d);});
 const playing=scope.pressPlay(d);await entered.promise;
 assert.equal(d.processing,true);assert.equal(d.playing,false);
 const cue=scope.holds.press('cue-key',d);await new Promise(r=>setImmediate(r));
 await scope.holds.release('cue-key');read.resolve();await Promise.all([playing,cue]);
 assert.equal(d.playing,false,'Released cue-set must not resume pending Play');assert.equal(d.processing,false);assert.equal(d.playQueued,false);assert.equal(engine.voices.size,0);assert.equal(d.cue,3);assert.equal(d.position,3);
 // Ordinary paused cue-setting remains distinct from an audition at its cue.
 await engine.seek(d,5);await scope.holds.press('cue-key',d);await scope.holds.release('cue-key');
 assert.equal(d.cue,5);assert.equal(d.position,5);assert.equal(d.playing,false);
 await scope.holds.press('cue-key',d);assert.equal(d.playing,true);
 await scope.holds.release('cue-key');assert.equal(d.playing,false);assert.equal(d.position,5);assert.equal(engine.voices.size,0);
});
