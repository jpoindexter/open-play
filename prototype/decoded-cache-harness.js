import {sessionKey} from './session-storage.js';
const frame=document.querySelector('#app'),output=document.querySelector('#result'),checks=[],report={checks,scope:'Generated WAVs, actual import/load/play and internal master; no acoustic acceptance'};
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const wait=async(test,label)=>{for(let i=0;i<1200;i++){if(test())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out: '+label);};
const show=()=>output.textContent=JSON.stringify(report,null,2),pass=text=>{checks.push(text);show();};
const doc=()=>frame.contentDocument;
function wav(index,seconds=24){
 const sr=16000,frames=sr*seconds,bytes=new ArrayBuffer(44+frames*4),v=new DataView(bytes),text=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
 text(0,'RIFF');v.setUint32(4,bytes.byteLength-8,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sr,true);v.setUint32(28,sr*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,frames*4,true);
 for(let i=0;i<frames;i++){const t=i/sr,fade=Math.min(1,t/.02,(seconds-t)/.02),sample=Math.round(.09*32767*fade*Math.sin(2*Math.PI*(220+index*37)*t));for(let c=0;c<2;c++)v.setInt16(44+i*4+c*2,sample,true);}
 return new frame.contentWindow.File([bytes],`Resource ${String(index).padStart(2,'0')}.wav`,{type:'audio/wav'});
}
async function imports(files){
 const w=frame.contentWindow,input=doc().querySelector('#audio-files'),data=new w.DataTransfer();files.forEach(file=>data.items.add(file));input.files=data.files;return input.onchange({target:input});
}
function click(selector){const el=doc().querySelector(selector);assert(el,selector);el.click();}
async function load(track,index,state){
 click(`tr[data-track="${track.id}"]`);click(`[data-action="load"][data-deck="${index}"]`);
 await wait(()=>state.decks[index].track===track&&frame.contentWindow.openPlay.engine.buffers.has(track.id)&&!state.analysis,'loaded deck '+index);await wait(()=>!state.decks[index].processing,'prepared deck '+index);
}
function capture(engine,seconds){
 const w=frame.contentWindow,node=new w.AudioWorkletNode(engine.ctx,'open-play-fx-tempo-capture-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
 engine.masterOutput.output.connect(node);node.connect(engine.ctx.destination);
 return new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);engine.masterOutput.output.disconnect(node);node.disconnect();node.port.close();},timer=setTimeout(()=>{cleanup();reject(Error('Capture timed out'));},(seconds+8)*1000);
  node.port.onmessage=({data})=>{if(data.type!=='done')return;
   try{
    const step=Math.round(engine.ctx.sampleRate*.1),rms=[];let peak=0;
    for(let start=step;start<data.data.length-step;start+=step){let power=0;for(let i=start;i<start+step;i++){const value=data.data[i];assert(Number.isFinite(value),'Non-finite master output');peak=Math.max(peak,Math.abs(value));power+=value*value;}rms.push(Math.sqrt(power/step));}
    resolve({frames:data.data.length,sampleRate:engine.ctx.sampleRate,peak,min100msRMS:Math.min(...rms),max100msRMS:Math.max(...rms),rms});
   }catch(error){reject(error);}finally{cleanup();}
  };node.port.postMessage({type:'capture',id:'cache-pressure',frames:Math.round(engine.ctx.sampleRate*seconds)});
 });
}
document.querySelector('#run').onclick=async()=>{
 let app,prune;
 try{
  assert(location.port==='8873','Dedicated port8873 required.');assert(localStorage.length===0||localStorage.getItem('openplay-resource-owned')==='true','Existing data; refusing to modify this origin.');
  document.querySelector('#run').disabled=true;localStorage.setItem('openplay-resource-owned','true');localStorage.setItem(sessionKey,JSON.stringify({settings:{'Analyze Stems':false,'Use Auto Gain':false}}));
  frame.src='workspace-preview.html?resource='+Date.now();await new Promise(resolve=>frame.onload=resolve);await wait(()=>frame.contentWindow.openPlay&&!frame.contentWindow.openPlay.state.analysis,'workspace ready');
  app=frame.contentWindow.openPlay;const {engine,state}=app;state.analysisSettings.onImport=false;
  await engine.resume();engine.audioMonitor.mutePhysical(true);assert(engine.audioMonitor.snapshot().physicalMuted,'Physical output must stay muted');
  engine.maxDecodedBytes=24*1024*1024;
  const files=Array.from({length:12},(_,i)=>wav(i)),first=await imports(files.slice(0,2));assert(first.length===2,'Initial WAV import');
  first.forEach(t=>t.analyzed=true);await load(first[0],0,state);await load(first[1],1,state);await wait(()=>!state.analysis,'analysis idle');
  const originals=first.map(t=>engine.buffers.get(t.id));assert(originals.every(Boolean),'Loaded originals');
  // Controlled baseline isolates the eviction policy using the same real decoder/import path.
  prune=engine.pruneDecodedBuffers.bind(engine);engine.pruneDecodedBuffers=()=>engine.decodedBufferUsage();
  const rest=await imports(files.slice(2));assert(rest.length===10,'Remaining WAV imports');report.baseline={...engine.decodedBufferUsage(),policy:'eviction disabled for comparison'};
  assert(report.baseline.bytes>engine.maxDecodedBytes*3,'Baseline did not reproduce retention');engine.pruneDecodedBuffers=prune;prune();report.afterPrune=engine.decodedBufferUsage();
  assert(report.afterPrune.bytes<=Math.max(engine.maxDecodedBytes,report.afterPrune.protectedBytes),'Inactive cache exceeds budget');pass('Actual WAV imports reproduce retention; inactive pruning preserves both loaded originals');
  for(const d of state.decks.slice(0,2)){d.sync=false;d.repeat=true;d.rate=1;d.keylock=false;d.keyShift=0;}
  click('[data-action="play"][data-deck="0"]');click('[data-action="play"][data-deck="1"]');await wait(()=>state.decks.slice(0,2).every(d=>d.playing),'both decks playing');
  await engine.ctx.audioWorklet.addModule(new URL('./fx-tempo-capture-worklet.js',import.meta.url));const pcm=capture(engine,12),clock=state.decks.slice(0,2).map(d=>engine.position(d));
  const repeated=await imports(files.slice(2));assert(repeated.length===10,'Repeat import path');
  report.pressure=engine.decodedBufferUsage();report.audio=await pcm;
  assert(report.audio.min100msRMS>.005&&report.audio.peak<1,'Master gap or clipping under pressure');
  assert(state.decks.slice(0,2).every((d,i)=>d.playing&&engine.position(d)>clock[i]+8),'Transport interrupted');
  assert(first.every((t,i)=>engine.buffers.get(t.id)===originals[i]),'Loaded buffer identity lost');
  assert(report.pressure.bytes<=Math.max(engine.maxDecodedBytes,report.pressure.protectedBytes),'Pressure cache not bounded');pass('Two playing decks retain source identity and advance during repeat imports; finite master has no silent100ms windows');
  const ids=first.map(t=>t.id);click('[data-action="play"][data-deck="0"]');click('[data-action="play"][data-deck="1"]');await wait(()=>state.decks.slice(0,2).every(d=>!d.playing),'clean stop');
  await wait(()=>ids.every(id=>doc().querySelector(`tr[data-track="${id}"] .library-wave-preview[data-preview-state="ready"] img`)),'loaded library previews');
  report.previewImages=doc().querySelectorAll('.library-wave-preview[data-preview-state="ready"] img').length;
  const evicted=rest.find(t=>!engine.buffers.has(t.id));assert(evicted,'Evicted local track');const reloaded=await engine.buffer(evicted);assert(reloaded.duration>23.9,'Original reload after eviction');
  engine.maxDecodedBytes=256*1024*1024;
  const longer=await imports(Array.from({length:8},(_,i)=>wav(i+12,120)));assert(longer.length===8,'Two-minute imports');report.defaultBudget=engine.decodedBufferUsage();
  assert(report.defaultBudget.bytes<=engine.maxDecodedBytes,'Default production budget exceeded');assert(first.every((t,i)=>engine.buffers.get(t.id)===originals[i]),'Loaded originals lost at default budget');
  assert(report.defaultBudget.entries<20,'Default budget never evicted inactive data');pass('Eight two-minute stereo WAVs exercise the256MiB production budget with both paused decks protected');
  for(const count of ['2','4'])for(const orientation of ['horizontal','vertical']){
   const w=frame.contentWindow;for(const [selector,value]of [['#preview-density','compact'],['#deck-count',count],['#preview-orientation',orientation]]){const input=doc().querySelector(selector);input.value=value;input.dispatchEvent(new w.Event('change',{bubbles:true}));}
   await new Promise(resolve=>requestAnimationFrame(resolve));assert(doc().querySelectorAll('[data-action="play"]').length===Number(count),'Core deck controls');assert(doc().querySelectorAll('[data-mix$=":low"]').length===Number(count),'Core mixer controls');
  }
  assert(state.tracks.length===28,'Metadata was removed');assert(ids.every(id=>doc().querySelector(`tr[data-track="${id}"] .library-wave-preview img`)),'Preview lost after cache pressure/layouts');pass('Evicted original re-decodes;28tracks, library previews and2/4compact H/V controls retained');
  engine.silence();assert(state.decks.every(d=>!d.playing&&!d.playQueued),'Queued restart');report.complete=true;
 }catch(error){report.error=error.stack;}
 finally{if(app){if(prune)app.engine.pruneDecodedBuffers=prune;app.engine.silence();report.finalCache=app.engine.decodedBufferUsage();}show();}
};
