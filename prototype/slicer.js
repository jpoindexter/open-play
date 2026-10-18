// Beat-domain Slicer. Pad owners retain the unmodified underlying source clock.
import {createBeatgrid} from './beatgrid.js';
export function createSlicer({engine,render=()=>{},notify=()=>{}}){
 const held=new Map(),active=new Map(),fixed=new Map();
 const prior=d=>({on:!!d.loop,start:d.loopIn,end:d.loopOut});
 function bounds(d){
  const grid=createBeatgrid(d.track);if(!grid)throw Error('Set a beatgrid before using Slicer.');
  const domain=d.slicerDomain||8;if(![2,4,8,16,32,64].includes(domain))throw Error('Choose a valid Slicer domain.');
  const saved=fixed.get(d.index),owner=active.get(d.index),position=owner&&owns(owner)?owner.clock(engine.ctx.currentTime):engine.position(d),startBeat=d.slicerLoop&&saved?.track===d.track&&saved.domain===domain?saved.startBeat:Math.floor(grid.beatAt(position)/domain)*domain;
  const start=Math.max(0,grid.timeAt(startBeat)),end=Math.min(d.track.duration,grid.timeAt(startBeat+domain));
  return{grid,domain,startBeat,start,end,length:end-start,sliceBeats:domain/8};
 }
 const owns=h=>active.get(h.d.index)===h&&h.d.track===h.track&&engine.startTokens.get(h.d.index)===h.token;
 function forget(h){if(active.get(h.d.index)!==h)return;active.delete(h.d.index);h.d.slice=null;for(const [key,value]of held)if(value===h)held.delete(key);}
 function restoreFields(h){Object.assign(h.d,{loop:h.prior.on,loopIn:h.prior.start,loopOut:h.prior.end});}
 function cancelDeck(d){const h=active.get(d.index);if(!h)return;const current=owns(h);forget(h);if(current)restoreFields(h);}
 async function transition(h,loop,positionAt,playing){
  const pending=engine.setLoop(h.d,loop.on,loop.start,loop.end,{positionAt,priorClock:engine.voiceClock(h.d,engine.voices.get(h.d.index)),playing});
  h.token=engine.startTokens.get(h.d.index);await pending;return owns(h);
 }
 function fail(h,error){if(owns(h)){restoreFields(h);engine.pause(h.d);forget(h);render();}if(error.name!=='AbortError')notify(error.message);return false;}
 const expired=(h,position)=>h.playing&&!h.prior.on&&(h.d.reverse?position<=0:position>=h.track.duration);
 async function finishBackground(h){
  // A prepared future output may cross the endpoint before the current clock
  // does. Keep the old owner until that boundary; Stop/Load can still cancel.
  while(owns(h)&&!expired(h,h.clock(engine.ctx.currentTime)))await new Promise(resolve=>setTimeout(resolve,10));
  if(!owns(h))return false;
  const d=h.d;restoreFields(h);engine.pause(d,{preserveStemExit:true});d.position=d.reverse?0:h.track.duration;forget(h);
  // Forget the hold before the existing callback can repeat or replace track.
  try{await engine.onEnd?.(d);return true;}
  catch(error){if(error.name!=='AbortError')notify(error.message);return false;}
  finally{render();}
 }
 async function press(key,d,index){
  if(!d.track||held.has(key))return false;
  let h;
  try{
   if(!Number.isInteger(index)||index<0||index>7)throw Error('Choose one of the eight Slicer pads.');
   engine.init();const b=bounds(d),quant=d.sliceQuant||1;if(![.125,.25,.5,1].includes(quant))throw Error('Choose a valid Slicer quantization.');
   const beat=b.startBeat+index*b.sliceBeats,start=Math.max(0,b.grid.timeAt(beat)),end=Math.min(d.track.duration,b.grid.timeAt(beat+b.sliceBeats*quant));
   if(start>=d.track.duration||end<=start)throw Error('This slice is beyond the end of the track.');
   const previous=active.get(d.index);
   h={d,track:d.track,prior:previous?.prior||prior(d),clock:previous?.clock||engine.voiceClock(d,engine.voices.get(d.index)),playing:previous?.playing??d.playing,token:engine.startTokens.get(d.index)};
   active.set(d.index,h);held.set(key,h);d.slice=index;
   const current=await transition(h,{on:true,start,end},()=>d.reverse?end:start,true);
   if(current)render();return current;
  }catch(error){if(h)return fail(h,error);notify(error.message);return false;}
 }
 async function release(key){
  const h=held.get(key);if(!h)return false;held.delete(key);
  if(!owns(h)){if(active.get(h.d.index)===h)forget(h);return false;}
  let ending;
  try{
   if(expired(h,h.clock(engine.ctx.currentTime)))return finishBackground(h);
   const positionAt=at=>{const position=h.clock(at);if(expired(h,position))throw Object.assign(Error('Slicer background reached its endpoint.'),{name:'SlicerEndedError'});return position;};
   const pending=transition(h,h.prior,positionAt,h.playing);
   // Slow preparation must not keep the temporary slice playing past the
   // backing endpoint. Successful handoff/Stop/Load invalidates this watcher.
   if(h.playing&&!h.prior.on)ending=finishBackground(h);
   const current=await pending;
   if(current){forget(h);render();return true;}return ending?await ending:false;
  }catch(error){
   if(error.name==='SlicerEndedError')return ending||finishBackground(h);
   if(error.name==='AbortError'&&ending)return ending;
   return fail(h,error);
  }
 }
 async function domainLoop(d,on){
  if(!d.track)return false;
  cancelDeck(d);
  try{
   const b=bounds(d);if(on)fixed.set(d.index,{track:d.track,domain:b.domain,startBeat:b.startBeat});else fixed.delete(d.index);
   d.slicerLoop=on;await engine.setLoop(d,on,b.start,b.end);render();return true;
  }catch(error){d.slicerLoop=false;fixed.delete(d.index);notify(error.message);render();return false;}
 }
 return{press,release,releaseAll:()=>Promise.all([...held.keys()].map(release)),releaseDeck:d=>Promise.all([...held].filter(([,h])=>h.d===d).map(([key])=>release(key))),cancelDeck,domainLoop,bounds};
}
