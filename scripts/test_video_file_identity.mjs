import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hashVideoBlob,videoBlobSize,videoIdentityChunkBytes} from '../prototype/video-file-identity-core.js';
import {videoFileIdentity} from '../prototype/video-file-identity.js';
const checks=[];
async function check(name,run){try{await run();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.stack});}}
const expected=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
await check('Published SHA256 empty/abc/quick-brown-fox vectors use actual incremental Blob reads',async()=>{
 for(const [text,hash] of [['','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],['abc','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],['The quick brown fox jumps over the lazy dog','d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592']])
  assert.equal(await hashVideoBlob(new Blob([text])),'sha256:'+hash);
});
await check('Real Blob SHA block/chunk boundaries and multi-slice payloads match independent Node crypto',async()=>{
 for(const size of [1,55,56,63,64,65,videoIdentityChunkBytes-1,videoIdentityChunkBytes,videoIdentityChunkBytes+1,videoIdentityChunkBytes*3+17]){
  const bytes=Uint8Array.from({length:size},(_,i)=>(i*31+(i>>>8))%256);
  assert.equal(await hashVideoBlob(new Blob([bytes])),expected(bytes));
 }
});
await check('File renames/type/mtime changes retain identity while same-name changed bytes do not',async()=>{
 const a=new File(['actual media bytes'],'one.mp4',{type:'video/mp4',lastModified:1}),b=new File(['actual media bytes'],'renamed.mov',{type:'video/quicktime',lastModified:1234}),c=new File(['different media bytes'],'one.mp4',{type:'video/mp4',lastModified:1});
 assert.equal(await hashVideoBlob(a),await hashVideoBlob(b));assert.notEqual(await hashVideoBlob(a),await hashVideoBlob(c));
});
await check('Blob intrinsic brand rejects duck types and prototype spoofs without invoking fake methods',async()=>{
 let reads=0;for(const fake of [null,{}, {size:3,slice(){reads++;},arrayBuffer(){reads++;}},{[Symbol.toStringTag]:'Blob',size:3},Object.create(Blob.prototype)]){
  assert.throws(()=>videoBlobSize(fake),TypeError);await assert.rejects(hashVideoBlob(fake),TypeError);
 }assert.equal(reads,0);
});
await check('Real Blob own-method overrides cannot redirect reads to whole-file or nonbyte data',async()=>{
 const blob=new Blob(['abc']);Object.defineProperties(blob,{size:{get(){throw Error('fake size');}},slice:{value(){throw Error('fake slice');}},arrayBuffer:{value(){throw Error('whole-file own read');}}});
 assert.equal(videoBlobSize(blob),3);assert.equal(await hashVideoBlob(blob),expected('abc'));
});
await check('Instrumented real intrinsic slice reads remain at most1MiB with no whole-file read',async()=>{
 const original=Blob.prototype.arrayBuffer,sizes=[];Blob.prototype.arrayBuffer=function(){sizes.push(Object.getOwnPropertyDescriptor(Blob.prototype,'size').get.call(this));return original.call(this);};
 let bounded;try{bounded=await import('../prototype/video-file-identity-core.js?bounded-read-evidence');}finally{Blob.prototype.arrayBuffer=original;}
 const bytes=new Uint8Array(videoIdentityChunkBytes*3+9).fill(37);assert.equal(await bounded.hashVideoBlob(new Blob([bytes])),expected(bytes));
 assert.deepEqual(sizes,[videoIdentityChunkBytes,videoIdentityChunkBytes,videoIdentityChunkBytes,9]);
});
await check('Real progress is monotonic, complete, bounded and represents empty bytes explicitly',async()=>{
 const blob=new Blob([new Uint8Array(videoIdentityChunkBytes+7)]),rows=[];await hashVideoBlob(blob,{onProgress:row=>rows.push(row)});
 assert.deepEqual(rows.map(row=>row.loaded),[0,videoIdentityChunkBytes,videoIdentityChunkBytes+7]);assert(rows.every(row=>row.total===blob.size&&row.ratio===row.loaded/row.total));
 const empty=[];await hashVideoBlob(new Blob([]),{onProgress:row=>empty.push(row)});assert.deepEqual(empty,[{loaded:0,total:0,ratio:1}]);
});
await check('Core pre-abort and progress-triggered abort stop without a digest and independent retry succeeds',async()=>{
 const controller=new AbortController();controller.abort();await assert.rejects(hashVideoBlob(new Blob(['abc']),{signal:controller.signal}),{name:'AbortError'});
 const mid=new AbortController(),rows=[];await assert.rejects(hashVideoBlob(new Blob([new Uint8Array(videoIdentityChunkBytes*3)]),{signal:mid.signal,onProgress:row=>{rows.push(row);if(row.loaded===videoIdentityChunkBytes)mid.abort();}}),{name:'AbortError'});
 assert.deepEqual(rows.map(row=>row.loaded),[0,videoIdentityChunkBytes]);assert.equal(await hashVideoBlob(new Blob(['abc'])),expected('abc'));
});
await check('Worker-unavailable public API fails explicitly instead of hashing on the main thread',async()=>{
 const original=globalThis.Worker;delete globalThis.Worker;try{await assert.rejects(videoFileIdentity(new Blob(['abc'])),{code:'VIDEO_IDENTITY_WORKER_UNAVAILABLE'});}finally{if(original!==undefined)globalThis.Worker=original;}
});
class ControlledWorker {
 static instances=[];
 constructor(url,options){this.url=url;this.options=options;this.terminations=0;this.posted=[];ControlledWorker.instances.push(this);}
 postMessage(message){this.posted.push(message);}
 terminate(){this.terminations++;}
 send(data){this.onmessage?.({data});}
}
async function withWorker(run){const original=globalThis.Worker;globalThis.Worker=ControlledWorker;ControlledWorker.instances=[];try{await run();}finally{if(original===undefined)delete globalThis.Worker;else globalThis.Worker=original;}}
await check('Controlled wrapper creates a module Worker, sends real Blob and terminates/clears handlers exactly once on success',()=>withWorker(async()=>{
 const blob=new Blob(['abc']),rows=[],promise=videoFileIdentity(blob,{onProgress:row=>rows.push(row)}),worker=ControlledWorker.instances[0];
 assert.equal(worker.options.type,'module');assert(worker.url.href.endsWith('/video-file-identity-worker.js'));assert.strictEqual(worker.posted[0].file,blob);
 const late=worker.onmessage;worker.send({type:'progress',loaded:0,total:3});worker.send({type:'progress',loaded:3,total:3});worker.send({type:'done',identity:expected('abc')});assert.equal(await promise,expected('abc'));late({data:{type:'progress',loaded:3,total:3}});
 assert.equal(rows.length,2);assert.equal(worker.terminations,1);assert.equal(worker.onmessage,null);assert.equal(worker.onerror,null);assert.equal(worker.onmessageerror,null);
}));
await check('Controlled abort terminates/rejects once, ignores late ownership and retry owns a new Worker',()=>withWorker(async()=>{
 const controller=new AbortController(),rows=[],blob=new Blob(['abc']),promise=videoFileIdentity(blob,{signal:controller.signal,onProgress:row=>rows.push(row)}),worker=ControlledWorker.instances[0],late=worker.onmessage;
 worker.send({type:'progress',loaded:0,total:3});controller.abort();await assert.rejects(promise,{name:'AbortError'});late({data:{type:'done',identity:expected('abc')}});late({data:{type:'progress',loaded:3,total:3}});controller.abort();assert.equal(rows.length,1);assert.equal(worker.terminations,1);
 const retry=videoFileIdentity(blob),second=ControlledWorker.instances[1];second.send({type:'progress',loaded:3,total:3});second.send({type:'done',identity:expected('abc')});assert.equal(await retry,expected('abc'));assert.equal(second.terminations,1);
}));
await check('Pre-abort/invalid signal/callback reject before worker creation; thrown progress callback cleans ownership',()=>withWorker(async()=>{
 const controller=new AbortController();controller.abort();await assert.rejects(videoFileIdentity(new Blob(['abc']),{signal:controller.signal}),{name:'AbortError'});
 await assert.rejects(videoFileIdentity(new Blob(['abc']),{signal:{aborted:false}}),TypeError);await assert.rejects(videoFileIdentity(new Blob(['abc']),{onProgress:1}),TypeError);assert.equal(ControlledWorker.instances.length,0);
 const promise=videoFileIdentity(new Blob(['abc']),{onProgress(){throw Error('callback failure');}}),worker=ControlledWorker.instances[0];worker.send({type:'progress',loaded:0,total:3});await assert.rejects(promise,/callback failure/);assert.equal(worker.terminations,1);assert.equal(worker.onmessage,null);
}));
await check('Controlled worker startup/post/error/messageerror and malformed protocol failures all clean handlers',async()=>{
 const original=globalThis.Worker;
 try{globalThis.Worker=class{constructor(){throw Error('start failure');}};await assert.rejects(videoFileIdentity(new Blob(['abc'])),/start failure/);}finally{if(original===undefined)delete globalThis.Worker;else globalThis.Worker=original;}
 await withWorker(async()=>{
  for(const trigger of [w=>w.onerror({message:'worker error',preventDefault(){}}),w=>w.onmessageerror(),w=>w.send({type:'progress',loaded:4,total:3}),w=>w.send({type:'done',identity:expected('abc')}),w=>w.send({type:'unknown'}),w=>w.send({type:'error',name:'NotReadableError',message:'read failed'})]){
   const promise=videoFileIdentity(new Blob(['abc'])),worker=ControlledWorker.instances.at(-1);trigger(worker);await assert.rejects(promise);assert.equal(worker.terminations,1);assert.equal(worker.onmessage,null);
  }
 });
});
console.log(JSON.stringify({passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,scope:'Actual Node Blob/File incremental core reads and SHA256 oracle plus controlled browser-wrapper lifecycle. Controlled Worker tests are not actual browser Worker execution, UI save/recall or native acceptance.'},null,2));assert(checks.every(check=>check.passed));
