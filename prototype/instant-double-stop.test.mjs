import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createInstantDouble} from './instant-double.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const bus=()=>({gain:{value:1,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}},connect(){},disconnect(){}});
// Real engine rate/start/pause and app Play; controlled graph, clock, load and FX gate.
function fixture(t){
 const engine=new AudioEngine(),entered=deferred(),fx=deferred(),voices=[];
 const track={id:'source',title:'Source',duration:100,bpm:120,grid:0,plays:0};
 const decks=Array.from({length:2},(_,index)=>({index,track,position:4,anchorPosition:4,anchorTime:1,rate:1,mode:'INT',keylock:false,keyShift:0,loop:false,reverse:false,playing:index===0}));
 const state={decks,history:[],prepare:[],settings:{}},d=decks[1];
 engine.ctx={currentTime:1,sampleRate:48000,createGain:bus,createBufferSource(){const voice={playbackRate:{value:1},connect(){},disconnect(){},start(){voice.started=true;},stop(){voice.stopped=true;}};voices.push(voice);return voice;}};
 engine.nodes=Array.from({length:4},()=>({deckInput:bus(),gain:bus(),high:bus(),filter:bus(),level:1,trim:1}));
 engine.resume=async()=>{};engine.buffer=async()=>({duration:100,sampleRate:48000});
 let calls=0;engine.applyChannelFX=async()=>{if(++calls===1){entered.resolve();await fx.promise;}};
 let scope;const instantDouble=createInstantDouble({state,engine,load:async()=>{scope.cancelPendingPlay(d);engine.pause(d);return true;}});
 scope={state,engine,instantDouble,playRequests:new WeakMap(),pitchPlay:{latch:()=>false},cueHolds:{latch:()=>false,cancelDeck(){}},slicer:{cancelDeck(){}},stemSlipControls:{cancelDeck(){}},smartSync:{start:async()=>false,paused(){},played(){},reconcile(){}},syncMaster:{started(){}},refreshTransportControls(){},persist(){},renderDecks(){},renderTracks(){},notify(){}};
 const play=source.slice(source.indexOf('async function play(d)'),source.indexOf('\nfunction deckQuantize('));
 vm.runInNewContext(source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+play+'\nglobalThis.pressPlay=play;',scope);
 t.after(()=>{fx.resolve();engine.pause(d);});return{engine,d,decks,entered,fx,instantDouble,scope,voices};
}
test('a stopped incoming deck never resumes when its older Instant Double preparation completes',async t=>{
 const f=fixture(t),{d,engine,instantDouble,scope}=f;
 const pending=instantDouble(1);await f.entered.promise;
 await scope.pressPlay(d);
 if(d.playing)await scope.pressPlay(d); // Baseline needs a second press to stop its competing Play.
 const stopToken=engine.startTokens.get(1);assert.equal(d.playing,false);
 f.fx.resolve();await pending;
 assert.equal(d.playing,false,'Older Instant Double resumed the explicitly stopped deck');
 assert.equal(d.processing,false);assert.equal(d.playQueued,false);assert.equal(engine.voices.has(1),false);assert.equal(engine.startTokens.get(1),stopToken);assert.equal(instantDouble.pending(d),false);
 assert.equal(await instantDouble(1),true,'A fresh normal Double still completes after cancellation');assert.equal(d.playing,true);assert.equal(instantDouble.pending(d),false);engine.pause(d);
 f.decks[0].playing=false;assert.equal(await instantDouble(1),true,'Paused source Double remains paused');assert.equal(d.playing,false);assert.equal(engine.voices.has(1),false);
});
