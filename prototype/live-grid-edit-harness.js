const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(x,m)=>{if(!x)throw Error(m);};
const hash=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','panels.js','beatgrid.js','smart-sync.js','live-grid-edit-harness.js','keylock-shadow-live.js'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,await hash(await(await fetch(file)).arrayBuffer())])));
async function until(fn,label,ms=12000){const end=performance.now()+ms;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const button=(i,action)=>`[data-deck="${i}"][data-action="${action}"]`;
function click(s){assert($(s),'Missing '+s);$(s).click();}
function value(s,v){assert($(s),'Missing '+s);$(s).value=String(v);}
function setting(name,v){const input=$(`[data-setting="${name}"]`);input.value=v;input.dispatchEvent(new Event('change',{bubbles:true}));}
function b64(a){let s='';for(let i=0;i<a.length;i+=16384)s+=String.fromCharCode(...a.subarray(i,i+16384));return btoa(s);}
function pulses(a,sr){const times=[];let last=-sr;for(let n=0;n<a.length;n++){assert(Number.isFinite(a[n]),'Non-finite whole recording');if(Math.abs(a[n])>.01&&n-last>sr*.1){times.push(n/sr);last=n;}}return times;}
async function pulseBand(buffer){
 const context=new OfflineAudioContext(2,buffer.length,buffer.sampleRate),source=context.createBufferSource();source.buffer=buffer;
 let previous=source;for(let n=0;n<2;n++){const filter=context.createBiquadFilter();filter.type='highpass';filter.frequency.value=2000;filter.Q.value=.707;previous.connect(filter);previous=filter;}previous.connect(context.destination);source.start();return context.startRendering();
}
const wrapped=value=>((value+.25)%.5+.5)%.5-.25;
function phaseSummary(pairs){
 const angles=pairs.map(p=>p.offsetSeconds*2*Math.PI/.5),x=angles.reduce((sum,a)=>sum+Math.cos(a),0),y=angles.reduce((sum,a)=>sum+Math.sin(a),0),mean=Math.atan2(y,x)*.5/(2*Math.PI);
 return{meanSeconds:mean,maximumSpreadSeconds:Math.max(...pairs.map(p=>Math.abs(wrapped(p.offsetSeconds-mean))))};
}
let app;
async function run(){
 $('#live-grid-edit-run').disabled=true;const {engine,state}=app;
 const report={events:[],states:[],startedAt:new Date().toISOString(),completed:false,checks:[],errors:[],probes:[],criteria:{maximumBeatPhaseErrorSeconds:.01,maximumTempoPhaseChangeSeconds:.01,maximumTempoPhaseSpreadSeconds:.01,minimumTempoOffsetSeconds:.02,minimumPairs:3},fixture:{sampleRate:48000,duration:30,primary:{bpm:120,offset:.05},secondary:{bpm:120,offset:.13,markers:[{time:4.13,bpm:150},{time:10.53,bpm:90}]},pulseSeconds:.012,pulseCarrierHz:3000,continuousCarrierHz:[330,550],continuousAmplitude:.08,amplitude:.15},scope:'Actual browser live grid saves in Beat Sync and Tempo Sync with keylocked two-deck audio and one complete master recording. No reference/native/hardware/music-quality acceptance.'};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;await until(()=>!state.analysis,'Initial analysis');
  for(let index=0;index<2;index++){
   const d=state.decks[index],b=engine.ctx.createBuffer(2,48000*30,48000),a=b.getChannelData(index);
   Object.assign(d.track,{bpm:120,grid:index?.13:.05,gridWarpMarkers:[],gridMarkers:[],duration:30,analyzed:true,metadataRevision:(d.track.metadataRevision||0)+1});
   Object.assign(d,{rate:1,keylock:false,keyShift:0,position:0,reverse:false,loop:false,stemSlip:'off',sync:false});
   const times=[];
   if(index===0)for(let n=0;.05+n*.5<30;n++)times.push(.05+n*.5);
   else{for(let n=0;n<8;n++)times.push(.13+n*.5);for(let n=0;n<16;n++)times.push(4.13+n*.4);for(let n=0;10.53+n*2/3<30;n++)times.push(10.53+n*2/3);}
   for(let n=0;n<a.length;n++)a[n]=.08*Math.sin(2*Math.PI*report.fixture.continuousCarrierHz[index]*n/48000);
   for(const at of times){const first=Math.round(at*48000);for(let n=0;n<576&&first+n<a.length;n++)a[first+n]+=.15*Math.sin(Math.PI*n/576)*Math.sin(2*Math.PI*3000*n/48000);}
   engine.clearDeckScratchCache(index);engine.buffers.set(d.track.id,b);
  }
  click('[data-panel="settings"]');setting('Sync Mode','Smart Sync');click('#save-settings');
  click(button(0,'keylock'));click(button(1,'keylock'));
  await until(()=>state.decks[0].keylock&&state.decks[1].keylock,'Both keylocks');
  click(button(0,'sync'));click(button(0,'play'));await until(()=>state.decks[0].playing,'Primary playing');
  click(button(1,'sync'));await until(()=>state.decks[1].syncState==='armed','Secondary armed');click(button(1,'play'));await until(()=>state.decks[1].playing&&!state.decks[1].processing,'Warped playing');
  await engine.recordStart();report.recordStart=engine.ctx.currentTime;
  const event=name=>report.events.push({name,audioTime:engine.ctx.currentTime,utc:new Date().toISOString()});
  const snapshot=name=>{const d=state.decks[1];report.states.push({name,status:d.syncState,role:d.syncRole,playing:d.playing,position:engine.position(d),rate:engine.audibleRate(d),handoffWhen:d.anchorTime});};
  async function reach(at){await until(()=>engine.ctx.currentTime>=at,'Live audio observation',20000);}
  async function markerSave(marker,label){
    const prior=engine.voices.get(1);event(label+'-request');snapshot(label+'-before');
    click(button(1,'grid'));value('#grid-warp-time',marker.time);value('#grid-warp-bpm',marker.bpm);click('#grid-marker');click('#grid-save');
    await until(()=>!$('#modal').open&&engine.voices.get(1)!==prior&&!state.decks[1].processing,label+' save');
    await reach(state.decks[1].anchorTime);event(label+'-ready');snapshot(label+'-after');
  }
  await sleep(1000);await markerSave(report.fixture.secondary.markers[0],'beat-edit');
  assert(state.decks[1].syncState==='beat','Live marker save left Beat Sync');
  const firstEvents=engine.voices.get(1).gridTimeline.events;report.firstMap=firstEvents.map(e=>({...e}));
  await reach(firstEvents[1].when+1.2);event('tempo-seek-request');
  const waveform=$('[data-seek="1"]'),rect=waveform.getBoundingClientRect(),target=engine.position(state.decks[1])+.8;
  waveform.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rect.left+waveform.clientWidth*target/state.decks[1].track.duration,clientY:rect.top+rect.height/2}));
  await until(()=>state.decks[1].syncState==='tempo'&&state.decks[1].playing&&!state.decks[1].processing,'Tempo seek');
  await reach(state.decks[1].anchorTime);event('tempo-ready');snapshot('tempo-ready');await sleep(2200);
  await markerSave(report.fixture.secondary.markers[1],'tempo-edit');
  assert(state.decks[1].syncState==='tempo','Live marker save discarded Tempo Sync');
  const finalEvents=engine.voices.get(1).gridTimeline.events;report.finalMap=finalEvents.map(e=>({...e}));
  assert(finalEvents.length>=2,'Second future tempo boundary was not scheduled');
  await reach(finalEvents.at(-1).when+2.5);
  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected whole stereo recording');report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:2,duration:decoded.duration};
  for(let c=0;c<2;c++)for(const value of decoded.getChannelData(c))assert(Number.isFinite(value),'Non-finite whole recording');
  const pulseAudio=await pulseBand(decoded),times=[0,1].map(c=>pulses(pulseAudio.getChannelData(c),decoded.sampleRate));
  const relative=name=>report.events.find(e=>e.name===name).audioTime-report.recordStart;
  const secondBoundary=report.finalMap.at(-1).when-report.recordStart;
  const windows=[{name:'beat-after-live-edit',from:relative('beat-edit-ready')+.3,to:relative('tempo-seek-request')-.2},{name:'tempo-before-live-edit',from:relative('tempo-ready')+.3,to:relative('tempo-edit-request')-.1},{name:'tempo-after-boundary',from:secondBoundary+.3,to:decoded.duration-.2}];
  report.audio={pulseMeasurement:'Fixed identical two-stage2000Hz/Q.707 highpass, absolute.01 threshold/100ms refractory. Circular phase comparison measures an existing offset; it does not shift any audio.',pulseTimes:times,sections:windows.map(w=>({...w,pairs:times[0].filter(t=>t>=w.from&&t<=w.to).map(t=>{const right=times[1].reduce((best,r)=>Math.abs(r-t)<Math.abs(best-t)?r:best,Infinity);return{left:t,right,offsetSeconds:wrapped(right-t)};})}))};
  for(const section of report.audio.sections){assert(section.pairs.length>=3,section.name+' insufficient pulse pairs');section.phase=phaseSummary(section.pairs);}
  const [beat,before,after]=report.audio.sections;
  assert(beat.pairs.every(p=>Math.abs(p.offsetSeconds)<=.01),'Beat Sync audio phase changed through grid save');
  assert(Math.abs(before.phase.meanSeconds)>=.02,'Tempo fixture lacks an audible offset');
  assert(before.phase.maximumSpreadSeconds<=.01&&after.phase.maximumSpreadSeconds<=.01,'Tempo offset was not steady');
  report.audio.tempoPhaseChangeSeconds=Math.abs(wrapped(after.phase.meanSeconds-before.phase.meanSeconds));
  assert(report.audio.tempoPhaseChangeSeconds<=.01,'Tempo Sync lost its pre-edit audible phase offset');
  report.persistedMarkers=JSON.parse(localStorage.getItem('openplay-review-v1')).tags[state.decks[1].track.id].gridWarpMarkers;
  assert(JSON.stringify(report.persistedMarkers)===JSON.stringify(report.fixture.secondary.markers),'Live markers not saved');
  report.checks.push('Live future marker edit preserves Beat Sync state/role and actual keylocked beat alignment');
  report.checks.push('Second live edit preserves Tempo Sync state and the measured pre-edit offset across the new tempo boundary');
  report.checks.push('Actual grid editor persists both live marker saves');
 }catch(e){report.errors.push({message:e.message,stack:e.stack});}
 finally{
  if(engine.recording)await engine.recordStop();for(let i=0;i<2;i++)if(state.decks[i].playing)click(button(i,'play'));await until(()=>state.decks.every(d=>!d.playing&&!d.processing),'Stopped');
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===3&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#live-grid-edit-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in downloadable report'}:null},null,2);
  const a=$('#live-grid-edit-download');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='live-grid-edit-browser-results.json';a.hidden=false;$('#live-grid-edit-status').textContent=report.completed?'Scoped live grid-edit workflow passed; all decks paused':'Check failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#live-grid-edit-run').disabled=false;$('#live-grid-edit-run').textContent='Run one live grid-edit workflow';}
$('#live-grid-edit-run').addEventListener('click',run);boot().catch(e=>$('#live-grid-edit-status').textContent=e.message);
