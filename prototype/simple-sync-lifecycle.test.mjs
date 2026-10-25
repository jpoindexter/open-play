import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import * as simple from './sync.js';
import {createSmartSync,hasBeatgrid,beatPosition} from './smart-sync.js';

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
const env=vm.createContext({vm,source,rendering,orientation,AudioEngine,synchronizeSimple:simple.synchronizeSimple,isSimpleSyncPending});
vm.runInContext(cut(audioTest,'function fixture(','\nconst saved=').replace('function fixture(','function audioFixture(')+'\n'+
 cut(layoutTest,'function fixture(','\nfor(const count').replace('function fixture(','function domFixture(')
 .replace('const scope={state,','const scope={isSimpleSyncPending,state,'),env);
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
 const button={disabled:true},scope=vm.createContext({d:f.deck,state:f.state,syncButton:null,isSimpleSyncPending,
  hasBeatgrid:()=>true,document:{querySelector:()=>button}});vm.runInContext(source.slice(begin,end),scope);
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
