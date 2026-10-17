// Controlled append-ACK boundary on the actual adapter class; no browser audio claim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const reportPath=process.argv.find(x=>x.startsWith('--report='))?.slice(9);
assert(reportPath&&!fs.existsSync(reportPath),'A new report path is required');
const filename='experiments/keylock-soundtouch/group-live-adapter.js';
const original=fs.readFileSync(filename,'utf8'),factoryImport="import Stretch from '/experiments/keylock-soundtouch/group-node-factory.mjs';";
assert(original.includes(factoryImport));
const instrumented=original.replace(factoryImport,'const Stretch=(...args)=>globalThis.__groupAckFactory(...args);')+'\nexport {LiveKeylock as BoundaryAdapter};\n';
const {BoundaryAdapter}=await import('data:text/javascript;base64,'+Buffer.from(instrumented).toString('base64'));
const oldAudioBuffer=globalThis.AudioBuffer;
class ControlledBuffer {constructor(){this.sampleRate=48000;this.length=480000;this.numberOfChannels=2;this.channels=[new Float32Array(this.length),new Float32Array(this.length)];} getChannelData(c){return this.channels[c];}}
globalThis.AudioBuffer=ControlledBuffer;
function gain(){return {gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
const records=[];
try {
 for(const mode of ['NaN','undefined','null','string','Infinity','negative-Infinity']){
  let resolveAck,rejectAck,notifyAppend,appendCalls=0,disposed=false;
  const ack=new Promise((r,j)=>{resolveAck=r;rejectAck=j;});
  const appended=new Promise(r=>notifyAppend=r);
  globalThis.__groupAckFactory=async()=>({connect(){},latency:async()=>.05,dispose:async()=>{disposed=true;},addBuffers:async batch=>{appendCalls++;const end=appendCalls*.5;if(appendCalls===1){notifyAppend();await ack;}return ({NaN:NaN,undefined:undefined,null:null,string:String(end),Infinity:Infinity,'negative-Infinity':-Infinity})[mode];}});
  const context={sampleRate:48000,currentTime:0,createGain:gain};
  const adapter=new BoundaryAdapter(context,{buffers:Array.from({length:5},()=>new ControlledBuffer()),position:0,rate:1,keylock:true,semitones:0,onEvent(){}});
  const pending=adapter.prepare();pending.catch(()=>{});await appended;
  const before=adapter.snapshot();const errors=[];
  for(const [ok,message] of [[before.retainedPCMBytes===0,'Unacknowledged chunk counted as retained'],[before.inFlightPCMBytes===960000,'Reservation must count exactly one five-source chunk']])if(!ok)errors.push(message);
  let result,error;
  if(mode==='abort'){const disposing=adapter.dispose();resolveAck();await disposing;try{await pending;}catch(e){error=e.name;}}
  else {if(mode==='rejection')rejectAck(new Error('Controlled append rejection'));else resolveAck();try{await pending;result=adapter.snapshot();}catch(e){error=e.message;}await adapter.dispose();}
  const after=adapter.snapshot();
  if(result)errors.push('Malformed ACK successfully completed preparation');
  if(!error)errors.push('Malformed ACK was not rejected');
  if(after.retainedPCMBytes!==0||after.inFlightPCMBytes!==0||!disposed)errors.push('Terminal cleanup left accounted PCM');
  records.push({mode,before:{retained:before.retainedPCMBytes,inFlight:before.inFlightPCMBytes},afterSuccess:result&&{retained:result.retainedPCMBytes,inFlight:result.inFlightPCMBytes},after:{retained:after.retainedPCMBytes,inFlight:after.inFlightPCMBytes},error,errors,passed:errors.length===0});
 }
}finally {globalThis.AudioBuffer=oldAudioBuffer;delete globalThis.__groupAckFactory;}
const report={declaredScope:'Actual adapter class with import-only factory substitution, controlled AudioBuffer/Gain/append ACK. Malformed numeric ACK validation: NaN/undefined/null/string/positive and negative Infinity. Not real AudioWorklet PCM/transfer/heap/native acceptance.',sourceSHA256:crypto.createHash('sha256').update(original).digest('hex'),scriptSHA256:crypto.createHash('sha256').update(fs.readFileSync(import.meta.filename)).digest('hex'),passed:records.filter(r=>r.passed).length,failed:records.filter(r=>!r.passed).length,records,fullParityVerified:false};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
