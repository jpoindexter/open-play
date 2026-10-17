import {mappedValue} from './midi.js';
import {videoEffectCatalog} from './video-effects-catalog.js';
import {videoTransitionCatalog} from './video-transitions.js';
import {setVideoSetting} from './video-settings.js';
import {createVideoOverlayMIDI} from './video-overlay-midi.js';

// Independent Open Play mapping policy. This registry is a subset of the
// historical manual's 26 control groups, not current-version parity evidence.
const registry=[];
const add=(target,kind,details={})=>registry.push(Object.freeze({target,kind,...details}));
add('Video crossfader','continuous');
for(const field of ['crossfader link','playback link','audio FX link'])add('Video '+field,'command');
add('Video transition select','selection');add('Video fade speed','continuous');
for(const direction of ['left','right','stop'])add('Video fade '+direction,'command');
for(const side of ['left','right']) {
  add(`Video ${side} opacity`,'continuous');add(`Video ${side} opacity link`,'command');
  for(const action of ['save FX','recall FX','associate','unassociate'])add(`Video ${side} ${action}`,'command');
}
for(const side of ['left','right','master'])for(const slot of [1,2])
  for(const [action,kind]of [['select','selection'],['amount','continuous'],['on','command']])
    add(`Video ${side} FX ${slot} ${action}`,kind,{side,slot:slot-1,action});
for(const action of ['panel','FX','overlays','media'])add('Video open '+action,'command');
add('Video fullscreen','command');
for(const kind of ['text','image'])for(const [action,type]of [['select','selection'],['opacity','continuous'],['scale','continuous'],['x','continuous'],['y','continuous'],['animation','selection'],['option','selection'],['on','command'],['route left','command'],['route master','command'],['route right','command'],['preset select','selection'],['save preset','command'],['load preset','command']])
  add(`Video ${kind} overlay ${action}`,type,{overlayKind:kind,action});
export const videoMIDITargets=Object.freeze(registry);
const definitions=new Map(registry.map(spec=>[spec.target,spec]));
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const clone=spec=>({name:spec.name,...structuredClone(spec.default)});

/** MIDI changes Video state through the existing mixer owners. No AudioEngine
 * method is exposed here. Press edges are per target and input source; pending
 * commands reserve ownership synchronously before an asynchronous collaborator. */
export function createVideoMIDIRouter({state,videoMixer,persist=()=>{},command=async()=>{},onChange=()=>{},overlayMIDI=createVideoOverlayMIDI({state,videoMixer})}) {
  const v=state.video,edges=new Map(),pending=new Set(),sourcePairs=new Map();
  const source=message=>message.deviceId||message.device||(message.synthetic?'synthetic':'default');
  function value(message,encoding) {
    if(!message||!Number.isFinite(message.value)||!Number.isInteger(message.channel)||message.channel<1||message.channel>16)
      throw new TypeError('Invalid MIDI input: finite value and channel1–16 required.');
    if(!['7-bit absolute','14-bit absolute','Relative two’s complement','Relative offset'].includes(encoding))
      throw new RangeError('Unknown Video MIDI encoding.');
    const key=source(message);if(!sourcePairs.has(key))sourcePairs.set(key,new Map());
    return mappedValue(message,encoding,sourcePairs.get(key));
  }
  function continuous(current,input,relative,low=0,high=1) {
    return clamp(relative?current+input*(high-low)/127:low+input*(high-low),low,high);
  }
  function select(current,list,input,relative) {
    const index=Math.max(0,list.indexOf(current)),n=list.length;
    return list[relative?((index+Math.trunc(input))%n+n)%n:clamp(Math.floor(input*n),0,n-1)];
  }
  function press(target,message,encoding) {
    if(message.type==='Pitch bend'||encoding!=='7-bit absolute')
      throw new RangeError('Video commands need a 7-bit absolute CC or Note button with a release value.');
    const key=JSON.stringify([target,source(message),message.type,message.channel,message.number]);
    const pressed=message.type==='Note'?!!message.pressed:message.value>0,was=edges.get(key)||false;
    edges.set(key,pressed);return pressed&&!was;
  }
  async function dispatch(target,message,encoding) {
    const spec=definitions.get(target);
    if(!spec){if(typeof target==='string'&&target.startsWith('Video '))throw new RangeError('Unknown Video MIDI target.');return false;}
    const input=value(message,encoding),relative=encoding.startsWith('Relative');
    if(spec.kind!=='command'&&message.type==='Note'&&!message.pressed)return true;
    if(spec.kind==='command'&&(!press(target,message,encoding)||pending.has(target)))return true;
    pending.add(target);
    try {
      if(spec.overlayKind)overlayMIDI.dispatch(spec.overlayKind,spec.action,input,relative);
      else if(spec.side) {
        const list=v.fx[spec.side];
        for(let i=0;i<2;i++)list[i]||=clone(videoEffectCatalog[0]);
        const fx=list[spec.slot];
        if(spec.action==='select') {
          const name=select(fx.name,videoEffectCatalog.map(x=>x.name),input,relative);
          if(name!==fx.name)list[spec.slot]={...clone(videoEffectCatalog.find(x=>x.name===name)),on:fx.on};
        }else if(spec.action==='amount')fx.value=continuous(fx.value,input,relative);
        else fx.on=!fx.on;
        videoMixer.videoFXEdited(spec.side);
      } else if(target==='Video crossfader') {
        if(v.crossLinked||v.auto)throw new Error('Unlink the Video crossfader and stop automatic mix before manual MIDI control.');
        videoMixer.stopCrossfade();v.cross=continuous(v.cross,input,relative,-1,1);
      } else if(target==='Video crossfader link') {videoMixer.stopCrossfade();v.crossLinked=!v.crossLinked;}
      else if(target==='Video playback link')v.linked=!v.linked;
      else if(target==='Video audio FX link')v.audioFXLink=!v.audioFXLink;
      else if(target==='Video transition select')v.transition=select(v.transition,videoTransitionCatalog.map(x=>x.name),input,relative);
      else if(target==='Video fade speed')setVideoSetting(v,'autoCrossfadeSeconds',10-continuous((10-v.autoCrossfadeSeconds)/9.75||0,input,relative)*9.75);
      else if(target.startsWith('Video fade ')) {
        const direction=target.slice(11);
        if(direction==='stop')videoMixer.stopCrossfade();else videoMixer.startCrossfade(direction,()=>{persist();onChange();});
      } else if(/^Video (left|right) opacity/.test(target)) {
        const i=target.includes('left')?0:1;
        if(target.endsWith(' link'))videoMixer.setOpacityLinked(i,!v.channelOpacityLinked[i]);
        else videoMixer.setOpacity(i,continuous(v.channelOpacity[i],input,relative));
      } else if(/^Video (left|right) (save FX|recall FX|associate|unassociate)$/.test(target)) {
        const i=target.includes('left')?0:1;
        if(target.endsWith('save FX'))await videoMixer.saveVideoFX(i);
        else if(target.endsWith('recall FX'))await videoMixer.recallVideoFX(i);
        else if(target.endsWith('unassociate'))await videoMixer.removeVideoAssociation(i);
        else await videoMixer.associateVideo(i);
      } else await command(target==='Video fullscreen'?'fullscreen':target.slice(11).toLowerCase());
      persist();onChange();return true;
    }finally{pending.delete(target);}
  }
  return {dispatch,resetInput(id=null){
    if(id===null){edges.clear();sourcePairs.clear();return;}
    sourcePairs.delete(id);
    for(const key of edges.keys())if(JSON.parse(key)[1]===id)edges.delete(key);
  }};
}
