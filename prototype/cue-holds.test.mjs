import assert from 'node:assert/strict';
import test from 'node:test';
import {createCueHolds} from './holds.js';
function fixture() {
  const d={index:0,track:{id:'a',cues:[]},cue:2,position:2,playing:false};
  const starts=[],pending=[];
  const engine={init(){},position:d=>d.position,pause(d){d.playing=false;},
    seek(d,p){d.position=p;return new Promise(resolve=>pending.push(resolve));},
    async start(d){starts.push(d.track.id);d.playing=true;},beginSlip(){},async endSlip(){}};
  const holds=createCueHolds({engine,state:{decks:[d]},quantized:(_,p)=>p,record(){},persist(){},render(){},notify(message){throw Error(message);}});
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
