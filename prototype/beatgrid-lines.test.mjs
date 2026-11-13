import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';

test('accepted extreme grid offsets cannot stall four-deck detail rendering',async()=>{
 const moduleURL=name=>JSON.stringify(new URL(name,import.meta.url).href);
 const worker=new Worker(`
  const {parentPort}=require('node:worker_threads');
  (async()=>{
   const {validateMetadata}=await import(${moduleURL('./library-state.js')});
   const {createBeatgrid}=await import(${moduleURL('./beatgrid.js')});
   const {paintDetailWaveforms}=await import(${moduleURL('./detail-waveform.js')});
   const cases=[];
   for(const offset of [1e18,-1e18]){
    const track={duration:1000,cues:[],...validateMetadata({bpm:120,grid:offset})};
    parentPort.postMessage({type:'entered',offset,beat:createBeatgrid(track).beatAt(0)});
    const before=JSON.stringify(track);const lines=createBeatgrid(track).lines(-2,2);
    for(const horizontal of [true,false]){
     const labels=[],clips=[];let rectangles=0;
     const context={save(){},restore(){},beginPath(){},clip(){},clearRect(){},rect(...r){clips.push(r);},fillRect(){rectangles++;},fillText(text){labels.push(text);}};
     const decks=Array.from({length:4},(_,index)=>({index,rate:1,position:2,track:index===0?track:{bpm:120,grid:0,duration:1000,cues:[]}}));
     paintDetailWaveforms(context,{width:800,height:200,horizontal,decks,span:4,position:d=>d.position,buffer:()=>null,view:()=>({kind:'original'}),colors:['red','blue','green','orange']});
     cases.push({offset,horizontal,lines:lines.length,clips:clips.length,rectangles,validLane:labels.includes('B · 2.1'),unchanged:JSON.stringify(track)===before});
    }
   }
   parentPort.postMessage({type:'result',cases});
  })().catch(error=>parentPort.postMessage({type:'error',message:error.message}));
 `,{eval:true,resourceLimits:{maxOldGenerationSizeMb:64}});
 let timer;
 try{
  const cases=await new Promise((resolve,reject)=>{
   worker.on('error',reject);
   worker.on('message',message=>{
    if(message.type==='entered'){clearTimeout(timer);timer=setTimeout(()=>reject(Error('Beat-line rendering did not finish for accepted grid '+message.offset)),200);}
    else if(message.type==='error')reject(Error(message.message));
    else if(message.type==='result')resolve(message.cases);
   });
  });
  assert.equal(cases.length,4);
  for(const result of cases){assert.equal(result.lines,0);assert.equal(result.clips,4);assert(result.rectangles>0);assert(result.validLane);assert(result.unchanged);}
 }finally{clearTimeout(timer);await worker.terminate();}
});
