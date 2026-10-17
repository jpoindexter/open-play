// Independently implemented Auto Loop / momentary Roll controls. Address bytes
// belong to the MIDI preset; behavior is shared by manually assigned inputs.
import {createBeatgrid} from './beatgrid.js';
import {advanceDeckScratchPosition} from './deck-scratch-kernel.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createLoopPads({state,engine,render=()=>{},notify=()=>{}}){
 const rolls=new Map(),queues=new Map(),epochs=new Map(),holds=new Map();
 const run=(d,fn)=>{const previous=queues.get(d.index)||Promise.resolve();const next=previous.catch(()=>{}).then(fn);queues.set(d.index,next);void next.finally(()=>{if(queues.get(d.index)===next)queues.delete(d.index);}).catch(()=>{});return next;};
 const valid=(d,track)=>d.track===track&&state.decks[d.index]===d;
 function bounds(d,beats,position){
  const grid=createBeatgrid(d.track),start=grid?grid.timeAt(Math.round(grid.beatAt(position))):position;
  const end=grid?grid.timeAt(grid.beatAt(start)+beats):start+60/d.track.bpm*beats;
  if(start<0||end>d.track.duration||end-start<.001)throw Error('The selected loop extends outside the track.');
  return{start,end};
 }
 function cancelDeck(d){for(const [key,h] of holds)if(h.deck===d)holds.delete(key);rolls.delete(d.index);epochs.set(d.index,(epochs.get(d.index)||0)+1);}
 const base=d=>clamp(d.loopPadBase||.125,1/32,state.settings['Show Beat Jump Controls']?16:1);
 function press(d,mode,pad,{length=null,ignoreBeatJump=false}={}){
  if(!['auto','roll'].includes(mode)||!Number.isInteger(pad)||pad<0||pad>7)throw Error('Unknown loop pad.');
  if(!d.track||!Number.isFinite(d.track.bpm)||d.track.bpm<=0)throw Error('Analyze a BPM/beatgrid before using loop pads.');
  const track=d.track,epoch=epochs.get(d.index)||0,owns=()=>valid(d,track)&&(epochs.get(d.index)||0)===epoch,beatJump=!ignoreBeatJump&&!!state.settings['Show Beat Jump Controls']&&pad>=4;
  // Capture mode/length when pressed; changing settings while held cannot
  // reinterpret its Note Off as another action.
  const beats=clamp(length??base(d)*2**pad,1/32,128);
  const held={released:false,beats};let release=null;
  if(mode==='roll'&&!beatJump)release=()=>{held.released=true;return run(d,async()=>{
   if(rolls.get(d.index)!==held)return;
   rolls.delete(d.index);
   if(!owns()||engine.startTokens.get(d.index)!==held.token)return;
   const position=held.clock(engine.ctx.currentTime);
   await engine.setLoop(d,held.prior.on,held.prior.start,held.prior.end);
   if(!owns())return;
   await engine.seek(d,position);render();
  });};
  const pending=run(d,async()=>{
   if(!owns()||(release&&held.released))return;
   if(beatJump){
    const jump=d.beatJumpLength||4;
    if(pad===5||pad===6){d.beatJumpLength=clamp(jump*(pad===5?.5:2),1/32,128);notify(`Deck ${d.index+1} Beat Jump ${d.beatJumpLength} beats.`);render();return;}
    if(rolls.has(d.index))throw Error('Release Loop Roll before jumping.');
    const grid=createBeatgrid(track),position=engine.position(d),delta=jump*(pad===4?-1:1);
    if(d.loop){
     // Beat Jump moves the playing loop as well as the playhead.
     const shift=p=>grid?grid.timeAt(grid.beatAt(p)+delta):p+60/track.bpm*delta;
     const start=shift(d.loopIn),end=shift(d.loopOut);
     if(start<0||end>track.duration)throw Error('Beat Jump would move the loop outside the track.');
     await engine.setLoop(d,true,start,end);if(!owns())return;await engine.seek(d,shift(position));
    }else await engine.seek(d,grid?grid.timeAt(grid.beatAt(position)+delta):position+60/track.bpm*delta);
    render();return;
   }
   if(mode==='auto'){
    if(rolls.has(d.index))throw Error('Release Loop Roll before changing Auto Loop.');
    const ending=d.loop&&d.autoLoopBeats===beats;
    const span=ending?{start:d.loopIn,end:d.loopOut}:bounds(d,beats,d.loop?d.loopIn:engine.position(d));
    await engine.setLoop(d,!ending,span.start,span.end);if(!owns())return;
    d.autoLoopBeats=ending?null:beats;d.loopLength=beats;notify(`Deck ${d.index+1} Auto Loop ${beats} beats ${ending?'off':'on'}.`);render();return;
   }
   // Last pressed roll wins; older releases cannot terminate its owner. Keep
   // the initial unrolled clock across overlapping pads.
   const old=rolls.get(d.index),position=engine.position(d),time=engine.ctx.currentTime;
   held.prior=old?.prior||{on:!!d.loop,start:d.loopIn,end:d.loopOut};
   const priorLoop=held.prior.on?{start:held.prior.start,end:held.prior.end}:null;
   const rate=engine.audibleRate(d)*(d.reverse?-1:1),playing=d.playing;
   const timeline=engine.voices.get(d.index)?.gridTimeline;
   held.clock=old?.clock||(timeline?timeline.clock:at=>playing?advanceDeckScratchPosition(position,(at-time)*rate,track.duration,priorLoop):position);
   rolls.set(d.index,held);
   try{const span=bounds(d,beats,position);await engine.setLoop(d,true,span.start,span.end);held.token=engine.startTokens.get(d.index);if(owns())render();}
   catch(error){if(rolls.get(d.index)===held)rolls.delete(d.index);throw error;}
  });
  return{pending,release};
 }
 function describe(d){
  const jump=!!state.settings['Show Beat Jump Controls'],first=base(d);
  return Array.from({length:8},(_,i)=>jump&&i>=4
   ?{label:['Jump back','Half jump','Double jump','Jump forward'][i-4],detail:`${d.beatJumpLength||4} beats`,jump:true,active:false}
   :{label:`${clamp(first*2**i,1/32,128)} beats`,detail:'Loop length',jump:false,active:!!d.loop&&d.autoLoopBeats===clamp(first*2**i,1/32,128)});
 }
 function range(d,direction){
  const count=state.settings['Show Beat Jump Controls']?4:8;
  d.loopPadBase=clamp(base(d)*2**(direction<0?-1:1),1/32,128/2**(count-1));
  render();
 }
 function hold(key,d,pad,options={}){
  if(holds.has(key))return holds.get(key).pending;
  const operation=press(d,'roll',pad,options);
  holds.set(key,{...operation,deck:d});return operation.pending;
 }
 function release(key){const held=holds.get(key);if(!held)return Promise.resolve();holds.delete(key);return held.release?.()||Promise.resolve();}
 function releaseAll(){return Promise.all([...holds.keys()].map(release));}
 return{press,cancelDeck,describe,range,hold,release,releaseAll,rolling:(d,pad=null)=>rolls.has(d.index)&&(pad===null||rolls.get(d.index).beats===clamp(base(d)*2**pad,1/32,128))};
}
