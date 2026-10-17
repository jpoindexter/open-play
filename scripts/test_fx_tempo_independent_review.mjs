// Independent controlled actual-handler/engine regression. No browser/event dispatch,
// actual DSP, vendor estimator, physical keyboard/pointer or audible timing claim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
import {createFXTempo,effectiveFXBPM,fxTempoPolicy} from '../prototype/fx-tempo.js';
const panelSource=fs.readFileSync(new URL('../prototype/panels.js',import.meta.url),'utf8');
const appSource=fs.readFileSync(new URL('../prototype/app.js',import.meta.url),'utf8');
const checks=[];async function test(name,run){try{const evidence=await run();checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,error:error.stack});}}
const control=(text='')=>{let value=text,writes=0;return {get textContent(){return value},set textContent(next){value=next;writes++},get writes(){return writes},classList:{toggle(){}},getAttribute(){return this.pressed},setAttribute(k,v){this.pressed=v;}};};
function fixture(mode='auto'){
 const track={id:'loaded-review',title:'Pulse',bpm:120,duration:60,grid:0},deck={index:0,track,rate:1,playing:false,position:0};
 const s={fx:[[{name:'Echo',on:true,depth:60,beat:'1',params:{}}]],fxRoutes:['Deck 1'],fxTempo:[{mode,bpm:100}],decks:[deck]},engine=new AudioEngine(),updates=[];
 engine.ctx={currentTime:5,state:'running'};engine.effectsPrepared=true;engine.fxLayout=JSON.stringify([s.fxRoutes,[1]]);engine.fxSlots=[{bank:0,index:0,route:0,update:(spec,bpm)=>updates.push(bpm)}];engine.configureFX(s.fx,s.fxRoutes,[120],s.fxTempo);
 const cells=new Map([['#grid-bpm',{value:'144'}],['#grid-offset',{value:'0'}],['#modal',{close(){}}],['[data-fx-clock="0"]',control()],['[data-fx-tap="0"]',control()]]),$=key=>cells.get(key),clock=createFXTempo({initial:s.fxTempo,count:1});
 const start=panelSource.indexOf('$("#grid-save").onclick = () => {')+'$("#grid-save").onclick = () => {'.length,end=panelSource.indexOf('\n        };',start),body=panelSource.slice(start,end);
 const saveGrid=()=>new Function('t','d','$','engine','persist','renderDecks','renderTracks','notify',body)(track,deck,$,engine,()=>{},()=>{},()=>{},()=>{});
 const a=panelSource.indexOf('  function automaticFXBPM('),b=panelSource.indexOf('  function changedFXTempo()',a);
 const update=()=>new Function('s','$','fxTempoClock','effectiveFXBPM',panelSource.slice(a,b)+'\nupdateFXTempo();')(s,$,clock,effectiveFXBPM);
 return {track,deck,s,engine,updates,cells,saveGrid,update};
}
await test('Actual grid-save handler followed by actual app sync updates Auto engine/semantic authority before status',()=>{
 const f=fixture();f.saveGrid();assert.equal(f.track.bpm,144);
 const start=appSource.indexOf('  engine.updateFXBPMs('),end=appSource.indexOf('\n',start);assert.ok(start>=0,'Production app lacks shared metadata→FX BPM synchronization');
 new Function('engine','state',appSource.slice(start,end))(f.engine,f.s);f.update();
 assert.equal(f.engine.fxState[2][0],144);assert.equal(f.updates.at(-1),144);assert.equal(f.cells.get('[data-fx-clock="0"]').textContent,'Auto 144.0 BPM');assert.equal(f.engine.videoFXLinks().left[0].bpm,144);assert.equal(f.engine.videoFXLinks().left[0].delaySeconds,60/144);
 return {track:f.track.bpm,status:f.cells.get('[data-fx-clock="0"]').textContent,slot:f.updates.at(-1),semantic:f.engine.videoFXLinks().left[0]};
});
await test('Shared metadata synchronization leaves manual100 held and preserves slot ownership',()=>{
 const f=fixture('manual'),slots=f.engine.fxSlots;f.saveGrid();f.engine.updateFXBPMs(f.s.decks.map(d=>d.track.bpm*d.rate));f.update();assert.equal(f.engine.fxState[2][0],144);assert.equal(f.updates.at(-1),100);assert.equal(f.engine.fxSlots,slots);assert.equal(f.engine.videoFXLinks().left[0].bpm,100);assert.equal(f.cells.get('[data-fx-clock="0"]').textContent,'Manual 100.0 BPM');
 const count=f.updates.length;for(let i=0;i<100;i++)f.engine.updateFXBPMs([144]);assert.equal(f.updates.length,count,'Unchanged animation ticks reconfigured FX');return {heldBPM:100,unchangedUpdates:f.updates.length-count};
});
await test('Repeated live tick does not rewrite stable text/status, but a meaningful Auto tempo change does',()=>{
 const f=fixture();f.update();const status=f.cells.get('[data-fx-clock="0"]'),button=f.cells.get('[data-fx-tap="0"]'),before=[status.writes,button.writes];for(let i=0;i<100;i++)f.update();assert.deepEqual([status.writes,button.writes],before);f.track.bpm=130;f.update();assert.equal(status.writes,before[0]+1);assert.equal(status.textContent,'Auto 130.0 BPM');return {before,after:[status.writes,button.writes]};
});
function gestureFixture(){
 const settings={panel:'fx'},clock=createFXTempo({initial:[{mode:'manual',bpm:100}],count:1}),timers=new Map();let serial=0,changes=0;
 const button={dataset:{fxTap:'0'},isConnected:true,setPointerCapture(){},click(){this.onclick();}};
 const start=panelSource.indexOf("    $$('[data-fx-tap]').forEach("),end=panelSource.indexOf("    $$('[data-fx-auto]')",start);assert.ok(start>=0&&end>start,'Actual gesture block changed; review extraction');
 new Function('$$','s','fxTempoClock','changedFXTempo','fxTempoPolicy','setTimeout','clearTimeout',panelSource.slice(start,end))(()=>[button],settings,clock,()=>changes++,fxTempoPolicy,(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},id=>timers.delete(id));
 return {button,settings,clock,changes:()=>changes,advance:()=>{const batch=[...timers.values()];timers.clear();for(const {fn,ms}of batch){assert.equal(ms,600);fn();}},pending:()=>timers.size};
}
const key=(key,repeat=false)=>({key,repeat,preventDefault(){}});
await test('Actual pointercancel and blur cancel hold timers; canceled keyboard keyup does not tap',()=>{
 const f=gestureFixture();f.button.onpointerdown({button:0,pointerId:1});assert.equal(f.pending(),1);f.button.onpointercancel({pointerId:1});f.advance();assert.equal(f.changes(),0);assert.equal(f.clock.snapshot()[0].mode,'manual');
 f.button.onkeydown(key('Enter'));f.button.onblur();f.button.onkeyup(key('Enter'));f.advance();assert.equal(f.changes(),0);return {mode:f.clock.snapshot()[0].mode,changes:f.changes()};
});
await test('Actual held keyboard gesture resets Auto once and suppresses its own release tap',()=>{
 const f=gestureFixture();f.button.onkeydown(key('Enter'));f.button.onkeydown(key('Enter',true));assert.equal(f.pending(),1);f.advance();assert.equal(f.changes(),1);assert.equal(f.clock.snapshot()[0].mode,'auto');f.button.onkeyup(key('Enter'));assert.equal(f.changes(),1);assert.equal(f.clock.diagnostics(0).armed,false);return {mode:f.clock.snapshot()[0].mode,armed:f.clock.diagnostics(0).armed,changes:f.changes()};
});
await test('Detached controls and closed panels cannot finish old hold timers',()=>{
 for(const kind of ['detached','closed']){const f=gestureFixture();f.button.onpointerdown({button:0,pointerId:1});if(kind==='detached')f.button.isConnected=false;else f.settings.panel=null;f.advance();assert.equal(f.changes(),0);assert.equal(f.clock.snapshot()[0].mode,'manual');}return {obsoleteHolds:2};
});
console.log(JSON.stringify({passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,scope:'Executed extracted actual grid/status/gesture handlers, actual AudioEngine configure/sync/semantic logic with controlled DOM, timers and effect-slot updates. No browser dispatch, actual DSP timing, assistive technology or vendor-equivalent estimator claim.'},null,2));
if(checks.some(c=>!c.passed))process.exitCode=1;
