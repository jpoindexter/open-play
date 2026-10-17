import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
import {DeckScratchKernel} from '../prototype/deck-scratch-kernel.js';
const checks=[];
const record=(name,run)=>checks.push({name,run});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const pcm={sampleRate:1000,channels:[new Float32Array(30000).fill(.2)]};
function setup({playing=true,slip=false,stems=false}={}){
 const e=new AudioEngine(),connections=[],disposed=[]; let created=0;
 const gain=()=>({gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){}});
 e.ctx={currentTime:0,createGain:gain};e.nodes=Array.from({length:4},()=>({input:{},gain:gain(),level:.8,trim:1}));
 e.applyChannelFX=async()=>{};e.buffer=async()=>pcm;e.ensureStemState=()=>({routes:Array.from({length:4},gain),histories:Array.from({length:4},()=>({node:{disconnect(){},connect(){}}}))});
 const d={index:0,track:{id:'one',duration:30},position:5,anchorPosition:5,anchorTime:0,rate:1,reverse:false,playing,slip,loop:false,stems:[true,true,true,true],stemFX:[false,false,false,false]};
 if(stems)e.stemBuffers.set('one',Array(4).fill(pcm));
 e.prepareOrdinaryScratch=async()=>{created++;let gesture=0;const k=new DeckScratchKernel(1000),node={connect:(...a)=>connections.push(a)};return{node,state:()=>k.state(),replaceBuffers:async v=>k.load(v),command:async(type,data)=>{k.audioTime=e.ctx.currentTime;if(type==='begin')gesture++;return k.command(type,{...data,gesture});},dispose(){disposed.push(k);k.dispose();}};};
 return{e,d,connections,disposed,created:()=>created};
}
record('Pending pointer release aborts ownership and disposes late prepared transport without replacing old voice',async()=>{
 const{e,d,disposed}=setup(),gate=deferred(),prepare=e.prepareOrdinaryScratch;
 const prior={sources:[],marker:'old'};e.voices.set(0,prior);e.prepareOrdinaryScratch=async()=>{const t=await prepare();await gate.promise;return t;};
 const begin=e.beginDeckScratch(d,'old');assert.equal(await e.endDeckScratch(d,'old'),false);gate.resolve();assert.equal(await begin,false);assert.equal(e.voices.get(0),prior);assert.equal(disposed.length,1);
});
record('Paused audition commits audible release and remains paused',async()=>{
 const{e,d}=setup({playing:false});assert(await e.beginDeckScratch(d,'a'));await e.updateDeckScratch(d,{position:7,velocity:-1},'a');assert.equal(e.position(d),7);const r=await e.endDeckScratch(d,'a');assert.equal(r.position,7);assert.equal(d.playing,false);assert.equal(e.voices.get(0).deckScratchTransport.state().audition,false);
});
record('Slip rejoins backing clock while non-Slip commits scratch cursor',async()=>{
 const{e,d}=setup({slip:true});await e.beginDeckScratch(d,'a');await e.updateDeckScratch(d,{position:2,velocity:-1},'a');const t=e.voices.get(0).deckScratchTransport; // Advance actual kernel through its public render seam is covered separately; ACK preserves backing5 here.
 assert.equal(t.state().hidden.position,5);await e.endDeckScratch(d,'a');assert.equal(d.position,5);assert(d.playing);
});
record('Stale owner cannot move or release a replacement gesture',async()=>{
 const{e,d,created}=setup();await e.beginDeckScratch(d,'a');await e.beginDeckScratch(d,'b');assert.equal(await e.updateDeckScratch(d,{position:1,velocity:1},'a'),false);assert.equal(await e.endDeckScratch(d,'a'),false);assert.equal(e.voices.get(0).deckScratchTransport.state().owner,'b');assert.equal(created(),1);
});
record('Track replacement during PCM loading cannot commit old voice',async()=>{
 const{e,d,disposed}=setup(),gate=deferred();e.buffer=async()=>{await gate.promise;return pcm;};const begin=e.beginDeckScratch(d,'a');await Promise.resolve();d.track={id:'two',duration:30};gate.resolve();assert.equal(await begin,false);assert.equal(e.voices.size,0);assert.equal(disposed.length,1);
});
record('Pause retires active transport and late moves cannot resurrect it',async()=>{
 const{e,d,disposed}=setup();await e.beginDeckScratch(d,'a');await e.updateDeckScratch(d,{position:8,velocity:1},'a');e.pause(d);assert.equal(d.position,8);assert(!d.playing);assert.equal(e.voices.size,0);assert.equal(disposed.length,1);assert.equal(await e.updateDeckScratch(d,{position:9,velocity:1},'a'),false);
});
record('Five raw buses route distinct indices through original or stem history without duplicating original',async()=>{
 const{e,d,connections}=setup({stems:true});await e.beginDeckScratch(d,'a');assert.deepEqual(connections.map(a=>a[1]),[0,1,2,3,4]);assert.equal(e.voices.get(0).stemGains.length,5);
});
record('Tempo change cancels a pending gesture without its late ownership committing',async()=>{
 const{e,d}=setup({playing:false}),gate=deferred(),prepare=e.prepareOrdinaryScratch;e.prepareOrdinaryScratch=async()=>{await gate.promise;return prepare();};const begin=e.beginDeckScratch(d,'a');await e.setRate(d,1.2);gate.resolve();assert.equal(await begin,false);assert.equal(d.rate,1.2);assert.equal(e.voices.size,0);
});
record('FX follows the live audio clock before and after future rate change, independently of requested slider rate',async()=>{
 const{e,d}=setup();d.rate=1.25;e.ctx.currentTime=10;e.voices.set(0,{sources:[],liveKeylock:{stateAt:at=>({rate:at<10.2?1:1.25})}});
 assert.equal(e.audibleRate(d),1);e.updateFXBPMs([120*e.audibleRate(d)]);assert.equal(e.nodes[0].channelBpm,120);
 e.ctx.currentTime=10.3;assert.equal(e.audibleRate(d),1.25);e.updateFXBPMs([120*e.audibleRate(d)]);assert.equal(e.nodes[0].channelBpm,150);
});
record('Pending live handoff preserves old audible rate and buffered timeline scaling',async()=>{
 const{e,d}=setup();e.ctx.currentTime=10;d.rate=2;e.voices.set(0,{sources:[],handoffBefore:{until:10.2,rate:()=>.8},liveKeylock:{stateAt:()=>({rate:2})}});assert.equal(e.audibleRate(d),.8);e.ctx.currentTime=10.3;assert.equal(e.audibleRate(d),2);
 e.voices.set(0,{sources:[{playbackRate:{value:1}}],timelineScale:1.25});assert.equal(e.audibleRate(d),1.25);
});
for(const check of checks){await check.run();delete check.run;check.passed=true;}
console.log(JSON.stringify({scope:'Actual production AudioEngine methods with actual PCM kernel and controlled host; no browser audio, UI or vendor quality proof.',checks},null,2));
