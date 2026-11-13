import test from 'node:test';
import assert from 'node:assert/strict';
import {checkedDriftProposal,mountGridDrift} from './grid-drift-controls.js';
test('a checked correction clones its markers without changing the saved track',()=>{
  const track={bpm:120,grid:.2,duration:300,gridWarpMarkers:[]};
  const candidate={bpm:120.001,firstBeat:.21,markers:[{time:185,bpm:120.04}]};
  const result=checkedDriftProposal(candidate,track);result.markers[0].bpm=121;
  assert.equal(candidate.markers[0].bpm,120.04);
  assert.deepEqual(track,{bpm:120,grid:.2,duration:300,gridWarpMarkers:[]});
});
test('invalid persisted proposals cannot reach the staged grid',()=>{
  const track={duration:300};
  for(const suggestion of [null,{bpm:120,firstBeat:0,markers:null},{bpm:120,firstBeat:0,markers:[{time:301,bpm:120}]},{bpm:120,firstBeat:0,markers:[{time:185,bpm:NaN}]},{bpm:120,firstBeat:0,markers:[{time:185,bpm:120},{time:185,bpm:121}]}])
    assert.throws(()=>checkedDriftProposal(suggestion,track));
});
function controls(track){
  const nodes=Object.fromEntries(['check','stage','status'].map(key=>['#grid-drift-'+key,{setAttribute(){},removeAttribute(){}}]));
  const body={isConnected:true,querySelector:key=>nodes[key],contains:()=>body.isConnected,closest:()=>null};
  const deck={track},applied=[];
  return {body,deck,applied,nodes,apply:proposal=>applied.push(proposal)};
}
test('actual staging handler leaves saved metadata alone and respects a later grid lock',()=>{
  const track={bpm:120,grid:.2,duration:300,gridWarpMarkers:[],analysisResult:{grid:{drift:{method:'windowed-bass-pulse-drift-v5',supportedFraction:1,supported:true,detected:true,checkedDuration:300,maximumResidualSeconds:.03,proposalCheck:{status:'improved'},suggestion:{bpm:120,firstBeat:.2,markers:[{time:185,bpm:120.04}]}}}}};
  const c=controls(track),before=structuredClone(track);mountGridDrift({...c,engine:{}});
  assert.equal(c.nodes['#grid-drift-stage'].disabled,false);
  c.nodes['#grid-drift-stage'].onclick();assert.equal(c.applied.length,1);assert.deepEqual(track,before);
  assert.match(c.nodes['#grid-drift-status'].textContent,/Save grid/);
  track.locked=true;c.nodes['#grid-drift-stage'].onclick();assert.equal(c.applied.length,1);
});
test('closing a grid while decode is pending prevents a late result from reaching its replacement',async()=>{
  const c=controls({bpm:120,grid:.2,duration:300});let resolve;
  mountGridDrift({...c,engine:{buffer:()=>new Promise(r=>{resolve=r;})}});
  const pending=c.nodes['#grid-drift-check'].onclick();c.body.isConnected=false;resolve(null);await pending;
  assert.equal(c.applied.length,0);
});
test('a persisted proposal that worsens independent onset timing cannot be staged',()=>{
  const track={bpm:120,grid:.2,duration:300,analysisResult:{grid:{drift:{method:'windowed-bass-pulse-drift-v5',supportedFraction:1,supported:true,detected:true,checkedDuration:300,maximumResidualSeconds:.03,proposalCheck:{status:'worse'},suggestion:{bpm:120,firstBeat:.2,markers:[{time:185,bpm:120.04}]}}}}};
  const c=controls(track);mountGridDrift({...c,engine:{}});
  assert.equal(c.nodes['#grid-drift-stage'].disabled,true);
  c.nodes['#grid-drift-stage'].onclick();assert.equal(c.applied.length,0);
});
test('cached proposals without whole-track onset coverage need a fresh check before staging',()=>{
  const track={bpm:120,grid:.2,duration:300,analysisResult:{grid:{drift:{method:'windowed-bass-pulse-drift-v4',supportedFraction:1,supported:true,detected:true,checkedDuration:300,maximumResidualSeconds:.03,proposalCheck:{status:'improved'},suggestion:{bpm:120,firstBeat:.2,markers:[{time:185,bpm:120.04}]}}}}};
  const c=controls(track);mountGridDrift({...c,engine:{}});
  assert.equal(c.nodes['#grid-drift-stage'].disabled,true);
  c.nodes['#grid-drift-stage'].onclick();assert.equal(c.applied.length,0);
});
