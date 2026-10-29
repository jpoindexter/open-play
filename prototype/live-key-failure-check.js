// Diagnostic only: reject one old live update after real Load/Play and a genuine replacement key change.
export async function runLiveKeyFailureCheck({state,engine}){
 const doc=document,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);},close=(a,b)=>Math.abs(a-b)<1e-7;
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','deck-key-shift.js','live-key-failure-check.js'].map(async path=>{
  const response=await fetch(path,{cache:'no-store'});assert(response.ok,'Cannot hash '+path);
  return[path,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')];
 })));}
 const click=selector=>{const node=doc.querySelector(selector);assert(node&&!node.disabled,'Unavailable '+selector);node.click();};
 const saved=[],buffers=[],adapters=new Set(),historyLength=state.history.length,prepare=[...state.prepare];
 function edit(object,values){saved.push([object,Object.fromEntries(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(object,key)]))]);Object.assign(object,values);}
 const readyPreviews=()=>new Map([...doc.querySelectorAll('#tracks tbody tr[data-track] .library-wave-preview img')].map(image=>[image.closest('tr[data-track]').dataset.track,image.src]));
 const message='Diagnostic old live update failure',b=state.decks[1];
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual packaged generated-only workspace, native AudioContext/live WASM adapters, installed keyUp and normal library selection/Load/Play. Only the old adapter.update is replaced with a controlled pending rejection, with no delegation. Replacement keyUp uses its real live update. Not a native worklet/natural renderer failure, PCM, music, listening, physical output, OS focus or controller proof.'};
 let oldAdapter,newAdapter,originalUpdate,updateOwn,rejectOld,oldPending,entered=false,settled=false,calls=0,rejections=0;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only isolated session required');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Start with all decks and recording stopped');
 assert(!doc.querySelector('#modal')?.open,'Close the diagnostic modal first');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical graph mute failed');await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(b?.track?.demo,'Generated deck B must be loaded');const track=b.track,replacement=state.tracks.find(t=>t.demo&&t!==track);
  assert(replacement,'Distinct generated replacement required');await until(()=>!engine.bufferLoads.has(track.id)&&!engine.bufferLoads.has(replacement.id),'Startup generated decodes');state.autoplay=false;
  edit(state.settings,{'Sync Mode':'Off','Lock Playing Deck':false,'Instant Doubles':false,'Use Auto Gain':false,'Analyze Stems':false,'Play from First Cue Point':false});
  const buffer=engine.ctx.createBuffer(1,22050*20,22050),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=.02*Math.sin(2*Math.PI*330*i/22050);
  for(const t of [track,replacement]){
   edit(t,{bpm:120,grid:0,duration:20,gridWarpMarkers:[],gridMarkers:[],analyzed:true,plays:t.plays});
   buffers.push([t,engine.buffers.get(t.id)]);engine.buffers.set(t.id,buffer);
  }
  Object.assign(b,{position:1,rate:1,keylock:true,keyShift:0,reverse:false,stemSlip:'off',loop:false,sync:false,syncState:'off',syncRole:null,repeat:false,tab:'Cues'});
  const count=doc.querySelector('#deck-count');assert(count,'Deck-count control missing');count.value='4';count.dispatchEvent(new Event('change',{bubbles:true}));await frames();
  assert(state.deckCount===4&&doc.querySelectorAll('.deck').length===4&&doc.querySelectorAll('#crossfader').length===1,'Four-deck structural setup did not settle');
  await engine.start(b);await until(()=>b.playing&&!b.processing&&engine.ctx.currentTime>b.anchorTime+.03,'Initial live B playback');
  const oldVoice=engine.voices.get(b.index);oldAdapter=oldVoice?.liveKeylock;if(oldAdapter)adapters.add(oldAdapter);
  assert(oldAdapter&&!oldVoice.gridTimeline&&!oldAdapter.disposed&&oldAdapter.stateAt().playing&&oldAdapter.stateAt().semitones===0&&close(oldAdapter.stateAt().rate,1),'Expected genuine live B at key0/rate1');
  originalUpdate=oldAdapter.update;updateOwn=Object.getOwnPropertyDescriptor(oldAdapter,'update');
  oldPending=new Promise((_resolve,reject)=>{rejectOld=()=>{if(!rejections){rejections++;reject(Error(message));}};});void oldPending.catch(()=>{settled=true;});
  oldAdapter.update=function(...args){assert(++calls===1,'Old controlled update invoked more than once');entered=true;report.oldUpdateArguments=args;return oldPending;};
  click('[data-action="keyUp"][data-deck="1"]');await until(()=>entered,'Old keyUp pending controlled update');
  report.held={track:b.track.id,keyShift:b.keyShift,adapterSemitones:oldAdapter.stateAt().semitones,sameVoice:engine.voices.get(b.index)===oldVoice,calls};
  assert(report.held.sameVoice&&b.keylock&&b.keyShift===1&&report.held.adapterSemitones===0&&report.oldUpdateArguments[0]?.semitones===1,'Expected old key intent1 with actual old adapter still0');
  click(`#tracks tbody tr[data-track="${CSS.escape(replacement.id)}"]`);assert(state.selected===replacement.id,'Library row did not select replacement');click('[data-action="load"][data-deck="1"]');
  await until(()=>b.track===replacement&&!b.playing&&!b.processing&&!b.playQueued&&!engine.bufferLoads.has(replacement.id),'Normal replacement Load');
  await until(()=>oldAdapter.disposed&&oldAdapter.timer===null&&oldAdapter.snapshot().retainedPCMBytes===0,'Load disposed old live adapter');
  assert(b.keylock&&b.keyShift===0,'Load did not preserve Key Lock and reset key shift');click('[data-action="play"][data-deck="1"]');
  await until(()=>b.playing&&!b.processing&&!b.playQueued&&engine.voices.get(b.index)?.liveKeylock?.stateAt().playing,'Actual replacement Play');
  const voice=engine.voices.get(b.index);newAdapter=voice.liveKeylock;adapters.add(newAdapter);
  assert(voice!==oldVoice&&newAdapter!==oldAdapter&&newAdapter.update===originalUpdate&&!voice.gridTimeline,'Replacement must own an unpatched genuine live adapter');
  click('[data-action="keyUp"][data-deck="1"]');
  await until(()=>b.keyShift===1&&voice.pitchSettings?.keyShift===1&&newAdapter.stateAt().semitones===1&&!b.processing&&!b.playQueued,'Real replacement keyUp success');await frames();
  const token=engine.startTokens.get(b.index),controls=[...doc.querySelectorAll('.deck button,.deck input,.deck select,.channel-strip input,#crossfader')];assert(controls.length,'Post-Load controls missing');
  await until(()=>readyPreviews().size>0,'Post-Load ready library previews');const previews=readyPreviews();report.previewBefore=[...previews].map(([track,src])=>({track,src}));
  report.replacement={track:b.track.id,keylock:b.keylock,keyShift:b.keyShift,pitchSettings:{...voice.pitchSettings},adapterState:newAdapter.stateAt(),token,controls:controls.length,oldAdapterDisposed:oldAdapter.disposed};
  rejectOld();await until(()=>settled,'Controlled old update rejection');await frames();
  await until(()=>doc.querySelector('#notice')?.textContent===message,'Expected handled diagnostic error notice');
  const actual=newAdapter.stateAt();
  report.after={track:b.track.id,sameVoice:engine.voices.get(b.index)===voice,sameAdapter:engine.voices.get(b.index)?.liveKeylock===newAdapter,keylock:b.keylock,keyShift:b.keyShift,pitchSettings:{...voice.pitchSettings},adapterState:actual,token:engine.startTokens.get(b.index),playing:b.playing,queued:b.playQueued,expectedHandledNotice:doc.querySelector('#notice').textContent,calls,rejections};
  assert(b.track===replacement&&report.after.sameVoice&&report.after.sameAdapter&&b.keylock&&b.keyShift===1&&voice.pitchSettings?.keylock&&voice.pitchSettings.keyShift===1&&actual.keylock&&actual.semitones===1&&close(actual.rate,1),'Old rejection changed replacement key ownership');
  assert(b.playing&&actual.playing&&!newAdapter.disposed&&!b.processing&&!b.playQueued&&report.after.token===token&&calls===1&&rejections===1,'Old rejection restarted or stopped replacement');
  assert(controls.every(node=>node.isConnected),'Old rejection replaced post-Load controls');
  await until(()=>{const current=readyPreviews();return [...previews].every(([id,src])=>current.get(id)===src);},'Retained post-Load preview sources');
  const current=readyPreviews();report.previews={before:previews.size,after:current.size,matched:[...previews].filter(([id,src])=>current.get(id)===src).length};
  assert(report.previews.matched===previews.size&&engine.audioMonitor.snapshot().physicalMuted,'Old rejection changed preview sources or physical mute');report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  if(oldAdapter&&originalUpdate){if(updateOwn)Object.defineProperty(oldAdapter,'update',updateOwn);else delete oldAdapter.update;}
  rejectOld?.();state.autoplay=false;const current=engine.voices.get(b?.index)?.liveKeylock;if(current)adapters.add(current);
  state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();if(oldPending){try{await oldPending;}catch{}}await frames();state.decks.forEach(d=>engine.pause(d));
  try{await Promise.all([...adapters].map(adapter=>adapter.dispose()));}catch(error){report.cleanupError={name:error.name,message:error.message};}
  engine.audioMonitor?.mutePhysical(true);for(const [t,buffer]of buffers){if(buffer)engine.buffers.set(t.id,buffer);else engine.buffers.delete(t.id);}
  for(const [object,properties]of saved)for(const [key,descriptor]of Object.entries(properties)){if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key];}
  state.history.length=historyLength;state.prepare=prepare;
  report.adapterCleanup=[...adapters].map(adapter=>({disposed:adapter.disposed,timerCleared:adapter.timer===null,retainedPCMBytes:adapter.snapshot().retainedPCMBytes}));
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0&&engine.retiringVoices.size===0&&!engine.sampleRequests.size&&!engine.samples?.size,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,oldUpdateRestored:!originalUpdate||oldAdapter.update===originalUpdate,adaptersDisposed:!!oldAdapter&&report.adapterCleanup.every(adapter=>adapter.disposed&&adapter.timerCleared&&adapter.retainedPCMBytes===0)};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&!report.cleanupError&&Object.values(report.cleanup).every(value=>value===true)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
