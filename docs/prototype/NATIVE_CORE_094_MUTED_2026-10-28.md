# Native 0.1.94 muted grouped-tempo check — bounded result

28 October 2026. One existing isolated **GUI Tempo after Sync** window in exact native 0.1.94 / source aa07a04. Jason selected “Continue with muted checks only.” No main-session playback or listening acceptance; no new suite, soak, dependency, product code or build.

## Gaps first

The intended rejected-tempo case **did not reject**. Smart Sync, a four-beat loop, Key Lock OFF and +24 semitones accepted the next +0.1% GUI step. This run does not exercise controlled rejection, queued-request supersession or failure rollback; CORE-FIX-42/43/44 remain open for their relevant native paths. Source/browser proofs retain their original scope.

The shifted-loop frequency check also misses the existing harness 0.3 Hz criterion. Global spectral peaks are 1325.5425 Hz versus 1320 expected at the baseline, then 1319.9147 Hz versus 1321.32 expected after the tempo step. The original zero-crossing estimates differ from the spectral estimates; retain both. This is a measured quality gap in the +24 loop case, not a proven audible Sync-pop mechanism, musical verdict or general pitch-failure claim. Track under existing DEK-007, with no duplicate core card or speculative DSP patch.

## Executed path

Main 0.1.94 Recording preflight: 00:00.0, Start available, Download disabled; panel closed again. Saved native checkpoint: Constant Change / DJ W!LD at 50.716/62.715 s, 16 library tracks/previews, master −10.04344, Sync off and paused. No main Play/Sync/REC Start, load, seek, parameter edit or profile restore.

Opened the packaged Checks → GUI Tempo after Sync window: volatile session, denied device permissions, generated stereo-isolated 330/550 Hz tones. Existing preparation asserts physical-monitor mute before Play. Paused only those generated decks, set their positions to 0 through normal Home input, enabled A's four-beat loop, set A +24 semitones and restarted the owned decks. Native AX value-setting did not perform seeking; the normal keyboard route did. This is an automation-route limitation observation, not an app seek defect.

Captured one baseline, one GUI Right-step result and the existing Stop/export result: three 300 ms stereo snapshots, not whole-run continuity. Original 430419-byte JSON saved directly to ignored evidence; nothing left in Downloads. Export retained, then only the owned diagnostic window closed.

| Observed result | Baseline | After GUI step | Stop |
|---|---:|---:|---:|
| Nominal A/B rates |1 /1.2|1.001 /1.2012|unchanged; both paused|
| A FFT peak / expected Hz |1325.5425 /1320|1319.9147 /1321.32|silent|
| B FFT peak / expected Hz |660.000031 /660|660.660009 /660.66|silent|
| Whole-window finite samples |both 13230|both 13230|both 13230|
| Quiet 10 ms bins |0 /0|0 /0|30 /30|
| Exact stopped peak/RMS |—|—|0 /0 on both channels|

Independent inspection verifies all six Float32 hashes and complete windows. It reuses the established global 20–20000 Hz Hann 16x/log-parabolic estimator without an expected-frequency mask, trimming, PCM edits or relaxed criterion. Actual archive SHA remains c0b4a449…; all seven runtime-source hashes match the immutable ASAR and before/after. Raw capture and inspector are private under `local-evidence/native-core-check-094-2026-10-28/`; public numeric receipt is adjacent.

## Main session and remaining work

After closing the check, the main native accessible interactive inventory is identical 169→169, waveform preview inventory 16→16, positions 50.716/62.715 s unchanged, master −10.04344and silent UI meter. This is accessible-inventory/value preservation, not a DOM-node identity or all-layout certificate. The Mac then locked before a final screenshot; no further native interaction was attempted.

Current 0.1.94 is retained. Rejection/async ownership, changed-path listening, independent headphones/controller and broader pop/stall acceptance remain open. Prior 0.1.53 manual/jog/EQ/Cue/stop acceptance is reused. Next software diagnosis should target the retained shifted-loop observation, not repeat clean ordinary controls or broaden into an advanced-mode matrix.
