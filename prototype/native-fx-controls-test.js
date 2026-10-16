import { createEffect } from './effects.js';
const cases = [
  ['LPF','Resonance',.1,10], ['LPF','Slope',12,48],
  ['LPF','Min Freq',40,2000], ['LPF','Max Freq',2500,20000],
  ['Delay','Feedback',0,80], ['Delay','HPF',20,6000],
  ['Delay','Drive',0,90], ['Delay','Beat Modify',1,2],
  ['Reverb','Decay',.5,3], ['Reverb','Contour',0,90],
  ['Reverb','Width',0,200], ['Reverb','Mix Mode','Wet Mix','Send'],
  ['Wah Filter','Resonance',.1,14], ['Wah Filter','Range',.5,6],
  ['Wah Filter','LFO Depth',0,100], ['Wah Filter','Rate',.25,4],
];
async function render(name, params) {
  const sr=24000, ctx=new OfflineAudioContext(2,sr*3.2,sr), b=ctx.createBuffer(2,sr*3.2,sr);
  for(let c=0;c<2;c++) for(let i=0;i<b.length;i++) {
    const t=i/sr, envelope=t<1.2 ? 1 : 0;
    b.getChannelData(c)[i]=envelope*(.15*Math.sin(2*Math.PI*(123.37+c*59.82)*t)+.15*Math.sin(2*Math.PI*(4000+c*250)*t));
  }
  const spec={name,on:true,depth:75,beat:'1/2',params:{...name==='Delay'?{Feedback:60}:{},...name==='Wah Filter'?{'LFO Depth':70}:{},...params}};
  const effect=createEffect(ctx,spec,120), source=ctx.createBufferSource();source.buffer=b;source.connect(effect.input);effect.output.connect(ctx.destination);source.start();
  try{return await ctx.startRendering();}finally{effect.dispose();}
}
document.querySelector('#run').onclick=async()=>{
  const button=document.querySelector('#run'),out=document.querySelector('#results'),results=[];button.disabled=true;
  for(const [name,control,low,high] of cases){
    out.textContent=`Rendering ${results.length+1}/16: ${name} / ${control}`;
    try{
      const a=await render(name,{[control]:low}), b=await render(name,{[control]:high});let difference=0,energy=0,finite=true;
      for(let c=0;c<a.numberOfChannels;c++)for(let i=0;i<a.length;i++){const x=a.getChannelData(c)[i],y=b.getChannelData(c)[i];finite&&=Number.isFinite(x)&&Number.isFinite(y);difference+=(x-y)**2;energy+=x*x+y*y;}
      const ratio=Math.sqrt(difference/Math.max(energy,1e-20));results.push({name,control,low,high,passed:finite&&ratio>1e-5,contrast:ratio});
    }catch(error){results.push({name,control,passed:false,error:error.message});}
  }
  out.textContent=`${results.filter(r=>r.passed).length}/${results.length} passed\n${JSON.stringify({executedAt:new Date().toISOString(),scope:'Actual offline Web Audio parameter contrasts; no vendor-equivalence claim',results},null,2)}`;button.disabled=false;
};
