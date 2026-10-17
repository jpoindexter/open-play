// Actual vendor WASM with a serial worklet clock; this is not native/browser acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'local-evidence/keylock-pitch-isolation-initial');
assert(!fs.existsSync(out),'Never overwrite a prior experiment');fs.mkdirSync(out,{recursive:true});
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const sourcePath='local-evidence/keylock-native-fixtures/native-keylock-stereo-120s.wav',wav=fs.readFileSync(path.join(root,sourcePath));
assert.equal(hash(wav),'99833309d13090de63a9fcdb7ca8f6bcf601975bfb8cb2e3ef691bb369a0a119');
assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');
let fmt,dataAt,dataBytes;
for(let at=12;at+8<=wav.length;){const n=wav.readUInt32LE(at+4),key=wav.toString('ascii',at,at+4);if(key==='fmt ')fmt=wav.subarray(at+8,at+8+n);if(key==='data'){dataAt=at+8;dataBytes=n;}at+=8+n+(n%2);}
assert(fmt&&dataAt);assert.equal(fmt.readUInt16LE(0),1);assert.equal(fmt.readUInt16LE(2),2);assert.equal(fmt.readUInt16LE(14),16);
const sr=fmt.readUInt32LE(4),quantum=128;assert.equal(sr,44100);assert.equal(dataBytes/4,sr*120);
const source=[0,1].map(c=>Float32Array.from({length:14*sr},(_,i)=>wav.readInt16LE(dataAt+i*4+c*2)/32768));
function writePCM(name,channels){const raw=Buffer.alloc(channels[0].length*channels.length*4);for(let i=0;i<channels[0].length;i++)for(let c=0;c<channels.length;c++)raw.writeFloatLE(channels[c][i],(i*channels.length+c)*4);fs.writeFileSync(path.join(out,name),raw,{flag:'wx'});return{path:path.relative(root,path.join(out,name)),sha256:hash(raw),bytes:raw.length,frames:channels[0].length,channels:channels.length,sampleRate:sr};}
const sourceRaw=writePCM('source-prefix-whole.f32',source),constructors=new Map();
globalThis.sampleRate=sr;globalThis.currentTime=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.ready=new Promise(resolve=>this.resolve=resolve);this.port={onmessage:null,postMessage:message=>{this.events.push(message);if(message[0]==='ready')this.resolve();}};}};
globalThis.registerProcessor=(name,ctor)=>constructors.set(name,ctor);
const modules={upstream:{file:'SignalsmithStretch.mjs',key:'signalsmith-stretch'},production:{file:'SignalsmithStretch-open-play-disposable.mjs',key:'signalsmith-stretch-open-play-disposable'}};
for(const m of Object.values(modules)){m.path='prototype/vendor/signalsmith-stretch/'+m.file;m.sha256=hash(fs.readFileSync(path.join(root,m.path)));await import(path.join(root,m.path));assert(constructors.has(m.key));}
const results=[];
for(const [variant,m] of Object.entries(modules))for(const rate of [1,1.08])for(const semitones of [0,2])for(const chunked of (variant==='production'&&rate===1.08?[false,true]:[false])){
 globalThis.currentTime=0;const processor=new (constructors.get(m.key))({numberOfOutputs:1,outputChannelCount:[2]});await processor.ready;
 let sequence=0;const send=(method,...args)=>{const id=++sequence;processor.port.onmessage({data:[id,method,...args]});const response=processor.events.findLast(event=>event[0]===id);assert(response,'Missing synchronous processor reply');assert.notEqual(response[2],'error',JSON.stringify(response));return response[1];};
 const chunk=chunked?sr/2:source[0].length;for(let start=0;start<source[0].length;start+=chunk)send('addBuffers',source.map(c=>c.slice(start,Math.min(start+chunk,c.length))));
 const command={active:true,input:0,output:.25,rate,semitones};const accepted=send('schedule',command),latency=send('latency');
 const frames=Math.ceil(sr*10/quantum)*quantum,output=[new Float32Array(frames),new Float32Array(frames)];
 let nonfinite=0;for(let frame=0;frame<frames;frame+=quantum){globalThis.currentTime=frame/sr;const block=[[new Float32Array(quantum),new Float32Array(quantum)]];assert.equal(processor.process([[]],block,{}),true);for(let c=0;c<2;c++){for(const value of block[0][c])if(!Number.isFinite(value))nonfinite++;output[c].set(block[0][c],frame);}}
 const id=`${variant}-rate${rate}-shift${semitones}-${chunked?'half-second-chunks':'whole'}`,pcm=writePCM(id+'.f32',output);
 results.push({id,variant,rate,semitones,chunked,command,accepted,config:{...processor.config},latency,nonfinite,...pcm});assert.equal(nonfinite,0);
 if(variant==='production')send('dispose');console.log(JSON.stringify({id,frames,nonfinite,latency}));
}
const report={created_at:new Date().toISOString(),planSHA256:hash(fs.readFileSync(path.join(root,'docs/prototype/keylock-pitch-isolation-plan.json'))),source:{path:sourcePath,sha256:hash(wav),prefix:sourceRaw},modules,quantum,host:'Serial Node process invoking real actual vendor WASM; simulated clock and message port, not simulated DSP',results,full_parity_verified:false};
fs.writeFileSync(path.join(root,'docs/prototype/keylock-pitch-isolation-initial-render.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
