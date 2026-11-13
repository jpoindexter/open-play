import test from 'node:test';
import assert from 'node:assert/strict';
import {createSmartSync} from './smart-sync.js';
import {createBeatgrid} from './beatgrid.js';

function fixture(){
 const track={id:'warped',bpm:120,grid:0,duration:30,gridWarpMarkers:[{time:2,bpm:121}]},grid=createBeatgrid(track);
 const deck={index:0,track,position:3,rate:1.1,playing:true,loop:true,loopIn:2,loopOut:grid.timeAt(grid.beatAt(2)+8),sync:false,syncRole:null,syncState:'off'};
 const old={sources:[]};let reject,resolve;
 const engine={voices:new Map([[0,old]]),startTokens:new Map([[0,1]]),position:d=>d.position,audibleRate:d=>d.rate,
  start(d){this.startTokens.set(d.index,this.startTokens.get(d.index)+1);return new Promise((a,b)=>{resolve=()=>{this.voices.set(d.index,{sources:[]});a();};reject=b;});}};
 const state={settings:{'Sync Mode':'Smart Sync'},decks:[deck]},smart=createSmartSync({engine,state});smart.restoreTempo(90);
 return{deck,engine,smart,old,state,resolve:()=>resolve(),reject:()=>reject(Error('Sync start missed its lead; previous audio retained.'))};
}
const status=d=>({rate:d.rate,sync:d.sync,syncRole:d.syncRole,syncState:d.syncState});

test('failed uncommitted primary start restores prior controls and shared tempo',async()=>{
 const f=fixture(),before=status(f.deck),pending=f.smart.press(f.deck);f.reject();
 await assert.rejects(pending,/missed its lead/);assert.deepEqual(status(f.deck),before);assert.equal(f.smart.captureTempo(),90);assert.equal(f.engine.voices.get(0),f.old);assert.equal(f.deck.playing,true);
});
test('on-time primary start retains its new Sync state and shared tempo',async()=>{
 const f=fixture(),pending=f.smart.press(f.deck),bpm=f.smart.captureTempo();f.resolve();await pending;
 assert.equal(f.deck.sync,true);assert.equal(f.deck.syncRole,'primary');assert.equal(f.deck.syncState,'beat');assert.equal(f.smart.captureTempo(),bpm);assert.notEqual(f.engine.voices.get(0),f.old);
});
for(const command of ['stop','replacement','new start','master','committed owner'])test(`failed older primary start cannot overwrite newer ${command}`,async()=>{
 const f=fixture(),pending=f.smart.press(f.deck);
 if(command==='stop'){f.engine.startTokens.set(0,3);f.deck.playing=false;f.deck.position=9;f.smart.paused(f.deck);}
 if(command==='replacement'){f.deck.track={...f.deck.track,id:'replacement'};f.deck.rate=.9;f.smart.loaded(f.deck,{engaged:false});}
 if(command==='new start'){f.engine.startTokens.set(0,3);f.deck.rate=.9;f.deck.syncState='tempo';}
 if(command==='master')f.smart.setMaster(f.deck);
 if(command==='committed owner')f.engine.voices.set(0,{sources:[]});
 const newer={...status(f.deck),position:f.deck.position,tempo:f.smart.captureTempo()};f.reject();await assert.rejects(pending,/missed its lead/);
 assert.deepEqual({...status(f.deck),position:f.deck.position,tempo:f.smart.captureTempo()},newer);
});
