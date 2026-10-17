// Independent actual mixer/controller ownership tests. No DOM/pixels/hardware.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createVideoMixer} from '../prototype/video.js';
import {createVideoOverlayMIDI} from '../prototype/video-overlay-midi.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Choose a new immutable result path');
const image=(id,ref=id)=>({id,imageRef:ref,kind:'image',name:id,on:true,opacity:1,scale:1,x:.5,y:.5,animation:'none',speed:1});
function host(specs){
 const state={video:{overlays:{left:specs,right:[],master:[]}},decks:[{},{}],settings:{}};
 const mixer=createVideoMixer({state,engine:{position:()=>0},notify:()=>{}});
 const data=new Map();const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const control=createVideoOverlayMIDI({state,videoMixer:mixer,storage});
 return{state,mixer,control,data};
}
const originalImage=globalThis.Image;
globalThis.Image=class{decode(){return Promise.resolve()}};
const checks=[];async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.message});}}
try{
 await check('Loading metadata for one image must preserve a second overlay sharing its decoded reference',async e=>{
  const h=host([image('a','shared'),image('b','shared')]);
  try{
   await h.mixer.setOverlayImage('left','shared',new Blob(['actual controlled decoded resource']));
   h.control.activate('left','a');h.control.dispatch('image','save preset',1);
   const before=JSON.stringify(h.state);let refusal;try{h.control.dispatch('image','load preset',1)}catch(error){refusal=error.message}
   if(refusal){e.atomicRefusal=refusal;assert.match(refusal,/shared|reference|collision|identity/i);assert.equal(JSON.stringify(h.state),before);assert(h.mixer.hasOverlayImage('left','shared'));return;}
   e.otherOverlay=h.state.video.overlays.left[1];e.otherAssetPresent=h.mixer.hasOverlayImage('left',e.otherOverlay.imageRef);
   assert.equal(e.otherAssetPresent,true,'Another enabled overlay must not lose its decoded bytes');
  }finally{await h.mixer.dispose()}
 });
 await check('Metadata reload cannot attach the selected image to another overlay asset and bypass reimport',async e=>{
  const h=host([image('a','own'),image('b','a')]);
  try{
   await h.mixer.setOverlayImage('left','own',new Blob(['selected image bytes']));await h.mixer.setOverlayImage('left','a',new Blob(['other image bytes']));
   h.control.activate('left','a');h.control.dispatch('image','save preset',1);const before=JSON.stringify(h.state);let refusal;try{h.control.dispatch('image','load preset',1)}catch(error){refusal=error.message}
   if(refusal){e.atomicRefusal=refusal;assert.match(refusal,/shared|reference|collision|identity/i);assert.equal(JSON.stringify(h.state),before);assert(h.mixer.hasOverlayImage('left','own'));assert(h.mixer.hasOverlayImage('left','a'));return;}
   e.afterReload={...h.control.current('image').spec};let error;try{h.control.dispatch('image','on',1)}catch(x){error=x.message}
   e.enableError=error||null;e.enabled=h.control.current('image').spec.on;e.otherAssetPresent=h.mixer.hasOverlayImage('left','a');assert.equal(e.otherAssetPresent,true,'Other image bytes must remain available');
   assert(error,'Enable must require reimport rather than finding another overlay asset under its own ID');assert.equal(e.enabled,false);
  }finally{await h.mixer.dispose()}
 });
 await check('Image selection cannot silently activate a text layer with a colliding identity',async e=>{
  const a=image('a'),b=image('collision'),h=host([{...image('collision'),kind:'text'},a,b]);
  try{
   h.control.activate('left','a');const before=JSON.stringify(h.state);let result,refusal;try{result=h.control.dispatch('image','select',1,true)}catch(error){refusal=error.message}
   if(refusal){e.atomicRefusal=refusal;assert.match(refusal,/unique|collision|identity|ambiguous/i);assert.equal(JSON.stringify(h.state),before);return;}
   e.resultKind=result.spec.kind;e.resultId=result.spec.id;e.selections=h.state.video.midiOverlaySelection;
   assert.equal(result.spec.kind,'image','Selecting an image must not activate a different kind');assert.equal(h.control.current('image').spec.id,'collision');
  }finally{await h.mixer.dispose()}
 });
}finally{globalThis.Image=originalImage}
const paths=['prototype/video-overlay-midi.js','prototype/video.js','prototype/video-state.js','prototype/video-overlays.js'];
const result={scope:'Actual mixer assets and MIDI metadata controller with controlled Image.decode; real Blob/object URLs. No actual image pixels/browser/native/hardware.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks,sourceHashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
