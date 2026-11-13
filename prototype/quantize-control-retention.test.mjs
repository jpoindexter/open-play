import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {refreshTransportControls} from './transport-presentation.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const rendering=source.slice(source.indexOf('let renderedSyncMode'),source.indexOf('\nfunction waveformView('));
const helperAt=source.indexOf('function refreshWaveformOrientation('),handlerAt=source.indexOf('$("#layout").onchange =');
const orientation=source.slice(helperAt,source.indexOf('\n$("#deck-count").onchange',handlerAt));
const quantize=source.slice(source.indexOf('function deckQuantize('),source.indexOf('\nfunction autoLoopEnd('));
const controller=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
const globalHandler=source.slice(source.indexOf('$("#quantize").onclick ='),source.indexOf('\n$("#autoplay").onclick'));
const existing=readFileSync(new URL('./layout-orientation.test.mjs',import.meta.url),'utf8');
const controlledFixture=existing.slice(existing.indexOf('function fixture('),existing.indexOf('\nfor(const count'));

// Actual controller/render/header-handler code, controlled DOM/paint endpoints.
// Checks ownership/semantic state only: no browser pixels, native timing, actual
// audio/MIDI gestures, focus-loss events or physical routing are established.
function fixture({count=4,defaultValue=true,overrides=[],unloaded=false}={}){
 const outer=vm.createContext({vm,source,rendering,orientation});vm.runInContext(controlledFixture,outer);
 const f=outer.fixture(count,'Horizontal'),buttons=new Map(),missing=new Set(),audioCalls=[];
 const element=()=>{const attrs=new Map(),classes=new Set();return{getAttribute:k=>attrs.get(k)||null,setAttribute:(k,v)=>attrs.set(k,String(v)),classList:{toggle(k,on){on?classes.add(k):classes.delete(k);},contains:k=>classes.has(k)}};};
 const header=element();let missingHeader=false;
 const originalQuery=f.document.querySelector,originalAll=f.document.querySelectorAll;
 const query=selector=>{
  if(selector==='#quantize')return missingHeader?null:header;
  if(/data-action=["']?quantize["']?/.test(selector)){const match=selector.match(/data-deck=["']?(\d+)["']?/);if(match)return missing.has(Number(match[1]))?null:buttons.get(Number(match[1]));}
  return originalQuery(selector);
 };
 f.document.querySelector=query;f.document.querySelectorAll=selector=>/data-action=["']?quantize["']?/.test(selector)?[...buttons].filter(([i])=>!missing.has(i)).map(([,button])=>button):originalAll(selector);
 f.scope.$=query;f.scope.refreshTransportControls=state=>refreshTransportControls(state,f.document);
 for(const name of ['start','pause','seek','setRate'])f.scope.engine[name]=()=>audioCalls.push(name);
 f.scope.persist=()=>{throw Error('Quantize must not introduce persistence');};
 vm.runInContext(quantize+'\n'+controller+'\n'+globalHandler,f.scope);
 while(f.state.decks.length<4)f.state.decks.push({...f.state.decks[0],index:f.state.decks.length,track:null});
 f.state.quantize=defaultValue;
 f.state.decks.forEach((d,index)=>{if(typeof overrides[index]==='boolean')d.quantize=overrides[index];else delete d.quantize;d.playing=true;});
 if(unloaded)f.state.decks[0].track=null;
 f.scope.renderDecks();
 for(const [index,node]of f.nodes){node.classList=element().classList;const button=element();button.dataset={deck:String(index),action:'quantize'};button.classList.toggle('active',f.scope.deckQuantize(f.state.decks[index]));button.setAttribute('aria-pressed',String(!!f.scope.deckQuantize(f.state.decks[index])));buttons.set(index,button);}
 f.state.focus=1;const active=f.nodes.get(1).control;active.value='3.5';f.focus(active);
 const before={nodes:[...f.nodes.values()],mixer:f.mixerControls,footer:f.footer,detail:f.detail,canvas:f.canvas,lanes:f.lanes,previews:[...f.previews],calls:{...f.calls},rates:f.state.decks.map(d=>d.rate),active};
 return{...f,buttons,header,missing,audioCalls,before,setMissingHeader:()=>{missingHeader=true;},toggle:()=>f.scope.deckAction('quantize',0,{},{}),toggleGlobal:()=>header.onclick({preventDefault(){}})};
}
function retained(f){
 assert.deepEqual([...f.nodes.values()],f.before.nodes,'Quantize must retain every original deck');
 assert.equal(f.document.activeElement,f.before.active,'An unrelated active control must retain focus');assert.equal(f.before.active.value,'3.5');
 assert.equal(f.mixerControls,f.before.mixer);assert.equal(f.footer,f.before.footer);assert.equal(f.canvas,f.before.canvas);assert.equal(f.detail,f.before.detail);assert.equal(f.lanes,f.before.lanes);
 assert.equal(f.previews.length,f.before.previews.length);f.previews.forEach((node,index)=>assert.equal(node,f.before.previews[index]));
 assert.equal(f.calls.full,f.before.calls.full);assert.equal(f.calls.mixer,f.before.calls.mixer);assert.equal(f.calls.overview,f.before.calls.overview);
 for(const [index,node]of f.nodes)assert.equal(node.classList.contains('focused'),index===f.state.focus);
 assert.deepEqual(f.audioCalls,[]);assert.deepEqual(f.state.decks.map(d=>d.rate),f.before.rates);assert(f.state.decks.every(d=>d.playing));
}
function statesMatch(f){
 const enabled=f.state.decks.slice(0,f.state.deckCount).map(d=>!!f.scope.deckQuantize(d));
 for(const [index,value]of enabled.entries()){assert.equal(f.buttons.get(index).getAttribute('aria-pressed'),String(value));assert.equal(f.buttons.get(index).classList.contains('active'),value);}
 assert.equal(f.header.getAttribute('aria-pressed'),enabled.every(Boolean)?'true':enabled.every(v=>!v)?'false':'mixed');
}
for(const count of [2,4])test(`${count} deck Quantize override retains unrelated active controls and previews`,async()=>{
 const f=fixture({count});await f.toggle();assert.equal(f.state.decks[0].quantize,false);assert.equal(f.state.quantize,true);
 retained(f);statesMatch(f);assert.equal(f.state.focus,0);assert.equal(f.header.getAttribute('aria-pressed'),'mixed');
 await f.toggle();retained(f);statesMatch(f);assert.equal(f.state.decks[0].quantize,true);assert.equal(f.header.getAttribute('aria-pressed'),'true');
});
test('unloaded deck Q still overrides the global default without changing other overrides',async()=>{
 const f=fixture({defaultValue:false,overrides:[undefined,true,undefined,false],unloaded:true});await f.toggle();
 assert.equal(f.state.decks[0].track,null);assert.equal(f.state.decks[0].quantize,true);assert.equal(f.state.quantize,false);
 assert.equal(f.state.decks[1].quantize,true);assert.equal(f.scope.deckQuantize(f.state.decks[2]),false);assert.equal(f.state.decks[3].quantize,false);retained(f);statesMatch(f);
});
for(const count of [2,4])test(`${count} deck global Q resolves mixed state and toggles all four saved deck flags locally`,async()=>{
 const f=fixture({count,overrides:[false,undefined,false,true]});assert.equal(f.header.getAttribute('aria-pressed'),'mixed');
 await f.toggleGlobal();assert.equal(f.state.quantize,true);assert(f.state.decks.every(d=>d.quantize===true));retained(f);statesMatch(f);assert.equal(f.state.focus,1);
 await f.toggleGlobal();assert.equal(f.state.quantize,false);assert(f.state.decks.every(d=>d.quantize===false));retained(f);statesMatch(f);
});
for(const missing of ['deck Q','header'])test(`missing ${missing} retains structural recovery`,async()=>{
 const f=fixture();missing==='deck Q'?f.missing.add(2):f.setMissingHeader();await f.toggle();
 assert.equal(f.state.decks[0].quantize,false);assert.equal(f.calls.full,f.before.calls.full+1);assert.equal(f.calls.mixer,f.before.calls.mixer+1);assert.deepEqual(f.audioCalls,[]);
});
test('changed Sync-mode shape retains structural recovery',async()=>{
 const f=fixture();f.state.settings['Sync Mode']='Simple Sync';await f.toggle();assert.equal(f.state.decks[0].quantize,false);
 assert.equal(f.calls.full,f.before.calls.full+1);assert.equal(f.calls.mixer,f.before.calls.mixer+1);assert.deepEqual(f.audioCalls,[]);
});
