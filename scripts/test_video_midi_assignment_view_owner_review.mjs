import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createMIDIAssignment} from '../prototype/midi-assignment.js';
import {createVideoMIDIAssignmentUI} from '../prototype/video-midi-assignment-ui.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Choose a new immutable output path');
class Bus{listeners=new Map();addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn)}emit(type,props={}){const e={...props,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};for(const fn of this.listeners.get(type)||[]){fn(e);if(e.stopped)break;}return e}}
function host(){
 const doc=new Bus(),win=new Bus(),modal=new Bus();modal.open=false;let focus=0,exits=0,chooses=0;
 const panel={},body={};const node=(owner,role)=>({dataset:role==='control'?{videoMidiTarget:'Video crossfader'}:{},isConnected:true,focus(){focus++},closest(selector){if(selector==='[data-video-midi-mode]')return role==='toolbar'?this:null;if(selector==='[data-video-midi-mode],[data-video-midi-encoding]')return role==='toolbar'?this:null;if(selector==='#modal-body')return owner==='modal'?body:null;if(selector==='#panel')return owner==='panel'?panel:null;if(selector==='[data-video-midi-target]')return role==='control'?this:null;if(selector==='#modal-close,#close-panel')return role==='close'?this:null;return null}});
 const panelButton=node('panel','toolbar'),modalButton=node('modal','toolbar'),control=node('panel','control'),close=node('modal','close');
 doc.body={classList:{toggle(){}}};doc.hidden=false;doc.querySelectorAll=()=>[];doc.querySelector=s=>s==='#modal'?modal:s==='#panel [data-video-midi-mode]'?panelButton:s==='#modal-body [data-video-midi-mode]'?modalButton:null;
 const state={mappings:[{target:'Video crossfader',number:20}]};let ui;const assignment=createMIDIAssignment({state,targetSpec:()=>({kind:'continuous'}),onChange:()=>ui?.sync()});const choose=assignment.choose;assignment.choose=x=>{chooses++;return choose(x)};
 ui=createVideoMIDIAssignmentUI({assignment,document:doc,window:win,onExit:()=>exits++});
 return{doc,win,modal,assignment,state,panelButton,modalButton,control,close,counts:()=>({focus,exits,chooses})};
}
const checks=[];function check(name,fn){const evidence={};try{fn(evidence);checks.push({name,passed:true,evidence})}catch(error){checks.push({name,passed:false,evidence,error:error.message})}}
check('Delayed close from previous dialog cannot cancel new panel-owned assignment; strict toolbar Exit still exits',e=>{
 const h=host();h.doc.emit('click',{target:h.panelButton});h.modal.emit('close');e.afterOldClose=h.assignment.snapshot();assert(e.afterOldClose.active);
 h.doc.emit('click',{target:h.panelButton});e.afterExit=h.assignment.snapshot();assert.equal(e.afterExit.active,false);assert.equal(e.afterExit.reason,'MIDI assignment exited.');
});
check('Current modal-owned assignment cancels when its actual dialog is closed',e=>{
 const h=host();h.modal.open=true;h.doc.emit('click',{target:h.modalButton});h.modal.open=false;h.modal.emit('close');e.state=h.assignment.snapshot();assert.equal(e.state.active,false);assert.match(e.state.reason,/dialog closed/);
});
check('Old close event cannot cancel assignment in an open/reopened modal; explicit close button still cancels immediately',e=>{
 const h=host();h.modal.open=true;h.doc.emit('click',{target:h.modalButton});h.modal.emit('close');e.reopened=h.assignment.snapshot();assert(e.reopened.active);
 const event=h.doc.emit('click',{target:h.close});e.closed=h.assignment.snapshot();assert.equal(e.closed.active,false);assert.match(e.closed.reason,/view closed/);assert.equal(event.prevented,undefined,'Normal close action must remain allowed');
});
check('Pointerdown+click chooses once, Enter unassigns once, and Escape restores trigger focus',e=>{
 const h=host();h.doc.emit('click',{target:h.panelButton});const down=h.doc.emit('pointerdown',{target:h.control}),click=h.doc.emit('click',{target:h.control});
 assert(down.prevented&&down.stopped&&click.prevented&&click.stopped);assert.equal(h.counts().chooses,1);
 h.doc.emit('keydown',{target:h.control,key:'Enter',repeat:false});assert.equal(h.state.mappings.length,0);h.doc.emit('keydown',{target:h.control,key:'Enter',repeat:true});
 h.doc.emit('keydown',{target:h.control,key:'Escape'});e.state=h.assignment.snapshot();e.counts=h.counts();assert.equal(e.state.active,false);assert.match(e.state.reason,/Escape/);assert.equal(e.counts.focus,2);
});
check('Blur and hidden cancellations retain explicit reason after view-ownership change',e=>{
 const h=host();h.doc.emit('click',{target:h.panelButton});h.win.emit('blur');e.blur=h.assignment.snapshot();assert.equal(e.blur.active,false);assert.match(e.blur.reason,/focus loss/);
 h.doc.emit('click',{target:h.panelButton});h.doc.hidden=true;h.doc.emit('visibilitychange');e.hidden=h.assignment.snapshot();assert.equal(e.hidden.active,false);assert.match(e.hidden.reason,/hidden/);
});
const paths=['prototype/video-midi-assignment-ui.js','prototype/midi-assignment.js','prototype/panels.js','prototype/overlay-midi-harness.js'];const result={scope:'Actual UI listener and assignment implementations with controlled document/window/modal event buses. Executes delayed-event ownership, suppression calls and explicit exits; not real HTMLDialogElement scheduling/native default actions/browser UI/device proof.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks,sourceHashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
