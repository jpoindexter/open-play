import assert from 'node:assert/strict';
import {createStemWaveformModel,paintStemOverview,paintStemDetail,paintOriginalOverview,paintOriginalDetail} from '../prototype/stem-waveform.js';
const checks=[];
async function test(name,run){await run();checks.push({name,passed:true});}
function audio(channels,rate=1024){const arrays=channels.map(c=>Float32Array.from(c));return {length:arrays[0].length,numberOfChannels:arrays.length,sampleRate:rate,duration:arrays[0].length/rate,getChannelData:i=>arrays[i]};}
function fixture(length=4096){
 const seq=Array.from({length},(_,i)=>Math.sin(i*.17)*.08),neg=seq.map(v=>-v),right=seq.map((v,i)=>i%3?v*.5:0),zero=seq.map(()=>0);
 return {original:audio([seq.map(v=>v*.2),seq.map(v=>v*.3)]),stems:[audio([seq,seq]),audio([neg,neg]),audio([zero,right]),audio([seq.map(v=>v*.2)])]};
}
const select=(model,f,mask,extra={})=>model.select({...f,enabled:[0,1,2,3].map(i=>!!(mask&(1<<i))),...extra});
async function ready(model,f,mask){let v=select(model,f,mask);if(v.ready)await v.ready;return select(model,f,mask);}
function expected(f,mask,from,to){let peak=0;for(let i=Math.max(0,from);i<Math.min(to,f.original.length);i++)for(let c=0;c<2;c++){let sum=0;for(let s=0;s<4;s++)if(mask&(1<<s)){const b=f.stems[s];sum+=b.getChannelData(Math.min(c,b.numberOfChannels-1))[i];}peak=Math.max(peak,Math.abs(sum));}return peak;}
await test('Every ordinary subset matches independent sample-first stereo sum; all-on preserves original route',async()=>{
 const f=fixture(),model=createStemWaveformModel({yieldTask:async()=>{}});
 for(let mask=0;mask<15;mask++){const v=await ready(model,f,mask);assert.equal(v.kind,'stems');for(const [from,to]of [[0,4096],[3,37],[255,259],[1024,2048],[4031,4096]])assert.ok(Math.abs(v.profile.peak(from/1024,to/1024)-expected(f,mask,from,to))<1e-8,`mask ${mask}, frames ${from}..${to}`);}
 assert.equal(select(model,f,15).kind,'original');assert.equal(model.diagnostics().cacheEntries,4);model.dispose();
});
await test('Decoded stems may have a different rate from original; source time stays aligned',async()=>{
 const f=fixture(4096),model=createStemWaveformModel();f.original=audio([Array(2048).fill(.01)],512);const v=await ready(model,f,4);assert.equal(v.kind,'stems');assert.equal(v.profile.sampleRate,1024);assert.equal(v.profile.duration,4);assert.ok(Math.abs(v.profile.peak(1,2)-expected(f,4,1024,2048))<1e-8);model.dispose();
});
await test('Cancellation across sources occurs BEFORE absolute value; mono upmix and right-only PCM survive',async()=>{
 const f=fixture(),model=createStemWaveformModel();const cancel=await ready(model,f,3);assert.equal(cancel.profile.peak(0,4),0);const right=await ready(model,f,4);assert.ok(right.profile.peak(0,4)>.039);const mono=await ready(model,f,8);assert.ok(mono.profile.peak(0,4)>.015);model.dispose();
});
await test('Window queries exclude adjacent-block impulses, clamp edges and reject nonfinite windows',async()=>{
 const f=fixture(512);for(const b of f.stems)for(let c=0;c<b.numberOfChannels;c++)b.getChannelData(c).fill(0);f.stems[0].getChannelData(1)[255]=.75;
 const model=createStemWaveformModel();const {profile}=await ready(model,f,1);assert.equal(profile.peak(0,255/1024),0);assert.equal(profile.peak(256/1024,512/1024),0);assert.equal(profile.peak(255/1024,256/1024),.75);assert.equal(profile.peak(-1,2),.75);for(const pair of [[NaN,1],[0,Infinity],[1,0],[-2,-1],[1,2]])assert.equal(profile.peak(...pair),0);model.dispose();
});
await test('All muted is immediate zero without scanning PCM or scheduling a chunk',async()=>{
 const f=fixture(),model=createStemWaveformModel();f.stems[0].getChannelData(0)[3]=NaN;const v=select(model,f,0);assert.equal(v.kind,'stems');assert.equal(v.profile.peak(0,4),0);assert.equal(model.diagnostics().chunks,0);model.dispose();
});
await test('Unaligned geometry and selected nonfinite PCM expose original-context boundary, no false mix',async()=>{
 const f=fixture(),model=createStemWaveformModel();f.stems[2]=audio([[0,0]],1024);assert.match(select(model,f,1).label,/unaligned/);assert.equal(select(model,f,1).profile,null);
 const corrupt=fixture();corrupt.stems[0].getChannelData(1)[14]=Infinity;const v=select(model,corrupt,1);assert.equal(await v.ready,null);assert.match(select(model,corrupt,1).label,/nonfinite/);model.dispose();
});
await test('No prepared stems, FX/tails and dual-clock Slip retain explicitly labeled original context',async()=>{
 const model=createStemWaveformModel(),f=fixture();assert.equal(model.select({original:f.original}).kind,'original');for(const extra of [{stemFX:[true]},{exitActive:true},{stemSlip:'vocal'}]){const v=select(model,f,1,extra);assert.equal(v.kind,'context');assert.match(v.label,/not shown/);assert.equal(v.profile,null);}model.dispose();
});
await test('Selection/reload/disposal cancels pending promise and obsolete job cannot populate cache',async()=>{
 const gate=[];const f=fixture(4096),model=createStemWaveformModel({blockFrames:16,chunkFrames:16,yieldTask:()=>new Promise(r=>gate.push(r))});
 const first=select(model,f,1);await Promise.resolve();assert.equal(gate.length,1);const second=select(model,f,2);assert.equal(await first.ready,null);await Promise.resolve();model.select({...fixture(),enabled:[true,false,false,false]});assert.equal(await second.ready,null);model.dispose();for(const r of gate)r();await Promise.resolve();assert.equal(model.diagnostics().cacheEntries,0);assert.equal(model.diagnostics().pending,false);assert.equal(model.diagnostics().canceled,3);
});
await test('Cache eviction/reentry is bounded and cache hits never rescan; pending promises are not retained',async()=>{
 const f=fixture(),model=createStemWaveformModel({maxProfiles:4,yieldTask:async()=>{}});for(let round=0;round<3;round++)for(let mask=1;mask<15;mask++){await ready(model,f,mask);assert.ok(model.diagnostics().cacheEntries<=4);assert.equal(model.diagnostics().retainedViewCount,0);}
 const before=model.diagnostics();await ready(model,f,14);assert.equal(model.diagnostics().processedFrames,before.processedFrames);await ready(model,f,1);assert.equal(model.diagnostics().started,before.started+1);assert.equal(model.diagnostics().cacheEntries,4);model.dispose();
});
await test('Production overview and detail painting both derive bars from selected surviving PCM',async()=>{
 const f=fixture(),model=createStemWaveformModel(),rects=[];const ctx={fillStyle:'',fillRect(...r){rects.push(r);}};
 const silent=(await ready(model,f,3)).profile;paintStemOverview(ctx,silent,{width:90,height:100});paintStemDetail(ctx,silent,{width:80,height:100,position:2});assert.ok(rects.every(r=>r[2]===0||r[3]===0));rects.length=0;
 const right=(await ready(model,f,4)).profile;paintStemOverview(ctx,right,{width:90,height:100});assert.ok(rects.some(r=>r[3]>5));rects.length=0;paintStemDetail(ctx,right,{width:80,height:100,position:2});assert.ok(rects.some(r=>r[2]>1));model.dispose();
});
await test('Prepared padding beyond original end cannot leak bars or interval peaks',async()=>{
 const original=audio([Array(1024).fill(0)],1024),padding=audio([Array.from({length:1100},(_,i)=>i>=1024?.5:0)],1024),f={original,stems:[padding,padding,padding,padding]},model=createStemWaveformModel();
 const v=await ready(model,f,1);assert.equal(v.kind,'stems');assert.equal(v.profile.peak(1.04,1.06),0);assert.equal(v.profile.peak(.99,1.1),0);assert.equal(v.profile.peak(0,2),0);const rects=[],ctx={fillRect(...r){rects.push(r);}};paintStemDetail(ctx,v.profile,{width:100,height:100,position:1.05});assert.ok(rects.every(r=>r[2]===0));model.dispose();
});
await test('Actual original painters show no-stems/all-on right-only and opposite-polarity stereo sources',()=>{
 const right=audio([Array(4096).fill(0),Array(4096).fill(.5)]),opposite=audio([Array(4096).fill(.5),Array(4096).fill(-.5)]);
 for(const buffer of [right,opposite]){const rects=[],ctx={fillRect(...r){rects.push(r);}};paintOriginalOverview(ctx,buffer,{width:90,height:100});assert.ok(rects.some(r=>r[3]>20));rects.length=0;paintOriginalDetail(ctx,buffer,{width:100,height:100,position:2});assert.ok(rects.some(r=>r[2]>20));}
});
console.log(JSON.stringify({passed:checks.length,failed:0,checks,scope:'Executed source-domain PCM, cache/async lifecycle and actual production bar-drawing calls; no browser pixels, actual Web Audio or vendor musical parity established.'},null,2));
