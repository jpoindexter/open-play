import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createMIDIAssignment} from '../prototype/midi-assignment.js';
import {createVideoMIDIRouter,videoMIDITargets} from '../prototype/video-midi.js';
import {decodeMIDI,mappedValue,keyShiftSemitones,matchesMIDIMap} from '../prototype/midi.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Choose a new immutable output');
const source=fs.readFileSync('prototype/panels.js','utf8'),start=source.indexOf('  async function receiveMIDI('),region=source.slice(start,source.indexOf('  function midi()',start));
const msg=(value,{deviceId='A',type='Note',channel=1,number=60}={})=>({...decodeMIDI([(type==='CC'?0xb0:0x90)+channel-1,number,value]),timestamp:0,deviceId,device:deviceId});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
function host({type='Note',number=60,pending=null}={}){
 const state={video:{cross:.7,crossLinked:false,auto:false},mappings:[{target:'Sampler 1',type,number,channel:1,encoding:'7-bit absolute'}],midiLog:[],decks:[{},{}],bank:0,samples:Array.from({length:2},()=>[{mode:'Hold',playing:false}])};
 const calls=[];const engine={stopSample:key=>calls.push(['stop',key])};
 const router=createVideoMIDIRouter({state,videoMixer:{stopCrossfade:()=>calls.push(['cross'])}});
 const assignment=createMIDIAssignment({state,targetSpec:t=>videoMIDITargets.find(x=>x.target===t)});router.assignment=assignment;
 const compiled=new Function('s','mappedValue','keyShiftSemitones','midiPairs','a','$','engine','renderTracks','matchesMIDIMap','videoMIDI','sampleAction','refresh','createMIDI','notify','sampleVisuals',
 'let learn=false,learnedType="CC",midiInputs=[],midiStatus="",midiSourceIds=new Set();const midiSampleHolds=new Map();'+region+';return {receive:receiveMIDI,onState:midiInput.onState,holds:midiSampleHolds};')(
 state,mappedValue,keyShiftSemitones,new Map(),{},()=>({value:0}),engine,()=>{},matchesMIDIMap,router,async()=>{calls.push(['play',state.bank*8]);if(pending)await pending.promise},()=>{},x=>x,()=>{},()=>{});
 return{state,calls,assignment,...compiled};
}
const checks=[];async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence})}catch(error){checks.push({name,passed:false,evidence,error:error.message})}}
await check('Only exact device/type/channel/controller release stops the accepted Hold owner',async e=>{
 const h=host();await h.receive(msg(127));h.assignment.start();
 for(const variant of [{deviceId:'B'},{type:'CC'},{channel:2},{number:61}])await h.receive(msg(0,variant));
 e.beforeExact=h.calls.slice();assert.deepEqual(e.beforeExact,[['play',0]]);assert.equal(h.holds.size,1);
 await h.receive(msg(0));e.afterExact=h.calls.slice();assert.deepEqual(e.afterExact,[['play',0],['stop',0]]);assert.equal(h.holds.size,0);
});
await check('Captured release survives bank and mapping replacement without stopping another bank',async e=>{
 const h=host();await h.receive(msg(127));h.state.bank=1;h.state.mappings=[];h.assignment.start();await h.receive(msg(0));e.calls=h.calls;
 assert.deepEqual(h.calls,[['play',0],['stop',0]]);assert.equal(h.holds.size,0);
});
await check('Hold ownership is reserved before awaited onset and can be released during assignment',async e=>{
 const pending=deferred(),h=host({pending});const onset=h.receive(msg(127));e.ownersBeforeAwait=h.holds.size;h.assignment.start();await h.receive(msg(0));e.beforeOnsetSettles=h.calls.slice();
 pending.resolve();await onset;e.afterOnsetSettles=h.calls.slice();assert.equal(e.ownersBeforeAwait,1);assert.deepEqual(h.calls,[['play',0],['stop',0]]);assert.equal(h.holds.size,0);
});
await check('Assignment-time CC Hold release performs cleanup without falling through to mapped Video fader',async e=>{
 const h=host({type:'CC',number:20});h.state.mappings.push({target:'Video crossfader',type:'CC',number:20,channel:1,encoding:'7-bit absolute'});
 await h.receive(msg(127,{type:'CC',number:20}));const cross=h.state.video.cross,crossCalls=h.calls.filter(x=>x[0]==='cross').length;
 h.assignment.start();await h.receive(msg(0,{type:'CC',number:20}));e.crossBefore=cross;e.crossAfter=h.state.video.cross;e.calls=h.calls;
 assert.equal(e.crossAfter,cross);assert.equal(h.calls.filter(x=>x[0]==='cross').length,crossCalls);assert(h.calls.some(x=>x[0]==='stop'&&x[1]===0));
});
await check('Disconnect retires only removed input owners and keeps another input owner until its release',async e=>{
 const h=host(),input=id=>({id,name:id,state:'connected'});h.onState([input('A'),input('B')]);await h.receive(msg(127));h.state.bank=1;await h.receive(msg(127,{deviceId:'B'}));
 h.assignment.start();h.onState([input('B')]);e.afterDisconnect=h.calls.slice();assert.deepEqual(e.afterDisconnect,[['play',0],['play',8],['stop',0]]);assert.equal(h.holds.size,1);
 await h.receive(msg(0,{deviceId:'B'}));e.final=h.calls.slice();assert.deepEqual(e.final,[['play',0],['play',8],['stop',0],['stop',8]]);assert.equal(h.holds.size,0);
});
const paths=['prototype/panels.js','prototype/midi-assignment.js','prototype/midi.js','prototype/video-midi.js'];const result={scope:'Actual extracted receiveMIDI and onState + actual assignment/router; controlled sample-onset Promise and stop witnesses. No actual sample AudioEngine/PCM/browser/native/physical acceptance.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks,sourceHashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
