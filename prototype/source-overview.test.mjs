import test from 'node:test';
import assert from 'node:assert/strict';
import {paintSourceOverview,sourceWaveformState} from './source-waveform.js';

test('overview separates sustained energy from equal peaks without changing source samples',async()=>{
 const sampleRate=8000,data=new Float32Array(sampleRate*2);
 for(let i=0;i<data.length;i++)data[i]=(i<sampleRate?.05:.35)*Math.sin(i*.4);
 for(let i=0;i<data.length;i+=80)data[i]=.95;
 const original=data.slice(),buffer={length:data.length,sampleRate,numberOfChannels:1,getChannelData:()=>data};
 await sourceWaveformState(buffer).ready;
 const marks=[],ctx={save(){},restore(){},getTransform:()=>({a:1}),fillRect(x,y,w,h){marks.push({x,y,w,h,alpha:this.globalAlpha});}};
 paintSourceOverview(ctx,buffer,{width:100,height:44});
 const extent=(start,end)=>Math.max(...marks.filter(m=>m.x>=start&&m.x<end).map(m=>m.h));
 assert(extent(0,45)<extent(55,100)*.6,'equal isolated peaks must not flatten quiet and loud sections');
 assert(extent(55,100)<44*.6,'dense overviews retain headroom instead of filling the well');
 assert.deepEqual(data,original,'display does not change PCM');
});
