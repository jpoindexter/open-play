// GUI pitch follows actual tempo; physical MIDI pickup owns its own coordinates.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const percent=deck=>(deck.rate-1)*100;
export function createTempoSlider({setRate}){
 const records=new WeakMap();
 function read(deck){
  const actual=percent(deck),selectedRange=deck.pitchRange||8;
  let record=records.get(deck);
  if(!record||record.track!==deck.track){
   record={track:deck.track,selectedRange,range:selectedRange,position:actual,pending:null,wanted:null};records.set(deck,record);
  }
  if(!record.pending)record.position=actual;
  if(record.selectedRange!==selectedRange){record.selectedRange=selectedRange;record.range=selectedRange;}
  const needed=Math.max(Math.abs(actual),Math.abs(record.position));
  // Keep expanded bounds stable through gestures; 300% covers the engine's 4× limit.
  record.range=Math.max(record.range,[8,16,50].find(range=>range+1e-8>=needed)||300);
  return record;
 }
 function view(deck){const r=read(deck),actual=percent(deck),auto=r.range>r.selectedRange;
  return{position:r.position,range:r.range,selectedRange:r.selectedRange,
   label:`±${r.range}%${auto?' AUTO':''}`,
   valueText:`Pitch ${actual>=0?'+':''}${actual.toFixed(1)} percent`,
   title:`Tempo${auto?`; GUI display automatically extended to ±${r.range}%; selected range ±${r.selectedRange}%`:''}; enable key lock to preserve pitch. Control/Command-click or Control/Command+Home: reset pitch to zero.`,
   rangeTitle:`Change selected tempo range (±${r.selectedRange}%)${auto?`; GUI display automatically extended to ±${r.range}%`:''}`};
 }
 function request(deck,position,{reset=false}={}){
  if(!deck.track)return Promise.resolve();
  const r=read(deck),next=clamp(Number(position),-r.range,r.range);
  if(!Number.isFinite(next))return Promise.reject(Error('Choose a finite tempo adjustment.'));
  const target=clamp(reset?1:1+next/100,.25,4);
  r.position=reset?0:next;
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
      if(records.get(deck)===r&&deck.track===r.track&&!r.wanted)r.position=percent(deck);
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
