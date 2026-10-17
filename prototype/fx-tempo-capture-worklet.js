// Test-only measurement sink. Captures actual input PCM and emits silent output.
class FXTempoCapture extends AudioWorkletProcessor{
 constructor(){super();this.capture=null;this.port.onmessage=event=>{const m=event.data;if(m.type==='capture'){this.capture={id:m.id,data:new Float32Array(m.frames),offset:0,startFrame:currentFrame};this.port.postMessage({type:'started',id:m.id,startFrame:currentFrame});}else if(m.type==='cancel')this.capture=null;};}
 process(inputs,outputs){for(const output of outputs)for(const channel of output)channel.fill(0);const capture=this.capture;if(capture){const input=inputs[0]?.[0],size=outputs[0]?.[0]?.length||128,count=Math.min(size,capture.data.length-capture.offset);if(input)capture.data.set(input.subarray(0,count),capture.offset);capture.offset+=count;if(capture.offset===capture.data.length){this.port.postMessage({type:'done',id:capture.id,startFrame:capture.startFrame,data:capture.data},[capture.data.buffer]);this.capture=null;}}return true;}
}
registerProcessor('open-play-fx-tempo-capture-test',FXTempoCapture);
