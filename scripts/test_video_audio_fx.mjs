import assert from 'node:assert/strict';
import {describeAudioVideoLinks,createVideoAudioFXFrameState,planVideoAudioFXFrame,videoAudioFXPolicy} from '../prototype/video-audio-fx-state.js';
import {createVideoAudioFX} from '../prototype/video-audio-fx.js';
import {AudioEngine} from '../prototype/engine.js';
const spec=(name='Echo',extra={})=>({name,on:true,depth:70,beat:'1/2',params:{},...extra});
const snapshot=(banks=[[spec()]],routes=['Deck 1'],bpms=[120,130,140,150])=>describeAudioVideoLinks([banks,routes,bpms]);
const echo=(extra={})=>({...snapshot().left[0],delaySeconds:.1,...extra});
const clock=(time,extra={})=>({time,frameId:time,assetId:'asset-a',audioTransport:{playing:true,generation:1,sources:[{id:'deck0',playing:true,position:time,rate:1,generation:1}]},...extra});
const tests=[];const test=(name,run)=>tests.push({name,run});
test('exact Echo/Distortion identity, enable and depth gate semantic links without FFT',()=>{
  const j=snapshot([[spec(),spec('Distortion'),spec('Echo',{on:false}),spec('Echo',{depth:0}),spec('Low Cut Echo'),spec('Delay')]]);
  assert.deepEqual(j.left.map(x=>x.name),['Echo','Distortion']);assert.equal(j.unsupported.length,2);assert.equal(j.available,true);assert.equal(videoAudioFXPolicy.referenceEquivalent,false);
});
test('actual assignment routes each bank once and reports unmapped Deck3/4/Sampler',()=>{
  const j=snapshot(Array.from({length:6},()=>[spec()]),['Deck 1','Deck 2','Deck 3','Deck 4','Sampler','Master']);
  assert.equal(j.left.length,1);assert.equal(j.right.length,1);assert.equal(j.master.length,1);assert.equal(j.unsupported.length,3);assert.equal(j.master[0].id,'5:0');
});
test('multiple units assigned Master remain ordered rather than duplicating deck routes',()=>{
  const j=snapshot([[spec()],[spec('Distortion')],[spec()]],['Master','Deck 1','Master']);assert.deepEqual(j.master.map(l=>l.id),['0:0','2:0']);assert.deepEqual(j.left.map(l=>l.id),['1:0']);assert.equal(j.right.length,0);
});
test('timing derives from real route BPM, beat ratio and the independent audio Beat Modify parser',()=>{
  const j=snapshot([[spec('Echo',{beat:'1/4',params:{'Beat Modify':'2 dotted',Feedback:'45'}})]],['Deck 2'],[120,150]);
  assert(Math.abs(j.right[0].delaySeconds-.3)<1e-9);assert.equal(j.right[0].feedback,.45);assert.equal(j.right[0].bpm,150);
  assert.equal(snapshot([[spec('Echo',{params:{'Beat Modify':4},beat:'8'})]],['Master'],[20]).master[0].delaySeconds,96);
});
test('distortion exposes bounded independent live Drive/Character/Tone/Type controls',()=>{
  const p=snapshot([[spec('Distortion',{depth:'25',params:{Drive:999,Character:-10,Tone:-30,Type:'Foldback'}})]]).left[0];assert.equal(p.amount,.25);assert.equal(p.drive,1);assert.equal(p.character,0);assert.equal(p.tone,-24);assert.equal(p.type,'Foldback');
});
test('unavailable DSP/malformed absent state yields no semantic processing',()=>{
  assert.equal(describeAudioVideoLinks([[[spec()]],[],[]],{ready:false}).available,false);assert.equal(describeAudioVideoLinks(null).left.length,0);assert.equal(describeAudioVideoLinks([null,null,null]).left.length,0);
});
test('Echo retains real timestamp frames and never fabricates unavailable earlier taps',()=>{
  const s=createVideoAudioFXFrameState(),frames=new Map(),l=echo();let p=planVideoAudioFXFrame(s,l,clock(0));frames.set(p.captureLayer,'red');assert.deepEqual(p.taps,[-1,-1,-1]);
  p=planVideoAudioFXFrame(s,l,clock(.1));frames.set(p.captureLayer,'green');assert.equal(frames.get(p.taps[0]),'red');assert.equal(p.taps[1],-1);
  p=planVideoAudioFXFrame(s,l,clock(.2));frames.set(p.captureLayer,'blue');assert.deepEqual(p.taps.map(i=>i<0?null:frames.get(i)),['green','red',null]);
  p=planVideoAudioFXFrame(s,l,clock(.3));frames.set(p.captureLayer,'white');assert.deepEqual(p.taps.map(i=>frames.get(i)),['blue','green','red']);
});
test('duplicate frame IDs do not capture again; amount/timing edits retain existing real history',()=>{
  const s=createVideoAudioFXFrameState();planVideoAudioFXFrame(s,echo(),clock(0));planVideoAudioFXFrame(s,echo(),clock(.1));const before=s.times.slice(),captures=s.captures;
  const duplicate=planVideoAudioFXFrame(s,echo({amount:.2}),clock(.1));assert(duplicate.duplicate);assert.equal(duplicate.captureLayer,null);assert.equal(s.captures,captures);assert.deepEqual(s.times,before);
  const changed=planVideoAudioFXFrame(s,echo({delaySeconds:1}),clock(.11));assert.equal(changed.resetReasons.length,0);assert.deepEqual(changed.taps,[-1,-1,-1]);assert.deepEqual(s.times,before);
});
test('bounded timestamp history has sixteen slots across a long continuous run',()=>{
  const s=createVideoAudioFXFrameState();for(let i=0;i<2000;i++)planVideoAudioFXFrame(s,echo(),clock(i*.02));assert.equal(s.times.length,16);assert.equal(s.times.filter(Number.isFinite).length,16);assert(s.times.every(t=>t>39));
});
test('source generation and backward render clock cannot reuse old Echo frames',()=>{
  const s=createVideoAudioFXFrameState();planVideoAudioFXFrame(s,echo(),clock(0));planVideoAudioFXFrame(s,echo(),clock(.2));let p=planVideoAudioFXFrame(s,echo(),clock(.3,{assetId:'new'}));assert(p.resetReasons.includes('source-asset'));assert.deepEqual(p.taps,[-1,-1,-1]);
  p=planVideoAudioFXFrame(s,echo(),clock(.1,{assetId:'new'}));assert(p.resetReasons.includes('backward-clock'));assert.deepEqual(p.taps,[-1,-1,-1]);
});
test('upstream topology changes clear downstream Echo but unchanged topology keeps history',()=>{
  const s=createVideoAudioFXFrameState(),initial={topologyKey:'distortion-a|echo-b'};planVideoAudioFXFrame(s,echo(),clock(0,initial));planVideoAudioFXFrame(s,echo(),clock(.2,initial));const p=planVideoAudioFXFrame(s,echo(),clock(.3,{topologyKey:'echo-b'}));assert(p.resetReasons.includes('upstream-topology'));assert.deepEqual(p.taps,[-1,-1,-1]);
});
test('pause/stop clears Echo immediately and resume captures a fresh history',()=>{
  const s=createVideoAudioFXFrameState();planVideoAudioFXFrame(s,echo(),clock(0));const paused=clock(.2,{audioTransport:{playing:false,generation:1,sources:[{id:'deck0',position:.1,playing:false,rate:1,generation:1}]}}),p=planVideoAudioFXFrame(s,echo(),paused);assert(p.suppressed);assert.equal(p.captureLayer,null);assert(s.times.every(t=>t===-Infinity));
  const resumed=planVideoAudioFXFrame(s,echo(),clock(.3));assert(resumed.resetReasons.includes('transport-state'));assert.deepEqual(resumed.taps,[-1,-1,-1]);
});
test('seek/loop/direction/reload discontinuities reset history even on duplicate input frame IDs',()=>{
  for(const change of [{position:4},{position:.1,rate:-1},{position:.2,generation:2}]){
    const s=createVideoAudioFXFrameState();planVideoAudioFXFrame(s,echo(),clock(0));planVideoAudioFXFrame(s,echo(),clock(.2));const p=planVideoAudioFXFrame(s,echo(),clock(.2,{audioTransport:{playing:true,generation:1,sources:[{id:'deck0',position:.2,playing:true,rate:1,generation:1,...change}]}}));assert(p.resetReasons.length>0);assert.deepEqual(p.taps,[-1,-1,-1]);assert(!p.duplicate);
  }
});
test('master clocks reset on any member seek rather than duplicating or ignoring that source',()=>{
  const s=createVideoAudioFXFrameState(),ctx=t=>clock(t,{audioTransport:{playing:true,generation:'same',sources:[{id:0,position:t,playing:true,rate:1,generation:1},{id:1,position:t,playing:true,rate:1,generation:1}]}});planVideoAudioFXFrame(s,echo(),ctx(0));planVideoAudioFXFrame(s,echo(),ctx(.2));const changed=ctx(.3);changed.audioTransport.sources[1].position=9;assert(planVideoAudioFXFrame(s,echo(),changed).resetReasons.includes('transport-seek'));
});
test('silence/FFT input never disables a semantic link; Reduced Motion drops trails and warp',()=>{
  const s=createVideoAudioFXFrameState();planVideoAudioFXFrame(s,echo(),clock(0,{bass:0,mid:0,treble:0,level:0}));let p=planVideoAudioFXFrame(s,echo(),clock(.1,{bass:0,mid:0,treble:0,level:0}));assert(!p.suppressed);assert(p.taps[0]>=0);
  p=planVideoAudioFXFrame(s,echo(),clock(.2,{reducedMotion:true}));assert(p.suppressed);assert(!p.geometricMotion);assert(s.times.every(t=>t===-Infinity));
  const d=planVideoAudioFXFrame(createVideoAudioFXFrameState(),{...echo(),kind:'distortion'},clock(0,{reducedMotion:true}));assert(!d.suppressed);assert(!d.geometricMotion);
});
test('AudioEngine query reflects configured semantic state and never mutates its graph or input state',()=>{
  const engine=new AudioEngine(),banks=[[spec()],[spec('Distortion')]],routes=['Deck 1','Master'],bpms=[140,120];engine.configureFX(banks,routes,bpms);assert.equal(engine.videoFXLinks().available,false);
  const before=JSON.stringify(engine.fxState);engine.ctx={state:'running'};engine.effectsPrepared=true;const links=engine.videoFXLinks();assert.equal(links.left.length,1);assert.equal(links.master.length,1);assert.equal(JSON.stringify(engine.fxState),before);assert.equal(engine.fxChains.length,0);
  banks[0][0].on=false;assert.equal(engine.videoFXLinks().left.length,0);engine.ctx.state='suspended';assert.equal(engine.videoFXLinks().available,false);
});
test('headless link-off is exact identity with no GPU allocation; disposal is final',()=>{
  const renderer=createVideoAudioFX({width:96,height:64}),source={width:96,height:64};assert.equal(renderer.render(source,[]),source);assert.equal(renderer.diagnostics().backend,'unallocated-off');assert.throws(()=>renderer.render(source,[echo()]),/browser WebGL2/);renderer.dispose();renderer.dispose();assert.throws(()=>renderer.render(source,[]),/disposed/);assert.throws(()=>createVideoAudioFX({width:0}),RangeError);
});
let passed=0;for(const {name,run} of tests){await run();passed++;console.log(`PASS ${name}`);}console.log(`${passed}/${tests.length} semantic Video FX state/query checks passed.`);console.log('Scope: actual selection/clock planner and AudioEngine semantic query; real GPU pixels/audio graph/render pipeline require video-audio-fx-harness.html.');
