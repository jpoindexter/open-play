import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {snapshotVideoState,restoreVideoState} from '../prototype/video-state.js';
import {createVideoControls,createVideoOverlaySpec} from '../prototype/video-controls.js';
import {createVideoOverlayMIDI} from '../prototype/video-overlay-midi.js';
import {createVideoMIDIRouter} from '../prototype/video-midi.js';
import {createVideoMixer} from '../prototype/video.js';
import {decodeMIDI} from '../prototype/midi.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Choose a new immutable result path');
function host(){
 const a={...createVideoOverlaySpec('text','t1'),name:'Layer A',text:'ONE',animation:'scroll-left-right',speed:1},b={...createVideoOverlaySpec('text','t2'),name:'Layer B',text:'TWO'},image={...createVideoOverlaySpec('image','i1'),name:'Image A'};
 const state={video:{overlays:{left:[],right:[],master:[a,image,b]}},decks:[{},{}],settings:{}};
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{id:id.slice(1),value:id==='#video-overlay-target'?'master':'',dataset:{},innerHTML:'',disabled:false,isConnected:true,closest:()=>null,querySelector:()=>null,focus(){},checkValidity:()=>true});return nodes.get(id)};
 const oldDoc=globalThis.document,oldStore=globalThis.localStorage;const data=new Map();const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 globalThis.document={querySelector:node,getElementById:id=>nodes.get('#'+id)||null};globalThis.localStorage=storage;
 const mixer=createVideoMixer({state,engine:{position:()=>0},notify(){}}),overlay=createVideoOverlayMIDI({state,videoMixer:mixer,storage});
 const controls=createVideoControls({state,videoMixer:mixer,overlayMIDI:overlay,dialog:(_title,_html,bind)=>bind(),assignmentUI:{markup:()=>'',sync(){}},persist(){}});
 const router=createVideoMIDIRouter({state,videoMixer:mixer,overlayMIDI:overlay,onChange:()=>controls.syncMIDI()});controls.overlaysDialog();
 const message=value=>({...decodeMIDI([0xb0,20,value]),deviceId:'controlled'});
 return{state,a,b,image,overlay,controls,router,node,data,message,records:()=>JSON.parse([...data.values()][0]||'[]'),async dispose(){await mixer.dispose();globalThis.document=oldDoc;globalThis.localStorage=oldStore}};
}
const checks=[];async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence})}catch(error){checks.push({name,passed:false,evidence,error:error.message})}}
await check('MIDI animation-option Fast is represented by the real editor label selection',async e=>{
 const h=host();try{await h.router.dispatch('Video text overlay option',h.message(127),'7-bit absolute');e.numericSpeed=h.a.speed;e.options=/<select id="video-overlay-speed-label">([\s\S]*?)<\/select>/.exec(h.node('#video-overlay-editor').innerHTML)?.[1];
 assert.equal(e.numericSpeed,2);assert(/value="Fast"\s+selected/.test(e.options)||h.node('#video-overlay-speed-label').value==='Fast','Numeric Fast must not be presented as Custom');}finally{await h.dispose()}
});
await check('MIDI Save agrees with the visible Preset name used by the real GUI Save button',async e=>{
 const h=host();try{
 const draft=h.node('#video-overlay-preset-name');draft.value='Performance Name';h.node('#video-overlay-editor').oninput({target:draft});
 await h.router.dispatch('Video text overlay save preset',h.message(127),'7-bit absolute');e.afterMIDI=h.records().map(x=>x.name);
 draft.value='Performance Name';const button={id:'video-overlay-preset-save',dataset:{}};await h.node('#video-overlay-editor').onclick({target:{closest:()=>button}});e.afterGUI=h.records().map(x=>x.name);
 assert(e.afterMIDI.includes('Performance Name'),'MIDI Save must use the visible selected-overlay preset name, as GUI Save does');}finally{await h.dispose()}
});
await check('Open image editor cannot replace the independently MIDI-selected text identity',async e=>{
 const h=host();try{
 h.node('#video-overlay-list').value='i1';h.node('#video-overlay-list').onchange();await h.router.dispatch('Video text overlay select',h.message(127),'7-bit absolute');
 e.selection=structuredClone(h.state.video.midiOverlaySelection);assert.equal(h.overlay.current('text').spec.id,'t2');assert.equal(h.overlay.current('image').spec.id,'i1');
 await h.router.dispatch('Video text overlay opacity',h.message(0),'7-bit absolute');e.opacities=[h.a.opacity,h.b.opacity,h.image.opacity];assert.deepEqual(e.opacities,[1,0,1]);
 await h.router.dispatch('Video text overlay route left',h.message(127),'7-bit absolute');e.afterRoute=structuredClone(h.state.video.midiOverlaySelection);assert.equal(h.overlay.current('text').target,'left');assert.equal(h.overlay.current('image').target,'master');
 }finally{await h.dispose()}
});
await check('Text MIDI on/save/load/route preserve identity and the other-kind selection; missing image On still refuses',async e=>{
 const h=host();try{
 h.overlay.activate('master','i1');const otherSelection=structuredClone(h.state.video.midiOverlaySelection.image);
 await h.router.dispatch('Video text overlay on',h.message(127),'7-bit absolute');assert(h.a.on);await h.router.dispatch('Video text overlay save preset',h.message(127),'7-bit absolute');h.a.text='EDITED';
 await h.router.dispatch('Video text overlay load preset',h.message(127),'7-bit absolute');const restored=h.overlay.current('text').spec;e.restored={id:restored.id,text:restored.text,on:restored.on};assert.deepEqual(e.restored,{id:'t1',text:'ONE',on:true});
 await h.router.dispatch('Video text overlay route right',h.message(127),'7-bit absolute');e.target=h.overlay.current('text').target;assert.equal(e.target,'right');
 await assert.rejects(h.router.dispatch('Video image overlay on',h.message(127),'7-bit absolute'),/reimport/i);assert.equal(h.image.on,false);e.otherKindSelection=structuredClone(h.state.video.midiOverlaySelection.image);assert.deepEqual(e.otherKindSelection,otherSelection);
 }finally{await h.dispose()}
});
await check('Typed preset draft remains specific to its layer/kind through routing and state restore, not preset metadata',async e=>{
 const h=host();try{
 const typeName=value=>{const input=h.node('#video-overlay-preset-name');input.value=value;h.node('#video-overlay-editor').oninput({target:input});};
 typeName('Text A Draft');h.node('#video-overlay-list').value='i1';h.node('#video-overlay-list').onchange();typeName('Image Draft');
 await h.router.dispatch('Video text overlay save preset',h.message(127),'7-bit absolute');e.firstNames=h.records().map(x=>x.name);assert(e.firstNames.includes('Text A Draft'),'Offscreen text Save must use its own draft');
 assert(!h.records()[0].metadata.presetDraftName,'Preset metadata must exclude the transient editor draft');
 await h.router.dispatch('Video text overlay route left',h.message(127),'7-bit absolute');assert.equal(h.a.presetDraftName,'Text A Draft');
 await h.router.dispatch('Video text overlay select',h.message(127),'7-bit absolute');await h.router.dispatch('Video text overlay save preset',{...h.message(127),number:21},'7-bit absolute');
 e.names=h.records().map(x=>x.name);assert(e.names.includes('Layer B'));assert(!e.names.includes('Image Draft'),'A text Save cannot use the visible image draft');
 const restored=restoreVideoState(snapshotVideoState(h.state.video));e.restoredDrafts={text:restored.overlays.left.find(x=>x.id==='t1').presetDraftName,image:restored.overlays.master.find(x=>x.id==='i1').presetDraftName};
 assert.deepEqual(e.restoredDrafts,{text:'Text A Draft',image:'Image Draft'});
 }finally{await h.dispose()}
});
await check('An explicitly cleared visible preset draft rejects MIDI Save instead of silently using the layer name',async e=>{
 const h=host();try{const input=h.node('#video-overlay-preset-name');input.value='';h.node('#video-overlay-editor').oninput({target:input});
 let error;try{await h.router.dispatch('Video text overlay save preset',h.message(127),'7-bit absolute')}catch(x){error=x.message}
 e.error=error||null;e.records=h.records();assert(error&&/name/i.test(error),'Empty draft must require a name');assert.deepEqual(e.records,[]);
 }finally{await h.dispose()}
});
await check('Reactive option labels follow normalized intensity and genuine custom speed remains Custom',async e=>{
 const h=host();try{h.a.animation='bass-zoom';await h.router.dispatch('Video text overlay option',h.message(0),'7-bit absolute');
 e.intensity=h.a.speed;e.options=/<select id="video-overlay-speed-label">([\s\S]*?)<\/select>/.exec(h.node('#video-overlay-editor').innerHTML)?.[1];assert.equal(e.intensity,.35);assert(/value="Subtle"\s+selected/.test(e.options));
 const input={dataset:{overlayKey:'speed'},type:'number',value:'0.71',checkValidity:()=>true};h.node('#video-overlay-editor').oninput({target:input});e.custom=h.a.speed;e.label=h.node('#video-overlay-speed-label').value;assert.equal(e.custom,.71);assert.equal(e.label,'');
 }finally{await h.dispose()}
});
await check('Draft state accepts only own bounded strings without invoking accessors or coercion',async e=>{
 let calls=0;const base=createVideoOverlaySpec('text','safe'),probe={...base};Object.defineProperty(probe,'presetDraftName',{get(){calls++;throw Error('forbidden getter')}});
 const read=spec=>restoreVideoState(snapshotVideoState({overlays:{master:[spec]}})).overlays.master[0];
 e.getterPresent=Object.hasOwn(read(probe),'presetDraftName');assert.equal(e.getterPresent,false);assert.equal(calls,0);
 const inherited=Object.assign(Object.create({presetDraftName:'INHERITED'}),base);assert.equal(Object.hasOwn(read(inherited),'presetDraftName'),false);
 for(const draft of [null,42,NaN,{},[],new String('boxed'),'x'.repeat(129)])assert.equal(Object.hasOwn(read({...base,presetDraftName:draft}),'presetDraftName'),false);
 for(const draft of ['', 'x'.repeat(128)])assert.equal(read({...base,presetDraftName:draft}).presetDraftName,draft);
 const h=host();try{h.overlay.setPresetDraft('text','SAFE');for(const draft of [null,42,{},new String('boxed'),'x'.repeat(129)])assert.throws(()=>h.overlay.setPresetDraft('text',draft),/text|128/);assert.equal(h.a.presetDraftName,'SAFE');}finally{await h.dispose()}
 e.accessorCalls=calls;assert.equal(calls,0);
});
const paths=['prototype/video-controls.js','prototype/video-overlay-midi.js','prototype/video-midi.js','prototype/video.js','prototype/video-state.js'];const result={scope:'Actual editor-render/callback, overlay controller, router and mixer with bounded document/storage collaborators. No browser pixels/events/native/hardware/reference transfer.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks,sourceHashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
