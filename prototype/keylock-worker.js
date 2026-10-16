import { transformChannels } from "./keylock-dsp.js";
self.onmessage = async ({ data }) => {
  try {
    const channels = await transformChannels(data.channels, data.sampleRate, {
      tempo: data.tempo,
      semitones: data.semitones,
      onProgress: (progress) => self.postMessage({ progress }),
    });
    self.postMessage(
      { channels },
      channels.map((c) => c.buffer),
    );
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
