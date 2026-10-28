export function createSyncTempoRequests({engine,state,smartSync,slicer,participants}){
 let queue=null;
 return async(deck,rate)=>{
  if(!['Simple Sync','Smart Sync'].includes(state.settings['Sync Mode'])||!deck.sync)return slicer.changeRates([{deck,rate}],()=>engine.setRate(deck,rate,{syncInternal:true}));
  const waiters=queue?.wanted?.waiters||[];
  const promise=new Promise((resolve,reject)=>waiters.push({resolve,reject}));
  const request={deck,track:deck.track,rate,waiters};
  if(queue){queue.wanted=request;return promise;}
  const current={wanted:request};queue=current;
  Promise.resolve().then(async()=>{
   try{
    while(current.wanted){
     const next=current.wanted;current.wanted=null;
     let priorTempo,tempoOwner;
     try{
      if(next.deck.track===next.track&&next.deck.sync){
       priorTempo=smartSync.captureTempo();const smart=state.settings['Sync Mode']==='Smart Sync';
       const bpm=smart?smartSync.tempo(next.deck,next.rate):next.track.bpm*next.rate;
       if(smart)tempoOwner=smartSync.captureTempoOwner();
       if(!Number.isFinite(bpm)||bpm<=0)throw Error('Set a valid BPM before changing synced tempo.');
       const changes=state.decks.filter(d=>d.sync&&d.track).map(d=>({deck:d,rate:bpm/d.track.bpm}));
       if(changes.some(x=>!Number.isFinite(x.rate)||x.rate<.25||x.rate>4))throw Error('Matched tempo is outside a synced deck transport range.');
       await slicer.changeRates(changes,()=>engine.setSyncedRates(changes,{participants:participants(bpm)}));
      }
      next.waiters.forEach(({resolve})=>resolve());
     }catch(error){
      if(tempoOwner)smartSync.restoreTempo(priorTempo,tempoOwner);
      next.waiters.forEach(({reject})=>reject(error));
     }
    }
   }finally{if(queue===current)queue=null;}
  });
  return promise;
 };
}
