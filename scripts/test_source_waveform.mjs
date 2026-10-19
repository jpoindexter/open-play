import assert from 'node:assert/strict';
import {createSourceWaveformProfile,sourceWaveformState,paintSourceOverview} from '../prototype/source-waveform.js';
import {paintOriginalOverview} from '../prototype/stem-waveform.js';

const left=new Float32Array(1024);left[23]=1;
const right=Float32Array.from(left,x=>-x);
const buffer={length:left.length,sampleRate:48000,numberOfChannels:2,getChannelData:c=>[left,right][c]};
const originalLeft=left.slice(),originalRight=right.slice();
let legacyHeight=0,yields=0;
paintOriginalOverview({fillRect:(x,y,w,h)=>legacyHeight=Math.max(legacyHeight,h)},buffer,{width:1,height:100});
const profile=await createSourceWaveformProfile(buffer,{blockFrames:32,chunkFrames:128,yieldTask:async()=>{yields++;}});
assert.equal(legacyHeight,0,'Baseline sampled overview misses an actual transient between sample strides');
assert.equal(profile.maximum,1);
assert.equal(profile.interval(0,buffer.length/buffer.sampleRate).peak,1,'Retain the actual transient across opposite-polarity stereo');
assert.equal(profile.interval(.01,.02).peak,0,'Do not spread a transient into unrelated source time');
assert.equal(profile.interval(-1,0).peak,0);
assert.equal(profile.interval(1,2).peak,0);
assert(profile.interval(0,.002).bands.every(Number.isFinite));
assert(yields>0,'Longer profile work yields instead of blocking a whole track render');
assert.deepEqual(left,originalLeft);assert.deepEqual(right,originalRight);
const bad={...buffer,getChannelData:()=>Float32Array.from(left,(x,i)=>i===20?NaN:x)};
await assert.rejects(()=>createSourceWaveformProfile(bad),/Non-finite/);
console.log(JSON.stringify({scope:'Decoded-source profile and transient preservation; no sonic or visual-parity acceptance',legacyTransientVisible:false,newTransientPeak:profile.maximum,stereoCancellationAvoided:true,sourceUnchanged:true,yielded:true,invalidPCMRejected:true}));

// A color name in a token is insufficient: exercise the actual renderer with
// spectral content changing halfway through one track.
const tone=Float32Array.from({length:96000},(_,i)=>.5*Math.sin(2*Math.PI*(i<48000?100:8000)*i/48000));
const spectrumBuffer={length:tone.length,sampleRate:48000,numberOfChannels:1,getChannelData:()=>tone};
await sourceWaveformState(spectrumBuffer).ready;
const marks=[],context={save(){},restore(){},getTransform:()=>({a:1}),fillRect(x,y,w,h){marks.push({x,color:this.fillStyle});}};
paintSourceOverview(context,spectrumBuffer,{width:100,height:40});
const rgb=mark=>mark.color.match(/\d+/g).map(Number);
const bass=marks.filter(m=>m.x>10&&m.x<40),treble=marks.filter(m=>m.x>60&&m.x<90);
assert(bass.every(m=>{const c=rgb(m);return c[0]>c[1]*3&&c[0]>c[2]*3;}),'Actual bass region renders red');
assert(treble.every(m=>{const c=rgb(m);return c[2]>c[0]*3&&c[2]>c[1]*3;}),'Actual treble region renders blue');
const mid=Float32Array.from({length:48000},(_,i)=>.5*Math.sin(2*Math.PI*1000*i/48000));
const midBuffer={length:mid.length,sampleRate:48000,numberOfChannels:1,getChannelData:()=>mid};
await sourceWaveformState(midBuffer).ready;marks.length=0;paintSourceOverview(context,midBuffer,{width:100,height:40});
assert(marks.filter(m=>m.x>25&&m.x<75).every(m=>{const c=rgb(m);return c[1]>c[0]*3&&c[1]>c[2]*3;}),'Actual midrange region renders green');
console.log(JSON.stringify({actualRenderBassRed:true,actualRenderMidGreen:true,actualRenderTrebleBlue:true,sameTrackFrequencyColorChanges:true,scope:'Spectral encoding regression, not exact Serato rendering or user acceptance'}));
