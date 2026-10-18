// Scoped activation witness: retain every frame, hash outside the audio thread.
class StemActivationCapture extends AudioWorkletProcessor {
 constructor(){super();this.capture=null;this.port.onmessage=({data})=>{if(data.type==='capture')this.capture={id:data.id,data:new Float32Array(data.frames),offset:0,startFrame:null,quanta:[],errors:[]};else if(data.type==='cancel')this.capture=null;};}
 process(inputs,outputs){
  for(const output of outputs)for(const channel of output)channel.fill(0);
  const capture=this.capture;if(capture){
   const input=inputs[0]?.[0],size=outputs[0]?.[0]?.length||128,count=Math.min(size,capture.data.length-capture.offset);
   if(capture.startFrame===null)capture.startFrame=currentFrame;
   if(currentFrame!==capture.startFrame+capture.offset)capture.errors.push({expected:capture.startFrame+capture.offset,actual:currentFrame});
   if(!input)capture.errors.push({frame:currentFrame,inputMissing:true});
   if(input)capture.data.set(input.subarray(0,count),capture.offset);
   capture.quanta.push({frame:currentFrame,count});capture.offset+=count;
   if(capture.offset===capture.data.length){this.port.postMessage({type:'done',...capture},[capture.data.buffer]);this.capture=null;}
  }
  return true;
 }
}
registerProcessor('open-play-stem-activation-145-test',StemActivationCapture);
