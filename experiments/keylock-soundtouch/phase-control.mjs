// One immutable normalized ramp buffer per context/period; each node owns only
// a looping source and its connection to its own AudioParam. Never audible.
const cached = new WeakMap();
export function createPhaseControl(context, parameter, {anchorFrame, periodFrames}) {
  if (!Number.isSafeInteger(anchorFrame) || anchorFrame < 0 || anchorFrame % 128 || !Number.isInteger(periodFrames) ||
    periodFrames < 256 || periodFrames > 2 ** 22 || periodFrames % 128) throw new RangeError('Invalid phase control geometry');
  const future = () => { if (anchorFrame / context.sampleRate <= context.currentTime) throw Object.assign(new Error('Phase anchor already passed; do not silently rebase it'), {name:'LateScheduleError'}); };
  future();
  let buffers = cached.get(context);
  if (!buffers) { buffers = new Map(); cached.set(context, buffers); }
  let buffer = buffers.get(periodFrames);
  if (!buffer) {
    buffer = context.createBuffer(1, periodFrames, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < periodFrames; i++) data[i] = i / periodFrames;
    if (buffers.size >= 4) buffers.delete(buffers.keys().next().value);
    buffers.set(periodFrames, buffer);
  }
  future();
  const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
  source.loopStart = 0; source.loopEnd = periodFrames / context.sampleRate; source.playbackRate.value = 1;
  const when = anchorFrame / context.sampleRate;
  source.connect(parameter); parameter.setValueAtTime(0, when); source.start(when);
  let disposed = false;
  return {
    snapshot: () => ({anchorFrame,periodFrames,periodSeconds:periodFrames/context.sampleRate,sharedBufferPCMBytes:buffer.length*4,disposed,
      ownership:'Shared immutable per-context phase buffer; this connection/source is node-owned. Excludes other context/DSP allocations.'}),
    dispose() { if (disposed) return; disposed = true; source.stop(); source.disconnect(); source.buffer = null; }
  };
}
