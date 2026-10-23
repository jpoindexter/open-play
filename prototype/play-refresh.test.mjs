import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {refreshTransportControls} from './transport-presentation.js';
import {createStemSlipControls} from './stem-slip-ui.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const playSource=source.slice(source.indexOf('async function play(d) {'),source.indexOf('\nfunction deckQuantize'));
const prepared=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({latch=false,reject=false,slice=null}={}){
 const decks=Array.from({length:4},(_,index)=>({index,track:{id:String(index),plays:0},playing:false,processing:false,mode:'INT',slice,loop:!!slice,loopIn:2,loopOut:6}));
 const state={decks,deckCount:4,focus:2,settings:{'Retain Tracks in Prepare':false},history:[],prepare:['2']},d=decks[2],calls={decks:0,tracks:0,refresh:0,starts:0},playRequests=new WeakMap();
 let resolveStart,generation=0;
 const engine={pause(d){generation++;d.playing=false;d.processing=false;},async start(d){calls.starts++;const own=generation;await new Promise(resolve=>resolveStart=resolve);if(reject)throw Error('Start failed');if(own===generation)d.playing=true;}};
 const context={state,engine,playRequests,pitchPlay:{latch:()=>latch},cueHolds:{latch:()=>false,cancelDeck(){}},syncMaster:{started(){}},
  smartSync:{reconcile(){},paused(){},async start(){return false;},played(){}},slicer:{cancelDeck(d){if(d.slice!==null){d.slice=null;d.loop=false;}}},stemSlipControls:{cancelDeck(){}},
  cancelPendingPlay:d=>{playRequests.delete(d);d.playQueued=false;},persist(){},renderDecks(){calls.decks++;},renderTracks(){calls.tracks++;},
  refreshTransportControls(){calls.refresh++;},notify(){}};
 vm.runInNewContext(playSource+';globalThis.realPlay=play;',context);
 return{d,state,calls,playRequests,context,play:()=>context.realPlay(d),finish:()=>resolveStart?.()};
}
test('queued Play and successful completion preserve deck/mixer nodes instead of rebuilding',async()=>{
 const f=fixture(),pending=f.play();assert.equal(f.d.playQueued,true);
 await prepared();assert.equal(f.calls.starts,1);f.finish();await pending;
 assert.equal(f.d.playing,true);assert.equal(f.d.playQueued,false);
 assert.equal(f.calls.decks,0);assert(f.calls.refresh>=2);assert.equal(f.state.history.length,1);assert.deepEqual(f.state.prepare,[]);
});
test('Pause and a cancelled pending start clear busy state without a deck/mixer redraw',async()=>{
 const f=fixture(),pending=f.play();await prepared();await f.play();
 assert.equal(f.d.playQueued,false);assert.equal(f.d.playing,false);f.finish();await pending;
 assert.equal(f.d.playing,false);assert.equal(f.calls.decks,0);assert.equal(f.state.history.length,0);
});
test('ordinary playing Pause updates transport without replacing controls or creating history',async()=>{
 const f=fixture();f.d.playing=true;await f.play();
 assert.equal(f.d.playing,false);assert.equal(f.d.playQueued,false);assert.equal(f.calls.decks,0);assert.equal(f.calls.refresh,1);assert.equal(f.state.history.length,0);
});
test('failed playback clears queued presentation while preserving stopped controls',async()=>{
 const f=fixture({reject:true}),pending=f.play();await prepared();f.finish();await pending;
 assert.equal(f.d.playing,false);assert.equal(f.d.playQueued,false);assert.equal(f.calls.decks,0);assert(f.calls.refresh>=2);
});
test('Cue/Pitch Play latch refreshes existing controls without starting or rebuilding',async()=>{
 const f=fixture({latch:true});await f.play();assert.equal(f.calls.starts,0);assert.equal(f.calls.decks,0);assert.equal(f.calls.refresh,1);
});
test('stopping a held Slicer slice retains structural refresh for restored loop/pad state',async()=>{
 const f=fixture({slice:3});f.d.playing=true;await f.play();
 assert.equal(f.d.slice,null);assert.equal(f.d.loop,false);assert.equal(f.calls.decks,1);
});
test('stopping pending Stem Slip preparation clears its stale preparing controls once',async()=>{
 const f=fixture(),listeners=new Map(),previous={document:globalThis.document,window:globalThis.window};
 const body={},select={dataset:{stemSlipMode:'2'},value:'vocal'},renders=[];
 let releasePreparation,applied=0;
 const preparation=new Promise(resolve=>releasePreparation=resolve);
 globalThis.document={body,activeElement:body,addEventListener(type,handler){const list=listeners.get(type)||[];list.push(handler);listeners.set(type,list);},querySelector(){return select;}};
 globalThis.window={addEventListener(){}};
 try{
  const engine={stemBuffers:new Map(),position:()=>0,async setStemSlip(){applied++;}};
  const controls=createStemSlipControls({engine,state:f.state,prepare:()=>preparation,render:()=>renders.push(controls.markup(f.d)),notify:message=>assert.fail(message)});
  f.context.stemSlipControls=controls;f.context.renderDecks=()=>{f.calls.decks++;renders.push(controls.markup(f.d));};
  f.d.playing=true;f.d.stemSlip='off';f.d.stemSlipPhase='idle';
  for(const listener of listeners.get('change'))listener({target:select});
  assert.equal(f.d.stemSlipPending,true);assert.match(renders.at(-1),/Preparing Stems for Stem Slip/);
  await f.play();
  assert.equal(f.d.stemSlipPending,false);assert.equal(f.calls.decks,1);assert.doesNotMatch(renders.at(-1),/Preparing Stems for Stem Slip/);
  releasePreparation();await prepared();assert.equal(applied,0,'Cancelled preparation must not arm a later mode');
  assert.equal(f.calls.decks,1,'The revoked mode request cannot supply the missing refresh later');
 }finally{releasePreparation();await prepared();globalThis.document=previous.document;globalThis.window=previous.window;}
});
function controls(state){
 const nodes=new Map();let mutations=0;
 const node=()=>{const attrs=new Map(),classes=new Set();let text='',title='',disabled=false;
  return{classList:{contains:v=>classes.has(v),toggle(v,on){if(classes.has(v)!==on){mutations++;on?classes.add(v):classes.delete(v);}}},
   getAttribute:k=>attrs.get(k),setAttribute(k,v){mutations++;attrs.set(k,v);},
   get textContent(){return text;},set textContent(v){mutations++;text=v;},get title(){return title;},set title(v){mutations++;title=v;},
   get disabled(){return disabled;},set disabled(v){mutations++;disabled=v;}};};
 for(const d of state.decks)for(const selector of[`.deck[data-focus="${d.index}"]`,`[data-action="play"][data-deck="${d.index}"]`,`[data-action="censor"][data-deck="${d.index}"]`,`.deck[data-focus="${d.index}"] .deck-foot > small.muted`])nodes.set(selector,node());
 const focused=nodes.get('[data-action="play"][data-deck="2"]'),root={activeElement:focused,querySelector:selector=>nodes.get(selector)};
 Object.defineProperty(root,'innerHTML',{set(){assert.fail('Transport update must not replace controls');}});
 return{root,nodes,focused,mutations:()=>mutations};
}
test('in-place transport presentation keeps controls/focus and exposes queued, processing and Censor state for all four decks',()=>{
 const {state}=fixture(),f=controls(state),identities=[...f.nodes.values()];
 state.decks[0].playQueued=true;state.decks[1].processing=true;state.decks[2].playing=true;state.decks[3].playing=true;state.decks[3].mode='ABS';
 refreshTransportControls(state,f.root);
 const play=i=>f.root.querySelector(`[data-action="play"][data-deck="${i}"]`),status=i=>f.root.querySelector(`.deck[data-focus="${i}"] .deck-foot > small.muted`),censor=i=>f.root.querySelector(`[data-action="censor"][data-deck="${i}"]`);
 assert.equal(play(0).getAttribute('aria-busy'),'true');assert.equal(play(0).title,'Preparing playback');assert.equal(status(0).textContent,'PREPARING PLAYBACK');
 assert.equal(status(1).textContent,'PROCESSING PITCH…');assert.equal(play(2).textContent,'❚❚');assert.equal(censor(2).disabled,false);assert.equal(censor(3).disabled,true);
 assert.equal(f.root.querySelector('.deck[data-focus="2"]').classList.contains('focused'),true);
 state.decks[0].playQueued=false;state.decks[1].processing=false;state.decks[2].playing=false;state.decks[3].mode='REL';state.focus=3;
 refreshTransportControls(state,f.root);
 assert.equal(play(0).getAttribute('aria-busy'),'false');assert.equal(play(0).title,'Play or pause');assert.equal(status(0).textContent,'LOCAL AUDIO');
 assert.equal(status(3).textContent,'DEVICE SIMULATION');assert.equal(censor(2).disabled,true);assert.equal(censor(3).disabled,false);
 assert.equal(f.root.querySelector('.deck[data-focus="2"]').classList.contains('focused'),false);
 assert.equal(f.root.activeElement,f.focused);assert.deepEqual([...f.nodes.values()],identities);
 const before=f.mutations();refreshTransportControls(state,f.root);assert.equal(f.mutations(),before,'Unchanged frame must not rewrite transport presentation');
});
test('the frame clock refreshes transport presentation after waveform geometry and before remaining controls',()=>{
 const tick=source.slice(source.indexOf('function tick() {'));
 assert(tick.indexOf('drawDetailWave();')<tick.indexOf('refreshTransportControls(state);'));
 assert(tick.indexOf('refreshTransportControls(state);')<tick.indexOf('for (const d of state.decks'));
});
