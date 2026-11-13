import test from 'node:test';
import assert from 'node:assert/strict';
import {saveTrackDetails} from './track-details.js';
import {trackMetadata} from './library-state.js';
import {createSessionStorage} from './session-storage.js';

test('blank BPM cannot save a broken warp grid; unwarped unknown BPM stays supported',async()=>{
 const track={id:'variable-song',title:'Original',artist:'Artist',album:'Album',key:'Am',comment:'',color:'#123456',rating:0,bpm:120,grid:0,duration:60,cues:[],gridWarpMarkers:[{time:10,bpm:121}]};
 const fields=new FormData();for(const key of ['title','artist','album','key','comment','color','rating'])fields.set(key,track[key]);fields.set('bpm','');
 const records=new Map(),store={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)},session=createSessionStorage(store);session.load();
 const persist=()=>session.save({localTags:{[track.id]:trackMetadata(track)}});assert.equal(persist(),true);
 const before=structuredClone(track),saved=[...records],calls=[],engine={onGridWillChange:()=>calls.push('revoke'),onGridChanged:()=>calls.push('realign')};
 await assert.rejects(saveTrackDetails(track,fields,engine,persist),/warp grid/);
 assert.deepEqual(track,before);assert.deepEqual([...records],saved);assert.deepEqual(calls,[]);
 const reload=createSessionStorage(store);assert.equal(reload.load().localTags[track.id].bpm,120);assert.equal(reload.status().blocked,false);
 track.gridWarpMarkers=[];await saveTrackDetails(track,fields,engine,persist);
 const unwarped=createSessionStorage(store);assert.equal(unwarped.load().localTags[track.id].bpm,0);assert.equal(unwarped.status().blocked,false);
});
