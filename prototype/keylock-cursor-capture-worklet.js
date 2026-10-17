// Test-only four-channel recorder: stereo production deck plus stereo control.
// Every armed quantum is retained. Never repair timestamps or remove a bad span.
export function createCursorCaptureProcessor(Base,frameNow){return class extends Base{
  constructor(){super();this.sequence=0;this.preflight=null;this.preflightReady=false;this.armId=null;this.finishId=null;this.armed=false;this.finished=false;this.previousEnd=null;this.startupGaps=[];
    this.port.onmessage=({data})=>{if(data.type==='preflight'&&!this.armed)this.preflight={id:data.id,rows:[],consecutive:0,last:null};else if(data.type==='arm'&&!this.armed)this.armId=data.id;else if(data.type==='finish')this.finishId=data.id;};this.port.postMessage({type:'ready'});}
  process(inputs,outputs){
    for(const output of outputs)for(const channel of output)channel.fill(0);
    if(this.finished)return false;
    const frame=frameNow(),frames=outputs[0][0].length,sequence=this.sequence++;
    const row={frame,frames,sequence,inputChannels:inputs.map(x=>x.length)};
    if(this.previousEnd!==null&&frame!==this.previousEnd)this.startupGaps.push({expected:this.previousEnd,actual:frame,sequence});this.previousEnd=frame+frames;
    if(this.preflight){const p=this.preflight;p.rows.push(row);p.consecutive=p.last===frame?p.consecutive+1:1;p.last=frame+frames;
      if(p.rows.length>8192){this.port.postMessage({type:'error',error:'Preflight bound exceeded'});this.finished=true;return false;}
      if(p.consecutive>=64){this.preflightReady=true;this.port.postMessage({type:'preflight',id:p.id,rows:p.rows,consecutive:p.consecutive,startupGaps:this.startupGaps.slice()});this.preflight=null;}}
    if(!this.armed){
      if(this.armId===null){if(this.finishId!==null){this.port.postMessage({type:'finished',id:this.finishId,unarmed:true});this.finished=true;return false;}return true;}
      if(!this.preflightReady){this.port.postMessage({type:'error',error:'Arm before valid preflight'});this.finished=true;return false;}
      this.armed=true;this.port.postMessage({type:'armed',id:this.armId,firstFrame:frame,firstSequence:sequence});
    }
    const channels=[inputs[0]?.[0],inputs[0]?.[1],inputs[1]?.[0],inputs[1]?.[1]].map(x=>x?.slice()||new Float32Array(frames));
    this.port.postMessage({type:'pcm',...row,channels},channels.map(x=>x.buffer));
    if(this.finishId!==null){this.port.postMessage({type:'finished',id:this.finishId,lastFrame:frame+frames,lastSequence:sequence});this.finished=true;return false;}return true;
  }
};}
export function validateCursorCapture(target){
  const errors=[],assert=(v,m)=>{if(!v)throw Error(m);};
  assert(target.arm&&target.fence&&!target.fence.unarmed,'Missing real capture arm/fence');
  const tail=target.preflight?.rows?.slice(-64);assert(target.preflight?.consecutive>=64&&tail?.length===64,'Missing64 actual preflight rows');
  for(let i=0;i<tail.length;i++){const row=tail[i],before=tail[i-1];assert(row.inputChannels.length===2&&row.inputChannels.every(n=>n===2)&&row.frames>0&&(!before||row.frame===before.frame+before.frames&&row.sequence===before.sequence+1),'Preflight stereo frame/sequence discontinuity');}
  assert(target.blocks.length>0,'Empty armed capture');
  let frame=target.arm.firstFrame,sequence=target.arm.firstSequence,totalFrames=0;
  for(const block of target.blocks){
    const frames=block.channels[0].length;
    if(block.frame!==frame||block.sequence!==sequence||block.frames!==frames||block.inputChannels.length!==2||!block.inputChannels.every(n=>n===2)||block.channels.length!==4||block.channels.some(c=>c.length!==frames||c.some(x=>!Number.isFinite(x))))errors.push({expectedFrame:frame,actualFrame:block.frame,expectedSequence:sequence,actualSequence:block.sequence,inputChannels:block.inputChannels});
    frame=block.frame+frames;sequence=block.sequence+1;totalFrames+=frames;
  }
  if(frame!==target.fence.lastFrame||sequence-1!==target.fence.lastSequence)errors.push({reason:'Final fence mismatch',frame,sequence,fence:target.fence});
  return{passed:errors.length===0,coverage:errors.length?null:1,errors,totalFrames,preflight:target.preflight,arm:target.arm,fence:target.fence,
    rows:target.blocks.map(b=>({frame:b.frame,frames:b.frames,sequence:b.sequence,inputChannels:b.inputChannels}))};
}
if(typeof AudioWorkletProcessor==='function'&&typeof registerProcessor==='function')registerProcessor('open-play-cursor-capture',createCursorCaptureProcessor(AudioWorkletProcessor,()=>currentFrame));
