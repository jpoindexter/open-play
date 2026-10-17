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

// Independent opacity ownership checks: actual mixer + actual controls.bind,
// controlled DOM/media/pipeline collaborators. No pixels, browser storage or audio.
const {createVideoControls}=await import('../prototype/video-controls.js');
const {snapshotVideoState,restoreVideoState}=await import('../prototype/video-state.js');
const {normalizeVideoOpacityState}=await import('../prototype/video-opacity.js');
const checks=[];
function check(name,fn){fn();checks.push({name,passed:true});}
const mixed={linked:false,crossLinked:true,channelOpacity:[0,.4],channelOpacityLinked:[true]};
const restored=restoreVideoState(JSON.parse(JSON.stringify(snapshotVideoState(mixed))));
check('Mixed explicit/sparse link flags preserve exact own entries and old fallback independently',()=>{assert.deepEqual(restored.channelOpacity,[0,.4]);assert.deepEqual(restored.channelOpacityLinked,[true,false]);assert.equal(restored.linked,false);assert.equal(restored.crossLinked,true);});
const e=environment();e.engine.nodes=[{level:.2},{level:.7}];e.state.video.crossLinked=false;e.state.video.cross=-1;e.state.video.autoCrossfadeSeconds=1;
const beforeAudio=JSON.stringify(e.engine.nodes),nodes=new Map(),saved=[],notifications=[];
const controls=createVideoControls({state:e.state,videoMixer:e.mixer,persist:()=>saved.push(snapshotVideoState(e.state.video)),notify:m=>notifications.push(m),dialog(){},download(){}});
const markup=controls.markup();for(const [,id]of markup.matchAll(/id="([^"]+)"/g))nodes.set('#'+id,{disabled:false,isConnected:true,value:'',textContent:'',checked:false});nodes.set('#video-master',e.output);
const root={querySelector:id=>nodes.get(id)||null,querySelectorAll:()=>[]};controls.bind(root);
check('Actual bind disables linked opacity controls independently from an unlinked video crossfader',()=>{assert(nodes.get('#video-opacity-0').disabled);assert(nodes.get('#video-opacity-1').disabled);assert.equal(nodes.get('#video-cross').disabled,false);});
let completion=0;e.mixer.startCrossfade('right',()=>completion++);
nodes.get('#video-opacity-link-0').onchange({target:{checked:false}});
check('Actual left unlink handler snapshots displayed audio gain and persists only its link change',()=>{assert.equal(e.state.video.channelOpacity[0],.2);assert.deepEqual(e.state.video.channelOpacityLinked,[false,true]);assert.equal(saved.at(-1).channelOpacity[0],.2);assert.deepEqual(saved.at(-1).channelOpacityLinked,[false,true]);assert.equal(nodes.get('#video-opacity-0').disabled,false);assert.equal(nodes.get('#video-opacity-1').disabled,true);assert(e.mixer.fading);assert.equal(completion,0);});
nodes.get('#video-opacity-0').oninput({target:{value:'.33'}});
check('Actual manual opacity handler persists gain while keeping transport, crossfade and audio ownership',()=>{assert.equal(e.state.video.channelOpacity[0],.33);assert.equal(saved.at(-1).channelOpacity[0],.33);assert.equal(e.state.video.linked,true);assert.equal(e.state.video.crossLinked,false);assert(e.mixer.fading);assert.equal(completion,0);assert.equal(JSON.stringify(e.engine.nodes),beforeAudio);});
nodes.get('#video-link').onchange({target:{checked:false}});
e.now+=250;e.mixer.tick(true);
check('Actual playback-link handler does not cancel a fade or reassign either opacity flag',()=>{assert.equal(e.state.video.linked,false);assert.deepEqual(e.state.video.channelOpacityLinked,[false,true]);assert(e.mixer.fading);assert.equal(completion,0);assert.deepEqual(e.renders.at(-1).context.upfaders,[.33,.7]);assert.deepEqual(e.renders.at(-1).context.channels.map(c=>c.upfader),[.33,.7]);});
e.engine.nodes[0].level=.9;e.engine.nodes[1].level=.4;e.now+=100;e.mixer.tick(true);
check('Manual left/linked right actual pipeline context follows independent gain owners',()=>{assert.deepEqual(e.renders.at(-1).context.upfaders,[.33,.4]);});
nodes.get('#video-opacity-link-0').onchange({target:{checked:true}});
check('Relink keeps saved manual gain while following audio and leaves right/cross policy unchanged',()=>{assert.equal(e.state.video.channelOpacity[0],.33);assert.deepEqual(e.mixer.diagnostics().opacity.levels,[.9,.4]);assert.deepEqual(e.state.video.channelOpacityLinked,[true,true]);assert.equal(e.state.video.crossLinked,false);assert.equal(e.state.video.linked,false);assert(e.mixer.fading);});
const prior=JSON.stringify(e.state.video.channelOpacity);for(const invalid of[()=>e.mixer.setOpacity(0,.5),()=>e.mixer.setOpacityLinked(1,0),()=>e.mixer.setOpacity(2,1)])assert.throws(invalid);
check('Rejected actual API operations do not mutate manual opacity values',()=>assert.equal(JSON.stringify(e.state.video.channelOpacity),prior));
const finalSaved=restoreVideoState(JSON.parse(JSON.stringify(snapshotVideoState(e.state.video))));
check('Runtime gain/link ownership roundtrips without a callback, capture or GPU handle',()=>{assert.deepEqual(finalSaved.channelOpacity,e.state.video.channelOpacity);assert.deepEqual(finalSaved.channelOpacityLinked,e.state.video.channelOpacityLinked);assert(!('crossfade' in finalSaved));assert(!('opacity' in finalSaved));});
await e.mixer.dispose();assert.equal(completion,1);assert.deepEqual(notifications,[]);
console.log(JSON.stringify({scope:'Executed actual controls.bind handlers and mixer with controlled DOM/media/pipeline; no GPU pixels, browser persistence, audible audio or current Serato equivalence.',passed:checks.length,checks,persistCalls:saved.length},null,2));
