// Immutable decoded-source profiles. Rendering never scans a whole song or
// changes audio. Peak and energy are unioned across channels, avoiding stereo
// cancellation. Three independent display filter bands provide measured frequency contrast;
// they do not claim Serato's proprietary waveform algorithm.
const profiles=new WeakMap();
const defer=()=>new Promise(resolve=>setTimeout(resolve,0));

export async function createSourceWaveformProfile(buffer,{blockFrames=128,chunkFrames=65536,yieldTask=defer}={}){
  const {length,sampleRate,numberOfChannels}=buffer;
  if(!Number.isSafeInteger(length)||length<1||!Number.isFinite(sampleRate)||sampleRate<=0||![1,2].includes(numberOfChannels))throw new TypeError('Invalid source waveform geometry.');
  if(!Number.isSafeInteger(blockFrames)||blockFrames<16||!Number.isSafeInteger(chunkFrames)||chunkFrames<blockFrames)throw new RangeError('Invalid source waveform work bounds.');
  const channels=Array.from({length:numberOfChannels},(_,c)=>buffer.getChannelData(c));
  if(channels.some(c=>c.length!==length))throw new TypeError('Unaligned source waveform channels.');
  const blocks=Math.ceil(length/blockFrames),peaks=new Float32Array(blocks);
  const minima=new Float32Array(blocks),maxima=new Float32Array(blocks),sourceEnergy=new Float64Array(blocks);
  const energies=Array.from({length:3},()=>new Float64Array(blocks));
  const filters=[biquad('low',250,sampleRate),biquad('high',250,sampleRate),biquad('low',2500,sampleRate),biquad('high',2500,sampleRate)];
  const filterStates=filters.map(()=>new Float64Array(numberOfChannels*2));
  let maximum=0;
  for(let start=0;start<length;start+=chunkFrames){
    for(let i=start;i<Math.min(length,start+chunkFrames);i++){
      const block=Math.floor(i/blockFrames);let eLow=0,eMid=0,eHigh=0,eSource=0;
      for(let c=0;c<channels.length;c++){
        const value=channels[c][i];
        if(!Number.isFinite(value))throw new TypeError('Non-finite source waveform sample.');
        peaks[block]=Math.max(peaks[block],Math.abs(value));maximum=Math.max(maximum,Math.abs(value));
        minima[block]=Math.min(minima[block],value);maxima[block]=Math.max(maxima[block],value);eSource=Math.max(eSource,value*value);
        const low=filterSample(filters[0],filterStates[0],c,value);
        const mid=filterSample(filters[2],filterStates[2],c,filterSample(filters[1],filterStates[1],c,value));
        const high=filterSample(filters[3],filterStates[3],c,value);
        eLow=Math.max(eLow,low*low);eMid=Math.max(eMid,mid*mid);eHigh=Math.max(eHigh,high*high);
      }
      sourceEnergy[block]+=eSource;
      energies[0][block]+=eLow;energies[1][block]+=eMid;energies[2][block]+=eHigh;
    }
    if(start+chunkFrames<length)await yieldTask();
  }
  return {
    sampleRate,length,duration:length/sampleRate,blockFrames,maximum,
    bytes:peaks.byteLength+minima.byteLength+maxima.byteLength+sourceEnergy.byteLength+energies.reduce((n,a)=>n+a.byteLength,0),
    interval(from,to){
      if(!Number.isFinite(from)||!Number.isFinite(to)||to<=from||to<=0||from>=length/sampleRate)return {peak:0,minimum:0,maximum:0,rms:0,bands:[0,0,0]};
      const first=Math.max(0,Math.floor(from*sampleRate/blockFrames));
      const end=Math.min(blocks,Math.ceil(to*sampleRate/blockFrames));
      let peak=0,minimum=0,maximum=0,total=0,frames=0;const sums=[0,0,0];
      for(let b=first;b<end;b++){
        peak=Math.max(peak,peaks[b]);minimum=Math.min(minimum,minima[b]);maximum=Math.max(maximum,maxima[b]);total+=sourceEnergy[b];frames+=Math.min(blockFrames,length-b*blockFrames);
        for(let band=0;band<3;band++)sums[band]+=energies[band][b];
      }
      return {peak,minimum,maximum,rms:Math.sqrt(total/(frames||1)),bands:sums.map(x=>Math.sqrt(x/(frames||1)))};
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

// Display-only Butterworth crossovers. They never enter the audio graph.
function biquad(kind,frequency,sampleRate){
  const w=2*Math.PI*Math.min(frequency,sampleRate*.45)/sampleRate,cos=Math.cos(w),alpha=Math.sin(w)/Math.SQRT2,a0=1+alpha;
  const b0=(kind==='low'?1-cos:1+cos)/2;
  return [b0/a0,(kind==='low'?2:-2)*b0/a0,b0/a0,-2*cos/a0,(1-alpha)/a0];
}
function filterSample(k,state,channel,input){
  const i=channel*2,out=k[0]*input+state[i];
  state[i]=k[1]*input-k[3]*out+state[i+1];state[i+1]=k[2]*input-k[4]*out;
  return out;
}
// Additive RGB per source-time slice. Fixed display compensation lets small
// treble transients remain legible without assigning a made-up track color.
export function sourceSpectrumRGB(bands){
  const levels=[bands[0],bands[1]*2,bands[2]*3],maximum=Math.max(...levels);
  return maximum>1e-12?levels.map(value=>Math.round(255*(value/maximum)**1.3)):[0,0,0];
}
function paint(ctx,profile,{x=0,y=0,width,height,from,to,vertical=false}){
  const resolution=Math.min(3,Math.max(1,Math.abs(ctx.getTransform?.().a||1)));
  const along=vertical?height:width,count=Math.max(2,Math.ceil(along*resolution)),strip=along/count;
  const center=vertical?x+width/2:y+height/2,extent=(vertical?width:height)*.46;
  const scale=.94/Math.max(profile.maximum,.05);
  ctx.save();
  for(let i=0;i<count;i++){
    const sample=profile.interval(from+(to-from)*i/count,from+(to-from)*(i+1)/count);
    if(sample.peak<1e-7)continue;
    const rgb=sourceSpectrumRGB(sample.bands);ctx.fillStyle=`rgb(${rgb.join(',')})`;
    const draw=(minimum,maximum,alpha)=>{
      const lo=Math.max(-1,minimum*scale)*extent,hi=Math.min(1,maximum*scale)*extent;
      ctx.globalAlpha=alpha;
      if(vertical)ctx.fillRect(center-hi,y+i*strip,Math.max(.5/resolution,hi-lo),strip+.15/resolution);
      else ctx.fillRect(x+i*strip,center-hi,strip+.15/resolution,Math.max(.5/resolution,hi-lo));
    };
    draw(sample.minimum,sample.maximum,.38);
    const body=sample.rms*1.5;
    draw(Math.max(sample.minimum,-body),Math.min(sample.maximum,body),1);
  }
  ctx.restore();
}

export function paintSourceOverview(ctx,buffer,{width,height}){
  const state=sourceWaveformState(buffer);if(!state.profile)return state.error?null:state.ready;
  paint(ctx,state.profile,{width,height,from:0,to:state.profile.duration});return null;
}
export function paintSourceDetail(ctx,buffer,{x=0,y=0,width,height,position,span=4,vertical=true}){
  const state=sourceWaveformState(buffer);if(!state.profile)return state.error?null:state.ready;
  paint(ctx,state.profile,{x,y,width,height,vertical,from:position-span/2,to:position+span/2});return null;
}
