// Diagnostic only: actual Grid Save/Pause/Play handlers, one gated resume and real live WASM.
export async function runGridCancelPlayCheck({state,engine}){
 const doc=document,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);},close=(a,b)=>Math.abs(a-b)<1e-7;
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','smart-sync.js','panels.js','beatgrid-save.js','grid-cancel-play-check.js'].map(async path=>{
  const response=await fetch(path,{cache:'no-store'});assert(response.ok,'Cannot hash '+path);
  return[path,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')];
 })));}
 const click=selector=>{const node=doc.querySelector(selector);assert(node&&!node.disabled,'Unavailable '+selector);node.click();};
 const change=(selector,value)=>{const node=doc.querySelector(selector);assert(node,'Missing '+selector);node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));};
 const saved=[],buffers=[],adapters=new Set(),history=[...state.history],prepare=[...state.prepare],storage=new Map(Object.entries(localStorage));
 function edit(object,values){saved.push([object,Object.fromEntries(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(object,key)]))]);Object.assign(object,values);}
 const a=state.decks[0],b=state.decks[1],initialLayout=doc.querySelector('#preview-density')?.value;
 const previews=()=>new Map([...doc.querySelectorAll('#tracks tbody tr[data-track] .library-wave-preview img')].map(image=>[image.closest('tr[data-track]').dataset.track,image.src]));
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual packaged generated-only four-deck Compact workspace, native AudioContext/live WASM and installed Grid Save/modal Close/Play handlers. Setup seeds generated PCM/metadata and uses engine.seek to establish Tempo Sync. One old resume is held before real delegation; new Play uses unmodified resume/WASM. Not natural failure, PCM, audible pop/stall, music, OS focus, physical MIDI or socket proof.'};
 let originalResume,resumeOwn,resumeJob,release,entered=false,calls=0,delegated=0,gridStatus;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only isolated session required');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Start with all decks and recording stopped');
 assert(!doc.querySelector('#modal')?.open,'Close the diagnostic modal first');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);assert(engine.audioMonitor.snapshot().physicalMuted,'Physical graph mute failed');
  await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(a?.track?.demo&&b?.track?.demo&&a.track!==b.track,'Distinct generated A/B tracks required');
  await until(()=>!engine.bufferLoads.has(a.track.id)&&!engine.bufferLoads.has(b.track.id),'Startup generated decodes');
  edit(state,{autoplay:false,deckCount:state.deckCount,focus:state.focus,layout:state.layout});
  edit(state.settings,{'Sync Mode':'Smart Sync','Lock Playing Deck':false,'Instant Doubles':false,'Use Auto Gain':false,'Analyze Stems':false,'Play from First Cue Point':false});
  for(const [d,bpm,hz]of [[a,126,330],[b,120,660]]){
   const t=d.track;edit(t,{bpm,grid:0,duration:45,gridWarpMarkers:[],gridMarkers:[],analyzed:true,locked:false,plays:t.plays,metadataSources:t.metadataSources,metadataRevision:t.metadataRevision});
   const buffer=engine.ctx.createBuffer(1,22050*45,22050),pcm=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)pcm[i]=.02*Math.sin(2*Math.PI*hz*i/22050);
   buffers.push([t,engine.buffers.get(t.id)]);engine.buffers.set(t.id,buffer);
   edit(d,{position:2,rate:1,keylock:d===b,keyShift:0,reverse:false,stemSlip:'off',loop:false,sync:false,syncState:'off',syncRole:null,repeat:false,tab:'Cues',controllerPadMode:null});
  }
  change('#deck-count','4');change('#preview-density','compact');await frames();
  assert(state.deckCount===4&&doc.querySelectorAll('.deck').length===4&&doc.querySelectorAll('#crossfader').length===1,'Four-deck structural setup did not settle');
  assert(doc.querySelector('#preview-density').value==='compact','Compact setup failed');
  for(const d of [a,b]){click(`[data-action="play"][data-deck="${d.index}"]`);await until(()=>d.playing&&!d.processing&&!d.playQueued,'Initial Play '+d.index);const adapter=engine.voices.get(d.index)?.liveKeylock;if(adapter)adapters.add(adapter);}
  click('[data-action="sync"][data-deck="1"]');
  await until(()=>b.sync&&b.syncState==='beat'&&!b.processing&&engine.voices.get(1)?.liveKeylock?.stateAt().playing,'Initial real Sync');
  const initialAdapter=engine.voices.get(1).liveKeylock;adapters.add(initialAdapter);
  await until(()=>engine.ctx.currentTime>b.anchorTime+.03,'Initial handoff clock');
  await engine.seek(b,engine.position(b)+.025);assert(b.syncState==='tempo'&&b.playing,'Actual manual-position callback did not establish Tempo Sync');await frames();
  await until(()=>previews().size>0,'Ready library previews');
  const ready=previews(),controls=[...doc.querySelectorAll('.deck button,.deck input,.deck select,.channel-strip input,#crossfader')],outgoing=engine.voices.get(0),outgoingToken=engine.startTokens.get(0),outgoingRate=a.rate;
  assert(controls.length&&outgoing&&initialAdapter&&!initialAdapter.disposed,'Initial controls/voices missing');
  report.setup={deckCount:4,density:'compact',orientation:state.layout,syncState:b.syncState,rate:b.rate,liveAdapterRate:initialAdapter.stateAt().rate,controls:controls.length,previews:ready.size};
  click('[data-action="grid"][data-deck="1"]');assert(doc.querySelector('#modal').open,'Grid editor did not open');
  doc.querySelector('#grid-bpm').value='100';doc.querySelector('#grid-offset').value='.1';gridStatus=doc.querySelector('#grid-status');
  const gate=new Promise(resolve=>release=resolve);originalResume=engine.resume;resumeOwn=Object.getOwnPropertyDescriptor(engine,'resume');
  engine.resume=function(...args){
   calls++;if(calls!==1)return originalResume.apply(this,args);entered=true;
   resumeJob=(async()=>{await gate;delegated++;return originalResume.apply(this,args);})();void resumeJob.catch(()=>{});return resumeJob;
  };
  click('#grid-save');await until(()=>entered&&b.processing&&doc.querySelector('#grid-save').disabled,'Grid realignment resume gate');
  const pendingToken=engine.startTokens.get(1),controller=engine.transforms.get(1);
  assert(b.track.bpm===100&&b.track.grid===.1&&b.syncState==='tempo'&&b.playing&&controller&&!controller.signal.aborted&&delegated===0,'Expected owned grid realignment over retained playing voice');
  report.held={bpm:b.track.bpm,grid:b.track.grid,token:pendingToken,rate:b.rate,syncState:b.syncState,calls,delegated,status:gridStatus.textContent};
  click('#modal-close');assert(!doc.querySelector('#modal').open,'Close did not dismiss pending editor');
  click('[data-action="play"][data-deck="1"]');await until(()=>!b.playing&&!b.processing&&!b.playQueued&&!engine.voices.has(1),'Actual Pause during grid preparation');
  assert(controller.signal.aborted&&engine.startTokens.get(1)!==pendingToken,'Actual Pause did not revoke old preparation');
  click('[data-action="play"][data-deck="1"]');
  await until(()=>b.playing&&!b.processing&&!b.playQueued&&engine.voices.get(1)?.liveKeylock?.stateAt().playing,'Actual newer Play');
  const voice=engine.voices.get(1),adapter=voice.liveKeylock,token=engine.startTokens.get(1),rate=b.rate;adapters.add(adapter);
  assert(adapter!==initialAdapter&&b.sync&&b.syncState==='tempo'&&calls===2&&delegated===0,'New Play must use an independent real resume/live adapter');
  report.newer={token,rate,adapterState:adapter.stateAt(),syncState:b.syncState};
  release();await resumeJob;
  await until(()=>gridStatus.textContent.includes('Grid saved; playback realignment failed:')&&!engine.transforms.has(1),'Handled obsolete grid error');await frames();
  const current=adapter.stateAt(),present=previews();
  report.after={sameVoice:engine.voices.get(1)===voice,sameAdapter:engine.voices.get(1)?.liveKeylock===adapter,token:engine.startTokens.get(1),rate:b.rate,adapterState:current,sync:b.sync,syncState:b.syncState,playing:b.playing,processing:b.processing,queued:b.playQueued,status:gridStatus.textContent,statusConnected:gridStatus.isConnected,calls,delegated,retainedControls:controls.filter(node=>node.isConnected).length,previewsBefore:ready.size,previewsMatched:[...ready].filter(([id,src])=>present.get(id)===src).length};
  assert(report.after.sameVoice&&report.after.sameAdapter&&report.after.token===token&&close(b.rate,rate)&&close(current.rate,rate)&&b.playing&&current.playing&&b.sync&&b.syncState==='tempo'&&!b.processing&&!b.playQueued,'Obsolete grid failure changed the newer live transport');
  assert(engine.voices.get(0)===outgoing&&engine.startTokens.get(0)===outgoingToken&&close(a.rate,outgoingRate)&&a.playing,'Grid cancellation changed outgoing transport');
  assert(report.after.retainedControls===controls.length&&report.after.previewsMatched===ready.size,'Grid cancellation replaced controls or previews');
  assert(calls===2&&delegated===1&&engine.audioMonitor.snapshot().physicalMuted,'Resume ownership or physical mute changed');report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  release?.();if(originalResume){if(resumeOwn)Object.defineProperty(engine,'resume',resumeOwn);else delete engine.resume;}
  state.autoplay=false;for(const d of state.decks){const adapter=engine.voices.get(d.index)?.liveKeylock;if(adapter)adapters.add(adapter);engine.pause(d);}engine.stopAllSamples();if(resumeJob){try{await resumeJob;}catch{}}
  await frames();state.decks.forEach(d=>engine.pause(d));
  try{await Promise.all([...adapters].map(adapter=>adapter.dispose()));}catch(error){report.cleanupError={name:error.name,message:error.message};}
  if(doc.querySelector('#modal')?.open)click('#modal-close');engine.audioMonitor?.mutePhysical(true);
  for(const [t,buffer]of buffers){if(buffer)engine.buffers.set(t.id,buffer);else engine.buffers.delete(t.id);}
  for(const [object,properties]of saved.reverse())for(const [key,descriptor]of Object.entries(properties)){if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key];}
  state.history.splice(0,state.history.length,...history);state.prepare=prepare;
  change('#deck-count',String(state.deckCount));if(initialLayout)change('#preview-density',initialLayout);await frames();
  for(const key of Object.keys(localStorage))if(!storage.has(key))localStorage.removeItem(key);for(const [key,value]of storage)localStorage.setItem(key,value);
  report.adapterCleanup=[...adapters].map(adapter=>({disposed:adapter.disposed,timerCleared:adapter.timer===null,retainedPCMBytes:adapter.snapshot().retainedPCMBytes}));
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0&&engine.retiringVoices.size===0&&!engine.sampleRequests.size&&!engine.samples?.size,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,resumeRestored:!originalResume||engine.resume===originalResume,adaptersDisposed:adapters.size>0&&report.adapterCleanup.every(adapter=>adapter.disposed&&adapter.timerCleared&&adapter.retainedPCMBytes===0),settingsAndMetadataRestored:saved.every(([object,properties])=>Object.entries(properties).every(([key,descriptor])=>descriptor?Object.is(object[key],descriptor.value):!Object.hasOwn(object,key))),buffersRestored:buffers.every(([track,buffer])=>engine.buffers.get(track.id)===buffer),historyRestored:state.history.length===history.length&&state.history.every((entry,i)=>entry===history[i]),prepareRestored:state.prepare.length===prepare.length&&state.prepare.every((entry,i)=>entry===prepare[i]),storageRestored:JSON.stringify(Object.entries(localStorage).sort())===JSON.stringify([...storage].sort())};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&!report.cleanupError&&Object.values(report.cleanup).every(value=>value===true)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
