// Test-only observation. Neither aliases nor automation are independent hardware
// clocks. Preserve every actual value; a second witness never repairs old rows.
import {validateCursorCapture} from './keylock-cursor-capture-worklet.js';

export function createRenderClockCaptureProcessor(Base,readClock){return class extends Base{
  static get parameterDescriptors(){return[{name:'clockFrame',defaultValue:-1,minValue:-1,maxValue:4194304,automationRate:'a-rate'}];}
  constructor(){super();this.sequence=0;this.preflight=null;this.preflightReady=false;this.armId=null;this.finishId=null;this.armed=false;this.finished=false;this.previousEnd=null;this.startupGaps=[];
    this.port.onmessage=({data})=>{if(data.type==='preflight'&&!this.armed)this.preflight={id:data.id,rows:[],consecutive:0,last:null};else if(data.type==='arm'&&!this.armed)this.armId=data.id;else if(data.type==='finish')this.finishId=data.id;};this.port.postMessage({type:'ready'});}
  process(inputs,outputs,parameters){
    for(const output of outputs)for(const channel of output)channel.fill(0);
    if(this.finished)return false;
    const clock=readClock(),frame=clock.frame,frames=outputs[0][0].length,sequence=this.sequence++;
    const row={frame,frames,sequence,inputChannels:inputs.map(x=>x.length),clock};
    if(this.previousEnd!==null&&frame!==this.previousEnd)this.startupGaps.push({expected:this.previousEnd,actual:frame,sequence});this.previousEnd=frame+frames;
    if(this.preflight){const p=this.preflight;p.rows.push({...row,clockAfter:readClock()});p.consecutive=p.last===frame?p.consecutive+1:1;p.last=frame+frames;
      if(p.rows.length>8192){this.port.postMessage({type:'error',error:'Preflight bound exceeded'});this.finished=true;return false;}
      if(p.consecutive>=64){this.preflightReady=true;this.port.postMessage({type:'preflight',id:p.id,rows:p.rows,consecutive:p.consecutive,startupGaps:this.startupGaps.slice()});this.preflight=null;}}
    if(!this.armed){
      if(this.armId===null){if(this.finishId!==null){this.port.postMessage({type:'finished',id:this.finishId,unarmed:true});this.finished=true;return false;}return true;}
      if(!this.preflightReady){this.port.postMessage({type:'error',error:'Arm before valid preflight'});this.finished=true;return false;}
      this.armed=true;this.port.postMessage({type:'armed',id:this.armId,firstFrame:frame,firstSequence:sequence});
    }
    const channels=[inputs[0]?.[0],inputs[0]?.[1],inputs[1]?.[0],inputs[1]?.[1]].map(x=>x?.slice()||new Float32Array(frames));
    // A constant/absent array is retained with its actual length, never expanded.
    const clockValues=parameters.clockFrame?.slice()||new Float32Array(0),clockAfter=readClock();
    this.port.postMessage({type:'pcm',...row,clockAfter,clockValues,channels},[...channels.map(x=>x.buffer),clockValues.buffer]);
    if(this.finishId!==null){this.port.postMessage({type:'finished',id:this.finishId,lastFrame:frame+frames,lastSequence:sequence,clockAfter});this.finished=true;return false;}return true;
  }
};}

export function validateRenderClockCapture(target,plan){
  let capture;try{capture=validateCursorCapture(target);}catch(error){capture={passed:false,coverage:null,errors:[{error:error.message}]};}
  const tolerance=.25,errors=[],invalidParameterRows=[],parameterDiscontinuities=[],globalMismatchExamples=[];
  let globalMismatchSamples=0,currentTimeMismatchRows=0,getterMismatchRows=0,withinCallMismatchRows=0,outsideRampSamples=0,maxGlobalError=0,maxStepError=0,parameterSamples=0,previous=null;
  const keys=['startFrame','endFrame','startTime','endTime','fromValue','endValue','sampleRate','toleranceFrames'],declared={};
  for(const key of keys)declared[key]=plan&&typeof plan==='object'?Object.getOwnPropertyDescriptor(plan,key)?.value:undefined;
  const validPlan=keys.every(key=>Number.isFinite(declared[key]))&&Number.isSafeInteger(declared.startFrame)&&declared.startFrame>=0&&Number.isSafeInteger(declared.endFrame)&&declared.endFrame>declared.startFrame&&declared.endFrame-declared.startFrame<4194304&&declared.sampleRate>0&&declared.toleranceFrames===tolerance&&declared.startTime===declared.startFrame/declared.sampleRate&&declared.endTime===declared.endFrame/declared.sampleRate&&declared.fromValue===0&&declared.endValue===declared.endFrame-declared.startFrame;
  if(!validPlan)errors.push('Invalid declared clock plan or Float32 range/tolerance');
  for(const block of target.blocks||[]){
    const a=block.clock,b=block.clockAfter,fields=['frame','time','frameGlobal','timeGlobal'];
    const validSnapshots=a&&b&&fields.every(key=>Number.isFinite(a[key])&&Number.isFinite(b[key]));
    if(!validSnapshots){getterMismatchRows++;errors.push('Missing or nonfinite global snapshots at sequence '+block.sequence);}
    else{
      if(a.frame!==block.frame||a.frameGlobal!==a.frame||a.timeGlobal!==a.time)getterMismatchRows++;
      if(fields.some(key=>a[key]!==b[key]))withinCallMismatchRows++;
      if(!Number.isSafeInteger(a.frame)||a.frame<0||!validPlan||Math.abs(a.time*declared.sampleRate-a.frame)>1e-4)currentTimeMismatchRows++;
    }
    const values=block.clockValues;
    if(!(values instanceof Float32Array)||values.length!==block.frames||!values.length||values.some(value=>!Number.isFinite(value))){invalidParameterRows.push({sequence:block.sequence,frames:block.frames,actualLength:values?.length??null});previous=null;continue;}
    for(let i=0;i<values.length;i++){
      const value=values[i];parameterSamples++;
      if(previous!==null){const error=Math.abs(value-previous-1);maxStepError=Math.max(maxStepError,error);if(error>tolerance&&parameterDiscontinuities.length<64)parameterDiscontinuities.push({sequence:block.sequence,index:i,previous,value,error});}
      previous=value;
      if(!validPlan)continue;
      if(value<=0||value>=declared.endFrame-declared.startFrame)outsideRampSamples++;
      const absolute=declared.startFrame+value,error=Math.abs(absolute-(block.frame+i));maxGlobalError=Math.max(maxGlobalError,error);
      if(error>tolerance){globalMismatchSamples++;if(globalMismatchExamples.length<64)globalMismatchExamples.push({sequence:block.sequence,index:i,declared:block.frame+i,scheduled:absolute,error});}
    }
  }
  const parameterContinuous=validPlan&&parameterSamples>0&&!invalidParameterRows.length&&!parameterDiscontinuities.length&&!outsideRampSamples;
  const passed=capture.passed&&parameterContinuous&&!globalMismatchSamples&&!currentTimeMismatchRows&&!getterMismatchRows&&!withinCallMismatchRows&&!errors.length;
  return{passed,coverage:passed?1:null,capture,plan:declared,parameterContinuous,parameterSamples,invalidParameterRows,parameterDiscontinuities,outsideRampSamples,globalMismatchSamples,globalMismatchExamples,maxGlobalError,maxStepError,currentTimeMismatchRows,getterMismatchRows,withinCallMismatchRows,errors,
    boundary:'Separately scheduled automation and global aliases may share a rendering backend. Agreement cannot exclude common-mode faults, establish deck cursor or repair prior evidence.'};
}
if(typeof AudioWorkletProcessor==='function'&&typeof registerProcessor==='function')registerProcessor('open-play-render-clock-capture',createRenderClockCaptureProcessor(AudioWorkletProcessor,()=>({frame:currentFrame,time:currentTime,frameGlobal:globalThis.currentFrame,timeGlobal:globalThis.currentTime})));
