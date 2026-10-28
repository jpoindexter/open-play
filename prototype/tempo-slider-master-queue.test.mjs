import test from 'node:test';
import assert from 'node:assert/strict';
import {createTempoSlider} from './tempo-slider.js';
import {createSmartSync} from './smart-sync.js';
import {createSyncMaster} from './sync-master.js';
import {createSyncTempoRequests} from './sync-tempo-requests.js';

test('a newer Sync choice revokes locally queued fader input but permits fresh movement',async()=>{
 for(const during of [false,true]){
 const decks=[120,100,90].map((bpm,index)=>({index,track:{id:String(index),bpm,grid:0,duration:100},playing:false,rate:index===1?1.2:1,position:0,sync:index<2,syncState:index<2?'armed':'off',syncRole:index===0?'primary':index===1?'secondary':null}));
 const state={decks,settings:{'Sync Mode':'Smart Sync'}};let reject,entered,calls=0;
 const ready=new Promise(resolve=>entered=resolve),master=createSyncMaster({decks:()=>decks});master.select(decks[0]);
 const engine={ctx:{currentTime:0},position:d=>d.position,audibleRate:d=>d.rate,setSyncedRates:changes=>{calls++;if(calls===1){entered();return new Promise((yes,no)=>reject=no);}changes.forEach(x=>x.deck.rate=x.rate);return Promise.resolve();}};
 const smartSync=createSmartSync({engine,state});smartSync.setMaster(decks[0]);
 const request=createSyncTempoRequests({engine,state,smartSync,slicer:{changeRates:(changes,run)=>run()},participants:()=>[],master:()=>master.master()});
 const slider=createTempoSlider({setRate:request}),outcome=p=>p.then(()=>null,error=>error);
 const first=outcome(slider.set(decks[0],1));await ready;
 const queued=outcome(slider.set(decks[0],3));
 decks.forEach(d=>slider.cancel?.(d));master.select(decks[2]);smartSync.setMaster(decks[2]);
 const fresh=during?slider.set(decks[0],1):null;
 reject(Error('Controlled older preparation failure'));
 const [failure,superseded]=await Promise.all([first,queued]);
 assert.match(failure.message,/older preparation/);
 if(!during){assert.equal(smartSync.captureTempo(),90,'queued pre-choice input cannot overwrite the new master tempo');assert.equal(calls,1);}
 assert.equal(superseded?.name,'AbortError');assert.equal(master.master(),decks[2]);
 if(during)await fresh;else await slider.set(decks[0],1);assert.equal(calls,2);
 assert.ok(Math.abs(smartSync.captureTempo()-121.2)<1e-9,'fresh input starts from the current deck rate and reset GUI coordinate');
 }
});
