// Integrated K-weighted loudness, mono/stereo. Coefficient construction adapted
// from MIT libebur128 v1.2.6; see vendor/libebur128/COPYING and PROVENANCE.md.
const energyLUFS=value=>value>0?-.691+10*Math.log10(value):null;
function coefficients(sr){
 let k=Math.tan(Math.PI*1681.974450955533/sr),q=.7071752369554196,vh=10**(3.999843853973347/20),vb=vh**.4996667741545416,a=1+k/q+k*k;
 const shelf={b:[(vh+vb*k/q+k*k)/a,2*(k*k-vh)/a,(vh-vb*k/q+k*k)/a],a:[2*(k*k-1)/a,(1-k/q+k*k)/a]};
 k=Math.tan(Math.PI*38.13547087602444/sr);q=.5003270373238773;a=1+k/q+k*k;
 return[shelf,{b:[1,-2,1],a:[2*(k*k-1)/a,(1-k/q+k*k)/a]}];
}
export function integratedLoudness(channels,sampleRate){
 if(!Array.isArray(channels)||!channels.length||!Number.isFinite(sampleRate)||sampleRate<=0)throw new TypeError('Loudness needs channels and a sample rate.');
 const length=channels[0]?.length;if(!Number.isInteger(length)||!channels.every(a=>ArrayBuffer.isView(a)&&a.length===length))throw new TypeError('Loudness channels must be equal-length PCM arrays.');
 const result={version:'bs1770-integrated-v1',method:'K-weighted integrated loudness with absolute and relative gating',integratedLUFS:null,channels:channels.length,sampleRate,duration:length/sampleRate,wholeInput:true,absoluteGateLUFS:-70,relativeGateLUFS:null,relativeGateLU: -10,blockSeconds:.4,overlap:.75,totalBlocks:0,absoluteGatedBlocks:0,retainedBlocks:0,truePeakMeasured:false};
 if(channels.length>2)return{...result,reason:'channel_layout_required'};
 if(sampleRate<8000)return{...result,reason:'sample_rate_below_supported_range'};
 const hop=Math.round(sampleRate/10),window=4*hop,ring=new Float64Array(window),states=channels.map(()=>[[0,0],[0,0]]),filters=coefficients(sampleRate),blocks=[];let sum=0;
 for(let i=0;i<length;i++){
  let energy=0;
  for(let c=0;c<channels.length;c++){
   let value=channels[c][i];if(!Number.isFinite(value))throw new TypeError('Loudness PCM contains a nonfinite sample.');
   for(let stage=0;stage<2;stage++){const s=states[c][stage],f=filters[stage],y=f.b[0]*value+s[0];s[0]=f.b[1]*value-f.a[0]*y+s[1];s[1]=f.b[2]*value-f.a[1]*y;value=y;}
   energy+=value*value;
  }
  const pos=i%window;sum+=energy-ring[pos];ring[pos]=energy;
  if(i+1>=window&&(i+1-window)%hop===0)blocks.push(Math.max(0,sum/window));
 }
 result.totalBlocks=blocks.length;if(!blocks.length)return{...result,reason:'insufficient_duration_for_400ms_block'};
 const absolute=10**((-70+.691)/10),gated=blocks.filter(v=>v>=absolute);result.absoluteGatedBlocks=gated.length;
 if(!gated.length)return{...result,reason:'below_absolute_gate'};
 const mean=gated.reduce((a,b)=>a+b,0)/gated.length,relative=mean*.1,retained=gated.filter(v=>v>=relative);result.relativeGateLUFS=energyLUFS(relative);result.retainedBlocks=retained.length;result.integratedLUFS=energyLUFS(retained.reduce((a,b)=>a+b,0)/retained.length);result.reason=null;return result;
}
