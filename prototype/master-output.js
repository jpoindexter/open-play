import {decibels,masterHeadroomDB} from './master-output-kernel.js';
const preparations=new WeakMap();
export function createMasterOutput(context,{onError=()=>{}}={}){
 const input=context.createGain(),output=context.createGain();
 let node=null,last={frames:0,peak:[0,0],rms:[0,0],outputPeak:[0,0],gainReductionDB:0,invalid:0,at:0},heldPeak=0,peakUntil=0,limitUntil=0,ready=false;
 if(!preparations.has(context))preparations.set(context,context.audioWorklet.addModule(new URL('./master-output-worklet.js',import.meta.url)));
 const prepared=preparations.get(context).then(()=>{
  node=new AudioWorkletNode(context,'open-play-master-output',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit',channelInterpretation:'speakers'});
  node.onprocessorerror=()=>{const error=Error('Master output processor failed.');ready=false;output.gain.value=0;onError(error);};
  node.port.onmessage=({data})=>{
   if(data.type==='ready'){ready=true;}
   if(data.type==='meter'){last=data;const peak=Math.max(...data.peak);if(peak>=heldPeak||data.at>=peakUntil){heldPeak=peak;peakUntil=data.at+.3;}if(data.gainReductionDB>.01)limitUntil=data.at+.75;}
  };
  input.connect(node);node.connect(output);
 });
 prepared.catch(error=>{ready=false;output.gain.value=0;onError(error);});
 return{input,output,ready:prepared,snapshot(){const live=context.currentTime;if(live>peakUntil)heldPeak=Math.max(...last.peak);return{...last,peak:[...last.peak],rms:[...last.rms],outputPeak:[...last.outputPeak],ready,displayDB:decibels(heldPeak),limiting:ready&&live<limitUntil,headroomDB:masterHeadroomDB};}};
}
