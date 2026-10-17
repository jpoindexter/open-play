// Actual mixer with controlled DOM, decode/frame, hash and pipeline collaborators.
// These tests deliberately do not claim real File hashing, decoding or pixels.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const original=await readFile(new URL('../prototype/video.js',import.meta.url),'utf8');
const source=original.replace("import {createVideoPipeline} from './video-pipeline.js';",'const createVideoPipeline=(...args)=>globalThis.__presetPipeline(...args);')
 .replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${new URL('../prototype/'+path.slice(2),import.meta.url).href}'`);
assert.notEqual(source,original);
const {createVideoMixer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
const key=n=>'sha256:'+n.toString(16).padStart(64,'0');
const fx=(name='Negative',value=1,params={})=>[{name,on:true,value,params}];
const saved=(n,effects=fx())=>({version:1,key:key(n),name:'File '+n,fx:effects});
let serial=0;
function environment(initial=[]){
 const e={videos:[],hashes:[],revoked:[],pipelines:[],notifications:[]},urls=new Map();
 globalThis.performance={now:()=>1000};
 globalThis.URL.createObjectURL=file=>{const url='blob:preset-controlled-'+(++serial);urls.set(url,file);return url;};
 globalThis.URL.revokeObjectURL=url=>e.revoked.push(url);
 const canvas=()=>{const c={width:640,height:360,isConnected:true},ctx={canvas:c,save(){},restore(){},setTransform(){},clearRect(){},fillRect(){},fillText(){},drawImage(){}};c.getContext=()=>ctx;return c;};
 globalThis.document={querySelector:()=>null,createElement(type){if(type==='canvas')return canvas();assert.equal(type,'video');const video={readyState:2,videoWidth:320,videoHeight:180,seeking:false,duration:3,currentTime:0,paused:true,playbackRate:1,load(){},pause(){this.paused=true;},play(){this.paused=false;queueMicrotask(()=>{const cb=this.frameCallback;this.frameCallback=null;cb?.(1000,{mediaTime:0,presentedFrames:1,width:320,height:180});});return Promise.resolve();},requestVideoFrameCallback(cb){this.frameCallback=cb;return 1;},cancelVideoFrameCallback(){this.frameCallback=null;},decoded(){this.onloadeddata();}};e.videos.push(video);return video;}};
 globalThis.__presetPipeline=()=>{const p={resets:[],reset(target){p.resets.push(target??'all');},dispose(){p.disposed=true;},diagnostics(){return{};},render(inputs){return{output:canvas(),channels:inputs};}};e.pipelines.push(p);return p;};
 e.state={settings:{},decks:[{index:0,track:{id:'audio-a',bpm:120},position:0,playing:false,rate:1},{index:1,track:null,position:0,playing:false,rate:1}],video:{linked:false,cross:-1,savedVideoFX:initial,fx:{left:[],right:[],master:[]}}};
 e.engine={resume:async()=>{},position:d=>d.position,cross:0,nodes:[{level:1},{level:1}],videoAnalysis:()=>({bass:0,mid:0,treble:0,level:0,audioAvailable:true})};
 e.identify=(file,options)=>{const gate=deferred();e.hashes.push({file,options,...gate});return gate.promise;};
 e.mixer=createVideoMixer({state:e.state,engine:e.engine,notify:m=>e.notifications.push(m),identifyFile:e.identify});e.mixer.bind(canvas());
 e.begin=async(file,index=0)=>{const promise=e.mixer.load(index,file),video=e.videos.at(-1);video.decoded();await flush();return{promise,video};};
 e.load=async(file={name:'File.mp4'},identity=key(1),index=0)=>{const before=e.hashes.length,result=await e.begin(file,index);if(e.hashes.length>before)e.hashes.at(-1).resolve(identity);await result.promise;return result.video;};
 return e;
}
const checks=[];
async function test(name,run){try{await run();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.stack});}}

await test('Save snapshots slots at invocation rather than after deferred hashing',async()=>{
 const e=environment();await e.load();e.state.video.fx.left=fx('Gamma',.25,{behavior:'Manual Meaning',shadowPower:2});
 const saving=e.mixer.saveVideoFX(0);e.state.video.fx.left=fx('Negative');e.hashes[0].resolve(key(1));const r=await saving;
 assert.equal(r.fx[0].name,'Gamma');assert.equal(r.fx[0].value,.25);assert.equal(e.mixer.exportVideoFX().records[0].fx[0].name,'Gamma');await e.mixer.dispose();
});
await test('Newer save wins even when canceled older hash resolves last',async()=>{
 const e=environment();await e.load();e.state.video.fx.left=fx('Negative');const old=e.mixer.saveVideoFX(0);
 e.state.video.fx.left=fx('Gamma',1,{behavior:'Manual Meaning',shadowPower:3});const latest=e.mixer.saveVideoFX(0);assert(e.hashes[0].options.signal.aborted);
 e.hashes[1].resolve(key(1));assert.equal((await latest).fx[0].name,'Gamma');e.hashes[0].resolve(key(1));assert.equal(await old,null);
 assert.equal(e.mixer.exportVideoFX().records[0].fx[0].params.shadowPower,3);await e.mixer.dispose();
});
await test('A replacement load invalidates old save without leaking cached identity to the new File',async()=>{
 const e=environment();await e.load({name:'same.mp4',marker:'A'});const saving=e.mixer.saveVideoFX(0),old=e.hashes[0];
 await e.load({name:'same.mp4',marker:'B'},key(2));old.resolve(key(1));assert.equal(await saving,null);assert.deepEqual(e.mixer.exportVideoFX().records,[]);
 assert.equal(e.mixer.diagnostics().savedFX.channels[0].identity,null);await e.mixer.dispose();
});
await test('Newer decoded File and its automatic recall survive stale lookup completion',async()=>{
 const e=environment([saved(1),saved(2,fx('Gamma',1,{behavior:'Manual Meaning',shadowPower:2}))]);await e.load({name:'kept.mp4'},key(1));
 const old=await e.begin({name:'old.mp4'}),oldHash=e.hashes.at(-1),latest=await e.begin({name:'new.mp4'}),newHash=e.hashes.at(-1);
 newHash.resolve(key(2));await latest.promise;oldHash.resolve(key(1));assert.equal(await old.promise,null);
 assert.equal(e.mixer.diagnostics().inputs[0].name,'new.mp4');assert.equal(e.state.video.fx.left[0].name,'Gamma');assert(e.revoked.includes(old.video.src));await e.mixer.dispose();
});
await test('Automatic lookup rejects a changed audio owner before committing a decoded replacement',async()=>{
 const e=environment([saved(1)]);await e.load({name:'kept.mp4'},key(1));const pending=await e.begin({name:'stale.mp4'}),hash=e.hashes.at(-1);
 e.state.decks[0].track={id:'new-audio',bpm:128};hash.resolve(key(1));assert.equal(await pending.promise,null);assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');assert(e.revoked.includes(pending.video.src));await e.mixer.dispose();
});
await test('Audio-only metadata change leaves saving the same currently decoded File content valid',async()=>{
 const e=environment();await e.load({name:'kept.mp4'});e.state.video.fx.left=fx('Gamma',.3,{behavior:'Manual Meaning',shadowPower:2});const pending=e.mixer.saveVideoFX(0);
 e.state.decks[0].track={id:'new-audio',bpm:128};e.hashes[0].resolve(key(1));const r=await pending;assert.equal(r.key,key(1));assert.equal(r.name,'kept.mp4');assert.equal(r.fx[0].value,.3);assert.equal(e.mixer.exportVideoFX().records.length,1);await e.mixer.dispose();
});
await test('Disposal aborts pending save and prevents metadata/cache resurrection',async()=>{
 const e=environment();await e.load();const pending=e.mixer.saveVideoFX(0),hash=e.hashes[0];await e.mixer.dispose();assert(hash.options.signal.aborted);hash.resolve(key(1));assert.equal(await pending,null);assert.deepEqual(e.mixer.exportVideoFX().records,[]);
});
await test('Disposal aborts pending automatic lookup and rejects decoded candidate ownership',async()=>{
 const e=environment([saved(1)]),pending=await e.begin({name:'late.mp4'}),hash=e.hashes[0];await e.mixer.dispose();hash.resolve(key(1));assert.equal(await pending.promise,null);assert(e.revoked.includes(pending.video.src));
});
await test('Cancel automatic lookup preserves prior decoded clip and current channel settings',async()=>{
 const e=environment([saved(1)]);await e.load({name:'kept.mp4'},key(1));e.state.video.fx.left=fx('Gamma',.4,{behavior:'Manual Meaning',shadowPower:2});
 const pending=await e.begin({name:'candidate.mp4'}),hash=e.hashes.at(-1);assert(e.mixer.cancelVideoFX(0));assert(hash.options.signal.aborted);hash.resolve(key(1));assert.equal(await pending.promise,null);
 assert.equal(e.mixer.diagnostics().inputs[0].name,'kept.mp4');assert.equal(e.state.video.fx.left[0].name,'Gamma');assert.match(e.mixer.diagnostics().savedFX.channels[0].status,/canceled/);await e.mixer.dispose();
});
await test('Cancel pending save creates neither record nor decoded-item identity cache',async()=>{
 const e=environment();await e.load();const saving=e.mixer.saveVideoFX(0),hash=e.hashes[0];assert(e.mixer.cancelVideoFX(0));hash.resolve(key(1));assert.equal(await saving,null);
 assert.equal(e.mixer.diagnostics().savedFX.channels[0].identity,null);assert.deepEqual(e.mixer.exportVideoFX().records,[]);assert.equal(e.mixer.diagnostics().inputs[0].name,'File.mp4');await e.mixer.dispose();
});
await test('Only the current decoded item caches identity; repeated save/recall avoids redundant hash work',async()=>{
 const e=environment();await e.load({name:'same.mp4',marker:'A'});const saving=e.mixer.saveVideoFX(0);e.hashes[0].resolve(key(1));await saving;
 await e.mixer.saveVideoFX(0);await e.mixer.recallVideoFX(0);assert.equal(e.hashes.length,1);
 const replacement=await e.begin({name:'same.mp4',marker:'B'});assert.equal(e.hashes.length,2);assert.equal(e.hashes[1].file.marker,'B');e.hashes[1].resolve(key(2));await replacement.promise;assert.equal(e.mixer.diagnostics().savedFX.channels[0].identity,key(2));await e.mixer.dispose();
});
await test('Explicit recall resets only its target without changing other-channel or master FX',async()=>{
 const e=environment([saved(1)]);await e.load();e.state.video.fx.left=fx('Gamma');e.state.video.fx.right=fx('Gamma',.2);e.state.video.fx.master=fx('Gamma',.3);e.mixer.tick(true);e.pipelines[0].resets=[];
 const before=JSON.stringify([e.state.video.fx.right,e.state.video.fx.master]);await e.mixer.recallVideoFX(0);assert.equal(e.state.video.fx.left[0].name,'Negative');assert.deepEqual(e.pipelines[0].resets,['left']);assert.equal(JSON.stringify([e.state.video.fx.right,e.state.video.fx.master]),before);await e.mixer.dispose();
});
await test('No-match automatic lookup retains channel FX and explicit recall reports no saved record',async()=>{
 const e=environment([saved(1)]);e.state.video.fx.left=fx('Gamma',.2);await e.load({name:'unmatched.mp4'},key(2));assert.equal(e.state.video.fx.left[0].name,'Gamma');
 await assert.rejects(e.mixer.recallVideoFX(0),/No saved FX/);assert.equal(e.hashes.length,1);await e.mixer.dispose();
});

console.log(JSON.stringify({scope:'Executed actual Video mixer lifecycle with controlled DOM/frame/hash/pipeline collaborators. Does not prove actual browser decode, File bytes, module Worker hashing, GPU pixels, persistence/UI or native behavior.',passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks},null,2));
if(checks.some(c=>!c.passed))process.exitCode=1;
