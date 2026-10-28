// GUI coordinates are not the deck's absolute pitch after Sync. Keep this
// browser-only control separate from physical MIDI pickup and audio processing.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const percent=deck=>(deck.rate-1)*100;
export function createTempoSlider({setRate}){
 const records=new WeakMap();
 function read(deck){
  const actual=percent(deck),range=deck.pitchRange||8;
  const relative=!!deck.sync||deck.syncState==='relative'||Math.abs(actual)>range+1e-8;
  let record=records.get(deck);
  if(!record||record.track!==deck.track){
   record={track:deck.track,relative,range,position:relative?0:actual,pending:null,wanted:null,target:deck.rate,observed:deck.rate};records.set(deck,record);
  }
  if(!record.pending){
   if(relative!==record.relative||range!==record.range){record.position=relative?0:actual;record.relative=relative;record.range=range;}
   else if(deck.rate!==record.observed&&!relative)record.position=actual;
   record.target=deck.rate;record.observed=deck.rate;
  }
  record.position=clamp(record.position,-range,range);
  return record;
 }
 function view(deck){const r=read(deck),actual=percent(deck);
  return{position:r.position,range:deck.pitchRange||8,relative:r.relative,
   label:`±${deck.pitchRange||8}%${r.relative?' · REL':''}`,
   valueText:`Pitch ${actual>=0?'+':''}${actual.toFixed(1)} percent${r.relative?`; relative adjustment ${r.position>=0?'+':''}${r.position.toFixed(1)} percent`:''}`};
 }
 function request(deck,position,{reset=false}={}){
  if(!deck.track)return Promise.resolve();
  const r=read(deck),next=clamp(Number(position),-r.range,r.range);
  if(!Number.isFinite(next))return Promise.reject(Error('Choose a finite tempo adjustment.'));
  // Pending gestures accumulate against the latest requested tempo, not stale
  // asynchronous audio state. External changes rebase read() when idle.
  const target=clamp(reset?1:r.relative?r.target+(next-r.position)/100:1+next/100,.25,4);
  r.position=reset?0:next;r.target=target;
  const waiters=r.wanted?.waiters||[];
  const promise=new Promise((resolve,reject)=>waiters.push({resolve,reject}));
  r.wanted={rate:target,waiters};
  if(r.pending)return promise;
  r.pending=Promise.resolve().then(async()=>{
   try{
    while(r.wanted){
     const wanted=r.wanted;r.wanted=null;
     try{
      if(records.get(deck)===r&&deck.track===r.track)await setRate(deck,wanted.rate);
      wanted.waiters.forEach(({resolve})=>resolve());
     }catch(error){
      if(records.get(deck)===r&&deck.track===r.track&&!r.relative&&!r.wanted)r.position=percent(deck);
      wanted.waiters.forEach(({reject})=>reject(error));
     }
    }
   }finally{r.pending=null;if(records.get(deck)===r)read(deck);}
  });
  return promise;
 }
 function cancel(deck){
  const r=records.get(deck);if(!r?.pending)return;
  const wanted=r.wanted;r.wanted=null;records.delete(deck);
  wanted?.waiters.forEach(({reject})=>reject(new DOMException('Tempo gesture superseded by a newer Sync choice.','AbortError')));
 }
 return{view,cancel,set:(deck,position)=>request(deck,position),reset:deck=>request(deck,0,{reset:true})};
}
