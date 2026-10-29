import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {synchronizeSimple} from './sync.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createSmartSync} from './smart-sync.js';
import {createSyncMaster} from './sync-master.js';
import {createSyncTempoRequests} from './sync-tempo-requests.js';
import {createSlicer} from './slicer.js';

// Actual Simple Sync, Seek/rate/start ownership and transient analysis, with
// controlled buffer/graph/clock endpoints. No native/PCM/listening acceptance.
function fixture(){
 const engine=new AudioEngine(),starts=[],retired=[];
 const track=id=>({id,bpm:id==='leader'?126:120,grid:0,duration:60});
 const deck={index:1,track:track('incoming'),playing:true,processing:false,position:3,anchorPosition:3,anchorTime:1,rate:1};
 const leader={...deck,index:0,track:track('leader')};
 const data=new Float32Array(60000);for(let n=500;n<data.length;n+=500)data.fill(.5,n,n+32);
 const buffer={duration:60,sampleRate:1000,length:data.length,numberOfChannels:1,getChannelData:()=>data};
 engine.ctx={currentTime:1,createGain:()=>({gain:{value:1},connect(){},disconnect(){}}),
  createBufferSource:()=>({playbackRate:{value:1},connect(){},disconnect(){},stop(){},start(when,offset){starts.push({when,offset,rate:this.playbackRate.value});}})};
 engine.nodes[0]={};engine.nodes[1]={};engine.resume=async()=>{};engine.applyChannelFX=async()=>{};
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.disposeVoice=()=>{};engine.setCross=()=>{};
 engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);engine.retireVoiceAt=(i,v)=>retired.push(v);
 engine.voices.set(1,{sources:[]});engine.voices.set(0,{sources:[]});
 let release;const gate=new Promise(r=>{release=r;});let calls=0;
 engine.buffer=async()=>{if(++calls<=2)await gate;return buffer;};
 return{engine,deck,leader,starts,retired,release,press:(snapToGrid=true)=>synchronizeSimple({engine,deck,leader,snapToGrid})};
}
const saved=f=>({voice:f.engine.voices.get(1),token:f.engine.startTokens.get(1),rate:f.deck.rate,position:f.engine.position(f.deck),starts:f.starts.length,retired:f.retired.length});
function retained(f,before){
 assert.equal(f.engine.voices.get(1),before.voice);assert.equal(f.engine.startTokens.get(1),before.token);
 assert.equal(f.deck.rate,before.rate);assert.equal(f.engine.position(f.deck),before.position);
 assert.equal(f.starts.length,before.starts);assert.equal(f.retired.length,before.retired);assert.equal(f.deck.processing,false);
}
for(const snap of [true,false])test(`pending ${snap?'grid':'transient'} Simple Sync cannot override a later manual Seek`,async()=>{
 const f=fixture(),pending=f.press(snap),rejected=assert.rejects(pending,{name:'AbortError'});
 await f.engine.seek(f.deck,9);const before=saved(f);f.release();await rejected;retained(f,before);
});
for(const action of ['stop/restart','tempo','primary Seek','grid edit'])test(`Simple Sync preparation cancels for newer ${action}`,async()=>{
 const f=fixture(),pending=f.press(),rejected=assert.rejects(pending,{name:'AbortError'});
 if(action==='stop/restart'){f.engine.pause(f.deck);await f.engine.start(f.deck);}
 if(action==='tempo')await f.engine.setRate(f.deck,1.1);
 if(action==='primary Seek')await f.engine.seek(f.leader,12);
 if(action==='grid edit'){f.deck.track.grid=.2;f.deck.track.metadataRevision=1;}
 const before=saved(f);f.release();await rejected;retained(f,before);
});
test('a later Simple Sync press owns preparation even when the older buffers finish last',async()=>{
 const f=fixture(),older=f.press(),rejected=assert.rejects(older,{name:'AbortError'});
 const newer=await f.press(),before=saved(f);assert.equal(newer.kind,'grid');assert.equal(before.starts,1);
 f.release();await rejected;retained(f,before);
});
test('a current Simple Sync still aligns at its own future start token',async()=>{
 const f=fixture(),pending=f.press();f.release();const result=await pending;
 assert.equal(result.kind,'grid');assert.equal(f.deck.rate,1.05);assert.equal(f.starts.length,1);
 assert.equal(f.deck.playing,true);assert.ok(f.deck.anchorTime>f.engine.ctx.currentTime);
 assert.equal(f.engine.transforms.size,0);assert.equal(f.deck.processing,false);
});
test('a paused Simple Sync remains tempo-only without starting audio',async()=>{
 const f=fixture();f.deck.playing=false;f.engine.voices.delete(1);const result=await f.press();
 assert.equal(result.kind,'tempo');assert.equal(f.deck.rate,1.05);assert.equal(f.deck.playing,false);assert.equal(f.starts.length,0);
});
test('a completed in-place live seek cancels preparation without a start-token change',async()=>{
 const f=fixture();let position=3;
 const live={position:()=>position,seek:async value=>{position=value;return{position,when:1.01};}};
 f.engine.voices.get(1).liveKeylock=live;const token=f.engine.startTokens.get(1);
 const pending=f.press(),rejected=assert.rejects(pending,{name:'AbortError'});
 await f.engine.seek(f.deck,11);assert.equal(f.engine.startTokens.get(1),token);
 const before=saved(f);f.release();await rejected;retained(f,before);
});
test('a newer equal-rate owner also supersedes delayed Simple Sync',async()=>{
 const f=fixture(),pending=f.press(),rejected=assert.rejects(pending,{name:'AbortError'});
 await f.engine.setRate(f.deck,1);const before=saved(f);f.release();await rejected;retained(f,before);
});
test('grid metadata edited inside the owned engine start cannot commit old Simple Sync geometry',async()=>{
 const f=fixture(),old=f.engine.voices.get(1);let releaseResume,reached=false;
 f.engine.resume=()=>{reached=true;return new Promise(resolve=>{releaseResume=resolve;});};
 const pending=f.press(),rejected=assert.rejects(pending,{name:'AbortError'});f.release();
 for(let n=0;n<100&&!reached;n++)await Promise.resolve();assert.equal(reached,true);
 Object.assign(f.deck.track,{bpm:100,grid:.2,metadataRevision:1});releaseResume();await rejected;
 assert.equal(f.engine.voices.get(1),old);assert.equal(f.deck.rate,1);assert.equal(f.starts.length,0);
 assert.equal(f.deck.playing,true);assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
});

test('obsolete tempo-only Simple completion cannot engage a newer unmatched Play',async t=>{
 const f=fixture(),{engine,deck,leader}=f;
 const state={decks:[leader,deck],focus:1,settings:{'Sync Mode':'Simple Sync','Snap to Beatgrid':true},history:[],prepare:[]};
 Object.assign(deck,{sync:false,syncRole:null,syncState:'off'});deck.track.plays=0;
 Object.assign(leader,{playing:false,sync:false,syncRole:null,syncState:'off'});engine.voices.delete(0);
 const syncMaster=createSyncMaster({decks:()=>state.decks});syncMaster.select(leader);
 const smartSync=createSmartSync({engine,state}),slicer=createSlicer({engine}),notices=[];
 const scope={state,engine,synchronizeSimple,smartSync,syncMaster,slicer,tempoSliders:{cancel(){}},
  playbackIntents:{record(){}},autoplayRequests:new WeakMap(),playRequests:new WeakMap(),pitchPlay:{latch:()=>false},
  cueHolds:{latch:()=>false,cancelDeck(){}},instantDouble:{pending:()=>false,cancelDeck(){}},stemSlipControls:{cancelDeck(){}},loopPads:{rolling:()=>false,cancelDeck(){}},
  renderTracks(){},refreshTransportControls(){},persist(){},notify:message=>notices.push(message)};
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const cut=(from,to)=>source.slice(source.indexOf(from),source.indexOf(to,source.indexOf(from)));
 vm.createContext(scope);vm.runInContext(cut('function cancelPendingPlay(','\nconst faderStarts=')+'\n'+
  cut('async function play(','\nfunction deckQuantize')+'\n'+cut('async function deckAction(','\nlet importTail='),scope);
 engine.onRateRequest=createSyncTempoRequests({engine,state,smartSync,slicer,participants:()=>[],master:syncMaster.master});
 f.release();let release,calls=0;engine.applyChannelFX=()=>++calls===1?new Promise(resolve=>release=resolve):Promise.resolve();
 t.after(()=>{release?.();engine.pause(deck);engine.pause(leader);assert.equal(engine.voices.size,0);assert.equal(engine.transforms.size,0);});
 const pending=scope.deckAction('sync',1,{},{}).then(value=>({value}),error=>({error}));
 assert.equal(typeof release,'function');assert.equal(deck.rate,1.05);
 await scope.deckAction('play',1,{},{});await scope.deckAction('play',1,{},{});await engine.setRate(deck,1.1);
 const voice=engine.voices.get(1),token=engine.startTokens.get(1);assert.equal(deck.playing,true);assert.equal(deck.sync,false);
 release();const result=await pending;
 assert.equal(result.error?.name,'AbortError','An obsolete126BPM match must not mark newer132BPM playback synced');
 assert.equal(deck.sync,false);assert.equal(deck.syncRole,null);assert.equal(leader.sync,false);assert.equal(notices.length,0);
 assert.equal(engine.voices.get(1),voice);assert.equal(engine.startTokens.get(1),token);assert.equal(deck.playing,true);assert.equal(deck.rate,1.1);
 // A current tempo-only request still commits its own rate-owner transition.
 await scope.deckAction('sync',1,{},{});
 assert.equal(deck.rate,1.05);assert.equal(deck.sync,true);assert.equal(deck.syncRole,'secondary');
 assert.equal(leader.sync,true);assert.equal(leader.syncRole,'primary');assert.equal(notices.length,1);
 assert.equal(engine.voices.get(1),voice);assert.equal(engine.startTokens.get(1),token);
});
