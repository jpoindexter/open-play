import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
const tests=[];const test=(name,run)=>tests.push({name,run});
const banks=()=>[0,1].map(()=>[{name:'Echo',on:true,depth:60,beat:'1',params:{}}]);
function running(routes=['Deck 1','Deck 2']){
  const e=new AudioEngine(),rows=[],b=banks();e.ctx={currentTime:10,state:'running'};e.effectsPrepared=true;
  e.fxLayout=JSON.stringify([routes,b.map(x=>x.length)]);
  e.fxSlots=routes.map((route,bank)=>({bank,index:0,route:['Deck 1','Deck 2','Deck 3','Deck 4','Sampler','Master'].indexOf(route),update:(spec,bpm)=>rows.push({bank,bpm,name:spec.name})}));
  return {e,rows,b,routes};
}
test('Uninitialized engine retains independent timing scalars and snapshots caller settings',()=>{
 const e=new AudioEngine(),settings=[{mode:'manual',bpm:100},{mode:'auto',bpm:120}];e.configureFX(banks(),[],[120,130],settings);
 assert.equal(e.fxState.length,4);settings[0].bpm=170;assert.equal(e.fxState[3][0].bpm,100);assert.equal(e.ctx,null);
});
test('Existing effect slots receive manual bank BPM and independent route-derived automatic BPM without graph rebuild',()=>{
 const {e,rows,b,routes}=running();const slots=e.fxSlots;e.configureFX(b,routes,[120,140],[{mode:'manual',bpm:100},{mode:'auto',bpm:120}]);
 assert.deepEqual(rows.map(x=>x.bpm),[100,140]);assert.equal(e.fxSlots,slots);assert.equal(e.fxChains.length,0);
});
test('Real setRate reconfiguration holds manual timing while automatic timing follows its changed deck',async()=>{
 const {e,rows,b,routes}=running();e.configureFX(b,routes,[120,140],[{mode:'manual',bpm:100},{mode:'auto',bpm:120}]);
 const d0={index:0,track:{bpm:120,duration:60},rate:1,position:2,playing:false};
 await e.setRate(d0,1.25);assert.equal(e.fxState[2][0],150);assert.deepEqual(rows.slice(-2).map(x=>x.bpm),[100,140]);
 const d1={index:1,track:{bpm:140,duration:60},rate:1,position:3,playing:false};
 await e.setRate(d1,.75);assert.equal(e.fxState[2][1],105);assert.deepEqual(rows.slice(-2).map(x=>x.bpm),[100,105]);
});
test('Restore automatic uses current track tempo and preserves existing processors and other bank authority',()=>{
 const {e,rows,b,routes}=running();e.configureFX(b,routes,[150,105],[{mode:'manual',bpm:100},{mode:'manual',bpm:90}]);const slots=e.fxSlots;
 e.configureFX(b,routes,[150,105],[{mode:'auto',bpm:100},{mode:'manual',bpm:90}]);
 assert.deepEqual(rows.slice(-2).map(x=>x.bpm),[150,90]);assert.equal(e.fxSlots,slots);
});
test('Master and sampler automatic fallbacks retain existing route policy while manual remains bank-owned',()=>{
 const {e,rows,b,routes}=running(['Master','Sampler']);e.configureFX(b,routes,[128,140],[{mode:'auto',bpm:90},{mode:'manual',bpm:100}]);
 assert.deepEqual(rows.map(x=>x.bpm),[128,100]);
});
test('Semantic Video Echo uses the same effective bank timing after real engine reconfiguration',async()=>{
 const {e,b,routes}=running();e.configureFX(b,routes,[120,140],[{mode:'manual',bpm:100},{mode:'auto',bpm:120}]);
 assert.equal(e.videoFXLinks().left[0].delaySeconds,.6);assert.equal(e.videoFXLinks().right[0].bpm,140);
 await e.setRate({index:0,track:{bpm:120,duration:60},rate:1,position:0,playing:false},1.5);
 assert.equal(e.videoFXLinks().left[0].delaySeconds,.6);e.configureFX(b,routes,e.fxState[2],[{mode:'auto',bpm:100},{mode:'auto',bpm:120}]);
 assert.equal(e.videoFXLinks().left[0].bpm,180);assert.equal(e.videoFXLinks().left[0].delaySeconds,1/3);
});
test('Canonical metadata BPM synchronization updates automatic audio and Video timing once without erasing manual authority',()=>{
 const {e,rows,b,routes}=running();e.configureFX(b,routes,[120,140],[{mode:'auto',bpm:120},{mode:'manual',bpm:100}]);const slots=e.fxSlots;
 assert.equal(e.updateFXBPMs([144,180]),true);assert.deepEqual(rows.slice(-2).map(x=>x.bpm),[144,100]);assert.equal(e.videoFXLinks().left[0].bpm,144);assert.equal(e.videoFXLinks().right[0].bpm,100);assert.equal(e.fxSlots,slots);
 const count=rows.length;assert.equal(e.updateFXBPMs([144,180]),false);assert.equal(rows.length,count);
 const supplied=[160,180];e.updateFXBPMs(supplied);supplied[0]=200;assert.equal(e.fxState[2][0],160);
});
test('Metadata synchronization never initializes DSP, and rejected input preserves the current clock',()=>{
 const e=new AudioEngine();assert.equal(e.updateFXBPMs([120,140]),false);assert.equal(e.ctx,null);assert.equal(e.fxState,null);
 const {e:active,b,routes}=running();active.configureFX(b,routes,[120,140]);const before=active.fxState;assert.throws(()=>active.updateFXBPMs([120,NaN]),TypeError);assert.equal(active.fxState,before);
});
const checks=[];for(const {name,run} of tests){try{await run();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.stack});}}
console.log(JSON.stringify({checks,passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,scope:'Actual AudioEngine configureFX/setRate and semantic query with controlled existing effect slot updates; not browser DSP, measured repeat intervals, live UI, musical/reference or native acceptance.'},null,2));
if(checks.some(x=>!x.passed))process.exitCode=1;
