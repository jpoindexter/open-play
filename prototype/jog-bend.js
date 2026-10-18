// Independently authored MIDI rim response; no vendor response-curve claim.
// Nominal deck tempo remains owned by the fader/Sync; only this voice bends.
export const jogBendPolicy=Object.freeze({windowMilliseconds:80,idleMilliseconds:150,perTick:.008,maximumFraction:.08,keyboardFraction:.04});
export function createJogBend({engine,now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,onError=()=>{}}){
 const active=new Map();
 const owns=s=>s.deck.track===s.track&&s.deck.playing&&engine.voices.get(s.deck.index)===s.voice;
 const factor=s=>1+Math.max(-jogBendPolicy.maximumFraction,Math.min(jogBendPolicy.maximumFraction,
  s.events.reduce((n,event)=>n+event.delta,0)*jogBendPolicy.perTick+[...s.holds.values()].reduce((n,value)=>n+value,0)));
 function acquire(deck){
  if(!deck.track||!deck.playing)return null;
  const voice=engine.voices.get(deck.index);if(!voice)return null;
  let s=active.get(deck.index);if(s&&!owns(s)){forget(s);s=null;}
  if(!s){s={deck,track:deck.track,voice,deviceId:null,events:[],holds:new Map(),desired:null,pumping:null,closing:false,timer:null};active.set(deck.index,s);}
  return s;
 }
 function forget(s){clearTimer(s.timer);if(active.get(s.deck.index)===s)active.delete(s.deck.index);}
 function pump(s){
  if(s.pumping)return s.pumping;
  s.pumping=Promise.resolve().then(async()=>{
   while(s.desired!==null){
    if(!owns(s)){forget(s);return;}
    const factor=s.desired;s.desired=null;
    const applied=await engine.setJogBend(s.deck,factor,{voice:s.voice});
    if(applied===false){forget(s);return;}
   }
   if(s.closing)forget(s);
  }).catch(async error=>{
   // A rejected change does not prove the previous bend stopped. Restore only
   // this still-current voice; never apply a late cleanup to replacement audio.
   try{if(owns(s))await engine.setJogBend(s.deck,1,{voice:s.voice});}
   catch(restoreError){try{onError(restoreError);}catch{}}
   finally{forget(s);}
   throw error;
  }).finally(()=>{s.pumping=null;});
  return s.pumping;
 }
 function release(s){
  clearTimer(s.timer);s.events=[];s.deviceId=null;s.closing=!s.holds.size;s.desired=factor(s);
  return pump(s);
 }
 function tick(deck,delta,deviceId=''){
  if(!Number.isFinite(delta))return Promise.reject(new RangeError('Jog ticks must be finite.'));
  if(!delta)return Promise.resolve(false);
  const s=acquire(deck);if(!s)return Promise.resolve(false);
  if(s.deviceId!==null&&s.deviceId!==deviceId)return Promise.reject(Error('Another MIDI input currently owns this deck’s jog bend.'));
  s.deviceId=deviceId;
  const at=now();s.closing=false;
  s.events=s.events.filter(event=>at-event.at<=jogBendPolicy.windowMilliseconds).slice(-63);
  s.events.push({at,delta});
  s.desired=factor(s);clearTimer(s.timer);
  s.timer=setTimer(()=>{void release(s).catch(onError);},jogBendPolicy.idleMilliseconds);
  return pump(s);
 }
 function resetInput(deviceId){
  return Promise.all([...active.values()].filter(s=>deviceId===undefined||s.deviceId===deviceId).map(release));
 }
 function hold(deck,owner,direction){
  if(typeof owner!=='string'||!owner||![-1,1].includes(direction))return Promise.reject(new TypeError('Keyboard bend needs an owner and direction -1 or 1.'));
  const s=acquire(deck);if(!s)return Promise.resolve(false);
  s.holds.set(owner,direction*jogBendPolicy.keyboardFraction);s.closing=false;s.desired=factor(s);return pump(s);
 }
 function releaseHold(owner){
  return Promise.all([...active.values()].filter(s=>s.holds.delete(owner)).map(s=>{s.closing=!s.holds.size&&!s.events.length;s.desired=factor(s);return pump(s);}));
 }
 function releaseHolds(){
  return Promise.all([...active.values()].filter(s=>s.holds.size).map(s=>{s.holds.clear();s.closing=!s.events.length;s.desired=factor(s);return pump(s);}));
 }
 return{tick,hold,releaseHold,releaseHolds,resetInput,resetDeck:index=>Promise.all([...active.values()].filter(s=>s.deck.index===index).map(s=>{s.holds.clear();return release(s);})),diagnostics:()=>[...active.values()].map(s=>({deck:s.deck.index,closing:s.closing,queued:s.desired,deviceId:s.deviceId,heldKeys:s.holds.size}))};
}
