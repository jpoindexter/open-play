import test from 'node:test';
import assert from 'node:assert/strict';
import {createSmartSync} from './smart-sync.js';
import {createSyncTempoRequests} from './sync-tempo-requests.js';

test('failed tempo rollback belongs to its request, including same-BPM newer master',async()=>{
 for(const newerBPM of [null,90,132]){
  const decks=[120,100,newerBPM||90].map((bpm,index)=>({index,track:{id:String(index),bpm,grid:0,duration:100},playing:false,rate:index===1?1.2:1,position:0,sync:index<2,syncState:index<2?'armed':'off',syncRole:index===0?'primary':index===1?'secondary':null}));
  const state={decks,settings:{'Sync Mode':'Smart Sync'}};
  let reject,entered;const ready=new Promise(resolve=>entered=resolve);
  const engine={ctx:{currentTime:0},position:d=>d.position,audibleRate:d=>d.rate,setSyncedRates:()=>{entered();return new Promise((yes,no)=>reject=no);}};
  const smartSync=createSmartSync({engine,state});smartSync.setMaster(decks[0]);
  const request=createSyncTempoRequests({engine,state,smartSync,slicer:{changeRates:(changes,run)=>run()},participants:()=>[]});
  const pending=request(decks[0],1.1).then(()=>null,error=>error);await ready;
  assert.equal(smartSync.captureTempo(),132);
  if(newerBPM!==null)smartSync.setMaster(decks[2]);
  reject(Error('Controlled old preparation failure'));const error=await pending;
  assert.match(error.message,/Controlled old preparation/);
  assert.equal(smartSync.captureTempo(),newerBPM??120);
  assert.equal(decks[newerBPM===null?0:2].syncRole,'primary');
  assert.equal(decks.every(d=>!d.playing),true);
 }
});
