import {createVideoPipeline, videoPipelinePolicy} from './video-pipeline.js';
import {createVideoMixer} from './video.js';
import {createVideoAnalysis} from './video-analysis.js';
import {AudioEngine} from './engine.js';

const $=s=>document.querySelector(s), W=96,H=64;
const make=(w=W,h=H)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const assert=(v,message)=>{if(!v)throw new Error(message);};
const raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const color=(canvas,rgb)=>{const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle=`rgb(${rgb.join(',')})`;c.fillRect(0,0,canvas.width,canvas.height);};
function read(source){const width=source instanceof HTMLVideoElement?source.videoWidth:source.width,height=source instanceof HTMLVideoElement?source.videoHeight:source.height;assert(Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0,'Pixel readback requires positive decoded/source dimensions: '+JSON.stringify({width,height,tag:source.tagName}));const c=make(width,height),ctx=c.getContext('2d');ctx.drawImage(source,0,0);return ctx.getImageData(0,0,c.width,c.height);}
const pixel=(image,x=Math.floor(image.width/2),y=Math.floor(image.height/2))=>[...image.data.slice((y*image.width+x)*4,(y*image.width+x)*4+4)];
const near=(a,b,tolerance=3)=>a.every((n,i)=>Math.abs(n-b[i])<=tolerance);
const diff=(a,b)=>{let sum=0;for(let i=0;i<a.data.length;i++)sum+=Math.abs(a.data[i]-b.data[i]);return sum/a.data.length;};
const hash=image=>{let n=2166136261;for(const b of image.data)n=Math.imul(n^b,16777619);return(n>>>0).toString(16);};
const fx=(name,params={})=>({name,on:true,value:1,params});
// These fresh specs use the corrected darkening Gamma contract. Earlier saved
// presets retain reciprocal Gamma only through their explicit compatibility mode.
const apply=(rgb,specs)=>specs.reduce((c,s)=>c.map(n=>s.name==='Negative'?255-n:s.name==='Gamma'?255*(n/255)**(s.params.behavior==='Earlier Open Play'?1/s.params.gamma:s.params.shadowPower):n),rgb);
const durationValue=v=>Number.isFinite(v)?v:String(v);
const fixtureDownloadURLs=new Map();
function clearFixtureDownloads(){
  for(const [id,url] of fixtureDownloadURLs){URL.revokeObjectURL(url);const link=$('#'+id);link.hidden=true;link.removeAttribute('href');}
  fixtureDownloadURLs.clear();
}
function publishFixtureDownload(id,file,label){
  const link=$('#'+id),url=URL.createObjectURL(file);fixtureDownloadURLs.set(id,url);
  link.href=url;link.download=file.name;link.textContent=`${label} (${file.name}, ${file.size} bytes)`;link.hidden=false;
  return{filename:file.name,bytes:file.size,mime:file.type,publicAnchor:id,ownership:'Original harness-generated media only; retained until rerun or page close.'};
}
window.addEventListener('pagehide',clearFixtureDownloads);
async function until(readValue,predicate,{timeout=5000,pump=()=>{}}={}){
  const deadline=performance.now()+timeout;let value;
  do{pump();value=readValue();if(predicate(value))return value;await raf();}while(performance.now()<deadline);
  throw new Error('Actual-state predicate timed out: '+JSON.stringify(value));
}
function bounded(promise,label,timeout=10000){
  let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out')),timeout);})]).finally(()=>clearTimeout(timer));
}
function mediaEvent(target,type,timeout=10000){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>finish(new Error(type+' event timed out')),timeout);
    const good=event=>finish(null,event),bad=()=>finish(new Error(target.error?.message||type+' media error'));
    const finish=(error,event)=>{clearTimeout(timer);target.removeEventListener(type,good);target.removeEventListener('error',bad);error?reject(error):resolve(event);};
    target.addEventListener(type,good,{once:true});target.addEventListener('error',bad,{once:true});
  });
}
function decodedFrame(video,pump=()=>{}){
  assert(typeof video.requestVideoFrameCallback==='function','Actual decoded-frame callback API is required; no delay substitute.');
  return new Promise((resolve,reject)=>{
    let animation,callback,finished=false;
    const cleanup=()=>{finished=true;clearTimeout(timer);cancelAnimationFrame(animation);video.cancelVideoFrameCallback?.(callback);};
    const timer=setTimeout(()=>{cleanup();reject(new Error('No actual decoded video frame arrived.'));},7000);
    callback=video.requestVideoFrameCallback((_,metadata)=>{cleanup();resolve({mediaTime:metadata.mediaTime,presentedFrames:metadata.presentedFrames,width:metadata.width,height:metadata.height});});
    const tick=()=>{if(!finished){try{pump();animation=requestAnimationFrame(tick);}catch(e){cleanup();reject(e);}}};tick();
  });
}
function preferredMime(){return['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));}
async function seekDecodedVideo(video,time){
  video.pause();if(Math.abs(video.currentTime-time)>.001||video.readyState<2){const seeked=mediaEvent(video,'seeked');video.currentTime=time;await seeked;}
  await until(()=>({readyState:video.readyState,seeking:video.seeking,paused:video.paused}),v=>v.readyState>=2&&!v.seeking&&v.paused);
}
function paintVideo(canvas,frame){
  const c=canvas.getContext('2d');c.fillStyle='#dc1e14';c.fillRect(0,0,canvas.width,canvas.height);
  c.fillStyle='#ffffff';c.fillRect((frame*7)%(canvas.width-30),canvas.height-30,24,20);
  c.fillStyle='#000000';c.font='18px monospace';c.fillText(String(frame),canvas.width-80,30);
}
async function canvasVideoFile(ctx){
  assert(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream,'MediaRecorder and canvas captureStream are required.');
  const canvas=make(320,180);paintVideo(canvas,0);
  const stream=canvas.captureStream(30),dest=ctx.createMediaStreamDestination(),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.frequency.value=880;gain.gain.value=.07;osc.connect(gain);gain.connect(dest);osc.start();
  dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
  const mime=preferredMime(),chunks=[],recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:1000000}:{});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  let frames=0;const started=performance.now(),clockStart=ctx.currentTime;
  try{
    const startedEvent=mediaEvent(recorder,'start');recorder.start(100);await startedEvent;
    while(frames<40||ctx.currentTime-clockStart<1.4){await raf();paintVideo(canvas,++frames);stream.getVideoTracks()[0].requestFrame?.();assert(performance.now()-started<8000,'Generated-media recording exceeded bound.');}
    const stopped=mediaEvent(recorder,'stop');recorder.stop();await stopped;
    const blob=new Blob(chunks,{type:recorder.mimeType});assert(blob.size>1000,'No substantial real media was encoded.');
    return{file:new File([blob],recorder.mimeType.includes('mp4')?'generated-local.mp4':'generated-local.webm',{type:blob.type}),metadata:{bytes:blob.size,mime:blob.type,drawnCanvasFrames:frames,measuredAudioClockSeconds:ctx.currentTime-clockStart,streamVideoTracks:stream.getVideoTracks().length,streamAudioTracks:stream.getAudioTracks().length,claim:'Canvas frame draws are not a claim of encoded frame count or30fps.'}};
  }finally{if(recorder.state!=='inactive')recorder.stop();osc.stop();osc.disconnect();gain.disconnect();stream.getTracks().forEach(t=>t.stop());}
}
async function decodeBlob(blob){
  const video=document.createElement('video'),url=URL.createObjectURL(blob);video.muted=true;video.playsInline=true;video.loop=false;
  $('#media-stage').append(video);
  try{
    const loaded=mediaEvent(video,'loadeddata');video.src=url;video.load();await loaded;await video.play();
    const first=await decodedFrame(video),second=await decodedFrame(video);
    const canvas=make(video.videoWidth,video.videoHeight);canvas.getContext('2d').drawImage(video,0,0);
    return{video,url,image:read(canvas),metadata:{width:video.videoWidth,height:video.videoHeight,duration:durationValue(video.duration),readyState:video.readyState,firstFrame:first,secondFrame:second,muted:video.muted,audioDecodedBytes:video.webkitAudioDecodedByteCount??null},cleanup(){video.pause();URL.revokeObjectURL(url);video.remove();}};
  }catch(error){video.pause();URL.revokeObjectURL(url);video.remove();throw error;}
}
function toneAmplitude(samples,sr,hz){const count=Math.min(samples.length,sr),start=Math.max(0,Math.floor((samples.length-count)/2));let a=0,b=0;const coefficient=2*Math.cos(2*Math.PI*hz/sr);for(let i=start;i<start+count;i++){const c=samples[i]+coefficient*a-b;b=a;a=c;}return 2*Math.sqrt(Math.max(0,a*a+b*b-coefficient*a*b))/count;}

export async function runVideoPipelineChecks(){
  clearFixtureDownloads();
  const checks=[],messages=[],started=performance.now(),resources=new Set(),sourceVideos=[];
  const engine=new AudioEngine();engine.init();engine.analyser.disconnect();const audioResume=engine.ctx.resume();
  let pipeline,standalone,analysisSources=[],mixer,fixture,capture,decodedCapture,frameId=0;
  const state={settings:{'Reduced Motion':false},decks:[{index:0,track:null,playing:false,position:0,rate:1},{index:1,track:null,playing:false,position:0,rate:1}],video:{width:640,height:360,transition:'Crossfade',cross:-1,linked:false,auto:false,fx:{left:[],right:[],master:[]},overlays:{left:[],right:[],master:[]}}};
  const notifications=[];
  const report={startedAt:new Date().toISOString(),policy:videoPipelinePolicy,engine:'Actual imported AudioEngine; test oscillators drive real input nodes; media transport uses an actual AudioEngine BufferSource deck.',seams:['Temporary document.createElement observation captures the actual mixer-created HTMLVideoElements for muted/decoded-frame inspection. No fake video, pipeline or engine.','Generated original media and PCM are test fixtures; no external media/service/hardware.'],checks,notifications};
  async function test(name,run){
    try{checks.push({name,passed:true,evidence:await run()});}catch(error){checks.push({name,passed:false,error:error.message,stack:error.stack});}
    $('#status').textContent=`${checks.filter(x=>x.passed).length}/${checks.length} passed · ${name}`;
    $('#results').textContent=JSON.stringify(report,null,2);await raf();
  }
  const left=make(),right=make();color(left,[64,128,192]);color(right,[192,64,96]);
  const context=(extra={})=>({time:++frameId/30,frameId,amount:0,upfaders:[1,1],channels:[{assetId:'left',bpm:120,rate:1,audioAvailable:false},{assetId:'right',bpm:120,rate:1,audioAvailable:false}],master:{bpm:120,audioAvailable:false},...extra});
  const render=(settings={},extra={})=>{const r=pipeline.render([left,right],settings,context(extra));return{channels:r.channels.map(read),output:read(r.output)};};
  try{
    pipeline=createVideoPipeline({width:W,height:H});resources.add(pipeline);
    await test('Actual pipeline bypass and processed-channel previews retain both source identities',()=>{
      const r=render();assert(near(pixel(r.output),[64,128,192,255])&&near(pixel(r.channels[0]),[64,128,192,255])&&near(pixel(r.channels[1]),[192,64,96,255]),'Bypass or preview identity failed.');return{left:pixel(r.channels[0]),right:pixel(r.channels[1]),output:pixel(r.output)};
    });
    const forward=[fx('Negative'),fx('Gamma',{shadowPower:2})],reverse=[fx('Gamma',{shadowPower:2}),fx('Negative')];
    await test('Left two-slot order changes actual channel/output pixels while right preview stays isolated',()=>{
      const a=render({fx:{left:forward}}),b=render({fx:{left:reverse}});assert(near(pixel(a.channels[0]),[...apply([64,128,192],forward),255])&&near(pixel(b.channels[0]),[...apply([64,128,192],reverse),255]),'Left slot order differs from declared independent color contract.');assert(diff(a.channels[0],b.channels[0])>20&&near(pixel(a.channels[1]),[192,64,96,255]),'Left routing leaked or order is inert.');return{forward:pixel(a.channels[0]),reverse:pixel(b.channels[0]),right:pixel(a.channels[1])};
    });
    await test('Right two-slot order changes only processed right preview and selected right output',()=>{
      const r=render({fx:{right:forward}},{amount:1});assert(near(pixel(r.channels[1]),[...apply([192,64,96],forward),255])&&near(pixel(r.channels[0]),[64,128,192,255]),'Right routing/order failed.');assert(near(pixel(r.output),pixel(r.channels[1])),'Output did not select processed right.');return{left:pixel(r.channels[0]),right:pixel(r.channels[1]),output:pixel(r.output)};
    });
    await test('Both master slots run after transition and leave processed channel previews unchanged',()=>{
      const a=render({fx:{master:forward}},{amount:.3}),b=render({fx:{master:reverse}},{amount:.3});const mixed=[64,128,192].map((v,i)=>v*.7+[192,64,96][i]*.3);assert(near(pixel(a.output),[...apply(mixed,forward),255],4)&&diff(a.output,b.output)>20,'Master order or post-transition route failed.');assert(near(pixel(a.channels[0]),[64,128,192,255])&&near(pixel(a.channels[1]),[192,64,96,255]),'Master FX leaked into channel previews.');return{forward:pixel(a.output),reverse:pixel(b.output),channelLeft:pixel(a.channels[0])};
    });
    await test('Each of the six slot positions independently changes its intended real pixels',()=>{
      const evidence=[];for(const target of ['left','right','master'])for(let slot=0;slot<2;slot++){
        const amount=target==='right'?1:target==='left'?0:.5,baseline=render({}, {amount});const slots=[null,null];slots[slot]=fx('Negative');const r=render({fx:{[target]:slots}},{amount});const changed=diff(r.output,baseline.output);assert(changed>10,`${target} slot${slot+1} is inert.`);if(target!=='master'){const other=target==='left'?1:0;assert(diff(r.channels[other],baseline.channels[other])===0,'Effect leaked to other channel.');}evidence.push({target,slot:slot+1,changed});}return evidence;
    });
    await test('All six simultaneous slots obey channel → transition → master ordering',()=>{
      const r=render({fx:{left:forward,right:reverse,master:forward}},{amount:.37});const a=apply([64,128,192],forward),b=apply([192,64,96],reverse),mixed=a.map((v,i)=>v*.63+b[i]*.37),expected=apply(mixed,forward);assert(near(pixel(r.output),[...expected,255],5),'Six-slot composite differs from independent order.');return{actual:pixel(r.output),expected};
    });
    await test('Channel overlays follow channel FX; master overlays follow transition and precede master FX',()=>{
      const red=make(12,12),green=make(12,12);color(red,[255,0,0]);color(green,[0,255,0]);const overlay=image=>({kind:'image',on:true,image,x:.5,y:.5,align:'center',opacity:1});
      const settings={fx:{left:[fx('Negative')],master:[fx('Negative')]},overlays:{left:[overlay(red)]}};const before=render(settings,{amount:1});assert(near(pixel(before.channels[0]),[255,0,0,255]),'Channel FX were applied after the channel overlay.');assert(near(pixel(before.output),[63,191,159,255]),'Unselected left overlay leaked past transition.');settings.overlays.master=[overlay(green)];const after=render(settings,{amount:1});assert(near(pixel(after.output),[255,0,255,255]),'Master overlay not processed by master FX.');return{channelOverlay:pixel(before.channels[0]),unselectedOutput:pixel(before.output),masterOverlayThenFX:pixel(after.output)};
    });
    await test('Pipeline reset clears an actual upstream Frame Freeze capture',()=>{
      const settings={fx:{left:[fx('Frame Freeze',{captureToken:0})]}};color(left,[220,20,10]);render(settings);color(left,[10,30,230]);const held=render(settings);assert(near(pixel(held.output),[220,20,10,255]),'Frame Freeze did not retain an upstream frame.');pipeline.reset('left');const cleared=render(settings);assert(near(pixel(cleared.output),[10,30,230,255]),'Reset retained old capture.');color(left,[64,128,192]);return{held:pixel(held.output),afterReset:pixel(cleared.output)};
    });
    await test('Actual AudioEngine AudioContext/worklets resume and speaker route is disconnected',async()=>{await audioResume;await bounded(engine.resume(),'Real AudioEngine resume',20000);assert(engine.ctx.state==='running'&&engine.effectsPrepared,'AudioEngine did not prepare actual context/worklets.');return{state:engine.ctx.state,sampleRate:engine.ctx.sampleRate,effectsPrepared:engine.effectsPrepared,speakerRoute:'engine.analyser.disconnect() only; real capture destination remains connected'};});
    await test('Actual per-channel oscillators produce isolated bass/treble analyzer bands',async()=>{
      analysisSources=[100,8000].map(hz=>{const osc=engine.ctx.createOscillator(),gain=engine.ctx.createGain();osc.frequency.value=hz;gain.gain.value=.3;osc.connect(gain);osc.start();return{osc,gain};});standalone=createVideoAnalysis(engine.ctx,analysisSources.map(s=>s.gain));
      const bands=await until(()=>[standalone.read(0),standalone.read(1)],v=>v[0].bass>.04&&v[0].bass>6*v[0].treble&&v[1].treble>.04&&v[1].treble>6*v[1].bass);report.audioBands=bands;return{frequencies:[100,8000],bands};
    });
    await test('Measured live per-channel audio bands alter actual pipeline Audio RGB pixels independently',()=>{
      assert(standalone,'Standalone real analyzers unavailable.');color(left,[100,100,100]);color(right,[100,100,100]);const channels=[standalone.read(0),standalone.read(1)].map((v,i)=>({...v,assetId:String(i),bpm:120,rate:1}));const r=render({fx:{left:[fx('Audio RGB')],right:[fx('Audio RGB')]}},{amount:.5,channels});const l=pixel(r.channels[0]),rr=pixel(r.channels[1]);assert(l[0]>l[1]+3&&l[0]>l[2]+3&&rr[2]>rr[0]+3&&rr[2]>rr[1]+3,'Real measured audio bands did not route to the matching channel color.');return{bands:channels,left:l,right:rr};
    });
    await test('Actual analyzer frequency changes move channel energy to different bands',async()=>{
      assert(standalone,'Analyzers unavailable.');analysisSources[0].osc.frequency.value=1000;analysisSources[1].osc.frequency.value=100;const bands=await until(()=>[standalone.read(0),standalone.read(1)],v=>v[0].mid>.04&&v[0].mid>6*v[0].bass&&v[1].bass>.04&&v[1].bass>6*v[1].treble);return{frequencies:[1000,100],bands};
    });
    await test('Actual silence yields near-zero bands/RMS; dispose returns unavailable zeros',async()=>{
      assert(standalone,'Analyzers unavailable.');analysisSources.forEach(s=>s.gain.gain.setValueAtTime(0,engine.ctx.currentTime));const silent=await until(()=>[standalone.read(0),standalone.read(1)],v=>v.every(x=>x.level<.001&&x.bass<.002&&x.mid<.002&&x.treble<.002));standalone.dispose();const disposed=standalone.read(0);assert(!disposed.audioAvailable&&disposed.level===0&&disposed.bass===0,'Disposed analysis remained available.');return{silent,disposed};
    });
    await test('Recreated analysis taps recover measured signal after disposal',async()=>{
      standalone=createVideoAnalysis(engine.ctx,analysisSources.map(s=>s.gain));analysisSources[0].osc.frequency.value=100;analysisSources[0].gain.gain.value=.3;const recovered=await until(()=>standalone.read(0),x=>x.bass>.04&&x.level>.04);standalone.dispose();analysisSources.forEach(s=>{s.osc.stop();s.osc.disconnect();s.gain.disconnect();});analysisSources=[];return recovered;
    });
    await test('Real AudioEngine video-analysis taps survive configureFX deck-to-master route rebuild',async()=>{
      const injected=[100,8000].map((hz,i)=>{const osc=engine.ctx.createOscillator(),gain=engine.ctx.createGain();osc.frequency.value=hz;gain.gain.value=.15;osc.connect(gain);gain.connect(engine.nodes[i].input);osc.start();return{osc,gain};});
      try{const prior=await until(()=>[engine.videoAnalysis(0),engine.videoAnalysis(1),engine.videoAnalysis(4)],v=>v[0].bass>.02&&v[1].treble>.02&&v[2].level>.005);const banks=[[{name:'LPF',on:true,depth:40,beat:'1',params:{'Min Freq':'200 Hz','Max Freq':'20000 Hz'}}]];engine.configureFX(banks,['Deck 1']);await until(()=>engine.videoAnalysis(4),v=>v.level>.003);engine.configureFX(banks,['Master']);const after=await until(()=>[engine.videoAnalysis(0),engine.videoAnalysis(1),engine.videoAnalysis(4)],v=>v[0].bass>.02&&v[1].treble>.02&&v[2].level>.003);return{prior,after,realEngine:true,drive:'Test oscillators enter actual AudioEngine input nodes; this test does not claim file transport.'};}finally{injected.forEach(s=>{s.osc.stop();s.osc.disconnect();s.gain.disconnect();});engine.configureFX([],[]);}
    });
    await test('Pipeline validates source count and rejects rendering after disposal',()=>{
      let rejected=false;try{pipeline.render([]);}catch{rejected=true;}assert(rejected,'Invalid source count accepted.');pipeline.dispose();resources.delete(pipeline);rejected=false;try{render();}catch{rejected=true;}assert(rejected&&pipeline.diagnostics().disposed,'Disposed pipeline accepted rendering.');return{sourceCountRejected:true,disposed:pipeline.diagnostics().disposed};
    });
    await test('Thirty rAF-paced complete640x360 pipeline/readback frames report measured cost without30fps assumption',async()=>{
      const p=createVideoPipeline({width:640,height:360});resources.add(p);const intervals=[],costs=[],signatures=[];let previous,start;
      try{for(let i=0;i<30;i++){const at=await raf();if(previous!==undefined)intervals.push(at-previous);previous=at;start??=at;color(left,[(i*7+30)%180+30,90,150]);color(right,[120,(i*9+30)%180+30,70]);const before=performance.now();const r=p.render([left,right],{fx:{left:forward,right:reverse,master:[fx('Negative'),fx('Gamma',{gamma:1.4})]}},{time:at/1000,frameId:i,amount:.4,channels:[{assetId:'bench-left'},{assetId:'bench-right'}]});signatures.push(hash(read(r.output)));costs.push(performance.now()-before);}const sorted=[...costs].sort((a,b)=>a-b),wall=previous-start;assert(signatures.length===30&&new Set(signatures).size>=15,'Did not render distinct actual pipeline frames.');return{frames:30,output:[640,360],distinctOutputs:new Set(signatures).size,elapsedRafMs:wall,observedFramesPerSecond:29*1000/wall,p50FrameReadbackMs:sorted[15],p95FrameReadbackMs:sorted[28],maxFrameReadbackMs:sorted[29],over33ms:costs.filter(v=>v>1000/30).length,rafIntervalsMs:intervals,scope:'Full six-slot generated-canvas pipeline with synchronous final Canvas2D getImageData readback; includes GPU dependency completion. Excludes video decoding/audio/capture; not sustained30fps or real-device proof.'};}finally{p.dispose();resources.delete(p);}
    });
    await test('Real canvas.captureStream/MediaRecorder produces a local video File with generated audio',async()=>{fixture=await canvasVideoFile(engine.ctx);report.fixture=fixture.metadata;report.fixtureDownloads={video:publishFixtureDownload('download-video-fixture',fixture.file,'Download generated local video fixture')};return fixture.metadata;});
    await test('Visible fixture downloads retain the exact local video File and an original transparent overlay PNG',async()=>{
      assert(fixture,'Generated local video fixture unavailable.');const overlay=make(96,64),c=overlay.getContext('2d');c.fillStyle='#ff00ff';c.fillRect(8,8,32,32);c.fillStyle='#00ffff';c.beginPath();c.arc(66,32,18,0,Math.PI*2);c.fill();
      const blob=await new Promise(resolve=>overlay.toBlob(resolve,'image/png'));assert(blob&&blob.size>0,'Original overlay PNG did not encode.');const file=new File([blob],'open-play-generated-overlay.png',{type:'image/png'});
      report.fixtureDownloads.overlay=publishFixtureDownload('download-overlay-fixture',file,'Download generated overlay PNG');
      const links=['download-video-fixture','download-overlay-fixture'].map(id=>$('#'+id));assert(links.every(a=>!a.hidden&&a.href.startsWith('blob:')&&a.download),'Public native download anchors are unavailable.');
      const downloaded=new Uint8Array(await fetch(links[0].href).then(r=>r.arrayBuffer())),original=new Uint8Array(await fixture.file.arrayBuffer());assert(downloaded.byteLength===original.byteLength&&downloaded.every((v,i)=>v===original[i]),'Download differs from the actual File passed to mixer.load.');
      return{...report.fixtureDownloads,videoExactByteMatch:true,overlayPixels:{transparent:pixel(read(overlay),0,0),magenta:pixel(read(overlay),15,15)},claim:'Public download targets verified; native save dialog and subsequent main-UI upload are parent-executed checks.'};
    });
    await test('Mixer.load decodes actual local Files and preserves muted real video elements',async()=>{
      assert(fixture,'Generated media fixture unavailable.');const output=make(640,360);$('#pipeline-preview').replaceChildren(output);mixer=createVideoMixer({state,engine,notify:message=>notifications.push(message)});mixer.bind(output);
      const original=document.createElement;
      document.createElement=function(name,...args){const element=original.call(this,name,...args);if(String(name).toLowerCase()==='video'){sourceVideos.push(element);element.width=200;$('#media-stage').append(element);}return element;};
      try{await bounded(mixer.load(0,fixture.file),'Mixer left local decode');await bounded(mixer.load(1,fixture.file),'Mixer right local decode');}finally{document.createElement=original;}
      assert(sourceVideos.length===2&&sourceVideos.every(v=>v.readyState>=2&&v.muted&&v.videoWidth===320&&v.videoHeight===180),'Actual input videos not decoded/muted or wrong dimensions.');return{videos:sourceVideos.map(v=>({width:v.videoWidth,height:v.videoHeight,muted:v.muted,readyState:v.readyState,duration:durationValue(v.duration)})),diagnostics:mixer.diagnostics()};
    });
    await test('Mixer play yields real decoded frames and processed channel-preview pixels',async()=>{
      assert(mixer&&sourceVideos.length===2,'Mixer decoding prerequisite unavailable.');state.video.fx.left=[fx('Negative')];state.video.cross=-1;await mixer.play(0);const frame=await decodedFrame(sourceVideos[0],()=>mixer.tick(true));mixer.tick(true);const output=read($('#pipeline-preview canvas')),preview=read($('#video-preview-0')),p=pixel(output,20,20),pp=pixel(preview,10,10);assert(!sourceVideos[0].paused&&p[0]<90&&p[1]>150&&p[2]>150,'Actual decoded source was not processed to cyan.');assert(pp[0]<90&&pp[1]>150&&pp[2]>150,'Channel preview is raw rather than processed.');return{decodedFrame:frame,output:p,processedPreview:pp,diagnostics:mixer.diagnostics()};
    });
    await test('Real AudioEngine BufferSource position drives linked video seek/play/pause',async()=>{
      assert(mixer&&sourceVideos[0],'Mixer prerequisite unavailable.');const video=sourceVideos[0];assert(Number.isFinite(video.duration)&&video.duration>.5,'Generated container has nonfinite/short duration; finite-duration linked transport cannot be verified: '+video.duration);
      const duration=10,buffer=engine.ctx.createBuffer(1,engine.ctx.sampleRate*duration,engine.ctx.sampleRate),pcm=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)pcm[i]=.1*Math.sin(2*Math.PI*440*i/engine.ctx.sampleRate);
      const deck={index:0,track:{id:'pipeline-harness-real-audio',duration,bpm:120},playing:false,processing:false,position:Math.min(.35,video.duration/3),rate:1,keylock:false,keyShift:0,reverse:false,loop:true,loopIn:0,loopOut:duration,stems:[true,true,true,true],stemFX:[false,false,false,false]};state.decks[0]=deck;engine.buffers.set(deck.track.id,buffer);await engine.start(deck);state.video.linked=true;engine.setCross(-1);
      try{await until(()=>({position:video.currentTime,engine:engine.position(deck)%video.duration,paused:video.paused}),v=>!v.paused&&Math.abs(v.position-v.engine)<.2,{pump:()=>mixer.tick(true)});const frame=await decodedFrame(video,()=>mixer.tick(true));engine.pause(deck);await until(()=>video.paused,v=>v,{pump:()=>mixer.tick(true)});const paused={position:video.currentTime,enginePosition:engine.position(deck)};assert(Math.abs(paused.position-paused.enginePosition)<.25,'Linked pause did not retain engine timeline.');await engine.start(deck);return{decodedFrame:frame,paused,realBufferSource:true};}finally{state.video.linked=false;}
    });
    await test('Actual AudioEngine reverse=true drives paused linked-video seeks to the decreasing engine position',async()=>{
      const deck=state.decks[0],video=sourceVideos[0];assert(mixer&&deck?.track&&video,'Real linked transport prerequisite unavailable.');state.video.linked=false;
      const trace=report.reverseTransport={phases:[],events:[],samples:[]};
      const snapshot=phase=>({phase,wallMs:performance.now(),audioTime:engine.ctx.currentTime,linked:state.video.linked,video:{paused:video.paused,currentTime:video.currentTime,seeking:video.seeking,readyState:video.readyState,duration:durationValue(video.duration),playbackRate:video.playbackRate,error:video.error?.message||null},deck:{reverse:deck.reverse,playing:deck.playing,processing:deck.processing,position:deck.position,rate:deck.rate,enginePosition:engine.position(deck)},mixer:mixer.diagnostics()});
      const events=['play','playing','pause','seeking','seeked','loadeddata','canplay'],recordEvent=event=>trace.events.push(snapshot('event:'+event.type));events.forEach(type=>video.addEventListener(type,recordEvent));
      try{
        // Isolate this two-sample reverse contract from the previous forward case.
        // The separate queued-target case below exercises an already-active old seek.
        trace.phases.push(snapshot('before-draining-prior-seek'));video.pause();await until(()=>snapshot('draining-prior-seek'),s=>s.video.paused&&s.video.readyState>=2&&!s.video.seeking,{timeout:3000});trace.phases.push(snapshot('after-draining-prior-seek'));state.video.linked=true;
        trace.phases.push(snapshot('before-engine-reverse'));await engine.seek(deck,Math.min(.9,video.duration*.7));await engine.setReverse(deck,true);trace.phases.push(snapshot('after-engine-reverse'));assert(deck.reverse===true&&deck.playing,'Actual engine did not start reverse transport: '+JSON.stringify(trace.phases.at(-1)));
        const samples=trace.samples;
        for(let i=0;i<2;i++){
          if(i)await until(()=>engine.position(deck),p=>p<samples[0].enginePosition-.12);
          const enginePosition=engine.position(deck),expected=((enginePosition%video.duration)+video.duration)%video.duration;trace.phases.push(snapshot('sample'+i+':before-tick'));
          const seeked=mediaEvent(video,'seeked');mixer.tick(true);trace.phases.push(snapshot('sample'+i+':after-tick'));await seeked;trace.phases.push(snapshot('sample'+i+':after-seeked'));
          // A seeked event alone is insufficient if current-frame data is still unavailable.
          // Wait for the same strict paused/decoded criterion without issuing another seek.
          await until(()=>snapshot('sample'+i+':decode-wait'),s=>s.video.paused&&s.video.readyState>=2&&!s.video.seeking,{timeout:3000});trace.phases.push(snapshot('sample'+i+':after-decoded-wait'));
          assert(video.paused&&video.readyState>=2&&!video.seeking,'Reverse input was not paused with an actual decoded seek: '+JSON.stringify(trace.phases.at(-1)));assert(Math.abs(video.currentTime-expected)<.1,'Paused reverse video did not seek to the actual engine position: '+JSON.stringify({expected,actual:snapshot('position-assert')}));
          samples.push({enginePosition,expected,videoPosition:video.currentTime,paused:video.paused,readyState:video.readyState,pixel:pixel(read(video),20,20)});
        }
        assert(samples[1].videoPosition<samples[0].videoPosition-.08,'Reverse linked video position did not decrease: '+JSON.stringify(samples));return{reverse:deck.reverse,rate:deck.rate,realEngine:true,samples,completion:'Actual seeked events followed by paused decoded readyState>=2 with no further seek; no fixed-delay completion proxy.'};
      }catch(error){trace.failure=snapshot('failure-before-cleanup');throw new Error(error.message+' | reverse state: '+JSON.stringify(trace.failure));}
      finally{events.forEach(type=>video.removeEventListener(type,recordEvent));await engine.setReverse(deck,false);state.video.linked=false;}
    });
    await test('A new real engine target reaches decoded pixels after an older active video seek finishes',async()=>{
      const deck=state.decks[0],video=sourceVideos[0];assert(mixer&&deck?.track&&video,'Queued linked-seek prerequisite unavailable.');const wasPlaying=deck.playing||deck.processing;state.video.linked=false;engine.pause(deck);
      const evidence=report.queuedLinkedSeek={phases:[],seekedEvents:[],positionToleranceSeconds:.1,completion:'Drain old seek, then pump actual rAF/mixer frames until the distinct new engine target is paused, decoded and within0.1s. No old-frame acceptance.'};
      const snapshot=phase=>({phase,wallMs:performance.now(),enginePosition:engine.position(deck),reverse:deck.reverse,playing:deck.playing,videoPosition:video.currentTime,paused:video.paused,readyState:video.readyState,seeking:video.seeking});
      const onSeeked=()=>evidence.seekedEvents.push(snapshot('seeked'));video.addEventListener('seeked',onSeeked);
      try{
        await seekDecodedVideo(video,Math.min(.15,video.duration*.1));mixer.tick(true);const before=read($('#pipeline-preview canvas'));evidence.before={...snapshot('primed'),hash:hash(before),pixel:pixel(before,20,20)};evidence.seekedEvents.length=0;
        const oldTarget=Math.min(.35,video.duration*.25),newTarget=Math.min(.95,video.duration*.7);assert(Math.abs(newTarget-oldTarget)>.3,'Queued fixture targets are not distinct.');
        await engine.setReverse(deck,true);await engine.seek(deck,newTarget);const oldSeeked=mediaEvent(video,'seeked');video.currentTime=oldTarget;evidence.phases.push(snapshot('old-seek-started'));assert(video.seeking&&video.readyState<2,'Actual pending old seek was not exercised: '+JSON.stringify(evidence));state.video.linked=true;
        mixer.tick(true);evidence.phases.push(snapshot('tick-with-old-seek-active'));assert(video.seeking&&Math.abs(video.currentTime-oldTarget)<.01,'Mixer restarted an already-active old seek: '+JSON.stringify(evidence));
        await oldSeeked;await until(()=>snapshot('old-decode-wait'),s=>s.readyState>=2&&!s.seeking,{timeout:3000});evidence.phases.push(snapshot('old-seek-decoded'));assert(Math.abs(video.currentTime-newTarget)>.3,'Old completion was incorrectly indistinguishable from the new target.');
        const [,settled]=await Promise.all([mediaEvent(video,'seeked'),until(()=>snapshot('new-target-pump'),s=>s.paused&&s.readyState>=2&&!s.seeking&&Math.abs(s.videoPosition-s.enginePosition)<.1,{pump:()=>mixer.tick(true),timeout:5000})]);evidence.completionBarrier='Both the new decoded target and its distinct seeked event must complete.';evidence.phases.push(settled);mixer.tick(true);const output=read($('#pipeline-preview canvas'));evidence.after={...snapshot('new-target-decoded'),hash:hash(output),pixel:pixel(output,20,20),sourcePixel:pixel(read(video),20,20)};
        assert(Math.abs(evidence.after.videoPosition-newTarget)<.1&&Math.abs(evidence.after.enginePosition-newTarget)<.001&&evidence.seekedEvents.length>=2,'Distinct new engine target did not complete a second decoded seek: '+JSON.stringify(evidence));assert(evidence.after.paused&&evidence.after.readyState>=2&&!evidence.after.seeking&&evidence.after.pixel[0]<90&&evidence.after.pixel[1]>150&&evidence.after.pixel[2]>150&&evidence.after.hash!==evidence.before.hash,'New decoded target output is stale, empty or unprocessed: '+JSON.stringify(evidence));return evidence;
      }catch(error){evidence.failure=snapshot('failure-before-cleanup');throw new Error(error.message+' | queued seek state: '+JSON.stringify(evidence.failure));}
      finally{video.removeEventListener('seeked',onSeeked);state.video.linked=false;await engine.setReverse(deck,false);if(wasPlaying&&!deck.playing)await engine.start(deck);}
    });
    await test('Actual asynchronous video seek retains the last decoded processed frame until the new frame is decoded',async()=>{
      const video=sourceVideos[0];assert(mixer&&video,'Mixer input prerequisite unavailable.');state.video.linked=false;state.video.cross=-1;state.video.fx={left:[fx('Negative')],right:[],master:[]};state.video.overlays={left:[],right:[],master:[]};
      const evidence=report.seekFrameRetention={};await seekDecodedVideo(video,Math.min(.15,video.duration*.1));mixer.tick(true);const before=read($('#pipeline-preview canvas'));evidence.before={hash:hash(before),pixel:pixel(before,20,20),readyState:video.readyState,currentTime:video.currentTime};assert(evidence.before.pixel[0]<90&&evidence.before.pixel[1]>150&&evidence.before.pixel[2]>150,'Seek retention prerequisite was not an actual decoded cyan frame: '+JSON.stringify(evidence));
      const seeked=mediaEvent(video,'seeked');video.currentTime=Math.min(.95,video.duration*.7);evidence.seekStarted={readyState:video.readyState,seeking:video.seeking,currentTime:video.currentTime};mixer.tick(true);const during=read($('#pipeline-preview canvas'));evidence.during={hash:hash(during),pixel:pixel(during,20,20),readyState:video.readyState,seeking:video.seeking};
      await seeked;await until(()=>({readyState:video.readyState,seeking:video.seeking}),v=>v.readyState>=2&&!v.seeking);mixer.tick(true);const after=read($('#pipeline-preview canvas'));evidence.after={hash:hash(after),pixel:pixel(after,20,20),readyState:video.readyState,currentTime:video.currentTime};
      assert(evidence.seekStarted.seeking&&evidence.seekStarted.readyState<2,'Actual unavailable-frame seek window was not exercised: '+JSON.stringify(evidence));assert(evidence.during.hash===evidence.before.hash,'Mixer replaced the last decoded frame during an actual asynchronous seek: '+JSON.stringify(evidence));assert(evidence.after.hash!==evidence.before.hash&&evidence.after.pixel[0]<90&&evidence.after.pixel[1]>150&&evidence.after.pixel[2]>150,'New decoded seek frame did not replace the retained frame: '+JSON.stringify(evidence));return evidence;
    });
    await test('Twelve actual linked reverse renders preserve decoded video pixels and allow asynchronous seek completion',async()=>{
      const deck=state.decks[0],video=sourceVideos[0];assert(mixer&&deck?.track&&video,'Real reverse prerequisite unavailable.');state.video.linked=false;await seekDecodedVideo(video,Math.min(.15,video.duration*.1));mixer.tick(true);
      const evidence=report.continuousReverse={samples:[],seekedEvents:[]},onSeeked=()=>evidence.seekedEvents.push({wallMs:performance.now(),currentTime:video.currentTime,readyState:video.readyState});video.addEventListener('seeked',onSeeked);
      try{
        await engine.seek(deck,Math.min(1.15,video.duration*.8));await engine.setReverse(deck,true);state.video.linked=true;
        for(let i=0;i<12;i++){await raf();mixer.tick(true);const image=read($('#pipeline-preview canvas'));evidence.samples.push({frame:i,enginePosition:engine.position(deck),videoPosition:video.currentTime,paused:video.paused,seeking:video.seeking,readyState:video.readyState,pixel:pixel(image,20,20),hash:hash(image)});}
        const inLoopSeekCompletions=evidence.seekedEvents.length;state.video.linked=false;await until(()=>({readyState:video.readyState,seeking:video.seeking}),v=>v.readyState>=2&&!v.seeking);evidence.inLoopSeekCompletions=inLoopSeekCompletions;evidence.afterDecode={currentTime:video.currentTime,readyState:video.readyState};
        assert(evidence.samples.every(s=>s.paused&&s.pixel[0]<90&&s.pixel[1]>150&&s.pixel[2]>150),'Actual continuous reverse emitted an empty/placeholder frame or played its input: '+JSON.stringify(evidence));assert(inLoopSeekCompletions>0,'Repeated reverse ticks prevented all asynchronous seek completion: '+JSON.stringify(evidence));assert(evidence.samples[0].enginePosition>evidence.samples.at(-1).enginePosition+.05,'Actual reverse engine position did not decrease across the bounded renders: '+JSON.stringify(evidence));return{...evidence,scope:'Twelve rAF-paced actual engine/mixer renders with synchronous pixel readback; no sustained frame-rate claim.'};
      }finally{video.removeEventListener('seeked',onSeeked);state.video.linked=false;await engine.setReverse(deck,false);}
    });
    await test('Mixer records processed GPU canvas plus actual master audio and rejects resolution change during capture',async()=>{
      assert(mixer,'Mixer unavailable.');if(!state.decks[0].track){const duration=10,buffer=engine.ctx.createBuffer(1,engine.ctx.sampleRate*duration,engine.ctx.sampleRate),pcm=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)pcm[i]=.1*Math.sin(2*Math.PI*440*i/engine.ctx.sampleRate);const deck={index:0,track:{id:'pipeline-capture-tone',duration,bpm:120},position:0,rate:1,keylock:false,loop:true,loopIn:0,loopOut:duration,stems:[true,true,true,true],stemFX:[false,false,false,false]};state.decks[0]=deck;engine.buffers.set(deck.track.id,buffer);await engine.start(deck);}
      state.video.linked=false;state.video.cross=-1;state.video.fx={left:[fx('Negative')],right:[],master:[]};state.video.overlays.master=[{kind:'text',on:true,text:'CAPTURE',fontSize:28,color:'#ff00ff',x:.5,y:.5,align:'center'}];if(sourceVideos[0].paused)await mixer.play(0);await decodedFrame(sourceVideos[0],()=>mixer.tick(true));await mixer.record();const initial=mixer.diagnostics().frames,start=performance.now();let rejected=false;try{mixer.setResolution(1280,720);}catch{rejected=true;}assert(rejected,'Resolution changed while recording.');await until(()=>mixer.diagnostics().frames,n=>n-initial>=30&&performance.now()-start>=1400,{timeout:10000,pump:()=>mixer.tick()});capture=await mixer.stop();assert(capture instanceof Blob&&capture.size>1000&&mixer.result===capture,'No real capture blob/result.');const elapsed=performance.now()-start;report.capture={bytes:capture.size,mime:capture.type,processedFrames:mixer.diagnostics().frames-initial,wallMs:elapsed,observedProcessedFramesPerSecond:(mixer.diagnostics().frames-initial)*1000/elapsed,engineCaptureAudioTracks:engine.destination.stream.getAudioTracks().map(t=>({kind:t.kind,readyState:t.readyState,enabled:t.enabled})),scope:'Actual mixer tick, GPU pipeline and MediaRecorder run; requested30fps is not a measured frame-rate guarantee.'};return report.capture;
    });
    await test('Captured result decodes actual video frames with processed cyan pixels and overlay evidence',async()=>{
      assert(capture,'Capture blob unavailable.');decodedCapture=await decodeBlob(capture);const p=pixel(decodedCapture.image,20,20);assert(p[0]<100&&p[1]>140&&p[2]>140,'Recorded pixels are raw red, blank or unprocessed: '+p);let magenta=0;for(let i=0;i<decodedCapture.image.data.length;i+=4)if(decodedCapture.image.data[i]>150&&decodedCapture.image.data[i+1]<120&&decodedCapture.image.data[i+2]>140)magenta++;assert(magenta>15,'Master overlay was absent from encoded result.');report.decodedCapture={...decodedCapture.metadata,corner:p,magentaOverlayPixels:magenta};return report.decodedCapture;
    });
    await test('Captured result audio really decodes nonzero440Hz engine audio with stream metadata',async()=>{
      assert(capture,'Capture unavailable.');const buffer=await bounded(engine.ctx.decodeAudioData(await capture.arrayBuffer()),'Captured audio decode');const pcm=buffer.getChannelData(0),rms=Math.sqrt(pcm.reduce((s,x)=>s+x*x,0)/pcm.length),tone440=toneAmplitude(pcm,buffer.sampleRate,440),tone880=toneAmplitude(pcm,buffer.sampleRate,880);assert(rms>.003&&tone440>.005&&tone440>tone880*4,'Captured master audio is silent or not the actual engine440Hz tone.');report.captureAudio={channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,duration:buffer.duration,rms,tone440,tone880,claim:'Actual audio decode from the captured video container, not just presence of an input stream track.'};return report.captureAudio;
    });
    await test('Stopped mixer changes to720p, renders actual output and rejects unsupported dimensions',()=>{
      assert(mixer,'Mixer unavailable.');decodedCapture?.cleanup();decodedCapture=null;mixer.setResolution(1280,720);mixer.tick(true);const c=$('#pipeline-preview canvas'),diag=mixer.diagnostics();assert(c.width===1280&&c.height===720&&!diag.error&&diag.pipeline.width===1280,'Resolution did not rebuild/render actual pipeline.');const p=pixel(read(c),20,20);assert(p[1]>130&&p[2]>130,'Resized output is blank/unprocessed.');let rejected=false;try{mixer.setResolution(100,100);}catch{rejected=true;}assert(rejected,'Unsupported resolution accepted.');return{width:c.width,height:c.height,pixel:p,frames:diag.frames,unsupportedRejected:rejected};
    });
    await test('Stopped mixer changes from720p to1080p and renders/readbacks an actual processed output frame',()=>{
      assert(mixer,'Mixer unavailable.');const started=performance.now();mixer.setResolution(1920,1080);mixer.tick(true);const c=$('#pipeline-preview canvas'),diag=mixer.diagnostics(),p=pixel(read(c),20,20);assert(c.width===1920&&c.height===1080&&!diag.error&&diag.pipeline.width===1920&&diag.pipeline.height===1080,'1080p pipeline did not rebuild/render.');assert(p[0]<100&&p[1]>130&&p[2]>130,'1080p output is blank/unprocessed.');return{width:c.width,height:c.height,pixel:p,frames:diag.frames,renderAndReadbackMs:performance.now()-started,scope:'One actual processed 1080p render with synchronous pixel readback after720p; no frame-rate or sustained-load guarantee.'};
    });
    await test('Mixer disposal stops actual input videos and rejects new loads',async()=>{
      assert(mixer,'Mixer unavailable.');await mixer.dispose();const before=mixer.diagnostics().frames;mixer.tick(true);assert(mixer.diagnostics().frames===before&&sourceVideos.every(v=>v.paused),'Disposed mixer advanced or left video playing.');let rejected=false;try{await mixer.load(0,fixture.file);}catch{rejected=true;}assert(rejected,'Disposed mixer accepted a load.');return{frames:before,inputsPaused:sourceVideos.map(v=>v.paused),newLoadRejected:rejected};
    });
  }catch(error){checks.push({name:'Harness setup/unhandled failure',passed:false,error:error.message,stack:error.stack});}
  finally{
    for(const r of resources)try{r.dispose();}catch{}standalone?.dispose();analysisSources.forEach(s=>{try{s.osc.stop();s.osc.disconnect();s.gain.disconnect();}catch{}});decodedCapture?.cleanup();await mixer?.dispose();sourceVideos.forEach(v=>v.remove());
    try{engine.videoAnalyzers?.dispose();engine.silence();await engine.ctx.close();}catch(error){messages.push('Cleanup: '+error.message);}
  }
  report.passed=checks.filter(x=>x.passed).length;report.failed=checks.filter(x=>!x.passed).length;report.durationMs=performance.now()-started;report.messages=messages;report.scope='Actual browser integration evidence only. No native/hardware/reference parity; no full30fps assumption. Failures are preserved, including codec/container or environment limitations.';
  window.videoPipelineHarnessResult=report;$('#results').textContent=JSON.stringify(report,null,2);$('#status').textContent=`${report.passed} passed / ${report.failed} failed`;return report;
}
$('#run').onclick=async()=>{$('#run').disabled=true;$('#status').textContent='Running actual media/audio/GPU integration…';try{await runVideoPipelineChecks();}catch(error){window.videoPipelineHarnessResult={passed:0,failed:1,fatal:error.message};$('#results').textContent=error.stack;$('#status').textContent='Fatal harness failure';}finally{$('#run').disabled=false;}};
