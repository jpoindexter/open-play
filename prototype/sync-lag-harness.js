import {sessionKey} from './session-storage.js';
import {sourceWaveformState} from './source-waveform.js';
import {paintDetailWaveforms} from './detail-waveform.js';
const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(ok,text)=>{if(!ok)throw Error(text);};
const report={scope:'Actual workspace rAF callbacks and ordinary GUI Sync under an injected80ms post-alignment preparation stall. Owned muted tones; no human/physical/pop identity claim.',frames:[],errors:[]};
let app,section=null,callbackTimes={},rectangles=0,detailPaints=0,readoutMutations=0;
const raf=window.requestAnimationFrame.bind(window),fill=CanvasRenderingContext2D.prototype.fillRect,clear=CanvasRenderingContext2D.prototype.clearRect;
window.requestAnimationFrame=callback=>raf(at=>{const start=performance.now();try{callback(at);}finally{if(section)(callbackTimes[callback.name||'anonymous']??=[]).push(performance.now()-start);}});
CanvasRenderingContext2D.prototype.fillRect=function(...args){if(section)rectangles++;return fill.apply(this,args);};
CanvasRenderingContext2D.prototype.clearRect=function(...args){if(section&&this.canvas.id==='detail-wave')detailPaints++;return clear.apply(this,args);};
async function until(test,label){const end=performance.now()+20000;while(!test()){assert(performance.now()<end,'Timed out: '+label);await sleep(10);}}
const summary=a=>{const sorted=[...a].sort((a,b)=>a-b);return {count:a.length,mean:a.reduce((n,x)=>n+x,0)/(a.length||1),p95:sorted[Math.floor(sorted.length*.95)]||0,max:sorted.at(-1)||0};};
new MutationObserver(records=>{if(section)readoutMutations+=records.filter(r=>/^(time-|remain-|audio-status$|master-limit$|preview-zoom-scale$)/.test((r.target.nodeType===3?r.target.parentElement:r.target).id)).length;}).observe(document.body,{subtree:true,childList:true,characterData:true});
async function measure(name){
 section=name;callbackTimes={};rectangles=0;detailPaints=0;readoutMutations=0;const starts=[],began=performance.now();let running=true;
 const sample=at=>{if(running){starts.push(at);raf(sample);}};raf(sample);await sleep(2500);running=false;section=null;
 report.frames.push({name,elapsedMs:performance.now()-began,intervalMs:summary(starts.slice(1).map((t,i)=>t-starts[i])),callbacks:Object.fromEntries(Object.entries(callbackTimes).map(([k,v])=>[k,summary(v)])),rectangles,detailPaints,readoutMutations});
}
const click=selector=>{assert($(selector),selector);$(selector).click();};
function select(selector,value){const el=$(selector);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}
async function boot(){
 assert(location.port==='18842','Dedicated port18842 required');
 // The fixture uses memory-only settings and a separate database; never replace an existing saved library.
 const savedStorage=window.localStorage,before=savedStorage.getItem(sessionKey),values=new Map(),open=indexedDB.open.bind(indexedDB);
 Object.defineProperty(window,'localStorage',{value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}});
 indexedDB.open=(name,version)=>open('openplay-sync-lag-owned-'+name,version);
 report.persistentSessionUnchanged=()=>savedStorage.getItem(sessionKey)===before;
 localStorage.setItem(sessionKey,JSON.stringify({settings:{'Use Auto Gain':false,'Analyze Stems':false,'Workspace Layout':'rekordbox','Sync Mode':'Smart Sync'}}));
 const parsed=new DOMParser().parseFromString(await(await fetch('workspace-preview.html')).text(),'text/html');
 for(const a of parsed.body.attributes)document.body.setAttribute(a.name,a.value);
 for(const link of parsed.querySelectorAll('link[rel=stylesheet]'))document.head.append(link);
 for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);
 await import('./layout-preview.js');await until(()=>window.openPlay?.state.decks[1].track&&!window.openPlay.state.analysis,'workspace');app=window.openPlay;
 $('#probe-run').disabled=false;$('#probe-run').textContent='Run Sync deadline and frame checks';
}
$('#probe-run').onclick=async()=>{
 $('#probe-run').disabled=true;const {engine,state}=app;let witness,create,timeline;
 try{
  await engine.resume();engine.audioMonitor.mutePhysical(true);assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute');
  await Promise.all(state.decks.slice(0,2).map(d=>sourceWaveformState(engine.buffers.get(d.track.id)).ready));await sleep(500);
  report.detailCacheLoaded=paintDetailWaveforms.toString().includes('lastFrames');
  await measure('2-deck compact horizontal stopped');
  for(const d of state.decks.slice(0,2))click(`[data-action="play"][data-deck="${d.index}"]`);
  await until(()=>state.decks.slice(0,2).every(d=>d.playing&&!d.processing),'both playing');await measure('2-deck compact horizontal playing');
  for(const d of state.decks)engine.pause(d);
  report.preservation=[];
  for(const count of [2,4]){
   if(count===4){select('#deck-count','4');await sleep(100);for(let i=2;i<4;i++){click(`tr[data-track="demo-${i}"]`);click(`[data-action="load"][data-deck="${i}"]`);await until(()=>state.decks[i].track?.id===`demo-${i}`&&!state.analysis,'extra deck load');await sourceWaveformState(engine.buffers.get(state.decks[i].track.id)).ready;}}
   for(const orientation of ['vertical',...(count===4?['horizontal']:[])]){
    select('#preview-orientation',orientation);await sleep(300);const canvas=$('#detail-wave'),before=canvas.toDataURL();await sleep(100);assert(canvas.toDataURL()===before,'Stopped pixels changed');
    click('[data-wave-zoom="in"]');await sleep(100);assert(canvas.toDataURL()!==before,'Zoom failed to repaint stopped waveform');click('[data-wave-zoom="out"]');await until(()=>$('#preview-zoom-scale').textContent===$('#detail-wave-scale').textContent,'zoom readout settled');
    await measure(`${count}-deck compact ${orientation} stopped`);
    for(const d of state.decks.slice(0,count))click(`[data-action="play"][data-deck="${d.index}"]`);await until(()=>state.decks.slice(0,count).every(d=>d.playing&&!d.processing),'mode playback');await measure(`${count}-deck compact ${orientation} playing`);for(const d of state.decks)engine.pause(d);
    report.preservation.push({count,orientation,play:document.querySelectorAll('[data-action="play"]').length,eq:document.querySelectorAll('[data-mix$=":low"]').length,tempo:document.querySelectorAll('[data-tempo]').length,scrub:document.querySelectorAll('[data-waveform-scrub]').length,libraryPreviews:document.querySelectorAll('.library-wave-preview img').length});
    assert(report.preservation.at(-1).play===count&&report.preservation.at(-1).eq===count&&report.preservation.at(-1).scrub===count,'Core controls missing');
   }
  }
  select('#deck-count','2');select('#preview-orientation','horizontal');await sleep(100);
  const [left,right]=state.decks;
  for(const [index,d]of [left,right].entries()){
   const b=engine.ctx.createBuffer(2,engine.ctx.sampleRate*12,engine.ctx.sampleRate);
   for(let c=0;c<2;c++){const a=b.getChannelData(c);for(let n=0;n<a.length;n++)a[n]=.1*Math.sin(2*Math.PI*(index?73:97)*n/b.sampleRate);}
   d.track={...d.track,id:'sync-deadline-'+index,bpm:index?115.5:121,grid:0,duration:12,gridWarpMarkers:[],gridMarkers:[],cues:Array(8).fill(null)};
   Object.assign(d,{position:1,rate:1,keylock:false,keyShift:0,sync:false,syncRole:null,syncState:'off',loop:false,reverse:false});engine.buffers.set(d.track.id,b);
  }
  engine.setCross(1);click('[data-action="play"][data-deck="0"]');await until(()=>left.playing&&!left.processing,'leader');click('[data-action="play"][data-deck="1"]');await until(()=>right.playing&&!right.processing,'follower');await sleep(300);
  await engine.ctx.audioWorklet.addModule(new URL('./fx-tempo-capture-worklet.js',import.meta.url));
  witness=new AudioWorkletNode(engine.ctx,'open-play-fx-tempo-capture-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});engine.masterOutput.output.connect(witness);witness.connect(engine.ctx.destination);
  const captured=new Promise(resolve=>witness.port.onmessage=({data})=>{if(data.type==='done')resolve(data);});witness.port.postMessage({type:'capture',id:1,frames:engine.ctx.sampleRate*2});await sleep(250);
  const voice=engine.voices.get(1),leader=engine.voices.get(0),rate=right.rate;let injected=false;
  report.startGuardLoaded=engine.start.toString().includes('requireLead');report.starts=[];
  create=engine.ctx.createBufferSource.bind(engine.ctx);engine.ctx.createBufferSource=()=>{const source=create(),start=source.start.bind(source);source.start=(when,offset)=>{report.starts.push({when,actual:engine.ctx.currentTime,offset});return start(when,offset);};return source;};
  timeline=engine.onGridTimeline;engine.onGridTimeline=(d,options)=>{const value=timeline?.(d,options);if(d===right&&!injected&&options.when>engine.ctx.currentTime+.02){injected=true;const before=engine.ctx.currentTime,end=performance.now()+80;while(performance.now()<end){}report.stall={before,after:engine.ctx.currentTime,when:options.when};}return value;};
  report.pressAt=engine.ctx.currentTime;click('[data-action="sync"][data-deck="1"]');await until(()=>injected&&!right.processing,'Sync completion');engine.ctx.createBufferSource=create;
  report.deadline={injected,voiceRetained:engine.voices.get(1)===voice,leaderRetained:engine.voices.get(0)===leader,rateRetained:right.rate===rate,playing:right.playing,processing:right.processing,sync:right.sync,notice:$('#notice')?.textContent||''};
  const pcm=await captured,a=pcm.data;let maxCurvature=0,zeroFrames=0,peak=0;
  for(let n=2;n<a.length;n++){maxCurvature=Math.max(maxCurvature,Math.abs(a[n]-2*a[n-1]+a[n-2]));peak=Math.max(peak,Math.abs(a[n]));if(a[n]===0)zeroFrames++;}
  report.pcm={sampleRate:engine.ctx.sampleRate,frames:a.length,startFrame:pcm.startFrame,maxCurvature,zeroFrames,peak};
  const bytes=new Uint8Array(a.buffer);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));$('#probe-pcm').textContent=btoa(binary);
  report.deadlinePassed=report.deadline.voiceRetained&&report.deadline.leaderRetained&&report.deadline.rateRetained&&right.playing&&!right.sync&&peak>.001&&maxCurvature<.001&&zeroFrames===0;
  assert(report.deadlinePassed,'Late Sync must preserve both audible voices and prior tempo without a discontinuity');
  engine.onGridTimeline=timeline;click('[data-action="sync"][data-deck="1"]');await until(()=>right.sync&&!right.processing,'on-time retry');
  const when=right.anchorTime,primaryBeat=when=>((engine.voiceClock(left,engine.voices.get(0))(when)*121/60)%4+4)%4,ownBeat=((right.anchorPosition*115.5/60)%4+4)%4;
  report.retry={leaderRetained:engine.voices.get(0)===leader,rate:right.rate,phaseErrorBeats:Math.min(Math.abs(ownBeat-primaryBeat(when)),4-Math.abs(ownBeat-primaryBeat(when)))};assert(report.retry.leaderRetained&&Math.abs(right.rate-121/115.5)<1e-9&&report.retry.phaseErrorBeats<.001,'On-time Sync retry failed');
  click('[data-action="play"][data-deck="1"]');await until(()=>!right.playing,'pause follower');click('[data-action="sync"][data-deck="1"]');await until(()=>right.syncState==='armed','paused arming');click('[data-action="play"][data-deck="1"]');await until(()=>right.playing&&!right.processing,'armed launch');
  report.armedLaunch={playing:right.playing,leaderRetained:engine.voices.get(0)===leader,syncState:right.syncState};assert(report.armedLaunch.leaderRetained&&right.syncState==='beat','Armed launch failed');
 }catch(error){report.errors.push(error.stack);}
 finally{
  if(create)engine.ctx.createBufferSource=create;if(timeline)engine.onGridTimeline=timeline;engine.silence();witness?.disconnect();if(witness)try{engine.masterOutput.output.disconnect(witness);}catch{}
  report.controls={play:document.querySelectorAll('[data-action="play"]').length,eq:document.querySelectorAll('[data-mix$=":low"]').length,libraryPreviews:document.querySelectorAll('.library-wave-preview img').length};
  report.sourceHashes=Object.fromEntries(await Promise.all(['app.js','engine.js','layout-preview.js','detail-waveform.js','source-waveform.js','sync-lag-harness.js'].map(async file=>[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(file,{cache:'no-store'})).arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')])));
  report.persistentSessionUnchanged=report.persistentSessionUnchanged();
  report.stoppedReadoutsPassed=report.frames.filter(f=>f.name.endsWith('stopped')).every(f=>f.readoutMutations===0);
  if(!report.stoppedReadoutsPassed)report.errors.push('Stopped readouts repeatedly replace unchanged text nodes');
  report.complete=report.deadlinePassed&&!report.errors.length;$('#probe-result').textContent=JSON.stringify(report,null,2);$('#probe-original').textContent=JSON.stringify(report);$('#probe-run').disabled=false;
 }
};
boot().catch(error=>$('#probe-result').textContent=error.stack);
