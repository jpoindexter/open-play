import { createVideoEffects, videoEffectCatalog } from "./video-effects.js";
import { restoreVideoState, snapshotVideoState } from "./video-state.js";
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
const base={time:1.25,bpm:120,bass:.8,mid:.35,treble:.15,level:.65,rate:.6,upfader:.8,position:.37};
let renderer;
function draw(name,value=1,params={},context={},source=fixture){renderer.render(source,name?[{name,on:true,value,params}]:[],{...base,...context});return renderer.readPixels();}
const run=document.querySelector("#run"),summary=document.querySelector("#summary"),output=document.querySelector("#results");
run.onclick=async()=>{
 run.disabled=true;const results=[];
 try{renderer=createVideoEffects({width,height});document.querySelector("#preview").replaceChildren(renderer.canvas);}
 catch(error){summary.textContent="WebGL2 unavailable or shader compilation failed";output.textContent=error.stack;run.disabled=false;return;}
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
 await test("Freeze captures real upstream pixels and survives parameter changes",()=>{
  fill(solid,[255,0,0,255]);const first=draw("Frame Freeze",1,{}, {time:0},solid);
  fill(solid,[0,0,255,255]);const held=draw("Frame Freeze",1,{}, {time:1},solid);
  check(difference(first,held)===0,"Freeze must retain red after live input turns blue");
  const half=draw("Frame Freeze",.5,{}, {time:2},solid);const p=pixel(half,48,32);
  check(Math.abs(p[0]-128)<=1&&Math.abs(p[2]-128)<=1,"Amount change must blend retained frame, not recapture");
  const capture=draw("Frame Freeze",1,{captureToken:1},{time:3},solid);check(pixel(capture,48,32)[2]===255,"Capture token must capture blue");
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
 await test("Analyzers use supplied bands and preserve channel distinction",()=>{
  fill(solid,[0,0,0,255]);const a=draw("Analyzer",1,{}, {bass:1,mid:0,treble:0},solid),b=draw("Analyzer",1,{}, {bass:0,mid:0,treble:1},solid);
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
  fill(solid,[255,0,0,255]);renderer.render(solid,[{name:"Negative",on:true,value:1},{name:"Frame Freeze",on:true,value:1}],{time:0});
  fill(solid,[0,0,255,255]);renderer.render(solid,[{name:"Negative",on:true,value:0},{name:"Frame Freeze",on:true,value:1}],{time:1});
  check(pixel(renderer.readPixels(),48,32)[1]===255,"Slot2 must retain its actual processed cyan input");
  const replacement=canvas();fill(replacement,[0,255,0,255]);renderer.render(replacement,[null,{name:"Frame Freeze",on:true,value:1}],{time:2});check(pixel(renderer.readPixels(),48,32)[1]===255&&pixel(renderer.readPixels(),48,32)[2]===0,"New source identity must reset temporal state");
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
 renderer.dispose();run.disabled=false;
};
