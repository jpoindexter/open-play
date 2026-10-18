# Non-loop warped Smart Sync Censor

18October2026, source after private `57091fc`. This is new browser-source behavior; native0.1.15 and its profile/launchers remain unchanged. Full parity is unaccepted.

## Implemented behavior

The previous warped-Sync Censor rejection is replaced for non-loop decks. `reverse-censor-plan.js` expresses the decoded source in reverse coordinates z=duration−originalTime. Each reversed marker enters its original left-side tempo; output event times integrate distance/rate, including markers before the Censor start. The engine reuses its existing bounded live processor and independently resampled pitch map for original plus four aligned prepared sources. Keylock retains requested pitch; unlocked mode follows the reversed local playback rate. The decoded source is copied/reused through the existing reverse-buffer cache; bounded processor-copy accounting does not bound those complete decoded/reversed buffers or whole-process memory.

`censor-backing.js` retains the original forward voice and its existing beatgrid schedule under a zero-output silent pull. It does not seek/rebuild that voice at release. Reverse preparation leaves old playback audible. A future anchor crossfades to the reverse voice. Release after start crossfades back and transfers the existing Stem history/gain ownership; release before the future anchor cancels its scheduled mute/new voice. Actual engine position/rate queries understand the reversed adapter; disposal owns both voices/controllers. The original basic Censor worklet and fixed-mode path remain separate, with their earlier candidate evidence unchanged.

Warped loops still reject explicitly. Selected-stem Slip, overlapping gestures and edits while Censor is held remain outside this implemented composition. The original full feature goal and all remaining modes are preserved, not redefined around this slice.

## Executed checks

`node scripts/test_reverse_censor_plan.mjs` executed once: reversed90→150→120 section rates4/3→0.8→1, integrated event timestamps and exact marker-side selection; controlled backing-voice adoption before/after start; canceled preparation and pre-commit rollback retain the original object/gain state. Its engine/timing/gain collaborators are controlled; this is not actual audio or exhaustive mid-route failure recovery.

Actual browser workflow loads the ordinary app, stages source tempo markers at1s/150BPM and2s/90BPM through the real editor, selects Smart Sync, sets+2semitones, and exercises U Censor in **both keylock states** from an observed Beat Sync state. The original and four prepared synthetic source buses share one ten-channel processor/five outputs. No new source-separation inference or model-quality acceptance is claimed.

Each mode crosses both markers backwards, checks decreasing original-source position and all three actual local rates, then mutes Vocal through the normal Stem pad before releasing U into the search input. The same original forward voice/grid object returns. Vocal stays muted after return, then its pad restores all sources. Beat Sync stays engaged during/after Censor. Ten-millisecond return-state criterion matches the pre-Censor forward clock exactly in these two observations. That is metadata; tones do not identify unique source cursors, and this is not first-frame audible10ms/sample-exact phase or downbeat acceptance.

Whole master: **14.939977s /658853frames /44100Hz /stereo**, **241479bytes**, SHA256 `0591455521280d648a074c6e7b333a17496195605f616862947fc63afe7dff58`. Entire browser decode finite. Fourteen declared frequency/RMS windows (seven per mode): before, three reversed source sections, reverse Vocal-muted, return Vocal-muted and return-all. Fixed gates1Hz and RMS>0.005; max carrier error **0.006861Hz**. Locked carrier stays370.412476Hz; unlocked expected493.883301→296.329981→370.412476Hz, then493.883301Hz on forward return. Opposite deck remains550Hz.

The independent Vocal contribution is one third of the known synthetic sum. Declared muted/all RMS ratio range0.60–0.73 holds before and after release: **0.667739/0.668085 locked**, **0.668096/0.667517 unlocked**. This measures prepared source routing/coherence under these tones; it does not establish all real separated-stem attribution, transient phase, FX tails or quality.

Eleven declared served source hashes remain stable/match saved disk. Test graph muted before playback; both decks stopped afterward. Full original JSON, encoded recording, source capsule and screenshot stay ignored under `local-evidence/warped-censor/final/`. Receipts: `warped-censor-browser-results.json`, `reverse-censor-contract-results.json`, `warped-censor-initial-results.json`. Reproduce through `prototype/warped-censor-harness.html` on an isolated unused loopback origin; do not reload the human's original tab or change native15.

## Retained failures and limits

First setup asserted the mute AudioParam immediately, before its scheduled value applied. It failed before playback; final setup waits for the graph observation. A later run fired Sync/Play together and reported Tempo Sync at its failed “Censor dropped Smart Sync” check; it did not record the pre-Censor state, so it cannot prove a Censor downgrade. Final setup waits for secondary armed, logs initial Beat Sync, and then executes unchanged state/audio criteria. Rapid Sync→Play behavior is neither fixed nor accepted by that correction and remains a core interaction concern for a separate reproduction. The failed partial recording/source capsule is retained; no tolerance was weakened or failure relabeled as passing.

Still open: warped loops and selected-stem Slip; in-hold tempo/key/cue/loop/mode changes and Flip; cold preparation/onset/earliest audible return, transient/listening quality and exact Serato policy; other rates/markers/keys/channels, beginning/end cases, long holds/sessions, resource pressure and exhaustive failures/races; real source-separation quality, native/controller/acoustic/other-device acceptance. Full hidden-clock/sample-phase fidelity requires nonperiodic audio evidence, not these tones. Whole decoded reverse copies can be costly and cold preparation is not an instant or low-latency guarantee.

Before the next fresh native package include `censor.js`, `censor-backing.js`, `reverse-censor-plan.js`, and `pitch-time-map.js` in the declared module manifest. Preserve all prior builds. The full independent Claude completeness audit remains unlaunched; exact original prompt/model routing and all full parity flags remain unchanged.
