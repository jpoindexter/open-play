// Independently implemented manual-loop state and fine boundary adjustment.
import {createBeatgrid} from './beatgrid.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const actions=['in','out','toggle','reloop','previous','next','save'];
export function createManualLoops({state,engine,quantized=(_d,p)=>p,persist=()=>{},render=()=>{},notify=()=>{}}){
 const queues=new Map(),epochs=new Map();
 const valid=d=>d.track&&state.decks[d.index]===d;
 const hasLoop=d=>Number.isFinite(d.loopIn)&&Number.isFinite(d.loopOut)&&d.loopIn>=0&&d.loopOut-d.loopIn>=.001&&d.loopOut<=d.track.duration;
 function run(d,fn){const track=d.track,epoch=epochs.get(d.index)||0,previous=queues.get(d.index)||Promise.resolve();const next=previous.catch(()=>{}).then(()=>{if(valid(d)&&d.track===track&&(epochs.get(d.index)||0)===epoch)return fn();});queues.set(d.index,next);void next.finally(()=>{if(queues.get(d.index)===next)queues.delete(d.index);}).catch(()=>{});return next;}
 function cancelDeck(d){epochs.set(d.index,(epochs.get(d.index)||0)+1);d.loopEdit=null;}
 async function bounds(d,on,start,end){await engine.setLoop(d,on,start,end);const grid=createBeatgrid(d.track);d.loopLength=grid?grid.beatAt(end)-grid.beatAt(start):(end-start)*(d.track.bpm||120)/60;}
 function recall(d,slot){
  if(!Number.isInteger(slot)||slot<0||slot>7)throw Error('Unknown saved loop slot.');
  return run(d,async()=>{
   const saved=d.track.savedLoops[slot];
   if(!saved)throw Error('Save a loop to this slot first.');
   d.loopSlot=slot;d.loopEdit=null;
   await bounds(d,true,saved.start,saved.end);
   await engine.seek(d,saved.start);render();return true;
  });
 }
 function command(d,action){
  if(!actions.includes(action))throw Error('Unknown manual loop action.');
  if(!valid(d)){notify('Load a track first.');return Promise.resolve(false);}
  return run(d,async()=>{
   if(action==='in'||action==='out'){
    if(d.loop&&hasLoop(d)){d.loopEdit=d.loopEdit===action?null:action;notify(`Deck ${d.index+1} Loop ${action.toUpperCase()} ${d.loopEdit?'edit; turn jog to adjust':'set'}.`);render();return true;}
    const position=quantized(d,engine.position(d));d.loopEdit=null;
    if(action==='in'){d.loopIn=position;render();return true;}
    if(position<=d.loopIn)throw Error('Loop Out must be after Loop In.');
    await bounds(d,true,d.loopIn,position);render();return true;
   }
   d.loopEdit=null;
   if(action==='previous'||action==='next'){
    d.loopSlot=clamp((d.loopSlot||0)+(action==='next'?1:-1),0,7);
    const saved=d.track.savedLoops?.[d.loopSlot];
    if(saved)await bounds(d,!!d.loop,saved.start,saved.end);
    notify(`Deck ${d.index+1} Loop slot ${d.loopSlot+1}.`);render();return true;
   }
   if(!hasLoop(d))throw Error('Set a valid Loop In and Out first.');
   if(action==='save'){
    const slot=d.loopSlot||0,old=d.track.savedLoops[slot];
    d.track.savedLoops[slot]={...old,start:d.loopIn,end:d.loopOut,name:old?.name||`Loop ${slot+1}`};persist();notify(`Loop saved to slot ${slot+1}.`);render();return true;
   }
   if(action==='toggle'){await bounds(d,!d.loop,d.loopIn,d.loopOut);render();return true;}
   await bounds(d,true,d.loopIn,d.loopOut);await engine.seek(d,d.loopIn);render();return true;
  });
 }
 function move(d,ticks){
  if(!d.loopEdit||!Number.isFinite(ticks))return Promise.resolve(false);
  const field=d.loopEdit;
  return run(d,async()=>{
   if(d.loopEdit!==field||!hasLoop(d))return false;
   // Independent fine-adjust policy:1ms of original source time per MIDI tick.
   // This is not a measured vendor jog curve.
   const start=field==='in'?clamp(d.loopIn+ticks*.001,0,d.loopOut-.001):d.loopIn;
   const end=field==='out'?clamp(d.loopOut+ticks*.001,start+.001,d.track.duration):d.loopOut;
   await bounds(d,d.loop,start,end);render();return true;
  });
 }
 return{command,recall,press:(d,pad)=>command(d,actions[pad]),move,cancelDeck};
}
