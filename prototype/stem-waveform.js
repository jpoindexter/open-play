// Source-domain waveform, not a post-FX/master output meter. Prepared buffers are
// immutable AudioBuffers, aligned at frame zero by the stem preparation contract.
const STEM_NAMES = ['Vocal', 'Melody', 'Bass', 'Drums'];
const nextTask = () => new Promise(resolve => setTimeout(resolve, 0));

export function createStemWaveformModel({blockFrames = 256, chunkFrames = 32768, maxProfiles = 4, yieldTask = nextTask} = {}) {
  blockFrames = Math.max(16, Math.floor(blockFrames) || 256);
  chunkFrames = Math.max(blockFrames, Math.floor(chunkFrames / blockFrames) * blockFrames || 32768);
  maxProfiles = Math.max(1, Math.floor(maxProfiles) || 4);
  let sources = [], originalRef, generation = 0, job = null, disposed = false, serial = 0;
  const cache = new Map(), views = new Map();
  const stats = {started:0, completed:0, canceled:0, chunks:0, processedFrames:0};
  const view = (key, kind, label, extra = {}) => {
    if (!views.has(key)) views.set(key, {kind, label, signature:++serial, profile:null, ...extra});
    return views.get(key);
  };
  function cancel() {
    if (!job) return;
    job.canceled = true; job.resolve(null); job = null; stats.canceled++;
  }
  function reset(original, stems) {
    cancel(); generation++; cache.clear(); views.clear(); originalRef = original;
    sources = Array.isArray(stems) ? [...stems] : [];
  }
  function boundary(label) { cancel(); return view(label, 'context', label); }
  function select({original, stems, enabled = [true,true,true,true], stemFX = [], stemSlip = 'off', exitActive = false} = {}) {
    if (disposed) return view('disposed', 'unavailable', 'Stem waveform unavailable: disposed');
    const incoming = Array.isArray(stems) ? stems : [];
    if (originalRef !== original || sources.length !== incoming.length || sources.some((s,i) => s !== incoming[i])) reset(original, incoming);
    if (!original || sources.length !== 4) { cancel(); return view('original', 'original', original ? 'Decoded waveform' : 'Generated overview fixture'); }
    if ((stemSlip && stemSlip !== 'off') || exitActive || stemFX.some(Boolean))
      return boundary(stemSlip && stemSlip !== 'off'
        ? 'Original source context · Stem Slip clocks not shown'
        : 'Original source context · Stem FX/tails not shown');
    const mask = STEM_NAMES.reduce((bits,_,i) => bits | (enabled[i] ? 1 << i : 0), 0);
    // AudioEngine deliberately routes the original mix when all four are on.
    if (mask === 15) { cancel(); return view('original', 'original', 'Decoded waveform · original mix'); }
    if (cache.has(mask)) {
      cancel(); const cached = cache.get(mask); cache.delete(mask); cache.set(mask,cached); return cached;
    }
    if (job?.mask === mask) return job.view;
    cancel();
    const label = mask ? `Stem source mix · ${STEM_NAMES.filter((_,i) => mask & (1 << i)).join(' + ')} · pre-FX` : 'Stem source mix · all muted';
    let data;
    try { data = prepareSources(original, sources, mask); }
    catch (error) { const result=view(`invalid-${mask}`, 'context', `Original source context · ${error.message}`); cache.set(mask,result); trim(); return result; }
    if (!mask) {
      const profile={sampleRate:data.sampleRate,length:data.length,duration:data.duration,peak:()=>0,bytes:0};
      const ready={kind:'stems',label,signature:++serial,profile};cache.set(mask,ready);trim();return ready;
    }
    const token = {mask, generation, canceled:false, view:{kind:'pending',label:'Preparing stem source waveform…',signature:++serial,profile:null}};
    token.promise = new Promise(resolve => { token.resolve=resolve; }); token.view.ready=token.promise; job=token; stats.started++;
    // Start after returning the pending state; preparation never scans a track in render().
    Promise.resolve().then(async () => {
      try {
        const peaks = new Float32Array(Math.ceil(data.length / blockFrames));
        for (let start=0; start<data.length; start+=chunkFrames) {
          if (token.canceled || disposed || token.generation !== generation) return;
          const end=Math.min(data.length,start+chunkFrames);
          for (let i=start;i<end;i++) {
            const peak=samplePeak(data,i);
            peaks[Math.floor(i/blockFrames)] = Math.max(peaks[Math.floor(i/blockFrames)],peak);
          }
          stats.chunks++; stats.processedFrames+=end-start;
          if (end<data.length) await yieldTask();
        }
        if (token.canceled || disposed || token.generation !== generation) return;
        const profile={sampleRate:data.sampleRate, length:data.length, duration:data.duration,
          peak:(from,to) => intervalPeak(data,peaks,blockFrames,from,to), bytes:peaks.byteLength};
        const ready={kind:'stems',label,signature:++serial,profile};
        cache.set(mask,ready); trim(); job=null; stats.completed++; token.resolve(profile);
      } catch(error) {
        if (token.canceled || disposed || token.generation !== generation) return;
        const failed={kind:'context', label:`Original source context · ${error.message}`, signature:++serial,profile:null};
        cache.set(mask,failed);trim();job=null;token.resolve(null);
      }
    });
    return token.view;
  }
  function trim() { while (cache.size>maxProfiles) cache.delete(cache.keys().next().value); }
  return {select, dispose(){cancel();disposed=true;generation++;cache.clear();views.clear();sources=[];originalRef=null;},
    diagnostics:()=>({...stats, cacheEntries:cache.size, cacheBytes:[...cache.values()].reduce((s,v)=>s+(v.profile?.bytes||0),0), pending:!!job, retainedViewCount:views.size, disposed})};
}
function prepareSources(original,sources,mask) {
  const sampleRate=sources[0]?.sampleRate,length=sources[0]?.length;
  const duration=original.length/original.sampleRate;
  if (!Number.isFinite(sampleRate) || sampleRate<=0 || !Number.isSafeInteger(length) || length<1 || !Number.isFinite(duration) || duration<=0) throw Error('invalid source geometry');
  if (Math.abs(length/sampleRate-duration)>.1) throw Error('unaligned stem duration');
  const selected=[];
  for(let i=0;i<4;i++) {
    const b=sources[i];
    if (!b || b.sampleRate!==sampleRate || b.length!==length || ![1,2].includes(b.numberOfChannels)) throw Error('unaligned stem buffers');
    if(mask & (1<<i)) selected.push(Array.from({length:b.numberOfChannels},(_,channel)=>b.getChannelData(channel)));
  }
  return {sampleRate,length,duration,selected};
}
function samplePeak(data,index) {
  let peak=0;
  // Mono sources are upmixed into each side, matching Web Audio's speaker rules.
  for(let c=0;c<2;c++) {
    let value=0;
    for(const source of data.selected) {
      const sample=source[Math.min(c,source.length-1)][index];
      if (!Number.isFinite(sample)) throw Error('nonfinite stem PCM');
      value+=sample;
    }
    if (!Number.isFinite(value)) throw Error('nonfinite stem sum');
    peak=Math.max(peak,Math.abs(value));
  }
  return peak;
}
function intervalPeak(data,peaks,blockFrames,from,to) {
  if(!Number.isFinite(from)||!Number.isFinite(to)||to<=from) return 0;
  // The original source owns the deck's end; the engine accepts up to .1s of
  // preparation padding, which must never leak into the displayed tail.
  const limit=Math.min(data.length,Math.ceil(data.duration*data.sampleRate));
  let first=Math.max(0,Math.min(limit,Math.floor(from*data.sampleRate)));
  const end=Math.max(0,Math.min(limit,Math.ceil(to*data.sampleRate)));
  let peak=0;
  while(first<end && first%blockFrames) {peak=Math.max(peak,samplePeak(data,first));first++;}
  while(first+blockFrames<=end) {peak=Math.max(peak,peaks[first/blockFrames]);first+=blockFrames;}
  while(first<end) {peak=Math.max(peak,samplePeak(data,first));first++;}
  return peak;
}

// Both production canvases and the integration harness share these actual bars.
export function paintStemOverview(ctx, profile, {width, height, color='#fff', alternate='#408498'} = {}) {
  for(let x=0;x<width;x+=3) {
    const amp=Math.min(.95,profile.peak(x/width*profile.duration,Math.min(width,x+3)/width*profile.duration)*2.5);
    ctx.fillStyle=x%15<6?color:alternate;ctx.fillRect(x,height/2-amp*height/2,2,amp*height);
  }
}
export function paintStemDetail(ctx, profile, {x=0,width,height,position,color='#fff',alternate='#3486a8'} = {}) {
  const mid=x+width/2;
  for(let y=0;y<height;y+=2) {
    const from=position+(y/height-.5)*4,to=position+((y+2)/height-.5)*4;
    const amp=Math.min(1,profile.peak(from,to)*2);
    ctx.fillStyle=y%12<4?color:alternate;ctx.fillRect(mid-amp*(width-28)/2,y,amp*(width-28),1.6);
  }
}

// Retain the original branch's inexpensive sampled rendering, but union peaks
// across source channels. Opposite L/R polarity must not cancel a stereo display.
export function paintOriginalOverview(ctx, buffer, {width,height,color='#fff',alternate='#408498'} = {}) {
  const channels=Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c));
  for(let x=0;x<width;x+=3) {
    const start=Math.floor(x/width*buffer.length),step=Math.max(1,Math.floor(buffer.length/width));let peak=0;
    for(const channel of channels)for(let k=0;k<step;k+=Math.max(1,Math.floor(step/20))) {
      const value=channel[start+k];if(Number.isFinite(value))peak=Math.max(peak,Math.abs(value));
    }
    const amp=Math.min(.95,peak*2.5);ctx.fillStyle=x%15<6?color:alternate;ctx.fillRect(x,height/2-amp*height/2,2,amp*height);
  }
}
export function paintOriginalDetail(ctx, buffer, {x=0,width,height,position,color='#fff',alternate='#3486a8'} = {}) {
  const channels=Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c)),mid=x+width/2;
  for(let y=0;y<height;y+=2) {
    const sec=position+(y/height-.5)*4;let peak=0;
    if(sec>=0&&sec<buffer.length/buffer.sampleRate) {
      const start=Math.floor(sec*buffer.sampleRate);
      for(const channel of channels)for(let j=0;j<100;j+=5) {const value=channel[start+j];if(Number.isFinite(value))peak=Math.max(peak,Math.abs(value));}
    }
    const amp=Math.min(1,peak*2);ctx.fillStyle=y%12<4?color:alternate;ctx.fillRect(mid-amp*(width-28)/2,y,amp*(width-28),1.6);
  }
}
