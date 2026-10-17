import createNode,{soundTouchFactoryDiagnostics} from '/experiments/keylock-soundtouch/node-factory.mjs';
const $=s=>document.querySelector(s),wait=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
$('#run').onclick=async()=>{
 $('#run').disabled=true;const report={startedAt:new Date().toISOString(),cases:[],unhandledRejections:[],fatalErrors:[],completed:false,full_parity_verified:false};
 const unhandled=event=>report.unhandledRejections.push({name:event.reason?.name,message:event.reason?.message});window.addEventListener('unhandledrejection',unhandled);
 try{
  report.plan=await(await fetch('/plan.json')).json();report.servedSources=await(await fetch('/sources.json')).json();
  for(const spec of report.plan.cases){
   const row={...spec,errors:[],passed:false};report.cases.push(row);let context,node,original;
   try{
    $('#status').textContent='Testing actual preparation cleanup '+spec.sampleRate;
    context=new AudioContext({sampleRate:spec.sampleRate});await context.resume();assert(context.sampleRate===spec.sampleRate,'Unexpected context sample rate');
    original=context.createBuffer;let delayed=false;context.createBuffer=function(...args){const result=Reflect.apply(original,this,args);if(!delayed){delayed=true;const until=performance.now()+80;while(performance.now()<until){/* Deliberately expire the already selected future anchor. */}}return result;};
    try{await createNode(context,{outputChannelCount:[2]},{durationFrames:context.sampleRate});throw Error('Expected allocation expiry did not reject');}catch(error){row.expectedFailure={name:error.name,message:error.message};assert(error.name==='LateScheduleError','Wrong preparation failure');}finally{context.createBuffer=original;}
    const failure=soundTouchFactoryDiagnostics(context).find(e=>e.type==='preparation-failed');row.failureDiagnostics=failure;
    assert(failure?.cleanupError===null&&failure.processorRelease?.disposed&&failure.processorRelease.beforeInitialization&&failure.processorRelease.retainedPCMBytes===0,'Actual pre-initialization release ACK missing');
    assert(failure.processorRelease.phaseControl?.created===false,'Expired clock unexpectedly created source');
    const errors=[];node=await createNode(context,{outputChannelCount:[2]},{durationFrames:context.sampleRate,onError:error=>errors.push({name:error.name,message:error.message})});
    for(let part=0;part<2;part++){const chunk=[new Float32Array(context.sampleRate/2).fill(.25),new Float32Array(context.sampleRate/2).fill(.25)];await node.addBuffers(chunk,chunk.map(c=>c.buffer));}
    row.started=await node.schedule({active:true,input:0,output:context.currentTime+.2,rate:1.08,semitones:2});await wait(300);row.recovered=await node.snapshot();
    assert(!errors.length&&row.started.ready&&row.recovered.transport.state.playing&&row.recovered.transport.epochs.length>0,'Real DSP did not recover');
    row.disposed=await node.dispose();assert(row.disposed.store.retainedPCMBytes===0&&row.disposed.transport.epochs.length===0&&row.disposed.phaseControl.disposed,'Recovered node release missing');
    row.diagnostics=soundTouchFactoryDiagnostics(context);row.passed=true;
   }catch(error){row.errors.push({name:error.name,message:error.message,stack:error.stack});}
   finally{if(context&&original)context.createBuffer=original;if(node)await node.dispose().catch(error=>row.errors.push({message:error.message}));await context?.close();}
   row.passed=row.passed&&!row.errors.length;$('#result').textContent=JSON.stringify(report.cases.map(c=>({sampleRate:c.sampleRate,passed:c.passed,expectedFailure:c.expectedFailure,retirementACK:c.failureDiagnostics?.processorRelease,recovery:c.recovered?.transport.state.playing,errors:c.errors})),null,2);
  }
  await wait(20);report.completed=true;
 }catch(error){report.fatalErrors.push({name:error.name,message:error.message,stack:error.stack});}
 window.removeEventListener('unhandledrejection',unhandled);report.acceptedCases=report.cases.filter(c=>c.passed).length;report.finishedAt=new Date().toISOString();report.criteriaPassed=report.completed&&report.acceptedCases===report.plan.cases.length&&!report.unhandledRejections.length&&!report.fatalErrors.length;
 const saved=await fetch('/report',{method:'POST',headers:{'Content-Type':'application/json','X-Open-Play-Test':'soundtouch-engine'},body:JSON.stringify(report,null,2)});assert(saved.ok,'Could not save new report');$('#status').textContent='Finished '+report.acceptedCases+'/'+report.cases.length+' cleanup cases; unhandled rejections '+report.unhandledRejections.length+'.';
};
