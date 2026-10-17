import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SoundTouchTransport} from '../experiments/keylock-soundtouch/pull-transport.mjs';
const report = process.argv.find(a => a.startsWith('--report='))?.slice(9);
assert(report && !fs.existsSync(report));
let Controller, loadError;
try { ({SoundTouchNodeController: Controller} = await import('../experiments/keylock-soundtouch/node-controller.mjs')); } catch(e) { loadError = e.message; }
const checks = [];
function test(name, run) { const evidence = {}; try { assert.equal(typeof Controller, 'function', 'Node protocol not implemented'); run(evidence); checks.push({name, passed:true, evidence}); } catch(e) { checks.push({name,passed:false,error:{name:e.name,message:e.message},evidence}); } }
const sr=48000;
function setup({seconds=16, channels=2}={}) {
 const c=new Controller({sampleRate:sr,durationFrames:sr*seconds,channels,initialFrame:0});
 const source=Array.from({length:channels},(_,ch)=>Float32Array.from({length:sr*seconds},(_,i)=>.14*Math.sin(2*Math.PI*(ch?550:330)*i/sr)));
 for(let at=0;at<Math.min(sr*8,source[0].length);at+=sr/2)c.addBuffers(source.map(a=>a.slice(at,at+sr/2)));
 return {c,source};
}
function render(c,end) { const values=[];for(let at=c.nextFrame;at<end;at+=128) values.push(...c.render(at)[0]);return values; }
test('Append extent is not file EOF; fixed coordinates survive drop/refill', e=>{
 const {c,source}=setup();assert.equal(c.snapshot().transport.state.position,0);assert.equal(c.addedEnd,8);
 c.schedule({active:true,input:0,output:256/sr,rate:1,semitones:0});render(c,sr*3);
 const extent=c.dropBuffers(1);assert.deepEqual(extent,{start:1,end:8});
 assert.equal(c.addBuffers(source.map(a=>a.slice(sr*8,sr*8.5))),8.5);
 assert.equal(c.snapshot().store.durationFrames,sr*16);e.snapshot=c.snapshot();c.dispose();
});
test('Effective pitch is applied once, including keylock-OFF compensation from caller',e=>{
 const {c}=setup();const rate=1.25,pitch=12*Math.log2(rate);
 const ack=c.schedule({active:true,input:0,output:256/sr,rate,semitones:pitch});
 assert.equal(ack.keylock,true);assert.equal(ack.effectiveSemitones,pitch);assert.equal(ack.semitones,pitch);
 const values=render(c,sr*3).slice(sr, sr*2),crossings=[];
 for(let i=1;i<values.length;i++)if(values[i-1]<0&&values[i]>=0)crossings.push(i-1-values[i-1]/(values[i]-values[i-1]));
 const hz=(crossings.length-1)*sr/(crossings.at(-1)-crossings[0]);assert(Math.abs(hz-412.5)<=1);e.hz=hz;c.dispose();
});
test('Later commands supersede scheduled stop; stop does not dispose the node',e=>{
 const {c}=setup();c.schedule({active:true,input:0,output:256/sr,rate:1,semitones:0});
 const stop=c.stop(1);const replace=c.schedule({active:true,input:2,output:.5,rate:1,semitones:0});assert.deepEqual(replace.superseded,[stop.generation]);
 render(c,sr*2);assert.equal(c.snapshot().transport.state.playing,true);
 c.stop(c.nextFrame/sr+.1);const values=render(c,c.nextFrame+sr*.3);assert(values.slice(-sr*.1).every(v=>v===0));
 c.schedule({active:true,input:3,output:c.nextFrame/sr+.1,rate:1,semitones:0});
 const resumed=render(c,c.nextFrame+sr*.4);assert(resumed.slice(-sr*.1).some(v=>v!==0));e.snapshot=c.snapshot();c.dispose();
});
test('Late or missing-coverage active schedules reject without changing owner',e=>{
 const {c}=setup();c.schedule({active:true,input:0,output:.1,rate:1,semitones:0});render(c,sr);
 const before=JSON.stringify(c.snapshot());assert.throws(()=>c.schedule({active:true,input:1,output:0,rate:1,semitones:0}),{name:'LateScheduleError'});
 assert.equal(JSON.stringify(c.snapshot()),before);
 assert.throws(()=>c.schedule({active:true,input:12,output:1.2,rate:1,semitones:0}),{name:'CoverageError'});
 assert.equal(JSON.stringify(c.snapshot()),before);e.snapshot=c.snapshot();c.dispose();
});
test('Eight-channel PCM keeps positional ordering, without stereo duplication leaking',e=>{
 const {c,source}=setup({seconds:1,channels:8});const reference=new SoundTouchTransport({sampleRate:sr,buffers:[source]});reference.schedule({type:'start',frame:4800,rate:1,semitones:0});c.schedule({active:true,input:0,output:.1,rate:1,semitones:0});
 let output;for(let at=0;at<sr*.5;at+=128){output=c.render(at);assert.deepEqual(output,reference.render(at)[0]);}
 assert.equal(output.length,8);assert(output.every(a=>a.every(Number.isFinite)));assert.notDeepEqual(output[0],output[1]);
 e.channels=output.length;e.reference='Bit-identical to whole-source four-pair transport; does not prove phase coherence across independent stereo pairs.';c.dispose();reference.dispose();
});
test('Dispose releases retained PCM and epochs; idempotent and terminal',e=>{
 const {c}=setup();c.schedule({active:true,input:0,output:.1,rate:1,semitones:0});
 const done=c.dispose();assert.equal(done.store.retainedPCMBytes,0);assert.deepEqual(done.transport.epochs,[]);assert.deepEqual(c.dispose(),done);
 assert.throws(()=>c.addBuffers([new Float32Array(10),new Float32Array(10)]),{name:'InvalidStateError'});
 assert.throws(()=>c.schedule({active:true,input:0,output:1,rate:1,semitones:0}),{name:'InvalidStateError'});e.snapshot=done;
});
const result={created_at:new Date().toISOString(),loadError,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,scope:'Real public DSP with low-level scheduling/window protocol in serial Node; no actual AudioWorklet, engine, native, physical latency or full parity acceptance.'};
fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:result.passed,failed:result.failed,failures:checks.filter(c=>!c.passed)},null,2));assert.equal(result.failed,0);
