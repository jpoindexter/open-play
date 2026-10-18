// Actual sample preservation for the two unchanged production geometries.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),registry=new Map(),sha=b=>createHash('sha256').update(b).digest('hex');
const before='local-evidence/reference-policy-155/production-before/SignalsmithStretch-open-play-replace.mjs';
const after='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs';
globalThis.sampleRate=44100;globalThis.currentFrame=0;globalThis.currentTime=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.port={onmessage:null,postMessage:data=>this.events.push(data)};}};
globalThis.registerProcessor=(name,ctor)=>registry.set(name,ctor);
await import(new URL(before,root));const Old=registry.get('signalsmith-stretch-open-play-replace');
await import(new URL(after,root));const New=registry.get('signalsmith-stretch-open-play-replace');
let sequence=0;
function call(p,method,...args){const id=++sequence;p.port.onmessage({data:[id,method,...args]});const e=p.events.findLast(e=>e[0]===id);assert(e&&e[2]!=='error',JSON.stringify(e));return e[1];}
const cases=[],frames=44160;
for(const channels of [2,10]){
 globalThis.currentFrame=0;globalThis.currentTime=0;
 const processors=[Old,New].map(C=>new C({numberOfOutputs:1,outputChannelCount:[channels]}));
 for(const p of processors)while(!p.wasmReady)await new Promise(resolve=>setImmediate(resolve));
 const input=Array.from({length:channels},(_,c)=>Float32Array.from({length:2*sampleRate},(_,i)=>.03*Math.sin(2*Math.PI*(330+55*c)*i/sampleRate)));
 const outputs=processors.map(()=>[Array.from({length:channels},()=>new Float32Array(128))]);
 const samples=processors.map(()=>Array.from({length:channels},()=>new Float32Array(frames)));
 for(const p of processors){call(p,'addBuffers',input);call(p,'schedule',{active:true,input:0,output:.2,rate:1.1,semitones:2});}
 for(let frame=0;frame<frames;frame+=128){globalThis.currentFrame=frame;globalThis.currentTime=frame/sampleRate;
  processors.forEach((p,i)=>{assert(p.process([[]],outputs[i],{}));for(let c=0;c<channels;c++)samples[i][c].set(outputs[i][0][c],frame);});
 }
 const results=[];
 for(let c=0;c<channels;c++){assert.deepEqual(samples[0][c],samples[1][c]);assert(samples[1][c].some(v=>Math.abs(v)>.005));results.push({channel:c,frames,oldSHA256:sha(Buffer.from(samples[0][c].buffer)),newSHA256:sha(Buffer.from(samples[1][c].buffer)),bitIdentical:true});}
 cases.push({channels,frames,results});processors.forEach(p=>call(p,'dispose'));
}
const result={checkpoint:155,scope:'Actual published WASM before/after integration;2and10channel geometries, full44160frames/channel. Deterministic serial clock, rate1.1/semitones2 with distinct authored carriers. Not actual engine/browser/music/hardware or all-settings acceptance.',sourceHashes:{[before]:sha(readFileSync(new URL(before,root))),[after]:sha(readFileSync(new URL(after,root))),'scripts/test_reference_legacy_155.mjs':sha(readFileSync(new URL(import.meta.url)))},cases,allObservedChannelsBitIdentical:true,fullParityAcceptance:false};
writeFileSync(new URL('docs/prototype/reference-policy-155-legacy-results.json',root),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({channels:[2,10],framesPerChannel:frames,allObservedChannelsBitIdentical:true}));
