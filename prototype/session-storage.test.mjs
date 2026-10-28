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
 assert.equal(storage.getItem(sessionKey),'{}');assert.equal(session.status().original,'{}');storage.setItem=write;assert.equal(session.save({settings:{}}),true);assert.equal(session.status().error,null);
 assert.equal(session.status().original,storage.getItem(sessionKey));
});
test('recovery preserves the latest successful save and advances ownership only after replacement',()=>{
 for(const startup of [undefined,'{ "settings": {} }']){
  const storage=memory(startup),session=createSessionStorage(storage);session.load();
  assert.equal(session.save({prepare:['latest']}),true);const latest=storage.getItem(sessionKey);
  session.reject(Error('Invalid imported cue'));assert.equal(session.status().original,latest);
  assert.equal(session.recover({prepare:['recovered']}),true);
  assert.equal(storage.getItem(session.status().recoveryKey),latest);
  const recovered=storage.getItem(sessionKey);assert.equal(session.status().original,recovered);
  session.reject(Error('Another invalid import'));assert.equal(session.recover({}),true);
  assert.equal(storage.getItem(session.status().recoveryKey),recovered);
 }
});
test('failed recovery replacement preserves current ownership and the quarantined record',()=>{
 const original='{broken',storage=memory(original),session=createSessionStorage(storage);session.load();const write=storage.setItem;
 storage.setItem=(key,value)=>{if(key===sessionKey)throw Error('quota');write(key,value);};
 assert.equal(session.recover({}),false);assert.equal(session.status().blocked,true);
 assert.equal(session.status().original,original);assert.equal(storage.getItem(sessionKey),original);
 assert.equal(storage.getItem(session.status().recoveryKey),original);
});
test('recovery refuses to replace an externally changed or removed record until reopened',()=>{
 for(const next of ['{ "prepare": ["newer"] }',null]){
  const storage=memory('{broken'),session=createSessionStorage(storage);session.load();
  if(next===null)storage.map.delete(sessionKey);else storage.setItem(sessionKey,next);
  assert.equal(session.recover({}),false);assert.equal(storage.getItem(sessionKey),next);
  assert.equal(session.status().blocked,true);assert.match(session.status().error,/Reopen/);
  assert.equal(session.status().recoveryKey,null);assert.equal(session.status().original,'{broken');
 }
});
test('invalid nested startup values never reach consumers',()=>{
 for(const data of [{settings:{'Quantize Value':1}},{tags:{'demo-0':{cues:null}}},{prepare:{}},{history:[null]},{mappings:null},{tags:{'demo-0':{analysisResult:{gain:[]}}}}]){
  const storage=memory(JSON.stringify(data)),session=createSessionStorage(storage);assert.deepEqual(session.load(),{});assert.ok(session.status().blocked);
 }
});
