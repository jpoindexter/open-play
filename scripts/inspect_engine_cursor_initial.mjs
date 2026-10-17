// Diagnostic only: a globally failed native run is NEVER promoted by these fits.
// Inspect separately contiguous recorded intervals to locate actionable defects.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectCursorProbes} from '../prototype/keylock-cursor-analysis.js';
import {inspectReturnPCM} from '../prototype/keylock-release-analysis.js';
const report=JSON.parse(fs.readFileSync('docs/prototype/engine-cursor-native-initial-results.json'));
const bytes=fs.readFileSync('local-evidence/engine-cursor-native-initial/complete.f32');
const hash=b=>createHash('sha256').update(b).digest('hex');
if(hash(bytes)!==report.raw.SHA256||bytes.length!==report.raw.bytes)throw Error('Original raw identity differs');
if(report.captureIntegrity.passed||report.completed||report.allCriteriaPassed)throw Error('This inspector expects the preserved failed run');
const pcm=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4),sr=report.runtime.sampleRate;
const rows=report.captureTranscript.rows;let storedFrame=0;
const geometry=rows.map(row=>{const result={...row,storedFrame};storedFrame+=row.frames;return result;});
if(storedFrame!==report.raw.frames)throw Error('Raw/producer frame count mismatch');
function interval(start,seconds){
 const first=Math.round(start*sr),count=Math.round(seconds*sr),channels=Array.from({length:4},()=>new Float32Array(count));let at=first,used=[];
 for(const row of geometry){const lo=Math.max(first,row.frame),hi=Math.min(first+count,row.frame+row.frames);if(hi<=lo)continue;
  if(lo!==at||row.inputChannels.length!==2||!row.inputChannels.every(n=>n===2))throw Error('Requested original interval is discontinuous');
  for(let f=lo;f<hi;f++)for(let c=0;c<4;c++)channels[c][f-first]=pcm[(row.storedFrame+f-row.frame)*4+c];
  used.push({sequence:row.sequence,frame:row.frame});at=hi;
 }
 if(at!==first+count)throw Error('Original interval incomplete');
 for(let i=1;i<used.length;i++)if(used[i].sequence!==used[i-1].sequence+1)throw Error('Requested interval has a sequence gap');
 return{channels,firstTime:first/sr,firstFrame:first,frames:count,firstSequence:used[0].sequence,lastSequence:used.at(-1).sequence};
}
function inspect(row){
 const input=interval(row.releaseTime-.05,.8);
 const pitch=inspectReturnPCM(input.channels[0],sr,input.firstTime,row.releaseTime,row.outputTime,880,475.2);
 const probes=inspectCursorProbes(input.channels[1],sr,input.firstTime,row.releaseTime,row.expectedEndPosition);
 return{originalInterval:{firstFrame:input.firstFrame,frames:input.frames,firstSequence:input.firstSequence,lastSequence:input.lastSequence},pitch,probes,
  exploratoryCriteriaWouldPass:Object.values(pitch.criteriaPassed).every(Boolean)&&pitch.rawPitchWindows===0&&probes.every(p=>p.passed),
  acceptedCase:false,scope:'Original wholly contiguous subinterval diagnostic only; complete armed run remains failed, no acceptance reclassification.'};
}
const result={date:'2026-10-17',scope:'Exploratory original-subinterval diagnosis of a globally failed run. No timestamps rewritten, no armed data removed, no case acceptance promoted.',
 inputSHA256:hash(fs.readFileSync('docs/prototype/engine-cursor-native-initial-results.json')),rawSHA256:hash(bytes),
 fullRunAccepted:false,fullCaptureErrors:report.captureIntegrity.errors,calibration:null,cases:[]};
try{result.calibration=inspect(report.calibration);}catch(error){result.calibration={error:error.message,acceptedCase:false};}
for(const row of report.checks){const value={index:row.index,gesture:row.gesture,region:row.region};try{Object.assign(value,inspect(row));}catch(error){value.error=error.message;value.acceptedCase=false;}result.cases.push(value);}
fs.writeFileSync('docs/prototype/engine-cursor-native-initial-subinterval-diagnostic.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({globalRunStillFailed:true,calibration:result.calibration.probes?.map(p=>({offset:p.offset,error:p.errorSeconds,score:p.score,margin:p.margin,confident:p.confident,passed:p.passed})),cases:result.cases.map(row=>({index:row.index,gesture:row.gesture,region:row.region,error:row.error,pitch:row.pitch?.criteriaPassed,probes:row.probes?.map(p=>({offset:p.offset,error:p.errorSeconds,score:p.score,margin:p.margin,confident:p.confident,passed:p.passed}))}))},null,2));
