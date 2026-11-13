import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
const bus=()=>({gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){}});
test('long-song pitch loops prepare only their source window and retain source-time loop transitions',async()=>{
 const old={Worker:globalThis.Worker,AudioBuffer:globalThis.AudioBuffer},jobs=[],starts=[];
 class Buffer {
  constructor({numberOfChannels,length,sampleRate}){Object.assign(this,{numberOfChannels,length,sampleRate,duration:length/sampleRate});this.channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));}
  getChannelData(c){return this.channels[c];}copyToChannel(data,c){this.channels[c].set(data);}
 }
 globalThis.AudioBuffer=Buffer;
 globalThis.Worker=class{postMessage(data){jobs.push(data);queueMicrotask(()=>this.onmessage({data:{channels:data.channels}}));}terminate(){}};
 try{
  const engine=new AudioEngine(),buffer=new Buffer({numberOfChannels:2,length:21504279,sampleRate:48000});
  const d={index:0,track:{id:'long-loop',duration:buffer.duration,bpm:123,grid:.356},position:0,anchorPosition:0,anchorTime:1,rate:1,keylock:true,keyShift:-12,loop:true,loopIn:0,loopOut:1.951219512195122,playing:false};
  engine.ctx={currentTime:1,sampleRate:48000,createGain:bus,createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},stop(){},start(when,offset){starts.push({when,offset,source:this});}})};
  engine.nodes=[{deckInput:bus(),input:bus(),gain:bus(),channelBpm:123}];engine.resume=async()=>{};engine.applyChannelFX=async()=>{};engine.buffer=async()=>buffer;engine.setCross=()=>{};
  engine.routeOrdinaryVoice=(_d,v)=>engine.voices.set(0,v);engine.retireVoiceAt=()=>{};
  await engine.start(d);
  assert.equal(d.playing,true);assert.equal(jobs.length,1);assert.ok(jobs[0].channels[0].length<=189659);assert.equal(buffer.length,21504279);
  assert.equal(starts[0].offset,0);assert.ok(Math.abs(starts[0].source.loopEnd-d.loopOut)<1e-12);
  const retained=engine.voices.get(0),startCount=starts.length;
  await assert.rejects(engine.start(d,{positionAt:()=>100}),/render window/);
  assert.equal(engine.voices.get(0),retained);assert.equal(starts.length,startCount);assert.equal(d.position,0);
  // Changing the active interval must replace a window that cannot contain it.
  await engine.setLoop(d,true,20,22);
  assert.equal(d.loopIn,20);assert.equal(d.loopOut,22);assert.ok(jobs.at(-1).channels[0].length<=24*48000);assert.equal(engine.voices.get(0).renderWindow.end,24);
  // A cue before Loop In remains in the window; reverse offsets use its end.
  engine.pause(d);Object.assign(d,{loopIn:20,loopOut:22,position:19.5,reverse:true});
  engine.reverseBuffer=(_id,b)=>b;await engine.start(d);
  assert.ok(Math.abs(starts.at(-1).offset-4.5)<1e-9);assert.equal(starts.at(-1).source.loopStart,2);assert.equal(starts.at(-1).source.loopEnd,4);
  d.reverse=false;let continuous=false;engine.startForwardKeylock=async()=>{continuous=true;};
  await engine.setLoop(d,false,20,22);assert.equal(continuous,true,'Loop off must return to the continuous transport');
 }finally{Object.assign(globalThis,old);}
});
