// Offline host for the unmodified Signalsmith 1.3.2 AudioWorklet processor.
// Runs only in a dedicated Worker (or the serial Node signal-test process).
// Emulates the documented 128-frame AudioWorklet clock/port, not the DSP.
let Processor;
let registering;

async function loadProcessor() {
  if (!registering)
    registering = (async () => {
      globalThis.AudioWorkletProcessor = class {
        constructor() {
          this.port = { onmessage: null, postMessage: () => {} };
        }
      };
      globalThis.registerProcessor = (name, constructor) => {
        Processor = constructor;
      };
      await import("./vendor/signalsmith-stretch/SignalsmithStretch.mjs");
    })();
  await registering;
}

export function validateTransform(channels, sampleRate, tempo, semitones) {
  if (!channels.length || channels.length > 8 || !channels[0]?.length)
    throw new Error("Pitch processing needs 1–8 nonempty audio channels.");
  if (
    channels.some(
      (c) => !(c instanceof Float32Array) || c.length !== channels[0].length,
    )
  )
    throw new Error("Audio channel lengths must match.");
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000)
    throw new Error("Unsupported audio sample rate.");
  if (!Number.isFinite(tempo) || tempo < 0.25 || tempo > 4)
    throw new Error("Tempo must be between 0.25× and 4×.");
  if (!Number.isFinite(semitones) || Math.abs(semitones) > 24)
    throw new Error("Pitch must be between −24 and +24 semitones.");
}

export async function transformChannels(
  channels,
  sampleRate,
  { tempo = 1, semitones = 0, onProgress = () => {} } = {},
) {
  validateTransform(channels, sampleRate, tempo, semitones);
  await loadProcessor();
  globalThis.sampleRate = sampleRate;
  globalThis.currentTime = 0;
  const processor = new Processor({
    numberOfOutputs: 1,
    outputChannelCount: [channels.length],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Pitch DSP initialization timed out.")),
      20000,
    );
    processor.port.postMessage = (message) => {
      if (message[0] === "ready") {
        clearTimeout(timeout);
        resolve();
      }
    };
  });
  let message = 0;
  const send = (method, ...args) =>
    processor.port.onmessage({ data: [message++, method, ...args] });
  send("addBuffers", channels);
  send("schedule", {
    active: true,
    input: 0,
    output: 0,
    rate: tempo,
    semitones,
  });
  const frames = Math.max(1, Math.round(channels[0].length / tempo));
  const output = channels.map(() => new Float32Array(frames));
  const block = channels.map(() => new Float32Array(128));
  for (let offset = 0; offset < frames; offset += 128) {
    globalThis.currentTime = offset / sampleRate;
    processor.process([[]], [block], {});
    const count = Math.min(128, frames - offset);
    for (let c = 0; c < channels.length; c++)
      output[c].set(block[c].subarray(0, count), offset);
    if (offset % (128 * 256) === 0) {
      onProgress(offset / frames);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  onProgress(1);
  return output;
}

// Render a periodic, tempo-varying source loop with context on both sides.
// The center cycle is returned; all DSP is the existing Signalsmith processor.
let WarpProcessor,warpRegistering;
async function loadWarpProcessor(){
 if(!warpRegistering)warpRegistering=(async()=>{
  globalThis.AudioWorkletProcessor=class{constructor(){this.port={onmessage:null,postMessage:()=>{}};}};
  globalThis.registerProcessor=(_name,constructor)=>{WarpProcessor=constructor;};
  await import('./vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs');
 })();
 await warpRegistering;
}
export async function transformWarpedLoop(channels,sampleRate,plan,{onProgress=()=>{}}={}){
 const {segments,frames,semitones=0,keylock=true}=plan;
 if(!Number.isSafeInteger(frames)||frames<1||!Array.isArray(segments)||!segments.length||segments[0].input!==0||segments[0].output!==0)throw new TypeError('Invalid warped-loop render plan.');
 validateTransform(channels,sampleRate,1,semitones);
 const cycle=frames/sampleRate,sourceCycle=channels[0].length/sampleRate,guard=Math.max(1,Math.ceil(2/cycle)),cycles=2*guard+1;
 if(channels.length*(channels[0].length*cycles+frames)*4>512*1024*1024)throw new RangeError('Warped-loop pitch render exceeds the512MiB prototype PCM budget.');
 const events=[];
 for(let n=0;n<cycles;n++)for(let i=0;i<segments.length;i++){
  const segment=segments[i],next=segments[i+1]||{input:sourceCycle,output:cycle};
  if(!Number.isFinite(segment.input)||!Number.isFinite(segment.output)||segment.input<0||segment.output<0||next.input<=segment.input||next.output<=segment.output||next.input>sourceCycle+1e-8||next.output>cycle+1e-8)throw new RangeError('Warped-loop segments must increase within each cycle.');
  const rate=(next.input-segment.input)/(next.output-segment.output),pitch=semitones+(keylock?0:12*Math.log2(rate));validateTransform(channels,sampleRate,rate,pitch);
  events.push({active:true,input:n*sourceCycle+segment.input,output:n*cycle+segment.output,rate,semitones:pitch});
 }
 await loadWarpProcessor();globalThis.sampleRate=sampleRate;globalThis.currentTime=0;
 const processor=new WarpProcessor({numberOfOutputs:1,outputChannelCount:[channels.length]});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Warped-loop pitch DSP initialization timed out.')),20000);processor.port.postMessage=message=>{if(message[0]==='ready'){clearTimeout(timer);resolve();}};});
 let id=0;const send=(method,...args)=>processor.port.onmessage({data:[id++,method,...args]});
 const repeated=channels.map(channel=>{const all=new Float32Array(channel.length*cycles);for(let n=0;n<cycles;n++)all.set(channel,n*channel.length);return all;});
 // Offline profile: larger FFT resolution than the live default. Keep the
 // published time-map/output-latency compensation instead of an unaligned
 // streaming clock. Supply the complete block+interval seek history.
 const wasm=processor.wasmModule;
 processor.config={...processor.config,blockMs:240,intervalMs:60};processor.configure();
 processor.bufferLength=wasm._blockSamples()+wasm._intervalSamples();
 const bytes=processor.bufferLength*4,pointer=wasm._setBuffers(channels.length,processor.bufferLength);
 processor.buffersIn=channels.map((_,c)=>pointer+c*bytes);processor.buffersOut=channels.map((_,c)=>pointer+(c+channels.length)*bytes);
 send('addBuffers',repeated);for(const event of events)send('schedule',event);
 const output=channels.map(()=>new Float32Array(frames)),block=channels.map(()=>new Float32Array(128)),first=guard*frames,last=first+frames,total=cycles*frames;
 for(let offset=0;offset<total;offset+=128){
  globalThis.currentTime=offset/sampleRate;processor.process([[]],[block],{});
  const from=Math.max(first,offset),to=Math.min(last,offset+128);
  if(to>from)for(let c=0;c<channels.length;c++)output[c].set(block[c].subarray(from-offset,to-offset),from-first);
  if(offset%(128*256)===0){onProgress(offset/total);await new Promise(resolve=>setTimeout(resolve,0));}
 }
 onProgress(1);return output;
}
