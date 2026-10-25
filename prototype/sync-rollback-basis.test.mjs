import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import * as simple from './sync.js';
import {createSmartSync,hasBeatgrid,beatPosition} from './smart-sync.js';

// Actual lifecycle controller/Sync/engine; reuse held graph/clock/ACK assets.
// This proves nominal rollback ownership, not PCM/native/audible output.
const source=readFileSync(new URL('./simple-sync-lifecycle.test.mjs',import.meta.url),'utf8');
const prelude=source.slice(source.indexOf('// Actual controller'),source.indexOf('\nfor(const shift'))
 .replace('new URL(file,import.meta.url)','new URL(file,prototypeBase)');
const helpers=new Function('readFileSync','URL','prototypeBase','vm','AudioEngine','simple','createSmartSync','hasBeatgrid','beatPosition','assert',prelude+';return{fixture,held,until,settle};')
 (readFileSync,URL,new URL('./',import.meta.url),vm,AudioEngine,simple,createSmartSync,hasBeatgrid,beatPosition,assert);
function fixture(){
 const f=helpers.fixture(),original=f.engine.voices.get(1);original.sources=[{playbackRate:{value:1}}];
 return{...f,...helpers.held(f),original};
}
async function press(f,index){
 const pending=helpers.settle(f.press());if(index===0)f.release();await helpers.until(()=>f.acks[index]);return{pending};
}
async function overlap(f,count){
 const jobs=[];for(let n=0;n<count;n++)jobs.push((await press(f,n)).pending);
 for(let n=0;n<count-1;n++){f.acks[n].release();const result=await jobs[n];assert.equal(result.error?.name,'AbortError');
  assert.equal(simple.isSimpleSyncPending(f.deck),true,'An older finally cannot clear the latest pending request');}
 return{pending:jobs.at(-1)};
}

for(const count of [2,3])for(const action of ['OFF','Stop','reject'])test(`${count} overlapping Simple requests then ${action} restore the original nominal basis`,async()=>{
 const f=fixture(),latest=(await overlap(f,count)).pending;
 if(action==='OFF')await f.off();
 if(action==='Stop')f.engine.pause(f.deck);
 if(action==='reject')f.engine.ctx.currentTime=2; // Actual future-start deadline rejection.
 f.acks[count-1].release();const result=await latest;
 if(action==='reject')assert.match(result.error?.message,/missed its lead/);else assert.equal(result.error?.name,'AbortError');
 assert.equal(f.deck.rate,1,'Canceled requests must not restore an older optimistic Sync target');
 assert.equal(simple.isSimpleSyncPending(f.deck),false);assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
 assert.equal(f.retired.length,0);assert.equal(f.starts.length,0);
 if(action==='Stop'){assert.equal(f.deck.playing,false);assert.equal(f.engine.voices.has(1),false);}
 else{assert.equal(f.deck.playing,true);assert.equal(f.engine.voices.get(1),f.original);assert.equal(f.engine.audibleRate(f.deck),1);}
 if(action==='OFF')assert.equal(f.deck.sync,false);
});

for(const count of [2,3])test(`${count} overlapping Simple requests preserve the newest successful rate`,async()=>{
 const f=fixture(),latest=(await overlap(f,count)).pending;f.acks[count-1].release();const result=await latest;
 assert.equal(result.error,undefined);assert.equal(f.deck.rate,1.05);assert.equal(f.deck.playing,true);
 f.engine.ctx.currentTime=f.deck.anchorTime+.1;assert.equal(f.engine.audibleRate(f.deck),1.05);
 assert.notEqual(f.engine.voices.get(1),f.original);assert.equal(f.retired.length,1);assert.equal(simple.isSimpleSyncPending(f.deck),false);
});

for(const change of ['manual rate','new track','new voice'])test(`${change} breaks inheritance of an older uncommitted Sync basis`,async()=>{
 const f=fixture(),first=(await press(f,0)).pending;let manual,expected;
 if(change==='manual rate'){manual=f.engine.setRate(f.deck,.9);expected=.9;}
 else if(change==='new track'){
  f.engine.pause(f.deck);Object.assign(f.deck,{track:{id:'new-basis',bpm:128,grid:0,duration:60},rate:.9});
  manual=f.engine.start(f.deck);expected=.9;
 }else{manual=f.engine.setPitch(f.deck,{keylock:true,semitones:3});expected=1.05;}
 await helpers.until(()=>f.acks[1]);f.acks[1].release();await manual;
 const voice=f.engine.voices.get(1),track=f.deck.track,token=f.engine.startTokens.get(1),retired=f.retired.length;
 f.engine.ctx.currentTime=f.deck.anchorTime+.02;
 const latest=(await press(f,2)).pending;f.acks[0].release();const old=await first;
 assert.equal(old.error?.name,'AbortError');assert.equal(simple.isSimpleSyncPending(f.deck),true);
 await f.off();f.acks[2].release();const result=await latest;assert.equal(result.error?.name,'AbortError');
 assert.equal(f.deck.rate,expected);assert.equal(f.deck.track,track);assert.equal(f.deck.playing,true);
 assert.equal(f.engine.voices.get(1),voice);assert.ok(f.engine.startTokens.get(1)>token);assert.equal(f.retired.length,retired);
 assert.equal(simple.isSimpleSyncPending(f.deck),false);assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
});
test('settled rate ownership releases earlier owner and audio-candidate references',async()=>{
 const f=fixture(),first=(await press(f,0)).pending,prior=f.engine.rateOwners.get(f.deck),firstController=f.engine.transforms.get(1);
 const latest=(await press(f,1)).pending,lastController=f.engine.transforms.get(1);
 f.acks[0].release();assert.equal((await first).error?.name,'AbortError');
 f.acks[1].release();assert.equal((await latest).error,undefined);
 const values=Object.values(f.engine.rateOwners.get(f.deck));
 for(const retired of [f.original,prior,firstController,lastController])assert.equal(values.includes(retired),false,'The current ownership slot must not retain a settled history or audio candidate');
});
