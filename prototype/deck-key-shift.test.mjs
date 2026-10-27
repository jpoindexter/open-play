import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createDeckKeyShift} from './deck-key-shift.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
const wiring=source.slice(source.indexOf('const deckKeyShift=createDeckKeyShift('),source.indexOf('async function play(d) {'));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
function fixture(){
 const state={decks:[{index:0,track:{id:'original',bpm:120},keyShift:0,keySync:true}],focus:0},calls={saved:0,feedback:0,cancelled:0};
 const cancel={cancelDeck(){calls.cancelled++;}},scope={state,createDeckKeyShift,
  engine:{position:()=>4,async setPitch(d,{semitones,keylock}){d.keyShift=semitones;d.keylock=keylock;}},
  deckScratchControls:cancel,pitchPlay:cancel,loopPads:cancel,manualLoops:cancel,slicer:cancel,
  persist(){calls.saved++;},refreshAnalysisControls(){},refreshDeckSwitches(){},refreshLoopDecks(){calls.feedback++;},
  renderDecks:()=>assert.fail('Key action replaced controls'),notify:message=>assert.fail(message)};
 vm.runInNewContext(wiring+'\n'+handler+'\nglobalThis.keys={intent:keyShiftIntent,set:setDeckKeyShift,press:deckAction};',scope);
 return{scope,state,calls,keys:scope.keys,d:state.decks[0]};
}
test('actual buttons and unchanged MIDI API share current key intent and in-place feedback',async()=>{
 const f=fixture();
 for(const [action,value]of [['keyUp',1],['keyUp',2],['keyDown',1],['keyReset',0]]){
  await f.keys.press(action,0,{});assert.equal(f.d.keyShift,value);assert.equal(f.d.keylock,true);assert.equal(f.d.keySync,false);
 }
 await f.keys.set(0,-24);assert.equal(f.keys.intent(0),-24);assert.equal(f.calls.saved,5);assert.equal(f.calls.feedback,5);assert.equal(f.calls.cancelled,25);
 for(const value of [25,1.5,NaN])await assert.rejects(f.keys.set(0,value),/supports±24/);
 await assert.rejects(f.keys.set(4,0),/Unknown deck/);assert.equal(f.calls.saved,5);
});
test('late, replaced and failed key requests cannot publish stale completion feedback',async()=>{
 const f=fixture(),gates=[];f.scope.engine.setPitch=async(d,{semitones,keylock})=>{d.keyShift=semitones;d.keylock=keylock;const gate=deferred();gates.push(gate);await gate.promise;};
 const first=f.keys.set(0,1),latest=f.keys.set(0,2);assert.equal(f.keys.intent(0),2);
 gates[0].resolve();await first;assert.equal(f.calls.saved,0);assert.equal(f.keys.intent(0),2);
 gates[1].resolve();await latest;assert.equal(f.calls.feedback,1);
 const replaced=f.keys.set(0,3);f.d.track={id:'replacement'};f.d.keyShift=0;gates[2].resolve();await replaced;
 assert.equal(f.calls.feedback,1);assert.equal(f.keys.intent(0),0);
 const removed=f.keys.set(0,4);f.state.decks[0]={index:0,track:{id:'new-deck'},keyShift:0};gates[3].resolve();await removed;assert.equal(f.calls.feedback,1);
 f.scope.engine.setPitch=async()=>{throw Error('Preparation failed');};await assert.rejects(f.keys.set(0,5),/Preparation failed/);assert.equal(f.keys.intent(0),0);assert.equal(f.calls.saved,1);
});
