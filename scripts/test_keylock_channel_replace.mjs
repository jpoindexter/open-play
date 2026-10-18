// New RPC contracts only, with the actual unchanged WASM and serial render clock.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),path='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs';
const source=await readFile(new URL(path,root),'utf8'),parent=await readFile(new URL('prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs',root),'utf8');
assert.equal(source.split('\n')[9],parent.split('\n')[9]);
const registry=new Map();globalThis.sampleRate=44100;globalThis.currentTime=0;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.port={onmessage:null,postMessage:data=>this.events.push(data)};}};
globalThis.registerProcessor=(name,ctor)=>registry.set(name,ctor);
await import(new URL(path,root));
const processor=new(registry.get('signalsmith-stretch-open-play-replace'))({numberOfOutputs:1,outputChannelCount:[10]});
while(!processor.wasmReady)await new Promise(resolve=>setImmediate(resolve));
let id=0;const call=(method,...args)=>{const key=++id;processor.port.onmessage({data:[key,method,...args]});const event=processor.events.findLast(row=>row[0]===key);assert(event);return event;};
const checks=[];const check=(name,fn)=>{fn();checks.push({name,passed:true});};
const chunks=Array.from({length:3},(_,chunk)=>Array.from({length:10},(_,channel)=>Float32Array.from({length:22050},(_,i)=>channel<2?.12*Math.sin(2*Math.PI*(channel?550:330)*(chunk*22050+i)/44100):0)));
for(const chunk of chunks)assert.notEqual(call('addBuffers',chunk)[2],'error');
check('Invalid geometry/boundary cannot mutate any retained channel',()=>{
 const before=processor.audioBuffers.map(chunk=>chunk.slice());
 for(const args of [[1,2,[new Float32Array(22050)]],[0,9,[new Float32Array(22050),new Float32Array(22050)]],[0,2,[new Float32Array(22049)]],[-1,2,[]],[0,2,[[]]]])assert.equal(call('replaceBufferChannels',...args)[2],'error');
 before.forEach((chunk,i)=>chunk.forEach((channel,c)=>assert.equal(processor.audioBuffers[i][c],channel)));
});
check('Accepted replacement preserves original refs, DSP instance, geometry and schedule',()=>{
 globalThis.currentFrame=128;globalThis.currentTime=128/sampleRate;
 assert(processor.process([[]],[Array.from({length:10},()=>new Float32Array(128))],{}));
 const module=processor.wasmModule,timeline=JSON.stringify(processor.timeMap),first=processor.audioBuffers[0],replacement=Array.from({length:8},(_,c)=>new Float32Array(22050).fill((c+1)/100));
 const ack=call('replaceBufferChannels',0,2,replacement);assert.notEqual(ack[2],'error');assert.deepEqual(ack[1],{startFrame:0,endFrame:22050,firstChannel:2,channels:8,appliedFrame:128,appliedRenderQuanta:1});
 assert.equal(processor.audioBuffers[0][0],first[0]);assert.equal(processor.audioBuffers[0][1],first[1]);assert.equal(processor.wasmModule,module);assert.equal(processor.channels,10);assert.equal(JSON.stringify(processor.timeMap),timeline);
 replacement.forEach((channel,c)=>assert.equal(processor.audioBuffers[0][c+2],channel));
});
check('Dropped chunk timestamps stay absolute and disposed RPC stays terminal',()=>{
 assert.notEqual(call('dropBuffers',.5)[2],'error');assert.equal(processor.audioBuffersStart,22050);
 assert.equal(call('replaceBufferChannels',0,2,[new Float32Array(22050)])[2],'error');
 assert.notEqual(call('replaceBufferChannels',22050,2,[new Float32Array(22050)])[2],'error');
 call('dispose');assert.equal(call('replaceBufferChannels',22050,2,[new Float32Array(22050)])[1].name,'InvalidStateError');
});
console.log(JSON.stringify({passed:true,scope:'Actual WASM readiness and new RPC ownership/validation only; no browser, production engine or audio continuity acceptance.',sourceSHA256:createHash('sha256').update(source).digest('hex'),embeddedWASMUnchanged:true,checks},null,2));
