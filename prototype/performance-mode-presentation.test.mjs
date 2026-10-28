import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
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
