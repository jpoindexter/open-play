# SoundTouch counter-full engine independent review — 2026-10-17

No new blocker reproduced for this exact short browser cohort. The executed offline inspection supports **4/4 under the new prospective clock criterion**, not production keylock acceptance or repair of historical captures. Parent executed the browser; this reviewer independently inspected its retained artifacts and frozen source.

## Executed evidence

- Ran `python3 docs/research/SOUNDTOUCH_COUNTER_ENGINE_INSPECTOR_20261017.py`: all four complete original raw hashes, geometry, every decoded sample finite, all 25,591 producer rows, and all 3,275,648 captured frames verified (133,129,216 raw bytes).
- Independently compared every retained observer AudioParam sample against the once-anchored callback counter and successive sample steps: maximum residual .0625 sample, within the unchanged .25 budget. No sequence gaps or raw trimming; all original globalFrame/globalTime values retained.
- Recomputed all 192 planned source/mix channel windows using interpolated crossings: maximum expected-tone error .130996487611 Hz, below 1 Hz. Supplemental 16× Hann estimates also remain below 1 Hz (maximum .185463841946 Hz). The 307 Hz control stays within .01 Hz; declared pause windows are exactly zero.
- Verified warm-follow retains selected group 1 and forward rebase selects group 2 with old ownership retired. Five-source fixtures are identical independent synthetic clones, not actually separated stems or a musical transfer test.
- Verified 24 actual engine-pause processor-release acknowledgements: disposed, processor store bytes/chunks zero, transport sourceBytes zero and epochs empty. Four separate shared-registration survivor acknowledgements also report zero released store/epochs. This is not a claim that all decoded AudioBuffers, JS/WASM heap or process memory were released.
- Configured 500 ms delayed shared registration: one waiter aborts in 21.2–28.4 ms while the other survives; terminal schedule revival is refused. Frozen server metadata/source establish the configured delay; no network timing trace or CPU benchmark is claimed.

## Clock and lifecycle scope

`experiments/keylock-soundtouch/render-clock.mjs:12–20` validates the full active a-rate array before advancing state, rejecting constant/scalar active quanta and out-of-range clocks. `node-factory.mjs:34–43` schedules a future integer anchor and refuses preparation within two seconds of the endpoint. `counter-capture.mjs:17–26` anchors once from the first observed parameter and subsequently counts actual callbacks; it also exports the full parameter arrays and original globals.

These are separate subsequent measurements: callback counting versus scheduled AudioParam values. They share the browser rendering environment and are not an independent physical clock. Internal processor parameter arrays were not exported for offline replay: their full-quantum validator source and snapshots were checked; only the capture observer’s complete arrays were independently replayed.

Six observer rows still differ from original globalFrame by 128 samples (case counts 1/4/0/1); original globalTime disagreement remains visible. No globals were repaired and no universal source/CPU/browser cause is established. A new prospective counter label is not evidence that the original global clock became reliable.

`engine-harness.mjs:105–118` retains processor handles before pause, awaits adapter disposal, then obtains actual cached processor snapshots. `node-factory.mjs:84–90` preserves the acknowledged terminal snapshot and idempotent disposal promise. Adapter voice-map absence alone was not used as a memory-release oracle.

## Preserved failures and limits

The inspector rehashed historical whole raw artifacts and source snapshots without regrading them: initial engine 0/4; preflight 3/4 (including failed global clock and weaker cleanup evidence); lifecycle 3/4 (startup selection failure); graph-only original-global probe 0/4. The separate counter-clock graph probe remains 4/4 with its earlier **quantum-start-only processor fence**, not retrospective full-array acceptance. Bare graph failure without DSP/PCM establishes that DSP is unnecessary for that exact reproduction, not a universal cause.

The absolute clock is limited to <2^22 frames (about 87–95 seconds of context lifetime), with earlier factory refusal near the endpoint. This is an explicit experiment restriction and a practical blocker to promotion for ordinary DJ sessions. No native/main-app, long-session, acoustical, physical latency, musical-quality, exact audible-cursor, real separated-stem, loop/reverse/Stem Slip or Serato parity acceptance follows.

## Frozen identities

All 248 current served-source snapshots match their recorded bytes, including the sole import-specifier rewrite. Served production engine SHA `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf` and SRC region match unchanged production source.

- Original report: `e7536c76f5083ff8caab2b66dc680716c68eac0f4738c285b446cd6d11d8e124`.
- Full-quantum clock: `1d32829d8c8c1bb2eae6e898a23777bf2f805ada4035847695a86bb7dddb8a3c`.
- Node factory: `a6231b06a7da535eeb23b2a4f464e28d957bed422bd298523e1b6af9601b3017`.
- Node worklet: `8005df081f08388f2892aabbbd97bd88238aa27cd28a074572795192614fcbf1`.
- Counter capture: `01cea02d2bd8141acd74a54c714a5a6062e0d0626f208bf5715032401e2b1898`.
- Independent inspector: `b30eb6a60746fb2b8d3f8d705b05c71081780f6aba0d7464d49de2e20f9f9b99`.
- Independent result: `1948a6bc4128727349b03bd5bc4846e4df24270d8b0eef732e7da28db2f1deb3`.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
