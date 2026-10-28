import test from 'node:test';
import assert from 'node:assert/strict';
import {createTempoSlider} from './tempo-slider.js';

test('a failed tempo gesture must not discard newer movement on the same fader',async()=>{
 for(const sync of [false,true]){
  const deck={track:{id:'one',bpm:100},rate:sync?1.2:1,pitchRange:8,sync,syncState:sync?'beat':'off'},calls=[];
  let reject,entered;const ready=new Promise(resolve=>entered=resolve);
  const slider=createTempoSlider({setRate:(d,rate)=>{
   calls.push(rate);
   if(calls.length===1){entered();return new Promise((yes,no)=>reject=no);}
   d.rate=rate;return Promise.resolve();
  }});
  const outcome=p=>p.then(()=>({ok:true}),error=>({ok:false,message:error.message}));
  const first=outcome(slider.set(deck,1));await ready;
  const second=outcome(slider.set(deck,2)),latest=outcome(slider.set(deck,3));
  reject(Error('Controlled first tempo failure'));
  assert.deepEqual(await Promise.all([first,second,latest]),[{ok:false,message:'Controlled first tempo failure'},{ok:true},{ok:true}]);
  assert.equal(calls.length,2);
  assert.ok(Math.abs(deck.rate-(sync?1.23:1.03))<1e-9);
  assert.ok(Math.abs(slider.view(deck).position-3)<1e-9);
  slider.cancel(deck);assert.ok(Math.abs(slider.view(deck).position-3)<1e-9,'idle fader coordinates remain intact');
 }
});
