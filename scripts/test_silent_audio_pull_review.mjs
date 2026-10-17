import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createSilentAudioPull,prepareSilentAudioPull} from '../prototype/silent-audio-pull.js';

// Actual processor and wrapper; only the graph, ports and scheduling are controlled.
// Closed MessagePort posts are recorded and discarded (not invented synchronous errors).
const worklet=await readFile(new URL('../prototype/silent-audio-pull-worklet.js',import.meta.url),'utf8');
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const checks=[],unhandled=[];
process.on('unhandledRejection',error=>unhandled.push({name:error?.name,message:error?.message}));
class Source {
 constructor(){this.existing={audible:'existing route'};this.connections=[[this.existing,0,0]];this.disconnects=[];this.stops=0;}
 connect(...args){if(this.failConnect)throw Error('Controlled connection failed');this.connections.push(args);return args[0];}
 disconnect(...args){this.disconnects.push(args);this.connections=this.connections.filter(connection=>!(connection[0]===args[0]&&connection[1]===args[1]&&connection[2]===args[2]));}
 stop(){this.stops++;}
}
class Node {
 constructor(context,name,options){
  this.context=context;this.name=name;this.options=options;this.connections=[];this.closed=false;this.postsAfterClose=[];this.mainPosts=[];
  this.port={onmessage:null,close:()=>{this.closed=true;},postMessage:message=>{const data=structuredClone(message);if(this.closed){this.postsAfterClose.push(data);return;}this.mainPosts.push(data);context.queue.push(()=>this.processor.port.onmessage?.({data}));}};
  let Processor;const node=this;vm.runInNewContext(worklet,{AudioWorkletProcessor:class{constructor(){this.port={onmessage:null,postMessage(message){const data=structuredClone(message);context.queue.push(()=>{if(context.holdOutbound){context.held.push(data);return;}if(!node.closed)node.port.onmessage?.({data});});}};}
  },registerProcessor:(registered,C)=>{assert.equal(registered,'open-play-silent-audio-pull');Processor=C;}});
  this.processor=new Processor();context.nodes.push(this);
 }
 connect(target){this.connections.push(target);return target;}
 disconnect(){this.connections=[];}
}
globalThis.AudioWorkletNode=Node;
function host({moduleGate=null,holdOutbound=false}={}){
 const context={destination:{kind:'destination'},nodes:[],queue:[],held:[],holdOutbound,moduleCalls:0};
 context.audioWorklet={addModule:async()=>{context.moduleCalls++;if(moduleGate)await moduleGate.promise;}};
 context.flush=()=>{let count=0;while(context.queue.length){assert(count++<1000,'Controlled port flood');context.queue.shift()();}};
 context.release=()=>{context.holdOutbound=false;const node=context.nodes[0];for(const data of context.held.splice(0))if(!node.closed)node.port.onmessage?.({data});context.flush();};
 return context;
}
async function drain(context){for(let i=0;i<5;i++){await turn();context.flush();}}
async function until(context,predicate){for(let i=0;i<30;i++){await turn();if(predicate())return;context.flush();}throw Error('Controlled boundary not reached');}
function observe(promise){const result={settled:false};result.promise=promise.then(value=>Object.assign(result,{settled:true,value}),error=>Object.assign(result,{settled:true,error}));return result;}
async function create(context,options){const pending=observe(createSilentAudioPull(context,{timeoutMs:25,...options}));await drain(context);if(!pending.settled)await pending.promise;else await pending.promise;if(pending.error)throw pending.error;return pending.value;}
async function retire(context,lease){const pending=observe(lease.dispose());await drain(context);await pending.promise;if(pending.error)throw pending.error;}
function sourcePreserved(source,node){assert.equal(source.stops,0);assert(source.connections.some(row=>row[0]===source.existing));assert(!source.connections.some(row=>row[0]===node));assert(source.disconnects.every(args=>args.length===3));}
async function check(name,run){const evidence={},before=unhandled.length;try{await run(evidence);await turn();evidence.unhandledRejections=unhandled.slice(before);assert.equal(evidence.unhandledRejections.length,0,'Lifecycle produced an unhandled Promise rejection');checks.push({name,passed:true,evidence});}catch(error){evidence.unhandledRejections=unhandled.slice(before);checks.push({name,passed:false,evidence,error:error.stack});}}

for(const count of[1,5])await check(`Actual ${count}-input processor reads every channel while every output remains zero and disposal preserves source routes`,async evidence=>{
 const context=host(),outputs=Array.from({length:count},()=>new Source()),events=[],lease=await create(context,{outputs,onEvent:event=>events.push(event)}),node=context.nodes[0];
 assert.equal(node.options.numberOfInputs,count);assert.equal(node.connections[0],context.destination);
 for(const [i,output]of outputs.entries())assert(output.connections.some(row=>row[0]===node&&row[1]===0&&row[2]===i));
 const inputs=Array.from({length:count},(_,lane)=>Array.from({length:[1,2,8,3,4][lane]},(_,channel)=>new Float32Array(128).fill((lane+1)/16+channel/128)));
 const rendered=[[new Float32Array(128),new Float32Array(128)],[new Float32Array(128)]];
 for(let block=0;block<64;block++){for(const bus of rendered)for(const ch of bus)ch.fill(7);assert.equal(node.processor.process(inputs,rendered),true);for(const bus of rendered)for(const ch of bus)assert(ch.every(value=>value===0));}
 await drain(context);assert.equal(events.length,1);assert.equal(events[0].blocks,64);assert.equal(events[0].frames,8192);
 for(const [lane,bus]of inputs.entries()){const values=bus.flatMap(channel=>Array.from(channel)),power=values.reduce((sum,value)=>sum+value*value,0),metric=events[0].inputs[lane];assert.equal(metric.channels,bus.length);assert.equal(metric.frames,128);assert.equal(metric.peak,Math.max(...values));assert.equal(metric.rms,Math.sqrt(power/values.length));}
 const first=lease.dispose(),second=lease.dispose();assert.equal(first,second);await drain(context);await first;assert.equal(node.mainPosts.filter(m=>m.type==='dispose').length,1);assert.equal(node.closed,true);assert.equal(node.processor.disposed,true);assert.equal(node.processor.last.length,0);for(const output of outputs)sourcePreserved(output,node);for(const bus of rendered)for(const channel of bus)channel.fill(3);assert.equal(node.processor.process(inputs,rendered),false);for(const bus of rendered)for(const channel of bus)assert(channel.every(value=>value===0));evidence.inputChannels=inputs.map(bus=>bus.length);evidence.readQuanta=64;evidence.zeroOutputChannels=3;evidence.exactDisconnects=outputs.map(source=>source.disconnects.map(args=>args.slice(1)));evidence.sourceNodesPreserved=true;
});
await check('Abort after readiness retires the owner exactly once without clearing source routes',async evidence=>{
 const context=host(),controller=new AbortController(),source=new Source(),lease=await create(context,{outputs:[source],signal:controller.signal});controller.abort();await drain(context);await lease.dispose();assert.equal(lease.snapshot().retired,true);assert.equal(context.nodes[0].closed,true);sourcePreserved(source,context.nodes[0]);evidence.disposals=context.nodes[0].mainPosts.length;assert.equal(evidence.disposals,1);
});
await check('Abort before ready cannot activate late readiness and cleans exact routes',async evidence=>{
 const context=host({holdOutbound:true}),controller=new AbortController(),source=new Source(),pending=observe(createSilentAudioPull(context,{outputs:[source],signal:controller.signal,timeoutMs:100}));await until(context,()=>context.nodes.length===1);context.flush();controller.abort();context.flush();context.release();await drain(context);await pending.promise;assert.equal(pending.error?.name,'AbortError');assert.equal(context.nodes[0].closed,true);sourcePreserved(source,context.nodes[0]);evidence.error=pending.error.name;evidence.closedPosts=context.nodes[0].postsAfterClose;assert.equal(evidence.closedPosts.length,0);
});
await check('Owner abort while shared module loading settles promptly without waiting for that module',async evidence=>{
 const gate=deferred(),context=host({moduleGate:gate}),controller=new AbortController(),source=new Source(),pending=observe(createSilentAudioPull(context,{outputs:[source],signal:controller.signal,timeoutMs:25}));await turn();controller.abort();await drain(context);evidence.settledBeforeModule=pending.settled;evidence.nodesBeforeModule=context.nodes.length;gate.resolve();await drain(context);await pending.promise;evidence.finalError=pending.error?.name;assert.equal(pending.error?.name,'AbortError');assert.equal(evidence.nodesBeforeModule,0);assert.equal(evidence.settledBeforeModule,true,'Canceled owner remains pending behind unresolved shared addModule');
});
await check('Module-load deadline settles its caller with no node and later shared completion remains reusable',async evidence=>{
 const gate=deferred(),context=host({moduleGate:gate}),source=new Source(),pending=observe(createSilentAudioPull(context,{outputs:[source],timeoutMs:10}));await pending.promise;assert.equal(pending.error?.name,'TimeoutError');assert.match(pending.error.message,/module preparation/);assert.equal(context.nodes.length,0);gate.resolve();await drain(context);assert.equal(context.nodes.length,0);const next=await create(context,{outputs:[source]});assert.equal(context.moduleCalls,1);await retire(context,next);sourcePreserved(source,context.nodes[0]);evidence.error=pending.error.message;evidence.sharedModuleCalls=context.moduleCalls;evidence.noLateOldAllocation=true;
});
await check('Canceling one waiting owner leaves a second owner on the same module operation usable',async evidence=>{
 const gate=deferred(),context=host({moduleGate:gate}),a=new Source(),b=new Source(),controller=new AbortController(),first=observe(createSilentAudioPull(context,{outputs:[a],signal:controller.signal,timeoutMs:100})),second=observe(createSilentAudioPull(context,{outputs:[b],timeoutMs:100}));await turn();controller.abort();await drain(context);assert.equal(first.settled,true);assert.equal(first.error?.name,'AbortError');assert.equal(second.settled,false);assert.equal(context.moduleCalls,1);assert.equal(context.nodes.length,0);gate.resolve();await drain(context);await second.promise;assert.equal(second.error,undefined);assert.equal(context.nodes.length,1);assert.equal(a.connections.length,1);assert.equal(a.disconnects.length,0);assert(b.connections.some(row=>row[0]===context.nodes[0]));await retire(context,second.value);sourcePreserved(b,context.nodes[0]);evidence.firstError=first.error.name;evidence.secondActuallyReady=true;evidence.moduleCalls=context.moduleCalls;evidence.nodesAllocated=1;
});
await check('Output-array mutation during module preparation cannot change captured five-input ownership or cleanup',async evidence=>{
 const gate=deferred(),context=host({moduleGate:gate}),original=Array.from({length:5},()=>new Source()),argument=[...original],intruder=new Source(),pending=observe(createSilentAudioPull(context,{outputs:argument,timeoutMs:100}));argument.splice(0,5,intruder);gate.resolve();await drain(context);await pending.promise;assert.equal(pending.error,undefined);const node=context.nodes[0];assert.equal(node.options.numberOfInputs,5);assert.equal(pending.value.snapshot().sourceCount,5);for(const [i,source]of original.entries())assert(source.connections.some(row=>row[0]===node&&row[2]===i));assert.equal(intruder.connections.length,1);argument.length=0;await retire(context,pending.value);for(const source of original)sourcePreserved(source,node);assert.equal(intruder.disconnects.length,0);evidence.originalInputs=5;evidence.intruderNeverConnected=true;evidence.mutationDoesNotRetargetDisposal=true;
});
await check('Processor failure before readiness never posts to its closed port or starts a second disposal deadline',async evidence=>{
 const context=host({holdOutbound:true}),source=new Source(),errors=[],pending=observe(createSilentAudioPull(context,{outputs:[source],timeoutMs:20,onError:error=>errors.push(error.message)}));await until(context,()=>context.nodes.length===1);const node=context.nodes[0];node.onprocessorerror();await drain(context);evidence.settledBeforeDisposalDeadline=pending.settled;await pending.promise;evidence.closedPosts=node.postsAfterClose;evidence.error=pending.error?.message;evidence.errors=errors;assert.match(pending.error?.message||'',/processor failed/);sourcePreserved(source,node);assert.equal(node.closed,true);assert.equal(evidence.closedPosts.length,0,'Terminal processor error sends another command to closed port');assert.equal(evidence.settledBeforeDisposalDeadline,true,'Terminal processor error waits a redundant disposal timeout');
});
await check('Processor failure after readiness makes later dispose idempotent without timeout/closed-port command',async evidence=>{
 const context=host(),source=new Source(),errors=[],lease=await create(context,{outputs:[source],timeoutMs:20,onError:error=>errors.push(error.message)}),node=context.nodes[0];node.onprocessorerror();const disposal=observe(lease.dispose());await drain(context);evidence.settledBeforeDeadline=disposal.settled;await disposal.promise;evidence.disposalError=disposal.error?.name||null;evidence.closedPosts=node.postsAfterClose;evidence.errors=errors;assert.equal(lease.snapshot().retired,true);sourcePreserved(source,node);assert.equal(errors.length,1);assert.equal(node.postsAfterClose.length,0,'Already failed transport posts dispose after closing port');assert.notEqual(disposal.error?.name,'TimeoutError','Already failed transport manufactures later disposal timeout');assert.equal(evidence.settledBeforeDeadline,true);
});
await check('Processor failure while disposal ACK is outstanding settles that same promise once',async evidence=>{
 const context=host(),source=new Source(),errors=[],lease=await create(context,{outputs:[source],timeoutMs:100,onError:error=>errors.push(error.message)}),node=context.nodes[0];context.holdOutbound=true;const first=lease.dispose(),pending=observe(first);context.flush();assert.equal(node.processor.disposed,true);node.onprocessorerror();await drain(context);await pending.promise;assert.match(pending.error?.message||'',/processor failed/);assert.equal(lease.dispose(),first);assert.equal(node.mainPosts.filter(m=>m.type==='dispose').length,1);assert.equal(node.postsAfterClose.length,0);assert.equal(errors.length,1);assert.equal(node.closed,true);sourcePreserved(source,node);evidence.error=pending.error.message;evidence.disposalCommands=1;evidence.promiseStable=true;
});
await check('Readiness stall and disposal ACK stall are bounded and still detach exact graph routes',async evidence=>{
 const context=host({holdOutbound:true}),source=new Source(),pending=observe(createSilentAudioPull(context,{outputs:[source],timeoutMs:10}));await drain(context);await pending.promise;assert.equal(pending.error?.name,'TimeoutError');assert.equal(context.nodes[0].closed,true);sourcePreserved(source,context.nodes[0]);evidence.readinessError=pending.error.message;
 const second=host(),other=new Source(),lease=await create(second,{outputs:[other],timeoutMs:10});second.holdOutbound=true;const disposal=observe(lease.dispose());await drain(second);await disposal.promise;assert.equal(disposal.error?.name,'TimeoutError');assert.equal(second.nodes[0].processor.disposed,true);assert.equal(second.nodes[0].closed,true);sourcePreserved(other,second.nodes[0]);evidence.disposalError=disposal.error.message;
});
await check('Partial connection failure cleans prior routes and leaves every source external route intact',async evidence=>{
 const context=host(),outputs=Array.from({length:5},()=>new Source());outputs[2].failConnect=true;const pending=observe(createSilentAudioPull(context,{outputs,timeoutMs:25}));await drain(context);await pending.promise;assert.match(pending.error?.message||'',/connection failed/);for(const output of outputs)sourcePreserved(output,context.nodes[0]);assert.equal(context.nodes[0].closed,true);evidence.error=pending.error.message;
});
await check('Shared preparation deduplicates and failed module preparation can retry',async evidence=>{
 const gate=deferred(),context=host({moduleGate:gate}),a=prepareSilentAudioPull(context),b=prepareSilentAudioPull(context);assert.equal(a,b);assert.equal(context.moduleCalls,1);const pending=observe(a);gate.reject(Error('Module unavailable'));await pending.promise;await turn();context.audioWorklet.addModule=async()=>{context.moduleCalls++;};await prepareSilentAudioPull(context);const lease=await create(context,{outputs:[new Source()]});assert.equal(context.moduleCalls,2);await retire(context,lease);evidence.moduleCalls=context.moduleCalls;evidence.initialPromiseShared=true;evidence.retryActuallyReady=true;
});
await check('Throwing event/error callbacks do not prevent zero output or terminal cleanup',async evidence=>{
 const context=host(),source=new Source(),lease=await create(context,{outputs:[source],onEvent(){throw Error('Consumer event failure');},onError(){throw Error('Consumer error failure');}}),node=context.nodes[0],outputs=[[new Float32Array(128),new Float32Array(128)]];for(let i=0;i<64;i++)node.processor.process([[new Float32Array(128).fill(.25)]],outputs);await drain(context);assert.equal(lease.snapshot().lastPulled.blocks,64);assert.doesNotThrow(()=>node.onprocessorerror());assert.equal(node.closed,true);sourcePreserved(source,node);evidence.callbacksContained=true;
});
const hash=async path=>createHash('sha256').update(await readFile(new URL(path,import.meta.url))).digest('hex');
console.log(JSON.stringify({passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,scope:'Actual wrapper and actual processor under a controlled serial port/graph host. Every channel zero/read metrics and lifecycle only; no actual browser graph pulling, engine continuity, acoustic silence or native/vendor parity.',wrapperSHA256:await hash('../prototype/silent-audio-pull.js'),workletSHA256:await hash('../prototype/silent-audio-pull-worklet.js'),checks},null,2));if(checks.some(c=>!c.passed))process.exitCode=1;
