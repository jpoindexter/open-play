import test from 'node:test';
import assert from 'node:assert/strict';
import {paintSourceDetail,sourceWaveformState,sourceWaveformRasterUsage} from './source-waveform.js';
class Canvas{
 constructor(width,height){this.width=width;this.height=height;let scale=1;this.context={save(){},restore(){},beginPath(){},rect(){},clip(){},setTransform:a=>scale=a,getTransform:()=>({a:scale}),fillRect(){}};}
 getContext(){return this.context;}
}
function context(){return {save(){},restore(){},beginPath(){},rect(){},clip(){},getTransform:()=>({a:2}),fillRect(){},images:[],drawImage(...args){this.images.push(args);}};}
test('a moving detail view reuses immutable source pixels rather than rescanning every column',async()=>{
 const prior=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=Canvas;
 try{
  const data=Float32Array.from({length:12000},(_,i)=>.4*Math.sin(i*.5)),buffer={length:data.length,sampleRate:1000,numberOfChannels:1,getChannelData:()=>data};
  const profile=await sourceWaveformState(buffer).ready,interval=profile.interval;let reads=0;profile.interval=(...args)=>{reads++;return interval(...args);};
  const c=context(),options={width:256,height:64,position:3,span:4,vertical:false};paintSourceDetail(c,buffer,options);const first=reads;
  paintSourceDetail(c,buffer,{...options,position:3.0001});
  assert(reads-first<=64,'a small movement should prepare at most one64-pixel tile');assert(first>=512,'retain two physical columns per CSS pixel');
  assert(c.images.length>0,'paint source pixels from a raster');
  const before=reads;paintSourceDetail(c,buffer,{...options,position:3.0002});assert.equal(reads,before,'unchanged source tiles need no new profile reads');
  paintSourceDetail(c,buffer,{...options,position:8});assert(reads>before,'a seek needs the new source region');
  const shifted=c.images.at(-1);assert(shifted.slice(1).every(Number.isFinite),'raster placement stays finite');
 }finally{if(prior)globalThis.OffscreenCanvas=prior;else delete globalThis.OffscreenCanvas;}
});
test('raster ownership stays bounded across geometry changes and evicted pixels can be rebuilt',async()=>{
 const prior=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=Canvas;
 try{
  const data=new Float32Array(5000).fill(.1),buffer={length:data.length,sampleRate:1000,numberOfChannels:1,getChannelData:()=>data};
  const profile=await sourceWaveformState(buffer).ready,interval=profile.interval;let reads=0;profile.interval=(...args)=>{reads++;return interval(...args);};
  const c=context(),options={width:600,height:1000,position:2,span:4,vertical:false};
  for(let i=0;i<10;i++){paintSourceDetail(c,buffer,{...options,height:1000+i});const usage=sourceWaveformRasterUsage();assert(usage.bytes>0&&usage.bytes<=usage.maxBytes);}
  const before=reads;paintSourceDetail(c,buffer,options);assert(reads>before,'old geometry is evicted and can be reconstructed');
 }finally{if(prior)globalThis.OffscreenCanvas=prior;else delete globalThis.OffscreenCanvas;}
});
