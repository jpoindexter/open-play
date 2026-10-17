// Test-only finite silent sink. Retain ALL armed process rows and all input PCM;
// reject discontinuity in the main harness, never remove a gappy armed interval.
class DeckScratchCapture extends AudioWorkletProcessor{
  constructor(){super();this.preflight=null;this.capture=null;this.stopped=false;this.port.onmessage=({data:m})=>{
    if(m.type==='stop'){this.stopped=true;this.preflight=this.capture=null;return;}
    if(m.type==='preflight'){this.preflight={id:m.id,rows:[]};return;}
    if(m.type==='capture'){
      if(this.capture||!Number.isSafeInteger(m.frames)||m.frames<1||m.frames>sampleRate*2){this.port.postMessage({type:'error',id:m.id,error:'Invalid or overlapping finite capture.'});return;}
      this.capture={id:m.id,frames:m.frames,offset:0,startFrame:null,rows:[],inputs:Array.from({length:7},()=>[new Float32Array(m.frames),new Float32Array(m.frames)])};
    }
  };}
  process(inputs,outputs){
    for(const output of outputs)for(const channel of output)channel.fill(0);if(this.stopped)return false;
    const size=outputs[0]?.[0]?.length||128,row={frame:currentFrame,size,inputChannels:inputs.map(i=>i.length),inputFrames:inputs.map(i=>i[0]?.length||0)};
    if(this.preflight){this.preflight.rows.push(row);if(this.preflight.rows.length===64){this.port.postMessage({type:'preflight',id:this.preflight.id,rows:this.preflight.rows,endFrame:currentFrame+size});this.preflight=null;}}
    const c=this.capture;if(c){
      if(c.startFrame===null){c.startFrame=currentFrame;this.port.postMessage({type:'started',id:c.id,startFrame:currentFrame});}
      c.rows.push(row);const count=Math.min(size,c.frames-c.offset);
      for(let i=0;i<7;i++)for(let channel=0;channel<2;channel++){const samples=inputs[i]?.[channel];if(samples)c.inputs[i][channel].set(samples.subarray(0,count),c.offset);}
      c.offset+=count;if(c.offset===c.frames){this.port.postMessage({type:'done',id:c.id,startFrame:c.startFrame,frames:c.frames,rows:c.rows,inputs:c.inputs},c.inputs.flatMap(i=>i.map(c=>c.buffer)));this.capture=null;}
    }
    return true;
  }
}
registerProcessor('open-play-deck-scratch-capture-test',DeckScratchCapture);
