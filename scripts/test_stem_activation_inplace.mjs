// Real engine attach coordination; controlled replacement RPCs/voices, no audio claim.
import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};},tick=()=>new Promise(resolve=>setImmediate(resolve));
function rig(){
 const track={id:'owned',duration:8},buffers=Array.from({length:4},()=>({duration:8})),holds=[deferred(),deferred()];
 const decks=[0,1].map(index=>({index,track,playing:true,processing:false,position:2}));
 const voices=decks.map((d,i)=>({reservedStems:true,stemsReady:false,liveKeylock:{reservedStems:true,replaceStems:()=>holds[i].promise}}));
 const engine={ctx:{currentTime:10},voices:new Map(voices.map((v,i)=>[i,v])),stemBuffers:new Map(),transforms:new Map(),updated:[],
  voiceClock:d=>()=>d.position,clearDeckScratchCache(){},start(){throw Error('Unexpected cold replacement');},pause(){throw Error('Unexpected pause');},onProcessing(){},
  updateStems(d){this.updated.push(d.index);assert(this.voices.get(d.index).stemsReady);}};
 return{engine,track,buffers,decks,voices,holds};
}
const checks=[];async function check(name,run){await run();checks.push({name,passed:true});}
await check('Both owners retain their voices and publish readiness only after every transfer',async()=>{
 const r=rig(),job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks);await tick();r.holds[0].resolve();await tick();assert(r.voices.every(v=>!v.stemsReady));r.holds[1].resolve();await job;assert.deepEqual(r.engine.updated,[0,1]);assert(r.voices.every(v=>v.stemsReady));assert(r.decks.every(d=>d.playing&&!d.processing));r.voices.forEach((v,i)=>assert.equal(r.engine.voices.get(i),v));
});
await check('Rejected replacement rolls back cache and leaves both original routes pending',async()=>{
 const r=rig();r.voices[1].liveKeylock.replaceStems=async()=>{throw Error('Controlled transfer failure');};const job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks);r.holds[0].resolve();await assert.rejects(job,/Controlled transfer failure/);assert(!r.engine.stemBuffers.has(r.track.id));assert(r.voices.every(v=>!v.stemsReady));assert.deepEqual(r.engine.updated,[]);
});
await check('Stop after one owner finishes but before its sibling cannot publish stale readiness',async()=>{
 const r=rig(),job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.buffers,r.decks);await tick();r.holds[0].resolve();await tick();r.decks[0].playing=false;r.engine.voices.delete(0);r.holds[1].resolve();await assert.rejects(job,{name:'AbortError'});assert(!r.engine.voices.has(0));assert(!r.engine.stemBuffers.has(r.track.id));assert(r.voices.every(v=>!v.stemsReady));assert.deepEqual(r.engine.updated,[]);
});
console.log(JSON.stringify({passed:true,scope:'Actual attachStems ownership and rollback with controlled RPC completion; not browser/DSP/physical acceptance.',checks},null,2));
