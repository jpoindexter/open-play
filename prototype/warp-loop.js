const prepared=new WeakMap();
const aborted=()=>new DOMException('Warp-loop preparation superseded.','AbortError');
export async function createWarpLoopTransport(ctx,buffers,{signal,onError=()=>{}}={}){
 if(signal?.aborted)throw aborted();
 if(!prepared.has(ctx))prepared.set(ctx,ctx.audioWorklet.addModule(new URL('./warp-loop-worklet.js',import.meta.url)).catch(error=>{prepared.delete(ctx);throw error;}));
 await prepared.get(ctx);if(signal?.aborted)throw aborted();
 const node=new AudioWorkletNode(ctx,'open-play-warp-loop-v1',{numberOfInputs:0,numberOfOutputs:buffers.length,outputChannelCount:buffers.map(()=>2)}),pending=new Map();let sequence=0,disposed=false;
 const send=(type,data={},transfer=[])=>new Promise((resolve,reject)=>{if(disposed)return reject(aborted());const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('Warp-loop audio-thread acknowledgment timed out.'));},5000);pending.set(id,{resolve,reject,timer});node.port.postMessage({type,id,...data},transfer);});
 function dispose(){if(disposed)return;disposed=true;signal?.removeEventListener('abort',dispose);for(const p of pending.values()){clearTimeout(p.timer);p.reject(aborted());}pending.clear();node.port.postMessage({type:'dispose'});node.disconnect();node.port.close();}
 node.port.onmessage=({data})=>{const p=pending.get(data.id);if(p){clearTimeout(p.timer);pending.delete(data.id);data.error?p.reject(Object.assign(Error(data.error.message),{name:data.error.name})):p.resolve(data.result);}else if(data.error)onError(Object.assign(Error(data.error.message),{name:data.error.name}));};
 node.onprocessorerror=()=>onError(Error('Warp-loop audio processor stopped.'));
 signal?.addEventListener('abort',dispose,{once:true});
 try{
  const records=buffers.map(buffer=>({sampleRate:buffer.sampleRate,channels:Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c).slice())}));
  await send('load',{buffers:records},records.flatMap(b=>b.channels.map(c=>c.buffer)));if(signal?.aborted)throw aborted();
  return{node,outputs:buffers.map((_,i)=>({connect:destination=>node.connect(destination,i,0)})),start:options=>send('start',{options}),dispose};
 }catch(error){dispose();throw error;}
}
