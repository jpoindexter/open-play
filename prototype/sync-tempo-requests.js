export function createSyncTempoRequests({engine,state,smartSync,slicer,participants,master=()=>null,cancelGUI=()=>{}}){
 let queue=null;const loadOwners=new WeakMap();
 const involves=(request,deck)=>request?.members.some(member=>member.deck===deck);
 const cancelled=()=>new DOMException('Tempo input superseded by track load.','AbortError');
 const setRate=async(deck,rate)=>{
  if(!['Simple Sync','Smart Sync'].includes(state.settings['Sync Mode'])||!deck.sync)return slicer.changeRates([{deck,rate}],()=>engine.setRate(deck,rate,{syncInternal:true}));
  const waiters=queue?.wanted?.waiters||[];
  const promise=new Promise((resolve,reject)=>waiters.push({resolve,reject}));
  const mode=state.settings['Sync Mode'],leader=master();
  const members=state.decks.filter(d=>d.sync&&d.track).map(deck=>({deck,track:deck.track,owner:loadOwners.get(deck)}));
  const request={deck,track:deck.track,rate,waiters,mode,leader,leaderTrack:leader?.track,tempoOwner:mode==='Smart Sync'?smartSync.captureTempoOwner():null,members};
  if(queue){queue.wanted=request;return promise;}
  const current={wanted:request};queue=current;
  const advanceOwner=owner=>{if(current.wanted?.tempoOwner===owner)current.wanted.tempoOwner=smartSync.captureTempoOwner();};
  Promise.resolve().then(async()=>{
   try{
    while(current.wanted){
     const next=current.wanted;current.wanted=null;
     let settled;const active={request:next,done:new Promise(resolve=>settled=resolve)};current.active=active;
     let priorTempo,tempoOwner;
     try{
      const leader=master();
      if(next.members.some(member=>member.deck.track!==member.track||loadOwners.get(member.deck)!==member.owner))throw cancelled();
      if(next.mode!==state.settings['Sync Mode']||next.leader!==leader||next.leaderTrack!==leader?.track||(next.mode==='Smart Sync'&&next.tempoOwner!==smartSync.captureTempoOwner()))throw new DOMException('Queued tempo superseded by a newer Sync or master choice.','AbortError');
      if(next.deck.track===next.track&&next.deck.sync){
       priorTempo=smartSync.captureTempo();const smart=state.settings['Sync Mode']==='Smart Sync';
       const priorOwner=smart&&smartSync.captureTempoOwner();
       const bpm=smart?smartSync.tempo(next.deck,next.rate):next.track.bpm*next.rate;
       if(smart){tempoOwner=smartSync.captureTempoOwner();advanceOwner(priorOwner);}
       if(!Number.isFinite(bpm)||bpm<=0)throw Error('Set a valid BPM before changing synced tempo.');
       const changes=state.decks.filter(d=>d.sync&&d.track).map(d=>({deck:d,rate:bpm/d.track.bpm}));
       if(changes.some(x=>!Number.isFinite(x.rate)||x.rate<.25||x.rate>4))throw Error('Matched tempo is outside a synced deck transport range.');
       await slicer.changeRates(changes,()=>engine.setSyncedRates(changes,{participants:participants(bpm)}));
      }
      next.waiters.forEach(({resolve})=>resolve());
     }catch(error){
      // Only this queue's own writes/rollback may advance waiting ownership.
      if(tempoOwner&&smartSync.restoreTempo(priorTempo,tempoOwner))advanceOwner(tempoOwner);
      next.waiters.forEach(({reject})=>reject(error));
     }finally{
      if(current.active===active)current.active=null;
      settled();
     }
    }
   }finally{if(queue===current)queue=null;}
  });
  return promise;
 };
 setRate.cancelLoad=deck=>{
  loadOwners.set(deck,{});
  const active=involves(queue?.active?.request,deck)?queue.active:null,wanted=involves(queue?.wanted,deck)?queue.wanted:null;
  const affected=new Set([deck,...(active?.request.members||[]).map(x=>x.deck),...(wanted?.members||[]).map(x=>x.deck)]);
  for(const d of affected)cancelGUI(d);
  if(wanted){queue.wanted=null;wanted.waiters.forEach(({reject})=>reject(cancelled()));}
  const pending=engine.cancelSyncedRates(deck);
  return active?.done||pending;
 };
 return setRate;
}
