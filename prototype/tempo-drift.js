import {checkGridProposal} from './grid-proposal-check.js';
// Full-track bass-pulse check; proposals stay separate from the saved grid.
const median=values=>{const a=[...values].sort((a,b)=>a-b),m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;};
function pulseEnvelope(pcm,sampleRate){
  const factor=Math.max(1,Math.floor(sampleRate/11025)),rate=sampleRate/factor,hop=64;
  const flux=new Float64Array(Math.ceil(pcm.length/factor/hop));
  const hp=Math.exp(-2*Math.PI*35/rate),lp=1-Math.exp(-2*Math.PI*250/rate);
  let high=0,low=0,previous=0,power=0,priorEnergy=0,count=0,frame=0;
  for(let i=0;i<pcm.length;i+=factor){
    let sample=0;const end=Math.min(pcm.length,i+factor);
    for(let j=i;j<end;j++)sample+=pcm[j];sample/=(end-i);
    if(!Number.isFinite(sample))throw new TypeError('PCM contains a non-finite sample');
    high=hp*(high+sample-previous);previous=sample;low+=lp*(high-low);power+=low*low;
    if(++count===hop){const energy=Math.sqrt(power/hop);flux[frame++]=Math.max(0,energy-priorEnergy);priorEnergy=energy;count=0;power=0;}
  }
  return {flux,frameRate:rate/hop};
}
function simplify(points,tolerance=.005){
  if(points.length<3)return points;
  const first=points[0],last=points.at(-1);let maximum=0,split=0;
  for(let i=1;i<points.length-1;i++){
    const p=points[i],predicted=first.time+(last.time-first.time)*(p.beat-first.beat)/(last.beat-first.beat);
    const error=Math.abs(p.time-predicted);if(error>maximum){maximum=error;split=i;}
  }
  return maximum>tolerance?[...simplify(points.slice(0,split+1),tolerance).slice(0,-1),...simplify(points.slice(split),tolerance)]:[first,last];
}
function propose(windows,{bpm,firstBeat,duration,baseline}){
  const period=60/bpm;
  const points=simplify([{beat:0,time:firstBeat},...windows.map(w=>({beat:w.beat,time:firstBeat+w.beat*period+w.residualSeconds-baseline}))]);
  if(points.length<3||points.length>64)return null;
  const tempos=points.slice(1).map((p,i)=>60*(p.beat-points[i].beat)/(p.time-points[i].time));
  if(tempos.some(n=>!Number.isFinite(n)||n<1||n>999||Math.abs(n/bpm-1)>.02))return null;
  const markers=points.slice(1,-1).map((p,i)=>({time:p.time,bpm:tempos[i+1]}));
  if(markers.some(m=>m.time<=firstBeat||m.time>=duration))return null;
  return {bpm:tempos[0],firstBeat,markers};
}
export function measureTempoDrift(pcm,sampleRate,{bpm,firstBeat,fitDuration=180}){
  if(!(pcm instanceof Float32Array||pcm instanceof Float64Array)||!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)
    throw new TypeError('Expected floating-point PCM and a supported sample rate');
  if(!Number.isFinite(bpm)||bpm<=0||!Number.isFinite(firstBeat)||firstBeat<0)throw new TypeError('Invalid drift reference grid');
  const duration=pcm.length/sampleRate,{flux,frameRate}=pulseEnvelope(pcm,sampleRate),period=60/bpm;
  const peak=flux.reduce((a,b)=>Math.max(a,b),0),average=flux.reduce((a,b)=>a+b,0)/(flux.length||1);
  const threshold=Math.max(peak*.08,average*1.5,1e-8),groups=new Map();
  for(let beat=0,at=firstBeat;at<duration;beat++,at=firstBeat+beat*period){
    const radius=Math.min(.08,period*.15),lo=Math.max(1,Math.ceil((at-radius)*frameRate)),hi=Math.min(flux.length-2,Math.floor((at+radius)*frameRate));
    let index=-1,best=threshold;
    for(let i=lo;i<=hi;i++)if(flux[i]>best&&flux[i]>=flux[i-1]&&flux[i]>flux[i+1]){best=flux[i];index=i;}
    if(index<0)continue;
    const den=flux[index-1]-2*flux[index]+flux[index+1];
    const delta=den?Math.max(-.5,Math.min(.5,.5*(flux[index-1]-flux[index+1])/den)):0;
    const time=(index+delta)/frameRate,key=Math.floor(at/20);
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push({beat,residual:time-at});
  }
  const windows=[];
  for(const [key,rows]of groups){
    const span=Math.min(20,duration-key*20),residual=median(rows.map(r=>r.residual));
    const mad=median(rows.map(r=>Math.abs(r.residual-residual)));
    if(rows.length<Math.max(8,span/period*.5)||mad>.018)continue;
    windows.push({from:key*20,to:Math.min(duration,(key+1)*20),beat:Math.round(median(rows.map(r=>r.beat))),residualSeconds:residual,spreadSeconds:mad,beats:rows.length});
  }
  const base=windows.filter(w=>w.to<=Math.min(fitDuration,duration));
  const baseline=base.length?median(base.map(w=>w.residualSeconds)):0;
  const supportedFraction=windows.length/Math.max(1,Math.ceil(duration/20));
  const supported=windows.length>=3&&base.length>=2&&supportedFraction>=.75;
  const maximum=supported?Math.max(...windows.map(w=>Math.abs(w.residualSeconds-baseline))):0;
  const detected=supported&&windows.some((w,i)=>i>0&&w.from===windows[i-1].to&&Math.abs(w.residualSeconds-baseline)>.010&&Math.abs(windows[i-1].residualSeconds-baseline)>.010);
  let suggestion=detected?propose(windows,{bpm,firstBeat,duration,baseline}):null;
  const proposalCheck=suggestion?checkGridProposal(pcm,sampleRate,{bpm,firstBeat},suggestion):null;
  if(proposalCheck?.status!=='improved')suggestion=null;
  return {method:'windowed-bass-pulse-drift-v4',checkedDuration:duration,detected,maximumResidualSeconds:maximum,
    supported,supportedFraction,windows,baselineSeconds:baseline,proposalCheck,suggestion,
    limitation:'Estimated pulse timing, not verified kicks or downbeats. Review the proposal and Save explicitly; existing grids are never replaced automatically.'};
}
