const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
const button=(a)=>`[data-deck="0"][data-action="${a}"]`,click=s=>{assert($(s),'Missing '+s);$(s).click();};
const files=['app.js','engine.js','stems.js','panels.js','stem-long-157-harness.js','stem-activation-capture-145.js'];
const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
async function identities(){return Object.fromEntries(await Promise.all(files.map(async f=>{const response=await fetch(f,{cache:'no-store'});assert(response.ok,f);return[f,await sha(await response.arrayBuffer())];})));}
async function until(fn,label,ms=30000){const end=performance.now()+ms;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
function base64(bytes){let value='';for(let i=0;i<bytes.length;i+=16384)value+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(value);}
let app;
async function run(){
 const {engine,state}=app,deck=state.decks[0],track=deck.track,witnesses=[];
 const r={checkpoint:150,diagnosticCheckpoint:157,samples:[],startedAt:new Date().toISOString(),scope:'Actual production UI Prepare on an owned420second stereo44.1kHz decoded AudioBuffer, partial upload Cancel/retry, real local SCNet inference/exports/decode/activation and recorded Stems all-pad mute/restore/Stop. Physical mute. No compressed import/music quality/native/hardware/reference or unlimited-duration acceptance.',progress:[],errors:[]};let observer,recording;
 $('#long-run').disabled=true;
 try{
  r.sourceBefore=await identities();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();await until(()=>!state.analysis,'Analysis');for(const d of state.decks)engine.pause(d);
  for(const unit of state.fx)for(const slot of unit)slot.on=false;engine.configureFX(state.fx,state.fxRoutes||[],state.decks.map(d=>(d.track?.bpm||120)*d.rate),state.fxTempo);
  const sr=44100,buffer=engine.ctx.createBuffer(2,420*sr,sr);
  for(let c=0;c<2;c++){const data=buffer.getChannelData(c);for(let n=0;n<data.length;n++)data[n]=.12*Math.sin(2*Math.PI*(c?550:330)*n/sr);}
  engine.buffers.set(track.id,buffer);engine.stemBuffers.delete(track.id);delete track.stemJob;Object.assign(track,{duration:420,bpm:120,grid:0,gridWarpMarkers:[],gridMarkers:[],analyzed:true,missing:false,provider:null});state.selected=track.id;
  Object.assign(deck,{position:0,rate:1,keylock:false,keyShift:0,reverse:false,loop:false,slip:false,stemSlip:'off',sync:false,mode:'INT',stems:[true,true,true,true],stemFX:[false,false,false,false]});engine.mix(0,'level',.5);
  r.input={duration:buffer.duration,frames:buffer.length,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,decodedPCMBytes:buffer.length*buffer.numberOfChannels*4,encodedWavBytes:44+buffer.length*buffer.numberOfChannels*4};
  r.originalHashes=await Promise.all([0,1].map(c=>sha(buffer.getChannelData(c).buffer)));r.physicalMuted=engine.audioMonitor.snapshot().physicalMuted;
  click(button('tab')+'[data-tab="Stems"]');click(button('stemPrepare'));const output=$('#stems-state');let first=true;
  observer=new MutationObserver(()=>{const text=output.textContent;r.progress.push({at:performance.now(),text});$('#long-status').textContent=text;if(first&&/Sending decoded audio.*\d+%/.test(text)){first=false;r.cancel={status:text,jobBefore:track.stemJob||null,playing:deck.playing};click('#stems-cancel');}});
  observer.observe(output,{childList:true,subtree:true,characterData:true});click('#stems-queue');
  await until(()=>!$('#stems-queue').disabled&&track.stemState.startsWith('Cancelled'),'Partial upload cancellation');
  r.cancel.afterStatus=track.stemState;r.cancel.jobAfter=track.stemJob||null;r.cancel.decodedPublicationPresent=engine.stemBuffers.has(track.id);r.cancel.notice=$('#notice').textContent;assert(r.cancel.notice==='Preparation cancelled. Original audio is preserved.','Cancel feedback must explain the preserved audio');assert(!r.cancel.jobAfter&&!r.cancel.decodedPublicationPresent&&!r.cancel.playing,'Partial upload must not create a job or change audio');
  r.prepareStartedAt=new Date().toISOString();click('#stems-queue');
  await until(()=>!$('#stems-queue').disabled&&/^(Ready|Failed|Cancelled)/.test(track.stemState),'Long preparation',1000000);
  assert(track.stemState.startsWith('Ready'),track.stemState);r.readyAt=new Date().toISOString();r.ready={status:output.textContent,job:track.stemJob,model:track.stemModel,buffers:engine.stemBuffers.get(track.id).map(b=>({frames:b.length,channels:b.numberOfChannels,sampleRate:b.sampleRate,duration:b.duration}))};
  const response=await fetch('/api/stems/'+track.stemJob);assert(response.ok,'Real job');r.job=await response.json();assert(r.job.state==='complete'&&r.job.model==='SCNet-large official','Actual SCNet result required');
  assert(r.ready.buffers.length===4&&r.ready.buffers.every(b=>b.frames===buffer.length&&b.channels===2&&b.sampleRate===sr),'Long output length must match input');click('#modal-close');
  await engine.ctx.audioWorklet.addModule(new URL('./stem-activation-capture-145.js',import.meta.url));const split=engine.ctx.createChannelSplitter(2);engine.nodes[0].monitorTap.connect(split);
  for(let c=0;c<2;c++){const w=new AudioWorkletNode(engine.ctx,'open-play-stem-activation-145-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit',channelInterpretation:'discrete'});split.connect(w,c);w.connect(engine.ctx.destination);witnesses.push(w);}
  click(button('play'));await until(()=>deck.playing&&!deck.processing,'Play');await sleep(100);r.sampleRate=engine.ctx.sampleRate;
  recording=Promise.all(witnesses.map(w=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('PCM timeout')),15000);w.port.onmessage=({data})=>{if(data.type==='done'){clearTimeout(timer);resolve(data);}};w.port.postMessage({type:'capture',id:'long157',frames:Math.round(2*engine.ctx.sampleRate)});})));await sleep(250);
  r.muteAt=engine.ctx.currentTime;for(let p=0;p<4;p++)click(button('pad')+`[data-pad="${p}"]`);r.muted=[...deck.stems];await sleep(300);
  r.restoreAt=engine.ctx.currentTime;for(let p=0;p<4;p++)click(button('pad')+`[data-pad="${p}"]`);r.restored=[...deck.stems];await sleep(300);r.stopAt=engine.ctx.currentTime;click(button('play'));await until(()=>!deck.playing,'Stop');
  r.pcm=await Promise.all((await recording).map(async(p,c)=>({channel:c,startFrame:p.startFrame,frames:p.data.length,quanta:p.quanta,errors:p.errors,sha256:await sha(p.data.buffer),base64:base64(new Uint8Array(p.data.buffer))})));
  r.originalUnchanged=JSON.stringify(r.originalHashes)===JSON.stringify(await Promise.all([0,1].map(c=>sha(buffer.getChannelData(c).buffer))));assert(r.originalUnchanged,'Original mutated');r.workflowExecuted=true;
 }catch(error){r.errors.push({message:error.message,stack:error.stack});}
 finally{
  observer?.disconnect();for(const d of state.decks)engine.pause(d);for(const w of witnesses){w.disconnect();w.port.close();}r.sourceAfter=await identities();r.sourceStable=JSON.stringify(r.sourceBefore)===JSON.stringify(r.sourceAfter);r.workflowCompleted=!!r.workflowExecuted&&!r.errors.length&&r.sourceStable;r.finishedAt=new Date().toISOString();
  const raw=JSON.stringify(r),id=crypto.randomUUID().replaceAll('-','');let receipt;
  try{const response=await fetch('/api/test-evidence/stem-resource-150/'+id,{method:'POST',headers:{'Content-Type':'application/json','X-Open-Play':'local-prototype'},body:raw});assert(response.ok,'Save failed');receipt=await response.json();const bytes=new TextEncoder().encode(raw);assert(receipt.sha256===await sha(bytes)&&receipt.bytes===bytes.length,'Receipt mismatch');}
  catch(error){receipt={id,error:error.message};const link=$('#long-download');link.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));link.download=id+'.json';link.hidden=false;}
  const summary={workflowCompleted:r.workflowCompleted,sourceStable:r.sourceStable,input:r.input,ready:r.ready,cancel:r.cancel,errors:r.errors,receipt};$('#long-original').textContent=JSON.stringify(summary);$('#long-results').textContent=JSON.stringify(summary,null,2);$('#long-status').textContent=r.workflowCompleted?'Long preparation and playback recorded; stopped; independent inspection pending':'Flow failed; original retained';
 }
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[0].track,'App');app=window.openPlay;$('#long-run').disabled=false;$('#long-status').textContent='Ready';}
$('#long-run').onclick=()=>run();boot().catch(error=>$('#long-status').textContent=error.message);
