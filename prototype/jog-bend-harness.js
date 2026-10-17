const $=selector=>document.querySelector(selector),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw Error(message);};
const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
const sources=['app.js','engine.js','deck-midi.js','jog-bend.js','midi.js','panels.js','jog-bend-harness.js'];
const identities=async()=>Object.fromEntries(await Promise.all(sources.map(async file=>[file,await hash(await(await fetch(file)).arrayBuffer())])));
const click=selector=>{assert($(selector),'Missing '+selector);$(selector).click();};
const field=(selector,value)=>{assert($(selector),'Missing '+selector);$(selector).value=String(value);};
async function until(predicate,label,ms=12000){const deadline=performance.now()+ms;while(!predicate()){assert(performance.now()<deadline,label+' timed out');await sleep(10);}}
const button=(index,action)=>`[data-deck="${index}"][data-action="${action}"]`;
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);}
function frequency(data,sampleRate,from,to){
 const first=Math.ceil(from*sampleRate),last=Math.floor(to*sampleRate),times=[];let power=0;
 assert(first>=0&&last<=data.length&&last>first,'Invalid recording window');
 for(let i=first;i<last;i++){const v=data[i];power+=v*v;if(i>first&&data[i-1]<0&&v>=0)times.push((i-1-data[i-1]/(v-data[i-1]))/sampleRate);}
 assert(times.length>20,'Too few audio crossings');
 return{from,to,hz:(times.length-1)/(times.at(-1)-times[0]),rms:Math.sqrt(power/(last-first))};
}
let app;
async function run(){
 $('#jog-run').disabled=true;const {state,engine}=app;
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual browser app MIDI editor + real engine + complete master recording with controlled tones. No native/current hardware, keylocked audio, warped/gesture composition, scratch or musical-quality acceptance.',criteria:{frequencyErrorHz:.5,minimumPhaseAdvanceSeconds:.035,maximumPhaseAdvanceSeconds:.1,maximumPostReturnPhaseDriftSeconds:.003,maximumIdleReturnSeconds:.5},events:[],checks:[],errors:[]};
 const event=name=>{const x={name,time:engine.ctx.currentTime-engine.recordStarted};report.events.push(x);return x;};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);
  await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical output mute');report.physicalOutputMuted=true;
  await until(()=>!state.analysis,'Initial analysis');assert(state.settings['Sync Mode']==='Simple Sync','Expected fresh default Simple Sync');
  for(let index=0;index<2;index++){
   const d=state.decks[index],buffer=engine.ctx.createBuffer(2,48000*20,48000),data=buffer.getChannelData(index),hz=index?550:330;
   for(let i=0;i<data.length;i++)data[i]=.12*Math.sin(2*Math.PI*hz*i/48000);
   Object.assign(d.track,{duration:20,bpm:120,grid:0,gridWarpMarkers:[],analyzed:true});
   Object.assign(d,{rate:1,keylock:false,keyShift:0,reverse:false,loop:false,stemSlip:'off',position:0,sync:false});
   engine.clearDeckScratchCache(index);engine.buffers.set(d.track.id,buffer);
  }
  click('[data-panel="midi"]');click('#midi-reset');field('#midi-target','Deck 1 jog bend');field('#midi-encoding','Relative two’s complement');field('#midi-type','CC');field('#midi-channel',2);field('#midi-number',9);click('#midi-add');
  assert(state.mappings.some(m=>m.target==='Deck 1 jog bend'&&m.channel===2&&m.number===9),'Actual editor did not add jog mapping');click('#modal-close');
  click(button(1,'sync'));await until(()=>state.decks.slice(0,2).every(d=>d.sync),'Actual Simple Sync');
  click(button(0,'play'));await until(()=>state.decks[0].playing&&!state.decks[0].processing,'Deck 1 start');
  click(button(1,'play'));await until(()=>state.decks[1].playing&&!state.decks[1].processing,'Deck 2 start');
  const owners=state.decks.slice(0,2).map(d=>engine.voices.get(d.index));
  click('[data-panel="midi"]');field('#midi-type','CC');field('#midi-channel',2);field('#midi-number',9);field('#midi-test-value',10);
  await engine.recordStart();event('record-start');await sleep(500);
  const before=engine.position(state.decks[0])-engine.position(state.decks[1]);
  const beginning=event('bend-input-start');click('#midi-send');await until(()=>Math.abs(engine.audibleRate(state.decks[0])-1.08)<1e-6,'Bend applied');
  for(let i=0;i<15;i++){await sleep(40);click('#midi-send');}
  const ending=event('last-wheel-message');report.during={nominal:state.decks.slice(0,2).map(d=>d.rate),audible:state.decks.slice(0,2).map(d=>engine.audibleRate(d)),bothSynced:state.decks.slice(0,2).every(d=>d.sync)};
  assert(report.during.nominal.every(x=>x===1),'Jog changed nominal tempo');assert(Math.abs(report.during.audible[1]-1)<1e-7,'Jog changed opposite synced deck speed');
  await until(()=>Math.abs(engine.audibleRate(state.decks[0])-1)<1e-7,'Idle nominal return',1500);const returned=event('idle-return');
  report.idleReturnSeconds=returned.time-ending.time;assert(report.idleReturnSeconds<=.5,'Idle return exceeded declared bound');
  const after=engine.position(state.decks[0])-engine.position(state.decks[1]);report.phaseAdvanceSeconds=after-before;
  assert(report.phaseAdvanceSeconds>.035&&report.phaseAdvanceSeconds<.1,'No bounded source-clock phase advance');
  await sleep(450);const stable=engine.position(state.decks[0])-engine.position(state.decks[1]);report.postReturnPhaseDriftSeconds=stable-after;
  assert(Math.abs(stable-after)<=.003,'Clock drift persisted after nominal return');
  assert(state.decks.slice(0,2).every((d,i)=>engine.voices.get(d.index)===owners[i]),'Jog replaced a playing source');
  assert(state.decks.slice(0,2).every(d=>d.rate===1),'Nominal tempo changed after return');click('#modal-close');
  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected stereo');
  report.decoded={duration:decoded.duration,sampleRate:decoded.sampleRate,frames:decoded.length,channels:2};
  for(let c=0;c<2;c++)for(const sample of decoded.getChannelData(c))assert(Number.isFinite(sample),'Nonfinite recorded audio');
  const windows=[{name:'baseline',from:.15,to:.4,left:330},{name:'bend',from:beginning.time+.12,to:beginning.time+.42,left:356.4},{name:'returned',from:returned.time+.08,to:returned.time+.38,left:330}];
  report.audio=windows.map(w=>({name:w.name,expectedHz:[w.left,550],channels:[0,1].map(c=>frequency(decoded.getChannelData(c),decoded.sampleRate,w.from,w.to))}));
  for(const w of report.audio)w.channels.forEach((m,c)=>{assert(m.rms>.005,`${w.name} channel${c} is silent`);assert(Math.abs(m.hz-w.expectedHz[c])<=.5,`${w.name} channel${c} frequency ${m.hz} differs from ${w.expectedHz[c]}`);});
  report.checks=['Actual MIDI editor mapping and repeated explicitly synthetic wheel messages','Only addressed synced deck changes audible speed; both nominal rates remain1','Idle return retains phase advance and restores equal clock speed','Same source owners throughout; finite stereo recording has predicted frequencies before/during/after'];
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{
  if(engine.recording){const b=await engine.recordStop();if(b){const bytes=new Uint8Array(await b.arrayBuffer());report.recording={bytes:bytes.length,format:b.type,sha256:await hash(bytes),base64:base64(bytes)};}}
  for(const d of state.decks)engine.pause(d);
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===4&&!report.errors.length&&report.sourceStable;
  report.finishedAt=new Date().toISOString();$('#jog-original').textContent=JSON.stringify(report,null,2);$('#jog-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in original downloadable JSON'}:null},null,2);
  const link=$('#jog-download');link.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));link.download='jog-bend-browser-results.json';link.hidden=false;
  $('#jog-status').textContent=report.completed?'Scoped audio workflow passed; decks stopped':'Failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
$('#jog-run').onclick=()=>run();
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app boot');app=window.openPlay;$('#jog-run').disabled=false;$('#jog-run').textContent='Run one jog-bend audio workflow';}
boot().catch(error=>$('#jog-status').textContent=error.message);
