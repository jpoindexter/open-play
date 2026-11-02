// Diagnostic only: retain real WASM/audio and hold one completed Sync acknowledgement.
export async function runSimpleGridSyncCheck({state,engine}){
 const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const assert=(v,m)=>{if(!v)throw Error(m);},frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 async function until(fn,label){const end=performance.now()+15000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 const click=s=>{const n=$(s);assert(n&&!n.disabled,'Unavailable '+s);n.click();};
 const sources=['app.js','engine.js','sync.js','beatgrid-save.js','simple-grid-sync-check.js'];
 async function hashes(){return Object.fromEntries(await Promise.all(sources.map(async file=>{
  const response=await fetch(file,{cache:'no-store'});assert(response.ok,'Cannot hash '+file);
  return[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')];
 })));}
 const previews=()=>new Map([...document.querySelectorAll('#tracks tr[data-track] .library-wave-preview img')].map(n=>[n.closest('tr').dataset.track,n.src]));
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Generated-only four-deck Compact, real AudioContext/live WASM and installed Play/Sync/Grid Save handlers. One real completed start ACK is held before engine continuation; not natural latency, master PCM, listening, OS input or physical controller proof.'};
 const saved=Object.fromEntries(['Sync Mode','Snap to Beatgrid','Lock Playing Deck','Use Auto Gain'].map(k=>[k,Object.getOwnPropertyDescriptor(state.settings,k)]));
 const adapters=new Set(),a=state.decks[0],b=state.decks[1];let factory,factoryOwn,release,held,gateNext=true;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only isolated session required');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Decks and recording must start stopped');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');await until(()=>!state.analysis,'Startup analysis');
  Object.assign(state.settings,{'Sync Mode':'Simple Sync','Snap to Beatgrid':true,'Lock Playing Deck':false,'Use Auto Gain':false});state.autoplay=false;
  for(const [d,bpm]of [[a,126],[b,120]]){Object.assign(d.track,{bpm,grid:0,gridWarpMarkers:[],gridMarkers:[],analyzed:true,locked:false});Object.assign(d,{position:2,rate:1,keylock:d===b,keyShift:0,reverse:false,loop:false,sync:false,syncState:'off',syncRole:null,stemSlip:'off',repeat:false});}
  $('#deck-count').value='4';$('#deck-count').dispatchEvent(new Event('change',{bubbles:true}));await frames();
  report.layout={decks:state.deckCount,density:document.body.dataset.density,orientation:document.body.dataset.orientation};assert(report.layout.decks===4&&report.layout.density==='compact','Four-deck Compact layout required');
  for(const d of [a,b]){click(`[data-action=play][data-deck="${d.index}"]`);await until(()=>d.playing&&!d.processing&&!d.playQueued,'Initial Play '+d.index);const adapter=engine.voices.get(d.index)?.liveKeylock;if(adapter)adapters.add(adapter);}
  const originalVoice=engine.voices.get(1),outgoing=engine.voices.get(0),originalRate=b.rate,outgoingToken=engine.startTokens.get(0);
  assert(originalVoice.liveKeylock,'Incoming original real live voice required');
  await until(()=>originalVoice.liveKeylock.stateAt().playing,'Initial live playback clock');
  await until(()=>previews().size>0,'Ready previews');
  const ready=previews(),unrelated=new Map([...ready].filter(([id])=>id!==b.track.id)),controls=[...document.querySelectorAll('.deck button,.deck input,.deck select,.channel-strip input,#crossfader')];
  factory=engine.createForwardKeylock;factoryOwn=Object.getOwnPropertyDescriptor(engine,'createForwardKeylock');
  const gate=new Promise(r=>release=r);
  engine.createForwardKeylock=async function(options){
   const adapter=await factory.call(this,options);adapters.add(adapter);
   if(gateNext){gateNext=false;const start=adapter.start;adapter.start=async function(...args){const ack=await start.apply(this,args);held={adapter,signal:options.signal,ack};await gate;return ack;};}
   return adapter;
  };
  click('[data-action=sync][data-deck="1"]');await until(()=>held,'Real incoming Sync acknowledgement');
  assert(!held.signal.aborted&&engine.voices.get(1)===originalVoice,'Expected owned pending Sync over retained voice');
  report.held={targetRate:b.rate,ack:held.ack,contextTime:engine.ctx.currentTime,controls:controls.length,readyPreviews:ready.size};
  click('[data-action=grid][data-deck="1"]');assert($('#modal').open,'Grid editor did not open');
  $('#grid-bpm').value='100';$('#grid-offset').value='.1';click('#grid-save');
  await until(()=>!$('#modal').open,'Public Grid Save');
  assert(held.signal.aborted&&b.track.bpm===100&&b.track.grid===.1,'Grid publication did not revoke the old request');
  release();await until(()=>!b.processing&&!engine.transforms.has(1),'Canceled Sync settlement');await frames();
  report.canceled={signalAborted:held.signal.aborted,adapterDisposed:held.adapter.disposed,sameVoice:engine.voices.get(1)===originalVoice,rate:b.rate,sync:b.sync,leaderSync:a.sync,notice:$('#notice').textContent};
  assert(report.canceled.sameVoice&&held.adapter.disposed&&b.rate===originalRate&&!b.sync&&!a.sync,'Obsolete Sync committed a voice, rate or false Sync state');
  assert(engine.voices.get(0)===outgoing&&engine.startTokens.get(0)===outgoingToken&&a.rate===1&&a.playing,'Outgoing deck changed');
  click('[data-action=sync][data-deck="1"]');await until(()=>b.sync&&b.playing&&!b.processing,'Fresh Sync against edited grid');
  await until(()=>engine.ctx.currentTime>b.anchorTime+.03,'Fresh handoff clock');
  const at=engine.ctx.currentTime,phase=(engine.voiceClock(b,engine.voices.get(1))(at)-.1)/(60/100)-engine.voiceClock(a,outgoing)(at)/(60/126);
  const cell=()=>$(`#tracks tr[data-track="${CSS.escape(b.track.id)}"] .library-wave-preview`);
  await until(()=>cell()?.dataset.previewState==='ready'&&cell()?.querySelector('img')?.complete,'Edited preview');
  const present=previews();report.fresh={rate:b.rate,phaseErrorBeats:Math.abs(phase-Math.round(phase)),live:!!engine.voices.get(1)?.liveKeylock,sync:b.sync,leaderSync:a.sync,retainedControls:controls.filter(n=>n.isConnected).length,unrelatedPreviews:unrelated.size,unrelatedPreviewsRetained:[...unrelated].filter(([id,src])=>present.get(id)===src).length,editedPreviewReady:true};
  assert(Math.abs(b.rate-1.26)<1e-8&&report.fresh.phaseErrorBeats<.001&&report.fresh.live,'Fresh Sync did not use the new grid');
  assert(report.fresh.retainedControls===controls.length&&report.fresh.unrelatedPreviewsRetained===unrelated.size,'Controls or unrelated previews were replaced');report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  release?.();if(factory){if(factoryOwn)Object.defineProperty(engine,'createForwardKeylock',factoryOwn);else delete engine.createForwardKeylock;}
  state.autoplay=false;for(const d of state.decks){const adapter=engine.voices.get(d.index)?.liveKeylock;if(adapter)adapters.add(adapter);engine.pause(d);}engine.stopAllSamples();
  try{await Promise.all([...adapters].map(adapter=>adapter.dispose()));}catch(error){report.cleanupError=error.message;}
  if($('#modal')?.open)click('#modal-close');for(const [k,d]of Object.entries(saved)){if(d)Object.defineProperty(state.settings,k,d);else delete state.settings[k];}
  engine.audioMonitor?.mutePhysical(true);await frames();
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0,physicalMuted:engine.audioMonitor.snapshot().physicalMuted,adaptersDisposed:[...adapters].every(a=>a.disposed),factoryRestored:!factory||engine.createForwardKeylock===factory};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceError=error.message;}
  report.completed=report.completed&&!report.cleanupError&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
