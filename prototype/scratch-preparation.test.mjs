import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeckScratchTransport} from './deck-scratch.js';

function fixture(scheduler){
 const previous={node:Object.getOwnPropertyDescriptor(globalThis,'AudioWorkletNode'),scheduler:Object.getOwnPropertyDescriptor(globalThis,'scheduler')},messages=[];
 class Node{constructor(){this.port={close(){},postMessage:message=>{messages.push(message);if(message.type==='buffers')queueMicrotask(()=>this.port.onmessage({data:{id:message.id,state:{generation:message.generation,sourceCount:1}}}));}};}disconnect(){}}
 Object.defineProperty(globalThis,'AudioWorkletNode',{value:Node,configurable:true});Object.defineProperty(globalThis,'scheduler',{value:scheduler,configurable:true});
 const transport=createDeckScratchTransport({currentTime:0},{chunkFrames:1024});
 return{transport,messages,close(){transport.dispose();for(const[key,descriptor]of[['AudioWorkletNode',previous.node],['scheduler',previous.scheduler]])if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
}
test('scratch copy uses native task yield when available and retains the timer fallback and exact PCM',async()=>{
 for(const native of [true,false]){
  let yields=0;const scheduler=native?{yield(){assert.equal(this,scheduler);yields++;return Promise.resolve();}}:undefined,f=fixture(scheduler);
  try{
   const samples=Float32Array.from({length:2049},(_,n)=>Math.sin(n)/4);await f.transport.replaceBuffers({generation:1,original:{sampleRate:48000,channels:[samples]}});
   assert.equal(yields,native?2:0);const posted=f.messages.find(x=>x.type==='buffers').original.channels[0];assert.deepEqual(posted,samples);assert.notEqual(posted,samples);assert.equal(samples.byteLength,2049*4);assert.equal(f.transport.state().sourceCount,1);
  }finally{f.close();}
 }
});
test('native-yield scratch copy keeps cancellation and nonfinite validation before posting PCM',async()=>{
 const f=fixture({yield:()=>new Promise(()=>{})});
 try{
  const owner=new AbortController(),samples=new Float32Array(2049),pending=f.transport.replaceBuffers({generation:1,original:{sampleRate:48000,channels:[samples]},signal:owner.signal});owner.abort();await assert.rejects(pending,{name:'AbortError'});
  samples[0]=Infinity;await assert.rejects(f.transport.replaceBuffers({generation:2,original:{sampleRate:48000,channels:[samples]}}),/nonfinite/);assert(!f.messages.some(x=>x.type==='buffers'));
 }finally{f.close();}
});
