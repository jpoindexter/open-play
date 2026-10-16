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
  const env = {videos:[], images:[], recorders:[], videoTracks:[], revoked:[], renders:[], pipelines:[], now:1000};
  const urls = new Map();

  const track = () => ({stopped:false,stop(){this.stopped=true;}});
  const canvas = () => {
    const c={width:640,height:360,isConnected:true,draws:0,
      captureStream(){const t=track();env.videoTracks.push(t);return {addTrack(){},getVideoTracks:()=>[t]};}};
    const ctx={clearRect(){},fillRect(){},fillText(){},drawImage(){c.draws++;}};c.getContext=()=>ctx;return c;
  };
  globalThis.performance = {now:()=>env.now};
  globalThis.URL.createObjectURL = file => {const url=`blob:mock-${++serial}`;urls.set(url,file);return url;};
  globalThis.URL.revokeObjectURL = url => env.revoked.push(url);
  globalThis.document = {querySelector:()=>null,createElement(type){
    if(type==='canvas')return canvas();
    assert.equal(type,'video');
    const video = {readyState:2,duration:10,currentTime:0,paused:true,playbackRate:1,
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
    constructor(stream,{mimeType}={}){this.stream=stream;this.mimeType=mimeType;this.state='inactive';env.recorders.push(this);}
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
  env.mixer=createVideoMixer({state:env.state,engine:env.engine,notify:()=>{}});
  env.output=canvas();env.mixer.bind(env.output);
  env.load=async(index=0,name='clip.mp4')=>{const p=env.mixer.load(index,{name});env.videos.at(-1).decoded();await p;return env.videos.at(-1);};
  env.finishCapture=async()=>{const p=env.mixer.stop();await flush();for(const r of env.recorders)if(r.stopRequested&&!r.delivered){r.delivered=true;r.stopped();}await p;};
  return env;
}
const tests=[];const test=(name,run)=>tests.push({name,run});

test('latest video load wins when an older decode completes last',async()=>{
  const e=environment(), first=e.mixer.load(0,{name:'old.mp4'}), old=e.videos[0];
  const second=e.mixer.load(0,{name:'new.mp4',duration:22});e.videos[1].decoded();assert.equal(await second,22);
  old.decoded();assert.equal(await first,null);
  assert.equal(e.mixer.diagnostics().inputs[0].name,'new.mp4');assert(old.paused);assert(e.revoked.includes(old.src));
  await e.mixer.dispose();
});
test('failed replacement preserves the already decoded video',async()=>{
  const e=environment();await e.load(0,'kept.mp4');const p=e.mixer.load(0,{name:'bad.mp4'});e.videos[1].failed();
  await assert.rejects(p,/decode/);assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');await e.mixer.dispose();
});
test('a video decoded after disposal cannot become a live asset',async()=>{
  const e=environment(), p=e.mixer.load(0,{name:'late.mp4'});await e.mixer.dispose();e.videos[0].decoded();
  assert.equal(await p,null);assert.equal(e.mixer.diagnostics().inputs[0],null);assert(e.revoked.includes(e.videos[0].src));
});
test('overlay decode generations preserve the newest image and clear invalidates pending work',async()=>{
  const e=environment(), a=e.mixer.setOverlayImage('left','logo',{name:'old.png'}), b=e.mixer.setOverlayImage('left','logo',{name:'new.png'});
  e.images[1].pending.resolve();assert.equal(await b,'logo');e.images[0].pending.resolve();assert.equal(await a,null);
  e.state.video.overlays.left=[{id:'logo',kind:'image',on:true}];e.mixer.tick(true);
  assert.equal(e.renders.at(-1).settings.overlays.left[0].image,e.images[1]);
  const late=e.mixer.setOverlayImage('left','logo',{name:'cleared.png'});e.mixer.clearOverlayImage('left','logo');e.images[2].pending.resolve();
  assert.equal(await late,null);assert.deepEqual(e.mixer.diagnostics().loadedImages,[]);await e.mixer.dispose();
});
test('an overlay decoded after disposal cannot enter the asset map',async()=>{
  const e=environment(), p=e.mixer.setOverlayImage('master','late',{name:'late.png'});await e.mixer.dispose();e.images[0].pending.resolve();
  assert.equal(await p,null);assert.deepEqual(e.mixer.diagnostics().loadedImages,[]);assert(e.revoked.includes(e.images[0].src));
});
test('linked reverse uses the real deck reverse flag, seeks and supplies a negative effect rate',async()=>{
  const e=environment(), video=await e.load();video.currentTime=1.9;e.state.decks[0].reverse=true;e.mixer.tick(true);await flush();
  assert.equal(video.paused,true);assert.equal(video.currentTime,2);assert.equal(e.renders.at(-1).context.channels[0].rate,-1);await e.mixer.dispose();
});
test('linked BPM follows the independently declared audible tempo policy',async()=>{
  const e=environment();await e.load();e.state.decks[0].rate=2;e.mixer.tick(true);
  assert.equal(e.renders.at(-1).context.channels[0].bpm,240);assert.equal(e.renders.at(-1).context.channels[0].rate,2);await e.mixer.dispose();
});
test('a paused linked deck pauses video and supplies zero performance rate',async()=>{
  const e=environment(), video=await e.load();await video.play();e.state.decks[0].playing=false;e.mixer.tick(true);
  assert.equal(video.paused,true);assert.equal(e.renders.at(-1).context.channels[0].rate,0);await e.mixer.dispose();
});
test('duplicate record requests during audio resume create at most one recording session',async()=>{
  const e=environment(), gate=deferred();e.engine.resume=()=>gate.promise;
  const a=e.mixer.record(),b=e.mixer.record();gate.resolve();await Promise.allSettled([a,b]);
  assert.equal(e.recorders.length,1);await e.finishCapture();await e.mixer.dispose();assert.equal(e.audioTrack.stopped,false);
});
test('restarting while a stop event is pending retains session tracks and chunks',async()=>{
  const e=environment();await e.mixer.record();const first=e.recorders[0];first.data('old');
  const stopping=e.mixer.stop();await flush();const restarting=e.mixer.record();await flush();
  assert.equal(e.recorders.length,1,'New session must await the old stop event');first.stopped();const oldBlob=await stopping;await restarting;
  assert.equal(await oldBlob.text(),'old');assert.equal(e.recorders.length,2);assert(e.videoTracks[0].stopped);assert.equal(e.videoTracks[1].stopped,false);
  e.recorders[1].data('new');await e.finishCapture();assert.equal(await e.mixer.result.text(),'new');assert.equal(e.audioTrack.stopped,false);await e.mixer.dispose();
});
test('two stop callers receive the same completed session without losing a waiter',async()=>{
  const e=environment();await e.mixer.record();e.recorders[0].data('same');const a=e.mixer.stop(),b=e.mixer.stop();await flush();e.recorders[0].stopped();
  const results=await Promise.all([a,b]);assert.equal(await results[0].text(),'same');assert.equal(await results[1].text(),'same');await e.mixer.dispose();
});
test('stop during a pending start waits for that start and releases the session',async()=>{
  const e=environment(), gate=deferred();e.engine.resume=()=>gate.promise;
  const starting=e.mixer.record(),stopping=e.mixer.stop();gate.resolve();await starting;await flush();
  assert.equal(e.recorders.length,1);assert.equal(e.recorders[0].stopRequested,true);e.recorders[0].stopped();await stopping;
  assert.equal(e.mixer.recording,false);assert(e.videoTracks.every(t=>t.stopped));await e.mixer.dispose();
});
test('dispose invalidates an audio-resume-pending capture before it can resurrect recording',async()=>{
  const e=environment(), gate=deferred();e.engine.resume=()=>gate.promise;
  const starting=e.mixer.record(),disposing=e.mixer.dispose();await flush();gate.resolve();await Promise.allSettled([starting,disposing]);
  assert.equal(e.mixer.recording,false);assert(e.videoTracks.every(t=>t.stopped));assert.equal(e.audioTrack.stopped,false);
});


test('dispose during a queued restart resolves even when that pending start is canceled',async()=>{
  const e=environment();await e.mixer.record();const first=e.recorders[0];
  const stopping=e.mixer.stop();await flush();const restarting=e.mixer.record();const restartOutcome=Promise.allSettled([restarting]);
  const disposing=e.mixer.dispose();const disposeOutcome=Promise.allSettled([disposing]);await flush();first.stopped();
  await stopping;const [restart]=await restartOutcome,[disposed]=await disposeOutcome;
  assert.equal(restart.status,'rejected','Disposed queued restart must be canceled');
  assert.equal(disposed.status,'fulfilled','Cleanup must not fail merely because it canceled a queued start');
  assert.equal(e.recorders.length,1);assert(e.videoTracks.every(t=>t.stopped));assert.equal(e.mixer.recording,false);
});


test('reset after a renderer fault disposes the failed pipeline and creates a fresh one',async()=>{
  const e=environment();e.mixer.tick(true);e.pipelines[0].lost=true;e.mixer.tick(true);
  assert.match(e.mixer.diagnostics().error,/context was lost/);e.mixer.reset();e.mixer.tick(true);
  assert.equal(e.pipelines[0].disposed,true);assert.equal(e.pipelines.length,2);assert.equal(e.mixer.diagnostics().error,null);await e.mixer.dispose();
});
test('recording tick continues on a detached capture canvas and survives output rebinding',async()=>{
  const e=environment();await e.mixer.record();e.output.isConnected=false;const before=e.output.draws;e.mixer.tick(true);
  assert(e.output.draws>before,'Detached recording canvas must receive a new processed frame');
  const replacement=document.createElement('canvas');e.mixer.bind(replacement);const captured=e.output.draws;e.mixer.tick(true);
  assert(e.output.draws>captured,'Original capture track canvas must still be updated');assert(replacement.draws>0);
  await e.finishCapture();await e.mixer.dispose();
});

let passed=0,failed=0;
for(const {name,run} of tests){
  let timeout;
  try{await Promise.race([run(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Lifecycle test did not settle within 2 seconds')),2000);})]);passed++;console.log(`PASS ${name}`);}
  catch(error){failed++;console.error(`FAIL ${name}: ${error.stack}`);}
  finally{clearTimeout(timeout);}
}
console.log(`${passed}/${tests.length} actual Video mixer lifecycle checks passed.`);
console.log('Scope: real mixer with controlled DOM/media/pipeline collaborators; not browser decode, pixels, encoded capture, FFT or UI acceptance.');
if(failed)process.exitCode=1;
