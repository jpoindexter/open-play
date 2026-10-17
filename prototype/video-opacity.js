// Independent per-channel Video opacity. Missing flags inherit the previous
// combined link policy only on normalization; transport and crossfade stay separate.
function own(value,key) {
  if(!value||typeof value!=='object')return undefined;
  try{return Object.getOwnPropertyDescriptor(value,key)?.value;}catch{return undefined;}
}
const unit=(value,fallback=1)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
export function normalizeVideoOpacityState(value) {
  if(Array.isArray(value))value=null;
  const legacy=own(value,'linked'),fallback=typeof legacy==='boolean'?legacy:true;
  const levels=own(value,'channelOpacity'),links=own(value,'channelOpacityLinked');
  return {channelOpacity:[0,1].map(i=>unit(Array.isArray(levels)?own(levels,String(i)):undefined)),
    channelOpacityLinked:[0,1].map(i=>{const link=Array.isArray(links)?own(links,String(i)):undefined;return typeof link==='boolean'?link:fallback;})};
}
export function effectiveVideoOpacity(value,audioLevels=[]) {
  const {channelOpacity,channelOpacityLinked}=normalizeVideoOpacityState(value);
  return channelOpacity.map((level,i)=>channelOpacityLinked[i]?unit(own(audioLevels,String(i))):level);
}
export function videoOpacityIndex(index) {
  if(index!==0&&index!==1)throw new RangeError('Choose left or right Video opacity.');
  return index;
}
