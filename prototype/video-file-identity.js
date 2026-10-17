import {videoBlobSize, videoIdentityAbortError} from './video-file-identity-core.js';

// Every request owns one module worker. There is no whole-file/main-thread hash
// fallback and no cache: independently chosen files are compared by real bytes.
export async function videoFileIdentity(file, {signal, onProgress} = {}) {
  const total = videoBlobSize(file);
  if (signal != null) {
    try { Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get.call(signal); }
    catch { throw new TypeError('signal must be a real AbortSignal.'); }
  }
  if (onProgress !== undefined && typeof onProgress !== 'function') throw new TypeError('onProgress must be a function.');
  if (signal?.aborted) throw videoIdentityAbortError();
  if (typeof Worker !== 'function') {
    const error = new Error('Module Worker support is required for video file identity.');
    error.code = 'VIDEO_IDENTITY_WORKER_UNAVAILABLE'; throw error;
  }
  return new Promise((resolve, reject) => {
    let worker, settled = false, loaded = -1;
    const finish = (error, identity) => {
      if (settled) return;
      settled = true;
      if (signal) EventTarget.prototype.removeEventListener.call(signal, 'abort', abort);
      if (worker) {
        worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null;
        worker.terminate();
      }
      if (error) reject(error); else resolve(identity);
    };
    const abort = () => finish(videoIdentityAbortError());
    try {
      worker = new Worker(new URL('./video-file-identity-worker.js', import.meta.url), {
        type: 'module', name: 'open-play-video-file-identity',
      });
      worker.onmessage = event => {
        if (settled) return;
        try {
          const message = event.data;
          if (message?.type === 'progress') {
            if (message.total !== total || !Number.isSafeInteger(message.loaded) ||
                message.loaded < 0 || message.loaded > total || message.loaded < loaded)
              throw new Error('Invalid video identity worker progress.');
            loaded = message.loaded;
            onProgress?.({loaded, total, ratio: total ? loaded / total : 1});
          } else if (message?.type === 'done') {
            if (loaded !== total || typeof message.identity !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(message.identity))
              throw new Error('Invalid video identity worker result.');
            finish(null, message.identity);
          } else if (message?.type === 'error') {
            const error = new Error(typeof message.message === 'string' ? message.message : 'Video identity worker failed.');
            error.name = typeof message.name === 'string' ? message.name : 'Error';
            finish(error);
          } else throw new Error('Unsupported video identity worker response.');
        } catch (error) { finish(error); }
      };
      worker.onerror = event => { event.preventDefault?.(); finish(new Error(event.message || 'Video identity worker failed to load or execute.')); };
      worker.onmessageerror = () => finish(new Error('Video identity worker response could not be decoded.'));
      if (signal) EventTarget.prototype.addEventListener.call(signal, 'abort', abort, {once: true});
      if (signal?.aborted) { abort(); return; }
      worker.postMessage({type: 'hash', file});
    } catch (error) { finish(error); }
  });
}
