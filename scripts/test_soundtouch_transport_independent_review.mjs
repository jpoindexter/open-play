import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const modulePath=process.argv.find(v=>v.startsWith('--module='))?.slice(9)??'experiments/keylock-soundtouch/pull-transport.mjs';
const {SoundTouchTransport:Transport}=await import(pathToFileURL(path.resolve(modulePath)).href);

const reportPath=process.argv.find(v=>v.startsWith('--report='))?.slice(9);
assert(reportPath&&!fs.existsSync(reportPath),'Use a new immutable report path');
const sr=44100,checks=[];
const fixture=()=>[new Float32Array(sr*4).fill(.25)];
function check(name,run){const evidence={};try{run(evidence);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence,error:{name:error.name,message:error.message}});}}
function sumBetween(t,from,to,end){let sum=0,n=0,peak=0;for(let at=t.nextFrame;at<end;at+=128){const out=t.render(at)[0][0];for(let i=0;i<out.length;i++)if(at+i>=from&&at+i<to){sum+=out[i];n++;peak=Math.max(peak,Math.abs(out[i]));}}return{sum,n,mean:sum/n,peak};}

check('Earlier replacement inherits the surviving start, never discarded future seek',e=>{
 const t=new Transport({sampleRate:sr,buffers:[fixture()]});
 try{t.schedule({type:'start',frame:256,rate:.75,semitones:2});const stale=t.schedule({type:'seek',frame:4000,position:2,semitones:12});const current=t.schedule({type:'update',frame:1000,rate:1.08});e.current=current;assert.deepEqual(current.superseded,[stale.generation]);assert.equal(current.semitones,2);assert(Math.abs(current.position-(1000-256)/sr*.75)<1e-12);assert.equal(t.queue.length,2);}finally{t.dispose();}
});
check('Rejected replacement leaves pending state and prepared ownership untouched',e=>{
 const t=new Transport({sampleRate:sr,buffers:[fixture()]});
 try{t.schedule({type:'start',frame:256});const old=t.schedule({type:'seek',frame:4000,position:2});const before=JSON.stringify(t.snapshot());assert.throws(()=>t.schedule({type:'update',frame:1000,rate:0}));e.same=JSON.stringify(t.snapshot())===before;assert(e.same);assert.equal(t.queue.at(-1).state.generation,old.generation);}finally{t.dispose();}
});
check('Replacing an uncommitted start at the same frame with pause never emits it',e=>{
 const t=new Transport({sampleRate:sr,buffers:[fixture()]});
 try{const old=t.schedule({type:'start',frame:256,position:2});const stop=t.schedule({type:'pause',frame:256});assert.deepEqual(stop.superseded,[old.generation]);e.output=sumBetween(t,0,20000,20000);assert.equal(e.output.peak,0);assert.equal(t.snapshot().state.position,0);}finally{t.dispose();}
});
check('Rapid epoch crossfades of identical DC preserve gain without overshoot',e=>{
 const t=new Transport({sampleRate:sr,buffers:[fixture()]});
 try{t.schedule({type:'start',frame:256});sumBetween(t,0,22016,22016);let min=Infinity,max=-Infinity;for(let k=0;k<8;k++){t.schedule({type:'update',frame:t.nextFrame,rate:k%2?.75:1.08});for(let j=0;j<2;j++){const o=t.render(t.nextFrame)[0][0];for(const v of o){min=Math.min(min,v);max=Math.max(max,v);}}}e.range=[min,max];assert(min>.24999&&max<.25001);}finally{t.dispose();}
});
check('Caller channel-list reassignment cannot silently replace the loaded source',e=>{
 const channels=fixture(),t=new Transport({sampleRate:sr,buffers:[channels]});
 try{t.schedule({type:'start',frame:256});channels[0]=new Float32Array(sr*4).fill(-.25);t.schedule({type:'seek',frame:sr,position:2});e.before=sumBetween(t,sr*.5,sr*.6,sr);e.after=sumBetween(t,sr*1.5,sr*1.6,sr*2);assert(e.before.mean>.24999);assert(e.after.mean>.24999,'A source descriptor replacement escaped the original loaded-source ownership');}finally{t.dispose();}
});
check('Caller channel-list growth cannot change future epoch geometry',e=>{
 const channels=fixture(),t=new Transport({sampleRate:sr,buffers:[channels]});
 try{channels.push(new Float32Array(sr*4),new Float32Array(sr*4));t.schedule({type:'start',frame:256});e.reportedChannels=t.channelCounts[0];e.preparedMappings=t.queue[0].epoch.mapping;assert.equal(e.preparedMappings.length,1,'Future epoch geometry changed after constructor validation');assert.equal(e.preparedMappings[0].channel,0);}finally{t.dispose();}
});
const inputs=[modulePath,'scripts/test_soundtouch_transport_independent_review.mjs'].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
const report={scope:'Actual published core through experimental serial transport; independent command ownership and DC/source descriptor boundaries. No actual browser/deadline/pitch/cursor/EOS tail/native/music acceptance.',inputs,checks,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({reportPath,passed:report.passed,failed:report.failed,checks},null,2));
assert.equal(report.failed,0);
