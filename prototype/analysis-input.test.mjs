import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBuffer,analyzePCM} from './analysis.js';

const chunkFrames=1024*1024/Float32Array.BYTES_PER_ELEMENT;
function audio(frames=chunkFrames*2+17){
 let channels=Array.from({length:2},(_,channel)=>Float32Array.from({length:frames},(_,i)=>(i%257-128)/256*(channel?-.5:1))),reads=0,copies=0;
 const expected=channels.map(data=>data.slice());
 const buffer={numberOfChannels:2,length:frames,sampleRate:44100,getChannelData(channel){reads++;return channels[channel];},copyFromChannel(destination,channel,offset){assert(destination.byteLength<=1024*1024,'Copy exceeds1MiB task bound');copies++;destination.set(channels[channel].subarray(offset,offset+destination.length));}};
 return{buffer,expected,channels:()=>channels,counts:()=>({reads,copies}),acquire(){channels=channels.map(data=>new Float32Array(structuredClone(data.buffer,{transfer:[data.buffer]})));}};
}
async function withWorker(run,mode='success'){
 const old=globalThis.Worker,created=[],result={bpm:123,key:'Am',grid:null};
 class Worker{
  constructor(url,options){this.url=url;this.options=options;this.terminated=0;created.push(this);}
  terminate(){this.terminated++;}
  postMessage(message,transfer){
   this.message=structuredClone(message,{transfer});this.transfer=transfer;
   if(mode==='throw')throw Error('post failed');
   if(mode==='pending')return;
   queueMicrotask(()=>mode==='error'?this.onerror({message:'worker failed'}):this.onmessage({data:{type:'result',result}}));
  }
 }
 globalThis.Worker=Worker;
 try{await run({created,result});}finally{if(old===undefined)delete globalThis.Worker;else globalThis.Worker=old;}
}
test('analysis staging yields before Worker creation, preserves exact PCM/options and leaves originals attached',()=>withWorker(async({created,result})=>{
 const a=audio(),options={minBpm:80,maxBpm:180,maxSeconds:180,analyzeTempo:false,analyzeKey:true};let heartbeat=false,workersAtHeartbeat=-1;
 const timer=setTimeout(()=>{heartbeat=true;workersAtHeartbeat=created.length;},0);
 try{
  assert.equal(await analyzeBuffer(a.buffer,options),result);
  assert(heartbeat,'A scheduled control task must run before input staging finishes');assert.equal(workersAtHeartbeat,0);assert.equal(created.length,1);
  const worker=created[0];assert.equal(worker.terminated,1);assert.equal(worker.message.sampleRate,44100);assert.deepEqual(worker.message.options,options);
  assert.equal(worker.transfer.length,2);assert(worker.transfer.every(buffer=>buffer.byteLength===0),'Only staging buffers transfer');
  worker.message.channels.forEach((data,i)=>assert.deepEqual(data,a.expected[i]));
  a.channels().forEach((data,i)=>{assert.equal(data.byteLength,a.expected[i].byteLength);assert.deepEqual(data,a.expected[i]);});
 }finally{clearTimeout(timer);}
}));
test('abort before staging touches no PCM and constructs no Worker',()=>withWorker(async({created})=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(analyzeBuffer({get numberOfChannels(){assert.fail('PCM accessed');}},{signal:controller.signal}),{name:'AbortError'});assert.equal(created.length,0);
}));
test('abort during staging constructs no Worker or post and leaves source channels intact',()=>withWorker(async({created})=>{
 const a=audio(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),0);
 try{await assert.rejects(analyzeBuffer(a.buffer,{signal:controller.signal}),{name:'AbortError'});assert.equal(created.length,0);a.channels().forEach((data,i)=>assert.deepEqual(data,a.expected[i]));}
 finally{clearTimeout(timer);}
}));
test('staging survives playback acquiring and replacing channel views between chunks',()=>withWorker(async({created})=>{
 const a=audio(),timer=setTimeout(()=>a.acquire(),0);
 try{await analyzeBuffer(a.buffer);created[0].message.channels.forEach((data,i)=>assert.deepEqual(data,a.expected[i]));assert.equal(a.counts().reads,0);assert(a.counts().copies>=6);}
 finally{clearTimeout(timer);}
}));
test('worker abort, error and failed post terminate the owned Worker',async()=>{
 await withWorker(async({created})=>{const controller=new AbortController(),pending=analyzeBuffer(audio(8).buffer,{signal:controller.signal});while(!created.length)await new Promise(resolve=>setTimeout(resolve,0));controller.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(created[0].terminated,1);},'pending');
 for(const mode of ['error','throw'])await withWorker(async({created})=>{await assert.rejects(analyzeBuffer(audio(8).buffer),new RegExp(mode==='error'?'worker failed':'post failed'));assert.equal(created[0].terminated,1);},mode);
});
test('worker-absent fallback retains its PCM/options behavior',async()=>{
 const old=globalThis.Worker;delete globalThis.Worker;
 try{const a=audio(512),options={analyzeTempo:false,analyzeKey:false};assert.deepEqual(await analyzeBuffer(a.buffer,options),analyzePCM(a.expected,44100,options));assert.equal(a.counts().copies,0);}
 finally{if(old!==undefined)globalThis.Worker=old;}
});
