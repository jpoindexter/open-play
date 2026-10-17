import assert from 'node:assert/strict';
import {normalizeFXTempoSettings,effectiveFXBPM,createFXTempo,fxTempoPolicy} from '../prototype/fx-tempo.js';
const checks=[];function test(name,run){run();checks.push({name,passed:true});}
test('Default auto clocks are detached and scalar settings preserve only strict intended fields',()=>{
 const input=[{mode:'manual',bpm:100,taps:[1,2],armed:true},{mode:'auto',bpm:130}],out=normalizeFXTempoSettings(input);
 assert.deepEqual(out,[{mode:'manual',bpm:100},{mode:'auto',bpm:130}]);input[0].bpm=200;assert.equal(out[0].bpm,100);assert.deepEqual(normalizeFXTempoSettings(null),[{mode:'auto',bpm:120},{mode:'auto',bpm:120}]);
 assert.deepEqual(normalizeFXTempoSettings([{mode:'manual',bpm:0},{mode:'manual',bpm:1000}]),[{mode:'manual',bpm:20},{mode:'manual',bpm:400}]);
});
test('Settings ignore inherited/getter/coercion metadata without execution',()=>{
 let called=0;const setting=Object.create({mode:'manual',bpm:99});for(const key of ['mode','bpm'])Object.defineProperty(setting,key,{get(){called++;throw Error('getter');}});
 const input=[setting];Object.defineProperty(input,'1',{get(){called++;throw Error('array getter');}});assert.deepEqual(normalizeFXTempoSettings(input),[{mode:'auto',bpm:120},{mode:'auto',bpm:120}]);
 assert.equal(effectiveFXBPM(setting,144),144);assert.equal(called,0);assert.equal(effectiveFXBPM({mode:'manual',bpm:'100'},144),120);
});
test('Auto follows current routed tempo and manual holds through track/rate changes',()=>{
 const manual={mode:'manual',bpm:100},auto={mode:'auto',bpm:80};for(const track of [120,144,80,400]){assert.equal(effectiveFXBPM(manual,track),100);assert.equal(effectiveFXBPM(auto,track),track);}assert.equal(effectiveFXBPM(auto,NaN),120);
});
test('First tap arms without persisting manual timing; valid second tap establishes100BPM',()=>{
 const clock=createFXTempo();assert.equal(clock.tap(0,0).phase,'armed');assert.equal(clock.snapshot()[0].mode,'auto');assert.equal(clock.tap(0,600).phase,'manual');assert.deepEqual(clock.snapshot()[0],{mode:'manual',bpm:100});assert.equal(clock.diagnostics(0).taps,2);
});
test('Half/double/bar and quarter subdivisions preserve the first two tap range',()=>{
 const clock=createFXTempo();for(const time of [0,600,900,2100,4500,4650])clock.tap(0,time);assert.equal(clock.snapshot()[0].bpm,100);assert.deepEqual(clock.diagnostics(0).intervals,[600,600,600,600,600]);
});
test('Median last5 intervals suppresses one accepted timing jitter without unbounded history',()=>{
 const clock=createFXTempo();for(const time of [0,600,1210,1800,2420,3020,3620,4220,4820,5420])clock.tap(0,time);assert.equal(clock.snapshot()[0].bpm,100);assert.equal(clock.diagnostics(0).intervals.length,5);
});
test('Nonfinite/nonmonotonic timestamps and outliers do not alter held tempo or accepted beat',()=>{
 const clock=createFXTempo();clock.tap(0,0);clock.tap(0,600);const before=clock.snapshot();for(const t of [NaN,Infinity,-1,'900',null])assert.equal(clock.tap(0,t).ignored,'invalid-clock');assert.equal(clock.tap(0,600).ignored,'non-monotonic');assert.equal(clock.tap(0,650).ignored,'interval-outlier');assert.deepEqual(clock.snapshot(),before);clock.tap(0,1200);assert.equal(clock.snapshot()[0].bpm,100);
});
test('Long idle re-arms while retaining established manual BPM until a new valid pair',()=>{
 const clock=createFXTempo();clock.tap(0,0);clock.tap(0,600);const first=clock.tap(0,10000);assert(first.armed);assert.equal(first.phase,'armed');assert.equal(first.setting.bpm,100);clock.tap(0,10500);assert.equal(clock.snapshot()[0].bpm,120);
});
test('Initial interval bounds restart the pair, and20BPM whole-bar tapping stays valid',()=>{
 const clock=createFXTempo();clock.tap(0,0);assert.equal(clock.tap(0,50).ignored,'initial-interval-out-of-range');clock.tap(0,650);assert.equal(clock.snapshot()[0].bpm,100);
 const slow=createFXTempo();slow.tap(0,0);slow.tap(0,3000);slow.tap(0,15000);assert.equal(slow.snapshot()[0].bpm,20);assert.equal(slow.diagnostics(0).phase,'manual');
 const fast=createFXTempo();fast.tap(0,0);fast.tap(0,150);assert.equal(fast.snapshot()[0].bpm,400);
});
test('Returning to Auto clears tap runtime and immediately uses the current track BPM',()=>{
 const clock=createFXTempo();clock.tap(0,0);clock.tap(0,600);clock.automatic(0);assert.equal(effectiveFXBPM(clock.snapshot()[0],144),144);assert.equal(clock.diagnostics(0).taps,0);assert.deepEqual(clock.diagnostics(0).intervals,[]);assert.equal(clock.tap(0,700).phase,'armed');assert.equal(clock.snapshot()[0].mode,'auto');
});
test('Units are independent and JSON persistence excludes taps/armed/timestamps',()=>{
 const clock=createFXTempo({initial:[{mode:'manual',bpm:90},{mode:'auto',bpm:120}]});clock.tap(0,0);clock.tap(0,600);assert.deepEqual(clock.snapshot()[1],{mode:'auto',bpm:120});const json=JSON.stringify(clock.snapshot());assert(!/armed|interval|anchor|last|taps/.test(json));const restored=createFXTempo({initial:JSON.parse(json)});assert.equal(restored.snapshot()[0].bpm,100);assert.equal(restored.diagnostics(0).armed,false);assert.equal(restored.diagnostics(0).taps,0);
});
test('Injected monotonic clock works and invalid unit/count inputs are explicit',()=>{
 let time=100;const clock=createFXTempo({now:()=>time});clock.tap(1);time=700;clock.tap(1);assert.equal(clock.snapshot()[1].bpm,100);for(const index of [-1,2,.5,'0'])assert.throws(()=>clock.tap(index),/FX unit/);assert.throws(()=>normalizeFXTempoSettings([],NaN),/unit count/);assert.equal(fxTempoPolicy.referenceResponseVerified,false);
});
console.log(JSON.stringify({scope:'Executed independent tap clock/strict scalar settings tests. Does not prove browser gestures, actual engine routing, measured audio or vendor estimator equivalence.',passed:checks.length,checks},null,2));
