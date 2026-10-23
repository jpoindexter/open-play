import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const drawing=source.slice(source.indexOf('function prepareWaveCanvas('),source.indexOf('function drawDetailWave('));
function fixture(count=4){
 const order=[],canvases=Array.from({length:count},(_,index)=>({
  getBoundingClientRect(){order.push('read-'+index);return{width:50,height:20};},width:10,height:10,
  getContext(){return{setTransform(){order.push('write-'+index);},clearRect(){order.push('paint-'+index);}};},
 }));
 const scope={window:{devicePixelRatio:2},state:{deckCount:count,decks:canvases.map((_,index)=>({index,track:null}))},$:id=>canvases[Number(id.replace('#wave-',''))],overviewWaveViews:[],waveformView:()=>null};
 vm.createContext(scope);vm.runInContext(drawing,scope);return{scope,order,canvases};
}
test('four overview geometries are read before resizing or painting any canvas',()=>{
 const f=fixture();f.scope.drawWaves();
 assert.deepEqual(f.order.slice(0,4),['read-0','read-1','read-2','read-3'],'Interleaved reads and writes force repeated layout during deck replacement');
 assert.equal(f.order.filter(x=>x.startsWith('paint')).length,4);for(const canvas of f.canvases){assert.equal(canvas.width,100);assert.equal(canvas.height,40);}
});
test('detail canvas preparation still measures its own geometry at the current DPR',()=>{
 const f=fixture(1);f.scope.window.devicePixelRatio=1.5;const result=f.scope.prepareWaveCanvas(f.canvases[0]);
 assert.equal(result.width,50);assert.equal(result.height,20);assert.equal(f.canvases[0].width,75);assert.equal(f.canvases[0].height,30);
});
test('detailed waveform geometry is read before transport and meter presentation writes',()=>{
 const order=[],element={classList:{toggle(){}},setAttribute(){order.push('write');},get textContent(){return '—';},set textContent(value){order.push('write');},set value(value){order.push('write');}};
 const tick=source.slice(source.indexOf('function tick() {'),source.indexOf('\nrenderCrates();',source.indexOf('function tick() {')));
 const scope={state:{decks:[],deckCount:0},engine:{masterSnapshot:()=>({displayDB:-120}),updateFXBPMs(){}},$:()=>element,drawDetailWave(){order.push('read');},drawWaves(){},flipAutomation:{tick(){}},panels:{tick(){}},stemSlipControls:{tick(){}},deckScratchControls:{tick(){}},requestAnimationFrame(){}};
 vm.createContext(scope);vm.runInContext(tick,scope);scope.tick();assert.equal(order[0],'read','Presentation writes must not force layout before the detailed waveform measurement');
});
