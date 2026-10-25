import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';

// Actual raw start/pause/silence and ownership; controlled graph, clock and FX.
// Buffer calls are observed, not real decoding, PCM or native/audio acceptance.
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const bus=()=>({gain:{value:1,setTargetAtTime(value){this.value=value;}},connect(){},disconnect(){}});
function fixture(t){
 const engine=new AudioEngine(),entered=deferred(),fx=deferred(),decoded=[],sources=[];
 const deck={index:0,track:{id:'original',bpm:120,grid:0,duration:100},position:10,rate:1,
  anchorPosition:10,anchorTime:1,playing:false,keylock:false,keyShift:0,reverse:false,loop:false};
 engine.ctx={currentTime:1,sampleRate:48000,createGain:bus,createBufferSource(){
  const source={playbackRate:{value:1},connect(){},disconnect(){},
   start(){source.started=true;},stop(){source.stopped=true;}};
  sources.push(source);return source;
 }};
 engine.nodes=Array.from({length:4},()=>({deckInput:bus(),gain:bus(),high:bus(),filter:bus(),level:1,trim:1}));
 engine.resume=async()=>{};let fxCalls=0;
 engine.applyChannelFX=async()=>{if(++fxCalls===1){entered.resolve();await fx.promise;}};
 engine.buffer=async track=>{decoded.push(track.id);return{duration:track.duration,sampleRate:48000};};
 t.after(()=>engine.pause(deck));
 return{engine,deck,entered,fx,decoded,sources};
}

for(const replacement of [true,false])test(`revoked FX preparation skips decoding after ${replacement?'track replacement':'a newer same-track start'}`,async t=>{
 const f=fixture(t),{engine,deck,entered,fx,decoded,sources}=f;
 const old=engine.start(deck);await entered.promise;assert.deepEqual(decoded,[]);
 if(replacement){
  engine.pause(deck);deck.track={id:'replacement',bpm:90,grid:0,duration:100};
 }
 deck.rate=.9;await engine.start(deck);
 const voice=engine.voices.get(0),token=engine.startTokens.get(0),position=deck.position;
 assert.equal(voice,sources[0]);assert.equal(voice.started,true);
 fx.resolve();await old;
 assert.equal(engine.voices.get(0),voice,'Stale preparation must retain the current voice');
 assert.equal(engine.startTokens.get(0),token);assert.equal(deck.position,position);
 assert.equal(deck.rate,.9);assert.equal(deck.playing,true);assert.equal(deck.processing,false);
 assert.equal(engine.transforms.size,0);assert.equal(sources.length,1);
 assert.deepEqual(decoded,[replacement?'replacement':'original'],'Revoked preparation must not request an obsolete decode');
});

test('explicit silence during FX preparation prevents decoding or a queued restart',async t=>{
 const {engine,deck,entered,fx,decoded,sources}=fixture(t);
 const pending=engine.start(deck);await entered.promise;engine.silence();
 const token=engine.startTokens.get(0),position=deck.position;
 fx.resolve();await pending;
 assert.equal(deck.playing,false);assert.equal(deck.processing,false);
 assert.equal(deck.position,position);assert.equal(engine.startTokens.get(0),token);
 assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);
 assert.deepEqual(sources,[]);assert.deepEqual(decoded,[],'Explicit stop must revoke the pending decode');
});

test('current FX preparation decodes once and starts the ordinary voice',async t=>{
 const {engine,deck,entered,fx,decoded,sources}=fixture(t);
 const pending=engine.start(deck);await entered.promise;
 assert.equal(deck.processing,true);assert.deepEqual(decoded,[]);assert.deepEqual(sources,[]);
 fx.resolve();await pending;
 assert.deepEqual(decoded,['original']);assert.equal(sources.length,1);
 assert.equal(engine.voices.get(0),sources[0]);assert.equal(sources[0].started,true);
 assert.equal(deck.playing,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
});

test('FX preparation failure propagates without decoding or starting audio',async t=>{
 const {engine,deck,entered,fx,decoded,sources}=fixture(t),failure=Error('controlled FX failure');
 const pending=engine.start(deck),rejected=assert.rejects(pending,error=>error===failure);
 await entered.promise;fx.reject(failure);await rejected;
 assert.deepEqual(decoded,[]);assert.deepEqual(sources,[]);assert.equal(engine.voices.size,0);
 assert.equal(deck.playing,false);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
});
