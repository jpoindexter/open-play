import {AudioEngine} from './engine.js';
import {createVideoMixer} from './video.js';
import {createCDGDecoder,CDG_FORMAT} from './cdg.js';
import {videoKaraokePolicy} from './video-karaoke.js';

const $=s=>document.querySelector(s),W=640,H=360;
const assert=(value,message)=>{if(!value)throw new Error(message);};
const raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const canvas=(width=W,height=H)=>Object.assign(document.createElement('canvas'),{width,height});
function read(source){const width=source instanceof HTMLVideoElement?source.videoWidth:source.width,height=source instanceof HTMLVideoElement?source.videoHeight:source.height;assert(width>0&&height>0,'Readback needs positive decoded dimensions.');const c=canvas(width,height),ctx=c.getContext('2d');ctx.drawImage(source,0,0);return ctx.getImageData(0,0,width,height);}
const pixel=(image,x,y)=>[...image.data.slice((y*image.width+x)*4,(y*image.width+x)*4+4)];
const near=(a,b,tolerance=3)=>a.every((value,i)=>Math.abs(value-b[i])<=tolerance);
function hash(image){let h=2166136261;for(const v of image.data)h=Math.imul(h^v,16777619);return(h>>>0).toString(16);}
function meanDifference(a,b){assert(a.data.length===b.data.length,'Image dimensions differ.');let total=0;for(let i=0;i<a.data.length;i++)total+=Math.abs(a.data[i]-b.data[i]);return total/a.data.length;}
async function until(value,predicate,{pump=()=>{},timeout=8000}={}){const end=performance.now()+timeout;let current;do{pump();current=value();if(predicate(current))return current;await raf();}while(performance.now()<end);throw new Error('Actual-state predicate timed out: '+JSON.stringify(current));}
function bounded(promise,label,timeout=20000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out')),timeout);})]).finally(()=>clearTimeout(timer));}
function mediaEvent(target,type){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>finish(new Error(type+' timed out')),10000),good=event=>finish(null,event),bad=()=>finish(new Error(target.error?.message||'Media error'));function finish(error,event){clearTimeout(timer);target.removeEventListener(type,good);target.removeEventListener('error',bad);error?reject(error):resolve(event);}target.addEventListener(type,good,{once:true});target.addEventListener('error',bad,{once:true});});}
function decodedFrame(video){assert(typeof video.requestVideoFrameCallback==='function','Actual video-frame callback API is required.');return new Promise((resolve,reject)=>{let id;const timer=setTimeout(()=>{video.cancelVideoFrameCallback(id);reject(new Error('Actual decoded frame timed out'));},7000);id=video.requestVideoFrameCallback((_,metadata)=>{clearTimeout(timer);resolve({mediaTime:metadata.mediaTime,presentedFrames:metadata.presentedFrames,width:metadata.width,height:metadata.height});});});}
const fixtureURLs=new Map();
function clearDownloads(){for(const [id,url] of fixtureURLs){URL.revokeObjectURL(url);$('#'+id).hidden=true;$('#'+id).removeAttribute('href');}fixtureURLs.clear();}
function download(id,file){const a=$('#'+id),url=URL.createObjectURL(file);fixtureURLs.set(id,url);a.href=url;a.download=file.name;a.hidden=false;a.textContent=`Download ${file.name} (${file.size} bytes)`;return{anchor:id,filename:file.name,bytes:file.size,mime:file.type};}
window.addEventListener('pagehide',clearDownloads);

// Original synthetic packet stream. Every unused packet retains its 1/300s slot.
const packet=(op,data=[],command=9)=>{const p=new Uint8Array(24);p[0]=command;p[1]=op;p.set(data,4);return p;};
const palette=[0,0xf00,0x0f0,0x00f,0xff0,0x0ff,0xf0f,0x888,0x123,0x456,0x789,0xabc,0xdef,0x135,0x579,0xfff];
const clut=high=>packet(high?31:30,palette.slice(high?8:0,high?16:8).flatMap(c=>[(c>>6)&63,c&63]));
function cdgFixture(){
  const packets=Array.from({length:1200},()=>packet(0,[],0));packets[0]=clut(false);packets[1]=clut(true);
  const stage=(at,color)=>{packets[at]=packet(1,[color]);let cursor=at+1;for(let row=7;row<11;row++)for(let col=19;col<31;col++)packets[cursor++]=packet(6,[color,15,row,col,...Array(12).fill(63)]);};
  stage(2,1);stage(150,2);stage(300,3);stage(450,4);stage(600,1);stage(900,2);
  const alpha=Array(16).fill(0);alpha[2]=32;packets[250]=packet(28,alpha);
  const bytes=new Uint8Array(packets.length*24);packets.forEach((p,i)=>bytes.set(p,i*24));return bytes;
}
function wavFixture(){
  const sampleRate=16000,seconds=4,count=sampleRate*seconds,buffer=new ArrayBuffer(44+count*2),view=new DataView(buffer);
  const text=(at,s)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));text(0,'RIFF');view.setUint32(4,36+count*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true);
  for(let i=0;i<count;i++)view.setInt16(44+i*2,Math.round(.15*32767*Math.sin(2*Math.PI*440*i/sampleRate)),true);return buffer;
}
function expectedFrame(bytes,time,{transparency='index',crop=false}={}){
  const decoder=createCDGDecoder(bytes,{transparency});try{const f=decoder.renderAt(time,{crop}),source=canvas(f.width,f.height);source.getContext('2d').putImageData(new ImageData(f.data,f.width,f.height),0,0);const c=canvas(),scale=Math.min(W/f.width,H/f.height);c.getContext('2d').drawImage(source,(W-f.width*scale)/2,(H-f.height*scale)/2,f.width*scale,f.height*scale);return{image:read(c),packetCursor:f.packetCursor,source:[f.width,f.height]};}finally{decoder.dispose();}
}
const deckFor=track=>({index:0,track,playing:false,processing:false,position:0,rate:1,keylock:false,keyShift:0,reverse:false,loop:false,loopIn:0,loopOut:track.duration,stems:[true,true,true,true],stemFX:[false,false,false,false],videoLoadGeneration:0});
function toneAmplitude(samples,rate,hz){const count=Math.min(samples.length,rate),start=Math.max(0,Math.floor((samples.length-count)/2)),k=2*Math.cos(2*Math.PI*hz/rate);let a=0,b=0;for(let i=start;i<start+count;i++){const c=samples[i]+k*a-b;b=a;a=c;}return 2*Math.sqrt(Math.max(0,a*a+b*b-k*a*b))/count;}

export async function runKaraokeIntegrationChecks(){
  clearDownloads();const checks=[],notifications=[],started=performance.now(),bytes=cdgFixture(),cdg=new File([bytes],'open-play-karaoke-original.cdg',{type:'application/octet-stream'}),wav=new File([wavFixture()],'open-play-karaoke-original.wav',{type:'audio/wav'});
  const engine=new AudioEngine();engine.init();engine.analyser.disconnect();const resume=engine.ctx.resume();
  const track={id:'karaoke-original-fixture',title:'Original synthetic karaoke fixture',duration:4,bpm:120},state={settings:{'Reduced Motion':true},decks:[deckFor(track),{index:1,track:null,playing:false,position:0,rate:1}],video:{width:W,height:H,transition:'Crossfade',cross:-1,linked:false,auto:false,fx:{left:[],right:[],master:[]},overlays:{left:[],right:[],master:[]}}};
  const output=canvas();$('#output').replaceChildren(output);$('#replay').replaceChildren();
  let mixer,capture,replay,replayURL,buffer;
  const report={startedAt:new Date().toISOString(),policy:videoKaraokePolicy,format:CDG_FORMAT,checks,notifications,fixtures:{ownership:'Original synthetic packets and 440Hz PCM; generated locally, no vendor assets or external media.',cdg:download('download-cdg',cdg),wav:download('download-wav',wav)},seams:['Actual imported AudioEngine, mixer, bridge and decoder; original WAV decoded into the real engine BufferSource buffer map. No fake clock or decoder.','Expected image is a fresh public CDG decoder rendered independently into Canvas2D and letterboxed; this verifies bridge timing/routing, not decoder specification correctness.','Actual CDG File cancellation uses ordinary asynchronous File.arrayBuffer and a synchronous ownership change; no mocked read delays.','Main media-library import and physical audible/video sync are separate parent UI/device checks.']};
  async function test(name,fn){try{checks.push({name,passed:true,evidence:await fn()});}catch(error){checks.push({name,passed:false,error:error.message,stack:error.stack});}$('#status').textContent=`${checks.filter(c=>c.passed).length}/${checks.length} passed · ${name}`;$('#results').textContent=JSON.stringify(report,null,2);await raf();}
  function verifyFrame(label){
    mixer.tick(true);const diag=mixer.karaokeDiagnostics(0),mix=mixer.diagnostics();assert(!mix.error&&diag.available&&diag.position!==null,'Karaoke frame unavailable: '+JSON.stringify({diag,mix}));const expected=expectedFrame(bytes,diag.position,{transparency:diag.transparencyProfile,crop:diag.crop}),actual=read(output),difference=meanDifference(actual,expected.image),points=[[10,10],[150,100],[320,180],[489,280]].map(([x,y])=>({x,y,actual:pixel(actual,x,y),expected:pixel(expected.image,x,y)}));
    assert(difference<1.25&&points.every(p=>near(p.actual,p.expected,3)),label+' mismatches fresh decoder/letterbox: '+JSON.stringify({diag,difference,points}));assert(diag.decoder.packetCursor===expected.packetCursor,'Bridge packet cursor mismatches fresh decoder.');return{label,enginePosition:engine.position(state.decks[0]),sampledPosition:diag.position,assetId:diag.assetId,profile:diag.transparencyProfile,crop:diag.crop,source:expected.source,packetCursor:diag.decoder.packetCursor,difference,points,hash:hash(actual)};
  }
  try{
    await test('Actual engine resumes and original WAV decodes a real440Hz buffer; public fixture downloads retain exact bytes',async()=>{
      await resume;await bounded(engine.resume(),'AudioEngine worklets');buffer=await engine.ctx.decodeAudioData(await wav.arrayBuffer());engine.buffers.set(track.id,buffer);engine.setCross(-1);assert(engine.ctx.state==='running'&&buffer.duration===4&&toneAmplitude(buffer.getChannelData(0),buffer.sampleRate,440)>.1,'Actual WAV/engine buffer invalid.');const downloaded=new Uint8Array(await fetch($('#download-cdg').href).then(r=>r.arrayBuffer()));assert(downloaded.length===bytes.length&&downloaded.every((v,i)=>v===bytes[i]),'CDG download differs from actual load File.');return{sampleRate:buffer.sampleRate,duration:buffer.duration,channels:buffer.numberOfChannels,tone440:toneAmplitude(buffer.getChannelData(0),buffer.sampleRate,440),speakerRoute:'analyser disconnected; actual master capture destination remains connected',downloads:report.fixtures};
    });
    mixer=createVideoMixer({state,engine,notify:message=>notifications.push(message)});mixer.bind(output);
    await test('Actual named CDG File loads asynchronously onto its current audio-track owner without starting audio',async()=>{
      const result=await mixer.loadKaraoke(0,cdg,track.id,{transparency:'index',crop:false});assert(!state.decks[0].playing&&result.available&&result.trackId===track.id&&result.retainedAssociationBytes===bytes.length,'Actual load ownership/start behavior invalid.');return result;
    });
    await test('Paused time0 and initial palette/tile pixels match a fresh decoder through the real GPU mixer',async()=>{const zero=verifyFrame('Time0');await engine.seek(state.decks[0],.2);const initial=verifyFrame('Initial marker');assert(initial.hash!==zero.hash,'Initial timed packets did not change output.');return{zero,initial};});
    await test('Actual audio BufferSource advances karaoke past the0.5s marker while manual video linking is off',async()=>{
      const deck=state.decks[0];await engine.start(deck);await until(()=>mixer.karaokeDiagnostics(0).position,p=>p>.7,{pump:()=>mixer.tick(true)});assert(state.video.linked===false&&deck.playing,'Manual video policy or real engine state changed.');return verifyFrame('Real playback');
    });
    await test('Actual engine pause holds exact karaoke pixels across additional renders',async()=>{engine.pause(state.decks[0]);const a=verifyFrame('Paused first');await raf();await raf();const b=verifyFrame('Paused again');assert(a.sampledPosition===b.sampledPosition&&a.hash===b.hash,'Paused graphics advanced.');return{a,b};});
    await test('Actual engine forward/backward seeks replay CDG packets and exact letterboxed pixels',async()=>{await engine.seek(state.decks[0],1.2);const forward=verifyFrame('Seek forward');await engine.seek(state.decks[0],.2);const backward=verifyFrame('Seek backward');assert(forward.hash!==backward.hash,'Distinct timed backgrounds did not change.');return{forward,backward};});
    await test('Actual reverse BufferSource drives decreasing original-track seconds and fresh-decoder pixel replay',async()=>{
      const deck=state.decks[0];await engine.seek(deck,.85);await engine.start(deck);await engine.setReverse(deck,true);
      try{const before=verifyFrame('Reverse before');await until(()=>engine.position(deck),p=>p<.35,{pump:()=>mixer.tick(true)});const after=verifyFrame('Reverse after');assert(deck.reverse&&deck.playing&&after.sampledPosition<before.sampledPosition-.3&&after.hash!==before.hash,'Real reverse timeline/pixels did not decrease/change.');return{before,after};}finally{engine.pause(deck);await engine.setReverse(deck,false);}
    });
    await test('Actual engine audio loop wrap replays karaoke graphics at the wrapped track position',async()=>{
      const deck=state.decks[0];deck.loop=true;deck.loopIn=.1;deck.loopOut=.8;await engine.seek(deck,.65);await engine.start(deck);
      try{const before=verifyFrame('Loop before');await until(()=>engine.position(deck),p=>p<.3,{pump:()=>mixer.tick(true)});const after=verifyFrame('Loop after');assert(before.sampledPosition>.6&&after.sampledPosition<.3&&before.hash!==after.hash,'Actual loop/pixels did not wrap.');return{before,after};}finally{engine.pause(deck);deck.loop=false;}
    });
    await test('Manual left crossfade remains independent of the audio crossfader while karaoke follows engine seconds',async()=>{
      engine.setCross(1);state.video.cross=-1;state.video.linked=false;await engine.seek(state.decks[0],.2);const frame=verifyFrame('Manual left while audio right');assert(engine.cross===1&&state.video.cross===-1&&!state.video.linked,'Manual/audio crossfader independence not exercised.');engine.setCross(-1);return frame;
    });
    await test('Explicit index and alpha-table profiles produce distinct actual alpha and reset source identity',async()=>{
      await engine.seek(state.decks[0],.9);mixer.configureKaraoke(0,{transparency:'index',crop:false});const index=verifyFrame('Index profile');mixer.configureKaraoke(0,{transparency:'alpha-table',crop:false});const alpha=verifyFrame('Alpha table');assert(index.assetId!==alpha.assetId&&index.points[1].actual[3]===255&&Math.abs(alpha.points[1].actual[3]-127)<=2,'Explicit profiles failed to reset identity or preserve expected alpha.');return{index,alpha};
    });
    await test('Actual optional crop uses288x192 source and creates a new source identity',()=>{const before=mixer.karaokeDiagnostics(0).assetId;mixer.configureKaraoke(0,{transparency:'index',crop:true});const frame=verifyFrame('Cropped');assert(frame.source[0]===288&&frame.source[1]===192&&frame.assetId!==before,'Crop dimensions/source identity did not change.');return frame;});
    await test('Reloading the actual File and changing deck load generation each create a fresh source identity',async()=>{
      const before=verifyFrame('Before reload');await mixer.loadKaraoke(0,cdg,track.id,{transparency:'index',crop:false});const reload=verifyFrame('Reloaded');state.decks[0].videoLoadGeneration++;const generation=verifyFrame('New deck generation');assert(new Set([before.assetId,reload.assetId,generation.assetId]).size===3,'Load/version/generation reused a stale source identity.');return{before,reload,generation};
    });
    await test('Real asynchronous CDG File read loses ownership when deck load generation changes before completion',async()=>{
      const before=mixer.karaokeDiagnostics(0).version,pending=mixer.loadKaraoke(0,cdg,track.id);state.decks[0].videoLoadGeneration++;let rejected=false;try{await pending;}catch(error){rejected=/ownership/.test(error.message);}const diag=mixer.karaokeDiagnostics(0);assert(rejected&&!diag.loading&&diag.version===before,'Stale real File load attached: '+JSON.stringify({rejected,before,diag}));return{rejected,before,diagnostics:diag,frame:verifyFrame('After canceled generation')};
    });
    await test('Changing the actual track owner detaches old graphics and clearing cancels an in-flight real File read',async()=>{
      const deck=state.decks[0];engine.pause(deck);deck.track={id:'karaoke-other-owner',duration:4,bpm:120};mixer.tick(true);const missing=mixer.karaokeDiagnostics(0);assert(!missing.available&&missing.assetId===null&&missing.reason==='missing-pair','New track inherited previous graphics.');const pending=mixer.loadKaraoke(0,cdg,deck.track.id);mixer.clearKaraoke(0);let rejected=false;try{await pending;}catch(error){rejected=/ownership/.test(error.message);}mixer.tick(true);const cleared=mixer.karaokeDiagnostics(0);assert(rejected&&!cleared.available&&cleared.retainedAssociationBytes===0,'Clear failed to cancel/erase track association.');deck.track=track;await mixer.loadKaraoke(0,cdg,track.id,{transparency:'index',crop:false});return{missing,canceledByClear:rejected,cleared,restored:verifyFrame('Original owner restored')};
    });
    await test('Actual unnamed Blob and truncated named File are rejected without replacing valid graphics',async()=>{
      const version=mixer.karaokeDiagnostics(0).version,errors=[];for(const file of [new Blob([bytes]),new File([bytes.slice(0,23)],'truncated.cdg')]){try{await mixer.loadKaraoke(0,file,track.id);}catch(error){errors.push(error.message);}}assert(errors.length===2&&mixer.karaokeDiagnostics(0).version===version,'Invalid media replaced valid association.');return{errors,version};
    });
    await test('Actual GPU karaoke output and real master440Hz audio record into a video container',async()=>{
      const deck=state.decks[0];await engine.setReverse(deck,false);await engine.seek(deck,.2);deck.loop=false;state.video.cross=-1;state.video.linked=false;engine.setCross(-1);await engine.start(deck);verifyFrame('Capture start');await mixer.record();const start=performance.now(),frames=mixer.diagnostics().frames;await until(()=>({elapsed:performance.now()-start,frames:mixer.diagnostics().frames-frames}),v=>v.elapsed>=1400&&v.frames>=30,{pump:()=>mixer.tick(),timeout:10000});capture=await mixer.stop();engine.pause(deck);assert(capture instanceof Blob&&capture.size>1000,'No real karaoke capture encoded.');report.capture={bytes:capture.size,mime:capture.type,elapsedMs:performance.now()-start,processedFrames:mixer.diagnostics().frames-frames,audioTracks:engine.destination.stream.getAudioTracks().map(t=>({readyState:t.readyState,kind:t.kind})),claim:'Short real capture; requested30fps is not sustained frame-rate proof.'};return report.capture;
    });
    await test('Recorded karaoke container actually decodes changing graphics and the original white marker',async()=>{
      assert(capture,'Recorded karaoke prerequisite unavailable.');replay=document.createElement('video');replay.muted=true;replay.playsInline=true;replay.loop=false;$('#replay').append(replay);replayURL=URL.createObjectURL(capture);const loaded=mediaEvent(replay,'loadeddata');replay.src=replayURL;replay.load();await loaded;await replay.play();const first=await decodedFrame(replay),firstImage=read(replay);let later=first;while(later.mediaTime<Math.min(.65,first.mediaTime+.55))later=await decodedFrame(replay);const laterImage=read(replay);assert(first.width===W&&first.height===H&&hash(firstImage)!==hash(laterImage),'Recorded video did not decode distinct timed graphics.');
      const markers=[firstImage,laterImage].map(image=>{let white=0;for(let y=145;y<220;y++)for(let x=270;x<370;x++){const p=pixel(image,x,y);if(p[0]>210&&p[1]>210&&p[2]>210)white++;}return white;});assert(markers.every(n=>n>250),'Original opaque white marker was absent from decoded video: '+markers);report.replay={first,later,width:replay.videoWidth,height:replay.videoHeight,readyState:replay.readyState,muted:replay.muted,whiteMarkerPixels:markers,hashes:[hash(firstImage),hash(laterImage)]};return report.replay;
    });
    await test('Recorded container audio actually decodes the real440Hz engine tone with nonzero RMS',async()=>{
      assert(capture,'Recorded container unavailable.');const b=await bounded(engine.ctx.decodeAudioData(await capture.arrayBuffer()),'Recorded audio decode'),pcm=b.getChannelData(0),rms=Math.sqrt(pcm.reduce((sum,v)=>sum+v*v,0)/pcm.length),tone440=toneAmplitude(pcm,b.sampleRate,440),tone880=toneAmplitude(pcm,b.sampleRate,880);assert(rms>.005&&tone440>.01&&tone440>tone880*4,'Recorded audio is silent/wrong tone: '+JSON.stringify({rms,tone440,tone880}));return{sampleRate:b.sampleRate,channels:b.numberOfChannels,duration:b.duration,rms,tone440,tone880,claim:'Actual audio decode from the recorded video container, not input-track presence.'};
    });
    await test('Clear and mixer disposal release current karaoke bytes/identity and reject further real loads',async()=>{
      mixer.clearKaraoke(0);mixer.tick(true);const cleared=mixer.karaokeDiagnostics(0);assert(!cleared.available&&cleared.assetId===null&&cleared.retainedAssociationBytes===0,'Clear retained current graphics.');await mixer.dispose();const disposed=mixer.karaokeDiagnostics(0);let rejected=false;try{await mixer.loadKaraoke(0,cdg,track.id);}catch{rejected=true;}assert(disposed.disposed&&disposed.retainedAssociationBytes===0&&rejected,'Disposed mixer retained graphics or accepted a load.');return{cleared,disposed,newLoadRejected:rejected};
    });
  }catch(error){checks.push({name:'Harness setup/unhandled failure',passed:false,error:error.message,stack:error.stack});}
  finally{replay?.pause();if(replayURL)URL.revokeObjectURL(replayURL);await mixer?.dispose();try{engine.videoAnalyzers?.dispose();engine.silence();await engine.ctx.close();}catch(error){notifications.push('Cleanup: '+error.message);}}
  report.passed=checks.filter(c=>c.passed).length;report.failed=checks.filter(c=>!c.passed).length;report.durationMs=performance.now()-started;report.scope='Executed browser result only after Run. No native/reference equivalence, selective channels, parity repair, media-library import, device sync or sustained30fps acceptance.';window.karaokeIntegrationHarnessResult=report;$('#status').textContent=`${report.passed} passed / ${report.failed} failed`;$('#results').textContent=JSON.stringify(report,null,2);return report;
}
$('#run').onclick=async()=>{$('#run').disabled=true;$('#status').textContent='Running actual karaoke/audio/GPU integration…';try{await runKaraokeIntegrationChecks();}catch(error){window.karaokeIntegrationHarnessResult={passed:0,failed:1,fatal:error.message};$('#results').textContent=error.stack;$('#status').textContent='Fatal harness failure';}finally{$('#run').disabled=false;}};
