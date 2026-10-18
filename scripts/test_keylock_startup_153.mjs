// Actual pre/post-instrumentation WASM over one controlled render clock.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),registry=new Map(),sha=b=>createHash('sha256').update(b).digest('hex');
globalThis.sampleRate=44100;globalThis.currentTime=0;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.port={onmessage:null,postMessage:data=>this.events.push(data)};}};
globalThis.registerProcessor=(name,ctor)=>registry.set(name,ctor);
const oldPath='local-evidence/stem-startup-153/before-wrapper.mjs',newPath='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs';
await import(new URL(oldPath,root));const Old=registry.get('signalsmith-stretch-open-play-replace');await import(new URL(newPath,root));const New=registry.get('signalsmith-stretch-open-play-replace');
const variants=[Old,New].map(C=>new C({numberOfOutputs:1,outputChannelCount:[18]}));const output=variants.map(()=>[Array.from({length:18},()=>new Float32Array(128))]);
variants.forEach((p,i)=>p.process([[]],output[i],{}));
for(const p of variants)while(!p.wasmReady)await new Promise(resolve=>setImmediate(resolve));let id=0;
const call=(p,method,...args)=>{const key=++id;p.port.onmessage({data:[key,method,...args]});const row=p.events.findLast(e=>e[0]===key);assert(row&&row[2]!=='error');return row[1];};
const initial=call(variants[1],'resourceSnapshot');assert.equal(initial.startup.createdFrame,0);assert.equal(initial.startup.wasmReadyFrame,0);assert.equal(initial.startup.notReadyQuanta,1);assert.equal(initial.startup.renderQuanta,0);assert.equal(initial.startup.firstActiveFrame,null);
const input=Array.from({length:18},(_,c)=>Float32Array.from({length:2*44100},(_,i)=>c<2||c===4||c===5?.06*Math.sin(2*Math.PI*(c%2?550:330)*i/44100):0));
for(const p of variants){call(p,'addBuffers',input);call(p,'schedule',{active:true,input:0,output:.2,rate:1.1,semitones:0});}
const frames=44160,samples=variants.map(()=>new Float32Array(frames));
for(let frame=0;frame<frames;frame+=128){globalThis.currentFrame=frame;globalThis.currentTime=frame/44100;variants.forEach((p,i)=>{assert(p.process([[]],output[i],{}));samples[i].set(output[i][0][0],frame);});}
assert.deepEqual(samples[0],samples[1]);const after=call(variants[1],'resourceSnapshot');assert.equal(after.startup.renderQuanta,frames/128);assert.equal(after.startup.inactiveQuantaBeforeFirstActive,after.startup.firstActiveFrame/128);assert(after.startup.firstActiveFrame>0&&after.startup.firstActiveFrame<.2*44100);
assert.deepEqual(after.startup.firstActiveCommand,{input:0,output:.2,rate:1.1,semitones:0});assert(after.startup.inputLatencySeconds>0&&after.startup.outputLatencySeconds>0&&after.startup.seekHistoryFrames>0);
variants.forEach(p=>call(p,'dispose'));
const result={checkpoint:153,scope:'Actual WASM and prior/current wrapper under a controlled serial128-frame clock; startup counters and sample identity only. Not browser/whole playback/latency/hardware acceptance.',passed:true,oldWrapperSHA256:sha(readFileSync(new URL(oldPath,root))),newWrapperSHA256:sha(readFileSync(new URL(newPath,root))),scriptSHA256:sha(readFileSync(new URL(import.meta.url))),initial,after,frames,oldOutputSHA256:sha(Buffer.from(samples[0].buffer)),newOutputSHA256:sha(Buffer.from(samples[1].buffer)),sampleIdentity:true,fullParityAcceptance:false};writeFileSync(new URL('../docs/prototype/keylock-startup-153-contract-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:true,frames,startup:after.startup,sampleIdentity:true},null,2));
