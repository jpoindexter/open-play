import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createTempoSlider} from './tempo-slider.js';

// Actual slider/engine/renderer validation with cached transforms and controlled
// graph endpoints. No PCM, worker, reversal quality or audible output proof.
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const bus=()=>({gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){}});
function fixture({reverse=false,loop=true,shift=24}={}){
 const engine=new AudioEngine(),starts=[],stops=[],retired=[],pcm=new Float32Array(1323000);
 const buffer={duration:30,sampleRate:44100,numberOfChannels:1,length:1323000,getChannelData:()=>pcm};
 const deck={index:0,track:{id:'fallback',bpm:120,grid:0,duration:30},position:3,anchorPosition:3,anchorTime:1,rate:1,
  playing:false,keylock:false,keyShift:shift,loop,loopIn:2,loopOut:6,reverse,pitchRange:8};
 const source=()=>({playbackRate:{value:1},connect(){},disconnect(){},start(when,offset){starts.push({when,offset,rate:this.playbackRate.value});},stop(){stops.push(this);}});
 engine.ctx={currentTime:1,sampleRate:44100,createGain:bus,createBufferSource:source};
 engine.nodes=Array.from({length:2},()=>({deckInput:bus(),input:bus(),gain:bus(),channelBpm:120}));
 engine.resume=async()=>{};engine.applyChannelFX=async()=>{};engine.buffer=async()=>buffer;
 engine.setCross=()=>{};engine.cancelDeckScratchRequest=()=>{};
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);engine.retireVoiceAt=(i,v)=>retired.push(v);engine.disposeVoice=()=>{};
 engine.reverseBuffer=(id,value)=>value; // Original-time ownership, not PCM reversal.
 engine.keylockRenderer.ids.set(buffer,1);engine.keylockRenderer.nextId=2;
 const cache=(rate,semitones=shift+(deck.keylock?0:12*Math.log2(rate)))=>{
  const window=deck.loop&&(rate!==1||deck.keyShift!==0)?`:${Math.max(0,Math.floor((Math.min(deck.position,deck.loopIn)-2)*buffer.sampleRate))}:${Math.min(buffer.length,Math.ceil((Math.max(deck.position,deck.loopOut)+2)*buffer.sampleRate))}`:'';
  engine.keylockRenderer.cache.set(`1:${rate}:${semitones}${window}`,{...buffer,duration:30/rate});
 };
 cache(1);return{engine,deck,starts,stops,retired,cache};
}

for(const reverse of [false,true])for(const sign of [-1,1])test(`${reverse?'reverse':'loop'} upper/lower pitch boundary rejects GUI tempo without losing playback (${sign})`,async()=>{
 const f=fixture({reverse,loop:!reverse,shift:sign*24}),{engine,deck}=f;
 await engine.start(deck);const voice=engine.voices.get(0),position=engine.position(deck),started=f.starts.length,stopped=f.stops.length;
 const slider=createTempoSlider({setRate:(d,rate)=>engine.setRate(d,rate)});
 await assert.rejects(slider.set(deck,sign*.1),/Pitch must be/);
 assert.equal(deck.rate,1);assert.equal(deck.playing,true);assert.equal(engine.position(deck),position);
 assert.equal(engine.voices.get(0),voice);assert.equal(f.starts.length,started);assert.equal(f.stops.length,stopped);assert.deepEqual(f.retired,[]);
 assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 engine.pause(deck);await engine.start(deck);assert.equal(deck.playing,true);assert.equal(deck.rate,1);
});

for(const reverse of [false,true])test(`allowed ${reverse?'reverse':'loop'} fallback rate prepares a future phase-continuous handoff`,async()=>{
 const f=fixture({reverse,loop:!reverse,shift:12}),{engine,deck}=f;await engine.start(deck);
 const old=engine.voices.get(0),clock=engine.voiceClock(deck,old),stopped=f.stops.length;f.cache(1.01);
 await engine.setRate(deck,1.01);const when=deck.anchorTime;
 assert.ok(when>engine.ctx.currentTime);assert.equal(deck.rate,1.01);assert.equal(deck.playing,true);assert.notEqual(engine.voices.get(0),old);
 assert.ok(Math.abs(deck.anchorPosition-clock(when))<1e-9,'Prepared fallback must start at the advancing original-source position');
 assert.ok(engine.voices.get(0).handoffBefore,'Fallback rate updates must retain prior audio until the future boundary');
 assert.equal(engine.voices.get(0).handoffBefore.owner,old);assert.equal(f.stops.length,stopped);assert.deepEqual(f.retired,[old]);
});

test('an older rejected fallback rate cannot roll back a newer replacement start',async()=>{
 const f=fixture({shift:12}),{engine,deck}=f;await engine.start(deck);const held=deferred(),original=engine.keylockRenderer.render.bind(engine.keylockRenderer);
 let waiting=false;engine.keylockRenderer.render=async(...args)=>{waiting=true;await held.promise;throw Error('controlled older renderer failure');};
 const pending=engine.setRate(deck,1.01),rejected=assert.rejects(pending,/older renderer failure/);
 for(let n=0;n<100&&!waiting;n++)await Promise.resolve();assert.equal(waiting,true);
 engine.pause(deck);Object.assign(deck,{track:{id:'replacement',bpm:100,grid:0,duration:30},position:7,keyShift:0,loop:false});
 engine.keylockRenderer.render=original;await engine.setRate(deck,.9);await engine.start(deck);
 const voice=engine.voices.get(0),token=engine.startTokens.get(0);held.resolve();await rejected;
 assert.equal(deck.track.id,'replacement');assert.equal(deck.rate,.9);assert.equal(deck.playing,true);
 assert.equal(engine.voices.get(0),voice);assert.equal(engine.startTokens.get(0),token);assert.equal(deck.processing,false);
});

test('invalid direct rates reject before delegation, ownership or source mutation',async()=>{
 for(const rate of [NaN,Infinity,-Infinity,0,-1,.249,4.001,5,'1']){
  const f=fixture({loop:false,shift:0}),{engine,deck}=f;await engine.start(deck);
  const voice=engine.voices.get(0),owner={},started=f.starts.length;engine.rateOwners.set(deck,owner);
  let delegated=false;engine.onRateRequest=()=>{delegated=true;};
  await assert.rejects(engine.setRate(deck,rate));
  assert.equal(delegated,false);assert.equal(deck.rate,1);assert.equal(engine.rateOwners.get(deck),owner);
  assert.equal(engine.voices.get(0),voice);assert.equal(f.starts.length,started);assert.equal(deck.playing,true);
 }
});

for(const prepared of [false,true])test(`invalid group rates reject before any ${prepared?'prepared':'raw'} member changes`,async()=>{
 const f=fixture({loop:prepared,shift:prepared?12:0}),{engine,deck}=f;await engine.start(deck);f.cache(1.1);
 const other={...deck,index:1,keyShift:0,loop:false,track:{id:'other',bpm:100,grid:0,duration:30}},source=engine.ctx.createBufferSource();
 engine.voices.set(1,{sources:[source]});const voice=engine.voices.get(0),owner={},otherOwner={};
 engine.rateOwners.set(deck,owner);engine.rateOwners.set(other,otherOwner);const started=f.starts.length;
 await assert.rejects(engine.setSyncedRates([{deck,rate:1.1},{deck:other,rate:5}]));
 assert.equal(deck.rate,1);assert.equal(other.rate,1);assert.equal(engine.voices.get(0),voice);assert.equal(engine.voices.get(1).sources[0],source);
 assert.equal(engine.rateOwners.get(deck),owner);assert.equal(engine.rateOwners.get(other),otherOwner);assert.equal(f.starts.length,started);
 assert.equal(deck.processing,false);assert.equal(other.processing,false);
});

for(const relative of [false,true])test(`${relative?'relative GUI tempo retains its consumed coordinate':'absolute GUI tempo restores its actual coordinate'} after the rate owner rejects`,async()=>{
 // Transport rollback is covered above; this actual GUI-model case isolates
 // an unsuccessful rate request that leaves its previous owner unchanged.
 const deck={track:{id:'stable-owner'},rate:relative?1.05:1,pitchRange:8,sync:relative,syncState:relative?'armed':'off'},targets=[];
 const slider=createTempoSlider({setRate:async(d,rate)=>{targets.push(rate);if(targets.length===1)throw Error('controlled rate rejection');d.rate=rate;}});
 await assert.rejects(slider.set(deck,.1),/controlled rate rejection/);
 const rejectedView=slider.view(deck);await slider.set(deck,1);
 assert.ok(Math.abs(targets[1]-(relative?1.059:1.01))<1e-12,'The next gesture must start from the retained actual tempo');
 assert.equal(rejectedView.position,relative?.1:0,'Absolute coordinates restore actual pitch; relative coordinates consume the attempted movement');
 assert.equal(rejectedView.relative,relative);assert.ok(Math.abs(slider.view(deck).position-1)<1e-9);
});

test('Stop and global silence revoke a held fallback-rate render without a queued restart',async()=>{
 for(const silence of [false,true]){
  const f=fixture({shift:12}),{engine,deck}=f,held=deferred();await engine.start(deck);f.cache(1.01);
  const original=engine.keylockRenderer.render.bind(engine.keylockRenderer);let waiting=false;
  engine.keylockRenderer.render=async(...args)=>{waiting=true;await held.promise;return original(...args);};
  const pending=engine.setRate(deck,1.01),rejected=assert.rejects(pending,{name:'AbortError'});
  for(let n=0;n<100&&!waiting;n++)await Promise.resolve();assert.equal(waiting,true);
  const started=f.starts.length;
  if(silence){for(const node of engine.nodes)Object.assign(node,{high:bus(),filter:bus()});engine.silence();}else engine.pause(deck);
  assert.equal(deck.playing,false);assert.equal(engine.voices.size,0);held.resolve();await rejected;
  assert.equal(deck.rate,1);assert.equal(deck.playing,false);assert.equal(deck.processing,false);
  assert.equal(engine.transforms.size,0);assert.equal(engine.voices.size,0);assert.equal(f.starts.length,started);assert.deepEqual(f.retired,[]);
 }
});
