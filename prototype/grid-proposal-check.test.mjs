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
test('a later bass lobe does not replace the first strong attack when checking a correction',()=>{
  const pcm=pulses(0),later=pulses(.05);
  for(let i=0;i<pcm.length;i++)pcm[i]+=1.2*later[i];
  const lateGrid={bpm:120,firstBeat:.02};
  const corrected=proposal(0);
  const result=checkGridProposal(pcm,rate,lateGrid,corrected);
  assert.equal(result.status,'improved');
  assert(result.afterMedianSeconds<.01,'correction should follow the known first attack');
  assert.equal(checkGridProposal(pcm,rate,reference,proposal(.02)).status,'worse');
});
test('an earlier bass figure does not replace the closer beat attack',()=>{
  const pcm=pulses(.025),earlier=pulses(-.04);
  for(let i=0;i<pcm.length;i++)pcm[i]+=.8*earlier[i];
  const result=checkGridProposal(pcm,rate,reference,proposal(.025));
  assert.equal(result.status,'improved');
  assert(result.afterMedianSeconds<.01);
});
