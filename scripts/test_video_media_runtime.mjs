// Actual mixer/selection modules; controlled DOM/video decode/pipeline only.
// The real browser decode/AudioEngine/pixels suite is video-media-harness.html.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {File} from 'node:buffer';
const base=new URL('../prototype/',import.meta.url),original=await readFile(new URL('video.js',base),'utf8');
const source=original.replace("import {createVideoPipeline} from './video-pipeline.js';",'const createVideoPipeline=(...a)=>globalThis.__mediaRuntimePipeline(...a);')
  .replaceAll("from './video-karaoke.js'",`from '${new URL('video-karaoke.js',base)}'`)
  .replaceAll("from './video-media.js'",`from '${new URL('video-media.js',base)}'`)
  .replaceAll("from './video-transitions.js'",`from '${new URL('video-transitions.js',base)}'`)
  .replaceAll("from './video-decode.js'",`from '${new URL('video-decode.js',base)}'`);
const {createVideoMixer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const file=name=>new File(['original undecoded test bytes'],name,{type:'video/mp4'}),flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
let serial=0;
function setup(){
  const env={videos:[],notifications:[],revoked:[],renders:[]},ctx={clearRect(){},fillRect(){},fillText(){},drawImage(){}};
  globalThis.performance={now:()=>1000};globalThis.URL.createObjectURL=()=>`blob:controlled-${++serial}`;globalThis.URL.revokeObjectURL=url=>env.revoked.push(url);
  const canvas=()=>({width:640,height:360,isConnected:true,getContext:()=>ctx});
  globalThis.document={querySelector:()=>null,createElement(type){if(type==='canvas')return canvas();assert.equal(type,'video');let callbackSerial=0;const callbacks=new Map();const v={paused:true,readyState:0,duration:10,currentTime:0,playbackRate:1,seeking:false,deferFrames:false,frameCallbacks:callbacks,
      load(){},pause(){this.paused=true;},requestVideoFrameCallback(callback){const id=++callbackSerial;callbacks.set(id,callback);return id;},cancelVideoFrameCallback(id){callbacks.delete(id);},
      deliverFrame(){this.currentTime=.033;for(const [id,callback] of [...callbacks]){callbacks.delete(id);callback(1000,{mediaTime:.033,presentedFrames:1,width:320,height:180});}},
      async play(){this.paused=false;if(!this.deferFrames)queueMicrotask(()=>this.deliverFrame());},finish(){this.readyState=2;this.onloadeddata();},fail(){this.onerror();}};env.videos.push(v);return v;}};
  globalThis.__mediaRuntimePipeline=()=>({reset(){},dispose(){},diagnostics(){return{};},render(inputs,settings,context){env.renders.push({settings,context});return{output:canvas(),channels:inputs};}});
  env.state={settings:{},decks:[0,1].map(index=>({index,track:{id:`track${index}`,bpm:120,duration:20},playing:false,rate:1,position:0,videoLoadGeneration:1})),video:{linked:false,cross:-.3}};
  env.engine={position:d=>d.position,cross:.4,nodes:[],videoAnalysis:()=>({audioAvailable:false})};env.mixer=createVideoMixer({state:env.state,engine:env.engine,notify:m=>env.notifications.push(m)});env.mixer.bind(canvas());
  env.finish=async()=>{for(const v of env.videos)if(v.readyState===0&&!v.failed){v.finish();}await flush();};
  env.add=()=>env.mixer.addMedia([file('a.mp4'),file('b.mp4'),file('c.mp4')]);
  return env;
}
const tests=[];const test=(name,run)=>tests.push({name,run});
test('runtime fallback enable decodes candidates once and repeated ticks retain selected sources',async()=>{
  const e=setup();e.mixer.tick(true);assert(e.mixer.diagnostics().inputs.every(v=>!v));const assets=e.add();e.mixer.configureMedia({enabled:true});e.mixer.tick(true);await e.finish();e.mixer.tick(true);
  assert.deepEqual(e.mixer.diagnostics().inputs.map(v=>v.name),['a.mp4','b.mp4']);assert(e.mixer.mediaDiagnostics().sources.every(s=>s.kind==='fallback'));const count=e.videos.length;
  for(let i=0;i<20;i++)e.mixer.tick(true);assert.equal(e.videos.length,count);assert.equal(e.mixer.mediaDiagnostics().sources[0].assetId,assets[0].id);await e.mixer.dispose();
});
test('one audio generation plus fallback is exactly one automatic transition transaction',async()=>{
  const e=setup();e.add();e.mixer.configureMedia({enabled:true});e.mixer.configureTransitions({enabled:true});e.mixer.tick(true);await e.finish();
  const count=e.mixer.mediaDiagnostics().transitions.automaticSelections;assert.equal(count,2);e.state.decks[0].videoLoadGeneration++;e.mixer.tick(true);await e.finish();
  for(let i=0;i<20;i++)e.mixer.tick(true);assert.equal(e.mixer.mediaDiagnostics().transitions.automaticSelections,count+1);assert.equal(e.engine.cross,.4);assert.equal(e.state.video.cross,-.3);await e.mixer.dispose();
});
test('fallback uses audio clock even when crossfader link is disabled and source audio stays muted',async()=>{
  const e=setup();e.add();e.mixer.configureMedia({enabled:true});e.mixer.tick(true);await e.finish();e.state.decks[0].position=3;e.mixer.tick(true);
  assert.equal(e.videos[0].currentTime,3);assert.equal(e.videos[0].paused,true);assert(e.videos.every(v=>v.muted&&v.loop));assert.equal(e.renders.at(-1).context.channels[0].position,3);await e.mixer.dispose();
});
test('explicit decoded video association survives fallback disable; remove association clears it',async()=>{
  const e=setup(),p=e.mixer.load(0,file('manual.mp4'));e.videos[0].finish();await p;const id=e.mixer.associateVideo(0);e.mixer.configureMedia({enabled:false});e.mixer.tick(true);
  assert.equal(e.mixer.diagnostics().inputs[0].name,'manual.mp4');assert.equal(e.mixer.mediaDiagnostics().sources[0].kind,'associated');assert.equal(e.mixer.mediaDiagnostics().associations[0].assetId,id);
  e.mixer.removeVideoAssociation(0);e.mixer.tick(true);assert.equal(e.mixer.diagnostics().inputs[0],null);await e.mixer.dispose();
});
test('audio eject clears fallback and removing an associated asset clears stale association ownership',async()=>{
  const e=setup();e.add();e.mixer.configureMedia({enabled:true});e.mixer.tick(true);await e.finish();const id=e.mixer.associateVideo(0);e.mixer.configureMedia({enabled:false});e.mixer.removeMedia(id);e.mixer.tick(true);assert.equal(e.mixer.diagnostics().inputs[0],null);assert.equal(e.mixer.mediaDiagnostics().associations[0].assetId,null);
  e.mixer.configureMedia({enabled:true});e.mixer.tick(true);await e.finish();e.state.decks[0].track=null;e.state.decks[0].videoLoadGeneration++;e.mixer.tick(true);assert.equal(e.mixer.diagnostics().inputs[0],null);await e.mixer.dispose();
});
test('late fallback decode loses ownership after audio generation changes before another tick',async()=>{
  const e=setup();e.add();e.mixer.configureMedia({enabled:true});e.mixer.tick(true);await e.finish();const before=e.mixer.diagnostics().inputs[0].name;
  const p=e.mixer.nextMedia(0),video=e.videos.at(-1);e.state.decks[0].videoLoadGeneration++;video.finish();assert.equal(await p,null);assert.equal(e.mixer.diagnostics().inputs[0].name,before);assert(e.revoked.includes(video.src));await e.mixer.dispose();
});
test('late manual decode also loses ownership after audio generation changes before another tick',async()=>{
  const e=setup(),p=e.mixer.load(0,file('late-manual.mp4')),video=e.videos.at(-1);e.state.decks[0].videoLoadGeneration++;video.finish();
  assert.equal(await p,null,'Manual imports must not attach to a newer audio load generation');assert.equal(e.mixer.diagnostics().inputs[0],null);await e.mixer.dispose();
});
test('newer fallback request wins when both real-module decode callbacks finish out of order',async()=>{
  const e=setup();e.add();e.mixer.configureMedia({enabled:true});e.mixer.tick(true);await e.finish();const a=e.mixer.nextMedia(0),va=e.videos.at(-1),b=e.mixer.nextMedia(0),vb=e.videos.at(-1);
  vb.finish();const chosen=await b;va.finish();assert.equal(await a,null);assert.equal(e.mixer.mediaDiagnostics().sources[0].assetId,chosen);await e.mixer.dispose();
});
test('associating the currently decoded video invalidates an older pending manual replacement',async()=>{
  const e=setup(),loaded=e.mixer.load(0,file('kept.mp4'));e.videos.at(-1).finish();await loaded;
  const pending=e.mixer.load(0,file('late.mp4')),late=e.videos.at(-1),id=e.mixer.associateVideo(0);late.finish();assert.equal(await pending,null);
  e.mixer.tick(true);assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');assert.equal(e.mixer.mediaDiagnostics().sources[0].kind,'associated');assert.equal(e.mixer.mediaDiagnostics().associations[0].assetId,id);await e.mixer.dispose();
});
test('removing an association invalidates pending manual work and fallback OFF clears its source',async()=>{
  const e=setup(),loaded=e.mixer.load(0,file('associated.mp4'));e.videos.at(-1).finish();await loaded;e.mixer.associateVideo(0);
  const pending=e.mixer.load(0,file('late.mp4')),late=e.videos.at(-1);e.mixer.removeVideoAssociation(0);late.finish();assert.equal(await pending,null);e.mixer.tick(true);
  assert.equal(e.mixer.diagnostics().inputs[0],null);assert.equal(e.mixer.mediaDiagnostics().associations[0].assetId,null);await e.mixer.dispose();
});
test('fallback OFF cancels pending manual replacement of a fallback source and cannot resurrect it',async()=>{
  const e=setup();e.add();e.mixer.configureMedia({enabled:true});e.mixer.tick(true);await e.finish();
  const pending=e.mixer.load(0,file('late.mp4')),late=e.videos.at(-1);e.mixer.configureMedia({enabled:false});e.mixer.tick(true);assert.equal(e.mixer.diagnostics().inputs[0],null);
  late.finish();assert.equal(await pending,null);e.mixer.tick(true);assert.equal(e.mixer.diagnostics().inputs[0],null);await e.mixer.dispose();
});
test('fallback toggles retain a previously committed manual source',async()=>{
  const e=setup(),loaded=e.mixer.load(0,file('manual.mp4'));e.videos.at(-1).finish();await loaded;e.add();
  e.mixer.configureMedia({enabled:true});e.mixer.tick(true);e.mixer.configureMedia({enabled:false});e.mixer.tick(true);
  assert.equal(e.mixer.diagnostics().inputs[0].name,'manual.mp4');assert.equal(e.mixer.mediaDiagnostics().sources[0].kind,'manual');await e.mixer.dispose();
});
test('removing the active associated asset invalidates an older pending manual replacement',async()=>{
  const e=setup(),loaded=e.mixer.load(0,file('kept.mp4'));e.videos.at(-1).finish();await loaded;const id=e.mixer.associateVideo(0);
  const pending=e.mixer.load(0,file('late.mp4')),late=e.videos.at(-1);assert(e.mixer.removeMedia(id));e.mixer.tick(true);late.finish();assert.equal(await pending,null);
  assert.equal(e.mixer.diagnostics().inputs[0],null);assert.equal(e.mixer.mediaDiagnostics().associations[0].assetId,null);await e.mixer.dispose();
});
test('loadeddata alone never commits until an actual-module frame callback arrives',async()=>{
  const e=setup(),p=e.mixer.load(0,file('first-frame.mp4')),video=e.videos.at(-1);video.deferFrames=true;video.finish();await flush();
  assert.equal(e.mixer.diagnostics().inputs[0],null);assert.equal(video.paused,false);assert.equal(video.frameCallbacks.size,1);
  video.deliverFrame();await p;const input=e.mixer.diagnostics().inputs[0];assert.equal(input.firstFrame.presentedFrames,1);assert.equal(input.firstFrame.width,320);assert.equal(input.paused,true);assert.equal(video.frameCallbacks.size,0);await e.mixer.dispose();
});
test('ownership lost during first-frame priming cannot commit and cleans its callback',async()=>{
  const e=setup(),p=e.mixer.load(0,file('superseded-frame.mp4')),video=e.videos.at(-1);video.deferFrames=true;video.finish();await flush();e.state.decks[0].videoLoadGeneration++;
  video.deliverFrame();assert.equal(await p,null);assert.equal(e.mixer.diagnostics().inputs[0],null);assert.equal(video.paused,true);assert.equal(video.frameCallbacks.size,0);assert(e.revoked.includes(video.src));await e.mixer.dispose();
});
test('missing frame-callback support rejects replacement without destroying previous source',async()=>{
  const e=setup(),first=e.mixer.load(0,file('kept.mp4'));e.videos.at(-1).finish();await first;
  const replacement=e.mixer.load(0,file('unsupported.mp4')),video=e.videos.at(-1);video.requestVideoFrameCallback=undefined;video.finish();
  await assert.rejects(replacement,/requestVideoFrameCallback is unavailable/);assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');assert.equal(video.paused,true);assert(e.revoked.includes(video.src));await e.mixer.dispose();
});
let passed=0,failed=0;for(const {name,run} of tests){try{await run();passed++;console.log(`PASS ${name}`);}catch(error){failed++;console.error(`FAIL ${name}: ${error.stack}`);}}
console.log(`${passed}/${tests.length} actual-module Media runtime ownership checks passed.`);console.log('Scope: controlled video decode/Canvas/pipeline with actual mixer+selection modules; real File decoding, AudioEngine, pixels and transport require video-media-harness.html.');if(failed)process.exitCode=1;
