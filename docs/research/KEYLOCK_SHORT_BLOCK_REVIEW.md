# Supported short-block configuration experiment

17 October2026. Independent browser experiment, no production implementation. Original vendor, two-fix/disposable modules, production/live-lead adapters, existing capture harnesses and engine/app remain unchanged. Native app is still prohibited before approval.

## Exact documented API and timing

Local official [UPSTREAM_README](../../prototype/vendor/signalsmith-stretch/UPSTREAM_README.md), sections `latency`, `schedule`, `configure`, documents `configure({blockMs,intervalMs,splitComputation})`, interval default block/4 and split default false. It says low-lead scheduling can soften a transition while the processor catches up; latency is not an application-owned audible clock. The exact vendored implementation merges config then calls `_configure`/`_reset` and reallocates working buffers; this experiment calls it only before PCM/scheduling.

NEW `prototype/keylock-short-block-experiment.js`, SHA256 `642154087138f6bf2b8176d430e488c6c25ff1dd1031a8c150c62728a34a93ec`, derives from frozen lead experiment `669f76e8…`. Export `createShortBlockKeylock(context,{...existingExperimentalOptions,experimentalBlockMs,experimentalIntervalMs?,experimentalSplitComputation=false})`. Explicit block values20/30/40/60/120ms, interval defaults block/4. The separate string `'default'` skips configure entirely and rejects interval/split mixing. Each fresh node is ready, configured once, queried for latency, then receives PCM. No dynamic reconfiguration/reset is exposed during sound. Five-source positional ordering/channel handling, bounded SRC/window/refill, owner cancellation/disposal and app clock stay unchanged. The vendor is still disposable `b2811c51…`, embedded WASM unchanged.

Actual-WASM API tests at48kHz observe:

| Configuration | Queried latency | Input/output latency | Actual block/interval frames |
| --- | --- | --- | --- |
| Untouched default |120ms |60/60ms |5760/1440 |
|20ms |20ms |10/10ms |960/240 |
|30ms |30ms |15/15ms |1440/360 |
|40ms |40ms |20/20ms |1920/480 |
|60ms |60ms |30/30ms |2880/720 |
| Explicit120ms |120ms |60/60ms |5760/1440 |

Separate explicit20ms/5ms/splitComputation true configuration is also accepted by actual WASM; the main sweep fixes split false and interval block/4. This does not establish CPU quality across split modes or sample rates. Untouched default and configured120ms have separate factory identities, and no prior audio state crosses either control.

## Public browser diagnostic

Open `prototype/keylock-short-block-harness.html`; press **Run36 actual short-block conditions**. Compact JSON `#results`, visible progress `#status`. At completion, **Download full measured JSON and PCM** saves `keylock-short-block-browser-results.json`. Parent owns actual browser execution; none is claimed here. Expected50–80seconds;180second whole-run budget plus bounded final cleanup.

36 conditions: six configurations above ×0/5/10ms leads ×same/different known source region. Rate1.08, keylock true,+12. Left source440Hz before original second4,550Hz thereafter; requested positions1 and6, target880/1100Hz. Right source55Hz has a deterministic32-chip amplitude barcode at120ms per original-source chip; target bass110Hz. The exact barcode and source are held synthetic data. Each configuration/lead has a fresh owner;18 owners in total. Each is safely primed at300ms lead, retained inactive/muted through an actual captured1second hold, then resumed without rebuilding. Different-region return follows a separately captured50ms pause. No raw source fallback.

Strict **20ms release silence** and **30ms first-correct-pitch-window** criteria remain unchanged;40ms FFT windows advance10ms, target tolerance1%, no wrong audible pitch after output+30ms, and settled windows at output+250..400ms. Failed configured-prime pitch is saved and contributes failure to the cell rather than preventing its release observations. Prime requires actual sound to continue; no wrong pitch is called a pass. Timing/pitch pass count is not musical quality acceptance. Strict mute prerequisite remains RMS/peak below1e−4 over the original pause interval, no trimming or extra wait.

The corrected pause observability records attempts before assertion, including timestamps/full RMS/peak/bins/sample neighborhoods and snapshots. Blocked conditions explicitly remain unmeasured. Producer64-consecutive-call preflight precedes exact arming; every armed sample block must retain actual stereo input, frame/sequence continuity and final same-port fence. Any armed gap remains fatal. Previous observable retained-return actual failures were exactly one leading nonzero left sample in each failed hold; this new diagnostic preserves the same strict requirement rather than suppressing that sample or inferring a cause/right-channel result.

All capture outputs and destination gain are0. Native stereo-zero ConstantSource keeps every capture input valid; missing input is not silence. Per measured release, the full report stores exact observed left/right PCM as float32 little-endian base64, explicit sample rate/first frame/length, not predicted PCM. Each release interval starts up to50ms before release and continues through scheduled output+500ms. These are captured release segments; full armed span continuity is separately verified, not falsely labeled as all armed samples exported.

## Quality and source-position evidence

Descriptive rough quality includes settled left spectral peak, residual after a fitted sine at target frequency and at measured dominant frequency, shifted bass spectrum, right adjacent-sample jump and the known barcode envelope's correlation with expected original cursor/rate. Barcode search is explicitly bounded to±80ms original-source offset in1ms steps and reports both expected-cursor correlation and best fit. A best fit is not a calibrated position correction: pitch DSP smearing, bass cycles and10ms RMS windows can shift it. Cursor ACK remains within one context-frame; actual left frequency establishes broad region only. No sample-exact audible cursor claim follows.

Residual and bass/barcode metrics are retained without a post-hoc pass threshold or golden-audio claim. Smaller analysis blocks contain fewer bass cycles and can introduce sidebands, pitch instability or transient smearing. A good onset alone is insufficient; further musical transients/bass/stereo/listening tests would be needed before selecting a production setting.

## Executed controlled tests:4/4

`node scripts/test_keylock_short_block.mjs`: **4/4**, [raw](KEYLOCK_SHORT_BLOCK_NODE_RESULTS.json). Tests use exact unchanged WASM behind the established serial Node port/clock/gain host, not actual browser scheduling. They validate options/default isolation and split true feasibility, verify configure→latency→PCM ordering and actual internal frame geometry, process all36 inactive-retained returns with actual stereo output and original strict short-window classifier/rough quality, and prove the exact new classifier rejects40ms silence and synthetic wrong940Hz while raw PCM encoding round-trips as float32LE. The ledger always enumerates36 without inventing data.

Controlled timing/pitch observations: default and explicit120ms each0/6 meet all release criteria;20ms is3/6;30/40/60ms each6/6. These are fixture observations, not a browser result or recommended setting. The source same-region onset is about4ms with20ms blocks versus27ms under default; changed-region onset and first correct pitch remain separately measured.

A crucial metric distinction: early zero-crossing rates around940/1162Hz for20ms blocks are **not** proof those are the dominant fundamentals. The actual Hann FFT observes same-region dominant884.7Hz and different-region1111.1Hz in representative20ms cells. Strong waveform changes can inflate crossings. Representative20ms expected-tone residual RMS ratios are.933/.986, whereas60ms gives.082/.150.30ms has a representative right bass peak117.9Hz rather than target110;40ms has high expected-tone residual despite peak within1%. These measured differences warn against adopting the shortest block solely because a1% dominant-peak test passes. They do not constitute a calibrated sonic ranking, upstream bug verdict or golden-quality acceptance.

No production lead or configure default changed. The main-UI raw-pitch release defect and practical pause/return routing remain open until an approved concrete engine change is measured end-to-end through its real gesture and actual output.

Skills applied: use, dec-quality-testing, dec-software-principles.
