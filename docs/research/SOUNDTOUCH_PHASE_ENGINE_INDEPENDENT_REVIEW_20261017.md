# SoundTouch phase engine independent review — 2026-10-17

The original artifacts support **early phase 4/4 and guarded 100-second phase 2/2** under their distinct declared browser criteria. One separate preparation-failure cleanup defect is reproduced below. Parent executed the browser; this reviewer executed the offline inspector and controlled factory counterexample. No native/main-app or full keylock acceptance follows.

## Whole original artifact checks executed

Ran `python3 docs/research/SOUNDTOUCH_PHASE_ENGINE_INSPECTOR_20261017.py`, exclusively creating its new result. Both cohorts’ original whole raw hashes, sizes, finite samples, all producer rows, every original normalized phase sample, declared schedules, tone windows, original globals, source snapshots and release acknowledgements were checked without trimming or label repair.

| Frozen cohort | Accepted | Frames / rows | Raw bytes | Tone-channel windows | Maximum crossing / Hann error |
|---|---:|---:|---:|---:|---:|
| Initial unguarded phase | 4/4 | 3,278,592 / 25,614 | 133,212,160 | 192 | .102159 / .072915 Hz |
| Guarded long phase | 2/2 | 9,527,808 / 74,436 | 228,667,392 | 40 | .108599 / .105001 Hz |

All planned tone windows meet the unchanged 1 Hz/RMS>.01 criterion; supplemental 16× Hann estimates also meet 1 Hz. Full-capture 307 Hz control error is <.000015 Hz, within .01 Hz. Declared pause windows are exactly zero on source and engine monitor channels. These are generated-tone measurements, not music quality or seamless transition measurements.

Every raw phase sample agrees with the declared anchor plus independently counted callbacks modulo its period: maximum .005706788 sample error, cyclic increment residual .009277344 sample, within .25. Initial captures retain four wraps each; long captures retain 25 each. Original global disagreements remain: initial 1/1/0/2 rows, maximum256 samples; long 3/1 rows, maximum128. Original globalFrame/globalTime remain in evidence, not repaired.

Both long original raw spans cross 2^22 actual context frames. Before first pause, observed frames are 4,501,248 at44.1k and 4,900,096 at48k, after 100.027 and100.009 seconds of steady playback. Actual active-processor release snapshots also exceed 2^22 and retain25 wraps. This establishes a bounded crossing of the former87–95second limitation, not hours of runtime.

Long acknowledged selected source windows have start105.5/end116seconds and10.5seconds retained payload (3,704,400 /4,032,000 bytes). Frozen `window-source.mjs:47` enforces the configured capacity before append. Snapshot/source evidence supports bounded processor PCM storage here; it is not a continuous native-memory profile. Both actual pause boundaries retain and verify all processor release ACKs:24 early and4 long, plus4/2 helper ACKs; stores/chunks/sourceBytes zero, epochs empty, node-owned phase-source disposal reported.

## Confirmed preparation-failure cleanup defect

Frozen `node-factory.mjs:36–41` constructs AudioWorkletNode before `createPhaseControl`. The guarded helper can throw after ramp allocation (`phase-control.mjs:19`), before factory cleanup/abort handlers exist (`node-factory.mjs:45–56`). Ran inspector `--allocation-expiry` against the exact long-cohort frozen factory/helper with a controlled context advancing during createBuffer: observed LateScheduleError, one constructed node, zero disconnects and zero port.close calls. This confirms missing explicit retirement on that failure path; it does not measure a native heap leak or audible output.

Practical correction for a later candidate: prepare the immutable control buffer before processor construction, or catch control/setup failure and explicitly retire/disconnect/close the constructed processor and any partial control source. The successful frozen captures are not invalidated by this separate path. No later fix is credited here.

## Source, clock and acceptance boundaries

All251 served-source snapshots per cohort match recorded hashes, reversing only the recorded import-specifier rewrite. Actual production engine SHA `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf` and SRC region match unchanged production bytes.

Initial clock/helper hashes450358da/da286c37 lack the coarse global fence and late-anchor guards. Long clock/helper9665c600/7df4184d include them; no retrospective credit. The guarded clock checks every active phase sample before state mutation and additionally requires finite integer globals within256frames (`phase-render-clock.mjs:13–28`). Observer counting starts at its declared future anchor, continues while unarmed, and arm resets only export counters (`phase-capture.mjs:9–10,21–24`).

Integer callback counts, looping audio source and original globals share the browser environment. Phase modulo alone aliases a whole period; the coarse global fence rejects that mismatch only if globals do not share the same alias. No independent physical elapsed-time proof, source provenance or exact audible cursor follows. Internal processor phase arrays were not exported: full validator source and clock snapshots were checked, while the observer’s complete original arrays were independently replayed.

Node-owned looping sources/connections are disposed separately from the shared immutable per-context ramp buffer. Decoded originals, shared phase buffers, SRC tables and opaque DSP/native heaps remain excluded from zero-store assertions. Five-source early fixtures are identical clones, not reconstructed stems. Long runs are original-only. Six-hour anchors remain arithmetic tests, not runtime evidence.

Earlier initial0/4, preflight3/4, lifecycle3/4, graph-only0/4, counter-clock4/4 and counter-full4/4 reports and whole raw hashes were rechecked without regrading. In particular, the earlier startup failure, original global-clock failures, weaker fences and missing older cleanup evidence remain. No hardware/native/physical latency/music/loop/reverse/Stem Slip/Serato parity acceptance is awarded.

## Frozen identities

- Early original report: `af73ef91760fcd76045692890a0eb285591e9168a89d78a2a70b68df78b3ee3f`.
- Long original report: `57a8b9093aea497b4ef0c6ef64c19090a88c1ce5476eb819e4affc02a3c36b53`.
- Both frozen node factories: `023c517052f87a00307b2d54381d13046a3fbe56b930e5180d576d01e6f7b6d2`.
- Independent inspector: `86abbc5e1d5554ef545d4897c841fe69107c201a2e25fdd83987491c0bb82763`.
- Independent original-artifact result: `4b0c0cbaeb4d5510e7604dd3fc811dbb51236bdfe634ec84ea96aa3cdfb677cf`.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
