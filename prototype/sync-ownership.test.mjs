import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createCueHolds} from './holds.js';
import {createBeatgrid} from './beatgrid.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Real Sync/start ownership with a controlled clock and graph endpoints, not PCM.
function fixture(stall=0){
 const engine=new AudioEngine(),old={sources:[]},starts=[],retired=[];
 const track=(id,bpm)=>({id,bpm,grid:0,duration:30});
 const deck={index:1,track:track('follower',120),position:3,rate:1,anchorPosition:3,anchorTime:1,playing:true};
 const leader={...deck,index:0,track:track('leader',126)};
 engine.ctx={currentTime:1,createBufferSource(){engine.ctx.currentTime+=stall;return{playbackRate:{value:1},start(when,offset){starts.push({when,offset,rate:this.playbackRate.value});},connect(){},disconnect(){},stop(){}};}};
 engine.nodes[1]={};engine.resume=async()=>{};engine.applyChannelFX=async()=>{};
 engine.buffer=async()=>({duration:30,sampleRate:44100});
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.voices.set(1,old);
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);
 engine.retireVoiceAt=(i,v)=>retired.push(v);engine.disposeVoice=()=>{};
 const smart=createSmartSync({engine,state:{settings:{'Sync Mode':'Smart Sync'},decks:[leader,deck]}});
 smart.setMaster(leader);
 return{engine,deck,leader,smart,old,starts,retired};
}

for(const count of [2,3])test(`${count} overlapping same-tempo Sync presses leave the latest request in control`,async()=>{
 const {engine,deck,leader,smart,old,starts,retired}=fixture(),before={...leader};
 const results=await Promise.allSettled(Array.from({length:count},()=>smart.press(deck)));
 assert(results.slice(0,-1).every(r=>r.status==='rejected'&&r.reason.name==='AbortError'));
 assert.equal(results.at(-1).status,'fulfilled','An old cancellation must not reject the current Sync');
 assert.equal(deck.rate,1.05);assert.equal(deck.sync,true);assert.equal(deck.syncState,'beat');
 assert.equal(deck.playing,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 assert.equal(starts.length,1);assert.equal(starts[0].rate,1.05);assert.deepEqual(retired,[old]);
 engine.ctx.currentTime=deck.anchorTime+.01;assert.equal(engine.audibleRate(deck),deck.rate);
 assert.deepEqual(leader,before,'The outgoing master must retain its clock and rate');
});

test('a current late Sync still rolls back its own uncommitted rate',async()=>{
 const {engine,deck,smart,old,starts,retired}=fixture(.08);
 await assert.rejects(smart.press(deck),/missed its lead/);
 assert.equal(deck.rate,1);assert.equal(!!deck.sync,false);assert.equal(deck.playing,true);
 assert.equal(engine.voices.get(1),old);assert.deepEqual(starts,[]);assert.deepEqual(retired,[]);
});

test('a different newer target rate retains authority over a canceled Sync',async()=>{
 const {engine,deck,starts}=fixture(),options={priorClock:at=>3+at-1,positionAt:()=>4};
 const results=await Promise.allSettled([engine.synchronize(deck,{...options,rate:1.05}),engine.synchronize(deck,{...options,rate:1.1})]);
 assert.equal(results[0].status,'rejected');assert.equal(results[0].reason.name,'AbortError');
 assert.equal(results[1].status,'fulfilled');assert.equal(deck.rate,1.1);assert.equal(starts.length,1);assert.equal(starts[0].rate,1.1);
});

test('explicit Stop cancels pending Sync while its own uncommitted rate rolls back',async()=>{
 const {engine,deck,smart,starts}=fixture();let resume;
 engine.resume=()=>new Promise(resolve=>{resume=resolve;});
 const pending=smart.press(deck);engine.pause(deck);resume();
 await assert.rejects(pending,{name:'AbortError'});
 assert.equal(deck.rate,1);assert.equal(deck.playing,false);assert.equal(deck.processing,false);
 assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert.deepEqual(starts,[]);
});

test('saving a grid cancels initially unsynced playing preparation and a fresh Sync uses the new grid',async()=>{
 const {engine,deck,leader,smart,old,starts,retired}=fixture(),before={...leader};let resume;
 engine.onGridWillChange=track=>smart.captureGrid(track);
 engine.onGridChanged=(track,saved)=>smart.edited(track,saved);
 engine.resume=()=>new Promise(resolve=>{resume=resolve;});
 const pending=smart.press(deck),rejected=assert.rejects(pending,{name:'AbortError'});
 assert.equal(!!deck.sync,false);assert.equal(deck.processing,true);assert.equal(typeof resume,'function');
 // Actual Save grid callback order, while the original track object is retained.
 const track=deck.track,saved=engine.onGridWillChange(track);
 Object.assign(track,{bpm:100,grid:.1,gridWarpMarkers:[],metadataRevision:(track.metadataRevision||0)+1});
 await engine.onGridChanged(track,saved);resume();await rejected;
 assert.equal(deck.rate,1);assert.equal(deck.playing,true);assert.equal(!!deck.sync,false);assert.equal(deck.processing,false);
 assert.equal(engine.voices.get(deck.index),old);assert.deepEqual(starts,[]);assert.deepEqual(retired,[]);
 assert.equal(engine.transforms.size,0);assert.deepEqual(leader,before,'Grid editing must not change the outgoing master');
 engine.resume=async()=>{};await smart.press(deck);
 assert.equal(deck.rate,1.26);assert.equal(deck.syncState,'beat');assert.equal(starts.length,1);assert.equal(starts[0].rate,1.26);
 assert.deepEqual(retired,[old]);assert.deepEqual(leader,before);
 engine.ctx.currentTime=deck.anchorTime+1;
 const own=createBeatgrid(track).beatAt(engine.position(deck)),primary=createBeatgrid(leader.track).beatAt(engine.position(leader));
 assert.ok(Math.abs(((own-primary+2)%4+4)%4-2)<1e-9,'The fresh Sync must retain current-grid phase after the handoff');
 assert.equal(track.bpm*engine.audibleRate(deck),126);
});

test('saving a grid during paused unsynced tempo preparation cannot arm the stale request',async()=>{
 const {engine,deck,leader,smart,starts,retired}=fixture(),before={...leader};let release;
 deck.playing=false;engine.voices.delete(deck.index);
 engine.onGridWillChange=track=>smart.captureGrid(track);
 engine.onGridChanged=(track,saved)=>smart.edited(track,saved);
 engine.applyChannelFX=()=>new Promise(resolve=>{release=resolve;});
 const pending=smart.press(deck),rejected=assert.rejects(pending,{name:'AbortError'});
 assert.equal(typeof release,'function');assert.equal(!!deck.sync,false);
 const track=deck.track,saved=engine.onGridWillChange(track);
 Object.assign(track,{bpm:100,grid:.1,gridWarpMarkers:[],metadataRevision:(track.metadataRevision||0)+1});
 await engine.onGridChanged(track,saved);release();await rejected;
 assert.equal(deck.playing,false);assert.equal(!!deck.sync,false);assert.notEqual(deck.syncState,'armed');
 assert.equal(engine.voices.size,0);assert.deepEqual(starts,[]);assert.deepEqual(retired,[]);assert.deepEqual(leader,before);
 engine.applyChannelFX=async()=>{};await smart.press(deck);
 assert.equal(deck.rate,1.26);assert.equal(deck.syncState,'armed');assert.equal(deck.playing,false);assert.deepEqual(starts,[]);
 await smart.start(deck);assert.equal(deck.playing,true);assert.equal(deck.syncState,'beat');assert.equal(starts.length,1);
 engine.ctx.currentTime=deck.anchorTime+1;
 const own=createBeatgrid(track).beatAt(engine.position(deck)),primary=createBeatgrid(leader.track).beatAt(engine.position(leader));
 assert.ok(Math.abs(((own-primary+2)%4+4)%4-2)<1e-9,'The fresh armed launch must use the saved grid');
 assert.equal(track.bpm*engine.audibleRate(deck),126);assert.deepEqual(leader,before);
});

test('a newer Reverse start retains its rate when the older Sync is canceled',async()=>{
 const {engine,deck,smart,starts}=fixture();
 engine.ctx.createGain=()=>({gain:{value:1},connect(){}});engine.setCross=()=>{};
 engine.reverseBuffer=(id,buffer)=>buffer; // PCM reversal is outside this ownership check.
 const results=await Promise.allSettled([smart.press(deck),engine.setReverse(deck,true)]);
 assert.equal(results[0].status,'rejected');assert.equal(results[0].reason.name,'AbortError');
 assert.equal(results[1].status,'fulfilled');assert.equal(deck.reverse,true);assert.equal(deck.playing,true);
 assert.equal(starts.length,1);assert.equal(deck.rate,starts[0].rate,'A canceled Sync must not alter the newer voice rate');
});

test('manual Seek supersedes pending Sync without restoring an old position or rate',async()=>{
 const {engine,deck,smart,starts}=fixture();let resume;
 const ready=new Promise(resolve=>{resume=resolve;});engine.resume=()=>ready;
 engine.ctx.createGain=()=>({gain:{value:1},connect(){}});engine.setCross=()=>{};
 const pending=smart.press(deck),seek=engine.seek(deck,9);resume();
 const results=await Promise.allSettled([pending,seek]);
 assert.equal(results[0].status,'rejected');assert.equal(results[0].reason.name,'AbortError');assert.equal(results[1].status,'fulfilled');
 assert.equal(deck.playing,true);assert.equal(deck.position,9);assert.equal(deck.anchorPosition,9);assert.equal(!!deck.sync,false);
 assert.equal(starts.length,1);assert.equal(starts[0].offset,9);assert.equal(deck.rate,starts[0].rate);assert.equal(deck.processing,false);
});

test('replacement ownership cancels pending Sync without touching the new track',async()=>{
 const {engine,deck,smart,starts}=fixture();let resume;
 engine.resume=()=>new Promise(resolve=>{resume=resolve;});
 const pending=smart.press(deck);engine.pause(deck);
 const replacement={id:'replacement',bpm:128,grid:.1,duration:50};Object.assign(deck,{track:replacement,position:7,rate:.9});smart.loaded(deck,{engaged:false});resume();
 await assert.rejects(pending,{name:'AbortError'});
 assert.equal(deck.track,replacement);assert.equal(deck.position,7);assert.equal(deck.rate,.9);assert.equal(deck.playing,false);assert.equal(deck.sync,false);
 assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert.deepEqual(starts,[]);
});

test('temporary Cue cancels pending Sync and retains its paused cue position',async()=>{
 const {engine,deck,smart,starts}=fixture();let resume;deck.cue=1.5;
 engine.resume=()=>new Promise(resolve=>{resume=resolve;});
 const cue=createCueHolds({engine,render(){}}),pending=smart.press(deck),audition=cue.press('cue',deck);resume();
 const results=await Promise.allSettled([pending,audition]);
 assert.equal(results[0].status,'rejected');assert.equal(results[0].reason.name,'AbortError');assert.equal(results[1].status,'fulfilled');
 assert.equal(deck.playing,false);assert.equal(deck.position,1.5);assert.equal(deck.rate,1);assert.equal(deck.processing,false);
 assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert.deepEqual(starts,[]);
});


test('paused seek keeps Smart Sync armed through sequential Play without a second Sync press',async()=>{
 const {engine,deck,leader,smart,starts}=fixture();
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const hook=app.slice(app.indexOf('engine.onManualPosition ='),app.indexOf('\nengine.onGridTimeline ='));
 vm.runInNewContext(hook,{engine,instantDouble:{manipulated(){}},smartSync:smart,state:{decks:[leader,deck]},cancelSimpleSync(){}});
 engine.ctx.createGain=()=>({gain:{value:1},connect(){}});engine.nodes[0]={};engine.setCross=()=>{};
 try{
  engine.pause(leader);engine.pause(deck);smart.paused(leader);await smart.press(deck);
  await engine.seek(leader,0);await engine.seek(deck,0);
  assert.equal(leader.syncState,'armed');assert.equal(deck.syncState,'armed');
  assert.equal(await smart.start(leader),false);await engine.start(leader);smart.played(leader);
  engine.ctx.currentTime+=.237;const outgoing={...leader},voice=engine.voices.get(0);
  assert.equal(await smart.start(deck),true,'Play must schedule alignment without another Sync press');
  const scheduled=starts.at(-1),phase=createBeatgrid(deck.track).beatAt(scheduled.offset),
   masterPhase=createBeatgrid(leader.track).beatAt(engine.voiceClock(leader,voice)(scheduled.when));
  assert.ok(Math.abs((phase-masterPhase)/4-Math.round((phase-masterPhase)/4))<1e-9);
  assert.equal(deck.syncState,'beat');assert.equal(deck.rate,1.05);
  assert.deepEqual(leader,outgoing);assert.equal(engine.voices.get(0),voice);
  await engine.seek(deck,5);assert.equal(deck.syncState,'tempo','A playing seek remains a deliberate phase offset');
 }finally{engine.pause(leader);engine.pause(deck);assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);}
});

test('seek arming leaves manual gestures and unsupported launch transports tempo-only',()=>{
 for(const changes of [{},{processing:true},{reverse:true},{stemSlip:'vocals'},{playing:true}]){
  const {smart,deck,engine,leader}=fixture();Object.assign(deck,{playing:false,sync:true,syncState:'beat'},changes);
  smart.manipulated(deck,{seek:true});
  assert.equal(deck.syncState,Object.keys(changes).length?'tempo':'armed');
  deck.playing=false;smart.manipulated(deck);assert.equal(deck.syncState,'tempo','Scratch/jog notifications must not arm launch');
  engine.pause(deck);engine.pause(leader);
 }
});
