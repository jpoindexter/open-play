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
 start(options){this.timeline=createBeatgrid(options.track).timeline(options);this.when=options.when;this.renderedLoop=!!options.renderedLoop;this.grid=createBeatgrid(options.track);this.loopFirst=this.grid.beatAt(options.loop.start);this.loopSpan=this.grid.beatAt(options.loop.end)-this.loopFirst;return{when:this.when,position:this.timeline.clock(this.when),playing:true};}
 process(outputs,time){
  if(!this.alive)return false;
  const frames=outputs[0]?.[0]?.length||128;
  for(let n=0;n<frames;n++){
   const at=time+n/this.outputRate,position=this.timeline?.clock(at),playing=this.timeline&&at>=this.when;
   for(let i=0;i<outputs.length;i++)for(let c=0;c<outputs[i].length;c++){
    const b=this.buffers[i],data=b?.channels[Math.min(c,b.channels.length-1)];let sample=0;
    if(playing&&data){const frame=this.renderedLoop?(this.grid.beatAt(position)-this.loopFirst)/this.loopSpan*data.length:position*b.sampleRate,index=Math.floor(frame),f=frame-index;if(index>=0&&index<data.length)sample=data[index]*(1-f)+(data[index+1]??data[index])*f;}
    if(!Number.isFinite(sample))throw new TypeError('Nonfinite warp-loop PCM.');outputs[i][c][n]=sample;
   }
  }
  return true;
 }
}
