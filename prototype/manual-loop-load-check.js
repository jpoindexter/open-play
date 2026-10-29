// Diagnostic only: actual saved-loop pad/Load handlers, one gated raw transport resume.
export async function runManualLoopLoadCheck({state,engine}){
 const doc=document,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(value,message)=>{if(!value)throw Error(message);},close=(a,b)=>Math.abs(a-b)<1e-7;
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','manual-loops.js','manual-loop-load-check.js'].map(async path=>{
  const response=await fetch(path,{cache:'no-store'});assert(response.ok,'Cannot hash '+path);
  return[path,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')];
 })));}
 const click=selector=>{const node=doc.querySelector(selector);assert(node&&!node.disabled,'Unavailable '+selector);node.click();};
 const saved=[];
 function edit(object,values){saved.push([object,Object.fromEntries(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(object,key)]))]);Object.assign(object,values);}
 const b=state.decks[1],report={startedAt:new Date().toISOString(),completed:false,scope:'Actual packaged generated-only workspace, native AudioContext/raw AudioBuffer voice, installed saved-loop pad and normal library selection/Load handlers. One next-resume gate before real delegation; not the original rendered-worker gate, natural renderer failure, PCM, music, listening, physical output, OS focus or controller proof.'};
 let track,bufferTrack,originalBuffer,originalResume,resumeOwn,resumeJob,release,entered=false,calls=0,delegated=0;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only isolated session required');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Start with all decks and recording stopped');
 assert(!doc.querySelector('#modal')?.open,'Close the diagnostic modal first');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical graph mute failed');await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(b?.track?.demo,'Generated deck B must be loaded');track=b.track;
  const replacement=state.tracks.find(t=>t.demo&&t!==track);assert(replacement,'Distinct generated replacement required');
  await until(()=>!engine.bufferLoads.has(track.id)&&!engine.bufferLoads.has(replacement.id),'Startup generated decodes');
  state.autoplay=false;
  edit(state.settings,{'Sync Mode':'Off','Lock Playing Deck':false,'Instant Doubles':false,'Use Auto Gain':false,'Analyze Stems':false,'Play from First Cue Point':false});
  edit(track,{bpm:120,grid:0,duration:20,gridWarpMarkers:[],gridMarkers:[],savedLoops:[{start:1,end:2,name:'Generated Load boundary'}],analyzed:true});
  edit(replacement,{analyzed:true});originalBuffer=engine.buffers.get(track.id);
  const buffer=engine.ctx.createBuffer(1,22050*20,22050),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=.02*Math.sin(2*Math.PI*330*i/22050);
  bufferTrack=track;engine.buffers.set(track.id,buffer);await engine.buffer(replacement);
  Object.assign(b,{position:6.5,rate:1,keylock:false,keyShift:0,reverse:false,stemSlip:'off',loop:false,loopLength:8,sync:false,syncState:'off',syncRole:null,repeat:false,tab:'Loops',loopPadMode:'saved',controllerPadMode:null});
  const count=doc.querySelector('#deck-count');assert(count,'Deck-count control missing');count.value='4';count.dispatchEvent(new Event('change',{bubbles:true}));await frames();
  assert(state.deckCount===4&&doc.querySelectorAll('.deck').length===4,'Four-deck setup did not materialize');
  assert(doc.querySelectorAll('#crossfader').length===1,'Structural setup left duplicate crossfaders');
  const readyPreviews=()=>new Map([...doc.querySelectorAll('#tracks tbody tr[data-track] .library-wave-preview img')].map(image=>[image.closest('tr[data-track]').dataset.track,image.src]));
  await until(()=>readyPreviews().size>0,'At least one ready library preview');
  const previews=readyPreviews();assert(previews.size>0,'Ready library preview baseline missing');
  report.previewBefore=[...previews].map(([track,src])=>({track,src}));
  const controls=[...doc.querySelectorAll('.deck:not([data-focus="1"]) button,.deck:not([data-focus="1"]) input,.deck:not([data-focus="1"]) select,.channel-strip input,#crossfader')];
  assert(controls.length,'Outgoing controls missing');
  const witness=stage=>{const missing=controls.filter(node=>!node.isConnected).map(node=>({tag:node.tagName,id:node.id,action:node.dataset.action,deck:node.dataset.deck}));(report.controlStages||=[]).push({stage,total:controls.length,missing});assert(!missing.length,stage+': outgoing controls replaced');};
  await engine.start(b);await until(()=>b.playing&&!b.processing&&engine.ctx.currentTime>b.anchorTime+.03,'Raw B playback');
  const oldVoice=engine.voices.get(b.index);assert(oldVoice?.sources?.length&&!oldVoice.liveKeylock&&!oldVoice.gridTimeline&&!oldVoice.renderWindow&&engine.position(b)>2,'Expected actual raw B source beyond the saved loop end');
  report.initial={track:track.id,position:engine.position(b),rate:b.rate,loop:b.loop,savedLoop:{start:1,end:2}};
  const gate=new Promise(resolve=>release=resolve);originalResume=engine.resume;resumeOwn=Object.getOwnPropertyDescriptor(engine,'resume');
  engine.resume=function(...args){
   calls++;if(calls!==1)return originalResume.apply(this,args);entered=true;
   resumeJob=(async()=>{await gate;delegated++;return originalResume.apply(this,args);})();void resumeJob.catch(()=>{});return resumeJob;
  };
  click('[data-action="pad"][data-deck="1"][data-pad="0"]');await until(()=>entered&&b.processing,'Saved-loop raw restart gate');
  const controller=engine.transforms.get(b.index),oldToken=engine.startTokens.get(b.index);
  assert(controller&&!controller.signal.aborted&&b.track===track&&b.loop&&close(b.loopIn,1)&&close(b.loopOut,2)&&calls===1&&delegated===0,'Expected one owned held saved-loop preparation');
  report.held={track:b.track.id,position:b.position,processing:b.processing,token:oldToken,calls,delegated};witness('saved-loop preparation held');
  click(`#tracks tbody tr[data-track="${CSS.escape(replacement.id)}"]`);assert(state.selected===replacement.id,'Actual library row did not select replacement');
  click('[data-action="load"][data-deck="1"]');
  await until(()=>b.track===replacement&&!b.playing&&!b.processing&&!b.playQueued&&!engine.bufferLoads.has(replacement.id),'Normal replacement Load');await frames();
  const loaded={track:b.track.id,position:engine.position(b),loopLength:b.loopLength,token:engine.startTokens.get(b.index),controllerAborted:controller.signal.aborted};
  assert(loaded.controllerAborted&&loaded.token!==oldToken&&close(loaded.position,0)&&!b.loop&&!engine.voices.has(b.index),'Load did not revoke the old loop transport');
  assert(calls===1&&delegated===0,'Replacement Load unexpectedly entered resume');report.loaded=loaded;witness('normal B Load completed');
  release();await resumeJob;report.resumeOutcome='fulfilled';
  await frames();await until(()=>!b.processing&&!b.playQueued&&!engine.transforms.has(b.index)&&!engine.bufferLoads.has(replacement.id),'Old loop preparation settlement');
  report.after={track:b.track.id,position:engine.position(b),loopLength:b.loopLength,token:engine.startTokens.get(b.index),playing:b.playing,loop:b.loop,queued:b.playQueued,voice:engine.voices.has(b.index),calls,delegated};
  assert(b.track===replacement&&close(report.after.position,0)&&b.loopLength===loaded.loopLength&&report.after.token===loaded.token,'Old loop recall changed the replacement position, length or token');
  assert(!b.playing&&!b.loop&&!b.playQueued&&!engine.voices.has(b.index)&&calls===1&&delegated===1,'Old loop recall restarted replacement or resume delegated incorrectly');
  await until(()=>{const current=readyPreviews();return [...previews].every(([id,src])=>current.get(id)===src);},'Retained ready library preview sources');
  const current=readyPreviews();report.previews={before:previews.size,after:current.size,matched:[...previews].filter(([id,src])=>current.get(id)===src).length};
  assert(report.previews.matched===previews.size,'Load changed a previously ready preview source');
  witness('old loop preparation settled');assert(engine.audioMonitor.snapshot().physicalMuted,'Physical graph mute changed');report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  release?.();
  if(originalResume){if(resumeOwn)Object.defineProperty(engine,'resume',resumeOwn);else delete engine.resume;}
  state.autoplay=false;state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();if(resumeJob){try{await resumeJob;}catch{}}
  await frames();state.decks.forEach(d=>engine.pause(d));engine.audioMonitor?.mutePhysical(true);
  if(bufferTrack){if(originalBuffer)engine.buffers.set(bufferTrack.id,originalBuffer);else engine.buffers.delete(bufferTrack.id);}
  for(const [object,properties]of saved)for(const [key,descriptor]of Object.entries(properties)){if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key];}
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0&&engine.retiringVoices.size===0&&!engine.sampleRequests.size&&!engine.samples?.size,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,resumeRestored:!originalResume||engine.resume===originalResume};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(value=>value===true)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
