import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};

// Actual app Load and real Sync/rate ownership; controlled resume, graph and buffer.
test('accepted same-track reload retires old Sync rollback; rejected locked load does not',async t=>{
 const entered=deferred(),resume=deferred(),engine=new AudioEngine(),notices=[];
 const track={id:'follower',title:'Follower',bpm:120,grid:0,duration:30,cues:[],analyzed:true};
 const deck={index:1,track,position:3,anchorPosition:3,anchorTime:1,rate:1,playing:true,sync:true,syncState:'beat',syncRole:'secondary'};
 const leader={...deck,index:0,track:{...track,id:'leader',bpm:126},syncRole:'primary'};
 const state={decks:[leader,deck],settings:{'Sync Mode':'Smart Sync','Maintain Sync on Track Load':true},fx:[[],[]],flip:{deck:-1},focus:1};
 engine.ctx={currentTime:1,createBufferSource:()=>({playbackRate:{value:1},start(){},connect(){},disconnect(){},stop(){}})};
 engine.nodes[1]={};engine.resume=async()=>{entered.resolve();await resume.promise;};
 engine.buffer=async()=>({duration:30,sampleRate:44100});engine.applyChannelFX=async()=>{};engine.configureFX=()=>{};
 engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};engine.voices.set(1,{sources:[]});
 const smartSync=createSmartSync({engine,state});smartSync.setMaster(leader);
 const cancel={cancelDeck(){}},scope={state,engine,smartSync,trackById:id=>id===track.id?track:null,autoplayRequests:new WeakMap(),playRequests:new WeakMap(),deckLoadRequests:new WeakMap(),faderStarts:new Map(),
  instantDouble:cancel,cueHolds:cancel,deckScratchControls:cancel,pitchPlay:cancel,loopPads:cancel,manualLoops:cancel,slicer:cancel,stemSlipControls:cancel,trackGain:{refresh(){}},
  notify:message=>{notices.push(message);},renderDecks(){},renderTracks(){},drawWaves(){}};
 const load=source.slice(source.indexOf('async function load(index,'),source.indexOf('\nconst deckKeyShift='));
 vm.runInNewContext(source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+load+'\nglobalThis.actualLoad=load;',scope);
 t.after(()=>{resume.resolve();engine.pause(deck);});
 const old=smartSync.press(deck).then(()=>null,error=>error);await entered.promise;
 assert.equal(deck.rate,1.05);const owner=engine.rateOwners.get(deck),token=engine.startTokens.get(1);
 state.settings['Lock Playing Deck']=true;
 assert.equal(await scope.actualLoad(1,track.id,{skipDouble:true}),undefined);
 assert.match(notices[0],/Playing deck locked/);assert.equal(engine.rateOwners.get(deck),owner);assert.equal(engine.startTokens.get(1),token);assert.equal(deck.playing,true);
 state.settings['Lock Playing Deck']=false;
 assert.equal(await scope.actualLoad(1,track.id,{skipDouble:true}),true);
 const reloaded={rate:deck.rate,position:deck.position,token:engine.startTokens.get(1)};
 assert.equal(reloaded.rate,1.05);assert.equal(deck.syncState,'armed');
 resume.resolve();assert.equal((await old).name,'AbortError');
 assert.equal(deck.rate,reloaded.rate,'Old canceled Sync changed the reloaded deck rate');assert.equal(deck.position,reloaded.position);assert.equal(engine.startTokens.get(1),reloaded.token);
 assert.equal(deck.track,track);assert.equal(deck.sync,true);assert.equal(deck.syncState,'armed');assert.equal(smartSync.captureTempo(),126);assert.equal(deck.playing,false);assert.equal(engine.voices.size,0);
});
