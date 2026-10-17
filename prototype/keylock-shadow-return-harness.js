import {createShadowFollowKeylock} from './keylock-shadow-follow-experiment.js';

export const shadowReturnCriteria=Object.freeze({rate:1.08,semitones:12,leadSeconds:.04,followMilliseconds:25,quickRequestedSeconds:.03,quickMaximumSeconds:.05,
  gainRampSeconds:.003,runSeconds:90,cleanupSeconds:8,firstCorrectSeconds:.03,maxGapSeconds:.02,
  minimumRMS:.005,pitchRelative:.01,cursorErrorSeconds:.01,correlationMinimum:.8,correlationMargin:.04,
  cursorProbeAfterReleaseSeconds:.2,cursorProbeDurationSeconds:.4,sourceSeconds:16});
export const shadowCases=Object.freeze(['same','different'].flatMap(region=>[
  {gesture:'stationary',seconds:1,velocity:0},{gesture:'forward',seconds:1,velocity:.5},
  {gesture:'backward',seconds:1,velocity:-.5},{gesture:'quick',seconds:.03,velocity:0},
  {gesture:'throw',seconds:1,velocity:0,throwSeconds:3},
].map(spec=>Object.freeze({...spec,region,base:region==='same'?2.4:6.2}))));
const assert=(value,message)=>{if(!value)throw Error(message);};
const finite=value=>typeof value==='number'&&Number.isFinite(value);
function randomLevel(index){let x=Math.imul(index+202617,0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return((x^(x>>>16))>>>0)/4294967296;}
/** Aperiodic source-domain amplitude markers; no repeating click-phase alias. */
export function shadowEnvelope(seconds){const at=seconds/.073,index=Math.floor(at),f=at-index,s=f*f*(3-2*f);return .045+.105*(randomLevel(index)*(1-s)+randomLevel(index+1)*s);}
export function shadowFixtureSample(seconds,channel){return channel===0?.12*Math.sin(2*Math.PI*440*seconds):shadowEnvelope(seconds)*Math.sin(2*Math.PI*660*seconds);}
export function shadowCursor(spec,elapsed){return spec.base+spec.velocity*Math.max(0,elapsed)+(spec.throwSeconds&&elapsed>=spec.seconds*.65?spec.throwSeconds:0);}

export function shadowSpectrum(data,sr){
  let power=0,peak=0,n=1;while(n<data.length*2)n*=2;const re=new Float64Array(n),im=new Float64Array(n);
  for(let i=0;i<data.length;i++){power+=data[i]**2;peak=Math.max(peak,Math.abs(data[i]));re[i]=data[i]*(.5-.5*Math.cos(2*Math.PI*i/Math.max(1,data.length-1)));}
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[re[i],re[j]]=[re[j],re[i]];}
  for(let len=2;len<=n;len*=2){const wr=Math.cos(-2*Math.PI/len),wi=Math.sin(-2*Math.PI/len);for(let start=0;start<n;start+=len){let ar=1,ai=0;for(let j=0;j<len/2;j++){const a=start+j,b=a+len/2,tr=re[b]*ar-im[b]*ai,ti=re[b]*ai+im[b]*ar;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;[ar,ai]=[ar*wr-ai*wi,ar*wi+ai*wr];}}}
  const energy=k=>re[k]**2+im[k]**2;let k=Math.max(1,Math.floor(200*n/sr));for(let i=k;i<=Math.min(n/2-2,Math.ceil(1800*n/sr));i++)if(energy(i)>energy(k))k=i;
  const a=Math.log(Math.max(1e-30,energy(k-1))),b=Math.log(Math.max(1e-30,energy(k))),c=Math.log(Math.max(1e-30,energy(k+1))),den=a-2*b+c,offset=Math.abs(den)>1e-12?.5*(a-c)/den:0;
  return{frames:data.length,rms:Math.sqrt(power/Math.max(1,data.length)),peak,dominantHz:power>1e-16?(k+Math.max(-.5,Math.min(.5,offset)))*sr/n:null};
}
function correlation(a,b){let sa=0,sb=0,saa=0,sbb=0,sab=0;for(let i=0;i<a.length;i++){sa+=a[i];sb+=b[i];saa+=a[i]*a[i];sbb+=b[i]*b[i];sab+=a[i]*b[i];}const n=a.length,den=Math.sqrt((n*saa-sa*sa)*(n*sbb-sb*sb));return den>1e-16?(n*sab-sa*sb)/den:null;}
export function correlateShadowCursor(data,sr,firstTime,probeTime,{rate=1.08,duration=.4,sourceSeconds=16}={}){
  const rows=[],observed=[],offsets=[],width=Math.round(sr*.008),hop=Math.round(sr*.004),start=Math.round((probeTime-firstTime)*sr),count=Math.round(duration*sr);
  assert(start>=0&&start+count<=data.length,'Cursor correlation lacks full probe PCM');
  for(let i=0;i+width<=count;i+=hop){let p=0;for(let j=0;j<width;j++)p+=data[start+i+j]**2;observed.push(Math.sqrt(p/width));offsets.push((i+width/2)/sr);}
  const template=p=>offsets.map(dt=>shadowEnvelope(p+rate*dt));
  const max=sourceSeconds-rate*duration;for(let p=0;p<=max;p+=.002){const score=correlation(observed,template(p));rows.push({position:p,score});}
  const valid=rows.filter(r=>r.score!==null).sort((a,b)=>b.score-a.score),coarse=valid[0];
  if(!coarse)return{position:null,score:null,competitor:null,margin:null,confident:false,curve:rows,observed,offsets};
  let best=coarse;for(let p=Math.max(0,coarse.position-.002);p<=Math.min(max,coarse.position+.002);p+=.00025){const score=correlation(observed,template(p));if(score!==null&&score>best.score)best={position:p,score};}
  const competitor=valid.find(r=>Math.abs(r.position-best.position)>=.05)||null,margin=competitor?best.score-competitor.score:0;
  return{...best,competitor,margin,confident:best.score>=shadowReturnCriteria.correlationMinimum&&margin>=shadowReturnCriteria.correlationMargin,
    probeTime,duration,observed,offsets,curve:rows};
}
export function inspectShadowReturn({left,right,sampleRate:sr,firstTime,releaseTime,endPosition,alignmentACK,sourceSeconds=16}){
  const c=shadowReturnCriteria,width=Math.round(sr*.04),hop=Math.round(sr*.01),first=Math.max(0,Math.ceil((releaseTime-firstTime)*sr)),windows=[];
  assert(left.length===right.length&&left.length>sr*.6,'Release analysis needs stereo and full600ms window');
  for(let i=first;i+width<=left.length;i+=hop){const m=shadowSpectrum(left.subarray(i,i+width),sr),relative=(firstTime+i/sr)-releaseTime;windows.push({relativeStart:relative,...m,correct:m.rms>=c.minimumRMS&&m.dominantHz!==null&&Math.abs(m.dominantHz-880)<=8.8,raw:m.rms>=c.minimumRMS&&m.dominantHz!==null&&Math.abs(m.dominantHz-475.2)<=4.752});}
  const firstCorrect=windows.find(w=>w.correct),settled=windows.filter(w=>w.relativeStart>=.25-1e-8&&w.relativeStart<=.4+1e-8),wrong=windows.filter(w=>w.relativeStart>=.03-1e-8&&w.rms>=c.minimumRMS&&!w.correct),raw=windows.filter(w=>w.raw);
  let run=0,longest=0,initial=0,initialOpen=true;const ms=Math.max(1,Math.round(sr*.001)),bins=[];
  for(let i=first;i+ms<=left.length;i+=ms){let p=0;for(let j=0;j<ms;j++)p+=left[i+j]**2;const rms=Math.sqrt(p/ms);bins.push({relativeStart:firstTime+i/sr-releaseTime,rms});if(rms<c.minimumRMS){run++;longest=Math.max(longest,run);if(initialOpen)initial++;}else{run=0;initialOpen=false;}}
  const settledRMS=settled.length?settled.reduce((s,w)=>s+w.rms,0)/settled.length:0,level=[];
  for(let i=first+Math.round(sr*.01);i+Math.round(sr*.01)<=left.length;i+=Math.round(sr*.01)){let p=0,n=Math.round(sr*.01);for(let j=0;j<n;j++)p+=left[i+j]**2;level.push({relativeStart:firstTime+i/sr-releaseTime,rms:Math.sqrt(p/n)});}
  const probeTime=releaseTime+c.cursorProbeAfterReleaseSeconds,cursor=correlateShadowCursor(right,sr,firstTime,probeTime,{duration:c.cursorProbeDurationSeconds,sourceSeconds});
  cursor.idealPosition=endPosition+c.rate*(probeTime-releaseTime);cursor.errorFromIdealSeconds=cursor.position===null?null:cursor.position-cursor.idealPosition;
  cursor.ackClockPosition=alignmentACK&&finite(alignmentACK.position)&&finite(alignmentACK.when)?alignmentACK.position+c.rate*(probeTime-alignmentACK.when):null;
  cursor.errorFromACKSeconds=cursor.position===null||cursor.ackClockPosition===null?null:cursor.position-cursor.ackClockPosition;
  cursor.ackVsIdealSeconds=cursor.ackClockPosition===null?null:cursor.ackClockPosition-cursor.idealPosition;
  const criteriaPassed={firstCorrectWithin30ms:firstCorrect!==undefined&&firstCorrect.relativeStart<=c.firstCorrectSeconds+1e-8,
    initialGapWithin20ms:initial*ms/sr<=c.maxGapSeconds,longestGapWithin20ms:longest*ms/sr<=c.maxGapSeconds,
    noWrongPitchAfter30ms:wrong.length===0,noRawPitch:raw.length===0,settledPitch:settled.length>=5&&settled.every(w=>w.correct),
    levelContinuity:settledRMS>=c.minimumRMS&&level.every(w=>w.rms>=settledRMS*.5),cursorConfident:cursor.confident,
    cursorWithin10msOfIdeal:cursor.errorFromIdealSeconds!==null&&Math.abs(cursor.errorFromIdealSeconds)<=c.cursorErrorSeconds};
  return{firstCorrectSeconds:firstCorrect?.relativeStart??null,initialGapSeconds:initial*ms/sr,longestGapSeconds:longest*ms/sr,
    wrongPitchWindowsAfter30ms:wrong.length,rawPitchWindows:raw.length,settledRMS,windows,bins,level,cursor,criteriaPassed,passed:Object.values(criteriaPassed).every(Boolean)};
}

/** Actual capture class also exercised by controlled Node producer tests. */
export function createShadowCaptureProcessor(Base,frameNow){return class extends Base{
  constructor(){super();this.seq=0;this.previous=null;this.startupGaps=[];this.preflight=null;this.armId=null;this.finishId=null;this.armed=false;this.finished=false;
    this.port.onmessage=({data})=>{if(data.type==='preflight'&&!this.armed)this.preflight={id:data.id,rows:[],consecutive:0,last:null};if(data.type==='arm'&&!this.armed)this.armId=data.id;if(data.type==='finish')this.finishId=data.id;};this.port.postMessage({type:'ready'});}
  process(inputs,outputs){outputs.forEach(out=>out.forEach(ch=>ch.fill(0)));if(this.finished)return false;const frame=frameNow(),frames=outputs[0][0].length,sequence=this.seq++,input=inputs[0]||[];
    if(this.previous!==null&&frame!==this.previous)this.startupGaps.push({expected:this.previous,actual:frame,sequence});this.previous=frame+frames;
    if(this.preflight){const p=this.preflight;p.rows.push({frame,sequence,frames,inputChannels:input.length});p.consecutive=p.last===frame?p.consecutive+1:1;p.last=frame+frames;
      if(p.rows.length>8192){this.port.postMessage({type:'capture-error',error:'Preflight row bound exceeded',rows:p.rows});this.finished=true;return false;}
      if(p.consecutive>=64){this.port.postMessage({type:'preflight',id:p.id,rows:p.rows,consecutive:p.consecutive,startupGaps:this.startupGaps});this.preflight=null;}}
    if(!this.armed){if(this.armId===null){if(this.finishId!==null){this.port.postMessage({type:'finished',id:this.finishId,unarmed:true});this.finished=true;return false;}return true;}
      this.armed=true;this.port.postMessage({type:'armed',id:this.armId,firstFrame:frame,firstSequence:sequence,startupGaps:this.startupGaps});}
    const channels=[0,1].map(c=>input[c]?.slice()||new Float32Array(frames));this.port.postMessage({type:'pcm',frame,sequence,inputChannels:input.length,channels},channels.map(c=>c.buffer));
    if(this.finishId!==null){this.port.postMessage({type:'finished',id:this.finishId,lastFrame:frame+frames,lastSequence:sequence});this.finished=true;return false;}return true;
  }
};}
export function validateShadowCapture(target){
  assert(target.arm&&target.fence&&!target.fence.unarmed,'Capture lacks real arm/fence');assert(target.preflight?.consecutive>=64,'Missing64 consecutive preflight quanta');
  const preflight=target.preflight.rows;assert(preflight?.length>=64,'Preflight lacks actual producer rows');
  const tail=preflight.slice(-64);for(let i=0;i<tail.length;i++){const row=tail[i],previous=tail[i-1];assert(row.inputChannels===2&&row.frames>0&&(!previous||row.frame===previous.frame+previous.frames&&row.sequence===previous.sequence+1),'Preflight64 producer rows are not contiguous actual stereo');}
  assert(target.blocks.length>0,'Armed capture is empty');
  let frame=target.arm.firstFrame,sequence=target.arm.firstSequence;const errors=[];
  for(const b of target.blocks){if(b.frame!==frame||b.sequence!==sequence||b.inputChannels!==2||b.channels.length!==2||b.channels[0].length!==b.channels[1].length)errors.push({expectedFrame:frame,actualFrame:b.frame,expectedSequence:sequence,actualSequence:b.sequence,inputChannels:b.inputChannels});if(b.channels.some(channel=>channel.some(value=>!finite(value))))errors.push({reason:'nonfinite-PCM',frame:b.frame,sequence:b.sequence});frame=b.frame+b.channels[0].length;sequence=b.sequence+1;}
  if(frame!==target.fence.lastFrame||sequence-1!==target.fence.lastSequence)errors.push({reason:'final-fence-mismatch',frame,sequence,fence:target.fence});
  return{passed:errors.length===0,coverage:errors.length?null:1,errors,frames:frame-target.arm.firstFrame,rows:target.blocks.map(b=>({frame:b.frame,sequence:b.sequence,frames:b.channels[0].length,inputChannels:b.inputChannels})),preflight:target.preflight,arm:target.arm,fence:target.fence};
}

if(typeof AudioWorkletProcessor==='function'&&typeof registerProcessor==='function')registerProcessor('open-play-keylock-shadow-capture',createShadowCaptureProcessor(AudioWorkletProcessor,()=>currentFrame));
else if(typeof document!=='undefined')setupShadowPage();

function setupShadowPage(){
  const $=s=>document.querySelector(s);let running=false,reportURL=null;const rawURLs=[];
  $('#run').onclick=async()=>{
    if(running)return;running=true;$('#run').disabled=true;if(reportURL)URL.revokeObjectURL(reportURL);rawURLs.splice(0).forEach(URL.revokeObjectURL);$('#captures').textContent='';
    const report={experimentRevision:'shadow-follow-retention2s-quick30ms-1',startedAt:new Date().toISOString(),criteria:shadowReturnCriteria,cases:shadowCases,checks:[],events:[],captures:[],fatalErrors:[],cleanupErrors:[],scope:'Isolated active-muted experimental adapter only. No AudioEngine/native integration, no raw bridge, no heap/quality/parity acceptance. Shadow-follow retention2s/required coverage1s experimental clone; original lead adapter unchanged.',adapterSHA256:'16707a8f446a503eff022528461ff758b0f47031e34064241bf02d085cd6d9e4',baselineAdapterSHA256:'669f76e8482b8c215e41ab791c833a207c025412f33efe2ecefd08e145d21535',vendorSHA256:'b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e'};
    const started=performance.now(),deadline=started+90000,runAbort=new AbortController(),context=new AudioContext(),resumed=context.resume();let safe,zero,active,target,inner,owner,followTimer,pendingFactory,cleanup=false;
    const wholeTimer=setTimeout(()=>runAbort.abort(new Error('Whole-run90s deadline')),90000);
    const bounded=(promise,label,ms=10000)=>{let timer,abort;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),Math.max(1,Math.min(ms,cleanup?ms:deadline-performance.now())));if(!cleanup){abort=()=>reject(runAbort.signal.reason||Error('Run aborted'));if(runAbort.signal.aborted)abort();else runAbort.signal.addEventListener('abort',abort,{once:true});}})]).finally(()=>{clearTimeout(timer);if(abort)runAbort.signal.removeEventListener('abort',abort);});};
    const wait=ms=>bounded(new Promise(resolve=>setTimeout(resolve,ms)),'wait',ms+1000);
    function publish(stage,checkpoint=false){const summary={stage,elapsedMs:Math.round(performance.now()-started),measured:report.checks.length,expected:10,oracleCalibration:report.oracleCalibration?{passed:report.oracleCalibration.passed,error:report.oracleCalibration.error,positionError:report.oracleCalibration.observed?.cursor.errorFromIdealSeconds}:null,passed:report.checks.filter(c=>c.passed).length,failed:report.checks.filter(c=>!c.passed).length,fatalErrors:report.fatalErrors.map(e=>({phase:e.phase,error:e.error})),checks:report.checks.map(c=>({gesture:c.gesture,region:c.region,passed:c.passed,error:c.error,criteria:c.observed?.criteriaPassed,cursorError:c.observed?.cursor.errorFromIdealSeconds,cursorConclusion:c.cursorConclusion,quickWithin50ms:c.quickWithin50ms})),fullReport:'Download full JSON and each continuous stereo PCM; no armed data is trimmed.'};$('#results').textContent=JSON.stringify(summary,null,2);$('#status').textContent=stage;
      if(checkpoint){const next=URL.createObjectURL(new Blob([JSON.stringify(report)],{type:'application/json'}));if(reportURL)URL.revokeObjectURL(reportURL);reportURL=next;$('#download').href=next;$('#download').download='keylock-shadow-return-browser-retention-results.json';$('#download').hidden=false;}}
    function capture(label){const node=new AudioWorkletNode(context,'open-play-keylock-shadow-capture',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2]}),bus=context.createGain(),blocks=[],waiters=new Map();bus.channelCount=2;bus.channelCountMode='explicit';bus.channelInterpretation='discrete';zero.connect(bus);bus.connect(node);node.connect(safe);let readyResolve,id=0;
      const t={label,node,bus,blocks,errors:[],ready:new Promise(resolve=>readyResolve=resolve)};node.port.onmessage=({data})=>{if(data.type==='ready')readyResolve();else if(data.type==='pcm'){if(blocks.length>=40000){runAbort.abort(Error('Explicit capture block bound exceeded'));return;}blocks.push(data);}else if(data.type==='capture-error'){t.errors.push(data);runAbort.abort(Error(data.error));}else{const resolve=waiters.get(data.id);if(resolve){waiters.delete(data.id);resolve(data);}}};
      t.request=type=>{const key=label+'-'+type+'-'+(++id);return bounded(new Promise(resolve=>{waiters.set(key,resolve);node.port.postMessage({type,id:key});}),'capture '+type,4000).finally(()=>waiters.delete(key));};return t;}
    async function reach(t,time){while(!t.blocks.length||t.blocks.at(-1).frame+t.blocks.at(-1).channels[0].length<Math.ceil(time*context.sampleRate))await wait(10);}
    function interval(t,start,seconds){const first=Math.round(start*context.sampleRate),count=Math.round(seconds*context.sampleRate),out=[new Float32Array(count),new Float32Array(count)];let at=first;
      for(const b of t.blocks){const a=Math.max(first,b.frame),end=Math.min(first+count,b.frame+b.channels[0].length);if(end<=a)continue;assert(a===at&&b.inputChannels===2,'Requested PCM interval has gap/overlap/missing stereo');for(let c=0;c<2;c++)out[c].set(b.channels[c].subarray(a-b.frame,end-b.frame),a-first);at=end;}
      assert(at===first+count,'PCM interval incomplete');return{left:out[0],right:out[1],firstTime:first/context.sampleRate};}
    function retain(t,integrity){const frames=t.blocks.reduce((s,b)=>s+b.channels[0].length,0),pcm=new Float32Array(frames*2);let offset=0;for(const b of t.blocks)for(let i=0;i<b.channels[0].length;i++){pcm[offset++]=b.channels[0][i];pcm[offset++]=b.channels[1][i];}const url=URL.createObjectURL(new Blob([pcm],{type:'application/octet-stream'}));rawURLs.push(url);const name=t.label+'.stereo.f32';const li=document.createElement('li'),a=document.createElement('a');a.href=url;a.download=name;a.textContent='Download '+name;li.append(a);$('#captures').append(li);report.captures.push({label:t.label,raw:{name,format:'Float32 native little-endian interleaved L/R',sampleRate:context.sampleRate,frames,bytes:pcm.byteLength,firstFrame:t.arm?.firstFrame??null},...integrity});}
    try{
      await bounded(resumed,'AudioContext resume',5000);safe=context.createGain();safe.gain.value=0;safe.connect(context.destination);zero=context.createConstantSource();zero.offset.value=0;zero.start();
      report.sourceHashes=Object.fromEntries(await bounded(Promise.all([
        ['harness',new URL(import.meta.url)],['shadowFollowAdapter',new URL('./keylock-shadow-follow-experiment.js',import.meta.url)],
        ['baselineLeadAdapter',new URL('./keylock-live-lead-experiment.js',import.meta.url)],['vendorModule',new URL('./vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs',import.meta.url)],
      ].map(async([name,url])=>{const response=await fetch(url,{cache:'no-store'});assert(response.ok,'Runtime source hash fetch failed: '+name);const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);return[name,{url:url.href,bytes:bytes.byteLength,sha256:Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('')}];})),'runtime source hashes',5000));
      report.sourceHashIntegrityPassed=report.sourceHashes.shadowFollowAdapter.sha256===report.adapterSHA256&&report.sourceHashes.baselineLeadAdapter.sha256===report.baselineAdapterSHA256&&report.sourceHashes.vendorModule.sha256===report.vendorSHA256;
      assert(report.sourceHashIntegrityPassed,'Runtime adapter/vendor bytes differ from frozen expected SHA256');
      await bounded(context.audioWorklet.addModule(new URL(import.meta.url).href),'capture module');const buffer=context.createBuffer(2,context.sampleRate*16,context.sampleRate);for(let c=0;c<2;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=shadowFixtureSample(i/context.sampleRate,c);}
      // Independent no-follow/no-scratch actual-WASM clock calibration. Its
      // owner is disposed before any experimental owner is prepared.
      report.oracleCalibration={passed:false,kind:'steady active keylock, no follower/scratch'};owner=new AbortController();const calibrationOwner=owner,stopCalibration=()=>calibrationOwner.abort();runAbort.signal.addEventListener('abort',stopCalibration,{once:true});
      try{
        publish('Calibrating actual-WASM barcode oracle');pendingFactory=createShadowFollowKeylock(context,{buffers:[buffer],position:2.4,rate:1.08,keylock:true,semitones:12,experimentalLeadSeconds:.04,signal:calibrationOwner.signal,onEvent:event=>{if(report.events.length>=12000){runAbort.abort(Error('Adapter event bound exceeded'));return;}report.events.push({case:'oracle-calibration',...event});}});active=await bounded(pendingFactory,'oracle owner',15000);
        target=capture('shadow-oracle-calibration');active.outputs[0].connect(target.bus);await bounded(target.ready,'oracle capture ready');target.preflight=await target.request('preflight');target.arm=await target.request('arm');
        const warm=await bounded(active.start({position:2.4,when:context.currentTime+.25}),'oracle steady start');await reach(target,warm.when+1.2);
        const releaseTime=warm.when+.5,endPosition=2.4+1.08*.5,input=interval(target,releaseTime,.7),observed=inspectShadowReturn({...input,sampleRate:context.sampleRate,releaseTime,endPosition,alignmentACK:warm});
        report.oracleCalibration={passed:observed.passed,kind:'steady active keylock, no follower/scratch',warm,releaseTime,endPosition,observed,snapshot:active.snapshot()};
      }catch(error){report.oracleCalibration.error=error.message;}
      finally{
        calibrationOwner.abort();runAbort.signal.removeEventListener('abort',stopCalibration);
        if(target){try{target.fence=await target.request('finish');const integrity=validateShadowCapture(target);report.oracleCalibration.passed&&=integrity.passed;retain(target,integrity);}catch(error){report.oracleCalibration.passed=false;report.oracleCalibration.captureError=error.message;retain(target,{passed:false,preflight:target.preflight,arm:target.arm,fence:target.fence,rows:target.blocks.map(b=>({frame:b.frame,sequence:b.sequence,inputChannels:b.inputChannels,frames:b.channels[0].length}))});}target.node.disconnect();target.node.port.close();target.bus.disconnect();try{zero.disconnect(target.bus);}catch(error){report.cleanupErrors.push({phase:'oracle zero-input route',error:error.message});}target=null;}
        if(active)try{await bounded(active.dispose(),'oracle disposal',3000);}catch(error){report.cleanupErrors.push({phase:'oracle disposal',error:error.message});}active=null;if(pendingFactory)pendingFactory.then(value=>value.dispose()).catch(()=>{});pendingFactory=null;publish('Oracle calibration retained',true);
      }
      for(let index=0;index<shadowCases.length;index++){
        assert(!runAbort.signal.aborted&&performance.now()<deadline,'Whole-run deadline exceeded');const spec=shadowCases[index],row={...spec,follow:[],snapshots:[],passed:false};report.checks.push(row);owner=new AbortController();const cancelOwner=()=>owner.abort();runAbort.signal.addEventListener('abort',cancelOwner,{once:true});let gate,pendingFollow=null,desired=null,followRevision=0,sent=0,followStopped=false;
        try{
          publish('Preparing '+(index+1)+'/10');pendingFactory=createShadowFollowKeylock(context,{buffers:[buffer],position:2.4,rate:1.08,keylock:true,semitones:12,experimentalLeadSeconds:.04,signal:owner.signal,onEvent:event=>{if(report.events.length>=12000){runAbort.abort(Error('Adapter event bound exceeded'));return;}report.events.push({case:index,...event});}});active=await bounded(pendingFactory,'shadow owner preparation',15000);
          target=capture('shadow-'+index+'-'+spec.gesture+'-'+spec.region+'-audible');inner=capture('shadow-'+index+'-'+spec.gesture+'-'+spec.region+'-pre-gate');gate=context.createGain();gate.gain.value=0;active.outputs[0].connect(gate);gate.connect(target.bus);active.outputs[0].connect(inner.bus);
          for(const t of [target,inner]){await bounded(t.ready,'capture ready');t.preflight=await t.request('preflight');t.arm=await t.request('arm');}
          row.warm=await bounded(active.start({position:2.4,when:context.currentTime+.25}),'active muted warm');await Promise.all([reach(target,row.warm.when+.3),reach(inner,row.warm.when+.3)]);row.snapshots.push(active.snapshot());
          const warmInput=interval(inner,row.warm.when+.2,.1);row.preGateWarm=shadowSpectrum(warmInput.left,context.sampleRate);assert(row.preGateWarm.rms>.005&&Math.abs(row.preGateWarm.dominantHz-880)<=8.8,'Active muted owner lacks actual pre-gate shifted PCM');
          const holdStart=context.currentTime;row.holdStart=holdStart;
          async function pump(){if(pendingFollow||followStopped||!desired)return;const command=desired;sent=command.revision;const entry={...command,issuedWallMs:performance.now(),issuedContext:context.currentTime};row.follow.push(entry);pendingFollow=active.seek(command.position).then(ack=>{entry.ack=ack;entry.ackWallMs=performance.now();entry.ackContext=context.currentTime;}).catch(error=>{entry.error={name:error.name,message:error.message};}).finally(()=>{pendingFollow=null;if(!followStopped&&desired.revision>sent)void pump();});}
          const sample=()=>{const elapsed=context.currentTime-holdStart;desired={revision:++followRevision,sampledContext:context.currentTime,elapsed,position:shadowCursor(spec,Math.min(spec.seconds,elapsed))};void pump();};sample();followTimer=setInterval(sample,25);
          await reach(target,holdStart+spec.seconds);clearInterval(followTimer);followTimer=null;followStopped=true;
          const releaseTime=context.currentTime,endPosition=shadowCursor(spec,spec.seconds);row.releaseTime=releaseTime;row.releaseWallMs=performance.now();row.endPosition=endPosition;row.actualHoldSeconds=releaseTime-holdStart;row.pendingFollowAtRelease=!!pendingFollow;row.lastDesired=desired;row.beforeRelease=active.snapshot();
          gate.gain.cancelScheduledValues(releaseTime);gate.gain.setValueAtTime(0,releaseTime);gate.gain.linearRampToValueAtTime(1,releaseTime+.003);row.externalGate={issuedContext:context.currentTime,requestedStart:releaseTime,rampEnd:releaseTime+.003};
          const alignmentIssue=context.currentTime,predictedPosition=endPosition+1.08*(alignmentIssue+.04-releaseTime);row.alignment={issuedWallMs:performance.now(),issuedContext:alignmentIssue,predictedPosition,predictedOutput:alignmentIssue+.04};
          row.alignment.ack=await bounded(active.seek(predictedPosition),'release alignment');row.alignment.ackWallMs=performance.now();row.alignment.ackContext=context.currentTime;
          await reach(target,releaseTime+.65);const input=interval(target,releaseTime-.05,.7);row.observed=inspectShadowReturn({...input,sampleRate:context.sampleRate,releaseTime,endPosition,alignmentACK:row.alignment.ack});row.afterRelease=active.snapshot();
          const hold=interval(target,holdStart,releaseTime-holdStart);row.holdMute={left:shadowSpectrum(hold.left,context.sampleRate),right:shadowSpectrum(hold.right,context.sampleRate)};row.holdMute.passed=[row.holdMute.left,row.holdMute.right].every(m=>m.rms<1e-4&&m.peak<1e-4);
          row.processorGroupsCreated=report.events.filter(e=>e.case===index&&e.type==='preparing').length;row.overlap={pendingAtRelease:row.pendingFollowAtRelease,scheduledOutputTimes:row.follow.filter(f=>f.ack).map(f=>f.ack.when),alignmentOutput:row.alignment.ack.when,followErrors:row.follow.filter(f=>f.error).length};
          row.quickWithin50ms=spec.gesture==='quick'?row.actualHoldSeconds<=shadowReturnCriteria.quickMaximumSeconds:null;
          row.cursorOracleEstablished=report.oracleCalibration.passed;row.cursorConclusion=!row.cursorOracleEstablished?'oracle-not-established':!row.observed.cursor.confident?'ambiguous-correlation':row.observed.criteriaPassed.cursorWithin10msOfIdeal?'within-cursor-bound':'measured-position-error';
          row.passed=row.observed.passed&&row.processorGroupsCreated===1&&row.holdMute.passed&&row.quickWithin50ms!==false&&row.cursorOracleEstablished;publish('Measured '+(index+1)+'/10');
        }catch(error){row.error=error.message;row.errorName=error.name;}
        finally{
          clearInterval(followTimer);followTimer=null;followStopped=true;owner.abort();runAbort.signal.removeEventListener('abort',cancelOwner);
          if(gate){gate.gain.value=0;gate.disconnect();}
          for(const t of [target,inner])if(t){try{t.fence=await t.request('finish');const integrity=validateShadowCapture(t);row.captureIntegrityPassed=(row.captureIntegrityPassed??true)&&integrity.passed;if(!integrity.passed)row.passed=false;retain(t,integrity);}catch(error){row.passed=false;report.fatalErrors.push({phase:'case capture integrity',case:index,label:t.label,error:error.message});retain(t,{passed:false,errors:t.errors,preflight:t.preflight,arm:t.arm,fence:t.fence,rows:t.blocks.map(b=>({frame:b.frame,sequence:b.sequence,inputChannels:b.inputChannels,frames:b.channels[0].length}))});}t.node.disconnect();t.node.port.close();t.bus.disconnect();try{zero.disconnect(t.bus);}catch(error){report.cleanupErrors.push({phase:'zero-input route',error:error.message});}}target=null;inner=null;
          if(active)try{await bounded(active.dispose(),'case adapter cleanup',3000);}catch(error){report.cleanupErrors.push({case:index,error:error.message});}active=null;
          if(pendingFactory)pendingFactory.then(value=>value.dispose()).catch(()=>{});pendingFactory=null;publish('Case '+(index+1)+'/10 retained',true);
        }
      }
    }catch(error){report.fatalErrors.push({phase:'setup/run',error:error.message});}
    finally{
      cleanup=true;if(performance.now()>deadline)report.fatalErrors.push({phase:'run deadline',error:'90second cooperative run budget exceeded'});clearTimeout(wholeTimer);clearInterval(followTimer);owner?.abort();const cleanupEnd=performance.now()+8000;
      if(active){try{active.outputs.forEach(out=>out.disconnect());await bounded(active.dispose(),'final adapter disposal',Math.max(1,Math.min(2500,cleanupEnd-performance.now())));}catch(error){report.cleanupErrors.push({phase:'adapter',error:error.message});}}
      for(const t of [target,inner])if(t){try{t.node.disconnect();t.node.port.close();t.bus.disconnect();}catch(error){report.cleanupErrors.push({phase:'capture',error:error.message});}}
      try{zero?.stop();zero?.disconnect();safe?.disconnect();await bounded(context.close(),'context close',Math.max(1,Math.min(2000,cleanupEnd-performance.now())));}catch(error){report.cleanupErrors.push({phase:'context',error:error.message});try{await bounded(context.suspend(),'context suspend fallback',1000);}catch(failure){report.cleanupErrors.push({phase:'suspend',error:failure.message});}}
      report.completed=report.checks.length===10&&report.fatalErrors.length===0&&report.cleanupErrors.length===0;report.allCriteriaPassed=report.completed&&report.checks.every(c=>c.passed);report.durationMs=performance.now()-started;publish('Finished: '+report.checks.filter(c=>c.passed).length+'/10 pass; browser prototype experiment only',true);running=false;$('#run').disabled=false;
    }
  };
}
