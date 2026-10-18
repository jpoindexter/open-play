const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(x,m)=>{if(!x)throw Error(m);};
const hash=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','panels.js','beatgrid.js','smart-sync.js','sync-tempo-handoff.js','variable-pitch-warp-harness.js','keylock-shadow-live.js','pcm-resample.js','pitch-time-map.js','vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs'];
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
function spectrum(data,sr){
 let n=1,power=0;while(n<data.length*2)n*=2;const re=new Float64Array(n),im=new Float64Array(n);
 for(let i=0;i<data.length;i++){power+=data[i]*data[i];re[i]=data[i]*(.5-.5*Math.cos(2*Math.PI*i/(data.length-1)));}
 for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[re[i],re[j]]=[re[j],re[i]];}
 for(let len=2;len<=n;len*=2){const wr=Math.cos(-2*Math.PI/len),wi=Math.sin(-2*Math.PI/len);for(let start=0;start<n;start+=len){let ar=1,ai=0;for(let j=0;j<len/2;j++){const a=start+j,b=a+len/2,tr=re[b]*ar-im[b]*ai,ti=re[b]*ai+im[b]*ar;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;[ar,ai]=[ar*wr-ai*wi,ar*wi+ai*wr];}}}
 const energy=k=>re[k]*re[k]+im[k]*im[k];let k=Math.max(1,Math.floor(200*n/sr));for(let i=k+1;i<=Math.min(n/2-2,Math.ceil(1000*n/sr));i++)if(energy(i)>energy(k))k=i;
 const a=Math.log(Math.max(1e-30,energy(k-1))),b=Math.log(Math.max(1e-30,energy(k))),c=Math.log(Math.max(1e-30,energy(k+1))),denom=a-2*b+c,offset=Math.abs(denom)>1e-12?.5*(a-c)/denom:0;
 return{frames:data.length,rms:Math.sqrt(power/data.length),hz:(k+Math.max(-.5,Math.min(.5,offset)))*sr/n};
}
let app;
async function run(){
 $('#variable-pitch-warp-run').disabled=true;const {engine,state}=app;
 const report={startedAt:new Date().toISOString(),completed:false,checks:[],errors:[],probes:[],criteria:{maximumPulsePhaseErrorSeconds:.01,minimumPairsPerSection:3,sourceRateTolerance:1e-6,maximumCarrierErrorHz:1,minimumCarrierRMS:.005},fixture:{sampleRate:48000,duration:30,primary:{bpm:120,offset:.05},secondary:{bpm:120,offset:.13,markers:[{time:4.13,bpm:150},{time:7.33,bpm:90}]},pulseSeconds:.012,pulseCarrierHz:3000,continuousCarrierHz:[550,330],expectedCarrierHz:[550,330*2**(2/12)],secondarySemitones:2,continuousAmplitude:.08,amplitude:.15},scope:'Actual app grid/Setup/Key+/Play/Smart Sync/shared tempo controls with primary keylock and secondary keylock OFF/non-loop/+2semitones, source120→150→90BPM, one continuous master recording. No native/hardware/music/full-reference acceptance.'};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;await until(()=>!state.analysis,'Initial analysis');
  for(let index=0;index<2;index++){
   const d=state.decks[index],b=engine.ctx.createBuffer(2,48000*30,48000),a=b.getChannelData(index);
   Object.assign(d.track,{bpm:120,grid:index?.13:.05,gridWarpMarkers:[],gridMarkers:[],duration:30,analyzed:true,metadataRevision:(d.track.metadataRevision||0)+1});
   Object.assign(d,{rate:1,keylock:false,keyShift:0,position:0,reverse:false,loop:false,stemSlip:'off',sync:false});
   const times=[];
   if(index===0)for(let n=0;.05+n*.5<30;n++)times.push(.05+n*.5);
   else{for(let n=0;n<8;n++)times.push(.13+n*.5);for(let n=0;n<8;n++)times.push(4.13+n*.4);for(let n=0;7.33+n*2/3<30;n++)times.push(7.33+n*2/3);}
   for(let n=0;n<a.length;n++)a[n]=.08*Math.sin(2*Math.PI*report.fixture.continuousCarrierHz[index]*n/48000);
   for(const at of times){const first=Math.round(at*48000);for(let n=0;n<576&&first+n<a.length;n++)a[first+n]+=.15*Math.sin(Math.PI*n/576)*Math.sin(2*Math.PI*3000*n/48000);}
   engine.clearDeckScratchCache(index);engine.buffers.set(d.track.id,b);
  }
  click(button(1,'grid'));
  for(const marker of report.fixture.secondary.markers){value('#grid-warp-time',marker.time);value('#grid-warp-bpm',marker.bpm);click('#grid-marker');}
  click('#grid-save');await until(()=>!$('#modal').open,'Grid save');
  assert(JSON.stringify(state.decks[1].track.gridWarpMarkers)===JSON.stringify(report.fixture.secondary.markers),'Saved marker map mismatch');
  report.persistedMarkers=JSON.parse(localStorage.getItem('openplay-review-v1')).tags[state.decks[1].track.id].gridWarpMarkers;
  assert(JSON.stringify(report.persistedMarkers)===JSON.stringify(report.fixture.secondary.markers),'Warp markers were not persisted');report.checks.push('Actual grid editor stages and saves both tempo markers with metadata persistence');
  click('[data-panel="settings"]');setting('Sync Mode','Smart Sync');click('#save-settings');
  click(button(0,'keylock'));click(button(1,'keylock'));
  await until(()=>state.decks[0].keylock&&state.decks[1].keylock,'Both keylocks');
  click(button(1,'keyUp'));await until(()=>state.decks[1].keyShift===1,'First key');click(button(1,'keyUp'));await until(()=>state.decks[1].keyShift===2,'Second key');click(button(1,'keylock'));await until(()=>!state.decks[1].keylock,'Secondary keylock off');
  click(button(0,'sync'));click(button(0,'play'));await until(()=>state.decks[0].playing,'Primary playing');
  click(button(1,'sync'));await until(()=>state.decks[1].syncState==='armed','Secondary armed');click(button(1,'play'));await until(()=>state.decks[1].playing&&!state.decks[1].processing,'Warped playing');
  await engine.recordStart();report.recordStart=engine.ctx.currentTime;
  const voice=engine.voices.get(1),events=voice.gridTimeline.events;report.scheduledEvents=events.map(e=>({...e}));
  assert(voice.liveKeylock&&events.length===3,'Actual warped keylock owner not installed');report.initialAdapters=[0,1].map(i=>engine.voices.get(i).liveKeylock.snapshot());report.secondaryPitchMode={resampled:report.initialAdapters[1].resamplePitch,keylock:state.decks[1].keylock,keyShift:state.decks[1].keyShift};assert(!state.decks[1].keylock&&state.decks[1].keyShift===2,'Wrong secondary keylock state');
  async function reach(at){await until(()=>engine.ctx.currentTime>=at,'Audio observation',20000);}
  async function probe(label,expected){const d=state.decks[1],v=engine.voices.get(1),snapshot=v.liveKeylock.snapshot();report.probes.push({label,audioTime:engine.ctx.currentTime,position:engine.position(d),adapterState:snapshot.state,clockRate:engine.audibleRate(d),shownBPM:$('#platter-1 strong').textContent});assert(Math.abs(snapshot.state.rate-expected)<1e-6,label+' scheduled keylock rate');}
  await reach(events[1].when+1);await probe('150 BPM source section',.8);
  await reach(events[2].when+1);await probe('90 BPM source section',4/3);await reach(events[2].when+2.5);
  const priorVoices=[engine.voices.get(0),engine.voices.get(1)];report.tempoTransition={callAudioTime:engine.ctx.currentTime,callAt:performance.now()};
  value('[data-tempo="0"]',4);$('[data-tempo="0"]').dispatchEvent(new Event('input',{bubbles:true}));
  await until(()=>state.decks.slice(0,2).every((d,i)=>!d.processing&&engine.voices.get(i)!==priorVoices[i])&&Math.abs(engine.audibleRate(state.decks[0])-1.04)<1e-6&&Math.abs(engine.audibleRate(state.decks[1])-124.8/90)<1e-6,'Shared tempo accepted',20000);
  report.tempoTransition.settledAudioTime=engine.ctx.currentTime;report.tempoTransition.scheduledReadinessMs=performance.now()-report.tempoTransition.callAt;report.tempoTransition.anchorTimes=state.decks.slice(0,2).map(d=>d.anchorTime);report.tempoTransition.adapters=[0,1].map(i=>engine.voices.get(i).liveKeylock.snapshot());
  assert(report.tempoTransition.anchorTimes[0]===report.tempoTransition.anchorTimes[1],'Prepared group did not share its anchor');await reach(report.tempoTransition.settledAudioTime+2.8);

  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected whole stereo recording');report.decoded={frames:decoded.length,sampleRate:decoded.sampleRate,channels:2,duration:decoded.duration};
  for(let c=0;c<2;c++)for(const value of decoded.getChannelData(c))assert(Number.isFinite(value),'Non-finite whole recording');
  const pulseAudio=await pulseBand(decoded),times=[0,1].map(c=>pulses(pulseAudio.getChannelData(c),decoded.sampleRate));
  const boundary=events.slice(1).map(e=>e.when-report.recordStart);
  const windows=[{rate:1,name:'base120',from:.4,to:boundary[0]-.3},{rate:.8,name:'source150',from:boundary[0]+.3,to:boundary[1]-.3},{rate:4/3,name:'source90',from:boundary[1]+.3,to:report.tempoTransition.callAudioTime-report.recordStart-.2},{rate:124.8/90,name:'shared124.8',from:report.tempoTransition.settledAudioTime-report.recordStart+.3,to:report.tempoTransition.settledAudioTime-report.recordStart+2.3}];
  report.audio={pulseMeasurement:'Two identical offline highpass biquads at2000Hz/Q.707 suppress continuous330/550 carriers; absolute.01 threshold/100ms refractory. No temporal fitting.',pulseTimes:times,sections:windows.map(w=>({...w,pairs:times[0].filter(t=>t>=w.from&&t<=w.to).map(t=>({time:t,errorSeconds:Math.min(...times[1].map(r=>Math.abs(t-r)))})),carriers:[0,1].map(c=>spectrum(decoded.getChannelData(c).subarray(Math.round((w.from+.1)*decoded.sampleRate),Math.round(Math.min(w.to,w.from+1.1)*decoded.sampleRate)),decoded.sampleRate))}))};
  for(const section of report.audio.sections){
   assert(section.pairs.length>=3&&section.pairs.every(p=>p.errorSeconds<=.01),section.name+' actual warped pulse phase');
   assert(section.carriers.every((tone,c)=>tone.rms>.005&&Math.abs(tone.hz-report.fixture.expectedCarrierHz[c]*(c?section.rate:1))<=1),section.name+' unlocked pitch');
  }
  report.checks.push('Actual unlocked shifted secondary stays aligned within10ms across both source-tempo boundaries');report.checks.push('Primary550Hz and variable shifted secondary330Hz remain within1Hz across source rates');report.checks.push('Normal shared tempo control prepares both voices at one future anchor and recorded pulses stay aligned afterward');
 }catch(e){report.errors.push({message:e.message,stack:e.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:b64(bytes)};}}for(let i=0;i<2;i++)if(state.decks[i].playing)click(button(i,'play'));await until(()=>state.decks.every(d=>!d.playing&&!d.processing),'Stopped');
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===4&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#variable-pitch-warp-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in original report'}:null},null,2);
  $('#variable-pitch-warp-original').textContent=JSON.stringify(report,null,2);
  const a=$('#variable-pitch-warp-download');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='variable-pitch-warp-browser-results.json';a.hidden=false;$('#variable-pitch-warp-status').textContent=report.completed?'Scoped unlocked warped-pitch workflow passed; all decks paused':'Check failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#variable-pitch-warp-run').disabled=false;$('#variable-pitch-warp-run').textContent='Run two-deck shifted Sync workflow';}
$('#variable-pitch-warp-run').addEventListener('click',run);boot().catch(e=>$('#variable-pitch-warp-status').textContent=e.message);
