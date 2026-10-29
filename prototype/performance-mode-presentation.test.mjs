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
test('eject revokes deck work and redraws only the emptied deck',async()=>{
 const track={id:'outgoing'},d={index:1,track,position:17,playing:true,keySync:true},state={decks:[{},d,{},{}],focus:0};
 const calls=[],requests=new WeakMap(),starts=new Map([[1,{}]]),cancel=name=>({cancelDeck:deck=>{assert.equal(deck,d);calls.push(name);}});
 const scope={state,deckLoadRequests:requests,faderStarts:starts,cancelPendingPlay:deck=>{assert.equal(deck,d);calls.push('play');},
  cueHolds:cancel('cue'),deckScratchControls:cancel('scratch'),pitchPlay:cancel('pitch'),loopPads:cancel('loopPads'),manualLoops:cancel('manualLoops'),slicer:cancel('slicer'),stemSlipControls:cancel('stemSlip'),
  engine:{pause(deck){assert.equal(deck,d);deck.playing=false;calls.push('pause');},clearDeckScratchCache:index=>assert.equal(index,1),pruneDecodedBuffers(){calls.push('prune');}},
  smartSync:{reconcile(){assert.equal(d.track,null);calls.push('sync');}},
  renderDecks:index=>{assert.equal(index,1,'Eject must retain the other decks and mixer controls');calls.push('render');},
 };
 vm.runInNewContext(handler+'\nglobalThis.press=deckAction;',scope);
 await scope.press('eject',1,{});
 assert.equal(d.track,null);assert.equal(d.position,0);assert.equal(d.playing,false);assert.equal(d.keySync,false);
 assert.deepEqual({...d.previous},{id:'outgoing',position:17});assert.equal(requests.get(d),1);assert.equal(starts.has(1),false);
 assert.deepEqual(calls,['play','cue','scratch','pitch','loopPads','manualLoops','slicer','stemSlip','pause','prune','sync','render']);
});
