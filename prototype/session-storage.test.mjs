import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionStorage,sessionKey} from './session-storage.js';
const memory=raw=>{const map=new Map(raw===undefined?[]:[[sessionKey,raw]]);return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
test('malformed startup preserves original across blocked autosaves and can explicitly recover',()=>{
 const raw='{"crates":{}}',storage=memory(raw),session=createSessionStorage(storage);
 assert.deepEqual(session.load(),{});assert.match(session.status().error,/Invalid/);
 assert.equal(session.save({settings:{}}),false);assert.equal(storage.getItem(sessionKey),raw);
 assert.equal(session.recover({settings:{}}),true);assert.equal(storage.getItem(session.status().recoveryKey),raw);
 assert.deepEqual(createSessionStorage(storage).load(),{settings:{}});
});
test('failed quarantine never overwrites original',()=>{
 const storage=memory('{broken'),session=createSessionStorage(storage);session.load();
 storage.setItem=()=>{throw Error('quota');};assert.equal(session.recover({}),false);assert.equal(storage.getItem(sessionKey),'{broken');
});
test('quota failure stays unsaved until successful retry',()=>{
 const storage=memory('{}'),session=createSessionStorage(storage);session.load();const write=storage.setItem;
 storage.setItem=()=>{throw Error('quota');};assert.equal(session.save({settings:{}}),false);assert.match(session.status().error,/not saved/);
 assert.equal(storage.getItem(sessionKey),'{}');storage.setItem=write;assert.equal(session.save({settings:{}}),true);assert.equal(session.status().error,null);
});
test('invalid nested startup values never reach consumers',()=>{
 for(const data of [{settings:{'Quantize Value':1}},{tags:{'demo-0':{cues:null}}},{prepare:{}},{history:[null]},{mappings:null},{tags:{'demo-0':{analysisResult:{gain:[]}}}}]){
  const storage=memory(JSON.stringify(data)),session=createSessionStorage(storage);assert.deepEqual(session.load(),{});assert.ok(session.status().blocked);
 }
});
