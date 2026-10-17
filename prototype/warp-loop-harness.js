const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(x,m)=>{if(!x)throw Error(m);};
const hash=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','panels.js','beatgrid.js','smart-sync.js','warp-loop.js','warp-loop-kernel.js','warp-loop-worklet.js','warp-loop-harness.js'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,await hash(await(await fetch(file)).arrayBuffer())])));
async function until(fn,label,ms=12000){const end=performance.now()+ms;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const button=(i,action)=>`[data-deck="${i}"][data-action="${action}"]`;
function click(s){assert($(s),'Missing '+s);$(s).click();}
function value(s,v){assert($(s),'Missing '+s);$(s).value=String(v);}
function setting(name,v){const input=$(`[data-setting="${name}"]`);input.value=v;input.dispatchEvent(new Event('change',{bubbles:true}));}
function b64(a){let s='';for(let i=0;i<a.length;i+=16384)s+=String.fromCharCode(...a.subarray(i,i+16384));return btoa(s);}
function pulses(a,sr){const times=[];let last=-sr;for(let n=0;n<a.length;n++){assert(Number.isFinite(a[n]),'Non-finite whole recording');if(Math.abs(a[n])>.01&&n-last>sr*.1){times.push(n/sr);last=n;}}return times;}
let app;
async function run(){
 $('#warp-run').disabled=true;const {engine,state}=app;
 const report={startedAt:new Date().toISOString(),completed:false,checks:[],errors:[],probes:[],criteria:{maximumPulsePhaseErrorSeconds:.01,minimumPairsPerSection:3,sourceRateTolerance:1e-6},fixture:{sampleRate:48000,duration:30,primary:{bpm:120,offset:.05},secondary:{bpm:120,offset:.13,markers:[{time:2.13,bpm:150},{time:3.73,bpm:90}]},pulseSeconds:.012,carrierHz:900,amplitude:.15},scope:'Actual browser app grid editor/Setup/Play/Sync and one continuous master recording, forward active loops/no-keylock/no-stems controlled fixtures. No reference/native/hardware/music-quality acceptance.'};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;await until(()=>!state.analysis,'Initial analysis');
  for(let index=0;index<2;index++){
   const d=state.decks[index],b=engine.ctx.createBuffer(2,48000*30,48000),a=b.getChannelData(index);
   Object.assign(d.track,{bpm:120,grid:index?.13:.05,gridWarpMarkers:[],gridMarkers:[],duration:30,analyzed:true,metadataRevision:(d.track.metadataRevision||0)+1});
   Object.assign(d,{rate:1,keylock:false,keyShift:0,position:index?.13:.05,reverse:false,loop:true,loopIn:index?.13:.05,loopOut:index?3.73:4.05,stemSlip:'off',sync:false});
   const times=[];
   if(index===0)for(let n=0;.05+n*.5<30;n++)times.push(.05+n*.5);
   else{for(let n=0;n<4;n++)times.push(.13+n*.5);for(let n=0;n<4;n++)times.push(2.13+n*.4);for(let n=0;3.73+n*2/3<30;n++)times.push(3.73+n*2/3);}
   for(const at of times){const first=Math.round(at*48000);for(let n=0;n<576&&first+n<a.length;n++)a[first+n]=.15*Math.sin(Math.PI*n/576)*Math.sin(2*Math.PI*900*n/48000);}
   engine.clearDeckScratchCache(index);engine.buffers.set(d.track.id,b);
  }
  click(button(1,'grid'));
  for(const marker of report.fixture.secondary.markers){value('#grid-warp-time',marker.time);value('#grid-warp-bpm',marker.bpm);click('#grid-marker');}
  click('#grid-save');await until(()=>!$('#modal').open,'Grid save');
  assert(JSON.stringify(state.decks[1].track.gridWarpMarkers)===JSON.stringify(report.fixture.secondary.markers),'Saved marker map mismatch');
  report.persistedMarkers=JSON.parse(localStorage.getItem('openplay-review-v1')).tags[state.decks[1].track.id].gridWarpMarkers;
  assert(JSON.stringify(report.persistedMarkers)===JSON.stringify(report.fixture.secondary.markers),'Warp markers were not persisted');report.checks.push('Actual grid editor stages and saves both tempo markers with metadata persistence');
  click('[data-panel="settings"]');setting('Sync Mode','Smart Sync');click('#save-settings');
  click(button(0,'sync'));click(button(0,'play'));await until(()=>state.decks[0].playing,'Primary playing');
  click(button(1,'sync'));await until(()=>state.decks[1].syncState==='armed','Secondary armed');click(button(1,'play'));await until(()=>state.decks[1].playing&&!state.decks[1].processing,'Warped playing');
  await engine.recordStart();report.recordStart=engine.ctx.currentTime;
  async function probe(label,expected){const d=state.decks[1],voice=engine.voices.get(1),p={label,audioTime:engine.ctx.currentTime,position:engine.position(d),audioThreadLoop:!!voice.warpLoopTransport,clockRate:engine.audibleRate(d),shownBPM:$('#platter-1 strong').textContent};report.probes.push(p);assert(p.audioThreadLoop&&Math.abs(p.clockRate-expected)<1e-6,label+' musical loop clock/backend');}
  await sleep(2800);await probe('First150BPMsection',.8);await sleep(2000);await probe('After first loop wrap',1);await sleep(2000);await probe('Second150BPMsection',.8);await sleep(2000);await probe('After second loop wrap',1);await sleep(1800);
  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected whole stereo recording');report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:2,duration:decoded.duration};
  const times=[0,1].map(c=>pulses(decoded.getChannelData(c),decoded.sampleRate));
  report.audio={pulseTimes:times,sections:[{name:'firstBase120',from:.2,to:1.8},{name:'first150',from:2.2,to:3.8},{name:'secondBase120',from:4.2,to:5.8},{name:'second150',from:6.2,to:7.8},{name:'thirdBase120',from:8.2,to:9.8}].map(s=>({...s,pairs:times[0].filter(t=>t>=s.from&&t<=s.to).map(t=>({time:t,errorSeconds:Math.min(...times[1].map(r=>Math.abs(t-r)))}))}))};
  for(const s of report.audio.sections)assert(s.pairs.length>=3&&s.pairs.every(p=>p.errorSeconds<=.01),s.name+' actual audio phase');
  report.checks.push('Whole recorded audio stays aligned across repeating source-tempo boundaries and two loop wraps');report.checks.push('Real audio-thread PCM transport and analytical clock report alternating1and0.8 local source rates');
  report.loopBounds=state.decks.slice(0,2).map(d=>({start:d.loopIn,end:d.loopOut}));assert(report.loopBounds[0].start===.05&&report.loopBounds[0].end===4.05&&report.loopBounds[1].start===.13&&report.loopBounds[1].end===3.73,'Loop bounds changed');report.checks.push('Both eight-beat source loops retain original bounds');
 }catch(e){report.errors.push({message:e.message,stack:e.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};}}for(let i=0;i<2;i++)if(state.decks[i].playing)click(button(i,'play'));await until(()=>state.decks.every(d=>!d.playing&&!d.processing),'Stopped');
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===4&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#warp-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in downloadable report'}:null},null,2);
  $('#warp-original').textContent=JSON.stringify(report,null,2);
  const a=$('#warp-download');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='warp-sync-browser-results.json';a.hidden=false;$('#warp-status').textContent=report.completed?'Scoped warped-loop workflow passed; all decks paused':'Check failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#warp-run').disabled=false;$('#warp-run').textContent='Run warped-loop audio workflow';}
$('#warp-run').addEventListener('click',run);boot().catch(e=>$('#warp-status').textContent=e.message);
