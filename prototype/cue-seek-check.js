// Isolated diagnostic: real Cue press/release and overview handlers; hold one real buffer result.
export async function runCueSeekCheck({state,engine}){
 const assert=(value,message)=>{if(!value)throw Error(message);},sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 const key=type=>document.body.dispatchEvent(new KeyboardEvent(type,{key:'i',code:'KeyI',bubbles:true,cancelable:true}));
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','holds.js','cue-seek-check.js'].map(async file=>{
  const r=await fetch(file,{cache:'no-store'});assert(r.ok,'Cannot hash '+file);
  return[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')];
 })));}
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Generated-only four-deck workspace, real AudioContext and source buffer, installed Cue I down/up and overview ArrowRight handlers. A real buffer result is deliberately held before start continuation. Synthetic key events, not natural decode latency, PCM/listening/hardware or generic Sync-pop proof.'};
 const settings=Object.fromEntries(['Sync Mode','Playback Keys Use Shift','Use Auto Gain'].map(k=>[k,Object.getOwnPropertyDescriptor(state.settings,k)]));
 let buffer,bufferOwn,release,finished,entered=false,held=false;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only session required');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Start stopped with no recording');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');await until(()=>!state.analysis,'Startup analysis');
  state.autoplay=false;Object.assign(state.settings,{'Sync Mode':'Off','Playback Keys Use Shift':false,'Use Auto Gain':false});
  const count=document.querySelector('#deck-count');count.value='4';count.dispatchEvent(new Event('change',{bubbles:true}));
  await until(()=>document.querySelectorAll('.deck').length===4,'Four decks');
  const d=state.decks[0],track=d.track;assert(track?.demo,'Generated deck A required');await engine.buffer(track);await frames();
  assert(Math.abs(engine.position(d)-d.cue)<.04,'Start paused at the temporary Cue');
  const controls=[...document.querySelectorAll('.deck button,.deck input,.deck select,#mixer input,.rb-mixer-band input')];
  const previews=[...document.querySelectorAll('.library-wave-preview img')].filter(n=>n.complete&&n.naturalWidth).map(n=>({node:n,src:n.src,key:n.closest('.library-wave-preview').dataset.previewKey}));
  assert(previews.length,'Ready previews missing');
  buffer=engine.buffer;bufferOwn=Object.getOwnPropertyDescriptor(engine,'buffer');
  const gate=new Promise(resolve=>release=resolve);let finish;finished=new Promise(resolve=>finish=resolve);
  engine.buffer=async function(...args){const result=await buffer.apply(this,args);if(args[0]===track&&!held){held=true;entered=true;try{await gate;}finally{finish();}}return result;};
  key('keydown');await until(()=>entered&&d.processing,'Cue preparation');key('keyup');
  await until(()=>!d.playing&&!d.processing&&!d.playQueued,'Cue release');
  const overview=document.querySelector('[data-seek="0"]'),before=engine.position(d);
  overview.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',code:'ArrowRight',bubbles:true,cancelable:true}));
  await until(()=>engine.position(d)>before+.9,'Newer overview seek');
  const position=engine.position(d),token=engine.startTokens.get(0);report.newerSeek={position,token,playing:d.playing};
  release();await finished;await frames();
  report.afterRelease={position:engine.position(d),token:engine.startTokens.get(0),playing:d.playing,voice:engine.voices.has(0),controls:controls.length,controlsRetained:controls.filter(n=>n.isConnected).length,readyPreviews:previews.length,previewsRetained:previews.every(p=>p.node.isConnected&&p.node.src===p.src&&p.node.closest('.library-wave-preview').dataset.previewKey===p.key)};
  assert(engine.position(d)===position,'Older released Cue moved the newer overview seek');
  assert(engine.startTokens.get(0)===token,'Older released Cue paused a newer transport owner');
  assert(!d.playing&&!engine.voices.has(0),'Released Cue unexpectedly started');
  assert(controls.every(n=>n.isConnected)&&report.afterRelease.previewsRetained,'Controls or ready previews changed');report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  release?.();if(entered&&finished){try{await finished;}catch{}}
  if(buffer){if(bufferOwn)Object.defineProperty(engine,'buffer',bufferOwn);else delete engine.buffer;}
  key('keyup');state.autoplay=false;state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();await frames();state.decks.forEach(d=>engine.pause(d));engine.audioMonitor?.mutePhysical(true);
  for(const [key,descriptor]of Object.entries(settings)){if(descriptor)Object.defineProperty(state.settings,key,descriptor);else delete state.settings[key];}
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0&&engine.retiringVoices.size===0,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,methodRestored:!buffer||engine.buffer===buffer};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
