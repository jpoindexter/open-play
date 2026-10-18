import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createAudioMonitor} from '../prototype/audio-monitor.js';
import {createAudioOutputSelection} from '../prototype/audio-output.js';
const turn=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const checks=[];
async function check(name,run){try{checks.push({name,passed:true,evidence:await run()});}catch(error){checks.push({name,passed:false,error:error.message});}}
function monitorFixture(){
 const context={currentTime:0,destination:{maxChannelCount:4,channelCount:2},nodes:[]};
 const node=()=>{const gain={value:1,target:1,cancelScheduledValues(){},setValueAtTime(value){if(this.failure)throw this.failure;this.target=value;}};const n={gain,connect(){},disconnect(){}};context.nodes.push(n);return n;};
 context.createGain=context.createChannelSplitter=context.createChannelMerger=node;
 const monitor=createAudioMonitor(context,{master:node(),deckTaps:[node()]});
 return{context,monitor,param:monitor.physicalOutput.gain};
}
await check('Mute status follows accepted target while AudioParam.value still reports the previous render quantum',()=>{
 const f=monitorFixture();f.monitor.mutePhysical(true);assert.equal(f.param.value,1);assert.equal(f.param.target,0);assert.equal(f.monitor.snapshot().physicalMuted,true);
 f.param.value=f.param.target;f.monitor.mutePhysical(false);assert.equal(f.param.value,0);assert.equal(f.param.target,1);assert.equal(f.monitor.snapshot().physicalMuted,false);
 return{renderValueAfterUnmuteCommand:f.param.value,scheduledTarget:f.param.target,commandedMuted:f.monitor.snapshot().physicalMuted};
});
await check('A rejected gain schedule cannot falsely change the reported mute target',()=>{
 const f=monitorFixture();f.monitor.mutePhysical(true);f.param.failure=Error('Schedule failed');assert.throws(()=>f.monitor.mutePhysical(false),/Schedule failed/);assert.equal(f.monitor.snapshot().physicalMuted,true);
 return{commandedMuted:f.monitor.snapshot().physicalMuted};
});
function selectionFixture(){
 const f=monitorFixture(),gate=deferred(),events=[],changes=[];
 const context={state:'suspended',sinkId:'',resume(){throw Error('Output selection must not start audio');},async setSinkId(id){events.push(id);await gate.promise;this.sinkId=id;}};
 const engine={ctx:context,audioMonitor:f.monitor,init(){}};
 const selection=createAudioOutputSelection(engine,{devices:{async enumerateDevices(){return[{kind:'audiooutput',deviceId:'A',label:'Selected output'}];}},onChange:value=>changes.push(value)});
 return{...f,context,selection,gate,events,changes};
}
await check('Completed stopped selection clears pending and stale MUTED status without context resume or deck Play',async()=>{
 const f=selectionFixture();await f.selection.list();const result=f.selection.select('A');await turn();assert.equal(f.selection.snapshot().pending.label,'Selected output');assert.equal(f.selection.snapshot().routing.physicalMuted,true);
 f.param.value=0;f.gate.resolve();const value=await result;assert.equal(value.pending,null);assert.equal(value.routing.physicalMuted,false);assert.equal(f.param.value,0);assert.equal(f.param.target,1);assert.equal(f.context.state,'suspended');assert.equal(value.deviceId,'A');assert.equal(value.routing.layout,'stereo');
 return{state:f.context.state,events:f.events,pending:value.pending,commandedMuted:value.routing.physicalMuted,rawParamValue:f.param.value};
});
await check('Selection rejection clears pending and preserves the observed error without claiming completion',async()=>{
 const f=selectionFixture();const result=f.selection.select('A').then(()=>null,error=>error);await turn();f.gate.reject(Object.assign(Error('Selection denied'),{name:'NotAllowedError'}));const error=await result;assert.equal(error.name,'NotAllowedError');assert.equal(f.selection.snapshot().pending,null);assert.equal(f.selection.snapshot().lastError,'Selection denied');assert.equal(f.context.sinkId,'');
 return{error:error.name,deviceId:f.context.sinkId};
});
await check('Disposal during actual sink selection cannot reopen the graph or emit late callbacks',async()=>{
 const f=selectionFixture();const result=f.selection.select('A');await turn();f.selection.dispose();const count=f.changes.length;f.gate.resolve();assert.equal(await result,false);assert.equal(f.monitor.snapshot().physicalMuted,true);assert.equal(f.changes.length,count);
 return{lateCallbacks:0,commandedMuted:f.monitor.snapshot().physicalMuted};
});
const report={passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,scope:'Actual monitor and output controller with controlled render-quantum lag and asynchronous sink. Proves commanded UI state and ownership, not rendered PCM, native OS sink or physical sockets.',checks};
await writeFile(process.argv[2]||'docs/prototype/audio-output-stopped-status-contract-results.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
