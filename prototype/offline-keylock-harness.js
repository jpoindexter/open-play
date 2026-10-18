const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','sync-tempo-handoff.js','keylock-shadow-live.js','keylock.js','keylock-dsp.js','keylock-worker.js','pcm-resample.js','panels.js','offline-keylock-harness.js','vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,await hash(await(await fetch(file)).arrayBuffer())])));
async function until(fn,label){const end=performance.now()+15000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const control=action=>`[data-deck="0"][data-action="${action}"]`;
function click(selector){assert($(selector),'Missing '+selector);$(selector).click();}
function base64(bytes){let text='';for(let n=0;n<bytes.length;n+=16384)text+=String.fromCharCode(...bytes.subarray(n,n+16384));return btoa(text);}
let app;
async function run(){
 $('#offline-run').disabled=true;const {state,engine}=app,d=state.decks[0];
 const report={startedAt:new Date().toISOString(),workflowCompleted:false,checks:[],errors:[],scope:'Actual app Loop8/Key lock/tempo+8%/Play/Key+/Key+/Pause controls and real offline Worker/DSP output. Owned330/550Hz stereo tones, whole master recording. Not live-forward/native/physical/music/loop-boundary-quality/reference acceptance.',criteria:{neutralMaximumErrorHz:.01,shiftedMaximumErrorHz:1,measurementSecondsAfterSettledState:[5,7]},fixture:{sampleRate:44100,duration:30,tonesHz:[330,550],amplitude:.12},states:[],pitchActions:[]};
 const snapshot=name=>{const voice=engine.voices.get(0),source=voice?.sources[0];const row={name,audioTime:engine.ctx.currentTime,playing:d.playing,rate:d.rate,keylock:d.keylock,keyShift:d.keyShift,position:engine.position(d),loop:{start:d.loopIn,end:d.loopOut},live:!!voice?.liveKeylock,renderedFrames:source?.buffer.length,renderedSampleRate:source?.buffer.sampleRate,loopStart:source?.loopStart,loopEnd:source?.loopEnd};report.states.push(row);return row;};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;await until(()=>!state.analysis,'Initial analysis');
  const buffer=engine.ctx.createBuffer(2,30*44100,44100);for(let c=0;c<2;c++){const a=buffer.getChannelData(c);for(let n=0;n<a.length;n++)a[n]=.12*Math.sin(2*Math.PI*report.fixture.tonesHz[c]*n/44100);}
  Object.assign(d.track,{bpm:120,grid:0,gridWarpMarkers:[],gridMarkers:[],duration:30,analyzed:true});Object.assign(d,{rate:1,keylock:false,keyShift:0,position:0,reverse:false,loop:false,loopLength:4,stemSlip:'off',sync:false});engine.clearDeckScratchCache(0);engine.buffers.set(d.track.id,buffer);
  click(control('loopDouble'));click(control('loop'));await until(()=>d.loop&&d.loopLength===8&&d.loopIn===0&&d.loopOut===4,'Actual eight-beat loop');
  click(control('keylock'));await until(()=>d.keylock&&!d.processing,'Keylock');$('[data-tempo="0"]').value='8';$('[data-tempo="0"]').dispatchEvent(new Event('input',{bubbles:true}));await until(()=>d.rate===1.08&&!d.processing,'Paused tempo');
  const playAt=performance.now();click(control('play'));await until(()=>d.playing&&!d.processing&&engine.voices.get(0)?.sources[0]?.buffer,'Offline loop playing');report.startPreparationMs=performance.now()-playAt;
  const source=engine.voices.get(0).sources[0];assert(!engine.voices.get(0).liveKeylock&&source.buffer!==buffer&&source.buffer.length===Math.round(buffer.length/1.08),'Did not select actual offline-rendered source');report.checks.push('Normal Loop8/Key lock/tempo/Play select actual offline Worker output with original-time loop bounds');
  await engine.recordStart();report.recordStartAudioTime=engine.ctx.currentTime;report.neutral=snapshot('neutral loop1.08');await sleep(8000);
  for(let shift=1;shift<=2;shift++){
   const action={semitones:shift,callAudioTime:engine.ctx.currentTime,callAt:performance.now()};click(control('keyUp'));await until(()=>d.keyShift===shift&&!d.processing&&d.playing,'Offline shifted source'+shift);await until(()=>engine.ctx.currentTime>=d.anchorTime,'Scheduled shifted source'+shift);action.settledAudioTime=engine.ctx.currentTime;action.preparationMs=performance.now()-action.callAt;report.pitchActions.push(action);
  }
  report.shifted=snapshot('shifted loop1.08+2');assert(!report.shifted.live&&report.shifted.keyShift===2,'Wrong shifted backend');report.checks.push('Normal Key+ twice prepares and plays shifted offline loop; full preparation interval stays in the recording');await sleep(8000);
  assert(d.loopIn===0&&d.loopOut===4&&d.loopLength===8,'Loop bounds changed');report.checks.push('Original eight-beat loop bounds remain after worker/pitch changes');
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:decoded.numberOfChannels,duration:decoded.duration};}}
  if(d.playing)click(control('play'));await until(()=>!d.playing&&!d.processing,'Stopped');report.finalPlayingDecks=state.decks.filter(x=>x.playing).length;report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.workflowCompleted=report.checks.length===3&&!report.errors.length&&report.sourceStable&&report.finalPlayingDecks===0;report.finishedAt=new Date().toISOString();$('#offline-original').textContent=JSON.stringify(report,null,2);$('#offline-status').textContent=report.workflowCompleted?'Offline worker workflow captured; pitch and boundary inspection pending; decks stopped':'Failed: '+report.errors.map(x=>x.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const node of [...parsed.body.children])if(node.tagName!=='SCRIPT')document.body.append(node);await import('./app.js');await until(()=>window.openPlay?.state.decks[0].track,'Actual app');app=window.openPlay;$('#offline-run').disabled=false;$('#offline-run').textContent='Run offline looped keylock workflow';}
$('#offline-run').onclick=run;boot().catch(error=>$('#offline-status').textContent=error.message);
