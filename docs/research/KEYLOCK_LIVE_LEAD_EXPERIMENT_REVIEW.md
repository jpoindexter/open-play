# Experimental live-keylock scheduling lead

17 October2026. This is a new isolated diagnostic, not a production change. Main-UI post-scratch pitch continuity remains **open**. Parent's actual master MediaRecorder inspection found two250ms windows near15s at476Hz where the synthetic source should retain its+12semitone880Hz pitch. Previous gap-only acceptance missed this. The actual recording/inspection remains unchanged.

## Question and isolation

Does preloaded/prewarmed actual Signalsmith WASM require the adapter's current queried-latency-plus-two-quanta wall-clock scheduling lead, or can it produce correct pitch/onset with shorter lead? The experiment does not assume latency telemetry is an audible clock correction or that reducing a guard fixes the UI.

New `prototype/keylock-live-lead-experiment.js` is an explicitly named clone of frozen adapter SHA256 `a96cd1d244e402957b4daedb823cb2015f759d4a46df9672954b9bba1f944e78`. Only the factory/export/option validation, experimental scheduling-lead calculation and issued/acknowledged timing diagnostics differ. It requires explicit finite `experimentalLeadSeconds` in0..1seconds; there is no silent new default. The source window, SRC, output graph, cancellation, terminal disposal, refill, source ordering and other range limits remain identical. No AudioEngine/app import exists. This is intentionally duplicated experimental code to preserve the accepted production candidate.

The disposable vendor module remains SHA256 `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e`; no vendor or embedded WASM edit. Source inspection shows its `process()` maps desired input at `currentTime+outputLatencySeconds` and uses past input around that map; preloaded PCM can make this different from a mandatory wall-clock wait. That is a source-level reason to measure, not proof that a given short lead works in the browser.

## Public browser diagnostic

Open `prototype/keylock-live-lead-harness.html` through the same local HTTP server and press **Run actual eight-point lead sweep**. DOM JSON is `#results`; visible status is `#status`. Expected duration roughly25–40seconds, with a20second per-capture-request timeout if it stalls. Parent owns the actual browser execution. No browser result has yet been claimed by this report.

Eight points are0,5,10,20,40,60,120,200ms. Each point creates a real adapter with synthetic native stereo AudioBuffer,1.08rate, keylock true,+12semitones, and its bounded processor window. It first prepares factory and PCM, then obtains64 consecutive actual capture process calls; startup gaps are retained and reset that preflight counter. It arms exact producer frame/sequence before sound. Each point measures:

1. Freshly prepared start at source position1: expected left880Hz.
2. Independently standardized prewarm: pause, start at an explicit300ms lead, prove actual880Hz, pause, capture50ms before the measured short-lead restart at position1.
3. Live near-seek to3.5 within the same prepared window: source region changes from440 to550, so expected left1100Hz; avoids accepting stale preceding sound as successful seek. Supplied source buffers stay positional/generic, unchanged.

The right channel has a different source tone but this diagnostic's pitch criterion measures the left channel only. A real zero ConstantSource forces valid stereo inputs; missing channels cannot count as captured silence. The capture Worklet zeroes all output and destination gain is0. No test audio routes audibly to speakers. Each armed span must have full contiguous frames/sequences, actual two-channel input and final producer fence; any armed gap remains fatal. No missing samples are discarded or synthesized. Final results retain accumulated point evidence even when a point or teardown fails.

Captured Hann-window FFT peaks, onset, actual schedule-issued and schedule-acknowledged context times are reported. FFT peak search has no expected-frequency input:200..1800Hz with quadratic log-power peak interpolation.40ms windows hop10ms, exposing early wrong pitch rather than checking only settled250ms audio. Declared, unchanged-across-points diagnostic criteria are:

- Fresh/restart RMS onset within30ms of requested output; live seek has no silence-onset criterion because sound already plays.
- First correct-frequency analysis window begins by30ms after requested output.
- Every audible window starting at least30ms afterward is within1% of the expected pitch; raw475.2Hz windows are separately counted.
- Settled windows starting250..400ms afterward retain pitch within1%, with at least five valid windows and minimum RMS.005.

These are explicit prototype experiment budgets, not vendor guarantees, imperceptibility thresholds or an assertion of artifact-free scratch. Window start identifies a40ms interval, not a sample-accurate instant. Live seek transition can therefore legitimately fail the declared early-pitch criterion while settled audio passes. `completed` means all eight points ran with no fatal capture/setup/teardown error; `allCriteriaPassed` additionally requires every point's audio criteria. A cleanly executed failing sweep is retained as failing evidence.

## Executed Node preparation checks

`node scripts/test_keylock_live_lead_experiment.mjs` executed **3/3**. [Raw result](KEYLOCK_LIVE_LEAD_EXPERIMENT_NODE_RESULTS.json). Scope: actual unchanged WASM processor behind a controlled serial Node message/clock/gain host, AudioBuffer-shaped fixture, plus the exact browser harness FFT tested against analytic475.2,880,1100Hz PCM. This is not actual browser scheduling/startup or main-UI evidence.

The three checks reject missing/nonfinite/out-of-bounds experimental lead, distinguish the raw wrong pitch from shifted/sought pitch with the real analysis function, and actually render all eight lead points through fresh/restart/seek states. Every point's settled target pitch is required. The full raw onset/early-pitch criteria are observed and retained rather than asserting that all low leads succeed. In this controlled host, queried latency is120ms, yet fresh zero-lead output begins13ms after requested time and prewarmed zero-lead restart begins near requested time. Near-seek early pitch fails at0 and10ms lead, even though settled pitch succeeds. This directly cautions against declaring one short lead from a simple sine/onset success. Browser IPC, real graph activation, context-rate quanta and main-UI ownership differ and must be measured separately.

Production integration would still need a current-owner prewarm strategy, source-cursor compensation based on measured output scheduling, cancellation through pending release/seek operations, no raw unshifted fallback, and an actual main-UI scratch hold/release recording with short-window frequency continuity. This diagnostic chooses no production solution and closes no parity gap by itself. It does not add native app work, offline full-track output rendering or a whole-file fallback.

Skills applied: use, dec-quality-testing, dec-software-principles.

## Independently inspected actual browser sweep

Parent executed the public button; [unchanged actual JSON](../prototype/keylock-live-lead-browser-results.json), SHA256 `6eeed29b24a134f08eb6fe19a415424891e043538a34566e925f62d7af3f166f`. This reviewer read every point's actual metrics and capture integrity.48kHz,23.941seconds; all eight points executed, no fatal errors, every armed span coverage1 with valid stereo inputs. No preflight startup gap was observed in this particular run. **Four of eight points meet all declared audio criteria; the sweep is completed but allCriteriaPassed is false.**

| Requested lead | Fresh onset minus request | Prewarmed restart onset | First correct1100Hz seek-window start | Actual failure |
| --- | --- | --- | --- | --- |
|0ms |+28.67ms |−1ms |+60ms |Old880Hz still dominates three windows starting30,40,50ms after requested seek |
|5ms |+36.67ms |−1ms |+50ms |Fresh onset exceeds30ms; old880Hz dominates seek windows starting30,40ms |
|10ms |+14.67ms |−1ms |+50ms |Old880Hz dominates seek windows starting30,40ms |
|20ms |+5.67ms |−1ms |+40ms |First correct seek-window start exceeds30ms |
|40ms |−1.33ms |−1ms |0ms |All declared criteria pass |
|60ms |−1ms |−1ms |0ms |All declared criteria pass |
|120ms |−1ms |−1ms |0ms |All declared criteria pass |
|200ms |−1ms |−1ms |0ms |All declared criteria pass |

Every point's settled target pitch passes. No raw475.2Hz window appears in this isolated sweep. The short-lead failure is therefore **stale preceding shifted audio after a seek**, plus the5ms fresh-onset miss, not reproduction of the main UI's raw-pitch bridge. For the20ms point a window starts at floating representation just below.03seconds and is excluded by the strict `>=.03` wrong-window counter; its separate first-correct-window criterion still fails at40ms. Zero counted wrong-after30 windows must not be reported as that point passing. No thresholds or floating comparisons were changed after observing it.

The reported120ms vendor latency is therefore not an unconditional120ms wall-clock requirement for this preloaded fixture.40ms is the smallest tested point satisfying these three fixture states in this **single** run; it is not a measured universal minimum, recommended production lead, confidence interval or guarantee across rates, shifts, sources, hardware, context sample rates or scheduling load. Fresh zero-lead startup is close to the30ms budget, and5ms does worse than0ms, showing why one monotonic universal lead curve cannot be inferred. Restart onset around−1ms also includes the2ms RMS analysis window, and the40ms spectral window's start is not a sample-accurate change instant.

### Why retained/prewarmed return is the next candidate

Current engine source inspection shows `beginDeckScratch` commits the raw scratch transport via `stopSource`, which terminally disposes the existing live keylock owner. `endDeckScratch` first sends raw `end`, which resumes ordinary raw PCM, then starts a newly prepared live adapter when keylock/shift is active. `startForwardKeylock` keeps that raw voice sounding through factory/window preparation and a future queried-latency+50ms handoff. This is a concrete path consistent with the actual main-UI raw476Hz interval. It is source-level causal evidence, not proof that every measured476 sample belongs to one particular await; parent's pointer/audio trace owns that temporal correlation.

Retaining the existing live adapter under explicit scratch ownership would avoid rebuilding its factory/window on release. It must be silent while scratching and remain bounded, then be scheduled at the correct original-track return cursor. It cannot simply remain the deck's audible current voice or be exempted from pause/eject/replacement/abort. Source-rate/key changes, original/stem geometry, an out-of-window scratch and reentrant Begin/End must invalidate or update the retained candidate. A kept paused candidate needs bounded source copies and no unowned refill/timer resurrection; existing terminal disposal remains the cleanup contract. A retained playing hidden owner is useful for Slip's unchanged backing clock, but non-Slip arbitrary new cursor still needs a real seek and has the measured stale-audio risk.

A40ms lead alone also does not choose what the user hears between physical release and corrected output. Leaving raw transport running repeats the observed wrong-pitch bridge; immediately holding/muting it introduces a gap that may exceed the earlier20ms low-RMS budget. Returning a still-playing muted owner immediately can jump to an incorrect position. Those are distinct behavior choices requiring measured cursor/pitch/gap acceptance, not reasons to hide failures under a relaxed gap threshold.

The smallest proposed next diagnostic unit is a **retained return** experiment: keep the actual accepted adapter alive but paused and silent through a1second hold, then restart at both the same source-tone region and a different region so stale output cannot masquerade as success. Compare experimental40/60ms scheduling with the current170ms scheduled control, at rates.5/1.08/2 and shifts−12/0/+12; report each case independently, strict full-span capture, release→first-correct-frequency latency, onset gap and short-window wrong-frequency duration. Repeat boundary cases rather than selecting a new default from one pass. A source marker or distinctly changed tone region must establish return cursor, not just unchanged sine pitch. Preserve raw failures and validate cancellation before/after ACK, repeated holds, output-owner/history transfer and shared other-deck survival before production integration. This is a proposal only; no new diagnostic extension, production guard or engine change was made in this review.

The main UI's recording still has90 shifted880Hz windows and two raw476Hz windows in the reported inspection; its measured source-envelope4.32Hz matches4Hz×1.08 rate but does not repair the post-release pitch interval. The isolated sweep and its four passing leads therefore do **not** close that UI defect. Parent owns exact updated build-plan/handoff wording and main-UI recapture after a concrete fix.

Skills applied: use, dec-quality-testing, dec-software-principles.
