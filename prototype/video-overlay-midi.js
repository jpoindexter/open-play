import {videoOverlayAnimations,normalizeVideoOverlay,videoOverlayPresetMetadata,restoreVideoOverlayPreset} from './video-overlays.js';
const locations=['left','right','master'],kinds=['text','image'];
const storageKey='openplay-video-overlay-presets-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const range=(old,value,relative,low,high)=>clamp(relative?old+value*(high-low)/127:low+value*(high-low),low,high);
const chooseIndex=(current,length,value,relative)=>relative?((current+Math.trunc(value))%length+length)%length:clamp(Math.floor(value*length),0,length-1);
/** Shared editor/MIDI overlay selection. Uses existing scalar metadata and
 * decoded-image owners; never manufactures media or implies reference taper. */
export function createVideoOverlayMIDI({state,videoMixer,storage=globalThis.localStorage}) {
  const v=state.video;
  const all=kind=>locations.flatMap(target=>(v.overlays?.[target]||[]).filter(spec=>spec.kind===kind).map(spec=>({target,spec})));
  function current(kind) {
    const candidates=all(kind),selected=v.midiOverlaySelection?.[kind];
    return candidates.find(x=>x.target===selected?.target&&x.spec.id===selected?.id)||candidates[0]||null;
  }
  function activate(target,id) {
    const matches=v.overlays?.[target]?.filter(x=>x.id===id)||[];
    if(matches.length!==1)throw new Error('Choose a unique overlay identity; this selection is absent or ambiguous.');
    const spec=matches[0];if(!kinds.includes(spec.kind))throw new Error('Choose an existing text or image overlay.');
    v.midiOverlaySelection||={};v.midiOverlaySelection[spec.kind]={target,id};return{target,spec};
  }
  function presets(kind) {
    const raw=JSON.parse(storage?.getItem(storageKey)||'[]');if(!Array.isArray(raw))throw new Error('Saved overlay presets are not a list.');
    return raw.filter(x=>typeof x?.name==='string'&&x.metadata?.version===1&&(!kind||x.metadata.kind===kind));
  }
  function choosePreset(kind,name) {
    if(!presets(kind).some(x=>x.name===name))throw new Error('Choose a saved preset for this overlay kind.');
    v.midiOverlayPresetNames||={};v.midiOverlayPresetNames[kind]=name;
  }
  function dispatch(kind,action,value,relative=false,options={}) {
    if(!kinds.includes(kind))throw new RangeError('Unknown overlay kind.');
    if(!Number.isFinite(value))throw new TypeError('Overlay MIDI needs a finite value.');
    const entry=current(kind);if(!entry)throw new Error(`Add a ${kind} overlay before assigning its controls.`);
    const {target,spec}=entry;
    if(action==='select') {
      const candidates=all(kind),index=candidates.findIndex(x=>x.spec===spec),next=candidates[chooseIndex(index,candidates.length,value,relative)];
      return activate(next.target,next.spec.id);
    }
    if(v.overlays[target].filter(x=>x.id===spec.id).length!==1)throw new Error('Choose a unique overlay identity.');
    if(['opacity','scale','x','y'].includes(action)) {
      const[low,high]=action==='scale'?[.05,4]:[0,1];spec[action]=range(spec[action],value,relative,low,high);
    }else if(action==='animation') {
      const index=Math.max(0,videoOverlayAnimations.findIndex(x=>x.id===spec.animation));
      spec.animation=videoOverlayAnimations[chooseIndex(index,videoOverlayAnimations.length,value,relative)].id;
    }else if(action==='option') {
      const options=videoOverlayAnimations.find(x=>x.id===spec.animation)?.options||[];
      if(!options.length)throw new Error('This animation has no option labels. Choose a scrolling or reactive animation first.');
      const values=options.map(speed=>normalizeVideoOverlay({...spec,speed}).speed),index=Math.max(0,values.indexOf(spec.speed));
      spec.speed=values[chooseIndex(index,values.length,value,relative)];
    }else if(action==='on') {
      if(kind==='image'&&!spec.on&&!videoMixer.hasOverlayImage(target,spec.imageRef||spec.id))throw new Error('Reimport the original image before enabling this overlay.');
      spec.on=!spec.on;
    }else if(action.startsWith('route ')) {
      const destination=action.slice(6);if(!locations.includes(destination))throw new RangeError('Unknown overlay destination.');
      videoMixer.moveOverlay(target,destination,spec.id);return activate(destination,spec.id);
    }else if(action==='preset select') {
      const entries=presets(kind);if(!entries.length)throw new Error(`Save a ${kind} preset first.`);
      const index=Math.max(0,entries.findIndex(x=>x.name===v.midiOverlayPresetNames?.[kind]));
      const next=entries[chooseIndex(index,entries.length,value,relative)];v.midiOverlayPresetNames||={};v.midiOverlayPresetNames[kind]=next.name;
    }else if(action==='save preset') {
      const name=(options.name??spec.name??`${kind} overlay`).trim().slice(0,128);if(!name)throw new Error('Give this overlay a preset name first.');
      const entries=presets(),record={name,metadata:videoOverlayPresetMetadata(spec)},index=entries.findIndex(x=>x.name===name);
      if(index>=0)entries[index]=record;else entries.push(record);
      if(!storage?.setItem)throw new Error('Local overlay preset storage is unavailable.');
      storage.setItem(storageKey,JSON.stringify(entries));v.midiOverlayPresetNames||={};v.midiOverlayPresetNames[kind]=name;
    }else if(action==='load preset') {
      const entries=presets(kind),saved=entries.find(x=>x.name===v.midiOverlayPresetNames?.[kind])||entries[0];
      if(!saved)throw new Error(`Save or select a ${kind} preset first.`);
      const restored=restoreVideoOverlayPreset(saved.metadata),index=v.overlays[target].indexOf(spec);
      const ref=spec.imageRef||spec.id;
      if(kind==='image') {
        if(v.overlays[target].some(x=>x!==spec&&x.kind==='image'&&(x.imageRef||x.id)===ref))throw new Error('A shared image reference must be separated before preset reload.');
        videoMixer.clearOverlayImage(target,ref);
      }
      v.overlays[target][index]={...restored,id:spec.id,imageRef:kind==='image'?ref:null,on:kind==='image'?false:restored.on};
    }else throw new RangeError('Unknown overlay MIDI action.');
    return current(kind);
  }
  return {current,activate,dispatch,presets,choosePreset};
}
