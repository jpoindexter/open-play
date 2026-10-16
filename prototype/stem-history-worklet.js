// Actual rendered-source history, including loop wraps, playback rate and silence.
class StemHistoryProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.rings = [
      new Float32Array(Math.ceil(sampleRate * 4)),
      new Float32Array(Math.ceil(sampleRate * 4)),
    ];
    this.cursor = 0;
    this.endFrame = currentFrame;
    this.alive = true;
    this.port.onmessage = ({ data }) => {
      if (data.type === "dispose") this.alive = false;
      if (data.type === "clear") {
        this.rings.forEach((r) => r.fill(0));
        this.cursor = 0;
      }
      if (data.type === "capture") {
        const frames = Math.max(
          1,
          Math.min(this.rings[0].length, Math.ceil(data.seconds * sampleRate)),
        );
        const behind = Math.max(
          0,
          Math.min(
            this.rings[0].length - frames,
            this.endFrame - Math.floor(data.atTime * sampleRate),
          ),
        );
        const channels = this.rings.map((r) =>
          Float32Array.from(
            { length: frames },
            (_, i) =>
              r[(this.cursor - behind - frames + i + r.length) % r.length],
          ),
        );
        this.port.postMessage(
          { id: data.id, channels },
          channels.map((c) => c.buffer),
        );
      }
    };
  }
  process(inputs, outputs) {
    if (!this.alive) return false;
    const input = inputs[0] || [],
      out = outputs[0];
    for (let i = 0; i < out[0].length; i++) {
      for (let c = 0; c < out.length; c++) {
        const value = input[c]?.[i] ?? input[0]?.[i] ?? 0;
        out[c][i] = value;
        this.rings[c][this.cursor] = value;
      }
      this.cursor = (this.cursor + 1) % this.rings[0].length;
    }
    this.endFrame = currentFrame + out[0].length;
    return true;
  }
}
registerProcessor("open-play-stem-history-v1", StemHistoryProcessor);
