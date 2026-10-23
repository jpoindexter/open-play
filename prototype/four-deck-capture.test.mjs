import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./four-deck-soak-harness.js',import.meta.url),'utf8');
const capture=source.slice(source.indexOf('async function capture('),source.indexOf('\nasync function boot('));
for(const frames of [44100*12,44100*12+1])test(`actual capture export yields and retains exact ${frames} Float32 frames and archive metadata`,async()=>{
 const pcm=Float32Array.from({length:frames},(_,i)=>(i%257-128)/256),expected=Buffer.from(pcm.buffer).toString('base64'),archives=[],events=[],sizes=[];
 let heartbeat=false,connected=0,disconnected=0,closed=0;
 const latest={textContent:''},engine={ctx:{sampleRate:44100,destination:{}},masterOutput:{output:{connect(){connected++;},disconnect(){disconnected++;}}}};
 class AudioWorkletNode{
  constructor(){this.port={close(){closed++;},postMessage:message=>{assert.equal(message.type,'capture');assert.equal(message.frames,frames);queueMicrotask(()=>this.port.onmessage({data:{type:'done',startFrame:2840064,data:pcm.slice()}}));}};}
  connect(){}disconnect(){}
 }
 const scope={app:{engine},AudioWorkletNode,Uint8Array,setTimeout,clearTimeout,sleep:ms=>new Promise(resolve=>setTimeout(resolve,ms)),btoa:binary=>{assert.equal(closed,1,'Capture port must close before export');sizes.push(binary.length);return btoa(binary);},document:{createElement:tag=>{assert.equal(tag,'pre');return{dataset:{}};}},$:selector=>selector==='#soak-capture'?latest:{append:node=>archives.push(node)},event:(type,details)=>events.push({type,...details})};
 vm.createContext(scope);vm.runInContext(capture,scope);
 const timer=setTimeout(()=>heartbeat=true,0);
 try{
  await scope.capture('analysis-odd',frames/44100);
  assert(heartbeat,'A control task must run before full capture export completes');assert(sizes.every(length=>length<=49152),'Each base64 call must stay bounded');
  assert.equal(connected,1);assert.equal(disconnected,1);assert.equal(closed,1);assert.equal(archives.length,1);assert.equal(archives[0].hidden,true);assert.equal(archives[0].dataset.soakCapture,'analysis-odd');assert.equal(archives[0].textContent,latest.textContent);
  const value=JSON.parse(latest.textContent);assert.equal(value.label,'analysis-odd');assert.equal(value.startFrame,2840064);assert.equal(value.sampleRate,44100);assert.equal(value.pcm,expected);assert.deepEqual(Buffer.from(value.pcm,'base64'),Buffer.from(pcm.buffer));
  assert.equal(events.length,1);assert.equal(events[0].type,'capture');assert.equal(events[0].label,'analysis-odd');assert.equal(events[0].frames,frames);
 }finally{clearTimeout(timer);}
});
