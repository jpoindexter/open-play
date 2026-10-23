// Stage transferable PCM in bounded tasks; playback may acquire channel views between tasks.
const chunkFrames=1024*1024/Float32Array.BYTES_PER_ELEMENT;
export async function copyAnalysisInput(buffer,signal){
 const check=()=>{if(signal?.aborted)throw new DOMException('Analysis cancelled','AbortError');};
 check();const channels=[];
 for(let channel=0;channel<buffer.numberOfChannels;channel++){
  const copy=new Float32Array(buffer.length);
  for(let start=0;start<buffer.length;start+=chunkFrames){
   check();const end=Math.min(buffer.length,start+chunkFrames);
   buffer.copyFromChannel(copy.subarray(start,end),channel,start);
   if(end<buffer.length||channel+1<buffer.numberOfChannels)await new Promise(resolve=>setTimeout(resolve,0));
  }
  channels.push(copy);
 }
 check();return channels;
}
