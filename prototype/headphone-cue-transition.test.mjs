import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {createAudioMonitor} from './audio-monitor.js';

test('headphone Cue and trim share continuous ramps without delaying emergency mute',()=>{
  const node=()=>({gain:{value:1,events:[],cancelScheduledValues(){},setValueAtTime(v,t){this.events.push(['hold',v,t]);},linearRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);},setTargetAtTime(){}},outputs:[],connect(n){this.outputs.push(n);},disconnect(){}});
  const ctx={currentTime:0,createGain:node,createChannelMerger:node,createChannelSplitter:node,destination:{channelCount:2}},taps=Array.from({length:4},node);
  const monitor=createAudioMonitor(ctx,{master:node(),deckTaps:taps});
  const engine=new AudioEngine();Object.assign(engine,{ctx,audioMonitor:monitor,nodes:taps.map(()=>({trim:1,level:.8,gain:node()}))});
  const gain=taps[0].outputs[0].gain,last=()=>gain.events.slice(-2),near=(x,y)=>assert(Math.abs(x-y)<1e-12,`${x} != ${y}`);
  engine.setPFL(0,false);ctx.currentTime=.1;engine.setPFL(0,true);
  assert.deepEqual(last(),[['hold',0,.1],['ramp',1,.11]]);
  ctx.currentTime=.104;engine.setPFL(0,false);near(last()[0][1],.4);near(last()[1][2],.114);
  const count=gain.events.length;ctx.currentTime=.106;engine.setCross(0);
  assert.equal(gain.events.length,count,'Unchanged crossfader refresh must not extend the PFL deadline');
  ctx.currentTime=.116;engine.nodes[0].trim=.5;engine.setPFL(0,true);
  assert.deepEqual(last().map(x=>x.slice(0,2)),[['hold',0],['ramp',.5]]);
  ctx.currentTime=.12;engine.nodes[0].trim=1;engine.setCross(0);
  near(last()[0][1],.2);assert.equal(last()[1][1],1);near(last()[1][2],.13);
  monitor.mutePhysical(true);
  assert.deepEqual(monitor.physicalOutput.gain.events.at(-1),['hold',0,.12]);
  assert.equal(monitor.snapshot().physicalMuted,true);monitor.dispose();
});
