class PitchCapture extends AudioWorkletProcessor{
 constructor(){super();this.armed=false;this.sequence=0;this.frames=0;this.port.onmessage=({data})=>{if(data.type==='arm'){this.armed=true;this.sequence=this.frames=0;}if(data.type==='stop')this.armed=false;this.port.postMessage({type:data.type,id:data.id,frames:this.frames,blocks:this.sequence});};this.port.postMessage({type:'ready'});}
 process(inputs,outputs){for(const output of outputs)for(const c of output)c.fill(0);if(this.armed){const size=outputs[0][0].length,channels=Array.from({length:4},(_,c)=>{const src=inputs[c<2?0:1]?.[c%2];return src?src.slice():new Float32Array(size);});this.port.postMessage({type:'pcm',sequence:this.sequence++,frame:currentFrame,frames:size,channels},channels.map(c=>c.buffer));this.frames+=size;}return true;}
}
registerProcessor('open-play-pitch-isolation-capture',PitchCapture);
