// One pending Start/Stop owns the master capture until its final data arrives.
export function createMixRecording(engine){
 let starting=null,stopping=null;
 function start(){
  if(starting)return starting;
  if(stopping)return Promise.reject(new Error('Wait for the current capture to finish before starting another.'));
  if(engine.recording)return Promise.resolve();
  starting=(async()=>{
   await engine.resume();
   const Recorder=window.MediaRecorder;
   if(!Recorder)throw new Error('This browser does not support mix recording.');
   const chunks=[],type=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>Recorder.isTypeSupported(t));
   const recorder=new Recorder(engine.destination.stream,type?{mimeType:type}:{});
   recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   recorder.start(250);
   engine.recorder=recorder;engine.chunks=chunks;engine.recording=true;engine.recordStarted=engine.ctx.currentTime;
  })();
  const pending=starting,clear=()=>{starting=null;};
  void pending.then(clear,clear);return pending;
 }
 function stop(){
  if(stopping)return stopping;
  if(starting)return starting.then(stop);
  if(!engine.recorder||!engine.recording)return Promise.resolve(null);
  const recorder=engine.recorder,chunks=engine.chunks;
  let resolve,reject;
  stopping=new Promise((success,failure)=>{resolve=success;reject=failure;});
  const pending=stopping;
  recorder.onstop=()=>{
   engine.recording=false;stopping=null;
   try{resolve(new Blob(chunks,{type:recorder.mimeType}));}catch(error){reject(error);}
  };
  try{recorder.stop();}catch(error){stopping=null;reject(error);}
  return pending;
 }
 return{start,stop};
}
