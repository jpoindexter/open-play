import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';

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

test('a newer Reverse start retains its rate when the older Sync is canceled',async()=>{
 const {engine,deck,smart,starts}=fixture();
 engine.ctx.createGain=()=>({gain:{value:1},connect(){}});engine.setCross=()=>{};
 engine.reverseBuffer=(id,buffer)=>buffer; // PCM reversal is outside this ownership check.
 const results=await Promise.allSettled([smart.press(deck),engine.setReverse(deck,true)]);
 assert.equal(results[0].status,'rejected');assert.equal(results[0].reason.name,'AbortError');
 assert.equal(results[1].status,'fulfilled');assert.equal(deck.reverse,true);assert.equal(deck.playing,true);
 assert.equal(starts.length,1);assert.equal(deck.rate,starts[0].rate,'A canceled Sync must not alter the newer voice rate');
});
