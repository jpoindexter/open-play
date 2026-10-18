// Actual DSP experiment; source-resampling helper is production code, the clock is serial.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'local-evidence/keylock-resampled-pitch-initial');
assert(!fs.existsSync(out),'Never overwrite an experiment');fs.mkdirSync(out,{recursive:true});
const planPath='docs/prototype/keylock-resampled-pitch-plan.json';
const plan=JSON.parse(fs.readFileSync(path.join(root,planPath)));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const constructors=new Map();
globalThis.sampleRate=44100;globalThis.currentTime=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.ready=new Promise(resolve=>this.resolve=resolve);this.port={onmessage:null,postMessage:data=>{this.events.push(data);if(data[0]==='ready')this.resolve();}};}};
globalThis.registerProcessor=(name,constructor)=>constructors.set(name,constructor);
class SourceBuffer{
 constructor(sampleRate,channels){this.sampleRate=sampleRate;this.channels=channels;this.length=channels[0].length;this.numberOfChannels=channels.length;this.duration=this.length/sampleRate;}
 getChannelData(channel){return this.channels[channel];}
}
globalThis.AudioBuffer=SourceBuffer;
const {copyKeylockChunk}=await import('../prototype/keylock-shadow-live.js');
const Processor=constructors.get('signalsmith-stretch-open-play-history');assert(Processor);
function save(name,channels,sampleRate){
 const file=path.join(out,name),bytes=Buffer.alloc(channels[0].length*channels.length*4);
 for(let n=0;n<channels[0].length;n++)for(let c=0;c<channels.length;c++)bytes.writeFloatLE(channels[c][n],(n*channels.length+c)*4);
 fs.writeFileSync(file,bytes,{flag:'wx'});return {path:path.relative(root,file),bytes:bytes.length,sha256:sha(bytes),sampleRate,channels:channels.length,frames:channels[0].length};
}
const report={planPath,planSHA256:sha(fs.readFileSync(path.join(root,planPath))),host:plan.scope,sourceHashes:{},sources:[],results:[],fullKeylockAccepted:false};
for(const file of ['prototype/keylock-shadow-live.js','prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs','scripts/experiment_resampled_pitch.mjs'])report.sourceHashes[file]=sha(fs.readFileSync(path.join(root,file)));
for(const row of plan.cases){
 const sr=row.sampleRate;globalThis.sampleRate=sr;
 const source=row.tonesHz.map(hz=>Float32Array.from({length:14*sr},(_,n)=>.12*Math.sin(2*Math.PI*hz*n/sr)));
 report.sources.push({id:row.id,tonesHz:row.tonesHz,...save(row.id+'-source.f32',source,sr)});
 for(const variant of plan.variants){
  const started=performance.now(),q=2**(row.semitones/12);
  const channels=variant==='history-spectral'?source:await copyKeylockChunk(new SourceBuffer(sr,source),sr/q,0,Math.ceil(source[0].length/q));
  const rate=variant==='history-spectral'?row.rate:row.rate/q,semitones=variant==='history-spectral'?row.semitones:0;
  globalThis.currentTime=0;const processor=new Processor({numberOfOutputs:1,outputChannelCount:[2]});await processor.ready;
  let id=0;const send=(method,...args)=>{const request=++id;processor.port.onmessage({data:[request,method,...args]});const reply=processor.events.findLast(x=>x[0]===request);assert(reply);assert.notEqual(reply[2],'error',JSON.stringify(reply));return reply[1];};
  send('addBuffers',channels);const command={active:true,input:0,output:.25,rate,semitones};send('schedule',command);
  const frames=Math.ceil(10*sr/128)*128,result=[new Float32Array(frames),new Float32Array(frames)];let nonfinite=0;
  for(let n=0;n<frames;n+=128){globalThis.currentTime=n/sr;const block=[[new Float32Array(128),new Float32Array(128)]];assert.equal(processor.process([[]],block,{}),true);for(let c=0;c<2;c++){for(const x of block[0][c])if(!Number.isFinite(x))nonfinite++;result[c].set(block[0][c],n);}}
  const metadata={id:row.id+'-'+variant,caseID:row.id,variant,tonesHz:row.tonesHz,requestedRate:row.rate,requestedSemitones:row.semitones,q,command,latencySeconds:send('latency'),blockSamples:processor.wasmModule._blockSamples(),intervalSamples:processor.wasmModule._intervalSamples(),seekHistoryFrames:processor.bufferLength,preparedSourceFrames:channels[0].length,nonfinite,serialWallMs:performance.now()-started,...save(row.id+'-'+variant+'.f32',result,sr)};
  send('dispose');report.results.push(metadata);console.log(JSON.stringify({id:metadata.id,frames,nonfinite,serialWallMs:metadata.serialWallMs}));
 }
}
fs.writeFileSync(path.join(root,'docs/prototype/keylock-resampled-pitch-initial-render.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
