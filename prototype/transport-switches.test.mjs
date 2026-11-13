import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {refreshTransportControls} from './transport-presentation.js';
import * as presentation from './transport-presentation.js';
import {createStemSlipControls} from './stem-slip-ui.js';
const source=await readFile(new URL('./app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
test('Live deck switches retain existing controls and reflect state without a structural rebuild',async()=>{
 const state={layout:'Horizontal',deckCount:4,focus:0,settings:{'Sync Mode':'Smart Sync'},decks:Array.from({length:4},(_,index)=>({index,track:{bpm:120},mode:'INT'}))},nodes=new Map();
 const root={addEventListener(){},querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{classList:{values:new Set(),contains(key){return this.values.has(key);},toggle(key,value){value?this.values.add(key):this.values.delete(key);}},getAttribute(key){return this[key];},setAttribute(key,value){this[key]=value;}});return nodes.get(selector);}};
 let rebuilds=0;const engine={position:()=>0,beginSlip(){},async endSlip(){},async setStemSlip(d,mode){d.stemSlip=mode;},async setReverse(d,value){d.reverse=value;},async setPitch(d,options){Object.assign(d,options);}};
 const globals={document:globalThis.document,window:globalThis.window};globalThis.document=root;globalThis.window={addEventListener(){}};
 let stemSlipControls;
 try{stemSlipControls=createStemSlipControls({engine,state,prepare(){},render(){},notify(){}});}
 finally{globalThis.document=globals.document;globalThis.window=globals.window;}
 const values={state,engine,stemSlipControls:{refresh:d=>stemSlipControls.refresh(d,root)},renderDecks:()=>rebuilds++,refreshTransportControls:s=>refreshTransportControls(s,root),refreshDeckSwitches:(s,index)=>presentation.refreshDeckSwitches(s,index,root),renderedDeckShape:'Horizontal/4/Smart Sync',document:root,smartSync:{reconcile(){}},flipAutomation:{record(){}}};
 const action=new Function(...Object.keys(values),'return ('+handler+');')(...Object.values(values));
 for(const name of ['reverse','repeat','slip','keylock']){
  for(const expected of [true,false]){
   if(name==='keylock')state.decks[0].keySync=true;
   if(name==='slip'&&expected){state.decks[0].stemSlip='vocal';root.querySelector('[data-stem-slip-mode="0"]').value='vocal';}
   await action(name,0,{});assert.equal(rebuilds,0,name+' rebuilt controls');
   const button=root.querySelector(`[data-action="${name}"][data-deck="0"]`);assert.equal(button.classList.contains('active'),expected);assert.equal(button.getAttribute('aria-pressed'),String(expected));
   if(name==='keylock')assert.equal(root.querySelector('[data-action="keySync"][data-deck="0"]').classList.contains('active'),false);
   if(name==='slip'){assert.equal(root.querySelector('[data-stem-slip-mode="0"]').value,'off');assert.equal(root.querySelector('[data-stem-slip-scratch="0"]').disabled,true);}
  }
 }
 state.deckCount=2;values.renderedDeckShape='Horizontal/2/Smart Sync';
 const query=root.querySelector.bind(root);root.querySelector=selector=>selector.includes('data-deck="2"')?null:query(selector);
 const hiddenAction=new Function(...Object.keys(values),'return ('+handler+');')(...Object.values(values));
 await hiddenAction('repeat',2,{});assert.equal(rebuilds,0,'Hidden deck rebuilt visible controls');
 state.layout='Vertical';await hiddenAction('repeat',0,{});assert.equal(rebuilds,1,'Changed layout needs structural fallback');
});
