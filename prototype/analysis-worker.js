import { analyzePCM } from "./analysis.js";
self.onmessage = ({ data }) => {
  try {
    const result = analyzePCM(data.channels, data.sampleRate, {
      ...data.options,
      onProgress: (value) => self.postMessage({ type: "progress", value }),
    });
    self.postMessage({ type: "result", result });
  } catch (error) {
    self.postMessage({ type: "error", message: error.message });
  }
};
