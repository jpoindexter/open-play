import test from 'node:test';
import assert from 'node:assert/strict';
import {createSmartSync} from './smart-sync.js';
import {createSyncTempoRequests} from './sync-tempo-requests.js';

test('a rejected in-flight Sync tempo must not discard a newer queued deck adjustment',async()=>{
 const decks=[120,100].map((bpm,index)=>({index,track:{id:String(index),bpm,grid:0,duration:100},playing:false,rate:index?1.2:1,position:0,sync:true,syncState:'armed',syncRole:index?'secondary':'primary'}));
 const state={decks,settings:{'Sync Mode':'Smart Sync'}},calls=[];
 let reject,entered;const ready=new Promise(resolve=>entered=resolve);
 const engine={ctx:{currentTime:0},position:d=>d.position,audibleRate:d=>d.rate,setSyncedRates:changes=>{
  calls.push(changes.map(x=>x.rate));
  if(calls.length===1){entered();return new Promise((yes,no)=>reject=no);}
  changes.forEach(({deck,rate})=>deck.rate=rate);return Promise.resolve();
 }};
 const smartSync=createSmartSync({engine,state});smartSync.setMaster(decks[0]);
 const request=createSyncTempoRequests({engine,state,smartSync,slicer:{changeRates:(changes,run)=>run()},participants:()=>[]});
 const outcome=p=>p.then(()=>({ok:true}),error=>({ok:false,message:error.message}));
 const first=outcome(request(decks[0],1.1));await ready;
 const second=outcome(request(decks[1],1.25)),latest=outcome(request(decks[1],1.3));
 reject(Error('Controlled first preparation failure'));
 const results=await Promise.all([first,second,latest]);
 assert.deepEqual(results,[{ok:false,message:'Controlled first preparation failure'},{ok:true},{ok:true}]);
 assert.equal(calls.length,2,'queued inputs coalesce to the latest request, not a retry of the failed input');
 assert.deepEqual(calls[1],[130/120,1.3]);
 assert.equal(smartSync.captureTempo(),130);
 assert.equal(decks.every(d=>!d.playing),true);
});
