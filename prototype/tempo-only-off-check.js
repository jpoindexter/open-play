// Diagnostic only: one owned factory gate, actual app Sync/OFF and live WASM adapter.
export async function runTempoOnlyOffCheck({state,engine}){
 const doc=document,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);},close=(a,b)=>Math.abs(a-b)<1e-7;
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','smart-sync.js','tempo-only-off-check.js'].map(async path=>{
  const response=await fetch(path,{cache:'no-store'});assert(response.ok,'Cannot hash '+path);
  return[path,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')];
 })));}
 function click(action,index){const button=doc.querySelector(`[data-action="${action}"][data-deck="${index}"]`);assert(button&&!button.disabled,'Unavailable '+action+' on deck '+index);button.click();}
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual packaged app Sync/OFF handlers, AudioEngine and generated-buffer live WASM adapter. One controlled next-factory gate before delegation; not the original adapter-fill gate, PCM, music, listening, OS mute/focus, device or natural failure proof.'};
 const a=state.decks[0],b=state.decks[1],syncMode=state.settings['Sync Mode'],saved=[],adapters=new Set();
 let originalFactory,factoryOwn,factoryJob,release,oldAdapter,oldVoice,bufferTrack,originalBuffer,controls;
 function editTrack(track,values){saved.push([track,Object.fromEntries(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(track,key)]))]);Object.assign(track,values);}
 assert(state.tracks.length&&state.tracks.every(track=>track.demo),'Generated-only isolated session required');
 assert(state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued)&&!engine.recording,'Start with all decks/recording stopped');
 assert(!doc.querySelector('#modal')?.open,'Close the diagnostic modal first');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical graph mute failed');await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(a?.track?.demo&&b?.track?.demo&&a.track!==b.track,'Distinct generated A/B tracks required');
  await until(()=>!engine.bufferLoads.has(a.track.id)&&!engine.bufferLoads.has(b.track.id),'Startup A/B decode');state.autoplay=false;
  editTrack(a.track,{bpm:126,grid:0,duration:20,gridWarpMarkers:[],gridMarkers:[],analyzed:true});
  editTrack(b.track,{bpm:120,grid:0,duration:20,gridWarpMarkers:[],gridMarkers:[],analyzed:true});
  bufferTrack=b.track;originalBuffer=engine.buffers.get(bufferTrack.id);
  const buffer=engine.ctx.createBuffer(1,22050*20,22050),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=.02*Math.sin(2*Math.PI*330*i/22050);
  engine.buffers.set(bufferTrack.id,buffer);
  for(const deck of state.decks)Object.assign(deck,{sync:false,syncState:'off',syncRole:null,repeat:false});
  Object.assign(a,{position:0,rate:1,keylock:false,keyShift:0,reverse:false,loop:false,stemSlip:'off'});
  Object.assign(b,{position:1,rate:1,keylock:true,keyShift:0,reverse:false,loop:false,stemSlip:'off'});
  state.settings['Sync Mode']='Smart Sync';
  doc.querySelector('#deck-count').dispatchEvent(new Event('change',{bubbles:true}));
  controls=[...doc.querySelectorAll('.deck button,.channel-strip input,#crossfader,.library-wave-preview img')];assert(controls.length,'Expected workspace controls/previews');
  await engine.start(b);oldVoice=engine.voices.get(b.index);oldAdapter=oldVoice?.liveKeylock;if(oldAdapter)adapters.add(oldAdapter);
  assert(oldAdapter&&!oldVoice.gridTimeline,'Expected genuine flat live-keylock B');
  await until(()=>!b.processing&&oldAdapter.stateAt().playing&&engine.ctx.currentTime>b.anchorTime+.03,'Committed live B');
  assert(close(b.rate,1)&&close(oldAdapter.stateAt().rate,1),'Initial B rate must be1');
  report.initial={flatLiveKeylock:true,keylock:b.keylock,adapterRate:oldAdapter.stateAt().rate,adapterPlaying:oldAdapter.stateAt().playing};
  click('syncMaster',a.index);assert(!a.playing,'Master A must remain paused');
  const token=engine.startTokens.get(b.index),gate=new Promise(resolve=>release=resolve);let entered=false,calls=0,delegated=0;
  originalFactory=engine.createForwardKeylock;factoryOwn=Object.getOwnPropertyDescriptor(engine,'createForwardKeylock');
  engine.createForwardKeylock=function(...args){
   assert(++calls===1,'Only one replacement factory call allowed');entered=true;
   factoryJob=(async()=>{await gate;delegated++;const adapter=await originalFactory.apply(this,args);adapters.add(adapter);return adapter;})();
   void factoryJob.catch(()=>{});return factoryJob;
  };
  click('sync',b.index);await until(()=>entered,'Tempo-only replacement factory gate');
  const controller=engine.transforms.get(b.index),owner=engine.rateOwners.get(b);
  report.beforeOff={oldVoice:engine.voices.get(b.index)===oldVoice,adapterRate:oldAdapter.stateAt().rate,nominalRate:b.rate,processing:b.processing,tokenBefore:token,tokenPending:engine.startTokens.get(b.index),newController:!!controller&&controller!==oldVoice.liveOwnerController,factoryCalls:calls,delegated};
  assert(report.beforeOff.oldVoice&&close(report.beforeOff.adapterRate,1)&&close(b.rate,1.05)&&b.processing&&report.beforeOff.newController&&engine.startTokens.get(b.index)!==token,'Expected retained old live owner and new rate preparation');
  await until(()=>!doc.querySelector(`[data-action="syncOff"][data-deck="${b.index}"]`).disabled,'Pending OFF control');
  click('syncOff',b.index);assert(controller.signal.aborted,'First OFF did not abort the owned controller');
  report.off={at:engine.ctx.currentTime,controllerAborted:controller.signal.aborted,delegated};release();
  try{await factoryJob;report.factoryOutcome={status:'fulfilled'};}catch(error){report.factoryOutcome={status:'rejected',name:error.name,message:error.message};}
  await until(()=>!b.processing&&!engine.transforms.has(b.index)&&!owner.pending,'Canceled preparation settlement');
  report.afterOff={sameVoice:engine.voices.get(b.index)===oldVoice,sameAdapter:engine.voices.get(b.index)?.liveKeylock===oldAdapter,adapterRate:oldAdapter.stateAt().rate,nominalRate:b.rate,sync:b.sync,syncState:b.syncState,playing:b.playing,processing:b.processing,masterPaused:!a.playing,masterRate:a.rate,factoryCalls:calls,delegated};
  assert(report.afterOff.sameVoice&&report.afterOff.sameAdapter&&b.playing&&oldAdapter.stateAt().playing&&!b.sync&&close(b.rate,1)&&close(report.afterOff.adapterRate,1)&&!a.playing&&close(a.rate,1),'OFF changed the retained nominal voice or paused master');
  assert(calls===1&&delegated===1,'Factory gate did not delegate exactly once');
  assert(controls.every(node=>node.isConnected),'Diagnostic replaced controls/previews');report.retainedControlsAndPreviews=controls.length;
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical graph mute changed');report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  release?.();
  if(originalFactory){if(factoryOwn)Object.defineProperty(engine,'createForwardKeylock',factoryOwn);else delete engine.createForwardKeylock;}
  state.autoplay=false;state.decks.forEach(deck=>engine.pause(deck));engine.stopAllSamples();
  if(factoryJob){try{await factoryJob;}catch{}}
  state.decks.forEach(deck=>engine.pause(deck));
  try{await Promise.all([...adapters].map(adapter=>adapter.dispose()));}catch(error){report.cleanupError={name:error.name,message:error.message};}
  engine.audioMonitor?.mutePhysical(true);
  if(bufferTrack){if(originalBuffer)engine.buffers.set(bufferTrack.id,originalBuffer);else engine.buffers.delete(bufferTrack.id);}
  for(const [track,properties]of saved)for(const [key,descriptor]of Object.entries(properties)){if(descriptor)Object.defineProperty(track,key,descriptor);else delete track[key];}
  state.settings['Sync Mode']=syncMode;
  report.adapterCleanup=[...adapters].map(adapter=>({disposed:adapter.disposed,timerCleared:adapter.timer===null,retainedPCMBytes:adapter.snapshot().retainedPCMBytes}));
  report.cleanup={allStopped:state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued)&&engine.voices.size===0&&engine.transforms.size===0&&engine.retiringVoices.size===0&&!engine.sampleRequests.size&&!engine.samples?.size,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,factoryRestored:!originalFactory||engine.createForwardKeylock===originalFactory,adapterDisposed:!!oldAdapter&&report.adapterCleanup.every(adapter=>adapter.disposed),timerCleared:!!oldAdapter&&report.adapterCleanup.every(adapter=>adapter.timerCleared),retainedPCMBytes:report.adapterCleanup.reduce((sum,adapter)=>sum+adapter.retainedPCMBytes,0)};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&!report.cleanupError&&Object.entries(report.cleanup).every(([key,value])=>key==='retainedPCMBytes'?value===0:value===true)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
