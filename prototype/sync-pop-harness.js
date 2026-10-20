const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){const end=performance.now()+15000;while(!fn()){if(performance.now()>end)throw Error('Preparation timed out');await sleep(10);}}
let app;
async function run(){
 $('#pop-run').disabled=true;delete document.body.dataset.popArmed;const {engine,state}=app,report={scope:'Production GUI handlers, postmaster Float32 PCM across paused-follower Sync. Controlled tones; no hardware or musical acceptance.',errors:[]};
 const saved={decks:state.decks.map(d=>({...d})),settings:{...state.settings},fx:state.fx.map(b=>b.map(s=>({...s,params:{...s.params}})))};let witness;
 try{
  await engine.resume();await engine.effectsReady;await engine.masterOutput.ready;engine.audioMonitor.mutePhysical(true);await until(()=>!state.analysis);
  for(const d of state.decks)engine.pause(d);
  state.settings['Sync Mode']='Simple Sync';state.settings['Snap to Beatgrid']=true;
  for(const bank of state.fx)for(const slot of bank)slot.on=false;
  engine.configureFX(state.fx,state.fxRoutes||[],[121,115.5,120,120],state.fxTempo);
  for(let i=0;i<2;i++){
   const d=state.decks[i],buffer=engine.ctx.createBuffer(2,engine.ctx.sampleRate*10,engine.ctx.sampleRate);
   for(let c=0;c<2;c++){const data=buffer.getChannelData(c);for(let n=0;n<data.length;n++)data[n]=.1*Math.sin(2*Math.PI*(i?97:73)*n/buffer.sampleRate);}
   Object.assign(d,{track:{...d.track,id:'sync-pop-fixture-'+i,bpm:i?115.5:121,grid:0,duration:10,gridWarpMarkers:[],gridMarkers:[],missing:false,provider:null},rate:1,keylock:false,keyShift:0,reverse:false,stemSlip:'off',loop:false,position:0,sync:false,syncRole:null,processing:false});
   engine.buffers.set(d.track.id,buffer);engine.mix(i,'level',.8);engine.mix(i,'filter',0);
  }
  engine.setCross(0);
  await engine.ctx.audioWorklet.addModule(new URL('./fx-tempo-capture-worklet.js',import.meta.url));
  witness=new AudioWorkletNode(engine.ctx,'open-play-fx-tempo-capture-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});engine.masterOutput.output.connect(witness);witness.connect(engine.ctx.destination);
  $('[data-action="play"][data-deck="0"]').click();await until(()=>state.decks[0].playing&&!state.decks[0].processing);await sleep(250);
  const voice=engine.voices.get(0),rate=state.decks[0].rate;
  const captured=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('PCM timeout')),9000);witness.port.onmessage=({data})=>{if(data.type==='started')report.captureStart=data.startFrame/engine.ctx.sampleRate;if(data.type==='done'){clearTimeout(timer);resolve(data);}};});
  witness.port.postMessage({type:'capture',id:1,frames:engine.ctx.sampleRate*6});await sleep(450);
  report.captureArmAt=engine.ctx.currentTime;report.before={rates:state.decks.slice(0,2).map(d=>d.rate),playing:state.decks.slice(0,2).map(d=>d.playing)};
  if(new URL(location.href).searchParams.has('pointer')){document.body.dataset.popArmed='true';await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Actual Sync pointer press was not received')),4500);document.addEventListener('click',function clicked(event){if(event.target.closest('[data-action="sync"][data-deck="1"]')){clearTimeout(timer);document.removeEventListener('click',clicked);report.pointerPressAt=engine.ctx.currentTime;report.trusted=event.isTrusted;resolve();}},true);});}else $('[data-action="sync"][data-deck="1"]').click();await until(()=>state.decks[1].sync&&!state.decks[1].processing);
  report.after={rates:state.decks.slice(0,2).map(d=>d.rate),playing:state.decks.slice(0,2).map(d=>d.playing),outgoingVoiceUnchanged:engine.voices.get(0)===voice,outgoingRateUnchanged:state.decks[0].rate===rate};
  const pcm=await captured,data=pcm.data;let peak=0,maxStep=0,maxCurvature=0,curvatureAt=0,zeroFrames=0;
  for(let n=2;n<data.length;n++){peak=Math.max(peak,Math.abs(data[n]));maxStep=Math.max(maxStep,Math.abs(data[n]-data[n-1]));const k=Math.abs(data[n]-2*data[n-1]+data[n-2]);if(k>maxCurvature){maxCurvature=k;curvatureAt=n;}if(data[n]===0)zeroFrames++;}
  report.pcm={sampleRate:engine.ctx.sampleRate,frames:data.length,peak,maxStep,maxCurvature,curvatureAt:pcm.startFrame/engine.ctx.sampleRate+curvatureAt/engine.ctx.sampleRate,zeroFrames};
  report.passed=report.after.outgoingVoiceUnchanged&&report.after.outgoingRateUnchanged&&!report.after.playing[1]&&peak>.00001&&maxCurvature<.001;
 }catch(error){report.errors.push(error.stack);report.passed=false;}
 finally{for(const d of state.decks)engine.pause(d);witness?.disconnect();witness?.port.close();if(witness)try{engine.masterOutput.output.disconnect(witness);}catch{}for(let i=0;i<state.decks.length;i++)Object.assign(state.decks[i],saved.decks[i],{playing:false,processing:false});Object.assign(state.settings,saved.settings);state.fx=saved.fx;$('#pop-report').textContent=JSON.stringify(report,null,2);$('#pop-run').disabled=false;}
}
$('#pop-run').onclick=run;
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('workspace-preview.html')).text(),'text/html');for(const a of parsed.body.attributes)document.body.setAttribute(a.name,a.value);for(const link of parsed.querySelectorAll('link[rel=stylesheet]'))document.head.append(link);for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./layout-preview.js');for(const n of document.querySelectorAll('[data-startup-inert]'))n.inert=false;await until(()=>window.openPlay?.state.decks[1].track);app=window.openPlay;$('#pop-run').disabled=false;$('#pop-run').textContent='Capture paused-deck Sync';}boot().catch(e=>$('#pop-report').textContent=e.stack);
