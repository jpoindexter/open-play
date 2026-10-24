import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createBeatgrid} from './beatgrid.js';

// Actual Sync/start/forward-keylock ownership; controlled graph, clock and ACKs.
// No PCM, adapter DSP, listening or native-runtime acceptance is established.
function fixture(warped=false){
 const engine=new AudioEngine(),old={sources:[{playbackRate:{value:1}}]},routes=[],retired=[],acks=[],adapters=[];
 const track={id:'incoming',bpm:120,grid:0,duration:30,gridWarpMarkers:warped?[{time:10,bpm:130}]:[]};
 const deck={index:1,track,position:3,rate:1,anchorPosition:3,anchorTime:1,playing:true,keylock:true};
 const leader={...deck,index:0,keylock:false,track:{id:'outgoing',bpm:126,grid:0,duration:30}};
 engine.ctx={currentTime:1};engine.nodes[1]={};engine.resume=async()=>{};engine.applyChannelFX=async()=>{};
 engine.buffer=async()=>({duration:30,sampleRate:44100});
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.voices.set(1,old);
 engine.routeOrdinaryVoice=(d,v)=>{routes.push(adapters.indexOf(v.liveKeylock));engine.voices.set(d.index,v);};
 engine.retireVoiceAt=(i,v)=>retired.push(v);engine.disposeVoice=()=>{};
 engine.createForwardKeylock=async options=>{
  const index=adapters.length;let position=options.position,when=1,disposed=false;
  const adapter={outputs:[],snapshot:()=>({groups:[{latency:.02}]}),stateAt:()=>({rate:options.rate}),
   position:at=>position+Math.max(0,(at??engine.ctx.currentTime)-when)*options.rate,
   async dispose(){disposed=true;},get disposed(){return disposed;}};
  const start=async settings=>{
   position=settings.position;when=settings.when;
   return new Promise(resolve=>{acks[index]={signal:options.signal,method:settings.events?'startTimeline':'start',
    release(){resolve({position,when,playing:true});}};});
  };
  adapter.start=start;adapter.startTimeline=start;adapters.push(adapter);return adapter;
 };
 const smart=createSmartSync({engine,state:{settings:{'Sync Mode':'Smart Sync'},decks:[leader,deck]}});
 smart.setMaster(leader);
 engine.onGridWillChange=track=>smart.captureGrid(track);
 engine.onGridChanged=(track,before)=>smart.edited(track,before);
 engine.onGridTimeline=(d,options)=>smart.timeline(d,options);
 return{engine,deck,leader,smart,old,routes,retired,acks,adapters};
}
async function until(fn){
 for(let n=0;n<100;n++){if(fn())return;await Promise.resolve();}
 assert.fail('Actual forward-keylock start did not reach the held adapter ACK');
}
async function saveGrid({engine,deck}){
 const track=deck.track,before=engine.onGridWillChange(track);
 Object.assign(track,{bpm:100,grid:.1,metadataRevision:(track.metadataRevision||0)+1});
 await engine.onGridChanged(track,before);
}

for(const warped of [false,true])test(`grid save after ${warped?'warped startTimeline':'flat start'} validation cannot commit canceled Sync audio`,async()=>{
 const f=fixture(warped),{engine,deck,leader,smart,old,acks,adapters,routes,retired}=f,before={...leader};
 const pending=smart.press(deck),rejected=assert.rejects(pending,{name:'AbortError'});
 await until(()=>acks[0]);assert.equal(acks[0].method,warped?'startTimeline':'start');
 assert.equal(deck.processing,true);assert.equal(!!deck.sync,false);assert.equal(engine.voices.get(1),old);
 await saveGrid(f);const abortedAtSave=acks[0].signal.aborted;
 acks[0].release();await rejected;
 assert.equal(abortedAtSave,true,'The still-owned Sync adapter must be aborted before its pending ACK can commit');
 assert.equal(engine.voices.get(1),old);assert.deepEqual(routes,[]);assert.deepEqual(retired,[]);
 assert.equal(adapters[0].disposed,true);assert.equal(deck.rate,1);assert.equal(deck.playing,true);
 assert.equal(!!deck.sync,false);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 assert.deepEqual(leader,before,'Saving incoming grid metadata must retain the outgoing master');
});

test('grid save during an armed Play cancels its ACK and the next Play uses the edited grid',async()=>{
 const f=fixture(),{engine,deck,leader,smart,acks,adapters,routes,retired}=f,before={...leader};
 deck.playing=false;engine.voices.delete(deck.index);await smart.press(deck);
 assert.equal(deck.syncState,'armed');assert.equal(deck.rate,1.05);
 const pending=smart.start(deck),rejected=assert.rejects(pending,{name:'AbortError'});
 await until(()=>acks[0]);await saveGrid(f);const abortedAtSave=acks[0].signal.aborted;
 acks[0].release();await rejected;
 assert.equal(abortedAtSave,true,'An armed Play owns an alignment even after its Sync press has settled');
 assert.equal(deck.playing,false);assert.equal(engine.voices.size,0);assert.deepEqual(routes,[]);assert.deepEqual(retired,[]);
 assert.equal(adapters[0].disposed,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 assert.equal(deck.rate,1.26,'Cancellation must retain the edited armed tempo');assert.equal(deck.syncState,'armed');
 const fresh=smart.start(deck);await until(()=>acks[1]);acks[1].release();await fresh;
 assert.equal(deck.playing,true);assert.equal(deck.syncState,'beat');assert.equal(deck.rate,1.26);assert.deepEqual(routes,[1]);
 assert.equal(engine.voices.get(deck.index).liveKeylock,adapters[1]);
 engine.ctx.currentTime=deck.anchorTime+1;assert.equal(engine.audibleRate(deck),1.26);
 const own=createBeatgrid(deck.track).beatAt(engine.position(deck)),primary=createBeatgrid(leader.track).beatAt(engine.position(leader));
 assert.ok(Math.abs(((own-primary+2)%4+4)%4-2)<1e-9,'Fresh Play must keep phase against the current grid after handoff');
 assert.deepEqual(leader,before);
});

test('grid capture cannot abort a newer unrelated manual start while an older Sync ACK remains pending',async()=>{
 const f=fixture(),{engine,deck,leader,smart,old,acks,adapters,routes,retired}=f,before={...leader};
 const pending=smart.press(deck),rejected=assert.rejects(pending,{name:'AbortError'});
 await until(()=>acks[0]);
 deck.rate=.9;const manual=engine.start(deck);await until(()=>acks[1]);
 assert.equal(acks[0].signal.aborted,true,'The newer start supersedes the old Sync transform');
 await saveGrid(f);const manualAbortedAtSave=acks[1].signal.aborted;
 acks[1].release();await manual;acks[0].release();await rejected;
 assert.equal(manualAbortedAtSave,false,'Old pending Sync bookkeeping must not cancel the newer transform');
 assert.deepEqual(routes,[1]);assert.deepEqual(retired,[old]);
 assert.equal(engine.voices.get(1).liveKeylock,adapters[1]);assert.equal(adapters[0].disposed,true);
 assert.equal(adapters[1].disposed,false);assert.equal(deck.rate,.9);assert.equal(deck.playing,true);
 assert.equal(!!deck.sync,false);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 engine.ctx.currentTime=deck.anchorTime+.1;assert.equal(engine.audibleRate(deck),.9);
 assert.deepEqual(leader,before);
});
