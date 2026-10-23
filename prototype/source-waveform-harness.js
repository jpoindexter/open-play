import {paintSourceDetail,sourceWaveformState,sourceWaveformRasterUsage} from './source-waveform.js';
const report={cases:[],errors:[]},assert=(ok,message)=>{if(!ok)throw Error(message);};
try{
 const rate=48000,length=rate*4,channels=[new Float32Array(length),new Float32Array(length)];
 for(let n=0;n<rate*3;n++){const f=[80,1000,8000][Math.floor(n/rate)];channels[0][n]=.05*Math.sin(2*Math.PI*f*n/rate);channels[1][n]=-channels[0][n];}
 for(let n=Math.floor(rate*3.4);n<Math.floor(rate*3.4)+128;n++){channels[0][n]=.9;channels[1][n]=-.9;}
 const buffer={length,sampleRate:rate,numberOfChannels:2,getChannelData:c=>channels[c]},profile=await sourceWaveformState(buffer).ready;
 const original=channels.map(a=>a.slice()),width=320,height=96;
 for(const dpr of [1,1.5,2,3])for(const vertical of [false,true])for(const position of [2,2.007,2.013]){
  const span=4,canvas=document.createElement('canvas'),w=vertical?height:width,h=vertical?width:height;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);paintSourceDetail(ctx,buffer,{width:w,height:h,span,position,vertical});
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),along=vertical?canvas.height:canvas.width,cross=vertical?canvas.width:canvas.height;
  const slice=(start,end)=>{const rgb=[0,0,0];let area=0;for(let t=Math.max(0,Math.floor(start));t<Math.min(along,Math.ceil(end));t++)for(let c=0;c<cross;c++){const i=4*(vertical?t*canvas.width+c:c*canvas.width+t);if(pixels.data[i+3]){area++;for(let k=0;k<3;k++)rgb[k]+=pixels.data[i+k]*pixels.data[i+3]/255;}}return {rgb,area};};
  for(let band=0;band<3;band++){const region=slice((band+.2-position+span/2)*along/span,(band+.8-position+span/2)*along/span);assert(region.area>0,'Missing color region');assert(region.rgb[band]>Math.max(...region.rgb.filter((_,i)=>i!==band))*1.8,'Wrong frequency color');}
  const expected=(3.4-position+span/2)*along/span;let found=-1,largest=0;
  for(let t=Math.floor(expected-5);t<=Math.ceil(expected+5);t++){const area=slice(t,t+1).area;if(area>largest){largest=area;found=t;}}
  assert(largest>cross*.8,'Opposite-polarity stereo transient lost');assert(Math.abs(found-expected)<=3,'Transient moved from source time');
  assert(slice(0,along*.65).area>0,'Waveform blank');report.cases.push({dpr,vertical,position,expectedTransient:expected,observedTransient:found,transientCrossPixels:largest});
  if(position===2){canvas.title=`${vertical?'Vertical':'Horizontal'} / DPR${dpr}`;document.querySelector('#canvases').append(canvas);}
 }
 for(let c=0;c<2;c++)assert(channels[c].every((v,i)=>v===original[c][i]),'Source PCM changed');
 const offline=new OfflineAudioContext(2,128,48000),pending=offline.createBuffer(2,196608,48000);for(let c=0;c<2;c++)pending.getChannelData(c).fill(.1);
 const pendingState=sourceWaveformState(pending),source=offline.createBufferSource();source.buffer=pending;source.connect(offline.destination);source.start();await offline.startRendering();await pendingState.ready;
 assert(pendingState.profile.maximum>.09,'Playback acquisition invalidated an in-flight source profile');report.pendingPlaybackProfileIntact=true;
 report.profileBlockFrames=profile.blockFrames;report.raster=sourceWaveformRasterUsage();report.complete=true;
}catch(error){report.errors.push(error.stack);report.complete=false;}
document.querySelector('#result').textContent=JSON.stringify(report,null,2);
