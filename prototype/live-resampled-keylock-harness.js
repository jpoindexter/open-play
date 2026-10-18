const withPulses=new URLSearchParams(location.search).has('pulses');
const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw Error(message);};
const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','keylock-shadow-live.js','pcm-resample.js','keylock.js','keylock-dsp.js','panels.js','live-resampled-keylock-harness.js','vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs','vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,await hash(await(await fetch(file)).arrayBuffer())])));
async function until(fn,label){const end=performance.now()+12000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const control=action=>`[data-deck="0"][data-action="${action}"]`;
function click(selector){assert($(selector),'Missing '+selector);$(selector).click();}
function base64(bytes){let text='';for(let n=0;n<bytes.length;n+=16384)text+=String.fromCharCode(...bytes.subarray(n,n+16384));return btoa(text);}
let app;
async function run(){
 $('#live-run').disabled=true;
 const {state,engine}=app,d=state.decks[0],report={startedAt:new Date().toISOString(),workflowCompleted:false,checks:[],errors:[],scope:'Actual app Key lock/Play/tempo/Key+/Key+/tempo/Pause using bounded resampled live groups and one whole master recording. Owned330/550Hz tones; no full music/native/physical/warped/compound/reference acceptance.',pitchActions:[],events:[],criteria:{neutralMaximumErrorHz:.01,shiftedMaximumErrorHz:1,measurementSecondsAfterSettledState:[5,7]},fixture:{sampleRate:44100,duration:30,tonesHz:[330,550],amplitude:.12},states:[]};
 const snapshot=name=>{const live=engine.voices.get(0)?.liveKeylock;const row={name,audioTime:engine.ctx.currentTime,playing:d.playing,rate:d.rate,keylock:d.keylock,keyShift:d.keyShift,audibleRate:engine.audibleRate(d),shownBPM:$('#platter-0 strong').textContent,live:!!live,adapterSnapshot:live?.snapshot()};report.states.push(row);return row;};
 try{
  if(withPulses){report.fixture.amplitude=.012;report.fixture.pulses={offset:.25,intervalSeconds:.5,durationSeconds:.012,carrierHz:900,amplitude:.15};report.criteria.pulseIntervalOriginalSeconds=.5;report.criteria.maximumPulseIntervalErrorSeconds=.01;report.criteria.minimumIntervalsPerWindow=3;}
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;await until(()=>!state.analysis,'Initial analysis');
  const buffer=engine.ctx.createBuffer(2,30*44100,44100);
  for(let c=0;c<2;c++){const data=buffer.getChannelData(c);for(let n=0;n<data.length;n++)data[n]=report.fixture.amplitude*Math.sin(2*Math.PI*report.fixture.tonesHz[c]*n/44100);}
  if(withPulses){for(let c=0;c<2;c++){const a=buffer.getChannelData(c),width=Math.round(.012*44100);for(let at=.25;at<30;at+=.5){const first=Math.round(at*44100);for(let k=0;k<width&&first+k<a.length;k++)a[first+k]+=.15*Math.sin(Math.PI*k/width)*Math.sin(2*Math.PI*900*k/44100);}}}
  Object.assign(d.track,{bpm:120,grid:0,gridWarpMarkers:[],gridMarkers:[],duration:30,analyzed:true});
  Object.assign(d,{rate:1,keylock:false,keyShift:0,position:0,reverse:false,loop:false,stemSlip:'off',sync:false});engine.clearDeckScratchCache(0);engine.buffers.set(d.track.id,buffer);
  click(control('keylock'));await until(()=>d.keylock&&!d.processing,'Key lock enabled');
  click(control('play'));await until(()=>d.playing&&!d.processing&&engine.voices.get(0)?.liveKeylock,'Forward live voice');const adapter=engine.voices.get(0).liveKeylock;
  assert(adapter.snapshot().resamplePitch,'Actual engine did not select resampled live mode');
  const priorObserver=adapter.onEvent;adapter.onEvent=event=>{priorObserver(event);report.events.push(event);};
  await engine.recordStart();report.recordStartAudioTime=engine.ctx.currentTime;
  $('[data-tempo="0"]').value='8';$('[data-tempo="0"]').dispatchEvent(new Event('input',{bubbles:true}));
  await until(()=>d.rate===1.08&&Math.abs(engine.audibleRate(d)-1.08)<1e-6&&!d.processing,'Audible tempo1.08');
  assert(engine.voices.get(0)?.liveKeylock===adapter,'Tempo unexpectedly replaced live adapter');report.checks.push('Actual tempo input reaches1.08 while retaining the live forward adapter');
  report.neutral=snapshot('neutral1.08');await sleep(7400);
  for(let shift=1;shift<=2;shift++){
   const action={semitones:shift,callAudioTime:engine.ctx.currentTime,callAt:performance.now()};click(control('keyUp'));await until(()=>d.keyShift===shift&&adapter.stateAt().semitones===shift,'Audible live pitch'+shift);action.settledAudioTime=engine.ctx.currentTime;action.preparationMs=performance.now()-action.callAt;report.pitchActions.push(action);
  }
  report.shifted=snapshot('shifted1.08+2');await sleep(7400);
  assert(engine.voices.get(0)?.liveKeylock===adapter,'Pitch replaced the stable live adapter');report.checks.push('Actual Key+ twice prepares new pitch groups on stable live outputs; full preparation intervals recorded');
  const shiftedGroup=adapter.snapshot().groups.find(g=>g.role==='selected').id;
  $('[data-tempo="0"]').value='4';$('[data-tempo="0"]').dispatchEvent(new Event('input',{bubbles:true}));await until(()=>d.rate===1.04&&Math.abs(engine.audibleRate(d)-1.04)<1e-6,'Audible tempo1.04');
  assert(adapter.snapshot().groups.find(g=>g.role==='selected').id===shiftedGroup,'Tempo-only update replaced the pitch group');report.afterTempo=snapshot('shifted1.04+2');await sleep(7400);report.checks.push('After shifting, tempo+4% retains the selected pitch group and original-time rate clock');
  report.finalAdapterSnapshot=adapter.snapshot();assert(report.finalAdapterSnapshot.groups.every(g=>g.end-g.start<=11.001),'Processor source window grew beyond the bounded original-time span');report.checks.push('Final processor windows retain at most11.001original seconds; decoded source memory is separate');
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:decoded.numberOfChannels,duration:decoded.duration};}}
  if(d.playing)click(control('play'));await until(()=>!d.playing&&!d.processing,'Stopped');report.finalPlayingDecks=state.decks.filter(x=>x.playing).length;
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.workflowCompleted=report.checks.length===4&&!report.errors.length&&report.sourceStable&&report.finalPlayingDecks===0;report.finishedAt=new Date().toISOString();
  $('#live-original').textContent=JSON.stringify(report,null,2);const link=$('#live-download');link.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));link.download='neutral-keylock-browser-original.json';link.hidden=false;
  $('#live-status').textContent=report.workflowCompleted?'Bounded live workflow captured; independent pitch and continuity inspection pending; decks stopped':'Workflow failed: '+report.errors.map(x=>x.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const node of [...parsed.body.children])if(node.tagName!=='SCRIPT')document.body.append(node);await import('./app.js');await until(()=>window.openPlay?.state.decks[0].track,'Actual app');app=window.openPlay;$('#live-run').disabled=false;$('#live-run').textContent='Run bounded live resampled keylock workflow';}
$('#live-run').onclick=run;boot().catch(error=>$('#live-status').textContent=error.message);
