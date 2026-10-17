import createNode,{soundTouchFactoryDiagnostics} from '/experiments/keylock-soundtouch/node-factory.mjs';
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
$('#run').onclick=async()=>{
 $('#run').disabled=true;const report={startedAt:new Date().toISOString(),completed:false,cases:[],fatalErrors:[],full_parity_verified:false};
 try{
  report.plan=await(await fetch('/plan.json')).json();report.servedSources=await(await fetch('/sources.json')).json();
  for(const spec of report.plan.cases){
   const row={...spec,errors:[],nodeEvents:[],cycles:[],criteriaPassed:false};report.cases.push(row);const blocks=[];let ctx,collector,request,osc,safe;const live=new Set();
   try{
    $('#status').textContent='Running '+spec.id;
    ctx=new AudioContext({sampleRate:spec.sampleRate});await ctx.resume();assert(ctx.sampleRate===spec.sampleRate,'Sample rate changed');
    await ctx.audioWorklet.addModule('/experiments/keylock-soundtouch/counter-capture.mjs');await ctx.audioWorklet.addModule('/experiments/keylock-soundtouch/bare-clock-worklet.mjs');
    collector=new AudioWorkletNode(ctx,'open-play-soundtouch-counter-capture',{numberOfInputs:2,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit',processorOptions:{sources:1}});
    request=rpc(collector,data=>{if(data.type==='pcm'){assert(blocks.length<20000,'Capture bound exceeded');blocks.push(data);}});
    safe=ctx.createGain();safe.gain.value=0;collector.connect(safe);safe.connect(ctx.destination);
    osc=ctx.createOscillator();osc.frequency.value=307;const control=ctx.createGain();control.gain.value=.04;osc.connect(control);control.connect(collector,0,1);osc.start();
    const anchor=Math.ceil((ctx.currentTime+1)*ctx.sampleRate/128)*128,end=anchor+ctx.sampleRate*30;row.frameTagSchedule={startFrame:anchor,endFrame:end,issuedAtFrame:ctx.currentTime*ctx.sampleRate};
    collector.parameters.get('frameTag').setValueAtTime(anchor,anchor/ctx.sampleRate);collector.parameters.get('frameTag').linearRampToValueAtTime(end,end/ctx.sampleRate);
    const deadline=performance.now()+5000;while(ctx.currentTime*ctx.sampleRate<anchor+256){await wait(10);assert(performance.now()<deadline,'Clock anchor timeout');}row.arm=await request('arm');
    async function bare(){
     const node=new AudioWorkletNode(ctx,'open-play-bare-clock-probe',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});let readyResolve,disposeResolve;
     const ready=new Promise(r=>readyResolve=r);node.port.onmessage=({data})=>{row.nodeEvents.push(data);if(data.type==='ready')readyResolve(data);if(data.type==='disposed')disposeResolve?.(data);};node.connect(collector,0,0);
     node.dispose=()=>bounded(new Promise(resolve=>{disposeResolve=resolve;node.port.postMessage({type:'dispose'});}), 'bare dispose').finally(()=>{node.disconnect();node.port.close();});await bounded(ready,'bare ready');return node;
    }
    for(let cycle=0;cycle<report.plan.cycles;cycle++){
     const item={cycle,before:ctx.currentTime,nodes:[]};row.cycles.push(item);
     for(let n=0;n<report.plan.nodes_per_cycle;n++){try{const node=spec.kind==='bare'?await bare():await createNode(ctx,{outputChannelCount:[2]},{durationFrames:ctx.sampleRate,onError:e=>row.nodeEvents.push({type:'factory-error',name:e.name,message:e.message,diagnostic:e.diagnostic})});if(spec.kind!=='bare')node.connect(collector,0,0);item.nodes.push(node);live.add(node);}catch(e){row.errors.push({name:e.name,message:e.message,diagnostic:e.diagnostic});}}
     await wait(report.plan.hold_ms);item.beforeDisposal=ctx.currentTime;item.disposals=await Promise.allSettled(item.nodes.map(node=>node.dispose()));item.nodes.forEach(n=>live.delete(n));item.nodes=item.nodes.length;item.after=ctx.currentTime;
    }
    row.factoryDiagnostics=soundTouchFactoryDiagnostics(ctx);row.stop=await request('stop');
   }catch(e){row.errors.push({name:e.name,message:e.message,stack:e.stack,diagnostic:e.diagnostic});}
   finally{
    if(request)try{row.stop??=await request('stop');}catch(e){row.errors.push({message:e.message});}
    if(blocks.length){const frames=blocks.length*128,data=new Float32Array(frames*4);let nonfinite=0,contiguous=true,maxFrameTagError=0;row.blocks=[];
     for(let b=0;b<blocks.length;b++){const item=blocks[b];row.blocks.push({sequence:item.sequence,frame:item.frame,globalFrame:item.globalFrame,globalTime:item.globalTime,frameSource:item.frameSource,frames:item.frames});if(item.sequence!==b||item.frames!==128||b&&item.frame!==blocks[b-1].frame+128)contiguous=false;for(let i=0;i<128;i++){maxFrameTagError=Math.max(maxFrameTagError,Math.abs(item.channels[3][i]-(item.frame+i)));for(let c=0;c<4;c++){const v=item.channels[c][i];if(!Number.isFinite(v))nonfinite++;data[(b*128+i)*4+c]=v;}}}
     row.capture={frames,channels:4,firstFrame:blocks[0].frame,sampleRate:ctx.sampleRate,nonfinite,contiguous,maxFrameTagError,sha256:await digest(data.buffer)};row.capture.retained=await post('/raw/'+spec.id,data.buffer,'application/octet-stream');
     row.control=stats(data,0,frames,2,4,ctx.sampleRate);row.source=[0,1].map(c=>stats(data,0,frames,c,4,ctx.sampleRate));
    }
    await Promise.allSettled([...live].map(n=>n.dispose()));osc?.stop();collector?.disconnect();safe?.disconnect();await ctx?.close();
   }
   const c=row.capture;row.criteriaPassed=!row.errors.length&&row.cycles.length===report.plan.cycles&&c?.nonfinite===0&&c?.contiguous&&c?.maxFrameTagError<=.25&&Math.abs(row.control.hz-307)<=.01&&row.source.every(s=>s.peak===0)&&!row.nodeEvents.some(e=>e.type==='factory-error');
   $('#result').textContent=JSON.stringify(report.cases.map(c=>({id:c.id,passed:c.criteriaPassed,errors:c.errors,frames:c.capture?.frames,contiguous:c.capture?.contiguous,tagError:c.capture?.maxFrameTagError,nodeClockErrors:c.nodeEvents.filter(e=>e.type==='clock-anomaly'||e.type==='factory-error').length})),null,2);
  }
  report.completed=true;
 }catch(e){report.fatalErrors.push({name:e.name,message:e.message,stack:e.stack});}
 report.acceptedCases=report.cases.filter(c=>c.criteriaPassed).length;await post('/report',JSON.stringify(report,null,2),'application/json');$('#status').textContent='Finished '+report.acceptedCases+'/'+report.cases.length+' probe cases; does not establish app parity.';
};
