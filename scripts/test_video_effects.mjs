import assert from "node:assert/strict";
import fs from "node:fs";
import { videoEffectCatalog, createVideoEffects, videoEffectCapabilities } from "../prototype/video-effects.js";
import { normalizeVideoContext, normalizeVideoSpec, createVideoEffectState,
  planVideoEffectFrame, videoEffectUniforms, videoHistoryLayers } from "../prototype/video-effects-state.js";
import { videoFragmentShader } from "../prototype/video-effects-shaders.js";
let passed=0;
function test(name,fn){const detail=fn();passed++;console.log("PASS",name,detail??"");}
const context=(time,extra={})=>normalizeVideoContext({time,bpm:120,...extra});
const spec=(name,value=1,params={})=>normalizeVideoSpec({name,on:true,value,params});
test("catalog matches all47 manifest names plus8 separately flagged localization candidates",()=>{
 const source=JSON.parse(fs.readFileSync(new URL("../docs/research/video-catalog-evaluation.json",import.meta.url)));
 assert.deepEqual(videoEffectCatalog.map(e=>e.name),[...source.effects,...source.localizedEffectCandidates].map(e=>e.name));
 assert.equal(videoEffectCatalog.filter(e=>!e.candidateOnly).length,47);
 assert.equal(videoEffectCatalog.filter(e=>e.candidateOnly).length,8);
 for(const e of videoEffectCatalog){assert.equal(e.referenceRuntimeVerified,false);assert(e.contract&&e.parameterStatus&&e.sourceStatus);assert(e.default.value>=0&&e.default.value<=1);}
 return "55 independent algorithms; reference availability/mappings remain unverified";
});
test("each catalog algorithm has an explicit original shader dispatch path",()=>{
 const ids=new Set([...videoFragmentShader.matchAll(/effect\s*==\s*(\d+)/g)].map(m=>Number(m[1])));
 assert.deepEqual([...ids].sort((a,b)=>a-b),videoEffectCatalog.map(e=>e.id));
 return "Static branch coverage only; actual shader compilation/pixels require browser suite";
});
test("spec and context sanitize numbers and reject unsupported names",()=>{
 assert.equal(spec("Gamma",5).value,1);assert.equal(spec("Gamma",-3).value,0);
 assert.equal(normalizeVideoSpec({name:"Unknown",on:false}),null);
 assert.throws(()=>spec("Unknown"),/Unknown independent/);
 const c=context(1,{bpm:0,bass:2,mid:-1,treble:NaN,rate:-9,upfader:NaN});
 assert.deepEqual(c.bands,[1,0,0]);assert.equal(c.bpm,20);assert.equal(c.rate,-4);assert.equal(c.upfader,1);
});
test("freeze captures once and preserves its capture identity across amount changes",()=>{
 const state=createVideoEffectState("Frame Freeze");
 assert.equal(planVideoEffectFrame(state,spec("Frame Freeze",0),context(0)).captureHold,false);
 assert.equal(planVideoEffectFrame(state,spec("Frame Freeze",.5),context(1)).captureHold,true);
 assert.equal(planVideoEffectFrame(state,spec("Frame Freeze",1),context(2)).captureHold,false);
 assert.equal(planVideoEffectFrame(state,spec("Frame Freeze",.25),context(3)).captureHold,false);
 assert.equal(planVideoEffectFrame(state,spec("Frame Freeze",1,{captureToken:1}),context(4)).captureHold,true);
});
test("freeze planner drives an actual retained-frame capture collaborator",()=>{
 const state=createVideoEffectState("Frame Freeze");let capture=null;
 const run=(frame,value,token=0)=>{const p=planVideoEffectFrame(state,spec("Frame Freeze",value,{captureToken:token}),context(frame.time));if(p.captureHold)capture=frame.pixels.slice();return capture;};
 assert.deepEqual(run({time:0,pixels:[255,0,0,255]},1),[255,0,0,255]);
 assert.deepEqual(run({time:1,pixels:[0,0,255,255]},.5),[255,0,0,255]);
 assert.deepEqual(run({time:2,pixels:[0,0,255,255]},1,1),[0,0,255,255]);
 return "Executed capture lifecycle with an in-memory frame collaborator, not GPU pixels";
});
test("beat pulse captures at declared120BPM cycle boundaries and respects reduced motion",()=>{
 const s=createVideoEffectState("Frame Pulse"),p=spec("Frame Pulse");
 assert(planVideoEffectFrame(s,p,context(0)).captureHold);
 assert(!planVideoEffectFrame(s,p,context(.2)).captureHold);
 assert(planVideoEffectFrame(s,p,context(.5)).captureHold);
 assert(!planVideoEffectFrame(s,p,context(1,{reducedMotion:true})).captureHold);
 assert(planVideoEffectFrame(s,p,context(1.5)).captureHold);
});
test("delay history samples actual timestamps at bounded cadence and selects older frames",()=>{
 const s=createVideoEffectState("Delay Grid"),p=spec("Delay Grid");
 assert.equal(planVideoEffectFrame(s,p,context(0)).captureHistoryLayer,0);
 assert.equal(planVideoEffectFrame(s,p,context(.05)).captureHistoryLayer,null);
 assert.equal(planVideoEffectFrame(s,p,context(.125)).captureHistoryLayer,1);
 const plan=planVideoEffectFrame(s,p,context(.25));
 assert.equal(plan.captureHistoryLayer,2);assert.deepEqual(plan.historyLayers.slice(0,4),[2,1,0,0]);
});
test("irregular frame arrival selects timestamps instead of fabricating missing history",()=>{
 const times=[0,.1,.4,.7,...Array(12).fill(null)];
 assert.deepEqual(videoHistoryLayers(times,.7,.2).slice(0,5),[3,2,1,1,0]);
 const s=createVideoEffectState("Delay Grid"),p=spec("Delay Grid");
 planVideoEffectFrame(s,p,context(0));planVideoEffectFrame(s,p,context(3));
 assert.equal(s.historyTimes.filter(v=>v!==null).length,2);
});
test("delay retains only16 samples after long runs and parameter changes do not erase history",()=>{
 const s=createVideoEffectState("Delay Grid");
 for(let i=0;i<1000;i++)planVideoEffectFrame(s,spec("Delay Grid"),context(i*.125));
 assert.equal(s.historyTimes.length,16);assert.equal(s.historyTimes.filter(v=>v!==null).length,16);
 assert(Math.min(...s.historyTimes)>120);
 const old=s.historyTimes.slice();planVideoEffectFrame(s,spec("Delay Grid",.4,{columns:8,delaySeconds:.5}),context(999*.125));
 assert.deepEqual(s.historyTimes,old);
});
test("duplicate frame IDs do not allocate duplicate temporal samples",()=>{
 const s=createVideoEffectState("Delay Grid"),p=spec("Delay Grid");
 planVideoEffectFrame(s,p,context(0,{frameId:1}));
 assert.equal(planVideoEffectFrame(s,p,context(.5,{frameId:1})).captureHistoryLayer,null);
 assert.equal(s.historyTimes.filter(v=>v!==null).length,1);
});
test("backward source time resets capture/history rather than leaking the prior timeline",()=>{
 const s=createVideoEffectState("Frame Freeze");planVideoEffectFrame(s,spec("Frame Freeze"),context(3));
 assert(planVideoEffectFrame(s,spec("Frame Freeze"),context(1)).captureHold);
 const h=createVideoEffectState("Delay Grid");planVideoEffectFrame(h,spec("Delay Grid"),context(3));
 planVideoEffectFrame(h,spec("Delay Grid"),context(1));
 assert.deepEqual(h.historyTimes.filter(v=>v!==null),[1]);
});
test("record position integrates signed rate and remains fixed when stopped",()=>{
 const s=createVideoEffectState("Record Rotate"),p=spec("Record Rotate");
 planVideoEffectFrame(s,p,context(0,{rate:1}));planVideoEffectFrame(s,p,context(1,{rate:1}));assert.equal(s.recordPosition,1);
 planVideoEffectFrame(s,p,context(2,{rate:0}));assert.equal(s.recordPosition,1);
 planVideoEffectFrame(s,p,context(3,{rate:-1}));assert.equal(s.recordPosition,0);
 planVideoEffectFrame(s,p,context(4,{position:7}));assert.equal(s.recordPosition,7);
});
test("block-column springs follow distinct supplied bands, stay bounded and decay in silence",()=>{
 const s=createVideoEffectState("Block Columns"),p=spec("Block Columns");
 for(let i=0;i<240;i++)planVideoEffectFrame(s,p,context(i/60,{bass:1,mid:0,treble:0}));
 assert(s.columns[0]>.99);assert.equal(s.columns[1],0);assert.equal(s.columns[2],0);
 for(let i=240;i<480;i++)planVideoEffectFrame(s,p,context(i/60,{bass:0,mid:0,treble:0}));
 assert(s.columns[0]<.001);assert(s.columns.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
});
test("effect states are independent across two slots/renderers",()=>{
 const a=createVideoEffectState("Frame Freeze"),b=createVideoEffectState("Frame Freeze");
 planVideoEffectFrame(a,spec("Frame Freeze"),context(0));assert.equal(b.holdCaptured,false);
 const h=createVideoEffectState("Delay Grid"),other=createVideoEffectState("Delay Grid");
 planVideoEffectFrame(h,spec("Delay Grid"),context(1));assert(other.historyTimes.every(v=>v===null));
});
test("uniform conversion preserves declared channel controls, clamps kernels and keeps geometry finite",()=>{
 assert.deepEqual(videoEffectUniforms(spec("RGB Eq",1,{red:2,green:1,blue:.5})),[2,1,.5,0]);
 assert.deepEqual(videoEffectUniforms(spec("Mirror",1,{axis:"Both"})),[2,0,0,0]);
 assert.equal(videoEffectUniforms(spec("Filter",1,{radius:1000}))[1],24);
 for(const e of videoEffectCatalog)assert(videoEffectUniforms(spec(e.name)).every(Number.isFinite));
});
test("unsupported headless execution and excessive output resolution fail honestly",()=>{
 assert.equal(videoEffectCapabilities.slots,2);assert.equal(videoEffectCapabilities.historySamples,16);
 assert.throws(()=>createVideoEffects({width:0,height:64}),/positive integer/);
 assert.throws(()=>createVideoEffects({width:4096,height:4096}),/pixel budget/);
 assert.throws(()=>createVideoEffects(),/browser canvas with WebGL2/);
});
console.log(`${passed}/${passed} independent Video FX catalog/state checks passed.`);
console.log("Scope: executed JS lifecycle/clock/history planning and static shader dispatch coverage. Actual GPU compilation, pixel transforms, alpha and frame routing require prototype/video-effects-test.html.");
