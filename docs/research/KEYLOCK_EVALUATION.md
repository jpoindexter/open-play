# Actual browser pitch-preserving tempo DSP

Updated 2026-10-16. This is browser prototype DSP implementation, not a native application, nor proof of Serato algorithm equivalence.

## Decision

Use the official MIT-licensed **Signalsmith Stretch 1.3.2** WebAssembly release. It separates rate and pitch and supports multichannel audio. Its small published ES module embeds the DSP, so the prototype can run locally without a proprietary service or runtime download. The vendor module is unchanged and its license, exact archive, source commit and SHA-256 values are in `prototype/vendor/signalsmith-stretch/PROVENANCE.md`.

Primary references:

- [Official Signalsmith repository and MIT license](https://github.com/Signalsmith-Audio/signalsmith-stretch).
- [Official browser API](https://github.com/Signalsmith-Audio/signalsmith-stretch/blob/main/web/release/README.md): independent rate and semitones, buffer playback, timeline scheduling, latency and formant controls.
- [SoundTouchJS official project](https://github.com/cutterbl/SoundTouchJS): maintained alternative, with substantial recent API/license changes; its current source uses an AudioWorklet pitch processor and source-rate compensation. Not selected because the official Signalsmith release supplies independent buffer rate/pitch with one pinned dependency.
- [Rubber Band official project](https://breakfastquay.com/rubberband/): capable stretch/pitch alternative with GPL or commercial licensing and a more involved browser packaging path. A future native candidate remains possible after the prototype approval gate.

## Files and API

`prototype/keylock.js` exports `KeylockRenderer`, `toRenderedTime` and `toOriginalTime`.

```js
const renderer = new KeylockRenderer({maxCacheBytes:128 * 1024 * 1024});
const transformed = await renderer.render(originalAudioBuffer, {
  tempo:1.25,          // Original timeline advances 1.25 seconds per playback second
  semitones:0,         // Original pitch retained: actual Key Lock
  signal:abortController.signal,
  onProgress:fraction => updateProgress(fraction)
});
```

The result is an actual AudioBuffer of `round(original.length / tempo)` samples at the original sample rate. Play it with `AudioBufferSourceNode.playbackRate = 1`. Original-timeline cue/loop/seek positions divide by `tempo` when assigned to the rendered source. Reverse the transformed buffer when reverse playback is requested. End-of-track positions remain in original-track seconds. Never overwrite the imported track's duration with the transformed duration.

For Key Lock with key shift, use requested semitones. For normal speed/pitch coupling plus a key shift, add `12 * log2(tempo)` to the requested shift. Without Key Lock or independent pitch changes, retain the ordinary source-rate path rather than rendering an unnecessary transform.

Changing tempo/pitch requires a new render. Abort the earlier controller on rate, track, seek-generation or pause changes. Do not resume a stale request. The engine must freeze or intentionally maintain the previous sound while rendering and expose a preparation state; silently showing a new tempo over the old audio would be misleading. At a successful transition, preserve original timeline position. Loop and reverse cache keys must include transformed-buffer identity, not only track ID.

## Execution and memory

`keylock-dsp.js` hosts the unmodified published AudioWorklet processor in a dedicated browser Worker. The host supplies 128-frame blocks, sample rate, a deterministic clock and message port. `keylock-worker.js` transfers copied input channels and returned output channels. Original audio is never detached. Cancelling terminates the worker. No audio processing happens on the interface thread.

Completed transforms use an LRU cache capped at 128 MiB. Requests with estimated input plus output greater than 512 MiB fail clearly before copying. This estimate excludes the WASM heap and browser decoder; it is not a full memory guarantee. The explicit supported prototype range is 0.25–4× rate, ±24 semitones, 1–8 channels, 8–192 kHz. It is a browser limitation, not a paywall. Production streaming, long-file processing, continuous tempo sweeps and real-time performance need a different streaming AudioWorklet integration after approval.

## Evidence and boundaries

Run `node --experimental-default-type=module scripts/test_keylock.mjs`. This executes the actual vendored WASM DSP through the same offline host. The report is `docs/prototype/keylock-signal-results.json`.

Eight signal tests cover stereo pitch preservation at 0.8×/1.25×; ±12-semitone transposition; combined 1.25×/+7; silent input; and amplitude-envelope timeline mapping at 0.8×/1.25×. Assertions check exact frame duration, finite samples, meaningful output energy, channel-specific tone frequencies within 2 Hz and timeline centroids within 10 ms. They test signals, not labels or function names.

`prototype/keylock-test.html` additionally exercises the actual browser Worker and AudioBuffer adapter, identity bypass, bounded-cache reuse, cancellation and invalid parameters. Its results must be observed in the browser separately; Node results alone do not prove that host path.

These tests establish numerical pitch/time transformation on synthetic signals. They do not establish transparent musical quality, transient/formant quality on real music, equivalence to Serato Pitch 'n Time, uninterrupted scratch transitions, hardware latency, or live DJ reliability. Those remain explicit listening/performance acceptance tasks. Sampler and Pitch Play need integration tests after calling this API; the module's existence does not prove those user workflows.
