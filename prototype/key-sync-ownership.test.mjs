import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createDeckKeyShift} from './deck-key-shift.js';
import {planKeySync} from './pitchplay.js';

// Actual app KeySync/Load/Play handlers and AudioEngine live branch. The one
// held live command aborts on real voice disposal or superseding update; no DSP.
function fixture(){
 const engine=new AudioEngine(),feedback=[],notices=[];
 const old={id:'key-old',key:'C',bpm:120,grid:0,duration:30,cues:[],analyzed:true},replacement={id:'key-new',key:'G',bpm:90,grid:0,duration:30,cues:[],analyzed:true};
 const deck={index:0,track:old,position:3,rate:1,anchorPosition:3,anchorTime:1,playing:true,keylock:true,keyShift:0,loop:false,sync:false,stemSlip:'off'};
 const reference={index:1,track:{id:'reference',key:'F#'},rate:1,keylock:true,keyShift:0};
 const state={decks:[deck,reference],tracks:[old,replacement],deckCount:2,focus:0,settings:{'Sync Mode':'Off'},fx:[[],[]],flip:{},history:[],prepare:[]};
 let reject,resolve,calls=0,disposed=false;
 const adapter={position:()=>3,stateAt:()=>({rate:1}),
  update(){if(reject){reject(new DOMException('Superseded live command','AbortError'));reject=null;}
   if(++calls===1)return new Promise((yes,no)=>{resolve=yes;reject=no;});
   return Promise.resolve({position:3,when:1,superseded:false});},
  async dispose(){disposed=true;reject?.(new DOMException('Disposed live command','AbortError'));reject=null;}};
 const voice={liveKeylock:adapter,pitchSettings:{keylock:true,keyShift:0},sources:[]};engine.voices.set(0,voice);
 engine.ctx={currentTime:1};engine.nodes[0]={};engine.buffer=async()=>({duration:30});engine.configureFX=()=>{};engine.setDeckTrackGain=()=>{};
 const cancel={cancelDeck(){},pending:()=>false,latch:()=>false},smartSync={loaded(){},paused(){},reconcile(){}};
 const scope={state,engine,smartSync,createDeckKeyShift,planKeySync,renderedDeckShape:'fixture',playbackIntents:{record(){}},syncMaster:{started(){}},
  trackById:id=>id===replacement.id?replacement:null,autoplayRequests:new WeakMap(),playRequests:new WeakMap(),deckLoadRequests:new WeakMap(),faderStarts:new Map(),
  instantDouble:cancel,cueHolds:cancel,deckScratchControls:cancel,pitchPlay:cancel,loopPads:cancel,manualLoops:cancel,slicer:cancel,stemSlipControls:cancel,
  flipAutomation:{stop(){}},tempoSliders:{cancel(){}},trackGain:{refresh(){}},notify:message=>notices.push(message),persist(){},renderDecks(){},renderTracks(){},drawWaves(){},
  refreshAnalysisControls:(s,t)=>feedback.push(t.id),refreshDeckSwitches(){},refreshLoopDecks(){},refreshTransportControls(){}};
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const wiring=source.slice(source.indexOf('const deckKeyShift=createDeckKeyShift('),source.indexOf('async function play('));
 const load=source.slice(source.indexOf('async function load(index,'),source.indexOf('\nconst deckKeyShift='));
 const play=source.slice(source.indexOf('async function play(d, input'),source.indexOf('\nfunction deckQuantize'));
 const action=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
 vm.runInNewContext(source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+wiring+'\n'+load+'\n'+play+'\n'+action+'\nglobalThis.actions={press:deckAction,load,play};',scope);
 const cleanup=()=>{engine.pause(deck);assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);assert(disposed);};
 return{engine,deck,state,replacement,feedback,notices,cleanup,...scope.actions,
  complete(){resolve({position:3,when:1,superseded:false});reject=null;}};
}

for(const action of ['Load','Stop','newer key','Key Lock OFF'])test(`${action} owns the deck after canceled live Key Sync`,async()=>{
 const f=fixture();try{
  const pending=f.press('keySync',0,{});assert.equal(f.deck.keyShift,1);
  let latest;
  if(action==='Load')assert.equal(await f.load(0,f.replacement.id,{skipDouble:true}),true);
  else if(action==='Stop')await f.play(f.deck);
  else latest=f.press(action==='newer key'?'keyUp':'keylock',0,{});
  await pending;if(latest)await latest;
  assert.equal(f.deck.keySync,false,'Canceled Key Sync cannot publish active state');
  assert.equal(f.notices.filter(n=>n.startsWith('Key Sync:')).length,0,'Canceled Key Sync cannot publish success');
  if(action==='Load'){assert.equal(f.deck.track,f.replacement);assert.equal(f.deck.keyShift,0);assert(!f.feedback.includes(f.replacement.id));}
  else if(action==='Stop'){assert.equal(f.deck.playing,false);assert.equal(f.feedback.length,0);}
  else if(action==='newer key'){assert.equal(f.deck.keyShift,2);assert.equal(f.deck.playing,true);assert.equal(f.feedback.length,1);}
  else{assert.equal(f.deck.keylock,false);assert.equal(f.deck.keyShift,1);assert.equal(f.feedback.length,0);}
 }finally{f.cleanup();}
});

test('ordinary Key Sync commits once; OFF retains pitch and validation errors propagate',async()=>{
 const f=fixture();try{
  const pending=f.press('keySync',0,{});f.complete();await pending;
  assert.equal(f.deck.keySync,true);assert.equal(f.deck.keySyncTag,'C');assert.equal(f.deck.keyShift,1);assert.equal(f.feedback.length,1);
  await f.press('keySync',0,{});assert.equal(f.deck.keySync,false);assert.equal(f.deck.keyShift,1);assert.equal(f.feedback.length,2);
  f.engine.onValidateTransport=()=>{throw Error('Controlled pitch validation failure');};
  await assert.rejects(f.press('keySync',0,{}),/Controlled pitch validation failure/);
  assert.equal(f.deck.keySync,false);assert.equal(f.notices.filter(n=>n.startsWith('Key Sync:')).length,1);
 }finally{f.cleanup();}
});
