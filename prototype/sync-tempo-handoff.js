// Two audio-time barriers: all voices prepared, then all future starts armed.
// A failure rejects the group before retiring any currently audible voice.
export function createSyncTempoHandoff(context,ids,{timeoutMs=15000}={}){
 const members=new Set(ids),watched=new Map(),ready=new Map(),armed=new Set();let error=null,when=null,readyResolve,readyReject,armedResolve,armedReject,failureReject;
 const readiness=new Promise((a,b)=>{readyResolve=a;readyReject=b;}),arming=new Promise((a,b)=>{armedResolve=a;armedReject=b;}),failure=new Promise((_,reject)=>failureReject=reject);void readiness.catch(()=>{});void arming.catch(()=>{});void failure.catch(()=>{});
 const timer=setTimeout(()=>fail(Error('Synced tempo preparation timed out; previous audio retained.')),timeoutMs);
 function fail(reason){if(error)return;error=reason;readyReject(error);armedReject(error);failureReject(error);for(const entry of watched.values())entry.controller.abort();clearTimeout(timer);}
 function watch(id,controller,generation){
  if(!members.has(id))throw Error('Unexpected synced tempo member.');
  const listener=()=>fail(new DOMException('Synced tempo preparation superseded.','AbortError'));watched.set(id,{controller,generation,listener});controller.signal.addEventListener('abort',listener,{once:true});if(error)controller.abort();
 }
 async function prepared(id,earliest){
  if(error)throw error;if(!members.has(id)||ready.has(id)||!Number.isFinite(earliest))throw Error('Invalid synced tempo readiness.');
  ready.set(id,earliest);
  if(ready.size===members.size){when=Math.max(context.currentTime+.1,...ready.values());readyResolve(when);}
  return readiness;
 }
 async function arm(id){
  if(error)throw error;if(when===null||!members.has(id)||armed.has(id))throw Error('Invalid synced tempo arming.');
  armed.add(id);if(armed.size===members.size){if(context.currentTime>=when-.005){fail(Error('Synced tempo start missed its lead; previous audio retained.'));}else{clearTimeout(timer);armedResolve(when);}}
  return arming;
 }
 function detach(){for(const entry of watched.values())entry.controller.signal.removeEventListener('abort',entry.listener);}
 function finish(){detach();clearTimeout(timer);if(error)throw error;if(armed.size!==members.size)throw Error('Synced tempo group did not arm.');}
 function dispose(){detach();clearTimeout(timer);}
 return{watch,prepared,arm,fail,failure,finish,dispose,owns:id=>watched.get(id)?.generation(),controller:id=>watched.get(id)?.controller};
}
