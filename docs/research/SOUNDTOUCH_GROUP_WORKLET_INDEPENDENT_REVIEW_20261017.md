# Grouped worklet independent review — 2026-10-17

The frozen browser cohort supports **2/2 declared five-output audio/clock cases**, while a separate invocation-geometry ownership defect is confirmed in its frozen factory. The later correction is not credited to this cohort. Parent operated the browser; this reviewer executed whole-artifact inspection and the controlled frozen-factory counterexample.

## Executed original-capture checks

Verified both complete original twelve-channel raw hashes, geometry and every finite sample:1,038,336frames/8,112rows/49,840,128bytes. All256 frozen served-source snapshots match the manifest, reversing only the recorded bare Lanczos import rewrite. Input hashes match the independently regenerated nonidentical serial fixtures; the five sources are original plus four complementary stereo stems, not identical clones.

Recomputed all48 declared isolated-stem channel windows from actual acknowledged output-frame+.5..2.5s: unity, tempo1.08 and shifted+2 at44.1/48k. Interpolated-crossing estimates reproduce the report and meet1Hz/RMS>.001 (maximum error .6352529303Hz). Additional global20–20000Hz >=16× Hann estimates also meet1Hz (maximum .8449548193Hz); search was not restricted near expected tones.

All six stereo reconstruction windows meet the unchanged3percent bound, maximum channel ratio4.4047851537e-8 with nonzero original RMS. Pause is exactly zero across all ten source channels; simultaneous307Hz control remains nonzero during pause and meets.01Hz over the full capture. There was no raw trimming, fitted gain/delay/phase, repaired label or skipped armed interval.

Every original phase sample matches declared-anchor plus callback count modulo its period: maximum .005706788sample error and cyclic-increment residual .009277344sample, within.25. All rows have strict sequence/counter continuity; original globalFrame/globalTime agree for these particular captures and remain retained. Observer counters continue while unarmed and are not reinitialized on arm. This does not repair old captures or prove original globals universally reliable.

## Actual grouped path / retirement

Frozen `group-stems-harness.mjs:16–24` creates one actual grouped AudioWorkletNode, appends five-source chunks, connects its five distinct outputs, schedules/restarts each phase and checks its disposal ACK. Frozen `group-node-worklet.mjs:25–33` advances one guarded clock and renders all five output buses through the grouped controller. There are five coordinated SoundTouch stereo pipes inside that processor, not one DSP instance producing duplicated outputs.

Per-phase active snapshots show fresh epoch generations1/2/3, five guide readers with matching ordinals, produced/consumed1:4, retained decisions0 and peak queue1. Each case retains one final actual processor ACK: disposed/store bytes/chunks/sourceBytes0, epochs empty, node-owned phase source disposed. Shared phase-buffer bytes remain explicitly outside the zero-store claim. `group-node-controller.mjs:8–11,28–40` uses the bounded source store and grouped full-search transport; these captures do not exercise dropping/refilling beyond the four-second input.

Internal processor phase arrays were not exported for offline replay: full per-sample validator source and clock snapshots were checked; complete original observer phase arrays were independently replayed. Counts, looping phase and globals share a browser environment, so this is not independent physical timing, sample provenance or exact audible-cursor evidence.

## Confirmed frozen-factory geometry ownership defect

`group-node-factory.mjs:24` retains `options.outputChannelCount` by reference, validates it, then awaits shared module registration at:32. Construction and processorOptions at:36–39 reuse that mutable array. Controlled execution of this exact frozen factory deferred registration, changed the caller’s initial[2,2,2,2,2] to[1,2,2,2,2], then resumed it. Both constructed outputChannelCount and processor channelCounts became the changed values. The caller therefore owns geometry after invocation-time validation; a changed invalid value can also bypass that initial validation.

Snapshot the array before validation/await, and preserve it as the construction/processor geometry. This is separate from the successful literal-array audio fixtures, which do not mutate their arguments. The parent’s later factory/harness hashes differ and are recorded as later/uncredited in the inspector result. No broader caller-array or registration-race acceptance is granted to frozen factory `aef977377a8d13c8fbc7bb72fe1c12990690afea00276d83c5f762ad9c67f4b3`.

## Boundaries and frozen identities

Original report SHA `b5a34bf3d61c74d1082a1a467d89fad87e875e826831ef2cfe6430a885218821`; grouped full-search transport `3e7d9768c5213047432375f8638c4f234f47df164c02175be1114bb380276847`; grouped controller `de277b15f411b4cf0293c6b9d1741e19e662e28adf5e991fbf711033bd10f5c0`; grouped worklet `0efc02047b4310b7ccba8a1a823448e1425ad6f9b6664e04a43aeb5989208e32`. Source references above are inside `local-evidence/soundtouch-engine-browser-group-worklet/source-snapshots/`.

This standalone worklet cohort does not integrate AudioEngine/live adapter/main application/native017. No musical/model-derived stems, physical/MIDI routing, loop/reverse/Stem Slip, compound races, long-session/CPU/native-heap stability or reference/full parity acceptance follows. Earlier quick-search/serial/native results remain separate and unchanged.

Independent inspector `SOUNDTOUCH_GROUP_WORKLET_INDEPENDENT_INSPECTOR_20261017.py` SHA `60bd65e0b57ea05c900d331d81fd1763bac7417ad6882bfbfb552efbaf2f9e81`; independent result `SOUNDTOUCH_GROUP_WORKLET_INDEPENDENT_RESULTS_20261017.json` SHA `c34af2b6ce07cc937dbdc38a4409070bb5c94a6762b16bdf053c7f149b67f2fd`.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
