const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),assert=(value,message)=>{if(!value)throw Error(message);};
const button=(index,action)=>`[data-deck="${index}"][data-action="${action}"]`;
const click=selector=>{assert($(selector),'Missing '+selector);$(selector).click();};
const files=['app.js','engine.js','panels.js','keylock-shadow-live.js','pcm-resample.js','stem-bank-window-harness.js','stem-activation-capture-145.js','vendor/signalsmith-stretch/SignalsmithStretch-open-play-replace.mjs'];
const sha=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function identities(){return Object.fromEntries(await Promise.all(files.map(async name=>{const response=await fetch(name,{cache:'no-store'});assert(response.ok,'Missing '+name);return[name,await sha(await response.arrayBuffer())];})));}
async function until(predicate,label,ms=20000){const end=performance.now()+ms;while(!predicate()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
function base64(bytes){let text='';for(let n=0;n<bytes.length;n+=16384)text+=String.fromCharCode(...bytes.subarray(n,n+16384));return btoa(text);}
let app;
async function run(){
 const params=new URL(location.href).searchParams,sourceRate=Number(params.get('sourceRate')||44100),shift=Number(params.get('shift')||0);
 assert([44100,22050].includes(sourceRate)&&[0,3].includes(shift),'Unknown declared fixture');
 const {engine,state}=app,d=state.decks[0],track=d.track,witnesses=[];
 const r={checkpoint:147,startedAt:new Date().toISOString(),sourceRate,semitones:shift,rate:1.1,startPosition:4,
  scope:'Actual production app Play and Stem pads; real cached SCNet buffers attached through the production engine after a nonzero group origin and retained-window drop. One same-instance repeat into the other bank. Generated original tone at declared source sample rate. No fresh inference, music quality, exact audible cursor, native or physical acceptance.',
  criteria:{captureSeconds:2.5,minimum10msRMSRatio:.85,maximumAdjacentJump:.03,maximumNearZeroRunSeconds:.001,nearZeroAbsolute:1e-7,maximumFrequencyRelativeError:.01},errors:[]};
 let recording,node,method,batch=0;
 function capture(id,seconds){return Promise.all(witnesses.map(w=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('PCM capture timed out')),seconds*1000+10000);w.port.onmessage=({data})=>{if(data.type==='done'&&data.id===id){clearTimeout(timer);resolve(data);}};w.port.postMessage({type:'capture',id,frames:Math.round(seconds*engine.ctx.sampleRate)});})));}
 async function retain(packets){return Promise.all(packets.map(async p=>({startFrame:p.startFrame,frames:p.data.length,quanta:p.quanta,errors:p.errors,sha256:await sha(p.data.buffer),base64:base64(new Uint8Array(p.data.buffer))})));}
 function clock(adapter){const at=engine.ctx.currentTime,expected=r.anchor.position+Math.max(0,at-r.anchor.when)*r.rate;return{at,expected,actual:adapter.position(at),error:adapter.position(at)-expected};}
 $('#window-run').disabled=true;
 try{
  r.sourceBefore=await identities();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute');await until(()=>!state.analysis,'Initial analysis');for(const deck of state.decks)engine.pause(deck);
  for(const unit of state.fx)for(const slot of unit)slot.on=false;engine.configureFX(state.fx,state.fxRoutes||[],state.decks.map(x=>(x.track?.bpm||120)*x.rate),state.fxTempo);
  const original=engine.ctx.createBuffer(2,sourceRate*8,sourceRate);for(let c=0;c<2;c++)for(let n=0;n<original.length;n++)original.getChannelData(c)[n]=.12*Math.sin(2*Math.PI*(c?550:330)*n/sourceRate);
  Object.assign(track,{duration:8,bpm:120,grid:0,gridWarpMarkers:[],gridMarkers:[],analyzed:true});
  Object.assign(d,{position:4,rate:1.1,keylock:true,keyShift:shift,reverse:false,loop:false,stemSlip:'off',slip:false,sync:false,mode:'INT',stems:[true,true,true,true],stemFX:[false,false,false,false]});
  engine.clearDeckScratchCache(0);engine.stemBuffers.delete(track.id);engine.buffers.set(track.id,original);engine.mix(0,'level',.8);r.originalHashes=await Promise.all([0,1].map(c=>sha(original.getChannelData(c).buffer)));
  const job='a2877adfbffa4ece8ec544451917a589',response=await fetch('/api/stems/'+job);assert(response.ok,'Completed cache unavailable');r.job=await response.json();assert(r.job.state==='complete'&&r.job.model==='SCNet-large official','Real completed SCNet cache required');
  const stems=[];r.stemFiles=[];for(const name of['vocals','other','bass','drums']){const response=await fetch(`/api/stems/${job}/${name}.wav`);assert(response.ok,'Missing '+name);const bytes=await response.arrayBuffer();r.stemFiles.push({name,sha256:await sha(bytes)});const buffer=await engine.ctx.decodeAudioData(bytes.slice(0));assert(buffer.duration===8&&buffer.numberOfChannels===2,'Cached Stem geometry mismatch');stems.push(buffer);}
  r.sampleRate=engine.ctx.sampleRate;
  await engine.ctx.audioWorklet.addModule(new URL('./stem-activation-capture-145.js',import.meta.url));const split=engine.ctx.createChannelSplitter(2);engine.masterOutput.output.connect(split);
  for(let c=0;c<2;c++){const w=new AudioWorkletNode(engine.ctx,'open-play-stem-activation-145-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit',channelInterpretation:'discrete'});split.connect(w,c);w.connect(engine.ctx.destination);witnesses.push(w);}
  click(button(0,'play'));await until(()=>d.playing&&!d.processing,'Playback');const voice=engine.voices.get(0),adapter=voice.liveKeylock;r.anchor={position:d.anchorPosition,when:d.anchorTime};r.initial=adapter.snapshot();
  assert(r.initial.groups[0].origin>0&&r.initial.groups[0].processorChannels===18,'Nonzero fixed18-channel group required');
  await sleep(250);recording=capture('continuous',r.criteria.captureSeconds);$('#window-status').textContent='Capturing replacement after window drop…';
  await until(()=>adapter.snapshot().groups[0].start>adapter.snapshot().groups[0].origin,'Actual retained-window drop');r.before=adapter.snapshot();r.calls=[];node=adapter.active.nodes[0];method=node.replaceBufferChannels;
  node.replaceBufferChannels=async(...args)=>{const ack=await method(...args);r.calls.push({...ack,batch,at:engine.ctx.currentTime});return ack;};
  r.attachAt=engine.ctx.currentTime;await engine.attachStems(track,stems,[d]);r.initialReadyAt=engine.ctx.currentTime;r.afterInitial=adapter.snapshot();r.clockAfterInitial=clock(adapter);assert(engine.voices.get(0)===voice,'Initial bank replaced voice');
  click(button(0,'tab')+'[data-tab="Stems"]');click(button(0,'pad')+'[data-pad="0"]');r.padAt=engine.ctx.currentTime;assert(!d.stems[0]&&d.stems.slice(1).every(Boolean),'Actual Vocal pad mute');await sleep(200);r.selectedGains=voice.stemGains.map(g=>g.gain.value);assert(r.selectedGains[0]<1e-6&&r.selectedGains.slice(2).every(v=>v>.999),'Actual Stem routes not selected');
  batch=1;r.beforeRepeat=adapter.snapshot();r.repeatAt=engine.ctx.currentTime;await engine.attachStems(track,stems.slice(),[d]);r.repeatReadyAt=engine.ctx.currentTime;r.afterRepeat=adapter.snapshot();r.clockAfterRepeat=clock(adapter);
  assert(engine.voices.get(0)===voice&&r.afterRepeat.groups[0].id===r.initial.groups[0].id,'Repeat replaced live owner');assert(r.afterRepeat.activeStemBank===1,'Repeat did not switch banks');assert(r.repeatReadyAt<r.anchor.when+2.5,'Operations missed the declared early capture interval');
  r.pcm=await retain(await recording);click(button(0,'pad')+'[data-pad="0"]');
  for(let i=0;i<4;i++)click(button(0,'pad')+`[data-pad="${i}"]`);await sleep(100);r.muted={enabled:[...d.stems],pcm:await retain(await capture('muted',.08))};
  for(let i=0;i<4;i++)click(button(0,'pad')+`[data-pad="${i}"]`);await sleep(100);r.restored={enabled:[...d.stems],pcm:await retain(await capture('restored',.08))};click(button(0,'play'));await until(()=>!d.playing,'Stop');await sleep(100);r.stopped={playing:d.playing,pcm:await retain(await capture('stopped',.08))};
  r.originalUnchanged=JSON.stringify(r.originalHashes)===JSON.stringify(await Promise.all([0,1].map(c=>sha(original.getChannelData(c).buffer))));assert(r.originalUnchanged,'Original PCM mutated');r.workflowExecuted=true;
 }catch(error){r.errors.push({message:error.message,stack:error.stack});if(recording&&!r.pcm)try{r.pcm=await retain(await recording);}catch(e){r.errors.push({captureError:e.message});}}
 finally{if(node&&method)node.replaceBufferChannels=method;for(const deck of state.decks)engine.pause(deck);for(const w of witnesses){w.disconnect();w.port.close();}r.sourceAfter=await identities();r.sourceStable=JSON.stringify(r.sourceBefore)===JSON.stringify(r.sourceAfter);r.workflowCompleted=!!r.workflowExecuted&&!r.errors.length&&r.sourceStable;r.finishedAt=new Date().toISOString();$('#window-original').textContent=JSON.stringify(r);$('#window-results').textContent=JSON.stringify({...r,pcm:r.pcm?.map(({base64,...p})=>p),muted:r.muted?{enabled:r.muted.enabled}:null,restored:r.restored?{enabled:r.restored.enabled}:null,stopped:r.stopped?{playing:r.stopped.playing}:null},null,2);$('#window-status').textContent=r.workflowCompleted?'Capture retained; independent audio/address inspection required; stopped':'Failed: '+r.errors.map(e=>e.message).join('; ');}
}
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const node of [...parsed.body.children])if(node.tagName!=='SCRIPT')document.body.append(node);await import('./app.js');await until(()=>window.openPlay?.state.decks[0].track,'Actual app');app=window.openPlay;$('#window-run').disabled=false;$('#window-status').textContent='Ready';}
$('#window-run').onclick=()=>run();boot().catch(error=>$('#window-status').textContent=error.message);
