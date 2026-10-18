// Real attachStems + real handoff barriers; controlled renderer and clock.
// Tests ownership/rollback only. Actual audio is inspected separately.
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {AudioEngine} from '../prototype/engine.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const tick=()=>new Promise(r=>setImmediate(r)),checks=[];
function rig({previous=true,hold=null,fail=null,stop=null}={}){
 const track={id:'generated',duration:8},decks=[0,1,2].map(index=>({index,track,playing:index<2,processing:false,position:1,rate:1,reverse:false}));
 const old=decks.map(d=>({id:'old'+d.index})),prior=Array.from({length:4},()=>({duration:8})),next=Array.from({length:4},()=>({duration:8}));let generation=0;
 const e={ctx:{currentTime:10},stemBuffers:new Map(previous?[[track.id,prior]]:[]),voices:new Map(old.map((v,i)=>[i,v])),transforms:new Map(),pauseCalls:[],startCalls:[],cleared:[],
  voiceClock:d=>at=>d.position+at-10,clearDeckScratchCache(i){this.cleared.push(i);},onProcessing(){},
  pause(d){this.pauseCalls.push(d.index);d.playing=false;d.processing=false;},
  async start(d,{priorClock,positionAt,handoff}){assert.equal(priorClock,positionAt);this.startCalls.push(d.index);const controller=new AbortController(),token=++generation;d.token=token;d.processing=true;this.transforms.set(d.index,controller);handoff.watch(d.index,controller,()=>d.token===token);
   if(hold?.index===d.index)await hold.promise;
   if(stop===d.index){d.playing=false;d.processing=false;d.token++;this.voices.delete(d.index);controller.abort();}
   if(fail===d.index)throw Error('Controlled replacement failure');
   const when=await handoff.prepared(d.index,10.03);await handoff.arm(d.index);if(controller.signal.aborted)throw new DOMException('Superseded','AbortError');this.voices.set(d.index,{id:'new'+d.index,when,position:positionAt(when)});d.processing=false;this.transforms.delete(d.index);
  }};
 return{e,track,decks,old,prior,next};
}
async function test(name,run){await run();checks.push({name,passed:true});}
await test('Both playing decks retain old voices until all replacements are ready; paused deck is not resumed',async()=>{
 const hold={index:1,...deferred()},r=rig({hold});const job=AudioEngine.prototype.attachStems.call(r.e,r.track,r.next,r.decks);await tick();assert.deepEqual(r.e.startCalls,[0,1]);assert.deepEqual(r.e.pauseCalls,[]);assert.equal(r.e.voices.get(0),r.old[0]);assert.equal(r.e.voices.get(1),r.old[1]);assert(r.decks[0].playing&&r.decks[1].playing);hold.resolve();await job;assert.equal(r.e.voices.get(0).when,r.e.voices.get(1).when);assert(Math.abs(r.e.voices.get(0).position-1.1)<1e-12);assert.deepEqual(r.e.pauseCalls,[2]);assert(!r.decks[2].playing);assert.equal(r.e.stemBuffers.get(r.track.id),r.next);
});
for(const previous of [true,false])await test(`Failed replacement retains old audible voices and ${previous?'previous':'absent'} prepared cache`,async()=>{
 const r=rig({previous,fail:1});await assert.rejects(AudioEngine.prototype.attachStems.call(r.e,r.track,r.next,r.decks),/Controlled replacement failure/);for(let i=0;i<2;i++){assert.equal(r.e.voices.get(i),r.old[i]);assert(r.decks[i].playing);assert(!r.decks[i].processing);assert(!r.e.transforms.has(i));}assert.equal(r.e.stemBuffers.get(r.track.id),previous?r.prior:undefined);assert.deepEqual(r.e.pauseCalls,[]);
});
await test('Superseding Stop is retained rather than restarting a stopped deck',async()=>{
 const r=rig({stop:1});await assert.rejects(AudioEngine.prototype.attachStems.call(r.e,r.track,r.next,r.decks),{name:'AbortError'});assert(!r.decks[1].playing);assert(!r.e.voices.has(1));assert.equal(r.e.voices.get(0),r.old[0]);assert(r.decks[0].playing);assert.equal(r.e.stemBuffers.get(r.track.id),r.prior);
});
const engineSHA256=createHash('sha256').update(readFileSync(new URL('../prototype/engine.js',import.meta.url))).digest('hex');
writeFileSync(new URL('../docs/prototype/stem-activation-contract-results.json',import.meta.url),JSON.stringify({passed:true,scope:'Actual attachStems and handoff coordination with controlled renderer/clock/failure/Stop. No browser/audio/model/native/physical acceptance.',engineSHA256,checks},null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length}));
