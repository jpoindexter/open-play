// Independent source-executed boundary checks; no browser/GPU/pixel acceptance.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {AudioEngine} from '../prototype/engine.js';
import {describeAudioVideoLinks,createVideoAudioFXFrameState,planVideoAudioFXFrame} from '../prototype/video-audio-fx-state.js';
const base=new URL('../prototype/',import.meta.url),original=await readFile(new URL('video.js',base),'utf8');
const source=original.replace("import {createVideoPipeline} from './video-pipeline.js';",'const createVideoPipeline=(...a)=>globalThis.__couplingReviewPipeline(...a);').replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${new URL(path,base)}'`);
const {createVideoMixer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const tests=[],test=(name,run)=>tests.push({name,run});
const echo={id:'0:0',name:'Echo',kind:'echo',amount:.5,delaySeconds:.25,feedback:.8};
function context(time,frameId,extra={}){return {time,frameId,assetId:'real-A',audioTransport:{playing:true,generation:'g1',sources:[{id:'audio-A',playing:true,position:time,rate:1,generation:1}]},...extra};}
function warm(){const state=createVideoAudioFXFrameState();for(let n=0;n<=60;n++)planVideoAudioFXFrame(state,echo,context(n/60,n));return state;}
test('Engine semantic snapshot reads frozen metadata without touching audio graph collaborators',()=>{
 const fx=[[{name:'Echo',on:true,depth:60,beat:'1/2',params:{Feedback:70}}],[{name:'Distortion',on:true,depth:80,params:{Drive:60}}]];
 for(const bank of fx){for(const spec of bank){Object.freeze(spec.params);Object.freeze(spec);}Object.freeze(bank);}Object.freeze(fx);
 const owner={ctx:{state:'running'},effectsPrepared:true,fxState:Object.freeze([fx,Object.freeze(['Deck 1','Master']),Object.freeze([120,125])])};
 for(const name of ['nodes','fxChains','fxSlots','master','destination','configureFX','videoAnalysis'])Object.defineProperty(owner,name,{get(){throw new Error('Audio graph access '+name);}});
 const before=JSON.stringify(owner.fxState),links=AudioEngine.prototype.videoFXLinks.call(owner);assert.equal(links.left.length,1);assert.equal(links.master.length,1);assert.equal(JSON.stringify(owner.fxState),before);
});
test('Duplicate destination banks remain ordered distinct slots and Master is represented only once',()=>{
 const spec=name=>({name,on:true,depth:50,beat:'1/2'});
 const links=describeAudioVideoLinks([[[spec('Echo'),spec('Distortion')],[spec('Echo')]],['Master','Master'],[120]]);
 assert.deepEqual(links.master.map(l=>l.id),['0:0','0:1','1:0']);assert.equal(links.left.length+links.right.length,0);
});
test('Unsupported routes/names never silently become an active target',()=>{
 const links=describeAudioVideoLinks([[[{name:'Echo',on:true}],[{name:'Low Cut Echo',on:true}]],['Deck 3','Deck 1'],[120]]);
 assert.equal(links.left.length+links.right.length+links.master.length,0);assert.equal(links.unsupported.length,2);
});
test('Duplicate frame IDs cannot duplicate history capture',()=>{const state=warm(),count=state.captures;const plan=planVideoAudioFXFrame(state,echo,context(1,60));assert.equal(state.captures,count);assert.equal(plan.duplicate,true);});
test('Real Echo history taps use timestamps while timing edits retain captured input',()=>{
 const state=warm(),count=state.captures,plan=planVideoAudioFXFrame(state,{...echo,delaySeconds:.3,amount:.8},context(1,60));assert.equal(plan.resetReasons.length,0);assert.equal(state.captures,count);
 // Timing grows from .25s to .30s: only existing timestamps may be used.
 assert.equal(plan.taps[2],-1,'A newly requested older third tap must not be fabricated');
 for(let n=0;n<2;n++){assert(plan.taps[n]>=0);const timestamp=state.times[plan.taps[n]];assert(timestamp<=1-(n+1)*.3+1e-9);assert(1-(n+1)*.3-timestamp<.06);}
});
test('Source and transport discontinuities cannot resurrect any old captured timestamp',()=>{
 for(const next of [context(1.02,61,{assetId:'real-B'}),context(1.02,61,{audioTransport:{playing:false,generation:'g1',sources:[]}}),context(.5,61),context(1.02,61,{audioTransport:{playing:true,generation:'g2',sources:[{id:'audio-A',playing:true,position:1.02,rate:1,generation:2}]}}),context(1.02,61,{audioTransport:{playing:true,generation:'g1',sources:[{id:'audio-A',playing:true,position:5,rate:1,generation:1}]}})]){
  const state=warm(),plan=planVideoAudioFXFrame(state,echo,next);assert(plan.resetReasons.length);assert(state.times.filter(Number.isFinite).every(t=>t===next.time));assert(plan.taps.every(t=>t===-1));
 }
});
let serial=0;
function mixerEnvironment(){
 const e={videos:[],renders:[],notifications:[]};
 const canvas=()=>{const c={width:640,height:360,isConnected:true,clears:0,draws:0,drawCalls:[]},ctx={canvas:c,clearRect(){c.clears++;},fillRect(){},fillText(){},save(){},restore(){},setTransform(){},drawImage(...args){c.draws++;c.drawCalls.push(args);}};c.getContext=()=>ctx;return c;};
 globalThis.performance={now:()=>1000};globalThis.URL.createObjectURL=()=>`blob:review-${++serial}`;globalThis.URL.revokeObjectURL=()=>{};
 globalThis.document={querySelector:()=>null,createElement(type){if(type==='canvas')return canvas();assert.equal(type,'video');const v={readyState:2,seeking:false,paused:true,videoWidth:320,videoHeight:180,duration:10,currentTime:0,playbackRate:1,load(){},pause(){this.paused=true;},play(){this.paused=false;queueMicrotask(()=>this.callback?.(1000,{width:320,height:180,presentedFrames:1,mediaTime:0}));return Promise.resolve();},requestVideoFrameCallback(callback){this.callback=callback;return 1;},cancelVideoFrameCallback(){this.callback=null;}};e.videos.push(v);return v;}};
 globalThis.__couplingReviewPipeline=()=>({reset(){},dispose(){},diagnostics(){return{};},render(inputs,settings,context){e.renders.push({inputs,settings,context});return{output:canvas(),channels:inputs};}});
 e.state={video:{linked:false},settings:{},decks:[{index:0,track:{id:'a',bpm:120},playing:false,rate:1,position:0},{index:1,track:null}]};
 e.mixer=createVideoMixer({state:e.state,engine:{position:d=>d.position,cross:0,nodes:[],videoAnalysis:()=>({audioAvailable:false})},notify:m=>e.notifications.push(m)});e.mixer.bind(canvas());
 e.load=async()=>{const p=e.mixer.load(0,{name:'actual-module.mp4'});e.videos[0].onloadeddata();await p;e.mixer.tick(true);};return e;
}
test('Recreating raw output during readyState2 seek waits without poisoning the pipeline',async()=>{
 const e=mixerEnvironment();await e.load();e.videos[0].seeking=true;e.mixer.setResolution(1280,720);e.mixer.tick(true);
 const during=e.mixer.diagnostics();e.videos[0].seeking=false;e.mixer.tick(true);const after=e.mixer.diagnostics();await e.mixer.dispose();
 assert.equal(during.error,null,'An in-flight seek on a fresh raw canvas must wait for a valid frame');assert.equal(after.error,null,'Valid decode should recover without manual Reset');
});
test('Resize during seek resamples prior decoded raw and defers presentation commit until valid decode',async()=>{
 const e=mixerEnvironment();await e.load();
 try {
  const prior=e.renders.at(-1),oldRaw=prior.inputs[0],before=e.mixer.diagnostics();
  assert(oldRaw.drawCalls.some(args=>args[0]===e.videos[0]),'Precondition: previous raw must contain a real decoded source draw');
  e.videos[0].seeking=true;e.state.video.mediaTreatment='preserve';e.mixer.setResolution(1920,1080);e.mixer.tick(true);
  const held=e.renders.at(-1),newRaw=held.inputs[0],during=e.mixer.diagnostics();
  assert.notEqual(newRaw,oldRaw);assert.equal(newRaw.width,1920);assert.equal(newRaw.height,1080);
  assert(newRaw.drawCalls.some(args=>args[0]===oldRaw&&args[1]===0&&args[2]===0&&args[3]===1920&&args[4]===1080),'Replacement raw canvas must resample the previous decoded raw source');
  assert(!newRaw.drawCalls.some(args=>args[0]===e.videos[0]),'Pending seek cannot supply a newly committed video frame');
  assert.equal(newRaw.clears,0,'Retained raw must not be erased by the placeholder path; this also exercises retained decoded-source ownership');
  assert.equal(held.context.channels[0].assetId,prior.context.channels[0].assetId,'Presentation identity must remain pending through resize/seek');
  assert.equal(during.presentationGenerations[0],before.presentationGenerations[0]);assert.equal(during.error,null);
  e.videos[0].seeking=false;e.mixer.tick(true);const committed=e.mixer.diagnostics();
  assert(newRaw.drawCalls.some(args=>args[0]===e.videos[0]),'Valid decoded frame must replace the held raw');
  assert.equal(committed.presentationGenerations[0],before.presentationGenerations[0]+1,'Valid new geometry commits exactly one generation');
  assert.notEqual(e.renders.at(-1).context.channels[0].assetId,held.context.channels[0].assetId);
  e.mixer.tick(true);assert.equal(e.mixer.diagnostics().presentationGenerations[0],committed.presentationGenerations[0]);
  return {resampledFromPreviousRaw:true,retainedPresentationGeneration:during.presentationGenerations[0],committedPresentationGeneration:committed.presentationGenerations[0],output:[newRaw.width,newRaw.height]};
 } finally {await e.mixer.dispose();}
});
const checks=[];for(const {name,run} of tests){try{const evidence=await run();checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,error:error.stack});}}
console.log(JSON.stringify({scope:'Actual pure semantic planner/engine snapshot and actual mixer with controlled DOM+pipeline; no GPU/browser/File pixel proof.',passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks},null,2));if(checks.some(c=>!c.passed))process.exitCode=1;
