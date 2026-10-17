// Runs the actual mixer module against controlled browser/media collaborators.
// Does not establish video decoding, WebGL pixels, FFT or encoded browser output.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const original = await readFile(new URL('../prototype/video.js', import.meta.url), 'utf8');
const source = original.replace("import {createVideoPipeline} from './video-pipeline.js';",
  'const createVideoPipeline=(...args)=>globalThis.__videoLifecyclePipeline(...args);')
  .replace(/from '(\.\/[^']+)'/g, (_, path) => `from '${new URL('../prototype/' + path.slice(2), import.meta.url).href}'`);
assert.notEqual(source, original, 'The controlled collaborator must replace the known pipeline import.');
const {createVideoMixer} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const deferred = () => {let resolve, reject; const promise = new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush = async () => {for(let i=0;i<20;i++) await Promise.resolve();};
let serial = 0;
function environment() {
  const env = {videos:[], images:[], recorders:[], videoTracks:[], revoked:[], renders:[], pipelines:[], captureStreams:[], now:1000,notifications:[]};
  const urls = new Map();

  const track = () => ({stopped:false,stop(){this.stopped=true;}});
  const canvas = () => {
    const c={width:640,height:360,isConnected:true,draws:0,
      captureStream(){if(env.failCaptureStream){env.failedCaptureCanvas=c;throw env.failCaptureStream;}const t=track();env.videoTracks.push(t);const stream={sourceCanvas:c,addTrack(){},getVideoTracks:()=>[t]};env.captureStreams.push(stream);return stream;}};
    const ctx={canvas:c,save(){},restore(){},setTransform(){},clearRect(){},fillRect(){},fillText(){},drawImage(){c.draws++;}};c.getContext=()=>ctx;return c;
  };
  globalThis.performance = {now:()=>env.now};
  globalThis.URL.createObjectURL = file => {const url=`blob:mock-${++serial}`;urls.set(url,file);return url;};
  globalThis.URL.revokeObjectURL = url => env.revoked.push(url);
  globalThis.document = {querySelector:()=>null,createElement(type){
    if(type==='canvas')return canvas();
    assert.equal(type,'video');
    const video = {readyState:2,videoWidth:320,videoHeight:180,seeking:false,duration:10,currentTime:0,paused:true,playbackRate:1,
      load(){},play(){this.paused=false;queueMicrotask(()=>{
        const callback=this.frameCallback;this.frameCallback=null;
        callback?.(env.now,{mediaTime:this.currentTime,presentedFrames:1,width:320,height:180});
      });return Promise.resolve();},pause(){this.paused=true;},
      requestVideoFrameCallback(callback){this.frameCallback=callback;return 1;},
      cancelVideoFrameCallback(){this.frameCallback=null;},
      decoded(){this.duration=urls.get(this.src)?.duration || 10;this.onloadeddata();},
      failed(){this.onerror();}};
    env.videos.push(video);return video;
  }};
  globalThis.Image = class {
    constructor(){this.pending=deferred();env.images.push(this);}
    decode(){return this.pending.promise;}
  };
  globalThis.window = {MediaRecorder:true};
  globalThis.MediaRecorder = class {
    static isTypeSupported(){return true;}
    constructor(stream,{mimeType}={}){if(env.failConstructor)throw env.failConstructor;this.stream=stream;this.mimeType=mimeType;this.state='inactive';env.recorders.push(this);}
    start(){this.state='recording';}
    stop(){this.state='inactive';this.stopRequested=true;}
    data(text){this.ondataavailable?.({data:new Blob([text])});}
    stopped(){assert(this.stopRequested,'Expected stop request before stop event');this.onstop?.();}
  };
  globalThis.__videoLifecyclePipeline = () => {
    const p={reset(){p.resets=(p.resets||0)+1;},dispose(){p.disposed=true;},diagnostics(){return{};},
      render(inputs,settings,context){if(p.lost)throw new Error('Video FX WebGL context was lost. Recreate the renderer.');env.renders.push({inputs,settings,context});return {output:canvas(),channels:inputs};}};
    env.pipelines.push(p);return p;
  };
  env.audioTrack=track();
  env.state={video:{linked:true},decks:[{track:{bpm:120},playing:true,rate:1,reverse:false},{track:null}],settings:{}};
  env.engine={resume:async()=>{},position:()=>2,cross:0,nodes:[{level:1}],
    videoAnalysis:()=>({bass:0,mid:0,treble:0,level:0,audioAvailable:true}),
    destination:{stream:{getAudioTracks:()=>[env.audioTrack]}}};
  env.identityRequests=[];env.identify=(file,options)=>{const request={file,options,...deferred()};env.identityRequests.push(request);options.signal.addEventListener('abort',()=>request.reject(new DOMException('aborted','AbortError')),{once:true});return request.promise;};
  env.mixer=createVideoMixer({state:env.state,engine:env.engine,notify:message=>env.notifications.push(message),identifyFile:(...args)=>env.identify(...args)});
  env.output=canvas();env.mixer.bind(env.output);
  env.load=async(index=0,name='clip.mp4')=>{const p=env.mixer.load(index,{name});env.videos.at(-1).decoded();await p;return env.videos.at(-1);};
  env.finishCapture=async()=>{const p=env.mixer.stop();await flush();for(const r of env.recorders)if(r.stopRequested&&!r.delivered){r.delivered=true;r.stopped();}await p;};
  return env;
}

const key='sha256:'+'a'.repeat(64),otherKey='sha256:'+'b'.repeat(64),fx=name=>[{name,on:true,value:1,params:{}}],record=(identity=key,name='Sepia')=>({version:1,key:identity,name:'Imported metadata',fx:fx(name)});
const checks=[];async function test(name,run){await run();checks.push({name,passed:true});}
await test('Newer successful Save on the other channel retains shared byte-key record after older hash completes',async()=>{
 const e=environment();await e.load(0,'same-left.mp4');await e.load(1,'same-right.mp4');e.state.video.fx.left=fx('Negative');e.state.video.fx.right=fx('Sepia');const older=e.mixer.saveVideoFX(0),newer=e.mixer.saveVideoFX(1);e.identityRequests[1].resolve(key);await newer;e.identityRequests[0].resolve(key);assert.equal(await older,null);const result=e.mixer.exportVideoFX().records[0];assert.equal(result.fx[0].name,'Sepia');assert.equal(result.name,'same-right.mp4');await e.mixer.dispose();
});
await test('Newer explicit import for the same key cannot be overwritten by an older pending Save',async()=>{
 const e=environment();await e.load(0,'import-target.mp4');e.state.video.fx.left=fx('Negative');const pending=e.mixer.saveVideoFX(0);e.mixer.importVideoFX([record()]);e.identityRequests[0].resolve(key);assert.equal(await pending,null);assert.equal(e.mixer.exportVideoFX().records[0].fx[0].name,'Sepia');await e.mixer.dispose();
});
await test('Importing an unrelated file key does not discard a valid pending Save',async()=>{
 const e=environment();await e.load(0,'unrelated.mp4');e.state.video.fx.left=fx('Negative');const pending=e.mixer.saveVideoFX(0);e.mixer.importVideoFX([record(otherKey)]);e.identityRequests[0].resolve(key);assert.equal((await pending).fx[0].name,'Negative');const records=e.mixer.exportVideoFX().records;assert.equal(records.length,2);assert.equal(records.find(x=>x.key===otherKey).fx[0].name,'Sepia');assert.equal(records.find(x=>x.key===key).fx[0].name,'Negative');await e.mixer.dispose();
});
await test('Save retains invocation snapshot through later channel edits and does not touch right/master',async()=>{
 const e=environment();await e.load(0,'snapshot.mp4');e.state.video.fx.left=fx('Negative');e.state.video.fx.right=fx('Gamma');e.state.video.fx.master=fx('Saturation');const right=JSON.stringify(e.state.video.fx.right),master=JSON.stringify(e.state.video.fx.master),pending=e.mixer.saveVideoFX(0);e.state.video.fx.left=fx('Sepia');assert.equal(e.mixer.videoFXEdited('left'),false);e.identityRequests[0].resolve(key);assert.equal((await pending).fx[0].name,'Negative');assert.equal(e.state.video.fx.left[0].name,'Sepia');assert.equal(JSON.stringify(e.state.video.fx.right),right);assert.equal(JSON.stringify(e.state.video.fx.master),master);await e.mixer.dispose();
});
await test('User edit hook cancels only same-channel Recall and preserves newer live FX',async()=>{
 const e=environment();await e.load(0,'recall.mp4');e.mixer.importVideoFX([record(key,'Gamma')]);const pending=e.mixer.recallVideoFX(0);e.state.video.fx.left=fx('Sepia');assert.equal(e.mixer.videoFXEdited('left'),true);assert(e.identityRequests[0].options.signal.aborted);assert.equal(await pending,null);assert.equal(e.state.video.fx.left[0].name,'Sepia');const next=e.mixer.recallVideoFX(0);assert.equal(e.mixer.videoFXEdited('master'),false);assert.equal(e.mixer.videoFXEdited('right'),false);e.identityRequests[1].resolve(key);assert.equal((await next).fx[0].name,'Gamma');assert.equal(e.state.video.fx.left[0].name,'Gamma');await e.mixer.dispose();
});
await test('Cancel of a pending load hash settles null, keeps prior clip and revokes only the candidate URL',async()=>{
 const e=environment();await e.load(0,'kept.mp4');const prior=e.videos[0];e.mixer.importVideoFX([record()]);const pending=e.mixer.load(0,{name:'canceled.mp4'}),candidate=e.videos.at(-1);candidate.decoded();await flush();assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');assert.equal(e.mixer.cancelVideoFX(0),true);assert(e.identityRequests[0].options.signal.aborted);assert.equal(await pending,null);assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');assert(e.revoked.includes(candidate.src));assert(!e.revoked.includes(prior.src));assert.equal(e.mixer.diagnostics().savedFX.channels[0].pending,false);await e.mixer.dispose();
});
await test('Genuine hash failure commits decoded candidate with explicit unavailable status and current FX, not fabricated recall',async()=>{
 const e=environment();await e.load(0,'kept.mp4');e.state.video.fx.left=fx('Negative');e.mixer.importVideoFX([record(key,'Sepia')]);const pending=e.mixer.load(0,{name:'playable-new.mp4'}),candidate=e.videos.at(-1);candidate.decoded();await flush();assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');assert(!e.revoked.includes(e.videos[0].src));e.identityRequests[0].reject(new Error('controlled Worker unavailable'));assert.equal(await pending,10);const d=e.mixer.diagnostics();assert.equal(d.inputs[0].name,'playable-new.mp4');assert.equal(d.savedFX.channels[0].identity,null);assert.match(d.savedFX.channels[0].status,/lookup unavailable/);assert(e.notifications.some(m=>m.includes('controlled Worker unavailable')));assert.equal(e.state.video.fx.left[0].name,'Negative');assert.equal(e.mixer.exportVideoFX().records[0].fx[0].name,'Sepia');assert(e.revoked.includes(e.videos[0].src));assert(!e.revoked.includes(candidate.src));await e.mixer.dispose();
});
await test('New visual load aborts pending Save; dispose aborts current hash with no late store mutation',async()=>{
 const e=environment();await e.load(0,'old.mp4');e.state.video.fx.left=fx('Negative');const saving=e.mixer.saveVideoFX(0);const loading=e.mixer.load(0,{name:'new.mp4'});assert(e.identityRequests[0].options.signal.aborted);assert.equal(await saving,null);e.videos.at(-1).decoded();await loading;assert.equal(e.mixer.exportVideoFX().records.length,0);const nextSave=e.mixer.saveVideoFX(0);await e.mixer.dispose();assert(e.identityRequests[1].options.signal.aborted);assert.equal(await nextSave,null);assert.equal(e.mixer.exportVideoFX().records.length,0);
});
console.log(JSON.stringify({scope:'Actual mixer/store with controlled DOM, decode, hash promises and pipeline. No actual browser Worker/hash, video decoding, pixels, UI handlers, persisted reload or vendor parity.',passed:checks.length,checks},null,2));
