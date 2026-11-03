import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzePCM} from './analysis.js';
import {demoTracks,defaultSettings} from './fixtures.js';
import {createSessionStorage} from './session-storage.js';
import {validateBackup,validateSavedState,validateMetadata,trackMetadata,createLibraryBackup} from './library-state.js';
const json=x=>JSON.parse(JSON.stringify(x));
test('persisted analysis keeps pulse counts and summaries without duplicate pulse arrays',()=>{
 const grid={firstBeat:.137,beats:Array.from({length:360},(_,i)=>.137+i*60/121.01),drift:{status:'review',markers:[{time:100,bpm:121.02}]}},analysisResult={duration:180,analyzedDuration:180,bpm:121.01,key:'Am',gain:{recommendedDb:-3},warnings:['Estimated downbeat'],grid,tempo:{confidence:.8,grid}};
 const track={id:'local-'+'a'.repeat(64),contentHash:'a'.repeat(64),duration:180,title:'Owned pulse fixture',bpm:121.01,grid:.14,cues:[{position:2,name:'Cue'}],gridWarpMarkers:[{time:100,bpm:121.02}],analysisResult};
 const original=json(track),metadata=trackMetadata(track),compact=metadata.analysisResult;
 assert.equal(compact.grid.beats,undefined,'Pulse arrays must not consume library save space');assert.equal(compact.tempo.grid.beats,undefined);assert.equal(compact.grid.beatCount,360);assert.equal(compact.tempo.grid.beatCount,360);
 assert.deepEqual(compact.grid.drift,grid.drift);assert.equal(compact.grid.firstBeat,.137);assert.deepEqual(metadata.cues,track.cues);assert.deepEqual(metadata.gridWarpMarkers,track.gridWarpMarkers);assert.equal(metadata.grid,.14);
 assert.deepEqual(json(track),original,'Projection must not mutate the full in-memory analysis');assert.equal(track.analysisResult.grid.beats,grid.beats);
 const saved=json({localTags:{[track.contentHash]:metadata}});assert.deepEqual(validateSavedState(saved),saved);
 const backup=json(createLibraryBackup({tracks:[track],crates:[],settings:{}}));assert.deepEqual(validateBackup(backup,[track]).tags,backup.tags);
 const legacy=validateMetadata({analysisResult:json(analysisResult)});assert.equal(legacy.analysisResult.grid.beatCount,360);assert.equal(legacy.analysisResult.grid.beats,undefined);
 assert(JSON.stringify(metadata).length<JSON.stringify(original).length/4,'Persisted summaries should be substantially smaller');
 for(const beatCount of [-1,.5,null,'360',Infinity])assert.throws(()=>validateMetadata({analysisResult:{...compact,grid:{...compact.grid,beatCount}}}),/Invalid/);
 assert.throws(()=>validateMetadata({analysisResult:{...compact,grid:{...grid,beatCount:359}}}),/Invalid/);
});
test('real analysis result and all default preferences survive metadata round trip',()=>{
 const sampleRate=8000,pcm=new Float32Array(sampleRate*8);
 for(let i=0;i<pcm.length;i++)pcm[i]=.3*Math.sin(2*Math.PI*110*i/sampleRate)*Math.exp(-((i/sampleRate)%.5)*20);
 for(const audio of [pcm,new Float32Array(sampleRate)]){
  const track={...demoTracks[0],analysisResult:analyzePCM([audio],sampleRate)};
  const input=json({settings:{...defaultSettings(),'Master Output Level':-10},tags:{[track.id]:trackMetadata(track)}});
  assert.deepEqual(validateSavedState(input),input);
  assert.deepEqual(validateBackup({format:'open-play-prototype-1',crates:[],settings:input.settings,tags:[{id:track.id,...input.tags[track.id]}]},[track]).tags[0],{id:track.id,...input.tags[track.id]});
 }
});
test('crate cycles and prototype keys are rejected before use',()=>{
 assert.throws(()=>validateSavedState({crates:[{id:'a',name:'A',tracks:[],parent:'b'},{id:'b',name:'B',tracks:[],parent:'a'}]}),/cycle/);
 assert.throws(()=>validateSavedState(JSON.parse('{"tags":{"__proto__":{"color":"#ffffff"}}}')),/Invalid/);
});
test('positions and warp timing respect known source duration',()=>{
 for(const input of [{cues:[{position:51}]},{grid:0,bpm:120,gridWarpMarkers:[{time:52,bpm:120}]}])assert.throws(()=>validateMetadata(input,{duration:48}),/Invalid/);
});
test('saved demo metadata cannot extend beyond its known source duration',()=>{
 assert.throws(()=>validateSavedState({tags:{'demo-0':{cues:[{position:51}]}}}),/Invalid/);
});
test('existing settings form numeric strings and unanalyzed imported metadata remain compatible',()=>{
 const input={settings:{'Cue Mix':'50','Cue Volume':'10','Delay Compensation (ms)':'0'},localTags:{hash:{grid:null,bpm:0,key:'—',cues:[],savedLoops:[],color:'#abcdef'}}};
 const output=validateSavedState(input);
 assert.deepEqual(output.settings,{'Cue Mix':50,'Cue Volume':10,'Delay Compensation (ms)':0});
 assert.equal(output.localTags.hash.grid,null);
 assert.equal(validateMetadata({grid:null,bpm:0},{duration:120}).grid,null);
 for(const invalid of ['', ' ', 'NaN', '101', {}, null])assert.throws(()=>validateSavedState({settings:{'Cue Mix':invalid}}),/Invalid/);
});

test('play counts survive session reload and backup restore for demo and content-addressed tracks',()=>{
 const demo={...demoTracks[0],plays:3},local={id:'local-song',contentHash:'song',title:'Saved song',duration:120,plays:7};
 const records=new Map(),storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};
 const session=createSessionStorage(storage);session.load();
 assert(session.save({tags:{[demo.id]:trackMetadata(demo)},localTags:{[local.contentHash]:trackMetadata(local)}}));
 const saved=createSessionStorage(storage).load();
 assert.equal(Object.assign({...demo,plays:0},saved.tags[demo.id]).plays,3);
 assert.equal(Object.assign({...local,plays:0},saved.localTags[local.contentHash]).plays,7);
 const backup=validateBackup(json({format:'open-play-prototype-1',crates:[],tags:[demo,local].map(t=>({id:t.id,...trackMetadata(t)}))}),[demo,local]);
 assert.deepEqual(backup.tags.map(t=>t.plays),[3,7]);
 for(const plays of [-1,.5,'3',null,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>validateMetadata({plays}),/Invalid/);
 assert.deepEqual(validateMetadata({title:'Legacy entry without count'}),{title:'Legacy entry without count'});
});
