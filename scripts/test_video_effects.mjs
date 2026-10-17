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
test("Analyzer context keeps eight exact independent values detached from legacy bands",()=>{
 const input=[0,.125,.25,.375,.5,.625,.75,1],c=context(1,{bass:.2,mid:.3,treble:.4,spectrum8:input});
 assert.deepEqual(c.spectrum8,input);assert.notEqual(c.spectrum8,input);assert(c.spectrum8Available);assert.deepEqual(c.bands,[.2,.3,.4]);
 input[0]=1;assert.equal(c.spectrum8[0],0);
 assert.deepEqual(context(0,{spectrum8:Array(8).fill(0)}).spectrum8,Array(8).fill(0));assert(context(0,{spectrum8:Array(8).fill(0)}).spectrum8Available);
 assert.equal(context(0,{bass:1,mid:1,treble:1}).spectrum8,null,'Coarse bands must never fabricate eight independent values');
});
test("Analyzer context rejects malformed, inherited and accessor spectra without coercion",()=>{
 for(const value of [undefined,null,[],Array(7).fill(0),Array(9).fill(0),Array(8),[NaN,0,0,0,0,0,0,0],[Infinity,0,0,0,0,0,0,0],[-.1,0,0,0,0,0,0,0],[1.1,0,0,0,0,0,0,0],['1',0,0,0,0,0,0,0],new Float32Array(8)])assert.equal(context(0,{spectrum8:value}).spectrum8,null);
 let calls=0;const hostile={};Object.defineProperty(hostile,'spectrum8',{get(){calls++;throw Error('getter');}});assert.equal(normalizeVideoContext(hostile).spectrum8,null);assert.equal(calls,0);
 const inherited=Object.create({spectrum8:Array(8).fill(1)});assert.equal(normalizeVideoContext(inherited).spectrum8,null);
 const vector=Array(8).fill(0);Object.defineProperty(vector,'3',{get(){calls++;throw Error('element getter');}});assert.equal(context(0,{spectrum8:vector}).spectrum8,null);assert.equal(calls,0);
});
test("Analyzer color/gain uniforms distinguish real silence, unavailable data and earlier three-band mode",()=>{
 const valid=context(0,{spectrum8:Array(8).fill(0)}),missing=context(0);
 assert.deepEqual(videoEffectUniforms(spec('Analyzer'),undefined,valid),[120,1,1,0]);
 assert.deepEqual(videoEffectUniforms(spec('Analyzer'),undefined,missing),[120,1,0,0]);
 assert.deepEqual(videoEffectUniforms(spec('Analyzer',1,{hue:900,gain:10,behavior:'Earlier Open Play'}),undefined,missing),[360,4,0,1]);
 assert.deepEqual(videoEffectUniforms(spec('Analyzer',1,{hue:0,gain:0}),undefined,valid),[0,0,1,0]);
 const e=videoEffectCatalog.find(e=>e.name==='Analyzer');assert.equal(e.default.params.behavior,'Manual Meaning');assert.equal(e.manualMeaningEvidence.exactResponseRecovered,false);
});
test("Earlier Open Play freeze captures once and preserves indefinite capture identity across amount changes",()=>{
 const state=createVideoEffectState("Frame Freeze");
 const earlier=(amount,extra={})=>spec("Frame Freeze",amount,{behavior:"Earlier Open Play",...extra});
 assert.equal(planVideoEffectFrame(state,earlier(0),context(0)).captureHold,false);
 assert.equal(planVideoEffectFrame(state,earlier(.5),context(1)).captureHold,true);
 assert.equal(planVideoEffectFrame(state,earlier(1),context(2)).captureHold,false);
 assert.equal(planVideoEffectFrame(state,earlier(.25),context(30)).captureHold,false);assert(state.holdActive);
 assert.equal(planVideoEffectFrame(state,earlier(1,{captureToken:1}),context(31)).captureHold,true);
});
test("freeze planner drives an actual retained-frame capture collaborator",()=>{
 const state=createVideoEffectState("Frame Freeze");let capture=null;
 const run=(frame,value,token=0)=>{const p=planVideoEffectFrame(state,spec("Frame Freeze",value,{behavior:"Earlier Open Play",captureToken:token}),context(frame.time));if(p.captureHold)capture=frame.pixels.slice();return capture;};
 assert.deepEqual(run({time:0,pixels:[255,0,0,255]},1),[255,0,0,255]);
 assert.deepEqual(run({time:1,pixels:[0,0,255,255]},.5),[255,0,0,255]);
 assert.deepEqual(run({time:2,pixels:[0,0,255,255]},1,1),[0,0,255,255]);
 return "Executed capture lifecycle with an in-memory frame collaborator, not GPU pixels";
});
test("Finite freeze expires once and token retriggers without automatic recapture",()=>{
 const s=createVideoEffectState("Frame Freeze"),run=(time,params={})=>planVideoEffectFrame(s,spec("Frame Freeze",1,params),context(time));
 assert(run(0).captureHold);assert(s.holdActive);assert(!run(.4).captureHold);assert(s.holdActive);
 assert(!run(1).captureHold);assert(!s.holdActive);assert(s.holdExpired);assert(!run(1.1).captureHold);assert(!s.holdActive);
 assert(run(1.2,{captureToken:1}).captureHold);assert(s.holdActive);assert.equal(s.captureTime,1.2);assert(!run(2.2,{captureToken:1}).captureHold);assert(!s.holdActive);
});
test("Finite freeze duration edits use original deadline and cannot resurrect expiry",()=>{
 const s=createVideoEffectState("Frame Freeze"),run=(time,duration)=>planVideoEffectFrame(s,spec("Frame Freeze",1,{durationSeconds:duration}),context(time));
 run(0,1);run(.4,2);assert.equal(s.captureTime,0);assert(s.holdActive);run(1.5,2);assert(s.holdActive);
 run(1.6,1);assert(s.holdExpired);run(1.7,16);assert(!s.holdActive);assert(s.holdExpired);
 const short=createVideoEffectState("Frame Freeze");planVideoEffectFrame(short,spec("Frame Freeze",1,{durationSeconds:0}),context(0));planVideoEffectFrame(short,spec("Frame Freeze",1,{durationSeconds:0}),context(.05));assert(short.holdExpired);
});
test("Finite freeze zero, mode changes and backward clocks create fresh lifecycles",()=>{
 const s=createVideoEffectState("Frame Freeze"),run=(time,value=1,behavior="Manual Meaning")=>planVideoEffectFrame(s,spec("Frame Freeze",value,{behavior}),context(time));
 run(0);run(.2,0);assert(!s.holdCaptured&&!s.holdActive);assert(run(.3).captureHold);assert.equal(s.captureTime,.3);
 assert(run(.4,1,"Earlier Open Play").captureHold);assert.equal(s.captureTime,.4);run(20,1,"Earlier Open Play");assert(s.holdActive);
 assert(run(21).captureHold);assert.equal(s.captureTime,21);assert(run(1).captureHold);assert.equal(s.captureTime,1);assert(s.holdActive);
});
test("Finite freeze presentation timer advances for repeated source frames and independent slots",()=>{
 const a=createVideoEffectState("Frame Freeze"),b=createVideoEffectState("Frame Freeze"),p=spec("Frame Freeze");
 planVideoEffectFrame(a,p,context(0,{frameId:1,rate:0}));planVideoEffectFrame(b,p,context(.5,{frameId:1,rate:0}));
 assert(!planVideoEffectFrame(a,p,context(1.1,{frameId:1,rate:0})).captureHold);assert(!a.holdActive);
 planVideoEffectFrame(b,p,context(1.1,{frameId:1,rate:0}));assert(b.holdActive);assert.equal(videoEffectUniforms(p,a)[0],0);assert.equal(videoEffectUniforms(p,b)[0],1);
});
test("Isolator Bass hue ownership and finite hold controls have separate explicit legacy modes",()=>{
 assert.deepEqual(videoEffectUniforms(spec("Isolator Bass")),[0,.08,.08,0]);
 assert.deepEqual(videoEffectUniforms(spec("Isolator Bass",1,{behavior:"Earlier Open Play",hue:500})),[360,.08,.08,1]);
 assert.deepEqual(videoEffectUniforms(spec("Frame Freeze",1,{durationSeconds:100,behavior:"Earlier Open Play"}),{holdActive:true}),[1,16,0,1]);
 for(const name of ["Isolator Bass","Frame Freeze"]){const e=videoEffectCatalog.find(e=>e.name===name);assert.equal(e.default.params.behavior,"Manual Meaning");assert.equal(e.manualMeaningEvidence.exactResponseRecovered,false);}
});
test("edge pulse never captures whole frames, including beat boundaries and reduced motion",()=>{
 const s=createVideoEffectState("Frame Pulse"),p=spec("Frame Pulse");
 for(const time of [0,.2,.5,1,1.5]){const frame=planVideoEffectFrame(s,p,context(time));assert.equal(frame.captureHold,false);assert.equal(frame.captureHistoryLayer,null);}
 assert.equal(planVideoEffectFrame(s,p,context(2,{reducedMotion:true})).captureHold,false);
 assert.equal(s.holdCaptured,false);assert(s.historyTimes.every(t=>t===null));
 return "State/capture planning only; live-center and border pixels need actual GPU test.";
});
test("edge pulse has explicit seconds/width and preserves saved beat timing only when seconds absent",()=>{
 assert.deepEqual(videoEffectUniforms(spec("Frame Pulse")),[1,.12,1,0]);
 assert.deepEqual(videoEffectUniforms(spec("Frame Pulse",1,{periodBeats:2})),[0,.12,2,0]);
 assert.deepEqual(videoEffectUniforms(spec("Frame Pulse",1,{periodBeats:2,periodSeconds:3})),[3,.12,2,0]);
 assert.deepEqual(videoEffectUniforms(spec("Frame Pulse",1,{periodSeconds:-4,edgeWidth:100})),[.1,.45,1,0]);
 const definition=videoEffectCatalog.find(e=>e.name==="Frame Pulse");assert.equal(definition.manualMeaningEvidence.exactResponseRecovered,false);assert(definition.legacyParameters.some(p=>p.name==="periodBeats"));
});
test("Split defaults to the five documented regions while custom panel counts stay independent",()=>{
 assert.equal(videoEffectUniforms(spec("Split"))[0],5);
 assert.equal(videoEffectUniforms(spec("Split",1,{panels:4}))[0],4);
 assert.equal(videoEffectUniforms(spec("Split",1,{panels:500}))[0],12);
 const definition=videoEffectCatalog.find(e=>e.name==="Split");assert.equal(definition.default.params.panels,5);assert.equal(definition.manualMeaningEvidence.page,20);assert.equal(definition.referenceRuntimeVerified,false);
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
test("manual-meaning and earlier Gamma/Smudge/UV uniforms remain explicit separate algorithms",()=>{
 assert.deepEqual(videoEffectUniforms(spec("Gamma")),[2,3,0,0]);
 assert.deepEqual(videoEffectUniforms(spec("Gamma",1,{behavior:"Earlier Open Play",gamma:.25})),[2,.25,0,1]);
 assert.deepEqual(videoEffectUniforms(spec("Gamma",1,{shadowPower:0})),[1,3,0,0]);
 assert.deepEqual(videoEffectUniforms(spec("Smudge")),[24,.25,0,0]);
 assert.deepEqual(videoEffectUniforms(spec("Smudge",1,{behavior:"Earlier Open Play",angle:90})),[24,.25,Math.PI/2,1]);
 assert.deepEqual(videoEffectUniforms(spec("Smudge",1,{radiusPixels:0,edgeWidth:0})),[0,.01,0,0]);
 assert.deepEqual(videoEffectUniforms(spec("UV Paint")),[.2,.05,0,0]);
 assert.deepEqual(videoEffectUniforms(spec("UV Paint",1,{behavior:"Earlier Open Play",colorThreshold:0})),[0,.05,0,1]);
 for(const name of ["Gamma","Smudge","UV Paint"]){const e=videoEffectCatalog.find(x=>x.name===name);assert.equal(e.default.params.behavior,"Manual Meaning");assert.equal(e.manualMeaningEvidence.exactResponseRecovered,false);assert.deepEqual(e.independentParameters.find(x=>x.name==="behavior").options,["Manual Meaning","Earlier Open Play"]);}
 return "Executed parameter ownership/clamping; numeric output needs GPU fixtures.";
});
test("fresh saturation increases by default while an explicit zero remains desaturation",()=>{
 assert.equal(spec("Saturation").params.saturation,2);
 assert.deepEqual(videoEffectUniforms(spec("Saturation")),[2,0,0,0]);
 assert.deepEqual(videoEffectUniforms(spec("Saturation",1,{saturation:0})),[0,0,0,0]);
});
test("unsupported headless execution and excessive output resolution fail honestly",()=>{
 assert.equal(videoEffectCapabilities.slots,2);assert.equal(videoEffectCapabilities.historySamples,16);
 assert.throws(()=>createVideoEffects({width:0,height:64}),/positive integer/);
 assert.throws(()=>createVideoEffects({width:4096,height:4096}),/pixel budget/);
 assert.throws(()=>createVideoEffects(),/browser canvas with WebGL2/);
});
console.log(`${passed}/${passed} independent Video FX catalog/state checks passed.`);
console.log("Scope: executed JS lifecycle/clock/history planning and static shader dispatch coverage. Actual GPU compilation, pixel transforms, alpha and frame routing require prototype/video-effects-test.html.");
