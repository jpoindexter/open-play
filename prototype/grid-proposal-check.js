import {createBeatgrid} from './beatgrid.js';
const median=a=>{const s=[...a].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const percentile=(a,p)=>{const s=[...a].sort((a,b)=>a-b),at=(s.length-1)*p,lo=Math.floor(at);return s[lo]+(s[Math.ceil(at)]-s[lo])*(at-lo);};
// Compare the same complete energy onsets, not newly selected peaks after warping.
export function checkGridProposal(pcm,sampleRate,reference,suggestion){
  const duration=pcm.length/sampleRate;
  const before=createBeatgrid({duration,bpm:reference.bpm,grid:reference.firstBeat});
  const after=createBeatgrid({duration,bpm:suggestion.bpm,grid:suggestion.firstBeat,gridWarpMarkers:suggestion.markers});
  if(!before||!after)throw new TypeError('A proposal needs valid reference and proposed grids');
  const factor=Math.max(1,Math.floor(sampleRate/11025)),rate=sampleRate/factor;
  const hp=Math.exp(-2*Math.PI*35/rate),lp=1-Math.exp(-2*Math.PI*250/rate),sections=[];
  function filter(samples){
    let high=0,low=0,previous=0;
    for(let i=0;i<samples.length;i++){const x=samples[i];high=hp*(high+x-previous);previous=x;low+=lp*(high-low);samples[i]=low;}
  }
  let events=0;
  for(let start=0;start<duration;start+=20){
    const from=Math.max(0,Math.floor((start-1)*sampleRate)),to=Math.min(pcm.length,Math.ceil((start+21)*sampleRate));
    const samples=new Float64Array(Math.ceil((to-from)/factor));
    for(let i=0;i<samples.length;i++){
      let sum=0,count=0;
      for(let j=from+i*factor;j<Math.min(to,from+(i+1)*factor);j++){sum+=pcm[j];count++;}
      samples[i]=sum/count;
    }
    filter(samples);samples.reverse();filter(samples);samples.reverse();
    const size=Math.max(1,Math.round(.005*rate)),env=new Float64Array(Math.max(0,samples.length-size+1));
    let power=0;
    for(let i=0;i<samples.length;i++){power+=samples[i]*samples[i];if(i>=size)power-=samples[i-size]*samples[i-size];if(i>=size-1)env[i-size+1]=Math.sqrt(Math.max(0,power/size));}
    const origin=from/sampleRate+size/(2*rate),oldErrors=[],newErrors=[];
    for(let beat=Math.max(0,Math.ceil(before.beatAt(start)));before.timeAt(beat)<Math.min(duration,start+20);beat++){
      const at=before.timeAt(beat),lo=Math.max(0,Math.round((at-.08-origin)*rate)),hi=Math.min(env.length,Math.round((at+.12-origin)*rate));
      if(hi-lo<Math.round(.18*rate))continue;
      let peak=lo,minimum=Infinity;
      for(let i=lo;i<hi;i++){if(env[i]>env[peak])peak=i;minimum=Math.min(minimum,env[i]);}
      const maximum=env[peak],threshold=maximum*.5;
      if(maximum<1e-5||peak-lo<Math.round(.02*rate)||hi-peak<Math.round(.02*rate)||env[lo]>=threshold||maximum<2.5*minimum)continue;
      let crossing=-1;
      for(let i=lo;i<peak;i++)if(env[i]<threshold&&env[i+1]>=threshold)crossing=i;
      if(crossing<0)continue;
      const time=origin+(crossing+(threshold-env[crossing])/(env[crossing+1]-env[crossing]))/rate;
      if(time<=at-.075||time>=at+.115)continue;
      oldErrors.push(time-at);newErrors.push(time-after.timeAt(beat));events++;
    }
    if(oldErrors.length>=8)sections.push({from:start,events:oldErrors.length,before:median(oldErrors),after:median(newErrors)});
  }
  if(sections.length<3||events<100)return {method:'complete-energy-onsets-v1',status:'insufficient',events,sections:sections.length};
  const old=sections.map(s=>Math.abs(s.before)),next=sections.map(s=>Math.abs(s.after));
  const oldMedian=median(old),newMedian=median(next),oldP95=percentile(old,.95),newP95=percentile(next,.95);
  const worse=newMedian-oldMedian>.003||newP95-oldP95>.003;
  const improved=!worse&&(oldMedian-newMedian>.003||oldP95-newP95>.005);
  return {method:'complete-energy-onsets-v1',status:worse?'worse':improved?'improved':'inconclusive',events,sections:sections.length,
    beforeMedianSeconds:oldMedian,afterMedianSeconds:newMedian,beforeP95Seconds:oldP95,afterP95Seconds:newP95};
}
