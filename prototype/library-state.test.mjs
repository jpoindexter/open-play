import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzePCM} from './analysis.js';
import {demoTracks,defaultSettings} from './fixtures.js';
import {validateBackup,validateSavedState,validateMetadata,trackMetadata} from './library-state.js';
const json=x=>JSON.parse(JSON.stringify(x));
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
