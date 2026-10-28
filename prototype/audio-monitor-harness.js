import {createAudioMonitor} from './audio-monitor.js';
const $=x=>document.querySelector(x),checks=[],assert=(value,message)=>{if(!value)throw Error(message);};
function source(context,left,right){const buffer=context.createBuffer(2,4096,context.sampleRate);buffer.getChannelData(0).fill(left);buffer.getChannelData(1).fill(right);const node=context.createBufferSource();node.buffer=buffer;node.start();return node;}
async function render({channels=4,layout='four-channel',settings={mix:0,volume:.1},pfl=[[0,true,1]],pairs,setup}={}){
 const context=new OfflineAudioContext(channels,4096,48000),master=source(context,.2,.4),taps=[source(context,.1,.3),source(context,.5,.7)];
 const initialDestination={channelCount:context.destination.channelCount,maxChannelCount:context.destination.maxChannelCount};
 const monitor=createAudioMonitor(context,{master,deckTaps:taps,settings});
 try{if(layout==='four-channel')monitor.connectPhysical(layout,pairs);}catch(error){error.destinationEvidence={initial:initialDestination,afterStereoSetup:monitor.snapshot()};monitor.dispose();throw error;}for(const args of pfl)monitor.setPFL(...args);await setup?.({monitor,master,taps,context});
 const snapshot=monitor.snapshot(),buffer=await context.startRendering(),summary=[];
 for(let channel=0;channel<buffer.numberOfChannels;channel++){const all=buffer.getChannelData(channel),startFrame=Math.ceil(.01*buffer.sampleRate),data=all.subarray(startFrame);let min=Infinity,max=-Infinity,power=0;const nonfinite=all.reduce((n,value)=>n+!Number.isFinite(value),0);for(const value of data){min=Math.min(min,value);max=Math.max(max,value);power+=value*value;}summary.push({channel:channel+1,frames:all.length,measuredStartFrame:startFrame,measuredFrames:data.length,min,max,rms:Math.sqrt(power/data.length),nonfinite});}
 monitor.dispose();return{snapshot,summary};
}
function channels(result,expected){assert(result.summary.length===expected.length,'Channel count differs');for(let i=0;i<expected.length;i++){const s=result.summary[i];assert(!s.nonfinite&&Math.abs(s.min-expected[i])<2e-6&&Math.abs(s.max-expected[i])<2e-6,`Channel${i+1}: expected${expected[i]}, observed${JSON.stringify(s)}`);}}
$('#run').onclick=async()=>{checks.length=0;$('#run').disabled=true;const report={startedAt:new Date().toISOString(),sourceHashes:{},checks,scope:'Actual OfflineAudioContext PCM,4096frames perchannel percase; allframes checked finite, routing levels measured after the intentional10ms Cue fade. Physical output untouched. No real device selection/unplug/Serato sonic equivalence.'};
 for(const file of ['audio-monitor.js','audio-monitor-harness.js']){const b=await(await fetch(file)).arrayBuffer();report.sourceHashes[file]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');}
 const check=async(name,options,expected)=>{let evidence;try{evidence=await render(options);channels(evidence,expected);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence: evidence||error.destinationEvidence,error:error.message,stack:error.stack});}$('#results').textContent=JSON.stringify(report,null,2);};
 await check('Stereo output contains only master; selected cue never folds into physical stereo',{layout:'stereo'},[.2,.4,0,0]);
 await check('Four channels separate stereo master1/2 and selectedcue3/4',{},[.2,.4,.1,.3]);
 await check('Unselected second deck never appears in cue', {pfl:[[1,true,1]]},[.2,.4,.5,.7]);
 await check('Multiple selected cue decks sum without changing master',{pfl:[[0,true,1],[1,true,1]]},[.2,.4,.6,1]);
 await check('Cue trim changes only selected cue bus',{pfl:[[0,true,.5]]},[.2,.4,.05,.15]);
 await check('Cue/master mix uses actual stereo bus signals',{settings:{mix:.25,volume:.1}},[.2,.4,.125,.325]);
 await check('Full master monitoring excludes cue bus',{settings:{mix:1,volume:.1}},[.2,.4,.2,.4]);
 await check('Master Cue overrides mix and Split Cue to master-only stereo',{settings:{mix:0,volume:.1,masterCue:true,splitCue:true}},[.2,.4,.2,.4]);
 await check('Split Cue puts averagedcue left and averagedmaster right',{settings:{mix:.5,volume:.1,splitCue:true}},[.2,.4,.1,.15]);
 await check('Mono master uses both source channels without changing cue',{settings:{mix:0,volume:.1,mono:true}},[.3,.3,.1,.3]);
  await check('Master Cue follows actual mono master output',{settings:{mix:0,volume:.1,mono:true,masterCue:true}},[.3,.3,.3,.3]);
 await check('Cue volume0 silences only headphone bus',{settings:{mix:0,volume:0}},[.2,.4,0,0]);
 await check('Cue volume100 applies12dB relative to unity10percent',{settings:{mix:0,volume:1}},[.2,.4,.3981071705534972,1.1943215116604917]);
 await check('Swapped stereo channel pairs keep buses isolated',{pairs:{masterStart:2,cueStart:0}},[.1,.3,.2,.4]);
 await check('Repeated layout changes leave exactly one master and cue route',{setup:({monitor})=>{for(let i=0;i<25;i++){monitor.connectPhysical('stereo');monitor.connectPhysical('four-channel');}}},[.2,.4,.1,.3]);
 await check('Physical mute silences all output without deleting cue settings',{setup:({monitor})=>monitor.mutePhysical()},[0,0,0,0]);
 await check('Terminal cleanup preserves an independent existing master connection',{setup:({monitor,master,context})=>{master.connect(context.destination);monitor.dispose();}},[.2,.4,0,0]);
 await check('Actual two-channel destination rejects quad and keeps prior stereo route',{channels:2,layout:'stereo',setup:({monitor})=>{let error;try{monitor.connectPhysical('four-channel');}catch(e){error=e;}assert(error?.name==='NotSupportedError','Quad did not fail explicitly on2channels');}},[.2,.4]);
 report.passed=checks.filter(x=>x.passed).length;report.failed=checks.length-report.passed;$('#status').textContent=`${report.passed}passed /${report.failed}failed`;$('#results').textContent=JSON.stringify(report,null,2);const link=$('#download');link.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));link.download='audio-monitor-browser-results.json';link.hidden=false;$('#run').disabled=false;
};
