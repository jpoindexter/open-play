import {runOutputLevelCheck} from './output-level-check.js';
import {runPlayingControlsCheck} from './playing-controls-check.js';
import {runHiddenDeckCheck} from './hidden-deck-check.js';
import {runLibraryRestoreCueCheck} from './library-restore-cue-check.js';
import {runSimpleGridSyncCheck} from './simple-grid-sync-check.js';
import {runCueSeekCheck} from './cue-seek-check.js';
import {runInstantDoubleSeekCheck} from './instant-double-seek-check.js';
import {runJogFocusCheck} from './jog-focus-check.js';
import {runJogSyncReleaseCheck} from './jog-sync-release-check.js';
import {runFreshJogHandoffCheck} from './fresh-jog-handoff-check.js';
import {runTempoOnlyOffCheck} from './tempo-only-off-check.js';
import {runManualLoopLoadCheck} from './manual-loop-load-check.js';
import {runLiveKeyFailureCheck} from './live-key-failure-check.js';
import {runGridCancelPlayCheck} from './grid-cancel-play-check.js';
import {runLoopPadRecallCheck} from './loop-pad-recall-check.js';
const $=selector=>document.querySelector(selector),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw Error(message);};
const disableRuns=()=>document.querySelectorAll('section[aria-label="Isolated core ownership check"] button').forEach(button=>button.disabled=true);
async function until(check,label){const end=performance.now()+15000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
function generatedWAV(){
 const rate=22050,frames=rate*2,bytes=new ArrayBuffer(44+frames*2),v=new DataView(bytes);
 const text=(offset,s)=>[...s].forEach((c,i)=>v.setUint8(offset+i,c.charCodeAt(0)));
 text(0,'RIFF');v.setUint32(4,bytes.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,frames*2,true);
 for(let n=0;n<frames;n++)v.setInt16(44+n*2,1500*Math.sin(2*Math.PI*330*n/rate),true);
 return bytes;
}
const key=(type,k,code)=>document.body.dispatchEvent(new KeyboardEvent(type,{key:k,code,bubbles:true,cancelable:true}));
const click=selector=>{assert($(selector),'Missing '+selector);$(selector).click();};
async function run(){
 disableRuns();const app=window.openPlay,{state,engine}=app;
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual packaged workspace/engine and natural End; generated WAV with controlled shared file-read completion. Renderer blur dispatched, not OS focus/physical/listening proof.',cases:[]};
 let release;
 try{
  engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(state.tracks.every(t=>t.demo),'Only generated demo tracks allowed');
  state.settings['Lock Playing Deck']=false;state.settings['Instant Doubles']=false;state.settings['Use Auto Gain']=false;state.settings['Playback Keys Use Shift']=false;
  state.tracks.forEach(t=>t.analyzed=true);
  $('#deck-count').value='4';$('#deck-count').dispatchEvent(new Event('change',{bubbles:true}));
  $('#preview-density').value='compact';$('#preview-density').dispatchEvent(new Event('change',{bubbles:true}));
  const ordered=state.tracks.filter(t=>!t.provider).sort((a,b)=>a.title.localeCompare(b.title)),old=ordered[0],next=ordered[1],d=state.decks[0],bytes=generatedWAV();
  for(const action of ['manual-play','manual-stop','temporary-cue']){
   state.autoplay=false;state.selected=old.id;click('[data-action="load"][data-deck="0"]');await until(()=>d.track===old&&engine.buffers.has(old.id),'Original fixture load');await sleep(20);
   Object.assign(d,{repeat:false,sync:false,rate:1,keylock:false,keyShift:0,reverse:false,loop:false});
   await until(()=>!engine.bufferLoads.has(next.id),'Initial preview decode');
   engine.buffers.delete(next.id);let entered=false;const read=new Promise(resolve=>release=resolve);
   next.file={async arrayBuffer(){entered=true;await read;return bytes.slice(0);}};
   state.autoplay=true;await engine.seek(d,old.duration-.03);click('[data-action="play"][data-deck="0"]');
   await until(()=>entered&&d.track===next,'Natural End pending file read');
   assert(engine.bufferLoads.has(next.id),'Expected shared pending decode');
   await until(()=>document.querySelector('.library-wave-preview img'),'Materialized library preview');
   const controls=[...document.querySelectorAll('.deck button,.channel-strip input,#crossfader,.library-wave-preview img')],plays=next.plays;
   if(action==='temporary-cue')key('keydown','i','KeyI');else click('[data-action="play"][data-deck="0"]');
   await until(()=>d.processing||d.playQueued,'Manual request waiting for shared decode');
   if(action==='manual-stop'){click('[data-action="play"][data-deck="0"]');await until(()=>!d.processing&&!d.playQueued,'Manual Stop');}
   const token=engine.startTokens.get(0);release();await until(()=>!engine.bufferLoads.has(next.id)&&!d.processing&&!d.playQueued,'Decode completion');
   if(action==='temporary-cue'){assert(d.playing,'Cue audition did not start');key('keyup','i','KeyI');await until(()=>!d.playing&&!d.processing,'Cue release');}
   await sleep(100);
   assert(d.playing===(action==='manual-play'),'Old Autoplay changed '+action);
   assert(engine.voices.has(0)===d.playing,'Voice and transport state disagree');
   if(action!=='temporary-cue')assert(engine.startTokens.get(0)===token,'Old Autoplay replaced manual transport');
   assert(next.plays===plays+(action==='manual-play'?1:0),'Unexpected counted playback');
   assert(controls.every(node=>node.isConnected),'Completion replaced controls/previews');
   assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute changed');
   report.cases.push({action,playing:d.playing,voice:engine.voices.has(0),playCountDelta:next.plays-plays,controlsAndPreviewsRetained:controls.length,previews:document.querySelectorAll('.library-wave-preview img').length,physicalMuted:true});
   state.autoplay=false;engine.pause(d);
  }
  report.jog=await runJogFocusCheck(app);report.completed=true;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 finally{
  release?.();state.autoplay=false;key('keyup','i','KeyI');state.decks.forEach(d=>engine.pause(d));engine.audioMonitor?.mutePhysical(true);
  report.allStopped=state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued);report.physicalMuted=!!engine.audioMonitor?.snapshot().physicalMuted;
  report.completed=report.completed&&report.allStopped&&report.physicalMuted;report.finishedAt=new Date().toISOString();
  $('#ownership-result').value=JSON.stringify(report);$('#ownership-status').textContent=report.completed&&report.allStopped?'Scoped check passed; all audio stopped':'Check failed: '+(report.error?.message||'cleanup');
 }
}
async function runJogSync(){
 disableRuns();
 $('#ownership-status').textContent='Running muted jog/Sync release check…';
 try{
  const report=await runJogSyncReleaseCheck(window.openPlay);
  $('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Jog/Sync release check passed; all audio stopped':'Jog/Sync release check failed: '+(report.error?.message||report.sourceError||'cleanup or source identity');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Jog/Sync diagnostic failed: '+error.message;}
}
async function runFreshJog(){
 disableRuns();
 $('#ownership-status').textContent='Running muted fresh-jog handoff check…';
 try{
  const report=await runFreshJogHandoffCheck(window.openPlay);
  $('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Fresh-jog handoff check passed; all audio stopped':'Fresh-jog handoff '+report.observation+': '+(report.error?.message||report.sourceError||'cleanup or source identity');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Fresh-jog diagnostic failed: '+error.message;}
}
async function runTempoOff(){
 disableRuns();
 $('#ownership-status').textContent='Running muted tempo-only Sync OFF check…';
 try{
  const report=await runTempoOnlyOffCheck(window.openPlay);
  $('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Tempo-only Sync OFF check passed; all audio stopped':'Tempo-only Sync OFF check failed: '+(report.error?.message||report.sourceError||'cleanup or source identity');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Tempo-only Sync OFF diagnostic failed: '+error.message;}
}
async function runManualLoopLoad(){
 disableRuns();
 $('#ownership-status').textContent='Running muted saved-loop Load check…';
 try{
  const report=await runManualLoopLoadCheck(window.openPlay);
  $('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Saved-loop Load check passed; all audio stopped':'Saved-loop Load check failed: '+(report.error?.message||report.sourceError||'cleanup or source identity');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Saved-loop Load diagnostic failed: '+error.message;}
}
async function runLiveKeyFailure(){
 disableRuns();
 $('#ownership-status').textContent='Running muted old live-key failure check…';
 try{
  const report=await runLiveKeyFailureCheck(window.openPlay);
  $('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Old live-key failure check passed; all audio stopped':'Old live-key failure check failed: '+(report.error?.message||report.sourceError||'cleanup or source identity');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Old live-key failure diagnostic failed: '+error.message;}
}
async function runGridCancelPlay(){
 disableRuns();
 $('#ownership-status').textContent='Running muted grid cancellation/new Play check…';
 try{
  const report=await runGridCancelPlayCheck(window.openPlay);
  $('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Grid cancellation/new Play check passed; all audio stopped':'Grid cancellation/new Play check failed: '+(report.error?.message||report.sourceError||'cleanup or source identity');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Grid cancellation/new Play diagnostic failed: '+error.message;}
}
async function runLoopPadRecall(queuedAuto=false){
 disableRuns();const label=queuedAuto?'Queued Auto Loop/newer recall':'Cold Beat Jump/newer recall';$('#ownership-status').textContent='Running muted '+label+' check…';
 try{
  const report=await runLoopPadRecallCheck(window.openPlay,queuedAuto);
  $('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?label+' check passed; all audio stopped':label+' check failed: '+(report.error?.message||report.sourceError||'cleanup');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Cold Beat Jump diagnostic failed: '+error.message;}
}
async function runDoubleSeek(){
 disableRuns();$('#ownership-status').textContent='Running muted Instant Double/newer seek check…';
 try{
  const report=await runInstantDoubleSeekCheck(window.openPlay);$('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Instant Double/newer seek check passed; all audio stopped':'Instant Double/newer seek check failed: '+(report.error?.message||report.sourceError||'cleanup');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Instant Double diagnostic failed: '+error.message;}
}
async function runCueSeek(){
 disableRuns();$('#ownership-status').textContent='Running muted released Cue/newer seek check…';
 try{
  const report=await runCueSeekCheck(window.openPlay);$('#ownership-result').value=JSON.stringify(report);
  $('#ownership-status').textContent=report.completed?'Released Cue/newer seek check passed; all audio stopped':'Released Cue/newer seek check failed: '+(report.error?.message||report.sourceError||'cleanup');
 }catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Cue diagnostic failed: '+error.message;}
}
async function runOutputLevel(){
 disableRuns();$('#ownership-status').textContent='Running muted real-track output-level check…';
 try{const report=await runOutputLevelCheck(window.openPlay);$('#ownership-result').value=JSON.stringify(report);$('#ownership-status').textContent=report.completed?'Output-level check passed; all audio stopped':'Output-level check failed: '+(report.error?.message||'cleanup');}
 catch(error){$('#ownership-status').textContent='Output-level setup failed: '+error.message;}
}
async function runActiveAnalysis(){
 disableRuns();const {state,engine}=window.openPlay,OriginalWorker=window.Worker;
 const report={completed:false,scope:'Actual stopped generated four-deck Load handlers and real analysis worker, with its first message held to force overlap; no listening or latency claim.'};let releaseWorker,workers=0;
 try{
  engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();await until(()=>!state.analysis,'Startup analysis');
  assert(state.tracks.every(t=>t.demo),'Generated-only session required');assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued),'Stop all playback first');
  state.settings['Instant Doubles']=false;
  for(const [selector,value] of [['#deck-count','4'],['#preview-density','compact']]){const node=$(selector);node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));}
  const track=state.tracks.find(t=>!t.analysisResult&&!state.decks.some(d=>d.track===t));assert(track,'Unmeasured generated track required');state.selected=track.id;
  window.Worker=class extends OriginalWorker{
   constructor(url,options){super(url,options);if(new URL(url,location.href).pathname.endsWith('/analysis-worker.js')){
    workers++;if(workers===1)this.postMessage=(...args)=>{releaseWorker=()=>OriginalWorker.prototype.postMessage.apply(this,args);};
   }}
  };
  click('[data-action="load"][data-deck="0"]');await until(()=>!!releaseWorker,'First real worker message');
  const protectedNodes=[...document.querySelectorAll('.deck:not([data-focus="1"]) button,.channel-strip input,#crossfader,.library-wave-preview img')];
  click('[data-action="load"][data-deck="1"]');await until(()=>state.decks[1].track===track,'Second Load');await sleep(0);
  assert(state.analysis,'Worker must still be pending during overlapping Load');releaseWorker();releaseWorker=null;await until(()=>!state.analysis,'Real analysis completion');
  assert(workers===1,'Duplicate analysis workers: '+workers);assert(/Finished: 1 measured, 0 failed/.test(state.analysisStatus),'Unexpected analysis completion: '+state.analysisStatus);
  assert(track.analysisResult?.measuredAt,'Real worker result missing');assert(protectedNodes.every(node=>node.isConnected),'Load/analysis replaced unrelated controls or previews');
  report.workers=workers;report.status=state.analysisStatus;report.measuredAt=track.analysisResult.measuredAt;report.track=track.id;
  report.protectedNodes=protectedNodes.length;report.previews=document.querySelectorAll('.library-wave-preview img').length;
  report.controls={play:document.querySelectorAll('[data-action="play"]').length,tempo:document.querySelectorAll('[data-tempo]').length,eq:document.querySelectorAll('[data-mix$=":high"],[data-mix$=":mid"],[data-mix$=":low"]').length};
  assert(report.controls.play===4&&report.controls.tempo===4&&report.controls.eq===12&&report.previews>0,'Core controls or previews missing');report.completed=true;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 finally{
  releaseWorker?.();window.Worker=OriginalWorker;state.decks.forEach(d=>engine.pause(d));engine.audioMonitor?.mutePhysical(true);
  report.allStopped=state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued);report.physicalMuted=!!engine.audioMonitor?.snapshot().physicalMuted;report.workerConstructorRestored=window.Worker===OriginalWorker;
  report.completed=report.completed&&report.allStopped&&report.physicalMuted&&report.workerConstructorRestored;
  $('#ownership-result').value=JSON.stringify(report);$('#ownership-status').textContent=report.completed?'Active analysis reuse passed; all audio stopped':'Active analysis reuse failed: '+(report.error?.message||'cleanup');
 }
}
async function runSimpleGrid(action='incoming-grid'){
 disableRuns();const label='Simple Sync/'+action;$('#ownership-status').textContent='Running muted '+label+' check…';
 try{const report=await runSimpleGridSyncCheck(window.openPlay,action);$('#ownership-result').value=JSON.stringify(report);$('#ownership-status').textContent=report.completed?label+' check passed; all audio stopped':label+' check failed: '+(report.error?.message||report.sourceError||'cleanup');}
 catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:{message:error.message,stack:error.stack}});$('#ownership-status').textContent='Simple Sync diagnostic failed: '+error.message;}
}
async function boot(){
 const parsed=new DOMParser().parseFromString(await(await fetch('workspace-preview.html')).text(),'text/html');
 for(const node of [...parsed.body.children])if(node.tagName!=='SCRIPT')document.body.append(node);
 await import('./layout-preview.js');await until(()=>window.openPlay?.state.decks.length>=2&&$('[data-action="play"][data-deck="1"]'),'Workspace startup');
 $('#hidden-deck-run').onclick=async()=>{
  disableRuns();$('#ownership-status').textContent='Running muted hidden-deck holds check…';
  try{const report=await runHiddenDeckCheck(window.openPlay);$('#ownership-result').value=JSON.stringify(report);$('#ownership-status').textContent=report.completed?'Hidden-deck holds check passed; all audio stopped':'Hidden-deck check failed: '+(report.error?.message||'cleanup');}
  catch(error){$('#ownership-status').textContent='Hidden-deck setup failed: '+error.message;}
 };$('#hidden-deck-run').disabled=false;
 $('#playing-controls-run').onclick=async()=>{
  disableRuns();$('#ownership-status').textContent='Running muted four-real-track control retention check…';
  try{const report=await runPlayingControlsCheck(window.openPlay);$('#ownership-result').value=JSON.stringify(report);$('#ownership-status').textContent=report.completed?'Playing controls check passed; all audio stopped':'Playing controls check failed: '+(report.error?.message||'cleanup');}
  catch(error){$('#ownership-result').value=JSON.stringify({completed:false,error:error.message});$('#ownership-status').textContent='Import four real tracks and stop playback: '+error.message;}
 };$('#playing-controls-run').disabled=false;
 $('#restore-cue-run').onclick=async()=>{
  disableRuns();$('#ownership-status').textContent='Running muted Cue/backup admission check…';
  try{const report=await runLibraryRestoreCueCheck(window.openPlay);$('#ownership-result').value=JSON.stringify(report);$('#ownership-status').textContent=report.completed?'Cue/backup admission check passed; all audio stopped':'Cue/backup admission check failed: '+(report.error?.message||'cleanup');}
  catch(error){$('#ownership-status').textContent='Cue/backup setup failed: '+error.message;}
 };$('#restore-cue-run').disabled=false;
 $('#output-level-run').onclick=runOutputLevel;$('#output-level-run').disabled=false;
 $('#active-analysis-run').onclick=runActiveAnalysis;$('#active-analysis-run').disabled=false;
 $('#simple-grid-run').onclick=()=>runSimpleGrid();$('#simple-grid-run').disabled=false;
 $('#simple-master-run').onclick=()=>runSimpleGrid('choose-master');$('#simple-master-run').disabled=false;
 for(const action of ['leader-grid','leader-tempo']){const button=$('#simple-'+action+'-run');button.onclick=()=>runSimpleGrid(action);button.disabled=false;}
 $('#cue-seek-run').onclick=runCueSeek;$('#cue-seek-run').disabled=false;
 $('#double-seek-run').onclick=runDoubleSeek;$('#double-seek-run').disabled=false;
 $('#ownership-run').onclick=run;$('#ownership-run').disabled=false;$('#ownership-run').textContent='Run one muted core ownership check';$('#ownership-status').textContent='Ready';
 $('#jog-sync-run').onclick=runJogSync;$('#jog-sync-run').disabled=false;
 $('#fresh-jog-run').onclick=runFreshJog;$('#fresh-jog-run').disabled=false;
 $('#tempo-off-run').onclick=runTempoOff;$('#tempo-off-run').disabled=false;
 $('#manual-loop-load-run').onclick=runManualLoopLoad;$('#manual-loop-load-run').disabled=false;
 $('#live-key-failure-run').onclick=runLiveKeyFailure;$('#live-key-failure-run').disabled=false;
 $('#grid-cancel-play-run').onclick=runGridCancelPlay;$('#grid-cancel-play-run').disabled=false;
 $('#beat-jump-recall-run').onclick=()=>runLoopPadRecall();$('#beat-jump-recall-run').disabled=false;
 $('#queued-auto-recall-run').onclick=()=>runLoopPadRecall(true);$('#queued-auto-recall-run').disabled=false;
}
boot().catch(error=>$('#ownership-status').textContent='Startup failed: '+error.message);
