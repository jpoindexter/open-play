import {AudioEngine} from './engine.js';
import {createVideoMixer} from './video.js';
import {snapshotVideoState,restoreVideoState} from './video-state.js';
const $=s=>document.querySelector(s),assert=(v,m)=>{if(!v)throw Error(m);},raf=()=>new Promise(r=>requestAnimationFrame(r));
async function until(read,predicate,pump){const deadline=performance.now()+10000;let v;do{pump();v=read();if(predicate(v))return v;await raf();}while(performance.now()<deadline);throw Error('Actual opacity predicate timed out: '+JSON.stringify(v));}
async function fixture(color,name){const c=document.createElement('canvas');c.width=640;c.height=360;c.getContext('2d').fillStyle=color;c.getContext('2d').fillRect(0,0,640,360);return new File([await new Promise(r=>c.toBlob(r,'image/png'))],name,{type:'image/png'});}
const overlay=id=>({id,imageRef:id,kind:'image',on:true,x:.5,y:.5,scale:1,align:'center',opacity:1,animation:'none'});
async function run(){
 const report={observedAt:new Date().toISOString(),scope:'Actual mixer/GPU/PNG decode/AudioEngine. Independent channel-opacity policies; no source-video AV, physical hardware or reference-curve acceptance.',checks:[],notifications:[]};
 const state={settings:{},decks:[0,1].map(index=>({index,track:null,playing:false,position:0,rate:1})),video:{linked:true,crossLinked:false,cross:-1,transition:'Crossfade',width:640,height:360,fx:{left:[],right:[],master:[]},overlays:{left:[overlay('red')],right:[overlay('blue')],master:[]}}};
 const engine=new AudioEngine();engine.init();engine.analyser.disconnect();const resumed=engine.ctx.resume();let mixer,osc,gain;
 const canvas=$('#video-master'),ctx=canvas.getContext('2d'),pump=()=>mixer.tick(true),pixel=()=>[...ctx.getImageData(320,180,1,1).data];
 function expect(rgba){const actual=pixel();assert(actual.every((v,i)=>Math.abs(v-rgba[i])<=2),'Actual opacity pixels: '+JSON.stringify({actual,expected:rgba}));return actual;}
 const snap=()=>({pixel:pixel(),opacity:mixer.diagnostics().opacity,transport:state.video.linked,crossLinked:state.video.crossLinked,audioCross:engine.cross,audioLevels:engine.nodes.map(n=>n.level)});
 async function test(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()});}catch(e){report.checks.push({name,passed:false,error:e.stack||String(e)});}$('#status').textContent=`${report.checks.filter(c=>c.passed).length}/${report.checks.length} passed · ${name}`;$('#results').textContent=JSON.stringify(report,null,2);await raf();}
 try{
  await test('Actual decoded channel overlays, legacy links and real engine initialize',async()=>{
   await resumed;await engine.resume();mixer=createVideoMixer({state,engine,notify:m=>report.notifications.push(m)});mixer.bind(canvas);await mixer.setOverlayImage('left','red',await fixture('#ff0000','opacity-red.png'));await mixer.setOverlayImage('right','blue',await fixture('#0000ff','opacity-blue.png'));pump();expect([255,0,0,204]);assert(state.video.channelOpacityLinked.every(Boolean),'Legacy linked policy lost');return snap();
  });
  await test('Unlink left snapshots displayed level; subsequent real audio fader does not move it',()=>{
   assert(mixer.setOpacityLinked(0,false)===.8,'Unlink did not snapshot current effective gain');engine.mix(0,'level',.2);pump();expect([255,0,0,204]);assert(state.video.channelOpacityLinked[1]&&state.video.linked&&!state.video.crossLinked,'Unlink mutated unrelated authority');return snap();
  });
  await test('Left manual0/.5/1 produce actual endpoint alpha and retain right audio link',()=>{
   state.video.cross=-1;const values=[];for(const value of [0,.5,1]){mixer.setOpacity(0,value);pump();values.push({value,pixel:expect(value?[255,0,0,255*value]:[0,0,0,0])});}assert(state.video.channelOpacityLinked[1],'Left opacity unlinked right');return values;
  });
  await test('Right manual0/.5/1 is independent from left and transport',()=>{
   mixer.setOpacityLinked(1,false);state.video.cross=1;const values=[];for(const value of [0,.5,1]){mixer.setOpacity(1,value);pump();values.push({value,pixel:expect(value?[0,0,255,255*value]:[0,0,0,0])});}assert(state.video.channelOpacity[0]===1&&state.video.linked,'Right opacity changed left or playback authority');return values;
  });
  await test('Independent channel opacity composes correct premultiplied mixed RGB/alpha',()=>{
   state.video.cross=0;mixer.setOpacity(0,.25);mixer.setOpacity(1,.75);pump();return{expected:[64,0,191,128],actual:expect([64,0,191,128]),...snap()};
  });
  await test('Partial-alpha source multiplied by manual opacity retains straight red',async()=>{
   // Empty-deck placeholders are opaque, and key effects deliberately fill
   // holes with the other source. Audio Fade at actual silent RMS clears the
   // base before the half-alpha PNG, yielding a real half-alpha channel input.
   state.video.fx.left=[{name:'Audio Fade',on:true,value:1,params:{}}];
   await mixer.setOverlayImage('left','red',await fixture('rgba(255,0,0,0.5)','opacity-red-half.png'));state.video.cross=-1;mixer.setOpacity(0,.5);pump();expect([255,0,0,64]);return snap();
  });
  await test('Relink follows real audio gain0/.5/1 without changing manual or other side',()=>{
   const saved=state.video.channelOpacity[0],right=state.video.channelOpacity[1];mixer.setOpacityLinked(0,true);const values=[];for(const value of [0,.5,1]){engine.mix(0,'level',value);pump();values.push({value,pixel:expect(value?[255,0,0,128*value]:[0,0,0,0])});}assert(state.video.channelOpacity[0]===saved&&state.video.channelOpacity[1]===right&&!state.video.channelOpacityLinked[1],'Relink lost saved manual or changed right');return values;
  });
  await test('Playback and crossfader link changes leave independent opacity ownership intact',()=>{
   const before=JSON.stringify(mixer.diagnostics().opacity);state.video.linked=false;state.video.crossLinked=true;engine.setCross(-1);pump();assert(JSON.stringify(mixer.diagnostics().opacity)===before,'Playback/crossfader changed channel-opacity authority');expect([255,0,0,128]);state.video.crossLinked=false;return snap();
  });
  await test('Manual API refuses linked/nonfinite/invalid writes without mutating state',()=>{
   let rejected=0;const before=JSON.stringify(state.video.channelOpacity);for(const fn of [()=>mixer.setOpacity(0,.2),()=>mixer.setOpacity(1,NaN),()=>mixer.setOpacity(2,.5),()=>mixer.setOpacityLinked(1,'false')])try{fn();}catch{rejected++;}assert(rejected===4&&JSON.stringify(state.video.channelOpacity)===before,'Invalid writes changed opacity');return{rejected};
  });
  await test('Directional fade continues while each channel and playback authority change',async()=>{
   state.video.crossLinked=false;mixer.setOpacityLinked(0,false);state.video.cross=-1;state.video.autoCrossfadeSeconds=.4;mixer.startCrossfade('right');mixer.setOpacity(0,.7);mixer.setOpacityLinked(1,true);state.video.linked=true;const active=mixer.diagnostics().crossfade.active;assert(active,'Opacity canceled fade');await until(()=>mixer.diagnostics(),d=>!d.crossfade.active,pump);expect([0,0,255,204]);return{activeAfterOpacityChanges:active,end:snap()};
  });
  await test('Metadata roundtrip preserves manual/link pairs without images or authority changes',()=>{
   const saved=snapshotVideoState(state.video),restored=restoreVideoState(JSON.parse(JSON.stringify(saved)));assert(JSON.stringify(restored.channelOpacity)===JSON.stringify(state.video.channelOpacity),'Manual values lost');assert(JSON.stringify(restored.channelOpacityLinked)===JSON.stringify(state.video.channelOpacityLinked),'Link values lost');assert(!restored.overlays.left[0].on&&!restored.overlays.right[0].on,'Images falsely restored');return{channelOpacity:restored.channelOpacity,channelOpacityLinked:restored.channelOpacityLinked,linked:restored.linked,crossLinked:restored.crossLinked};
  });
  await test('Video-only opacity commands preserve actual master tone and all audio fader settings',async()=>{
   osc=engine.ctx.createOscillator();gain=engine.ctx.createGain();osc.frequency.value=440;gain.gain.value=.4;osc.connect(gain);gain.connect(engine.nodes[0].input);osc.start();engine.setCross(-1);const recent=[];const settled=await until(()=>{const d=engine.videoAnalysis(4);recent.push(d.level);if(recent.length>5)recent.shift();return{...d,count:recent.length,range:Math.max(...recent)-Math.min(...recent)};},d=>d.audioAvailable&&d.level>.05&&d.count===5&&d.range<.002,pump);const before=settled.level,cross=engine.cross,levels=engine.nodes.map(n=>n.level);
   for(const i of [0,1]){mixer.setOpacityLinked(i,false);for(const value of [0,.5,1]){mixer.setOpacity(i,value);await raf();pump();}}
   const after=engine.videoAnalysis(4).level;assert(Math.abs(before-after)<.015,'Master tone changed beyond tolerance');assert(engine.cross===cross&&engine.nodes.every((n,i)=>n.level===levels[i]),'Video changed audio config');return{before,after,tolerance:.015,cross,levels};
  });
  await test('Disposed mixer rejects opacity actions and never changes persisted values',async()=>{
   await mixer.dispose();const before=JSON.stringify(state.video.channelOpacity);let rejected=0;for(const fn of [()=>mixer.setOpacity(0,0),()=>mixer.setOpacityLinked(1,true)])try{fn();}catch{rejected++;}assert(rejected===2&&JSON.stringify(state.video.channelOpacity)===before,'Disposed command changed state');return{rejected};
  });
 }finally{if(mixer)await mixer.dispose();try{osc?.stop();}catch{}gain?.disconnect();await engine.ctx.close();}
 report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.length-report.passed;$('#status').textContent=`${report.passed} passed / ${report.failed} failed`;$('#results').textContent=JSON.stringify(report,null,2);
}
$('#run').onclick=async()=>{$('#run').disabled=true;try{await run();}catch(e){$('#status').textContent='FAILED: '+e.message;$('#results').textContent=JSON.stringify({fatal:e.stack||String(e)},null,2);}finally{$('#run').disabled=false;}};
