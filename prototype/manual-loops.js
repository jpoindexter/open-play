// Independently implemented manual-loop state and fine boundary adjustment.
import {createBeatgrid} from './beatgrid.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const actions=['in','out','toggle','reloop','previous','next','save'];
export function createManualLoops({state,engine,quantized=(_d,p)=>p,persist=()=>{},render=()=>{},notify=()=>{}}){
 const queues=new Map(),epochs=new Map();
 const valid=d=>d.track&&state.decks[d.index]===d;
 const hasLoop=d=>Number.isFinite(d.loopIn)&&Number.isFinite(d.loopOut)&&d.loopIn>=0&&d.loopOut-d.loopIn>=.001&&d.loopOut<=d.track.duration;
 function run(d,fn){
  const track=d.track,epoch=epochs.get(d.index)||0,previous=queues.get(d.index)||Promise.resolve(),admitted=engine.startTokens.get(d.index);
  const owns=()=>valid(d)&&d.track===track&&(epochs.get(d.index)||0)===epoch;
  const next=previous.catch(()=>{}).then(async()=>{
   const token=engine.startTokens.get(d.index);
   // Only successful prior loop work may carry queued input across its own restart.
   if(!owns()||(token!==admitted&&token!==previous.loopToken))return false;
   const result=await fn(owns),after=engine.startTokens.get(d.index);
   if(owns()&&(result!==false||after===token))next.loopToken=after;return result;
  });
  queues.set(d.index,next);void next.finally(()=>{if(queues.get(d.index)===next)queues.delete(d.index);}).catch(()=>{});return next;
 }
 function cancelDeck(d){epochs.set(d.index,(epochs.get(d.index)||0)+1);d.loopEdit=null;}
 // Each owned loop/seek may restart transport; capture its token after invocation.
 async function settled(d,pending,owns){const token=engine.startTokens.get(d.index);await pending;return owns()&&engine.startTokens.get(d.index)===token;}
 async function bounds(d,on,start,end,owns){
  if(!await settled(d,engine.setLoop(d,on,start,end),owns))return false;
  const grid=createBeatgrid(d.track);d.loopLength=grid?grid.beatAt(end)-grid.beatAt(start):(end-start)*(d.track.bpm||120)/60;return true;
 }
 function recall(d,slot){
  if(!Number.isInteger(slot)||slot<0||slot>7)throw Error('Unknown saved loop slot.');
  return run(d,async owns=>{
   const saved=d.track.savedLoops[slot];
   if(!saved)throw Error('Save a loop to this slot first.');
   d.loopSlot=slot;d.loopEdit=null;
   if(!await bounds(d,true,saved.start,saved.end,owns))return false;
   if(!await settled(d,engine.seek(d,saved.start),owns))return false;render(d);return true;
  });
 }
 function command(d,action){
  if(!actions.includes(action))throw Error('Unknown manual loop action.');
  if(!valid(d)){notify('Load a track first.');return Promise.resolve(false);}
  return run(d,async owns=>{
   if(action==='in'||action==='out'){
    if(d.loop&&hasLoop(d)){d.loopEdit=d.loopEdit===action?null:action;notify(`Deck ${d.index+1} Loop ${action.toUpperCase()} ${d.loopEdit?'edit; turn jog to adjust':'set'}.`);render(d);return true;}
    const position=quantized(d,engine.position(d));d.loopEdit=null;
    if(action==='in'){d.loopIn=position;render(d);return true;}
    if(position<=d.loopIn)throw Error('Loop Out must be after Loop In.');
    if(!await bounds(d,true,d.loopIn,position,owns))return false;render(d);return true;
   }
   d.loopEdit=null;
   if(action==='previous'||action==='next'){
    d.loopSlot=clamp((d.loopSlot||0)+(action==='next'?1:-1),0,7);
    const saved=d.track.savedLoops?.[d.loopSlot];
    if(saved&&!await bounds(d,!!d.loop,saved.start,saved.end,owns))return false;
    notify(`Deck ${d.index+1} Loop slot ${d.loopSlot+1}.`);render(d);return true;
   }
   if(!hasLoop(d))throw Error('Set a valid Loop In and Out first.');
   if(action==='save'){
    const slot=d.loopSlot||0,old=d.track.savedLoops[slot];
    d.track.savedLoops[slot]={...old,start:d.loopIn,end:d.loopOut,name:old?.name||`Loop ${slot+1}`};persist();notify(`Loop saved to slot ${slot+1}.`);render(d);return true;
   }
   if(action==='toggle'){if(!await bounds(d,!d.loop,d.loopIn,d.loopOut,owns))return false;render(d);return true;}
   if(!await bounds(d,true,d.loopIn,d.loopOut,owns))return false;if(!await settled(d,engine.seek(d,d.loopIn),owns))return false;render(d);return true;
  });
 }
 function move(d,ticks){
  if(!d.loopEdit||!Number.isFinite(ticks))return Promise.resolve(false);
  const field=d.loopEdit;
  return run(d,async owns=>{
   if(d.loopEdit!==field||!hasLoop(d))return false;
   // Independent fine-adjust policy:1ms of original source time per MIDI tick.
   // This is not a measured vendor jog curve.
   const start=field==='in'?clamp(d.loopIn+ticks*.001,0,d.loopOut-.001):d.loopIn;
   const end=field==='out'?clamp(d.loopOut+ticks*.001,start+.001,d.track.duration):d.loopOut;
   if(!await bounds(d,d.loop,start,end,owns))return false;render(d);return true;
  });
 }
 return{command,recall,press:(d,pad)=>command(d,actions[pad]),move,cancelDeck};
}
