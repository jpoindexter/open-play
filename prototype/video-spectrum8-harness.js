import {AudioEngine} from './engine.js';
import {videoAnalysisPolicy,normalizeSpectrum8} from './video-analysis.js';
const $=selector=>document.querySelector(selector);
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const close=(a,b,tolerance=1e-6)=>Math.abs(a-b)<=tolerance;
const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
const peak=values=>values.indexOf(Math.max(...values));
function valid(result){return result.audioAvailable===true&&result.spectrum8Available===true&&normalizeSpectrum8(result.spectrum8)!==null;}
function legacyMatches(result){
  const v=result.spectrum8,power=values=>Math.min(1,Math.sqrt(values.reduce((sum,n)=>sum+n*n,0)));
  return close(result.bass,power(v.slice(0,3)))&&close(result.mid,power(v.slice(3,7)))&&close(result.treble,v[7]);
}
export async function runSpectrum8Checks(){
  const started=performance.now(),engine=new AudioEngine(),decks=new Map(),checks=[],messages=[];
  const report={startedAt:new Date().toISOString(),policy:videoAnalysisPolicy,checks,messages,
    scope:'Actual AudioEngine PCM BufferSources -> existing pre-EQ/post-master AnalyserNodes -> eight direct FFT-bin power ranges. No Analyzer shader/pixels, source decoder, native hardware, vendor band/response equivalence or sustained-performance acceptance.',
    routing:'The existing engine analyser speaker output is disconnected before resume. Existing zero-gain spectral sink remains; MediaStream output remains local. No production graph connection is added for spectrum8.',
    leakagePolicy:'Bin-centered periodic PCM uses the actual sample rate/2048 FFT. Blackman-window leakage into adjacent bins/bands is measured, not required to be zero: intended band must dominate every other band by1.5x and own at least65% of total measured band power.'};
  async function check(name,run){const evidence={};try{const returned=await run(evidence);checks.push({name,passed:true,evidence:returned??evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.message,stack:error.stack});}$('#status').textContent=`${checks.filter(c=>c.passed).length}/${checks.length} passed · ${name}`;$('#results').textContent=JSON.stringify(report,null,2);await frame();}
  async function waitAudio(seconds){const target=engine.ctx.currentTime+seconds,deadline=performance.now()+10000;while(engine.ctx.currentTime<target){if(performance.now()>deadline)throw new Error('Audio clock did not reach fixed observation aperture.');await frame();}}
  async function settle(){await waitAudio(4*videoAnalysisPolicy.fftSize/engine.ctx.sampleRate);}
  async function samples(index,count=4,burst=0){const rows=[];for(let i=0;i<count;i++){await waitAudio(videoAnalysisPolicy.fftSize/engine.ctx.sampleRate);for(let n=0;n<burst;n++)engine.videoAnalysis(n%5);const result=engine.videoAnalysis(index);rows.push({time:engine.ctx.currentTime,...result});}return rows;}
  function toneForBand(band){const sr=engine.ctx.sampleRate,size=videoAnalysisPolicy.fftSize,edges=videoAnalysisPolicy.spectrum8Hz,low=edges[band],high=Math.min(edges[band+1],sr/2),first=Math.max(1,Math.ceil(low*size/sr)),last=Math.min(size/2-1,Math.ceil(high*size/sr)-1);assert(last>=first,'Actual sample rate/FFT has no bin for band '+band);const ideal=Math.round(Math.sqrt(low*high)*size/sr),bin=Math.max(first,Math.min(last,ideal));return {band,bin,hz:bin*sr/size,lowHz:low,highHz:high};}
  let voiceSerial=0;
  async function play(index,tone){
    const old=decks.get(index);if(old)engine.pause(old);
    const sr=engine.ctx.sampleRate,size=videoAnalysisPolicy.fftSize,length=size*128,duration=length/sr,buffer=engine.ctx.createBuffer(1,length,sr),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=.15*Math.sin(2*Math.PI*tone.bin*i/size);
    const deck={index,track:{id:'spectrum8-original-pcm-'+(++voiceSerial),duration,bpm:120},position:0,rate:1,playing:false,processing:false,keylock:false,keyShift:0,reverse:false,loop:true,loopIn:0,loopOut:duration,stems:[true,true,true,true],stemFX:[false,false,false,false]};
    engine.buffers.set(deck.track.id,buffer);decks.set(index,deck);await engine.start(deck);return deck;
  }
  try{
    // Take the unavailable snapshot and resume synchronously within the trusted
    // Run activation; the asynchronous check reporter may await an animation frame.
    const uninitialized=engine.videoAnalysis(0),wasUninitialized=engine.ctx===null;
    engine.init();engine.analyser.disconnect();const resumed=engine.ctx.resume();
    await check('Uninitialized actual engine reports unavailable spectrum without creating an AudioContext',()=>{assert(wasUninitialized&&!uninitialized.audioAvailable&&!uninitialized.spectrum8Available&&uninitialized.spectrum8===null,'Unavailable engine fabricated spectrum data.');return uninitialized;});
    await check('Actual worklets prepare and real running silent taps return valid eight-zero vectors',async()=>{await resumed;await engine.resume();engine.videoAnalysis(0);await settle();report.sampleRate=engine.ctx.sampleRate;report.fftSize=videoAnalysisPolicy.fftSize;report.binWidthHz=engine.ctx.sampleRate/videoAnalysisPolicy.fftSize;const result=engine.videoAnalysis(0);assert(engine.effectsPrepared&&engine.ctx.state==='running','Real AudioEngine did not prepare.');assert(valid(result)&&result.spectrum8.every(n=>n===0)&&result.level===0,'Running silence was unavailable or nonzero.');return {state:engine.ctx.state,effectsPrepared:engine.effectsPrepared,result};});
    for(let band=0;band<8;band++)await check('Actual bin-centered PCM independently dominates spectrum band '+band,async evidence=>{
      const tone=toneForBand(band);await play(0,tone);await settle();const rows=await samples(0),values=Array.from({length:8},(_,i)=>mean(rows.map(row=>row.spectrum8?.[i]??NaN))),power=values.reduce((sum,n)=>sum+n*n,0),others=values.filter((_,i)=>i!==band),dominance=values[band]/Math.max(...others,1e-12),share=values[band]**2/power;
      Object.assign(evidence,{tone,samples:rows,meanSpectrum8:values,dominance,powerShare:share});assert(rows.every(valid),'Measured vector is missing/malformed.');assert(peak(values)===band&&values[band]>.02&&dominance>=1.5&&share>=.65,'Intended actual band does not dominate: '+JSON.stringify({band,values,dominance,share}));assert(rows.every(legacyMatches),'Original bass/mid/treble values differ from the same FFT power ranges.');assert(rows.every(row=>close(row.level,.15/Math.sqrt(2),.0001)),'Original pre-EQ time-domain RMS changed.');return evidence;
    });
    await check('Two real decks own distinct spectra while post-master contains both and unused decks stay valid silence',async evidence=>{
      const left=toneForBand(1),right=toneForBand(6);await play(0,left);await play(1,right);engine.setCross(0);await settle();const readings=[0,1,2,3,4].map(index=>engine.videoAnalysis(index));Object.assign(evidence,{tones:[left,right],readings});assert(readings.every(valid),'A real deck/master spectrum is unavailable.');assert(peak(readings[0].spectrum8)===1&&peak(readings[1].spectrum8)===6,'Deck spectra were swapped or shared.');assert(readings[2].spectrum8.every(n=>n===0)&&readings[3].spectrum8.every(n=>n===0),'Unused deck leaked other audio.');assert(readings[4].spectrum8[1]>.015&&readings[4].spectrum8[6]>.015,'Master did not contain both actual channels.');
    });
    await check('Existing channel EQ/fader controls affect post-master while pre-EQ eight-band and original RMS remain unchanged',async evidence=>{
      engine.pause(decks.get(1));await settle();const before=engine.videoAnalysis(0);engine.mix(0,'low',-18);engine.mix(0,'level',0);await settle();const deck=engine.videoAnalysis(0),master=engine.videoAnalysis(4);Object.assign(evidence,{before,deck,master});assert(valid(deck)&&deck.spectrum8.every((n,i)=>close(n,before.spectrum8[i],.0002))&&close(deck.level,before.level,.0001),'Existing pre-EQ tap moved downstream.');assert(master.level<1e-6&&master.spectrum8.every(n=>n<1e-6),'Muted channel still reaches master.');engine.mix(0,'low',0);engine.mix(0,'level',.8);await settle();
    });
    await check('Eight-band master tap remains after the existing master gain and does not change deck input values',async evidence=>{
      const before=engine.videoAnalysis(0),gain=engine.master.gain.value;engine.master.gain.value=0;await settle();const deck=engine.videoAnalysis(0),master=engine.videoAnalysis(4);Object.assign(evidence,{before,deck,master});assert(valid(master)&&master.level===0&&master.spectrum8.every(n=>n===0),'Master mute did not silence actual post-gain spectrum.');assert(deck.spectrum8.every((n,i)=>close(n,before.spectrum8[i],.0002))&&close(deck.level,before.level,.0001),'Master gain altered pre-EQ deck analysis.');engine.master.gain.value=gain;await settle();
    });
    await check('Repeated eight-band queries preserve analyser ownership, audio parameters and measured held-PCM master amplitude',async evidence=>{
      const taps=engine.videoAnalyzers,nodes=engine.nodes.map(n=>n.input),gain=engine.master.gain.value,before=await samples(4,6),during=await samples(4,6,100),after=await samples(4,6),levels=[before,during,after].map(rows=>mean(rows.map(row=>row.level)));Object.assign(evidence,{before,during,after,meanRMS:levels,tolerance:.0005});assert(taps===engine.videoAnalyzers&&nodes.every((node,i)=>node===engine.nodes[i].input)&&gain===engine.master.gain.value,'Spectrum queries replaced audio ownership or gain.');assert(levels[0]>.001&&Math.max(...levels)-Math.min(...levels)<.0005,'Additional read-only queries changed measured held audio amplitude.');assert([...before,...during,...after].every(legacyMatches),'Coarse legacy bands changed during queries.');
    });
    await check('Actual pause returns valid zero spectrum and zero original RMS after a fixed FFT aperture',async evidence=>{for(const deck of decks.values())engine.pause(deck);await settle();const readings=[0,1,4].map(index=>engine.videoAnalysis(index));Object.assign(evidence,{readings});assert(readings.every(row=>valid(row)&&row.level===0&&row.spectrum8.every(n=>n===0)),'Paused input retained audio or became unavailable.');});
    await check('Suspended actual context explicitly reports unavailable then resumes to valid silent data',async evidence=>{await engine.ctx.suspend();const suspended=engine.videoAnalysis(0);assert(!suspended.audioAvailable&&!suspended.spectrum8Available&&suspended.spectrum8===null,'Suspended context fabricated valid bands.');await engine.ctx.resume();await settle();const resumed=engine.videoAnalysis(0);assert(valid(resumed)&&resumed.spectrum8.every(n=>n===0),'Resumed silence did not recover.');Object.assign(evidence,{suspended,resumed});});
    await check('Disposed analysis explicitly reports unavailable and disposal is idempotent',()=>{engine.videoAnalyzers.dispose();engine.videoAnalyzers.dispose();const result=engine.videoAnalysis(0);assert(!result.audioAvailable&&!result.spectrum8Available&&result.spectrum8===null,'Disposed analysis returned stale bands.');return result;});
  }catch(error){checks.push({name:'Harness setup/unhandled failure',passed:false,error:error.message,stack:error.stack});}
  finally{try{engine.videoAnalyzers?.dispose();if(engine.ctx){engine.silence();await engine.ctx.close();}}catch(error){messages.push('Cleanup: '+error.message);}}
  report.passed=checks.filter(c=>c.passed).length;report.failed=checks.filter(c=>!c.passed).length;report.durationMs=performance.now()-started;$('#results').textContent=JSON.stringify(report,null,2);$('#status').textContent=`${report.passed} passed / ${report.failed} failed`;return report;
}
$('#run').onclick=async()=>{$('#run').disabled=true;$('#status').textContent='Running actual PCM/FFT checks…';try{await runSpectrum8Checks();}catch(error){$('#results').textContent=error.stack;$('#status').textContent='Harness failed';}finally{$('#run').disabled=false;}};
