import assert from 'node:assert/strict';
import {inspectReturnPCM} from '../prototype/keylock-release-analysis.js';
const sampleRate=48000,release=1,start=.95,output=1.17,frames=sampleRate;
const signal=fn=>Float32Array.from({length:frames},(_,i)=>fn(start+i/sampleRate));
const sine=(hz,t)=>.12*Math.sin(2*Math.PI*hz*t);
const cases=[];
function check(name,run){run();cases.push({name,passed:true});}
check('Correct880Hz from release has no raw476Hz windows and meets pitch/gap bounds',()=>{
 const x=inspectReturnPCM(signal(t=>t<release?0:sine(880,t)),sampleRate,start,release,output,880,475.2);
 assert(Object.values(x.criteriaPassed).every(Boolean));assert.equal(x.rawPitchWindows,0);
});
check('Audible raw bridge is rejected even when later scheduled output and settled pitch are correct',()=>{
 const x=inspectReturnPCM(signal(t=>t<release?0:sine(t<1.3?475.2:880,t)),sampleRate,start,release,output,880,475.2);
 assert(x.rawPitchWindows>10);assert(x.wrongPitchAfterRelease30ms>10);
 assert.equal(x.criteriaPassed.noWrongPitchAfterRelease30ms,false);assert.equal(x.criteriaPassed.settledPitch,true);
});
check('40ms silent bridge is rejected despite correct later pitch',()=>{
 const x=inspectReturnPCM(signal(t=>t<1.04?0:sine(880,t)),sampleRate,start,release,output,880,475.2);
 assert(x.initialGapSeconds>.02);assert.equal(x.criteriaPassed.releaseGapWithin20ms,false);
});
check('Correct pitch at a wrong cursor demonstrates that this classifier cannot establish alignment',()=>{
 const x=inspectReturnPCM(signal(t=>t<release?0:sine(880,t+.2)),sampleRate,start,release,output,880,475.2);
 assert(Object.values(x.criteriaPassed).every(Boolean));
 // This deliberate counterexample requires a separate nonperiodic cursor oracle.
});
console.log(JSON.stringify({passed:cases.length,failed:0,cases,scope:'Executed analytic PCM classifier counterexamples. Does not prove production engine, actual browser, cursor alignment, device or reference quality.'},null,2));
