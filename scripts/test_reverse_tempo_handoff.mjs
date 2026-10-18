import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
const tests=[];
async function check(name,run){try{await run();tests.push({name,passed:true});}catch(error){tests.push({name,passed:false,error:error.message});}}
function fixture({directions=[true],keyed=false,fail=false}={}){
 const engine=new AudioEngine();engine.ctx={currentTime:10,state:'running'};
 const decks=directions.map((reverse,index)=>({index,track:{bpm:120,grid:0,duration:60},rate:1,playing:true,position:index+2,anchorPosition:index+2,anchorTime:10,keylock:keyed,keyShift:keyed?3:0,reverse}));
 const old=decks.map(d=>({sources:[],gridTimeline:{bpm:120,reverse:d.reverse,clock:()=>d.position,rateAt:()=>1}}));decks.forEach((d,i)=>engine.voices.set(i,old[i]));
 let release;const gate=new Promise(r=>release=r),starts=[];
 engine.start=async(d,{handoff}={})=>{
  const controller=new AbortController(),token=(engine.startTokens.get(d.index)||0)+1;engine.startTokens.set(d.index,token);engine.transforms.set(d.index,controller);
  starts.push({deck:d.index,grouped:!!handoff,oldVoiceRetained:engine.voices.get(d.index)===old[d.index]});handoff?.watch(d.index,controller,()=>engine.startTokens.get(d.index)===token);
  await gate;if(fail)throw Error('Controlled reverse preparation failure');
  const when=handoff?await handoff.prepared(d.index,10.2):10.2;if(handoff)await handoff.arm(d.index);
  d.anchorTime=when;d.playing=true;engine.voices.set(d.index,{sources:[],gridTimeline:{bpm:127.2,clock:()=>d.position,rateAt:()=>1.06}});
 };
 return{engine,decks,old,starts,release,begin:()=>engine.setSyncedRates(decks.map(deck=>({deck,rate:1.06})))};
}
await check('Reverse warped tempo retains audible voice while replacement prepares at a future handoff',async()=>{
 const f=fixture(),pending=f.begin(),retained=f.engine.voices.get(0)===f.old[0];f.release();await pending;
 assert(retained);assert(f.starts[0].grouped&&f.starts[0].oldVoiceRetained);assert.equal(f.decks[0].anchorTime,10.2);
});
await check('Mixed forward/reverse keyed members share one prepared future start without early retirement',async()=>{
 const f=fixture({directions:[false,true],keyed:true}),pending=f.begin(),retained=f.decks.every(d=>f.engine.voices.get(d.index)===f.old[d.index]);f.release();await pending;
 assert(retained);assert(f.starts.every(s=>s.grouped&&s.oldVoiceRetained));assert.deepEqual(f.decks.map(d=>d.anchorTime),[10.2,10.2]);
});
await check('Reverse preparation failure retains audible owner and restores the uncommitted rate',async()=>{
 const f=fixture({keyed:true,fail:true}),pending=f.begin();f.release();await assert.rejects(pending,/Controlled reverse preparation failure/);
 assert.equal(f.engine.voices.get(0),f.old[0]);assert.equal(f.decks[0].rate,1);assert(f.decks[0].playing);
});
console.log(JSON.stringify({passed:tests.every(t=>t.passed),scope:'Actual AudioEngine reverse-rate group selection/barriers/rollback with controlled preparation; no audio/native proof. Actual GUI/PCM verified separately.',tests},null,2));if(tests.some(t=>!t.passed))process.exitCode=1;
