import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const controller=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
test('headphone Cue uses its current button without rebuilding controls for GUI or controller callers',async()=>{
 const decks=Array.from({length:4},(_,index)=>({index,track:{bpm:128},pfl:false})),state={decks},routes=[],attrs=new Map(),classes=new Set();
 let rebuilds=0,refreshes=0,missing=false;
 const button={classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)},setAttribute:(key,value)=>attrs.set(key,value)};
 const scope={state,engine:{position:()=>0,setPFL:(index,on)=>routes.push([index,on])},notify(){},renderDecks:()=>rebuilds++,refreshTransportControls:()=>refreshes++,document:{querySelector:selector=>{assert.equal(selector,'[data-action="pfl"][data-deck="0"]');return missing?null:button;}}};
 vm.runInNewContext(controller+';globalThis.press=deckAction;',scope);
 const unrelated={value:.67};scope.document.activeElement=unrelated;
 for(const element of [button,{}]){
  await scope.press('pfl',0,element);assert.equal(rebuilds,0);assert.equal(state.focus,0);
  assert.equal(attrs.get('aria-pressed'),String(decks[0].pfl));assert.equal(classes.has('active'),decks[0].pfl);
  assert.equal(scope.document.activeElement,unrelated);assert.equal(unrelated.value,.67);
 }
 assert.deepEqual(routes,[[0,true],[0,false]]);assert.equal(refreshes,2);
 missing=true;await scope.press('pfl',0,{});assert.equal(rebuilds,1,'Missing control retains structural recovery');
});
