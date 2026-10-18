// Independently authored sample-peak limiter. No true-peak/oversampling claim.
export const masterHeadroomDB=3,masterHeadroomGain=10**(-masterHeadroomDB/20);
export const decibels=value=>value>0?20*Math.log10(value):-120;
export function normalizedMasterDB(value){const n=Number(value);return Number.isFinite(n)?Math.max(-12,Math.min(12,n)):0;}
export class MasterOutputKernel{
 constructor(sampleRate){if(!Number.isFinite(sampleRate)||sampleRate<=0)throw new TypeError('Master needs a positive sample rate.');this.gain=1;this.release=Math.exp(-1/(.05*sampleRate));this.reset();}
 reset(){this.peak=[0,0];this.outputPeak=[0,0];this.squares=[0,0];this.frames=0;this.minimumGain=1;this.invalid=0;}
 process(input,output){
  const frames=output[0]?.length||0;
  for(let i=0;i<frames;i++){
   let l=input[0]?.[i]??0,r=input[1]?.[i]??l;
   if(!Number.isFinite(l)){l=0;this.invalid++;}if(!Number.isFinite(r)){r=0;this.invalid++;}
   const peak=Math.max(Math.abs(l),Math.abs(r))*masterHeadroomGain,target=peak>1?1/peak:1;
   this.gain=Math.min(target,1-(1-this.gain)*this.release);
   const a=l*masterHeadroomGain*this.gain,b=r*masterHeadroomGain*this.gain;
   output[0][i]=a;if(output[1])output[1][i]=b;
   this.peak[0]=Math.max(this.peak[0],Math.abs(l));this.peak[1]=Math.max(this.peak[1],Math.abs(r));
   this.outputPeak[0]=Math.max(this.outputPeak[0],Math.abs(a));this.outputPeak[1]=Math.max(this.outputPeak[1],Math.abs(b));
   this.squares[0]+=l*l;this.squares[1]+=r*r;this.minimumGain=Math.min(this.minimumGain,this.gain);
  }
  this.frames+=frames;
 }
 snapshot(){return{frames:this.frames,peak:[...this.peak],rms:this.squares.map(v=>Math.sqrt(v/Math.max(1,this.frames))),outputPeak:[...this.outputPeak],gainReductionDB:Math.max(0,-decibels(this.minimumGain)),invalid:this.invalid};}
}
