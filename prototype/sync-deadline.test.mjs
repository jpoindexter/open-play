import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
function fixture(stall=0){
 const engine=new AudioEngine(),old={sources:[]},starts=[],retired=[],disposed=[];
 const deck={index:0,track:{id:'a',duration:20,bpm:120},position:3,rate:1,anchorPosition:3,anchorTime:1,playing:true};
 engine.ctx={currentTime:1,createGain:()=>({gain:{value:1},connect(){}}),createBufferSource(){engine.ctx.currentTime+=stall;return {playbackRate:{value:1},start(when,offset){starts.push({when,offset});},connect(){},disconnect(){},stop(){}};}};
 engine.nodes[0]={};engine.resume=async()=>{};engine.applyChannelFX=async()=>{};engine.buffer=async()=>({duration:20,sampleRate:44100});
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.setCross=()=>{};engine.voices.set(0,old);
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);engine.retireVoiceAt=(i,v)=>retired.push(v);engine.disposeVoice=(i,v)=>disposed.push(v);
 return {engine,deck,old,starts,retired,disposed};
}
test('late ordinary Sync rejects before starting or retiring either audible source',async()=>{
 const f=fixture(.08),{engine,deck,old}=f;
 await assert.rejects(engine.synchronize(deck,{rate:1.05,priorClock:t=>3+t-1,positionAt:()=>4}),/missed its lead/);
 assert.equal(engine.voices.get(0),old);assert.equal(deck.rate,1);assert.equal(deck.playing,true);assert.equal(deck.processing,false);
 assert.deepEqual(f.starts,[]);assert.deepEqual(f.retired,[]);assert.equal(f.disposed.length,1);
});
test('on-time ordinary Sync still starts and crossfades at its aligned future time',async()=>{
 const f=fixture(),{engine,deck,old}=f;
 const result=await engine.synchronize(deck,{rate:1.05,priorClock:t=>3+t-1,positionAt:()=>4});
 assert.equal(result.when,1.03);assert.equal(result.position,4);assert.equal(result.rate,1.05);
 assert.deepEqual(f.starts,[{when:1.03,offset:4}]);assert.deepEqual(f.retired,[old]);assert.notEqual(engine.voices.get(0),old);
});
test('a delayed arming continuation retains old audio and discards the unconnected replacement',async()=>{
 const f=fixture(),{engine,deck,old}=f;
 const handoff={watch(){},async prepared(){return 1.1;},async arm(){engine.ctx.currentTime=1.2;},fail(){}};
 await assert.rejects(engine.start(deck,{handoff,positionAt:()=>4,priorClock:()=>3}),/missed its lead/);
 assert.equal(engine.voices.get(0),old);assert.equal(deck.playing,true);assert.deepEqual(f.retired,[]);assert.equal(f.disposed.length,1);
});
test('a late armed launch also rejects without starting the paused follower',async()=>{
 const f=fixture(.08),{engine,deck}=f;engine.voices.delete(0);deck.playing=false;
 await assert.rejects(engine.synchronize(deck,{rate:1.05,priorClock:()=>3,positionAt:()=>4}),/missed its lead/);
 assert.equal(deck.playing,false);assert.equal(deck.rate,1);assert.equal(deck.position,3,'Rejected launch must keep the paused cue position');assert.deepEqual(f.starts,[]);assert.equal(engine.voices.has(0),false);
});
test('rollback cannot overwrite a newer paused Cue position',async()=>{
 const {engine,deck}=fixture();engine.voices.delete(0);deck.playing=false;const create=engine.ctx.createBufferSource;
 engine.ctx.createBufferSource=()=>{const source=create();deck.position=9;engine.startTokens.set(0,engine.startTokens.get(0)+1);return source;};
 await assert.rejects(engine.synchronize(deck,{rate:1.05,priorClock:()=>3,positionAt:()=>4}),{name:'AbortError'});
 assert.equal(deck.position,9);assert.equal(deck.playing,false);
});
