// Independent MIDI-to-existing-scratch adapter. 248 ticks/revolution is sourced
// from an authored MK2 community mapping; physical calibration is not verified.
export const midiJogTouchPolicy=Object.freeze({ticksPerRevolution:248,firstIntervalMilliseconds:20,idleMinimumMilliseconds:20,idleMaximumMilliseconds:100,maxVelocity:16});
const inputKey=m=>JSON.stringify([m.deviceId||'',m.type,m.channel,m.number]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let instance=0;
export function createMIDIJogTouch({engine,state,beforeBegin=async()=>{},now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,onError=()=>{}}){
 const id=++instance,active=new Map(),pressed=new Map();let serial=0;
 const current=s=>active.get(s.deck.index)===s&&!s.closed&&s.deck.track===s.track;
 function retire(s){clearTimer(s.timer);s.closed=true;if(active.get(s.deck.index)===s)active.delete(s.deck.index);}
 async function finish(s,{cancel=false}={}){
  if(s.closing)return s.closing;
  retire(s);
  s.closing=(async()=>{
   if(s.kind==='bend')return;
   try{await s.pumping;}catch{}
   // The final observed physical angle wins over velocity extrapolation. The
   // engine still checks track/request ownership before accepting this update.
   try{if(s.ready&&s.deck.track===s.track)await engine.updateDeckScratch(s.deck,{position:s.position,velocity:0},s.owner);}
   finally{await engine.endDeckScratch(s.deck,s.owner,{cancel});}
  })();
  return s.closing;
 }
 function fail(s,error){
  void finish(s,{cancel:true}).catch(onError);
  if(error?.name!=='AbortError')try{onError(error);}catch{}
 }
 function pump(s){
  if(!s.ready||!current(s))return Promise.resolve();
  if(s.pumping)return s.pumping;
  s.pumping=(async()=>{
   while(current(s)&&s.sent<s.revision){
    const movement=s.desired;s.sent=s.revision;
    const accepted=await engine.updateDeckScratch(s.deck,movement,s.owner);
    if(accepted===false){retire(s);return;}
   }
  })().catch(error=>{fail(s,error);}).finally(()=>{s.pumping=null;});
  return s.pumping;
 }
 function desired(s,velocity){s.desired={position:s.position,velocity};s.revision++;return pump(s);}
 async function press(deck,message,{fast=false,vinyl=true}={}){
  const key=inputKey(message);if(pressed.has(key)||!deck.track)return false;
  if(active.has(deck.index))throw Error('This deck already has a MIDI jog touch owner.');
  const position=engine.position(deck);if(!Number.isFinite(position))throw Error('Jog touch needs a finite source position.');
  const s={key,deck,track:deck.track,deviceId:message.deviceId||'',owner:`midi-jog-touch:${id}:${++serial}`,kind:fast||vinyl||!deck.playing?'scratch':'bend',position,
   secondsPerTick:60/(state.settings?.['Virtual Deck Speed']==='33 RPM'?33:45)/midiJogTouchPolicy.ticksPerRevolution*(fast?4:1),lastMove:null,revision:0,sent:-1,desired:{position,velocity:0},ready:false,pumping:null,closed:false,closing:null,timer:null};
  active.set(deck.index,s);pressed.set(key,s);
  if(s.kind==='bend')return true;
  try{
   await beforeBegin(deck);if(!current(s))return false;
   const accepted=await engine.beginDeckScratch(deck,s.owner);
   if(!current(s)){await engine.endDeckScratch(deck,s.owner,{cancel:true});return false;}
   if(accepted===false||accepted===null){retire(s);return false;}
   s.ready=true;await pump(s);return true;
  }catch(error){fail(s,error);return false;}
 }
 async function move(deck,delta,deviceId=''){
  const s=active.get(deck.index);
  // A transport command may retire a gesture before its physical Note Off.
  // Suppress its surface packets until release, rather than bending new audio.
  if(!s)return [...pressed.values()].some(x=>x.deck.index===deck.index&&x.deviceId===deviceId&&x.kind==='scratch');
  if(s.deviceId!==deviceId)return true;
  if(s.kind==='bend')return false;
  if(!current(s)){retire(s);return true;}
  if(!Number.isFinite(delta))throw new RangeError('Jog motion must be finite.');
  if(!delta)return true;
  const at=now(),interval=s.lastMove===null?midiJogTouchPolicy.firstIntervalMilliseconds:Math.max(1,at-s.lastMove);
  if(!Number.isFinite(at)||(s.lastMove!==null&&at<s.lastMove))throw Error('Jog clock is invalid.');
  const previous=s.position;s.position=clamp(s.position+delta*s.secondsPerTick,0,s.track.duration);
  const velocity=clamp((s.position-previous)/(interval/1000),-midiJogTouchPolicy.maxVelocity,midiJogTouchPolicy.maxVelocity);s.lastMove=at;
  clearTimer(s.timer);
  const idle=clamp(interval*2,midiJogTouchPolicy.idleMinimumMilliseconds,midiJogTouchPolicy.idleMaximumMilliseconds);
  s.timer=setTimer(()=>{if(current(s))void desired(s,0).catch(onError);},idle);
  await desired(s,velocity);return true;
 }
 function releaseMessage(message){
  if(message.pressed)return false;
  const key=inputKey(message),s=pressed.get(key);if(!s)return false;
  pressed.delete(key);void finish(s).catch(onError);return true;
 }
 function resetInput(deviceId){
  const held=[...pressed.entries()].filter(([,s])=>deviceId===undefined||s.deviceId===deviceId);
  for(const [key]of held)pressed.delete(key);
  return Promise.all(held.map(([,s])=>finish(s,{cancel:true})));
 }
 return{press,move,releaseMessage,resetInput,resetDeck:index=>{const held=[...pressed.entries()].filter(([,s])=>s.deck.index===index);for(const [key]of held)pressed.delete(key);return Promise.all(held.map(([,s])=>finish(s,{cancel:true})));},diagnostics:()=>[...active.values()].map(s=>({deck:s.deck.index,kind:s.kind,ready:s.ready,position:s.position,closed:s.closed}))};
}
