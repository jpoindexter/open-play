import assert from 'node:assert/strict';
import {createSmartSync} from '../prototype/smart-sync.js';
import {createTempoSlider} from '../prototype/tempo-slider.js';
const tests=[],near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function fixture(extra={}){
 const deck={index:0,track:{id:'musical',bpm:120,grid:0,duration:6.8,gridWarpMarkers:[{time:1,bpm:150},{time:1.8,bpm:90}]},position:5,rate:1,playing:false,sync:false,syncState:'off',pitchRange:8,...extra};
 const state={settings:{'Sync Mode':'Smart Sync'},decks:[deck]},calls=[];
 const engine={ctx:{currentTime:2},voices:new Map(),position:d=>d.position,audibleRate:d=>d.playing?(d.audibleRate??d.rate):d.rate,start:async d=>{calls.push({rate:d.rate,bpm:sync.captureTempo(),position:d.position});},setRate:async(d,rate)=>{d.rate=rate;}};
 const sync=createSmartSync({engine,state});return{deck,state,engine,sync,calls};
}
async function check(name,run){try{await run();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
await check('First paused primary Sync at90BPM establishes nominal90/120 before absolute slider movement',async()=>{
 const f=fixture();await f.sync.press(f.deck);near(f.sync.captureTempo(),90);near(f.deck.rate,.75);
 const slider=createTempoSlider({setRate:async(d,r)=>{const bpm=f.sync.tempo(d,r);for(const member of f.state.decks)member.rate=bpm/member.track.bpm;}});near(slider.view(f.deck).position,-25);await slider.set(f.deck,-19);near(f.deck.rate,.81);near(f.sync.captureTempo(),97.2);
});
await check('Repeated primary Sync after a paused seek to150BPM retains the shared90BPM basis',async()=>{
 const f=fixture();await f.sync.press(f.deck);f.deck.position=1;await f.sync.press(f.deck);near(f.sync.captureTempo(),90);near(f.deck.rate,.75);
});
await check('First running primary Sync derives common tempo from local BPM and audible source rate',async()=>{
 const f=fixture({position:1.2,playing:true,audibleRate:.8,rate:.8});await f.sync.press(f.deck);near(f.sync.captureTempo(),120);near(f.deck.rate,1);assert.equal(f.calls.length,1);near(f.calls[0].bpm,120);
});
await check('Secondary arming uses the coherent shared tempo and its own base BPM',async()=>{
 const f=fixture();await f.sync.press(f.deck);const d={index:1,track:{bpm:100,grid:0,duration:20},position:0,playing:false,rate:1,sync:false,syncState:'off'};f.state.decks.push(d);await f.sync.press(d);near(d.rate,.9);near(f.sync.captureTempo(),90);assert.equal(d.syncState,'armed');
});
await check('Invalid nominal transport range rejects before publishing Sync state',async()=>{
 const f=fixture();f.deck.track={...f.deck.track,bpm:500,gridWarpMarkers:[{time:1,bpm:10}]};await assert.rejects(f.sync.press(f.deck),/range/);assert.equal(f.deck.sync,false);assert.equal(f.sync.captureTempo(),null);near(f.deck.rate,1);
});
console.log(JSON.stringify({passed:tests.every(t=>t.passed),scope:'Smart Sync/GUI coordinate integration with controlled engine collaborators; actual browser musical workflow required separately.',tests},null,2));if(tests.some(t=>!t.passed))process.exitCode=1;
