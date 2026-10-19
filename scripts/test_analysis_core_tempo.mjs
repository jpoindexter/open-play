import assert from 'node:assert/strict';
import {analyzePCM} from '../prototype/analysis.js';

// Known musical pulse with accented beats, off-beat percussion and a leading
// unrelated transient. The construction provides BPM/phase truth; no private
// music, filename or metadata is used by the detector.
const sampleRate=22050,duration=90,firstBeat=.37;
function rhythm(bpm){
  const pcm=new Float32Array(sampleRate*duration),period=60/bpm;
  let seed=72841;
  function hit(at,gain,kind){
    const start=Math.round(at*sampleRate),length=Math.round(sampleRate*.09);
    for(let j=0;j<length&&start+j<pcm.length;j++){
      const t=j/sampleRate;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const noise=seed/4294967296*2-1;
      const sample=kind==='kick'?Math.sin(2*Math.PI*(48*t+2*(1-Math.exp(-t*35)))):noise;
      pcm[start+j]+=gain*sample*Math.exp(-t*(kind==='kick'?40:100));
    }
  }
  hit(.11,.9,'noise');
  for(let beat=0,at=firstBeat;at<duration;beat++,at=firstBeat+beat*period){
    hit(at,[.7,.3,.65,.3][beat%4],'kick');
    hit(at+period*.5,[.11,.18,.12,.22][beat%4],'noise');
    if(beat%4===3)hit(at+period*.75,.12,'noise');
  }
  return pcm;
}
const results=[];
for(const bpm of [115.54,121]){
  const result=analyzePCM([rhythm(bpm)],sampleRate,{analyzeKey:false});
  const period=60/bpm,phase=result.grid?.firstBeat;
  const residual=phase==null?Infinity:Math.abs((phase-firstBeat)/period-Math.round((phase-firstBeat)/period))*period;
  const row={expectedBpm:bpm,observedBpm:result.bpm,phaseErrorSeconds:phase==null?null:residual,confidence:result.tempo?.confidence,reason:result.tempo?.reason};
  results.push(row);
}
console.log(JSON.stringify({scope:'Constructed accented/syncopated PCM, not musical/native/hardware acceptance',results},null,2));
for(const row of results){
  assert(row.observedBpm!==null&&Math.abs(row.observedBpm-row.expectedBpm)<.2,`Recover ${row.expectedBpm} BPM without choosing half-time`);
  assert(row.phaseErrorSeconds!==null&&row.phaseErrorSeconds<.065,'Use repeated beat support rather than the unrelated first transient');
}
