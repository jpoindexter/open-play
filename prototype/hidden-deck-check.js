// Isolated generated-audio check of installed pad, deck-count and Play handlers.
export async function runHiddenDeckCheck({state,engine}){
 const $=s=>document.querySelector(s),assert=(ok,message)=>{if(!ok)throw Error(message);},sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 async function until(check,label){const end=performance.now()+30000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
 const click=s=>{assert($(s)&&!$(s).disabled,'Missing '+s);$(s).click();};
 const key=type=>document.body.dispatchEvent(new KeyboardEvent(type,{key:' ',code:'Space',bubbles:true,cancelable:true}));
 const change=(s,value)=>{const n=$(s);assert(n,'Missing '+s);n.value=value;n.dispatchEvent(new Event('change',{bubbles:true}));};
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','pitchplay.js','slicer.js','hidden-deck-check.js'].map(async file=>{const r=await fetch(file,{cache:'no-store'});assert(r.ok,'Cannot hash '+file);return[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')];})));}
 const saved=Object.fromEntries(['Sync Mode','Instant Doubles','Lock Playing Deck','Use Auto Gain','Playback Keys Use Shift'].map(k=>[k,Object.getOwnPropertyDescriptor(state.settings,k)]));
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Generated-only four→two→four Compact; actual engine/installed pad, deck-count and Play handlers. Synthetic held Space and clicks, not physical pointer/MIDI/listening or natural timing/pop proof.',cases:[]};
 assert(location.pathname.endsWith('/core-ownership-check.html'),'Use isolated ownership workspace');
 assert(state.tracks.length&&state.tracks.every(t=>t.demo)&&state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Start generated-only, stopped and idle');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');await until(()=>!state.analysis,'Startup analysis');
  state.autoplay=false;Object.assign(state.settings,{'Sync Mode':'Off','Instant Doubles':false,'Lock Playing Deck':false,'Use Auto Gain':false,'Playback Keys Use Shift':false});
  change('#deck-count','4');change('#preview-density','compact');
  const d=state.decks[3];state.selected=state.tracks.find(t=>t.demo&&t!==state.decks[0].track&&t!==state.decks[1].track).id;
  click('[data-action="load"][data-deck="3"]');await until(()=>d.track&&engine.buffers.has(d.track.id)&&!d.processing,'Load D');
  d.track.cues[0]={position:2,name:'Isolated held pad'};Object.assign(d,{rate:1,keylock:false,keyShift:0,loop:false,loopIn:0,loopOut:0,position:4,sync:false});
  for(const index of [0,1]){click(`[data-action="play"][data-deck="${index}"]`);await until(()=>state.decks[index].playing&&!state.decks[index].processing,'Play sibling '+index);}
  const siblings=[0,1].map(index=>({d:state.decks[index],voice:engine.voices.get(index),rate:state.decks[index].rate}));
  for(const mode of ['Pitch','Slicer']){
   engine.pause(d);Object.assign(d,{keylock:false,keyShift:0,loop:false,loopIn:0,loopOut:0,position:4});click(`[data-action="tab"][data-deck="3"][data-tab="${mode}"]`);await frames();
   const pad=$('[data-action="pad"][data-deck="3"][data-pad="1"]');assert(pad,'D pad missing');pad.focus();pad.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));
   await until(()=>d.playing&&!d.processing&&engine.voices.has(3),'Held '+mode);await frames();
   const during={playing:d.playing,loop:d.loop,keyShift:d.keyShift,slice:d.slice,liveKeylock:!!engine.voices.get(3).liveKeylock};
   if(mode==='Slicer')assert(d.loop&&d.slice===1,'Slicer not held');else assert(d.keyShift===1,'Pitch not held');
   const previews=[...document.querySelectorAll('.library-wave-preview img')].filter(n=>n.complete&&n.naturalWidth).map(node=>({node,src:node.src}));assert(previews.length,'Ready previews missing');
   change('#deck-count','2');await frames();assert(!d.playing&&!d.processing&&!d.playQueued&&!engine.voices.has(3),'Hidden deck not stopped');
   const hidden={playing:d.playing,loop:d.loop,loopIn:d.loopIn,loopOut:d.loopOut,slice:d.slice};if(mode==='Slicer')assert(!d.loop&&d.loopIn===0&&d.loopOut===0&&d.slice==null,'Temporary slice fields survived hide');
   change('#deck-count','4');click('[data-action="play"][data-deck="3"]');await until(()=>d.playing&&!d.processing&&engine.voices.has(3),'Fresh normal Play');
   const voice=engine.voices.get(3),token=engine.startTokens.get(3),position=engine.position(d),controls=[...document.querySelectorAll('.deck button,.channel-strip input,#crossfader')];
   key('keyup');await until(()=>engine.ctx.currentTime>d.anchorTime+.05,'Scheduled fresh start');
   report.releaseObservation={mode,playing:d.playing,sameVoice:engine.voices.get(3)===voice,tokenBefore:token,tokenAfter:engine.startTokens.get(3),positionBefore:position,positionAfter:engine.position(d),contextTime:engine.ctx.currentTime,anchorTime:d.anchorTime};
   assert(d.playing&&engine.voices.get(3)===voice&&engine.startTokens.get(3)===token&&engine.position(d)>position,'Old release changed fresh Play');
   assert(siblings.every(s=>s.d.playing&&engine.voices.get(s.d.index)===s.voice&&s.d.rate===s.rate),'Sibling transport changed');
   assert(controls.every(n=>n.isConnected)&&previews.every(p=>p.node.isConnected&&p.node.src===p.src),'Release replaced controls or previews');
   report.cases.push({mode,during,hidden,freshPlayContinued:true,sourceToken:token,siblingVoicesAndRatesRetained:true,releaseControlsRetained:controls.length,readyPreviewsRetained:previews.length,physicalMuted:engine.audioMonitor.snapshot().physicalMuted});engine.pause(d);
  }
  state.decks.forEach(d=>engine.pause(d));await until(()=>$('#master-peak-value').textContent==='−∞','Settled stopped meter');await frames();
  let writes=0;const observer=new MutationObserver(entries=>writes+=entries.length);
  for(const id of ['#master-meter','#master-limit'])observer.observe($(id),{attributes:true,attributeFilter:['value','aria-valuetext','aria-label']});
  await sleep(1000);observer.disconnect();report.idleMaster={attributeWrites:writes,meter:$('#master-meter').value,peak:$('#master-peak-value').textContent,limiter:$('#master-limit').getAttribute('aria-label')};
  assert(writes===0&&report.idleMaster.meter===-60,'Stopped master presentation still mutates');report.completed=true;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 finally{
  key('keyup');state.autoplay=false;state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();engine.audioMonitor?.mutePhysical(true);await frames();
  for(const [name,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(state.settings,name,descriptor);else delete state.settings[name];}
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
