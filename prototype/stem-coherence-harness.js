const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(x,m)=>{if(!x)throw Error(m);};
const hash=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','panels.js','beatgrid.js','smart-sync.js','stem-coherence-harness.js','keylock-shadow-live.js'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,await hash(await(await fetch(file)).arrayBuffer())])));
async function until(fn,label,ms=12000){const end=performance.now()+ms;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const button=(i,action)=>`[data-deck="${i}"][data-action="${action}"]`;
function click(s){assert($(s),'Missing '+s);$(s).click();}
function value(s,v){assert($(s),'Missing '+s);$(s).value=String(v);}
function setting(name,v){const input=$(`[data-setting="${name}"]`);input.value=v;input.dispatchEvent(new Event('change',{bubbles:true}));}
function b64(a){let s='';for(let i=0;i<a.length;i+=16384)s+=String.fromCharCode(...a.subarray(i,i+16384));return btoa(s);}
function pulses(a,sr){const times=[];let last=-sr;for(let n=0;n<a.length;n++){assert(Number.isFinite(a[n]),'Non-finite whole recording');if(Math.abs(a[n])>.01&&n-last>sr*.1){times.push(n/sr);last=n;}}return times;}
function amplitude(data,sr,hz){
 const weighted=new Float64Array(data.length);let weight=0;
 for(let i=0;i<data.length;i++){const w=.5-.5*Math.cos(2*Math.PI*i/(data.length-1));weighted[i]=data[i]*w;weight+=w;}
 let maximum=0;
 for(let delta=-1;delta<=1.0001;delta+=.25){const angle=2*Math.PI*(hz+delta)/sr,cr=Math.cos(angle),ci=Math.sin(angle);let xr=1,xi=0,re=0,im=0;for(const sample of weighted){re+=sample*xr;im+=sample*xi;[xr,xi]=[xr*cr-xi*ci,xr*ci+xi*cr];}maximum=Math.max(maximum,2*Math.hypot(re,im)/weight);}
 return maximum;
}
function measure(buffer,from,to){
 return [0,1].map(channel=>{const all=buffer.getChannelData(channel),a=all.subarray(Math.round(from*buffer.sampleRate),Math.round(to*buffer.sampleRate));assert(a.length>=buffer.sampleRate*.5,'Measurement window too short');let sum=0;for(const value of a)sum+=value*value;const carrier=amplitude(a,buffer.sampleRate,330),cancelled=amplitude(a,buffer.sampleRate,550),bass=amplitude(a,buffer.sampleRate,110);return{frames:a.length,rms:Math.sqrt(sum/a.length),carrier330:carrier,cancelled550:cancelled,bass110:bass,cancellationRatio:cancelled/Math.max(1e-12,carrier),bassLeakRatio:bass/Math.max(1e-12,carrier)};});
}
let app;
async function run(){
 $('#stem-coherence-run').disabled=true;const {engine,state}=app,d=state.decks[0];
 const report={startedAt:new Date().toISOString(),completed:false,checks:[],errors:[],events:[],
  criteria:{maximumCancellationRatio:.01,maximumBassLeakRatio:.01,minimumCarrierAmplitude:.005,minimumMelody550Ratio:.5,maximumMutedRMS:.00001},
  fixture:{sampleRate:48000,duration:30,grid:.13,bpm:120,markers:[{time:4.13,bpm:150},{time:7.33,bpm:90}],components:['original=sum of four stored stem buffers','Vocal=A550Hz amplitude.08','Melody=-A550Hz+B330Hz amplitude.06','Bass=110Hz amplitude.04','Drums=independently timed3000Hz bursts'],stereoPhaseOffsets:[0,.45]},
  scope:'Actual app prepared-buffer attachment, Stem pad controls, Keylock/Smart Sync/Play and one whole master recording. Known separated fixtures isolate transport/mixing; no new model inference or separation-quality, native, physical, musical/reference or transition-continuity acceptance.'};
 const event=name=>report.events.push({name,audioTime:engine.ctx.currentTime,utc:new Date().toISOString()});
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;await until(()=>!state.analysis,'Initial analysis');
  const buffers=Array.from({length:5},()=>engine.ctx.createBuffer(2,48000*30,48000));
  const times=[];for(let n=0;n<8;n++)times.push(.13+n*.5);for(let n=0;n<8;n++)times.push(4.13+n*.4);for(let n=0;7.33+n*2/3<30;n++)times.push(7.33+n*2/3);
  for(let c=0;c<2;c++){
   const data=buffers.map(b=>b.getChannelData(c));
   for(let n=0;n<data[0].length;n++){const a=.08*Math.sin(2*Math.PI*550*n/48000+c*.45),b=.06*Math.sin(2*Math.PI*330*n/48000+c*.12);data[1][n]=a;data[2][n]=-a+b;data[3][n]=.04*Math.sin(2*Math.PI*110*n/48000+c*.2);}
   for(const at of times){const first=Math.round(at*48000);for(let n=0;n<576&&first+n<data[0].length;n++)data[4][first+n]=.12*Math.sin(Math.PI*n/576)*Math.sin(2*Math.PI*3000*n/48000);}
   for(let n=0;n<data[0].length;n++)data[0][n]=data[1][n]+data[2][n]+data[3][n]+data[4][n];
  }
  Object.assign(d.track,{bpm:120,grid:.13,gridWarpMarkers:report.fixture.markers.map(m=>({...m})),gridMarkers:[],duration:30,analyzed:true,metadataRevision:(d.track.metadataRevision||0)+1,stemState:'Known prepared test sources; no model inference'});
  Object.assign(d,{rate:1,keylock:false,keyShift:0,position:0,reverse:false,loop:false,stemSlip:'off',sync:false,stems:[true,true,true,true],stemFX:[false,false,false,false]});
  engine.clearDeckScratchCache(0);engine.buffers.set(d.track.id,buffers[0]);await engine.attachStems(d.track,buffers.slice(1),[d]);
  click(button(0,'tab')+'[data-tab="Stems"]');click(button(0,'pad')+'[data-pad="2"]');click(button(0,'pad')+'[data-pad="3"]');
  assert(JSON.stringify(d.stems)==='[true,true,false,false]','Requested cancellation mix not selected');
  click('[data-panel="settings"]');setting('Sync Mode','Smart Sync');click('#save-settings');click(button(0,'keylock'));await until(()=>d.keylock,'Keylock');click(button(0,'sync'));click(button(0,'play'));await until(()=>d.playing&&!d.processing,'Five-source playback');
  const voice=engine.voices.get(0),snapshot=voice.liveKeylock.snapshot();report.processor=snapshot;report.scheduledEvents=voice.gridTimeline.events.map(e=>({...e}));
  assert(voice.liveKeylock.outputs.length===5&&snapshot.groups.filter(g=>g.role==='selected').length===1,'Five outputs not retained');
  const group=snapshot.groups.find(g=>g.role==='selected');assert(group.nodeCount===1&&group.processorChannels===10&&group.sourceOutputs===5,'Sources do not share one ten-channel processor');report.checks.push('Actual original+four stereo sources use one processor and one warp map with five selectable outputs');
  await engine.recordStart();report.recordStart=engine.ctx.currentTime;
  const end=report.scheduledEvents.at(-1).when;await until(()=>engine.ctx.currentTime>=end+1.8,'Warped coherent mix',20000);
  click(button(0,'pad')+'[data-pad="0"]');event('melody-only');assert(JSON.stringify(d.stems)==='[false,true,false,false]','Melody-only control');await sleep(1400);
  click(button(0,'pad')+'[data-pad="1"]');event('all-muted');assert(d.stems.every(v=>!v),'All-muted control');await sleep(1200);
  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected stereo');for(let c=0;c<2;c++)for(const value of decoded.getChannelData(c))assert(Number.isFinite(value),'Non-finite whole recording');report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:2,duration:decoded.duration};
  const boundaries=report.scheduledEvents.slice(1).map(e=>e.when-report.recordStart),melody=report.events.find(e=>e.name==='melody-only').audioTime-report.recordStart,mute=report.events.find(e=>e.name==='all-muted').audioTime-report.recordStart;
  const windows=[{name:'base120',from:.5,to:Math.min(2,boundaries[0]-.3)},{name:'source150',from:boundaries[0]+.4,to:boundaries[0]+1.6},{name:'source90',from:boundaries[1]+.4,to:Math.min(boundaries[1]+1.6,melody-.1)}];
  report.audio={method:'Fixed Hann-window DTFT maxima in expected tone±1Hz at.25Hz spacing. Ratios compare measured bands in the same original recording window; no input/output gain or time fitting.',sections:windows.map(w=>({...w,channels:measure(decoded,w.from,w.to)})),melodyOnly:measure(decoded,melody+.3,mute-.1),muted:measure(decoded,mute+.3,decoded.duration-.1)};
  for(const section of report.audio.sections)assert(section.channels.every(c=>c.carrier330>.005&&c.cancellationRatio<=.01&&c.bassLeakRatio<=.01),section.name+' cancellation/route coherence');report.checks.push('Vocal+Melody cancels its known550Hz component below1% of330Hz across both tempo boundaries; Bass/original leakage also below1%');
  assert(report.audio.melodyOnly.every(c=>c.carrier330>.005&&c.cancelled550/c.carrier330>=.5),'Melody-only550Hz positive control missing');report.checks.push('Actual Vocal pad removal exposes the550Hz component on the same routed recording');
  assert(report.audio.muted.every(c=>c.rms<=.00001),'All-muted outputs not silent');report.checks.push('Actual final Melody pad mute silences both master channels');
 }catch(e){report.errors.push({message:e.message,stack:e.stack});}
 finally{
  if(engine.recording)await engine.recordStop();if(d.playing)click(button(0,'play'));await until(()=>!d.playing&&!d.processing,'Stopped');
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===4&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#stem-coherence-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in downloadable report'}:null},null,2);
  const a=$('#stem-coherence-download');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='stem-coherence-browser-results.json';a.hidden=false;$('#stem-coherence-status').textContent=report.completed?'Scoped stem coherence workflow passed; deck paused':'Check failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#stem-coherence-run').disabled=false;$('#stem-coherence-run').textContent='Run one stem coherence workflow';}
$('#stem-coherence-run').addEventListener('click',run);boot().catch(e=>$('#stem-coherence-status').textContent=e.message);
