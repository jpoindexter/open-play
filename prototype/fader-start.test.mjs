import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
import {createBeatgrid} from './beatgrid.js';
import {createFaderStart} from './fader-start.js';
import {createDeckMIDIRouter} from './deck-midi.js';

// Real engine/Smart Sync/app seek hook; controlled graph/clock, not MIDI hardware or PCM.
function fixture(){
 const engine=new AudioEngine(),starts=[],owners=new Map(),records=[];
 const leader={index:0,track:{id:'A',bpm:126,grid:0,duration:30},position:3,anchorPosition:3,anchorTime:1,rate:1,playing:true};
 const deck={...leader,index:1,track:{id:'B',bpm:120,grid:0,duration:30},cue:0,playing:false};
 const state={decks:[leader,deck],settings:{'Sync Mode':'Smart Sync'}};
 engine.ctx={currentTime:1,createGain:()=>({gain:{value:1},connect(){}}),createBufferSource:()=>({playbackRate:{value:1},start(when,offset){starts.push({when,offset,rate:this.playbackRate.value});},connect(){},disconnect(){},stop(){}})};
 engine.nodes[0]={};engine.nodes[1]={};engine.resume=async()=>{};engine.buffer=async()=>({duration:30,sampleRate:44100});
 engine.applyChannelFX=async()=>{};engine.setDeckTrackGain=()=>{};engine.setCross=()=>{};
 engine.cancelDeckScratchRequest=()=>{};engine.retireVoiceAt=()=>{};engine.disposeVoice=()=>{};
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);
 engine.voices.set(0,{sources:[{playbackRate:{value:1}}]});
 const smart=createSmartSync({engine,state});smart.setMaster(leader);
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 vm.runInNewContext(source.slice(source.indexOf('engine.onManualPosition ='),source.indexOf('\nengine.onGridTimeline =')),{engine,state,instantDouble:{manipulated(){}},smartSync:smart,cancelSimpleSync(){}});
 const fader=createFaderStart({engine,state,smartSync:smart,owners,cancel(){},record:(d,intent)=>records.push(intent),refresh(){}});
 return{state,engine,deck,leader,smart,fader,starts,owners,records,cleanup(){fader.resetInput();for(const d of state.decks)engine.pause(d);assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert.equal(owners.size,0);}};
}
test('fader launch honors armed bar alignment and back-cue while preserving the outgoing voice',async()=>{
 const f=fixture(),{engine,deck,leader,smart,fader,starts}=f;
 try{
  await smart.press(deck);const outgoing={...leader},voice=engine.voices.get(0);
  engine.mix=()=>{};deck.level=0;
  const midi=createDeckMIDIRouter({engine,state:{decks:[leader,deck],settings:{}},actions:{faderStart:fader.start}});
  const mapping={target:'Deck 2 fader start',encoding:'7-bit absolute'},message={type:'CC',channel:1,number:1,value:64,pressed:true,deviceId:'input'};
  await midi.dispatch(message,mapping);
  const scheduled=starts.at(-1),own=createBeatgrid(deck.track).beatAt(scheduled.offset),primary=createBeatgrid(leader.track).beatAt(engine.voiceClock(leader,voice)(scheduled.when));
  assert.ok(Math.abs((own-primary)/4-Math.round((own-primary)/4))<1e-9);
  assert.equal(deck.syncState,'beat');assert.equal(deck.rate,1.05);assert.equal(deck.playing,true);
  assert.deepEqual(leader,outgoing);assert.equal(engine.voices.get(0),voice);
  await midi.dispatch({...message,value:0,pressed:false},mapping);assert.equal(deck.playing,false);assert.equal(deck.position,0);assert.equal(engine.voices.has(1),false);
  assert.deepEqual(f.records,['start','stop']);
 }finally{f.cleanup();}
});
for(const action of ['fader zero','input disconnect'])test(`${action} revokes a pending aligned fader launch`,async()=>{
 const f=fixture(),{engine,deck,smart,fader,starts}=f;let release,entered;
 try{
  await smart.press(deck);const ready=new Promise(resolve=>entered=resolve),held=new Promise(resolve=>release=resolve);
  engine.resume=()=>{entered();return held;};
  const pending=fader.start(deck,.5,0,'input').then(()=>null,error=>error);await ready;
  assert.equal(deck.processing,true);
  if(action==='fader zero')await fader.start(deck,0,.5,'input');else fader.resetInput('input');
  assert.equal(deck.playing,false);release();const error=await pending;
  assert.equal(error?.name,'AbortError');assert.equal(deck.playing,false);assert.equal(deck.processing,false);assert.equal(engine.voices.has(1),false);assert.equal(starts.length,0);
 }finally{release?.();f.cleanup();}
});
test('Sync-off fader start retains the ordinary cue launch',async()=>{
 const f=fixture(),{engine,deck,smart,fader,starts}=f;
 try{
  smart.disengage(deck);deck.cue=1.25;await fader.start(deck,.5,0,'input');
  assert.equal(deck.playing,true);assert.equal(starts.at(-1).offset,1.25);assert.equal(deck.sync,false);
  await fader.start(deck,0,.5,'input');assert.equal(deck.playing,false);assert.equal(engine.position(deck),1.25);
 }finally{f.cleanup();}
});

test('fader zero cancels normal Play queued behind paused Sync preparation',async()=>{
 const f=fixture(),{state,engine,deck,leader,smart,starts}=f;
 let release,entered,first=true,pendingSync,pendingPlay;
 const ready=new Promise(resolve=>entered=resolve),held=new Promise(resolve=>release=resolve);
 engine.applyChannelFX=async()=>{if(first){first=false;entered();await held;}};
 engine.mix=()=>{};deck.level=.5;deck.track.plays=0;state.history=[];state.prepare=[];
 const playRequests=new WeakMap(),autoplayRequests=new WeakMap(),noop=()=>{};
 const instantDouble=Object.assign(noop,{cancelDeck:noop,pending:()=>false});
 const context={state,engine,playRequests,autoplayRequests,instantDouble,createFaderStart,
  pitchPlay:{latch:()=>false},cueHolds:{latch:()=>false,cancelDeck:noop},smartSync:smart,
  syncMaster:{started:noop},playbackIntents:{record:noop},notify:message=>assert.fail(message),
  refreshTransportControls:noop,persist:noop,renderDecks:noop,renderLoopDecks:noop,renderTracks:noop};
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 vm.runInNewContext(app.slice(app.indexOf('function cancelPendingPlay('),app.indexOf('\nconst faderStarts='))+'\n'+
  app.slice(app.indexOf('async function play('),app.indexOf('\nfunction deckQuantize('))+'\nglobalThis.play=play;',context);
 vm.runInNewContext(app.slice(app.indexOf('const faderStarts='),app.indexOf('\nasync function stemPad('))+'\nglobalThis.fader=faderStart;',context);
 const midi=createDeckMIDIRouter({engine,state,actions:{faderStart:context.fader}}),outgoing=engine.voices.get(0),rate=leader.rate;
 try{
  pendingSync=smart.press(deck);await ready;pendingPlay=context.play(deck);
  assert.equal(deck.playQueued,true);assert.equal(playRequests.has(deck),true);
  await midi.dispatch({type:'CC',channel:1,number:1,value:0,pressed:false,deviceId:'input'},
   {target:'Deck 2 fader start',encoding:'7-bit absolute'});
  assert.equal(deck.playQueued,false,'Fader zero retained the queued Play');assert.equal(playRequests.has(deck),false);
  release();await Promise.all([pendingSync,pendingPlay]);
  assert.equal(deck.playing,false);assert.equal(engine.voices.has(deck.index),false);assert.equal(starts.length,0);
  assert.equal(deck.track.plays,0);assert.equal(state.history.length,0);
  assert.equal(engine.voices.get(0),outgoing);assert.equal(leader.rate,rate);
 }finally{release();await Promise.allSettled([pendingSync,pendingPlay]);f.cleanup();}
});
