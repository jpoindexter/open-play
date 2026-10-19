import assert from 'node:assert/strict';
import {createSmartSync} from '../prototype/smart-sync.js';
import {createBeatgrid} from '../prototype/beatgrid.js';

async function attempt(change){
 const primary={index:1,track:{id:'warp',bpm:120,grid:0,duration:6.8,gridWarpMarkers:[{time:1,bpm:150},{time:1.8,bpm:90}]},rate:1.05,position:0,playing:false,loop:true,loopIn:1,loopOut:47/15,sync:false,stemSlip:'off'};
 const deck={index:0,track:{id:'flat',bpm:120,grid:0,duration:48},rate:1.05,position:.4,playing:true,loop:true,loopIn:0,loopOut:2,sync:false,stemSlip:'off'};
 const state={settings:{'Sync Mode':'Smart Sync'},decks:[deck,primary]};
 let sync;
 const engine={ctx:{currentTime:0},voices:new Map([[0,{}],[1,{}]]),startTokens:new Map([[0,1],[1,1]]),position:d=>d.position,audibleRate:d=>d===primary?(d.playing?.84:1.05):d.rate,voiceRateAt:()=>1.4,voiceClock:d=>d===primary?createBeatgrid(primary.track).timeline({position:1.79,when:0,bpm:126,loop:{start:1,end:47/15}}).clock:at=>deck.position+at*deck.rate,async synchronize(d,options){await Promise.resolve();change?.({primary,deck,sync,engine});const position=options.positionAt(.05);d.rate=options.rate;return{position,when:.05,rate:options.rate};}};
 sync=createSmartSync({engine,state});await sync.press(primary);assert.equal(primary.rate*primary.track.bpm,126);primary.playing=true;primary.position=1.79;primary.syncState='beat';
 return{request:sync.press(deck),deck};
}
const ordinary=await attempt();await ordinary.request;assert.equal(ordinary.deck.sync,true);assert.equal(ordinary.deck.syncState,'beat');
for(const change of [({primary})=>{primary.rate=1.06;},({primary,sync})=>{sync.tempo(primary,1.06);},({primary})=>{primary.playing=false;},({engine})=>{engine.startTokens.set(0,2); }]){
 const test=await attempt(change);await assert.rejects(test.request,{name:'AbortError'});assert.equal(test.deck.sync,false);
}
console.log(JSON.stringify({passed:true,scope:'Controlled Smart Sync collaborators: primary local warp progression versus nominal/shared-tempo changes, source Pause and own token cancellation. Actual browser phase/audio checked separately.',checks:['Natural local .84→1.4 progression at constant nominal126 joins Beat Sync','Primary nominal-rate change rejects stale join','Shared tempo changes before nominal transport commit reject stale join','Primary Pause before scheduling rejects','Joining deck current-owner token cancellation rejects']},null,2));
