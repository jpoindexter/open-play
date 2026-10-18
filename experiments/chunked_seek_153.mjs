// Whole versus bounded/chunked input, actual WASM/SRC, recorded startup clock.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {copyPCMChunk} from '../prototype/pcm-resample.js';
const root=new URL('../',import.meta.url),capturePath=process.argv[2];assert(capturePath,'Pass the exact browser original');
const browser=JSON.parse(readFileSync(capturePath)),observed=browser.samples[0].decks[1].remote.startup,command=observed.firstActiveCommand;
assert(observed&&command&&observed.createdFrame!==null&&observed.firstActiveFrame!==null);
const sr=44100,q=2**(3/12),sourceFrames=48*sr,preparedFrames=Math.ceil(sourceFrames/q),chunkFrames=22050;
const firstRenderFrame=observed.firstActiveFrame-observed.inactiveQuantaBeforeFirstActive*128;
const endFrame=Math.ceil((browser.pcm[0].startFrame+browser.pcm[0].frames)/128)*128,frames=endFrame-firstRenderFrame;
const out=new URL('local-evidence/chunked-seek-153/',root);mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),registry=new Map();
globalThis.sampleRate=sr;globalThis.currentFrame=observed.createdFrame;globalThis.currentTime=currentFrame/sr;
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.port={onmessage:null,postMessage:data=>this.events.push(data)};}};
globalThis.registerProcessor=(name,ctor)=>registry.set(name,ctor);
const modulePath='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs';await import(new URL(modulePath,root));
const configs=['whole','bounded-chunks'].map(name=>({name,processor:new(registry.get('signalsmith-stretch-open-play-replace'))({numberOfOutputs:1,outputChannelCount:[18]}),output:[Array.from({length:18},()=>new Float32Array(128))],samples:[new Float32Array(frames),new Float32Array(frames)]}));
for(let n=0;n<observed.notReadyQuanta;n++){globalThis.currentFrame=observed.createdFrame+n*128;globalThis.currentTime=currentFrame/sr;configs.forEach(c=>c.processor.process([[]],c.output,{}));}
globalThis.currentFrame=observed.wasmReadyFrame;globalThis.currentTime=currentFrame/sr;
for(const c of configs)while(!c.processor.wasmReady)await new Promise(resolve=>setImmediate(resolve));
let sequence=0;function call(p,method,...args){const id=++sequence;p.port.onmessage({data:[id,method,...args]});const e=p.events.findLast(row=>row[0]===id);assert(e);if(e[2]==='error')throw Object.assign(Error(e[1].message),{name:e[1].name});return e[1];}
const source=[330,550].map(hz=>Float32Array.from({length:sourceFrames},(_,i)=>.06*Math.sin(2*Math.PI*hz*i/sr)));
const prepared=await copyPCMChunk(source,sr,sr/q,0,preparedFrames);
const whole=Array.from({length:18},(_,i)=>i===0||i===4?prepared[0].slice():i===1||i===5?prepared[1].slice():new Float32Array(preparedFrames));
call(configs[0].processor,'addBuffers',whole);
let end=0,appended=0,dropped=0,minimumHistoryMargin=Infinity,minimumFutureMargin=Infinity;const chunkLengths=[],operations=[];
async function fill(position){
 const p=configs[1].processor,targetOriginal=Math.min(sourceFrames,Math.ceil((position+8)*sr/chunkFrames)*chunkFrames),target=Math.ceil(targetOriginal/q);
 const keep=Math.max(0,Math.floor((position-2)*sr/chunkFrames)*chunkFrames),before=Math.floor(keep/q)/sr;
 if(keep>0){const prior=p.audioBuffersStart,extent=call(p,'dropBuffers',before);if(p.audioBuffersStart!==prior){dropped++;operations.push({frame:currentFrame,type:'drop',start:p.audioBuffersStart,end:p.audioBuffersEnd,extent});}}
 while(end<target){const count=Math.min(Math.floor(chunkFrames/q),target-end),pcm=await copyPCMChunk(source,sr,sr/q,end,count);assert.deepEqual(pcm[0],prepared[0].subarray(end,end+count));assert.deepEqual(pcm[1],prepared[1].subarray(end,end+count));const channels=Array.from({length:18},(_,i)=>i===0||i===4?pcm[0].slice():i===1||i===5?pcm[1].slice():new Float32Array(count));const extent=call(p,'addBuffers',channels);assert(Math.abs(extent-(end+count)/sr)<1/sr);chunkLengths.push(count);operations.push({frame:currentFrame,type:'append',start:end,count});end+=count;appended++;}
}
await fill(1);for(const c of configs)call(c.processor,'schedule',{active:true,...command});let nextFill=firstRenderFrame;
for(let frame=firstRenderFrame;frame<endFrame;frame+=128){globalThis.currentFrame=frame;globalThis.currentTime=frame/sr;
 if(frame>=nextFill){const position=1+Math.max(0,currentTime-command.output)*1.1;await fill(position);nextFill=frame+Math.ceil(.05*sr/128)*128;}
 if(frame>=observed.firstActiveFrame){const p=configs[1].processor,inputEnd=Math.round((command.input+(currentTime+p.outputLatencySeconds-command.output)*command.rate+p.inputLatencySeconds)*sr),historyStart=inputEnd-p.bufferLength;assert(p.audioBuffersStart<=historyStart&&p.audioBuffersEnd>=inputEnd,'Required seek analysis history is not retained');minimumHistoryMargin=Math.min(minimumHistoryMargin,historyStart-p.audioBuffersStart);minimumFutureMargin=Math.min(minimumFutureMargin,p.audioBuffersEnd-inputEnd);}
 for(const c of configs){assert(c.processor.process([[]],c.output,{}));c.samples[0].set(c.output[0][0],frame-firstRenderFrame);c.samples[1].set(c.output[0][4],frame-firstRenderFrame);}
}
const results=[];for(const c of configs){const startup=call(c.processor,'resourceSnapshot').startup;assert.equal(startup.firstActiveFrame,observed.firstActiveFrame);assert.equal(startup.inactiveQuantaBeforeFirstActive,observed.inactiveQuantaBeforeFirstActive);const pcm=[];for(const [i,channel]of[0,4].entries()){const file=c.name+'-'+channel+'.f32',data=Buffer.from(c.samples[i].buffer);writeFileSync(new URL(file,out),data,{flag:'wx'});pcm.push({channel,file,frames,sha256:sha(data)});}results.push({name:c.name,startup,pcm});call(c.processor,'dispose');}
const receipt={checkpoint:153,scope:'Actual WASM/SRC and recorded browser startup counters. Full input versus bounded append/drop, all appended PCM verified bit-identical. Fixed50ms serial driver freezes clock during copying. Original and Melody present from start, no Stem replacement or browser async/transfer emulation. Not original151 reproduction/native/hardware acceptance.',browserOriginalSHA256:sha(readFileSync(capturePath)),observedStartup:observed,firstRenderFrame,endFrame,frames,sampleRate:sr,pitchFactor:q,appendedChunks:appended,dropOperations:dropped,chunkLengths,operations,minimumHistoryMarginFrames:minimumHistoryMargin,minimumFutureMarginFrames:minimumFutureMargin,results,sourceHashes:{[modulePath]:sha(readFileSync(new URL(modulePath,root))),'prototype/pcm-resample.js':sha(readFileSync(new URL('prototype/pcm-resample.js',root))),'experiments/chunked_seek_153.mjs':sha(readFileSync(new URL(import.meta.url)))},original151FailureStillOpen:true,fullParityAcceptance:false};writeFileSync(new URL('original.json',out),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({frames,appended,dropped,oneFrameChunks:chunkLengths.filter(x=>x===1).length,minimumHistoryMargin,minimumFutureMargin},null,2));
