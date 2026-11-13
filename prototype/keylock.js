// Independent tempo/pitch rendering. All time coordinates returned by this API
// are rendered-buffer seconds: divide original timeline seconds by tempo.
import { validateTransform } from "./keylock-dsp.js";
import {createBeatgrid} from "./beatgrid.js";

const aborted = () =>
  new DOMException("Pitch processing cancelled.", "AbortError");

export class KeylockRenderer {
  constructor({ maxCacheBytes = 128 * 1024 * 1024 } = {}) {
    this.cache = new Map();
    this.ids = new WeakMap();
    this.nextId = 1;
    this.maxCacheBytes = maxCacheBytes;
    this.cacheBytes = 0;
  }
  clear() {
    this.cache.clear();
    this.cacheBytes = 0;
  }
  async renderWarpLoop(buffer,{track,loop,bpm,keylock=true,semitones=0,signal}={}){
    if(signal?.aborted)throw aborted();
    const grid=createBeatgrid(track),first=grid?.beatAt(loop?.start),span=grid?.beatAt(loop?.end)-first;
    if(!grid||!Number.isFinite(span)||span<=0||!Number.isFinite(bpm)||bpm<=0||loop.start<0||loop.end>buffer.duration)throw new RangeError('Invalid warped-loop pitch bounds or beatgrid.');
    if(!this.ids.has(buffer))this.ids.set(buffer,this.nextId++);
    const cacheKey=JSON.stringify(['warp-loop',this.ids.get(buffer),track.grid,track.bpm,track.gridWarpMarkers,loop,bpm,keylock,semitones]);
    const cached=this.cache.get(cacheKey);if(cached){this.cache.delete(cacheKey);this.cache.set(cacheKey,cached);return cached;}
    const sr=buffer.sampleRate,start=Math.floor(loop.start*sr),end=Math.ceil(loop.end*sr),frames=Math.max(1,Math.round(span*60/bpm*sr)),cycle=frames/sr;
    const positions=[loop.start,...grid.nodes.filter(n=>n.time>loop.start&&n.time<loop.end).map(n=>n.time)];
    const segments=positions.map((time,i)=>({input:i===0?0:time-start/sr,output:(grid.beatAt(time)-first)/span*cycle}));
    const copies=Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c).slice(start,end));
    const rendered=await new Promise((resolve,reject)=>{
      const worker=new Worker(new URL('./keylock-worker.js',import.meta.url),{type:'module'});let settled=false;
      const finish=(error,value)=>{if(settled)return;settled=true;worker.terminate();signal?.removeEventListener('abort',cancel);error?reject(error):resolve(value);};
      const cancel=()=>finish(aborted());signal?.addEventListener('abort',cancel,{once:true});
      worker.onerror=e=>finish(Error(e.message||'Warped-loop pitch worker failed.'));
      worker.onmessage=({data})=>{if(data.error)finish(Error(data.error));else if(data.channels)finish(null,data.channels);};
      if(signal?.aborted)return cancel();
      worker.postMessage({channels:copies,sampleRate:sr,loopPlan:{segments,frames,keylock,semitones}},copies.map(c=>c.buffer));
    });
    if(signal?.aborted)throw aborted();
    const result=new AudioBuffer({numberOfChannels:rendered.length,length:rendered[0].length,sampleRate:sr});rendered.forEach((channel,c)=>result.copyToChannel(channel,c));
    this.remember(cacheKey,result);return result;
  }
  remember(key,result){
    const cost=result.length*result.numberOfChannels*4;
    if(cost>this.maxCacheBytes)return;
    const previous=this.cache.get(key);if(previous){this.cacheBytes-=previous.length*previous.numberOfChannels*4;this.cache.delete(key);}
    while(this.cacheBytes+cost>this.maxCacheBytes&&this.cache.size){const [oldKey,old]=this.cache.entries().next().value;this.cache.delete(oldKey);this.cacheBytes-=old.length*old.numberOfChannels*4;}
    this.cache.set(key,result);this.cacheBytes+=cost;
  }
  async render(
    buffer,
    { tempo = 1, semitones = 0, signal, window = null, onProgress = () => {} } = {},
  ) {
    if (signal?.aborted) throw aborted();
    const first=window?Math.round(window.start*buffer.sampleRate):0,last=window?Math.round(window.end*buffer.sampleRate):buffer.length;
    if(!Number.isSafeInteger(first)||!Number.isSafeInteger(last)||first<0||last>buffer.length||last<=first)
      throw new RangeError('Pitch render window must lie inside the source.');
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) =>
      window?buffer.getChannelData(c).subarray(first,last):buffer.getChannelData(c),
    );
    validateTransform(channels, buffer.sampleRate, tempo, semitones);
    if (tempo === 1 && semitones === 0 && !window) {
      onProgress(1);
      return buffer;
    }
    if (!this.ids.has(buffer)) this.ids.set(buffer, this.nextId++);
    const key = `${this.ids.get(buffer)}:${tempo}:${semitones}${window?`:${first}:${last}`:''}`;
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      onProgress(1);
      return cached;
    }
    // Bound worker input, optional resampled source and output PCM before
    // cloning. The WASM heap and caller-owned original are additional memory.
    const frames=last-first,preparedFrames=semitones===0?0:Math.ceil(frames/(2**(semitones/12)));
    const outputFrames=Math.max(1,Math.round(frames/tempo));
    if ((frames+preparedFrames+outputFrames)*buffer.numberOfChannels*4 > 512 * 1024 * 1024)
      throw new Error(
        "This track exceeds the browser pitch-render memory limit. Use a shorter file.",
      );
    const copies = channels.map((c) => c.slice());
    const rendered = await new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("./keylock-worker.js", import.meta.url),
        { type: "module" },
      );
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        worker.terminate();
        signal?.removeEventListener("abort", cancel);
        error ? reject(error) : resolve(value);
      };
      const cancel = () => finish(aborted());
      signal?.addEventListener("abort", cancel, { once: true });
      worker.onerror = (event) =>
        finish(new Error(event.message || "Pitch worker failed."));
      worker.onmessage = ({ data }) => {
        if (data.error) finish(new Error(data.error));
        else if (data.channels) finish(null, data.channels);
        else if (data.progress !== undefined) onProgress(data.progress);
      };
      if (signal?.aborted) return cancel();
      worker.postMessage(
        { channels: copies, sampleRate: buffer.sampleRate, tempo, semitones },
        copies.map((c) => c.buffer),
      );
    });
    if (signal?.aborted) throw aborted();
    const result = new AudioBuffer({
      numberOfChannels: rendered.length,
      length: rendered[0].length,
      sampleRate: buffer.sampleRate,
    });
    rendered.forEach((channel, i) => result.copyToChannel(channel, i));
    this.remember(key,result);
    return result;
  }
}

export function toRenderedTime(originalSeconds, tempo) {
  return originalSeconds / tempo;
}
export function toOriginalTime(renderedSeconds, tempo) {
  return renderedSeconds * tempo;
}
