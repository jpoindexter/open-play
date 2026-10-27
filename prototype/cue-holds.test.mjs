import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createCueHolds} from './holds.js';
function fixture(presentation={}) {
  const d={index:0,track:{id:'a',cues:[]},cue:2,position:2,playing:false};
  const starts=[],pending=[];
  const engine={init(){},position:d=>d.position,pause(d){d.playing=false;},
    seek(d,p){d.position=p;return new Promise(resolve=>pending.push(resolve));},
    async start(d){starts.push(d.track.id);d.playing=true;},beginSlip(){},async endSlip(){}};
  const holds=createCueHolds({engine,state:{decks:[d]},quantized:(_,p)=>p,record(){},persist(){},render(){},notify(message){throw Error(message);},...presentation});
  return {d,holds,starts,pending};
}
test('replacement invalidates pending audition and cannot latch the next Play',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  d.track={id:'b',cues:[]};pending.shift()();await press;
  assert.deepEqual(starts,[]);assert.equal(holds.latch(d),false);
});
test('cancelDeck revokes ownership synchronously, including same-track reload/stop',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  holds.cancelDeck(d);assert.equal(holds.latch(d),false);
  pending.shift()();await press;await holds.release('i');assert.deepEqual(starts,[]);
});
test('release before preparation finishes never starts playback',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d),release=holds.release('i');
  pending.splice(0).forEach(resolve=>resolve());await Promise.all([press,release]);
  assert.deepEqual(starts,[]);assert.equal(d.playing,false);assert.equal(d.position,2);
});
test('audition release returns paused, while Cue plus Play latches',async()=>{
  for(const latch of [false,true]){
    const {d,holds,pending}=fixture(),press=holds.press('i',d);pending.shift()();await press;
    assert.equal(d.playing,true);if(latch)assert.equal(holds.latch(d),true);
    const release=holds.release('i');pending.splice(0).forEach(resolve=>resolve());await release;
    assert.equal(d.playing,latch);assert.equal(d.position,2);
  }
});
test('Cue plus Play during pending preparation continues after Cue release',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  assert.equal(holds.latch(d),true);
  await holds.release('i');
  pending.shift()();await press;
  assert.deepEqual(starts,['a']);assert.equal(d.playing,true);
});
test('cancelling a pending Cue plus Play still prevents a queued restart',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  holds.latch(d);await holds.release('i');holds.cancelDeck(d);
  pending.shift()();await press;
  assert.deepEqual(starts,[]);assert.equal(d.playing,false);
});
test('actual Play stop revokes released Cue ownership before pending seek completes',async()=>{
  const {d,holds,starts,pending}=fixture();
  const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
  const begin=source.indexOf('async function play(d) {');
  const end=source.indexOf('\nfunction deckQuantize',begin);
  assert(begin>=0&&end>begin);
  const playRequests=new WeakMap();
  const context={cueHolds:holds,pitchPlay:{latch:()=>false},playRequests,state:{},
    cancelPendingPlay:d=>{playRequests.delete(d);d.playQueued=false;},
    slicer:{cancelDeck(){}},stemSlipControls:{cancelDeck(){}},
    engine:{pause:d=>{d.playing=false;d.processing=false;}},smartSync:{paused(){},reconcile(){}},
    persist(){},renderDecks(){},renderTracks(){},refreshTransportControls(){}};
  vm.runInNewContext(source.slice(begin,end)+';globalThis.realPlay=play;',context);
  const press=holds.press('i',d);
  holds.latch(d);await holds.release('i');
  d.processing=true;
  await context.realPlay(d);
  pending.shift()();await press;
  assert.deepEqual(starts,[],'stopped transport must not restart from the old Cue request');
  assert.equal(d.playing,false);
});

test('temporary Cue pause, cue-set and release use transport refresh without rebuilding controls',async()=>{
 let rebuilds=0,refreshes=0;
 const {d,holds,pending}=fixture({render(){rebuilds++;},refresh(){refreshes++;}});
 const audition=holds.press('i',d);pending.shift()();await audition;
 const released=holds.release('i');pending.shift()();await released;
 d.position=3;const set=holds.press('i',d);pending.shift()();await set;
 d.playing=true;const pause=holds.press('i',d);pending.shift()();await pause;
 assert.equal(rebuilds,0);assert.equal(refreshes,3);assert.equal(d.playing,false);assert.equal(d.cue,3);
});
