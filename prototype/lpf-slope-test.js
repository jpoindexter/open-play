import { createEffect } from './effects.js';
const spec = slope => ({name:'LPF',on:true,depth:100,params:{Slope:slope,Resonance:1.77,'Min Freq':500,'Max Freq':500}});
async function measure(slope){
  const sr=48000, ctx=new OfflineAudioContext(2,sr,sr), input=ctx.createBuffer(2,sr,sr);
  for(let c=0;c<2;c++) for(let i=0;i<sr;i++) input.getChannelData(c)[i]=.1*Math.sin(2*Math.PI*2000*i/sr)+.1*Math.sin(2*Math.PI*4000*i/sr);
  const source=ctx.createBufferSource();source.buffer=input;
  const fx=createEffect(ctx,spec(slope)); source.connect(fx.input);fx.output.connect(ctx.destination);source.start();
  try{
    const output=await ctx.startRendering(), data=output.getChannelData(0);let finite=true;
    for(let c=0;c<2;c++)for(const x of output.getChannelData(c))finite&&=Number.isFinite(x);
    const amplitude=hz=>{let re=0,im=0;for(let i=sr/2;i<sr;i++){re+=data[i]*Math.cos(2*Math.PI*hz*i/sr);im+=data[i]*Math.sin(2*Math.PI*hz*i/sr);}return Math.hypot(re,im)*4/sr;};
    const low=amplitude(2000),high=amplitude(4000),attenuationDB=20*Math.log10(low/high);
    return {slope,low,high,attenuationDB,finite,passed:finite&&Math.abs(attenuationDB-slope)<3};
  }finally{fx.dispose();}
}
document.querySelector('#run').onclick=async()=>{
  const button=document.querySelector('#run'),out=document.querySelector('#results');button.disabled=true;
  try{
    const results=[]; for(let slope=6;slope<=48;slope+=6){out.textContent=`Rendering ${slope} dB/octave`;results.push(await measure(slope));}
    const ctx=new OfflineAudioContext(2,480,48000),six=spec(6),fx=createEffect(ctx,six);
    const lifecycle=[
      {name:'Same six-dB cutoff retains slot',passed:fx.update({...six,params:{...six.params,Resonance:2}})===true},
      {name:'Six-dB cutoff change requests owning-slot rebuild',passed:fx.update({...six,params:{...six.params,'Min Freq':800,'Max Freq':800}})===false},
      {name:'Six to twelve requests topology rebuild',passed:fx.update(spec(12))===false},
    ];fx.dispose();
    const even=createEffect(ctx,spec(24));lifecycle.push({name:'Existing 24-dB live frequency update retained',passed:even.update({...spec(24),params:{...spec(24).params,'Min Freq':800,'Max Freq':800}})===true});even.dispose();
    const distinct=results.every((r,i)=>!i||r.attenuationDB-results[i-1].attenuationDB>4);
    const report={executedAt:new Date().toISOString(),scope:'Actual OfflineAudioContext createEffect LPF spectral measurement and update contract; no app UI, native, acoustic or vendor transfer acceptance',sampleRate:48000,cutoff:500,frequencies:[2000,4000],analysisWindowSeconds:[.5,1],slopeToleranceDB:3,minAdjacentDifferenceDB:4,results,lifecycle,distinct,passed:results.every(r=>r.passed)&&lifecycle.every(r=>r.passed)&&distinct};
    out.textContent=JSON.stringify(report,null,2);
  }catch(error){out.textContent=JSON.stringify({passed:false,error:error.stack},null,2);}finally{button.disabled=false;}
};
