// Real helper, controlled video and deterministic deadline adapters. These
// tests do not decode a File or prove drawable browser pixels; the real media
// harness and its requestVideoFrameCallback checks establish that separate path.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {primeDecodedVideo} from '../prototype/video-decode.js';
const helperSource=await readFile(new URL('../prototype/video-decode.js',import.meta.url),'utf8');
const helperSHA256=createHash('sha256').update(helperSource).digest('hex');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function observe(promise){const result={status:'pending'};result.promise=promise.then(value=>{result.status='fulfilled';result.value=value;},error=>{result.status='rejected';result.error=error;});return result;}
const dimensions={mediaTime:.125,presentedFrames:1,width:320,height:180};
function controlledVideo(){
 const callbacks=new Map(),play=deferred(),calls={play:0,pause:0,requested:[],canceled:[]};let serial=0;
 const video={muted:true,paused:true,requestVideoFrameCallback(fn){const id=++serial;callbacks.set(id,fn);calls.requested.push(id);return id;},cancelVideoFrameCallback(id){calls.canceled.push(id);callbacks.delete(id);},play(){calls.play++;video.paused=false;return play.promise;},pause(){calls.pause++;video.paused=true;}};
 return{video,play,calls,callbacks,frame(metadata=dimensions){const entry=callbacks.entries().next().value;if(entry){callbacks.delete(entry[0]);entry[1](1,metadata);}}};
}
async function clocked(run){
 const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,timers=new Map(),scheduled=[],cleared=[];let serial=0;
 globalThis.setTimeout=(fn,ms)=>{const id=++serial;timers.set(id,fn);scheduled.push({id,ms});return id;};
 globalThis.clearTimeout=id=>{cleared.push(id);timers.delete(id);};
 const clock={timers,scheduled,cleared,fire(){for(const [id,fn]of [...timers]){timers.delete(id);fn();}}};
 try{await run(clock);}finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
}
const tests=[],test=(name,run)=>tests.push({name,run});
const cleanup=(fixture,clock)=>{assert.equal(fixture.calls.pause,1);assert(fixture.video.paused);assert.deepEqual(fixture.calls.canceled,fixture.calls.requested);assert.equal(fixture.callbacks.size,0);assert.equal(clock.timers.size,0);};

test('Play readiness alone cannot commit before an actual frame callback',()=>clocked(async clock=>{
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video));await flush();assert.equal(f.calls.play,1);f.play.resolve();await flush();assert.equal(result.status,'pending');f.frame();await result.promise;assert.equal(result.status,'fulfilled');assert.deepEqual(result.value,dimensions);cleanup(f,clock);
}));
test('A frame callback alone cannot commit before the play promise settles',()=>clocked(async clock=>{
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video));await flush();f.frame();await flush();assert.equal(result.status,'pending');f.play.resolve();await result.promise;assert.equal(result.status,'fulfilled');cleanup(f,clock);
}));
test('Only presented frame metadata is returned; no timer/DOM object escapes',()=>clocked(async clock=>{
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video));await flush();f.frame({...dimensions,unexpected:{video:f.video}});f.play.resolve();await result.promise;assert.deepEqual(Object.keys(result.value).sort(),['height','mediaTime','presentedFrames','width']);assert.equal(clock.scheduled[0].ms,10000);cleanup(f,clock);
}));
test('An unmuted source rejects before callback allocation or playback',()=>clocked(async clock=>{
 const f=controlledVideo();f.video.muted=false;await assert.rejects(primeDecodedVideo(f.video),/muted/);assert.equal(f.calls.play,0);assert.equal(f.calls.requested.length,0);assert.equal(clock.timers.size,0);
}));
test('Unsupported frame callback capability rejects explicitly without playback',()=>clocked(async clock=>{
 const f=controlledVideo();delete f.video.requestVideoFrameCallback;await assert.rejects(primeDecodedVideo(f.video),/requestVideoFrameCallback.*unavailable/);assert.equal(f.calls.play,0);assert.equal(clock.timers.size,0);
}));
test('The deadline rejects when playback is ready but no frame arrives',()=>clocked(async clock=>{
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video,{timeoutMs:7}));await flush();f.play.resolve();await flush();clock.fire();await result.promise;assert.equal(result.status,'rejected');assert.match(result.error.message,/timeout/);assert.equal(clock.scheduled[0].ms,7);cleanup(f,clock);
}));
test('Regression: deadline still rejects when a frame arrived but play remains pending',()=>clocked(async clock=>{
 // Original frame-only deadline would stay pending here after the frame resolved.
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video,{timeoutMs:7}));await flush();f.frame();await flush();clock.fire();await flush();const statusAtDeadline=result.status;
 f.play.resolve();await result.promise;assert.equal(statusAtDeadline,'rejected','Presented-frame resolution disabled the operation deadline');assert.match(result.error.message,/timeout/);cleanup(f,clock);
}));
test('The deadline rejects when both readiness paths remain pending',()=>clocked(async clock=>{
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video,{timeoutMs:1}));await flush();clock.fire();await result.promise;assert.equal(result.status,'rejected');cleanup(f,clock);f.play.resolve();await flush();
}));
test('Ownership false before playback prevents play and cleans allocated callback/timer',()=>clocked(async clock=>{
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video,{isCurrent:()=>false}));await result.promise;assert.equal(result.status,'rejected');assert.match(result.error.message,/superseded/);assert.equal(f.calls.play,0);cleanup(f,clock);
}));
test('Ownership false at the frame callback rejects rather than returning metadata',()=>clocked(async clock=>{
 let current=true;const f=controlledVideo(),result=observe(primeDecodedVideo(f.video,{isCurrent:()=>current}));await flush();current=false;f.frame();await result.promise;assert.equal(result.status,'rejected');assert.match(result.error.message,/superseded/);cleanup(f,clock);f.play.resolve();await flush();
}));
test('Final ownership is checked if it changes after frame callback but before play settles',()=>clocked(async clock=>{
 let current=true;const f=controlledVideo(),result=observe(primeDecodedVideo(f.video,{isCurrent:()=>current}));await flush();f.frame();current=false;f.play.resolve();await result.promise;assert.equal(result.status,'rejected');assert.match(result.error.message,/superseded/);cleanup(f,clock);
}));
test('A play rejection preserves the exact original error and cancels frame/deadline work',()=>clocked(async clock=>{
 const f=controlledVideo(),failure=new Error('Original playback policy rejection'),result=observe(primeDecodedVideo(f.video));await flush();f.play.reject(failure);await result.promise;assert.equal(result.error,failure);cleanup(f,clock);
}));
test('A synchronous play failure preserves the original error and performs cleanup',()=>clocked(async clock=>{
 const f=controlledVideo(),failure=new Error('Synchronous play failure');f.video.play=()=>{f.calls.play++;throw failure;};const result=observe(primeDecodedVideo(f.video));await result.promise;assert.equal(result.error,failure);cleanup(f,clock);
}));
test('Zero, negative, nonfinite and fractional frame dimensions cannot count as drawable',()=>clocked(async clock=>{
 // The original helper accepted0x0 as successful first-frame metadata.
 for(const [width,height]of [[0,180],[320,0],[-1,180],[NaN,180],[Infinity,180],[320,NaN],[320.5,180]]){
  const f=controlledVideo(),result=observe(primeDecodedVideo(f.video));await flush();f.play.resolve();f.frame({...dimensions,width,height});await result.promise;assert.equal(result.status,'rejected');assert.match(result.error.message,/dimensions/);cleanup(f,clock);
 }
}));
test('Invalid deadlines fail explicitly before playback or callback allocation',()=>clocked(async clock=>{
 for(const timeoutMs of [0,-1,NaN,Infinity,'7',null]){
  const f=controlledVideo();await assert.rejects(primeDecodedVideo(f.video,{timeoutMs}),RangeError);assert.equal(f.calls.play,0);assert.equal(f.calls.requested.length,0);
 }assert.equal(clock.timers.size,0);
}));
test('Late callback delivery after timeout cannot replace rejection or trigger repeated cleanup',()=>clocked(async clock=>{
 const f=controlledVideo(),result=observe(primeDecodedVideo(f.video));await flush();const callback=f.callbacks.values().next().value;clock.fire();await result.promise;const failure=result.error;callback(9,dimensions);f.play.resolve();await flush();assert.equal(result.status,'rejected');assert.equal(result.error,failure);cleanup(f,clock);
}));
const checks=[];for(const{name,run}of tests){try{await run();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.stack});}}
const report={scope:'Executed actual primeDecodedVideo helper with controlled video callback/play promises and deterministic timer adapter. This does not decode a File or establish presented browser pixels; use real media harness evidence separately.',helper:'prototype/video-decode.js',helperSHA256,passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
