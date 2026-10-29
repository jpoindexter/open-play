import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {pitchRanges} from './pitchplay.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
test('performance tab and loop-mode changes redraw only their own deck',async()=>{
 for(const action of ['tab','loopMode']){
  const deck={index:1,tab:action==='tab'?'Slicer':'Loops'},state={focus:0,decks:[{},deck]},calls=[];
  const scope={state,slicer:{releaseDeck:async d=>{assert.equal(d,deck);calls.push('release');}},
   renderDecks:index=>{assert.equal(index,1,'Unrelated decks and mixer must retain their controls');calls.push('render');},
   document:{querySelector:selector=>{assert.match(selector,/data-deck="1"/);return{focus:()=>calls.push('focus')};}}};
  vm.runInNewContext(handler+'\nglobalThis.press=deckAction;',scope);
  await scope.press(action,1,{dataset:{tab:'Loops',mode:'auto'}});
  assert.equal(state.focus,1);
  if(action==='tab'){assert.equal(deck.tab,'Loops');assert.equal(deck.controllerPadMode,null);assert.deepEqual(calls,['release','render']);}
  else{assert.equal(deck.loopPadMode,'auto');assert.equal(deck.controllerPadMode,null);assert.deepEqual(calls,['render','focus']);}
 }
});
test('deck-local Pitch Play range and simulated mode changes scope structural redraw to their own deck',()=>{
 const decks=Array.from({length:4},(_,index)=>({index,pitchRangeMode:'Middle',mode:'INT'}));
 const state={decks},calls=[],notices=[];
 const scope={state,pitchRanges,notify:message=>notices.push(message),
  document:{addEventListener(type,fn){assert.equal(type,'change');scope.change=fn;}},
  renderDecks:index=>{assert.equal(index,1,'Unrelated decks and mixer must retain their controls');calls.push(index);},
 };
 const change=source.slice(source.indexOf('document.addEventListener("change", (e) => {'),source.indexOf('\nasync function seekOverview('));
 vm.runInNewContext(change,scope);
 scope.change({target:{id:'',dataset:{pitchRange:'1'},value:'Down'}});
 assert.equal(decks[1].pitchRangeMode,'Down');assert.equal(decks[1].mode,'INT');
 scope.change({target:{id:'',dataset:{mode:'1'},value:'REL'}});
 assert.equal(decks[1].mode,'REL');assert.equal(decks[1].pitchRangeMode,'Down');
 for(const d of decks.filter(d=>d.index!==1)){assert.equal(d.mode,'INT');assert.equal(d.pitchRangeMode,'Middle');}
 assert.deepEqual(calls,[1,1]);assert.equal(notices.length,1);assert.match(notices[0],/Device modes are simulated/);
});
