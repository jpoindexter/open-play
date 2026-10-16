const prepared = new WeakMap();
export function prepareStemSlip(ctx) {
  if (!prepared.has(ctx)) prepared.set(ctx, ctx.audioWorklet.addModule(new URL('./stem-slip-worklet.js', import.meta.url)));
  return prepared.get(ctx);
}
export function createStemSlipTransport(ctx, {onState = () => {}, onError = () => {}} = {}) {
  const node = new AudioWorkletNode(ctx, 'open-play-stem-slip-v1', {
    numberOfInputs: 0, numberOfOutputs: 4, outputChannelCount: [2, 2, 2, 2],
  });
  let latest = {position: 0, selectedPosition: 0, playing: false, audition: false, phase: 'idle', audioTime: ctx.currentTime, rate: 1, velocity: 1}, sequence = 0, disposed = false;
  const pending = new Map();
  node.port.onmessage = ({data}) => {
    latest = data.state;
    if (data.id) { pending.get(data.id)?.resolve(latest); pending.delete(data.id); }
    onState(latest);
  };
  node.onprocessorerror = () => {
    const error = new Error('Stem Slip audio processor failed.');
    for (const job of pending.values()) job.reject(error);
    pending.clear(); onError(error);
  };
  function send(type, data = {}, transfer = []) {
    if (disposed) return Promise.reject(new DOMException('Stem Slip transport stopped.', 'AbortError'));
    return new Promise((resolve, reject) => {
      const id = ++sequence; pending.set(id, {resolve, reject});
      node.port.postMessage({...data, type, id}, transfer);
    });
  }
  return {
    node,
    command: send,
    replaceBuffers(buffers, scale, options = {}) {
      const data = buffers.map(buffer => ({sampleRate: buffer.sampleRate,
        channels: Array.from({length: buffer.numberOfChannels}, (_, c) => buffer.getChannelData(c).slice())}));
      return send('buffers', {...options, buffers: data, scale}, data.flatMap(buffer => buffer.channels.map(channel => channel.buffer)));
    },
    state() {
      const elapsed = Math.max(0, ctx.currentTime - Math.max(latest.audioTime, latest.startAt || 0));
      const state = {...latest, release: latest.release && {...latest.release}};
      if (state.playing) state.position = Math.min(state.duration, state.position + elapsed * state.rate);
      if (state.playing || state.audition) state.selectedPosition += elapsed * state.velocity;
      if (state.loop && state.phase !== 'releasing') {
        const length = state.loop.end - state.loop.start;
        if (state.selectedPosition >= state.loop.end || state.selectedPosition < state.loop.start)
          state.selectedPosition = state.loop.start + ((state.selectedPosition - state.loop.start) % length + length) % length;
      }
      if (state.release && state.playing) {
        state.release.remainingBeats = Math.max(0, state.release.remainingBeats - elapsed * state.rate * state.bpm / 60);
        if (!state.release.remainingBeats) { state.phase = 'idle'; state.release = null; state.selectedPosition = state.position; }
      }
      if (state.phase === 'idle' && !state.loop && !state.reverse) state.selectedPosition = state.position;
      return state;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const job of pending.values()) job.reject(new DOMException('Stem Slip transport stopped.', 'AbortError'));
      pending.clear(); node.port.postMessage({type: 'dispose'}); node.disconnect(); node.port.close();
    },
  };
}
