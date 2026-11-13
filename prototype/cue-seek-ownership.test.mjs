import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createCueHolds} from './holds.js';
const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const bus=()=>({gain:{value:1,setTargetAtTime(v){this.value=v;}},connect(){},disconnect(){}});
// Actual Cue, engine and installed overview handler; controlled file-read/decode/graph/clock.
test('released cold Cue cannot move a newer paused overview seek',async t=>{
 const read=deferred(),entered=deferred(),engine=new AudioEngine();
 const track={id:'owned',title:'Owned',bpm:120,duration:48,cues:[],plays:0,analyzed:true,file:{async arrayBuffer(){entered.resolve();await read.promise;return new ArrayBuffer(1);}}};
 const d={index:0,track,position:2,cue:2,rate:1,playing:false,repeat:false,mode:'INT',keylock:false,keyShift:0,loop:false,reverse:false};
 const state={decks:[d],settings:{'Disable Needle Search During Playback':false}};
 engine.ctx={currentTime:1,sampleRate:48000,decodeAudioData:async()=>({duration:48,sampleRate:48000}),createGain:bus,createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},start(){},stop(){}})};
 engine.nodes=Array.from({length:4},()=>({deckInput:bus(),gain:bus(),high:bus(),filter:bus(),level:1,trim:1}));
 engine.resume=async()=>{};engine.applyChannelFX=async()=>{};
 const holds=createCueHolds({engine,state,quantized:(_,p)=>p,record(){},persist(){},render(){},notify:m=>assert.fail(m)});
 const scope={engine,state,slicer:{cancelDeck(){}},notify:m=>assert.fail(m)};
 const start=app.indexOf('async function seekOverview('),end=app.indexOf('\ndocument.addEventListener("click",',start);
 vm.runInNewContext(app.slice(start,end)+'\nglobalThis.seek=seekOverview;',scope);
 t.after(()=>{read.resolve();engine.pause(d);});
 const cue=holds.press('i',d);await entered.promise;
 assert.equal(d.processing,true);await holds.release('i');assert.equal(d.playing,false);
 assert.equal(await scope.seek(d,20,{}),true);const token=engine.startTokens.get(0);
 assert.equal(d.position,20);assert.equal(d.processing,false);
 read.resolve();await cue;
 assert.equal(d.position,20,'Older released Cue moved the newer overview seek');
 assert.equal(engine.startTokens.get(0),token,'Older released Cue paused a newer transport owner');
 assert.equal(d.playing,false);assert.equal(engine.voices.size,0);assert.equal(holds.latch(d),false);
 // A new Cue can still set and audition the new position after cancellation.
 await holds.press('i',d);await holds.release('i');assert.equal(d.cue,20);assert.equal(d.playing,false);
 await holds.press('i',d);assert.equal(d.playing,true);await holds.release('i');assert.equal(d.playing,false);assert.equal(d.position,20);
});
