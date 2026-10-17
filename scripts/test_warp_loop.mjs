import assert from 'node:assert/strict';
import {createBeatgrid as currentGrid} from '../prototype/beatgrid.js';
import {WarpLoopKernel} from '../prototype/warp-loop-kernel.js';
const createBeatgrid=process.env.BEFORE_WARP_LOOP?(await import('/tmp/open-play-beatgrid-before94.mjs')).createBeatgrid:currentGrid;
const track={grid:.13,bpm:120,duration:30,gridWarpMarkers:[{time:2.13,bpm:150},{time:3.73,bpm:90}]},loop={start:.13,end:3.73},options={track,position:loop.start,when:1,bpm:120,loop};
const timeline=createBeatgrid(track).timeline(options);
assert(Math.abs(timeline.clock(5)-loop.start)<1e-9,'Musical loop did not wrap after eight shared beats');assert(Math.abs(timeline.clock(3.5)-2.53)<1e-9);assert(Math.abs(timeline.clock(101)-loop.start)<1e-9,'Repeated cycles drift');assert.equal(timeline.rateAt(3.5),.8);
const sr=48000,kernel=new WarpLoopKernel(sr),pcm=new Float32Array(sr*5);for(let i=0;i<pcm.length;i++)pcm[i]=i/pcm.length;
kernel.load([{sampleRate:sr,channels:[pcm,pcm]}]);kernel.start(options);
const output=()=>[[new Float32Array(128),new Float32Array(128)]];
const before=output();kernel.process(before,.9);assert(before[0][0].every(x=>x===0),'Premature start');
for(const time of [1,3.5,5,9,101]){const out=output();assert(kernel.process(out,time));const expected=currentGrid(track).timeline(options).clock(time)/5;assert(Math.abs(out[0][0][0]-expected)<1e-6,'Audio-thread PCM did not follow musical source clock');assert(out[0][0].every(Number.isFinite));}
assert.throws(()=>currentGrid(track).timeline({...options,loop:{start:4,end:2}}),/bounds/);
const inaudible={...track,gridWarpMarkers:[...track.gridWarpMarkers,{time:20,bpm:1}]};assert.doesNotThrow(()=>currentGrid(inaudible).timeline(options));assert.throws(()=>currentGrid(inaudible).timeline({...options,loop:null}),/rate range/);
kernel.alive=false;assert.equal(kernel.process(output(),1),false);
console.log(JSON.stringify({passed:true,scope:'Warped musical-loop clock and PCM kernel; no real worklet/native/hardware acceptance',checks:['eight-beat periodic clock and100-second no-drift projection','local tempo rates follow source sections','PCM sample positions before/across/repeated loop boundaries','silent future start and terminal dispose','loop bounds and audible-only rate validation']}));
