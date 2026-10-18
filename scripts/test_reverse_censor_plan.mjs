import assert from 'node:assert/strict';
import {createReverseCensorPlan} from '../prototype/reverse-censor-plan.js';
import {CensorBacking} from '../prototype/censor-backing.js';
import {createBeatgrid} from '../prototype/beatgrid.js';
import {WarpLoopKernel} from '../prototype/warp-loop-kernel.js';
const track={duration:12,bpm:120,grid:0,gridWarpMarkers:[{time:1,bpm:150},{time:2,bpm:90}]};
const plan=createReverseCensorPlan(track,120);assert.deepEqual(plan.points,[{position:0,rate:4/3},{position:10,rate:.8},{position:11,rate:1}]);
assert.deepEqual(plan.events(9,2),[{when:2,rate:4/3},{when:2.75,rate:.8},{when:4,rate:1}]);assert.deepEqual(plan.events(10,2),[{when:2,rate:.8},{when:3.25,rate:1}]);
assert.throws(()=>createReverseCensorPlan(track,1000),/range/);assert.throws(()=>plan.events(13,2),/outside/);
// Independent known eight-beat loop: 2 beats at120, 2 at150, 4 at90.
// Reverse traversal at120 target takes2s,1s,1s, then repeats forever.
const loopTrack={duration:6,bpm:120,grid:0,gridWarpMarkers:[{time:1,bpm:150},{time:1.8,bpm:90}]};
const loopPlan=createReverseCensorPlan(loopTrack,120),loop=loopPlan.loop({start:0,end:1.8+8/3});
const timeline=createBeatgrid(loopPlan.track).timeline({position:loop.start,when:10,bpm:120,loop});
for(const cycle of [0,1,27])for(const [delta,original,rate]of [[.5,3.8,4/3],[2.5,1.4,.8],[3.5,.5,1]]){
 assert.ok(Math.abs(6-timeline.clock(10+cycle*4+delta)-original)<1e-10);assert.equal(timeline.rateAt(10+cycle*4+delta),rate);
}
assert.throws(()=>loopPlan.loop({start:2,end:1}),/bounds/);
// Real loop PCM kernel (not a copied clock): an increasing original ramp is
// read backwards, wraps, then keeps decreasing; all five buses stay aligned.
const kernel=new WarpLoopKernel(100),ramp=Float32Array.from({length:601},(_,i)=>(600-i)/600);
kernel.load(Array.from({length:5},()=>({sampleRate:100,channels:[ramp]})));
kernel.start({track:loopPlan.track,loop,position:loop.start,when:0,bpm:120});
for(const at of [.5,2.5,3.5,4.5]){const outputs=Array.from({length:5},()=>[new Float32Array(2),new Float32Array(2)]);kernel.process(outputs,at);const expected=at===2.5?1.4/6:at===3.5?.5/6:3.8/6;for(const bus of outputs){assert.ok(Math.abs(bus[0][0]-expected)<1e-6);assert.ok(bus[0][1]<bus[0][0]);}}
function fixture(now){
 const calls=[],gain=()=>({gain:{cancelScheduledValues:t=>calls.push(['cancel',t]),setValueAtTime:(v,t)=>calls.push(['set',v,t]),linearRampToValueAtTime:(v,t)=>calls.push(['ramp',v,t])}}),deck={index:0,track,playing:true,loop:false},live={sources:[{connect(){}}],sourceGates:[gain()],stemGains:[],gridTimeline:{retained:true}},request={owner:'test',controller:new AbortController()},engine={ctx:{currentTime:now},voices:new Map([[0,live]]),deckScratchRequests:new Map([[0,request]]),voiceClock:()=>t=>Math.min(12,t),createScratchShadowPull:async()=>({dispose:async()=>calls.push(['close-pull'])}),disposeVoice:(i,v)=>calls.push(['dispose',v]),retireVoiceAt:(i,v,t)=>calls.push(['retire',v,t]),setCross:()=>{},cross:0},raw={sources:[],sourceGates:[gain()],stemGains:[]};
 return{calls,deck,live,request,engine,raw};
}
for(const [now,before]of [[9,true],[10.5,false]]){
 const f=fixture(now),backing=await new CensorBacking(f.engine,f.deck,f.live,f.request).prepare();f.raw.censorBacking=backing;backing.claim(f.raw,10);f.engine.voices.set(0,f.raw);const result=backing.adopt();assert.equal(result.beforeScheduledStart,before);assert.equal(result.position,now);assert.equal(f.engine.voices.get(0),f.live);assert.equal(f.engine.deckScratchRequests.size,0);assert.equal(f.live.gridTimeline.retained,true);assert.equal(f.calls.some(c=>c[0]==='retire'),!before);assert.equal(f.calls.some(c=>c[0]==='dispose'&&c[1]===f.live),false);
}
const f=fixture(9),b=await new CensorBacking(f.engine,f.deck,f.live,f.request).prepare();b.claim(f.raw,10);b.dispose();assert.equal(f.calls.some(c=>c[0]==='dispose'&&c[1]===f.live),false,'Failed route must preserve its still-current forward owner');assert.equal(f.calls.at(-1)[0],'set');
const canceled=fixture(9);canceled.request.controller.abort();await assert.rejects(new CensorBacking(canceled.engine,canceled.deck,canceled.live,canceled.request).prepare(),{name:'AbortError'});assert.equal(canceled.engine.voices.get(0),canceled.live);
console.log(JSON.stringify({passed:true,scope:'Reverse grid integral and controlled forward-voice lease; browser audio separate',checks:['Reverse source crosses marker into its original left-side tempo','Output event times integrate all reversed rates','Known eight-beat reverse loop preserves tempo sections through27cycles','Actual five-bus PCM kernel decreases source ramp and wraps','Release before scheduled start cancels mute/reverse voice','Release after start restores exact original owner and warp map','Failed route/canceled preparation preserve the forward owner']}));
