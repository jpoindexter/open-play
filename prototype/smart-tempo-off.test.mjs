import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';

// Actual tempo-only Smart Sync and engine/group/start ownership; controlled
// graph/clock/adapter ACK. No PCM, native, UI or listening proof.
function fixture(committedLive=false){
 const engine=new AudioEngine(),retired=[],adapters=[],acks=[];
 const track=bpm=>({bpm,grid:0,duration:60});
 const deck={index:1,track:track(120),playing:true,processing:false,position:3,anchorPosition:3,anchorTime:1,rate:1,keylock:true,sync:false,syncState:'off'};
 const leader={...deck,index:0,track:track(126),playing:false,keylock:false};
 const old={sources:[{playbackRate:{value:1}}]};
 if(committedLive){
  let rate=1;
  old.liveKeylock={position:at=>3+Math.max(0,(at??engine.ctx.currentTime)-1)*rate,stateAt:()=>({rate}),async dispose(){},
   async update(next){await new Promise(resolve=>{acks[0]={release:resolve};});rate=next.rate;return{position:3,when:1};}};
 }
 engine.ctx={currentTime:1};engine.nodes[0]={};engine.nodes[1]={};
 engine.resume=async()=>{};engine.applyChannelFX=async()=>{};
 engine.onRateRequest=()=>{throw Error('Sync must bypass the manual tempo queue');};
 engine.buffer=async()=>({duration:60,sampleRate:44100,length:2646000});
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};
 engine.routeOrdinaryVoice=(d,voice)=>engine.voices.set(d.index,voice);
 engine.retireVoiceAt=(index,voice)=>retired.push(voice);
 engine.disposeVoice=(index,voice)=>voice.liveKeylock?.dispose();
 engine.voices.set(1,old);engine.startTokens.set(1,7);
 engine.createForwardKeylock=async options=>{
  const index=adapters.length;let position=options.position,when=1;
  const adapter={outputs:[],disposed:false,snapshot:()=>({groups:[{latency:.02}]}),stateAt:()=>({rate:options.rate}),
   position:at=>position+Math.max(0,(at??engine.ctx.currentTime)-when)*options.rate,
   async dispose(){this.disposed=true;},
   start:async settings=>{position=settings.position;when=settings.when;return new Promise(resolve=>{
    acks[index]={signal:options.signal,when,release:()=>resolve({position,when,playing:true})};});}};
  adapters.push(adapter);return adapter;
 };
 const smart=createSmartSync({engine,state:{decks:[leader,deck],settings:{'Sync Mode':'Smart Sync'}}});smart.setMaster(leader);
 return{engine,deck,smart,old,retired,adapters,acks,
  async untilAck(index){for(let n=0;n<150&&!acks[index];n++)await Promise.resolve();assert.ok(acks[index]);},
  async cleanup(){engine.pause(deck);engine.pause(leader);for(const adapter of adapters)await adapter.dispose();
   assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert.equal(engine.syncedRateRequests.has(deck),false);assert.equal(smart.pending(deck),false);}};
}
const settle=promise=>promise.then(()=>null,error=>error);
test('first OFF cancels only the owned pending tempo-only replacement and retains committed pitch',async()=>{
 const f=fixture(),{engine,deck,smart,old,acks}=f;
 try{
  const pending=settle(smart.press(deck));await f.untilAck(0);
  const owner=engine.rateOwners.get(deck),token=engine.startTokens.get(1);
  assert.equal(token,8);assert.equal(owner.previousRate,1);
  smart.disengage(deck);assert.equal(acks[0].signal.aborted,true);acks[0].release();
  assert.equal((await pending)?.name,'AbortError');
  assert.equal(deck.rate,1);assert.equal(engine.voices.get(1),old);assert.equal(f.retired.length,0);
  assert.equal(deck.sync,false);assert.equal(deck.processing,false);assert.equal(f.adapters[0].disposed,true);

  // A completed retry owns its matched pitch; first OFF keeps that pitch.
  const retry=settle(smart.press(deck));await f.untilAck(1);acks[1].release();assert.equal(await retry,null);
  const committed=engine.voices.get(1);smart.disengage(deck);
  assert.equal(deck.rate,1.05);assert.equal(engine.voices.get(1),committed);assert.equal(deck.sync,false);
 }finally{await f.cleanup();}
});
test('OFF cannot abort the newer manual tempo replacement',async()=>{
 const f=fixture(),{engine,deck,smart,acks}=f;
 try{
  const older=settle(smart.press(deck));await f.untilAck(0);
  const newer=settle(engine.setRate(deck,1.1,{syncInternal:true}));await f.untilAck(1);
  const owner=engine.rateOwners.get(deck),token=engine.startTokens.get(1);
  smart.disengage(deck);assert.equal(acks[1].signal.aborted,false);
  acks[0].release();acks[1].release();
  assert.equal((await older)?.name,'AbortError');assert.equal(await newer,null);
  assert.equal(deck.rate,1.1);assert.equal(engine.startTokens.get(1),token);assert.equal(engine.rateOwners.get(deck),owner);
  assert.equal(engine.voices.get(1).liveKeylock,f.adapters[1]);assert.equal(deck.sync,false);
 }finally{await f.cleanup();}
});

test('OFF before a committed live adapter is reprogrammed retains the old audible rate',async()=>{
 const f=fixture(true),{deck,smart,old,engine,acks}=f;
 try{
  const pending=settle(smart.press(deck));await f.untilAck(0);
  assert.equal(old.liveKeylock.stateAt().rate,1);
  smart.disengage(deck);acks[0].release();assert.equal((await pending)?.name,'AbortError');
  assert.equal(old.liveKeylock.stateAt().rate,1,'No canceled Sync update may newly program the retained adapter');
  assert.equal(deck.rate,1);assert.equal(engine.voices.get(1),old);assert.equal(deck.sync,false);assert.equal(deck.playing,true);
  assert.equal(f.retired.length,0);
  const retry=settle(smart.press(deck));await f.untilAck(1);acks[1].release();assert.equal(await retry,null);
  const committed=engine.voices.get(1),token=engine.startTokens.get(1);smart.disengage(deck);
  assert.equal(engine.voices.get(1),committed);assert.equal(deck.rate,1.05);assert.equal(engine.startTokens.get(1),token);
  assert.equal(old.liveKeylock.stateAt().rate,1,'Only the replacement receives the accepted new pitch');
 }finally{await f.cleanup();}
});
