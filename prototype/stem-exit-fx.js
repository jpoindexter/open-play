// Independent stem exit processors. Only pre-trigger audio is copied; no live input.
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function positive(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
function interpolate(channel, position) {
  if (position < 0 || position >= channel.length) return 0;
  const index = Math.floor(position),
    fraction = position - index;
  return channel[index] * (1 - fraction) + (channel[index + 1] || 0) * fraction;
}
/**
 * Pure renderer used by the actual browser factory and deterministic signal tests.
 * offset is in the supplied buffer's seconds, rate is its current playback rate,
 * and bpm is the audible deck tempo. Prepared/reversed buffers need no special case.
 */
export function renderStemExitPCM({
  channels,
  sampleRate,
  offset = 0,
  rate = 1,
  bpm = 120,
  kind = "echo",
}) {
  if (!["echo", "brake"].includes(kind))
    throw new Error(`Unknown stem exit effect: ${kind}`);
  if (!channels?.length || channels.some((c) => !(c instanceof Float32Array)))
    throw new Error("Stem exit requires decoded Float32 PCM channels.");
  const sr = positive(sampleRate, 48000),
    speed = clamp(positive(rate, 1), 0.05, 8),
    tempo = clamp(positive(bpm, 120), 20, 400);
  const beatSeconds = 60 / tempo,
    inputFrames = Math.max(2, Math.ceil(beatSeconds * speed * sr));
  const totalInput = Math.min(...channels.map((c) => c.length));
  const captureEnd = clamp(
      Math.floor((Number.isFinite(offset) ? offset : 0) * sr),
      0,
      totalInput,
    ),
    captureStart = captureEnd - inputFrames;
  const captured = channels.map((channel) => {
    const result = new Float32Array(inputFrames);
    const first = Math.max(0, captureStart),
      last = captureEnd;
    if (last > first)
      result.set(channel.subarray(first, last), first - captureStart);
    return result;
  });
  // Echo has a fixed independent decay policy: -9dB per beat, finite 9-beat exit.
  const echoRepeats = 9,
    feedback = 0.355;
  const duration = kind === "brake" ? beatSeconds : beatSeconds * echoRepeats;
  const frames = Math.max(2, Math.ceil(duration * sr)),
    fadeFrames = Math.max(
      1,
      Math.min(Math.floor(sr * 0.003), Math.floor(inputFrames / 8)),
    );
  const output = captured.map((channel) => {
    const result = new Float32Array(frames);
    for (let n = 0; n < frames; n++) {
      const t = n / sr,
        progress = Math.min(1, t / duration);
      let position, gain;
      if (kind === "brake") {
        // Integrating a linear speed ramp gives a quadratic read-head trajectory.
        // The final half of the capture is traversed, never post-trigger input.
        position =
          inputFrames -
          (speed * beatSeconds * sr) / 2 +
          speed * sr * (t - (t * t) / (2 * beatSeconds));
        gain = (1 - progress) ** 1.4;
      } else {
        const phase = (t / beatSeconds) % 1;
        position = phase * inputFrames;
        gain = Math.pow(feedback, t / beatSeconds);
        // Captured-loop boundaries have a short fade to avoid hard wrap clicks.
        gain *= Math.min(
          1,
          position / fadeFrames,
          (inputFrames - position) / fadeFrames,
        );
      }
      gain *= Math.min(1, n / Math.max(1, Math.floor(sr * 0.003)));
      result[n] = interpolate(channel, position) * Math.max(0, gain);
    }
    // Exact zero at the terminal frame; no infinite feedback or orphan tail.
    result[frames - 1] = 0;
    return result;
  });
  return {
    channels: output,
    sampleRate: sr,
    duration: frames / sr,
    beatSeconds,
    kind,
    capture: {
      startFrame: Math.max(0, captureStart),
      endFrameExclusive: captureEnd,
      paddedFrames: Math.max(0, -captureStart),
      inputFrames,
    },
    feedback: kind === "echo" ? feedback : null,
  };
}
export function createStemExitFX(
  ctx,
  { buffer, offset = 0, rate = 1, bpm = 120, kind = "echo" },
) {
  if (!buffer || !Number.isFinite(buffer.numberOfChannels))
    throw new Error("A decoded stem AudioBuffer is required.");
  const rendered = renderStemExitPCM({
    channels: Array.from({ length: buffer.numberOfChannels }, (_, c) =>
      buffer.getChannelData(c),
    ),
    sampleRate: buffer.sampleRate,
    offset,
    rate,
    bpm,
    kind,
  });
  const audio = ctx.createBuffer(
    rendered.channels.length,
    rendered.channels[0].length,
    rendered.sampleRate,
  );
  rendered.channels.forEach((channel, c) => audio.copyToChannel(channel, c));
  const source = ctx.createBufferSource(),
    output = ctx.createGain();
  source.buffer = audio;
  source.connect(output);
  let disposed = false,
    finish;
  const ended = new Promise((resolve) => {
    finish = resolve;
  });
  source.onended = () => {
    source.disconnect();
    finish({ kind, reason: disposed ? "disposed" : "finished" });
  };
  source.start(ctx.currentTime);
  return {
    output,
    ended,
    duration: rendered.duration,
    capture: rendered.capture,
    kind,
    dispose() {
      if (disposed) return;
      disposed = true;
      source.onended = null;
      try {
        source.stop();
      } catch {}
      source.disconnect();
      output.disconnect();
      finish({ kind, reason: "disposed" });
    },
  };
}
