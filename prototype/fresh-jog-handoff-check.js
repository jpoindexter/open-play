// Diagnostic only: generated raw audio, actual workspace H handler and scheduled source arguments.
export async function runFreshJogHandoffCheck(app){
 const {state,engine}=app,doc=document,win=doc.defaultView,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);},close=(a,b)=>Math.abs(a-b)<1e-7;
 const notObserved=message=>{throw Object.assign(Error(message),{name:'NotObservedError'});};
 async function until(check,label,before=null){
  const end=performance.now()+15000;
  while(!check()){if(before!==null&&engine.ctx.currentTime>=before)notObserved(label+': future handoff window elapsed');assert(performance.now()<end,label+' timed out');await sleep(5);}
 }
 async function hashes(){return Object.fromEntries(await Promise.all(['engine.js','jog-bend.js','app.js','fresh-jog-handoff-check.js'].map(async path=>{
  const response=await fetch(path,{cache:'no-store'});assert(response.ok,'Cannot hash '+path);
  return [path,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')];
 })));}
 const key=type=>doc.body.dispatchEvent(new KeyboardEvent(type,{key:'h',code:'KeyH',bubbles:true,cancelable:true}));
 const report={startedAt:new Date().toISOString(),completed:false,observation:'not-observed',scope:'Actual packaged native workspace/AudioContext and raw AudioBufferSource.start arguments; generated buffer, synthetic H events through installed app handlers, and one diagnostic Sync readiness participant. Source-rate/anchor clock evidence only; no PCM, music, listening, OS focus, physical output or controller proof.'};
 const d=state.decks[1],shift=state.settings['Playback Keys Use Shift'];
 let track,originalBuffer,originalDuration,createBufferSource,sourceFactoryOwn,pending,controller;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only isolated session required');
 assert(state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued)&&!engine.recording,'Start with all decks and recording stopped');
 assert(!doc.querySelector('#modal')?.open,'Close the diagnostic modal first');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(d?.track?.demo,'Generated deck B must be loaded');await until(()=>!engine.bufferLoads.has(d.track.id),'Startup B decode');
  state.autoplay=false;state.settings['Playback Keys Use Shift']=false;
  track=d.track;originalBuffer=engine.buffers.get(track.id);originalDuration=track.duration;
  const buffer=engine.ctx.createBuffer(1,22050*30,22050),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=.02*Math.sin(2*Math.PI*330*i/22050);
  engine.buffers.set(track.id,buffer);track.duration=buffer.duration;
  const controls=[...doc.querySelectorAll('.deck button,.channel-strip input,#crossfader,.library-wave-preview img')],starts=[];
  assert(controls.length,'Expected workspace controls/previews');
  createBufferSource=engine.ctx.createBufferSource;
  sourceFactoryOwn=Object.getOwnPropertyDescriptor(engine.ctx,'createBufferSource');
  engine.ctx.createBufferSource=function(...args){
   const source=createBufferSource.apply(this,args),start=source.start;
   source.start=function(...values){starts.push({source,when:values[0]??engine.ctx.currentTime,offset:values[1]??0});return start.apply(this,values);};
   return source;
  };
  Object.assign(d,{position:1,rate:1.2,sync:false,syncState:'off',keylock:false,keyShift:0,reverse:false,loop:false,stemSlip:'off'});
  await engine.start(d);await until(()=>d.playing&&!d.processing&&engine.ctx.currentTime>d.anchorTime+.03,'Raw B playback');
  const old=engine.voices.get(d.index),oldSource=old?.sources?.[0],oldStart=starts.find(row=>row.source===oldSource),oldRate=oldSource?.playbackRate.value;
  assert(oldStart&&close(oldRate,1.2)&&!old.gridTimeline&&!old.liveKeylock&&!old.deckScratchTransport,'Expected actual raw B source at1.2');
  controller=new AbortController();let participantCalls=0;
  const participant={id:'fresh-jog-readiness',start:async group=>{
   assert(++participantCalls===1,'Diagnostic participant ran twice');group.watch('fresh-jog-readiness',controller,()=>!controller.signal.aborted);
   const when=await group.prepared('fresh-jog-readiness',engine.ctx.currentTime+.25);await group.arm('fresh-jog-readiness');return {when};
  }};
  pending=engine.setSyncedRates([{deck:d,rate:1.32}],{participants:[participant]});await pending;pending=null;
  const voice=engine.voices.get(d.index),source=voice?.sources?.[0],scheduled=starts.find(row=>row.source===source);
  assert(voice!==old&&scheduled&&close(source.playbackRate.value,1.32)&&!d.processing&&!voice.gridTimeline&&!voice.liveKeylock&&!voice.deckScratchTransport,'Expected committed replacement raw source');
  report.scheduled={groupCompletedAt:engine.ctx.currentTime,when:scheduled.when,offset:scheduled.offset,sourceRate:source.playbackRate.value,participantCalls};
  if(engine.ctx.currentTime>=scheduled.when)notObserved('Group completed after the future handoff window');
  assert(!key('keydown'),'Installed workspace H handler did not consume the key');
  await until(()=>close(source.playbackRate.value,1.32*1.04),'Fresh H bend',scheduled.when);
  report.freshJog={at:engine.ctx.currentTime,sourceRate:source.playbackRate.value,nominalRate:d.rate,anchorPosition:d.anchorPosition,anchorTime:d.anchorTime};
  assert(close(d.rate,1.32),'Fresh H changed nominal group tempo');
  const before=engine.ctx.currentTime,position=engine.position(d),after=engine.ctx.currentTime;
  const oldExpected=at=>oldStart.offset+Math.max(0,at-oldStart.when)*oldRate;
  report.preBoundary={before,after,position,expectedBefore:oldExpected(before),expectedAfter:oldExpected(after),oldSourceRate:oldSource.playbackRate.value};
  if(after>=scheduled.when)notObserved('Fresh H applied without an observed pre-boundary position bracket');
  assert(close(oldSource.playbackRate.value,oldRate),'Fresh H changed the retained old source');
  assert(position>=oldExpected(before)-1e-6&&position<=oldExpected(after)+1e-6,'Pre-boundary position left the old-source clock bracket');
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute changed before the boundary');
  await until(()=>engine.ctx.currentTime>scheduled.when+.03,'Scheduled raw handoff');
  const sourceRate=source.playbackRate.value,postBefore=engine.ctx.currentTime,postPosition=engine.position(d),postAfter=engine.ctx.currentTime;
  assert(close(sourceRate,1.32*1.04),'Fresh H bend ended before the post-boundary observation');
  const expected=at=>scheduled.offset+Math.max(0,at-scheduled.when)*sourceRate;
  report.postBoundary={before:postBefore,after:postAfter,position:postPosition,sourceRate,expectedBefore:expected(postBefore),expectedAfter:expected(postAfter)};
  assert(postPosition>=expected(postBefore)-1e-6&&postPosition<=expected(postAfter)+1e-6,'Post-boundary position left the actual scheduled-source clock bracket');
  key('keyup');await until(()=>close(source.playbackRate.value,1.32),'H release restored nominal source');
  report.releasedSourceRate=source.playbackRate.value;
  assert(controls.every(node=>node.isConnected),'Diagnostic replaced controls/previews');report.retainedControlsAndPreviews=controls.length;
  report.observation='observed';report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};if(error.name!=='NotObservedError')report.observation='failed';}
 finally{
  key('keyup');win.dispatchEvent(new Event('blur'));state.autoplay=false;controller?.abort();
  state.decks.forEach(deck=>engine.pause(deck));engine.stopAllSamples();if(pending){try{await pending;}catch{}}
  state.decks.forEach(deck=>engine.pause(deck));engine.audioMonitor?.mutePhysical(true);
  if(createBufferSource){if(sourceFactoryOwn)Object.defineProperty(engine.ctx,'createBufferSource',sourceFactoryOwn);else delete engine.ctx.createBufferSource;}
  if(track){if(originalBuffer)engine.buffers.set(track.id,originalBuffer);else engine.buffers.delete(track.id);track.duration=originalDuration;}
  state.settings['Playback Keys Use Shift']=shift;
  report.allStopped=state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued&&!engine.syncedRateRequests.has(deck))&&engine.voices.size===0&&engine.retiringVoices.size===0&&!engine.samples?.size&&!engine.sampleRequests.size;
  report.physicalMuted=!!engine.audioMonitor?.snapshot().physicalMuted;
  report.sourceFactoryRestored=!createBufferSource||engine.ctx.createBufferSource===createBufferSource;
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}
  catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&report.allStopped&&report.physicalMuted&&report.sourceFactoryRestored&&report.sourceStable;
  report.finishedAt=new Date().toISOString();
 }
 return report;
}
