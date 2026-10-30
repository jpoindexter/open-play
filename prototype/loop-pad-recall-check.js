// Isolated diagnostic: real cold render, held result, ordinary pad handlers.
export async function runLoopPadRecallCheck({state,engine},queuedAuto=false){
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assert=(value,message)=>{if(!value)throw Error(message);};
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 const click=selector=>{const node=document.querySelector(selector);assert(node&&!node.disabled,'Unavailable '+selector);node.click();};
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','loop-pads.js','keylock.js','loop-pad-recall-check.js'].map(async file=>{
  const response=await fetch(file,{cache:'no-store'});assert(response.ok,'Cannot hash '+file);
  return[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')];
 })));}
 const saved=[],edit=(object,values)=>{saved.push([object,Object.fromEntries(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(object,key)]))]);Object.assign(object,values);};
 const d=state.decks[1],report={action:queuedAuto?'queued Auto Loop':'Beat Jump',startedAt:new Date().toISOString(),completed:false,scope:'Packaged generated-only four-deck workspace, real AudioContext and cold pitch-render Worker. First completed render result is held before engine continuation; queued Auto Loop or Beat Jump yields to newer saved-loop recall through normal mode/pad handlers. Not natural scheduling probability, master PCM, music/listening, controller or general pop/stall proof.'};
 let track,buffer,render,renderOwn,seek,seekOwn,heldJob,release,held=false,calls=0;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only isolated session required');
 assert(state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued)&&!engine.recording,'All decks and recording must start stopped');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');await until(()=>!state.analysis,'Startup analysis');
  track=d.track;assert(track?.demo,'Generated B must be loaded');await until(()=>!engine.bufferLoads.has(track.id),'Generated decode');buffer=engine.buffers.get(track.id);
  state.autoplay=false;edit(state.settings,{'Sync Mode':'Off','Show Beat Jump Controls':!queuedAuto,'Use Auto Gain':false});
  edit(track,{bpm:120,grid:0,duration:30,gridWarpMarkers:[],gridMarkers:[],analyzed:true,savedLoops:[null,{start:11,end:12,name:'Newer loop'}]});
  const generated=engine.ctx.createBuffer(1,48000*30,48000),samples=generated.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=.02*Math.sin(2*Math.PI*330*i/48000);
  engine.buffers.set(track.id,generated);engine.keylockRenderer.clear();
  Object.assign(d,{position:6.5,rate:1,keylock:true,keyShift:-12,reverse:false,stemSlip:'off',loop:true,loopIn:6,loopOut:8,loopLength:4,sync:false,syncState:'off',syncRole:null,repeat:false,tab:'Loops',loopPadMode:queuedAuto?'auto':'roll',autoLoopBeats:null,controllerPadMode:null});
  const count=document.querySelector('#deck-count');assert(count,'Deck count missing');count.value='4';count.dispatchEvent(new Event('change',{bubbles:true}));await frames();
  assert(state.deckCount===4&&document.querySelectorAll('.deck').length===4,'Four decks missing');
  const previewMap=()=>new Map([...document.querySelectorAll('#tracks tbody tr[data-track] .library-wave-preview img')].map(node=>[node.closest('tr[data-track]').dataset.track,node.src]));
  const previewEntries=()=>[...document.querySelectorAll('#tracks tbody tr[data-track] .library-wave-preview')].map(cell=>({id:cell.closest('tr').dataset.track,key:cell.dataset.previewKey,phase:cell.dataset.previewState,src:cell.querySelector('img')?.src}));
  // Setup changed the demo BPM; refresh its thumbnail before freezing the retention baseline.
  click('#tracks [data-sort="title"]');const previewKey=track.contentHash||`${track.id}:${track.seed}:${track.bpm}:${track.freq}`;
  await until(()=>previewEntries().some(cell=>cell.id===track.id&&cell.key===previewKey&&cell.phase==='ready'),'Prepared track preview');
  const previews=previewMap();report.previewBefore=previewEntries();report.previewTrack={id:track.id,bpm:track.bpm,seed:track.seed,freq:track.freq};
  const controls=[...document.querySelectorAll('.deck:not([data-focus="1"]) button,.deck:not([data-focus="1"]) input,.deck:not([data-focus="1"]) select,.channel-strip input,#crossfader')];
  assert(controls.length>0,'Sibling controls missing');await engine.start(d);
  await until(()=>d.playing&&!d.processing&&engine.ctx.currentTime>d.anchorTime+.03,'Initial rendered-loop playback');
  const old=engine.voices.get(1);assert(old?.renderWindow&&old.sources?.length,'Initial real rendered loop missing');
  engine.keylockRenderer.clear();render=engine.keylockRenderer.render;renderOwn=Object.getOwnPropertyDescriptor(engine.keylockRenderer,'render');
  const gate=new Promise(resolve=>release=resolve);
  engine.keylockRenderer.render=function(...args){
   if(++calls!==1)return render.apply(this,args);
   heldJob=(async()=>{const result=await render.apply(this,args);let finite=true,peak=0;for(const x of result.getChannelData(0)){finite&&=Number.isFinite(x);peak=Math.max(peak,Math.abs(x));}
    report.render={frames:result.length,sampleRate:result.sampleRate,finite,peak,window:args[1].window};assert(finite&&peak>0,'Cold Worker output invalid');held=true;await gate;return result;
   })();void heldJob.catch(()=>{});return heldJob;
  };
  const seeks=[];seek=engine.seek;seekOwn=Object.getOwnPropertyDescriptor(engine,'seek');engine.seek=function(deck,position,...args){if(deck===d)seeks.push(position);return seek.call(this,deck,position,...args);};
  click(`[data-action="pad"][data-deck="1"][data-pad="${queuedAuto?3:7}"]`);await until(()=>held&&d.processing,'Real cold render result held');
  const controller=engine.transforms.get(1),oldToken=engine.startTokens.get(1);assert(controller&&!controller.signal.aborted&&engine.voices.get(1)===old,'Held jump must retain its original voice');
  report.held={token:oldToken,loopIn:d.loopIn,loopOut:d.loopOut,calls};
  if(queuedAuto)click('[data-action="pad"][data-deck="1"][data-pad="4"]');
  click('[data-action="loopMode"][data-deck="1"][data-mode="saved"]');await frames();
  click('[data-action="pad"][data-deck="1"][data-pad="1"]');
  await until(()=>!d.processing&&d.playing&&d.loopIn===11&&d.loopOut===12&&seeks.length===1,'Newer saved-loop recall');
  const voice=engine.voices.get(1),token=engine.startTokens.get(1),anchor=d.anchorTime,position=d.anchorPosition;
  assert(voice!==old&&token!==oldToken&&controller.signal.aborted,'New recall did not supersede old jump');
  release();await heldJob;await frames();await until(()=>!engine.transforms.has(1),'Old jump continuation settled');
  assert(engine.voices.get(1)===voice&&engine.startTokens.get(1)===token&&d.anchorTime===anchor&&d.anchorPosition===position,'Old jump replaced the newer transport');
  assert(seeks.length===1&&seeks[0]===11&&d.loopIn===11&&d.loopOut===12&&d.playing,'Obsolete jump sought or rewrote the newer loop');
  if(queuedAuto)assert(d.autoLoopBeats===null&&d.loopLength===2,'Obsolete Auto Loop metadata survived');
  assert(controls.every(node=>node.isConnected),'Sibling/mixer controls replaced');const current=previewMap();report.previewAfter=previewEntries();assert([...previews].every(([id,src])=>current.get(id)===src),'Ready library previews changed');
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute changed');
  report.after={token,position,anchor,loopIn:d.loopIn,loopOut:d.loopOut,autoLoopBeats:d.autoLoopBeats,loopLength:d.loopLength,playing:d.playing,seeks,renderCalls:calls,siblingControlsRetained:controls.length,previewSourcesRetained:previews.size,previewImagesAfter:current.size};report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  release?.();state.autoplay=false;state.decks.forEach(deck=>engine.pause(deck));engine.stopAllSamples();if(heldJob)try{await heldJob;}catch{}
  if(render){if(renderOwn)Object.defineProperty(engine.keylockRenderer,'render',renderOwn);else delete engine.keylockRenderer.render;}
  if(seek){if(seekOwn)Object.defineProperty(engine,'seek',seekOwn);else delete engine.seek;}
  engine.keylockRenderer.clear();if(track){if(buffer)engine.buffers.set(track.id,buffer);else engine.buffers.delete(track.id);}
  for(const[object,properties]of saved)for(const[key,descriptor]of Object.entries(properties)){if(descriptor)Object.defineProperty(object,key,descriptor);else delete object[key];}
  await frames();engine.audioMonitor?.mutePhysical(true);
  report.cleanup={allStopped:state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued)&&!engine.voices.size&&!engine.transforms.size&&!engine.retiringVoices.size&&!engine.sampleRequests.size&&!engine.samples?.size,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,methodsRestored:(!render||engine.keylockRenderer.render===render)&&(!seek||engine.seek===seek)};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
