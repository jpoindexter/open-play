import { transformChannels, transformWarpedLoop } from "./keylock-dsp.js";
self.onmessage = async ({ data }) => {
  try {
    const channels = data.loopPlan ? await transformWarpedLoop(data.channels,data.sampleRate,data.loopPlan,{onProgress:progress=>self.postMessage({progress})}) : await transformChannels(data.channels, data.sampleRate, {
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
