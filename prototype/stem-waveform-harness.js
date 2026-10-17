import {AudioEngine} from './engine.js';
import {newDeck} from './fixtures.js';
import {createStemWaveformModel,paintStemOverview,paintStemDetail,paintOriginalOverview,paintOriginalDetail} from './stem-waveform.js';
import {createStemPreparation,encodeWav} from './stems.js';
const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(yes,message)=>{if(!yes)throw Error(message);};
function makeFixture(ctx){
 const rate=ctx.sampleRate,length=rate*6,buffers=Array.from({length:5},()=>ctx.createBuffer(2,length,rate));
 for(let i=0;i<length;i++){
  const t=i/rate,v=.12*Math.sin(2*Math.PI*440*t),right=.09*Math.sin(2*Math.PI*880*t),drums=.03*Math.sin(2*Math.PI*1760*t);
  for(let c=0;c<2;c++){
   buffers[0].getChannelData(c)[i]=.025*Math.sin(2*Math.PI*220*t);
   buffers[1].getChannelData(c)[i]=v;buffers[2].getChannelData(c)[i]=-v;
   buffers[3].getChannelData(c)[i]=c?right:0;buffers[4].getChannelData(c)[i]=c?0:drums;
  }
 }
 return {original:buffers[0],stems:buffers.slice(1)};
}
function pixelEvidence(canvas){const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let count=0,hash=2166136261;for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i])count++;}return {nontransparentPixels:count,hash:(hash>>>0).toString(16)};}
function paint(profile,original=null){
 const started=performance.now(),overview=$('#overview'),detail=$('#detail');overview.getContext('2d').clearRect(0,0,900,100);detail.getContext('2d').clearRect(0,0,160,330);
 if(original){paintOriginalOverview(overview.getContext('2d'),original,{width:900,height:100,color:'#ef795d'});paintOriginalDetail(detail.getContext('2d'),original,{width:160,height:330,position:3,color:'#ef795d'});}
 else{paintStemOverview(overview.getContext('2d'),profile,{width:900,height:100,color:'#ef795d'});paintStemDetail(detail.getContext('2d'),profile,{width:160,height:330,position:3,color:'#ef795d'});}
 const paintedAt=performance.now(),pixels={overview:pixelEvidence(overview),detail:pixelEvidence(detail)};
 return {...pixels,paintMs:paintedAt-started,readbackMs:performance.now()-paintedAt};
}
async function rig(){
 const engine=new AudioEngine();engine.init();engine.analyser.disconnect(); // BEFORE resume/any source
 await engine.resume();await engine.effectsReady;
 const track={id:`waveform-harness-${performance.now()}`,duration:6,bpm:120,cues:[],savedLoops:[],grid:0};
 const deck=newDeck(0);Object.assign(deck,{track,position:0,keylock:false,keyShift:0,rate:1,loop:true,loopIn:0,loopOut:6,stems:[true,true,true,true],stemFX:[false,false,false,false],stemSlip:'off'});
 const f=makeFixture(engine.ctx);engine.buffers.set(track.id,f.original);
 const splitter=engine.ctx.createChannelSplitter(2),silent=engine.ctx.createGain();silent.gain.value=0;engine.nodes[0].input.connect(splitter);
 const analysers=Array.from({length:2},(_,channel)=>{const a=engine.ctx.createAnalyser();a.fftSize=2048;splitter.connect(a,channel);a.connect(silent);return a;});silent.connect(engine.ctx.destination);
 const model=createStemWaveformModel();
 async function capture(){await sleep(140);const windows=[];for(let j=0;j<4;j++){const time=engine.ctx.currentTime,channels=analysers.map(a=>{const pcm=new Float32Array(a.fftSize);a.getFloatTimeDomainData(pcm);return {rms:Math.sqrt(pcm.reduce((s,v)=>s+v*v,0)/pcm.length),first128:[...pcm.slice(0,128)],frames:pcm.length};});windows.push({time,channels});await sleep(50);}return {channels:[0,1].map(c=>({rms:windows.reduce((s,v)=>s+v.channels[c].rms,0)/windows.length})),windows};}
 const profileTimings=[];
 async function selected(mask){const started=performance.now();deck.stems=[0,1,2,3].map(i=>!!(mask&(1<<i)));engine.updateStems(deck);let v=model.select({...f,enabled:deck.stems});if(v.ready)await v.ready;v=model.select({...f,enabled:deck.stems});profileTimings.push({mask,kind:v.kind,elapsedMs:performance.now()-started,diagnostics:model.diagnostics()});return v;}
 return {engine,track,deck,f,model,capture,selected,profileTimings,close:async()=>{model.dispose();engine.silence();splitter.disconnect();silent.disconnect();engine.videoAnalyzers?.dispose();await engine.ctx.close();}};
}
export async function runStemWaveformChecks(){
 const checks=[],started=performance.now();let r;
 async function check(name,run){const evidence={};try{Object.assign(evidence,await run(evidence));checks.push({name,passed:true,...evidence});}catch(error){checks.push({name,passed:false,...evidence,error:error.message,stack:error.stack});}}
 try{
  r=await rig();const {engine,track,deck,f,model,capture,selected}=r;
  const rightOriginal=engine.ctx.createBuffer(2,f.original.length,f.original.sampleRate);rightOriginal.getChannelData(1).set(f.stems[2].getChannelData(1));
  await check('No prepared stems: actual right-only original audio is visible in both production original canvases',async evidence=>{
   engine.buffers.set(track.id,rightOriginal);await engine.start(deck);const view=model.select({original:rightOriginal}),audio=await capture(),pixels=paint(null,rightOriginal);Object.assign(evidence,{kind:view.kind,audio,pixels});assert(view.kind==='original','No-stems route changed branch.');assert(audio.channels[0].rms<1e-6&&Math.abs(audio.channels[1].rms-.09/Math.sqrt(2))<.002,'Actual no-stems right-only source was not isolated.');assert(pixels.overview.nontransparentPixels>500&&pixels.detail.nontransparentPixels>500,'No-stems original waveform dropped right-channel content.');return evidence;
  });
  await check('All four prepared stems enabled: original right-only route remains visible in both canvases',async evidence=>{
   await engine.attachStems(track,f.stems,[deck]);const view=model.select({original:rightOriginal,stems:f.stems,enabled:[true,true,true,true]}),audio=await capture(),pixels=paint(null,rightOriginal);Object.assign(evidence,{kind:view.kind,audio,pixels});assert(view.kind==='original','All-on right-only source was reconstructed from stems.');assert(audio.channels[0].rms<1e-6&&Math.abs(audio.channels[1].rms-.09/Math.sqrt(2))<.002,'Actual all-on audio did not retain right-only original.');assert(pixels.overview.nontransparentPixels>500&&pixels.detail.nontransparentPixels>500,'All-on original waveform dropped right-channel content.');return evidence;
  });
  await check('Actual attachStems starts original PCM for all four enabled; source view preserves original route',async evidence=>{
   engine.pause(deck);engine.buffers.set(track.id,f.original);await engine.attachStems(track,f.stems,[deck]);await engine.start(deck);const view=await selected(15),audio=await capture();Object.assign(evidence,{kind:view.kind,audio,stemSources:engine.voices.get(0)?.sources.length});assert(view.kind==='original','All-on was shown as a reconstructed stem sum.');assert(audio.channels.every(c=>Math.abs(c.rms-.025/Math.sqrt(2))<.001),'All-on audio does not match deliberately distinct original.');assert(engine.voices.get(0)?.sources.length===5,'Actual original+four stem voice was not constructed.');return evidence;
  });
  let vocalPixels;
  await check('Vocal-only actual audio and both production canvas painters carry the surviving source',async evidence=>{
   const view=await selected(1),audio=await capture(),pixels=paint(view.profile);vocalPixels=pixels;Object.assign(evidence,{label:view.label,audio,pixels});assert(audio.channels.every(c=>Math.abs(c.rms-.12/Math.sqrt(2))<.002),'Measured vocal-only audio is incorrect.');assert(pixels.overview.nontransparentPixels>500&&pixels.detail.nontransparentPixels>500,'One or both selected-source canvases remained empty.');return evidence;
  });
  await check('Opposite-phase enabled stems cancel in actual audio and both waveform canvases',async evidence=>{
   const view=await selected(3),audio=await capture(),pixels=paint(view.profile);Object.assign(evidence,{audio,pixels,peak:view.profile.peak(0,6)});assert(audio.channels.every(c=>c.rms<1e-6),'Opposite-phase actual audio failed to cancel.');assert(view.profile.peak(0,6)===0,'Waveform summed independent absolute peaks instead of PCM.');assert(pixels.overview.nontransparentPixels===0&&pixels.detail.nontransparentPixels===0,'Canceled mix still has waveform pixels.');assert(vocalPixels.overview.hash!==pixels.overview.hash&&vocalPixels.detail.hash!==pixels.detail.hash,'Mute changes failed to affect both canvases.');return evidence;
  });
  await check('Right-only source is visible in both canvases and present only in the actual right audio channel',async evidence=>{
   const view=await selected(4),audio=await capture(),pixels=paint(view.profile);Object.assign(evidence,{audio,pixels,peak:view.profile.peak(0,6)});assert(audio.channels[0].rms<1e-6&&Math.abs(audio.channels[1].rms-.09/Math.sqrt(2))<.002,'Actual right-only route is incorrect.');assert(pixels.overview.nontransparentPixels>500&&pixels.detail.nontransparentPixels>500,'Right-only signal was lost by first-channel-only waveform extraction.');return evidence;
  });
  await check('All-muted source is actual silence and zero bars in both canvases',async evidence=>{
   const view=await selected(0),audio=await capture(),pixels=paint(view.profile);Object.assign(evidence,{audio,pixels});assert(audio.channels.every(c=>c.rms<1e-6),'All-muted audio remains nonzero.');assert(pixels.overview.nontransparentPixels===0&&pixels.detail.nontransparentPixels===0,'All-muted waveform retained old bars.');return evidence;
  });
  await check('Restore all four returns actual original audio and original waveform branch',async evidence=>{
   const view=await selected(15),audio=await capture();Object.assign(evidence,{kind:view.kind,audio});assert(view.kind==='original'&&audio.channels.every(c=>Math.abs(c.rms-.025/Math.sqrt(2))<.001),'Restore full mix failed to return original source route.');return evidence;
  });
  await check('FX/tail and dual-clock states explicitly decline a single current-mix waveform',()=>{const views=[model.select({...f,enabled:[true,false,false,false],stemFX:[true]}),model.select({...f,enabled:[true,false,false,false],stemSlip:'vocal'})];assert(views.every(v=>v.kind==='context'&&v.profile===null&&v.label.includes('not shown')),'Boundary mislabeled a current mix.');return {labels:views.map(v=>v.label),scope:'No actual tail/Slip audio acceptance in this case.'};});
 }catch(error){checks.push({name:'Harness setup',passed:false,error:error.message,stack:error.stack});}
 finally{await r?.close();}
 const report={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,durationMs:performance.now()-started,profileTimings:r?.profileTimings||[],checks,scope:'Actual synthetic known-aligned stem routing + pre-EQ stereo audio capture + shared production painters; not SCNet, Serato waveform styling/sonics, FX tails, Stem Slip dual-clock waveform, or native/hardware acceptance.'};window.stemWaveformHarnessResult=report;$('#results').textContent=JSON.stringify(report,null,2);$('#status').textContent=`${report.passed} passed / ${report.failed} failed`;return report;
}
export async function runSCNetStemWaveformCheck(){
 const started=performance.now(),progress=[];let r;const report={status:'unavailable',passed:0,failed:0,progress,scope:'Opt-in actual createStemPreparation→local installed SCNet→decoded buffers→actual attach/mute/audio/waveform. Does not assess source separation quality.'};
 try{
  r=await rig();const {engine,track,deck,model}=r;const prep=createStemPreparation(engine,[deck]);await prep.prepare(track,message=>{progress.push({time:performance.now()-started,message});$('#status').textContent=message;},'scnet');
  const stems=engine.stemBuffers.get(track.id);assert(stems?.length===4,'Actual preparation did not attach four sources.');await engine.start(deck);
  const energies=stems.map(b=>{let sum=0;for(let c=0;c<b.numberOfChannels;c++)for(const value of b.getChannelData(c))sum+=value*value;return Math.sqrt(sum/(b.length*b.numberOfChannels));});
  const chosen=energies.indexOf(Math.max(...energies));report.preparedStemRMS=energies;report.chosenStemIndex=chosen;assert(energies[chosen]>1e-5,'Prepared fixture has no nonzero source; coupling prerequisite unavailable.');
  const captures=[];for(const mask of [1<<chosen,0]){deck.stems=[0,1,2,3].map(i=>!!(mask&(1<<i)));engine.updateStems(deck);const input={original:r.f.original,stems,enabled:deck.stems};let v=model.select(input);if(v.ready)await v.ready;v=model.select(input);assert(v.kind==='stems','Prepared buffers could not supply source waveform: '+v.label);const audio=await r.capture(),pixels=paint(v.profile),peak=v.profile.peak(0,6);captures.push({mask,audio,pixels,peak});if(!mask)assert(audio.channels.every(c=>c.rms<1e-6)&&pixels.overview.nontransparentPixels===0&&pixels.detail.nontransparentPixels===0,'Prepared all-muted route/pixels remain nonzero.');else {assert(Number.isFinite(peak)&&peak>1e-5,'Prepared waveform has no finite nonzero source.');assert(audio.channels.some(c=>c.rms>1e-5),'Chosen nonzero prepared stem did not reach actual audio capture.');assert(pixels.overview.nontransparentPixels>0&&pixels.detail.nontransparentPixels>0,'Nonzero prepared source did not reach both actual canvas painters.');}}
  Object.assign(report,{status:'executed',passed:1,captures,model:track.stemModel,geometry:stems.map(b=>({sampleRate:b.sampleRate,length:b.length,duration:b.duration})),originalGeometry:{sampleRate:r.f.original.sampleRate,length:r.f.original.length}});
 }catch(error){Object.assign(report,{status:progress.some(v=>v.message.startsWith('Ready'))?'failed':'unavailable',failed:1,error:error.message,stack:error.stack});}
 finally{await r?.close();}
 report.durationMs=performance.now()-started;window.stemWaveformSCNetResult=report;$('#results').textContent=JSON.stringify(report,null,2);$('#status').textContent=`SCNet: ${report.status}`;return report;
}
let fixtureURL;
function downloadFixture(){if(fixtureURL)return;const offline=new OfflineAudioContext(2,48000*6,48000);const original=makeFixture(offline).original;fixtureURL=URL.createObjectURL(new Blob([encodeWav(original)],{type:'audio/wav'}));$('#download').href=fixtureURL;}
downloadFixture();window.addEventListener('beforeunload',()=>{if(fixtureURL)URL.revokeObjectURL(fixtureURL);});
$('#run').onclick=async()=>{const button=$('#run');button.disabled=true;$('#status').textContent='Capturing actual audio and waveform pixels…';try{await runStemWaveformChecks();}finally{button.disabled=false;}};
$('#scnet').onclick=async()=>{const button=$('#scnet');button.disabled=true;try{await runSCNetStemWaveformCheck();}finally{button.disabled=false;}};
