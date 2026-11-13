import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
// Real start() with controlled graph/render endpoints; no PCM quality proof.
function fixture({reverse=true,keylock=false,position=0}={}){
 const engine=new AudioEngine(),starts=[],buffer={duration:30,sampleRate:48000,numberOfChannels:1,length:1440000};
 const gain=()=>({gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}});
 const deck={index:0,track:{id:'restart',duration:30,bpm:120},position,rate:1,reverse,keylock,keyShift:0,loop:false,loopIn:0,loopOut:0,playing:false};
 engine.ctx={currentTime:1,createGain:gain,createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},stop(){},start(when,offset){starts.push({when,offset});}})};
 engine.nodes[0]={deckInput:gain(),input:gain()};engine.resume=async()=>{};engine.applyChannelFX=async()=>{};engine.buffer=async()=>buffer;
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.setCross=()=>{};engine.reverseBuffer=(_id,b)=>b;engine.keylockRenderer.render=async b=>b;
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);engine.retireVoiceAt=()=>{};
 return{engine,deck,starts};
}
for(const keylock of [false,true])test(`stopped reverse Play at zero restarts from track end (${keylock?'rendered keylock':'raw'})`,async()=>{
 const {engine,deck,starts}=fixture({keylock});await engine.start(deck);
 assert.equal(deck.anchorPosition,30);assert.equal(starts.at(-1).offset,0);assert.equal(deck.playing,true);
});
test('middle reverse, ordinary forward end and explicit phase handoff keep their existing positions',async()=>{
 const middle=fixture({position:4});await middle.engine.start(middle.deck);assert.equal(middle.deck.anchorPosition,4);assert.equal(middle.starts[0].offset,26);
 const forward=fixture({reverse:false,position:30});await forward.engine.start(forward.deck);assert.equal(forward.deck.anchorPosition,0);assert.equal(forward.starts[0].offset,0);
 const aligned=fixture();aligned.deck.playing=true;aligned.engine.voices.set(0,{sources:[]});await aligned.engine.start(aligned.deck,{positionAt:()=>0,priorClock:()=>0});assert.equal(aligned.deck.anchorPosition,0);
});
