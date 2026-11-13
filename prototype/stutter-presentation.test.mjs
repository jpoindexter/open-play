import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
function fixture(wasPlaying){
 const d={index:0,track:{id:'original',bpm:120},playing:wasPlaying,cue:2,position:5},state={decks:[d]},calls={play:0,refresh:0};
 let release;const pending=new Promise(resolve=>release=resolve),startTokens=new Map();
 const scope={state,engine:{startTokens,position:d=>d.position,seek(d,p){d.position=p;startTokens.set(0,{});return pending;}},
  async play(deck){calls.play++;deck.playing=true;},refreshTransportControls:s=>{assert.equal(s,state);calls.refresh++;},
  renderDecks:()=>assert.fail('Stutter rebuilt the deck and mixer controls')};
 vm.runInNewContext(handler+'\nglobalThis.press=deckAction;',scope);
 return{d,state,calls,startTokens,release,press:()=>scope.press('stutter',0,{})};
}
test('stutter refreshes transport in place and preserves its existing seek/start guards',async()=>{
 for(const scenario of ['playing','paused','cancelled','replaced']){
  const f=fixture(scenario==='playing'),pending=f.press();
  if(scenario==='cancelled')f.startTokens.set(0,{});
  if(scenario==='replaced')f.d.track={id:'replacement',bpm:120};
  f.release();await pending;
  assert.equal(f.calls.refresh,1,scenario);assert.equal(f.calls.play,scenario==='paused'?1:0,scenario);
  assert.equal(f.d.position,2);if(scenario==='cancelled'||scenario==='replaced')assert.equal(f.d.playing,false);
 }
});
