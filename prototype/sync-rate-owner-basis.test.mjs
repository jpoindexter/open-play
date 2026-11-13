import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AudioEngine} from './engine.js';
import {createBeatgrid} from './beatgrid.js';

// Actual prepared group/Sync owners and cached renderer, controlled graph and
// resume boundaries. No PCM/native/hearing proof or warp rate conversion.
const text=readFileSync(new URL('./rate-failure-safety.test.mjs',import.meta.url),'utf8');
const base=new Function('AudioEngine',text.slice(text.indexOf('const deferred='),text.indexOf('\nfor(const reverse'))+';return fixture;')(AudioEngine);
const settle=promise=>promise.then(value=>({value}),error=>({error}));
async function fixture(warped=false){
 const f=base({loop:true,shift:12}),{engine,deck}=f;await engine.start(deck);
 const voice=engine.voices.get(deck.index);
 if(warped){
  Object.assign(deck,{position:7,anchorPosition:7});deck.track.gridWarpMarkers=[{time:5,bpm:150}];
  voice.gridTimeline=createBeatgrid(deck.track).timeline({position:7,when:1,bpm:120});
 }
 const rate=deck.rate,audible=engine.audibleRate(deck),clock=engine.voiceClock(deck,voice),releases=[];
 engine.resume=()=>new Promise(resolve=>releases.push(resolve));
 return{...f,voice,rate,audible,releases,
  begin:(kind,rate)=>kind==='group'?engine.setRate(deck,rate):engine.synchronize(deck,{rate,priorClock:clock,positionAt:clock})};
}
for(const warped of [false,true])for(const [older,newer]of [['group','group'],['sync','group'],['group','sync']])
 test(`${warped?'warped local rate':'flat'} ${older} → ${newer} cancellation restores committed nominal basis`,async()=>{
  const f=await fixture(warped),{engine,deck}=f,started=f.starts.length;
  const first=settle(f.begin(older,1.01));assert.equal(f.releases.length,1);
  const latest=settle(f.begin(newer,1.02));assert.equal(f.releases.length,2);
  engine.transforms.get(deck.index).abort();f.releases.forEach(release=>release());
  const results=await Promise.all([first,latest]);
  assert(results.every(result=>result.error?.name==='AbortError'));
  assert.equal(engine.voices.get(deck.index),f.voice);assert.equal(f.retired.length,0);
  assert.equal(f.starts.length,started);assert.equal(deck.rate,f.rate,'Never restore an earlier uncommitted request');
  assert.equal(engine.audibleRate(deck),f.audible);assert.equal(deck.playing,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
  if(warped){assert.equal(f.rate,1);assert.equal(f.audible,.8);assert.notEqual(deck.rate,engine.audibleRate(deck));}
 });
for(const kind of ['sync','group'])test(`${kind} preflight rejection preserves an older pending manual rate owner`,async()=>{
 const f=await fixture(),{engine,deck}=f;f.cache(.99);
 const manual=settle(f.begin('group',.99)),owner=engine.rateOwners.get(deck),token=engine.startTokens.get(deck.index),controller=engine.transforms.get(deck.index);
 assert.equal(f.releases.length,1);assert.equal(controller.signal.aborted,false);
 engine.onValidateTransport=()=>{throw Error('controlled transport preflight rejection');};
 const failed=await settle(f.begin(kind,1.02));
 const after={owner:engine.rateOwners.get(deck),token:engine.startTokens.get(deck.index),controller:engine.transforms.get(deck.index),
  aborted:controller.signal.aborted,rate:deck.rate,voice:engine.voices.get(deck.index)};
 engine.onValidateTransport=undefined;f.releases[0]();const completed=await manual;
 assert.match(failed.error?.message||'',/controlled transport preflight rejection/);assert.equal(completed.error,undefined);
 assert.equal(after.token,token);assert.equal(after.controller,controller);assert.equal(after.aborted,false);assert.equal(after.voice,f.voice);
 assert.equal(after.owner,owner,'Rejecting before a new start must not steal the still-pending manual owner');
 assert.equal(after.rate,.99);assert.equal(deck.rate,.99);assert.equal(deck.playing,true);
 assert.notEqual(engine.voices.get(deck.index),f.voice);assert.equal(engine.transforms.size,0);assert.equal(deck.processing,false);
});
test('overlapping paused group members inherit the original rate while sampler preparation rejects',async()=>{
 const engine=new AudioEngine(),deck={index:0,track:{id:'paused',bpm:120,duration:30},rate:1,playing:false};
 engine.ctx={currentTime:1};let rejectFirst,rejectLatest;
 const first=settle(engine.setSyncedRates([{deck,rate:1.01}],{participants:[{id:'sample',start:()=>new Promise((resolve,reject)=>{rejectFirst=reject;})}]}));
 const latest=settle(engine.setSyncedRates([{deck,rate:1.02}],{participants:[{id:'sample',start:()=>new Promise((resolve,reject)=>{rejectLatest=reject;})}]}));
 rejectFirst(Error('older sample rejected'));await first;assert.equal(deck.rate,1.02);
 rejectLatest(Error('latest sample rejected'));const result=await latest;assert.match(result.error?.message,/latest sample rejected/);
 assert.equal(deck.rate,1,'A paused member has no start but still owns an uncommitted group-rate change');
 assert.equal(deck.playing,false);assert.equal(engine.voices.size,0);
});
