import {createEffect} from './effects.js';
const fade=.01;
function ramp(context,node,target){
  const now=context.currentTime,previous=node.channelRamp;
  const value=previous?previous.from+(previous.to-previous.from)*Math.min(1,Math.max(0,(now-previous.at)/fade)):node.gain.value;
  node.gain.cancelScheduledValues(now);node.gain.setValueAtTime(value,now);
  node.gain.linearRampToValueAtTime(target,now+fade);
  node.channelRamp={at:now,from:value,to:target};
}
function disposePath(router,path){
  clearTimeout(path.timer);router.paths.delete(path);
  if(router.current===path)router.current=null;
  try{router.input.disconnect(path.input);}catch{}
  path.gate.disconnect();path.input.disconnect();path.effect?.dispose();
}
function retire(router,path){
  clearTimeout(path.timer);const until=router.context.currentTime+fade;
  const poll=()=>{
    if(router.disposed)return;
    if(router.context.state!=='closed'&&router.context.currentTime<until){
      path.timer=setTimeout(poll,Math.min(100,Math.max(10,(until-router.context.currentTime)*1000)));path.timer.unref?.();return;
    }
    try{disposePath(router,path);}catch(error){router.onError?.(error);}
  };
  path.timer=setTimeout(poll,10);path.timer.unref?.();
}
function makePath(router,strip,name,value,bpm){
  const {context}=router,gate=context.createGain();gate.gain.value=0;
  let input,output,effect;
  if(name==='Filter'){
    input=strip.filter;
    if([...router.paths].some(path=>path.input===input)){
      const previous=input;input=context.createBiquadFilter();input.type=previous.type;
      for(const key of ['frequency','Q','gain'])if(previous[key]&&input[key])input[key].value=previous[key].value;
    }
    strip.filter=input;output=input;
  }else{
    effect=createEffect(context,{name:`Channel ${name}`,on:value!==0,depth:Math.abs(value)*100,beat:'1/2',params:{}},bpm);
    input=effect.input;output=effect.output;
  }
  router.input.connect(input);output.connect(gate);gate.connect(router.target);
  const path={name,input,gate,effect,timer:null};router.paths.add(path);return path;
}
function updatePath(context,path,value,bpm){
  if(path.name==='Filter'){
    path.input.type=value<0?'lowpass':'highpass';
    path.input.frequency.setTargetAtTime(value<0?20000*Math.pow(.003,-value):20*Math.pow(1000,value),context.currentTime,.015);
    return true;
  }
  return path.effect.update({name:`Channel ${path.name}`,on:value!==0,depth:Math.abs(value)*100,beat:'1/2',params:{}},bpm);
}
export function applyChannelFilterRouting(context,strip,{enabled,name,value,bpm,onError}){
  let router=strip.channelRouting;
  if(!router){
    const dry=context.createGain();dry.gain.value=1;
    router=strip.channelRouting={context,input:strip.high,target:strip.monitorTap||strip.gain,dry,current:null,paths:new Set(),wanted:false,onError};
    strip.high.disconnect();strip.filter.disconnect();strip.high.connect(dry);dry.connect(router.target);
  }
  const wanted=enabled&&(name!=='Filter'||value!==0),wasWanted=router.wanted;
  if(!wanted){
    router.wanted=false;strip.channelEffect=null;
    if(wasWanted){ramp(context,router.dry,1);ramp(context,router.current.gate,0);retire(router,router.current);}
    return;
  }
  let path=router.current;
  if(!path||path.name!==name||updatePath(context,path,value,bpm)!==true){
    const previousFilter=strip.filter,next=makePath(router,strip,name,value,bpm);
    try{updatePath(context,next,value,bpm);}catch(error){disposePath(router,next);strip.filter=previousFilter;throw error;}
    if(path){ramp(context,path.gate,0);retire(router,path);}
    router.current=path=next;
  }else{
    clearTimeout(path.timer);path.timer=null;
  }
  router.wanted=true;strip.channelEffect=path.effect||null;
  ramp(context,router.dry,0);ramp(context,path.gate,1);
}
export function disposeChannelFilterRouting(strip){
  const router=strip.channelRouting;
  if(router){
    router.disposed=true;
    for(const path of [...router.paths])disposePath(router,path);
    try{router.input.disconnect(router.dry);}catch{}
    router.dry.disconnect();delete strip.channelRouting;
  }else strip.channelEffect?.dispose();
  strip.channelEffect=null;
}
