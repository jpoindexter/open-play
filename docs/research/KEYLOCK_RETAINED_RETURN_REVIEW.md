# Retained live-keylock return diagnostic

17 October2026. Parent authorized an isolated retained-owner experiment after the actual lead sweep. No production adapter/engine/app/vendor changes. This report declares the experiment before parent browser execution. Main-UI release wrong-pitch gap stays open.

## Public execution and proof names

Open `prototype/keylock-retained-return-harness.html`; press **Run54 actual retained-return conditions**. Compact public JSON is `#results`, progress `#status`. When finished, press **Download full measured JSON** to download `keylock-retained-return-browser-results.json`, including every actual40ms spectral window, cursor receipt, pause metrics, scheduling ACK, capture producer fence, failures and event. No large raw JSON is exposed to accessibility navigation. No browser result is asserted here.

54 finite conditions: rates[.5,1.08,2] × shifts[−12,0,+12] × leads[40,60,170]ms × return[same region,different region].27 actual adapter identities, each prewarmed at300ms safe lead before the measured hold. It stays ready with bounded PCM, paused and muted through a captured1second hold. After measured same-region return, a separate captured50ms pause precedes different-region return. Thus one1second hold per configuration/lead pair, not54 independent1second holds. Each measured return keeps that identity; no newly built factory or raw PCM fallback.

The synthetic source is440Hz before original second4 and550Hz afterward, with a different right-channel tone. Start positions are1 and6. Keylock makes target pitch independent of rate: target frequency is source-region frequency×2^(shift/12). Only the captured left channel supplies this diagnostic's pitch claim.40ms measured Hann FFT windows advance10ms; the exact unchanged experiment module from the lead sweep is used, SHA256 `669f76e8482b8c215e41ab791c833a207c025412f33efe2ecefd08e145d21535`. Vendor/WASM remains `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e`.

## Declared criteria and limits

The exported pure `inspectReturnPCM` classifies actual provided PCM; `retainedReturnCriteria` publishes fixed criteria. It requires first correct-pitch40ms window start within30ms of **release**, initial and longest low-RMS gap at most20ms, settled target frequency within1% for windows starting250..400ms after scheduled output, and no audible wrong-pitch window starting at least30ms after output. Minimum audible RMS is.005. This intentionally prevents scheduling a future sound and measuring only that future time from masquerading as instant release. FFT windows overlapping silence can identify a correct tone before its RMS onset; the independent1ms RMS gap measurement prevents that from passing a too-long silence.

Each ACK's original-seconds cursor must be within one context-sample of requested position. The measured tone region proves only broad original interval[0,4] or[4,12], and only if settled pitch passed. It does not prove sample-exact audible cursor or eliminate cursor drift within that interval. Source rate/pitch can make raw and target pitch coincide (.5rate/−12shift and2rate/+12shift); such conditions explicitly report `rawPitchIndistinguishableAtThisConfiguration`, with raw-pitch count null rather than claiming raw exclusion. Other configurations distinguish that raw frequency. Different-region return additionally rejects stale preceding shifted tone.

`completed` requires54 recorded conditions with no setup/capture/cleanup fatal error. `allCriteriaPassed` additionally requires every declared condition criterion. Cleanly measured failing conditions are retained, not relabeled completion of scratch functionality. The current170ms scheduled control is comparison evidence, not a recommendation.

Actual native stereo-zero ConstantSource input keeps capture valid; capture Worklet output and destination gain are0. Factory/PCM ready precedes64-consecutive-call preflight; producer frame/sequence arming/final fence require strict full armed coverage. Any missing input or armed gap is fatal; no sample repair/discard. Each factory has an AbortSignal. Per-operation waits are capped by the180second whole-run deadline; cleanup has bounded terminal-disposal/context-close waits. Timeout aborts owner rather than letting a late ready candidate revive. Normal expected runtime roughly75–105seconds; whole-run budget180seconds plus at most10seconds final cleanup. Parent performs actual browser execution.

## Executed preparation checks

`node scripts/test_keylock_retained_return.mjs`: **3/3**, [raw](KEYLOCK_RETAINED_RETURN_NODE_RESULTS.json). Exact current harness analyzer rejects an analytic40ms silence-then-correct880Hz return on20ms gap criterion, and rejects old880Hz continuing100ms before1100Hz despite later correct pitch. The third check actually processes unchanged WASM through all54 states using a controlled serial Node port/clock/gain host and AudioBuffer-shaped fixture: retained owner stays alive with copied PCM through a simulated1second pause, output is actually zero, all cursor ACKs exact, all54 settled region pitches correct, no new factory on returns. This does not establish browser graph scheduling/IPC, wall-clock duration, physical hardware, listening quality or the main-UI release fix.

Node measured all54 fail the overall release criteria: measured initial silence equals40/60/170ms respectively. All54 settled pitches pass. This is useful negative evidence: simply retaining a paused owner and waiting until a future scheduled output removes factory work but cannot conceal its wait as instant sound. Browser execution must retain that gap measurement and may reveal additional timing/region failures. No guard/threshold was reduced after seeing this.

A usable engine change still needs an explicit release ownership/audio policy, actual current/original-seconds cursor handling, bounded stale-window/far-seek behavior, source/key/rate changes, repeated owner cancellation, no raw shifted fallback, correct existing stem-history routes and unaffected other deck. Actual main-UI scratch hold/release recording must then verify both pitch and silence through the real gesture path. These integration requirements remain parent-owned; no owner cache API or production code was implemented by this diagnostic.

Skills applied: use, dec-quality-testing, dec-software-principles.

## Actual initial browser run: incomplete and negative

Parent's [unchanged initial browser JSON](../prototype/keylock-retained-return-browser-initial-results.json), SHA256 `2059caf0a56335feb34d0cfaa3d3f1b1b84302b158088502fe8a1064a6f964df`, ran79.623seconds at48kHz. This reviewer inspected all fatal entries, point aggregates, pause event sequences and capture integrity. **46/54 conditions have actual return measurements, zero meet overall release criteria, six fatal entries; completed false.** Do not label this54 completed conditions or use the controlled3/3 as browser acceptance. Eight return conditions are missing because prerequisites failed; they must not be silently dropped or invented.

All46 recorded conditions have correct settled pitch and no audible wrong-pitch window starting30ms after scheduled output. No distinguishable raw-pitch window appears in those46 measurements. Every recorded condition fails its20ms release-silence budget:

| Scheduling lead | Recorded returns | Actual initial silence range |
| --- | --- | --- |
|40ms |18/18 |39–46ms |
|60ms |13/18 |59–67ms |
|170ms |15/18 |169–176ms |

Retained paused state therefore does not produce seamless release in the observed browser path. It avoids rebuilding on release but deliberately gates sound until its future output; neither correct later pitch nor a40ms FFT window beginning early can erase that silence. The same/different-region distinctions and all raw criteria remain unchanged.

### Four pause prerequisites failed; their exact residual metrics were not preserved

The raw has **four** `Retained paused owner was not actually muted` fatal entries:

- Rate1.08,shift−12,lead60ms: initial1second hold saved exact zero, but the intermediate50ms pause failed after measured same-region return.
- Rate1.08,shift−12,lead170ms: initial1second hold failed before either return was measured.
- Rate2,shift+12,lead60ms: initial1second hold failed before either return was measured.
- Rate2,shift+12,lead170ms: initial1second hold saved exact zero, but the intermediate50ms pause failed after measured same-region return.

These account for six missing return conditions. A concrete **harness evidence-loss defect** prevents claiming an exact sonic cause: `measurePause` calculates actual paused PCM RMS/peak, then asserts zero before returning the record. A failing attempt therefore throws away its numeric RMS/peak, nonzero sample locations and pause-edge PCM while the outer catch only retains the preceding `pair` fields. The saved JSON does not show whether that signal is one already-rendered edge quantum, a short delayed gain transition, a longer residual or another mechanism. The earlier controlled Node zero-pause checks do not resolve it.

Source inspection confirms pause first cancels scheduled group gain values and schedules zero at its immediate AudioContext time, then programs an inactive vendor segment and publishes a paused application clock. In each failing browser event sequence the `experimental-schedule-issued` inactive command and `paused` event occur without a later active command before cleanup. Thus the saved events do not show an obvious active-command resurrection. However, source ordering and main-thread `currentTime` do not establish when the render thread applied the gain command to already-rendered/captured audio. A stale/current-quantum measurement edge is a hypothesis, not an excuse to trim it or declare silence.

The correct next observability change, proposed to parent before editing, is to publish every pause attempt **before** its assertion: command issue/ACK/read times, exact chosen capture first/last frames, RMS/peak, first/last nonzero frame and1ms bins. Retain the same hold start and strict1e−4 RMS/peak threshold. Preserve the failed attempt and explicitly blocked return conditions. Do not wait an extra quantum and discard the edge, loosen a tolerance, or call missing data zero. That can distinguish a pause transition from sustained output and give fresh external diagnosis usable evidence.

### One armed producer-clock discontinuity failed strict integrity

Rate2,shift−12,lead60ms has two fatal entries describing **one** underlying capture defect: the return measurement reports `Earlier armed clock gap` and final integrity separately rejects its span. After preflight and arm at frame2749952,sequence64, a callback with sequence694 reports frame2830464 again, repeating the preceding block's frame; sequence695 reports2830720, skipping the intervening expected frame after that repeated timestamp. These are distinct advancing callback sequence numbers. The net timestamp discrepancy recovers after this pair; that does not make the armed span contiguous or prove what happened to its PCM. This pair supplies the remaining two missing return measurements.

Two earlier pairs retained similar duplicate/skip timestamps during preflight, which reset the64-call counter before arming and did not invalidate their later contiguous spans. The failing discontinuity here is **inside** an armed span about1.68seconds after arming, so it cannot be reclassified as startup and trimmed away.26 other spans reached full producer fences with coverage1; they cannot repair this one. Retaining compact producer frame/sequence neighborhoods before/after any gap is the smallest diagnostic addition; no timestamp rewrite or sample synthesis is proposed.

This review proposes observability only and no rerun to manufacture a green result. Parent's authorized fresh Fable consultation should receive the unchanged initial raw, exact missing pause evidence and both measured limitations: a paused retained owner still waits its scheduled lead, and shortening active seek lead previously retained old shifted tone. Native work, production guard/adapter changes, broader owner-cache implementation and prototype/handoff claims remain outside this slice.

Skills applied: use, dec-quality-testing, dec-software-principles.

## Approved observability-only amendment

Parent authorized saving failed pause evidence and explicit blocked/missing conditions. Harness revision `pause-attempt-before-assert-v1`, SHA256 `bbcf97b369ecf95025ab90a06f1e28e6747ecc788f24027e1e9bffa1fbee62f2`. The initial actual browser JSON and original3/3 Node raw remain byte-identical. No browser rerun was performed by this reviewer. The initial actual incomplete/negative outcome above remains the current browser evidence.

Every attempt is now inserted into the full report's `pauseAttempts` **before** pause begins. It records purpose/label, pause invocation context time, ACK and context time at ACK observation, before/after-ACK snapshots, the original untrimmed hold interval's exact frame geometry, actual full-interval left-channel RMS/peak/frequency, context time after capture, after-capture snapshot and strict mute verdict. Measured left PCM also provides1ms RMS/peak bins, first/last nonzero and threshold-crossing frames and at most33 raw samples around first/last nonzero. The same unchanged assertion runs only after these records exist. On rejection, error, failed-at context time and after-failure snapshot remain attached. If capture itself fails, ACK/timing/snapshots remain but no PCM, coverage or zeros are invented.

`blockedConditions` identifies each unmeasured return blocked by a pair failure, its reason, associated pause-attempt IDs and explicitly null measurement. `conditionCoverage` always enumerates54 conditions as measured, blocked or not-attempted; counts distinguish the actual measured cases from the terminal ledger. `completed` still requires54 actual measurements and no fatal errors. No blocked record counts as measured or passing. Compact visible summary exposes only these counts and concise errors; full evidence stays in the download. Clock failures retain up to16 gap events, with at most eight adjacent block descriptors each, original producer sequence/frame, actual input-channel count and first eight left samples. This records the neighborhood without changing timestamps or PCM.

No source buffer, region, lead, rate, pitch, schedule command, hold duration, mute threshold, pitch/gap classifier, preflight requirement or strict armed fence changed. There is no extra wait, sample trimming, retry, raw fallback, production guard change or production adapter/engine edit. Snapshot and evidence collection can add observational main-thread overhead; a later browser result must identify this revision rather than silently substituting it for the original candidate.

`node scripts/test_keylock_retained_return.mjs` now executes **6/6**, [separate raw](KEYLOCK_RETAINED_RETURN_OBSERVABILITY_NODE_RESULTS.json). The original three tests remain, including the actual unchanged WASM54-condition controlled host. New exact-helper regressions inject64 nonzero leading samples into a full1second pause and verify the existing assertion still rejects while preserving full metrics/frame bounds/snapshots; verify a zero control and a capture-gap rejection invent no data; reconstruct the initial browser46 measured+8 blocked ledger without turning it into54 measurements; and retain an advancing-sequence/repeated-frame neighborhood unchanged. These establish observability behavior and controlled DSP, not actual browser mute mechanism, a repaired capture clock, seamless release or main-UI acceptance. Production adapter `a96cd1d…`, experimental adapter `669f76e8…` and vendor `b2811c51…` remain unchanged.

Skills applied: use, dec-quality-testing, dec-software-principles.
