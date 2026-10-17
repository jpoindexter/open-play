# Actual SoundTouch transport implementation and execution

17 October 2026. **This is an implemented experimental transport, not a replacement in the current app. Full Serato parity remains unestablished.** The active goal retains 110 groups / 522 requirements, nine separate beta deltas and 26 provisional release checks. No full feature or requirement flag is promoted.

## What was implemented

`experiments/keylock-soundtouch/pull-transport.mjs` drives the unmodified pinned SoundTouchJS2.1.1 core through its public FIFO API. It owns fresh, primed processor epochs for discontinuities and changes; it does not reuse hidden old queues. It provides actual forward PCM output, independent key shift and tempo, keylock off, scheduled start/pause/resume/seek, supersession of later pending commands, bounded crossfades/retirement, original-duration authority, mono/multichannel pairs and either one original or five positional sources. The original source/stem channel descriptors are snapshotted. Underlying PCM is borrowed immutable data; the browser wrapper receives transferred storage owned by the worklet.

The transport accepts whole source PCM and permits up to16 retained/prepared epochs, with an eight-command queue bound. This differs from the production adapter's windowed PCM policy. Opaque DSP heaps are not included in reported source bytes. It is not a production memory/CPU equivalence claim. Direct seek uses a declared250ms nominal preroll and emits a nominal-duration endpoint; neither is a proved audible sample map or an end-tail guarantee.

`pull-worklet.mjs` executes that exact transport in the real render thread. `transport-capture.mjs` records every stereo positional output plus307Hz calibration and an independently scheduled a-rate frame tag. Physical output is muted twice: the capture processor emits zeros and its destination gain is zero. The loopback server freezes served source bytes at startup. One bare package import is rewritten to a fixed local Lanczos URL; publisher DSP algorithms are unchanged. The recorded source map distinguishes original and served hashes.

## Dependency reset defect and isolation

Actual default circular SoundTouch `clear()` leaves staged input in its internal stretch adapter. Parent reproduced at both44.1/48kHz: after2000frames of0.25, process, clear, then zeros, the output contains704/768 nonzero samples with peak0.25, despite public input/output FIFOs reporting zero after clear. Fresh instances yield zero contaminated samples at both rates. This is an upstream-reset obstacle for a new adapter, not a defect claim about unchanged Open Play. The candidate never recycles a processor through `clear()`.

Read `soundtouch-reset-isolation-red.json`, `soundtouch-reset-isolation-fresh-green.json` and the source-specific independent investigation. No private field reset, source patch, tone compensation or sample-threshold widening was used.

## Test-first implementation and corrected boundary defects

The initial13-case serial contract suite failed because the new module was absent; that failure is a missing-feature witness, not13 independently reproduced DSP defects. After implementation it passed13/13 actual-core checks. A separate boundary suite then failed6/6: a prior nominal clock position was advanced twice, excess stem tail could bleed past the original endpoint, and retired EOS counters were lost. Corrected anchor retention, original-frame input authority and bounded retired diagnostic summaries now pass those six checks.

Independent review found a source-ownership defect: replacing a caller's channel descriptor could silently replace later seek epochs, and adding channels changed preparation geometry while metadata stayed fixed. Both parent and independent actual-core counterexamples failed before the descriptor snapshot. Current descriptor tests pass2/2; independent ownership/inheritance/atomicity/rapid-crossfade checks pass6/6 at the reviewed pre-portability candidate. Borrowed PCM itself must still be treated as immutable; descriptor copying is not a deep PCM clone.

The first real browser run exposed an AudioWorklet portability failure: the `performance` global is unavailable. All four cases failed before steady output, with every received partial block retained. A portable-clock RED test reproduces the failure at both rates. The corrected candidate reports preparation timing as `null` / `unavailable` in that environment; it does not invent a zero-duration or CPU measurement. Both portability cases pass. The final portable source also reruns the actual13 functional, six boundary and two descriptor checks with no failures.

Serial reports retain their source identities, test results and PCM hashes. Their PCM was generated in memory rather than retained as whole binary recordings; they are rerunnable contracts, not original browser recordings. Every browser cohort retains whole original received PCM, row labels, errors, source snapshots and observations separately. Immutable earlier source variants preserve initial, boundary and ownership candidates. The package source cache remains pinned and unchanged.

## Real browser portable cohort: complete but rejected

The first full portable run completes four captures: one/five sources at44.1/48kHz. Whole raw data totals3,226,624 frames /25,208 producer rows and is finite and contiguous. All120 additional tone-window predicates,307Hz control checks, exact pause silence and identical-source comparisons pass. They do **not** override the failed clock predicate: frame-tag residuals are510.7119,1011.9082,893.4902 and1389.8438samples. **Accepted cases remain0/4.**

The observer scheduled `setValueAtTime(0,0)` after an already running context. The [WebAudio specification](https://www.w3.org/TR/webaudio-1.1/#dom-audioparam-setvalueattime) requires past start times to be clamped. Whole tag arrays fit nonzero-start ramp models at512/1024/896/1408frames within0.1sample. That is evidence consistent with the observer's late anchor; absent recorded original call times it does not uniquely prove clamping caused every discrepancy. The fit is exploratory and does not relabel PCM, change an origin, accept the old cohort or explain earlier native clock failures.

See [portable independent review](SOUNDTOUCH_PULL_BROWSER_INDEPENDENT_REVIEW_20261017.md) and its immutable inspector/result. Original performance failures and portable clock failures stay separate from every later run.

## Separate explicitly anchored observer cohort

`soundtouch-transport-browser-anchored-plan.json` changes only observer scheduling: exact future integer-frame anchors, then arming after the first anchor plus256frames. The transport DSP, fixtures, seven-command timeline,2second tone windows,1Hz audio/.01Hz control/.25sample clock bounds, silence criteria and no-trimming rule are unchanged. The new whole report is `soundtouch-transport-browser-anchored-results.json`; it alone determines that cohort's outcome. Do not transfer any future result to the portable or earlier native captures.

The new anchored run completed and meets its predeclared criteria in **4/4 cases**: **3,224,832 whole frames /25,194 producer rows /103,194,624 bytes**, all finite and producer-contiguous. All120 crossing-based tone predicates pass (maximum error0.115108Hz);307Hz controls pass, both pause windows are exactly zero and all identical-source channels are bit-identical. Per-sample scheduled-frame residual is at most0.0625sample, below the unchanged0.25sample limit. All seven command acknowledgements precede each initial output frame, with at least44,160context frames remaining; this is an observed scheduling result, not a CPU/latency guarantee. Disposal reports no remaining epochs in every case. Whole originals, startup/end silence, actual clock values and all command snapshots are retained.

Read the separate anchored independent review/result alongside its raw report. That review also corrects a prose-only historical source hash in the frozen portable review: its JSON source hash was correct; the prose listed the later on-disk harness. Both old and new harness bytes are preserved and mapped. No old outcome changes. The anchored plan's explanatory prose calls clamping the cause; the defensible evidence boundary remains consistency with clamping and the changed observer, rather than uniquely proved causality for every discrepancy.

The timeline executes neutral tempo1.08, +2 key shift, seek into a different source region, pause, resume at rate0.75/−12 and keylock-off at rate1.25, then final pause. Five-source cases use identical independent synthetic source clones. They establish neither phase alignment of different stems nor actual separation/reconstruction quality.

## Current boundary and next exact task

No product AudioEngine, user interface, native package, launcher, reference entitlements or existing acceptance flag changes. Native0.1.6 and its original pitch failure remain preserved. Current-source correspondence and the prior main-app/Hercules witnesses retain their original candidates and scope. Full Claude completeness audit is still unlaunched.

Next: a compatibility adapter using the real engine's start/update/seek/follow/pause/disposal contract, sample-rate normalization, bounded source retention and actual error/ownership semantics; then a frozen optional test candidate through the actual main app. Before promotion, verify capture validity, musical/attack/tail quality, source-position markers, nonidentical stem sums, immediate/live control changes, reverse/loop/Stem Slip transitions, long sessions and CPU/memory/latency. The current whole-source experiment cannot silently replace those production contracts.

Continue the full matrix: all FX controls/sonics; SCNet reconstruction3.025%>3% and other-source SI-SDR−1.01dB; prior cursor failures; Smart Sync/Link/providers; library/tags/files/interop; recording pre-master/input/recovery; DVS/HID/CDJ/Phase and Hercules jog/pads/LED/hotplug; Video/manual/release and matched-viewport visual coverage. No goal reduction or completion claim.

Outcome: independent complete visual/functional macOS parity. Target: current prototype and approved local desktop tests against installed Serato4.0.10.213. Must: preserve original evidence, exact candidates, prompt, per-feature model routing and actual visible/audio/storage/device/failure/compound outcomes. Must not: copy proprietary code/assets, alter entitlements, widen criteria, repair failed recordings, overwrite older bundles or publish. Done: all reconciled requirements execute expected outcomes; **not met**.
