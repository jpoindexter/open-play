// Explicit output selection; no automatic restoration of a multi-channel cue route.
export function createAudioOutputSelection(engine,{devices=globalThis.navigator?.mediaDevices,onChange=()=>{}}={}){
 let selected='',label='System default',outputs=[],discovery=null,pending=null,revision=0,serial=Promise.resolve(),disposed=false,lastError=null;
 const emit=()=>{try{onChange(snapshot());}catch{}};
 const current=token=>!disposed&&token===revision;
 const snapshot=()=>({deviceId:selected,label,outputs:outputs.map(x=>({...x})),discovery:discovery?{...discovery}:null,pending:pending?{label:pending.label,phase:pending.phase}:null,canSelect:typeof engine.ctx?.setSinkId==='function',routing:engine.audioMonitor?.snapshot()||null,lastError,disposed});
 async function list(){if(disposed)throw Error('Output selection closed.');if(!devices?.enumerateDevices)throw Object.assign(Error('This runtime cannot enumerate audio outputs.'),{name:'NotSupportedError'});const found=await devices.enumerateDevices();if(disposed)return[];outputs=found.filter(x=>x.kind==='audiooutput'&&x.deviceId).map((x,i)=>({deviceId:x.deviceId,label:x.label||`Audio output${i+1}`}));discovery={returnedDevices:found.length,audioOutputs:found.filter(x=>x.kind==='audiooutput').length,addressableOutputs:outputs.length,namedOutputs:outputs.filter(x=>x.label&&!/^Audio output\d+$/.test(x.label)).length,documentVisibility:globalThis.document?.visibilityState||'unknown'};emit();return outputs.map(x=>({...x}));}
 const enqueue=run=>{const token=++revision;const result=serial.catch(()=>{}).then(()=>{if(!current(token))return false;return run(token);});serial=result;return result;};
 function select(deviceId=''){
  if(typeof deviceId!=='string')return Promise.reject(new TypeError('Output device ID must be text.'));
  return enqueue(async token=>{
   engine.init();if(typeof engine.ctx.setSinkId!=='function')throw Object.assign(Error('This runtime cannot select an audio output. System default playback remains available.'),{name:'NotSupportedError'});
   const old=String(engine.ctx.sinkId||'');engine.audioMonitor.mutePhysical(true);lastError=null;
   pending={token,label:outputs.find(x=>x.deviceId===deviceId)?.label||(!deviceId?'System default':'selected output'),phase:'switching'};
   try{
    emit();
    await engine.ctx.setSinkId(deviceId);
    if(disposed)return false;
    // A native sink switch already happened even if a newer request is queued.
    // Commit its observed identity while keeping it muted for the newer owner.
    selected=String(engine.ctx.sinkId||'');label=outputs.find(x=>x.deviceId===selected)?.label||(!selected?'System default':'Selected audio output');
    engine.audioMonitor.connectPhysical('stereo');
    if(!current(token)){emit();return false;}
    engine.audioMonitor.mutePhysical(false);pending=null;emit();return snapshot();
   }catch(error){
    if(current(token)){
     lastError=error.message;
     // A rejected selection may retain the previous sink. Restore master-only
     // only when that identity is still confirmed; never reopen quad blindly.
     const retained=String(engine.ctx.sinkId||'')===old;
     let available=!old;try{if(old)available=(await list()).some(x=>x.deviceId===old);}catch{}
     if(current(token)&&retained&&available){engine.audioMonitor.connectPhysical('stereo');engine.audioMonitor.mutePhysical(false);}
     emit();
    }throw error;
   }finally{if(pending?.token===token){pending=null;if(!disposed)emit();}}
  });
 }
 function route(layout,{masterStart=0,cueStart=2}={}){
  return enqueue(async token=>{engine.init();if(!current(token))return false;
   if(layout==='four-channel'&&(!selected||selected==='default'))throw Object.assign(Error('Select a specific four-channel output before routing cue to3/4.'),{name:'InvalidStateError'});
   if(selected){
    if(String(engine.ctx.sinkId||'')!==selected)engine.audioMonitor.mutePhysical(true);
    let found;try{found=await list();}catch(error){if(current(token)){engine.audioMonitor.mutePhysical(true);lastError=error.message;emit();}throw error;}
    if(!current(token))return false;
    if(String(engine.ctx.sinkId||'')!==selected||!found.some(x=>x.deviceId===selected)){engine.audioMonitor.mutePhysical(true);throw Object.assign(Error('Selected output is unavailable. Choose an output to resume.'),{name:'NotFoundError'});}
   }
   const result=engine.audioMonitor.connectPhysical(layout,{masterStart,cueStart});engine.audioMonitor.mutePhysical(false);lastError=null;emit();return result;
  });
 }
 async function deviceChange(){
  if(disposed||!engine.audioMonitor||!selected)return;
  engine.audioMonitor.mutePhysical(true);
  return enqueue(async token=>{
   try{const found=await list();if(!current(token))return;if(found.some(x=>x.deviceId===selected)&&String(engine.ctx.sinkId||'')===selected){engine.audioMonitor.mutePhysical(false);}else{lastError='Selected output disconnected or changed. Audio is muted; choose an output to resume.';}emit();}
   catch(error){if(current(token)){lastError=error.message;emit();}}
  });
 }
 devices?.addEventListener?.('devicechange',deviceChange);
 return{list,select,route,snapshot,dispose(){if(disposed)return;disposed=true;revision++;devices?.removeEventListener?.('devicechange',deviceChange);}};
}
