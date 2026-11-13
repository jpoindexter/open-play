import test from 'node:test';
import assert from 'node:assert/strict';
import {newDeck} from './fixtures.js';
import {createSessionStorage} from './session-storage.js';
import {snapshotDeckSession,restoreDeckSession} from './deck-session.js';

test('loaded tracks and positions round-trip through real session validation without playback authority',()=>{
 const tracks=[{id:'saved-song',duration:200},{id:'other-song',duration:100}],state={tracks,selected:'other-song',deckCount:4,decks:Array.from({length:4},(_,i)=>newDeck(i))};
 Object.assign(state.decks[0],{track:tracks[0],playing:true,playQueued:true,sync:true,position:21});
 Object.assign(state.decks[2],{track:tracks[0],position:90});
 Object.assign(state.decks[3],{track:tracks[1],position:300});
 const records=new Map(),storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};
 const owner=createSessionStorage(storage);owner.load();assert(owner.save({deckSession:snapshotDeckSession(state,d=>d.position)}));
 const saved=createSessionStorage(storage).load(),fresh={tracks,selected:'demo-0',deckCount:2,decks:Array.from({length:4},(_,i)=>newDeck(i))};
 const restored=restoreDeckSession(saved.deckSession,fresh);
 assert.equal(fresh.deckCount,4);assert.equal(fresh.selected,'other-song');assert.deepEqual(restored.plans.map(p=>[p.index,p.id,p.position]),[[0,'saved-song',21],[2,'saved-song',90],[3,'other-song',100]]);
 assert.equal(fresh.decks[1].track,null);assert(fresh.decks.every(d=>!d.playing&&!d.playQueued&&!d.sync));
 const missing={...fresh,tracks:[],decks:Array.from({length:4},(_,i)=>newDeck(i))};
 assert.deepEqual(restoreDeckSession(saved.deckSession,missing).missing,['saved-song','saved-song','other-song']);
 assert.deepEqual(snapshotDeckSession(missing,()=>0).decks,saved.deckSession.decks,'Unavailable references must survive later session saves');
 records.set('openplay-review-v1',JSON.stringify({deckSession:{...saved.deckSession,decks:[{id:'bad',position:-1},null,null,null]}}));
 const invalid=createSessionStorage(storage);assert.deepEqual(invalid.load(),{});assert.equal(invalid.status().blocked,true);assert.equal(invalid.save({}),false);
 const legacy={tracks:[{id:'demo-0',duration:48},{id:'demo-1',duration:48}],decks:Array.from({length:4},(_,i)=>newDeck(i))};
 assert.equal(restoreDeckSession(undefined,legacy).plans.length,2);
});
