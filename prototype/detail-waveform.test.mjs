import test from 'node:test';
import assert from 'node:assert/strict';
import {paintDetailWaveforms} from './detail-waveform.js';
import {performanceColors as ink} from './performance-tokens.js';
const track=bpm=>({bpm,grid:0,duration:1000,cues:[],gridWarpMarkers:[]});
const pair=()=>[{index:0,rate:132/120,position:60,track:track(120)},{index:1,rate:132/125,position:96,track:track(125)}];
function render(decks,{horizontal=true,width=800,height=132,span=4}={}){
  const rects=[],texts=[],clips=[];
  const c={save(){},restore(){},beginPath(){},clip(){},clearRect(){},rect(...r){clips.push(r);},fillRect(...r){rects.push({rect:r,ink:this.fillStyle});},fillText(text,x,y){texts.push({text,x,y,font:this.font});}};
  paintDetailWaveforms(c,{width,height,horizontal,decks,span,position:d=>d.position,buffer:()=>null,view:()=>({kind:'original'}),colors:['#ec684a','#52b9e0','#7bd1a2','#91b8cf']});
  return {rects,texts,clips};
}
test('synced different-tempo grids share real beat positions without equal absolute bar labels',()=>{
  const decks=pair(),before=structuredClone(decks),r=render(decks);
  const ticks=r.rects.filter(r=>r.ink===ink.waveBeat&&r.rect[2]===1&&r.rect[3]===4);
  const nextA=ticks.find(r=>r.rect[0]>400&&r.rect[1]<66),nextB=ticks.find(r=>r.rect[0]>400&&r.rect[1]>=66);
  assert(Math.abs(nextA.rect[0]-nextB.rect[0])<1e-8);
  assert(r.texts.some(t=>t.text==='A · 31.1'));assert(r.texts.some(t=>t.text==='B · 51.1'));
  assert.equal(r.texts.filter(t=>t.text==='NOW').length,2);
  assert.deepEqual(decks,before,'drawing must not change audio/grid state');
});
test('an actual source phase offset remains visible instead of cosmetically snapping lanes',()=>{
  const decks=pair();decks[1].position+=.024;
  const r=render(decks),ticks=r.rects.filter(r=>r.ink===ink.waveBeat&&r.rect[2]===1&&r.rect[3]===4);
  const a=ticks.find(r=>r.rect[0]>400&&r.rect[1]<66),b=ticks.find(r=>r.rect[0]>400&&r.rect[1]>=66);
  assert(Math.abs(a.rect[0]-b.rect[0]-800*.024/(132/125)/4)<1e-8);
});
test('four compact vertical lanes retain distinct clipped rulers and the same NOW position',()=>{
  const decks=[...pair(),{index:2,rate:1,position:10,track:null},{index:3,rate:1,position:0,track:track(128)}];
  const r=render(decks,{horizontal:false,width:280,height:136});
  assert.deepEqual(r.clips,[[0,0,70,136],[70,0,70,136],[140,0,70,136],[210,0,70,136]]);
  assert.equal(r.rects.filter(r=>r.ink===ink.wavePlayhead&&r.rect[1]===67&&r.rect[2]===70&&r.rect[3]===2).length,4);
  assert(r.texts.some(t=>t.text==='C · —'));
  assert(r.texts.every(t=>/\b1[01]px/.test(t.font)));
});
test('ruler text and beat marks have measurable contrast without relying on frequency color',()=>{
  const luminance=hex=>{const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  assert(contrast(ink.waveText,ink.waveRuler)>=4.5);
  assert(contrast(ink.waveBeat,ink.waveRuler)>=3);
  assert(contrast(ink.wavePlayhead,ink.waveBackground)>=3);
});
