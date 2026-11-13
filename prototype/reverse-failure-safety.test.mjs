import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AudioEngine} from './engine.js';
// Reuse the cached real-renderer/controlled-graph fixture; no DSP quality proof.
const source=readFileSync(new URL('./rate-failure-safety.test.mjs',import.meta.url),'utf8');
const fixture=new Function('AudioEngine',source.slice(source.indexOf('const bus='),source.indexOf('\nfor(const reverse'))+';return fixture;')(AudioEngine);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function ready(){const f=fixture({loop:true,shift:12});await f.engine.start(f.deck);return f;}
async function waitFor(test){for(let n=0;n<100;n++){if(test())return;await Promise.resolve();}assert.fail('Preparation did not reach controlled wait');}
test('rejected Reverse retains playable direction, voice and source clock',async()=>{
 for(const preflight of [false,true]){
 const f=await ready(),{engine,deck}=f,voice=engine.voices.get(0),started=f.starts.length,stopped=f.stops.length,position=engine.position(deck);
 if(preflight)deck.track.missing=true;else engine.keylockRenderer.render=async()=>{throw Error('controlled pitch memory rejection');};
 await assert.rejects(engine.setReverse(deck,true),/pitch memory rejection|File missing/);
 assert.equal(deck.playing,true);assert.equal(deck.reverse,false);assert.equal(engine.voices.get(0),voice);assert.equal(engine.position(deck),position);
 assert.equal(f.starts.length,started);assert.equal(f.stops.length,stopped);assert.deepEqual(f.retired,[]);assert.equal(deck.processing,false);
 }
});
test('held Reverse keeps the audible forward clock until a future reverse handoff',async()=>{
 const f=await ready(),{engine,deck}=f,old=engine.voices.get(0),clock=engine.voiceClock(deck,old),held=deferred(),render=engine.keylockRenderer.render.bind(engine.keylockRenderer);let waiting=false;
 engine.keylockRenderer.render=async(...args)=>{waiting=true;await held.promise;return render(...args);};const changing=engine.setReverse(deck,true);
 try{await waitFor(()=>waiting);engine.ctx.currentTime+=.1;assert.equal(deck.playing,true);assert.equal(engine.voices.get(0),old);assert.ok(Math.abs(engine.position(deck)-clock(engine.ctx.currentTime))<1e-12);}
 finally{held.resolve();await changing;}
 const voice=engine.voices.get(0),when=deck.anchorTime;assert.equal(voice.handoffBefore.owner,old);assert.equal(voice.reverse,true);assert.ok(Math.abs(deck.anchorPosition-clock(when))<1e-12);assert.deepEqual(f.retired,[old]);
 engine.ctx.currentTime=when+.01;assert.ok(Math.abs(engine.position(deck)-(deck.anchorPosition-.01))<1e-12);
});
test('overlapping rejected Reverse restores the retained committed direction',async()=>{
 for(const committedReverse of [false,true]){
 const f=await ready(),{engine,deck}=f;
 if(committedReverse)await engine.setReverse(deck,true);
 const voice=engine.voices.get(0),clock=engine.voiceClock(deck,voice),started=f.starts.length,stopped=f.stops.length,retired=f.retired.length,held=deferred(),render=engine.keylockRenderer.render.bind(engine.keylockRenderer);let calls=0;
 engine.keylockRenderer.render=async(...args)=>{if(++calls===1){await held.promise;return render(...args);}throw Error('controlled newer Reverse rejection');};
 const older=engine.setReverse(deck,!committedReverse),aborted=assert.rejects(older,{name:'AbortError'});
 try{
  await waitFor(()=>calls===1);
  await assert.rejects(engine.setReverse(deck,committedReverse),/newer Reverse rejection/);
 }finally{held.resolve();await aborted;}
 assert.equal(deck.reverse,committedReverse);assert.equal(engine.voices.get(0),voice);assert.equal(deck.playing,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 engine.ctx.currentTime+=.2;assert.ok(Math.abs(engine.position(deck)-clock(engine.ctx.currentTime))<1e-12);
 assert.equal(f.starts.length,started);assert.equal(f.stops.length,stopped);assert.equal(f.retired.length,retired);
 engine.pause(deck);assert.equal(deck.playing,false);assert.equal(engine.voices.size,0);
 }
});
for(const replacement of [false,true])test(`${replacement?'replacement':'Stop'} revokes an older Reverse preparation`,async()=>{
 const f=await ready(),{engine,deck}=f,held=deferred(),render=engine.keylockRenderer.render.bind(engine.keylockRenderer);let waiting=false;
 engine.keylockRenderer.render=async(...args)=>{waiting=true;await held.promise;return render(...args);};
 const changing=engine.setReverse(deck,true),rejected=assert.rejects(changing,{name:'AbortError'});await waitFor(()=>waiting);engine.pause(deck);
 if(replacement){Object.assign(deck,{track:{id:'new-reverse-owner',duration:30,bpm:100,grid:0},reverse:false,loop:false,keyShift:0,position:7});engine.keylockRenderer.render=render;await engine.start(deck);}
 const voice=engine.voices.get(0),token=engine.startTokens.get(0),started=f.starts.length;held.resolve();await rejected;
 assert.equal(engine.voices.get(0),voice);assert.equal(engine.startTokens.get(0),token);assert.equal(f.starts.length,started);assert.equal(deck.playing,replacement);assert.equal(deck.processing,false);if(replacement)assert.equal(deck.reverse,false);
});
test('active scratch and censor keep their existing Reverse transition policy',async()=>{
 for(const kind of ['deckScratchTransport','censorReverse']){const {engine,deck}=await ready(),calls=[];engine.voices.get(0)[kind]={};engine.pause=()=>{calls.push('pause');deck.playing=false;};engine.start=async(_d,options)=>{calls.push(options);deck.playing=true;};await engine.setReverse(deck,true);assert.deepEqual(calls,['pause',undefined]);assert.equal(deck.reverse,true);}
});
