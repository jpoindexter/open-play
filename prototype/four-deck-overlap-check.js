// Test-only rapid GUI Sync requests on real playing decks, with physical mute.
export async function checkSyncOverlap({app,count,label,click,until,capture,event,report}){
 const {state,engine}=app,primary=state.decks.find(d=>d.syncRole==='primary'),deck=state.decks.find(d=>d!==primary&&Math.abs(d.track.bpm-primary.track.bpm*primary.rate)>.1);
 if(!deck)throw Error('Overlap check needs unequal original tempos');
 click(`[data-action="syncOff"][data-deck="${deck.index}"]`);await until(()=>!deck.sync,'Sync Off');
 click(`[data-action="tempoReset"][data-deck="${deck.index}"]`);await until(()=>!deck.processing&&Math.abs(deck.rate-1)<1e-8,'independent pitch reset');
 const rate=primary.rate,voice=engine.voices.get(primary.index),before=deck.rate;
 event('overlap-before',{label,count,deck:deck.index,track:deck.track.title,rate:before,master:primary.index,masterTrack:primary.track.title,masterRate:rate});
 const recording=capture('overlap-'+label);
 for(let i=0;i<count;i++)click(`[data-action="sync"][data-deck="${deck.index}"]`);
 await until(()=>!deck.processing&&!deck.playQueued&&deck.sync,'latest rapid Sync request',15);await recording;
 const audible=engine.audibleRate(deck),expected=primary.track.bpm*primary.rate/deck.track.bpm;
 if(!deck.playing||Math.abs(deck.rate-expected)>1e-6||Math.abs(audible-deck.rate)>1e-6)throw Error('Rapid Sync left audio and controls at different rates');
 if(!primary.playing||primary.rate!==rate||engine.voices.get(primary.index)!==voice)throw Error('Rapid Sync changed outgoing master');
 (report.overlapChecks??=[]).push({label,count,deck:deck.index,track:deck.track.title,before,rate:deck.rate,audible,expected,masterRetained:true});
 event('overlap-after',report.overlapChecks.at(-1));
}

// One real-workspace cancellation window; no held ACKs or injected preparation delay.
export async function checkSyncCancellation({app,click,until,event,report,play,sync,gridSave=false}){
 const {state,engine}=app,assert=(ok,message)=>{if(!ok)throw Error(message);};
 const incoming=state.decks[1],outgoing=state.decks[0];
 const sample=d=>({playing:d.playing,processing:!!d.processing,queued:!!d.playQueued,sync:!!d.sync,rate:d.rate,audible:engine.audibleRate(d)});
 assert(engine.audioMonitor.snapshot().physicalMuted,'Physical output must remain muted');
 assert(state.decks.every(d=>d.track?.bpm>0&&!d.playing),'Four analyzed, paused tracks required');
 try{
  if(gridSave==='analysis'){
   saveBPM(incoming.track,incoming.track.bpm*1.01);
   await until(()=>!document.querySelector('#modal').open,'independent pre-analysis BPM edit',15);
  }
  await engine.resume();
  for(const d of state.decks)await play(d.index);
  await sync(0);
  click('[data-action="syncOff"][data-deck="1"]');
  click('[data-action="tempoReset"][data-deck="1"]');
  await until(()=>!incoming.processing&&!incoming.sync&&Math.abs(incoming.rate-1)<1e-8,'independent incoming tempo',15);
  click('[data-action="keylock"][data-deck="1"]');
  await until(()=>incoming.keylock&&!incoming.processing,'incoming key lock',15);
  const voices=state.decks.map(d=>engine.voices.get(d.index)),rates=state.decks.map(d=>d.rate);
  const target=outgoing.track.bpm*outgoing.rate/incoming.track.bpm;
  assert(Math.abs(target-incoming.rate)>.001,'Incoming baseline must differ from the requested Sync tempo');
  const retained=[...document.querySelectorAll('.deck,.deck button,.deck input,.deck select,#mixer,#mixer input,#detail-wave,.library-wave-preview img')];
  report.cancellation={action:gridSave==='analysis'?'Replace analyzed grid':gridSave==='metadata'?'Save details':gridSave?'Save grid':'Shift-Sync/OFF',before:state.decks.map(sample),target,tracks:state.decks.map(d=>d.track.title)};
  const requestSync=()=>{
   click('[data-action="sync"][data-deck="1"]');click('[data-action="sync"][data-deck="1"]');
   assert(incoming.processing,'No pending Sync window observed; this run is inconclusive');
   report.cancellation.pending={state:sample(incoming),transforms:engine.transforms.size,startToken:engine.startTokens.get(1)};
   event('cancel-pending',{deck:1,...report.cancellation.pending});
  };
  if(gridSave==='analysis'){
   let triggered=false,failure;const before=incoming.track.bpm;
   const completed=()=>{if(!triggered&&/Analyzing .* · 100% ·/.test(state.analysisStatus)){
    triggered=true;try{requestSync();}catch(error){failure=error;}
   }};
   // The real worker's existing final progress event precedes its result message.
   document.addEventListener('openplay-analysis-update',completed);
   try{
    click(`tr[data-track="${incoming.track.id}"]`);click('[data-panel="analysis"]');
    document.querySelector('#analysis-replace-tempo').checked=true;click('#analysis-run');click('#modal-close');
    await until(()=>!state.analysis,'actual replacement worker completes',180);
   }
   finally{document.removeEventListener('openplay-analysis-update',completed);}
   if(failure)throw failure;
   assert(triggered,'No worker completion overlap observed; inconclusive');
   assert(!incoming.track.analysisError,'Actual worker analysis failed');
   report.cancellation.grid={before,saved:incoming.track.bpm};
   assert(before!==incoming.track.bpm,'Worker result did not replace the setup grid; inconclusive');
  }else{
   requestSync();
   // Shift-Sync shares the production OFF handler and stays available during preparation.
   if(gridSave){
   const bpm=incoming.track.bpm*1.01;report.cancellation.grid={before:incoming.track.bpm,saved:bpm};
   if(gridSave==='metadata'){
    saveBPM(incoming.track,bpm);
   }else{click('[data-action="grid"][data-deck="1"]');document.querySelector('#grid-bpm').value=bpm;click('#grid-save');}
   }else document.querySelector('[data-action="sync"][data-deck="1"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}));
  }
  await until(()=>!incoming.processing&&!incoming.playQueued&&!engine.transforms.size,'canceled preparation settles',15);
  await new Promise(resolve=>setTimeout(resolve,250));
  const after=state.decks.map(sample);
  Object.assign(report.cancellation,{after,voicesRetained:state.decks.map((d,i)=>engine.voices.get(i)===voices[i]),nodesRetained:retained.filter(node=>node.isConnected).length});
  assert(state.decks.every((d,i)=>d.playing&&engine.voices.get(i)===voices[i]&&d.rate===rates[i]),'Cancellation changed a retained playing voice or nominal rate');
  assert(!incoming.sync&&Math.abs(engine.audibleRate(incoming)-rates[1])<1e-6,'Canceled incoming Sync left state/audio rate disagreement');
  assert(engine.voices.get(0)===voices[0]&&outgoing.rate===rates[0],'Outgoing master changed');
  assert(retained.every(node=>node.isConnected),'Cancellation replaced controls or library previews');
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute changed');
  Object.assign(report.cancellation,{after,pendingObserved:true,retained:retained.length,physicalMuted:true});
  if(gridSave){
   await until(()=>!document.querySelector('#modal').open,'grid save completes',15);
   await sync(1);const expected=outgoing.track.bpm*outgoing.rate/incoming.track.bpm;
   const untilAudio=engine.voices.get(1)?.handoffBefore?.until||engine.ctx.currentTime;
   report.cancellation.freshSync={scheduled:sample(incoming),audioTime:engine.ctx.currentTime,untilAudio,bpm:incoming.track.bpm,expected};
   await until(()=>engine.ctx.currentTime>=untilAudio,'fresh Sync audible handoff',15);
   report.cancellation.freshSync.state=sample(incoming);
   assert(Math.abs(incoming.rate-expected)<1e-6&&Math.abs(engine.audibleRate(incoming)-expected)<1e-6,'Fresh Sync did not use the saved grid');
   assert(engine.voices.get(0)===voices[0]&&outgoing.rate===rates[0],'Fresh Sync changed outgoing master');
   report.cancellation.freshSync.masterRetained=true;
  }
  report.cancellation.passed=true;
 }finally{
  engine.silence();
  report.cancellation??={};report.cancellation.stopped=state.decks.every(d=>!d.playing&&!d.playQueued);
  report.cancellation.physicalMuted=engine.audioMonitor.snapshot().physicalMuted;
 }
}

function saveBPM(track,bpm){
 document.querySelector(`tr[data-track="${track.id}"]`).dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
 const form=document.querySelector('#track-form');form.elements.bpm.value=bpm;form.requestSubmit();
}
