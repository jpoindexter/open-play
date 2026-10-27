import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=new URL('./analysis.js',import.meta.url),source=readFileSync(file,'utf8');
const entry='function fftMagnitude(input, real, imag, magnitude) {';
assert.equal(source.split(entry).length,2);
const instrumented='export let fftCalls=0;\n'+source.replace(entry,entry+'fftCalls++;').replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${new URL(path,file).href}'`);
const measured=await import('data:text/javascript;base64,'+Buffer.from(instrumented).toString('base64'));
test('level-only analysis skips spectral transforms while retaining measurement, validation and progress',()=>{
 const sr=16000,pcm=Float32Array.from({length:sr*4},(_,i)=>.2*Math.sin(2*Math.PI*440*i/sr)),progress=[];
 const result=measured.analyzePCM([pcm],sr,{analyzeTempo:false,analyzeKey:false,onProgress:x=>progress.push(x)});
 console.log(JSON.stringify({spectralTransforms:measured.fftCalls,rms:result.gain.rms,peak:result.gain.samplePeak}));
 assert.equal(measured.fftCalls,0,'Both disabled must skip FFT work');
 assert(Math.abs(result.gain.rms-Math.SQRT1_2*.2)<1e-8);assert(Math.abs(result.gain.samplePeak-.2)<1e-7);
 assert(Number.isFinite(result.loudness.integratedLUFS));assert.equal(result.bpm,null);assert.equal(result.key,null);assert.equal(result.grid,null);
 assert.equal(result.tempo.reason,'tempo_analysis_disabled');assert.equal(result.keyEstimate.reason,'key_analysis_disabled');assert.deepEqual(progress,[1]);
 assert.throws(()=>measured.analyzePCM([new Float32Array([NaN])],sr,{analyzeTempo:false,analyzeKey:false}),/non-finite/);
 measured.analyzePCM([pcm],sr,{analyzeKey:false});assert(measured.fftCalls>0,'Enabled tempo must keep spectral analysis');
});
