import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
const tests=[];
async function check(name,run){try{await run();tests.push({name,passed:true});}catch(error){tests.push({name,passed:false,error:error.message});}}
function fixture(){
 const engine=new AudioEngine();engine.ctx={currentTime:10,state:'running'};
 const decks=[120,100].map((bpm,index)=>({index,track:{bpm,grid:0,duration:60},rate:120/bpm,playing:true,processing:false,position:index+1,anchorPosition:index+1,anchorTime:10,keylock:true}));
 const old=decks.map(d=>({sources:[],gridTimeline:{bpm:120,clock:()=>d.position,rateAt:()=>120/d.track.bpm}}));
 decks.forEach((d,i)=>engine.voices.set(i,old[i]));
 engine.start=async(d,{handoff})=>{
  const controller=new AbortController(),token=(engine.startTokens.get(d.index)||0)+1;
  engine.startTokens.set(d.index,token);engine.transforms.set(d.index,controller);d.processing=true;
  handoff.watch(d.index,controller,()=>engine.startTokens.get(d.index)===token);
  await new Promise((resolve,reject)=>controller.signal.addEventListener('abort',()=>reject(new DOMException('Controlled preparation cancelled','AbortError')),{once:true}));
 };
 return {engine,decks,old,begin:()=>engine.setSyncedRates(decks.map(d=>({deck:d,rate:127.2/d.track.bpm})))};
}
await check('Stopping one prepared group member restores its nominal rate and retains the other audible owner',async()=>{
 const f=fixture(),pending=f.begin();f.engine.pause(f.decks[0]);await assert.rejects(pending,{name:'AbortError'});
 assert.equal(f.decks[0].rate,1);assert.equal(f.decks[1].rate,1.2);assert(!f.decks[0].playing&&!f.decks[0].processing);assert.equal(f.engine.voices.get(1),f.old[1]);assert(f.decks[1].playing&&!f.decks[1].processing);
});
await check('A replaced track is not rolled back by its cancelled previous group',async()=>{
 const f=fixture(),pending=f.begin();f.engine.pause(f.decks[0]);f.decks[0].track={bpm:128,duration:60};f.decks[0].rate=1.06;await assert.rejects(pending,{name:'AbortError'});assert.equal(f.decks[0].rate,1.06);assert.equal(f.decks[1].rate,1.2);
});
await check('A newer paused request for the same rate retains its own authority',async()=>{
 const f=fixture(),pending=f.begin();f.engine.pause(f.decks[0]);await f.engine.setRate(f.decks[0],1.06,{syncInternal:true});await assert.rejects(pending,{name:'AbortError'});assert.equal(f.decks[0].rate,1.06);
});
await check('A newer playing transport is not mutated by its cancelled previous group',async()=>{
 const f=fixture(),pending=f.begin(),d=f.decks[0];f.engine.pause(d);const next={sources:[],gridTimeline:{bpm:127.2,clock:()=>2,rateAt:()=>1.06}};f.engine.voices.set(0,next);d.playing=true;f.engine.startTokens.set(0,f.engine.startTokens.get(0)+1);await assert.rejects(pending,{name:'AbortError'});assert.equal(d.rate,1.06);assert.equal(f.engine.voices.get(0),next);assert(d.playing);
});
await check('Ordinary preparation failure restores nominal rates without retiring current audible voices',async()=>{
 const f=fixture(),pending=f.begin();f.engine.transforms.get(0).abort();await assert.rejects(pending,{name:'AbortError'});assert.deepEqual(f.decks.map(d=>d.rate),[1,1.2]);assert.equal(f.engine.voices.get(0),f.old[0]);assert.equal(f.engine.voices.get(1),f.old[1]);
});
console.log(JSON.stringify({passed:tests.every(t=>t.passed),scope:'Actual AudioEngine group rollback, pause and newer setRate with controlled preparation collaborators; actual browser/audio verified separately.',tests},null,2));if(tests.some(t=>!t.passed))process.exitCode=1;
