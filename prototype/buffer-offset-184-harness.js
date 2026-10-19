const $=s=>document.querySelector(s),sha=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');
const b64=b=>{let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(s);};
const files=['buffer-offset-184-harness.html','buffer-offset-184-harness.js','stem-activation-capture-145.js'];
async function identities(){return Object.fromEntries(await Promise.all(files.map(async f=>{const r=await fetch(f,{cache:'no-store'});if(!r.ok)throw Error(f);return[f,await sha(await r.arrayBuffer())];})));}
async function audio(buffer){return{sampleRate:buffer.sampleRate,frames:buffer.length,channels:await Promise.all([0,1].map(async c=>({channel:c,sha256:await sha(buffer.getChannelData(c).buffer),base64:b64(new Uint8Array(buffer.getChannelData(c).buffer))})))};}
$('#run').onclick=async()=>{
 $('#run').disabled=true;$('#status').textContent='Recording muted generated sequence';
 const r={checkpoint:150,diagnosticCheckpoint:184,samples:[],stages:[],errors:[],sourceBefore:await identities(),browser:{userAgent:navigator.userAgent,platform:navigator.platform},startedAt:new Date().toISOString()};let ctx,source;
 try{
  if(navigator.userAgentData)r.browser.highEntropy=await navigator.userAgentData.getHighEntropyValues(['fullVersionList','platformVersion','architecture']);
  ctx=new AudioContext();await ctx.resume();r.context={sampleRate:ctx.sampleRate,requestedSampleRate:null};
  await ctx.audioWorklet.addModule(new URL('./stem-activation-capture-145.js',import.meta.url));
  const input=ctx.createGain(),split=ctx.createChannelSplitter(2),mute=ctx.createGain();mute.gain.value=0;mute.connect(ctx.destination);input.connect(split);r.physicalMute=mute.gain.value;
  const witnesses=[];for(let c=0;c<2;c++){const w=new AudioWorkletNode(ctx,'open-play-stem-activation-145-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit',channelInterpretation:'discrete'});split.connect(w,c);w.connect(mute);witnesses.push(w);}
  const buffer=ctx.createBuffer(2,32768,ctx.sampleRate);for(let c=0;c<2;c++){const x=buffer.getChannelData(c);for(let i=0;i<x.length;i++)x[i]=c===0?Math.sin(i*.103)*.3+((i*17%997)/997-.5)*.2:Math.cos(i*.071)*.25+((i*31%991)/991-.5)*.2;}r.generatedPCM=await audio(buffer);r.generator='Float32 of c0=sin(i*.103)*.3+((i*17%997)/997-.5)*.2; c1=cos(i*.071)*.25+((i*31%991)/991-.5)*.2';
  for(const [name,offsetFrames,loop]of [['integer',4096,false],['fractional',4096+2/7,false],['fractional-loop',4096+2/7,true]]){
   source=ctx.createBufferSource();source.buffer=buffer;source.playbackRate.value=1;source.detune.value=0;source.loop=loop;source.loopStart=(4096+2/7)/ctx.sampleRate;source.loopEnd=(4610+1/7)/ctx.sampleRate;source.connect(input);
   const frame=(Math.ceil(ctx.currentTime*ctx.sampleRate/128)+20)*128,when=frame/ctx.sampleRate,offset=offsetFrames/ctx.sampleRate;
   const row={name,contextFrameBefore:Math.round(ctx.currentTime*ctx.sampleRate),startFrame:frame,when,offset,offsetFrames,playbackRate:source.playbackRate.value,detune:source.detune.value,loop:source.loop,loopStart:source.loopStart,loopEnd:source.loopEnd,bufferRate:buffer.sampleRate};r.stages.push(row);source.start(when,offset);
   row.pcm=await Promise.all(witnesses.map((w,channel)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Capture timed out')),10000);w.port.onmessage=async({data})=>{if(data.type==='done'){clearTimeout(timer);resolve({channel,startFrame:data.startFrame,frames:data.data.length,quanta:data.quanta,errors:data.errors,sha256:await sha(data.data.buffer),base64:b64(new Uint8Array(data.data.buffer))});}};w.port.postMessage({type:'capture',id:name,frames:Math.round(.3*ctx.sampleRate)});})));source.stop();source.disconnect();source=null;
  }
  for(const w of witnesses){w.disconnect();w.port.close();}r.workflowExecuted=true;
 }catch(e){r.errors.push({message:e.message,stack:e.stack});}
 finally{
  if(source)try{source.stop();}catch{};if(ctx)await ctx.close();r.sourceAfter=await identities();r.sourceStable=JSON.stringify(r.sourceBefore)===JSON.stringify(r.sourceAfter);r.workflowCompleted=!!r.workflowExecuted&&!r.errors.length&&r.sourceStable;
  const raw=JSON.stringify(r),id=crypto.randomUUID().replaceAll('-',''),response=await fetch('/api/test-evidence/stem-resource-150/'+id,{method:'POST',headers:{'Content-Type':'application/json','X-Open-Play':'local-prototype'},body:raw});const receipt=await response.json();if(!response.ok||receipt.sha256!==await sha(new TextEncoder().encode(raw)))throw Error('Original save failed');
  const summary={workflowCompleted:r.workflowCompleted,sourceStable:r.sourceStable,browser:r.browser,context:r.context,physicalMute:r.physicalMute,stages:r.stages.map(({pcm,...s})=>({...s,channels:pcm?.map(({base64,quanta,...p})=>({...p,quantumCount:quanta.length}))})),errors:r.errors,receipt};$('#original').textContent=JSON.stringify(summary);$('#results').textContent=JSON.stringify(summary,null,2);$('#status').textContent=r.workflowCompleted?'Recorded; independent numerical inspection pending':'Failed recording retained';
 }
};
