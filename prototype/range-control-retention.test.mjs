import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createTempoSlider} from './tempo-slider.js';
import {refreshTransportControls} from './transport-presentation.js';

const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const rendering=source.slice(source.indexOf('let renderedSyncMode'),source.indexOf('\nfunction waveformView('));
const handlerAt=source.indexOf('$("#layout").onchange ='),helperAt=source.indexOf('function refreshWaveformOrientation(');
const orientation=source.slice(helperAt,source.indexOf('\n$("#deck-count").onchange',handlerAt));
const controller=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
const tempo=source.slice(source.indexOf('function tempoSliderMarkup('),source.indexOf('\nfunction renderDecks('));
const existing=readFileSync(new URL('./layout-orientation.test.mjs',import.meta.url),'utf8');
const fixtureSource=existing.slice(existing.indexOf('function fixture('),existing.indexOf('\nfor(const count'));

// Executes actual controller/render/tempo code with the existing controlled DOM
// endpoints. Node identity and semantic values are checked; no CSS/native timing,
// actual audio/controller routing or physical gesture acceptance is established.
function fixture({count=4,relative=false,pending=false}={}){
 const outer=vm.createContext({vm,source,rendering,orientation});vm.runInContext(fixtureSource,outer);
 const f=outer.fixture(count,'Horizontal'),rates=[],labels=new Map(),ranges=new Map(),missing=new Set();
 let resolveRate;const gate=new Promise(resolve=>{resolveRate=resolve;});
 f.scope.tempoSliders=createTempoSlider({setRate:async(d,rate)=>{rates.push(rate);if(pending)await gate;d.rate=rate;}});
 for(const [index,node]of f.nodes){
  const classes=new Set();node.classList={toggle(k,on){on?classes.add(k):classes.delete(k);},contains:k=>classes.has(k)};
  const attributes=new Map(),input=node.control,label={title:'Tempo; enable key lock to preserve pitch.'};
  Object.assign(input,{min:'-8',max:'8',disabled:false,getAttribute:k=>attributes.get(k)||null,setAttribute:(k,v)=>attributes.set(k,String(v)),closest:()=>label});
  labels.set(index,{textContent:''});ranges.set(index,{textContent:'±8'});
  Object.assign(f.state.decks[index],{pitchRange:8,quantize:true});
 }
 if(relative){f.state.decks[0].sync=true;f.state.decks[0].syncState='relative';f.state.decks[0].rate=1.26;}
 const originalQuery=f.document.querySelector;
 const query=selector=>{
  let match=selector.match(/^\[data-tempo="(\d+)"\]$/);if(match)return missing.has('input')?null:f.nodes.get(Number(match[1]))?.control;
  match=selector.match(/^\[data-tempo-label="(\d+)"\]$/);if(match)return labels.get(Number(match[1]));
  if(selector.includes('[data-action="range"]')){match=selector.match(/data-deck="(\d+)"/);if(match)return missing.has('button')?null:ranges.get(Number(match[1]));}
  return originalQuery(selector);
 };
 f.document.querySelector=query;f.scope.$=selector=>selector==='#quantize'?{setAttribute(){}}:query(selector);
 f.scope.refreshTransportControls=state=>refreshTransportControls(state,f.document);
 vm.runInContext(tempo+'\n'+controller,f.scope);
 for(const d of f.state.decks)f.scope.updateTempoSlider(d);
 const original={nodes:[...f.nodes.values()],mixer:f.mixerControls,footer:f.footer,canvas:f.canvas,detail:f.detail,lanes:f.lanes,previews:[...f.previews],calls:{...f.calls}};
 f.focus(f.nodes.get(0).control);
 return{...f,rates,labels,ranges,missing,original,resolveRate,range:()=>f.scope.deckAction('range',0,{},{}),view:()=>f.scope.tempoSliders.view(f.state.decks[0])};
}
function retained(f,focused=f.original.nodes[0].control){
 assert.deepEqual([...f.nodes.values()],f.original.nodes,'Range alone must retain every deck control');
 assert.equal(f.document.activeElement,focused,'The active control must survive the range command');
 assert.equal(f.mixerControls,f.original.mixer);assert.equal(f.footer,f.original.footer);
 assert.equal(f.canvas,f.original.canvas);assert.equal(f.detail,f.original.detail);assert.equal(f.lanes,f.original.lanes);
 assert.equal(f.previews.length,f.original.previews.length);f.previews.forEach((node,index)=>assert.equal(node,f.original.previews[index]));assert.equal(f.calls.full,f.original.calls.full);
 assert.equal(f.calls.mixer,f.original.calls.mixer);assert.equal(f.calls.overview,f.original.calls.overview);
 for(const [index,node]of f.nodes)assert.equal(node.classList.contains('focused'),index===0);
}
function viewMatches(f,range){
 const d=f.state.decks[0],input=f.nodes.get(0).control,view=f.view();
 assert.equal(d.pitchRange,range);assert.equal(Number(input.min),-range);assert.equal(Number(input.max),range);
 assert(Math.abs(Number(input.value)-view.position)<1e-9,'Displayed slider coordinate must match its view within floating-point precision');assert.equal(f.labels.get(0).textContent,view.label);
 assert.equal(f.ranges.get(0).textContent,`±${range}`);
 assert.equal(input.getAttribute('aria-valuetext'),`${view.valueText}; ${f.scope.shownDeckBPM(d)} BPM`);
 assert.match(input.closest('.tempo-control').title,view.relative?/relative adjustment around current tempo/i:/^Tempo;/);
}

for(const count of [2,4])test(`${count} deck tempo range cycles8/16/50/8 locally without replacing controls, focus or previews`,async()=>{
 const f=fixture({count}),d=f.state.decks[0],rate=d.rate;d.rate=1.04;f.scope.updateTempoSlider(d);
 for(const range of [16,50,8]){await f.range();retained(f);viewMatches(f,range);assert.equal(d.rate,1.04);}
 assert.equal(rate,1);assert.deepEqual(f.rates,[],'Range is a coordinate change, not an audio-rate request');
});
test('synced relative tempo retains nominal speed and current relative coordinates',async()=>{
 const f=fixture({relative:true}),d=f.state.decks[0];
 for(const range of [16,50,8]){await f.range();retained(f);viewMatches(f,range);assert.equal(d.rate,1.26);assert.equal(d.sync,true);assert.equal(d.syncState,'relative');assert.match(f.view().label,/REL/);}
 assert.deepEqual(f.rates,[]);
});
test('range changes preserve a pending tempo request rather than replacing its owner',async()=>{
 const f=fixture({pending:true}),d=f.state.decks[0],request=f.scope.tempoSliders.set(d,4);await Promise.resolve();
 try{assert.deepEqual(f.rates,[1.04]);await f.range();retained(f);viewMatches(f,16);assert.equal(d.rate,1);
 assert.equal(f.view().position,4);assert.deepEqual(f.rates,[1.04]);}finally{f.resolveRate();await request;}
 f.scope.updateTempoSlider(d);viewMatches(f,16);assert.equal(d.rate,1.04);assert.deepEqual(f.rates,[1.04]);
});
test('a mapped range command preserves an unrelated active tempo gesture',async()=>{
 const f=fixture(),active=f.nodes.get(2).control;active.value='3.5';f.focus(active);await f.range();
 retained(f,active);viewMatches(f,16);assert.equal(active.value,'3.5');assert.deepEqual(f.rates,[]);
});
for(const missing of ['input','button'])test(`missing range ${missing} retains structural recovery`,async()=>{
 const f=fixture();f.missing.add(missing);await f.range();assert.equal(f.state.decks[0].pitchRange,16);
 assert.equal(f.calls.full,f.original.calls.full+1);assert.equal(f.calls.mixer,f.original.calls.mixer+1);assert.deepEqual(f.rates,[]);
});
test('changed rendered Sync shape retains full structural recovery',async()=>{
 const f=fixture();f.state.settings['Sync Mode']='Simple Sync';await f.range();
 assert.equal(f.state.decks[0].pitchRange,16);assert.equal(f.calls.full,f.original.calls.full+1);assert.equal(f.calls.mixer,f.original.calls.mixer+1);assert.deepEqual(f.rates,[]);
});
