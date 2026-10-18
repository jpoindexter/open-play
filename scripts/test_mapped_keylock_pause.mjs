// Reuses the actual-WASM controlled host from test_live_resampled_keylock.mjs.
// One direct mapped-owner cancellation/restart contract; no browser/device claim.
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

await check('Mapped Pause cancels a future start without destroying the owner, then restarts audibly',async e=>{
 const ctx=new Context(),position=8,rate=4/3,semi=2;
 const a=await createLiveKeylock(ctx,{buffers:[source({hz:330,change:99})],position,rate:1,keylock:false,semitones:semi,resamplePitch:true,pitchRateMap:[{position:0,rate:1},{position:4,rate:.8},{position:7,rate}]});
 try{
  e.initial=a.snapshot();e.start=await a.startTimeline({position,when:1,events:[{when:1,rate}]});
  await a.pause();assert.equal(a.disposed,false,'Pause destroyed the reusable owner');
  const quiet=render(ctx,a,1.5);e.cancelledSignal=metrics(quiet.channels[0]);assert.equal(e.cancelledSignal.peak,0,'Cancelled future start was audible');assert.equal(a.stateAt().playing,false);
  e.restart=await a.startTimeline({position,when:2,events:[{when:2,rate}]});
  const resumed=render(ctx,a,3.4);e.resumedSignal=window(resumed,2.5,.7);e.expectedHz=330*2**(semi/12)*rate;
  assert(e.resumedSignal.rms>.01,'Restart remained silent');assert(Math.abs(e.resumedSignal.hz-e.expectedHz)<1,'Restart pitch differs from mapped source rate');
 }finally{await a.dispose();e.retainedAfterDispose=a.snapshot().retainedPCMBytes;assert.equal(e.retainedAfterDispose,0);}
});
const sourceHashes=Object.fromEntries(await Promise.all(['prototype/keylock-shadow-live.js','prototype/pitch-time-map.js','prototype/pcm-resample.js','prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const result={scope:'Direct actual-WASM mapped adapter with controlled serial clock/ports, AudioBuffer-shaped source and simplified gain graph. Future Pause silence and same-owner audible restart only. Not normal app GUI, browser, native, physical or full parity.',sourceHashes,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,fullParityVerified:false};
const {writeFile}=await import('node:fs/promises');
await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:result.passed,failed:result.failed,checks:checks.map(c=>({name:c.name,passed:c.passed,error:c.error?.split('\n')[0]}))}));if(result.failed)process.exitCode=1;
