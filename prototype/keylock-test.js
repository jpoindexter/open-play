import { KeylockRenderer } from "./keylock.js";
import { runSignalTests, tone } from "./keylock-signal-tests.js";
document.querySelector("#run").onclick = async () => {
  const button = document.querySelector("#run"),
    output = document.querySelector("#results");
  button.disabled = true;
  output.textContent = "Running actual Worker/WASM transforms…";
  try {
    const renderer = new KeylockRenderer();
    const makeBuffer = (channels, sampleRate) => {
      const b = new AudioBuffer({
        length: channels[0].length,
        numberOfChannels: channels.length,
        sampleRate,
      });
      channels.forEach((c, i) => b.copyToChannel(c, i));
      return b;
    };
    const results = await runSignalTests(
      async (channels, sampleRate, options) => {
        const b = await renderer.render(
          makeBuffer(channels, sampleRate),
          options,
        );
        return Array.from({ length: b.numberOfChannels }, (_, c) =>
          b.getChannelData(c),
        );
      },
    );
    const b = makeBuffer([tone(44100, 2, 440)], 44100);
    results.push({
      name: "Identity transform preserves the original AudioBuffer",
      passed: (await renderer.render(b)) === b,
    });
    const first = await renderer.render(b, { tempo: 1.1 });
    results.push({
      name: "Repeat render uses the bounded cache",
      passed: (await renderer.render(b, { tempo: 1.1 })) === first,
    });
    const controller = new AbortController();
    const pending = renderer.render(b, {
      tempo: 0.6,
      signal: controller.signal,
    });
    controller.abort();
    let cancelled = false;
    try {
      await pending;
    } catch (e) {
      cancelled = e.name === "AbortError";
    }
    results.push({
      name: "Cancellation terminates the in-flight worker",
      passed: cancelled,
    });
    let invalid = false;
    try {
      await renderer.render(b, { tempo: 0 });
    } catch {
      invalid = true;
    }
    results.push({
      name: "Invalid tempo rejects before processing",
      passed: invalid,
    });
    output.textContent = `${results.filter((r) => r.passed).length}/${results.length} passed\n${JSON.stringify(results, null, 2)}`;
    document.body.dataset.result = results.every((r) => r.passed)
      ? "passed"
      : "failed";
  } catch (e) {
    output.textContent = `ERROR: ${e.stack || e}`;
    document.body.dataset.result = "failed";
  } finally {
    button.disabled = false;
  }
};
