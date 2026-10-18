import assert from 'node:assert/strict';
import {createReverseCensorPlan} from '../prototype/reverse-censor-plan.js';
import {CensorBacking} from '../prototype/censor-backing.js';
const track={duration:12,bpm:120,grid:0,gridWarpMarkers:[{time:1,bpm:150},{time:2,bpm:90}]};
const plan=createReverseCensorPlan(track,120);assert.deepEqual(plan.points,[{position:0,rate:4/3},{position:10,rate:.8},{position:11,rate:1}]);
assert.deepEqual(plan.events(9,2),[{when:2,rate:4/3},{when:2.75,rate:.8},{when:4,rate:1}]);assert.deepEqual(plan.events(10,2),[{when:2,rate:.8},{when:3.25,rate:1}]);
assert.throws(()=>createReverseCensorPlan(track,1000),/range/);assert.throws(()=>plan.events(13,2),/outside/);
function fixture(now){
 const calls=[],gain=()=>({gain:{cancelScheduledValues:t=>calls.push(['cancel',t]),setValueAtTime:(v,t)=>calls.push(['set',v,t]),linearRampToValueAtTime:(v,t)=>calls.push(['ramp',v,t])}}),deck={index:0,track,playing:true,loop:false},live={sources:[{connect(){}}],sourceGates:[gain()],stemGains:[],gridTimeline:{retained:true}},request={owner:'test',controller:new AbortController()},engine={ctx:{currentTime:now},voices:new Map([[0,live]]),deckScratchRequests:new Map([[0,request]]),voiceClock:()=>t=>Math.min(12,t),createScratchShadowPull:async()=>({dispose:async()=>calls.push(['close-pull'])}),disposeVoice:(i,v)=>calls.push(['dispose',v]),retireVoiceAt:(i,v,t)=>calls.push(['retire',v,t]),setCross:()=>{},cross:0},raw={sources:[],sourceGates:[gain()],stemGains:[]};
 return{calls,deck,live,request,engine,raw};
}
for(const [now,before]of [[9,true],[10.5,false]]){
 const f=fixture(now),backing=await new CensorBacking(f.engine,f.deck,f.live,f.request).prepare();f.raw.censorBacking=backing;backing.claim(f.raw,10);f.engine.voices.set(0,f.raw);const result=backing.adopt();assert.equal(result.beforeScheduledStart,before);assert.equal(result.position,now);assert.equal(f.engine.voices.get(0),f.live);assert.equal(f.engine.deckScratchRequests.size,0);assert.equal(f.live.gridTimeline.retained,true);assert.equal(f.calls.some(c=>c[0]==='retire'),!before);assert.equal(f.calls.some(c=>c[0]==='dispose'&&c[1]===f.live),false);
}
const f=fixture(9),b=await new CensorBacking(f.engine,f.deck,f.live,f.request).prepare();b.claim(f.raw,10);b.dispose();assert.equal(f.calls.some(c=>c[0]==='dispose'&&c[1]===f.live),false,'Failed route must preserve its still-current forward owner');assert.equal(f.calls.at(-1)[0],'set');
const canceled=fixture(9);canceled.request.controller.abort();await assert.rejects(new CensorBacking(canceled.engine,canceled.deck,canceled.live,canceled.request).prepare(),{name:'AbortError'});assert.equal(canceled.engine.voices.get(0),canceled.live);
console.log(JSON.stringify({passed:true,scope:'Reverse grid integral and controlled forward-voice lease; browser audio separate',checks:['Reverse source crosses marker into its original left-side tempo','Output event times integrate all reversed rates','Release before scheduled start cancels mute/reverse voice','Release after start restores exact original owner and warp map','Failed route/canceled preparation preserve the forward owner']}));
