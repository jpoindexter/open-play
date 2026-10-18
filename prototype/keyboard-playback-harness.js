const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
const files=['app.js','engine.js','jog-bend.js','deck-midi.js','panels.js','midi.js','keyboard-playback-harness.js'];
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,await hash(await(await fetch(f,{cache:'no-store'})).arrayBuffer())])));
async function until(fn,label){const end=performance.now()+12000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const click=s=>{assert($(s),'Missing '+s);$(s).click();};
const near=(a,b)=>Math.abs(a-b)<1e-7; // AudioParam values are stored as Float32.
function key(k,{up=false,repeat=false,shiftKey=true,target=document.body}={}){return target.dispatchEvent(new KeyboardEvent(up?'keyup':'keydown',{key:shiftKey&&k.length===1?k.toUpperCase():k,code:k.length===1?'Key'+k.toUpperCase():k,repeat,shiftKey,bubbles:true,cancelable:true}));}
function base64(b){let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(s);}
function measure(data,sr,from,to){let power=0;const crossings=[],start=Math.ceil(from*sr),end=Math.floor(to*sr);assert(start>=0&&end<=data.length&&end>start,'Invalid declared window');for(let i=start;i<end;i++){power+=data[i]**2;if(i>start&&data[i-1]<0&&data[i]>=0)crossings.push((i-1-data[i-1]/(data[i]-data[i-1]))/sr);}return{from,to,rms:Math.sqrt(power/(end-start)),hz:crossings.length>3?(crossings.length-1)/(crossings.at(-1)-crossings[0]):null};}
let app;
async function run(){
 $('#keyboard-run').disabled=true;const {engine,state}=app;
 const report={startedAt:new Date().toISOString(),completed:false,criteria:{frequencyErrorHz:.5,minimumRMS:.005,pausedMaximumRMS:.0001,windowOffsetSeconds:.10,windowLengthSeconds:.25},scope:'Actual app keyboard events/shared MIDI editor and whole stereo master. Owned tones, no native/physical/warped/keylocked/quality/full-shortcut acceptance.',events:[],checks:[],errors:[]};
 const event=name=>{const e={name,time:engine.ctx.currentTime-engine.recordStarted};report.events.push(e);return e;};
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>!state.analysis,'Initial analysis');
  state.settings['Playback Keys Use Shift']=true;state.settings['Sync Mode']='Simple Sync';
  for(const d of state.decks)engine.pause(d);for(const bank of state.fx)for(const slot of bank)slot.on=false;engine.configureFX(state.fx,state.fxRoutes||[],state.decks.map(d=>(d.track?.bpm||120)*d.rate),state.fxTempo);
  for(let n=0;n<2;n++){
   const d=state.decks[n],b=engine.ctx.createBuffer(2,48000*20,48000),data=b.getChannelData(n),hz=n?550:330;
   for(let i=0;i<data.length;i++)data[i]=.12*Math.sin(2*Math.PI*hz*i/48000);
   Object.assign(d.track,{duration:20,bpm:120,grid:0,gridWarpMarkers:[],analyzed:true});Object.assign(d,{position:3,rate:1,keylock:false,keyShift:0,reverse:false,loop:false,slip:false,stemSlip:'off',sync:false,level:.8});engine.buffers.set(d.track.id,b);engine.mix(n,'level',.8);
  }
  click('[data-deck="0"][data-action="quantize"]');key('w',{shiftKey:false});await sleep(50);assert(!state.decks[0].playing,'Shift guard failed');key('w');key('s');await until(()=>state.decks.slice(0,2).every(d=>d.playing&&!d.processing),'Both keyboard starts');
  for(let n=0;n<8;n++){key('w',{repeat:true});key('s',{repeat:true});}await sleep(40);assert(state.decks.slice(0,2).every(d=>d.playing),'Play auto-repeat paused a deck');report.checks.push('Shift guard and repeat-safe two-deck Play');
  await engine.recordStart();event('baseline');await sleep(450);
  key('y');key('g');await until(()=>near(engine.audibleRate(state.decks[0]),1.04)&&near(engine.audibleRate(state.decks[1]),.96),'Held opposing-deck bends');event('held');await sleep(900);report.heldAfter900ms=state.decks.slice(0,2).map(d=>({nominal:d.rate,audible:engine.audibleRate(d)}));assert(state.decks.every(d=>d.index>1||d.rate===1),'Bend changed nominal tempo');assert(near(engine.audibleRate(state.decks[0]),1.04),'Held bend expired without repeats');
  key('t');await until(()=>near(engine.audibleRate(state.decks[0]),1),'Opposite keys cancel');event('opposite');await sleep(450);key('t',{up:true});await until(()=>near(engine.audibleRate(state.decks[0]),1.04),'Release one opposing key');
  click('[data-panel="midi"]');const field=(s,v)=>{$(s).value=String(v);};field('#midi-target','Deck 1 jog bend');field('#midi-type','CC');field('#midi-channel',2);field('#midi-number',9);field('#midi-encoding','Relative two’s complement');click('#midi-add');
  // Adding a mapping rerenders the form and resets the message fields.
  field('#midi-type','CC');field('#midi-channel',2);field('#midi-number',9);field('#midi-test-value',10);click('#midi-send');await until(()=>Math.abs(engine.audibleRate(state.decks[0])-1.08)<1e-7,'Shared MIDI and keyboard bend');await until(()=>Math.abs(engine.audibleRate(state.decks[0])-1.04)<1e-7,'MIDI idle preserves held keyboard');click('#modal-close');event('midi-idle-held');await sleep(450);
  key('y',{up:true,target:$('#search')});key('g',{up:true,target:$('#search')});await until(()=>state.decks.slice(0,2).every(d=>near(engine.audibleRate(d),1)),'Release while editing');event('released');await sleep(450);
  key('y');await until(()=>near(engine.audibleRate(state.decks[0]),1.04),'Blur setup');window.dispatchEvent(new Event('blur'));await until(()=>near(engine.audibleRate(state.decks[0]),1),'Blur restores tempo');event('blur-return');await sleep(450);
  key('q');key('a');await until(()=>state.decks.slice(0,2).every(d=>d.reverse),'Reverse keys');const p=state.decks.slice(0,2).map(d=>engine.position(d));await sleep(100);assert(state.decks.slice(0,2).every((d,n)=>engine.position(d)<p[n]),'Reverse cursors do not travel backwards');key('q',{repeat:true});key('a',{repeat:true});await sleep(30);assert(state.decks.slice(0,2).every(d=>d.reverse),'Reverse repeated');key('q');key('a');await until(()=>state.decks.slice(0,2).every(d=>!d.reverse),'Reverse off');
  key('w');key('s');await until(()=>state.decks.slice(0,2).every(d=>!d.playing),'Both keyboard pauses');for(let n=0;n<8;n++){key('w',{repeat:true});key('s',{repeat:true});}event('paused');await sleep(450);assert(state.decks.slice(0,2).every(d=>!d.playing),'Play repeat restarted audio');
  key('F5');key('F10');await until(()=>state.decks.slice(0,2).every(d=>d.keylock),'Keylock shortcuts');key('F5',{repeat:true});key('F10',{repeat:true});await sleep(20);assert(state.decks.slice(0,2).every(d=>d.keylock),'Keylock auto-repeat toggled');key('F5');key('F10');await until(()=>state.decks.slice(0,2).every(d=>!d.keylock),'Keylock off');
  report.checks.push('Held dual-deck bends survive 900ms without repeat; opposite keys cancel','Actual MIDI editor shares bend ownership and idle preserves keyboard','Keyup in an input and window blur return nominal rates','Reverse Q/A moves both cursors backwards and ignores repeat','F5/F10 toggle keylock once; Pause ignores repeat');
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{
  for(const k of ['t','y','g','h'])key(k,{up:true});window.dispatchEvent(new Event('blur'));for(const d of state.decks)engine.pause(d);
  if(engine.recording){const blob=await engine.recordStop();if(blob){const bytes=new Uint8Array(await blob.arrayBuffer());report.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};try{const decoded=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));report.decoded={duration:decoded.duration,sampleRate:decoded.sampleRate,frames:decoded.length,channels:decoded.numberOfChannels};assert(decoded.numberOfChannels===2,'Expected stereo');for(let c=0;c<2;c++)for(const v of decoded.getChannelData(c))assert(Number.isFinite(v),'Nonfinite PCM');
   const expected={'baseline':[330,550],'held':[343.2,528],'opposite':[330,528],'midi-idle-held':[343.2,528],'released':[330,550],'blur-return':[330,550],'paused':[0,0]};
   report.audio=report.events.filter(e=>expected[e.name]).map(e=>({name:e.name,channels:[0,1].map(c=>measure(decoded.getChannelData(c),decoded.sampleRate,e.time+.10,e.time+.35))}));
   for(const w of report.audio)for(let c=0;c<2;c++){const m=w.channels[c],hz=expected[w.name][c];assert(hz?m.rms>.005&&Math.abs(m.hz-hz)<=.5:m.rms<.0001,`${w.name} channel ${c} audio failed`);}assert(report.audio.length===7,'Missing declared audio stages');report.checks.push('Seven declared whole-master pitch/silence windows');
  }catch(error){report.errors.push({message:error.message,stack:error.stack});}}}
  report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===7&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();
  $('#keyboard-original').textContent=JSON.stringify(report,null,2);$('#keyboard-results').textContent=JSON.stringify({...report,recording:report.recording?{...report.recording,base64:'Retained in original JSON'}:null},null,2);$('#keyboard-status').textContent=report.completed?'Scoped keyboard playback workflow passed; audio stopped':'Failed: '+report.errors.map(e=>e.message).join('; ');const link=$('#keyboard-download');link.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));link.download='keyboard-playback-original.json';link.hidden=false;
 }
}
$('#keyboard-run').onclick=()=>run();
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#keyboard-run').disabled=false;$('#keyboard-run').textContent='Run one keyboard playback workflow';}
boot().catch(error=>$('#keyboard-status').textContent=error.message);
