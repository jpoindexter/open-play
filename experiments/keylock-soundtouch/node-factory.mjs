import {createPhaseControl} from './phase-control.mjs';
const registrations = new WeakMap();
const diagnostics = new WeakMap();
export const soundTouchFactoryDiagnostics = context => [...(diagnostics.get(context) ?? [])];
function diagnostic(context, value) { let rows = diagnostics.get(context); if (!rows) { rows = []; diagnostics.set(context, rows); } rows.push({...value, observedAtContextTime: context.currentTime}); if (rows.length > 128) rows.shift(); }

const failure = (name, message) => Object.assign(new Error(message), {name});
const restored = details => Object.assign(new Error(details.message), {name: details.name, processorStack: details.stack, diagnostic: details.diagnostic});
// Per-caller lifetime around shared registration. Aborting one waiter must not
// cancel or poison module registration used by another node in the same context.
function awaitRegistration(registration, signal) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (value, cause) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', aborted); cause ? reject(cause) : resolve(value); };
    const aborted = () => finish(null, failure('AbortError', 'Node registration canceled'));
    const timer = setTimeout(() => finish(null, failure('TimeoutError', 'SoundTouch module registration timed out')), 5000);
    signal?.addEventListener('abort', aborted, {once: true});
    if (signal?.aborted) aborted();
    registration.then(value => finish(value), cause => finish(null, cause));
  });
}
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
  await awaitRegistration(registration, signal);
  if (signal?.aborted) throw failure('AbortError', 'Node preparation canceled');
  const anchorFrame = Math.ceil((context.currentTime + .05) * context.sampleRate / 128) * 128;
  const periodFrames = Math.round(context.sampleRate * 4 / 128) * 128;
  const node = new AudioWorkletNode(context, 'open-play-windowed-soundtouch-experiment', {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [channels],
    channelCount: channels, channelCountMode: 'explicit', channelInterpretation: 'discrete',
    processorOptions: {channels, durationFrames, anchorFrame, periodFrames}
  });
  let phaseControl = null;
  // Ensure readiness/currentFrame while the caller has not connected the node.
  // This bridge is always muted and is removed during terminal cleanup.
  const keepAlive = context.createGain(); keepAlive.gain.value = 0; node.connect(keepAlive); keepAlive.connect(context.destination);
  const pending = new Map(); let sequence = 0, terminal = null, disposePromise = null, disposedSnapshot = null;
  let readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  ready.catch(() => {}); // Preparation may fail before the readiness await is reached.
  function cleanup(cause) {
    terminal ??= cause;
    signal?.removeEventListener('abort', aborted);
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(cause); }
    pending.clear(); readyReject(cause);
    phaseControl?.dispose(); node.disconnect(); keepAlive.disconnect(); node.port.close();
  }
  function fatal(cause) { if (terminal) return; diagnostic(context, {type:'fatal', name:cause.name, message:cause.message, diagnostic:cause.diagnostic}); cleanup(cause); try { onError(cause); } catch {} }
  const aborted = () => { node.dispose().catch(() => {}); };
  node.port.onmessage = ({data}) => {
    if (data.type === 'ready') { diagnostic(context, {type:'ready', frame:data.frame, globalFrame:data.globalFrame, clock:data.clock}); readyResolve(data); return; }
    if (data.type === 'fatal') { fatal(restored({...data.error,diagnostic:data.diagnostic})); return; }
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
  node.snapshot = () => disposedSnapshot ? Promise.resolve(disposedSnapshot) : request('snapshot').then(value => ({...value,phaseControl:(phaseControl?.snapshot() ?? {created:false,disposed:true})}));
  node.dispose = () => {
    if (disposePromise) return disposePromise;
    disposePromise = (async () => {
      try { if (!terminal) disposedSnapshot = await request('dispose', [], [], 2000); }
      finally { cleanup(failure('AbortError', 'SoundTouch node disposed')); }
      if (disposedSnapshot) disposedSnapshot = {...disposedSnapshot,phaseControl:(phaseControl?.snapshot() ?? {created:false,disposed:true})};
      return disposedSnapshot ?? {disposed: true, processorReleaseAcknowledged: false,phaseControl:(phaseControl?.snapshot() ?? {created:false,disposed:true})};
    })();
    return disposePromise;
  };
  signal?.addEventListener('abort', aborted, {once: true});
  const timer = setTimeout(() => fatal(failure('TimeoutError', 'SoundTouch processor readiness timed out')), 5000);
  try { phaseControl = createPhaseControl(context, node.parameters.get('renderClock'), {anchorFrame, periodFrames}); await ready; if (signal?.aborted) throw failure('AbortError', 'Node preparation canceled'); return node; }
  catch (cause) { let cleanupError = null; await node.dispose().catch(error => { cleanupError = {name:error.name,message:error.message}; }); diagnostic(context, {type:'preparation-failed',name:cause.name,message:cause.message,processorRelease:disposedSnapshot,cleanupError}); throw cause; }
  finally { clearTimeout(timer); }
}
