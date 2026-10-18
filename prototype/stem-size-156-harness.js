const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
const files=['app.js','engine.js','stems.js','panels.js','stem-size-156-harness.js'];
const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
async function identities(){return Object.fromEntries(await Promise.all(files.map(async f=>{const response=await fetch(f,{cache:'no-store'});assert(response.ok,f);return[f,await sha(await response.arrayBuffer())];})));}
async function until(fn,label){const end=performance.now()+15000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
let app;
async function run(){
 const {engine,state}=app,track=state.decks[0].track;
 const r={checkpoint:150,diagnosticCheckpoint:'156-long-source',samples:[],startedAt:new Date().toISOString(),scope:'Actual UI Prepare on an owned420second stereo44.1kHz decoded AudioBuffer. No playback/model request intended; no PCM export. Expected existing128MiB encoder refusal, not long-track acceptance.',errors:[]};
 $('#size-run').disabled=true;
 try{
  r.sourceBefore=await identities();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();await until(()=>!state.analysis,'Analysis');for(const d of state.decks)engine.pause(d);
  const buffer=engine.ctx.createBuffer(2,420*44100,44100);buffer.getChannelData(0)[0]=.01;buffer.getChannelData(1)[buffer.length-1]=-.01;
  engine.buffers.set(track.id,buffer);engine.stemBuffers.delete(track.id);delete track.stemJob;Object.assign(track,{duration:420,analyzed:true,missing:false,provider:null});state.selected=track.id;
  r.input={duration:buffer.duration,frames:buffer.length,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,decodedPCMBytes:buffer.length*buffer.numberOfChannels*4,encodedWavBytes:44+buffer.length*buffer.numberOfChannels*4};r.physicalMuted=engine.audioMonitor.snapshot().physicalMuted;
  $('[data-deck="0"][data-action="tab"][data-tab="Stems"]').click();
  $('[data-deck="0"][data-action="stemPrepare"]').click();assert($('#stems-queue'),'Actual Prepare screen');$('#stems-queue').click();
  await until(()=>!$('#stems-queue').disabled&&String(track.stemState).includes('128'),'Encoder error');
  r.observed={status:$('#stems-state').textContent,trackState:track.stemState,queueEnabled:!$('#stems-queue').disabled,jobCreated:!!track.stemJob,decodedPublicationPresent:engine.stemBuffers.has(track.id),playing:state.decks.map(d=>d.playing)};
  r.rejectionReproduced=r.observed.status.includes('Decoded audio exceeds the 128 MiB')&&!r.observed.jobCreated&&!r.observed.decodedPublicationPresent&&r.observed.playing.every(v=>!v)&&r.physicalMuted;
  assert(r.rejectionReproduced,'Expected transport refusal was not reproduced');
 }catch(error){r.errors.push({message:error.message,stack:error.stack});}
 finally{
  for(const d of state.decks)engine.pause(d);engine.buffers.delete(track.id);r.sourceAfter=await identities();r.sourceStable=JSON.stringify(r.sourceBefore)===JSON.stringify(r.sourceAfter);r.finishedAt=new Date().toISOString();
  const raw=JSON.stringify(r),id=crypto.randomUUID().replaceAll('-','');let receipt;
  try{const response=await fetch('/api/test-evidence/stem-resource-150/'+id,{method:'POST',headers:{'Content-Type':'application/json','X-Open-Play':'local-prototype'},body:raw});assert(response.ok,'Save failed');receipt=await response.json();const bytes=new TextEncoder().encode(raw);assert(receipt.sha256===await sha(bytes)&&receipt.bytes===bytes.length,'Receipt mismatch');}
  catch(error){receipt={id,error:error.message};const link=$('#size-download');link.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));link.download=id+'.json';link.hidden=false;}
  const summary={rejectionReproduced:!!r.rejectionReproduced,sourceStable:r.sourceStable,input:r.input,observed:r.observed,errors:r.errors,receipt};$('#size-original').textContent=JSON.stringify(summary);$('#size-results').textContent=JSON.stringify(summary,null,2);$('#size-status').textContent=r.rejectionReproduced?'Existing long-track refusal reproduced; no model request or playback':'Boundary check failed; original retained';
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[0].track,'App');app=window.openPlay;$('#size-run').disabled=false;$('#size-status').textContent='Ready';}
$('#size-run').onclick=()=>run();boot().catch(error=>$('#size-status').textContent=error.message);
