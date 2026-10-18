// Shared independent32-tap/1024-phase PCM normalization; no audio-device or DSP dependency.
const finite=(v,name)=>{if(!Number.isFinite(v))throw new TypeError(name+' must be finite');return v;};
const alive=signal=>{if(signal?.aborted)throw Object.assign(new Error('PCM copy cancelled'),{name:'AbortError'});};
const srcTables=new Map();
function coefficients(cutoff){
 const key=cutoff.toFixed(12);if(srcTables.has(key))return srcTables.get(key);
 const table=new Float64Array(1024*32);
 for(let phase=0;phase<1024;phase++){let total=0;for(let tap=0;tap<32;tap++){const distance=tap-15-phase/1024,angle=Math.PI*cutoff*distance,weight=(Math.abs(angle)<1e-12?cutoff:Math.sin(angle)/(Math.PI*distance))*(.5+.5*Math.cos(Math.PI*distance/16));table[phase*32+tap]=weight;total+=weight;}for(let tap=0;tap<32;tap++)table[phase*32+tap]/=total;}
 if(srcTables.size>=8)srcTables.delete(srcTables.keys().next().value);srcTables.set(key,table);return table;
}
const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
/** Copies only this context-rate chunk. Absolute frame phase and source halo make adjacent chunks consistent. */
export async function copyPCMChunk(channels,sourceSampleRate,sampleRate,startFrame,frameCount,{signal,yield:yieldNow=yieldTask}={}){
 if(!Array.isArray(channels)||!channels.length||channels.length>8||!channels[0]?.length||channels.some(c=>!(c instanceof Float32Array)||c.length!==channels[0].length))throw new TypeError('PCM channels must be1..8 equal nonempty Float32Arrays');
 finite(sourceSampleRate,'sourceSampleRate');if(sourceSampleRate<=0)throw new RangeError('Invalid source sample rate');
 const source={channels,sampleRate:sourceSampleRate,length:channels[0].length,numberOfChannels:channels.length};finite(sampleRate,'sampleRate');if(sampleRate<=0||!Number.isSafeInteger(startFrame)||!Number.isSafeInteger(frameCount)||frameCount<0)throw new RangeError('Invalid chunk geometry');alive(signal);
 const out=Array.from({length:source.numberOfChannels},()=>new Float32Array(frameCount));
 if(source.sampleRate===sampleRate){const first=Math.max(0,startFrame),last=Math.min(source.length,startFrame+frameCount);if(last>first)for(let c=0;c<out.length;c++)out[c].set(source.channels[c].subarray(first,last),first-startFrame);alive(signal);return out;}
 const ratio=source.sampleRate/sampleRate,table=coefficients(Math.min(1,1/ratio)*.94),batch=Math.max(256,Math.floor(32768/source.numberOfChannels));
 for(let offset=0;offset<frameCount;offset+=batch){alive(signal);const end=Math.min(frameCount,offset+batch);for(let i=offset;i<end;i++){const absolute=(startFrame+i)*ratio;let base=Math.floor(absolute),phase=Math.round((absolute-base)*1024);if(phase===1024){base++;phase=0;}for(let c=0;c<out.length;c++){let value=0;for(let tap=0;tap<32;tap++){const at=base+tap-15;if(at>=0&&at<source.length)value+=source.channels[c][at]*table[phase*32+tap];}out[c][i]=value;}}if(end<frameCount){await yieldNow();alive(signal);}}
 return out;
}
