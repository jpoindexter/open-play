import {AudioEngine} from './engine.js';
import {createVideoMixer} from './video.js';
import {videoRecordingPolicy} from './video-recording.js';
const $=s=>document.querySelector(s),W=1280,H=720;
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const urls=new Set();
function clearDownloads(){for(const url of urls)URL.revokeObjectURL(url);urls.clear();$('#downloads').replaceChildren();}
window.addEventListener('pagehide',clearDownloads);
function publish(blob,name){const url=URL.createObjectURL(blob);urls.add(url);const a=document.createElement('a');a.href=url;a.download=name;a.textContent=`Download ${name} (${blob.size} bytes)`;$('#downloads').append(a);return {name,bytes:blob.size,mime:blob.type};}
function bounded(promise,label,timeout=15000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out')),timeout);})]).finally(()=>clearTimeout(timer));}
async function until(read,predicate,pump=()=>{}){const deadline=performance.now()+15000;let value;do{pump();value=read();if(predicate(value))return value;await raf();}while(performance.now()<deadline);throw new Error('Actual-state predicate timed out: '+JSON.stringify(value));}
const rejectsSync=(operation,message)=>{let error;try{operation();}catch(e){error=e;}assert(error,message);return error.message;};
function mediaEvent(video,type){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>finish(new Error(type+' timed out')),15000);const good=()=>finish(),bad=()=>finish(new Error(video.error?.message||'Encoded video failed to decode'));function finish(error){clearTimeout(timer);video.removeEventListener(type,good);video.removeEventListener('error',bad);error?reject(error):resolve();}video.addEventListener(type,good,{once:true});video.addEventListener('error',bad,{once:true});});}
async function decodeVideo(blob){
 const video=document.createElement('video'),url=URL.createObjectURL(blob);video.muted=true;video.playsInline=true;$('#media-stage').append(video);let callback,timer;
 try{
  const ready=mediaEvent(video,'loadeddata');video.src=url;video.load();await ready;
  assert(typeof video.requestVideoFrameCallback==='function','Actual encoded frame callback API required');
  const frame=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Encoded video frame callback timed out')),15000);callback=video.requestVideoFrameCallback((_,metadata)=>resolve(metadata));});
  const [metadata]=await bounded(Promise.all([frame,video.play()]),'Encoded play/frame readiness');video.pause();
  const canvas=make(video.videoWidth,video.videoHeight),ctx=canvas.getContext('2d');ctx.drawImage(video,0,0);
  return {image:ctx.getImageData(0,0,canvas.width,canvas.height),metadata:{width:video.videoWidth,height:video.videoHeight,mediaTime:metadata.mediaTime,presentedFrames:metadata.presentedFrames,callbackWidth:metadata.width,callbackHeight:metadata.height,duration:Number.isFinite(video.duration)?video.duration:String(video.duration)}};
 }finally{clearTimeout(timer);video.cancelVideoFrameCallback?.(callback);video.pause();URL.revokeObjectURL(url);video.remove();}
}
function pixel(image,x,y){const n=(Math.floor(y*image.height)*image.width+Math.floor(x*image.width))*4;return [...image.data.slice(n,n+4)];}
function amplitude(pcm,sr,hz){const count=Math.min(pcm.length,sr),start=Math.floor((pcm.length-count)/2),c=2*Math.cos(2*Math.PI*hz/sr);let a=0,b=0;for(let i=start;i<start+count;i++){const next=pcm[i]+c*a-b;b=a;a=next;}return 2*Math.sqrt(Math.max(0,a*a+b*b-c*a*b))/count;}
async function pngFixture(){const canvas=make(W,H),ctx=canvas.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(0,0,W,H);ctx.fillStyle='#00ff00';ctx.fillRect(.2*W,.2*H,.2*W,.22*H);ctx.fillStyle='#0000ff';ctx.fillRect(.72*W,.65*H,.18*W,.2*H);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));assert(blob,'Original PNG encoding failed');return new File([blob],'recording-quality-original.png',{type:'image/png'});}
export async function runVideoRecordingChecks(){
 clearDownloads();const checks=[],report={startedAt:new Date().toISOString(),policy:videoRecordingPolicy,scope:'Actual mixer/GPU/Canvas2D/MediaRecorder/container decoder/AudioEngine. Generated PNG is a real image asset; no source-video File is loaded. Requested30fps is not measured fps or vendor equivalence.',captures:[],notifications:[]};
 const engine=new AudioEngine();engine.init();engine.analyser.disconnect();const resume=engine.ctx.resume();let mixer,osc,gain,live;
 const state={settings:{},decks:[0,1].map(index=>({index,track:null,position:0,rate:1,playing:false})),video:{width:W,height:H,linked:false,cross:-1,fx:{left:[],right:[],master:[{name:'Negative',on:true,value:1,params:{}}]},overlays:{left:[],right:[],master:[{id:'quality-marker',imageRef:'quality-marker',kind:'image',on:true,x:.5,y:.5,align:'center',scale:1,opacity:1,animation:'none'}]}}};
 async function test(name,run){$('#status').textContent=`Running ${checks.length+1}: ${name}`;try{const evidence=await run();checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,error:error.stack||error.message});}$('#results').textContent=JSON.stringify({...report,checks},null,2);}
 try{
  await test('Actual processed1280×720 mixer with decoded original PNG and audible master fixture',async()=>{
   await resume;await engine.resume();assert(typeof MediaRecorder==='function'&&typeof HTMLCanvasElement.prototype.captureStream==='function','Actual capture APIs required');
   osc=engine.ctx.createOscillator();gain=engine.ctx.createGain();osc.frequency.value=440;gain.gain.value=.2;osc.connect(gain);gain.connect(engine.nodes[0].input);osc.start();
   mixer=createVideoMixer({state,engine,notify:message=>report.notifications.push(message)});live=make(W,H);$('#live-stage').replaceChildren(live);mixer.bind(live);
   const file=await pngFixture();publish(file,file.name);await mixer.setOverlayImage('master','quality-marker',file);mixer.tick(true);const d=mixer.diagnostics();assert(!d.error,'Actual pipeline error: '+d.error);
   const p=pixel(live.getContext('2d').getImageData(0,0,W,H),.05,.05);assert(p[0]<30&&p[1]>220&&p[2]>220,'Actual Negative output is not cyan: '+p);return {live:[live.width,live.height],processedCorner:p,fixture:file.name};
  });
  await test('Missing saved quality preserves output-size default',()=>{assert(mixer,'Setup unavailable');assert(mixer.diagnostics().recordingQuality==='output','No saved choice silently changed legacy output-size capture');return {recordingQuality:mixer.diagnostics().recordingQuality};});
  for(const [quality,width,height] of [['output',1280,720],['360p',640,360],['480p',854,480],['720p',1280,720],['1080p',1920,1080]]){
   let capture,recordStart,frameStart,started=false;const item={quality,expected:[width,height]};report.captures.push(item);
   await test(`${quality}: actual start guards and independent capture dimensions`,async()=>{
    assert(mixer&&live,'Setup unavailable');mixer.setRecordingQuality(quality);const starting=mixer.record();
    item.startGuard=rejectsSync(()=>mixer.setRecordingQuality('360p'),'Recording quality changed during pending start');await bounded(starting,'Actual record start');started=true;recordStart=performance.now();frameStart=mixer.diagnostics().frames;
    item.activeGuard=rejectsSync(()=>mixer.setRecordingQuality('720p'),'Recording quality changed during active capture');const dimensions=mixer.diagnostics().captureDimensions;assert(dimensions?.width===width&&dimensions?.height===height,'Capture lease dimensions wrong: '+JSON.stringify(dimensions));assert(live.width===W&&live.height===H,'Recording resolution resized live output');return {captureDimensions:dimensions,live:[live.width,live.height],startGuard:item.startGuard,activeGuard:item.activeGuard};
   });
   await test(`${quality}: actual stop guard, encoded blob and retained master track`,async()=>{
    assert(started,'No actual recording start');await until(()=>({elapsed:performance.now()-recordStart,frames:mixer.diagnostics().frames-frameStart}),value=>value.elapsed>=1100&&value.frames>=18,()=>mixer.tick());
    const stopping=mixer.stop();item.stopGuard=rejectsSync(()=>mixer.setRecordingQuality('output'),'Quality changed before pending stop settled');capture=await bounded(stopping,'Actual record stop');started=false;assert(capture instanceof Blob&&capture.size>1000,'Actual capture missing/empty');assert(engine.destination.stream.getAudioTracks().every(t=>t.readyState==='live'),'Capture stopped the shared master audio track');
    mixer.setRecordingQuality(quality);item.file=publish(capture,`recording-quality-${quality}.${capture.type.includes('mp4')?'mp4':'webm'}`);item.elapsedMs=performance.now()-recordStart;item.processedFrames=mixer.diagnostics().frames-frameStart;return {...item.file,elapsedMs:item.elapsedMs,processedFrames:item.processedFrames,stopGuard:item.stopGuard};
   });
   await test(`${quality}: container decodes expected dimensions, processed pixels and marker geometry`,async()=>{
    assert(capture,'No encoded container');const {image,metadata}=await decodeVideo(capture);assert(metadata.width===width&&metadata.height===height,'Actual encoded dimensions differ: '+JSON.stringify(metadata));assert(metadata.callbackWidth===width&&metadata.callbackHeight===height&&metadata.presentedFrames>=1,'No actual encoded presented-frame dimensions');
    const corner=pixel(image,.05,.05),greenMarker=pixel(image,.3,.3),blueMarker=pixel(image,.8,.75);assert(corner[0]<80&&corner[1]>170&&corner[2]>170,'Encoded result is unprocessed/blank at corner: '+corner);assert(greenMarker[0]>170&&greenMarker[1]<80&&greenMarker[2]>170,'Processed magenta marker missing/wrong geometry: '+greenMarker);assert(blueMarker[0]>170&&blueMarker[1]>170&&blueMarker[2]<80,'Processed yellow asymmetric marker missing: '+blueMarker);
    let left=width,right=-1;for(let x=0;x<width;x++){const p=pixel(image,x/width,.3);if(p[0]>170&&p[1]<80&&p[2]>170){left=Math.min(left,x);right=x;}}assert(Math.abs(left/width-.2)<.025&&Math.abs((right+1)/width-.4)<.025,'Encoded marker width/aspect changed: '+JSON.stringify({left,right,width}));
    item.video={...metadata,corner,greenMarker,blueMarker,markerFraction:[left/width,(right+1)/width]};return item.video;
   });
   await test(`${quality}: container audio actually decodes440Hz master PCM`,async()=>{
    assert(capture,'No encoded container');const audio=await bounded(engine.ctx.decodeAudioData(await capture.arrayBuffer()),'Captured container audio decode'),pcm=audio.getChannelData(0),rms=Math.sqrt(pcm.reduce((sum,n)=>sum+n*n,0)/pcm.length),tone440=amplitude(pcm,audio.sampleRate,440),tone1000=amplitude(pcm,audio.sampleRate,1000);assert(rms>.005&&tone440>.01&&tone440>tone1000*8,'Recorded master is silent or wrong tone: '+JSON.stringify({rms,tone440,tone1000}));item.audio={rms,tone440,tone1000,sampleRate:audio.sampleRate,channels:audio.numberOfChannels,duration:audio.duration};return item.audio;
   });
   if(started&&mixer?.recording)await bounded(mixer.stop(),'Failure cleanup stop');
  }
  await test('Actual live output remains1280×720 after all five captures and disposal cancels future starts',async()=>{
   assert(mixer&&live,'Setup unavailable');assert(live.width===W&&live.height===H,'Live canvas changed dimensions');await mixer.dispose();let rejected=false;try{await mixer.record();}catch{rejected=true;}assert(rejected,'Disposed mixer resurrected recording');return {live:[live.width,live.height],captures:report.captures.length,disposedStartRejected:rejected};
  });
 }catch(error){checks.push({name:'Unhandled setup/cleanup error',passed:false,error:error.stack||error.message});}
 finally{if(mixer)await mixer.dispose().catch(error=>report.notifications.push(error.message));try{osc?.stop();}catch{}osc?.disconnect();gain?.disconnect();await engine.ctx.close();}
 report.passed=checks.filter(c=>c.passed).length;report.failed=checks.filter(c=>!c.passed).length;report.checks=checks;report.finishedAt=new Date().toISOString();$('#results').textContent=JSON.stringify(report,null,2);$('#status').textContent=`${report.passed}/${checks.length} actual recording quality checks passed`;return report;
}
let running=false;$('#run').onclick=async()=>{if(running)return;running=true;$('#run').disabled=true;try{await runVideoRecordingChecks();}finally{running=false;$('#run').disabled=false;}};
