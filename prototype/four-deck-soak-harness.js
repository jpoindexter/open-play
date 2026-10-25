import {sessionKey} from './session-storage.js';
import {sourceWaveformState,sourceWaveformRasterUsage} from './source-waveform.js';
import {createBeatgrid} from './beatgrid.js';
import {installFourDeckTrace} from './four-deck-trace.js';
import {checkAnalysis} from './four-deck-analysis-check.js';
import {checkSyncOverlap,checkSyncCancellation} from './four-deck-overlap-check.js';
const traceMode=new URL(location.href).searchParams.has('trace'),trace=traceMode?installFourDeckTrace():null;
const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(ok,text)=>{if(!ok)throw Error(text);};
const report={trace:trace?.report,scope:'Unattended real-track four-deck GUI session; physically muted. Declared grid phase and finite/gap telemetry do not establish musical tightness or pop-free acoustics.',events:[],windows:[],audio:[],errors:[]};
let app,tracks=[],stopping=false,measuring=false,ticks=[],intervals=[],lastFrame,rectangles=0,section='setup',started,longTasks=[];
const raf=window.requestAnimationFrame.bind(window),fill=CanvasRenderingContext2D.prototype.fillRect;
window.requestAnimationFrame=callback=>raf(at=>{const begin=performance.now();try{callback(at);}finally{if(measuring&&callback.name==='tick'){const end=performance.now();ticks.push(end-begin);trace?.frame(callback.name,at,begin,end);if(lastFrame)intervals.push(at-lastFrame);lastFrame=at;}}});
CanvasRenderingContext2D.prototype.fillRect=function(...args){if(measuring)rectangles++;return fill.apply(this,args);};
const summary=a=>{a.sort((a,b)=>a-b);return{count:a.length,mean:a.reduce((n,x)=>n+x,0)/(a.length||1),p95:a[Math.floor(a.length*.95)]||0,max:a.at(-1)||0};};
const show=()=>{$('#soak-original').textContent=JSON.stringify(report);$('#soak-result').textContent=JSON.stringify({status:report.status,elapsedSeconds:started?(performance.now()-started)/1000:0,tracks:tracks.map(t=>t.title),events:report.events.slice(-3),latest:report.windows.at(-1),audioSeconds:report.audio.length,errors:report.errors},null,2);};
if(PerformanceObserver.supportedEntryTypes?.includes('longtask'))new PerformanceObserver(list=>{if(measuring)longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})));}).observe({type:'longtask'});
window.addEventListener('unhandledrejection',e=>{report.errors.push(String(e.reason?.stack||e.reason));show();});
document.addEventListener('click',e=>{const button=e.target.closest?.('[data-action=sync]');if(button&&app)report.events.push({type:'sync-input',deck:Number(button.dataset.deck),trusted:e.isTrusted,wall:performance.now(),audio:app.engine.ctx.currentTime});},true);
const event=(type,data={})=>{trace?.note(type,data);report.events.push({type,wall:performance.now(),audio:app?.engine.ctx?.currentTime,...data});show();};
async function until(test,label,seconds=120){const end=performance.now()+seconds*1000;while(!test()){assert(!stopping,'Stopped by operator');assert(performance.now()<end,'Timed out: '+label);await sleep(50);}}
function click(selector){assert($(selector),selector);$(selector).click();}
function select(selector,value){const el=$(selector);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}
function controlCounts(){return{play:document.querySelectorAll('[data-action="play"]').length,tempo:document.querySelectorAll('[data-tempo]').length,eq:document.querySelectorAll('[data-mix$=":low"]').length,scrub:document.querySelectorAll('[data-waveform-scrub]').length,libraryPreviews:document.querySelectorAll('.library-wave-preview img').length};}
function gridPhases(){
 const {state,engine}=app,at=engine.ctx.currentTime,leader=state.decks.find(d=>d.playing&&d.syncRole==='primary');if(!leader)return[];
 const phase=d=>createBeatgrid(d.track).beatAt(engine.voiceClock(d,engine.voices.get(d.index))(at));
 const primary=phase(leader);
 return state.decks.filter(d=>d.playing&&d.syncState==='beat').map(d=>{const delta=((phase(d)-primary)%4+4)%4;return{deck:d.index,errorSeconds:Math.min(delta,4-delta)*60/(leader.track.bpm*leader.rate),keylock:d.keylock,position:engine.position(d),rate:d.rate};});
}
function checkpoint(){
 const {state,engine}=app;
 report.windows.push({section,elapsedSeconds:(performance.now()-started)/1000,tick:summary(ticks),interval:summary(intervals),rectangles,longTasks,physicalMuted:engine.audioMonitor.snapshot().physicalMuted,master:{ready:engine.masterSnapshot().ready,invalid:engine.masterSnapshot().invalid},decoded:engine.decodedBufferUsage(),raster:sourceWaveformRasterUsage(),heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null,controls:controlCounts(),playing:state.decks.filter(d=>d.playing).length,phases:gridPhases(),contextState:engine.ctx.state,visibility:document.visibilityState});ticks=[];intervals=[];rectangles=0;longTasks=[];show();
}
async function load(index,track){
 const contract=new URL(location.href).searchParams.has('loadContract');
 const retained=contract?[...document.querySelectorAll(`.deck:not([data-focus="${index}"]),#detail-wave,.channel-strip,#crossfader,[data-waveform-scrub],[data-waveform-scrub-status],#tracks tbody tr,#tracks .library-wave-preview img`)]:[];
 trace?.note('load-start',{deck:index,track:track.title});
 click(`tr[data-track="${track.id}"]`);click(`[data-action="load"][data-deck="${index}"]`);
 await until(()=>app.state.decks[index].track===track&&app.engine.buffers.has(track.id)&&!app.state.decks[index].processing,'load deck '+index);await sourceWaveformState(app.engine.buffers.get(track.id)).ready;trace?.note('load-profile-ready',{deck:index});
 if(contract){assert(retained.every(node=>node.isConnected),'Load replaced a sibling, mixer, shared waveform or scrub control');(report.loadPreservationChecks??=[]).push({deck:index,track:track.title,retained:retained.length,controls:controlCounts()});}
}
async function sync(index){
 const d=app.state.decks[index];click(`[data-action="sync"][data-deck="${index}"]`);await until(()=>!d.processing&&!d.playQueued,'Sync deck '+index);await sleep(100);
 assert(d.sync,'Sync refused: '+$('#notice')?.textContent);event('sync',{deck:index,playing:d.playing,state:d.syncState,phases:gridPhases()});
}
async function play(index){
 const contract=new URL(location.href).searchParams.has('transportContract'),button=$(`[data-action="play"][data-deck="${index}"]`);
 const libraryContract=new URL(location.href).searchParams.has('libraryContract');
 const nodes=contract?[...document.querySelectorAll('.deck,#detail-wave,.channel-strip,#crossfader'+(libraryContract?',#tracks tbody tr,#tracks .library-wave-preview img':''))]:[];if(contract)button.focus();
 button.click();await until(()=>app.state.decks[index].playing&&!app.state.decks[index].processing&&!app.state.decks[index].playQueued,'Play deck '+index);
 if(contract){
  assert(nodes.every(node=>node.isConnected),'Play replaced a deck, mixer or waveform node');assert(document.activeElement===button,'Play lost keyboard focus');
  assert(button.getAttribute('aria-busy')==='false'&&button.classList.contains('active'),'Play busy/active presentation stale');
  assert(!$(`[data-action="censor"][data-deck="${index}"]`).disabled,'Playing deck lost Censor');
  (report.transportPreservationChecks??=[]).push({deck:index,nodes:nodes.length,focus:true,busy:false,censor:true});
 }
}
async function capture(label,seconds=4){
 const {engine}=app,node=new AudioWorkletNode(engine.ctx,'open-play-fx-tempo-capture-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});engine.masterOutput.output.connect(node);node.connect(engine.ctx.destination);
 const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Capture timeout')),Math.max(15000,(seconds+5)*1000));node.port.onmessage=({data})=>{if(data.type==='done'){clearTimeout(timer);resolve(data);}};node.port.postMessage({type:'capture',id:label,frames:engine.ctx.sampleRate*seconds});});
 engine.masterOutput.output.disconnect(node);node.disconnect();node.port.close();const bytes=new Uint8Array(result.data.buffer),parts=[];
 // Nonfinal chunks are divisible by3 so joined base64 has no internal padding.
 for(let offset=0;offset<bytes.length;offset+=49152){
  let binary='';
  for(let i=offset;i<Math.min(bytes.length,offset+49152);i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(bytes.length,i+16384)));
  parts.push(btoa(binary));
  if(offset+49152<bytes.length)await sleep(0);
 }
 const value=JSON.stringify({label,startFrame:result.startFrame,sampleRate:engine.ctx.sampleRate,pcm:parts.join('')});$('#soak-capture').textContent=value;const archive=document.createElement('pre');archive.hidden=true;archive.dataset.soakCapture=label;archive.textContent=value;$('#soak').append(archive);event('capture',{label,frames:result.data.length});
}
async function boot(){
 const run=new URL(location.href).searchParams.get('run')||'';assert(/^[a-z0-9-]{0,60}$/.test(run),'Invalid owned run label');
 if(run&&globalThis.caches){const open=caches.open.bind(caches);caches.open=name=>open('openplay-four-deck-'+run+'-'+name);}
 assert(['18844','18847'].includes(location.port),'Dedicated diagnostic port18844 or18847 required');const original=localStorage,before=original.getItem(sessionKey),values=new Map(),open=indexedDB.open.bind(indexedDB);
 Object.defineProperty(window,'localStorage',{value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}});indexedDB.open=(name,version)=>open('openplay-four-deck-soak-owned-'+run+'-'+name,version);report.sessionUnchanged=()=>original.getItem(sessionKey)===before;
 localStorage.setItem(sessionKey,JSON.stringify({settings:{'Use Auto Gain':false,'Analyze Stems':false,'Workspace Layout':'rekordbox','Sync Mode':'Smart Sync'}}));
 const parsed=new DOMParser().parseFromString(await(await fetch('workspace-preview.html')).text(),'text/html');for(const a of parsed.body.attributes)document.body.setAttribute(a.name,a.value);for(const link of parsed.querySelectorAll('link[rel=stylesheet]'))document.head.append(link);for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);
 await import('./layout-preview.js');await until(()=>window.openPlay?.state.decks[1].track&&!window.openPlay.state.analysis,'workspace');app=window.openPlay;
 select('#deck-count','4');select('#preview-density','compact');app.engine.audioMonitor.mutePhysical(true);assert(app.engine.audioMonitor.snapshot().physicalMuted,'Physical mute');
 report.sourceHashes=Object.fromEntries(await Promise.all(['app.js','engine.js','smart-sync.js','source-waveform.js','detail-waveform.js','four-deck-soak-harness.js','four-deck-soak-worklet.js','four-deck-trace.js','library-waveform-preview.js','transport-presentation.js','library-rows.js','four-deck-analysis-check.js','analysis.js','analysis-worker.js','track-gain.js','analysis-presentation.js','analysis-input.js','four-deck-overlap-check.js'].map(async f=>[f,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(f,{cache:'no-store'})).arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')])));report.phaseHandoffLoaded=app.engine.setPitch.toString().includes('if(d.playing&&!d.reverse)');
 $('#soak-files').disabled=false;$('#soak-run').textContent='Choose eight tracks first';report.status='Ready for local files';show();
}
$('#soak-files').onchange=async e=>{
 try{
  const files=[...e.target.files];assert(files.length===8,'Choose exactly eight tracks');$('#soak-files').disabled=true;app.state.analysisSettings.onImport=true;
  const input=$('#audio-files'),data=new DataTransfer();files.forEach(file=>data.items.add(file));input.files=data.files;await input.onchange({target:input});
  await until(()=>!app.state.analysis,'native analysis',600);tracks=files.map(file=>app.state.tracks.find(t=>t.filename===file.name||t.file?.name===file.name));assert(tracks.every(t=>t?.bpm>0&&Number.isFinite(t.grid)),'Native analysis requires valid tempo/grid');report.tracks=tracks.map(t=>({id:t.id,title:t.title,duration:t.duration,bpm:t.bpm,grid:t.grid,analysisMethod:t.analysisResult?.tempo?.reason,warpMarkers:t.gridWarpMarkers||[]}));
  for(let i=0;i<4;i++)await load(i,tracks[i]);$('#soak-run').disabled=false;if($('#soak-cancel'))$('#soak-cancel').disabled=false;$('#soak-run').textContent=traceMode?'Run five-minute trace':'Run20-minute four-deck session';report.status='Ready';show();
 }catch(error){report.errors.push(error.stack);report.status='Setup failed';show();}
};
$('#soak-stop').onclick=()=>{stopping=true;app?.engine.silence();report.status='Stopped';show();};
if(new URL(location.href).searchParams.has('syncCancelOnly')){
 const button=document.createElement('button');button.id='soak-cancel';button.disabled=true;button.textContent='Check rapid Sync then OFF once';$('#soak').prepend(button);
 button.onclick=async()=>{
  try{assert(tracks.length===8,'Import the eight tracks first');button.disabled=true;report.status='Checking one cancellation window';
   await checkSyncCancellation({app,click,until,event,report,play,sync});report.status='Cancellation checked; stopped';
  }catch(error){report.errors.push(error.stack);report.status='Cancellation failed or inconclusive';}
  finally{report.cancellation??={};report.cancellation.sessionUnchanged=report.sessionUnchanged();show();}
 };
}
$('#soak-run').onclick=async()=>{
 let meter,timer;
 try{
  $('#soak-run').disabled=true;const {engine,state}=app;await engine.resume();assert(tracks.length===8,'No real tracks');assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute');
  await engine.ctx.audioWorklet.addModule(new URL('./four-deck-soak-worklet.js',import.meta.url));await engine.ctx.audioWorklet.addModule(new URL('./fx-tempo-capture-worklet.js',import.meta.url));
  meter=new AudioWorkletNode(engine.ctx,'open-play-soak-meter',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});engine.masterOutput.output.connect(meter);meter.connect(engine.ctx.destination);meter.port.onmessage=({data})=>report.audio.push({...data,receivedAt:performance.now(),audioTime:engine.ctx.currentTime});
  if(new URL(location.href).searchParams.has('coldAnalysis'))state.settings['Use Auto Gain']=true;
  engine.setMasterDB(-12);for(const d of state.decks){engine.mix(d.index,'level',.35);d.position=12;d.repeat=true;}
  await play(0);await sync(0);for(let i=1;i<4;i++){await sync(i);await play(i);}await until(()=>state.decks.every(d=>d.playing),'all four playing');
  trace?.start();if(trace)for(const name of ['buffer','start','setPitch'])await trace.wrap(engine,name);started=performance.now();measuring=true;section='four horizontal raw';report.status='Running';timer=setInterval(checkpoint,30000);event('session-start',{controls:controlCounts()});void capture('initial');
  for(let turn=0;turn<15;turn++){
   const target=started+(turn+1)*(traceMode?20000:80000);while(performance.now()<target&&!stopping)await sleep(Math.min(1000,target-performance.now()));assert(!stopping,'Stopped by operator');
   if(turn===4){for(const index of [1,3]){click(`[data-action="keylock"][data-deck="${index}"]`);await until(()=>!state.decks[index].processing,'key lock');}section='four horizontal two keylocks';event('keylocks-two',{phases:gridPhases()});await capture('keylocks-two');assert(gridPhases().every(p=>p.errorSeconds<.005),'Keylock enable lost declared-grid phase');}
   if(turn===7){select('#preview-orientation','vertical');section='four vertical two keylocks';event('vertical');}
   if(turn===10){for(const index of [0,2]){click(`[data-action="keylock"][data-deck="${index}"]`);await until(()=>!state.decks[index].processing,'key lock');}select('#preview-orientation','horizontal');section='four horizontal four keylocks';event('keylocks-four',{phases:gridPhases()});await capture('keylocks-four');assert(gridPhases().every(p=>p.errorSeconds<.005),'Four keylock enable lost declared-grid phase');}
   const index=(turn+1)%4,d=state.decks[index];if(d.syncRole==='primary'){const next=state.decks[(index+1)%4];click(`[data-action="syncMaster"][data-deck="${next.index}"]`);await sleep(100);}
   click(`[data-action="play"][data-deck="${index}"]`);await until(()=>!d.playing,'pause replacement');const next=tracks[(turn+4)%tracks.length];await load(index,next);d.position=12;await sync(index);await play(index);await sleep(250);
   assert(state.decks.every(d=>d.playing&&!d.processing),'A deck stopped');assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute lost');const phases=gridPhases();assert(phases.every(p=>p.errorSeconds<.005),'Declared-grid phase exceeded5ms');assert(sourceWaveformRasterUsage().bytes<=32*1024*1024,'Raster budget');assert(Object.values(controlCounts()).every(v=>v>=4),'Core controls or previews missing');event('rotation',{turn,index,track:next.title,phases});if(turn%3===1){await sync((index+1)%4);assert(gridPhases().every(p=>p.errorSeconds<.005),'Playing Sync lost declared-grid phase');}
   if(new URL(location.href).searchParams.has('coldAnalysis')&&turn<8)await checkAnalysis({app,track:tracks[[4,1,5,3,0,2,6,7][turn]],turn,until,click,capture,event,report,controls:controlCounts});
   if(new URL(location.href).searchParams.has('syncOverlapContract')&&turn===0)await checkSyncOverlap({app,count:2,label:'raw',click,until,capture,event,report});
   if([4,9,14].includes(turn))await capture('rotation-'+turn);
  }
  if(new URL(location.href).searchParams.has('syncOverlapContract'))await checkSyncOverlap({app,count:3,label:'keylock',click,until,capture,event,report});
  if(new URL(location.href).searchParams.has('captureSync')){
   const incoming=state.decks.filter(d=>d.syncRole!=='primary').slice(0,2);
   for(const [i,d]of incoming.entries()){
    const mode=i?'playing':'paused',primary=state.decks.find(d=>d.syncRole==='primary');
    if(!i){click(`[data-action="play"][data-deck="${d.index}"]`);await until(()=>!d.playing,'pause Sync capture incoming');}
    const voice=engine.voices.get(primary.index),rate=primary.rate;
    section='four '+mode+' incoming Sync capture';event('sync-capture-before',{mode,deck:d.index,track:d.track.title,position:engine.position(d),playing:d.playing,rate:d.rate,master:primary.index,masterTrack:primary.track.title,masterRate:rate});
    const recording=capture('sync-'+mode);await sleep(200);await sync(d.index);
    assert(primary.playing&&primary.rate===rate&&engine.voices.get(primary.index)===voice,'Sync changed outgoing master');
    if(!i)await play(d.index);await recording;
    event('sync-capture-after',{mode,deck:d.index,track:d.track.title,position:engine.position(d),playing:d.playing,rate:d.rate,phases:gridPhases()});
    assert(gridPhases().every(p=>p.errorSeconds<.005),'Captured Sync lost declared-grid phase');
   }
  }
  checkpoint();assert(report.audio.every(x=>x.nonfinite===0),'Non-finite master samples');assert(!report.errors.length,'Unhandled errors during session');report.complete=true;report.status='Complete';
 }catch(error){report.errors.push(error.stack);report.status='Failed';}
 finally{
  measuring=false;trace?.stop();clearInterval(timer);app.engine.silence();if(meter){app.engine.masterOutput.output.disconnect(meter);meter.disconnect();meter.port.close();}report.elapsedSeconds=started?(performance.now()-started)/1000:0;report.sessionUnchanged=report.sessionUnchanged();report.finalControls=controlCounts();report.finalCache=app.engine.decodedBufferUsage();report.finalRaster=sourceWaveformRasterUsage();report.stopped=app.state.decks.every(d=>!d.playing&&!d.playQueued);show();
 }
};
boot().catch(error=>{report.errors.push(error.stack);show();});

if(new URL(location.href).searchParams.has('layoutContract')){
 const button=document.createElement('button');button.textContent='Check preserved layouts';$('#soak').prepend(button);
 button.onclick=async()=>{try{
  assert(report.stopped&&tracks.length===8,'Run only after stopped real-track session');button.disabled=true;report.layoutChecks=[];
  for(const workspace of ['serato','traktor','hybrid','traktor-flat','serato-hybrid','rekordbox']){
   click('[data-panel="settings"]');click('[data-settings-tab="Layouts"]');click(`#modal [data-workspace-choice="${workspace}"]`);click('#modal-close');
   for(const count of ['2','4'])for(const orientation of ['horizontal','vertical']){
    select('#deck-count',count);select('#preview-orientation',orientation);select('#preview-density','compact');await sleep(100);
    await load(Number(count)-1,tracks[Number(count)-1]);await sleep(100);
    assert(document.querySelectorAll('.deck').length===Number(count),'Deck count changed during load');
    const controls=controlCounts();assert(['play','tempo','eq','scrub'].every(key=>controls[key]===Number(count)),'Layout lost a core control');
    report.layoutChecks.push({workspace,count:Number(count),orientation,controls});show();
   }
  }
  event('layout-contract-passed',{checks:report.layoutChecks.length});
 }catch(error){report.errors.push(error.stack);show();}};
}

// The owned native trace host can load its eight verified loopback-only copies.
if(new URL(location.href).searchParams.has('nativeInputs')){
 const button=document.createElement('button');button.textContent='Load eight verified diagnostic tracks';$('#soak').prepend(button);
 button.onclick=async()=>{
  try{
   await until(()=>!$('#soak-files').disabled,'native fixture input');button.disabled=true;
   const manifest=await(await fetch('/__trace-inputs/manifest')).json();assert(manifest.length===8,'Eight allowlisted diagnostic inputs required');
   const transfer=new DataTransfer();for(const [i,file]of manifest.entries()){
    const bytes=await(await fetch('/__trace-inputs/'+i)).arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');assert(hash===file.sha256,'Native diagnostic source hash mismatch');transfer.items.add(new File([bytes],file.name,{type:'audio/mpeg'}));
   }
   $('#soak-files').files=transfer.files;await $('#soak-files').onchange({target:$('#soak-files')});
  }catch(error){report.errors.push(error.stack);report.status='Native input failed';show();}
 };
}
