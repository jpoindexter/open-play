import {AudioEngine} from './engine.js';
import {createVideoMixer} from './video.js';
const $=s=>document.querySelector(s),assert=(v,m)=>{if(!v)throw Error(m);},raf=()=>new Promise(r=>requestAnimationFrame(r));
async function until(read,predicate,pump){const deadline=performance.now()+12000;let v;do{pump();v=read();if(predicate(v))return v;await raf();}while(performance.now()<deadline);throw Error('Actual fade predicate timed out: '+JSON.stringify(v));}
async function fixture(color,name){const c=document.createElement('canvas');c.width=640;c.height=360;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,640,360);const blob=await new Promise(r=>c.toBlob(r,'image/png'));return new File([blob],name,{type:'image/png'});}
const overlay=id=>({id,imageRef:id,kind:'image',on:true,x:.5,y:.5,scale:1,align:'center',opacity:1,animation:'none'});
async function run(){
 const checks=[],report={startedAt:new Date().toISOString(),scope:'Actual imported mixer/GPU, decoded original PNG images in channel overlays and real AudioEngine analysis. No source-video/deck transport or native equivalence.',checks,notifications:[]};
 const engine=new AudioEngine();engine.init();engine.analyser.disconnect();const resume=engine.ctx.resume();let mixer,osc,gain;
 const state={settings:{'Reduced Motion':false},decks:[0,1].map(index=>({index,track:null,position:0,rate:1,playing:false})),video:{width:640,height:360,transition:'Crossfade',cross:-1,linked:true,crossLinked:false,auto:false,autoCrossfadeSeconds:.4,fx:{left:[],right:[],master:[]},overlays:{left:[overlay('red')],right:[overlay('blue')],master:[]}}};
 const canvas=$('#video-master'),ctx=canvas.getContext('2d'),sample=()=>{const d=mixer.diagnostics(),pixel=[...ctx.getImageData(320,180,1,1).data];return{cross:d.videoCross,active:d.crossfade.active,pixel,audioCross:engine.cross};};
 const pump=()=>mixer.tick(true);
 async function test(name,fn){try{checks.push({name,passed:true,evidence:await fn()});}catch(e){checks.push({name,passed:false,error:e.stack||String(e)});}$('#status').textContent=`${checks.filter(c=>c.passed).length}/${checks.length} passed · ${name}`;$('#results').textContent=JSON.stringify(report,null,2);}
 function assertMix(s){const t=(s.cross+1)/2,la=state.video.linked?engine.nodes[0].level:1,ra=state.video.linked?engine.nodes[1].level:1,alpha=(1-t)*la+t*ra;const expected=alpha?[255*(1-t)*la/alpha,0,255*t*ra/alpha,255*alpha]:[0,0,0,0];assert(s.pixel.every((value,i)=>Math.abs(value-expected[i])<=2),'Fader/pixel mismatch: '+JSON.stringify({...s,expected,sourceAlpha:[la,ra]}));}
 try{
  await test('Real red/blue channel images and AudioEngine initialize without source video',async()=>{
   await resume;await engine.resume();osc=engine.ctx.createOscillator();gain=engine.ctx.createGain();osc.frequency.value=440;gain.gain.value=.2;osc.connect(gain);gain.connect(engine.nodes[0].input);osc.start();
   mixer=createVideoMixer({state,engine,notify:m=>report.notifications.push(m)});mixer.bind(canvas);await mixer.setOverlayImage('left','red',await fixture('#ff0000','fade-left.png'));await mixer.setOverlayImage('right','blue',await fixture('#0000ff','fade-right.png'));pump();const s=sample();assertMix(s);return s;
  });
  await test('Fade right advances actual pixels monotonically and stops exactly at endpoint',async()=>{
   state.video.cross=-1;state.video.autoCrossfadeSeconds=.4;let completions=0;mixer.startCrossfade('right',()=>completions++);const samples=[];
   await until(()=>{const s=sample();samples.push(s);return s;},s=>!s.active,pump);
   assert(samples.length>=3,'Need actual intermediate rendered samples');samples.forEach(assertMix);for(let i=1;i<samples.length;i++)assert(samples[i].cross>=samples[i-1].cross,'Right fade reversed');assert(samples.at(-1).cross===1,'Right endpoint not exact');assert(completions===1,'Completion count wrong');for(let i=0;i<3;i++){await raf();pump();}assert(sample().cross===1&&completions===1,'Fade restarted after endpoint');return{samples,completions};
  });
  await test('Fade left reverses actual pixels monotonically and reaches its endpoint',async()=>{
   mixer.startCrossfade('left');const samples=[];await until(()=>{const s=sample();samples.push(s);return s;},s=>!s.active,pump);samples.forEach(assertMix);for(let i=1;i<samples.length;i++)assert(samples[i].cross<=samples[i-1].cross,'Left fade reversed');assert(samples.at(-1).cross===-1,'Left endpoint not exact');return samples;
  });
  await test('A new opposite action begins at the displayed position without restarting a prior fade',async()=>{
   state.video.autoCrossfadeSeconds=.8;mixer.startCrossfade('right');await until(sample,s=>s.cross>-.4&&s.active,pump);const before=sample();mixer.startCrossfade('left');pump();const after=sample();assert(after.cross<=before.cross+.04&&after.cross>before.cross-.06,'Reversal jumped: '+JSON.stringify({before,after}));await until(sample,s=>!s.active,pump);assert(sample().cross===-1,'Reversal endpoint wrong');return{before,after,end:sample()};
  });
  await test('Stop cancels travel and retains the rendered pixel blend across later frames',async()=>{
   state.video.autoCrossfadeSeconds=1;mixer.startCrossfade('right');await until(sample,s=>s.cross>-.5&&s.active,pump);const stopped=mixer.stopCrossfade();pump();const held=sample();for(let i=0;i<8;i++){await raf();pump();assert(sample().cross===stopped,'Stopped fader moved');}assertMix(held);return held;
  });
  await test('Independent crossfader link uses real audio cross while transport link remains enabled',async()=>{
   state.video.crossLinked=true;engine.setCross(.6);pump();const linked=[...ctx.getImageData(320,180,1,1).data];assert(Math.abs(linked[0]-51)<=2&&Math.abs(linked[2]-204)<=2,'Audio cross did not drive actual pixels');let error;try{mixer.startCrossfade('left');}catch(e){error=e.message;}assert(error&&state.video.linked===true,'Linked fade action mutated transport or was accepted');state.video.crossLinked=false;state.video.cross=-1;pump();assertMix(sample());assert(engine.cross===.6&&state.video.linked===true,'Unlinking Video changed audio cross or transport');return{linkedPixels:linked,audioCross:engine.cross,transportLinked:state.video.linked,error};
  });
  await test('Reduced Motion finishes directly and also terminates an already moving fade',async()=>{
   state.settings['Reduced Motion']=true;mixer.startCrossfade('right');pump();assert(sample().cross===1&&!sample().active,'Reduced Motion start animated');state.settings['Reduced Motion']=false;mixer.startCrossfade('left');await until(sample,s=>s.cross<.7&&s.active,pump);state.settings['Reduced Motion']=true;pump();const end=sample();assert(end.cross===-1&&!end.active,'Reduced Motion toggle did not finish');assertMix(end);state.settings['Reduced Motion']=false;return end;
  });
  await test('Directional commands preserve actual audio analysis and audio fader settings',async()=>{
   await until(()=>engine.videoAnalysis(4),s=>s.audioAvailable&&s.level>.01,pump);const before=engine.videoAnalysis(4),cross=engine.cross,levels=engine.nodes.map(n=>n.level);state.video.autoCrossfadeSeconds=.25;mixer.startCrossfade('right');await until(sample,s=>!s.active,pump);const after=engine.videoAnalysis(4);assert(after.audioAvailable&&Math.abs(before.level-after.level)<.015,'Master tone level changed beyond declared test tolerance');assert(engine.cross===cross&&engine.nodes.every((n,i)=>n.level===levels[i]),'Video fade changed AudioEngine fader config');return{beforeLevel:before.level,afterLevel:after.level,cross,levels,tolerance:.015};
  });
  await test('Detached panel completes and persists once without hidden GPU frames, then returns at endpoint',async()=>{
   state.video.cross=-1;state.video.autoCrossfadeSeconds=.25;let completions=0;mixer.startCrossfade('right',()=>completions++);
   const before=mixer.diagnostics().frames;canvas.remove();
   try{await until(()=>mixer.diagnostics(),s=>!s.crossfade.active,pump);const hidden=mixer.diagnostics();
    assert(hidden.videoCross===1&&completions===1,'Detached fade did not finish exactly once');assert(hidden.frames===before,'Detached fade rendered hidden GPU frames');
    document.querySelector('#results').before(canvas);pump();const returned=sample();assertMix(returned);assert(returned.cross===1&&completions===1,'Returning restarted fade or completion');
    return{hiddenFrames:before,finishedHiddenFrames:hidden.frames,completions,returned};
   }finally{if(!canvas.isConnected)document.querySelector('#results').before(canvas);}
  });
  await test('Hidden but connected panel finishes control-only without GPU frames',async()=>{
   state.video.cross=1;state.video.autoCrossfadeSeconds=.25;let completions=0;mixer.startCrossfade('left',()=>completions++);const before=mixer.diagnostics().frames;
   await until(()=>mixer.diagnostics(),s=>!s.crossfade.active,()=>mixer.tick(false,{render:false}));const hidden=mixer.diagnostics();assert(canvas.isConnected&&hidden.videoCross===-1&&completions===1&&hidden.frames===before,'Hidden connected control tick failed');pump();assertMix(sample());return{before,hiddenFrames:hidden.frames,cross:hidden.videoCross,completions};
  });
  await test('Disposal cancels active fade and rejects later directional starts',async()=>{state.video.autoCrossfadeSeconds=1;mixer.startCrossfade('left');await mixer.dispose();assert(!mixer.diagnostics().crossfade.active,'Disposed fade remains active');let error;try{mixer.startCrossfade('right');}catch(e){error=e.message;}assert(error,'Disposed mixer accepted fade');return{error};});
 }finally{if(mixer)await mixer.dispose();try{osc?.stop();}catch{}gain?.disconnect();await engine.ctx.close();}
 report.passed=checks.filter(c=>c.passed).length;report.failed=checks.length-report.passed;$('#results').textContent=JSON.stringify(report,null,2);$('#status').textContent=`${report.passed} passed / ${report.failed} failed`;return report;
}
$('#run').onclick=async()=>{$('#run').disabled=true;try{await run();}catch(e){$('#status').textContent='FAILED: '+e.message;$('#results').textContent=JSON.stringify({fatal:e.stack||String(e)},null,2);}finally{$('#run').disabled=false;}};
