import {copyPCMChunk} from './pcm-resample.js';
import {createPitchTimeMap} from './pitch-time-map.js';
// Forward browser keylock adapter; independent ownership/windowing around Signalsmith.
// Derived from retention clone SHA256 16707a8f446a503eff022528461ff758b0f47031e34064241bf02d085cd6d9e4.
// Normal scheduling keeps queried latency+2quanta; only explicit active followSeek uses40ms.
// Retained source history2s, required source history1s. The distinct wrapper also
// supplies the DSP's queried block+interval seek history; preset/WASM/SRC unchanged.
import Stretch from './vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs';

const CHUNK_SECONDS=.5,REQUIRED_PREROLL_SECONDS=1,RETENTION_PREROLL_SECONDS=2,LOOKAHEAD_SECONDS=8,DRIVER_MS=50,CROSSFADE_SECONDS=.01,FOLLOW_LEAD_SECONDS=.04;
const policy=Object.freeze({direction:'forward',normalMinimumLead:'queried group latency plus2 render quanta',followMinimumLeadSeconds:FOLLOW_LEAD_SECONDS,followOwner:'currently active forward owner only',followCoverage:'required history must already be prepared; reject without replacement',rate:[.25,4],effectiveSemitones:[-24,24],chunkSeconds:CHUNK_SECONDS,requiredPrerollSeconds:REQUIRED_PREROLL_SECONDS,retentionPrerollSeconds:RETENTION_PREROLL_SECONDS,retentionHysteresisSeconds:RETENTION_PREROLL_SECONDS-REQUIRED_PREROLL_SECONDS,lookaheadSeconds:LOOKAHEAD_SECONDS,driverMs:DRIVER_MS,crossfadeSeconds:CROSSFADE_SECONDS,srcTaps:32,srcPhases:1024,decodedSources:'Whole decoded AudioBuffers remain caller-owned; only processor PCM copies are windowed.',unsupported:['reverse','loop','Stem Slip','incremental compressed-file decoding'],quality:'Independent32-tap windowed-sinc normalization and10ms group crossfade; vendor sonic equivalence and artifact-free transitions are unverified.'});
const failure=(name,message)=>Object.assign(new Error(message),{name});
const finite=(value,name)=>{if(!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;};
const abortError=()=>failure('AbortError','Live keylock operation superseded or disposed');
function alive(signal){if(signal?.aborted)throw abortError();}
function geometry(buffer){
 if(typeof AudioBuffer!=='function'||!(buffer instanceof AudioBuffer))throw new TypeError('Each source must be an AudioBuffer');
 const {sampleRate,length,numberOfChannels}=buffer;
 if(!Number.isFinite(sampleRate)||sampleRate<=0||!Number.isSafeInteger(length)||length<1||!Number.isInteger(numberOfChannels)||numberOfChannels<1||numberOfChannels>8)throw new RangeError('Invalid AudioBuffer geometry; channel policy is1..8');
 const channels=Array.from({length:numberOfChannels},(_,c)=>AudioBuffer.prototype.getChannelData.call(buffer,c));
 return{buffer,sampleRate,length,numberOfChannels,duration:length/sampleRate,channels};
}
export async function copyKeylockChunk(buffer,sampleRate,startFrame,frameCount,options={}){const source=geometry(buffer);return copyPCMChunk(source.channels,source.sampleRate,sampleRate,startFrame,frameCount,options);}
function normalize(state){const rate=finite(state.rate,'rate'),semitones=finite(state.semitones,'semitones');if(rate<.25||rate>4)throw new RangeError('Current forward prototype rate policy is.25..4');if(semitones< -24||semitones>24)throw new RangeError('Current requested key-shift policy is±24semitones');const effectiveSemitones=semitones+(state.keylock?0:12*Math.log2(rate));if(effectiveSemitones< -24||effectiveSemitones>24)throw new RangeError('Current effective-transposition policy is±24semitones');return{rate,keylock:!!state.keylock,semitones,effectiveSemitones};}
function gainAt(param,value,when){param.cancelScheduledValues(when);param.setValueAtTime(value,when);}

export async function createLiveKeylock(context,{buffers,position=0,rate=1,keylock=true,semitones=0,signal,onEvent=()=>{},resamplePitch=false,pitchRateMap=null,maxPCMBytes=512*1024*1024}={}){
 const adapter=new LiveKeylock(context,{buffers,position,rate,keylock,semitones,signal,onEvent,resamplePitch,pitchRateMap,maxPCMBytes});try{await adapter.prepare();adapter.assertOwner();return adapter;}catch(error){await adapter.dispose().catch(()=>{});throw error;}
}
class LiveKeylock{
 constructor(context,{buffers,position,rate,keylock,semitones,signal,onEvent,resamplePitch,pitchRateMap,maxPCMBytes}){
  if(!context?.createGain||!Number.isFinite(context.sampleRate)||context.sampleRate<=0)throw new TypeError('A usable AudioContext is required');
  if(!Array.isArray(buffers)||(buffers.length!==1&&buffers.length!==5))throw new RangeError('Supply original only or all5 positional original/stem buffers');
  if(!Number.isSafeInteger(maxPCMBytes)||maxPCMBytes<1)throw new RangeError('Invalid live PCM budget');this.maxPCMBytes=maxPCMBytes;this.resamplePitch=!!resamplePitch;
  this.pitchRateMap=pitchRateMap?.map(point=>({...point}));
  this.context=context;this.sources=buffers.map(geometry);this.duration=this.sources[0].duration;this.sampleRate=context.sampleRate;this.chunkFrames=Math.max(1,Math.round(this.sampleRate*CHUNK_SECONDS));this.durationFrames=Math.ceil(this.duration*this.sampleRate);this.onEvent=onEvent;this.controller=new AbortController();this.signal=this.controller.signal;this.ownerSignal=signal;this.ownerAbort=()=>this.dispose().catch(()=>{});this.disposed=false;this.revision=0;this.pending=null;this.serial=Promise.resolve();this.groupSequence=0;this.groups=new Set();this.active=null;this.retiring=null;this.retirementPromise=null;this.timer=null;this.driverBusy=false;this.disposePromise=null;this.lastError=null;this.ended=false;this.inFlightPCMBytes=0;this.initialState=normalize({rate,keylock,semitones});this.initialPosition=this.validPosition(position);this.clock=[{when:context.currentTime,position:this.initialPosition,playing:false,...this.initialState}];
  if(this.sources.length===5){const stems=this.sources.slice(1),first=stems[0];if(stems.some(s=>s.sampleRate!==first.sampleRate||s.length!==first.length||Math.abs(s.duration-this.duration)>.1+1e-9))throw new RangeError('Prepared stems must share sample rate/length and stay within.1s of original duration');}
  this.sourceGeometry=this.sources.map((s,index)=>({index,sampleRate:s.sampleRate,frames:s.length,channels:s.numberOfChannels,duration:s.duration,paddedTailSeconds:Math.max(0,this.duration-s.duration),trimmedTailSeconds:Math.max(0,s.duration-this.duration),decodedBytes:s.length*s.numberOfChannels*4}));
  if(signal?.aborted){this.controller.abort();throw abortError();}
  this.outputs=this.sources.map(s=>{const node=context.createGain();node.channelCount=s.numberOfChannels;node.channelCountMode='explicit';node.channelInterpretation='discrete';node.gain.value=1;return node;});
  signal?.addEventListener('abort',this.ownerAbort,{once:true});
 }
 validPosition(position){finite(position,'position');if(position<0||position>this.duration)throw new RangeError('Position must lie within original audible duration');return position;}
 assertOwner(){alive(this.signal);if(this.disposed)throw abortError();}
 emit(type,detail={}){try{this.onEvent({type,contextTime:this.context.currentTime,...detail});}catch{/* Observer errors cannot change audio ownership. */}}
 async prepare(){this.assertOwner();this.active=await this.newGroup(this.initialPosition,this.initialState,null);this.assertOwner();this.emit('prepared',{snapshot:this.snapshot()});return this;}
 stateAt(at=this.context.currentTime,segments=this.clock){finite(at,'context time');let segment=segments[0];for(const item of segments)if(item.when<=at)segment=item;else break;const raw=segment.position+(segment.playing?Math.max(0,at-segment.when)*segment.rate:0),position=Math.min(this.duration,Math.max(0,raw));return{...segment,position,playing:segment.playing&&position<this.duration};}
 position(at=this.context.currentTime){return this.stateAt(at).position;}
 pruneClock(segments){const now=this.context.currentTime;let current=0;for(let i=0;i<segments.length;i++)if(segments[i].when<=now)current=i;return segments.slice(Math.max(0,current));}
 addClock(segments,state){return this.pruneClock([...segments.filter(s=>s.when<state.when),state]);}
 checkGroup(group){this.assertOwner();alive(group.controller.signal);if(!this.groups.has(group))throw abortError();}
 async newGroup(position,state,operation){
  this.assertOwner();const pitchMap=this.resamplePitch&&!state.keylock&&this.pitchRateMap?createPitchTimeMap(this.pitchRateMap.map(point=>({position:point.position,factor:point.rate*2**(state.semitones/12)})),this.duration):null;const controller=new AbortController(),abort=()=>controller.abort();this.signal.addEventListener('abort',abort,{once:true});const group={id:++this.groupSequence,controller,ownerDetach:()=>this.signal.removeEventListener('abort',abort),nodes:[],gains:[],routingNodes:[],chunks:[],pitchSemitones:this.resamplePitch?state.effectiveSemitones:0,pitchFactor:this.resamplePitch?2**(state.effectiveSemitones/12):1,pitchEndFrame:0,originFrame:Math.max(0,Math.floor((position-RETENTION_PREROLL_SECONDS)*this.sampleRate/this.chunkFrames)*this.chunkFrames),endFrame:0,startFrame:0,latency:0,segments:[{when:this.context.currentTime,position,playing:false,...state}],refill:null,fillSerial:Promise.resolve(),disposePromise:null};group.pitchMap=pitchMap;
  group.mapSemitones=state.semitones;group.mapKeylock=state.keylock;
  if(group.pitchMap){group.pitchFactor=group.pitchMap.factorAt(position);group.pitchSemitones=12*Math.log2(group.pitchFactor);group.preparedOrigin=group.pitchMap.preparedAt(group.originFrame/this.sampleRate);}
  group.startFrame=group.endFrame=group.originFrame;this.groups.add(group);this.emit('preparing',{group:group.id,position,origin:group.originFrame/this.sampleRate});
  const cancelPreparation=()=>controller.abort();if(operation){operation.group=group;operation.controller.signal.addEventListener('abort',cancelPreparation,{once:true});group.detachOperation=()=>operation.controller.signal.removeEventListener('abort',cancelPreparation);}
  try{
   this.checkGroup(group);
   const channels=this.sources.reduce((total,source)=>total+source.numberOfChannels,0);
   const node=await Stretch(this.context,{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[channels]},{signal:controller.signal});
   group.nodes.push(node);this.checkGroup(group);
   const splitter=this.sources.length>1?this.context.createChannelSplitter(channels):null;
   if(splitter){splitter.channelInterpretation='discrete';node.connect(splitter);group.routingNodes.push(splitter);}
   let offset=0;
   for(const source of this.sources){
    const gain=this.context.createGain();gain.channelCount=source.numberOfChannels;gain.channelCountMode='explicit';gain.channelInterpretation='discrete';gain.gain.value=0;
    if(splitter){
     const merger=this.context.createChannelMerger(source.numberOfChannels);merger.channelInterpretation='discrete';
     for(let c=0;c<source.numberOfChannels;c++)splitter.connect(merger,offset+c,c);
     merger.connect(gain);group.routingNodes.push(merger);
    }else node.connect(gain);
    gain.connect(this.outputs[group.gains.length]);group.gains.push(gain);offset+=source.numberOfChannels;
   }
   group.latency=await node.latency();group.channels=channels;this.checkGroup(group);
   if(!Number.isFinite(group.latency)||group.latency<0)throw Error('Processor latency is not finite');await this.fill(group,position);this.checkGroup(group);return group;
  }catch(error){await this.disposeGroup(group).catch(()=>{});throw error;}
 }
 async fill(group,position){const previous=group.fillSerial;const pending=previous.catch(()=>{}).then(()=>this.fillWindow(group,position));group.fillSerial=pending;return pending;}
 async fillWindow(group,position){
  if(group.pitchMap)return this.fillMappedWindow(group,position);
  if(group.pitchFactor!==1)return this.fillResampledWindow(group,position);
  this.checkGroup(group);const target=Math.min(this.durationFrames,Math.ceil((position+LOOKAHEAD_SECONDS)*this.sampleRate/this.chunkFrames)*this.chunkFrames);
  const keep=Math.max(group.originFrame,Math.floor((position-RETENTION_PREROLL_SECONDS)*this.sampleRate/this.chunkFrames)*this.chunkFrames);if(keep>group.startFrame){const before=(keep-group.originFrame)/this.sampleRate;const extents=await Promise.all(group.nodes.map(node=>node.dropBuffers(before)));this.checkGroup(group);const first=extents[0];if(extents.some(e=>e.start!==first.start||e.end!==first.end))throw Error('Positional source windows lost alignment during drop');group.startFrame=group.originFrame+Math.round(first.start*this.sampleRate);group.chunks=group.chunks.filter(chunk=>chunk.end>group.startFrame);}
  while(group.endFrame<target){
   this.checkGroup(group);const start=group.endFrame,count=Math.min(this.chunkFrames,target-start),bytes=[],pcm=[];let inFlight=0;
   try{
    for(const source of this.sources){
     const cost=count*source.numberOfChannels*4;this.checkPCMAllocation(cost);this.inFlightPCMBytes+=cost;inFlight+=cost;
     pcm.push(...await copyKeylockChunk(source.buffer,this.sampleRate,start,count,{signal:group.controller.signal}));bytes.push(cost);this.checkGroup(group);
    }
    const extent=await group.nodes[0].addBuffers(pcm,pcm.map(channel=>channel.buffer));this.checkGroup(group);
    const expected=(start+count-group.originFrame)/this.sampleRate;if(Math.abs(extent-expected)>1/this.sampleRate)throw Error('Processor append extent does not match context-frame window');
    group.chunks.push({start,end:start+count,bytes});group.endFrame+=count;
   }finally{this.inFlightPCMBytes-=inFlight;}
  }
 }

 checkPCMAllocation(bytes){const retained=[...this.groups].reduce((sum,g)=>sum+g.chunks.reduce((n,c)=>n+c.bytes.reduce((a,b)=>a+b,0),0),0);if(retained+this.inFlightPCMBytes+bytes>this.maxPCMBytes)throw new RangeError('Live pitch PCM copy budget exceeded.');}
 async fillResampledWindow(group,position){
  this.checkGroup(group);const q=group.pitchFactor,sr=this.sampleRate;
  const targetOriginal=Math.min(this.durationFrames,Math.ceil((position+LOOKAHEAD_SECONDS)*sr/this.chunkFrames)*this.chunkFrames);
  const target=Math.ceil((targetOriginal-group.originFrame)/q);
  const keep=Math.max(group.originFrame,Math.floor((position-RETENTION_PREROLL_SECONDS)*sr/this.chunkFrames)*this.chunkFrames);
  if(keep>group.startFrame){
   const before=Math.floor((keep-group.originFrame)/q)/sr,extents=await Promise.all(group.nodes.map(node=>node.dropBuffers(before)));this.checkGroup(group);
   const first=extents[0];if(extents.some(e=>e.start!==first.start||e.end!==first.end))throw Error('Resampled positional windows lost alignment');
   group.startFrame=group.originFrame+Math.round(first.start*sr)*q;group.chunks=group.chunks.filter(c=>c.end>group.startFrame);
  }
  while(group.pitchEndFrame<target){
   this.checkGroup(group);const start=group.pitchEndFrame,count=Math.min(Math.max(1,Math.floor(this.chunkFrames/q)),target-start),bytes=[],pcm=[];let inFlight=0;
   try{
    for(const source of this.sources){
     const cost=count*source.numberOfChannels*4;this.checkPCMAllocation(cost);this.inFlightPCMBytes+=cost;inFlight+=cost;
     pcm.push(...await copyPCMChunk(source.channels,source.sampleRate,sr/q,start,count,{signal:group.controller.signal,offsetSourceFrames:group.originFrame*(source.sampleRate/sr)}));bytes.push(cost);this.checkGroup(group);
    }
    const extent=await group.nodes[0].addBuffers(pcm,pcm.map(c=>c.buffer));this.checkGroup(group);
    if(Math.abs(extent-(start+count)/sr)>1/sr)throw Error('Resampled processor append extent mismatch');
    group.pitchEndFrame=start+count;const end=Math.min(this.durationFrames,group.originFrame+group.pitchEndFrame*q);
    group.chunks.push({start:group.originFrame+start*q,end,bytes});group.endFrame=end;
   }finally{this.inFlightPCMBytes-=inFlight;}
  }
 }

 async fillMappedWindow(group,position){
  this.checkGroup(group);const map=group.pitchMap,sr=this.sampleRate,origin=group.preparedOrigin;
  const targetOriginal=Math.min(this.durationFrames,Math.ceil((position+LOOKAHEAD_SECONDS)*sr/this.chunkFrames)*this.chunkFrames);
  const target=Math.ceil((map.preparedAt(targetOriginal/sr)-origin)*sr);
  const keep=Math.max(group.originFrame,Math.floor((position-RETENTION_PREROLL_SECONDS)*sr/this.chunkFrames)*this.chunkFrames);
  if(keep>group.startFrame){
   const before=Math.floor((map.preparedAt(keep/sr)-origin)*sr)/sr;
   const extents=await Promise.all(group.nodes.map(node=>node.dropBuffers(before)));this.checkGroup(group);const first=extents[0];
   if(extents.some(e=>e.start!==first.start||e.end!==first.end))throw Error('Mapped source windows lost alignment');
   group.startFrame=map.sourceAt(origin+first.start)*sr;group.chunks=group.chunks.filter(c=>c.end>group.startFrame);
  }
  while(group.pitchEndFrame<target){
   this.checkGroup(group);const start=group.pitchEndFrame,segment=map.preparedSegment(origin+start/sr),q=segment.factor;
   const boundary=segment.next?Math.ceil((segment.next.prepared-origin)*sr):target;
   const count=Math.min(Math.max(1,Math.floor(this.chunkFrames/q)),target-start,boundary-start);
   if(count<1)throw Error('Mapped PCM source boundary did not advance');
   const pcm=[],bytes=[];let inFlight=0;
   try{
    for(const source of this.sources){
     const cost=count*source.numberOfChannels*4;this.checkPCMAllocation(cost);this.inFlightPCMBytes+=cost;inFlight+=cost;
     const offset=(segment.position+(origin-segment.prepared)*q)*source.sampleRate;
     pcm.push(...await copyPCMChunk(source.channels,source.sampleRate,sr/q,start,count,{signal:group.controller.signal,offsetSourceFrames:offset}));bytes.push(cost);this.checkGroup(group);
    }
    const extent=await group.nodes[0].addBuffers(pcm,pcm.map(c=>c.buffer));this.checkGroup(group);
    if(Math.abs(extent-(start+count)/sr)>1/sr)throw Error('Mapped processor append extent mismatch');
    group.pitchEndFrame=start+count;const end=Math.min(this.durationFrames,map.sourceAt(origin+group.pitchEndFrame/sr)*sr);
    group.chunks.push({start:map.sourceAt(origin+start/sr)*sr,end,bytes});group.endFrame=end;
   }finally{this.inFlightPCMBytes-=inFlight;}
  }
 }

 coverage(group,position){const first=Math.max(0,Math.floor((position-REQUIRED_PREROLL_SECONDS)*this.sampleRate)),last=Math.min(this.durationFrames,Math.ceil((position+Math.max(.5,group.latency*5))*this.sampleRate));return first>=group.startFrame&&last<=group.endFrame;}
 operation(run){this.assertOwner();if(this.pending)this.pending.controller.abort();const op={revision:++this.revision,controller:new AbortController(),group:null};this.pending=op;const result=this.serial.catch(()=>{}).then(async()=>{this.assertOwner();alive(op.controller.signal);try{return await run(op);}finally{if(this.pending===op)this.pending=null;}});this.serial=result;return result;}
 checkOperation(op){this.assertOwner();alive(op.controller.signal);if(this.pending!==op)throw abortError();}
 async waitRetiring(op){while(this.retiring||this.retirementPromise){this.checkOperation(op);if(this.retirementPromise){await this.retirementPromise;continue;}if(this.context.currentTime>=this.retiring.retireAt){await this.retire();break;}await new Promise((resolve,reject)=>{const aborted=()=>{clearTimeout(timer);reject(abortError());};const timer=setTimeout(()=>{op.controller.signal.removeEventListener('abort',aborted);resolve();},DRIVER_MS);op.controller.signal.addEventListener('abort',aborted,{once:true});});}}
 minimumLead(group,shadowFollow=false){return shadowFollow?FOLLOW_LEAD_SECONDS:group.latency+2*128/this.sampleRate;}
 at(group,when,shadowFollow=false){const minimum=this.context.currentTime+this.minimumLead(group,shadowFollow);if(when===undefined)return minimum;finite(when,'when');if(when<minimum)throw failure('LateScheduleError',shadowFollow?'Requested follow output precedes40ms lead':'Requested output time precedes current queried-latency lead');return when;}
 assertFollowOwner(at=this.context.currentTime+FOLLOW_LEAD_SECONDS){this.assertOwner();const current=this.stateAt(),future=this.stateAt(at);if(!current.playing||current.rate<=0||!future.playing||future.rate<=0)throw failure('InvalidStateError','followSeek requires an already active forward owner; use normal start for paused/future-start owners');}
 assertFollowCoverage(position,group=this.active){if(!this.coverage(group,position))throw Object.assign(failure('FollowCoverageError','followSeek requires already prepared1s history; use normal seek while externally muted to rebase'),{position,requiredStart:Math.max(0,position-REQUIRED_PREROLL_SECONDS),retainedStart:group.startFrame/this.sampleRate,retainedEnd:group.endFrame/this.sampleRate});}
 async program(group,state){this.checkGroup(group);const factor=group.pitchMap?.factorAt(state.position)??group.pitchFactor;const input=group.pitchMap?group.pitchMap.preparedAt(state.position)-group.preparedOrigin:(state.position-group.originFrame/this.sampleRate)/factor;const residual=state.effectiveSemitones-(group.pitchMap?12*Math.log2(factor):group.pitchSemitones);if(group.pitchMap&&Math.abs(residual)>1e-7)throw new RangeError('Warp command does not match the prepared pitch map');const command={active:state.playing,input,output:state.when,rate:state.rate/factor,semitones:group.pitchMap?0:residual};group.lastScheduleIssuedAt=this.context.currentTime;this.emit('schedule-issued',{group:group.id,command:{...command},issuedAt:group.lastScheduleIssuedAt});await Promise.all(group.nodes.map(node=>node.schedule(command)));this.checkGroup(group);if(state.playing){const end=state.when+(this.duration-state.position)/state.rate;await Promise.all(group.nodes.map(node=>node.stop(end)));this.checkGroup(group);}group.segments=this.addClock(group.segments,state);if(this.context.currentTime>state.when)this.emit('late-ack',{group:group.id,requestedOutput:state.when,acknowledgedAt:this.context.currentTime});}
 async schedule(op,{position,when,notBefore,state,playing,follow=false,shadowFollow=false}){
  this.checkOperation(op);if(shadowFollow){this.assertFollowOwner(when??this.context.currentTime+FOLLOW_LEAD_SECONDS);this.assertFollowCoverage(position);}let group=this.active,replacement=false,programIssued=false,windowIssued=false,windowComplete=false;
  try{
   if(!this.coverage(group,position)||(this.resamplePitch&&(group.pitchMap?(state.keylock!==group.mapKeylock||state.semitones!==group.mapSemitones):state.effectiveSemitones!==group.pitchSemitones))){await this.waitRetiring(op);this.checkOperation(op);group=await this.newGroup(position,state,op);replacement=true;this.checkOperation(op);}else if(when===undefined){windowIssued=true;await this.fill(group,position);windowComplete=true;this.checkOperation(op);}
   // An explicit future anchor already has required history/lookahead coverage.
   // Do not spend its reserved DSP lead topping up the full8s window. The
   // ordinary driver replenishes it after scheduling; implicit times can wait.
   if(shadowFollow){this.assertFollowOwner(when??this.context.currentTime+FOLLOW_LEAD_SECONDS);this.assertFollowCoverage(position,group);}const implicitTime=notBefore===undefined?undefined:Math.max(notBefore,this.context.currentTime+this.minimumLead(group,shadowFollow));const output=this.at(group,when??implicitTime,shadowFollow),mapped={when:output,position:follow?this.stateAt(output).position:position,playing:playing,...state};mapped.playing=playing&&mapped.position<this.duration;if(!this.coverage(group,mapped.position))throw failure('PreparationOverrunError','Requested advancing position left the prepared bounded window');programIssued=true;await this.program(group,mapped);
   // Accepted active commands must remain in the application clock even if a newer request is queued.
   if(replacement)this.checkOperation(op);
   this.assertOwner();const old=this.active;this.clock=this.addClock(this.clock,mapped);this.ended=false;
   if(replacement){group.detachOperation?.();this.active=group;op.group=null;this.retiring=old;old.retireAt=output+CROSSFADE_SECONDS;const oldLevel=this.stateAt(output,old.segments).playing?1:0;for(const gain of old.gains){gainAt(gain.gain,oldLevel,output);gain.gain.linearRampToValueAtTime(0,old.retireAt);}for(const gain of group.gains){gainAt(gain.gain,0,output);gain.gain.linearRampToValueAtTime(mapped.playing?1:0,old.retireAt);}}
   else for(const gain of group.gains)gainAt(gain.gain,mapped.playing?1:0,output);
   this.ensureDriver();const response={...mapped,group:group.id,origin:group.originFrame/this.sampleRate,latencyLead:group.latency,operationKind:shadowFollow?'follow-seek':'normal',minimumLeadSeconds:this.minimumLead(group,shadowFollow),scheduleIssuedAt:group.lastScheduleIssuedAt,scheduleAcknowledgedAt:this.context.currentTime,transitionSeconds:replacement?CROSSFADE_SECONDS:0,superseded:op.controller.signal.aborted};this.emit('scheduled',response);this.assertOwner();return response;
  }catch(error){if(replacement&&group!==this.active)await this.disposeGroup(group).catch(()=>{});else if((programIssued||(windowIssued&&!windowComplete))&&error.name!=='AbortError')this.fail(error);throw error;}
 }
 start({position=this.position(),when}={}){this.validPosition(position);return this.operation(op=>this.schedule(op,{position,when,state:normalize(this.stateAt()),playing:true}));}
 startTimeline({position=this.position(),when,events}={}){
  this.validPosition(position);finite(when,'when');
  if(!Array.isArray(events)||!events.length||events[0].when!==when)throw new TypeError('A warp map must start at its requested output time.');
  if(this.stateAt().playing||this.clock.some(s=>s.playing&&s.when>this.context.currentTime))throw failure('InvalidStateError','Install a warp map on a fresh paused playback owner.');
  const initial=this.stateAt(),segments=[];let sourcePosition=position,lastTime=when,lastRate=events[0].rate;
  for(const [index,event]of events.entries()){
   finite(event.when,'warp output time');
   if(index&&event.when<=lastTime)throw new RangeError('Warp output times must increase.');
   if(index)sourcePosition+=(event.when-lastTime)*lastRate;
   this.validPosition(sourcePosition);
   const state=normalize({...initial,rate:event.rate});
   segments.push({...state,position:sourcePosition,when:event.when,playing:sourcePosition<this.duration});
   lastTime=event.when;lastRate=event.rate;
  }
  if(this.resamplePitch&&segments.some(s=>Math.abs(s.effectiveSemitones-(this.active.pitchMap?12*Math.log2(this.active.pitchMap.factorAt(s.position)):this.active.pitchSemitones))>1e-7))throw new RangeError('Warp pitch factors do not match prepared source map.');
  return this.operation(async op=>{
   const first=segments[0],ack=await this.schedule(op,{position,when,state:normalize(first),playing:true}),group=this.active;
   // Future commands only extend the processor map. The ordinary driver fills
   // and drops PCM around the CURRENT source clock, never a distant marker.
   for(const state of segments.slice(1)){
    this.checkOperation(op);await this.program(group,state);this.checkOperation(op);
    this.clock=this.addClock(this.clock,state);
   }
   if(this.context.currentTime>=when)throw failure('LateScheduleError','Warp map preparation missed its requested output start.');
   this.emit('timeline-scheduled',{group:group.id,segments:segments.map(s=>({...s}))});
   return {...ack,timelineSegments:segments.map(s=>({...s}))};
  });
 }
 controlTime(when){
  if(when!==undefined)return finite(when,'when');
  const earliest=this.context.currentTime+this.minimumLead(this.active);
  // The engine can acknowledge Play before its future audio anchor. An
  // implicit control in that gap edits the intended playing state, rather
  // than replacing the queued start with the currently silent state.
  if(this.stateAt(earliest).playing)return earliest;
  return this.clock.find(state=>state.playing&&state.when>earliest)?.when??earliest;
 }
 update({rate,keylock,semitones,when}={}){return this.operation(op=>{const at=this.controlTime(when),previous=this.stateAt(at),state=normalize({rate:rate??previous.rate,keylock:keylock??previous.keylock,semitones:semitones??previous.semitones});return this.schedule(op,{position:previous.position,when,notBefore:when===undefined?at:undefined,state,playing:previous.playing,follow:true});});}
 seek(position,{when}={}){this.validPosition(position);return this.operation(op=>{const at=this.controlTime(when),previous=this.stateAt(at);return this.schedule(op,{position,when,notBefore:when===undefined?at:undefined,state:normalize(previous),playing:previous.playing});});}

 followSeek(position,{when}={}){this.validPosition(position);const at=when===undefined?this.context.currentTime+FOLLOW_LEAD_SECONDS:finite(when,'when');this.assertFollowOwner(at);this.assertFollowCoverage(position);return this.operation(op=>{this.checkOperation(op);const output=when??this.context.currentTime+FOLLOW_LEAD_SECONDS;this.assertFollowOwner(output);this.assertFollowCoverage(position);const previous=this.stateAt(output);return this.schedule(op,{position,when,state:normalize(previous),playing:true,shadowFollow:true});});}

 pause({when=this.context.currentTime}={}){finite(when,'when');return this.operation(async op=>{this.checkOperation(op);const at=Math.max(this.context.currentTime,when),previous=this.stateAt(at),mapped={...previous,when:at,playing:false};for(const group of this.groups)for(const gain of group.gains)gainAt(gain.gain,0,at);try{await this.program(this.active,mapped);}catch(error){if(error.name!=='AbortError')this.fail(error);throw error;}this.assertOwner();this.clock=this.addClock(this.clock,mapped);if(this.retiring){this.retiring.retireAt=Math.min(this.retiring.retireAt,at);if(at<=this.context.currentTime)await this.retire();}this.ensureDriver();this.emit('paused',mapped);this.assertOwner();return mapped;});}
 ensureDriver(){if(!this.timer&&!this.disposed)this.timer=setTimeout(()=>{this.timer=null;this.drive().catch(error=>{if(error.name!=='AbortError')this.fail(error);});},DRIVER_MS);}
 async drive(){if(this.disposed||this.driverBusy)return;this.driverBusy=true;try{if(this.retiring&&this.context.currentTime>=this.retiring.retireAt)await this.retire();for(const group of [...this.groups]){if(group!==this.active&&group!==this.retiring)continue;const state=this.stateAt(this.context.currentTime,group.segments),intended=group.segments.filter(s=>s.when<=this.context.currentTime).at(-1)||group.segments[0];const frame=state.position*this.sampleRate;if(intended.playing&&frame+group.latency*(state.rate+group.pitchFactor)*this.sampleRate>group.endFrame&&group.endFrame<this.durationFrames)throw failure('UnderrunError','Forward clock overtook the bounded processor window');if(!state.playing)continue;if(!group.refill){group.refill=this.fill(group,state.position).finally(()=>group.refill=null);await group.refill;}}}finally{this.driverBusy=false;if(!this.disposed){const state=this.stateAt();if(!this.ended&&!state.playing&&state.position>=this.duration){this.ended=true;for(const group of this.groups)for(const gain of group.gains)gainAt(gain.gain,0,this.context.currentTime);this.emit('ended',{position:this.duration});}if(state.playing||this.retiring||this.clock.some(s=>s.playing&&s.when>this.context.currentTime))this.ensureDriver();}}}
 async retire(){if(this.retirementPromise)return this.retirementPromise;const old=this.retiring;if(!old)return;this.retiring=null;this.retirementPromise=this.disposeGroup(old).finally(()=>this.retirementPromise=null);return this.retirementPromise;}
 fail(error){if(this.disposed)return;this.lastError={name:error.name,message:error.message};this.emit('error',{error:this.lastError});this.dispose().catch(()=>{});}
 disposeGroup(group){if(group.disposePromise)return group.disposePromise;group.controller.abort();group.detachOperation?.();group.ownerDetach();for(const gain of group.gains){gainAt(gain.gain,0,this.context.currentTime);gain.disconnect();}for(const node of group.routingNodes)node.disconnect();group.disposePromise=(async()=>{const results=await Promise.allSettled(group.nodes.map(node=>node.dispose()));await Promise.allSettled([group.fillSerial]);this.groups.delete(group);group.chunks=[];group.nodes=[];group.gains=[];group.routingNodes=[];const failed=results.find(result=>result.status==='rejected');if(failed&&failed.reason?.name!=='AbortError')throw failed.reason;})();return group.disposePromise;}
 snapshot(){const groups=[...this.groups].map(g=>({id:g.id,pitchMap:g.pitchMap?.nodes||null,pitchSemitones:g.pitchSemitones,pitchFactor:g.pitchFactor,origin:g.originFrame/this.sampleRate,start:g.startFrame/this.sampleRate,end:g.endFrame/this.sampleRate,nodeCount:g.nodes.length,processorChannels:g.channels,sourceOutputs:g.gains.length,retainedPCMBytes:g.chunks.reduce((sum,c)=>sum+c.bytes.reduce((a,b)=>a+b,0),0),retainedChunks:g.chunks.length,latency:g.latency,role:g.disposePromise?'disposing':g===this.active?'selected':g===this.retiring?'retiring':'preparing'}));return{resamplePitch:this.resamplePitch,maxPCMBytes:this.maxPCMBytes,followMinimumLeadSeconds:FOLLOW_LEAD_SECONDS,byteAccounting:'Acknowledged retained PCM and in-flight chunk copies only; excludes decoded inputs, SRC tables and opaque WASM heaps.',disposed:this.disposed,state:this.stateAt(),sourceGeometry:this.sourceGeometry,groups,retainedPCMBytes:groups.reduce((sum,g)=>sum+g.retainedPCMBytes,0),inFlightPCMBytes:this.inFlightPCMBytes,decodedBytes:this.sourceGeometry.reduce((sum,s)=>sum+s.decodedBytes,0),policy,lastError:this.lastError};}
 dispose(){if(this.disposePromise)return this.disposePromise;const frozen=this.stateAt();this.clock=[{...frozen,when:this.context.currentTime,playing:false}];this.disposed=true;this.controller.abort();this.pending?.controller.abort();if(this.timer){clearTimeout(this.timer);this.timer=null;}this.ownerSignal?.removeEventListener('abort',this.ownerAbort);for(const output of this.outputs)gainAt(output.gain,0,this.context.currentTime);this.disposePromise=(async()=>{const results=await Promise.allSettled([...this.groups].map(group=>this.disposeGroup(group)));for(const output of this.outputs)output.disconnect();this.retiring=null;this.sources=[];this.emit('disposed',{snapshot:this.snapshot()});const rejected=results.find(result=>result.status==='rejected');if(rejected)throw rejected.reason;return{disposed:true,retainedPCMBytes:this.snapshot().retainedPCMBytes};})();return this.disposePromise;}
}
