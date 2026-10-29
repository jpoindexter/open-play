import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createBeatgrid} from './beatgrid.js';
import {currentDeckBPM} from './deck-tempo.js';
import {createJogBend} from './jog-bend.js';

// Actual jog/group/start ownership; existing controlled graph/clock/adapters.
// Source-rate parameters are observed, not PCM, native or listening quality.
const source=readFileSync(new URL('./sync-fx-boundary.test.mjs',import.meta.url),'utf8');
const fixture=new Function('AudioEngine','createSmartSync','createBeatgrid','currentDeckBPM',source.slice(source.indexOf('const bus='),source.indexOf('\nfor(const options'))+';return fixture;')(AudioEngine,createSmartSync,createBeatgrid,currentDeckBPM);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};

test('blur release during rejected grouped tempo restores the retained raw voice nominal rate',async t=>{
 const f=fixture(),{engine,decks,smart}=f,deck=decks[1],voice=engine.voices.get(1),raw=voice.sources[0],held=deferred(),entered=deferred();
 const original=deck.rate,jog=createJogBend({engine});engine.onManualPosition=d=>smart.manipulated(d);
 t.after(()=>{held.resolve();for(const d of decks)engine.pause(d);});
 await jog.hold(deck,'keyboard:KeyH',1);assert.equal(raw.playbackRate.value,1.248);
 engine.createForwardKeylock=async()=>{entered.resolve();await held.promise;throw Error('controlled grouped preparation rejection');};
 const changing=f.run(),rejected=assert.rejects(changing,/grouped preparation rejection/);await entered.promise;
 assert.equal(deck.rate,1.32);assert.equal(deck.processing,true);assert.equal(engine.voices.get(1),voice);
 await jog.releaseHolds();const restoredBeforeFailure=raw.playbackRate.value;
 held.resolve();await rejected;
 assert.equal(restoredBeforeFailure,original,'Release must not apply a pending shared tempo to retained audio');
 assert.equal(deck.rate,original);assert.equal(raw.playbackRate.value,original);assert.equal(engine.voices.get(1),voice);
 assert.equal(deck.playing,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);assert.deepEqual(jog.diagnostics(),[]);
});

test('neutral restore uses only a matching pending owner and preserves newer same-voice rates',async()=>{
 const {engine,decks}=fixture(),deck=decks[1],voice=engine.voices.get(1),raw=voice.sources[0],owner=engine.captureRateChange(deck,1.32);
 try{
  engine.rateOwners.set(deck,owner);deck.rate=1.32;
  assert.deepEqual(await engine.setJogBend(deck,1),{rate:1.2,nominalRate:1.2});assert.equal(deck.rate,1.32);
  owner.pending=false;assert.deepEqual(await engine.setJogBend(deck,1),{rate:1.32,nominalRate:1.32});
  owner.pending=true;owner.track={};deck.rate=1.44;
  assert.deepEqual(await engine.setJogBend(deck,1),{rate:1.44,nominalRate:1.44});
  engine.rateOwners.set(deck,{});assert.equal(raw.playbackRate.value,1.44);
  assert.deepEqual(await engine.setJogBend(deck,1),{rate:1.44,nominalRate:1.44});
  assert.equal(voice.jogClock,undefined);await engine.setRate(deck,1.5,{syncInternal:true});
  const clock=engine.voiceClock(deck,voice),position=deck.anchorPosition,time=deck.anchorTime;
  assert.ok(Math.abs(clock(time+1)-(position+1.5))<1e-10,'Later same-voice rates must not reuse the released jog snapshot');
 }finally{for(const d of decks)engine.pause(d);}
});

test('release after a successful grouped handoff cannot reset its replacement voice',async()=>{
 const f=fixture(),{engine,decks,smart}=f,deck=decks[1],old=engine.voices.get(1),jog=createJogBend({engine});
 engine.onManualPosition=d=>smart.manipulated(d);
 try{
  await jog.hold(deck,'keyboard:KeyH',1);await f.run();const voice=engine.voices.get(1),rate=voice.sources[0].playbackRate.value;
  assert.notEqual(voice,old);assert.equal(deck.rate,1.32);assert.equal(rate,1.32);
  await jog.releaseHolds();assert.equal(engine.voices.get(1),voice);assert.equal(voice.sources[0].playbackRate.value,rate);assert.equal(deck.rate,1.32);assert.deepEqual(jog.diagnostics(),[]);
 }finally{for(const d of decks)engine.pause(d);}
});

test('a delayed successful group follows the retained raw clock after blur release',async t=>{
 const f=fixture(),{engine,decks,smart}=f,deck=decks[1],old=engine.voices.get(1),jog=createJogBend({engine}),held=deferred(),entered=deferred(),create=engine.createForwardKeylock;
 engine.onManualPosition=d=>smart.manipulated(d);t.after(()=>{held.resolve();for(const d of decks)engine.pause(d);});
 engine.createForwardKeylock=async options=>{entered.resolve();await held.promise;return create(options);};
 await jog.hold(deck,'keyboard:KeyH',1);const group=f.run();await entered.promise;
 engine.ctx.currentTime=10.1;await jog.releaseHolds();
 const position=deck.anchorPosition,time=deck.anchorTime,rate=old.sources[0].playbackRate.value;
 const expected=at=>position+Math.max(0,at-time)*rate;
 engine.ctx.currentTime=10.5;held.resolve();await group;
 assert.notEqual(engine.voices.get(1),old);assert.equal(rate,1.2);assert.equal(deck.rate,1.32);
 assert.ok(Math.abs(engine.position(deck)-expected(engine.ctx.currentTime))<1e-10,'Pre-boundary bridge must follow the retained source after release');
 assert.ok(Math.abs(deck.anchorPosition-expected(deck.anchorTime))<1e-10,'Scheduled position must use the same retained source clock');
 engine.ctx.currentTime=deck.anchorTime;assert.ok(Math.abs(engine.position(deck)-expected(deck.anchorTime))<1e-10);
});
