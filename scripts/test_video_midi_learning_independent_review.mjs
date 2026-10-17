import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createVideoControls} from '../prototype/video-controls.js';
import {createVideoMixer} from '../prototype/video.js';
import {createVideoOverlayMIDI} from '../prototype/video-overlay-midi.js';
import {createMIDIAssignment} from '../prototype/midi-assignment.js';
import {createVideoMIDIRouter,videoMIDITargets} from '../prototype/video-midi.js';
import {decodeMIDI,mappedValue,keyShiftSemitones,matchesMIDIMap} from '../prototype/midi.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Choose a new immutable result path');
const checks=[];async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.message});}}
const note=value=>({...decodeMIDI([0x90,60,value]),timestamp:0,device:'A',deviceId:'A'});
const targetSpec=target=>videoMIDITargets.find(x=>x.target===target);
await check('Fourteen-bit Note capture retains its actual note number and can match that same input',async e=>{
 const state={mappings:[]};const assignment=createMIDIAssignment({state,targetSpec});assignment.start();assignment.choose('Video crossfader');assignment.setEncoding('14-bit absolute');assignment.receive(note(127));
 e.mapping=state.mappings[0];e.matchesCapturedInput=matchesMIDIMap(note(127),e.mapping);assert.equal(e.mapping.number,60);assert.equal(e.matchesCapturedInput,true);
});
await check('Entering assignment cannot consume the release of an already-running Hold sampler',async e=>{
 const source=fs.readFileSync('prototype/panels.js','utf8'),start=source.indexOf('  async function receiveMIDI('),region=source.slice(start,source.indexOf('  const midiInput =',start));
 const state={video:{},mappings:[{target:'Sampler 1',type:'Note',number:60,channel:1,encoding:'7-bit absolute'}],midiLog:[],decks:[{},{}],bank:0,samples:[[{mode:'Hold',playing:false}]]};
 const assignment=createMIDIAssignment({state,targetSpec});const router=createVideoMIDIRouter({state,videoMixer:{}});router.assignment=assignment;let playing=false;const calls=[];
 const receive=new Function('s','mappedValue','keyShiftSemitones','midiPairs','a','$','engine','renderTracks','matchesMIDIMap','videoMIDI','sampleAction','refresh','let learn=false,learnedType="CC";const midiSampleHolds=new Map();'+region+';return receiveMIDI;')(
  state,mappedValue,keyShiftSemitones,new Map(),{},()=>null,{stopSample(){playing=false;calls.push('stop')}},()=>{},matchesMIDIMap,router,async()=>{playing=true;calls.push('play')},()=>{});
 await receive(note(127));e.beforeAssignment=playing;assignment.start();await receive(note(0));e.afterRelease=playing;e.calls=calls;assert.equal(e.afterRelease,false,'An accepted Hold onset needs its release even when assignment consumes new onsets');
});
await check('Removing one overlay through actual editor handler must preserve another shared image consumer',async e=>{
 const source=fs.readFileSync('prototype/video-controls.js','utf8'),start=source.lastIndexOf('      host.onclick = run(async event => {'),end=source.indexOf('      render();',start);
 assert(start>=0&&end>start);const region=source.slice(start,end);
 const image=id=>({id,kind:'image',imageRef:'shared',on:true}),state={video:{overlays:{left:[image('a'),image('b')],right:[],master:[]}},decks:[{},{}],settings:{}};
 const oldImage=globalThis.Image;globalThis.Image=class{decode(){return Promise.resolve()}};
 const mixer=createVideoMixer({state,engine:{position:()=>0},notify:()=>{}});
 try{
  await mixer.setOverlayImage('left','shared',new Blob(['shared resource']));const host={};const before=JSON.stringify(state.video.overlays);let reported;
  new Function('host','run','current','targetSelect','v','imageRequests','videoMixer','loadedImages','changed','render','list','$','overlayMIDI','let selected="a";'+region)(
   host,fn=>async event=>{try{return await fn(event)}catch(error){reported=error.message}},()=>state.video.overlays.left.find(x=>x.id==='a'),{value:'left'},state.video,new Map(),mixer,new Set(),()=>{},()=>{},{disabled:false,focus(){}},()=>({focus(){}}),{});
  const button={id:'video-overlay-remove',dataset:{}};await host.onclick({target:{closest:()=>button}});
  e.remaining=state.video.overlays.left.map(x=>x.id);e.sharedAssetPresent=mixer.hasOverlayImage('left','shared');e.reported=reported||null;
  if(reported){assert.match(reported,/shared|reference|collision/i);assert.equal(JSON.stringify(state.video.overlays),before);}
  assert.equal(e.sharedAssetPresent,true,'Removing a must preserve b decoded resource');
 }finally{globalThis.Image=oldImage;await mixer.dispose()}
});
await check('Real overlay editor render represents the preset selected by the shared MIDI controller',async e=>{
 const spec={id:'t',kind:'text',name:'Layer',on:false,text:'base',x:.5,y:.5,opacity:1,scale:1,animation:'none',speed:1};
 const state={video:{overlays:{master:[spec],left:[],right:[]},midiOverlayPresetNames:{text:'Second'}}};
 const metadata=name=>({version:1,kind:'text',text:name,on:false});const storage={getItem:()=>JSON.stringify([{name:'First',metadata:metadata('First')},{name:'Second',metadata:metadata('Second')}])};
 const nodes=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='#video-overlay-target'?'master':'',dataset:{},innerHTML:'',disabled:false,isConnected:true,closest:()=>null,querySelector:()=>null,focus(){}});return nodes.get(id)};
 const previousDocument=globalThis.document,previousStorage=globalThis.localStorage;
 globalThis.document={querySelector:element};globalThis.localStorage=storage;
 try{
  const overlayMIDI=createVideoOverlayMIDI({state,videoMixer:{},storage});
  const controls=createVideoControls({state,videoMixer:{},overlayMIDI,dialog:(_title,_markup,bind)=>bind(),assignmentUI:{markup:()=>'',sync(){}},persist(){}});
  controls.overlaysDialog();const html=element('#video-overlay-editor').innerHTML,select=/<select id="video-overlay-preset-list">([\s\S]*?)<\/select>/.exec(html)?.[1];
  e.sharedSelectedName=state.video.midiOverlayPresetNames.text;e.generatedPresetOptions=select;e.postRenderSelectValue=element('#video-overlay-preset-list').value;
  assert(select);assert(/value="1"\s+selected/.test(select)||element('#video-overlay-preset-list').value==='1','Selected Second preset must be reflected by selected option or explicit post-render value');
 }finally{globalThis.document=previousDocument;globalThis.localStorage=previousStorage}
});
await check('Editing a captured device-scoped mapping must not silently broaden it to other devices',async e=>{
 const source=fs.readFileSync('prototype/panels.js','utf8'),start=source.indexOf('        $("#midi-add").onclick = () => {'),end=source.indexOf("        $('#midi-mappings').onclick",start);
 const state={mappings:[{target:'Video crossfader',type:'CC',channel:1,number:20,encoding:'7-bit absolute',deviceId:'A'}]};
 const values={'#midi-type':'CC','#midi-encoding':'7-bit absolute','#midi-channel':'1','#midi-number':'21','#midi-target':'Video crossfader'};const nodes=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value}]));nodes['#midi-add']={};
 new Function('$','s','videoMIDITargets','persist','midi','notify','let reassignMapping=s.mappings[0];'+source.slice(start,end))(k=>nodes[k],state,videoMIDITargets,()=>{},()=>{},error=>{throw Error(error)});
 nodes['#midi-add'].onclick();e.updated=state.mappings[0];e.otherDeviceMatches=matchesMIDIMap({type:'CC',channel:1,number:21,value:127,deviceId:'B'},e.updated);
 assert.equal(e.updated.deviceId,'A');assert.equal(e.otherDeviceMatches,false);
});
const paths=['prototype/midi-assignment.js','prototype/video-midi-assignment-ui.js','prototype/panels.js','prototype/video-controls.js','prototype/video-midi.js','prototype/midi.js'];const result={scope:'Actual assignment/match helpers, extracted receiveMIDI and editor callbacks, actual mixer and controlled editor markup with DOM/Image collaborators; no browser GUI/audio/native/physical/reference.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks,sourceHashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
