# Grouped AudioEngine independent review — 2026-10-17

Independent inspection reproduces the original **1/2 declared cases accepted**. The48k case’s two solo-window source failures are corroborated by full-spectrum FFT, not explained by a crossings-only artifact. Additional FFT deviations are retained as diagnostics without regrading either case. No grouped engine/native promotion is supported yet.

## Executed complete-original audit

Ran `SOUNDTOUCH_GROUP_ENGINE_INDEPENDENT_INSPECTOR_20261017.py`: all1,833,344frames/14,323rows/102,667,264bytes, both whole raw SHA/geometry and every sample finite. All256 served-source snapshots match recorded source/served hashes, accounting only for the recorded dependency import rewrite. Regenerated both complete32second fixtures and all ten input channel hashes; original is the Float32 sum of four distinct stems, with doubled tones after16seconds.

Verified actual unchanged engine SHA `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf` and unchanged production SRC region. Frozen engine imports its live adapter at engine.js:295–298; the server-selected adapter is the new grouped implementation. Adapter:68–79 creates one five-output processor, copies all five positional source chunks, then issues one atomic addBuffers batch; WindowPCMSource:32–50 validates the entire batch before committing it. Successful recorded windows/drop/refill/reconstruction support this path; they do not exhaust cancellation or partial-resource failures.

All112 isolated-stem declared crossing measurements reproduce, with exactly the original two failures. The four solo-monitor tone checks pass. Mixed-monitor crossings are descriptive, not compared against a fabricated single composite frequency. Every declared original-versus-summed-stems reconstruction channel meets3percent; maximum ratio5.5935232937e-8. Pause windows are exactly zero across all12source/monitor channels;307Hz control and supplementary control FFT meet.01Hz.

Raw phase/counter validation meets.25sample: maximum.005706788sample, strict complete-row sequence. Original globalFrame/globalTime disagreements remain0/3 by case and are preserved rather than repaired. Internal processor phase/guide arrays were not exported; full observer phase arrays were independently checked, and source/snapshot checks remain distinct from physical-clock or audible-source provenance.

## Failed window: spectral deviation plus time-varying phase behavior

At48k, declared solo window20.230666667–21.230666667s:

| Adapter source/channel | Expected | Crossing | Global Hann peak | Hann error |
|---|---:|---:|---:|---:|
| 1 /left | 442.250047Hz | 438.830124Hz | 438.931056Hz | -3.318991Hz |
| 2 /left | 698.171394Hz | 701.455173Hz | 701.367893Hz | +3.196499Hz |

Both estimators see significant deviation; there is no basis to dismiss these as crossing-count artifacts. Yet period medians are near nominal:108.540083 versus expected108.535884frames, and68.748344 versus68.751026frames. Wider ranges106.986–130.174 and61.468–71.914frames yield cumulative expected-cycle residuals+3.413/-3.282 across the window. This supports nonuniform phase/timing behavior rather than proving one uniformly detuned oscillator. Opposite error signs also rule out a single common fixed rate multiplier as the sole explanation.

All112 supplementary global20–20000Hz >=16× Hann measurements were retained. Seven exceed1Hz: the two original failures plus five crossing-passing windows—44.1k neutral source4R(-1.124636Hz), resume source4R(-1.214101), solo source1L(+2.482779) and source2L(-1.179555);48k neutral source4R(-1.137900). These supplementary results do not turn the predeclared crossing1/2 result into a new acceptance grade, and prevent a broader spectral-quality claim for the crossing-passing case.

## Causal localization / actual solo routing

The harness taps adapter.outputs before engine stem gains. The solo event explicitly calls actual engine.updateStems and is not a new processor schedule ACK (`phase-group-engine-harness.mjs:116`). Frozen engine.js:988–1012 changes downstream gains for this no-FX selection; it does not reschedule or transpose the grouped DSP. In both cases the entire declared solo monitor window is **bit-identical to adapter stem index2**, with no fitted gain/delay. Selected-stem routing therefore works in those windows while the other adapter outputs already contain the deviations.

This localizes the failure upstream of solo mute routing and refutes selection-gain math as its cause. The original capture does not retain pre-DSP normalized input or actual per-decision guide offsets, so it cannot independently identify SRC versus WSOLA/guide-stage cause. Independent review of the separately prepared exact resume input/offset replay is the next causal check; it is not part of this case grading. No parameter search or threshold adjustment is justified by this audit.

## Ownership, retirement and limits

Warm follow retains group1; forward rebase selects group2 after bounded history drop/refill. Both actual engine pauses retain and await one five-source processor ACK per case (four total): stores/chunks/sourceBytes0, epochs empty, node-owned phase source disposed, adapter groups/retained/inflight bytes0. Shared static buffers/decoded inputs/SRC/opaque heaps remain excluded. The recorded configured500ms module scenario aborts one waiter in20.9ms while its same-context one-source helper survives with actual appended PCM, then disposes and rejects terminal revival. This is registration ownership evidence, not every five-source engine-start/load race.

Unused legacy top-level measurements.expectedHz values still name the earlier tone fixture. Actual channels[].expectedHz, plan-derived expectations and acceptance code use the correct distinct stems; the unused field must not be read as the actual criterion. Solo state.when is the gain-action time, explicitly not a fresh processor acknowledgement.

Original report SHA `090728fc043be5371737a99f7fdd73b1945dae00486b0664bf881f4079813c05`; selected grouped adapter `69e4d930aa98bea862afda033209c4afddc56386ea3f134e3abd82928205d784`. Source references above are inside `local-evidence/soundtouch-engine-browser-group-engine/source-snapshots/`. Independent inspector SHA `621079c6bed0d20144ec9198f2f05c34a79b76299d768b28aa733d9d67b97e06`; result `SOUNDTOUCH_GROUP_ENGINE_INDEPENDENT_RESULTS_20261017.json` SHA `1e94b01a22ef8b89e401a015d4e68b0242bebf1ae4af6e7f9583323f661deed6`.

Parent executed browser actions; this reviewer inspected original artifacts/source offline. No native017/main-app replacement, real music/model separation, physical/MIDI routing, exact cursor, CPU/long-session/native-heap, reverse/loop/Stem Slip or full reference parity acceptance follows. Prior cohorts/failures remain unchanged.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
