// Real engine coordination with controlled staged bank completion, no audio claim.
import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};},tick=()=>new Promise(resolve=>setImmediate(resolve));
function rig(){
 const track={id:'owned',duration:8},buffers=Array.from({length:4},()=>({duration:8})),holds=[deferred(),deferred()];
 const prior=Array.from({length:4},()=>({duration:8,prior:true})),decks=[0,1].map(index=>({index,track,playing:true,processing:false,position:2})),leases=[];
 const voices=decks.map((d,i)=>({reservedStems:true,stemsReady:false,liveOwnerController:new AbortController(),liveKeylock:{reservedStems:true,prepareStemReplacement:async(_buffers,{signal})=>{
  await Promise.race([holds[i].promise,new Promise((_,reject)=>{if(signal.aborted)reject(new DOMException('Cancelled','AbortError'));else signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true});})]);
  const lease={cancelled:false,committed:false,validate(){assert(!this.cancelled);},cancel(){if(!this.committed)this.cancelled=true;},commit({when}){this.validate();this.committed=true;this.when=when;}};leases[i]=lease;return lease;
 }}}));
 const engine={ctx:{currentTime:10},voices:new Map(voices.map((v,i)=>[i,v])),stemBuffers:new Map([[track.id,prior]]),transforms:new Map(),updated:[],
  voiceClock:d=>()=>d.position,clearDeckScratchCache(){},start(){throw Error('Unexpected cold replacement');},pause(){throw Error('Unexpected pause');},onProcessing(){},
  updateStems(d){this.updated.push(d.index);assert(this.voices.get(d.index).stemsReady);}};
 return{engine,track,buffers,prior,decks,voices,holds,leases};
}
const checks=[];async function check(name,run){await run();checks.push({name,passed:true});}
await check('Two banks publish one cache and switch time only after every owner is prepared',async()=>{
 const r=rig(),job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks);await tick();r.holds[0].resolve();await tick();assert(r.voices.every(v=>!v.stemsReady));assert.equal(r.engine.stemBuffers.get(r.track.id),r.prior);assert(!r.leases[0].committed);r.holds[1].resolve();await job;assert.deepEqual(r.engine.updated,[0,1]);assert(r.voices.every(v=>v.stemsReady));assert(r.leases.every(s=>s.committed));assert.equal(r.leases[0].when,r.leases[1].when);assert.equal(r.engine.stemBuffers.get(r.track.id),r.buffers);r.voices.forEach((v,i)=>assert.equal(r.engine.voices.get(i),v));
});
await check('Failed stage keeps prior cache and audible owners without committing a sibling bank',async()=>{
 const r=rig();r.voices[1].liveKeylock.prepareStemReplacement=async()=>{throw Error('Controlled transfer failure');};const job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks);r.holds[0].resolve();await assert.rejects(job,/Controlled transfer failure/);assert.equal(r.engine.stemBuffers.get(r.track.id),r.prior);assert(r.voices.every(v=>!v.stemsReady));assert(r.leases.filter(Boolean).every(s=>!s.committed));assert.deepEqual(r.engine.updated,[]);
});
await check('Late Stop aborts all staged owners without stale readiness or cache publication',async()=>{
 const r=rig(),job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks);await tick();r.holds[0].resolve();await tick();r.decks[0].playing=false;r.engine.voices.delete(0);r.voices[0].liveOwnerController.abort();r.holds[1].resolve();await assert.rejects(job,{name:'AbortError'});assert(!r.engine.voices.has(0));assert.equal(r.engine.stemBuffers.get(r.track.id),r.prior);assert(r.leases.filter(Boolean).every(s=>s.cancelled&&!s.committed));assert.deepEqual(r.engine.updated,[]);
});
await check('Preparation cancellation discards a ready sibling bank while its prior live routes stay ready',async()=>{
 const r=rig(),controller=new AbortController();r.voices.forEach(v=>v.stemsReady=true);const job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks,{signal:controller.signal});await tick();r.holds[0].resolve();await tick();controller.abort();await assert.rejects(job,{name:'AbortError'});assert.equal(r.engine.stemBuffers.get(r.track.id),r.prior);assert(r.voices.every(v=>v.stemsReady));assert(r.leases.filter(Boolean).every(s=>s.cancelled&&!s.committed));assert.deepEqual(r.engine.updated,[]);
});
await check('Mixed cold/staged owners share readiness so a failed bank cannot commit a cold voice',async()=>{
 const r=rig();r.voices[1].liveKeylock=null;let committed=false;
 r.engine.start=async(d,{handoff,preparedStems})=>{assert.equal(preparedStems,r.buffers);assert.equal(r.engine.stemBuffers.get(r.track.id),r.prior);const controller=new AbortController();handoff.watch(d.index,controller,()=>!controller.signal.aborted);await handoff.prepared(d.index,10.01);await handoff.arm(d.index);committed=true;};
 r.voices[0].liveKeylock.prepareStemReplacement=async()=>{throw Error('Controlled bank failure');};await assert.rejects(AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks),/Controlled bank failure/);assert(!committed);assert.equal(r.engine.voices.get(1),r.voices[1]);assert.equal(r.engine.stemBuffers.get(r.track.id),r.prior);
});
console.log(JSON.stringify({passed:true,scope:'Actual attachStems staged-bank ownership and cache coordination with controlled RPCs; not browser/DSP/physical acceptance.',checks},null,2));
