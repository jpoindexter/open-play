import {AudioEngine} from './engine.js';
import {createFXTempo,effectiveFXBPM,normalizeFXTempoSettings,fxTempoPolicy} from './fx-tempo.js';
const $=s=>document.querySelector(s),raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const urls=new Set();
function clear(){for(const url of urls)URL.revokeObjectURL(url);urls.clear();$('#downloads').replaceChildren();}
window.addEventListener('pagehide',clear);
function wav(pcm,sampleRate){const bytes=new ArrayBuffer(44+pcm.length*2),v=new DataView(bytes),text=(offset,value)=>{for(let i=0;i<value.length;i++)v.setUint8(offset+i,value.charCodeAt(i));};text(0,'RIFF');v.setUint32(4,36+pcm.length*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,pcm.length*2,true);for(let i=0;i<pcm.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,pcm[i]))*32767),true);return new Blob([bytes],{type:'audio/wav'});}
function publish(pcm,sampleRate,name){const blob=wav(pcm,sampleRate),url=URL.createObjectURL(blob),link=document.createElement('a');urls.add(url);link.href=url;link.download=name;link.textContent=`Download measured ${name} (${blob.size} bytes)`;$('#downloads').append(link);return{name,bytes:blob.size};}
async function bounded(promise,label,ms=15000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),ms);})]).finally(()=>clearTimeout(timer));}
function impulseEvents(data,sampleRate){
 let peak=0;for(const value of data)peak=Math.max(peak,Math.abs(value));const threshold=peak*.03,events=[];let nextAllowed=0;
 for(let i=0;i<data.length;i++){if(i<nextAllowed||Math.abs(data[i])<threshold)continue;const end=Math.min(data.length,i+Math.round(sampleRate*.06));let position=i,amplitude=Math.abs(data[i]);for(let k=i+1;k<end;k++)if(Math.abs(data[k])>amplitude){amplitude=Math.abs(data[k]);position=k;}events.push({sample:position,time:position/sampleRate,amplitude});nextAllowed=position+Math.round(sampleRate*.12);}
 return{peak,threshold,events};
}
export async function runFXTempoChecks(){
 clear();const checks=[],messages=[],report={startedAt:new Date().toISOString(),checks,messages,policy:fxTempoPolicy,
  scope:'Actual AudioEngine/Echo Worklets and real PCM repeat intervals; actual engine.setRate and semantic Video link metadata. Deterministic controller taps prove timing-mode integration, not real human tap gestures. Test-only measurement worklet emits silent output. Native hardware/vendor response and UI gestures require separate acceptance.'};
 const engine=new AudioEngine();engine.init();engine.analyser.disconnect();const resumed=engine.ctx.resume(),clock=createFXTempo(),routes=['Deck 1','Deck 2'],banks=[0,1].map(()=>[{name:'Echo',on:true,depth:100,beat:'1',params:{Feedback:40,HPF:20,Drive:0,'Beat Modify':1}}]),decks=[0,1].map(index=>({index,track:{id:'tempo-fixture-'+index,bpm:index?180:120,duration:20},position:0,rate:1,playing:false,keylock:false,keyShift:0}));
 let capture,sink,ownership,serial=0;const pending=new Map();
 const bpms=()=>decks.map(deck=>deck.track.bpm*deck.rate),configure=()=>engine.configureFX(banks,routes,bpms(),clock.snapshot());
 async function waitAudio(seconds){const target=engine.ctx.currentTime+seconds,deadline=performance.now()+15000;while(engine.ctx.currentTime<target){assert(performance.now()<deadline,'Actual audio clock stalled');await raf();}}
 function ownershipUnchanged(){assert(ownership.every((old,i)=>engine.fxSlots[i]===old.slot&&engine.fxSlots[i].input===old.input&&engine.fxSlots[i].output===old.output),'Tempo change rebuilt bank routing/slot ownership');}
 function links(bank,expected){const all=engine.videoFXLinks(),target=bank?'right':'left',link=all[target][0];assert(link&&Math.abs(link.bpm-expected)<1e-9&&Math.abs(link.delaySeconds-60/expected)<1e-9,'Semantic link timing differs from effective audio unit clock: '+JSON.stringify(all));return all;}
 async function probe(label,bank,expected,evidence){
  ownershipUnchanged();const semantic=links(bank,expected),seconds=3.5*(60/expected)+.4,id=++serial,start=deferred(),done=deferred();pending.set(id,{start,done});capture.port.postMessage({type:'capture',id,frames:Math.ceil(seconds*engine.ctx.sampleRate)});
  let source;
  try{const started=await bounded(start.promise,'Actual PCM capture start'),buffer=engine.ctx.createBuffer(1,64,engine.ctx.sampleRate);buffer.getChannelData(0)[0]=.8;source=engine.ctx.createBufferSource();source.buffer=buffer;source.connect(engine.nodes[bank].input);const sourceStart=engine.ctx.currentTime+.15;source.start(sourceStart);const result=await bounded(done.promise,'Actual Echo PCM capture'),analysis=impulseEvents(result.data,engine.ctx.sampleRate),events=analysis.events.slice(0,3),intervals=events.slice(1).map((event,i)=>event.time-events[i].time),T=60/expected;
   Object.assign(evidence,{label,bank,bpm:expected,expectedInterval:T,sampleRate:engine.ctx.sampleRate,captureStartFrame:started.startFrame,sourceStart,analysis,intervals,toleranceSeconds:.0005,semanticLinks:semantic,settings:clock.snapshot(),trackBPMs:bpms(),download:publish(result.data,engine.ctx.sampleRate,'fx-tempo-'+label+'.wav')});
   assert(analysis.peak>.005&&events.length===3,'Actual Echo did not produce three measured repeats: '+JSON.stringify(analysis));assert(intervals.every(interval=>Math.abs(interval-T)<=.0005),'Measured Echo repeat interval differs from expected clock: '+JSON.stringify({expected:T,intervals,events}));assert(events[0].amplitude>events[1].amplitude&&events[1].amplitude>events[2].amplitude,'Measured feedback repeats did not decay');await waitAudio(1.25);return evidence;
  }finally{pending.delete(id);try{source?.stop();}catch{}source?.disconnect();}
 }
 async function test(name,run){$('#status').textContent=`Running ${checks.length+1}: ${name}`;const evidence={};try{const value=await run(evidence);checks.push({name,passed:true,evidence:value??evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.stack||error.message});}$('#results').textContent=JSON.stringify(report,null,2);await raf();}
 try{
  await test('Actual engine/worklets prepare two independent Echo units and a silent PCM measurement sink',async()=>{
   await resumed;await engine.resume();await engine.ctx.audioWorklet.addModule(new URL('./fx-tempo-capture-worklet.js',import.meta.url));capture=new AudioWorkletNode(engine.ctx,'open-play-fx-tempo-capture-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});sink=engine.ctx.createGain();sink.gain.value=0;engine.master.connect(capture);capture.connect(sink);sink.connect(engine.ctx.destination);capture.port.onmessage=event=>{const m=event.data,item=pending.get(m.id);if(!item)return;if(m.type==='started')item.start.resolve(m);if(m.type==='done')item.done.resolve(m);};configure();await waitAudio(.1);ownership=engine.fxSlots.map(slot=>({slot,input:slot.input,output:slot.output}));assert(ownership.length===2&&engine.fxState.length===4,'Actual per-unit timing graph/metadata unavailable');return{sampleRate:engine.ctx.sampleRate,slots:ownership.length,settings:engine.fxState[3],routes,speakerRoute:'Original analyser disconnected; measurement output is silent and its destination gain is0'};
  });
  await test('Auto120 produces actual Echo repeats at0.5seconds',e=>probe('auto-120',0,120,e));
  await test('Two deterministic taps establish manual100 and actual Echo repeats at0.6seconds',async e=>{
   const armed=clock.tap(0,0);assert(armed.phase==='armed'&&clock.snapshot()[0].mode==='auto','First tap changed clock before valid tempo');const manual=clock.tap(0,600);assert(manual.setting.mode==='manual'&&manual.setting.bpm===100,'Tap pair did not establish100');configure();await waitAudio(.1);Object.assign(e,{armed,manual});return probe('manual-100',0,100,e);
  });
  await test('Half/double/bar tapping retains manual range without changing the independent other unit',()=>{
   for(const time of [900,2100,4500,4650])clock.tap(0,time);configure();ownershipUnchanged();assert(clock.snapshot()[0].bpm===100&&clock.snapshot()[1].mode==='auto','Rhythm subdivision changed the range or other unit');const all=links(0,100);assert(all.right[0].bpm===180,'Other unit inherited the manual clock');return{clock:clock.diagnostics(0),otherUnit:clock.snapshot()[1],semanticLinks:all};
  });
  await test('Actual engine.setRate changes automatic track tempo to144 while manual Echo stays100',async e=>{
   await engine.setRate(decks[0],1.2);assert(engine.fxState[2][0]===144&&engine.fxState[3][0].mode==='manual','Actual setRate did not retain per-unit timing settings');Object.assign(e,{actualDeckRate:decks[0].rate,trackBPM:decks[0].track.bpm});return probe('manual-held-track-144',0,100,e);
  });
  await test('Return-to-Auto restores current144BPM and actual Echo repeats at5/12seconds',async e=>{
   clock.automatic(0);configure();assert(effectiveFXBPM(clock.snapshot()[0],bpms()[0])===144,'Auto restored an old BPM instead of the current track');return probe('restored-auto-144',0,144,e);
  });
  await test('Changing actual track BPM metadata refreshes the Auto clock and measures180BPM Echo without changing unit ownership',async e=>{
   decks[0].track.bpm=150;assert(decks[0].rate===1.2,'Prior actual track rate was not retained');engine.updateFXBPMs(bpms());assert(engine.fxState[2][0]===180&&engine.fxState[3][0].mode==='auto','Actual metadata refresh did not update the Auto unit');Object.assign(e,{trackBPM:decks[0].track.bpm,actualDeckRate:decks[0].rate});return probe('auto-new-track-metadata-180',0,180,e);
  });
  await test('Other unit still measures180BPM independently after unit1 manual/auto transitions',e=>probe('independent-unit2-180',1,180,e));
  await test('JSON roundtrip preserves only intended timing scalars without taps, armed state or effect changes',()=>{
   const before=JSON.stringify(banks),settings=clock.snapshot(),json=JSON.stringify(settings),restored=createFXTempo({initial:normalizeFXTempoSettings(JSON.parse(json))});assert(!/anchor|interval|timestamp|armed|last|taps/.test(json),'Transient tap state persisted');assert(JSON.stringify(restored.snapshot())===json&&JSON.stringify(banks)===before,'Timing persistence altered effect parameters');assert(!restored.diagnostics(0).armed&&restored.diagnostics(0).taps===0,'Restored clock resurrected a tap session');return{json,settings,effectParameters:banks};
  });
 }finally{for(const item of pending.values()){item.start.reject(Error('Harness disposed'));item.done.reject(Error('Harness disposed'));}pending.clear();capture?.port.postMessage({type:'cancel'});capture?.disconnect();capture?.port.close();sink?.disconnect();engine.videoAnalyzers?.dispose();engine.silence();await engine.ctx.close();}
 report.passed=checks.filter(check=>check.passed).length;report.failed=checks.filter(check=>!check.passed).length;report.finishedAt=new Date().toISOString();$('#results').textContent=JSON.stringify(report,null,2);$('#status').textContent=`${report.passed}/${checks.length} actual FX tempo checks passed`;return report;
}
let running=false;$('#run').onclick=async()=>{if(running)return;running=true;$('#run').disabled=true;try{await runFXTempoChecks();}catch(error){$('#results').textContent=error.stack||error.message;$('#status').textContent='Harness setup failed';}finally{running=false;$('#run').disabled=false;}};
