# Recorded startup and bounded-buffer replay — checkpoint 153

18 October 2026. **The prior checkpoint151 +3-semitone level dip remains unexplained. This checkpoint adds startup observations and rules out a narrower chunk-geometry hypothesis for a new recorded cohort; it does not repair or supersede the failure.**

## Changed production behavior

Only the MIT Signalsmith worklet wrapper gains startup metadata: creation/ready frames, not-ready/inactive/render quantum counts, first active frame/command and queried latency/seek-history frames. The generated module/WASM factory prefix remains byte-identical. No buffer, SRC, gain, seek, schedule or DSP setting was changed. Metadata increments do execute inside the render function, so this is not a byte-identical render-function claim or a measured performance-cost claim.

The controlled actual-WASM old/new wrapper comparison renders44160frames of the same input/schedule. Its observed original-channel samples are bit-identical, and startup counters satisfy the declared assertions. Read `keylock-startup-153-contract-results.json` and `scripts/test_keylock_startup_153.mjs`. This is a bounded serial-clock instrumentation check, not universal audio equivalence, browser latency or native acceptance.

## Actual browser path and unchanged failure record

The new `stem-bank-trace-153-harness.html/.js` runs four actual live keylocked decks at rates1/1.1/0.8/1.25 and key shifts0/+3/−2/0. It uses authored48-second330/550Hz stereo, with original PCM copied into Melody and the other three Stems silent. Two actual attachments retain all four owners and select bank0→1. Actual Play/pads/Stop execute; physical outputs remain muted. This is direct decoded-buffer routing, not model inference or music-quality proof.

The declared capture ends before Stop. All seven complete twelve-second left-channel streams have529200 finite samples, verified hashes, contiguous quantum clocks and no producer errors. The original is21575270bytes, SHA256 `2909c7e64ab8331045f21b21e4ea015c9ccf26b1b00958b052a00784afb1d692`, retained at `local-evidence/stem-resource-150/browser-exports/33d4668ccad44fbf9d51312063d980d0.json`; the small browser receipt matches it. This deliberately scoped pre-Stop protocol neither crops the older failed capture nor proves Stop acoustics. Checkpoint152's post-Stop clock failure remains retained separately.

Second preparation runs8.977414966–10.013605442seconds. Thirty-six actual deck2 inactive-bank replacement acknowledgments are retained. In the declared second-preparation interval with200ms on each side, no monitor falls below the unchanged0.85 floor; the lowest monitor ratio is approximately0.88492 on the −2-semitone deck. The +3-semitone monitor, raw original and old Melody remain approximately0.99058 or higher. Sampled25ms gains retain their declared routes; this cannot rule out shorter changes in the uninstrumented old cohort. Read `stem-bank-trace-153-results.json` for exact intervals, startup data and per-stream results. A nonreproduction is not a fix for checkpoint151's0.7320637461 failure.

## Replay using recorded startup

The +3 deck records creation frame8192, WASM-ready8448, two not-ready quanta,38 inactive quanta before first active frame16128, and actual first command input0.8408964153/output0.4254195011/rate0.9249860568/semitones0. Both queried latencies are0.06seconds and seek history6615frames. The inferred first ready render frame11264 comes from the recorded active frame minus38×128. We do not infer why ready-to-render has a gap from this subtraction alone.

`experiments/chunked_seek_153.mjs` creates two actual eighteen-channel WASM processors, replays that startup/schedule, and compares whole prepared input against the actual SRC with bounded append/drop. Each copied chunk is checked bit-identical to the corresponding whole prepared PCM range. The bounded path appends67chunks, including21 one-frame tails, and performs24 drops; required seek history remains covered, with minimum33127-frame history and289679-frame future margins. All545152 rendered original samples and all545152 active-Melody samples match their whole-buffer counterparts bit for bit.

The driver freezes its serial clock while copying at fixed50ms refill intervals. Original and Melody are present from the start. It does **not** emulate asynchronous browser copying/MessagePort transfer or later Stem replacement, and does not reproduce checkpoint151's unrecorded startup. Do not use the result to rule out those distinct interactions.

An independent whole-recording comparison aligns the replay to browser PCM using only recorded global audio-context frames, without fitted offsets, phase or gain. All529200 browser raw-original samples match the replay exactly. Between first readiness+300ms and second preparation−200ms (frames162734–387084), the browser's later-prepared old-bank Melody also matches the from-start replay exactly. These checks validate the startup replay for this new cohort and narrow simple SRC/chunk/history/initial-bank phase explanations within it. They do not establish the cause of the old dip.

Canonical independent reproduction:

```sh
python3 scripts/inspect_chunked_seek_153.py local-evidence/chunked-seek-153/original.json local-evidence/stem-resource-150/browser-exports/33d4668ccad44fbf9d51312063d980d0.json /tmp/open-play-chunks-153.json
```

The output path must not exist. The inspector checks source/PCM hashes, finite whole arrays, every browser quantum, retained history, startup identity and sample comparisons. Canonical results are `chunked-seek-153-results.json`. The earlier `chunked-seek-153-comparison-results.json` is explicitly exploratory and lacks the independent browser comparison; it is not the canonical receipt. Private complete originals/PCM remain outside Git/Trello.

## Next exact investigation and constraints

The next useful boundary is actual asynchronous replacement against a known recorded clock, with raw original/old/new-bank audio and routing at that boundary. Replay the observed replacement ranges/acknowledgment times against the same startup as a bounded differential case before changing production audio. Do not run random rate/startup sweeps, relax0.85, compensate gain or call new tone success full musical parity. The old151 startup was not recorded and cannot be reconstructed as an observed fact.

Source inspection shows MIDI auto-connect is conditional on saved Hercules/bound-controller mappings; fresh app defaults use no mappings. This is code-path evidence only. No physical MIDI capture/output was started, and external MIDI has not been established as the cause of the old dip. Do not invent that diagnosis.

Keep official Serato source evidence separate from `Alternative mapping — author/project`; the existing tested Hercules preset remains an alternative. Factory coverage19252assignments/145of197definitions and Hercules356/18unresolved are unchanged. Frozen desktop0.1.23/tested272mappings/launchers/user8768 remain preserved. No native packaging or controller readiness request occurred. Per-feature Codex/Claude model-effort recommendations remain dated planning metadata, not new model availability checks. No new Claude consultation/full audit was launched.

Full scope remains110groups/522requirements/9beta deltas/26release checks,55extendedFX and actual Stems/keylock. Music reconstruction, transport/scratch/reverse/loops/Stem Slip, whole-process resources/deadlines, native/hardware/reference and remaining feature acceptance stay open. All full-parity flags remain false; the goal remains active.
