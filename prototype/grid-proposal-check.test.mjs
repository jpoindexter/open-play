import test from 'node:test';
import assert from 'node:assert/strict';
import {checkGridProposal} from './grid-proposal-check.js';
const rate=11025,duration=80,reference={bpm:120,firstBeat:0};
function pulses(offset){
  const pcm=new Float32Array(rate*duration);
  for(let beat=1;beat<159;beat++)for(let i=0;i<rate*.08;i++){
    const at=Math.round((beat*.5+offset)*rate)+i;
    pcm[at]=Math.sin(2*Math.PI*80*i/rate)*Math.exp(-i/(rate*.012));
  }
  return pcm;
}
const proposal=offset=>({bpm:120,firstBeat:offset,markers:[{time:40+offset,bpm:120}]});
test('independent same-onset check accepts an improved known offset',()=>{
  const r=checkGridProposal(pulses(.025),rate,reference,proposal(.025));
  assert.equal(r.status,'improved');assert.ok(r.afterMedianSeconds<.010);assert.ok(r.events>100);
});
test('a map that moves a steady grid away from its onsets is rejected',()=>{
  assert.equal(checkGridProposal(pulses(0),rate,reference,proposal(.025)).status,'worse');
});
test('silence cannot validate a proposed correction',()=>{
  assert.equal(checkGridProposal(new Float32Array(rate*duration),rate,reference,proposal(.025)).status,'insufficient');
});
