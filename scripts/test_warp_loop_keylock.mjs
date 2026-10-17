import assert from 'node:assert/strict';
import {transformWarpedLoop} from '../prototype/keylock-dsp.js';
import {WarpLoopKernel} from '../prototype/warp-loop-kernel.js';
const sr=48000,sourceFrames=Math.round(3.6*sr),input=new Float32Array(sourceFrames);for(let i=0;i<input.length;i++)input[i]=.1*Math.sin(2*Math.PI*440*i/sr);
const plan={segments:[{input:0,output:0},{input:2,output:2}],frames:4*sr,keylock:true,semitones:3};
const [output]=await transformWarpedLoop([input],sr,plan);assert.equal(output.length,4*sr);assert(output.every(Number.isFinite));
function frequency(data,from,to){const crossings=[];let power=0;for(let i=Math.ceil(from*sr);i<Math.floor(to*sr);i++){power+=data[i]**2;if(i>0&&data[i-1]<0&&data[i]>=0)crossings.push((i-1-data[i-1]/(data[i]-data[i-1]))/sr);}return{hz:(crossings.length-1)/(crossings.at(-1)-crossings[0]),rms:Math.sqrt(power/((to-from)*sr))};}
const expected=440*2**(3/12),windows=[[.5,1.5],[2.5,3.5]].map(([a,b])=>frequency(output,a,b));for(const w of windows){assert(w.rms>.02);assert(Math.abs(w.hz-expected)<1,'Warped-loop pitch was not retained in both source-tempo sections');}
const kernel=new WarpLoopKernel(sr),track={grid:0,bpm:120,duration:3.6,gridWarpMarkers:[{time:2,bpm:150}]};kernel.load([{sampleRate:sr,channels:[output]}]);kernel.start({track,loop:{start:0,end:3.6},position:0,when:0,bpm:120,renderedLoop:true});
for(const at of [1,3,5,7]){const samples=[[new Float32Array(128)]];kernel.process(samples,at);assert(Math.abs(samples[0][0][0]-output[Math.round((at%4)*sr)])<1e-5,'Rendered cycle mapped with source seconds instead of musical beats');}
await assert.rejects(transformWarpedLoop([input],sr,{...plan,segments:[{input:0,output:0},{input:2,output:0}]}),/segments/);
console.log(JSON.stringify({passed:true,scope:'Actual offline Signalsmith DSP plus loop PCM kernel, not browser/native/hardware proof',expectedHz:expected,windows,checks:['periodic render finite and correct four-beat time per section','requested+3 semitone pitch retained at source120and150BPM','musical cycle mapping through repeated kernel wraps','invalid segment refusal']}));
