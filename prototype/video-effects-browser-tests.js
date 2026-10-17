import { createVideoEffects, videoEffectCatalog } from "./video-effects.js";
import { restoreVideoState, snapshotVideoState } from "./video-state.js";
import { AudioEngine } from "./engine.js";
import { createVideoPipeline } from "./video-pipeline.js";
import { videoAnalysisPolicy } from "./video-analysis.js";
const width=96,height=64;
function canvas(){const c=document.createElement("canvas");c.width=width;c.height=height;return c;}
const fixture=canvas(), solid=canvas(), background=canvas();
function paint(c,fn){const ctx=c.getContext("2d"),image=ctx.createImageData(width,height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)image.data.set(fn(x,y),(y*width+x)*4);ctx.putImageData(image,0,0);}
function pattern(phase=0){paint(fixture,(x,y)=>[(x*7+y*3+phase*71)%256,(x*2+y*11+phase*43)%256,((x>>3)+(y>>3))%2?230:20,255]);}
function fill(c,rgba){paint(c,()=>rgba);}
function difference(a,b){let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);return sum/a.length;}
const pixel=(a,x,y)=>Array.from(a.subarray((y*width+x)*4,(y*width+x)*4+4));
const mean=(a,channel)=>{let s=0;for(let i=channel;i<a.length;i+=4)s+=a[i];return s/(a.length/4);};
const check=(condition,message)=>{if(!condition)throw new Error(message);};
const base={time:1.25,bpm:120,bass:.8,mid:.35,treble:.15,level:.65,rate:.6,upfader:.8,position:.37,spectrum8:[.8,.6,.4,.2,.1,.35,.65,.9]};
let renderer;
function draw(name,value=1,params={},context={},source=fixture){renderer.render(source,name?[{name,on:true,value,params}]:[],{...base,...context});return renderer.readPixels();}
const run=document.querySelector("#run"),summary=document.querySelector("#summary"),output=document.querySelector("#results");
run.onclick=async()=>{
 run.disabled=true;const results=[];
 try{renderer=createVideoEffects({width,height});document.querySelector("#preview").replaceChildren(renderer.canvas);}
 catch(error){summary.textContent="WebGL2 unavailable or shader compilation failed";output.textContent=error.stack;run.disabled=false;return;}
 // Capture the Run gesture for the actual PCM/analysis check. The speaker
 // analyser is disconnected before a BufferSource exists; only a zero-gain
 // analysis sink and the private MediaStream destination remain connected.
 let engine,audioReady,audioSetupError;const audioMessages=[];
 try{engine=new AudioEngine();engine.onError=e=>audioMessages.push(e.message);engine.init();engine.analyser.disconnect();audioReady=engine.resume();audioReady.catch(e=>{audioSetupError=e;});}catch(error){audioSetupError=error;}
 async function test(name,fn){summary.textContent=`Checking ${name}…`;try{renderer.reset();const detail=await fn();results.push({name,status:"pass",detail});}catch(error){results.push({name,status:"fail",error:error.message});}await new Promise(requestAnimationFrame);}
 for(const entry of videoEffectCatalog)await test(`Pixels and bypass: ${entry.name}`,()=>{
  pattern(0);draw(entry.name,1,{}, {time:1.25});pattern(1);
  const testTime=entry.name === "Flash On BPM" ? 1.5 : 1.3;
  const processed=draw(entry.name,1,{}, {time:testTime}),midpoint=draw(entry.name,.5,{}, {time:testTime}),bypass=draw(null),zero=draw(entry.name,0);
  check(difference(processed,bypass)>.01,`No actual pixel response for ${entry.name}`);
  check(difference(zero,bypass)<.01,"Amount0 must be exact source pixels");
  const off=renderer.render(fixture,[{name:entry.name,on:false,value:1}],base);check(off===renderer.canvas,"Expected reusable output canvas");
  check(difference(renderer.readPixels(),bypass)<.01,"Off must restore source pixels");
  return {testedAmounts:[0,.5,1],difference:difference(processed,bypass),midpointDifference:difference(midpoint,bypass),sourceStatus:entry.sourceStatus,candidateOnly:entry.candidateOnly};
 });
 await test("Earlier Open Play Freeze captures upstream pixels indefinitely across amount changes",()=>{
  const params={behavior:"Earlier Open Play"};fill(solid,[255,0,0,255]);const first=draw("Frame Freeze",1,params, {time:0},solid);
  fill(solid,[0,0,255,255]);const held=draw("Frame Freeze",1,params, {time:1},solid);
  check(difference(first,held)===0,"Freeze must retain red after live input turns blue");
  const half=draw("Frame Freeze",.5,params, {time:2},solid);const p=pixel(half,48,32);
  check(Math.abs(p[0]-128)<=1&&Math.abs(p[2]-128)<=1,"Amount change must blend retained frame, not recapture");
  const capture=draw("Frame Freeze",1,{...params,captureToken:1},{time:3},solid);check(pixel(capture,48,32)[2]===255,"Capture token must capture blue");
 });
 await test("Freeze resets on effect change, off/re-enable, assetId and explicit reset",()=>{
  fill(solid,[255,0,0,255]);draw("Frame Freeze",1,{}, {assetId:"A"},solid);
  fill(solid,[0,255,0,255]);check(pixel(draw("Frame Freeze",1,{}, {assetId:"B"},solid),48,32)[1]===255,"Asset replacement must clear freeze");
  draw("Negative",1,{}, {assetId:"B"},solid);fill(solid,[0,0,255,255]);
  check(pixel(draw("Frame Freeze",1,{}, {assetId:"B"},solid),48,32)[2]===255,"Effect switch must recapture");
  renderer.render(solid,[{name:"Frame Freeze",on:false}],{assetId:"B"});fill(solid,[255,255,0,255]);
  check(pixel(draw("Frame Freeze",1,{}, {assetId:"B"},solid),48,32)[0]===255,"Re-enable must recapture");
  renderer.reset();fill(solid,[0,255,255,255]);check(pixel(draw("Frame Freeze",1,{}, {assetId:"B"},solid),48,32)[0]===0,"Explicit reset must release old frame");
 });
 await test("Delay Grid uses distinct retained timestamps rather than recolouring live pixels",()=>{
  fill(solid,[255,0,0,255]);draw("Delay Grid",1,{columns:4},{time:0,position:undefined},solid);
  fill(solid,[0,255,0,255]);draw("Delay Grid",1,{columns:4},{time:.125,position:undefined},solid);
  fill(solid,[0,0,255,255]);const a=draw("Delay Grid",1,{columns:4},{time:.25,position:undefined},solid);
  // readPixels uses top-left rows, while tile ages use bottom-left shader coordinates.
  check(pixel(a,12,56)[2]>250,"Newest tile must show blue");
  check(pixel(a,36,56)[1]>250,"One-sample-old tile must show green");
  check(pixel(a,60,56)[0]>250,"Two-sample-old tile must show red");
 });
 await test("Manual Frame Pulse keeps center live while only border alpha pulses",()=>{
  fill(solid,[255,0,0,128]);const first=draw("Frame Pulse",1,{}, {time:0},solid);
  fill(solid,[0,0,255,128]);const quarter=draw("Frame Pulse",1,{}, {time:.25},solid),peak=draw("Frame Pulse",1,{}, {time:.5},solid),returned=draw("Frame Pulse",1,{}, {time:1},solid);
  const center=pixel(peak,48,32),edge=pixel(peak,0,32),middleEdge=pixel(quarter,0,32),back=pixel(returned,0,32);
  check(pixel(first,48,32)[0]===255&&center[0]===0&&center[2]===255&&Math.abs(center[3]-128)<=1,"Pulse must use current blue center, not retained red frame, and preserve center alpha");
  check(edge[3]<=2&&Math.abs(middleEdge[3]-64)<=2&&Math.abs(back[3]-128)<=1,"Border must fade smoothly at quarter/half/full independent1s period");
  for(const [x,y] of [[0,32],[95,32],[48,0],[48,63]])check(pixel(peak,x,y)[3]<=2,"All four frame edges must pulse");
  const reduced=draw("Frame Pulse",1,{}, {time:.5,reducedMotion:true},solid),bypass=draw(null,1,{}, {},solid);check(difference(reduced,bypass)<.01,"Reduced Motion must retain exact live source without generated border pulse");
  return {center,edge,quarterEdge:middleEdge,returnedEdge:back,reducedDifference:difference(reduced,bypass),meaningSource:"historical manual p20; waveform/width/timing independent"};
 });
 await test("Frame Pulse duration and legacy beat timing remain explicit distinct policies",()=>{
  fill(solid,[40,90,160,255]);const slow=draw("Frame Pulse",1,{periodSeconds:2},{time:.5,bpm:240},solid),slowPeak=draw("Frame Pulse",1,{periodSeconds:2},{time:1,bpm:120},solid);
  check(Math.abs(pixel(slow,0,32)[3]-128)<=3&&pixel(slowPeak,0,32)[3]<=3,"Explicit2s period must not become BPM-driven");
  const legacyPeak=draw("Frame Pulse",1,{periodBeats:1},{time:.25,bpm:120},solid),legacyReturn=draw("Frame Pulse",1,{periodBeats:1},{time:.5,bpm:120},solid);
  check(pixel(legacyPeak,0,32)[3]<=3&&pixel(legacyReturn,0,32)[3]===255,"Saved1beat period must remain.5s at120BPM without holding frames");
  const fastPeriod=60/400*.125,fast=draw("Frame Pulse",1,{periodBeats:.125},{time:fastPeriod/2,bpm:400},solid);check(pixel(fast,0,32)[3]<=3,"Legacy sub.1s beat period must not inherit new seconds-control minimum");
  return {secondsQuarter:pixel(slow,0,32),secondsPeak:pixel(slowPeak,0,32),legacyPeak:pixel(legacyPeak,0,32),legacyReturn:pixel(legacyReturn,0,32),fastLegacyPeak:pixel(fast,0,32),fastPeriod};
 });
 await test("Manual Split defaults to exactly five repeated source regions",()=>{
  paint(solid,(x)=>x<32?[255,0,0,255]:x<64?[0,255,0,255]:[0,0,255,255]);const image=draw("Split",1,{}, {},solid),samples=[];
  for(let panel=0;panel<5;panel++)for(const [fraction,channel] of [[.15,0],[.5,1],[.85,2]]){const x=Math.floor((panel+fraction)*width/5),p=pixel(image,x,32);samples.push({panel,fraction,x,pixel:p});check(p[channel]>=253&&p[(channel+1)%3]<=2&&p[(channel+2)%3]<=2,"Five-region source markers missing at panel"+panel+" fraction"+fraction+": "+p);}
  return {regions:5,samples,meaningSource:"historical manual p20; vertical region layout/offset is independent"};
 });
 await test("BPM flash cadence and reduced-motion policy",()=>{
  fill(solid,[30,40,50,255]);
  const flash=draw("Flash On BPM",1,{}, {time:0,bpm:120},solid),live=draw("Flash On BPM",1,{}, {time:.25,bpm:120},solid);
  check(pixel(flash,48,32)[0]===255&&pixel(live,48,32)[0]===30,"120BPM flash must end outside duty");
  check(pixel(draw("Flash On BPM",1,{}, {time:.5,bpm:120},solid),48,32)[0]===255,"120BPM next flash at.5s");
  const still=draw("Flash On BPM",1,{}, {time:0,reducedMotion:true},solid);check(pixel(still,48,32)[0]===30,"Reduced motion must suppress flash");
 });
 await test("Bass/Treble zoom and blur respond only to their declared band",()=>{
  pattern();for(const [name,band,other] of [["Bass Zoom","bass","treble"],["Treble Zoom","treble","bass"],["Bass Blur","bass","treble"],["Treble Blur","treble","bass"]]){
   const silence=draw(name,1,{}, {bass:0,mid:0,treble:0,level:0}),wrong=draw(name,1,{}, {bass:0,mid:0,treble:0,level:0,[other]:1}),right=draw(name,1,{}, {bass:0,mid:0,treble:0,level:1,[band]:1});
   check(difference(silence,wrong)<.01,`${name} responded to wrong band`);check(difference(silence,right)>1,`${name} ignored its band`);
  }
 });
 await test("RGB EQ and Audio RGB have measurable per-channel gain",()=>{
  fill(solid,[50,60,70,255]);const eq=draw("RGB Eq",1,{red:2,green:1,blue:.5},{},solid),p=pixel(eq,48,32);
  check(Math.abs(p[0]-100)<=1&&p[1]===60&&Math.abs(p[2]-35)<=1,"Manual EQ channel gains incorrect");
  const red=draw("Audio RGB",1,{}, {bass:1,mid:0,treble:0},solid),blue=draw("Audio RGB",1,{}, {bass:0,mid:0,treble:1},solid);
  check(pixel(red,48,32)[0]===100&&pixel(red,48,32)[2]===70,"Bass must boost red only");
  check(pixel(blue,48,32)[0]===50&&pixel(blue,48,32)[2]===140,"Treble must boost blue only");
 });
 await test("Earlier Open Play Analyzer uses supplied three bands and preserves channel distinction",()=>{
  fill(solid,[0,0,0,255]);const a=draw("Analyzer",1,{behavior:"Earlier Open Play"}, {bass:1,mid:0,treble:0},solid),b=draw("Analyzer",1,{behavior:"Earlier Open Play"}, {bass:0,mid:0,treble:1},solid);
  check(pixel(a,10,32)[0]>200&&pixel(a,80,32)[2]===0,"Bass analyzer column incorrect");
  check(pixel(b,80,32)[2]>200&&pixel(b,10,32)[0]===0,"Treble analyzer column incorrect");
 });
 await test("Colour algorithms follow numeric intensity contracts and preserve alpha",()=>{
  fill(solid,[40,90,160,128]);const negative=pixel(draw("Negative",1,{}, {},solid),48,32);
  check(negative.every((v,i)=>Math.abs(v-[215,165,95,128][i])<=2),"RGB inversion or alpha incorrect");
  const a=pixel(draw("Gamma",.25,{behavior:"Earlier Open Play",gamma:3},{},solid),48,32),b=pixel(draw("Gamma",.75,{behavior:"Earlier Open Play",gamma:3},{},solid),48,32);check(b[0]>a[0]&&b[3]===a[3],"Earlier Open Play reciprocal Gamma response must brighten monotonically and preserve alpha");
  const grey=pixel(draw("Saturation",1,{saturation:0},{},solid),48,32);check(Math.abs(grey[0]-grey[1])<=1&&Math.abs(grey[1]-grey[2])<=1,"Desaturation should produce equal RGB");
 });
 await test("Manual Gamma darkens numeric shadow patches monotonically while retaining endpoints and alpha",()=>{
  const values=[0,64,128,192,255],observed=[];
  for(const alpha of [255,128]){
   paint(solid,x=>{const g=values[Math.min(4,Math.floor(x*5/width))];return[g,g,g,alpha];});
   const bypass=draw(null,1,{}, {},solid),half=draw("Gamma",.5,{}, {},solid),full=draw("Gamma",1,{}, {},solid),zero=draw("Gamma",0,{}, {},solid);
   check(difference(bypass,zero)<.01,"Manual Gamma zero must be exact bypass");
   for(let i=0;i<5;i++){const x=Math.floor((i+.5)*width/5),p=pixel(full,x,32),h=pixel(half,x,32),expected=Math.round(255*(values[i]/255)**2);observed.push({alpha,input:values[i],half:h,full:p,expected});
    check(p.slice(0,3).every(v=>Math.abs(v-expected)<=2)&&Math.abs(p[3]-alpha)<=1,"Gamma numeric/alpha mismatch: "+JSON.stringify(observed.at(-1)));
    if(i>0&&i<4)check(h[0]>p[0]&&h[0]<values[i],"Gamma half amount must lie strictly between identity and full shadows");
   }
  }
  return {observed,curve:"Independent display-RGB power2 at full amount; historical manual meaning only, no installed-version curve claim"};
 });
 await test("Fresh Saturation increases measured chroma and preserves explicit zero, gray and alpha",()=>{
  const observed=[];
  for(const alpha of [255,128]){
   paint(solid,x=>x<48?[100,120,140,alpha]:[100,100,100,alpha]);
   const full=draw("Saturation",1,{}, {},solid),half=draw("Saturation",.5,{}, {},solid),desaturated=draw("Saturation",1,{saturation:0},{},solid),p=pixel(full,24,32),h=pixel(half,24,32),g=pixel(full,72,32),d=pixel(desaturated,24,32);
   check(p.slice(0,3).every((v,i)=>Math.abs(v-[83,123,163][i])<=2)&&Math.abs(p[3]-alpha)<=1,"Fresh Saturation target2 numeric/alpha mismatch: "+p);
   check(h[2]-h[0]>40&&h[2]-h[0]<p[2]-p[0],"Half saturation must have intermediate chroma spread");
   check(g.slice(0,3).every(v=>Math.abs(v-100)<=1)&&Math.abs(g[3]-alpha)<=1,"Gray/alpha must remain unchanged");
   check(Math.max(...d.slice(0,3))-Math.min(...d.slice(0,3))<=1&&Math.abs(d[3]-alpha)<=1,"Explicit zero target must retain desaturation");observed.push({alpha,full:p,half:h,gray:g,explicitZero:d});
  }
  return {observed,meaning:"Historical manual increasing intensity; Rec709 display-RGB interpolation/default2 independent"};
 });
 await test("Manual Smudge pulls all four actual borders inward with aspect-correct spatial rays",()=>{
  const observed=[];
  for(const [w,h] of [[256,256],[256,128]]){
   const source=document.createElement("canvas");source.width=w;source.height=h;const ctx=source.getContext("2d"),image=ctx.createImageData(w,h),r=createVideoEffects({width:w,height:h});
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const rgba=x<4?[255,0,0,255]:x>=w-4?[0,255,0,255]:y<4?[0,0,255,255]:y>=h-4?[255,255,0,255]:Math.abs(x-w/2)<10&&Math.abs(y-h/2)<10?[80,80,80,255]:[0,0,0,255];image.data.set(rgba,(y*w+x)*4);}ctx.putImageData(image,0,0);
   const at=(a,x,y)=>Array.from(a.slice((y*w+x)*4,(y*w+x)*4+4));
   try{r.render(source,[{name:"Smudge",on:true,value:1}],base);const out=r.readPixels(),samples=[[12,Math.floor(h/2),[0]],[w-13,Math.floor(h/2),[1]],[Math.floor(w/2),12,[2]],[Math.floor(w/2),h-13,[0,1]]].map(([x,y,channels])=>({x,y,channels,pixel:at(out,x,y)}));
    for(const s of samples){for(let c=0;c<3;c++)check(s.channels.includes(c)?s.pixel[c]>20:s.pixel[c]<=2,"Smudge inward border ownership mismatch: "+JSON.stringify({w,h,...s}));check(s.pixel[3]===255,"Opaque border must stay opaque");}
    const center=at(out,Math.floor(w/2),Math.floor(h/2));check(center.slice(0,3).every(v=>Math.abs(v-80)<=1)&&center[3]===255,"Smudge must leave center unchanged");
    r.render(source,[],base);const bypass=r.readPixels();r.render(source,[{name:"Smudge",on:true,value:1,params:{radiusPixels:0}}],base);check(difference(bypass,r.readPixels())<.01,"Smudge radius0 must be exact bypass");observed.push({width:w,height:h,samples,center,zeroRadiusDifference:difference(bypass,r.readPixels())});
   }finally{r.dispose();}
  }
  return {observed,kernel:"Independent nine equal premultiplied outward samples leave an inward trail; no temporal state"};
 });
 await test("Manual Smudge premultiplied filtering retains straight red through partial-alpha trails",()=>{
  const source=document.createElement("canvas");source.width=256;source.height=128;const ctx=source.getContext("2d"),image=ctx.createImageData(256,128),r=createVideoEffects({width:256,height:128});
  for(let y=0;y<128;y++)for(let x=0;x<4;x++)image.data.set([255,0,0,128],(y*256+x)*4);ctx.putImageData(image,0,0);
  try{r.render(source,[{name:"Smudge",on:true,value:1}],base);const out=r.readPixels(),p=Array.from(out.slice((64*256+12)*4,(64*256+12)*4+4));check(p[0]>=253&&p[1]<=2&&p[2]<=2&&p[3]>0&&p[3]<128,"Smudge transparent trail darkened straight red or lost partial alpha: "+p);return {sample:p,width:256,height:128};}finally{r.dispose();}
 });
 await test("Manual UV Paint gates gray to opaque black and preserves eligible RGB hues and alpha",()=>{
  const colors=[[100,100,100],[100,99,99],[120,80,80],[80,120,80],[80,80,120],[120,100,80]],expected=[[0,0,0],[0,0,0],[255,0,0],[0,255,0],[0,0,255],[255,128,0]],observed=[];
  for(const alpha of [255,128]){paint(solid,x=>[...colors[Math.min(5,Math.floor(x*6/width))],alpha]);const out=draw("UV Paint",1,{}, {},solid);
   for(let i=0;i<6;i++){const p=pixel(out,Math.floor((i+.5)*width/6),32);check(p.slice(0,3).every((v,c)=>Math.abs(v-expected[i][c])<=2)&&Math.abs(p[3]-alpha)<=1,"UV hue/gate/alpha mismatch: "+JSON.stringify({input:colors[i],alpha,p,expected:expected[i]}));observed.push({input:colors[i],alpha,actual:p,expected:expected[i]});}}
  return {observed,colorfulness:"Independent(max-min)/max, HSV hue with full saturation/value above threshold+softness"};
 });
 await test("Manual UV Paint threshold and softness use measured numeric gates without cyan boundary glow",()=>{
  paint(solid,x=>x<32?[100,80,80,255]:x<64?[100,75,75,255]:[100,70,70,255]);
  const out=draw("UV Paint",1,{colorThreshold:.2,softness:.1},{},solid),samples=[pixel(out,16,32),pixel(out,48,32),pixel(out,80,32)],high=pixel(draw("UV Paint",1,{colorThreshold:.3,softness:.1},{},solid),48,32);
  for(const [i,level] of [[0,0],[1,128],[2,255]])check(Math.abs(samples[i][0]-level)<=2&&samples[i][1]<=2&&samples[i][2]<=2&&samples[i][3]===255,"UV softness numeric mismatch: "+samples[i]);check(high[0]<=2&&high[1]<=2&&high[2]<=2,"Raising threshold must suppress the same patch");
  paint(solid,x=>x<48?[100,100,100,255]:[180,180,180,255]);const gray=draw("UV Paint",1,{}, {},solid),boundary=[pixel(gray,47,32),pixel(gray,48,32)];check(boundary.every(p=>p[0]<=1&&p[1]<=1&&p[2]<=1&&p[3]===255),"Gray boundary must remain black, without old neon edge glow");
  return {samples,raisedThreshold:high,boundary};
 });
 await test("Earlier saved Gamma, directional Smudge and neon UV renders survive real metadata round trips",()=>{
  const prior={version:1,fx:{left:[{name:"Gamma",on:true,value:.5,params:{gamma:.25}},{name:"Smudge",on:true,value:1,params:{angle:0}}],right:[{name:"UV Paint",on:true,value:1,params:{}}]}};
  const saved=restoreVideoState(JSON.parse(JSON.stringify(snapshotVideoState(restoreVideoState(prior))))),g=saved.fx.left[0],s=saved.fx.left[1],u=saved.fx.right[0];
  check([g,s,u].every(x=>x.params.behavior==="Earlier Open Play"),"Saved legacy behavior marker must survive restore/snapshot/restore");
  fill(solid,[64,64,64,255]);const gamma=pixel(draw(g.name,g.value,g.params,{},solid),48,32),expectedGamma=Math.round(255*(64/255)**(1/(1+(.25-1)*.5)));check(g.params.gamma===.25&&Math.abs(gamma[0]-expectedGamma)<=2,"Legacy below1 gamma was discarded or reinterpreted: "+gamma);
  fill(solid,[100,100,100,128]);const uv=pixel(draw(u.name,u.value,u.params,{},solid),48,32);check(uv.slice(0,3).every((v,i)=>Math.abs(v-[29,15,88][i])<=2)&&Math.abs(uv[3]-128)<=1,"Legacy neon UV numeric render changed: "+uv);
  const source=document.createElement("canvas");source.width=512;source.height=128;const ctx=source.getContext("2d");ctx.fillStyle="black";ctx.fillRect(0,0,512,128);ctx.fillStyle="red";ctx.fillRect(220,0,4,128);const r=createVideoEffects({width:512,height:128});
  try{r.render(source,[s],base);const data=r.readPixels(),at=x=>Array.from(data.slice((64*512+x)*4,(64*512+x)*4+4)),smudge=at(242),opposite=at(202),weight=Math.exp(-.35)/Array.from({length:9},(_,i)=>Math.exp(-i*.35)).reduce((a,b)=>a+b,0),expected=Math.round(255*weight);check(Math.abs(smudge[0]-expected)<=2&&smudge[1]===0&&smudge[2]===0&&smudge[3]===255&&opposite[0]===0,"Legacy angle0 directional smear changed: "+JSON.stringify({smudge,opposite,expected}));return {gamma:{stored:g.params.gamma,actual:gamma,expected:expectedGamma},uv:{actual:uv,expected:[29,15,88,128]},smudge:{storedAngle:s.params.angle,actual:smudge,opposite,expected},meaning:"Earlier Open Play compatibility only; separate from manual-meaning checks"};}finally{r.dispose();}
 });
 await test("Upfader brightness and transport fade have explicit independent controls",()=>{
  fill(solid,[100,100,100,255]);const low=draw("Brightness",.5,{}, {upfader:0},solid),high=draw("Brightness",.5,{}, {upfader:1},solid);
  check(mean(high,0)>mean(low,0)+100,"Upfader must alter brightness");
  const stopped=draw("Record Fade",1,{}, {rate:0},solid),reverse=draw("Record Fade",1,{}, {rate:-1},solid);check(mean(stopped,3)===0&&mean(reverse,3)===255,"Transport rate must control alpha, not time alone");
 });
 await test("Record rotation integrates signed rate and holds while stopped",()=>{
  pattern();draw("Record Rotate",1,{}, {time:0,position:undefined,rate:1});
  const forward=draw("Record Rotate",1,{}, {time:1,position:undefined,rate:1}),stopped=draw("Record Rotate",1,{}, {time:2,position:undefined,rate:0});
  check(difference(forward,stopped)===0,"Stopped rotation must retain angle");
  const reversed=draw("Record Rotate",1,{}, {time:3,position:undefined,rate:-1}),original=draw(null);check(difference(reversed,original)<.01,"Equal reverse interval must undo forward rotation");
 });
 await test("Mirror and Tile map known geometry markers",()=>{
  paint(solid,(x,y)=>[x<48?255:0,y<32?255:0,x>=48?255:0,255]);
  const mirrored=draw("Mirror",1,{axis:"Horizontal"},{},solid);check(pixel(mirrored,80,20)[0]===255&&pixel(mirrored,80,20)[2]===0,"Right half must reflect left");
  const vertical=draw("Mirror",1,{axis:"Vertical"},{},solid);check(pixel(vertical,20,52)[1]===255,"Lower half must reflect upper");
  const tiled=draw("Tile",1,{tiles:2},{},solid);check(pixel(tiled,8,16)[0]===255&&pixel(tiled,56,16)[0]===255&&pixel(tiled,32,16)[2]===255,"Tile copies should repeat source halves");
 });
 await test("Spatial blur spreads an actual impulse and sharpening strengthens a soft edge",()=>{
  fill(solid,[0,0,0,255]);solid.getContext("2d").fillStyle="white";solid.getContext("2d").fillRect(48,32,1,1);
  const blurred=draw("Blur",.3,{}, {},solid);check(pixel(blurred,48,32)[0]<255&&pixel(blurred,51,32)[0]>0,"Blur must spread impulse energy to neighbours");
  check(pixel(blurred,70,32)[0]===0,"Blur must remain spatially bounded");
 });
 await test("Luma and chroma keys produce actual alpha and optional two-source composition",()=>{
  paint(solid,x=>x<48?[0,0,0,255]:[255,255,255,255]);
  const black=draw("Luma Key Black",.5,{}, {},solid),white=draw("Luma Key White",.5,{}, {},solid);check(pixel(black,20,32)[3]===0&&pixel(black,70,32)[3]===255,"Black key alpha incorrect");check(pixel(white,20,32)[3]===255&&pixel(white,70,32)[3]===0,"White key alpha incorrect");
  paint(solid,x=>x<48?[0,255,0,255]:[255,0,0,255]);const keyed=draw("Chroma Key Green",.8,{}, {},solid);check(pixel(keyed,20,32)[3]===0&&pixel(keyed,70,32)[3]===255,"Green key must preserve red");
  fill(background,[0,0,255,255]);const composite=draw("Chroma Key Green",.8,{}, {secondarySource:background},solid);check(pixel(composite,20,32)[2]===255&&pixel(composite,20,32)[3]===255,"Background must appear through keyed pixels");
 });
 await test("Audio fade respects original alpha and ordered slots do not commute",()=>{
  fill(solid,[40,90,160,128]);check(Math.abs(pixel(draw("Audio Fade",1,{}, {level:.5},solid),48,32)[3]-64)<=1,"Audio Fade must multiply alpha");
  renderer.render(solid,[{name:"Negative",on:true,value:1},{name:"Gamma",on:true,value:1}],base);const a=renderer.readPixels();
  renderer.render(solid,[{name:"Gamma",on:true,value:1},{name:"Negative",on:true,value:1}],base);check(difference(a,renderer.readPixels())>10,"Two effect slots must execute in declared order");
 });
 await test("Temporal history is independent between slots and source identities",()=>{
  fill(solid,[255,0,0,255]);renderer.render(solid,[{name:"Negative",on:true,value:1},{name:"Frame Freeze",on:true,value:1,params:{behavior:"Earlier Open Play"}}],{time:0});
  fill(solid,[0,0,255,255]);renderer.render(solid,[{name:"Negative",on:true,value:0},{name:"Frame Freeze",on:true,value:1,params:{behavior:"Earlier Open Play"}}],{time:1});
  check(pixel(renderer.readPixels(),48,32)[1]===255,"Slot2 must retain its actual processed cyan input");
  const replacement=canvas();fill(replacement,[0,255,0,255]);renderer.render(replacement,[null,{name:"Frame Freeze",on:true,value:1}],{time:2});check(pixel(renderer.readPixels(),48,32)[1]===255&&pixel(renderer.readPixels(),48,32)[2]===0,"New source identity must reset temporal state");
 });
 await test("Manual Isolator Bass retains selected hue by bass only and grays its complement",()=>{
  const observed=[];
  for(const alpha of [255,128]){
   paint(solid,x=>[...[x<24?[255,0,0]:x<48?[0,255,0]:x<72?[0,0,255]:[100,100,100]][0],alpha]);
   const samples=[];
   for(const bass of [0,.5,1]){const out=draw("Isolator Bass",1,{}, {bass,mid:0,treble:0,level:0},solid),pixels=[12,36,60,84].map(x=>pixel(out,x,32));samples.push({bass,pixels});
    for(const [i,luma] of [[1,182],[2,18],[3,100]])check(pixels[i].slice(0,3).every(v=>Math.abs(v-luma)<=2)&&Math.abs(pixels[i][3]-alpha)<=1,"Complement must be gray independent of bass: "+JSON.stringify({alpha,bass,pixels}));
    const expected=[54+(255-54)*bass,54*(1-bass),54*(1-bass)];check(pixels[0].slice(0,3).every((v,i)=>Math.abs(v-expected[i])<=2)&&Math.abs(pixels[0][3]-alpha)<=1,"Selected red bass response incorrect: "+JSON.stringify({alpha,bass,pixels}));
   }
   const fixed=draw("Isolator Bass",1,{}, {bass:.5,mid:0,treble:0,level:0},solid),other=draw("Isolator Bass",1,{}, {bass:.5,mid:1,treble:1,level:1},solid);check(difference(fixed,other)<.01,"Other supplied bands/level changed fixed-bass output");
   const green=draw("Isolator Bass",1,{hue:120},{bass:1},solid),gp=pixel(green,36,32),rp=pixel(green,12,32);check(gp[1]>=253&&gp[0]<=2&&gp[2]<=2&&rp.slice(0,3).every(v=>Math.abs(v-54)<=2),"Selected hue ownership failed to move red→green");observed.push({alpha,samples,otherBandDifference:difference(fixed,other),greenSelected:gp,redComplement:rp});
  }
  return {observed,response:"Independent hue-distance mask and Rec709 display-RGB luma; vectors prove shader ownership, actual PCM checked separately"};
 });
 await test("Actual AudioEngine PCM bass measurement drives isolated hue while high tone and pause stay gray",async()=>{
  if(audioSetupError)throw audioSetupError;await audioReady;
  const sr=engine.ctx.sampleRate,bin=sr/2048,frequencies=[bin*4,bin*256],observed=[];let deck;
  const wait=async(predicate)=>{const deadline=performance.now()+8000;let value;do{value=engine.videoAnalysis(0);if(predicate(value))return value;await new Promise(requestAnimationFrame);}while(performance.now()<deadline);throw Error("Actual PCM analysis timed out: "+JSON.stringify(value));};
  try{for(const frequency of frequencies){if(deck)engine.pause(deck);const duration=4,buffer=engine.ctx.createBuffer(1,sr*duration,sr),pcm=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)pcm[i]=.6*Math.sin(2*Math.PI*frequency*i/sr);
    deck={index:0,track:{id:"isolator-pcm-"+frequency,duration,bpm:120},position:0,rate:1,playing:false,processing:false,keylock:false,keyShift:0,reverse:false,loop:true,loopIn:0,loopOut:duration,stems:[true,true,true,true],stemFX:[false,false,false,false]};engine.buffers.set(deck.track.id,buffer);await engine.start(deck);
    await wait(v=>v.audioAvailable&&v.level>.3&&(frequency<250?v.bass>.15:v.treble>.15&&v.bass<.001));const measured=engine.videoAnalysis(0);fill(solid,[255,0,0,255]);const out=draw("Isolator Bass",1,{},measured,solid),p=pixel(out,48,32),spread=p[0]-p[1],expected=[54.213+(255-54.213)*measured.bass,54.213*(1-measured.bass),54.213*(1-measured.bass)];check(p.slice(0,3).every((v,i)=>Math.abs(v-expected[i])<=2)&&p[3]===255,"Measured bass did not reach actual shader pixels: "+JSON.stringify({measured,p,expected}));observed.push({frequency,sampleRate:sr,fftSize:2048,measured,pixel:p,spread,expected});
   }
   check(observed[0].spread>observed[1].spread+30&&observed[1].spread<=2,"Low PCM must retain measurable red chroma while high-frequency negative control stays gray");
   engine.pause(deck);const paused=await wait(v=>v.level<1e-6&&v.bass<1e-6),p=pixel(draw("Isolator Bass",1,{},paused,solid),48,32);check(p.slice(0,3).every(v=>Math.abs(v-54)<=2),"Paused input must become gray in Manual Meaning");
   return {observed,paused:{measured:paused,pixel:p},speakerRoute:"Disconnected before PCM start; independent zero-gain analyser sink remains",audioMessages,scope:"Actual existing pre-EQ deck FFT tap→measured bass→FX pixels. No reference detector equivalence, hardware or full-pipeline/audio-noninterference acceptance."};
  }finally{if(deck)engine.pause(deck);}
 });
 await test("Finite Freeze holds one actual frame, expires to live, and token retriggers with premultiplied alpha",()=>{
  fill(solid,[255,0,0,128]);draw("Frame Freeze",1,{}, {time:0},solid);fill(solid,[0,0,255,64]);
  const held=pixel(draw("Frame Freeze",1,{}, {time:.4,frameId:1,rate:0},solid),48,32),half=pixel(draw("Frame Freeze",.5,{}, {time:.5,frameId:1,rate:0},solid),48,32),expired=pixel(draw("Frame Freeze",1,{}, {time:1.001,frameId:1,rate:0},solid),48,32);
  check(held[0]>=253&&held[2]<=2&&Math.abs(held[3]-128)<=1,"Before deadline must retain actual red capture");check(half.every((v,i)=>Math.abs(v-[170,0,85,96][i])<=2),"Unequal alpha hold/live blend must be premultiplied: "+half);check(expired[2]>=253&&expired[0]<=2&&Math.abs(expired[3]-64)<=1,"Expiry must return live blue even for repeated frameId and paused rate");
  fill(solid,[0,255,0,255]);const live=pixel(draw("Frame Freeze",1,{}, {time:1.1},solid),48,32);check(live[1]===255,"Expiry must stay live instead of auto-recapturing blue");draw("Frame Freeze",1,{captureToken:1},{time:1.2},solid);fill(solid,[0,0,255,255]);const retriggered=pixel(draw("Frame Freeze",1,{captureToken:1},{time:1.4},solid),48,32),againExpired=pixel(draw("Frame Freeze",1,{captureToken:1},{time:2.201},solid),48,32);check(retriggered[1]===255&&retriggered[2]===0&&againExpired[2]===255&&againExpired[1]===0,"Token must capture green then expire once");return {held,half,expired,live,retriggered,againExpired};
 });
 await test("Finite Freeze duration edits retain original deadline and cannot resurrect expired pixels",()=>{
  fill(solid,[255,0,0,255]);draw("Frame Freeze",1,{durationSeconds:1},{time:0},solid);fill(solid,[0,0,255,255]);
  const extended=pixel(draw("Frame Freeze",1,{durationSeconds:2},{time:.4},solid),48,32),before=pixel(draw("Frame Freeze",1,{durationSeconds:2},{time:1.5},solid),48,32),shortened=pixel(draw("Frame Freeze",1,{durationSeconds:1},{time:1.6},solid),48,32),notResurrected=pixel(draw("Frame Freeze",1,{durationSeconds:16},{time:1.7},solid),48,32);
  check(extended[0]===255&&before[0]===255&&shortened[2]===255&&notResurrected[2]===255,"Duration edit must retain original deadline, shorten it, then latch expiry");return {extended,before,shortened,notResurrected};
 });
 await test("Freeze mode switches, zero/re-enable and backward presentation time capture fresh live pixels",()=>{
  fill(solid,[255,0,0,255]);draw("Frame Freeze",1,{behavior:"Earlier Open Play"},{time:0},solid);fill(solid,[0,0,255,255]);const legacy=pixel(draw("Frame Freeze",1,{behavior:"Earlier Open Play"},{time:20},solid),48,32),manual=pixel(draw("Frame Freeze",1,{behavior:"Manual Meaning"},{time:20.1},solid),48,32);check(legacy[0]===255&&manual[2]===255,"Mode change must discard prior capture lifecycle");
  fill(solid,[0,255,0,255]);draw("Frame Freeze",0,{}, {time:20.2},solid);const zeroReset=pixel(draw("Frame Freeze",1,{}, {time:20.3},solid),48,32);check(zeroReset[1]===255&&zeroReset[2]===0,"Zero/re-enable must capture green");
  fill(solid,[255,255,0,255]);const back=pixel(draw("Frame Freeze",1,{}, {time:1},solid),48,32);check(back[0]===255&&back[1]===255&&back[2]===0,"Backward time must capture current yellow, not prior green");return {legacy,manual,zeroReset,back};
 });
 await test("Two finite Freeze slots retain independent upstream captures and expiry times",()=>{
  const fx=(value=1,token=0)=>({name:"Frame Freeze",on:true,value,params:{captureToken:token}}),render=(time,a,b)=>{renderer.render(solid,[a,b],{time});return pixel(renderer.readPixels(),48,32);};
  fill(solid,[255,0,0,255]);render(0,fx(),fx());fill(solid,[0,0,255,255]);render(.4,fx(0),fx(1,1));fill(solid,[0,255,0,255]);render(.5,fx(),fx(1,1));fill(solid,[255,255,0,255]);const secondHeld=render(1.1,fx(),fx(1,1)),firstHeld=render(1.401,fx(),fx(1,1)),allLive=render(1.501,fx(),fx(1,1));
  check(secondHeld[2]===255&&secondHeld[1]===0,"Second slot must retain blue despite first retaining green");check(firstHeld[1]===255&&firstHeld[0]===0&&firstHeld[2]===0,"Second expiry must reveal first slot's held green");check(allLive[0]===255&&allLive[1]===255&&allLive[2]===0,"First expiry must finally reveal live yellow");return {secondHeld,firstHeld,allLive,captureTimes:[.5,.4],deadlines:[1.5,1.4]};
 });
 await test("Earlier saved Isolator and Freeze presets round-trip without silently adopting new algorithms",()=>{
  const saved=restoreVideoState(JSON.parse(JSON.stringify(snapshotVideoState(restoreVideoState({version:1,fx:{left:[{name:"Isolator Bass",on:true,value:1,params:{}},{name:"Frame Freeze",on:true,value:1,params:{captureToken:0}}]}}))))),[isolator,freeze]=saved.fx.left;
  check(isolator.params.behavior==="Earlier Open Play"&&freeze.params.behavior==="Earlier Open Play"&&freeze.params.captureToken===0,"Legacy migration marker/token lost");fill(solid,[100,120,140,128]);const silent=pixel(draw(isolator.name,isolator.value,isolator.params,{bass:0},solid),48,32),bass=pixel(draw(isolator.name,isolator.value,isolator.params,{bass:1},solid),48,32);check(silent.every((v,i)=>Math.abs(v-[100,120,140,128][i])<=1)&&bass.every((v,i)=>Math.abs(v-[100,18,21,128][i])<=2),"Legacy warm attenuation/silence identity changed");
  fill(solid,[255,0,0,255]);draw(freeze.name,freeze.value,freeze.params,{time:0},solid);fill(solid,[0,0,255,255]);const held=pixel(draw(freeze.name,freeze.value,freeze.params,{time:100},solid),48,32);check(held[0]===255&&held[2]===0,"Earlier saved Freeze must remain indefinite");return {modes:[isolator.params.behavior,freeze.params.behavior],silent,bass,held,time:100,meaning:"Earlier Open Play compatibility only"};
 });
 for(let band=0;band<8;band++)await test("Manual Analyzer unit vector independently owns column "+band,()=>{
  const spectrum8=Array(8).fill(0);spectrum8[band]=.75;const observed=[];
  for(const alpha of [255,128]){fill(solid,[40,90,160,alpha]);const out=draw("Analyzer",1,{}, {spectrum8},solid),row=[];
   for(let column=0;column<8;column++){const p=pixel(out,column*12+6,32);row.push(p);check(p.slice(0,3).every((v,i)=>Math.abs(v-(column===band&&i===1?255:0))<=2)&&Math.abs(p[3]-alpha)<=1,"Eight independent column ownership mismatch: "+JSON.stringify({band,column,alpha,p}));}
   const above=pixel(out,band*12+6,4);check(above.slice(0,3).every(v=>v<=2)&&Math.abs(above[3]-alpha)<=1,"Selected bar must be black above its75% height");observed.push({alpha,row,above});
  }
  return {input:spectrum8,observed,geometry:"Eight equal12pixel columns on96x64 output; supplied unit vectors prove geometry, not measured audio"};
 });
 await test("Manual Analyzer hue, gain and amount have numeric controls while retaining source alpha",()=>{
  fill(solid,[40,90,160,128]);const spectrum8=[.25,0,0,0,0,0,0,0],green=draw("Analyzer",1,{}, {spectrum8},solid),red=draw("Analyzer",1,{hue:0},{spectrum8},solid),tall=draw("Analyzer",1,{hue:0,gain:4},{spectrum8},solid),gainZero=draw("Analyzer",1,{gain:0},{spectrum8},solid),half=draw("Analyzer",.5,{hue:0,gain:4},{spectrum8},solid);
  const g=pixel(green,6,56),r=pixel(red,6,56),above=pixel(red,6,32),high=pixel(tall,6,4),zero=pixel(gainZero,6,56),mixed=pixel(half,6,32);
  check(g[1]>=253&&g[0]<=2&&g[2]<=2&&r[0]>=253&&r[1]<=2&&r[2]<=2,"Hue must change green→red without moving the bar");check(above.slice(0,3).every(v=>v<=2)&&high[0]>=253&&high[1]<=2&&high[2]<=2,"Gain4 must lift actual.25height to fullheight");check(zero.slice(0,3).every(v=>v<=2),"Explicit gain0 must draw black instead of default gain1");check([g,r,above,high,zero,mixed].every(p=>Math.abs(p[3]-128)<=1),"Analyzer must preserve partial source alpha");check(mixed.slice(0,3).every((v,i)=>Math.abs(v-[148,45,80][i])<=2),"Amount.5 source/red blend numeric mismatch: "+mixed);
  const bypass=draw(null,1,{}, {},solid),off=draw("Analyzer",0,{hue:0},{spectrum8},solid);check(difference(bypass,off)<.01,"Analyzer amount0 must be exact source bypass");return {green:g,red:r,above,gain4:high,gain0:zero,halfAmount:mixed,zeroAmountDifference:difference(bypass,off)};
 });
 await test("Manual Analyzer missing or malformed eight-band input bypasses actual source with explicit diagnostics",()=>{
  pattern();const bypass=draw(null),observed=[];
  for(const spectrum8 of [undefined,null,Array(7).fill(0),Array(9).fill(0),Array(8),[NaN,0,0,0,0,0,0,0],[-.1,0,0,0,0,0,0,0],[1.1,0,0,0,0,0,0,0],new Float32Array(8)]){const out=draw("Analyzer",1,{}, {spectrum8}),diagnostics=renderer.diagnostics(),delta=difference(out,bypass);check(delta<.01&&!diagnostics.spectrum8Available&&diagnostics.slots[0].sourceBypass&&diagnostics.slots[0].reason==="spectrum8-unavailable","Malformed data was fabricated or not diagnosed: "+JSON.stringify({delta,diagnostics}));observed.push({input:spectrum8===undefined?"undefined":JSON.stringify(spectrum8),difference:delta,diagnostics});}
  let calls=0;const hostile={...base};Object.defineProperty(hostile,"spectrum8",{get(){calls++;throw Error("Unexpected spectrum getter");}});renderer.render(fixture,[{name:"Analyzer",on:true,value:1}],hostile);check(calls===0&&difference(renderer.readPixels(),bypass)<.01&&renderer.diagnostics().slots[0].reason==="spectrum8-unavailable","Top-level spectrum accessor executed or bypass changed");
  const vector=Array(8).fill(0);Object.defineProperty(vector,"4",{get(){calls++;throw Error("Unexpected element getter");}});const out=draw("Analyzer",1,{}, {spectrum8:vector});check(calls===0&&difference(out,bypass)<.01,"Spectrum element accessor executed or bypass changed");return {observed,accessorsCalled:calls,scope:"No fallback from bass/mid/treble; no scalar coercion or fabricated independent spectrum"};
 });
 await test("Manual Analyzer valid silence stays available black while earlier three-band saved presets remain separate",()=>{
  fill(solid,[40,90,160,128]);const zero=draw("Analyzer",1,{}, {spectrum8:Array(8).fill(0),bass:1,mid:1,treble:1},solid),p=pixel(zero,48,32),diagnostics=renderer.diagnostics();check(p.slice(0,3).every(v=>v<=1)&&Math.abs(p[3]-128)<=1&&diagnostics.spectrum8Available&&!diagnostics.slots[0].sourceBypass&&diagnostics.slots[0].reason===null,"Valid silence must be black, available, and independent of coarse bands");
  const old=restoreVideoState(JSON.parse(JSON.stringify(snapshotVideoState(restoreVideoState({version:1,fx:{left:[{name:"Analyzer",on:true,value:1,params:{}}]}}))))).fx.left[0];check(old.params.behavior==="Earlier Open Play","Earlier saved Analyzer silently adopted eight-band behavior");fill(solid,[0,0,0,255]);const earlier=draw(old.name,old.value,old.params,{spectrum8:undefined,bass:1,mid:0,treble:0},solid),left=pixel(earlier,10,32),right=pixel(earlier,80,32),legacyDiagnostics=renderer.diagnostics();check(left[0]>=253&&Math.abs(left[1]-51)<=2&&Math.abs(left[2]-26)<=2&&right.slice(0,3).every(v=>v<=1)&&legacyDiagnostics.slots[0].reason===null,"Earlier three-bar/fixed-color rendering or compatibility diagnostic changed");return {validSilent:p,diagnostics,earlierMode:old.params.behavior,legacyLeft:left,legacyRight:right,legacyDiagnostics};
 });
 await test("Actual pipeline keeps independent left, right and master Analyzer vectors in their own targets",()=>{
  const pipeline=createVideoPipeline({width,height}),left=canvas(),right=canvas(),read=c=>{const ctx=canvas().getContext("2d");ctx.drawImage(c,0,0);return ctx.getImageData(0,0,width,height).data;},unit=band=>Array.from({length:8},(_,i)=>i===band?.75:0),fx=hue=>({name:"Analyzer",on:true,value:1,params:{hue}}),settings={fx:{left:[fx(120)],right:[fx(240)],master:[]}},context={time:0,amount:0,channels:[{spectrum8:unit(1)},{spectrum8:unit(6)}],master:{spectrum8:unit(3)}};
  fill(left,[50,60,70,255]);fill(right,[80,90,100,255]);
  try{let result=pipeline.render([left,right],settings,context);const l=read(result.channels[0]),r=read(result.channels[1]);check(pixel(l,18,32)[1]>=253&&pixel(l,78,32).slice(0,3).every(v=>v<=2),"Left vector leaked or was stripped");check(pixel(r,78,32)[2]>=253&&pixel(r,18,32).slice(0,3).every(v=>v<=2),"Right vector leaked or was stripped");settings.fx.master=[fx(0)];result=pipeline.render([left,right],settings,{...context,time:.1});const master=read(result.output),lp=read(result.channels[0]),rp=read(result.channels[1]);check(pixel(master,42,32)[0]>=253&&pixel(master,18,32).slice(0,3).every(v=>v<=2)&&pixel(master,78,32).slice(0,3).every(v=>v<=2),"Master did not consume its independent vector exactly once");check(difference(l,lp)<.01&&difference(r,rp)<.01,"Master Analyzer changed channel previews");return {left:pixel(l,18,32),right:pixel(r,78,32),master:pixel(master,42,32),otherMasterColumns:[pixel(master,18,32),pixel(master,78,32)],source:"Supplied independent target vectors through actual pipeline; actual PCM tested separately"};}finally{pipeline.dispose();}
 });
 async function waitAudio(seconds){const target=engine.ctx.currentTime+seconds,deadline=performance.now()+10000;while(engine.ctx.currentTime<target){if(performance.now()>deadline)throw Error("Audio clock did not reach fixed aperture");await new Promise(requestAnimationFrame);}}
 const settleAudio=()=>waitAudio(4*2048/engine.ctx.sampleRate);
 function spectrumTone(band){const sr=engine.ctx.sampleRate,edges=videoAnalysisPolicy.spectrum8Hz,first=Math.max(1,Math.ceil(edges[band]*2048/sr)),last=Math.min(1023,Math.ceil(Math.min(edges[band+1],sr/2)*2048/sr)-1);check(last>=first,"Actual sample rate has no FFT bin for band"+band);const bin=Math.max(first,Math.min(last,Math.round(Math.sqrt(edges[band]*Math.min(edges[band+1],sr/2))*2048/sr)));return{band,bin,frequency:bin*sr/2048};}
 let spectrumVoice=0;
 async function playSpectrumTone(tone){const sr=engine.ctx.sampleRate,length=2048*128,duration=length/sr,buffer=engine.ctx.createBuffer(1,length,sr),pcm=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)pcm[i]=.6*Math.sin(2*Math.PI*tone.bin*i/2048);const deck={index:0,track:{id:"analyzer-original-pcm-"+(++spectrumVoice),duration,bpm:120},position:0,rate:1,playing:false,processing:false,keylock:false,keyShift:0,reverse:false,loop:true,loopIn:0,loopOut:duration,stems:[true,true,true,true],stemFX:[false,false,false,false]};engine.buffers.set(deck.track.id,buffer);await engine.start(deck);return deck;}
 await test("Actual eight independent PCM tones reach their measured Analyzer columns with bounded FFT leakage",async()=>{
  if(audioSetupError)throw audioSetupError;await audioReady;const observed=[];let deck;
  try{for(let band=0;band<8;band++){if(deck)engine.pause(deck);const tone=spectrumTone(band);deck=await playSpectrumTone(tone);engine.videoAnalysis(0);await settleAudio();const measured=engine.videoAnalysis(0),v=measured.spectrum8;check(measured.spectrum8Available&&Array.isArray(v)&&v.length===8,"Actual engine spectrum unavailable");const other=v.filter((_,i)=>i!==band),dominance=v[band]/Math.max(...other,1e-12),share=v[band]**2/v.reduce((sum,n)=>sum+n*n,0);check(v.indexOf(Math.max(...v))===band&&dominance>=1.5&&share>=.65,"Measured intended band failed predeclared Blackman leakage limits: "+JSON.stringify({band,v,dominance,share}));
    fill(solid,[40,90,160,255]);const out=draw("Analyzer",1,{gain:2},measured,solid),heights=[],expected=[];for(let column=0;column<8;column++){let heightPixels=0;for(let y=0;y<height;y++){const p=pixel(out,column*12+6,y);if(p[1]>=253&&p[0]<=2&&p[2]<=2)heightPixels++;else check(p.slice(0,3).every(n=>n<=2),"Unexpected color outside measured bars");}const anticipated=Math.round(Math.min(1,v[column]*2)*height);heights.push(heightPixels);expected.push(anticipated);check(Math.abs(heightPixels-anticipated)<=1,"Actual measured vector→pixel height mismatch: "+JSON.stringify({band,column,v,heightPixels,anticipated}));}
    check(heights[band]>=Math.max(...heights.filter((_,i)=>i!==band))+4,"Intended measured band must visibly dominate its bar");observed.push({tone,sampleRate:engine.ctx.sampleRate,fftSize:2048,time:engine.ctx.currentTime,measured,dominance,powerShare:share,pixelHeights:heights,expectedHeights:expected});
   }
   engine.pause(deck);await settleAudio();const paused=engine.videoAnalysis(0),out=draw("Analyzer",1,{},paused,solid),p=pixel(out,48,32);check(paused.spectrum8Available&&paused.spectrum8.every(n=>n===0)&&p.slice(0,3).every(n=>n<=1)&&renderer.diagnostics().slots[0].reason===null,"Actual pause must yield available silent black bars");return {observed,paused:{measured:paused,pixel:p},leakagePolicy:"Intended band≥1.5x every other band and≥65% total measured power; actual bar heights match each raw measured value±1pixel, rather than pretending leakage is zero",scope:"Actual AudioEngine PCM→real pre-EQ FFT8→normalized FX context→GPU columns; independently chosen bands/height/color, no vendor equivalence"};
  }finally{if(deck)engine.pause(deck);}
 });
 await test("Changing Analyzer source, hue and enable state leaves held actual post-master PCM amplitude unchanged",async()=>{
  if(audioSetupError)throw audioSetupError;await audioReady;const tone=spectrumTone(4),deck=await playSpectrumTone(tone),observed=[];
  try{engine.videoAnalysis(4);await settleAudio();for(const enabled of [false,true,false]){const rows=[];for(let i=0;i<6;i++){await waitAudio(2048/engine.ctx.sampleRate);const signal=engine.videoAnalysis(4);pattern(i);draw(enabled?"Analyzer":null,1,{hue:i*60,gain:2},signal);rows.push({time:engine.ctx.currentTime,level:signal.level,spectrum8:signal.spectrum8});}observed.push({enabled,rows,mean:rows.reduce((sum,row)=>sum+row.level,0)/rows.length});}
   const levels=observed.map(row=>row.mean);check(levels[0]>.001&&Math.max(...levels)-Math.min(...levels)<.0005,"Read-only Analyzer rendering changed fixed-window actual master RMS: "+levels);return {tone,observed,tolerance:.0005,apertureSeconds:2048/engine.ctx.sampleRate,scope:"Held periodic original PCM; equal fixed post-toggle RMS windows. Not sample-for-sample audio equality or device acceptance."};
  }finally{engine.pause(deck);}
 });
 await test("Transparent resize and active mirror retain straight red at partial alpha",()=>{
  const source=document.createElement("canvas");source.width=2;source.height=1;
  const input=source.getContext("2d").createImageData(2,1);input.data.set([255,0,0,255,0,0,0,0]);source.getContext("2d").putImageData(input,0,0);
  const reference=document.createElement("canvas");reference.width=4;reference.height=1;reference.getContext("2d").drawImage(source,0,0,4,1);
  const expected=reference.getContext("2d").getImageData(0,0,4,1).data;
  const small=createVideoEffects({width:4,height:1});
  try {
   small.render(source,[],{time:0});const bypass=small.readPixels();
   for(let x=0;x<4;x++)for(let c=0;c<4;c++)check(Math.abs(bypass[x*4+c]-expected[x*4+c])<=1,`Bypass straight-alpha mismatch pixel${x}/channel${c}: actual${bypass[x*4+c]} reference${expected[x*4+c]}`);
   small.render(source,[{name:"Mirror",on:true,value:1,params:{axis:"Horizontal"}}],{time:1});const mirrored=small.readPixels();
   check([...mirrored].some((v,i)=>i%4===3&&v>0&&v<255),"Fixture must contain partial alpha after geometry");
   for(let x=0;x<4;x++)if(mirrored[x*4+3]>0)check(mirrored[x*4]===255,`Active mirror darkened straight red to${mirrored[x*4]} at alpha${mirrored[x*4+3]}`);
   return {bypass:[...bypass],canvas2d:[...expected],mirrored:[...mirrored]};
  }finally{small.dispose();}
 });
 const failures=results.filter(result=>result.status==="fail");summary.textContent=`${results.length-failures.length}/${results.length} independent Video FX pixel checks passed.`;
 output.textContent=JSON.stringify({scope:"Actual WebGL2 render/readPixels; original algorithms only; no vendor/native equivalence",catalog:videoEffectCatalog.length,results},null,2);
 renderer.dispose();try{engine?.videoAnalyzers?.dispose();engine?.silence();await engine?.ctx?.close();}catch(error){audioMessages.push("Cleanup: "+error.message);}run.disabled=false;
};
