import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createFlipAutomation} from './flip.js';

// Actual Flip/AudioEngine/app Load; controlled pitch Worker and suspended-context
// resume are async boundaries. Generated graph only, no DSP/native/listening proof.
async function fixture(){
 const globals={Worker:globalThis.Worker,AudioBuffer:globalThis.AudioBuffer},jobs=[],starts=[],messages=[];
 let reached,completeRenders=false,resumeGate=null,resumeEntered;
 const rendering=new Promise(resolve=>reached=resolve);
 class Buffer{
  constructor({length,numberOfChannels,sampleRate}){Object.assign(this,{length,numberOfChannels,sampleRate,duration:length/sampleRate});this.channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));}
  getChannelData(c){return this.channels[c];}copyToChannel(data,c){this.channels[c].set(data);}
 }
 globalThis.AudioBuffer=Buffer;
 globalThis.Worker=class{
  postMessage(data){jobs.push({worker:this,data});if(jobs.length===1||completeRenders)queueMicrotask(()=>this.onmessage({data:{channels:data.channels}}));else reached();}
  terminate(){this.terminated=true;}
 };
 const bus=()=>({gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){}});
 const engine=new AudioEngine(),old={id:'flip-old',bpm:120,grid:0,duration:30,cues:[],analyzed:true},replacement={id:'flip-new',bpm:90,grid:0,duration:30,cues:[],analyzed:true};
 const deck={index:0,track:old,position:6.5,rate:1,playing:false,keylock:false,keyShift:-12,loop:true,loopIn:6,loopOut:8,sync:false,stemSlip:'off'};
 const state={decks:[deck],tracks:[old,replacement],focus:0,settings:{'Sync Mode':'Off'},fx:[[],[]],flip:{events:[{kind:'cue',position:1,offset:0}],trackId:old.id,duration:1,loop:false}};
 const buffer=new Buffer({length:1440000,numberOfChannels:1,sampleRate:48000});
 engine.ctx={currentTime:1,sampleRate:48000,resume:async()=>{if(resumeGate){resumeEntered();await resumeGate;}},createGain:bus,createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},stop(){},start(when,offset){starts.push({track:deck.track.id,when,offset});}})};
 engine.effectsReady=Promise.resolve();engine.masterOutput={ready:Promise.resolve()};engine.nodes=[{deckInput:bus(),input:bus(),gain:bus()}];
 engine.buffer=async()=>buffer;engine.applyChannelFX=async()=>{};engine.setCross=()=>{};engine.configureFX=()=>{};engine.setDeckTrackGain=()=>{};
 const flip=createFlipAutomation({state,engine,notify:message=>messages.push(message),persist(){},renderDecks(){}}),cancel={cancelDeck(){}};
 const scope={state,engine,flipAutomation:flip,smartSync:{loaded(){}},tempoSliders:{cancel(){}},trackById:id=>id===replacement.id?replacement:null,autoplayRequests:new WeakMap(),playRequests:new WeakMap(),deckLoadRequests:new WeakMap(),faderStarts:new Map(),instantDouble:cancel,cueHolds:cancel,deckScratchControls:cancel,pitchPlay:cancel,loopPads:cancel,manualLoops:cancel,slicer:cancel,stemSlipControls:cancel,trackGain:{refresh(){}},notify:message=>assert.fail(message),renderDecks(){},renderTracks(){},drawWaves(){}};
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8'),load=app.slice(app.indexOf('async function load(index,'),app.indexOf('\nconst deckKeyShift='));
 vm.runInNewContext(app.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+load+'\nglobalThis.actualLoad=load;',scope);
 const cleanup=()=>{try{flip.stop();engine.pause(deck);engine.keylockRenderer.clear();assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert(jobs.every(j=>j.worker.terminated));}finally{Object.assign(globalThis,globals);}};
 try{await engine.start(deck);assert.equal(starts.length,1);assert.equal(deck.playing,true);}catch(error){cleanup();throw error;}
 return{engine,deck,state,flip,starts,jobs,messages,rendering,replacement,cleanup,load:()=>scope.actualLoad(0,replacement.id,{skipDouble:true}),
  complete(){completeRenders=true;for(const {worker,data}of jobs.slice(1))if(!worker.terminated)worker.onmessage({data:{channels:data.channels}});},
  holdResume(){let release;resumeGate=new Promise(resolve=>release=resolve);const entered=new Promise(resolve=>resumeEntered=resolve);return{entered,release:()=>{resumeGate=null;release();}};}};
}

for(const action of ['Stop','Load'])test(`${action} revokes Flip cue across actual pending rendered seek`,async()=>{
 const f=await fixture();try{
  const pending=f.flip.start(f.deck);await f.rendering;assert.equal(f.jobs.length,2);assert.equal(f.deck.processing,true);
  if(action==='Load')assert.equal(await f.load(),true);else f.engine.pause(f.deck);
  const token=f.engine.startTokens.get(0),position=f.deck.position;f.complete();await pending;
  assert.equal(f.starts.length,1,'Canceled old Flip must not create another source');
  assert.equal(f.engine.startTokens.get(0),token,'Canceled Flip must not reclaim transport');
  assert.equal(f.deck.position,position);assert.equal(f.deck.playing,false);assert.equal(f.engine.voices.size,0);
  if(action==='Load')assert.equal(f.deck.track,f.replacement);
 }finally{f.cleanup();}
});

test('Flip Stop revokes start while actual AudioContext resume is pending',async()=>{
 const f=await fixture();try{
  f.engine.pause(f.deck);const hold=f.holdResume(),token=f.engine.startTokens.get(0),pending=f.flip.start(f.deck);
  await hold.entered;f.flip.stop();hold.release();f.complete();await pending;
  assert.equal(f.starts.length,1,'Canceled resume must not start a Flip source');assert.equal(f.engine.startTokens.get(0),token);
  assert.equal(f.state.flip.on,false);assert.equal(f.deck.playing,false);assert.equal(f.engine.voices.size,0);
 }finally{f.cleanup();}
});

test('ordinary timed cues, loop wrap and six saved slots retain existing behavior',async()=>{
 const f=await fixture();try{
  f.engine.pause(f.deck);Object.assign(f.deck,{keyShift:0,loop:false,position:0});
  Object.assign(f.state.flip,{name:'Owned',loop:true,duration:.3,events:[{kind:'cue',position:1,offset:0},{kind:'cue',position:10,offset:.1}]});
  const settled=async position=>{
   for(let n=0;n<20&&(f.deck.processing||f.engine.position(f.deck)<position);n++)await new Promise(resolve=>setImmediate(resolve));
   assert.equal(f.deck.processing,false);assert(f.engine.position(f.deck)>=position&&f.engine.position(f.deck)<position+.3);
  };
  await f.flip.start(f.deck);assert.equal(f.deck.playing,true);await settled(1);
  f.engine.ctx.currentTime=1.18;f.flip.tick();await settled(10);
  f.engine.ctx.currentTime=1.35;f.flip.tick();f.engine.ctx.currentTime=1.36;f.flip.tick();await settled(1);
  for(let n=0;n<7;n++)f.flip.save();assert.equal(f.deck.track.flips.filter(Boolean).length,6);
  assert(f.messages.at(-1).startsWith('Six Flip slots are occupied.'));
  f.flip.stop();assert.equal(f.state.flip.on,false);assert.equal(f.deck.playing,true,'Stopping automation must not pause an ordinary playing voice');
 }finally{f.cleanup();}
});

test('main Pause at a Flip loop wrap stays stopped until explicit resume',async()=>{
 const f=await fixture();try{
  f.engine.pause(f.deck);Object.assign(f.deck,{keyShift:0,loop:false,position:0});
  Object.assign(f.state.flip,{loop:true,duration:.3,events:[{kind:'cue',position:1,offset:0},{kind:'cue',position:10,offset:.1}]});
  await f.flip.start(f.deck);f.engine.ctx.currentTime=1.35;f.flip.tick();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(f.deck.playing,true);
  f.engine.pause(f.deck);const stopped={token:f.engine.startTokens.get(0),position:f.deck.position,starts:f.starts.length};
  f.engine.ctx.currentTime=1.8;f.flip.tick();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.deck.playing,false,'A wrapped offset-zero cue must not restart a paused deck');
  assert.equal(f.engine.startTokens.get(0),stopped.token);assert.equal(f.starts.length,stopped.starts);assert.equal(f.deck.position,stopped.position);
  assert.equal(f.state.flip.on,true,'Pause retains the selected automation');
  await f.engine.start(f.deck);f.engine.ctx.currentTime=1.82;f.flip.tick();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.deck.playing,true);assert.equal(f.deck.position,1,'Explicit resume continues the wrapped first cue');
 }finally{f.cleanup();}
});
