// One transport per loaded deck source; reuse it for all gestures. Only source
// replacement copies PCM. This module never connects a route or starts audio.
const prepared=new WeakMap();
const abort=message=>new DOMException(message,'AbortError');
const ownInteger=(value,name,min=1,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(`${name} is out of range.`);return value;};
export function prepareDeckScratch(ctx){
  if(!prepared.has(ctx)){const promise=ctx.audioWorklet.addModule(new URL('./deck-scratch-worklet.js',import.meta.url)).catch(error=>{prepared.delete(ctx);throw error;});prepared.set(ctx,promise);}return prepared.get(ctx);
}
function abortable(task,signal){
  if(signal.aborted)return Promise.reject(abort('Scratch source load superseded or canceled.'));
  return new Promise((resolve,reject)=>{const canceled=()=>{cleanup();reject(abort('Scratch source load superseded or canceled.'));},cleanup=()=>signal.removeEventListener('abort',canceled);signal.addEventListener('abort',canceled,{once:true});Promise.resolve(task).then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});});
}
function sourceMetadata(source){
  if(!source||typeof source!=='object')throw new TypeError('PCM source required.');
  const {sampleRate}=source;if(typeof sampleRate!=='number'||!Number.isFinite(sampleRate)||sampleRate<=0||sampleRate>768000)throw new RangeError('Input sample rate is out of range.');
  const channels=Array.isArray(source.channels)?source.channels:Array.from({length:ownInteger(source.numberOfChannels,'Input channels',1,8)},(_,i)=>source.getChannelData(i));
  ownInteger(channels.length,'Input channels',1,8);const length=channels[0]?.length;ownInteger(length,'PCM frame length',1,0x7fffffff);
  if(channels.some(channel=>!(channel instanceof Float32Array)||channel.length!==length))throw new TypeError('PCM requires equal-length Float32Array channels.');
  return {sampleRate,length,channels};
}
export function createDeckScratchTransport(ctx,{outputChannels=2,rampMilliseconds=3,watchdogMilliseconds=120,maxPending=32,rpcTimeoutMilliseconds=5000,maxPCMBytes=512*1024*1024,chunkFrames=65536,yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0)),onState=()=>{},onError=()=>{}}={}){
  ownInteger(outputChannels,'Output channels',1,8);ownInteger(maxPending,'Pending RPC limit',1,1024);ownInteger(rpcTimeoutMilliseconds,'RPC timeout',10,60000);ownInteger(maxPCMBytes,'PCM memory budget',4,0x7fffffff);ownInteger(chunkFrames,'PCM copy chunk',1024,1048576);
  if(typeof rampMilliseconds!=='number'||!Number.isFinite(rampMilliseconds)||rampMilliseconds<0||rampMilliseconds>50||typeof watchdogMilliseconds!=='number'||!Number.isFinite(watchdogMilliseconds)||watchdogMilliseconds<10||watchdogMilliseconds>1000)throw new RangeError('Scratch timing policy out of range.');
  const node=new AudioWorkletNode(ctx,'open-play-deck-scratch-v1',{numberOfInputs:0,numberOfOutputs:5,outputChannelCount:Array(5).fill(outputChannels),processorOptions:{outputChannels,rampMilliseconds,watchdogMilliseconds}});
  let sequence=0,gestureSequence=0,highestRequestedGeneration=0,latest={generation:0,phase:'idle',position:0,audiblePosition:0,playing:false,audition:false,audioTime:ctx.currentTime},disposed=false,loadJob=null,activeGesture=null;
  const pending=new Map();
  const notify=(callback,value)=>{try{callback(value);}catch{}};
  function settlePending(error){for(const job of pending.values()){clearTimeout(job.timer);job.cleanup?.();job.reject(error);}pending.clear();}
  function terminal(error){if(disposed)return;disposed=true;if(loadJob)loadJob.cancel();loadJob=null;activeGesture=null;settlePending(error);latest={...latest,phase:'disposed',disposed:true,playing:false,audition:false,owner:null,gesture:0,sourceCount:0,position:0,audiblePosition:0,duration:0,velocity:0,hidden:null,loop:null};try{node.port.postMessage({type:'dispose'});}catch{}try{node.disconnect();}catch{}try{node.port.close();}catch{}}
  node.port.onmessage=({data})=>{
    if(disposed||!data||typeof data!=='object')return;
    const job=data.id?pending.get(data.id):null;
    if(data.id&&!job)return; // Late timed-out acknowledgements are not new state.
    if(job){clearTimeout(job.timer);job.cleanup?.();pending.delete(data.id);}
    if(data.state&&Number.isSafeInteger(data.state.generation)&&data.state.generation>=latest.generation){latest=data.state;gestureSequence=Math.max(gestureSequence,latest.lastGesture||0);notify(onState,state());}
    if(data.error){const error=new Error(data.error.message||'Scratch command failed.');error.name=data.error.name||'Error';job?.reject(error);notify(onError,error);}
    else job?.resolve(state());
  };
  node.onprocessorerror=()=>{const error=new Error('Ordinary scratch audio processor failed.');terminal(error);notify(onError,error);};
  function send(type,data={},transfer=[],signal=null,onPosted=()=>{}){
    if(disposed)return Promise.reject(abort('Scratch transport disposed.'));
    if(signal?.aborted)return Promise.reject(abort('Scratch RPC canceled.'));
    if(pending.size>=maxPending)return Promise.reject(new RangeError('Scratch RPC queue is full.'));
    return new Promise((resolve,reject)=>{
      const id=++sequence,job={resolve,reject,timer:null,cleanup:null};pending.set(id,job);
      if(signal){const canceled=()=>{if(!pending.has(id))return;pending.delete(id);clearTimeout(job.timer);job.cleanup();reject(abort('Scratch RPC canceled.'));};signal.addEventListener('abort',canceled,{once:true});job.cleanup=()=>signal.removeEventListener('abort',canceled);}
      job.timer=setTimeout(()=>{if(!pending.has(id))return;pending.delete(id);job.cleanup?.();const error=new Error('Scratch RPC timed out.');error.name='TimeoutError';reject(error);notify(onError,error);},rpcTimeoutMilliseconds);
      try{node.port.postMessage({...data,type,id},transfer);onPosted();}catch(error){clearTimeout(job.timer);job.cleanup?.();pending.delete(id);reject(error);}
    });
  }
  async function replaceBuffers({generation,original,stems=null,signal}={}){
    if(disposed)throw abort('Scratch transport disposed.');ownInteger(generation,'Load generation');
    if(generation<=highestRequestedGeneration)throw abort('Scratch source load superseded.');highestRequestedGeneration=generation;
    if(loadJob)loadJob.cancel();const job={generation,canceled:false,posted:false,controller:new AbortController()};loadJob=job;
    const canceled=()=>{if(job.canceled)return;job.canceled=true;job.controller.abort();if(job.posted){try{node.port.postMessage({type:'invalidate',generation});}catch{}if(latest.generation<=generation)latest={...latest,generation,phase:'empty',reason:'load-invalidated',playing:false,audition:false,owner:null,gesture:0,sourceCount:0,position:0,audiblePosition:0,duration:0,velocity:0,hidden:null,loop:null};}};job.cancel=canceled;signal?.addEventListener('abort',canceled,{once:true});
    const current=()=>{if(disposed||job.canceled||signal?.aborted||loadJob!==job)throw abort('Scratch source load superseded or canceled.');};
    try{
      current();const first=sourceMetadata(original);if(stems!==null&&(!Array.isArray(stems)||stems.length!==4))throw new RangeError('Provide all four aligned stems or none.');
      const others=stems?.map(sourceMetadata)||[],duration=first.length/first.sampleRate;
      if(others.length){const ref=others[0];if(others.some(s=>s.length!==ref.length||s.sampleRate!==ref.sampleRate||Math.abs(s.length/s.sampleRate-duration)>.1))throw new RangeError('Stem PCM is not aligned to the original.');}
      const records=[first,...others],bytes=records.reduce((sum,record)=>sum+record.length*record.channels.length*4,0);
      if(!Number.isSafeInteger(bytes)||bytes>maxPCMBytes)throw new RangeError(`Scratch PCM exceeds configured ${maxPCMBytes}-byte memory budget.`);
      const copies=[];
      for(const record of records){const channels=[];for(const source of record.channels){const copy=new Float32Array(record.length);for(let start=0;start<record.length;start+=chunkFrames){current();const end=Math.min(record.length,start+chunkFrames);for(let i=start;i<end;i++){const value=source[i];if(!Number.isFinite(value))throw new TypeError('Scratch PCM contains a nonfinite sample.');copy[i]=value;}if(end<record.length)await abortable(yieldTask(),job.controller.signal);}channels.push(copy);}copies.push({sampleRate:record.sampleRate,channels});}
      current();activeGesture=null;const result=await send('buffers',{generation,original:copies[0],stems:others.length?copies.slice(1):null},copies.flatMap(record=>record.channels.map(channel=>channel.buffer)),job.controller.signal,()=>{job.posted=true;});current();return result;
    }catch(error){job.cancel();throw error;}finally{signal?.removeEventListener('abort',canceled);if(loadJob===job)loadJob=null;}
  }
  function command(type,data={}){
    if(type==='dispose'){terminal(abort('Scratch transport disposed.'));return Promise.resolve(state());}
    if(disposed)return Promise.reject(abort('Scratch transport disposed.'));
    const payload={...data};
    if(type==='begin'){
      if(payload.gesture===undefined)payload.gesture=++gestureSequence;
      else if(Number.isSafeInteger(payload.gesture))gestureSequence=Math.max(gestureSequence,payload.gesture);
      activeGesture={generation:payload.generation,owner:payload.owner,gesture:payload.gesture};
    }else if(['scratch','end'].includes(type)&&payload.gesture===undefined&&activeGesture?.generation===payload.generation&&activeGesture?.owner===payload.owner)payload.gesture=activeGesture.gesture;
    if(['configure','play','pause','seek','rate','reverse','loop','slip','cancel'].includes(type))activeGesture=null;
    return send(type,payload);
  }
  function state(){return {...latest,loop:latest.loop&&{...latest.loop},hidden:latest.hidden&&{...latest.hidden,loop:latest.hidden.loop&&{...latest.hidden.loop}},loadingGeneration:loadJob?.generation??null,disposed};}
  return {node,command,replaceBuffers,state,diagnostics:()=>({pending:pending.size,maxPending,highestRequestedGeneration,loadingGeneration:loadJob?.generation??null,disposed,maxPCMBytes}),dispose:()=>terminal(abort('Scratch transport disposed.'))};
}
