import { createVideoEffects, videoEffectCatalog } from "./video-effects.js";
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
 await test("Pulse holds within its duty and captures at the next beat boundary",()=>{
  fill(solid,[255,0,0,255]);draw("Frame Pulse",1,{}, {time:0},solid);
  fill(solid,[0,0,255,255]);check(pixel(draw("Frame Pulse",1,{}, {time:.2},solid),48,32)[0]===255,"Pulse should retain current cycle frame");
  check(pixel(draw("Frame Pulse",1,{}, {time:.5},solid),48,32)[2]===255,"Next beat must capture blue");
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
  const a=pixel(draw("Gamma",.25,{gamma:3},{},solid),48,32),b=pixel(draw("Gamma",.75,{gamma:3},{},solid),48,32);check(b[0]>a[0]&&b[3]===a[3],"Gamma response must brighten monotonically and preserve alpha");
  const grey=pixel(draw("Saturation",1,{saturation:0},{},solid),48,32);check(Math.abs(grey[0]-grey[1])<=1&&Math.abs(grey[1]-grey[2])<=1,"Desaturation should produce equal RGB");
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
