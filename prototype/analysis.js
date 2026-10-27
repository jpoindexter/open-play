import {integratedLoudness} from './loudness.js';
import {measureTempoDrift} from './tempo-drift.js';
import {copyAnalysisInput} from './analysis-input.js';
// Independently implemented local PCM analysis. Estimates, not reference-product parity.
// Scientific methods and measured limits: docs/research/AUDIO_ANALYSIS_EVALUATION.md.
const N = 2048,
  HOP = 128;
const MAJOR = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const MINOR = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];
const NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const clamp = (x, low = 0, high = 1) => Math.min(high, Math.max(low, x));
const mean = (a) => a.reduce((sum, x) => sum + x, 0) / a.length;
const db = (x) => (x > 0 ? 20 * Math.log10(x) : null);
function fftMagnitude(input, real, imag, magnitude) {
  real.set(input);
  imag.fill(0);
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [real[i], real[j]] = [real[j], real[i]];
  }
  for (let size = 2; size <= N; size <<= 1) {
    const stepR = Math.cos((-2 * Math.PI) / size),
      stepI = Math.sin((-2 * Math.PI) / size);
    for (let start = 0; start < N; start += size) {
      let wr = 1,
        wi = 0;
      for (let j = 0; j < size / 2; j++) {
        const left = start + j,
          right = left + size / 2;
        const tr = wr * real[right] - wi * imag[right],
          ti = wr * imag[right] + wi * real[right];
        real[right] = real[left] - tr;
        imag[right] = imag[left] - ti;
        real[left] += tr;
        imag[left] += ti;
        const next = wr * stepR - wi * stepI;
        wi = wr * stepI + wi * stepR;
        wr = next;
      }
    }
  }
  for (let k = 0; k < N / 2; k++) magnitude[k] = Math.hypot(real[k], imag[k]);
}
function correlation(a, b) {
  const ma = mean(a),
    mb = mean(b);
  let sum = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] - ma,
      y = b[i] - mb;
    sum += x * y;
    aa += x * x;
    bb += y * y;
  }
  return sum / Math.sqrt(aa * bb || 1);
}
function keyFromChroma(chroma, flatness, duration) {
  const total = chroma.reduce((a, b) => a + b, 0);
  if (!total || duration < 2)
    return {
      value: null,
      confidence: 0,
      reason: "insufficient_tonal_audio",
      candidates: [],
    };
  const normalized = Array.from(chroma, (x) => x / total),
    max = Math.max(...normalized);
  const active = normalized.filter((x) => x > max * 0.14).length;
  const candidates = [];
  for (let root = 0; root < 12; root++)
    for (const [mode, profile] of [
      ["major", MAJOR],
      ["minor", MINOR],
    ]) {
      const rotated = Array.from(
        { length: 12 },
        (_, pc) => profile[(pc - root + 12) % 12],
      );
      candidates.push({
        root: NOTES[root],
        mode,
        value: NOTES[root] + (mode === "minor" ? "m" : ""),
        score: correlation(normalized, rotated),
      });
    }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0],
    gap = best.score - candidates[1].score;
  const confidence =
    clamp((best.score - 0.35) / 0.55) *
    clamp(gap / 0.12) *
    clamp((active - 1) / 3);
  const valid =
    active >= 3 && flatness < 0.25 && best.score >= 0.65 && gap >= 0.035;
  return {
    value: valid ? best.value : null,
    root: valid ? best.root : null,
    mode: valid ? best.mode : null,
    confidence: valid ? confidence : 0,
    reason: valid
      ? "estimated"
      : flatness >= 0.25
        ? "noise_like_spectrum"
        : "ambiguous_tonality",
    candidates: candidates.slice(0, 3),
    chroma: normalized,
    spectralFlatness: flatness,
  };
}
function tempoFromOnsets(envelope, frameRate, duration, minBpm, maxBpm, pulseEnvelope=envelope) {
  const average=mean(envelope), peak=envelope.reduce((a,b)=>Math.max(a,b),0);
  const centered=Array.from(envelope,x=>x-average);
  const minLag=Math.max(2,Math.floor(frameRate*60/maxBpm));
  const maxLag=Math.min(envelope.length-1,Math.ceil(frameRate*60/minBpm));
  const ac=new Float64Array(maxLag+2);
  for(let lag=minLag-1;lag<=maxLag+1;lag++){
    let sum=0,aa=0,bb=0;
    for(let i=lag;i<centered.length;i++){const a=centered[i],b=centered[i-lag];sum+=a*b;aa+=a*a;bb+=b*b;}
    ac[lag]=sum/Math.sqrt(aa*bb||1);
  }
  const candidates=[];
  for(let lag=minLag;lag<=maxLag;lag++)if(ac[lag]>=ac[lag-1]&&ac[lag]>=ac[lag+1]){
    const denominator=ac[lag-1]-2*ac[lag]+ac[lag+1];
    const delta=denominator?clamp(.5*(ac[lag-1]-ac[lag+1])/denominator,-.5,.5):0;
    const bpm=frameRate*60/(lag+delta);
    if(bpm>=minBpm&&bpm<=maxBpm)candidates.push({bpm,score:ac[lag]});
  }
  candidates.sort((a,b)=>b.score-a.score);
  // Bass transients distinguish the beat from brighter off-beat percussion.
  // Keep full-spectrum autocorrelation for tempo candidate generation.
  const pulseAverage=mean(pulseEnvelope),pulsePeak=pulseEnvelope.reduce((a,b)=>Math.max(a,b),0);
  const phaseSource=pulsePeak>1e-8?pulseEnvelope:envelope;
  const onsets=[],threshold=Math.max((pulsePeak>1e-8?pulseAverage:average)*1.5,(pulsePeak>1e-8?pulsePeak:peak)*.12);
  for(let i=1;i<phaseSource.length-1;i++)if(phaseSource[i]>threshold&&phaseSource[i]>=phaseSource[i-1]&&phaseSource[i]>phaseSource[i+1]){
    if(!onsets.length||i/frameRate-onsets.at(-1).time>.12)onsets.push({time:i/frameRate,strength:phaseSource[i]});
  }
  const unknown=(reason,confidence=0)=>({value:null,confidence,reason,method:'periodic-onset-grid-v2',candidates:candidates.slice(0,3),grid:null});
  if(duration<6||peak<1e-8||onsets.length<5||!candidates.length||candidates[0].score<.45)return unknown('insufficient_periodic_onsets');
  const fits=[];
  for(const candidate of candidates.filter(c=>c.score>=.45)){
    let period=60/candidate.bpm,phase=0,bestScore=-1;
    // Find the repeatedly supported phase; the first transient can be off-beat.
    for(let bin=0;bin<128;bin++){
      const p=bin/128*period;
      let score=0;
      for(const o of onsets){const residual=Math.abs((o.time-p)/period-Math.round((o.time-p)/period));if(residual<.12)score+=o.strength*(1-residual/.12);}
      if(score>bestScore){bestScore=score;phase=p;}
    }
    let selected=[];
    for(let pass=0;pass<3;pass++){
      const beats=new Map();
      for(const o of onsets){
        const beat=Math.round((o.time-phase)/period);
        if(Math.abs(o.time-phase-beat*period)>period*.12)continue;
        const prev=beats.get(beat);if(!prev||o.strength>prev.strength)beats.set(beat,{...o,beat});
      }
      selected=[...beats.values()];if(selected.length<5)break;
      const weight=selected.reduce((s,o)=>s+o.strength,0);
      const mx=selected.reduce((s,o)=>s+o.beat*o.strength,0)/weight,my=selected.reduce((s,o)=>s+o.time*o.strength,0)/weight;
      let numerator=0,denominator=0;
      for(const o of selected){numerator+=o.strength*(o.beat-mx)*(o.time-my);denominator+=o.strength*(o.beat-mx)**2;}
      const next=numerator/(denominator||1);
      if(!Number.isFinite(next)||Math.abs(next/(60/candidate.bpm)-1)>.02)break;
      period=next;phase=my-mx*period;
    }
    if(selected.length<5)continue;
    const possible=Math.max(1,Math.floor((onsets.at(-1).time-phase)/period)-Math.ceil((onsets[0].time-phase)/period)+1);
    // Off-beat percussion is not evidence against a steady beat. Require
    // both autocorrelation and coverage of distinct beats instead of the
    // fraction of *all* transients aligned to the first transient.
    const coverage=clamp(selected.length/possible),confidence=Math.min(clamp(candidate.score),coverage)*clamp(selected.length/12);
    fits.push({candidate,period,phase,coverage,confidence,selected:selected.length});
  }
  // Confidence is a heuristic conjunction, not a calibrated probability.
  // Require independent periodicity and beat coverage; retain the .45
  // periodicity gate and reject a grid missing more than half its beats.
  // Prefer a supported double-time octave over an accent-driven half-time
  // result, without promoting unrelated faster autocorrelation candidates.
  const valid=fits.filter(f=>f.confidence>=.45&&f.coverage>=.5).sort((a,b)=>b.confidence-a.confidence||a.period-b.period);
  if(!valid.length)return unknown('unstable_or_ambiguous_rhythm',Math.max(0,...fits.map(f=>f.confidence)));
  const strong=valid.filter(f=>f.candidate.score>=candidates[0].score*.88).sort((a,b)=>a.period-b.period);
  const leader=strong[0]||valid[0],fit=valid.find(f=>Math.abs(leader.period/f.period-2)<.04)||leader,phase=((fit.phase%fit.period)+fit.period)%fit.period,beats=[];
  for(let time=phase;time<duration;time+=fit.period)beats.push(time);
  return {value:60/fit.period,confidence:fit.confidence,reason:'estimated_constant_pulse',method:'periodic-onset-grid-v2',beatCoverage:fit.coverage,periodicity:fit.candidate.score,candidates:candidates.slice(0,3),grid:{type:'constant',bpm:60/fit.period,firstBeat:phase,beats,downbeat:null,downbeatVerified:false}};
}


export function analyzePCM(channels, sampleRate, options = {}) {
  if (
    !Array.isArray(channels) ||
    !channels.length ||
    !Number.isFinite(sampleRate) ||
    sampleRate < 8000 ||
    sampleRate > 192000
  )
    throw new TypeError(
      "Expected PCM channels and a sample rate from 8000 to 192000 Hz",
    );
  const length = channels[0].length;
  if (
    !length ||
    channels.some(
      (c) =>
        !(c instanceof Float32Array || c instanceof Float64Array) ||
        c.length !== length,
    )
  )
    throw new TypeError(
      "PCM channels must be nonempty equal-length floating-point arrays",
    );
  const minBpm = options.minBpm ?? 50,
    maxBpm = options.maxBpm ?? 220;
  if (
    !Number.isFinite(minBpm) ||
    !Number.isFinite(maxBpm) ||
    minBpm <= 0 ||
    maxBpm <= minBpm
  )
    throw new TypeError("BPM range must be positive and increasing");
  const duration = length / sampleRate;
  let sum = 0,
    peak = 0,
    clipped = 0,
    chosen = 0,
    greatestEnergy = -1;
  for (let ch = 0; ch < channels.length; ch++) {
    let energy = 0;
    for (const sample of channels[ch]) {
      if (!Number.isFinite(sample))
        throw new TypeError("PCM contains a non-finite sample");
      energy += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
      if (Math.abs(sample) >= 1) clipped++;
    }
    sum += energy;
    if (energy > greatestEnergy) {
      chosen = ch;
      greatestEnergy = energy;
    }
  }
  const rms = Math.sqrt(sum / (length * channels.length));
  const gain = {
    method: "ungated_pcm_rms",
    rms,
    rmsDbfs: db(rms),
    samplePeak: peak,
    samplePeakDbfs: db(peak),
    clippedSamples: clipped,
    targetRmsDbfs: -14,
    recommendedDb:
      rms > 1e-6 ? Math.min(12, -14 - db(rms), -1 - db(peak)) : null,
    truePeakMeasured: false,
    lufsMeasured: false,
  };
  const maxSeconds = options.maxSeconds ?? 180;
  if (!Number.isFinite(maxSeconds) || maxSeconds <= 0)
    throw new TypeError("maxSeconds must be positive");
  const analyzedDuration = Math.min(duration, maxSeconds);
  const result = {
    version: "open-play-pcm-v1",
    duration,
    analyzedDuration,
    partial: analyzedDuration < duration,
    gain,
    loudness:integratedLoudness(channels,sampleRate),
    bpm: null,
    key: null,
    tempo: null,
    keyEstimate: null,
    grid: null,
    warnings: [],
  };
  if (rms < 1e-6 || duration < 0.25) {
    result.warnings.push(rms < 1e-6 ? "silent_audio" : "audio_too_short");
    return result;
  }
  if (options.analyzeTempo === false && options.analyzeKey === false) {
    result.tempo = {value:null, confidence:0, reason:"tempo_analysis_disabled", grid:null};
    result.keyEstimate = {value:null, confidence:0, reason:"key_analysis_disabled", candidates:[]};
    if (result.partial) result.warnings.push("tempo_and_key_analyzed_first_" + maxSeconds + "_seconds");
    result.warnings.push(result.tempo.reason, result.keyEstimate.reason, "constant_grid_requires_downbeat_review");
    options.onProgress?.(1);
    return result;
  }
  // Use highest-energy channel to avoid cancellation with out-of-phase stereo material.
  const factor = Math.max(1, Math.floor(sampleRate / 11025)),
    rate = sampleRate / factor;
  const mono = new Float32Array(
    Math.floor((analyzedDuration * sampleRate) / factor),
  );
  for (let i = 0; i < mono.length; i++) {
    let total = 0;
    for (let j = 0; j < factor; j++)
      total += channels[chosen][i * factor + j] || 0;
    mono[i] = total / factor;
  }
  // A short, causal bass-energy envelope timestamps kick attacks directly.
  // The centered 2048-sample tonal FFT sees bass attacks early (a large
  // fraction of its window), so it is unsuitable as a beat-phase clock.
  const bass = new Float32Array(mono.length);
  const highAlpha = Math.exp(-2 * Math.PI * 35 / rate);
  const lowAlpha = 1 - Math.exp(-2 * Math.PI * 250 / rate);
  let high = 0, low = 0, previousSample = 0;
  for (let i = 0; i < mono.length; i++) {
    high = highAlpha * (high + mono[i] - previousSample);
    previousSample = mono[i];
    low += lowAlpha * (high - low);
    bass[i] = low;
  }
  const frames = Math.ceil(mono.length / HOP),
    envelope = new Float64Array(frames),
    pulseEnvelope = new Float64Array(frames),
    chroma = new Float64Array(12);
  const real = new Float64Array(N),
    imag = new Float64Array(N),
    magnitude = new Float64Array(N / 2),
    previous = new Float64Array(N / 2),
    input = new Float64Array(N);
  const window = Float64Array.from(
    { length: N },
    (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)),
  );
  let priorBassEnergy = 0;
  let flatnessTotal = 0,
    tonalFrames = 0;
  for (let frame = 0; frame < frames; frame++) {
    const offset = frame * HOP - N / 2;
    for (let j = 0; j < N; j++) input[j] = (mono[offset + j] || 0) * window[j];
    fftMagnitude(input, real, imag, magnitude);
    let flux = 0,
      arithmetic = 0,
      logarithmic = 0,
      count = 0;
    for (let k = 2; k < N / 2; k++) {
      const value = Math.log1p(magnitude[k] * 10);
      const increase = Math.max(0, value - previous[k]);
      flux += increase;
      previous[k] = value;
      if ((k * rate) / N >= 70 && (k * rate) / N <= 3500) {
        arithmetic += magnitude[k];
        logarithmic += Math.log(magnitude[k] + 1e-12);
        count++;
      }
    }
    envelope[frame] = flux;
    let bassEnergy = 0;
    for (let j = frame * HOP; j < Math.min(bass.length, (frame + 1) * HOP); j++) bassEnergy += bass[j] * bass[j];
    bassEnergy = Math.sqrt(bassEnergy / HOP);
    pulseEnvelope[frame] = Math.max(0, bassEnergy - priorBassEnergy);
    priorBassEnergy = bassEnergy;
    if (frame % 4 === 0 && arithmetic > 1e-6) {
      flatnessTotal += Math.exp(logarithmic / count) / (arithmetic / count);
      tonalFrames++;
      for (
        let k = Math.ceil((70 * N) / rate);
        k < Math.min(N / 2 - 1, (3500 * N) / rate);
        k++
      ) {
        const value = magnitude[k];
        if (value <= magnitude[k - 1] || value < magnitude[k + 1]) continue;
        const left = Math.log(magnitude[k - 1] + 1e-12),
          center = Math.log(value + 1e-12),
          right = Math.log(magnitude[k + 1] + 1e-12);
        const denom = left - 2 * center + right,
          delta = denom ? clamp((0.5 * (left - right)) / denom, -0.5, 0.5) : 0;
        const midi = 69 + 12 * Math.log2(((k + delta) * rate) / N / 440),
          rounded = Math.round(midi),
          distance = Math.abs(midi - rounded);
        if (distance < 0.4)
          chroma[((rounded % 12) + 12) % 12] +=
            value * value * Math.cos(distance * Math.PI) ** 2;
      }
    }
    if (frame % 128 === 0) options.onProgress?.(frame / frames);
  }
  result.tempo = options.analyzeTempo === false ? {value:null, confidence:0, reason:"tempo_analysis_disabled", grid:null} : tempoFromOnsets(
    envelope,
    rate / HOP,
    analyzedDuration,
    minBpm,
    maxBpm,
    pulseEnvelope,
  );
  result.keyEstimate = options.analyzeKey === false ? {value:null, confidence:0, reason:"key_analysis_disabled", candidates:[]} : keyFromChroma(
    chroma,
    flatnessTotal / (tonalFrames || 1),
    analyzedDuration,
  );
  result.bpm = result.tempo.value;
  result.key = result.keyEstimate.value;
  result.grid = result.tempo.grid;
  if(result.grid){
    result.grid.drift=measureTempoDrift(channels[chosen],sampleRate,{bpm:result.bpm,firstBeat:result.grid.firstBeat,fitDuration:analyzedDuration});
    if(result.grid.drift.detected)result.warnings.push('tempo_drift_detected');
  }
  if (result.partial)
    result.warnings.push(
      "tempo_and_key_analyzed_first_" + maxSeconds + "_seconds",
    );
  if (!result.bpm) result.warnings.push(result.tempo.reason);
  if (!result.key) result.warnings.push(result.keyEstimate.reason);
  result.warnings.push("constant_grid_requires_downbeat_review");
  options.onProgress?.(1);
  return result;
}

export async function analyzeBuffer(buffer, options = {}) {
  if (options.signal?.aborted)
    return Promise.reject(new DOMException("Analysis cancelled", "AbortError"));
  if (typeof Worker === "undefined")
    return Promise.resolve(
      analyzePCM(
        Array.from({ length: buffer.numberOfChannels }, (_, i) =>
          buffer.getChannelData(i),
        ),
        buffer.sampleRate,
        options,
      ),
    );
  const {signal,minBpm,maxBpm,maxSeconds,analyzeTempo,analyzeKey}=options;
  const channels=await copyAnalysisInput(buffer,signal);
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Analysis cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(
      new URL("./analysis-worker.js", import.meta.url),
      { type: "module" },
    );
    const finish = () => {
      worker.terminate();
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      finish();
      reject(new DOMException("Analysis cancelled", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || "Analysis worker failed"));
    };
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") options.onProgress?.(data.value);
      else {
        finish();
        data.type === "error"
          ? reject(new Error(data.message))
          : resolve(data.result);
      }
    };
    try { worker.postMessage(
      {
        channels,
        sampleRate: buffer.sampleRate,
        options: { minBpm, maxBpm, maxSeconds, analyzeTempo, analyzeKey },
      },
      channels.map((c) => c.buffer),
    ); } catch(error) {finish();reject(error);}
  });
}
