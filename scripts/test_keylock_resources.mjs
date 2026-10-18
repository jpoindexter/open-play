// Actual WASM/RPC resource ownership, serial port references and controlled clock.
// No browser, PCM quality, real-time CPU/deadline or whole-process bound claim.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sourcePath='prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs';
const source=readFileSync(new URL('../'+sourcePath,import.meta.url),'utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=process.memoryUsage(),began=performance.now(),cpu=process.cpuUsage();
globalThis.sampleRate=44100;globalThis.currentTime=0;globalThis.currentFrame=0;
const registry=new Map();
globalThis.AudioWorkletProcessor=class{constructor(){this.events=[];this.port={onmessage:null,postMessage:data=>this.events.push(data)};}};
globalThis.registerProcessor=(name,ctor)=>registry.set(name,ctor);
await import(new URL('../'+sourcePath,import.meta.url));
const processors=[];let sequence=0;
function call(p,method,...args){const id=++sequence;p.port.onmessage({data:[id,method,...args]});const event=p.events.findLast(row=>row[0]===id);assert(event);if(event[2]==='error')throw Object.assign(Error(event[1].message),{name:event[1].name});return event[1];}
for(let i=0;i<4;i++){const p=new(registry.get('signalsmith-stretch-open-play-replace'))({numberOfOutputs:1,outputChannelCount:[18]});while(!p.wasmReady)await new Promise(resolve=>setImmediate(resolve));processors.push(p);}
const checks=[];
const initial=processors.map(p=>call(p,'resourceSnapshot'));
assert(initial.every(r=>r.channels===18&&r.retainedChunks===0&&r.retainedPCMViewBytes===0&&r.uniqueRetainedArrayBufferBytes===0&&r.wasmLinearMemoryCapacityBytes>0));
checks.push({name:'Four actual18-channel WASM processors report actual positive memory capacity and empty retained PCM',passed:true});
for(const p of processors){for(let chunk=0;chunk<3;chunk++){const channels=Array.from({length:18},()=>new Float32Array(11025));for(let i=0;i<11025;i++){channels[0][i]=.06*Math.sin(2*Math.PI*330*(chunk*11025+i)/44100);channels[1][i]=.06*Math.sin(2*Math.PI*550*(chunk*11025+i)/44100);}channels[3]=channels[2];call(p,'addBuffers',channels);}}
const filled=processors.map(p=>call(p,'resourceSnapshot'));
assert(filled.every(r=>r.retainedChunks===3&&r.startFrame===0&&r.endFrame===33075&&r.retainedPCMViewBytes===3*18*11025*4&&r.uniqueRetainedArrayBufferBytes===3*17*11025*4));
checks.push({name:'Retained view bytes and unique ArrayBuffer bytes distinguish deliberately aliased channels',passed:true});
for(const p of processors){const module=p.wasmModule,arrays=p.audioBuffers.map(c=>c.slice()),schedule=JSON.stringify(p.timeMap);assert.deepEqual(call(p,'resourceSnapshot'),call(p,'resourceSnapshot'));assert.equal(p.wasmModule,module);assert.equal(JSON.stringify(p.timeMap),schedule);arrays.forEach((c,i)=>c.forEach((channel,j)=>assert.equal(p.audioBuffers[i][j],channel)));}
checks.push({name:'Repeated resource queries preserve PCM identities, timeline, DSP instance and configuration',passed:true});
const generations=[];
for(let generation=0;generation<3;generation++){const firstChannel=2+(generation%2)*8;for(const p of processors)for(let chunk=0;chunk<3;chunk++)call(p,'replaceBufferChannels',chunk*11025,firstChannel,Array.from({length:8},()=>new Float32Array(11025)));const stats=processors.map(p=>call(p,'resourceSnapshot'));assert(stats.every((r,i)=>r.wasmLinearMemoryCapacityBytes===initial[i].wasmLinearMemoryCapacityBytes&&r.retainedPCMViewBytes===3*18*11025*4));generations.push({generation:generation+1,firstChannel,stats});}
checks.push({name:'Three actual bank replacements keep retained view count and WASM memory capacity stable',passed:true});
for(const p of processors)call(p,'dropBuffers',.25);
const dropped=processors.map(p=>call(p,'resourceSnapshot'));assert(dropped.every(r=>r.retainedChunks===2&&r.startFrame===11025&&r.endFrame===33075&&r.retainedPCMViewBytes===2*18*11025*4&&r.uniqueRetainedArrayBufferBytes===r.retainedPCMViewBytes));
for(const p of processors){const ack=call(p,'dispose');assert(ack.disposed&&!ack.retainedModule&&ack.retainedSourceBuffers===0);assert.equal(p.wasmModule,null);assert.equal(p.audioBuffers.length,0);assert.throws(()=>call(p,'resourceSnapshot'),{name:'InvalidStateError'});}
checks.push({name:'Drop removes acknowledged PCM ownership and dispose rejects subsequent resource queries',passed:true});
const elapsedCPU=process.cpuUsage(cpu);
const result={checkpoint:150,passed:true,scope:'Actual unchanged WASM bytes, four18-channel processors and read-only resource RPCs over controlled serial ports/clock. No rendered-audio, browser, native, real-time CPU/deadline, GC or total-memory-bound acceptance.',sourcePath,sourceSHA256:hash(source),scriptSHA256:hash(readFileSync(new URL(import.meta.url))),checks,initial,filled,generations,dropped,processObservation:{phase:'Initialization plus allocation/RPC/drop/disposal only; no audio rendered',wallMilliseconds:performance.now()-began,cpuUserMicroseconds:elapsedCPU.user,cpuSystemMicroseconds:elapsedCPU.system,before:baseline,after:process.memoryUsage()},nativeAcceptance:false,hardwareAcceptance:false,browserAcceptance:false,fullParityAcceptance:false};
writeFileSync(new URL('../docs/prototype/keylock-resources-150-component-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,checks:checks.length,wasmCapacityBytes:initial.map(r=>r.wasmLinearMemoryCapacityBytes),retainedBeforeDropBytes:generations.at(-1).stats.map(r=>r.uniqueRetainedArrayBufferBytes),retainedAfterDropBytes:dropped.map(r=>r.uniqueRetainedArrayBufferBytes)},null,2));
