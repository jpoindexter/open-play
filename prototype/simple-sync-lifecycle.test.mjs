import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import * as simple from './sync.js';
import {createSmartSync,hasBeatgrid,beatPosition} from './smart-sync.js';
import {refreshSyncPresentation} from './sync-presentation.js';
import {uiIcons} from './vendor/astryx/icons.js';
import {createSyncMaster} from './sync-master.js';
import {createSyncTempoRequests} from './sync-tempo-requests.js';
import {createTempoSlider} from './tempo-slider.js';
import {createSlicer} from './slicer.js';
import {saveBeatgrid} from './beatgrid-save.js';
import {createBeatgrid} from './beatgrid.js';

// Actual controller, settings/render, Simple Sync and engine. Controlled DOM,
// buffer/graph/clock/live ACK endpoints; no PCM, native, UI or hearing proof.
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8'),source=read('./app.js'),panels=read('./panels.js');
const cut=(text,from,to)=>text.slice(text.indexOf(from),text.indexOf(to,text.indexOf(from)));
const rendering=cut(source,'let renderedSyncMode','\nfunction waveformView(');
const at=source.indexOf('$("#layout").onchange ='),helper=source.indexOf('function refreshWaveformOrientation(');
const orientation=source.slice(helper>=0&&helper<at?helper:at,source.indexOf('\n$("#deck-count").onchange',at));
const controller=cut(source,'async function deckAction(','\nlet importTail=');
const modeChange=cut(panels,'s.settings[input.dataset.setting] =','if (input.dataset.setting === "Library Text Size")');
const hook=cut(source,'engine.onManualPosition =','\nengine.onGridTimeline =');
const audioTest=read('./simple-sync-preparation.test.mjs'),layoutTest=read('./layout-orientation.test.mjs');
const cancelSimpleSync=simple.cancelSimpleSync||(()=>{}),isSimpleSyncPending=simple.isSimpleSyncPending||(()=>false);
const env=vm.createContext({vm,source,rendering,orientation,AudioEngine,synchronizeSimple:simple.synchronizeSimple,isSimpleSyncPending,uiIcons});
vm.runInContext(cut(audioTest,'function fixture(','\nconst saved=').replace('function fixture(','function audioFixture(')+'\n'+
 cut(layoutTest,'function fixture(','\nfor(const count').replace('function fixture(','function domFixture(')
 .replace('const scope={','const scope={uiIcons,'),env);
function fixture(){
 const a=env.audioFixture(),f=env.domFixture(2,'Horizontal'),notices=[];
 f.state.decks=[a.leader,a.deck];f.state.settings={'Sync Mode':'Simple Sync','Snap to Beatgrid':true};
 Object.assign(f.scope,{engine:a.engine,synchronizeSimple:simple.synchronizeSimple,cancelSimpleSync,isSimpleSyncPending,
  hasBeatgrid,beatPosition,smartSync:createSmartSync({engine:a.engine,state:f.state}),notify:value=>notices.push(value),persist(){},
  syncMaster:{plan:()=>({leader:a.leader,follower:a.deck}),master:()=>a.leader,manual:()=>false},
  panels:{resetTempoAbsolute:async()=>false},s:f.state,monitorFields:new Set(),mixerFields:new Set(),samplerSync:{settingsChanged(){}}});
 vm.runInContext(controller+'\n'+hook,f.scope);f.scope.renderDecks();
 Object.assign(a.deck,{sync:true,syncState:'beat',syncRole:'secondary'});Object.assign(a.leader,{sync:true,syncState:'beat',syncRole:'primary'});
 return{...a,...f,notices,press:()=>f.scope.deckAction('sync',1,{},{}),
  off:(d=a.deck,shift=false)=>f.scope.deckAction(shift?'sync':'syncOff',d.index,{},shift?{shiftKey:true}:{}),
  mode(value){f.scope.input={dataset:{setting:'Sync Mode'},type:'select-one',value};vm.runInContext(modeChange,f.scope);}};
}
const settle=promise=>promise.then(result=>({result}),error=>({error}));
async function until(fn){for(let n=0;n<150;n++){if(fn())return;await Promise.resolve();}assert.fail('Actual engine never reached the held ACK');}
function held(f){
 const acks=[],adapters=[];f.deck.keylock=true;
 f.engine.createForwardKeylock=async options=>{
  const index=adapters.length;let position=options.position,when=1,disposed=false;
  const adapter={outputs:[],snapshot:()=>({groups:[{latency:.02}]}),stateAt:()=>({rate:options.rate}),
   position:at=>position+Math.max(0,(at??f.engine.ctx.currentTime)-when)*options.rate,
   async dispose(){disposed=true;},get disposed(){return disposed;}};
  adapter.start=async settings=>{position=settings.position;when=settings.when;return new Promise(resolve=>{
   acks[index]={signal:options.signal,release:()=>resolve({position,when,playing:true})};});};
  adapter.startTimeline=adapter.start;adapters.push(adapter);return adapter;
 };return{acks,adapters};
}
function retained(f,voice){
 assert.equal(f.engine.voices.get(1),voice);assert.equal(f.deck.rate,1);assert.equal(f.deck.playing,true);
 assert.equal(f.starts.length,0);assert.equal(f.retired.length,0);assert.equal(f.deck.processing,false);
 assert.equal(f.engine.transforms.size,0);assert.equal(isSimpleSyncPending(f.deck),false);assert.equal(f.deck.sync,false);
 assert.equal(f.deck.syncRole,null);assert.equal(f.notices.length,0);
}
for(const shift of [false,true])test(`${shift?'Shift Sync':'OFF'} cancels pending actual Simple buffers without metadata resurrection`,async()=>{
 const f=fixture(),voice=f.engine.voices.get(1),pending=settle(f.press());
 await f.off(f.deck,shift);f.release();const result=await pending;
 assert.equal(result.error?.name,'AbortError');retained(f,voice);
});
for(const modes of [['Off'],['Smart Sync'],['Off','Simple Sync']])test(`actual settings ${modes.join(' → ')} revokes old Simple preparation`,async()=>{
 const f=fixture(),voice=f.engine.voices.get(1),pending=settle(f.press());
 for(const mode of modes)f.mode(mode);f.release();const result=await pending;
 assert.equal(result.error?.name,'AbortError');retained(f,voice);assert.equal(f.leader.sync,false);
 assert.equal(f.state.settings['Sync Mode'],modes.at(-1));
});
for(const changed of ['incoming','primary'])test(`OFF on ${changed} revokes an already armed Simple live ACK`,async()=>{
 const f=fixture(),voice=f.engine.voices.get(1),{acks,adapters}=held(f),pending=settle(f.press());
 f.release();await until(()=>acks[0]);await f.off(changed==='incoming'?f.deck:f.leader);
 const aborted=acks[0].signal.aborted;acks[0].release();const result=await pending;
 assert.equal(aborted,true);assert.equal(result.error?.name,'AbortError');assert.equal(adapters[0].disposed,true);
 if(changed==='incoming')retained(f,voice);else{
  assert.equal(f.engine.voices.get(1),voice);assert.equal(f.leader.sync,false);assert.equal(f.deck.rate,1);
  assert.equal(f.retired.length,0);assert.equal(f.notices.length,0);
 }
});
test('actual OFF leaves a newer unrelated manual transform and its voice intact',async()=>{
 const f=fixture(),{acks,adapters}=held(f),pending=settle(f.press());f.release();await until(()=>acks[0]);
 f.deck.rate=.9;const manual=f.engine.start(f.deck);await until(()=>acks[1]);const token=f.engine.startTokens.get(1);
 await f.off();const newerAborted=acks[1].signal.aborted;acks[1].release();await manual;
 const voice=f.engine.voices.get(1);acks[0].release();const result=await pending;
 assert.equal(newerAborted,false);assert.equal(result.error?.name,'AbortError');assert.equal(f.engine.voices.get(1),voice);
 assert.equal(voice.liveKeylock,adapters[1]);assert.equal(f.engine.startTokens.get(1),token);assert.equal(f.deck.rate,.9);
 assert.equal(f.deck.sync,false);assert.equal(adapters[0].disposed,true);assert.equal(adapters[1].disposed,false);
 assert.equal(isSimpleSyncPending(f.deck),false);assert.equal(f.notices.length,0);
});
test('pending unsynced Simple request keeps actual OFF markup and tick control available',async()=>{
 const f=fixture();f.deck.sync=false;f.deck.syncRole=null;const pending=settle(f.press()),during=isSimpleSyncPending(f.deck);
 const markup=f.scope.syncControls(f.deck),off=markup.match(/<button[^>]*data-action="syncOff"[^>]*>/)?.[0];
 const tick=source.indexOf('function tick()'),begin=source.indexOf('    const smart =',tick),end=source.indexOf('    updateTempoSlider(d);',begin);
 const button={disabled:true},document={querySelector:s=>s.includes('data-action="syncOff"')?button:null};
 const scope=vm.createContext({d:f.deck,state:f.state,isSimpleSyncPending,hasBeatgrid,engine:f.engine,
  smartSync:f.scope.smartSync,syncMaster:f.scope.syncMaster,
  refreshSyncPresentation:(deck,options)=>refreshSyncPresentation(deck,options,document)});vm.runInContext(source.slice(begin,end),scope);
 const disabled=button.disabled;f.release();const result=await pending;
 assert.equal(result.error,undefined);assert.equal(during,true);assert.ok(off);assert.doesNotMatch(off,/\sdisabled(?:[\s>])/);
 assert.equal(disabled,false);assert.equal(isSimpleSyncPending(f.deck),false);
});
for(const changed of ['incoming','primary'])test(`actual manual-position hook cancels related ${changed} Simple ACK`,async()=>{
 const f=fixture(),voice=f.engine.voices.get(1),{acks}=held(f),pending=settle(f.press());f.release();await until(()=>acks[0]);
 f.engine.onManualPosition(changed==='incoming'?f.deck:f.leader);const aborted=acks[0].signal.aborted;
 acks[0].release();const result=await pending;assert.equal(aborted,true);assert.equal(result.error?.name,'AbortError');
 assert.equal(f.engine.voices.get(1),voice);assert.equal(f.retired.length,0);assert.equal(f.notices.length,0);
});

test('explicit new MASTER cancels an owned Simple ACK before stale audio or roles commit',async t=>{
 const f=env.audioFixture(),{engine,deck,leader}=f,voice=engine.voices.get(1),notices=[];
 const extra=index=>({index,track:{id:index===2?'new-master':'spare',bpm:index===2?140:128,grid:0,duration:60},position:5,anchorPosition:5,anchorTime:1,rate:1,playing:false});
 const state={decks:[leader,deck,extra(2),extra(3)],deckCount:4,focus:1,settings:{'Sync Mode':'Simple Sync','Snap to Beatgrid':true}};
 state.decks.forEach(d=>Object.assign(d,{sync:false,syncRole:null}));
 const syncMaster=createSyncMaster({decks:()=>state.decks}),{acks,adapters}=held(f);
 const scope={state,engine,synchronizeSimple:simple.synchronizeSimple,cancelSimpleSync,syncMaster,
  smartSync:createSmartSync({engine,state}),tempoSliders:{cancel(){}},persist(){},notify:message=>notices.push(message)};
 vm.createContext(scope);vm.runInContext(controller,scope);
 t.after(async()=>{acks.forEach(ack=>ack.release());state.decks.forEach(d=>engine.pause(d));for(const adapter of adapters)await adapter.dispose();assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);});
 await scope.deckAction('syncMaster',0,{},{});
 const pending=settle(scope.deckAction('sync',1,{},{}));f.release();await until(()=>acks[0]);
 assert.equal(isSimpleSyncPending(deck),true);assert.equal(engine.voices.get(1),voice);
 await scope.deckAction('syncMaster',2,{},{});
 assert.equal(syncMaster.master(),state.decks[2]);assert.equal(syncMaster.manual(),true);
 assert.equal(acks[0].signal.aborted,true,'New MASTER must abort the old target alignment before its held ACK commits');
 acks[0].release();const result=await pending;
 assert.equal(result.error?.name,'AbortError');assert.equal(isSimpleSyncPending(deck),false);
 assert.equal(engine.voices.get(1),voice);assert.equal(deck.rate,1);assert.equal(deck.playing,true);assert.equal(adapters[0].disposed,true);
 assert.equal(deck.sync,false);assert.equal(deck.syncRole,null);assert.equal(leader.sync,false);assert.equal(leader.syncRole,null);assert.equal(notices.length,0);
 const fresh=scope.deckAction('sync',1,{},{});await until(()=>acks[1]);acks[1].release();await fresh;
 assert.equal(syncMaster.master(),state.decks[2]);assert.equal(deck.rate,140/120);assert.equal(deck.sync,true);assert.equal(deck.syncRole,'secondary');
 assert.equal(state.decks[2].sync,true);assert.equal(state.decks[2].syncRole,'primary');assert.equal(leader.sync,false);assert.equal(leader.syncRole,null);
 assert.equal(notices.length,1);assert.match(notices[0],/MASTER deck 3/);assert.equal(engine.voices.get(1).liveKeylock,adapters[1]);
});

test('new leader tempo cancels owned Simple alignment and unrelated tempo leaves a fresh match intact',async t=>{
 const f=env.audioFixture(),{engine,deck,leader}=f,old=engine.voices.get(1),outgoing=engine.voices.get(0),notices=[];
 const extra=index=>({index,track:{id:String(index),bpm:140,grid:0,duration:60},position:0,anchorPosition:0,anchorTime:1,rate:1,playing:false});
 const state={decks:[leader,deck,extra(2),extra(3)],deckCount:4,focus:1,settings:{'Sync Mode':'Simple Sync','Snap to Beatgrid':true}};
 state.decks.forEach(d=>Object.assign(d,{sync:false,syncRole:null}));
 const syncMaster=createSyncMaster({decks:()=>state.decks}),smartSync=createSmartSync({engine,state}),slicer=createSlicer({engine}),{acks,adapters}=held(f);
 const tempoSliders=createTempoSlider({setRate:(d,rate)=>engine.setRate(d,rate)});
 engine.onRateRequest=createSyncTempoRequests({engine,state,smartSync,slicer,participants:()=>[],master:syncMaster.master});
 const scope={state,engine,synchronizeSimple:simple.synchronizeSimple,cancelSimpleSync,syncMaster,smartSync,tempoSliders,updateTempoSlider(){},persist(){},notify:message=>notices.push(message)};
 vm.createContext(scope);vm.runInContext(controller,scope);
 t.after(async()=>{acks.forEach(ack=>ack.release());state.decks.forEach(d=>engine.pause(d));for(const adapter of adapters)await adapter.dispose();assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);});
 await scope.deckAction('syncMaster',0,{},{});
 const pending=settle(scope.deckAction('sync',1,{},{}));f.release();await until(()=>acks[0]);
 await scope.deckAction('tempoUp',0,{},{});
 assert.equal(leader.rate,1.001);assert.equal(engine.voices.get(0),outgoing);
 assert.equal(acks[0].signal.aborted,true,'Leader tempo intent must revoke the old alignment before its held ACK commits');
 acks[0].release();const result=await pending;
 assert.equal(result.error?.name,'AbortError');assert.equal(engine.voices.get(1),old);assert.equal(deck.rate,1);assert.equal(deck.playing,true);
 assert.equal(deck.sync,false);assert.equal(leader.sync,false);assert.equal(notices.length,0);assert.equal(adapters[0].disposed,true);
 const fresh=scope.deckAction('sync',1,{},{});await until(()=>acks[1]);
 await scope.deckAction('tempoUp',2,{},{});
 assert.equal(state.decks[2].rate,1.001);assert.equal(acks[1].signal.aborted,false,'Unrelated deck tempo must not cancel A/B preparation');
 acks[1].release();await fresh;
 assert.equal(deck.sync,true);assert.equal(leader.sync,true);assert.equal(state.decks[2].sync,false);assert.equal(notices.length,1);
 assert.ok(Math.abs(deck.track.bpm*deck.rate-leader.track.bpm*leader.rate)<1e-9);
 assert.equal(engine.voices.get(1).liveKeylock,adapters[1]);assert.equal(engine.voices.get(0),outgoing);assert.equal(leader.rate,1.001);
});

test('public grid publication revokes owned Simple ACKs for incoming and shared leader tracks',async t=>{
 const f=env.audioFixture(),{engine,deck,leader}=f,voice=engine.voices.get(1),outgoing=engine.voices.get(0),notices=[];
 const shared={...leader,index:2},spare={...leader,index:3,track:{...leader.track,id:'spare'}};
 const state={decks:[leader,deck,shared,spare],deckCount:4,focus:1,settings:{'Sync Mode':'Simple Sync','Snap to Beatgrid':true}};
 state.decks.forEach(d=>Object.assign(d,{sync:false,syncRole:null}));
 const smartSync=createSmartSync({engine,state}),syncMaster=createSyncMaster({decks:()=>state.decks}),{acks,adapters}=held(f);
 const scope={state,engine,synchronizeSimple:simple.synchronizeSimple,cancelSimpleSync,smartSync,syncMaster,tempoSliders:{cancel(){}},persist(){},notify:message=>notices.push(message)};
 vm.createContext(scope);vm.runInContext(controller+'\n'+cut(source,'engine.onGridWillChange =','\nengine.onError ='),scope);
 const original=engine.onGridWillChange,publications=[];let persists=0;
 engine.onGridWillChange=track=>{const saved=original(track);publications.push({track,bpm:track.bpm,grid:track.grid,aborted:acks.at(-1).signal.aborted});return saved;};
 t.after(async()=>{acks.forEach(ack=>ack.release());state.decks.forEach(d=>engine.pause(d));for(const adapter of adapters)await adapter.dispose();assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);});
 await scope.deckAction('syncMaster',0,{},{});
 const pending=settle(scope.deckAction('sync',1,{},{}));f.release();await until(()=>acks[0]);
 await saveBeatgrid(deck.track,{bpm:100,grid:.1,gridWarpMarkers:[]},true,engine,()=>{persists++;return true;});
 assert.equal(publications[0].aborted,true,'Actual grid hook must abort the old incoming alignment before publishing its new BPM/grid');
 assert.equal(publications[0].bpm,120);assert.equal(publications[0].grid,0);assert.equal(deck.track.bpm,100);assert.equal(deck.track.grid,.1);
 acks[0].release();assert.equal((await pending).error?.name,'AbortError');
 assert.equal(engine.voices.get(1),voice);assert.equal(deck.rate,1);assert.equal(deck.sync,false);assert.equal(leader.sync,false);assert.equal(notices.length,0);
 const retry=settle(scope.deckAction('sync',1,{},{}));await until(()=>acks[1]);
 await saveBeatgrid(shared.track,{bpm:130,grid:.2,gridWarpMarkers:[]},true,engine,()=>{persists++;return true;});
 assert.equal(publications[1].aborted,true,'Editing a track shared by the current leader must revoke the related incoming ACK');
 assert.equal(publications[1].bpm,126);assert.equal(publications[1].grid,0);assert.equal(leader.track,shared.track);assert.equal(leader.track.bpm,130);
 acks[1].release();assert.equal((await retry).error?.name,'AbortError');
 assert.equal(engine.voices.get(1),voice);assert.equal(deck.rate,1);assert.equal(deck.sync,false);assert.equal(leader.sync,false);assert.equal(notices.length,0);
 const fresh=scope.deckAction('sync',1,{},{});await until(()=>acks[2]);acks[2].release();await fresh;engine.ctx.currentTime=deck.anchorTime+.1;
 assert.equal(deck.rate,1.3);assert.equal(deck.sync,true);assert.equal(leader.sync,true);assert.equal(notices.length,1);assert.equal(persists,2);
 assert.equal(engine.voices.get(1).liveKeylock,adapters[2]);assert.equal(engine.voices.get(0),outgoing);assert(adapters.slice(0,2).every(adapter=>adapter.disposed));
 const phase=createBeatgrid(deck.track).beatAt(engine.position(deck))-createBeatgrid(leader.track).beatAt(engine.position(leader));
 assert.ok(Math.abs(phase-Math.round(phase))<1e-9,'Fresh alignment must use both published grids');
});
