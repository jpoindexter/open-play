import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';

// Actual warped-primary start/rollback with controlled graph, clock and ACKs.
// No PCM, adapter DSP, UI, native performance or musical acceptance.
function fixture(){
 const engine=new AudioEngine(),old={sources:[{playbackRate:{value:1}}]},acks=[],adapters=[],routes=[],retired=[];
 const track={id:'primary',bpm:120,grid:0,duration:30,gridWarpMarkers:[{time:10,bpm:130}]};
 const deck={index:1,track,position:12,rate:1,anchorPosition:12,anchorTime:1,playing:true,keylock:true};
 const state={settings:{'Sync Mode':'Smart Sync'},decks:[deck]};
 engine.ctx={currentTime:1};engine.nodes[1]={};engine.resume=async()=>{};engine.applyChannelFX=async()=>{};
 engine.buffer=async()=>({duration:30,sampleRate:44100});
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.disposeVoice=()=>{};
 engine.voices.set(1,old);engine.routeOrdinaryVoice=(d,v)=>{routes.push(adapters.indexOf(v.liveKeylock));engine.voices.set(d.index,v);};
 engine.retireVoiceAt=(i,v)=>retired.push(v);
 engine.createForwardKeylock=async options=>{
  const index=adapters.length;let position=options.position,when=1,disposed=false;
  const adapter={outputs:[],snapshot:()=>({groups:[{latency:.02}]}),stateAt:()=>({rate:options.rate}),
   position:at=>position+Math.max(0,(at??engine.ctx.currentTime)-when)*options.rate,
   async dispose(){disposed=true;},get disposed(){return disposed;}};
  const start=async settings=>{
   position=settings.position;when=settings.when;
   return new Promise((resolve,reject)=>{acks[index]={signal:options.signal,
    release(){resolve({position,when,playing:true});},reject};});
  };
  adapter.start=start;adapter.startTimeline=start;adapters.push(adapter);return adapter;
 };
 const smart=createSmartSync({engine,state});engine.onGridTimeline=(d,options)=>smart.timeline(d,options);
 return{engine,deck,state,smart,old,acks,adapters,routes,retired};
}
const settled=p=>p.then(value=>({ok:true,value}),error=>({ok:false,error}));
const aborted=result=>{assert.equal(result.ok,false);assert.equal(result.error.name,'AbortError');};
async function until(test){
 for(let n=0;n<100;n++){if(test())return;await Promise.resolve();}
 assert.fail('Actual warped-primary preparation did not reach the held ACK');
}
async function overlap(f){
 const first=settled(f.smart.press(f.deck));await until(()=>f.acks[0]);
 const second=settled(f.smart.press(f.deck));await until(()=>f.acks[1]);
 assert.equal(f.deck.rate,130/120);assert.equal(f.engine.voices.get(1),f.old);
 return{first,second};
}
function unchangedAudio(f,voice=f.old){
 assert.equal(f.engine.voices.get(1),voice);assert.equal(f.deck.playing,true);
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
}

for(const action of ['OFF','reset','mode reset'])test(`overlapping warped-primary ${action} restores the original nominal rate`,async()=>{
 const f=fixture(),{first,second}=await overlap(f);f.acks[0].release();aborted(await first);
 assert.equal(f.smart.pending(f.deck),true);
 if(action==='OFF')f.smart.disengage(f.deck);
 else{if(action==='mode reset')f.state.settings['Sync Mode']='Off';f.smart.reset();}
 f.acks[1].release();aborted(await second);unchangedAudio(f);
 assert.deepEqual(f.routes,[]);assert.deepEqual(f.retired,[]);assert.equal(f.smart.pending(f.deck),false);
 assert.ok(f.adapters.every(adapter=>adapter.disposed));assert.equal(f.engine.audibleRate(f.deck),1);
 assert.equal(f.deck.sync,false);assert.equal(f.deck.syncState,action==='OFF'?'relative':'off');
 assert.equal(f.deck.rate,1,'A newer preparation must not inherit an older optimistic target as its rollback basis');
});

test('latest rejected warped-primary preparation rolls back across the pending chain',async()=>{
 const f=fixture(),{first,second}=await overlap(f),failure=Error('controlled latest ACK rejection');
 f.acks[0].release();aborted(await first);f.acks[1].reject(failure);const result=await second;
 assert.equal(result.ok,false);assert.equal(result.error,failure);unchangedAudio(f);
 assert.deepEqual(f.routes,[]);assert.deepEqual(f.retired,[]);assert.ok(f.adapters.every(adapter=>adapter.disposed));
 assert.equal(f.deck.rate,1,'A failed latest request must restore the original uncommitted nominal basis');
});

test('latest successful warped-primary request keeps its committed rate after older cleanup',async()=>{
 const f=fixture(),{first,second}=await overlap(f);f.acks[1].release();assert.equal((await second).ok,true);
 const voice=f.engine.voices.get(1),token=f.engine.startTokens.get(1);f.acks[0].release();aborted(await first);
 unchangedAudio(f,voice);assert.equal(f.engine.startTokens.get(1),token);assert.equal(f.deck.rate,130/120);
 assert.deepEqual(f.routes,[1]);assert.deepEqual(f.retired,[f.old]);assert.equal(f.deck.sync,true);
 assert.equal(f.adapters[0].disposed,true);assert.equal(f.adapters[1].disposed,false);
});

for(const owner of ['pending manual','committed manual','replacement'])test(`${owner} breaks warped-primary rollback inheritance`,async()=>{
 const f=fixture(),first=settled(f.smart.press(f.deck));await until(()=>f.acks[0]);
 if(owner==='replacement'){
  f.engine.pause(f.deck);
  f.deck.track={id:'replacement',bpm:100,grid:0,duration:30,gridWarpMarkers:[{time:10,bpm:110}]};
  f.smart.loaded(f.deck,{engaged:false});
 }
 const manualRate=owner==='replacement' ? .8 : .9;f.deck.rate=manualRate;
 const manual=f.engine.start(f.deck);await until(()=>f.acks[1]);let voice=f.old;
 if(owner!=='pending manual'){f.acks[1].release();await manual;voice=f.engine.voices.get(1);}
 const latest=settled(f.smart.press(f.deck));await until(()=>f.acks[2]);
 f.acks[0].release();aborted(await first);
 if(owner==='pending manual'){f.acks[1].release();await manual;}
 f.smart.disengage(f.deck);f.acks[2].release();aborted(await latest);unchangedAudio(f,voice);
 assert.equal(f.deck.rate,manualRate,'Older Sync rollback basis must not cross a newer manual or replacement owner');
 assert.deepEqual(f.routes,owner==='pending manual'?[]:[1]);
 assert.equal(f.adapters[0].disposed,true);assert.equal(f.adapters[2].disposed,true);
});
