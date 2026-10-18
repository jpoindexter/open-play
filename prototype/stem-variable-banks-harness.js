const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(x,m)=>{if(!x)throw Error(m);};
const hash=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','panels.js','beatgrid.js','smart-sync.js','stem-variable-banks-harness.js','keylock-shadow-live.js','pcm-resample.js','pitch-time-map.js','effects.js','vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs'];
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
function measure(buffer,from,to,semitones=0){
 const q=2**(semitones/12);
 return [0,1].map(channel=>{const all=buffer.getChannelData(channel),a=all.subarray(Math.round(from*buffer.sampleRate),Math.round(to*buffer.sampleRate));assert(a.length>=buffer.sampleRate*.1,'Measurement window too short');let sum=0;for(const value of a)sum+=value*value;const carrier=amplitude(a,buffer.sampleRate,330*q),cancelled=amplitude(a,buffer.sampleRate,550*q),bass=amplitude(a,buffer.sampleRate,110*q);return{frames:a.length,rms:Math.sqrt(sum/a.length),carrier330:carrier,cancelled550:cancelled,bass110:bass,cancellationRatio:cancelled/Math.max(1e-12,carrier),bassLeakRatio:bass/Math.max(1e-12,carrier)};});
}
let app;
async function run(){
 $('#stem-variable-banks-run').disabled=true;const {engine,state}=app,d=state.decks[0];
 const report={startedAt:new Date().toISOString(),completed:false,checks:[],errors:[],events:[],
  criteria:{maximumCancellationRatio:.01,maximumBassLeakRatio:.01,minimumCarrierAmplitude:.005,minimumMelody550Ratio:.5,maximumMutedRMS:.00001,minimumDelayTailRMS:.0005},
  fixture:{sampleRate:48000,duration:30,grid:.13,bpm:120,markers:[{time:4.13,bpm:150},{time:7.33,bpm:90}],components:['original=sum of four stored stem buffers','Vocal=A550Hz amplitude.08','Melody=-A550Hz+B330Hz amplitude.06','Bass=110Hz amplitude.04','Drums=independently timed3000Hz bursts'],stereoPhaseOffsets:[0,.45]},
  scope:'Actual two-bank18-channel variable-pitch mapped resampling with same-instance mapped bank preparation with keylock OFF across source-tempo map, then normal Key+enables keylock/replaces warped voice, Stem pad mutes and normal enabled Delay. Whole master checks shifted cancellation, dry Melody positive control, real wet tail after source mute and late decay. Owned prepared fixtures; no new model inference, separation/music/native/physical/full-reference acceptance.'};
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
  click('[data-panel="settings"]');setting('Sync Mode','Smart Sync');click('#save-settings');click(button(0,'keylock'));await until(()=>d.keylock,'Keylock');click(button(0,'keyUp'));click(button(0,'keyUp'));await until(()=>d.keyShift===2,'Initial key+2');click(button(0,'keylock'));await until(()=>!d.keylock,'Initial keylock OFF');click(button(0,'sync'));click(button(0,'play'));await until(()=>d.playing&&!d.processing,'Five-source playback');
  const voice=engine.voices.get(0),snapshot=voice.liveKeylock.snapshot();report.processor=snapshot;assert(snapshot.resamplePitch&&snapshot.groups.find(g=>g.role==='selected').pitchMap?.length===3,'Actual engine did not select mapped resampled pitch');assert(Math.abs(snapshot.groups.find(g=>g.role==='selected').pitchSemitones-2)<1e-9,'Initial resampled factor is wrong');report.scheduledEvents=voice.gridTimeline.events.map(e=>({...e}));
  assert(voice.liveKeylock.outputs.length===5&&snapshot.groups.filter(g=>g.role==='selected').length===1,'Five outputs not retained');
  const group=snapshot.groups.find(g=>g.role==='selected');assert(group.nodeCount===1&&group.processorChannels===18&&group.sourceOutputs===9&&snapshot.publicOutputs===5,'Sources do not share one18-channel banked processor');report.checks.push('Actual original+two Stem banks use one18-channel processor and warp map with five selectable outputs');
  await engine.recordStart();report.recordStart=engine.ctx.currentTime;
  report.bankPreparation={startedAt:engine.ctx.currentTime,before:voice.liveKeylock.snapshot()};
  await engine.attachStems(d.track,buffers.slice(1),[d]);
  report.bankPreparation.finishedAt=engine.ctx.currentTime;report.bankPreparation.after=voice.liveKeylock.snapshot();
  assert(engine.voices.get(0)===voice&&report.bankPreparation.after.activeStemBank===1&&report.bankPreparation.after.groups[0].id===group.id,'Mapped bank replacement changed owner or failed to switch');

  const end=report.scheduledEvents.at(-1).when;await until(()=>engine.ctx.currentTime>=end+1.8,'Warped coherent mix',20000);
  report.livePitchRequest=engine.ctx.currentTime;click(button(0,'keyUp'));await until(()=>d.keyShift===3&&!d.processing&&engine.voices.get(0)!==voice&&engine.voices.get(0)?.liveKeylock?.stateAt().semitones===3,'Live warped replacement pitch+3');event('live-shifted');
  report.pitchReplacement={oldVoiceRetained:false,newAnchorTime:d.anchorTime,position:engine.position(d),readinessScope:'GUI request to observed new scheduled state; not acoustic latency'};report.afterPitchProcessor=engine.voices.get(0).liveKeylock.snapshot();const shiftedGroup=report.afterPitchProcessor.groups.find(g=>g.role==='selected');assert(d.keylock&&!shiftedGroup.pitchMap&&shiftedGroup.nodeCount===1&&shiftedGroup.processorChannels===18&&shiftedGroup.pitchSemitones===3,'Replacement lost shared18channel group');await sleep(1800);
  click(button(0,'pad')+'[data-pad="0"]');event('melody-only');assert(JSON.stringify(d.stems)==='[false,true,false,false]','Melody-only control');await sleep(1400);
  click(button(0,'pad')+'[data-pad="0"]');event('cancellation-restored');
  click('[data-panel="fx"]');value('[data-fx-select="0:0"]','Delay');$('[data-fx-select="0:0"]').dispatchEvent(new Event('change',{bubbles:true}));
  value('[data-fx-route="0"]','Deck 1');$('[data-fx-route="0"]').dispatchEvent(new Event('change',{bubbles:true}));
  value('[data-fx-depth="0:0"]',50);$('[data-fx-depth="0:0"]').dispatchEvent(new Event('input',{bubbles:true}));
  value('[data-fx-beat="0:0"]','1/2');$('[data-fx-beat="0:0"]').dispatchEvent(new Event('change',{bubbles:true}));click('[data-fx-on="0:0"]');event('delay-enabled');
  assert(state.fx[0][0].on&&state.fx[0][0].name==='Delay'&&state.fxRoutes[0]==='Deck 1','Delay normal controls did not apply');report.enabledEffect=structuredClone(state.fx[0][0]);await sleep(2200);
  click(button(0,'pad')+'[data-pad="0"]');click(button(0,'pad')+'[data-pad="1"]');event('all-muted');assert(d.stems.every(v=>!v),'All-muted control');await sleep(3000);
  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected stereo');for(let c=0;c<2;c++)for(const value of decoded.getChannelData(c))assert(Number.isFinite(value),'Non-finite whole recording');report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:2,duration:decoded.duration};
  const boundaries=report.scheduledEvents.slice(1).map(e=>e.when-report.recordStart),relative=name=>report.events.find(e=>e.name===name).audioTime-report.recordStart;
  const melody=relative('melody-only'),restored=relative('cancellation-restored'),mute=relative('all-muted'),shifted=relative('live-shifted'),fx=relative('delay-enabled');
  const windows=[{name:'shift2base120unlocked',from:.5,to:Math.min(2,boundaries[0]-.3),semitones:2},{name:'shift2source150unlocked',from:boundaries[0]+.4,to:boundaries[0]+1.6,semitones:2+12*Math.log2(.8)},{name:'shift2source90unlocked',from:boundaries[1]+.4,to:Math.min(boundaries[1]+1.6,shifted-.1),semitones:2+12*Math.log2(4/3)},{name:'shift3liveReplacement',from:shifted+.4,to:melody-.1,semitones:3},{name:'shift3DelayCancellation',from:fx+1,to:mute-.1,semitones:3}];
  report.audio={method:'Fixed Hann DTFT maxima in declared shifted component±1Hz at.25Hz spacing; same-recording ratios, no timing/gain fit. Independent whole recording inspection follows.',sections:windows.map(w=>({...w,channels:measure(decoded,w.from,w.to,w.semitones)})),melodyOnly:{from:melody+.3,to:restored-.1,semitones:3,channels:measure(decoded,melody+.3,restored-.1,3)},delayTail:{from:mute+.03,to:mute+.20,channels:measure(decoded,mute+.03,mute+.20,3)},muted:{from:mute+2.4,to:decoded.duration-.1,channels:measure(decoded,mute+2.4,decoded.duration-.1,3)}};
  for(const section of report.audio.sections)assert(section.channels.every(c=>c.carrier330>.005&&c.cancellationRatio<=.01&&c.bassLeakRatio<=.01),section.name+' cancellation/route coherence');report.checks.push('Known shifted opposing pair and Bass/original rejection below1% through source warp, live pitch-group replacement and normal enabled Delay');
  assert(report.audio.melodyOnly.channels.every(c=>c.carrier330>.005&&c.cancelled550/c.carrier330>=.5),'Dry Melody-only positive control missing');report.checks.push('Actual Vocal removal exposes shifted550Hz positive control before Delay activation');
  assert(report.audio.delayTail.channels.every(c=>c.rms>=.0005),'Actual wet Delay tail absent after all four stems muted');assert(report.audio.muted.channels.every(c=>c.rms<=.00001),'Delay does not decay to declared late silence');report.checks.push('After actual all-stem mutes, real Delay tail remains audible in PCM then falls below fixed late RMS bound');

 }catch(e){report.errors.push({message:e.message,stack:e.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};}}if(d.playing)click(button(0,'play'));await until(()=>!d.playing&&!d.processing,'Stopped');
  report.applicationNotice=$('#notice').textContent;report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===4&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#stem-variable-banks-results').textContent=JSON.stringify(report,null,2);
  const a=$('#stem-variable-banks-download');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='stem-variable-banks-browser-results.json';a.hidden=false;$('#stem-variable-banks-status').textContent=report.completed?'Scoped stem coherence workflow passed; deck paused':'Check failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#stem-variable-banks-run').disabled=false;$('#stem-variable-banks-run').textContent='Run one stem coherence workflow';}
$('#stem-variable-banks-run').addEventListener('click',run);boot().catch(e=>$('#stem-variable-banks-status').textContent=e.message);
