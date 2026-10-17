// Independent actual-dispatch review; no GUI/audio/production writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createVideoMIDIRouter,videoMIDITargets} from '../prototype/video-midi.js';
import {mappedValue,keyShiftSemitones,matchesMIDIMap,decodeMIDI} from '../prototype/midi.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Choose a NEW explicit result path');
const panels=fs.readFileSync('prototype/panels.js','utf8');
const begin=panels.indexOf('  async function receiveMIDI(');
const receiveSource=panels.slice(begin,panels.indexOf('  const midiInput =',begin));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const note=value=>({...decodeMIDI([0x90,60,value]),deviceId:'A',device:'A',timestamp:0});
const cc=value=>({...decodeMIDI([0xb0,20,value]),deviceId:'A',device:'A',timestamp:0});
const mapping=(target,type='Note',number=60)=>({target,type,number,channel:1,encoding:'7-bit absolute'});
function host(mappings,save=async()=>{}){
 const state={video:{crossLinked:false,linked:false,audioFXLink:false},mappings,midiLog:[],decks:[{},{}],samples:[[{mode:'Hold',playing:false}]],bank:0};
 const calls=[];let playing=false;
 const mixer={stopCrossfade(){calls.push('stopCrossfade')},saveVideoFX:save};
 const router=createVideoMIDIRouter({state,videoMixer:mixer});
 const receive=new Function('s','mappedValue','keyShiftSemitones','midiPairs','a','$','engine','renderTracks','matchesMIDIMap','videoMIDI','sampleAction','refresh',
   'let learn=false,learnedType="CC";'+receiveSource+';return receiveMIDI;')(
   state,mappedValue,keyShiftSemitones,new Map(),{},()=>null,{stopSample(){playing=false;calls.push('sampler-stop')}},()=>{},matchesMIDIMap,router,
   async()=>{playing=true;calls.push('sampler-play')},()=>{});
 return{state,router,receive,calls,isPlaying:()=>playing};
}
const checks=[];async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.message});}}
await check('Pending Video save must not defer same-input Hold sampler onset until after Note off',async e=>{
 const pending=deferred(),h=host([mapping('Video left save FX'),mapping('Sampler 1')],()=>pending.promise);
 const on=h.receive(note(127));await h.receive(note(0));e.beforeSave=h.calls.slice();pending.resolve();await on;
 e.afterSave=h.calls.slice();e.playing=h.isPlaying();assert.equal(e.playing,false,'Hold sampler must remain stopped after its release');
});
await check('Adding an unrelated mapping must not rearm a still-held existing Video toggle',async e=>{
 const h=host([mapping('Video crossfader link','CC',20)]);await h.receive(cc(127));e.beforeEdit=h.state.video.crossLinked;
 const values={'#midi-type':'CC','#midi-encoding':'7-bit absolute','#midi-channel':'1','#midi-number':'21','#midi-target':'Library browse'};
 const nodes=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value}]));nodes['#midi-add']={};
 const addStart=panels.indexOf('        $("#midi-add").onclick = () => {');
 const addSource=panels.slice(addStart,panels.indexOf("        $('#midi-mappings').onclick",addStart));
 new Function('$','s','videoMIDI','videoMIDITargets','persist','midi','notify','let reassignMapping=null;'+addSource)(k=>nodes[k],h.state,h.router,videoMIDITargets,()=>{},()=>{},error=>{throw Error(error)});
 nodes['#midi-add'].onclick();await h.receive(cc(127));e.afterRepeatedHeld=h.state.video.crossLinked;e.mappingCount=h.state.mappings.length;
 assert.equal(e.afterRepeatedHeld,e.beforeEdit,'Unrelated editor Add must preserve held edge');
});
await check('Unrelated input enumeration preserves held sources; removal resets only removed source',async e=>{
 const h=host([mapping('Video crossfader link','CC',20)]);
 const start=panels.indexOf('  const midiInput = createMIDI('),end=panels.indexOf('  function midi()',start);let callbacks;
 new Function('createMIDI','videoMIDI','$','notify','receiveMIDI','let midiSourceIds=new Set(),midiInputs=[],midiStatus="";'+panels.slice(start,end))(
  value=>{callbacks=value;return{}},h.router,()=>null,()=>{},h.receive);
 const input=id=>({id,name:id,state:'connected'});
 callbacks.onState([input('A'),input('B')]);await h.receive(cc(127));await h.receive({...cc(127),deviceId:'B',device:'B'});e.bothHeld=h.state.video.crossLinked;
 callbacks.onState([input('A'),input('B'),input('C')]);await h.receive(cc(127));e.unrelatedAdded=h.state.video.crossLinked;
 callbacks.onState([input('A'),input('C')]);await h.receive(cc(127));e.otherRemoved=h.state.video.crossLinked;
 callbacks.onState([input('A'),input('B'),input('C')]);await h.receive({...cc(127),deviceId:'B',device:'B'});e.removedSourceRearmed=h.state.video.crossLinked;
 assert.equal(e.bothHeld,false);assert.equal(e.unrelatedAdded,false);assert.equal(e.otherRemoved,false);assert.equal(e.removedSourceRearmed,true);
});
await check('A refused linked Video fader cannot prevent another same-input Hold mapping and reports its original error',async e=>{
 const h=host([mapping('Video crossfader'),mapping('Sampler 1')]);h.state.video.crossLinked=true;
 const result=await h.receive(note(127)).then(()=>({ok:true}),error=>({ok:false,message:error.message}));e.result=result;e.afterPress=h.calls.slice();
 await h.receive(note(0)).catch(()=>{});e.playing=h.isPlaying();
 assert.equal(result.ok,false);assert.match(result.message,/Unlink the Video crossfader/);assert.deepEqual(e.afterPress,['sampler-play']);assert.equal(e.playing,false);
});
await check('Two refused matching targets preserve both errors without blocking a valid target',async e=>{
 const h=host([mapping('Video crossfader'),mapping('Video unknown target'),mapping('Sampler 1')]);h.state.video.crossLinked=true;
 const error=await h.receive(note(127)).then(()=>null,error=>error);e.errorType=error?.constructor.name;e.errors=error?.errors?.map(x=>x.message);e.calls=h.calls.slice();
 assert(error instanceof AggregateError);assert.equal(error.errors.length,2);assert.match(e.errors[0],/Unlink the Video crossfader/);assert.match(e.errors[1],/Unknown Video MIDI target/);assert.deepEqual(e.calls,['sampler-play']);
});
const files=['prototype/video-midi.js','prototype/panels.js','prototype/video-controls.js','prototype/midi.js','prototype/video-midi-harness.js'];
const result={scope:'Actual extracted receiveMIDI and Add handler with real router; controlled deferred save and sampler collaborator. No actual audio/GUI/hardware.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks,sourceHashes:Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
