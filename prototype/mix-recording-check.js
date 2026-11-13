const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw Error(message);};
async function until(check,label){
 const end=performance.now()+4000;
 while(!check()){assert(performance.now()<end,label+' timed out');await sleep(10);}
}

// Actual recording buttons and native codec; generated, physically muted workspace only.
export async function runMixRecordingCheck({state,engine}){
 const report={completed:false,scope:'Actual generated-only workspace and native MediaRecorder. No listening, hardware, file-save or interrupted-recording recovery claim.'};
 const NativeRecorder=window.MediaRecorder,recorders=[];
 const click=selector=>{const button=document.querySelector(selector);assert(button,'Missing '+selector);button.click();};
 let controls=[],previews=[],admitted=false;
 try{
  assert(state.tracks.every(track=>track.demo),'Use an isolated generated-only workspace');
  assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued),'Stop all decks first');
  assert(!engine.recording,'Stop existing recording first');admitted=true;
  engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();
  await until(()=>!state.analysis,'Startup analysis');
  window.MediaRecorder=class extends NativeRecorder{constructor(...args){super(...args);recorders.push(this);}};
  click('[data-panel="recording"]');
  controls=[...document.querySelectorAll('.deck button,.channel-strip input,#crossfader')];
  previews=[...document.querySelectorAll('.library-wave-preview img')];
  click('#record-toggle');click('#record-toggle');
  await until(()=>engine.recording,'Recording start');await sleep(40);
  report.nativeRecordersAfterRapidStart=recorders.length;
  assert(recorders.length===1,'Rapid Start created '+recorders.length+' native recorders');
  await sleep(300);click('#record-toggle');click('#record-toggle');
  await until(()=>!engine.recording&&!!state.recordBlob,'Repeated Stop finalization');
  const first=state.recordBlob;
  assert(first.size>0,'Completed capture is empty');
  const decoded=await engine.ctx.decodeAudioData(await first.arrayBuffer());
  assert(decoded.duration>.2&&decoded.numberOfChannels===2,'Capture duration/stereo channels missing');
  for(let channel=0;channel<2;channel++)assert(decoded.getChannelData(channel).every(Number.isFinite),'Nonfinite recording');
  report.firstCapture={bytes:first.size,type:first.type,duration:decoded.duration,channels:decoded.numberOfChannels};
  click('#record-toggle');await until(()=>engine.recording,'Subsequent start');await sleep(300);
  click('#record-toggle');await until(()=>!engine.recording&&state.recordBlob!==first,'Subsequent Stop');
  assert(state.recordBlob.size>0,'Next capture is empty');assert(first.size===report.firstCapture.bytes,'Old capture changed');
  report.nativeRecordersTotal=recorders.length;
  report.controls={observed:controls.length,retained:controls.filter(node=>node.isConnected).length};
  report.previews={observed:previews.length,retained:previews.filter(node=>node.isConnected).length};
  assert(controls.length>0&&report.controls.retained===controls.length,'Recording replaced core controls');
  assert(previews.length>0&&report.previews.retained===previews.length,'Recording replaced library previews');
  report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message};}
 finally{
  // Retire every observed recorder, including leaked baseline instances.
  for(const recorder of recorders)if(recorder.state!=='inactive'){
   await new Promise(resolve=>{recorder.addEventListener('stop',resolve,{once:true});recorder.stop();});
  }
  window.MediaRecorder=NativeRecorder;
  if(admitted){engine.recording=false;engine.audioMonitor?.mutePhysical(true);}
  report.allStopped=state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued);
  report.physicalMuted=!!engine.audioMonitor?.snapshot().physicalMuted;
  report.nativeRecorderRestored=window.MediaRecorder===NativeRecorder;
  report.completed=report.completed&&report.allStopped&&report.physicalMuted&&report.nativeRecorderRestored;
 }
 return report;
}
