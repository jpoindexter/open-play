// Actual attachStems with a controlled cold voice/audio clock; no DSP claim.
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {AudioEngine} from '../prototype/engine.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
function rig(){
 const track={id:'owned',duration:8},deck={index:0,track,playing:true,processing:false},old={name:'old'},next=Array.from({length:4},()=>({duration:8}));
 const engine={ctx:{currentTime:10,state:'running'},voices:new Map([[0,old]]),stemBuffers:new Map(),transforms:new Map(),voiceClock:()=>at=>at-9,
  clearDeckScratchCache(){},onProcessing(){},pause(){throw Error('Unexpected pause');},
  async start(d,{handoff,preparedStems}){assert.equal(preparedStems,next);const controller=new AbortController();handoff.watch(0,controller,()=>this.voices.has(0));const when=await handoff.prepared(0,10.03);await handoff.arm(0);this.voices.set(0,{handoffBefore:{until:when,owner:old}});}};
 return{engine,track,deck,next};
}
const checks=[];
{
 const r=rig();let returned=false;const job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.next,[r.deck]).then(()=>returned=true);
 await tick();assert.equal(r.engine.stemBuffers.get(r.track.id),r.next);assert(!returned,'Ready preceded audible handover');r.engine.ctx.currentTime=10.105;
 await tick();assert(!returned,'Ready preceded the end of the10ms handover fade');r.engine.ctx.currentTime=10.12;await job;assert(returned);
 checks.push({name:'Committed cache is available, but attachment resolves only after audible handover/fade',passed:true});
}
{
 const r=rig();let returned=false;const job=AudioEngine.prototype.attachStems.call(r.engine,r.track,r.next,[r.deck]).then(()=>returned=true);
 await tick();assert(!returned);r.deck.playing=false;r.engine.voices.delete(0);await job;assert(!r.engine.voices.has(0));assert(!r.deck.playing);assert.equal(r.engine.stemBuffers.get(r.track.id),r.next);
 checks.push({name:'Stop during committed handover exits readiness wait without restarting or rolling back the prepared cache',passed:true});
}
const result={checkpoint:148,passed:true,scope:'Real attachStems with controlled clock/cold voice; no browser/audio/native acceptance.',engineSHA256:createHash('sha256').update(readFileSync(new URL('../prototype/engine.js',import.meta.url))).digest('hex'),checks};
writeFileSync(process.argv[2]||new URL('../docs/prototype/stem-ready-contract-148-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));
