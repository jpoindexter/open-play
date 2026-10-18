// Derived original19 actual-WASM controlled-host checks against the shadow adapter.
// Retention-specific expectations: far origin18 rather than19; PCM bound11s rather than10s.
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
const sr=48000,checks=[];async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.stack});}}
const tick=()=>new Promise(r=>setImmediate(r)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
class SourceBuffer{constructor({length,numberOfChannels=2,sampleRate=sr}){this.length=length;this.numberOfChannels=numberOfChannels;this.sampleRate=sampleRate;this.duration=length/sampleRate;this.data=Array.from({length:numberOfChannels},()=>new Float32Array(length));}getChannelData(c){if(!(this instanceof SourceBuffer))throw TypeError('Invalid AudioBuffer brand');return this.data[c];}}
globalThis.AudioBuffer=SourceBuffer;
function source({rate=sr,duration=32,channels=2,hz=440,change=16}={}){const b=new SourceBuffer({length:Math.round(rate*duration),numberOfChannels:channels,sampleRate:rate});for(let c=0;c<channels;c++)for(let i=0;i<b.length;i++){const t=i/rate;b.data[c][i]=.12*Math.sin(2*Math.PI*((t>=change?2:1)*(hz+c*110))*t);}return b;}
let Processor;globalThis.sampleRate=sr;globalThis.currentTime=0;globalThis.AudioWorkletProcessor=class{constructor(){this.port={onmessage:null,postMessage:data=>queueMicrotask(()=>this.bridge?.(data))};}};globalThis.registerProcessor=(name,C)=>Processor=C;
await import('../prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs?pending-control-test');delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;
class Param{constructor(){this.value=1;this.events=[];}cancelScheduledValues(t){this.events=this.events.filter(e=>e.t<t);}setValueAtTime(v,t){this.events.push({v,t,ramp:false});}linearRampToValueAtTime(v,t){this.events.push({v,t,ramp:true});}at(t){let previous={v:this.value,t:0};for(const e of this.events.toSorted((a,b)=>a.t-b.t)){if(e.t>t){if(e.ramp)return previous.v+(e.v-previous.v)*(t-previous.t)/(e.t-previous.t);break;}previous=e;}return previous.v;}}
class Gain{constructor(){this.gain=new Param();this.connections=[];}connect(target){this.connections.push(target);return target;}disconnect(){this.connections=[];}}
class Node extends EventTarget{constructor(ctx,name,options){super();if(!ctx.loaded)throw Error('Module not loaded');this.context=ctx;this.processor=new Processor(options);this.channels=options.outputChannelCount[0];this.connections=[];this.terminal=false;this.port={onmessage:null,close:()=>this.closed=true,postMessage:data=>queueMicrotask(()=>this.processor.port.onmessage({data}))};this.processor.bridge=data=>queueMicrotask(()=>this.port.onmessage?.({data}));ctx.nodes.push(this);}connect(target){this.connections.push(target);return target;}disconnect(){this.connections=[];}}
globalThis.AudioWorkletNode=Node;
class Context{constructor(){this.sampleRate=sr;this.currentTime=0;this.loaded=false;this.nodes=[];this.audioWorklet={addModule:async()=>this.loaded=true};}createGain(){return new Gain();}}
const{createLiveKeylock,copyKeylockChunk}=await import('../prototype/keylock-shadow-live.js');
function metrics(data){let power=0,peak=0;const crossing=[];for(let i=0;i<data.length;i++){power+=data[i]**2;peak=Math.max(peak,Math.abs(data[i]));if(i&&data[i-1]<0&&data[i]>=0)crossing.push(i-1-data[i-1]/(data[i]-data[i-1]));}return{rms:Math.sqrt(power/data.length),peak,hz:crossing.length>1?(crossing.length-1)*sr/(crossing.at(-1)-crossing[0]):null};}
function render(ctx,adapter,end){const first=Math.round(ctx.currentTime*sr/128)*128,last=Math.ceil(end*sr/128)*128,capture=adapter.outputs.map(()=>[]);for(let frame=first;frame<last;frame+=128){ctx.currentTime=frame/sr;globalThis.currentTime=ctx.currentTime;const sum=adapter.outputs.map(()=>new Float32Array(128));for(const node of ctx.nodes){if(node.terminal)continue;const output=[Array.from({length:node.channels},()=>new Float32Array(128))];const active=node.processor.process([[]],output,{});if(!active)node.terminal=true;for(const gain of node.connections)for(const bus of gain.connections){const index=adapter.outputs.indexOf(bus);if(index<0)continue;for(let i=0;i<128;i++)sum[index][i]+=output[0][0][i]*gain.gain.at((frame+i)/sr)*bus.gain.at((frame+i)/sr);}}for(let i=0;i<capture.length;i++)capture[i].push(...sum[i]);}ctx.currentTime=last/sr;return{first,last,channels:capture.map(c=>Float32Array.from(c))};}
function window(rendered,start,duration=.3,index=0){return metrics(rendered.channels[index].slice(Math.round(start*sr)-rendered.first,Math.round((start+duration)*sr)-rendered.first));}
// Focused new-mode tests; actual WASM, controlled clock/ports and simplified gain graph.
await check('Resampled forward pitch preserves requested tone and rate updates retain its group',async e=>{
 const ctx=new Context(),a=await createLiveKeylock(ctx,{buffers:[source({hz:330,change:99})],rate:1.08,semitones:2,resamplePitch:true});
 try{const first=await a.start(),group=a.snapshot().groups[0],captured=render(ctx,a,first.when+2.8),signal=window(captured,first.when+.5,2);assert(Math.abs(signal.hz-330*2**(2/12))<=1);assert.equal(group.pitchSemitones,2);
  const rate=await a.update({rate:1.25}),id=a.snapshot().groups[0].id,again=render(ctx,a,rate.when+2.8),signal2=window(again,rate.when+.5,2);assert.equal(id,group.id);assert(Math.abs(signal2.hz-330*2**(2/12))<=1);Object.assign(e,{group,signal,signal2,rate,outputIdentityStable:true});
 }finally{await a.dispose();assert.equal(a.snapshot().retainedPCMBytes,0);}
});
await check('Rebased mixed-rate pitch input reads the original source region and later backward seek',async e=>{
 const ctx=new Context(),a=await createLiveKeylock(ctx,{buffers:[source({rate:22050,duration:48,hz:97,change:16})],position:20,rate:.75,semitones:-12,resamplePitch:true});
 try{const first=await a.start(),forward=render(ctx,a,first.when+2.8),high=window(forward,first.when+.5,2);assert(Math.abs(high.hz-97)<=1,'Wrong original region after nonzero origin');const outputs=a.outputs.slice(),back=await a.seek(.5),lowPCM=render(ctx,a,back.when+2.8),low=window(lowPCM,back.when+.5,2);assert(Math.abs(low.hz-48.5)<=1,'Backward rebase missed original region');assert.equal(a.outputs[0],outputs[0]);Object.assign(e,{first,high,back,low,snapshot:a.snapshot()});
 }finally{await a.dispose();assert.equal(a.snapshot().retainedPCMBytes,0);}
});
await check('Pitch change replaces PCM group while the adapter/output and old future clock survive',async e=>{
 const ctx=new Context(),a=await createLiveKeylock(ctx,{buffers:[source({hz:330,change:99})],resamplePitch:true});
 try{const first=await a.start();render(ctx,a,first.when+.8);const outputs=a.outputs.slice(),old=a.snapshot().groups[0].id,ack=await a.update({semitones:2}),snapshot=a.snapshot();assert(snapshot.groups.some(g=>g.id===old&&g.role==='retiring'));assert.equal(a.outputs[0],outputs[0]);const pcm=render(ctx,a,ack.when+2.8),signal=window(pcm,ack.when+.5,2);assert(Math.abs(signal.hz-330*2**(2/12))<=1);Object.assign(e,{ack,signal,snapshot});
 }finally{await a.dispose();}
});
await check('PCM budget refusal during replacement leaves actual old playback alive',async e=>{
 const ctx=new Context(),a=await createLiveKeylock(ctx,{buffers:[source({hz:330,change:99})],resamplePitch:true,maxPCMBytes:3*1024*1024});
 try{const start=await a.start(),old=a.active;await assert.rejects(a.update({semitones:-12}),/PCM copy budget/);assert.equal(a.active,old);assert.equal(a.disposed,false);const pcm=render(ctx,a,start.when+2.8),signal=window(pcm,start.when+.5,2);assert(signal.rms>.02);Object.assign(e,{signal,snapshot:a.snapshot()});
 }finally{await a.dispose();}
});
await check('Explicit Pause still cancels pending resampled playback and parameter work',async e=>{
 const ctx=new Context(),a=await createLiveKeylock(ctx,{buffers:[source()],resamplePitch:true});
 try{await a.start({when:1});const pending=a.update({semitones:2});const stopped=a.pause();await pending.catch(error=>assert.equal(error.name,'AbortError'));await stopped;const pcm=render(ctx,a,1.6),signal=metrics(pcm.channels[0]);assert.equal(signal.peak,0);e.signal=signal;
 }finally{await a.dispose();}
});
const sourceHashes=Object.fromEntries(await Promise.all(['prototype/keylock-shadow-live.js','prototype/pcm-resample.js','prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs'].map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const result={sourceHashes,scope:'Actual WASM/new resampled live adapter with controlled serial clock/ports, AudioBuffer-shaped sources and simplified gain graph. Region/rate/group/budget/pause contracts only; not actual browser/device/live quality or sample cursor acceptance.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks};
const {writeFile}=await import('node:fs/promises');await writeFile('docs/prototype/live-resampled-keylock-policy-results.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:result.passed,failed:result.failed,checks:checks.map(x=>({name:x.name,passed:x.passed,error:x.error?.split('\n')[0]}))},null,2));if(result.failed)process.exitCode=1;
