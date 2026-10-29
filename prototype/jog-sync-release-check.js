// Diagnostic only: actual isolated workspace/graph, synthetic H/blur and a gated Sync participant.
export async function runJogSyncReleaseCheck({state,engine}){
 const doc=document,win=doc.defaultView,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);};
 const close=(a,b)=>Math.abs(a-b)<1e-7;
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
 async function sourceHashes(){return Object.fromEntries(await Promise.all(['engine.js','jog-bend.js','app.js','jog-sync-release-check.js'].map(async path=>{
  const response=await fetch(path,{cache:'no-store'});assert(response.ok,'Cannot hash '+path);
  return [path,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')];
 })));}
 const key=type=>doc.body.dispatchEvent(new KeyboardEvent(type,{key:'h',code:'KeyH',bubbles:true,cancelable:true}));
 const report={startedAt:new Date().toISOString(),completed:false,cases:[],scope:'Actual packaged native workspace/AudioContext graph via engine.start, actual keyboard H and installed renderer blur cleanup; generated AudioBuffer only. Gated diagnostic Sync participant controls failure/readiness; no real renderer failure, PCM, music, OS focus, physical output or controller proof.'};
 const d=state.decks[1];let release=()=>{},pending,track,originalBuffer,originalDuration;
 const shiftSetting=state.settings['Playback Keys Use Shift'];
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only isolated diagnostic session required');
 assert(state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued),'Start with all decks stopped');
 assert(!doc.querySelector('#modal')?.open,'Close the diagnostic modal first');
 try{
  report.sourceBefore=await sourceHashes();
  engine.init();engine.audioMonitor.mutePhysical(true);assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');
  await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(d?.track?.demo,'Generated deck B must be loaded');
  await until(()=>!engine.bufferLoads.has(d.track.id),'Startup B decode');
  state.autoplay=false;state.settings['Playback Keys Use Shift']=false;
  track=d.track;originalBuffer=engine.buffers.get(track.id);originalDuration=track.duration;
  const buffer=engine.ctx.createBuffer(1,22050*30,22050),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=.02*Math.sin(2*Math.PI*330*i/22050);
  engine.buffers.set(track.id,buffer);track.duration=buffer.duration;
  const controls=[...doc.querySelectorAll('.deck button,.channel-strip input,#crossfader,.library-wave-preview img')];
  for(const outcome of ['failure','success']){
   engine.pause(d);Object.assign(d,{position:1,rate:1.2,sync:false,syncState:'off',keylock:false,keyShift:0,reverse:false,loop:false,stemSlip:'off'});
   await engine.start(d);await until(()=>d.playing&&!d.processing&&engine.ctx.currentTime>d.anchorTime+.03,'Raw B playback');
   const voice=engine.voices.get(d.index),source=voice?.sources?.[0],sources=[...(voice?.sources||[])];
   assert(source&&!voice.gridTimeline&&!voice.liveKeylock&&!voice.deckScratchTransport,'Expected raw source B');
   const sourceRate=()=>source.playbackRate.value*(voice.timelineScale||1);
   assert(close(d.rate,1.2)&&close(sourceRate(),1.2),'Raw nominal source must begin at1.2');
   assert(!key('keydown'),'Actual workspace did not handle H');
   await until(()=>close(sourceRate(),1.248),'H source bend');
   const bentRate=sourceRate();
   assert(close(d.rate,1.2),'H changed nominal deck tempo');
   let entered=false,calls=0;const controller=new AbortController(),id='jog-release-'+outcome;
   const held=new Promise(resolve=>release=resolve);
   const participant={id,start:async group=>{
    assert(++calls===1,'Diagnostic participant ran twice');group.watch(id,controller,()=>!controller.signal.aborted);entered=true;
    await held;
    if(outcome==='failure')throw Error('Controlled diagnostic participant rejection');
    const when=await group.prepared(id,engine.ctx.currentTime+.1);await group.arm(id);return {when};
   }};
   pending=engine.setSyncedRates([{deck:d,rate:1.32}],{participants:[participant]}).then(()=>({ok:true}),error=>({ok:false,error:{name:error.name,message:error.message}}));
   await until(()=>entered&&d.processing&&close(d.rate,1.32),'Held grouped Sync preparation');
   assert(engine.voices.get(d.index)===voice,'Preparation replaced the old raw voice');
   win.dispatchEvent(new Event('blur'));await until(()=>close(sourceRate(),1.2),'Blur restored old nominal source');key('keyup');
   assert(close(d.rate,1.32),'Blur overwrote pending requested tempo');
   const released={position:d.anchorPosition,time:d.anchorTime,rate:sourceRate()};
   const expected=at=>released.position+Math.max(0,at-released.time)*released.rate;
   release();const result=await pending;pending=null;
   const evidence={outcome,heldBendRate:bentRate,released,participantCalls:calls,result,physicalMuted:engine.audioMonitor.snapshot().physicalMuted};
   assert(evidence.physicalMuted,'Physical mute changed');
   if(outcome==='failure'){
    assert(!result.ok&&result.error.message==='Controlled diagnostic participant rejection','Expected controlled participant failure');
    assert(engine.voices.get(d.index)===voice&&sources.every((s,i)=>voice.sources[i]===s),'Failed group replaced old voice/source');
    assert(d.playing&&!d.processing&&close(d.rate,1.2)&&close(sourceRate(),1.2),'Failed group lost old nominal playback');
    evidence.retainedOldVoiceAndSources=true;evidence.nominalRate=d.rate;evidence.sourceRate=sourceRate();
   }else{
    assert(result.ok,'Grouped Sync failed: '+result.error?.message);
    const when=d.anchorTime;Object.assign(evidence,{scheduledWhen:when,scheduledPosition:d.anchorPosition,expectedPosition:expected(when)});
    assert(Math.abs(d.anchorPosition-expected(when))<1e-6,'Future Sync anchor retained the released bend clock');
    const before=engine.ctx.currentTime,position=engine.position(d),after=engine.ctx.currentTime;
    evidence.preBoundary={observed:after<when,before,after,position,expectedBefore:expected(before),expectedAfter:expected(after)};
    if(after<when)assert(position>=expected(before)-1e-6&&position<=expected(after)+1e-6,'Pre-boundary engine position left the released source clock bracket');
    else evidence.preBoundary.reason='Native callback resumed at or after the handoff boundary';
    assert(engine.voices.get(d.index)!==voice&&close(d.rate,1.32),'Successful group did not own requested tempo');
    await until(()=>engine.ctx.currentTime>when+.03,'Scheduled group boundary');
   }
   assert(controls.every(node=>node.isConnected),'Diagnostic replaced controls/previews');
   report.cases.push(evidence);engine.pause(d);
  }
  report.completed=true;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 finally{
  release();key('keyup');win.dispatchEvent(new Event('blur'));state.autoplay=false;
  state.decks.forEach(deck=>engine.pause(deck));engine.stopAllSamples();
  if(pending){try{await pending;}catch{}}
  state.decks.forEach(deck=>engine.pause(deck));engine.audioMonitor?.mutePhysical(true);
  if(track){if(originalBuffer)engine.buffers.set(track.id,originalBuffer);else engine.buffers.delete(track.id);track.duration=originalDuration;}
  state.settings['Playback Keys Use Shift']=shiftSetting;
  report.allStopped=state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued&&!engine.syncedRateRequests.has(deck))&&engine.voices.size===0&&!engine.samples?.size&&!engine.sampleRequests.size;
  report.physicalMuted=!!engine.audioMonitor?.snapshot().physicalMuted;
  try{assert(report.allStopped,'Cleanup left active or queued audio');assert(report.physicalMuted,'Cleanup lost physical mute');}
  catch(error){report.error??={message:error.message,stack:error.stack};}
  try{report.sourceAfter=await sourceHashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}
  catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&report.allStopped&&report.physicalMuted&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
