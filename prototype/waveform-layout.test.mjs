import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const drawing=source.slice(source.indexOf('function prepareWaveCanvas('),source.indexOf('function drawDetailWave('));
function fixture(count=4){
 const order=[],canvases=Array.from({length:count},(_,index)=>({
  getBoundingClientRect(){order.push('read-'+index);return{width:50,height:20};},width:10,height:10,
  getContext(){return{setTransform(){order.push('write-'+index);},clearRect(){order.push('paint-'+index);}};},setAttribute(){},
 }));
 const scope={window:{devicePixelRatio:2},state:{deckCount:count,decks:canvases.map((_,index)=>({index,track:{id:'track-'+index,duration:30,bpm:120,cues:[]}}))},engine:{buffers:new Map()},$:id=>canvases[Number(id.replace('#wave-',''))],overviewWaveViews:[],waveformView:()=>({kind:'pending'})};
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
test('empty overview clears its existing bitmap without measuring or resizing geometry',()=>{
 const f=fixture(1),canvas=f.canvases[0];f.scope.state.decks[0].track=null;let width=320,clears=0;
 Object.defineProperty(canvas,'width',{get:()=>width,set:value=>{assert.equal(value,width);clears++;width=value;}});
 f.scope.drawWaves(null,0);
 assert.deepEqual(f.order,[],'An empty strip must not request geometry or paint a waveform');assert.equal(clears,1);assert.equal(canvas.width,320);assert.equal(canvas.height,10);
 assert.deepEqual(JSON.parse(JSON.stringify(f.scope.overviewWaveViews)),[{kind:'pending'}]);
});
test('detailed waveform geometry is read before transport and meter presentation writes',()=>{
 const order=[],element={classList:{toggle(){}},getAttribute:()=>null,setAttribute(){order.push('write');},get textContent(){return '—';},set textContent(value){order.push('write');},set value(value){order.push('write');}};
 const tick=source.slice(source.indexOf('function tick() {'),source.indexOf('\nrenderCrates();',source.indexOf('function tick() {')));
 const scope={state:{decks:[],deckCount:0},engine:{masterSnapshot:()=>({displayDB:-120}),updateFXBPMs(){}},$:()=>element,drawDetailWave(){order.push('read');},refreshTransportControls(){order.push('write');},drawWaves(){},flipAutomation:{tick(){}},panels:{tick(){}},stemSlipControls:{tick(){}},deckScratchControls:{tick(){}},requestAnimationFrame(){}};
 vm.createContext(scope);vm.runInContext(tick,scope);scope.tick();assert.equal(order[0],'read','Presentation writes must not force layout before the detailed waveform measurement');
});

test('master frame presentation writes only changed level and accessible state',()=>{
 let writes=0;
 const node=()=>{const attrs=new Map();return{textContent:'',classList:{toggle(){}},getAttribute:k=>attrs.get(k)??null,setAttribute(k,v){writes++;attrs.set(k,String(v));},get value(){return Number(attrs.get('value'));},set value(v){writes++;attrs.set('value',String(v));}};};
 const nodes=new Map(['#master-meter','#master-peak-value','#master-limit','#audio-status'].map(id=>[id,node()]));
 const snapshot={displayDB:-120,limiting:false};
 const scope={state:{decks:[],deckCount:0},engine:{masterSnapshot:()=>snapshot,updateFXBPMs(){}},$:id=>nodes.get(id),drawDetailWave(){},refreshTransportControls(){},drawWaves(){},flipAutomation:{tick(){}},panels:{tick(){}},stemSlipControls:{tick(){}},deckScratchControls:{tick(){}},requestAnimationFrame(){}};
 const tick=source.slice(source.indexOf('function tick() {'),source.indexOf('\nrenderCrates();',source.indexOf('function tick() {')));
 vm.createContext(scope);vm.runInContext(tick,scope);scope.tick();writes=0;
 for(let i=0;i<120;i++)scope.tick();assert.equal(writes,0,'Unchanged master presentation must not mutate every frame');
 Object.assign(snapshot,{displayDB:-6,limiting:false});scope.tick();assert.equal(nodes.get('#master-meter').value,-6);assert.equal(nodes.get('#master-peak-value').textContent,'-6.0dB');assert.match(nodes.get('#master-meter').getAttribute('aria-valuetext'),/^-6.0dB/);
 Object.assign(snapshot,{displayDB:12,limiting:true});scope.tick();assert.equal(nodes.get('#master-meter').value,9);assert.equal(nodes.get('#master-limit').textContent,'LIMIT');assert.equal(nodes.get('#master-limit').getAttribute('aria-label'),'Master limiter active');
 Object.assign(snapshot,{displayDB:-120,limiting:false});scope.tick();assert.equal(nodes.get('#master-meter').value,-60);assert.equal(nodes.get('#master-peak-value').textContent,'−∞');assert.equal(nodes.get('#master-limit').getAttribute('aria-label'),'Master limiter idle');
});
