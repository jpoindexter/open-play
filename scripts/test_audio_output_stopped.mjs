import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createAudioOutputSelection} from '../prototype/audio-output.js';
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const rows=[];
function fixture(){
 const events=[],changes=[],resume=deferred();resume.promise.catch(()=>{});
 const context={state:'suspended',sinkId:'',resume(){events.push('resume');return resume.promise.then(()=>{this.state='running';});},async setSinkId(id){events.push('setSink:'+id);assert.equal(this.state,'running','A suspended sink must not be switched before resume');this.sinkId=id;}};
 const monitor={muted:false,layout:'stereo',mutePhysical(v){this.muted=v;events.push('mute:'+v);},connectPhysical(layout){this.layout=layout;events.push('connect:'+layout);},snapshot(){return{layout:this.layout,physicalMuted:this.muted};}};
 const engine={ctx:context,audioMonitor:monitor,init(){}};
 const devices={async enumerateDevices(){return[{kind:'audiooutput',deviceId:'A',label:'Selected output'}];}};
 const selection=createAudioOutputSelection(engine,{devices,onChange:value=>changes.push(value)});
 return{context,monitor,selection,resume,events,changes};
}
async function check(name,run){try{const evidence=await run();rows.push({name,passed:true,evidence});}catch(error){rows.push({name,passed:false,error:error.message});}}
await check('Stopped selection resumes the muted engine, selects the sink and settles stereo without any deck Play',async()=>{
 const f=fixture();await f.selection.list();const result=f.selection.select('A');const observed=result.catch(()=>{});await turn();
 const pending=f.selection.snapshot().pending;f.resume.resolve();await observed;
 assert.equal(f.events[1],'resume');assert.equal(f.monitor.muted,false);assert.equal(f.context.sinkId,'A');assert.equal(f.monitor.layout,'stereo');
 assert.equal(pending?.phase,'resuming');assert.equal(f.selection.snapshot().pending,null);
 assert.deepEqual(f.events,['mute:true','resume','setSink:A','connect:stereo','mute:false']);
 return{events:f.events,visiblePending:pending,deckStartCalls:0};
});
await check('A failed resume reports the error, never switches sink and clears the visible pending state',async()=>{
 const f=fixture();const outcome=f.selection.select('A').then(()=>null,error=>error);await turn();f.resume.reject(Object.assign(Error('Audio start denied'),{name:'NotAllowedError'}));const error=await outcome;
 assert.equal(error?.name,'NotAllowedError');assert(!f.events.some(x=>x.startsWith('setSink:')));assert.equal(f.selection.snapshot().pending,null);assert.equal(f.selection.snapshot().lastError,'Audio start denied');
 return{events:f.events,error:error.name};
});
await check('Disposal while resume is pending cannot select a sink or reopen physical output afterward',async()=>{
 const f=fixture();const outcome=f.selection.select('A').catch(error=>({error:error.message}));await turn();f.selection.dispose();const count=f.changes.length;f.resume.resolve();const result=await outcome;
 assert.equal(result,false);assert(!f.events.some(x=>x.startsWith('setSink:')));assert.equal(f.monitor.muted,true);assert.equal(f.changes.length,count);
 return{events:f.events,lateCallbacks:0};
});
await check('A newer selection supersedes a pending resume before any obsolete sink switch',async()=>{
 const f=fixture();const first=f.selection.select('A').catch(error=>({error:error.message}));await turn();const second=f.selection.select('B');const caught=second.catch(()=>{});f.resume.resolve();assert.equal(await first,false);await caught;
 assert.equal(await second instanceof Object,true);assert.equal(f.context.sinkId,'B');assert(!f.events.includes('setSink:A'));assert.equal(f.monitor.muted,false);assert.equal(f.selection.snapshot().pending,null);
 return{events:f.events,finalSink:f.context.sinkId};
});
const report={passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,scope:'Actual output selection controller with controlled suspended context and asynchronous resume. Not native OS sink, rendered audio or physical sockets.',checks:rows};
const output=process.argv[2]||'docs/prototype/audio-output-stopped-contract-results.json';await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
