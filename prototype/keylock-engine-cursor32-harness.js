import {AudioEngine} from './engine.js';
import {inspectReturnPCM} from './keylock-release-analysis.js';
import {cursorCriteria,cursorFixtureSample,inspectCursorProbes} from './keylock-cursor32-analysis.js';
import {validateRenderClockCapture} from './render-clock-capture-worklet.js';

const $=selector=>document.querySelector(selector),assert=(value,message)=>{if(!value)throw Error(message);};
const cases=['same','different'].flatMap(region=>[
  {gesture:'stationary',seconds:1,velocity:0},{gesture:'forward',seconds:1,velocity:.5},
  {gesture:'backward',seconds:1,velocity:-.5},{gesture:'quick',seconds:.03,velocity:0},
  {gesture:'throw',seconds:1,velocity:0,throwSeconds:3},
].map(spec=>({...spec,region,base:region==='same'?2.4:6.2})));
const sources=['engine.js','keylock-shadow-live.js','keylock-scratch-shadow.js','silent-audio-pull.js',
  'silent-audio-pull-worklet.js','deck-scratch.js','deck-scratch-kernel.js','keylock-release-analysis.js',
  'keylock-cursor32-analysis.js','keylock-cursor-capture-worklet.js','render-clock-capture-worklet.js','keylock-engine-cursor32-harness.js'];
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
let running=false,hasRun=false,urls=[];
$('#run').onclick=async()=>{
  if(running||hasRun)return;running=true;hasRun=true;$('#run').disabled=true;urls.splice(0).forEach(URL.revokeObjectURL);
  $('#download').hidden=$('#raw').hidden=true;
  const engine=new AudioEngine();engine.init();engine.master.gain.value=0;
  const context=engine.ctx,resumed=engine.resume(),abort=new AbortController(),started=performance.now(),deadline=started+90000;
  const report={revision:'production-engine-cursor32-v1',startedAt:new Date().toISOString(),criteria:cursorCriteria,cases,
    runtime:{sampleRate:context.sampleRate,userAgent:navigator.userAgent},checks:[],fatalErrors:[],cleanupErrors:[],
    scope:'NEW32ms owned barcode fixture (old73ms retained), same seed/carriers/criteria. Real production AudioEngine/WASM finite forward, unlooped non-Slip return matrix. Separate diagnostic, not main UI or hardware. Complete four-channel armed PCM and producer rows retained. A separately scheduled a-rate AudioParam ramp is compared with unmodified global currentFrame/currentTime and both aliases before/after each callback. These may share a backend and cannot exclude common-mode faults. Earliest position means a400ms fitted marker interval starting at release, not the first sample.'};
  let safe,zero,oscillator,controlGain,controlMerger,captureNode,deckBus,controlBus,capture,cleanup=false;
  const d={index:0,track:{id:'engine-cursor-owned-fixture',duration:16,bpm:120},position:2.4,anchorPosition:2.4,anchorTime:0,
    rate:1.08,keylock:true,keyShift:12,playing:false,reverse:false,loop:false,loopIn:0,loopOut:4,
    stems:[true,true,true,true],stemFX:[false,false,false,false]};
  const wholeTimer=setTimeout(()=>{abort.abort(Error('90second cooperative deadline'));engine.pause(d);engine.scratchCache.clearAll();},90000);
  function bounded(promise,label,ms=10000){let timer,fail;return Promise.race([promise,new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error(label+' timed out')),Math.max(1,Math.min(ms,cleanup?ms:deadline-performance.now())));
    if(!cleanup){fail=()=>reject(abort.signal.reason||Error('Diagnostic aborted'));if(abort.signal.aborted)fail();else abort.signal.addEventListener('abort',fail,{once:true});}
  })]).finally(()=>{clearTimeout(timer);if(fail)abort.signal.removeEventListener('abort',fail);});}
  const wait=ms=>bounded(new Promise(resolve=>setTimeout(resolve,ms)),'context wait',ms+1000);
  function publish(stage){$('#status').textContent=stage;$('#results').textContent=JSON.stringify({stage,
    capturedCases:report.checks.length,expectedCases:10,calibrationPassed:report.calibration?.passed??null,
    captureIntegrity:report.captureIntegrity?{passed:report.captureIntegrity.passed,errors:report.captureIntegrity.errors,parameterContinuous:report.captureIntegrity.parameterContinuous,globalMismatchSamples:report.captureIntegrity.globalMismatchSamples,getterMismatchRows:report.captureIntegrity.getterMismatchRows,withinCallMismatchRows:report.captureIntegrity.withinCallMismatchRows}:null,
    checks:report.checks.map(row=>({gesture:row.gesture,region:row.region,passed:row.passed??null,error:row.error,
      actualActiveHoldSeconds:row.actualActiveHoldSeconds,positionErrors:row.positionProbes?.map(p=>({offset:p.offset,error:p.errorSeconds,confident:p.confident})),pitch:row.pitch?.criteriaPassed})),
    completed:report.completed??false,allCriteriaPassed:report.allCriteriaPassed??false,fatalErrors:report.fatalErrors,cleanupErrors:report.cleanupErrors},null,2);}
  async function sourceHashes(){return Object.fromEntries(await Promise.all(sources.map(async file=>{
    const response=await fetch(new URL(file,import.meta.url));assert(response.ok,'Source fetch failed '+file);return[file,await sha(await response.arrayBuffer())];
  })));}
  async function reach(time){while(!capture.blocks.length||capture.blocks.at(-1).frame+capture.blocks.at(-1).frames<Math.ceil(time*context.sampleRate))await wait(10);}
  function interval(start,seconds){
    const first=Math.round(start*context.sampleRate),count=Math.round(seconds*context.sampleRate);
    const channels=Array.from({length:4},()=>new Float32Array(count));let at=first;
    assert(report.captureIntegrity?.passed,'Full armed capture failed; no interval interpretation');
    for(const block of capture.blocks){const lo=Math.max(first,block.frame),hi=Math.min(first+count,block.frame+block.frames);if(hi<=lo)continue;
      assert(lo===at,'Requested interval has a frame gap or overlap');for(let c=0;c<4;c++)channels[c].set(block.channels[c].subarray(lo-block.frame,hi-block.frame),lo-first);at=hi;}
    assert(at===first+count,'Requested interval incomplete');return{channels,firstTime:first/context.sampleRate,frames:count,firstFrame:first};
  }
  function controlMetrics(data){let power=0,peak=0;const crossings=[];for(let i=0;i<data.length;i++){
    power+=data[i]**2;peak=Math.max(peak,Math.abs(data[i]));if(i&&data[i-1]<0&&data[i]>=0)crossings.push(i-1-data[i-1]/(data[i]-data[i-1]));}
    const rms=Math.sqrt(power/data.length),hz=crossings.length>1?(crossings.length-1)*context.sampleRate/(crossings.at(-1)-crossings[0]):null;
    return{rms,peak,hz,passed:rms>.02&&hz!==null&&Math.abs(hz-307)<1};
  }
  function analyze(row,calibration=false){
    const input=interval(row.releaseTime-.05,.8);row.interval={firstFrame:input.firstFrame,frames:input.frames,firstTime:input.firstTime,duration:.8,channels:[0,1,2,3]};
    row.pitch=inspectReturnPCM(input.channels[0],context.sampleRate,input.firstTime,row.releaseTime,row.outputTime,880,475.2);
    row.positionProbes=inspectCursorProbes(input.channels[1],context.sampleRate,input.firstTime,row.releaseTime,row.expectedEndPosition);
    row.control={left:controlMetrics(input.channels[2]),right:controlMetrics(input.channels[3])};
    row.control.passed=row.control.left.passed&&row.control.right.passed;
    row.cursorConclusion=calibration?'steady-calibration':report.calibration?.passed?'audible-marker-measured':'oracle-not-established';
    row.passed=Object.values(row.pitch.criteriaPassed).every(Boolean)&&row.pitch.rawPitchWindows===0&&row.control.passed&&row.positionProbes.every(p=>p.passed);
    if(!calibration)row.passed&&=!!report.calibration?.passed&&row.rawReturnPositionMatchesPlan&&row.quickWithin50ms;
  }
  try{
    await bounded(resumed,'AudioContext resume',5000);report.sourceHashes=await bounded(sourceHashes(),'source identities');
    safe=context.createGain();safe.gain.value=0;safe.connect(context.destination);zero=context.createConstantSource();zero.offset.value=0;zero.start();
    await bounded(context.audioWorklet.addModule(new URL('./render-clock-capture-worklet.js',import.meta.url)),'capture module');
    captureNode=new AudioWorkletNode(context,'open-play-render-clock-capture',{numberOfInputs:2,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit',channelInterpretation:'discrete'});
    deckBus=context.createGain();controlBus=context.createGain();for(const bus of[deckBus,controlBus]){bus.channelCount=2;bus.channelCountMode='explicit';bus.channelInterpretation='discrete';zero.connect(bus);}
    engine.nodes[0].input.connect(deckBus);deckBus.connect(captureNode,0,0);controlBus.connect(captureNode,0,1);captureNode.connect(safe);
    oscillator=context.createOscillator();oscillator.frequency.value=307;controlGain=context.createGain();controlGain.gain.value=.08;oscillator.connect(controlGain);
    controlMerger=context.createChannelMerger(2);controlGain.connect(controlMerger,0,0);controlGain.connect(controlMerger,0,1);controlMerger.connect(controlBus);oscillator.start();
    let readyResolve,id=0;const waiters=new Map();capture={blocks:[],ready:new Promise(resolve=>readyResolve=resolve)};
    captureNode.port.onmessage=({data})=>{
      if(data.type==='ready')readyResolve();else if(data.type==='pcm'){
        if(capture.blocks.length>=40000){abort.abort(Error('40000block recording bound exceeded'));return;}capture.blocks.push(data);
      }else if(data.type==='error')abort.abort(Error(data.error));else{const resolve=waiters.get(data.id);if(resolve){waiters.delete(data.id);resolve(data);}}
    };
    capture.request=type=>{const key=type+'-'+(++id);return bounded(new Promise(resolve=>{waiters.set(key,resolve);captureNode.port.postMessage({type,id:key});}),'capture '+type,4000).finally(()=>waiters.delete(key));};
    const buffer=context.createBuffer(2,context.sampleRate*16,context.sampleRate);
    for(let c=0;c<2;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=cursorFixtureSample(i/context.sampleRate,c);}
    engine.buffers.set(d.track.id,buffer);engine.keylockRenderer.render=()=>{throw Error('Unexpected buffered fallback');};
    await bounded(engine.preloadDeckScratch(d),'scratch cache preload');await bounded(capture.ready,'capture ready');
    capture.preflight=await capture.request('preflight');
    const startFrame=Math.ceil((context.currentTime+.2)*context.sampleRate/128)*128,rampFrames=60*context.sampleRate;
    assert(Number.isSafeInteger(rampFrames)&&rampFrames<4194304,'Unsupported Float32 ramp frame range');
    report.clockPlan={startFrame,endFrame:startFrame+rampFrames,startTime:startFrame/context.sampleRate,endTime:(startFrame+rampFrames)/context.sampleRate,fromValue:0,endValue:rampFrames,sampleRate:context.sampleRate,toleranceFrames:.25,scheduleIssuedAt:context.currentTime,criterion:'Every armed parameter array has actual per-frame values, all strictly inside this scheduled ramp, +1/frame within .25sample, and agrees with every original frame label. Full old armed capture and unchanged cursor/pitch criteria still apply.'};
    const clockParam=captureNode.parameters.get('clockFrame');clockParam.cancelScheduledValues(0);clockParam.setValueAtTime(-1,0);clockParam.setValueAtTime(0,report.clockPlan.startTime);clockParam.linearRampToValueAtTime(rampFrames,report.clockPlan.endTime);
    while(context.currentTime<report.clockPlan.startTime+.025)await wait(5);
    capture.arm=await capture.request('arm');
    await bounded(engine.start(d),'steady calibration start');
    const calibrationTime=d.anchorTime+.3;report.calibration={releaseTime:calibrationTime,outputTime:calibrationTime,expectedEndPosition:2.4+1.08*(calibrationTime-d.anchorTime),anchorTime:d.anchorTime,anchorPosition:2.4};
    await reach(calibrationTime+.8);engine.pause(d);publish('Steady calibration captured; recording full matrix');
    for(let index=0;index<cases.length;index++){
      const spec=cases[index],row={index,...spec,movements:[],passed:null};report.checks.push(row);
      try{
        engine.pause(d);d.position=2.4;await bounded(engine.start(d),'case prewarm');await reach(d.anchorTime+.3);
        row.warm={contextTime:context.currentTime,position:engine.position(d)};
        const owner='cursor-engine-'+index;row.beginIssued=context.currentTime;row.beginACK=await bounded(engine.beginDeckScratch(d,owner),'scratch begin');assert(row.beginACK,'Scratch begin refused');
        row.activeHoldStart=context.currentTime;
        const desired=at=>spec.base+spec.velocity*Math.max(0,at-row.activeHoldStart)+(spec.throwSeconds&&at-row.activeHoldStart>=spec.seconds*.65?spec.throwSeconds:0);
        let first=true;
        while(first||context.currentTime-row.activeHoldStart<spec.seconds){first=false;const issue=context.currentTime,position=desired(issue);
          const accepted=await bounded(engine.updateDeckScratch(d,{position,velocity:spec.velocity},owner),'scratch movement');
          row.movements.push({issue,position,velocity:spec.velocity,accepted,ackObserved:context.currentTime});assert(accepted,'Scratch movement refused');await wait(spec.gesture==='quick'?5:16);
        }
        const finalIssued=context.currentTime,finalPosition=desired(finalIssued);
        assert(await bounded(engine.updateDeckScratch(d,{position:finalPosition,velocity:spec.velocity},owner),'final movement'),'Final movement refused');
        row.movements.push({issue:finalIssued,position:finalPosition,velocity:spec.velocity,accepted:true,ackObserved:context.currentTime,final:true});
        row.releaseTime=context.currentTime;row.expectedEndPosition=desired(row.releaseTime);row.actualActiveHoldSeconds=row.releaseTime-row.activeHoldStart;
        row.quickWithin50ms=spec.gesture!=='quick'||row.actualActiveHoldSeconds<=.05;
        row.rawStateBeforeEnd=engine.voices.get(0)?.deckScratchTransport?.state();
        row.shadowBeforeEnd=engine.deckScratchShadows.get(0)?.snapshot()||null;
        row.releaseACK=await bounded(engine.endDeckScratch(d,owner),'scratch release');assert(row.releaseACK,'Scratch release refused');
        row.outputTime=d.anchorTime;row.rawReturnPositionError=row.releaseACK.position-row.expectedEndPosition;
        row.rawReturnPositionMatchesPlan=Math.abs(row.rawReturnPositionError)<=cursorCriteria.cursorErrorSeconds;
        await reach(row.releaseTime+.8);engine.pause(d);
      }catch(error){row.error=error.message;row.passed=false;engine.pause(d);}
      publish('Captured '+report.checks.length+'/10 cases');if(abort.signal.aborted)throw abort.signal.reason;
    }
  }catch(error){report.fatalErrors.push({phase:'capture/run',error:error.message});}
  finally{
    cleanup=true;clearTimeout(wholeTimer);engine.pause(d);engine.scratchCache.clearAll();
    if(capture?.arm){try{capture.fence=await capture.request('finish');report.captureIntegrity=validateRenderClockCapture(capture,report.clockPlan);if(!report.captureIntegrity.passed)report.fatalErrors.push({phase:'capture integrity',error:'Full armed span has invalid rows',errors:report.captureIntegrity.errors});}catch(error){report.fatalErrors.push({phase:'capture integrity',error:error.message});}}
    // Even a validator exception must retain original producer geometry and
    // the received PCM. Missing/invalid evidence is never rewritten as coverage.
    if(capture)report.captureTranscript={preflight:capture.preflight??null,arm:capture.arm??null,fence:capture.fence??null,
      rows:capture.blocks.map(block=>({frame:block.frame,frames:block.frames,sequence:block.sequence,inputChannels:block.inputChannels,channelLengths:block.channels.map(x=>x.length),clock:block.clock,clockAfter:block.clockAfter,clockLength:block.clockValues.length,clockValuesF32LEBase64:btoa(String.fromCharCode(...new Uint8Array(block.clockValues.buffer,block.clockValues.byteOffset,block.clockValues.byteLength)))}))};
    captureNode?.disconnect();captureNode?.port.close();deckBus?.disconnect();controlBus?.disconnect();
    try{oscillator?.stop();zero?.stop();controlGain?.disconnect();controlMerger?.disconnect();safe?.disconnect();await bounded(context.close(),'context close',3000);}catch(error){report.cleanupErrors.push({phase:'context close',error:error.message});}
  }
  // Analyze only after closing audio: the global barcode search cannot starve
  // the observation interval or turn main-thread analysis load into a dropout.
  if(report.captureIntegrity?.passed){
    try{analyze(report.calibration,true);}catch(error){if(report.calibration)report.calibration.passed=false;report.fatalErrors.push({phase:'calibration analysis',error:error.message});}
    for(const row of report.checks)if(!row.error){try{analyze(row);}catch(error){row.passed=false;row.error=error.message;}}
  }
  try{report.sourceHashesAtEnd=await bounded(sourceHashes(),'final source identities',4000);
    report.sourceStable=sources.every(file=>report.sourceHashes?.[file]&&report.sourceHashes[file]===report.sourceHashesAtEnd[file]);
  }catch(error){report.sourceStable=false;report.fatalErrors.push({phase:'final source identities',error:error.message});}
  report.completed=report.checks.length===10&&!report.fatalErrors.length&&!report.cleanupErrors.length&&!!report.captureIntegrity?.passed&&report.sourceStable;
  report.allCriteriaPassed=report.completed&&!!report.calibration?.passed&&report.checks.every(row=>row.passed);
  if(capture?.blocks.length){
    const frames=capture.blocks.reduce((n,b)=>n+b.frames,0),pcm=new Float32Array(frames*4);let at=0;
    for(const block of capture.blocks)for(let i=0;i<block.frames;i++)for(let c=0;c<4;c++)pcm[at++]=block.channels[c][i];
    assert(new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4,'Raw format requires declared little-endian host');
    const bytes=new Uint8Array(pcm.buffer);report.raw={name:'keylock-engine-cursor32-complete.f32',format:'Float32 little-endian interleaved deckL,deckR,controlL,controlR; all received armed blocks, including invalid rows without repair',sampleRate:context.sampleRate,channels:4,frames,bytes:bytes.byteLength,SHA256:await sha(bytes),firstFrame:capture.arm?.firstFrame??null};
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));urls.push(url);$('#raw').href=url;$('#raw').download=report.raw.name;$('#raw').hidden=false;
  }
  report.durationMs=performance.now()-started;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));urls.push(url);$('#download').href=url;$('#download').download='keylock-engine-cursor32-results.json';$('#download').hidden=false;
  publish('Finished: '+report.checks.filter(row=>row.passed).length+'/10 cases; calibration '+(report.calibration?.passed?'passed':'not established'));
  running=false;$('#run').disabled=true;
};
