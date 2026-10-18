// Independently authored trapezoidal integrators. Constant-parameter response
// follows the existing Web Audio LPF policy, including its Q-in-dB semantics.
// Keep all eight branches warm so a slope change never starts from zero state.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const starts=[0,0,1,3,6],channels=32;
export class LPFKernel {
 constructor(rate){
  this.rate=rate;
  this.z1=new Float64Array(10*channels);
  this.z2=new Float64Array(10*channels);
  this.poles=new Float64Array(4*channels);
  this.weights=new Float64Array(8);
  this.a1=new Float64Array(5);this.a2=new Float64Array(5);this.a3=new Float64Array(5);
  this.fade=1-Math.exp(-1/(.005*rate));this.initialized=false;
  this.lastCutoff=NaN;this.lastResonance=NaN;
 }
 coefficients(cutoff,resonance){
  if(cutoff===this.lastCutoff&&resonance===this.lastResonance)return;
  this.lastCutoff=cutoff;this.lastResonance=resonance;
  // The old first-order IIR capped at0.49Fs; native lowpass biquads instead
  // clamp at Nyquist, where their limiting response is unity.
  const gp=Math.tan(Math.PI*Math.min(cutoff,this.rate*.49)/this.rate);
  this.poleGain=gp/(1+gp);this.bypassEven=cutoff>=this.rate*.5;
  if(this.bypassEven)return;
  const g=Math.tan(Math.PI*cutoff/this.rate);
  for(let count=1;count<=4;count++){
   const k=10**(-resonance/count/20),a=1/(1+g*(g+k));
   this.a1[count]=a;this.a2[count]=g*a;this.a3[count]=g*g*a;
  }
 }
 pole(group,ch,input){
  const index=group*channels+ch,z=this.poles[index],v=(input-z)*this.poleGain;
  const output=z+v;this.poles[index]=output+v;return output;
 }
 process(input,output,cutoffs,resonances,slopes){
  const countChannels=Math.min(channels,output.length),frames=output[0]?.length||0;
  for(let frame=0;frame<frames;frame++){
   const cutoff=clamp(cutoffs[cutoffs.length===1?0:frame]||20,20,20000);
   const resonance=clamp(resonances[resonances.length===1?0:frame]||.1,.1,12);
   const slope=clamp(Math.round((slopes[slopes.length===1?0:frame]||24)/6)-1,0,7);
   if(!this.initialized){this.weights[slope]=1;this.initialized=true;}
   for(let branch=0;branch<8;branch++)this.weights[branch]+=((branch===slope?1:0)-this.weights[branch])*this.fade;
   this.coefficients(cutoff,resonance);
   for(let ch=0;ch<countChannels;ch++){
    const x=input[ch]?.[frame]||0;
    let mixed=this.weights[0]*this.pole(0,ch,x);
    for(let count=1;count<=4;count++){
     let value=x;
     for(let stage=0;stage<count;stage++){
      const index=(starts[count]+stage)*channels+ch;
      if(this.bypassEven){this.z1[index]=0;this.z2[index]=value;}
      else {
       const z1=this.z1[index],z2=this.z2[index],v3=value-z2;
       const v1=this.a1[count]*z1+this.a2[count]*v3;
       const v2=z2+this.a2[count]*z1+this.a3[count]*v3;
       this.z1[index]=2*v1-z1;this.z2[index]=2*v2-z2;value=v2;
      }
     }
     mixed+=this.weights[2*count-1]*value;
     if(count<4)mixed+=this.weights[2*count]*this.pole(count,ch,value);
    }
    output[ch][frame]=mixed;
   }
  }
 }
}
