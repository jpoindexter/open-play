import { transformChannels } from "../prototype/keylock-dsp.js";
import { runSignalTests } from "../prototype/keylock-signal-tests.js";
const results = await runSignalTests((channels, sampleRate, options) =>
  transformChannels(channels, sampleRate, options),
);
const report = {
  executedAt: new Date().toISOString(),
  host: "Node serial offline worklet host; actual vendored WASM DSP",
  passed: results.filter((r) => r.passed).length,
  total: results.length,
  results,
};
console.log(JSON.stringify(report, null, 2));
if (results.some((r) => !r.passed)) process.exitCode = 1;
