import { createVideoTransitions, videoTransitionCatalog } from "./video-transitions.js";

const W = 64, H = 48;
const $ = (selector) => document.querySelector(selector);
const makeCanvas = (w = W, h = H) => Object.assign(document.createElement("canvas"), { width: w, height: h });
const left = makeCanvas(), right = makeCanvas();
let renderer, sequence = 0;
function fixture(canvas, side = 0, transparent = false) {
  const ctx = canvas.getContext("2d"), image = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 4;
    image.data.set(side ? [(x * 11 + y * 3) % 256, (x * 2 + y * 7 + 70) % 256, 210 - y * 3, 255] :
      [225 - x * 2, (x * 7 + y * 11) % 256, (x * 3 + y * 5) % 256, transparent ? 40 + y * 4 : 255], p);
  }
  // Asymmetric corner markers catch horizontal/vertical inversion and mirroring.
  ctx.putImageData(image, 0, 0);
  ctx.fillStyle = side ? "#00ffff" : "#ff0000"; ctx.fillRect(0, 0, 6, 4);
  ctx.fillStyle = side ? "#ff00ff" : "#00ff00"; ctx.fillRect(W - 9, 0, 9, 7);
  ctx.fillStyle = side ? "#ffff00" : "#0000ff"; ctx.fillRect(0, H - 8, 7, 8);
}
function solid(canvas, color) {
  const ctx = canvas.getContext("2d"); ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
}
function pixels(canvas) {
  const width = canvas.width, height = canvas.height;
  const gl = canvas.getContext("webgl"), bottom = new Uint8Array(width * height * 4), top = new Uint8Array(bottom.length);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, bottom);
  const error = gl.getError(); if (error !== gl.NO_ERROR) throw new Error("WebGL error " + error);
  for (let y = 0; y < height; y++) top.set(bottom.subarray((height - 1 - y) * width * 4, (height - y) * width * 4), y * width * 4);
  return top;
}
function draw(name, amount, options = {}) {
  return pixels(renderer.render(left, right, { name, amount, time: 1.23, bpm: 123, leftLevel: 0.4, rightLevel: 0.8, frameId: ++sequence, ...options }));
}
function assert(value, message) { if (!value) throw new Error(message); }
function same(a, b, tolerance = 2) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > tolerance) return false;
  return true;
}
function delta(a, b) { let total = 0; for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]); return total / a.length; }
function hash(bytes) { let value = 2166136261; for (const b of bytes) value = Math.imul(value ^ b, 16777619); return (value >>> 0).toString(16); }
function middle(bytes) { const p = ((H / 2) * W + W / 2) * 4; return bytes.slice(p, p + 4); }

export async function runVideoTransitionChecks() {
  const checks = [], alphaEdgeProbe = {}, manualCorrectionProbe = {}, start = performance.now();
  const check = (name, run) => { try { run(); checks.push({ name, passed: true }); } catch (error) { checks.push({ name, passed: false, error: error.message }); } };
  renderer?.dispose(); renderer = createVideoTransitions({ width: W, height: H });
  fixture(left); fixture(right, 1);
  const expectedLeft = left.getContext("2d").getImageData(0, 0, W, H).data;
  const expectedRight = right.getContext("2d").getImageData(0, 0, W, H).data;
  check("33 resource names remain distinct from the Crossfade baseline", () => {
    assert(videoTransitionCatalog.length === 34, "34 entries required");
    assert(videoTransitionCatalog.filter((c) => c.provenance === "manifest").length === 7, "7 manifest entries");
    assert(videoTransitionCatalog.filter((c) => c.candidate).length === 26, "26 candidates");
    assert(videoTransitionCatalog.every((c) => !c.referenceEquivalent), "No reference equivalence claim");
  });
  for (const entry of videoTransitionCatalog) {
    if (entry.name === "Upfaders Only") continue;
    check(entry.name + ": both live endpoints, marker orientation and alpha", () => {
      renderer.reset(); assert(same(draw(entry.name, 0), expectedLeft), "Left endpoint/orientation differs");
      assert(same(draw(entry.name, 1), expectedRight), "Right endpoint/orientation differs");
    });
  }
  check("Resource-name fingerprints differ apart from the documented first-pass BoxBoth/BoxH alias", () => {
    const signatures = new Map();
    for (const entry of videoTransitionCatalog.filter((c) => !c.baseline)) {
      const signature = [0.025, 0.23, 0.47, 0.71, 0.975].map((amount) => {
        fixture(left); renderer.reset(); draw(entry.name, 0); draw(entry.name, 0.11);
        const ctx = left.getContext("2d"); ctx.fillStyle = "#00c87a";
        ctx.fillRect(13, 11, 29, 21);
        return hash(draw(entry.name, amount));
      }).join("/");
      assert(!signatures.has(signature) || (entry.name === "Box Both" && signatures.get(signature) === "Box H"), entry.name + " unexpectedly duplicates " + signatures.get(signature));
      signatures.set(signature, entry.name);
    }
  });
  check("Wipe orientation: horizontal is left-to-right, vertical top-to-bottom", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff");
    renderer.reset(); const horizontal = draw("Wipe H", 0.5);
    renderer.reset(); const vertical = draw("Wipe V", 0.5);
    const at = (data, x, y) => data.slice((y * W + x) * 4, (y * W + x) * 4 + 4);
    assert(at(horizontal, 8, 30)[2] > 250 && at(horizontal, 56, 8)[0] > 250, "Horizontal axis reversed");
    assert(at(vertical, 56, 8)[2] > 250 && at(vertical, 8, 40)[0] > 250, "Vertical axis reversed");
  });
  check("Crossfade alpha is premultiplied for mixing and straight in output", () => {
    solid(left, "rgba(255,0,0,.5)"); solid(right, "#0000ff"); renderer.reset();
    const p = middle(draw("Crossfade", 0.5));
    assert(Math.abs(p[0] - 85) <= 2 && Math.abs(p[2] - 170) <= 2 && Math.abs(p[3] - 191) <= 2, "Expected straight RGBA ~85/0/170/191, got " + [...p]);
  });
  check("Upfaders Only ignores amount at endpoints and exposes both input gains", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    const at0 = draw("Upfaders Only", 0), at1 = draw("Upfaders Only", 1);
    assert(same(at0, at1), "Crossfader altered Upfaders Only");
    assert(middle(at0)[0] > 250 && middle(at0)[2] > 250, "Both sources must contribute");
    assert(middle(draw("Upfaders Only", 0.8, { upfaders: [1, 0] }))[0] > 250, "Left gain lost");
    const rightOnly = middle(draw("Upfaders Only", 0.2, { upfaders: [0, 1] }));
    assert(rightOnly[0] < 2 && rightOnly[2] > 250, "Right isolation failed");
    assert(draw("Upfaders Only", 0.5, { upfaders: [0, 0] }).every((v) => v === 0), "Zero upfaders must yield transparent black");
  });
  check("Scratch selects live inputs at independent end-cut bands and keeps them live through interior travel", () => {
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();draw("Scratch",0);
    draw("Scratch",.7);solid(left,"#00ff00");const liveLeft=middle(draw("Scratch",.7));
    assert(liveLeft[1]>250&&liveLeft[0]<2,"Held Scratch fader froze or displaced selected left source");
    const justBefore=middle(draw("Scratch",.9499)),cutRight=middle(draw("Scratch",.95));
    assert(justBefore[1]>250&&justBefore[2]<2&&cutRight[2]>250&&cutRight[1]<2,"Right end cut not at declared95% threshold");
    solid(right,"#ffff00");const liveRight=middle(draw("Scratch",.4));
    assert(liveRight[0]>250&&liveRight[1]>250&&liveRight[2]<2,"Held right side did not follow live input changes");
    const beforeLeft=middle(draw("Scratch",.0501)),cutLeft=middle(draw("Scratch",.05));
    assert(beforeLeft[0]>250&&beforeLeft[1]>250&&cutLeft[0]<2&&cutLeft[1]>250,"Left end cut not at declared5% threshold");
    manualCorrectionProbe.scratch={liveLeft:[...liveLeft],beforeRight:[...justBefore],cutRight:[...cutRight],liveRight:[...liveRight],beforeLeft:[...beforeLeft],cutLeft:[...cutLeft],thresholdStatus:"Independent5%/95% bands; current reference thresholds unknown"};
  });
  check("Latch50 live midpoint cut follows held-fader input changes and declares right tie", () => {
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();draw("Latch 50",.49);
    solid(left,"#00ff00");const liveLeft=middle(draw("Latch 50",.49));
    assert(liveLeft[0]<2&&liveLeft[1]>250,"Left midpoint side froze instead of following current frame");
    const exactTie=middle(draw("Latch 50",.5));assert(exactTie[2]>250&&exactTie[1]<2,"Declared midpoint tie did not choose right");
    solid(right,"#ffff00");const liveRight=middle(draw("Latch 50",.51));
    assert(liveRight[0]>250&&liveRight[1]>250&&liveRight[2]<2,"Right midpoint side froze instead of following current frame");
    manualCorrectionProbe.latch50={liveLeft:[...liveLeft],exactTie:[...exactTie],liveRight:[...liveRight],tieStatus:"Independent right-at50% tie; current reference tie unknown"};
  });
  check("Center uses a spatially uniform live crossfade only in the central50% of travel", () => {
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();manualCorrectionProbe.center=[];
    for(const [amount,weight] of [[.125,0],[.25,0],[.375,.25],[.5,.5],[.625,.75],[.75,1],[.875,1]]){
      const actual=draw("Center",amount),expected=[Math.round(255*(1-weight)),0,Math.round(255*weight),255];
      for(let i=0;i<actual.length;i+=4)assert(same(actual.slice(i,i+4),expected),"Center is spatial or outside declared remap at"+amount+": "+[...actual.slice(i,i+4)]);
      manualCorrectionProbe.center.push({amount,declaredWeight:weight,pixel:[...middle(actual)]});
    }
  });
  check("Center preserves premultiplied alpha and live source changes at a held fader", () => {
    solid(left,"rgba(255,0,0,.5)");solid(right,"#0000ff");renderer.reset();
    const partial=middle(draw("Center",.5));assert(same(partial,[85,0,170,191]),"Center alpha crossfade incorrect: "+[...partial]);
    solid(left,"#00ff00");const live=middle(draw("Center",.375));assert(same(live,[0,191,64,255]),"Held Center fader did not blend current source: "+[...live]);
    manualCorrectionProbe.centerAlpha={partial:[...partial],live:[...live]};
  });
  check("Latch50 and Scratch hard cuts preserve selected live alpha and independent upfader silence", () => {
    for(const name of ["Latch 50","Scratch"]){
      solid(left,"rgba(255,0,0,.5)");solid(right,"rgba(0,0,255,.25)");renderer.reset();draw(name,0);
      const a=middle(draw(name,.49));assert(same(a,[255,0,0,128]),name+" selected-left alpha/chroma changed: "+[...a]);
      const b=middle(draw(name,name==="Scratch"?.95:.5));assert(same(b,[0,0,255,64]),name+" selected-right alpha/chroma changed: "+[...b]);
      const silent=draw(name,.7,{upfaders:[1,0]});assert(silent.every(v=>v===0),name+" selected zero upfader did not yield transparent black");
    }
  });
  check("Center/Latch50/Scratch retain manual fader and live-frame control under Reduced Motion", () => {
    solid(left,"#ff0000");solid(right,"#0000ff");
    for(const name of ["Center","Latch 50","Scratch"]){renderer.reset();draw(name,0,{reducedMotion:true});
      const before=draw(name,.2,{time:1,reducedMotion:true}),after=draw(name,.95,{time:2,reducedMotion:true});assert(delta(before,after)>80,name+" manual fader became inert under Reduced Motion");
      solid(right,"#ffff00");const live=middle(draw(name,.95,{time:3,reducedMotion:true}));assert(live[0]>250&&live[1]>250&&live[2]<2,name+" froze current input under Reduced Motion");solid(right,"#0000ff");
    }
  });
  check("ScratchFade uses both current live inputs at a held interior fader, independently of interior amount", () => {
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();draw("Scratch Fade",0);draw("Scratch Fade",.2);
    solid(left,"#00ff00");const liveLeft=middle(draw("Scratch Fade",.4));assert(same(liveLeft,[0,255,255,255]),"Departing source froze or was faded by amount: "+[...liveLeft]);
    solid(right,"#ff0000");const liveRight=middle(draw("Scratch Fade",.7));assert(same(liveRight,[255,255,0,255]),"Incoming source not live: "+[...liveRight]);
    assert(same(draw("Scratch Fade",.1),draw("Scratch Fade",.9)),"Interior amount altered additive upfader policy");
    manualCorrectionProbe.scratchFade={liveLeft:[...liveLeft],liveRight:[...liveRight],policy:"Live additive interior; independent inclusive5%/95% end bands, exact reference curve unknown"};
  });
  check("ScratchFade end bands cut opposite live input and both upfaders independently control the interior", () => {
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();
    for(const [amount,expected] of [[.05,[255,0,0,255]],[.0501,[255,0,255,255]],[.9499,[255,0,255,255]],[.95,[0,0,255,255]]])
      assert(same(middle(draw("Scratch Fade",amount)),expected),"ScratchFade end-band boundary at"+amount);
    assert(same(middle(draw("Scratch Fade",.5,{upfaders:[.25,.75]})),[85,0,255,191]),"ScratchFade lost independent premultiplied upfaders");
    assert(same(middle(draw("Scratch Fade",.5,{upfaders:[0,1]})),[0,0,255,255]),"Left mute changed right");
    assert(same(middle(draw("Scratch Fade",.5,{upfaders:[1,0]})),[255,0,0,255]),"Right mute changed left");
    assert(draw("Scratch Fade",.5,{upfaders:[0,0]}).every(v=>v===0),"Both upfaders zero not transparent silence");
  });
  check("ScratchFade preserves live alpha under ReducedMotion without a retained snapshot", () => {
    solid(left,"rgba(255,0,0,.5)");solid(right,"rgba(0,0,255,.25)");renderer.reset();
    const before=middle(draw("Scratch Fade",.5,{reducedMotion:true}));assert(same(before,[255,0,128,128]),"Live additive alpha/chroma differs: "+[...before]);
    solid(left,"rgba(0,255,0,.5)");const after=middle(draw("Scratch Fade",.5,{time:3,reducedMotion:true}));
    assert(same(after,[0,255,128,128]),"ReducedMotion retained old outgoing frame: "+[...after]);
  });
  const at=(data,x,y)=>data.slice((y*W+x)*4,(y*W+x)*4+4);
  const cellPixels=data=>Array.from({length:9},(_,i)=>[...at(data,Math.floor(((i%3)+.5)*W/3),Math.floor((Math.floor(i/3)+.5)*H/3))]);
  check("GridSimple has exactly nine uniform3x3 live cells with declared discrete row-major changes",()=>{
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();manualCorrectionProbe.gridSimple=[];
    for(let count=0;count<=9;count++){
      const amount=count===9?1:(count+.2)/9,data=draw("Grid Simple",amount);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const rank=Math.floor((x+.5)/W*3)+3*Math.floor((y+.5)/H*3);
        assert(same(at(data,x,y),rank<count?[0,0,255,255]:[255,0,0,255]),"GridSimple geometry/count mismatch at "+count+" cell "+rank);
      }
      manualCorrectionProbe.gridSimple.push({count,amount,cells:cellPixels(data)});
    }
  });
  check("GridFade has exactly nine3x3 live cells with a numeric continuous local fade, not discrete cuts",()=>{
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();manualCorrectionProbe.gridFade=[];
    for(let active=0;active<9;active++)for(const fraction of [.25,.75]){
      const amount=(active+fraction)/9,data=draw("Grid Fade",amount);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const rank=Math.floor((x+.5)/W*3)+3*Math.floor((y+.5)/H*3),weight=Math.max(0,Math.min(1,active+fraction-rank));
        assert(same(at(data,x,y),[Math.round(255*(1-weight)),0,Math.round(255*weight),255]),"GridFade numeric cell mismatch at "+active+"/"+fraction+" cell "+rank);
      }
      manualCorrectionProbe.gridFade.push({active,fraction,cells:cellPixels(data)});
    }
  });
  check("GridSequence renders nine cells in declared seeded non-row-major order and renews on a new endpoint departure",()=>{
    solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();draw("Grid Sequence",0);
    const expectedOrders=[[3,8,6,4,5,2,7,1,0],[3,0,8,4,2,7,6,5,1]];manualCorrectionProbe.gridSequence=[];
    for(let cycle=0;cycle<2;cycle++){
      if(cycle){draw("Grid Sequence",1);draw("Grid Sequence",.9);draw("Grid Sequence",.3);}
      for(let count=0;count<=9;count++){
        const amount=count===9?1:(count+.2)/9,data=draw("Grid Sequence",amount),selected=new Set(expectedOrders[cycle].slice(0,count));
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){
          const cell=Math.floor((x+.5)/W*3)+3*Math.floor((y+.5)/H*3);
          assert(same(at(data,x,y),selected.has(cell)?[0,0,255,255]:[255,0,0,255]),"GridSequence order/geometry differs in cycle "+cycle+" count "+count);
        }
      }
      manualCorrectionProbe.gridSequence.push({cycle,expectedOrder:expectedOrders[cycle]});
    }
  });
  check("Nine-cell grid transitions keep selected/blended sources live at held faders and respect independent upfaders",()=>{
    for(const name of ["Grid Simple","Grid Fade","Grid Sequence"]){
      solid(left,"#ff0000");solid(right,"#0000ff");renderer.reset();draw(name,.5);
      solid(left,"#00ff00");solid(right,"#ffffff");const live=draw(name,.5),muted=draw(name,.5,{upfaders:[0,0]});
      assert(live.some((v,i)=>i%4===1&&v>250),name+" retained old source colors");
      assert(live.every((v,i)=>i%4!==1||v>250),name+" source not current at every cell");
      assert(muted.every(v=>v===0),name+" ignored zero upfaders");
    }
  });
  check("BoxBoth firstH/secondV/thirdH passes exactly equal their Box kernels and interior reversals preserve direction",()=>{
    fixture(left);fixture(right,1);renderer.reset();const reference=createVideoTransitions({width:W,height:H});
    const equals=(amount,name)=>{const actual=draw("Box Both",amount),expected=pixels(reference.render(left,right,{name,amount,time:1.23,frameId:++sequence}));assert(same(actual,expected,0),"BoxBoth does not equal "+name+" at "+amount);return hash(actual);};
    try{
      draw("Box Both",0);const first=equals(.37,"Box H");equals(.73,"Box H");equals(.4,"Box H");
      draw("Box Both",1);const second=equals(.63,"Box V");equals(.2,"Box V");
      draw("Box Both",0);const third=equals(.37,"Box H");assert(first===third,"Third pass did not return to H");
      renderer.reset();equals(.37,"Box H");manualCorrectionProbe.boxBoth={firstH:first,secondV:second,thirdH:third,policy:"Observed endpoint departures; first/reset H; interior reversals retain axis"};
    }finally{reference.dispose();}
  });
  check("BoxBoth/GridSequence actual pixels reset on source identity, backward clock and explicit reset",()=>{
    fixture(left);fixture(right,1);const alternate=makeCanvas();alternate.getContext('2d').drawImage(left,0,0);
    const reference=createVideoTransitions({width:W,height:H});
    try{for(const name of ['Box Both','Grid Sequence']){
      const render=(source,amount,time=10)=>pixels(renderer.render(source,right,{name,amount,time,frameId:++sequence}));
      const expected=pixels(reference.render(left,right,{name,amount:.4,time:10,frameId:++sequence}));
      const second=()=>{renderer.reset();render(left,0);render(left,.4);render(left,1);return render(left,.4);};
      assert(delta(second(),expected)>3,name+' fixture did not distinguish the second traversal');
      assert(same(render(alternate,.4),expected,0),name+' source identity did not reset traversal');
      second();assert(same(render(left,.4,9),expected,0),name+' backward clock did not reset traversal');
      second();renderer.reset();assert(same(render(left,.4),expected,0),name+' explicit reset did not reset traversal');
    }}finally{reference.dispose();}
  });
  check("TileWave H/V follow numeric monotonic column/row progression with declared independent6x4 flip geometry",()=>{
    solid(left,"#ff0000");solid(right,"#0000ff");manualCorrectionProbe.tileWave={};
    for(const name of ["Tile Wave H","Tile Wave V"]){
      renderer.reset();const horizontal=name.endsWith('H'),samples=[];
      for(const amount of [.2,.35,.6,.8]){
        const data=draw(name,amount);
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){
          const px=(x+.5)/W,py=(y+.5)/H,cx=Math.floor(px*6),cy=Math.floor(py*4),delay=horizontal?cx/5:cy/3;
          const progress=Math.max(0,Math.min(1,amount*1.8-delay*.8)),width=Math.max(Math.abs(Math.cos(Math.PI*progress)),.02);
          let qx=px*6-cx-.5,qy=py*4-cy-.5;if(horizontal)qx/=width;else qy/=width;
          const expected=Math.abs(qx)>.5||Math.abs(qy)>.5?[0,0,0,0]:progress<.5?[255,0,0,255]:[0,0,255,255];
          assert(same(at(data,x,y),expected),name+" numeric geometry/axis mismatch at "+amount+" "+x+","+y+": "+[...at(data,x,y)]);
        }
        samples.push({amount,hash:hash(data)});
      }
      manualCorrectionProbe.tileWave[name]=samples;
    }
  });
  check("Corrected grid/wave/BoxBoth/ScratchFade manual fader responses remain live under ReducedMotion",()=>{
    for(const name of ["Grid Simple","Grid Fade","Grid Sequence","Tile Wave H","Tile Wave V","Box Both","Scratch Fade"]){
      fixture(left);fixture(right,1);renderer.reset();const a=draw(name,0,{time:1,reducedMotion:true}),b=draw(name,1,{time:2,reducedMotion:true});
      assert(delta(a,b)>20,name+" fader became inert");
      renderer.reset();const fixed=draw(name,.37,{time:3,reducedMotion:true}),later=draw(name,.37,{time:4,reducedMotion:true});assert(same(fixed,later,0),name+" changed without fader/source input");
    }
  });
  check("Smudge history, duplicate-frame stability, reset and mode isolation", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset(); draw("Smudge Fade", 0.5, { time: 1 });
    solid(left, "#00ff00"); solid(right, "#ffff00");
    const options = { time: 2, frameId: "same-logical-frame" };
    const withHistory = draw("Smudge Fade", 0.5, options), duplicate = draw("Smudge Fade", 0.5, options);
    assert(same(withHistory, duplicate, 0), "Duplicate frame advanced feedback");
    renderer.reset(); const withoutHistory = draw("Smudge Fade", 0.5, { time: 2 });
    assert(delta(withHistory, withoutHistory) > 5, "History did not contribute");
    draw("Default", 0.5); const switched = draw("Smudge Fade", 0.5, { time: 2 });
    assert(same(switched, withoutHistory), "Mode switch leaked history");
  });
  check("Same-frame Latch 50 threshold changes select the current live input", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    draw("Latch 50", 0.2, { frameId: "latch-controls", time: 10 });
    const p = middle(draw("Latch 50", 0.8, { frameId: "latch-controls", time: 10 }));
    assert(p[2] > 250 && p[0] < 2, "Same-frame crossing did not select right");
  });
  check("Same-frame Scratch endpoint then interior retains the new endpoint side", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    const options = { frameId: "scratch-controls", time: 10 };
    draw("Scratch", 0, options); draw("Scratch", 1, options);
    const p = middle(draw("Scratch", 0.7, options));
    assert(p[2] > 250 && p[0] < 2, "Same-frame endpoint bookkeeping retained old side");
  });
  check("Same-frame clock 10 to 12 to 11 clears actual Smudge feedback", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    draw("Smudge Fade", 0.5, { time: 9, frameId: "previous-frame" });
    solid(left, "#00ff00"); solid(right, "#ffff00");
    draw("Smudge Fade", 0.5, { time: 10, frameId: "clock-controls" });
    draw("Smudge Fade", 0.5, { time: 12, frameId: "clock-controls" });
    const backward = draw("Smudge Fade", 0.5, { time: 11, frameId: "clock-controls" });
    renderer.reset(); const clean = draw("Smudge Fade", 0.5, { time: 11 });
    assert(same(backward, clean), "Backwards clock retained preceding-frame feedback");
  });
  check("Same-frame controls replace current history without feeding it back", () => {
    solid(left, "#ff0000"); solid(right, "#0000ff"); renderer.reset();
    draw("Smudge Fade", 0.2, { time: 1, frameId: "current-controls" });
    const latest = draw("Smudge Fade", 0.8, { time: 2, frameId: "current-controls" });
    const repeated = draw("Smudge Fade", 0.8, { time: 2, frameId: "current-controls" });
    assert(same(latest, repeated, 0), "Control rerender advanced feedback");
    solid(left, "#000000"); solid(right, "#000000");
    const next = middle(draw("Smudge Fade", 0.5, { time: 3, frameId: "following-frame" }));
    assert(next[2] > 60 && next[2] > next[0] * 2, "Following frame did not retain the latest blue-dominant control output: " + [...next]);
  });
  check("Scaled transparent edge matches Canvas2D and retains straight red at fractional alpha", () => {
    const edge = makeCanvas(2, 1), expected = makeCanvas(4, 1), ctx = edge.getContext("2d");
    const image = ctx.createImageData(2, 1); image.data.set([255, 0, 0, 255, 0, 0, 0, 0]); ctx.putImageData(image, 0, 0);
    expected.getContext("2d").drawImage(edge, 0, 0, 4, 1);
    const reference = expected.getContext("2d").getImageData(0, 0, 4, 1).data;
    const scaled = createVideoTransitions({ width: 4, height: 1 });
    let actual;
    try { actual = pixels(scaled.render(edge, edge, { name: "Crossfade", amount: 0, frameId: 1 })); }
    finally { scaled.dispose(); }
    alphaEdgeProbe.fixture = "2x1 opaque red / transparent black scaled to 4x1";
    alphaEdgeProbe.expectedCanvas2D = [...reference]; alphaEdgeProbe.actualWebGL = [...actual];
    const fractional = [0, 1, 2, 3].filter((x) => actual[x * 4 + 3] > 0 && actual[x * 4 + 3] < 255);
    alphaEdgeProbe.fractionalAlphaIndices = fractional;
    assert(fractional.length > 0, "Fixture did not exercise a filtered alpha edge");
    assert(fractional.every((x) => actual[x * 4] >= 253), "Straight red was darkened by alpha interpolation: " + [...actual]);
    assert(same(actual, reference), "GPU scaling differs from Canvas2D: " + [...actual] + " vs " + [...reference]);
  });
  check("Live cuts and remaining filtered history paths retain red chroma at transparent edges", () => {
    const edge = makeCanvas(2, 1), ctx = edge.getContext("2d"), image = ctx.createImageData(2, 1);
    image.data.set([255, 0, 0, 255, 0, 0, 0, 0]); ctx.putImageData(image, 0, 0);
    const scaled = createVideoTransitions({ width: 4, height: 1 });
    alphaEdgeProbe.readPaths = [];
    try {
      for (const name of ["Latch 50", "Scratch", "Scratch Fade", "Smudge Fade"]) {
        scaled.reset(); scaled.render(edge, edge, { name, amount: 0.2, time: 1, frameId: 1 });
        const actual = pixels(scaled.render(edge, edge, { name, amount: 0.3, time: 2, frameId: 2 }));
        alphaEdgeProbe.readPaths.push({ name, actualWebGL: [...actual] });
        const visible = [0, 1, 2, 3].filter((x) => actual[x * 4 + 3] > 0);
        assert(visible.length > 0, name + " unexpectedly blank");
        assert(visible.every((x) => actual[x * 4] >= 253 && actual[x * 4 + 1] <= 2 && actual[x * 4 + 2] <= 2), name + " filtered premultiplied input incorrectly: " + [...actual]);
      }
    } finally { scaled.dispose(); }
  });
  check("Reduced motion removes clock-driven ripple while preserving fader control", () => {
    fixture(left); fixture(right, 1); renderer.reset();
    const a = draw("Water Bar H", 0.47, { time: 1.1, reducedMotion: true });
    const b = draw("Water Bar H", 0.47, { time: 2.4, reducedMotion: true });
    assert(same(a, b, 0), "Reduced motion still depends on time");
    assert(delta(a, draw("Water Bar H", 0.7, { time: 2.4, reducedMotion: true })) > 3, "Fader stopped responding");
    renderer.reset(); const animated = draw("Water Bar H", 0.47, { time: 1.1 });
    assert(delta(animated, draw("Water Bar H", 0.47, { time: 1.3 })) > 0.2, "Clock-driven original ripple is inert");
  });
  check("Unknown names fail explicitly and disposal is final/idempotent", () => {
    let rejected = false; try { draw("Invented unknown transition", 0.5); } catch { rejected = true; }
    assert(rejected, "Unknown transition silently substituted"); renderer.dispose(); renderer.dispose();
    rejected = false; try { draw("Default", 0.5); } catch { rejected = true; } assert(rejected, "Disposed renderer accepted work");
  });
  const timingScope = "CPU performance.now wall-clock around render() plus a WebGL finish() invocation, 640x360 output with synthetic canvas inputs. Not a GPU timer-query measurement, presentation timing, decode/effects/composite/capture pipeline latency, sustained frame rate, or 30fps proof. Browser timer resolution/rounding can report 0 or 0.1 ms; these values do not establish a zero-cost frame.";
  const benchmark = { scope: timingScope, samples: [] };
  try {
    const bench = createVideoTransitions({ width: 640, height: 360 });
    for (const entry of videoTransitionCatalog) {
      const before = performance.now(); const output = bench.render(left, right, { name: entry.name, amount: 0.47, time: 2, frameId: entry.name });
      output.getContext("webgl").finish(); benchmark.samples.push({ name: entry.name, ms: +(performance.now() - before).toFixed(2) });
    }
    bench.dispose();
  } catch (error) { benchmark.error = error.message; }
  checks.push({ name: "640x360 render sample completed for all 34 entries", passed: !benchmark.error && benchmark.samples.length === 34, ...(benchmark.error ? { error: benchmark.error } : {}) });
  const result = { passed: checks.filter((c) => c.passed).length, failed: checks.filter((c) => !c.passed).length, checks, alphaEdgeProbe, manualCorrectionProbe, supersededContracts: {historicalEvidence:"Existing video-transitions-browser-results.json retains executed original snapshot policies; those assertions are not reference acceptance.",changes:["Center spatial rectangle replaced by central-half live blend","Latch50 frozen snapshots replaced by live midpoint cut","Scratch frozen/scrubbed snapshots replaced by live end-cut hysteresis","ScratchFade frozen crossfade replaced by live additive interior/end cuts","GridSimple/Fade/Sequence replaced by nine-cell geometry and declared per-traversal seeded order","BoxBoth resolves alternating H/V passes","TileWaveH/V use monotonic column/row progress"],remainingOpen:"Exact curves/cut thresholds, BoxBoth alternation event, grid sequencing distribution, TileWave tile counts and current-version visual equivalence remain unverified."}, benchmark, timingScope, durationMs: +(performance.now() - start).toFixed(1), evidence: "Executed actual WebGL draw/readPixels on original synthetic canvas fixtures; no Serato/UI integration or visual-parity proof." };
  window.videoTransitionHarnessResult = result;
  $("#results").textContent = JSON.stringify(result, null, 2);
  $("#status").textContent = `${result.passed} passed / ${result.failed} failed`;
  renderer = createVideoTransitions({ width: W, height: H }); fixture(left); fixture(right, 1); preview();
  return result;
}
function preview() {
  renderer ??= createVideoTransitions({ width: W, height: H });
  const output = renderer.render(left, right, { name: $("#transition").value || "Crossfade", amount: Number($("#amount").value), time: performance.now() / 1000, frameId: ++sequence });
  $("#preview").replaceChildren(output); output.style.width = "640px";
}
$("#transition").innerHTML = videoTransitionCatalog.map((c) => `<option value="${c.name}">${c.name} (${c.provenance})</option>`).join("");
$("#transition").value = "Crossfade";
$("#run").onclick = async () => {
  $("#run").disabled = true; $("#status").textContent = "Running actual pixel checks…";
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try { await runVideoTransitionChecks(); } catch (error) { $("#status").textContent = "Harness failed"; $("#results").textContent = error.stack; window.videoTransitionHarnessResult = { passed: 0, failed: 1, fatal: error.message }; }
  finally { $("#run").disabled = false; }
};
$("#transition").onchange = () => { renderer?.reset(); preview(); };
$("#amount").oninput = preview;
fixture(left); fixture(right, 1);
try { preview(); } catch (error) { $("#status").textContent = "WebGL initialization failed"; $("#results").textContent = error.stack; }
