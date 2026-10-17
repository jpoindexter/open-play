// Ordinary whole-deck raw PCM scratching. Independent policy, distinct from
// selected-stem Slip. Seconds are ORIGINAL track seconds, at every input rate.
export const deckScratchPolicy = Object.freeze({
  outputs:['original','vocals','other','bass','drums'],
  channels:'1–8 output channels; mono duplicates, otherwise discrete channel indices with zero-fill. No speaker-layout downmix.',
  interpolation:'Linear interpolation; independent 3ms head crossfade and amplitude ramps.',
  watchdogMilliseconds:120,maxVelocity:16,
  release:'Non-Slip commits audible position; clear active loop if outside it. Slip rejoins the prior signed-rate/loop backing clock. Paused audition stays paused.',
  limitations:'No keylock, anti-alias/high-speed scratch quality, vendor curve, DVS/hardware or native acceptance.'
});
const finite=(value,name)=>{if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be finite.`);return value;};
const integer=(value,name,min=1,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(`${name} is out of range.`);return value;};
const boolean=(value,name)=>{if(typeof value!=='boolean')throw new TypeError(`${name} must be boolean.`);return value;};
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const signedRate=s=>s.rate*(s.reverse?-1:1);
const copyLoop=loop=>loop?{start:loop.start,end:loop.end}:null;
export function advanceDeckScratchPosition(position,delta,duration,loop=null){
  const next=position+delta;
  if(loop){const size=loop.end-loop.start;return next>=loop.end||next<loop.start?loop.start+((next-loop.start)%size+size)%size:next;}
  return clamp(next,0,duration);
}
function sourceRecord(source){
  if(!source||typeof source!=='object')throw new TypeError('PCM source required.');
  const sampleRate=finite(source.sampleRate,'Input sample rate');if(sampleRate<=0||sampleRate>768000)throw new RangeError('Input sample rate is out of range.');
  if(!Array.isArray(source.channels)||source.channels.length<1||source.channels.length>8)throw new RangeError('PCM requires 1–8 channels.');
  const length=source.channels[0]?.length;integer(length,'PCM frame length',1,0x7fffffff);
  if(source.channels.some(c=>!(c instanceof Float32Array)||c.length!==length))throw new TypeError('PCM channels must be equal-length Float32Arrays.');
  return {sampleRate,length,channels:[...source.channels]};
}
export class DeckScratchKernel{
  constructor(sampleRate,{outputChannels=2,rampMilliseconds=3,watchdogMilliseconds=120}={}){
    finite(sampleRate,'Render sample rate');if(sampleRate<=0||sampleRate>768000)throw new RangeError('Render sample rate is out of range.');
    integer(outputChannels,'Output channels',1,8);finite(rampMilliseconds,'Ramp duration');finite(watchdogMilliseconds,'Watchdog duration');
    if(rampMilliseconds<0||rampMilliseconds>50||watchdogMilliseconds<10||watchdogMilliseconds>1000)throw new RangeError('Scratch timing policy out of range.');
    this.sr=sampleRate;this.outputChannels=outputChannels;this.rampFrames=Math.max(1,Math.round(sampleRate*rampMilliseconds/1000));this.watchdogSeconds=watchdogMilliseconds/1000;
    this.sources=[];this.generation=0;this.lastGesture=0;this.gesture=0;this.owner=null;this.phase='idle';this.duration=0;this.position=0;this.cursor=0;this.rate=1;this.reverse=false;this.loop=null;this.slip=false;this.playing=false;this.audition=false;this.velocity=0;this.audioTime=0;this.startAt=0;this.lastMove=0;this.hidden=null;this.transition=null;this.gain=0;this.targetGain=0;this.gainLeft=0;this.reason='empty';this.ended=false;this.disposed=false;this.sanitizedSamples=0;
  }
  load({generation,original,stems=null}={}){
    if(this.disposed)throw new Error('Scratch processor disposed.');integer(generation,'Load generation');
    if(generation<=this.generation)return this.state({ignored:'stale-generation'});
    const first=sourceRecord(original),duration=first.length/first.sampleRate;
    if(stems!==null&&(!Array.isArray(stems)||stems.length!==4))throw new RangeError('Provide all four aligned stems or none.');
    const prepared=stems?.map(sourceRecord)||[];
    if(prepared.length){const ref=prepared[0];if(prepared.some(s=>s.sampleRate!==ref.sampleRate||s.length!==ref.length||Math.abs(s.length/s.sampleRate-duration)>.1))throw new RangeError('Stem PCM is not aligned to the original.');}
    // Metadata-only validation here; finite scanning/copying belongs off the
    // audio thread. sample() also sanitizes every actually read value.
    this.sources=[first,...prepared];this.generation=generation;this.duration=duration;this.position=this.cursor=0;this.owner=null;this.gesture=this.lastGesture=0;this.phase='idle';this.playing=this.audition=false;this.velocity=0;this.hidden=this.transition=null;this.gain=this.targetGain=0;this.gainLeft=0;this.loop=null;this.reverse=false;this.rate=1;this.slip=false;this.ended=false;this.startAt=this.lastMove=this.audioTime;this.sanitizedSamples=0;this.reason='loaded';return this.state();
  }
  positionValue(value){return clamp(finite(value,'Position'),0,this.duration);}
  loopValue(value){if(value===null)return null;if(!value||typeof value!=='object')throw new TypeError('Loop requires start/end or null.');const start=finite(value.start,'Loop start'),end=finite(value.end,'Loop end');if(start<0||end<=start||end>this.duration)throw new RangeError('Loop is outside the original track.');return {start,end};}
  rateValue(value){finite(value,'Rate');if(value<=0||value>16)throw new RangeError('Rate must be >0 and ≤16.');return value;}
  ownerValue(data){if(typeof data.owner!=='string'||!data.owner.length||data.owner.length>256)throw new TypeError('Gesture owner required.');integer(data.gesture,'Gesture sequence');}
  setGain(target){if(target===this.targetGain)return;this.targetGain=target;this.gainLeft=this.rampFrames;}
  changeHead(position,velocity,oldLoop=this.phase==='idle'?this.loop:null){
    this.transition={position:this.cursor,velocity:this.velocity,loop:copyLoop(oldLoop),left:this.rampFrames};this.cursor=position;this.velocity=velocity;
  }
  finish(reason='released'){
    if(this.phase!=='scratching')return;
    const final=this.hidden?this.hidden.position:this.cursor,wasPlaying=this.hidden?this.hidden.playing:this.playing;
    if(!this.hidden&&this.loop&&(final<this.loop.start||final>=this.loop.end)){this.loop=null;reason+='-outside-loop-cleared';}
    this.position=final;this.changeHead(final,wasPlaying?signedRate(this):0,null);this.playing=wasPlaying;this.phase='idle';this.owner=null;this.gesture=0;this.hidden=null;this.audition=false;this.reason=reason;
    if(!this.loop&&((this.reverse&&this.position<=0)||(!this.reverse&&this.position>=this.duration))){this.playing=false;this.velocity=0;this.ended=true;}
    this.setGain(this.playing?1:0);
  }
  command(type,data={}){
    if(type==='dispose'){this.dispose();return this.state();}
    if(this.disposed)throw new Error('Scratch processor disposed.');
    if(type==='invalidate'){
      integer(data.generation,'Load generation');if(data.generation<this.generation)return this.state({ignored:'stale-generation'});
      this.generation=data.generation;this.sources=[];this.transition=this.hidden=null;this.owner=null;this.gesture=0;this.playing=this.audition=false;this.velocity=this.gain=this.targetGain=0;this.gainLeft=0;this.position=this.cursor=this.duration=0;this.loop=null;this.phase='empty';this.reason='load-invalidated';return this.state();
    }
    if(!this.sources.length)throw new Error('Load scratch PCM first.');integer(data.generation,'Load generation');
    if(data.generation!==this.generation)return this.state({ignored:'stale-generation'});
    if(['begin','scratch','end'].includes(type))this.ownerValue(data);
    if(type==='begin'){
      if(data.gesture<=this.lastGesture)return this.state({ignored:'stale-gesture'});
      this.finish('replaced-gesture');this.lastGesture=data.gesture;this.gesture=data.gesture;this.owner=data.owner;
      const prior=signedRate(this);this.hidden=this.slip?{position:this.position,rate:prior,loop:copyLoop(this.loop),playing:this.playing}:null;
      this.changeHead(this.position,0,this.loop);this.phase='scratching';this.audition=true;this.lastMove=this.audioTime;this.setGain(0);this.reason='touch';
    }else if(type==='scratch'||type==='end'){
      if(this.phase!=='scratching'||data.owner!==this.owner||data.gesture!==this.gesture)return this.state({ignored:'stale-owner'});
      if(type==='end')this.finish();
      else{const position=this.positionValue(data.position),velocity=finite(data.velocity,'Scratch velocity');if(Math.abs(velocity)>16)throw new RangeError('Scratch velocity must be within ±16.');this.changeHead(position,velocity,null);if(!this.hidden)this.position=position;this.lastMove=this.audioTime;this.ended=false;this.setGain(velocity===0?0:1);this.reason='move';}
    }else if(type==='configure'){
      // Validate every scalar before changing an existing live transport.
      const position=this.positionValue(data.position??0),rate=this.rateValue(data.rate??1),reverse=boolean(data.reverse??false,'Reverse'),loop=this.loopValue(data.loop??null),playing=boolean(data.playing??false,'Playing'),slip=boolean(data.slip??false,'Slip'),startAt=finite(data.startAt??this.audioTime,'Scheduled start');if(startAt<0)throw new RangeError('Scheduled start is negative.');
      this.finish('configure');this.rate=rate;this.reverse=reverse;this.loop=loop;this.slip=slip;this.position=position;this.changeHead(position,playing?signedRate(this):0);this.playing=playing;this.audition=false;this.startAt=startAt;this.ended=false;this.reason='configured';this.setGain(playing?1:0);
    }else if(type==='seek'){
      const position=this.positionValue(data.position);this.finish('seek');this.position=position;this.changeHead(position,this.playing?signedRate(this):0);this.ended=false;this.reason='seek';
    }else if(type==='rate'){
      const rate=this.rateValue(data.rate);this.finish('rate');this.rate=rate;this.changeHead(this.position,this.playing?signedRate(this):0);this.reason='rate';
    }else if(type==='reverse'){
      const reverse=boolean(data.reverse,'Reverse');this.finish('reverse');this.reverse=reverse;this.changeHead(this.position,this.playing?signedRate(this):0);this.reason='reverse';
    }else if(type==='loop'){
      const loop=this.loopValue(data.loop);this.finish('loop');this.loop=loop;this.reason='loop';
    }else if(type==='slip'){
      const slip=boolean(data.slip,'Slip');this.finish('slip');this.slip=slip;this.reason='slip';
    }else if(type==='pause'){
      this.finish('pause');this.playing=false;this.velocity=0;this.audition=false;this.reason='pause';this.setGain(0);
    }else if(type==='play'){
      const startAt=finite(data.startAt??this.audioTime,'Scheduled start');if(startAt<0)throw new RangeError('Scheduled start is negative.');this.finish('play');this.playing=true;this.velocity=signedRate(this);this.startAt=startAt;this.ended=false;this.reason='play';this.setGain(1);
    }else if(type==='cancel'){this.finish('cancel');this.reason='cancel';}
    else throw new RangeError('Unknown ordinary scratch command.');
    return this.state();
  }
  sample(sourceIndex,channel,position){
    const source=this.sources[sourceIndex];if(!source||position<0||position>=this.duration)return 0;
    const samples=source.channels.length===1?source.channels[0]:source.channels[channel];if(!samples)return 0;
    const at=position*source.sampleRate,index=Math.floor(at),fraction=at-index;if(index<0||index>=source.length)return 0;
    const a=samples[index],b=index+1<Math.min(source.length,Math.ceil(this.duration*source.sampleRate))?samples[index+1]:0;
    if(!Number.isFinite(a)||!Number.isFinite(b)){this.sanitizedSamples++;return 0;}
    const value=a+(b-a)*fraction;if(!Number.isFinite(value)){this.sanitizedSamples++;return 0;}return value;
  }
  process(outputs,startTime=this.audioTime){
    let frames=0;for(const output of outputs)for(const channel of output){channel.fill(0);if(!frames)frames=channel.length;}
    if(this.disposed)return false;
    if(!Number.isFinite(startTime)||startTime<0)throw new TypeError('Audio clock must be finite and nonnegative.');
    for(let frame=0;frame<frames;frame++){
      const now=startTime+frame/this.sr;if(now<this.startAt)continue;
      if(this.phase==='scratching'&&this.velocity!==0&&now-Math.max(this.lastMove,this.startAt)>=this.watchdogSeconds){this.velocity=0;this.setGain(0);this.reason='watchdog-hold';}
      if(this.gainLeft>0){this.gain+=(this.targetGain-this.gain)/this.gainLeft;this.gainLeft--;if(!this.gainLeft)this.gain=this.targetGain;}
      const active=this.playing||this.audition||this.gain>0;
      if(active&&this.gain>0)for(let source=0;source<5;source++)for(let channel=0;channel<Math.min(this.outputChannels,outputs[source]?.length||0);channel++){
        let value=this.sample(source,channel,this.cursor);
        if(this.transition){const old=this.sample(source,channel,this.transition.position),mix=this.transition.left/this.rampFrames;value=value*(1-mix)+old*mix;}
        const out=value*this.gain;outputs[source][channel][frame]=Number.isFinite(out)?out:0;
      }
      if(this.phase==='scratching'){
        this.cursor=advanceDeckScratchPosition(this.cursor,this.velocity/this.sr,this.duration);
        if(this.hidden){if(this.hidden.playing){this.hidden.position=advanceDeckScratchPosition(this.hidden.position,this.hidden.rate/this.sr,this.duration,this.hidden.loop);if(!this.hidden.loop&&((this.hidden.rate>0&&this.hidden.position>=this.duration)||(this.hidden.rate<0&&this.hidden.position<=0)))this.hidden.playing=false;}this.position=this.hidden.position;}
        else this.position=this.cursor;
      }else if(this.playing){
        this.position=advanceDeckScratchPosition(this.position,signedRate(this)/this.sr,this.duration,this.loop);this.cursor=this.position;
        if(!this.loop&&((this.reverse&&this.position<=0)||(!this.reverse&&this.position>=this.duration))){this.playing=false;this.velocity=0;this.ended=true;this.reason='ended';this.setGain(0);}
      }
      if(this.transition){this.transition.position=advanceDeckScratchPosition(this.transition.position,this.transition.velocity/this.sr,this.duration,this.transition.loop);if(--this.transition.left<=0)this.transition=null;}
    }
    this.audioTime=startTime+frames/this.sr;return true;
  }
  state(extra={}){return {generation:this.generation,gesture:this.gesture,lastGesture:this.lastGesture,owner:this.owner,phase:this.phase,position:this.position,audiblePosition:this.cursor,rate:this.rate,reverse:this.reverse,loop:copyLoop(this.loop),slip:this.slip,playing:this.playing,audition:this.audition,velocity:this.velocity,duration:this.duration,startAt:this.startAt,audioTime:this.audioTime,reason:this.reason,ended:this.ended,disposed:this.disposed,sourceCount:this.sources.length,outputChannels:this.outputChannels,sanitizedSamples:this.sanitizedSamples,hidden:this.hidden&&{...this.hidden,loop:copyLoop(this.hidden.loop)},...extra};}
  dispose(){if(this.disposed)return;this.disposed=true;this.sources=[];this.transition=this.hidden=null;this.owner=null;this.gesture=0;this.playing=this.audition=false;this.velocity=this.gain=this.targetGain=0;this.gainLeft=0;this.position=this.cursor=this.duration=0;this.loop=null;this.phase='disposed';this.reason='disposed';}
}
