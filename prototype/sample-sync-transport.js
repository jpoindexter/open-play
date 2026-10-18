// Prepared audio-time sample starts. Existing audio stays owned until commit.
import {createBeatgrid} from './beatgrid.js';
import {createWarpLoopTransport} from './warp-loop.js';
import {trackGainDB} from './track-gain.js';
const aborted=()=>new DOMException('Sampler Sync preparation superseded.','AbortError');
export function sampleVoiceClock(voice){
 if(voice.gridTimeline)return at=>voice.handoffBefore&&at<voice.handoffBefore.until?voice.handoffBefore.clock(at):voice.gridTimeline.clock(at);
 const {anchorPosition:start,anchorTime:when,track}=voice,{rate,repeat,loopStart,loopEnd}=voice.settings;
 return at=>{let p=start+Math.max(0,at-when)*rate;if(repeat&&p>=loopEnd&&loopEnd>loopStart)p=loopStart+(p-loopStart)%(loopEnd-loopStart);return Math.min(track.duration,p);};
}
export function disposeSampleVoice(voice){
 voice.endTimer&&clearTimeout(voice.endTimer);voice.controller?.abort();voice.syncTransport?.dispose();
 if(voice.source){voice.source.onended=null;try{voice.source.stop();}catch{}voice.source.disconnect();}
 voice.trackGain?.disconnect();voice.gain?.disconnect();
}
function retire(engine,key,voice,when){
 if(!voice)return;
 const end=when+.01;voice.gain.gain.cancelScheduledValues(when);voice.gain.gain.setValueAtTime(voice.gain.gain.value,when);voice.gain.gain.linearRampToValueAtTime(0,end);
 const jobs=engine.sampleRetiring.get(key)||new Set();engine.sampleRetiring.set(key,jobs);
 const job={voice,timer:null};jobs.add(job);
 const poll=()=>{if(engine.ctx.currentTime<end){job.timer=setTimeout(poll,20);return;}jobs.delete(job);if(!jobs.size)engine.sampleRetiring.delete(key);disposeSampleVoice(voice);};
 job.timer=setTimeout(poll,Math.max(10,(end-engine.ctx.currentTime)*1000));
}
export async function startSyncedSample(engine,track,key,options,plan){
 const {handoff,syncOverride,...settings}=options;
 const previous=engine.sampleRequests.get(key),old=engine.samples?.get(key),oldClock=old?sampleVoiceClock(old):null;
 if(previous?.processing&&previous!==old?.request)previous.controller.abort();
 const controller=new AbortController(),token=(engine.sampleTokens.get(key)||0)+1;
 engine.sampleTokens.set(key,token);
 const request={track,settings,controller,processing:true};engine.sampleRequests.set(key,request);
 const current=()=>engine.sampleTokens.get(key)===token&&!controller.signal.aborted&&plan.valid();
 const id='sample:'+key;handoff?.watch(id,controller,current);
 let transport,voice,committed=false;
 engine.onSampleState(key,{playing:!!old,processing:true});
 try{
  await engine.resume();if(!current())throw aborted();
  const original=await engine.buffer(track);if(!current())throw aborted();
  settings.rate=plan.bpm/track.bpm;settings.keylock=!!settings.keylock;settings.syncBPM=plan.bpm;
  if(!Number.isFinite(settings.rate)||settings.rate<.5||settings.rate>2)throw RangeError('Matched tempo exceeds the current Sampler rate range.');
  settings.start=Math.max(0,Math.min(original.duration-1/original.sampleRate,Number(settings.start)||0));
  settings.loopStart=Math.max(0,Math.min(original.duration,Number(settings.loopStart)||0));
  settings.loopEnd=Math.max(settings.loopStart,Math.min(original.duration,Number(settings.loopEnd)||original.duration));
  const loop=settings.repeat&&settings.loopEnd>settings.loopStart?{start:settings.loopStart,end:settings.loopEnd}:null;
  const grid=createBeatgrid(plan.track),span=loop||{start:0,end:original.duration};
  grid.timeline({position:settings.start,when:engine.ctx.currentTime,bpm:plan.bpm,loop});
  const audio=settings.keylock?await engine.keylockRenderer.renderWarpLoop(original,{track:plan.track,loop:span,bpm:plan.bpm,keylock:true,signal:controller.signal}):original;
  if(!current())throw aborted();
  const ended=({frame})=>{
   if(engine.samples?.get(key)!==voice)return;
   engine.samples.delete(key);disposeSampleVoice(voice);
   const pending=engine.sampleRequests.get(key);
   if(pending===request){engine.sampleRequests.delete(key);engine.onSampleState(key,{playing:false,processing:false,endedFrame:frame});engine.onSampleEnd(key);}
   else engine.onSampleState(key,{playing:false,processing:!!pending?.processing});
  };
  transport=await createWarpLoopTransport(engine.ctx,[audio],{signal:controller.signal,onEnded:ended,onError:error=>{if(engine.samples?.get(key)===voice){engine.stopSample(key);engine.onError?.(error);}}});
  if(!current())throw aborted();
  const when=handoff?await handoff.prepared(id,engine.ctx.currentTime+.05):engine.ctx.currentTime+.05;
  const position=plan.positionAt(when,{start:settings.start,loop,priorClock:oldClock}),timeline=grid.timeline({position,when,bpm:plan.bpm,loop});
  // File/Blob values cannot be decoded in this AudioWorklet scope. Match the
  // deck boundary: transfer only the numeric source-time beatgrid record.
  const gridRecord={bpm:plan.track.bpm,grid:plan.track.grid,duration:plan.track.duration,gridWarpMarkers:(plan.track.gridWarpMarkers||[]).map(({time,bpm})=>({time,bpm}))};
  await transport.start({track:gridRecord,loop,bpm:plan.bpm,position,when,renderedLoop:settings.keylock,renderedSpan:span});
  if(handoff)await handoff.arm(id);
  if(!current())throw aborted();
  if(engine.ctx.currentTime>=when)throw Error('Sampler Sync missed its scheduled start; previous audio retained.');
  const trackGain=engine.ctx.createGain(),gain=engine.ctx.createGain(),level=settings.muted?0:(settings.gain??.8)*.5;
  trackGain.gain.value=10**(trackGainDB(track)/20);gain.gain.value=0;gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+.01);
  transport.outputs[0].connect(trackGain);trackGain.connect(gain);gain.connect(engine.samplerInput);
  voice={source:transport.node,syncTransport:transport,audioBuffer:audio,gain,trackGain,settings,track,controller,request,gridTimeline:timeline,anchorPosition:timeline.clock(when),anchorTime:when,scale:1,handoffBefore:old?{until:when,clock:oldClock}:null};
  engine.samples??=new Map();engine.samples.set(key,voice);engine.sampleRequests.set(key,request);request.processing=false;committed=true;retire(engine,key,old,when);
  plan.committed?.(voice);engine.onSampleState(key,{playing:true,processing:false});return true;
 }catch(error){
  handoff?.fail(error);
  if(engine.sampleTokens.get(key)===token){
   if(old&&engine.samples?.get(key)===old){engine.sampleRequests.set(key,old.request||previous);engine.onSampleState(key,{playing:true,processing:false});}
   else{engine.sampleRequests.delete(key);engine.onSampleState(key,{playing:false,processing:false});}
  }
  if(error.name==='AbortError'&&!handoff)return false;
  throw error;
 }finally{if(!committed){controller.abort();transport?.dispose();}}
}
