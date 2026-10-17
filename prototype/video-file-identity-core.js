import {sha256} from './vendor/noble-hashes/sha2.js';

// One incremental read at a time. The file size is not a product limit: offsets
// must remain exactly representable by the browser's numeric Blob API.
export const videoIdentityChunkBytes = 1024 * 1024;
const blobSize = typeof Blob === 'function' ? Object.getOwnPropertyDescriptor(Blob.prototype, 'size').get : null;
const blobSlice = typeof Blob === 'function' ? Blob.prototype.slice : null;
const blobRead = typeof Blob === 'function' ? Blob.prototype.arrayBuffer : null;
export function videoBlobSize(blob) {
  if (!blobSize) throw new Error('Blob support is unavailable for video file identity.');
  let size;
  try { size = blobSize.call(blob); }
  catch { throw new TypeError('Video file identity requires a real Blob or File.'); }
  if (!Number.isSafeInteger(size) || size < 0)
    throw new RangeError('Blob size cannot be represented exactly for incremental reads.');
  return size;
}
export function videoIdentityAbortError() {
  return new DOMException('Video file identity was aborted.', 'AbortError');
}
function checkAbort(signal) { if (signal?.aborted) throw videoIdentityAbortError(); }
export async function hashVideoBlob(blob, {signal, onProgress} = {}) {
  const total = videoBlobSize(blob);
  if (onProgress !== undefined && typeof onProgress !== 'function') throw new TypeError('onProgress must be a function.');
  checkAbort(signal);
  const hash = sha256.create();
  const progress = loaded => {
    checkAbort(signal);
    onProgress?.({loaded, total, ratio: total ? loaded / total : 1});
    checkAbort(signal);
  };
  try {
    progress(0);
    for (let start = 0; start < total; start += videoIdentityChunkBytes) {
      checkAbort(signal);
      const end = Math.min(total, start + videoIdentityChunkBytes);
      const part = blobSlice.call(blob, start, end);
      const buffer = await blobRead.call(part);
      checkAbort(signal);
      if (buffer.byteLength !== end - start) throw new Error('Video file slice returned an incomplete read.');
      hash.update(new Uint8Array(buffer));
      progress(end);
    }
    checkAbort(signal);
    return 'sha256:' + Array.from(hash.digest(), byte => byte.toString(16).padStart(2, '0')).join('');
  } finally { hash.destroy(); }
}
