import assert from 'node:assert/strict';
import test from 'node:test';
import {measureTempoDrift} from './tempo-drift.js';
import {createBeatgrid} from './beatgrid.js';
import {analyzePCM} from './analysis.js';

const sampleRate=11025,duration=300,firstBeat=.37,bpm=115.54;
function rhythm(changes=[]){
  const pcm=new Float32Array(sampleRate*duration),attacks=[];
  for(let at=firstBeat,beat=0;at<duration;beat++){
    attacks.push(at);
    for(let j=0;j<sampleRate*.08&&Math.round(at*sampleRate)+j<pcm.length;j++){
      const t=j/sampleRate;
      pcm[Math.round(at*sampleRate)+j]=.6*Math.sin(2*Math.PI*(48*t+2*(1-Math.exp(-t*35))))*Math.exp(-40*t);
    }
    const local=changes.filter(x=>at>=x.time).at(-1)?.bpm||bpm;
    at+=60/local;
  }
  return {pcm,attacks};
}
test('full-track drift check leaves a steady grid alone',()=>{
  const {pcm}=rhythm();
  const r=measureTempoDrift(pcm,sampleRate,{bpm,firstBeat,fitDuration:180});
  assert.equal(r.checkedDuration,duration);
  assert.equal(r.detected,false);
  assert.equal(r.suggestion,null);
});
test('late tempo change is detected beyond the initial analysis window and suggested map follows it',()=>{
  const {pcm,attacks}=rhythm([{time:185,bpm:115.60}]);
  const r=measureTempoDrift(pcm,sampleRate,{bpm,firstBeat,fitDuration:180});
  assert.equal(r.detected,true);
  assert(r.maximumResidualSeconds>.025);
  assert(r.suggestion?.markers.length>0);
  const grid=createBeatgrid({bpm:r.suggestion.bpm,grid:r.suggestion.firstBeat,gridWarpMarkers:r.suggestion.markers,duration});
  const errors=attacks.filter(t=>t>200&&t<280).map(t=>Math.abs(grid.timeAt(Math.round(grid.beatAt(t)))-t));
  assert(Math.max(...errors)<.010,`late grid error ${Math.max(...errors)} seconds`);
  assert(r.suggestion.markers.some(m=>Math.abs(m.time-185)<15));
  assert(r.suggestion.markers.some(m=>Math.abs(m.bpm-115.60)<.03));
});
test('silence does not invent a warp map and malformed clocks are rejected',()=>{
  assert.equal(measureTempoDrift(new Float32Array(sampleRate*15),sampleRate,{bpm,firstBeat,fitDuration:15}).suggestion,null);
  assert.throws(()=>measureTempoDrift(new Float32Array(5),sampleRate,{bpm:NaN,firstBeat}),/grid/i);
});
test('production analysis checks beyond maxSeconds without installing the suggested map',()=>{
  const {pcm}=rhythm([{time:185,bpm:115.60}]);
  const r=analyzePCM([pcm],sampleRate,{analyzeKey:false,maxSeconds:180});
  assert.equal(r.partial,true);
  assert.equal(r.analyzedDuration,180);
  assert.equal(r.grid.drift?.detected,true);
  assert.equal(r.grid.drift.checkedDuration,duration);
  assert(r.warnings.includes('tempo_drift_detected'));
  assert.equal(r.grid.type,'constant','a proposal must not silently become the active grid');
});
