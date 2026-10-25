import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {synchronizeSimple} from './sync.js';
import {createBeatgrid} from './beatgrid.js';
import {createSmartSync} from './smart-sync.js';

function fixture(){
  const leader={index:0,track:{bpm:120,grid:0,duration:60},position:10.125,rate:1,playing:true};
  const deck={index:1,track:{bpm:100,grid:.2,duration:60},position:2.4,rate:1,playing:false};
  const calls=[];
  const engine={ctx:{currentTime:0},voices:new Map(),position:d=>d.position,audibleRate:d=>d.rate,
    voiceRateAt:d=>d.rate,voiceClock:d=>when=>d.position+(d.playing?when*d.rate:0),
    async buffer(){return {};},async setRate(d,rate){calls.push(['rate',d.index]);d.rate=rate;},
    async synchronize(d,{rate,positionAt}){calls.push(['align',d.index]);d.position=positionAt(0);d.rate=rate;d.playing=true;return {when:0,position:d.position};}};
  return {leader,deck,engine,calls};
}
const phase=d=>createBeatgrid(d.track).beatAt(d.position);
const beatDistance=(a,b)=>Math.abs((a-b)-Math.round(a-b));

test('playing Simple Sync aligns beat phase and leaves the outgoing clock untouched',async()=>{
  const {leader,deck,engine,calls}=fixture();deck.playing=true;
  const before={...leader};
  const result=await synchronizeSimple({engine,deck,leader,snapToGrid:true});
  assert.equal(result.kind,'grid');assert.equal(deck.rate,1.2);
  assert(beatDistance(phase(deck),phase(leader))<1e-10);
  assert.deepEqual(leader,before);assert.deepEqual(calls,[['align',1]]);
});
test('paused Simple Sync is tempo-only, not a promise of launch-phase alignment',async()=>{
  const {leader,deck,engine,calls}=fixture();
  const result=await synchronizeSimple({engine,deck,leader,snapToGrid:true});
  assert.equal(result.kind,'tempo');assert.equal(deck.playing,false);assert.equal(deck.position,2.4);
  assert(beatDistance(phase(deck),phase(leader))>.4);
  assert.deepEqual(calls,[['rate',1]]);
});
test('Smart Sync arms a paused follower and aligns its bar on launch',async()=>{
  const {leader,deck,engine,calls}=fixture();
  const smart=createSmartSync({engine,state:{settings:{'Sync Mode':'Smart Sync'},decks:[leader,deck]}});
  assert.equal(smart.setMaster(leader),true);await smart.press(deck);
  assert.equal(deck.syncState,'armed');assert.equal(deck.playing,false);
  assert.equal(await smart.start(deck),true);assert.equal(deck.syncState,'beat');
  const difference=phase(deck)-phase(leader);
  assert(Math.abs(difference/4-Math.round(difference/4))<1e-10);
  assert.deepEqual(calls,[['rate',1],['align',1]]);
});
test('actual Sync controls distinguish phase-aware Beat Sync from Simple Sync',()=>{
  const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
  const begin=source.indexOf('function syncControls(d) {'),end=source.indexOf('\nfunction smartSyncIndicator',begin);
  assert(begin>=0&&end>begin);
  for(const mode of ['Simple Sync','Smart Sync']){
    const d={index:0,track:{bpm:120,grid:0},playing:false,sync:true,syncState:'armed'};
    const context={isSimpleSyncPending:()=>false,smartSync:{pending:()=>false},state:{settings:{'Sync Mode':mode}},syncMaster:{master:()=>null},hasBeatgrid:()=>true};
    vm.runInNewContext(source.slice(begin,end)+';globalThis.markup=syncControls;',context);
    const html=context.markup(d);
    assert(html.includes(mode==='Smart Sync'?'>BEAT SYNC<':'>SIMPLE SYNC<'));
    assert.match(html,mode==='Smart Sync'?/bar phase/i:/paused.*tempo only/i);
  }
});
