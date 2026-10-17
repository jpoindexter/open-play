const preparations=new WeakMap();
const aborted=()=>new DOMException('Silent pull owner was canceled.','AbortError');
function waitForPreparation(promise,signal,timeoutMs){
  if(signal?.aborted)return Promise.reject(aborted());
  return new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(callback,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);callback(value);};
    const cancel=()=>finish(reject,aborted());
    const timer=setTimeout(()=>finish(reject,Object.assign(Error('Silent pull module preparation timed out.'),{name:'TimeoutError'})),timeoutMs);
    signal?.addEventListener('abort',cancel,{once:true});
    Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));
  });
}
export function prepareSilentAudioPull(context){
  if(!preparations.has(context)){
    const promise=context.audioWorklet.addModule(new URL('./silent-audio-pull-worklet.js',import.meta.url));
    preparations.set(context,promise);promise.catch(()=>{if(preparations.get(context)===promise)preparations.delete(context);});
  }
  return preparations.get(context);
}
export async function createSilentAudioPull(context,{outputs,signal,onEvent=()=>{},onError=()=>{},timeoutMs=2000}={}){
  if(!Array.isArray(outputs)||![1,5].includes(outputs.length)||outputs.some(o=>typeof o?.connect!=='function'))throw new TypeError('Silent pull needs one or five independent outputs.');
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<10||timeoutMs>60000)throw new RangeError('Silent pull timeout must be10..60000ms.');
  outputs=[...outputs];
  if(signal?.aborted)throw aborted();await waitForPreparation(prepareSilentAudioPull(context),signal,timeoutMs);if(signal?.aborted)throw aborted();
  const node=new AudioWorkletNode(context,'open-play-silent-audio-pull',{numberOfInputs:outputs.length,numberOfOutputs:1,outputChannelCount:[2],channelCount:8,channelCountMode:'max',channelInterpretation:'discrete'});
  let retired=false,disposePromise=null,last=null,readyResolve,readyReject,disposeResolve,disposeReject,readyTimer,disposeTimer;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  // Connections can fail before the factory reaches `await ready`. Observe the
  // same promise immediately, while preserving its rejection for that await.
  void ready.catch(()=>{});
  const emit=value=>{try{onEvent(value);}catch{}};
  const disconnect=()=>{for(const [index,output]of outputs.entries())try{output.disconnect(node,0,index);}catch{}try{node.disconnect();}catch{}};
  const detach=()=>{signal?.removeEventListener('abort',abort);clearTimeout(readyTimer);clearTimeout(disposeTimer);node.onprocessorerror=null;node.port.onmessage=null;node.port.close();};
  const dispose=()=>{
    if(disposePromise)return disposePromise;
    retired=true;disconnect();clearTimeout(readyTimer);readyReject(aborted());
    disposePromise=new Promise((resolve,reject)=>{disposeResolve=resolve;disposeReject=reject;disposeTimer=setTimeout(()=>{detach();reject(Object.assign(Error('Silent pull disposal timed out.'),{name:'TimeoutError'}));},timeoutMs);node.port.postMessage({type:'dispose',id:1});});
    return disposePromise;
  };
  const abort=()=>{void dispose().catch(error=>{try{onError(error);}catch{}});};
  node.port.onmessage=({data})=>{
    if(data.type==='ready'&&!retired){clearTimeout(readyTimer);readyResolve();}
    else if(data.type==='pulled'&&!retired){last=data;emit(data);}
    else if(data.type==='disposed'&&retired){detach();disposeResolve?.(data);}
  };
  node.onprocessorerror=()=>{
    const error=Error('Silent audio pull processor failed.');retired=true;last=null;disconnect();readyReject(error);
    if(disposePromise)disposeReject?.(error);
    else disposePromise=Promise.resolve({retired:true,processorFailed:true});
    detach();try{onError(error);}catch{}
  };
  readyTimer=setTimeout(()=>readyReject(Object.assign(Error('Silent pull readiness timed out.'),{name:'TimeoutError'})),timeoutMs);
  signal?.addEventListener('abort',abort,{once:true});
  try{
    outputs.forEach((output,index)=>output.connect(node,0,index));node.connect(context.destination);
    await ready;if(retired||signal?.aborted)throw aborted();
    return{node,dispose,snapshot:()=>({retired,lastPulled:last,sourceCount:outputs.length,outputPolicy:'Always zero; independent inputs are consumed only for silent DSP continuity.'})};
  }catch(error){await dispose().catch(()=>{});throw error;}
}
