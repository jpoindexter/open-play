import {sessionKey} from './session-storage.js';
const frame=document.querySelector('#app'),result=document.querySelector('#result'),checks=[],events=[];
const report={checks,events,scope:'Actual file input, GUI EQ/Play/Autoplay, synthetic Cue key lifecycle and whole master. Owned fixtures; no acoustic/manual/hardware acceptance.',criteria:{cutMaximumDB:-6,otherChannelMaximumChangeDB:1,minimumSignalRMS:.003,maximumSilentRMS:.0001,settleSeconds:.15,windowSeconds:.25}};
const assert=(ok,message)=>{if(!ok)throw Error(message);},sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,label){for(let n=0;n<1000;n++){if(test())return;await sleep(20);}throw Error('Timed out: '+label);}
const doc=()=>frame.contentDocument,app=()=>frame.contentWindow.openPlay;
const click=selector=>{const input=doc().querySelector(selector);assert(input,selector);input.click();};
function input(selector,value,type='input'){const el=doc().querySelector(selector);assert(el,selector);el.value=String(value);el.dispatchEvent(new frame.contentWindow.Event(type,{bubbles:true}));}
function key(value,up=false,target=doc().body){target.dispatchEvent(new frame.contentWindow.KeyboardEvent(up?'keyup':'keydown',{key:value,code:'Key'+value.toUpperCase(),bubbles:true,cancelable:true}));}
const frequencies=[[60,1000,10000],[80,1500,11000]];
function wav(index){
 const sr=32000,frames=sr*40,bytes=new ArrayBuffer(44+frames*4),v=new DataView(bytes),text=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
 text(0,'RIFF');v.setUint32(4,bytes.byteLength-8,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sr,true);v.setUint32(28,sr*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,frames*4,true);
 for(let n=0;n<frames;n++){let sample=0;for(const hz of frequencies[index])sample+=.035*Math.sin(2*Math.PI*hz*n/sr);v.setInt16(44+n*4+index*2,Math.round(sample*32767),true);}
 return new frame.contentWindow.File([bytes],`Core fixture ${index?'B':'A'}.wav`,{type:'audio/wav'});
}
async function load(track,index){click(`tr[data-track="${track.id}"]`);click(`[data-action="load"][data-deck="${index}"]`);await until(()=>app().state.decks[index].track===track&&app().engine.buffers.has(track.id)&&!app().state.analysis,'load '+index);}
function base64(bytes){let text='';for(let i=0;i<bytes.length;i+=16384)text+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(text);}
function rms(data,from,to,sr){let power=0;const start=Math.ceil(from*sr),end=Math.floor(to*sr);assert(start>=0&&end<=data.length&&end>start,'Missing declared recording window');for(let n=start;n<end;n++)power+=data[n]**2;return Math.sqrt(power/(end-start));}
function amplitude(data,from,to,sr,hz){let re=0,im=0;const start=Math.ceil(from*sr),end=Math.floor(to*sr);for(let n=start;n<end;n++){re+=data[n]*Math.cos(2*Math.PI*hz*n/sr);im+=data[n]*Math.sin(2*Math.PI*hz*n/sr);}return 2*Math.hypot(re,im)/(end-start);}
const show=()=>result.textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in original evidence'}:undefined},null,2);
async function stage(name,playing,extra={}){const {engine}=app(),at=engine.ctx.currentTime-engine.recordStarted;events.push({name,playing,from:at+.15,to:at+.4,...extra});await sleep(500);}
document.querySelector('#run').onclick=async()=>{
 let originalFile;
 try{
  assert(location.port==='8874','Dedicated port8874 required');assert(localStorage.length===0||localStorage.getItem('openplay-core-controls-owned')==='true','Refusing unowned origin');document.querySelector('#run').disabled=true;
  localStorage.setItem('openplay-core-controls-owned','true');localStorage.setItem(sessionKey,JSON.stringify({settings:{'Use Auto Gain':false,'Analyze Stems':false,'Playback Keys Use Shift':false}}));
  report.sourceHashes=Object.fromEntries(await Promise.all(['app.js','engine.js','holds.js','mixer-curves.js','core-controls-harness.js'].map(async file=>[file,[...new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(file,{cache:'no-store'})).arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')])));
  frame.src='workspace-preview.html?core='+Date.now();await new Promise(resolve=>frame.onload=resolve);await until(()=>app()&&!app().state.analysis,'workspace');
  const {engine,state}=app(),w=frame.contentWindow;await engine.resume();engine.audioMonitor.mutePhysical(true);assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute');state.analysisSettings.onImport=false;
  const transfer=new w.DataTransfer();[wav(0),wav(1)].forEach(file=>transfer.items.add(file));const fileInput=doc().querySelector('#audio-files');fileInput.files=transfer.files;const tracks=await fileInput.onchange({target:fileInput});assert(tracks.length===2,'Fixture import');
  for(const t of tracks)Object.assign(t,{bpm:120,grid:0,gridWarpMarkers:[],analyzed:true});await load(tracks[0],0);await load(tracks[1],1);await until(()=>!state.analysis,'analysis idle');
  for(const d of state.decks.slice(0,2))Object.assign(d,{sync:false,keylock:false,keyShift:0,repeat:false,reverse:false,loop:false,slip:false});
  click('[data-action="play"][data-deck="0"]');click('[data-action="play"][data-deck="1"]');await until(()=>state.decks.slice(0,2).every(d=>d.playing&&!d.processing),'two decks');await engine.recordStart();await stage('EQ baseline',[true,true]);
  for(let index=0;index<2;index++)for(const [bandIndex,band]of ['low','mid','high'].entries()){
   input(`[data-mix="${index}:${band}"]`,-18);await stage(`EQ ${index}:${band}`,[true,true],{cut:{index,bandIndex}});input(`[data-mix="${index}:${band}"]`,0);await sleep(100);
  }
  click('[data-action="play"][data-deck="0"]');click('[data-action="play"][data-deck="1"]');await until(()=>state.decks.slice(0,2).every(d=>!d.playing),'pause');await stage('EQ reset and stopped',[false,false]);checks.push('GUI LOW/MID/HIGH cuts on each deck, reset and stop exercised');
  for(let index=0;index<2;index++){
   const d=state.decks[index],letter=index?'k':'i',overview=doc().querySelector(`[data-seek="${index}"]`);
   // Normal overview keyboard input, then temporary Cue set/hold/release/Play.
   overview.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true,cancelable:true}));await until(()=>engine.position(d)<.001,'overview start');
   for(let i=0;i<2;i++){overview.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));await until(()=>Math.abs(engine.position(d)-(i+1))<.001,'overview seek');}
   key(letter);await until(()=>Math.abs(d.cue-2)<.001,'cue set');key(letter,true);assert(!d.playing,'Setting Cue started audio');
   key(letter);await until(()=>d.playing&&!d.processing,'Cue hold');await stage('Cue hold '+index,[index===0,index===1]);key(letter,true);await until(()=>!d.playing&&Math.abs(engine.position(d)-2)<.001,'Cue release');await stage('Cue release '+index,[false,false]);
   key(letter);await until(()=>d.playing&&!d.processing,'latch hold');click(`[data-action="play"][data-deck="${index}"]`);key(letter,true);await stage('Cue latched '+index,[index===0,index===1]);assert(d.playing&&engine.position(d)>2.2,'Cue plus Play did not latch');click(`[data-action="play"][data-deck="${index}"]`);await until(()=>!d.playing,'latch stop');
   await engine.seek(d,2);key(letter);await until(()=>d.playing,'blur setup');w.dispatchEvent(new w.Event('blur'));await until(()=>!d.playing&&Math.abs(engine.position(d)-2)<.001,'blur release');await stage('Cue blur '+index,[false,false]);
  }checks.push('Both decks: Cue set, recorded hold, release paused, Cue+Play latch, explicit stop and blur cleanup');
  input('#search','Core fixture');const [left,right]=state.decks,autoplay=()=>click('#autoplay');
  originalFile=tracks[1].file;engine.buffers.delete(tracks[1].id);let reads=0;tracks[1].file={async arrayBuffer(){reads++;throw Error('Controlled fixture file unavailable');}};
  await load(tracks[0],0);await engine.seek(left,tracks[0].duration-.08);if(!state.autoplay)autoplay();click('[data-action="play"][data-deck="0"]');await until(()=>reads>0&&left.track===tracks[1]&&!left.playing&&!left.processing,'failed Autoplay load');await stage('Autoplay load failed',[false,false]);assert(reads===1,'Failed load attempted to start/decode again');report.failedLoad={decodeAttempts:reads,playing:left.playing};
  tracks[1].file=originalFile;await load(tracks[0],0);await engine.seek(left,tracks[0].duration-.08);engine.buffers.delete(tracks[1].id);let release,decoding=false;const wait=new Promise(resolve=>release=resolve);tracks[1].file={async arrayBuffer(){decoding=true;await wait;return originalFile.arrayBuffer();}};
  click('[data-action="play"][data-deck="0"]');await until(()=>decoding,'delayed next decode');autoplay();assert(!state.autoplay,'Autoplay off');release();await until(()=>engine.bufferLoads.size===0&&left.track===tracks[1],'delayed load finish');await stage('Autoplay disabled during load',[false,false]);assert(!left.playing&&!left.playQueued,'Disabled Autoplay restarted');
  tracks[1].file=originalFile;await load(tracks[0],0);await engine.seek(left,tracks[0].duration-.08);autoplay();click('[data-action="play"][data-deck="0"]');await until(()=>left.track===tracks[1]&&left.playing&&!left.processing,'successful automatic next start');report.successfulAutoplay=true;click('[data-action="play"][data-deck="0"]');if(state.autoplay)autoplay();await stage('Final stop',[false,false]);const positions=state.decks.map(d=>engine.position(d));await sleep(500);assert(state.decks.every((d,i)=>!d.playing&&!d.playQueued&&!d.processing&&Math.abs(engine.position(d)-positions[i])<.001),'Queued restart or moving stopped clock');checks.push('Natural end: failed load stops, Autoplay-off during decode cancels start, valid next track starts once, final stop stays stopped');
 }catch(error){report.error=error.stack;}
 finally{
  if(app()){
   const {engine,state}=app();if(originalFile)state.tracks.find(t=>t.title==='Core fixture B')?.file&&(state.tracks.find(t=>t.title==='Core fixture B').file=originalFile);
   for(const k of ['i','k'])key(k,true);engine.silence();
   if(engine.recording){const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={format:blob.type,bytes:bytes.length,base64:base64(bytes)};
    try{
     const audio=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));report.decoded={sampleRate:audio.sampleRate,frames:audio.length,channels:audio.numberOfChannels};for(let c=0;c<audio.numberOfChannels;c++)for(const v of audio.getChannelData(c))assert(Number.isFinite(v),'Nonfinite whole recording');
     const baseline=events.find(e=>e.name==='EQ baseline'),base=frequencies.map((hzs,c)=>hzs.map(hz=>amplitude(audio.getChannelData(c),baseline.from,baseline.to,audio.sampleRate,hz)));
     for(const e of events){e.measuredRMS=[0,1].map(c=>rms(audio.getChannelData(c),e.from,e.to,audio.sampleRate));for(let c=0;c<2;c++)assert(e.playing[c]?e.measuredRMS[c]>.003:e.measuredRMS[c]<.0001,e.name+' channel '+c+' signal/silence');if(e.cut){e.measuredDB=frequencies.map((hzs,c)=>hzs.map((hz,i)=>20*Math.log10(amplitude(audio.getChannelData(c),e.from,e.to,audio.sampleRate,hz)/base[c][i])));assert(e.measuredDB[e.cut.index][e.cut.bandIndex]<-6,'EQ cut ineffective');assert(e.measuredDB[1-e.cut.index].every(db=>Math.abs(db)<1),'EQ changed other channel');}}
     assert(events.length===19,'Missing declared audio windows');report.audioPassed=true;
    }catch(error){report.audioError=error.stack;}
   }
   report.metadataTracks=state.tracks.length;report.previewImages=doc().querySelectorAll('.library-wave-preview[data-preview-state="ready"] img').length;report.controls={play:doc().querySelectorAll('[data-action="play"]').length,eq:doc().querySelectorAll('[data-mix$=":low"]').length};
  }
  if(!report.error&&(report.metadataTracks!==10||report.previewImages!==2||report.controls.play!==2||report.controls.eq!==2))report.error='Core metadata, filtered previews or controls missing';
  report.complete=checks.length===3&&report.audioPassed&&!report.error;document.querySelector('#original').textContent=JSON.stringify(report);show();
 }
};

document.querySelector('#cue-refresh-run').onclick=async()=>{
 let engine,state;const r={complete:false,scope:'Actual four-deck Compact Cue key release with generated audio, physical output muted; no listening/native/pointer-capture proof.'};
 try{
  assert(location.port==='8874','Dedicated port8874 required');
  assert(localStorage.length===0||localStorage.getItem('openplay-core-controls-owned')==='true','Refusing unowned origin');
  localStorage.setItem('openplay-core-controls-owned','true');
  localStorage.setItem(sessionKey,JSON.stringify({settings:{'Analyze Stems':false,'Playback Keys Use Shift':false}}));
  frame.src='workspace-preview.html?cue-refresh='+Date.now();await new Promise(resolve=>frame.onload=resolve);
  await until(()=>app()&&!app().state.analysis,'workspace');({engine,state}=app());
  await engine.resume();engine.audioMonitor.mutePhysical(true);assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute');
  input('#deck-count',4,'change');await until(()=>doc().querySelectorAll('[data-action="play"]').length===4,'four decks');
  await until(()=>doc().querySelectorAll('.library-wave-preview img').length>0,'library previews');
  const d=state.decks[0],w=frame.contentWindow,cue=doc().querySelector('[data-action="cue"][data-deck="0"]');
  cue.focus();cue.dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));
  await until(()=>d.playing&&!d.processing,'temporary Cue audition');
  const selector='.deck button,.deck input,#mixer button,#mixer input,[data-waveform-scrub],#detail-wave,tr[data-track],.library-wave-preview img',nodes=[...doc().querySelectorAll(selector)];
  const knob=doc().querySelector('[data-mix="1:level"]');knob.focus();const value=knob.value;
  knob.dispatchEvent(new w.KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true,cancelable:true}));
  await until(()=>!d.playing&&!d.processing,'Cue release');
  await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));
  r.observedNodes=nodes.length;r.retainedNodes=nodes.filter(n=>n.isConnected).length;r.unrelatedMixerFocused=doc().activeElement===knob;
  r.mixerValueRetained=knob.isConnected&&knob.value===value;r.playControls=doc().querySelectorAll('[data-action="play"]').length;
  r.previewImages=doc().querySelectorAll('.library-wave-preview img').length;r.cueReturnedPaused=Math.abs(engine.position(d)-d.cue)<.001;
  assert(r.retainedNodes===r.observedNodes&&r.unrelatedMixerFocused&&r.mixerValueRetained,'Cue release replaced controls or lost unrelated mixer focus');
  assert(r.playControls===4&&r.previewImages>0&&r.cueReturnedPaused,'Cue return or controls/previews missing');r.complete=true;
 }catch(error){r.error=error.message;}
 finally{
  if(engine&&state){for(const d of state.decks)engine.pause(d);r.physicalMuted=engine.audioMonitor.snapshot().physicalMuted;r.allStopped=state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued);}
  result.textContent=JSON.stringify(r,null,2);
 }
};
