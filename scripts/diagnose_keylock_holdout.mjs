import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'local-evidence/keylock-holdout-initial');
assert(!fs.existsSync(dir),'Never overwrite prior experiment');fs.mkdirSync(dir,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),planPath='docs/prototype/keylock-holdout-plan.json',plan=JSON.parse(fs.readFileSync(path.join(root,planPath))),constructors=new Map();
globalThis.currentTime=0;globalThis.sampleRate=44100;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.ready=new Promise(resolve=>this.resolve=resolve);this.port={onmessage:null,postMessage:m=>{this.events.push(m);if(m[0]==='ready')this.resolve();}};}};
globalThis.registerProcessor=(key,ctor)=>constructors.set(key,ctor);
const modulePath='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs',moduleBytes=fs.readFileSync(path.join(root,modulePath));await import(path.join(root,modulePath));
function save(name,data){const bytes=Buffer.from(data.buffer,data.byteOffset,data.byteLength),p=path.join(dir,name);fs.writeFileSync(p,bytes,{flag:'wx'});return{path:path.relative(root,p),sha256:hash(bytes),bytes:bytes.length};}
function stereo(a){const out=new Float32Array(a[0].length*2);for(let i=0;i<a[0].length;i++){out[2*i]=a[0][i];out[2*i+1]=a[1][i];}return out;}
const sources=[],results=[];
for(const sampleRate of plan.sample_rates)for(const tones of plan.tone_pairs_hz){
 globalThis.sampleRate=sampleRate;const sourceID=`sr${sampleRate}-${tones.join('-')}`,source=tones.map((f,c)=>Float32Array.from({length:14*sampleRate},(_,i)=>.14*Math.sin(2*Math.PI*f*i/sampleRate+[.17,.53][c])));
 sources.push({id:sourceID,sampleRate,tones,frames:source[0].length,...save(sourceID+'-source.f32',stereo(source))});
 for(const state of plan.states)for(const variant of ['baseline','history-only','dense-analysis']){
  globalThis.currentTime=0;const proc=new (constructors.get('signalsmith-stretch-open-play-disposable'))({numberOfOutputs:1,outputChannelCount:[2]});await proc.ready;
  let sequence=0;const send=(method,...args)=>{const id=++sequence;proc.port.onmessage({data:[id,method,...args]});const answer=proc.events.findLast(x=>x[0]===id);assert(answer);assert.notEqual(answer[2],'error');return answer[1];};
  if(variant==='dense-analysis'){proc.config={blockMs:120,intervalMs:10};proc.configure();}
  const wasm=proc.wasmModule,originalLength=proc.bufferLength,block=wasm._blockSamples(),interval=wasm._intervalSamples();
  if(variant!=='baseline'){proc.bufferLength=block+interval;const ptr=wasm._setBuffers(2,proc.bufferLength),bytes=proc.bufferLength*4;proc.buffersIn=[ptr,ptr+bytes];proc.buffersOut=[ptr+2*bytes,ptr+3*bytes];}
  send('addBuffers',source.map(a=>a.slice()));const command={active:true,input:0,output:.25,...state};send('schedule',command);const latency=send('latency');
  const frames=Math.ceil(10*sampleRate/128)*128,output=new Float32Array(frames*2);let nonfinite=0,processMs=0;
  for(let frame=0;frame<frames;frame+=128){globalThis.currentTime=frame/sampleRate;const audio=[[new Float32Array(128),new Float32Array(128)]];const start=performance.now();proc.process([[]],audio,{});processMs+=performance.now()-start;for(let i=0;i<128;i++)for(let c=0;c<2;c++){const value=audio[0][c][i];if(!Number.isFinite(value))nonfinite++;output[(frame+i)*2+c]=value;}}
  const id=`${sourceID}-rate${state.rate}-shift${state.semitones}-${variant}`;results.push({id,sourceID,sampleRate,tones,...state,variant,originalLength,bufferLength:proc.bufferLength,block,interval,latency,frames,nonfinite,serialProcessMilliseconds:processMs,...save(id+'.f32',output)});assert.equal(nonfinite,0);send('dispose');
 }
 console.log(JSON.stringify({sourceID,renderedCases:results.length}));
}
assert.equal(results.length,72);
fs.writeFileSync(path.join(root,'docs/prototype/keylock-holdout-initial-render.json'),JSON.stringify({created_at:new Date().toISOString(),planPath,planSHA256:hash(fs.readFileSync(path.join(root,planPath))),modulePath,moduleSHA256:hash(moduleBytes),sources,results,scope:'ActualWASM serialhost; same120mslatency, no nativeCPU/music/reference/fullparity acceptance'},null,2)+'\n',{flag:'wx'});
