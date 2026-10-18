// Isolate inactive-channel population in actual WASM; serial clock/ports only.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {copyPCMChunk} from '../prototype/pcm-resample.js';
const root=new URL('../',import.meta.url),out=new URL('local-evidence/inactive-stem-bank-152/',root);
mkdirSync(out,{recursive:true});const sha=b=>createHash('sha256').update(b).digest('hex');
const sr=44100,quantum=128,q=2**(3/12),frames=Math.ceil(6*sr/quantum)*quantum,inputFrames=10*sr,registry=new Map();
globalThis.sampleRate=sr;globalThis.currentTime=0;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.port={onmessage:null,postMessage:data=>this.events.push(data)};}};
globalThis.registerProcessor=(name,ctor)=>registry.set(name,ctor);
const path='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs';await import(new URL(path,root));
const original=[330,550].map(hz=>Float32Array.from({length:16*sr},(_,i)=>.06*Math.sin(2*Math.PI*hz*i/sr)));
const pitched=await copyPCMChunk(original,sr,sr/q,0,inputFrames);
const configs=['unchanged-inactive-bank','populated-inactive-bank'].map(name=>({name,processor:new(registry.get('signalsmith-stretch-open-play-replace'))({numberOfOutputs:1,outputChannelCount:[18]}),output:[Array.from({length:18},()=>new Float32Array(quantum))],samples:[0,4,12].map(()=>new Float32Array(frames))}));let sequence=0;
function call(p,method,...args){const id=++sequence;p.port.onmessage({data:[id,method,...args]});const event=p.events.findLast(row=>row[0]===id);assert(event);if(event[2]==='error')throw Object.assign(Error(event[1].message),{name:event[1].name});return event[1];}
for(const c of configs){while(!c.processor.wasmReady)await new Promise(resolve=>setImmediate(resolve));const channels=Array.from({length:18},()=>new Float32Array(inputFrames));channels[0]=pitched[0];channels[1]=pitched[1];channels[4]=pitched[0];channels[5]=pitched[1];call(c.processor,'addBuffers',channels);call(c.processor,'schedule',{active:true,input:1/q,output:.25,rate:1.1/q,semitones:0});c.latency=call(c.processor,'latency');}
const at=Math.ceil(3*sr/quantum)*quantum;
const replacement=Array.from({length:8},()=>new Float32Array(inputFrames));replacement[2]=pitched[0];replacement[3]=pitched[1];
for(let frame=0;frame<frames;frame+=quantum){globalThis.currentFrame=frame;globalThis.currentTime=frame/sr;for(const c of configs){if(frame===at&&c.name==='populated-inactive-bank')c.replacement=call(c.processor,'replaceBufferChannels',0,10,replacement);assert(c.processor.process([[]],c.output,{}));[0,4,12].forEach((channel,i)=>c.samples[i].set(c.output[0][channel],frame));}}
const results=[];for(const c of configs){const pcm=[];for(const [i,channel]of[0,4,12].entries()){const name=c.name+'-channel'+channel+'.f32',bytes=Buffer.from(c.samples[i].buffer);writeFileSync(new URL(name,out),bytes,{flag:'wx'});pcm.push({channel,file:name,frames,sha256:sha(bytes)});}results.push({name:c.name,latency:c.latency,replacement:c.replacement||null,pcm});call(c.processor,'dispose');}
const receipt={checkpoint:152,scope:'Actual WASM and actual SRC, two18-channel processors/serial128-frame clock. Original and bank0 Melody are equal; bank1 silent in control and populated at3seconds in treatment. Original/active input references, schedule and geometry unchanged. No production change/app/browser/device/reference acceptance.',sampleRate:sr,quantum,frames,pitchFactor:q,rate:1.1,keyShift:3,changedAtFrame:at,changedAtSeconds:at/sr,sourceHashes:{[path]:sha(readFileSync(new URL(path,root))),'prototype/pcm-resample.js':sha(readFileSync(new URL('prototype/pcm-resample.js',root))),'experiments/inactive_stem_bank_152.mjs':sha(readFileSync(new URL(import.meta.url)))},results,fullParityAcceptance:false};writeFileSync(new URL('original.json',out),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({changedAt:receipt.changedAtSeconds,frames,results:results.map(r=>({name:r.name,latency:r.latency}))},null,2));
