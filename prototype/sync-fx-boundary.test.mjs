import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createBeatgrid} from './beatgrid.js';
import {currentDeckBPM} from './deck-tempo.js';

// Actual group scheduling/FX-update methods; controlled adapter/graph/clock.
// This observes BPM parameter ownership, not DSP output or audible pops.
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const bus=()=>({gain:{value:1,setTargetAtTime(){}},connect(){},disconnect(){}});
function fixture({warped=false,noFXState=false}={}){
 const engine=new AudioEngine(),channels=[],units=[],errors=[];
 const a={index:0,track:{id:'keylock',bpm:120,grid:0,duration:100,gridWarpMarkers:warped?[{time:5,bpm:150}]:[]},
  rate:1,position:warped?7:10,anchorPosition:warped?7:0,anchorTime:warped?10:0,playing:true,keylock:true,sync:true,syncState:'beat'};
 const b={...a,index:1,track:{id:'raw',bpm:100,grid:0,duration:100},keylock:false,rate:1.2,position:12,anchorPosition:0,anchorTime:0};
 const c={...b,index:2,track:{id:'paused',bpm:90,grid:0,duration:100},rate:1,position:0,playing:false,syncState:'armed'};
 const decks=[a,b,c];engine.ctx={currentTime:10,sampleRate:48000,createBufferSource:()=>({playbackRate:{value:1},start(){},connect(){},disconnect(){},stop(){}})};
 engine.nodes=Array.from({length:4},()=>({deckInput:bus(),input:bus(),gain:bus(),channelEffect:{dispose(){}}}));
 engine.resume=async()=>{};engine.buffer=async()=>({duration:100,sampleRate:48000});
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);engine.retireVoiceAt=()=>{};engine.disposeVoice=()=>{};
 function adapter(options){let position=options.position,when=10,rate=options.rate;
  const node={outputs:[],snapshot:()=>({groups:[{latency:.12}]}),stateAt:()=>({rate}),
   position:at=>position+Math.max(0,(at??engine.ctx.currentTime)-when)*rate,async dispose(){},
   async start(next){position=next.position;when=next.when;return{position,when,playing:true};}};
  node.startTimeline=async next=>{rate=next.events[0].rate;return node.start(next);};return node;
 }
 const old={sources:[],liveKeylock:adapter({position:10,rate:1})};
 if(warped)old.gridTimeline=createBeatgrid(a.track).timeline({position:7,when:10,bpm:120});
 engine.voices.set(0,old);engine.voices.set(1,{sources:[{playbackRate:{value:1.2}}]});engine.createForwardKeylock=async options=>adapter(options);
 const smart=createSmartSync({engine,state:{decks,settings:{'Sync Mode':'Smart Sync'}}});smart.setMaster(a);
 engine.onGridTimeline=(d,options)=>smart.timeline(d,options);
 const musical=()=>decks.map(d=>currentDeckBPM(d,engine,{smartSync:true,targetBPM:smart.captureTempo()}));
 const f={engine,decks,smart,channels,units,errors,musical,hook:null};
 for(const [i,n]of engine.nodes.entries())n.channelBpm=musical()[i]??120;
 engine.fxState=noFXState?null:[[],[],[...musical(),120],[]];
 engine.applyChannelFX=async i=>{channels.push({index:i,at:engine.ctx.currentTime,bpm:engine.nodes[i].channelBpm,playing:decks[i]?.playing,musical:musical()[i]});await f.hook?.(i);};
 engine.configureFX=(banks,routes,bpms,tempo)=>{units.push({at:engine.ctx.currentTime,bpms:[...bpms]});engine.fxState=[banks,routes,[...bpms],tempo];};
 engine.onError=error=>errors.push(error);
 f.run=async()=>{const bpm=smart.tempo(a,1.1);await engine.setSyncedRates(decks.map(deck=>({deck,rate:bpm/deck.track.bpm})));};
 f.tick=()=>engine.updateFXBPMs([...musical(),120]);return f;
}

for(const options of [{warped:false},{warped:true},{warped:false,noFXState:true}])test(`group FX follows audible boundary with ${options.warped?'warped':'flat'} keylock, raw and paused decks${options.noFXState?' without unit FX state':''}`,async()=>{
 const f=fixture(options),{engine,decks}=f;await f.run();await settle();
 const boundary=decks[0].anchorTime;assert.equal(boundary,decks[1].anchorTime);assert.ok(engine.ctx.currentTime<boundary);
 assert.deepEqual(f.musical(),[120,120,132]);
 for(const row of f.channels.filter(row=>row.playing))assert.ok(Math.abs(row.bpm-row.musical)<1e-9,'Preparation or post-group FX used a requested/base BPM before it was audible');
 assert.deepEqual(engine.nodes.slice(0,3).map(n=>n.channelBpm),[120,120,132]);
 if(!options.noFXState)assert.deepEqual(engine.fxState[2].slice(0,3),[120,120,132]);
 else assert.equal(engine.fxState,null);
 engine.ctx.currentTime=boundary-1/48000;f.tick();await settle();assert.deepEqual(engine.nodes.slice(0,3).map(n=>n.channelBpm),[120,120,132]);
 engine.ctx.currentTime=boundary;f.tick();await settle();assert.deepEqual(engine.nodes.slice(0,3).map(n=>n.channelBpm),[132,132,132]);
 assert.deepEqual(f.errors,[]);
});

test('new replacement owner survives the paused channel FX callback from an older group',async()=>{
 const f=fixture(),{engine,decks}=f,done=deferred();let replaced=false;
 f.hook=async i=>{if(i!==2||replaced||engine.nodes[2].channelBpm!==132)return;replaced=true;await Promise.resolve();
  engine.pause(decks[0]);Object.assign(decks[0],{track:{id:'replacement',bpm:90,grid:0,duration:100},position:7,rate:.9,sync:false,syncState:'off'});
  f.tick();await Promise.resolve();done.resolve();
 };
 await f.run();await done.promise;await settle();
 assert.equal(decks[0].track.id,'replacement');assert.equal(decks[0].playing,false);assert.equal(decks[0].rate,.9);
 assert.equal(engine.nodes[0].channelBpm,81);assert.equal(engine.fxState[2][0],81,'An older group must not overwrite newer replacement FX metadata');
});

test('new independent paused rate retains channel and unit FX while the old group finishes',async()=>{
 const f=fixture(),{engine,decks,smart}=f,release=deferred(),began=deferred();let newer,requested=false;
 f.hook=async i=>{if(i===2&&engine.nodes[2].channelBpm===72){began.resolve();await release.promise;}};
 engine.onProcessing=d=>{if(d.index===0&&!d.processing&&!requested){requested=true;smart.disengage(decks[2]);newer=engine.setRate(decks[2],.8,{syncInternal:true});}};
 const group=f.run();await began.promise;await group;release.resolve();await newer;await settle();
 assert.equal(decks[2].sync,false);assert.equal(decks[2].rate,.8);assert.equal(decks[2].playing,false);
 assert.equal(engine.nodes[2].channelBpm,72,'Old unit-state snapshots must not reset a newer channel BPM');assert.equal(engine.fxState[2][2],72);
});

test('group FX callback errors are reported without rejecting an already committed transport',async()=>{
 const f=fixture();let reported=false;
 f.hook=async i=>{if(i===2&&!reported){reported=true;throw Error('controlled FX refresh failure');}};
 await f.run();await settle();assert.equal(f.decks[0].playing,true);assert.equal(f.decks[1].playing,true);
 assert.equal(f.errors.length,1);assert.match(f.errors[0].message,/controlled FX refresh failure/);
});

test('an older start resuming after replacement cannot write FX for its old track',async()=>{
 const f=fixture(),{engine,decks}=f,held=deferred(),deck=decks[0];
 engine.resume=()=>held.promise;const old=engine.start(deck);
 engine.pause(deck);Object.assign(deck,{track:{id:'newer-start',bpm:90,grid:0,duration:100},position:0,rate:.9,sync:false,syncState:'off'});
 engine.resume=async()=>{};await engine.start(deck);
 const writes=f.channels.length,voice=engine.voices.get(0),token=engine.startTokens.get(0);
 held.resolve();await old;
 assert.equal(f.channels.length,writes,'Revoked preparation must stop before channel FX writes');
 assert.equal(engine.nodes[0].channelBpm,81);assert.equal(engine.voices.get(0),voice);assert.equal(engine.startTokens.get(0),token);
 assert.equal(deck.track.id,'newer-start');assert.equal(deck.rate,.9);assert.equal(deck.processing,false);
});
