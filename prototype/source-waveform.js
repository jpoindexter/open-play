// Immutable decoded-source profiles. Rendering never scans a whole song or
// changes audio. Peak and energy are unioned across channels, avoiding stereo
// cancellation. Three broad filter bands provide measured frequency contrast;
// they do not claim Serato's proprietary waveform algorithm.
import {performanceColors} from './performance-tokens.js';
const profiles=new WeakMap();
const defer=()=>new Promise(resolve=>setTimeout(resolve,0));

export async function createSourceWaveformProfile(buffer,{blockFrames=256,chunkFrames=65536,yieldTask=defer}={}){
  const {length,sampleRate,numberOfChannels}=buffer;
  if(!Number.isSafeInteger(length)||length<1||!Number.isFinite(sampleRate)||sampleRate<=0||![1,2].includes(numberOfChannels))throw new TypeError('Invalid source waveform geometry.');
  if(!Number.isSafeInteger(blockFrames)||blockFrames<16||!Number.isSafeInteger(chunkFrames)||chunkFrames<blockFrames)throw new RangeError('Invalid source waveform work bounds.');
  const channels=Array.from({length:numberOfChannels},(_,c)=>buffer.getChannelData(c));
  if(channels.some(c=>c.length!==length))throw new TypeError('Unaligned source waveform channels.');
  const blocks=Math.ceil(length/blockFrames),peaks=new Float32Array(blocks);
  const energies=Array.from({length:3},()=>new Float64Array(blocks));
  const lowState=new Float64Array(numberOfChannels),midState=new Float64Array(numberOfChannels);
  const lowAlpha=1-Math.exp(-2*Math.PI*250/sampleRate),midAlpha=1-Math.exp(-2*Math.PI*2500/sampleRate);
  let maximum=0;
  for(let start=0;start<length;start+=chunkFrames){
    for(let i=start;i<Math.min(length,start+chunkFrames);i++){
      const block=Math.floor(i/blockFrames);let eLow=0,eMid=0,eHigh=0;
      for(let c=0;c<channels.length;c++){
        const value=channels[c][i];
        if(!Number.isFinite(value))throw new TypeError('Non-finite source waveform sample.');
        peaks[block]=Math.max(peaks[block],Math.abs(value));maximum=Math.max(maximum,Math.abs(value));
        lowState[c]+=lowAlpha*(value-lowState[c]);midState[c]+=midAlpha*(value-midState[c]);
        const low=lowState[c],mid=midState[c]-low,high=value-midState[c];
        eLow=Math.max(eLow,low*low);eMid=Math.max(eMid,mid*mid);eHigh=Math.max(eHigh,high*high);
      }
      energies[0][block]+=eLow;energies[1][block]+=eMid;energies[2][block]+=eHigh;
    }
    if(start+chunkFrames<length)await yieldTask();
  }
  return {
    sampleRate,length,duration:length/sampleRate,blockFrames,maximum,
    bytes:peaks.byteLength+energies.reduce((n,a)=>n+a.byteLength,0),
    interval(from,to){
      if(!Number.isFinite(from)||!Number.isFinite(to)||to<=from||to<=0||from>=length/sampleRate)return {peak:0,bands:[0,0,0]};
      const first=Math.max(0,Math.floor(from*sampleRate/blockFrames));
      const end=Math.min(blocks,Math.ceil(to*sampleRate/blockFrames));
      let peak=0,frames=0;const sums=[0,0,0];
      for(let b=first;b<end;b++){
        peak=Math.max(peak,peaks[b]);frames+=Math.min(blockFrames,length-b*blockFrames);
        for(let band=0;band<3;band++)sums[band]+=energies[band][b];
      }
      return {peak,bands:sums.map(x=>Math.sqrt(x/(frames||1)))};
    },
  };
}

export function sourceWaveformState(buffer){
  if(!profiles.has(buffer)){
    const state={profile:null,error:null,ready:null};
    state.ready=createSourceWaveformProfile(buffer).then(profile=>(state.profile=profile,profile),error=>{state.error=error;throw error;});
    profiles.set(buffer,state);
  }
  return profiles.get(buffer);
}

function shape(ctx,values,{vertical,x,y,width,height,scale}){
  const count=values.length,center=vertical?x+width/2:y+height/2;
  const extent=(vertical?width:height)*.47;
  ctx.beginPath();
  for(let i=0;i<count;i++){
    const along=i/(count-1||1),amp=Math.min(1,values[i]*scale)*extent;
    const px=vertical?center-amp:x+along*width,py=vertical?y+along*height:center-amp;
    if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
  }
  for(let i=count-1;i>=0;i--){
    const along=i/(count-1||1),amp=Math.min(1,values[i]*scale)*extent;
    ctx.lineTo(vertical?center+amp:x+along*width,vertical?y+along*height:center+amp);
  }
  ctx.closePath();ctx.fill();
}

function paint(ctx,profile,{x=0,y=0,width,height,from,to,vertical=false}){
  const count=Math.max(2,Math.ceil(vertical?height:width)),peaks=new Float32Array(count);
  const bands=Array.from({length:3},()=>new Float32Array(count));
  for(let i=0;i<count;i++){
    const a=from+(to-from)*i/count,b=from+(to-from)*(i+1)/count;
    const sample=profile.interval(a,b);peaks[i]=sample.peak;
    let energy=0;
    for(let band=0;band<3;band++){
      energy+=sample.bands[band]*1.5;
      bands[band][i]=Math.min(sample.peak,energy);
    }
  }
  const scale=.94/Math.max(profile.maximum,.05),geometry={vertical,x,y,width,height,scale};
  ctx.save();
  ctx.fillStyle=performanceColors.wavePeak;ctx.globalAlpha=.35;shape(ctx,peaks,geometry);ctx.globalAlpha=1;
  // Nested source-energy layers: highs cool, mids green, lows warm.
  for(const [band,color] of [[2,performanceColors.waveHigh],[1,performanceColors.waveMid],[0,performanceColors.waveLow]]){
    ctx.fillStyle=color;shape(ctx,bands[band],geometry);
  }
  ctx.restore();
}

export function paintSourceOverview(ctx,buffer,{width,height}){
  const state=sourceWaveformState(buffer);if(!state.profile)return state.error?null:state.ready;
  paint(ctx,state.profile,{width,height,from:0,to:state.profile.duration});return null;
}
export function paintSourceDetail(ctx,buffer,{x=0,width,height,position,span=4}){
  const state=sourceWaveformState(buffer);if(!state.profile)return state.error?null:state.ready;
  paint(ctx,state.profile,{x,width,height,vertical:true,from:position-span/2,to:position+span/2});return null;
}
