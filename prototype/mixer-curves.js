// Independent curves anchored to the documented endpoints, not measured vendor DSP.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
export const mixerFields=new Set(['Crossfader Curve','Crossfader Curve Amount','Crossfader Reverse','Crossfader Disable','Upfader Curve',...Array.from({length:4},(_,i)=>`Deck ${i+1} Crossfader Assign`)]);
export function normalizeMixerSettings(value={}){
 return {curve:value.curve==='Power'?'Power':'Linear',amount:clamp(finite(value.amount,.5),0,1),reverse:value.reverse===true,disabled:value.disabled===true,upfader:clamp(finite(value.upfader,.5),0,1),assignments:Array.from({length:4},(_,i)=>['A','B','Thru'].includes(value.assignments?.[i])?value.assignments[i]:i%2?'B':'A')};
}
export function mixerSettingsFromPreferences(settings){
 return normalizeMixerSettings({curve:settings['Crossfader Curve'],amount:finite(settings['Crossfader Curve Amount'],50)/100,reverse:settings['Crossfader Reverse'],disabled:settings['Crossfader Disable'],upfader:finite(settings['Upfader Curve'],50)/100,assignments:Array.from({length:4},(_,i)=>settings[`Deck ${i+1} Crossfader Assign`])});
}
export function crossfaderGain(position,assignment,settings){
 if(settings.disabled||assignment==='Thru')return 1;
 const x=clamp(finite(position,0),-1,1)*(settings.reverse?-1:1),t=assignment==='B'?(x+1)/2:(1-x)/2;
 return settings.curve==='Power'?t**(2**(1-2*settings.amount)):Math.min(1,t/Math.max(.02,1-settings.amount));
}
export function upfaderGain(level,settings){return clamp(finite(level,0),0,1)**(4**(1-2*settings.upfader));}
export const eqBands=['low','mid','high'];
export function normalizeEQBoost(value){return value===12||value==='12 dB'?12:6;}
export function boundedEQGain(value,boost){
 if(!Number.isFinite(Number(value)))throw new TypeError('EQ needs a finite gain.');
 return clamp(Number(value),-24,normalizeEQBoost(boost));
}
export function rescaleEQGain(value,previous,next){
 const gain=boundedEQGain(value??0,previous);
 return gain>0?gain*normalizeEQBoost(next)/normalizeEQBoost(previous):gain;
}
