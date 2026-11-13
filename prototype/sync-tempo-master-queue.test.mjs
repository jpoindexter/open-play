import test from 'node:test';
import assert from 'node:assert/strict';
import {createSmartSync} from './smart-sync.js';
import {createSyncTempoRequests} from './sync-tempo-requests.js';

test('queued tempo yields to a newer master, while inputs made after that choice remain valid',async()=>{
 for(const [bpm,afterMaster]of [[90,false],[132,false],[90,true]]){
  const decks=[120,100,bpm].map((bpm,index)=>({index,track:{id:String(index),bpm,grid:0,duration:100},playing:false,rate:index===1?1.2:1,position:0,sync:index<2,syncState:index<2?'armed':'off',syncRole:index===0?'primary':index===1?'secondary':null}));
  const state={decks,settings:{'Sync Mode':'Smart Sync'}};let reject,entered,calls=0;
  const ready=new Promise(resolve=>entered=resolve);
  const engine={ctx:{currentTime:0},position:d=>d.position,audibleRate:d=>d.rate,setSyncedRates:changes=>{calls++;if(calls===1){entered();return new Promise((yes,no)=>reject=no);}changes.forEach(x=>x.deck.rate=x.rate);return Promise.resolve();}};
  const smartSync=createSmartSync({engine,state});smartSync.setMaster(decks[0]);
  const request=createSyncTempoRequests({engine,state,smartSync,slicer:{changeRates:(changes,run)=>run()},participants:()=>[]});
  const outcome=p=>p.then(()=>null,error=>error);
  const first=outcome(request(decks[0],1.1));await ready;
  if(afterMaster)smartSync.setMaster(decks[2]);
  const queued=outcome(request(decks[1],1.3));
  if(!afterMaster)smartSync.setMaster(decks[2]);
  reject(Error('Controlled older preparation failure'));
  const [failure,result]=await Promise.all([first,queued]);assert.match(failure.message,/older preparation/);
  assert.equal(smartSync.captureTempo(),afterMaster?130:bpm);
  assert.equal(calls,afterMaster?2:1,'older queued input must never reach the transport after a newer master choice');
  assert.equal(result?.name,afterMaster?undefined:'AbortError');assert.equal(decks[2].syncRole,'primary');
 }
});
