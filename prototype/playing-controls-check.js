import {installFourDeckTrace} from './four-deck-trace.js';
import {sourceWaveformState} from './source-waveform.js';

// Isolated runtime check: real imported tracks, installed handlers, synthetic held Y.
export async function runPlayingControlsCheck({state,engine}){
 const $=selector=>document.querySelector(selector),assert=(ok,message)=>{if(!ok)throw Error(message);};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms)),frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 async function until(check,label){const end=performance.now()+30000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
 const click=selector=>{assert($(selector),'Missing '+selector);$(selector).click();};
 const key=type=>document.body.dispatchEvent(new KeyboardEvent(type,{key:'y',code:'KeyY',bubbles:true,cancelable:true}));
 const real=state.tracks.filter(t=>!t.demo&&!t.provider&&!t.missing&&(t.file||typeof t.readFile==='function')).slice(0,4);
 assert(location.pathname.endsWith('/core-ownership-check.html'),'Use only the isolated check workspace');
 assert(real.length===4,'Import four real local tracks first');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!state.analysis&&!engine.recording,'Start stopped, analysis and recording idle');
 const names=['Playback Keys Use Shift','Use Auto Gain','Sync Mode','Instant Doubles'],settings=Object.fromEntries(names.map(k=>[k,Object.getOwnPropertyDescriptor(state.settings,k)]));
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Isolated four-real-track Compact native/browser runtime; installed Play/range/Quantize/Eject handlers and deliberately held synthetic Y nudge. Scripted clicks/focus are not physical pointer/MIDI, listening or generic pop proof.',steps:[]};
 let trace,frameRequest,lastFrame;const intervals=[];
 const sampleFrame=at=>{if(lastFrame!==undefined)intervals.push({at,interval:at-lastFrame});lastFrame=at;frameRequest=requestAnimationFrame(sampleFrame);};
 async function hashes(){return Object.fromEntries(await Promise.all(['app.js','engine.js','four-deck-trace.js','core-ownership-check.js','playing-controls-check.js'].map(async file=>{
  const response=await fetch(file,{cache:'no-store'});assert(response.ok,'Cannot hash '+file);return[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')];
 })));}
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute failed');state.autoplay=false;
  Object.assign(state.settings,{'Playback Keys Use Shift':false,'Use Auto Gain':false,'Sync Mode':'Off','Instant Doubles':false});
  state.quantize=true;state.decks.forEach(d=>{d.quantize=true;d.pitchRange=8;});
  for(const [selector,value]of [['#deck-count','4'],['#preview-density','compact']]){const input=$(selector);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));}
  for(let index=0;index<4;index++){
   click(`tr[data-track="${real[index].id}"]`);click(`[data-action="load"][data-deck="${index}"]`);
   const d=state.decks[index];await until(()=>d.track===real[index]&&engine.buffers.has(d.track.id)&&!d.processing,'Load '+index);
   await sourceWaveformState(engine.buffers.get(d.track.id)).ready;
   Object.assign(d,{rate:1,sync:false,keylock:false,keyShift:0,loop:false,reverse:false,repeat:false});
  }
  for(let index=0;index<4;index++){click(`[data-action="play"][data-deck="${index}"]`);await until(()=>state.decks[index].playing&&!state.decks[index].processing&&!state.decks[index].playQueued,'Play '+index);}
  await frames();const a=state.decks[0],voice=engine.voices.get(0),rate=()=>voice.sources[0].playbackRate.value;
  assert(voice?.sources?.length&&!voice.liveKeylock&&!voice.gridTimeline,'Ordinary raw A required');const nominal=rate(),position=engine.position(a);
  key('keydown');await until(()=>Math.abs(rate()-nominal*1.04)<1e-6,'Held Y nudge');
  trace=installFourDeckTrace();trace.start();frameRequest=requestAnimationFrame(sampleFrame);await sleep(500);
  async function step(label,selector,eject=false){
   const nodes=[...document.querySelectorAll('.deck button,.deck input,.deck select,.channel-strip input,.channel-strip button,#crossfader,#detail-wave,[data-waveform-scrub],.library-wave-preview img')].filter(n=>!eject||n.closest('.deck')?.dataset.focus!=='1');
   const previews=[...document.querySelectorAll('.library-wave-preview img')].filter(n=>n.complete&&n.naturalWidth).map(node=>({node,src:node.src}));
   const voices=state.decks.map(d=>engine.voices.get(d.index)),rates=state.decks.map(d=>d.rate),playing=state.decks.map(d=>d.playing),focus=$(`[data-mix="${state.deckCount===4?2:1}:level"]`);assert(focus,'Sibling level missing');focus.focus();
   const removed={...trace.report.removed},emptyReads=trace.report.geometryTotals['wave-1']?.count||0;
   const start=performance.now();trace.note(label+'-start');click(selector);await frames();trace.note(label+'-end');
   const retained=nodes.filter(n=>n.isConnected).length,ready=previews.every(p=>p.node.isConnected&&p.node.src===p.src);
   const stable=state.decks.every((d,index)=>eject&&index===1?!d.track&&!d.playing&&!engine.voices.has(index):d.playing===playing[index]&&engine.voices.get(index)===voices[index]&&d.rate===rates[index]);
   const row={label,deckCount:state.deckCount,retained,total:nodes.length,readyPreviews:previews.length,previewsRetained:ready,focusRetained:document.activeElement===focus,voicesAndNominalRatesRetained:stable,heldRate:rate(),range:a.pitchRange,quantize:state.decks.map(d=>d.quantize),quantizePressed:[...document.querySelectorAll('[data-action="quantize"]')].map(n=>n.getAttribute('aria-pressed')),globalQuantize:$('#quantize').getAttribute('aria-pressed'),removed:Object.fromEntries(Object.entries(trace.report.removed).map(([key,value])=>[key,value-removed[key]])),elapsedToTwoFramesMs:performance.now()-start,physicalMuted:engine.audioMonitor.snapshot().physicalMuted};report.steps.push(row);
   if(eject)row.emptyOverviewGeometryReads=(trace.report.geometryTotals['wave-1']?.count||0)-emptyReads;
   assert(retained===nodes.length&&ready&&row.focusRetained,'Controls/previews/focus replaced during '+label);
   assert(stable&&Math.abs(rate()-nominal*1.04)<1e-6&&row.physicalMuted,'Playback/nudge changed during '+label);
  }
  for(const count of [4,2]){
   if(state.deckCount!==count){trace.note('structural-count-'+count);const input=$('#deck-count');input.value=String(count);input.dispatchEvent(new Event('change',{bubbles:true}));await frames();}
   const initialRange=a.pitchRange;for(let i=0;i<3;i++)await step('range-'+i,'[data-action="range"][data-deck="0"]');assert(a.pitchRange===initialRange,'Range cycle did not return');
   for(let i=0;i<2;i++){await step('deck-quantize-'+i,'[data-action="quantize"][data-deck="0"]');const row=report.steps.at(-1);assert(row.globalQuantize===(i?'true':'mixed')&&row.quantizePressed.every((v,index)=>v===String(index>0||i===1)),'Deck Quantize feedback stale');}
   for(let i=0;i<2;i++){await step('global-quantize-'+i,'#quantize');const row=report.steps.at(-1);assert(row.globalQuantize===String(!!i)&&row.quantizePressed.every(v=>v===String(!!i)),'Global Quantize feedback stale');}
  }
  trace.note('structural-count-4');$('#deck-count').value='4';$('#deck-count').dispatchEvent(new Event('change',{bubbles:true}));
  for(const index of [2,3]){click(`[data-action="play"][data-deck="${index}"]`);await until(()=>state.decks[index].playing&&!state.decks[index].processing,'Resume '+index);}
  await step('eject-B','[data-action="eject"][data-deck="1"]',true);
  const empty=$('#wave-1'),pixels=empty.getContext('2d').getImageData(0,0,empty.width,empty.height).data;
  report.emptyOverview={transparent:pixels.every(v=>v===0),geometryReads:report.steps.at(-1).emptyOverviewGeometryReads};
  assert(report.emptyOverview.transparent&&report.emptyOverview.geometryReads===0,'Empty overview not cleared or still measured');
  key('keyup');await until(()=>Math.abs(rate()-nominal)<1e-6,'Nudge release');assert(engine.position(a)>position+.1,'A timer did not advance');
  await sleep(150);report.tracks=real.map(t=>({id:t.id,title:t.title,duration:t.duration}));report.final={playing:state.decks.map(d=>d.playing),nominalRate:nominal,releasedRate:rate(),aPositionAdvanced:engine.position(a)-position,frameIntervals:intervals,trace:trace.report};report.completed=true;
 }catch(error){report.error={message:error.message,stack:error.stack};}
 finally{
  key('keyup');cancelAnimationFrame(frameRequest);trace?.stop();state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();engine.audioMonitor?.mutePhysical(true);await frames();
  for(const [name,descriptor]of Object.entries(settings)){if(descriptor)Object.defineProperty(state.settings,name,descriptor);else delete state.settings[name];}
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted,traceRestored:!trace||trace.report.operations.at(-1)?.type==='trace-stop'};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceStable=false;report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
