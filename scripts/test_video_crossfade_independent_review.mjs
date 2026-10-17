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
  const env = {videos:[], images:[], recorders:[], videoTracks:[], revoked:[], renders:[], pipelines:[], captureStreams:[], now:1000};
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
  env.mixer=createVideoMixer({state:env.state,engine:env.engine,notify:()=>{}});
  env.output=canvas();env.mixer.bind(env.output);
  env.load=async(index=0,name='clip.mp4')=>{const p=env.mixer.load(index,{name});env.videos.at(-1).decoded();await p;return env.videos.at(-1);};
  env.finishCapture=async()=>{const p=env.mixer.stop();await flush();for(const r of env.recorders)if(r.stopRequested&&!r.delivered){r.delivered=true;r.stopped();}await p;};
  return env;
}

// Independent desired-state regression after the parent control-tick fix.
// Initial red observation is preserved in VIDEO_CROSSFADE_INDEPENDENT_REVIEW.md.
const e=environment();
e.state.video.crossLinked=false;e.state.video.cross=-1;e.state.video.autoCrossfadeSeconds=.25;
let completions=0;
e.mixer.startCrossfade('right',()=>completions++);assert.equal(e.mixer.fading,true);
const before=e.mixer.diagnostics();e.output.isConnected=false;e.now+=1000;e.mixer.tick(true);
const detached=e.mixer.diagnostics();
assert.equal(detached.crossfade.active,false,'Detached control state must still finish at its deadline');
assert.equal(detached.videoCross,1);assert.equal(completions,1);assert.equal(e.mixer.fading,false);
assert.equal(detached.frames,before.frames,'Hidden completion must not render a GPU frame');assert.equal(e.pipelines.length,0,'Hidden completion must not allocate a pipeline');
for(let i=0;i<3;i++){e.now+=100;e.mixer.tick();assert.equal(completions,1);}
e.output.isConnected=true;e.mixer.tick(true);
const returned=e.mixer.diagnostics();assert.equal(returned.crossfade.active,false);assert.equal(returned.videoCross,1);assert.equal(completions,1);assert.equal(returned.frames,before.frames+1);
await e.mixer.dispose();
console.log(JSON.stringify({scope:'Executed actual mixer with controlled DOM/pipeline; no browser/GPU or panel navigation execution',detached:{active:detached.crossfade.active,cross:detached.videoCross,completions:1,frames:detached.frames,pipelineAllocationsBeforeReconnect:0},returned:{active:returned.crossfade.active,cross:returned.videoCross,completions,frames:returned.frames},observation:'Detached control completes once with no GPU allocation/render; reconnect renders endpoint without another callback.'},null,2));

const hidden=environment();hidden.state.video.crossLinked=false;hidden.state.video.cross=-1;hidden.state.video.autoCrossfadeSeconds=1;hidden.output.isConnected=false;
let hiddenRMCount=0;hidden.mixer.startCrossfade('right',()=>hiddenRMCount++);hidden.now+=100;hidden.state.settings['Reduced Motion']=true;hidden.mixer.tick();assert.equal(hidden.state.video.cross,1);assert(!hidden.mixer.fading);assert.equal(hiddenRMCount,1);assert.equal(hidden.pipelines.length,0);assert.equal(hidden.mixer.diagnostics().frames,0);await hidden.mixer.dispose();
const throttled=environment();throttled.state.video.crossLinked=false;throttled.state.video.cross=-1;throttled.state.video.autoCrossfadeSeconds=1;throttled.mixer.tick(true);const rendered=throttled.mixer.diagnostics().frames;
throttled.mixer.startCrossfade('right');throttled.now+=1;throttled.mixer.tick();assert(throttled.state.video.cross>-1);assert.equal(throttled.mixer.diagnostics().frames,rendered,'Control sample must not force GPU frame inside cadence throttle');await throttled.mixer.dispose();
console.log(JSON.stringify({hiddenReducedMotionImmediate:true,hiddenReducedMotionCallbacks:hiddenRMCount,renderThrottleStillAdvancesControl:true}));

const lifecycle=environment();lifecycle.state.video.crossLinked=false;lifecycle.state.video.cross=-1;lifecycle.state.video.autoCrossfadeSeconds=.25;
const events=[];lifecycle.mixer.startCrossfade('right',()=>events.push('replaced'));
lifecycle.now+=125;lifecycle.mixer.tick(true);assert.equal(lifecycle.state.video.cross,0);
lifecycle.mixer.startCrossfade('left',()=>events.push('stopped'));assert.deepEqual(events,['replaced']);
lifecycle.now+=125;lifecycle.mixer.tick(true);assert.equal(lifecycle.state.video.cross,-.5);
lifecycle.now+=50;const held=lifecycle.mixer.stopCrossfade();assert(Math.abs(held+.7)<1e-12);assert.deepEqual(events,['replaced','stopped']);
lifecycle.now+=1000;lifecycle.mixer.tick(true);assert.equal(lifecycle.state.video.cross,held);assert.deepEqual(events,['replaced','stopped']);
lifecycle.state.settings['Reduced Motion']=true;lifecycle.mixer.startCrossfade('right',()=>events.push('immediate'));assert.equal(lifecycle.state.video.cross,1);assert.equal(events.at(-1),'immediate');
lifecycle.state.settings['Reduced Motion']=false;lifecycle.mixer.startCrossfade('left',()=>events.push('disposed'));await lifecycle.mixer.dispose();assert.equal(events.at(-1),'disposed');assert.equal(lifecycle.mixer.diagnostics().crossfade.active,false);
console.log(JSON.stringify({scope:'Additional actual mixer/control collaborator checks; no pixels',midpoint:0,reversalMidpoint:-.5,held,callbacks:events,disposedInactive:true}));

// Close hides an existing connected DOM subtree, unlike a panel replacement.
const connected=environment();connected.state.video.crossLinked=false;connected.state.video.cross=-1;connected.state.video.autoCrossfadeSeconds=.25;
let connectedCompletions=0;connected.mixer.startCrossfade('right',()=>connectedCompletions++);
connected.now+=125;connected.mixer.tick(false,{render:false});assert.equal(connected.output.isConnected,true);assert.equal(connected.state.video.cross,0);assert.equal(connected.mixer.diagnostics().frames,0);assert.equal(connected.pipelines.length,0);
connected.now+=125;connected.mixer.tick(false,{render:false});assert.equal(connected.state.video.cross,1);assert.equal(connectedCompletions,1);assert(!connected.mixer.fading);assert.equal(connected.mixer.diagnostics().frames,0);assert.equal(connected.pipelines.length,0);
connected.mixer.tick(true);assert.equal(connected.mixer.diagnostics().frames,1);assert.equal(connectedCompletions,1);
connected.state.video.cross=-1;connected.mixer.startCrossfade('right',()=>connectedCompletions++);connected.now+=250;connected.mixer.tick(false,{render:false});assert.equal(connected.mixer.diagnostics().frames,1,'Hidden-connected completion must not submit another existing-pipeline GPU frame');assert.equal(connectedCompletions,2);await connected.mixer.dispose();
console.log(JSON.stringify({hiddenConnected:{controlMidpoint:0,endpoint:1,firstFadePipelineAllocations:0,firstFadeFrames:0,completionsAcrossTwoFades:connectedCompletions,existingPipelineFramesRemain:1}}));

// Explicit render:false is only a preview suppression request. A recording
// session must keep its processed output and dedicated capture surface moving.
const capture=environment();await capture.mixer.record();const captureBefore=capture.mixer.diagnostics().frames,surface=capture.captureStreams[0].sourceCanvas,draws=surface.draws;
capture.now+=100;capture.mixer.tick(false,{render:false});assert.equal(capture.mixer.diagnostics().frames,captureBefore+1);assert(surface.draws>draws,'Hidden-connected recording must update its actual capture collaborator');
const connectedDraws=surface.draws;capture.output.isConnected=false;capture.now+=100;capture.mixer.tick(false,{render:false});assert.equal(capture.mixer.diagnostics().frames,captureBefore+2);assert(surface.draws>connectedDraws,'Detached recording must override preview suppression too');
const captureAfter=capture.mixer.diagnostics().frames;await capture.finishCapture();assert.equal(capture.audioTrack.stopped,false);await capture.mixer.dispose();
console.log(JSON.stringify({recordingOverride:{connectedAndDetachedFrames:captureAfter-captureBefore,captureSurfaceAdvancedBoth:true,audioTrackRetained:true},scope:'Actual mixer with controlled recorder/stream/pipeline collaborators, not encoded browser output'}));
