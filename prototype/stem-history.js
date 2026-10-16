const prepared = new WeakMap();
export function prepareStemHistory(ctx) {
  if (!prepared.has(ctx))
    prepared.set(
      ctx,
      ctx.audioWorklet.addModule(
        new URL("./stem-history-worklet.js", import.meta.url),
      ),
    );
  return prepared.get(ctx);
}
export function createStemHistory(ctx) {
  const node = new AudioWorkletNode(ctx, "open-play-stem-history-v1", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  // Keep history running while the source is disconnected during a transport restart.
  const silent = ctx.createGain();
  silent.gain.value = 0;
  node.connect(silent);
  silent.connect(ctx.destination);
  let sequence = 0,
    disposed = false;
  const pending = new Map();
  node.port.onmessage = ({ data }) => {
    const job = pending.get(data.id);
    if (!job) return;
    pending.delete(data.id);
    const buffer = ctx.createBuffer(
      data.channels.length,
      data.channels[0].length,
      ctx.sampleRate,
    );
    data.channels.forEach((c, i) => buffer.copyToChannel(c, i));
    job.resolve(buffer);
  };
  return {
    node,
    capture(seconds) {
      if (disposed)
        return Promise.reject(
          new DOMException("History disposed", "AbortError"),
        );
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        node.port.postMessage({
          type: "capture",
          id,
          seconds,
          atTime: ctx.currentTime,
        });
      });
    },
    clear() {
      node.port.postMessage({ type: "clear" });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const job of pending.values())
        job.reject(new DOMException("History disposed", "AbortError"));
      pending.clear();
      node.port.postMessage({ type: "dispose" });
      node.disconnect();
      silent.disconnect();
      node.port.close();
    },
  };
}
