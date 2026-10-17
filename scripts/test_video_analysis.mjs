import assert from 'node:assert/strict';
import {videoBands, videoAnalysisPolicy} from '../prototype/video-analysis.js';
const sampleRate=48000, fftSize=2048;
const spectrum=()=>new Float32Array(fftSize/2).fill(-Infinity);
const at=(bins,hz,db)=>{bins[Math.round(hz*fftSize/sampleRate)]=db;return bins;};
const close=(a,b)=>assert(Math.abs(a-b)<1e-6, `${a} differs from ${b}`);
assert.deepEqual(videoBands(spectrum(),sampleRate,fftSize),{bass:0,mid:0,treble:0});
let bins=at(spectrum(),93.75,-20), bands=videoBands(bins,sampleRate,fftSize);
close(bands.bass,.1);close(bands.mid,0);close(bands.treble,0);
bins=at(spectrum(),1007.8125,-12);bands=videoBands(bins,sampleRate,fftSize);
close(bands.mid,10**(-12/20));close(bands.bass,0);close(bands.treble,0);
bins=at(spectrum(),8015.625,-6);bands=videoBands(bins,sampleRate,fftSize);
close(bands.treble,10**(-6/20));close(bands.bass,0);close(bands.mid,0);
bins=spectrum();bins[2]=-20;bins[3]=-20;close(videoBands(bins,sampleRate,fftSize).bass,Math.sqrt(.02));
bins=spectrum();bins[2]=0;bins[3]=0;close(videoBands(bins,sampleRate,fftSize).bass,1);
bins=spectrum();bins[0]=0;bins[1]=NaN;bins[2]=Infinity;assert.deepEqual(videoBands(bins,sampleRate,fftSize),{bass:0,mid:0,treble:0});
assert.deepEqual(videoBands(new Float32Array(512).fill(-Infinity),8000,1024),{bass:0,mid:0,treble:0});
assert.equal(videoAnalysisPolicy.fftSize,2048);
console.log('Video analysis pure-math checks passed: silence, per-band isolation, summed power, clamp, DC/nonfinite rejection and low-rate bounds. Actual AudioContext taps, GPU pipeline, decoding/capture and real AudioEngine routing require the browser integration harness.');

const {videoSpectrum8,normalizeSpectrum8,createVideoAnalysis}=await import('../prototype/video-analysis.js');
const checks=[];
function check(name,run){try{run();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.stack});}}
check('Original three-band pure-math regression assertions above remain executed',()=>assert(true));
check('Eight real bin ranges independently own isolated power without copying three coarse bands',()=>{
 const frequencies=[46.875,93.75,187.5,351.5625,703.125,1406.25,2812.5,9000];
 for(let expected=0;expected<8;expected++){
  const result=videoSpectrum8(at(spectrum(),frequencies[expected],-20),sampleRate,fftSize);
  assert.equal(result.length,8);result.forEach((n,i)=>close(n,i===expected?.1:0));
 }
});
check('All eight half-open frequency boundaries assign exact-edge bins only to the higher range',()=>{
 const sr=48000,size=48000;
 for(const [index,hz] of videoAnalysisPolicy.spectrum8Hz.entries()){
  const bins=new Float32Array(size/2).fill(-Infinity);bins[hz]=0;
  const result=videoSpectrum8(bins,sr,size);
  assert.deepEqual(result,Array.from({length:8},(_,i)=>i===index&&index<8?1:0));
 }
});
check('Power sums, clamp, DC exclusion and nonfinite rejection operate independently per range',()=>{
 const bins=spectrum();bins[1]=-20;bins[2]=-20;bins[4]=0;bins[5]=0;bins[0]=0;bins[15]=NaN;bins[16]=Infinity;
 const result=videoSpectrum8(bins,sampleRate,fftSize);close(result[0],Math.sqrt(.02));close(result[1],1);assert(result.slice(2).every(n=>n===0));
});
check('Nyquist clipping, empty low/high ranges and truncated frequency buffers yield bounded zeros',()=>{
 const bins=new Float32Array(512).fill(-Infinity);bins[500]=-20;
 const result=videoSpectrum8(bins,8000,1024);close(result[6],.1);assert.equal(result[7],0);
 assert.deepEqual(videoSpectrum8(new Float32Array(4).fill(-Infinity),8,8),Array(8).fill(0));
 assert.deepEqual(videoSpectrum8(new Float32Array(0),48000,2048),Array(8).fill(0));
 const coarse=videoSpectrum8(new Float32Array(2).fill(-Infinity),192000,4);assert.deepEqual(coarse,Array(8).fill(0));
});
check('Invalid new spectrum dimensions fail explicitly without changing the original videoBands API',()=>{
 for(const [sr,size] of [[0,2048],[NaN,2048],[Infinity,2048],[48000,0],[48000,3],[48000,2.5]])assert.throws(()=>videoSpectrum8(spectrum(),sr,size),RangeError);
 assert(Object.isFrozen(videoAnalysisPolicy.spectrum8Hz));
});
check('Own exact finite bounded eight-number arrays preserve values and valid all-zero silence',()=>{
 const data=[0,.1,.2,.3,.4,.5,.6,1],copy=normalizeSpectrum8(data);assert.deepEqual(copy,data);assert.notStrictEqual(copy,data);copy[1]=1;assert.equal(data[1],.1);
 assert.deepEqual(normalizeSpectrum8(Array(8).fill(0)),Array(8).fill(0));
 for(const bad of [null,undefined,{},[],Array(7).fill(0),Array(9).fill(0),new Float32Array(8),[0,0,0,0,0,0,0,NaN],[0,0,0,0,0,0,0,Infinity],[0,0,0,0,0,0,0,-.1],[0,0,0,0,0,0,0,1.1]])assert.equal(normalizeSpectrum8(bad),null);
});
check('Sparse/inherited/accessor vector entries are rejected without getter execution',()=>{
 let reads=0;const sparse=Array(8).fill(0);delete sparse[3];const proto=Object.create(Array.prototype);Object.defineProperty(proto,'3',{get(){reads++;return 1;}});Object.setPrototypeOf(sparse,proto);
 assert.equal(normalizeSpectrum8(sparse),null);
 const accessor=Array(8).fill(0);Object.defineProperty(accessor,'1',{get(){reads++;throw Error('must not execute');}});assert.equal(normalizeSpectrum8(accessor),null);assert.equal(reads,0);
 const {proxy,revoke}=Proxy.revocable([],{});revoke();assert.equal(normalizeSpectrum8(proxy),null);
});
check('Controlled tap lifecycle adds no new connection per spectrum read and preserves three-band/RMS arithmetic',()=>{
 const events=[],frequencyData=at(spectrum(),93.75,-20),sampleData=new Float32Array(2048).fill(.25);
 const node=name=>({name,connect(target){events.push(['connect',name,target.name]);},disconnect(target){events.push(['disconnect',name,target?.name]);}});
 const sources=[node('left'),node('master')];let analysers=0;
 const ctx={state:'running',sampleRate:48000,destination:node('destination'),createGain(){return {...node('sink'),gain:{value:1}};},createAnalyser(){return {...node('analyser'+analysers++),frequencyBinCount:1024,getFloatFrequencyData(target){target.set(frequencyData);},getFloatTimeDomainData(target){target.set(sampleData);}};}};
 const analysis=createVideoAnalysis(ctx,sources),initial=JSON.stringify(events),first=analysis.read(0);
 assert.deepEqual(first.spectrum8,[0,.1,0,0,0,0,0,0]);assert(first.spectrum8Available&&first.audioAvailable);close(first.bass,.1);close(first.level,.25);
 first.spectrum8[1]=1;assert.equal(analysis.read(0).spectrum8[1],.1);
 for(let i=0;i<100;i++)analysis.read(i%2);assert.equal(JSON.stringify(events),initial);assert.equal(analysers,2);
 ctx.state='suspended';assert.deepEqual(analysis.read(0),{bass:0,mid:0,treble:0,level:0,audioAvailable:false,spectrum8:null,spectrum8Available:false});
 ctx.state='running';assert.equal(analysis.read(99).spectrum8Available,false);analysis.dispose();const disposal=JSON.stringify(events);analysis.dispose();assert.equal(JSON.stringify(events),disposal);assert.equal(analysis.read(0).spectrum8,null);
 assert.equal(events.filter(e=>e[0]==='disconnect').length,5);
});
const result={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,scope:'Pure spectral math, own-data validation and controlled tap lifecycle only. No actual Web Audio FFT/PCM, output pixels, Serato/reference mapping or audio noninterference acceptance.'};
console.log(JSON.stringify(result,null,2));assert.equal(result.failed,0);
