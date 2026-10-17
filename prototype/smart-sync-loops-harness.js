const $ = selector => document.querySelector(selector), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const sha=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','panels.js','styles.css','smart-sync.js','smart-sync-loops-harness.js'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,await sha(await(await fetch(f)).arrayBuffer())])));
async function until(predicate,label,ms=12000){const end=performance.now()+ms;while(!predicate()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
function click(selector){assert($(selector),'Missing '+selector);$(selector).click();}
function setting(name,value){const input=$(`[data-setting="${name}"]`);assert(input,'Missing preference '+name);if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));}
const button=(i,action)=>`[data-action="${action}"][data-deck="${i}"]`;
function b64(bytes){let s='';for(let n=0;n<bytes.length;n+=16384)s+=String.fromCharCode(...bytes.subarray(n,n+16384));return btoa(s);}
function onsets(data,sampleRate,threshold){const times=[];let last=-sampleRate;for(let n=0;n<data.length;n++){assert(Number.isFinite(data[n]),'Non-finite whole recording');if(Math.abs(data[n])>threshold&&n-last>sampleRate*.1){times.push(n/sampleRate);last=n;}}return times;}
function phase(left,right,from,to){return left.filter(t=>t>=from&&t<=to).map(t=>({time:t,errorSeconds:Math.min(...right.map(r=>Math.abs(t-r)))}));}
let app;
async function run(){
 $('#smart-run').disabled=true;
 const {engine,state}=app;
 const report={startedAt:new Date().toISOString(),completed:false,checks:[],errors:[],events:[],states:[],
  scope:'Actual browser app and one whole postmaster recording; controlled constant-grid, two-deck, forward active loops/no-keylock/no-stems. No native/hardware/warp/music-quality acceptance.',
  criteria:{maximumAlignedPulseSeconds:.01,maximumAlignedDownbeatSeconds:.01,minimumPulsePairsPerWholeBarSegment:6,minimumDownbeatPairsPerWholeBarSegment:2,maximumTempoIntervalErrorSeconds:.01,shortLoopCycleSeconds:1,wholeRecordingFinite:true},
  fixture:{sampleRate:48000,duration:30,bpm:[120,128],grid:[.05,.13],carrierHz:900,pulseFrames:576,amplitude:{downbeat:.25,other:.1}}};
 const event=name=>report.events.push({name,audioTime:engine.ctx.currentTime,utc:new Date().toISOString()});
 const snapshot=name=>report.states.push({name,decks:state.decks.slice(0,2).map(d=>({sync:d.sync,status:d.syncState,role:d.syncRole,playing:d.playing,rate:d.rate,position:engine.position(d)}))});
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;
  await until(()=>!state.analysis,'Initial analysis');
  for(let index=0;index<2;index++){
   const d=state.decks[index],buffer=engine.ctx.createBuffer(2,48000*30,48000),data=buffer.getChannelData(index),bpm=report.fixture.bpm[index],grid=report.fixture.grid[index];
   Object.assign(d.track,{bpm,grid,gridMarkers:[],duration:30,analyzed:true,metadataRevision:(d.track.metadataRevision||0)+1});
   Object.assign(d,{rate:1,keylock:false,keyShift:0,reverse:false,loop:true,loopIn:grid,loopOut:grid+240/bpm,stemSlip:'off',position:grid,sync:false});
   for(let beat=0,at=grid;at<30;beat++,at=grid+beat*60/bpm){const first=Math.round(at*48000),amplitude=beat%4===0?.25:.1;for(let n=0;n<576&&first+n<data.length;n++)data[first+n]=amplitude*Math.sin(Math.PI*n/576)*Math.sin(2*Math.PI*900*n/48000);}
   d.track.savedLoops[0]={start:grid,end:grid+240/bpm,name:'Four beats'};d.track.savedLoops[1]={start:grid,end:grid+120/bpm,name:'Two beats'};engine.clearDeckScratchCache(index);engine.buffers.set(d.track.id,buffer);
  }
  click('[data-panel="settings"]');setting('Sync Mode','Smart Sync');setting('Maintain Sync on Track Load',true);click('#save-settings');
  assert(JSON.parse(localStorage.getItem('openplay-review-v1')).settings['Sync Mode']==='Smart Sync','Sync mode was not saved');
  click(button(0,'sync'));await until(()=>state.decks[0].syncState==='armed','Primary armed');assert(!state.decks[0].playing,'Arming autoplayed primary');snapshot('primary-armed');
  click(button(0,'play'));await until(()=>state.decks[0].playing&&state.decks[0].syncState==='beat','Primary beat');
  click(button(1,'sync'));await until(()=>state.decks[1].syncState==='armed','Secondary armed');assert(!state.decks[1].playing,'Arming autoplayed secondary');snapshot('secondary-armed');
  click(button(1,'play'));await until(()=>state.decks[1].playing&&state.decks[1].syncState==='beat','Armed secondary playback');snapshot('beat-aligned');
  report.bounds=state.decks.slice(0,2).map(d=>({start:d.loopIn,end:d.loopOut}));
  const mode=(i)=>`[data-action="tab"][data-deck="${i}"][data-tab="Loops"]`,pad=(i,n)=>`[data-action="pad"][data-deck="${i}"][data-pad="${n}"]`;
  await engine.recordStart();event('record-start');await sleep(4300);
  event('short-loop-request');click(mode(1));click(pad(1,1));await until(()=>state.decks[1].loopOut===report.fixture.grid[1]+120/128&&state.decks[1].syncState==='tempo'&&state.decks[0].syncState==='tempo','Short loop Tempo Sync');event('short-loop-ready');snapshot('two-beat-tempo');await sleep(2300);
  event('restore-request');const priorLoopVoice=engine.voices.get(1);click(pad(1,0));await until(()=>state.decks[1].loopOut===report.bounds[1].end&&state.decks[1].playing&&!state.decks[1].processing&&engine.voices.get(1)!==priorLoopVoice&&engine.ctx.currentTime>state.decks[1].anchorTime+.02,'Restore whole bar audible handoff');click(button(1,'sync'));await until(()=>state.decks[1].syncState==='beat'&&!state.decks[1].processing,'Re-Sync whole bar');event('restore-ready');snapshot('whole-bar-restored');await sleep(4300);
  const blob=await engine.recordStop();event('record-stop');const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await sha(bytes),base64:b64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected stereo capture');report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:2,duration:decoded.duration};
  const pulses=[0,1].map(c=>onsets(decoded.getChannelData(c),decoded.sampleRate,.01)),bars=[0,1].map(c=>onsets(decoded.getChannelData(c),decoded.sampleRate,.07));
  const t=name=>report.events.find(e=>e.name===name).audioTime-report.events[0].audioTime;
  const windows=[{name:'whole-bar',from:.15,to:t('short-loop-request')-.15},{name:'two-beat-tempo',from:t('short-loop-ready')+.2,to:t('restore-request')-.15},{name:'restored',from:t('restore-ready')+.2,to:decoded.duration-.1}];
  report.audio={pulses,bars,segments:windows.map(w=>({...w,pulseErrors:phase(pulses[0],pulses[1],w.from,w.to),downbeatErrors:phase(bars[0],bars[1],w.from,w.to)}))};
  for(const segment of report.audio.segments){
   if(segment.name==='two-beat-tempo'){
    segment.intervals=pulses.map(channel=>{const v=channel.filter(t=>t>=segment.from&&t<=segment.to);return v.slice(1).map((t,i)=>t-v[i]);});
    assert(segment.intervals.every(c=>c.length>=2&&c.every(t=>Math.abs(t-.5)<=.01)),'Short-loop tempo drift');
    segment.downbeatIntervals=bars.map(channel=>{const v=channel.filter(t=>t>=segment.from&&t<=segment.to);return v.slice(1).map((t,i)=>t-v[i]);});
    assert(segment.downbeatIntervals[1].length>=1&&segment.downbeatIntervals[1].every(t=>Math.abs(t-1)<=.01),'Short loop did not acoustically repeat every two beats');
   }else{
    assert(segment.pulseErrors.length>=6&&segment.pulseErrors.every(p=>p.errorSeconds<=.01),segment.name+' beat alignment');
    assert(segment.downbeatErrors.length>=2&&segment.downbeatErrors.every(p=>p.errorSeconds<=.01),segment.name+' downbeat alignment');
   }
  }
  report.finalBounds=state.decks.slice(0,2).map(d=>({start:d.loopIn,end:d.loopOut}));assert(JSON.stringify(report.bounds)===JSON.stringify(report.finalBounds),'Whole-bar bounds not restored');
  report.checks=['Armed looped decks start without autoplay and retain actual beat/downbeat alignment through repeated whole-bar wraps','Visible saved two-beat loop keeps matched acoustic tempo, repeats every one second and reports Tempo Sync','Visible whole-bar restore and explicit Sync restore measured bar alignment without altering bounds'];
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await sha(bytes),base64:b64(bytes)};}}for(const d of state.decks)engine.pause(d);
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===3&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#smart-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in downloadable report'}:null},null,2);
  $('#smart-original').textContent=JSON.stringify(report,null,2);
  const a=$('#smart-download');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='smart-sync-browser-results.json';a.hidden=false;
  $('#smart-status').textContent=report.completed?'Scoped Smart Sync workflow passed; all decks paused':'Check failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const node of [...parsed.body.children])if(node.tagName!=='SCRIPT')document.body.append(node);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#smart-run').disabled=false;$('#smart-run').textContent='Run looped Smart Sync workflow';}
$('#smart-run').addEventListener('click',run);boot().catch(error=>$('#smart-status').textContent=error.message);
