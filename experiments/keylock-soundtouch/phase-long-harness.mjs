import {createPhaseControl} from '/experiments/keylock-soundtouch/phase-control.mjs';
import createSoundTouchNode,{soundTouchFactoryDiagnostics} from '/experiments/keylock-soundtouch/node-factory.mjs';
import {AudioEngine} from '/prototype/engine.js';
const $ = s => document.querySelector(s), assert = (x, m) => {if (!x) throw new Error(m);};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
function bounded(promise, label, ms = 10000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);})]).finally(() => clearTimeout(timer));
}
async function post(path, body, type) {
  const response = await fetch(path, {method: 'POST', headers: {'Content-Type': type, 'X-Open-Play-Test': 'soundtouch-engine'}, body});
  assert(response.ok, 'Exclusive evidence write failed: ' + path + ' ' + response.status);
  return response.json();
}
function rpc(node, onEvent) {
  let sequence = 0; const pending = new Map();
  node.port.onmessage = ({data}) => {
    const handler = pending.get(data.requestId);
    if (handler) {pending.delete(data.requestId); data.error ? handler.reject(Object.assign(new Error(data.error.message), {name: data.error.name})) : handler.resolve(data.value);}
    else onEvent(data);
  };
  return (type, values = {}, transfer = []) => {
    const requestId = ++sequence;
    return bounded(new Promise((resolve, reject) => {pending.set(requestId, {resolve, reject}); node.port.postMessage({type, requestId, ...values}, transfer);}), type).finally(() => pending.delete(requestId));
  };
}
function stats(data, first, last, channel, channels, sr) {
  let mean = 0, power = 0, peak = 0;
  for (let i = first; i < last; i++) {const v = data[i * channels + channel]; mean += v; power += v * v; peak = Math.max(peak, Math.abs(v));}
  mean /= last - first; const crossings = [];
  for (let i = first + 1; i < last; i++) {const a = data[(i - 1) * channels + channel] - mean, b = data[i * channels + channel] - mean; if (a < 0 && b >= 0) crossings.push(i - 1 - a / (b - a));}
  return {frames: last - first, rms: Math.sqrt(power / (last - first)), peak,
    hz: crossings.length > 1 ? (crossings.length - 1) * sr / (crossings.at(-1) - crossings[0]) : null};
}
$('#run').onclick = async () => {
 $('#run').disabled=true;
 const report={startedAt:new Date().toISOString(),completed:false,cases:[],fatalErrors:[],full_parity_verified:false};
 try {
  const plan=await(await fetch('/plan.json')).json();report.plan=plan;report.servedSources=await(await fetch('/sources.json')).json();
  for(const spec of plan.cases) {
   const row={...spec,events:[],errors:[],measurements:[],criteriaPassed:false};report.cases.push(row);
   const blocks=[];let engine,ctx,collector,req,osc,safe,deck,observerControl;
   const slots=spec.sources+1,channels=slots*2+2;
   try {
    $('#status').textContent='Capturing actual engine '+spec.id+'; physical output muted.';
    engine=new AudioEngine();const NativeAudioContext=globalThis.AudioContext;
    try {globalThis.AudioContext=class extends NativeAudioContext{constructor(){super({sampleRate:spec.sampleRate});}};engine.init();}
    finally {globalThis.AudioContext=NativeAudioContext;}
    ctx=engine.ctx;engine.audioMonitor.mutePhysical(true);await bounded(engine.resume(),'engine.resume');
    assert(ctx.sampleRate===spec.sampleRate,'Requested/actual context sample rate mismatch');
    engine.onError=error=>row.errors.push({name:error.name,message:error.message});
    row.environment={sampleRate:ctx.sampleRate,baseLatency:ctx.baseLatency,outputLatency:ctx.outputLatency,userAgent:navigator.userAgent,contextConstructorOverrideForFixtureRate:true,physicalMonitor:engine.audioMonitor.snapshot()};
    if(plan.registration_lifecycle){
     const owner=new AbortController(),started=performance.now();
     const aborted=createSoundTouchNode(ctx,{outputChannelCount:[2]},{signal:owner.signal,durationFrames:ctx.sampleRate}).then(()=>({resolved:true}),error=>({name:error.name,message:error.message,elapsedMs:performance.now()-started}));
     const survivor=createSoundTouchNode(ctx,{outputChannelCount:[2]},{durationFrames:ctx.sampleRate});
     await wait(plan.registration_lifecycle.abort_after_ms);owner.abort();
     const canceled=await bounded(aborted,'registration abort',plan.registration_lifecycle.aborted_waiter_timeout_ms);
     assert(canceled.name==='AbortError','Canceled waiter did not reject');
     const node=await bounded(survivor,'shared-registration survivor');
     const chunk=[new Float32Array(Math.floor(ctx.sampleRate/2)),new Float32Array(Math.floor(ctx.sampleRate/2))];
     await node.addBuffers(chunk,chunk.map(c=>c.buffer));const before=await node.snapshot(),disposal=await node.dispose(),again=await node.dispose();
     assert(before.store.retainedPCMBytes>0&&disposal.store.retainedPCMBytes===0&&disposal.transport.epochs.length===0,'Processor release acknowledgement missing');
     assert(JSON.stringify(disposal)===JSON.stringify(again),'Disposal was not idempotent');
     const terminal=await node.schedule({active:true,input:0,output:ctx.currentTime+1,rate:1,semitones:0}).then(()=>({resolved:true}),error=>({name:error.name}));
     assert(terminal.name==='AbortError','Disposed node revived');
     row.lifecycle={canceled,otherWaiterSurvived:true,before,disposal,idempotent:true,terminal};
    }
    await ctx.audioWorklet.addModule('/experiments/keylock-soundtouch/phase-capture.mjs');
    collector=new AudioWorkletNode(ctx,'open-play-soundtouch-phase-capture',{numberOfInputs:slots+1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit',channelInterpretation:'discrete',processorOptions:{sources:slots}});
    req=rpc(collector,data=>{if(data.type==='pcm'){if(blocks.length<ctx.sampleRate*115/128)blocks.push(data);else row.errors.push({message:'Capture exceeded 115 second bound'});}else if(data.type==='fatal')row.errors.push(data.error);});
    safe=ctx.createGain();safe.gain.value=0;collector.connect(safe);safe.connect(ctx.destination);
    engine.nodes[0].monitorTap.connect(collector,0,spec.sources);
    osc=ctx.createOscillator();osc.frequency.value=307;const control=ctx.createGain();control.gain.value=.04;osc.connect(control);control.connect(collector,0,slots);osc.start();
    const buffer=ctx.createBuffer(2,spec.sourceSampleRate*132,spec.sourceSampleRate);
    for(let c=0;c<2;c++){const a=buffer.getChannelData(c);for(let i=0;i<a.length;i++)a[i]=.14*Math.sin(2*Math.PI*(i<spec.sourceSampleRate*16?[330,550][c]:[660,880][c])*i/spec.sourceSampleRate+[.17,.53][c]);}
    row.inputHashes=await Promise.all([0,1].map(c=>digest(buffer.getChannelData(c).buffer)));
    const track={id:'experimental-'+spec.id,duration:132,bpm:120};engine.buffers.set(track.id,buffer);
    if(spec.sources===5)engine.stemBuffers.set(track.id,Array.from({length:4},()=>{
     const clone=ctx.createBuffer(2,buffer.length,buffer.sampleRate);for(let c=0;c<2;c++)clone.copyToChannel(buffer.getChannelData(c),c);return clone;
    }));
    deck={index:0,track,position:0,playing:false,rate:1.08,keylock:true,keyShift:0,reverse:false,loop:false,stems:[true,true,true,true],stemFX:[false,false,false,false]};
    const anchor=Math.ceil((ctx.currentTime+1)*ctx.sampleRate/128)*128,periodFrames=Math.round(ctx.sampleRate*4/128)*128;
    row.framePhaseSchedule={anchorFrame:anchor,periodFrames,issuedAtFrame:ctx.currentTime*ctx.sampleRate};
    row.configureClock=await req('configure-clock',{clock:{anchorFrame:anchor,periodFrames}});
    observerControl=createPhaseControl(ctx,collector.parameters.get('framePhase'),{anchorFrame:anchor,periodFrames});
    async function until(time){const deadline=performance.now()+Math.max(10000,(time-ctx.currentTime)*1000+10000);while(ctx.currentTime<time){await wait(20);assert(performance.now()<deadline,'Context progress timeout');assert(!row.errors.length,'Engine/processor error');}}
    await until((anchor+256)/ctx.sampleRate);row.arm=await req('arm');
    function connectVoice(){const adapter=engine.voices.get(0)?.liveKeylock;assert(adapter,'Actual engine did not select live keylock');adapter.outputs.forEach((out,i)=>out.connect(collector,0,i));return adapter;}
    async function phase(label,action,expected,hold,connect=false){
     const issuedAt=ctx.currentTime;await bounded(action(),label);const adapter=connect?connectVoice():engine.voices.get(0)?.liveKeylock;
     assert(adapter&&!adapter.snapshot().disposed,'Live owner missing after '+label);
     const state=adapter.clock.at(-1);const event={label,issuedAt,acknowledgedAt:ctx.currentTime,state:{...state},snapshot:adapter.snapshot()};row.events.push(event);
     assert(state.when>=issuedAt,'Command output precedes invocation');
     row.measurements.push({label,window:[state.when+.5,state.when+1.5],expectedHz:expected});
     await until(state.when+hold);event.after=adapter.snapshot();assert(!event.after.lastError,'Adapter error');
    }
    await phase('long-neutral',()=>engine.start(deck),[330,550],100,true);
    const first=row.events[0];
    for(const offset of[30,60,90])row.measurements.push({label:'long-neutral-'+offset+'s',window:[first.state.when+offset+.5,first.state.when+offset+1.5],expectedHz:[660,880]});
    row.longClock={observedContextFrame:ctx.currentTime*ctx.sampleRate,oldAbsoluteLimit:2**22,crossedOldLimit:ctx.currentTime*ctx.sampleRate>2**22,adapter:engine.voices.get(0).liveKeylock.snapshot()};
    assert(row.longClock.crossedOldLimit,'Did not cross prior absolute clock limit');
    const window=row.longClock.adapter.groups.find(g=>g.role==='selected');
    assert(window.start>90&&window.end>110,'Long playback did not drop/refill bounded source window');
    assert(window.retainedPCMBytes<=ctx.sampleRate*11*2*4,'Acknowledged long window exceeded11second payload bound');
    async function pauseAndProve(label){
     const adapter=engine.voices.get(0)?.liveKeylock;assert(adapter,'Missing owner before '+label);
     const processors=[...adapter.groups].flatMap(group=>group.nodes);
     const at=ctx.currentTime;engine.pause(deck);const release=await bounded(adapter.dispose(),label+' release');
     const snapshots=await Promise.all(processors.map(node=>node.snapshot()));
     assert(processors.length>=spec.sources&&snapshots.every(s=>s.disposed&&s.store.retainedPCMBytes===0&&s.transport.epochs.length===0),'Actual processor release missing');
     const result={label,at,release,adapter:adapter.snapshot(),processors:snapshots};(row.releaseEvidence??=[]).push(result);return at;
    }
    const pausedAt=await pauseAndProve('middle-pause');row.pause={window:[pausedAt+.2,pausedAt+.6],pausedAt};await until(pausedAt+.7);
    row.pausedVoiceAbsent=!engine.voices.has(0);assert(row.pausedVoiceAbsent,'Paused engine retained selected voice');
    deck.keylock=true;deck.keyShift=2;
    await phase('resume',()=>engine.start(deck),[660,880].map(v=>v*2**(2/12)),2,true);
    row.finalSnapshot=engine.voices.get(0).liveKeylock.snapshot();
    await pauseAndProve('final-pause');await wait(100);row.cleaned=engine.voices.size===0&&row.releaseEvidence.length===2&&row.releaseEvidence.every(e=>e.processors.every(p=>p.store.retainedPCMBytes===0));
   }catch(error){row.errors.push({name:error.name,message:error.message,stack:error.stack,diagnostic:error.diagnostic});}
   finally {
    if(ctx)row.factoryDiagnostics=soundTouchFactoryDiagnostics(ctx);
    if(req)try{row.captureStop=await req('stop');}catch(error){row.errors.push({message:error.message});}
    if(blocks.length){
     const frames=blocks.reduce((n,b)=>n+b.frames,0),data=new Float32Array(frames*channels);let offset=0,nonfinite=0,contiguous=true,maxFrameTagError=0;
     row.blocks=[];
     for(let n=0;n<blocks.length;n++){const b=blocks[n];if(b.sequence!==n||b.frames!==128||n&&b.frame!==blocks[n-1].frame+128)contiguous=false;
      row.blocks.push({sequence:b.sequence,frame:b.frame,globalFrame:b.globalFrame,globalTime:b.globalTime,frameSource:b.frameSource,frames:b.frames});
      assert(b.channels.length===channels,'Capture geometry mismatch');
      for(let i=0;i<b.frames;i++){maxFrameTagError=Math.max(maxFrameTagError,Math.abs(b.channels[channels-1][i]*row.framePhaseSchedule.periodFrames-((b.frame+i-row.framePhaseSchedule.anchorFrame)%row.framePhaseSchedule.periodFrames)));for(let c=0;c<channels;c++){const v=b.channels[c][i];if(!Number.isFinite(v))nonfinite++;data[(offset+i)*channels+c]=v;}}offset+=b.frames;
     }
     row.capture={frames,channels,firstFrame:blocks[0].frame,sampleRate:ctx.sampleRate,nonfinite,contiguous,maxFrameTagError,valid:nonfinite===0&&contiguous&&maxFrameTagError<=plan.criteria.frame_tag_error_samples,sha256:await digest(data.buffer)};
     row.capture.retained=await post('/raw/'+spec.id,data.buffer,'application/octet-stream');
     for(const m of row.measurements){const [a,b]=m.window.map(t=>Math.round(t*ctx.sampleRate)-row.capture.firstFrame);if(a<0||b>frames){m.passed=false;m.error='Tone window incomplete';m.channels=[];row.errors.push({message:m.error,label:m.label});continue;}
      m.channels=[];for(let source=0;source<slots;source++)for(let c=0;c<2;c++){const v=stats(data,a,b,source*2+c,channels,ctx.sampleRate);m.channels.push({...v,source,channel:c,expectedHz:m.expectedHz[c],passed:v.rms>.01&&Math.abs(v.hz-m.expectedHz[c])<=plan.criteria.pitch_error_hz});}
      m.passed=m.channels.every(c=>c.passed);
     }
     if(row.pause){const [a,b]=row.pause.window.map(t=>Math.round(t*ctx.sampleRate)-row.capture.firstFrame);row.pause.channels=[];for(let c=0;c<slots*2;c++)row.pause.channels.push(stats(data,a,b,c,channels,ctx.sampleRate));row.pause.passed=row.pause.channels.every(c=>c.peak===0);}
     const control=stats(data,0,frames,slots*2,channels,ctx.sampleRate);row.control={...control,passed:Math.abs(control.hz-307)<=plan.criteria.control_error_hz};
    }
    try{if(engine&&deck)engine.pause(deck);osc?.stop();observerControl?.dispose();collector?.disconnect();safe?.disconnect();if(engine?.audioMonitor)engine.audioMonitor.dispose();if(ctx)await ctx.close();}catch(error){row.errors.push({message:error.message});}
   }
   row.criteriaPassed=(!plan.registration_lifecycle||row.lifecycle?.terminal.name==='AbortError')&&!row.errors.length&&row.measurements.length===5&&row.measurements.every(m=>m.passed)&&row.pause?.passed&&row.capture?.valid&&row.control?.passed&&row.cleaned&&row.longClock?.crossedOldLimit;
   $('#result').textContent=JSON.stringify(report.cases.map(c=>({id:c.id,passed:c.criteriaPassed,errors:c.errors,frames:c.capture?.frames,toneChecks:c.measurements.flatMap(m=>m.channels||[]).length,toneFailures:c.measurements.flatMap(m=>(m.channels||[]).filter(c=>!c.passed)),pause:c.pause?.passed,clock:c.capture?.maxFrameTagError})),null,2);
  }
  report.completed=true;
 }catch(error){report.fatalErrors.push({name:error.name,message:error.message,stack:error.stack,diagnostic:error.diagnostic});}
 report.finishedAt=new Date().toISOString();report.acceptedCases=report.cases.filter(c=>c.criteriaPassed).length;
 await post('/report',JSON.stringify(report,null,2),'application/json');$('#status').textContent='Capture finished: '+report.acceptedCases+'/'+report.cases.length+' bounded engine cases accepted. Full parity remains unverified.';
};
