import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';

// Actual Smart Sync/start/pause ownership; controlled graph, clock and ACKs.
// No adapter DSP, PCM, live UI, native runtime or acoustic acceptance.
function fixture(external=false,primaryWarp=false){
 const engine=new AudioEngine(),old={sources:[{playbackRate:{value:1}}]},routes=[],retired=[],acks=[],adapters=[];
 const track={id:'incoming',bpm:120,grid:0,duration:30};
 const deck={index:1,track,position:3,rate:1,anchorPosition:3,anchorTime:1,playing:true,keylock:true};
 const leader={...deck,index:0,keylock:false,track:{id:'outgoing',bpm:126,grid:0,duration:30}};
 const state={settings:{'Sync Mode':'Smart Sync'},decks:external||primaryWarp?[deck]:[leader,deck]};
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
   return new Promise(resolve=>{acks[index]={signal:options.signal,
    release(){resolve({position,when,playing:true});}};});
  };
  adapter.start=start;adapter.startTimeline=start;adapters.push(adapter);return adapter;
 };
 const source={bpm:126,phase:true,track:leader.track,clock:at=>3+(at-1)*1.05,valid:()=>true};
 const smart=createSmartSync({engine,state,externalLeader:()=>external?source:null});
 if(primaryWarp){deck.track.gridWarpMarkers=[{time:10,bpm:130}];deck.position=deck.anchorPosition=12;}
 else if(!external)smart.setMaster(leader);
 engine.onGridTimeline=(d,options)=>smart.timeline(d,options);
 return{engine,deck,smart,state,old,routes,retired,acks,adapters};
}
async function until(test){
 for(let n=0;n<100;n++){if(test())return;await Promise.resolve();}
 assert.fail('Actual engine did not reach the controlled preparation boundary');
}
function revoke(f,action){
 if(action==='OFF')f.smart.disengage(f.deck);
 else {if(action==='mode reset')f.state.settings['Sync Mode']='Off';f.smart.reset();}
}

for(const external of [false,true])for(const action of ['OFF','reset','mode reset'])test(`${external?'external':'deck'} Smart Sync ${action} revokes an owned held audio ACK`,async()=>{
 const f=fixture(external),pending=f.smart.press(f.deck),rejected=assert.rejects(pending,{name:'AbortError'});
 await until(()=>f.acks[0]);assert.equal(f.engine.voices.get(1),f.old);
 revoke(f,action);const aborted=f.acks[0].signal.aborted;f.acks[0].release();await rejected;
 assert.equal(aborted,true,'Revocation must abort owned audio before a late ACK can route it');
 assert.equal(f.engine.voices.get(1),f.old);assert.deepEqual(f.routes,[]);assert.deepEqual(f.retired,[]);
 assert.equal(f.adapters[0].disposed,true);assert.equal(f.deck.rate,1);assert.equal(f.deck.playing,true);
 assert.equal(f.deck.sync,false);assert.equal(f.deck.syncState,'off');
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
});

for(const external of [false,true])test(`${external?'external':'deck'} Smart Sync OFF retains a newer unrelated manual ACK`,async()=>{
 const f=fixture(external),pending=f.smart.press(f.deck),rejected=assert.rejects(pending,{name:'AbortError'});
 await until(()=>f.acks[0]);f.deck.rate=.9;const manual=f.engine.start(f.deck);
 await until(()=>f.acks[1]);const token=f.engine.startTokens.get(1);
 f.smart.disengage(f.deck);assert.equal(f.acks[1].signal.aborted,false,'OFF must not abort the newer manual owner');
 f.acks[1].release();await manual;const voice=f.engine.voices.get(1);
 f.acks[0].release();await rejected;
 assert.equal(f.engine.voices.get(1),voice);assert.equal(voice.liveKeylock,f.adapters[1]);
 assert.equal(f.engine.startTokens.get(1),token);assert.equal(f.deck.rate,.9);assert.equal(f.deck.playing,true);
 assert.deepEqual(f.routes,[1]);assert.deepEqual(f.retired,[f.old]);
 assert.equal(f.adapters[0].disposed,true);assert.equal(f.adapters[1].disposed,false);
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
});

for(const external of [false,true])test(`${external?'external':'deck'} Smart Sync OFF preserves already committed audio`,async()=>{
 const f=fixture(external),pending=f.smart.press(f.deck);await until(()=>f.acks[0]);
 f.acks[0].release();await pending;const voice=f.engine.voices.get(1),token=f.engine.startTokens.get(1);
 f.smart.disengage(f.deck);
 assert.equal(f.engine.voices.get(1),voice);assert.equal(f.engine.startTokens.get(1),token);
 assert.equal(f.acks[0].signal.aborted,false);assert.equal(f.adapters[0].disposed,false);
 assert.equal(f.deck.rate,1.05);assert.equal(f.deck.playing,true);assert.equal(f.deck.sync,false);
 assert.deepEqual(f.routes,[0]);assert.deepEqual(f.retired,[f.old]);
});

test('Smart Sync OFF during raw preparation retains the old voice without starting a replacement',async()=>{
 const f=fixture();f.deck.keylock=false;let release;
 f.engine.resume=()=>new Promise(resolve=>{release=resolve;});
 const pending=f.smart.press(f.deck),rejected=assert.rejects(pending,{name:'AbortError'});
 assert.equal(typeof release,'function');f.smart.disengage(f.deck);release();await rejected;
 assert.equal(f.engine.voices.get(1),f.old);assert.equal(f.deck.rate,1);assert.equal(f.deck.playing,true);
 assert.deepEqual(f.routes,[]);assert.deepEqual(f.retired,[]);assert.deepEqual(f.adapters,[]);
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
});

test('explicit Stop followed by Sync OFF cannot revive a held audio ACK',async()=>{
 const f=fixture(),pending=f.smart.press(f.deck),rejected=assert.rejects(pending,{name:'AbortError'});
 await until(()=>f.acks[0]);f.engine.pause(f.deck);f.smart.disengage(f.deck);f.acks[0].release();await rejected;
 assert.equal(f.deck.playing,false);assert.equal(f.deck.rate,1);assert.equal(f.engine.voices.size,0);
 assert.deepEqual(f.routes,[]);assert.deepEqual(f.retired,[]);assert.equal(f.adapters[0].disposed,true);
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
});

for(const action of ['OFF','reset','mode reset'])test(`first warped-primary Smart Sync ${action} revokes its held audio ACK`,async()=>{
 const f=fixture(false,true),pending=f.smart.press(f.deck);
 const settled=pending.then(()=>({status:'fulfilled'}),error=>({status:'rejected',error:error.name}));
 await until(()=>f.acks[0]);assert.equal(f.deck.syncRole,'primary');assert.equal(f.deck.rate,130/120);
 revoke(f,action);const aborted=f.acks[0].signal.aborted;f.acks[0].release();const result=await settled;
 assert.equal(aborted,true,'Primary preparation must abort before a late ACK can route audio');
 assert.deepEqual(result,{status:'rejected',error:'AbortError'});
 assert.equal(f.engine.voices.get(1),f.old);assert.deepEqual(f.routes,[]);assert.deepEqual(f.retired,[]);
 assert.equal(f.adapters[0].disposed,true);assert.equal(f.deck.rate,1);assert.equal(f.deck.playing,true);
 assert.equal(f.deck.sync,false);assert.equal(f.deck.syncState,action==='OFF'?'relative':'off');
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
});

test('warped-primary OFF retains a newer manual audio ACK and rejects the older Sync',async()=>{
 const f=fixture(false,true),pending=f.smart.press(f.deck);
 const settled=pending.then(()=>({status:'fulfilled'}),error=>({status:'rejected',error:error.name}));
 await until(()=>f.acks[0]);f.deck.rate=.9;const manual=f.engine.start(f.deck);
 await until(()=>f.acks[1]);const token=f.engine.startTokens.get(1);
 f.smart.disengage(f.deck);assert.equal(f.acks[1].signal.aborted,false);
 f.acks[1].release();await manual;const voice=f.engine.voices.get(1);
 f.acks[0].release();const result=await settled;
 assert.equal(f.engine.voices.get(1),voice);assert.equal(voice.liveKeylock,f.adapters[1]);
 assert.equal(f.engine.startTokens.get(1),token);assert.equal(f.deck.rate,.9);assert.equal(f.deck.playing,true);
 assert.deepEqual(f.routes,[1]);assert.deepEqual(f.retired,[f.old]);
 assert.equal(f.adapters[0].disposed,true);assert.equal(f.adapters[1].disposed,false);
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
 assert.deepEqual(result,{status:'rejected',error:'AbortError'});
});

test('warped-primary OFF preserves already committed audio and its rate',async()=>{
 const f=fixture(false,true),pending=f.smart.press(f.deck);await until(()=>f.acks[0]);
 f.acks[0].release();await pending;const voice=f.engine.voices.get(1),token=f.engine.startTokens.get(1);
 f.smart.disengage(f.deck);
 assert.equal(f.engine.voices.get(1),voice);assert.equal(f.engine.startTokens.get(1),token);
 assert.equal(f.acks[0].signal.aborted,false);assert.equal(f.adapters[0].disposed,false);
 assert.equal(f.deck.rate,130/120);assert.equal(f.deck.playing,true);assert.equal(f.deck.sync,false);
 assert.deepEqual(f.routes,[0]);assert.deepEqual(f.retired,[f.old]);
});
