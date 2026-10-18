// Original PCM playback follows the musical clock per output sample. No UI
// timer or finite look-ahead queue is needed when a tempo-changing loop wraps.
import {createBeatgrid} from './beatgrid.js';
export class WarpLoopKernel {
 constructor(rate){this.outputRate=rate;this.buffers=[];this.timeline=null;this.alive=true;}
 load(buffers){
  if(!Array.isArray(buffers)||![1,5].includes(buffers.length))throw new RangeError('Warp loop needs original PCM and optionally four aligned stems.');
  for(const b of buffers)if(!Number.isFinite(b.sampleRate)||b.sampleRate<=0||!b.channels?.length||b.channels.some(c=>!(c instanceof Float32Array)||c.length!==b.channels[0].length))throw new TypeError('Invalid warp-loop PCM.');
  this.buffers=buffers;
 }
 start(options){this.timeline=createBeatgrid(options.track).timeline(options);this.when=options.when;this.renderedLoop=!!options.renderedLoop;this.grid=createBeatgrid(options.track);const span=options.renderedSpan||options.loop||{start:0,end:options.track.duration};this.loopFirst=this.grid.beatAt(span.start);this.loopSpan=this.grid.beatAt(span.end)-this.loopFirst;this.duration=options.track.duration;this.loop=options.loop;this.endedFrame=null;return{when:this.when,position:this.timeline.clock(this.when),playing:true};}
 process(outputs,time){
  if(!this.alive)return false;
  const frames=outputs[0]?.[0]?.length||128;
  for(let n=0;n<frames;n++){
   const at=time+n/this.outputRate,position=this.timeline?.clock(at),playing=this.timeline&&at>=this.when&&(this.loop||position<this.duration);
   if(this.timeline&&!this.loop&&at>=this.when&&position>=this.duration&&this.endedFrame===null)this.endedFrame=Math.round(at*this.outputRate);
   for(let i=0;i<outputs.length;i++)for(let c=0;c<outputs[i].length;c++){
    const b=this.buffers[i],data=b?.channels[Math.min(c,b.channels.length-1)];let sample=0;
    if(playing&&data){const frame=this.renderedLoop?(this.grid.beatAt(position)-this.loopFirst)/this.loopSpan*data.length:position*b.sampleRate,index=Math.floor(frame),f=frame-index;if(index>=0&&index<data.length)sample=data[index]*(1-f)+(data[index+1]??data[index])*f;}
    if(!Number.isFinite(sample))throw new TypeError('Nonfinite warp-loop PCM.');outputs[i][c][n]=sample;
   }
  }
  return true;
 }
}
