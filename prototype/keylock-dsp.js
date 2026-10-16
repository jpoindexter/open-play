// Offline host for the unmodified Signalsmith 1.3.2 AudioWorklet processor.
// Runs only in a dedicated Worker (or the serial Node signal-test process).
// Emulates the documented 128-frame AudioWorklet clock/port, not the DSP.
let Processor;
let registering;

async function loadProcessor() {
  if (!registering)
    registering = (async () => {
      globalThis.AudioWorkletProcessor = class {
        constructor() {
          this.port = { onmessage: null, postMessage: () => {} };
        }
      };
      globalThis.registerProcessor = (name, constructor) => {
        Processor = constructor;
      };
      await import("./vendor/signalsmith-stretch/SignalsmithStretch.mjs");
    })();
  await registering;
}

export function validateTransform(channels, sampleRate, tempo, semitones) {
  if (!channels.length || channels.length > 8 || !channels[0]?.length)
    throw new Error("Pitch processing needs 1–8 nonempty audio channels.");
  if (
    channels.some(
      (c) => !(c instanceof Float32Array) || c.length !== channels[0].length,
    )
  )
    throw new Error("Audio channel lengths must match.");
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000)
    throw new Error("Unsupported audio sample rate.");
  if (!Number.isFinite(tempo) || tempo < 0.25 || tempo > 4)
    throw new Error("Tempo must be between 0.25× and 4×.");
  if (!Number.isFinite(semitones) || Math.abs(semitones) > 24)
    throw new Error("Pitch must be between −24 and +24 semitones.");
}

export async function transformChannels(
  channels,
  sampleRate,
  { tempo = 1, semitones = 0, onProgress = () => {} } = {},
) {
  validateTransform(channels, sampleRate, tempo, semitones);
  await loadProcessor();
  globalThis.sampleRate = sampleRate;
  globalThis.currentTime = 0;
  const processor = new Processor({
    numberOfOutputs: 1,
    outputChannelCount: [channels.length],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Pitch DSP initialization timed out.")),
      20000,
    );
    processor.port.postMessage = (message) => {
      if (message[0] === "ready") {
        clearTimeout(timeout);
        resolve();
      }
    };
  });
  let message = 0;
  const send = (method, ...args) =>
    processor.port.onmessage({ data: [message++, method, ...args] });
  send("addBuffers", channels);
  send("schedule", {
    active: true,
    input: 0,
    output: 0,
    rate: tempo,
    semitones,
  });
  const frames = Math.max(1, Math.round(channels[0].length / tempo));
  const output = channels.map(() => new Float32Array(frames));
  const block = channels.map(() => new Float32Array(128));
  for (let offset = 0; offset < frames; offset += 128) {
    globalThis.currentTime = offset / sampleRate;
    processor.process([[]], [block], {});
    const count = Math.min(128, frames - offset);
    for (let c = 0; c < channels.length; c++)
      output[c].set(block[c].subarray(0, count), offset);
    if (offset % (128 * 256) === 0) {
      onProgress(offset / frames);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  onProgress(1);
  return output;
}
