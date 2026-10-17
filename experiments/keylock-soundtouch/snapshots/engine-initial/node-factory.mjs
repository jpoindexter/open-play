const registrations = new WeakMap();
const failure = (name, message) => Object.assign(new Error(message), {name});
const restored = details => Object.assign(new Error(details.message), {name: details.name, processorStack: details.stack});
export default async function createSoundTouchNode(context, options, {signal, durationFrames, onError = () => {}} = {}) {
  if (signal?.aborted) throw failure('AbortError', 'Node preparation canceled');
  const channels = options.outputChannelCount?.[0];
  if (!Number.isInteger(channels) || channels < 1 || channels > 8 || !Number.isSafeInteger(durationFrames) || durationFrames < 1) throw new RangeError('Explicit channel geometry and true duration are required');
  let registration = registrations.get(context);
  if (!registration) {
    registration = context.audioWorklet.addModule(new URL('./node-worklet.mjs', import.meta.url));
    registrations.set(context, registration);
    registration.catch(() => { if (registrations.get(context) === registration) registrations.delete(context); });
  }
  await registration;
  if (signal?.aborted) throw failure('AbortError', 'Node preparation canceled');
  const node = new AudioWorkletNode(context, 'open-play-windowed-soundtouch-experiment', {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [channels],
    channelCount: channels, channelCountMode: 'explicit', channelInterpretation: 'discrete',
    processorOptions: {channels, durationFrames}
  });
  // Ensure readiness/currentFrame while the caller has not connected the node.
  // This bridge is always muted and is removed during terminal cleanup.
  const keepAlive = context.createGain(); keepAlive.gain.value = 0; node.connect(keepAlive); keepAlive.connect(context.destination);
  const pending = new Map(); let sequence = 0, terminal = null, disposePromise = null, disposedSnapshot = null;
  let readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  function cleanup(cause) {
    terminal ??= cause;
    signal?.removeEventListener('abort', aborted);
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(cause); }
    pending.clear(); readyReject(cause);
    node.disconnect(); keepAlive.disconnect(); node.port.close();
  }
  function fatal(cause) { if (terminal) return; cleanup(cause); try { onError(cause); } catch {} }
  const aborted = () => { node.dispose().catch(() => {}); };
  node.port.onmessage = ({data}) => {
    if (data.type === 'ready') { readyResolve(data); return; }
    if (data.type === 'fatal') { fatal(restored(data.error)); return; }
    const request = pending.get(data.id); if (!request) return;
    pending.delete(data.id); clearTimeout(request.timer);
    if (data.error) request.reject(restored(data.error)); else request.resolve(data.value);
  };
  node.addEventListener('processorerror', () => fatal(failure('ProcessorError', 'SoundTouch processor failed')));
  function request(type, args = [], transfers = [], timeout = 5000) {
    if (terminal) return Promise.reject(terminal);
    return new Promise((resolve, reject) => {
      const id = ++sequence, timer = setTimeout(() => { pending.delete(id); const cause = failure('TimeoutError', `${type} acknowledgement timed out`); reject(cause); fatal(cause); }, timeout);
      pending.set(id, {resolve, reject, timer});
      try { node.port.postMessage({id, type, args}, transfers); }
      catch (cause) { pending.delete(id); clearTimeout(timer); reject(cause); }
    });
  }
  node.latency = async () => {
    if (terminal) throw terminal;
    return .12; // Explicit preparation-lead budget; NOT measured audible latency.
  };
  node.addBuffers = (channels, transfers = []) => request('addBuffers', [channels], transfers);
  node.dropBuffers = before => request('dropBuffers', [before]);
  node.schedule = command => request('schedule', [command]);
  node.stop = output => request('stop', [output]);
  node.snapshot = () => disposedSnapshot ? Promise.resolve(disposedSnapshot) : request('snapshot');
  node.dispose = () => {
    if (disposePromise) return disposePromise;
    disposePromise = (async () => {
      try { if (!terminal) disposedSnapshot = await request('dispose', [], [], 2000); }
      finally { cleanup(failure('AbortError', 'SoundTouch node disposed')); }
      return disposedSnapshot ?? {disposed: true, processorReleaseAcknowledged: false};
    })();
    return disposePromise;
  };
  signal?.addEventListener('abort', aborted, {once: true});
  const timer = setTimeout(() => fatal(failure('TimeoutError', 'SoundTouch processor readiness timed out')), 5000);
  try { await ready; if (signal?.aborted) throw failure('AbortError', 'Node preparation canceled'); return node; }
  catch (cause) { await node.dispose().catch(() => {}); throw cause; }
  finally { clearTimeout(timer); }
}
