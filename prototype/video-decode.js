// loadeddata/readyState can precede a drawable frame in this browser. Confirm
// an actual presented decode on the muted source before committing a replacement.
export async function primeDecodedVideo(video, {isCurrent = () => true, timeoutMs = 10000} = {}) {
  if (!video.muted) throw new Error('Video source priming requires muted source audio.');
  if (typeof video.requestVideoFrameCallback !== 'function')
    throw new Error('This browser cannot confirm a decoded video frame: requestVideoFrameCallback is unavailable.');
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) throw new RangeError('Video decode timeout must be positive finite milliseconds.');
  let callback, timer;
  const frame = new Promise((resolve, reject) => {
    callback = video.requestVideoFrameCallback((_, metadata) => {
      if (!isCurrent()) return reject(new Error('Video decode request was superseded.'));
      if (!Number.isInteger(metadata.width) || !Number.isInteger(metadata.height) || metadata.width < 1 || metadata.height < 1)
        return reject(new Error('The decoded video frame has no valid dimensions.'));
      resolve({mediaTime:metadata.mediaTime, presentedFrames:metadata.presentedFrames,
        width:metadata.width, height:metadata.height});
    });
  });
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Video frame/play readiness exceeded the decode timeout.')), timeoutMs);
  });
  try {
    const [metadata] = await Promise.race([deadline, Promise.all([frame, Promise.resolve().then(() => {
      if (!isCurrent()) throw new Error('Video decode request was superseded.');
      return video.play();
    })])]);
    if (!isCurrent()) throw new Error('Video decode request was superseded.');
    return metadata;
  } finally {
    clearTimeout(timer); video.cancelVideoFrameCallback?.(callback); video.pause();
  }
}
