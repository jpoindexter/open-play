// Research-only serial processor experiment. No app, service or hardware changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const out=new URL('local-evidence/stem-activation-inplace-138/',root);
fs.mkdirSync(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sr=44100,quantum=128,frames=Math.ceil(2*sr/quantum)*quantum;
const attachFrame=Math.ceil(.9*sr/quantum)*quantum;
const constructors=new Map();
globalThis.sampleRate=sr;
globalThis.currentTime=0;
globalThis.AudioWorkletProcessor=class {
 constructor(){
  this.events=[];
  this.ready=new Promise(resolve=>this.resolve=resolve);
  this.port={onmessage:null,postMessage:message=>{
   this.events.push(message);if(message[0]==='ready')this.resolve();
  }};
 }
};
globalThis.registerProcessor=(name,ctor)=>constructors.set(name,ctor);
const modulePath='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs';
await import(new URL(modulePath,root));

function wav(file){
 const bytes=fs.readFileSync(file);let format,raw;
 for(let offset=12;offset+8<=bytes.length;){
  const size=bytes.readUInt32LE(offset+4),key=bytes.toString('ascii',offset,offset+4);
  if(key==='fmt ')format=bytes.subarray(offset+8,offset+8+size);
  if(key==='data')raw=bytes.subarray(offset+8,offset+8+size);
  offset+=8+size+(size%2);
 }
 assert(format&&raw);assert.equal(format.readUInt16LE(0),3);
 assert.equal(format.readUInt32LE(4),sr);assert.equal(format.readUInt16LE(14),32);
 const channels=format.readUInt16LE(2),length=raw.length/(4*channels);
 return Array.from({length:channels},(_,channel)=>Float32Array.from({length},(_,i)=>raw.readFloatLE((i*channels+channel)*4)));
}

const job='a2877adfbffa4ece8ec544451917a589';
const original=wav(new URL(`local-evidence/stem-jobs/${job}/input.wav`,root));
const stems=['vocals','other','bass','drums'].flatMap(name=>wav(new URL(`local-evidence/stem-jobs/${job}/output/${name}.wav`,root)));
const originalHashes=original.map(channel=>sha(Buffer.from(channel.buffer)));
const configs=['control-silent-stems','inplace-real-stems'].map(name=>({
 name,channels:[...original,...stems.map(channel=>new Float32Array(channel.length))],
 samples:Array.from({length:name==='inplace-real-stems'?10:2},()=>new Float32Array(frames)),seq:0,
}));
for(const config of configs){
 config.proc=new(constructors.get('signalsmith-stretch-open-play-history'))({numberOfOutputs:1,outputChannelCount:[10]});
 await config.proc.ready;
 config.send=(method,...args)=>{
  const id=++config.seq;config.proc.port.onmessage({data:[id,method,...args]});
  const result=config.proc.events.findLast(event=>event[0]===id);
  assert(result);assert.notEqual(result[2],'error');return result[1];
 };
 config.send('addBuffers',config.channels);
 config.send('schedule',{active:true,input:0,output:.25,rate:1.1,semitones:0});
 config.latency=config.send('latency');
}

for(let frame=0;frame<frames;frame+=quantum){
 globalThis.currentTime=frame/sr;
 for(const config of configs){
  if(config.name==='inplace-real-stems'&&frame===attachFrame){
   // The serial port stub passes arrays by reference. This models an atomic
   // future PCM replacement command, which the browser wrapper does NOT yet have.
   // No processor configuration, original samples or schedule is changed.
   for(let channel=0;channel<stems.length;channel++)config.channels[channel+2].set(stems[channel]);
  }
  const output=[Array.from({length:10},()=>new Float32Array(quantum))];
  assert(config.proc.process([[]],output,{}));
  for(let channel=0;channel<config.samples.length;channel++)config.samples[channel].set(output[0][channel],frame);
 }
}

const results=[];
for(const config of configs){
 config.send('dispose');const pcm=[];
 for(let channel=0;channel<config.samples.length;channel++){
  const bytes=Buffer.from(config.samples[channel].buffer),file=`${config.name}-${channel}.f32`;
  fs.writeFileSync(new URL(file,out),bytes,{flag:'wx'});
  pcm.push({channel,file,frames,sha256:sha(bytes)});
 }
 results.push({name:config.name,processorChannels:10,latency:config.latency,pcm});
}
assert.deepEqual(original.map(channel=>sha(Buffer.from(channel.buffer))),originalHashes);
const receipt={scope:'Actual unchanged WASM, serial128-frame clock, fixed10-channel geometry. At0.9s replace only8silent Stem input arrays with actual cached separation. Mutation uses serial reference semantics; browser replacement API NOT implemented. No app/native/controller/listening acceptance.',
 experimentSHA256:sha(fs.readFileSync(new URL('experiments/stem_activation_inplace.mjs',root))),
 sampleRate:sr,quantum,frames,attachFrame,attachTime:attachFrame/sr,
 schedule:{active:true,input:0,output:.25,rate:1.1,semitones:0},
 modulePath,moduleSHA256:sha(fs.readFileSync(new URL(modulePath,root))),
 inputJob:job,originalHashes,originalUnchanged:true,results};
fs.writeFileSync(new URL('original.json',out),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({attachTime:receipt.attachTime,results:results.map(row=>({name:row.name,channels:row.processorChannels,latency:row.latency})),scope:receipt.scope}));
