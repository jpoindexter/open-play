const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(v,m)=>{if(!v)throw Error(m);};
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
const sourceFiles=['app.js','engine.js','deck-midi.js','midi-jog-touch.js','jog-bend.js','midi.js','panels.js','midi-jog-touch-harness.js'];
const identities=async()=>Object.fromEntries(await Promise.all(sourceFiles.map(async f=>[f,await hash(await(await fetch(f)).arrayBuffer())])));
async function until(fn,label,ms=12000){const end=performance.now()+ms;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const click=s=>{assert($(s),'Missing '+s);$(s).click();},field=(s,v)=>{assert($(s),'Missing '+s);$(s).value=String(v);};
const button=(n,a)=>`[data-deck="${n}"][data-action="${a}"]`;
function base64(b){let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(s);}
function measure(data,sr,from,to){let power=0;const crossings=[],start=Math.ceil(from*sr),end=Math.floor(to*sr);assert(start>=0&&end<=data.length&&end>start,'Invalid audio window');for(let i=start;i<end;i++){power+=data[i]**2;if(i>start&&data[i-1]<0&&data[i]>=0)crossings.push((i-1-data[i-1]/(data[i]-data[i-1]))/sr);}return{from,to,rms:Math.sqrt(power/(end-start)),hz:crossings.length>3?(crossings.length-1)/(crossings.at(-1)-crossings[0]):null};}
function add(target,type,channel,number,encoding='7-bit absolute'){field('#midi-target',target);field('#midi-type',type);field('#midi-channel',channel);field('#midi-number',number);field('#midi-encoding',encoding);click('#midi-add');}
function send(type,channel,number,value){field('#midi-type',type);field('#midi-channel',channel);field('#midi-number',number);field('#midi-test-value',value);click('#midi-send');}
let app;
async function run(){
 $('#touch-run').disabled=true;const {engine,state}=app;
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual browser MIDI editor, real existing scratch transport and complete master recording; prepared synthetic carriers, physical destination muted. No current native/physical calibration, cold-start latency, scratch musical quality, keylocked/Slip/warp composition or full parity acceptance.',criteria:{heldMaximumRMS:.0001,movingMinimumRMS:.005,minimumSignedCursorMoveSeconds:.07,frequencyErrorHz:.5},events:[],checks:[],errors:[]};
 const event=name=>{const v={name,time:engine.ctx.currentTime-engine.recordStarted};report.events.push(v);return v;};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;
  await until(()=>!state.analysis,'Initial analysis');
  for(let n=0;n<2;n++){
   const d=state.decks[n],buffer=engine.ctx.createBuffer(2,48000*20,48000),data=buffer.getChannelData(n),hz=n?550:330;
   for(let i=0;i<data.length;i++)data[i]=.12*Math.sin(2*Math.PI*hz*i/48000);
   Object.assign(d.track,{bpm:120,grid:0,gridWarpMarkers:[],duration:20,analyzed:true});Object.assign(d,{rate:1,position:0,keylock:false,keyShift:0,reverse:false,loop:false,slip:false,stemSlip:'off',sync:false,vinyl:true});
   engine.clearDeckScratchCache(n);engine.buffers.set(d.track.id,buffer);
  }
  await engine.preloadDeckScratch(state.decks[0]);report.fixturePrepared=true;
  click('[data-panel="midi"]');click('#midi-reset');
  add('Deck 1 jog touch','Note',2,8);add('Deck 1 jog surface','CC',2,10,'Relative two’s complement');add('Deck 1 jog bend','CC',2,9,'Relative two’s complement');add('Deck 1 vinyl','Note',5,1);
  assert(state.mappings.length===4,'Expected four actual editor mappings');click('#modal-close');
  for(let n=0;n<2;n++){click(button(n,'play'));await until(()=>state.decks[n].playing&&!state.decks[n].processing,'Deck start');}
  click('[data-panel="midi"]');await engine.recordStart();event('record-start');await sleep(350);
  send('CC',2,9,10);await until(()=>Math.abs(engine.audibleRate(state.decks[0])-1.08)<1e-6,'Initial rim bend');await sleep(60);
  send('Note',2,8,127);await until(()=>engine.deckScratchRequests.get(0)?.ready,'Scratch touch preparation');
  const transport=engine.voices.get(0).deckScratchTransport;assert(transport,'No scratch transport');const held=event('touch-held');
  await sleep(240);const initial=transport.state().audiblePosition;
  const forward=event('forward-start');for(let n=0;n<20;n++){send('CC',2,10,1);await sleep(20);}
  await sleep(120);const forwardPosition=transport.state().audiblePosition;assert(forwardPosition-initial>.07,'Forward MIDI did not move the actual source cursor');
  const backward=event('backward-start');for(let n=0;n<20;n++){send('CC',2,10,127);await sleep(20);}
  await sleep(120);const backwardPosition=transport.state().audiblePosition;assert(forwardPosition-backwardPosition>.07,'Backward MIDI did not reverse the actual source cursor');
  report.cursor={initial,forwardPosition,backwardPosition};assert(state.decks.slice(0,2).every(d=>d.rate===1),'Touch changed nominal tempo');
  send('Note',2,8,0);await until(()=>!engine.deckScratchRequests.has(0)&&transport.state().phase==='idle'&&state.decks[0].playing,'Touch release');const released=event('release-playing');
  await sleep(400);
  send('Note',5,1,127);send('Note',5,1,0);await until(()=>state.decks[0].vinyl===false,'Vinyl toggle off');
  send('Note',2,8,127);await sleep(30);assert(!engine.deckScratchRequests.has(0),'Vinyl-off touch created a scratch request');
  send('CC',2,10,10);await until(()=>Math.abs(engine.audibleRate(state.decks[0])-1.08)<1e-6,'Post-scratch Vinyl-off bend');const offBend=event('vinyl-off-bend');
  for(let n=0;n<6;n++){await sleep(40);send('CC',2,10,10);}
  send('Note',2,8,0);await until(()=>Math.abs(engine.audibleRate(state.decks[0])-1)<1e-7,'Vinyl-off idle return');const final=event('vinyl-off-return');await sleep(320);
  report.final={playing:state.decks.slice(0,2).map(d=>d.playing),nominal:state.decks.slice(0,2).map(d=>d.rate),audible:state.decks.slice(0,2).map(d=>engine.audibleRate(d)),phase:transport.state().phase};
  assert(report.final.playing.every(Boolean)&&report.final.nominal.every(x=>x===1)&&report.final.audible.every(x=>Math.abs(x-1)<1e-7),'Final play/rate state incorrect');click('#modal-close');
  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};
  const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected stereo');report.decoded={duration:decoded.duration,sampleRate:decoded.sampleRate,frames:decoded.length,channels:2};
  for(let c=0;c<2;c++)for(const v of decoded.getChannelData(c))assert(Number.isFinite(v),'Nonfinite recorded PCM');
  const windows=[['baseline',.1,.3],['touch-hold',held.time+.08,held.time+.20],['forward',forward.time+.10,forward.time+.30],['backward',backward.time+.10,backward.time+.30],['released',released.time+.08,released.time+.30],['vinyl-off-bend',offBend.time+.04,offBend.time+.18],['final',final.time+.06,final.time+.28]];
  report.audio=windows.map(([name,from,to])=>({name,channels:[0,1].map(c=>measure(decoded.getChannelData(c),decoded.sampleRate,from,to))}));
  for(const w of report.audio){const [left,right]=w.channels;assert(right.rms>.005&&Math.abs(right.hz-550)<=.5,w.name+' opposite deck was disrupted');if(w.name==='touch-hold')assert(left.rms<.0001,'Held scratch was not silent');else assert(left.rms>.005,w.name+' left audio was silent');if(['baseline','released','final','vinyl-off-bend'].includes(w.name)){const expected=w.name==='vinyl-off-bend'?356.4:330;assert(Math.abs(left.hz-expected)<=.5,w.name+' expected tone not present');}}
  report.checks=['Actual MIDI mappings route touch/surface/Vinyl commands','Touch holds source while right deck continues','Forward/backward packets move actual scratch cursor and produce master audio','Note Off resumes nominal playback; Vinyl-off surface bends the released scratch transport without entering scratch'];
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};}}
  for(const d of state.decks)engine.pause(d);report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===4&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#touch-original').textContent=JSON.stringify(report,null,2);$('#touch-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in original JSON'}:null},null,2);$('#touch-status').textContent=report.completed?'Scoped touch audio workflow passed; decks stopped':'Failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
$('#touch-run').onclick=()=>run();
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#touch-run').disabled=false;$('#touch-run').textContent='Run one touch-jog audio workflow';}
boot().catch(error=>$('#touch-status').textContent=error.message);
