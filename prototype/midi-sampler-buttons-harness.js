const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','panels.js','deck-midi.js','midi.js','midi-sampler-buttons-harness.js'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,await hash(await(await fetch(f)).arrayBuffer())])));
async function until(fn,label,ms=12000){const end=performance.now()+ms;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const click=s=>{assert($(s),'Missing '+s);$(s).click();},field=(s,v)=>{assert($(s),'Missing '+s);$(s).value=String(v);};
const button=(n,a)=>`[data-deck="${n}"][data-action="${a}"]`;
function add(target,ch,n){field('#midi-target',target);field('#midi-type','Note');field('#midi-channel',ch);field('#midi-number',n);field('#midi-encoding','7-bit absolute');click('#midi-add');}
function send(ch,n,value=127){field('#midi-type','Note');field('#midi-channel',ch);field('#midi-number',n);field('#midi-test-value',value);click('#midi-send');}
function press(ch,n){send(ch,n);send(ch,n,0);}
function base64(b){let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(s);}
function measure(data,sr,from,to){let power=0;const crossings=[],start=Math.ceil(from*sr),end=Math.floor(to*sr);assert(start>=0&&end<=data.length&&end>start,'Invalid measurement window');for(let i=start;i<end;i++){power+=data[i]**2;if(i>start&&data[i-1]<0&&data[i]>=0)crossings.push((i-1-data[i-1]/(data[i]-data[i-1]))/sr);}return{from,to,rms:Math.sqrt(power/(end-start)),hz:crossings.length>3?(crossings.length-1)/(crossings.at(-1)-crossings[0]):null};}
let app;
async function run(){
 $('#sample-run').disabled=true;const {engine,state}=app;
 const report={startedAt:new Date().toISOString(),completed:false,scope:'Actual browser MIDI editor and app actions; complete controlled sampler master recording. No native, hardware, full pad-bank/reference, model/pitch quality or persistence acceptance.',criteria:{frequencyErrorHz:.5,silentMaximumRMS:.0001,playingMinimumRMS:.005,quantizeSetting:'1 Beat'},events:[],checks:[],errors:[]};
 const event=name=>{const v={name,time:engine.ctx.currentTime-engine.recordStarted};report.events.push(v);return v;};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');report.physicalOutputMuted=true;await until(()=>!state.analysis,'Initial analysis');
  state.quantize=true;state.settings['Quantize Value']='1 Beat';const tracks=state.decks.slice(0,2).map(d=>d.track);
  for(let n=0;n<2;n++){
   const d=state.decks[n],buffer=engine.ctx.createBuffer(2,48000*20,48000),data=buffer.getChannelData(n);
   for(let i=0;i<data.length;i++)data[i]=.12*Math.sin(2*Math.PI*(n?550:330)*i/48000);
   Object.assign(d.track,{bpm:120,grid:0,gridWarpMarkers:[],duration:20,cues:Array(8).fill(null),analyzed:true,sampleGain:0});Object.assign(d,{rate:1,position:0,keylock:false,keyShift:0,reverse:false,loop:false,stemSlip:'off',slip:false,sync:false});delete d.quantize;
   engine.clearDeckScratchCache(n);engine.buffers.set(d.track.id,buffer);d.level=0;engine.mix(n,'level',0);await engine.seek(d,.23);
  }
  Object.assign(state.samples[0][0],{track:tracks[0].id,mode:'Hold',volume:80,pitch:0,keylock:false});Object.assign(state.samples[1][0],{track:tracks[1].id,mode:'Hold',volume:80,pitch:0,keylock:false});state.samples[1][7].track=null;
  click('[data-panel="midi"]');click('#midi-reset');
  for(const [target,ch,n]of [['Sampler 1',7,48],['Sampler 1',8,48],['Sampler 8 alt',8,63],['Sampler 1 alt',8,56],['Deck 1 quantize',2,2],['Deck 1 hot cue 1',7,0],['Deck 2 hot cue 1',8,0],['Deck 1 tempo range',5,2],['Deck 1 slip',2,1],['Deck 1 previous',5,6],['Deck 1 stutter',5,7],['Deck 1 play',2,7]])add(target,ch,n);
  press(2,2);await until(()=>state.decks[0].quantize===false,'Per-deck Quantize off');press(7,0);press(8,0);await until(()=>tracks.every(t=>t.cues[0]),'Cue creation');
  report.quantize={cuePositions:tracks.map(t=>t.cues[0].position),header:$('#quantize').getAttribute('aria-pressed'),buttons:[0,1].map(n=>$(button(n,'quantize')).getAttribute('aria-pressed'))};
  assert(report.quantize.cuePositions[0]===.23&&report.quantize.cuePositions[1]===0,'Per-deck Quantize did not change real cue placement');assert(report.quantize.header==='mixed'&&report.quantize.buttons.join(',')==='false,true','Quantize visual/ARIA states are wrong');
  press(5,2);press(2,1);await until(()=>state.decks[0].pitchRange===16&&state.decks[0].slip,'Range and Slip actions');report.controls={range:state.decks[0].pitchRange,tempoSliderMaximum:Number($('[data-tempo="0"]').max),slip:state.decks[0].slip};assert(report.controls.tempoSliderMaximum===16,'Range did not update actual tempo slider');
  click('#modal-close');click('#quantize');assert(state.decks.slice(0,2).every(d=>d.quantize===true)&&$('#quantize').getAttribute('aria-pressed')==='true','Global Quantize did not set both decks');
  state.selected=tracks[1].id;click(button(0,'load'));await until(()=>state.decks[0].track===tracks[1],'Replacement deck load');click('[data-panel="midi"]');press(5,6);await until(()=>state.decks[0].track===tracks[0]&&!state.decks[0].processing,'MIDI previous track');report.previous={id:state.decks[0].track.id,position:engine.position(state.decks[0])};assert(Math.abs(report.previous.position-.23)<.002,'Previous track position was lost');
  press(5,7);await until(()=>state.decks[0].playing&&!state.decks[0].processing,'MIDI stutter starts paused deck');report.stutter={playing:true,position:engine.position(state.decks[0])};assert(report.stutter.position<.15,'Stutter did not seek temporary cue');press(2,7);await until(()=>!state.decks[0].playing,'Stop stutter playback');click('#modal-close');
  click('[data-panel="sampler"]');click('[data-sample-bank="0"]');assert(engine.samplerRoute==='Master','Expected master sampler bus');click('[data-panel="midi"]');
  await engine.recordStart();event('record-start');await sleep(120);
  send(7,48);await until(()=>engine.samples?.has(0),'Bank A Hold voice');const a=event('bank-a-only');await sleep(260);
  click('#modal-close');click('[data-sample-bank="1"]');click('[data-panel="midi"]');send(8,48);await until(()=>engine.samples?.has(8),'Bank B Hold voice');const both=event('both-banks');await sleep(240);
  click('[data-midi-remove="0"]');assert(!state.mappings.some(m=>m.channel===7&&m.number===48),'Original input mapping was not removed');send(7,48,0);await until(()=>!engine.samples?.has(0)&&engine.samples?.has(8),'Release original bank after mapping removal');const b=event('bank-b-only');await sleep(260);
  add('Sampler 1',7,48);send(7,48);await sleep(30);send(8,48,0);await sleep(30);assert(engine.samples?.has(8),'Old slot owner stopped newer trigger');const newer=event('newer-slot-owner');await sleep(240);
  send(8,63);send(8,63,0);await until(()=>state.samples[1][7].track===state.selected,'Shift empty-slot load');assert(!engine.samples?.has(15),'Alternate load unexpectedly played');
  send(8,56);send(8,56,0);await until(()=>!engine.samples?.has(8),'Shift stop loaded sample');send(7,48,0);const stopped=event('shift-stop-silence');await sleep(280);click('#modal-close');
  report.sampleState={selectedBank:state.bank,emptySlotLoaded:state.samples[1][7].track,remainingVoices:[...(engine.samples?.keys()||[])]};assert(report.sampleState.remainingVoices.length===0,'Samples still active');
  const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));assert(decoded.numberOfChannels===2,'Expected stereo');report.decoded={duration:decoded.duration,sampleRate:decoded.sampleRate,frames:decoded.length,channels:2};for(let c=0;c<2;c++)for(const v of decoded.getChannelData(c))assert(Number.isFinite(v),'Nonfinite PCM');
  const windows=[['bank-a',a.time+.08,a.time+.22,[330,null]],['both',both.time+.06,both.time+.18,[330,550]],['bank-b',b.time+.08,b.time+.22,[null,550]],['new-owner',newer.time+.06,newer.time+.20,[null,550]],['stopped',stopped.time+.08,stopped.time+.23,[null,null]]];
  report.audio=windows.map(([name,from,to,expected])=>({name,expected,channels:[0,1].map(c=>measure(decoded.getChannelData(c),decoded.sampleRate,from,to))}));for(const w of report.audio)w.channels.forEach((m,c)=>{if(w.expected[c]===null)assert(m.rms<.0001,w.name+' expected silence');else assert(m.rms>.005&&Math.abs(m.hz-w.expected[c])<=.5,w.name+' expected sampler tone');});
  report.checks=['Actual per-deck Quantize changes cue placement and visible mixed/all states','Range/Slip/previous/stutter reach actual app controls and transport','Original Hold release survives bank/mapping changes without stopping another bank','Older same-slot owner cannot stop newer trigger; alternate pads load empty/stop loaded slots; recorded master matches all windows'];
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};}}for(const d of state.decks)engine.pause(d);engine.stopAllSamples();report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===4&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();$('#sample-original').textContent=JSON.stringify(report,null,2);$('#sample-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in original JSON'}:null},null,2);$('#sample-status').textContent=report.completed?'Scoped sampler/transport workflow passed; audio stopped':'Failed: '+report.errors.map(e=>e.message).join('; ');
 }
}
$('#sample-run').onclick=()=>run();
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#sample-run').disabled=false;$('#sample-run').textContent='Run one sampler/transport workflow';}
boot().catch(error=>$('#sample-status').textContent=error.message);
