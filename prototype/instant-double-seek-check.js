// Isolated diagnostic: normal Double and overview-key handlers, one delayed incoming FX call.
export async function runInstantDoubleSeekCheck({state,engine}){
 const assert=(value,message)=>{if(!value)throw Error(message);},sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(5);}}
 const click=selector=>{const node=document.querySelector(selector);assert(node&&!node.disabled,'Unavailable '+selector);node.click();};
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','instant-double.js','instant-double-seek-check.js'].map(async file=>{
  const response=await fetch(file,{cache:'no-store'});assert(response.ok,'Cannot hash '+file);
  return[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')];
 })));}
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual generated-only four-deck workspace, native AudioContext/raw voice, installed Double and overview ArrowRight handlers. One incoming FX call is held before real delegation. Synthetic keyboard event; not natural race frequency, PCM, music/listening, controller or startup-pop diagnosis.'};
 const saved=Object.fromEntries(['Sync Mode','Instant Doubles','Lock Playing Deck','Use Auto Gain'].map(k=>[k,Object.getOwnPropertyDescriptor(state.settings,k)]));
 let rate,fx,rateOwn,fxOwn,release,rateFinished,gateEntered=false,depth=0,held=false;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only session required');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'All decks/recording must start stopped');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');await until(()=>!state.analysis,'Startup analysis');
  state.autoplay=false;Object.assign(state.settings,{'Sync Mode':'Off','Instant Doubles':false,'Lock Playing Deck':false,'Use Auto Gain':false});
  const count=document.querySelector('#deck-count');count.value='4';count.dispatchEvent(new Event('change',{bubbles:true}));
  await until(()=>document.querySelectorAll('.deck').length===4,'Four decks');
  const a=state.decks[0],b=state.decks[1];assert(a.track?.demo&&b.track?.demo,'Generated A/B required');
  await engine.buffer(a.track);click('[data-action=play][data-deck="0"]');await until(()=>a.playing,'Source Play');
  const sourceVoice=engine.voices.get(0),sourceRate=a.rate;assert(sourceVoice,'Source voice missing');
  const gate=new Promise(resolve=>release=resolve);let finish;
  rateFinished=new Promise(resolve=>finish=resolve);rate=engine.setRate;fx=engine.applyChannelFX;
  rateOwn=Object.getOwnPropertyDescriptor(engine,'setRate');fxOwn=Object.getOwnPropertyDescriptor(engine,'applyChannelFX');
  engine.setRate=async function(...args){const incoming=args[0]===b;if(incoming)depth++;try{return await rate.apply(this,args);}finally{if(incoming&&!--depth)finish();}};
  engine.applyChannelFX=async function(...args){if(args[0]===1&&depth&&!held){held=true;gateEntered=true;await gate;}return fx.apply(this,args);};
  click('[data-action=double][data-deck="1"]');await until(()=>gateEntered,'Incoming FX preparation');await frames();
  assert(b.track===a.track&&!b.playing&&!engine.voices.has(1),'Double must be paused after its normal Load');
  const controls=[...document.querySelectorAll('.deck button,.deck input,.deck select,#mixer input,.rb-mixer-band input')];
  const previews=[...document.querySelectorAll('.library-wave-preview img')].filter(n=>n.complete&&n.naturalWidth).map(n=>({node:n,src:n.src,key:n.closest('.library-wave-preview').dataset.previewKey}));
  assert(previews.length>0,'Ready library previews missing');
  const overview=document.querySelector('[data-seek="1"]'),before=engine.position(b);
  overview.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',code:'ArrowRight',bubbles:true,cancelable:true}));
  await until(()=>engine.position(b)>before+.9,'Newer overview seek');
  const position=engine.position(b),token=engine.startTokens.get(1);
  report.newerSeek={position,token,playing:b.playing,voice:engine.voices.has(1)};
  assert(!b.playing&&!engine.voices.has(1),'Newer seek must remain paused');
  release();await rateFinished;await frames();
  report.afterRelease={position:engine.position(b),token:engine.startTokens.get(1),playing:b.playing,voice:engine.voices.has(1),sourceVoiceRetained:engine.voices.get(0)===sourceVoice,sourceRate:a.rate,controlsRetained:controls.filter(n=>n.isConnected).length,controls:controls.length,readyPreviews:previews.length,previewsRetained:previews.every(p=>p.node.isConnected&&p.node.src===p.src&&p.node.closest('.library-wave-preview').dataset.previewKey===p.key)};
  assert(!b.playing&&!engine.voices.has(1),'Older Double started incoming audio after the newer seek');
  assert(engine.position(b)===position&&engine.startTokens.get(1)===token,'Older Double displaced newer seek ownership');
  assert(a.playing&&a.rate===sourceRate&&engine.voices.get(0)===sourceVoice,'Outgoing source changed');
  assert(controls.every(n=>n.isConnected)&&report.afterRelease.previewsRetained,'Controls or ready previews changed');
  report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  release?.();if(gateEntered&&rateFinished){try{await rateFinished;}catch{}}
  if(rate){if(rateOwn)Object.defineProperty(engine,'setRate',rateOwn);else delete engine.setRate;}
  if(fx){if(fxOwn)Object.defineProperty(engine,'applyChannelFX',fxOwn);else delete engine.applyChannelFX;}
  state.autoplay=false;state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();await frames();state.decks.forEach(d=>engine.pause(d));engine.audioMonitor?.mutePhysical(true);
  for(const [key,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(state.settings,key,descriptor);else delete state.settings[key];}
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0&&engine.retiringVoices.size===0,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,methodsRestored:!rate||engine.setRate===rate&&engine.applyChannelFX===fx};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
