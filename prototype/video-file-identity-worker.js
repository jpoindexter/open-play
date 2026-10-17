import {hashVideoBlob} from './video-file-identity-core.js';
let started = false;
self.onmessage = async event => {
  if (started) return;
  started = true;
  try {
    if (event.data?.type !== 'hash') throw new TypeError('Unsupported video identity worker request.');
    const identity = await hashVideoBlob(event.data.file, {
      onProgress: progress => self.postMessage({type: 'progress', ...progress}),
    });
    self.postMessage({type: 'done', identity});
  } catch (error) {
    self.postMessage({type: 'error', name: error?.name || 'Error', message: error?.message || 'Video identity failed.'});
  }
};
