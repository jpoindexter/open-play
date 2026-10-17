// Independently authored MIDI rim response; no vendor response-curve claim.
// Nominal deck tempo remains owned by the fader/Sync; only this voice bends.
export const jogBendPolicy=Object.freeze({windowMilliseconds:80,idleMilliseconds:150,perTick:.008,maximumFraction:.08});
export function createJogBend({engine,now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,onError=()=>{}}){
 const active=new Map();
 const owns=s=>s.deck.track===s.track&&s.deck.playing&&engine.voices.get(s.deck.index)===s.voice;
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
  clearTimer(s.timer);s.events=[];s.closing=true;s.desired=1;
  return pump(s);
 }
 function tick(deck,delta,deviceId=''){
  if(!Number.isFinite(delta))return Promise.reject(new RangeError('Jog ticks must be finite.'));
  if(!delta||!deck.track||!deck.playing)return Promise.resolve(false);
  const voice=engine.voices.get(deck.index);if(!voice)return Promise.resolve(false);
  let s=active.get(deck.index);
  if(s&&!owns(s)){forget(s);s=null;}
  if(s&&s.deviceId!==deviceId)return Promise.reject(Error('Another MIDI input currently owns this deck’s jog bend.'));
  if(!s){s={deck,track:deck.track,voice,deviceId,events:[],desired:null,pumping:null,closing:false,timer:null};active.set(deck.index,s);}
  const at=now();s.closing=false;
  s.events=s.events.filter(event=>at-event.at<=jogBendPolicy.windowMilliseconds).slice(-63);
  s.events.push({at,delta});
  const sum=s.events.reduce((n,event)=>n+event.delta,0);
  const fraction=Math.max(-jogBendPolicy.maximumFraction,Math.min(jogBendPolicy.maximumFraction,sum*jogBendPolicy.perTick));
  s.desired=1+fraction;clearTimer(s.timer);
  s.timer=setTimer(()=>{void release(s).catch(onError);},jogBendPolicy.idleMilliseconds);
  return pump(s);
 }
 function resetInput(deviceId){
  return Promise.all([...active.values()].filter(s=>deviceId===undefined||s.deviceId===deviceId).map(release));
 }
 return{tick,resetInput,resetDeck:index=>Promise.all([...active.values()].filter(s=>s.deck.index===index).map(release)),diagnostics:()=>[...active.values()].map(s=>({deck:s.deck.index,closing:s.closing,queued:s.desired,deviceId:s.deviceId}))};
}
