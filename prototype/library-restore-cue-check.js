import {createLibraryBackup} from './library-state.js';
import {sessionKey} from './session-storage.js';

// Isolated generated session: hold one real resume result before Cue can start audio.
export async function runLibraryRestoreCueCheck({state,engine}){
 const assert=(ok,message)=>{if(!ok)throw Error(message);},sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const $=selector=>document.querySelector(selector),click=selector=>{assert($(selector),'Missing '+selector);$(selector).click();};
 const key=type=>document.body.dispatchEvent(new KeyboardEvent(type,{key:'i',code:'KeyI',bubbles:true,cancelable:true}));
 async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
 async function hashes(){return Object.fromEntries(await Promise.all(['panels.js','engine.js','holds.js','library-restore-cue-check.js'].map(async file=>{
  const response=await fetch(file,{cache:'no-store'});assert(response.ok,'Cannot hash '+file);
  return[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')];
 })));}
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual generated-only four-deck Compact workspace and Cue/restore handlers. Real AudioContext resume result deliberately held; synthetic Cue keys and FileList, not physical input, natural latency, PCM/listening or pop proof.'};
 const settings=Object.fromEntries(['Playback Keys Use Shift','Use Auto Gain'].map(k=>[k,Object.getOwnPropertyDescriptor(state.settings,k)]));
 const resume=engine.resume,resumeOwn=Object.getOwnPropertyDescriptor(engine,'resume'),fileText=File.prototype.text;
 let release,finished,entered=false,held=false,reads=0;
 assert(state.tracks.length&&state.tracks.every(t=>t.demo),'Generated-only session required');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Start stopped without recording');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');await until(()=>!state.analysis,'Startup analysis');
  state.autoplay=false;Object.assign(state.settings,{'Playback Keys Use Shift':false,'Use Auto Gain':false});
  for(const [selector,value]of [['#deck-count','4'],['#preview-density','compact']]){const input=$(selector);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));}
  const d=state.decks[0];await engine.buffer(d.track);assert(Math.abs(engine.position(d)-d.cue)<.04,'Start paused at Cue');
  await until(()=>$('.library-wave-preview img')?.naturalWidth,'Ready preview');
  const gate=new Promise(r=>release=r);let finish;finished=new Promise(r=>finish=r);
  engine.resume=async function(...args){await resume.apply(this,args);if(!held){held=true;entered=true;try{await gate;}finally{finish();}}};
  key('keydown');await until(()=>entered&&d.processing,'Pending Cue');
  assert(!d.playing&&!d.playQueued&&!engine.voices.has(d.index),'Cue started before preparation completed');
  const token=engine.startTokens.get(d.index),metadata=JSON.stringify(createLibraryBackup(state)),stored=localStorage.getItem(sessionKey);
  const controls=[...document.querySelectorAll('.deck button,.deck input,.deck select,#mixer input,.rb-mixer-band input')];
  const previews=[...document.querySelectorAll('.library-wave-preview img')].filter(n=>n.complete&&n.naturalWidth).map(n=>({node:n,src:n.src}));
  click('#library-tools');const input=$('#restore-library'),files=new DataTransfer();
  files.items.add(new File([JSON.stringify({format:'open-play-prototype-1',crates:[],settings:{},tags:[{id:d.track.id,title:'Unexpected replacement'}]})],'cue-admission.json',{type:'application/json'}));
  input.files=files.files;File.prototype.text=function(...args){if(this.name==='cue-admission.json')reads++;return fileText.apply(this,args);};
  await input.onchange({target:input});
  report.admission={message:$('#library-tool-result').textContent,reads,processing:d.processing,playing:d.playing,tokenUnchanged:engine.startTokens.get(d.index)===token,metadataUnchanged:JSON.stringify(createLibraryBackup(state))===metadata,storedUnchanged:localStorage.getItem(sessionKey)===stored,controls:controls.length,controlsRetained:controls.every(n=>n.isConnected),readyPreviews:previews.length,previewsRetained:previews.every(p=>p.node.isConnected&&p.node.src===p.src)};
  const a=report.admission;assert(/pause.*prepar/i.test(a.message),'Missing preparation warning');
  assert(reads===0&&a.processing&&!a.playing&&a.tokenUnchanged&&a.metadataUnchanged&&a.storedUnchanged,'Restore disturbed pending Cue or read the backup');
  assert(a.controlsRetained&&a.previewsRetained,'Restore replaced controls/previews');report.completed=true;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 finally{
  if($('#modal')?.open)click('#modal-close');key('keyup');state.decks.forEach(d=>engine.pause(d));release?.();if(entered&&finished)await finished;
  if(resumeOwn)Object.defineProperty(engine,'resume',resumeOwn);else delete engine.resume;File.prototype.text=fileText;
  await sleep(0);state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();engine.audioMonitor?.mutePhysical(true);
  for(const [key,descriptor]of Object.entries(settings)){if(descriptor)Object.defineProperty(state.settings,key,descriptor);else delete state.settings[key];}
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0&&engine.retiringVoices.size===0,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,methodsRestored:engine.resume===resume&&File.prototype.text===fileText};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
