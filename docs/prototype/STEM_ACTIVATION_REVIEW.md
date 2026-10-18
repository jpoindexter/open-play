# Stems activation: looping dropout corrected; keylocked level dip remains open

18 October2026 · plan137 · browser source based on85478e7. **Keylocked activation still fails the unchanged continuity criterion. Full Stems/keylock parity is unaccepted.** Prepared desktop0.1.23 is unchanged; no new package was built.

## Failure and production change

Actual Play→Preparation→Prepare selected on a playing generated stereo loop used the existing real SCNet-large completed cache. When its four WAVs decoded, `attachStems` paused the original voice before starting the replacement. Full retained output contains441 consecutive near-zero samples at44,100Hz: a10ms dropout in both channels. Maximum adjacent jumps were0.121414/0.166609; acknowledgment clock was10ms behind the original trajectory. All source files, raw data and the failing report are retained.

Forward playback now retains the old audible voice until replacements prepare and arm at a future audio time, using the existing Sync handoff coordinator. Multiple playing decks loading the same track share those barriers. The old voice then retires through the existing10ms gates. Failed preparation restores the prior prepared-buffer association and clears only this operation's owned processing state; it retains old audible voices. A superseding Stop is not undone. Paused decks stay paused. Scratch/Stem Slip/reverse and already-processing branches retain their previous paths and are not accepted by this check.

No model, weights, service, package, library, real-time algorithm or quality threshold changed. This is a source-activation change. Current service8768 was kept running. Job`a2877adfbffa4ece8ec544451917a589` is the previously created real SCNet-large result for owned8second330Hz-left/550Hz-right tones, with the current uniform-mixture-consistency export policy. Both executions traversed the production preparation API/download/decode/attach path using that completed cache. **No fresh inference or musical separation-quality benchmark is claimed.**

## Executed audio and coordination evidence

Predeclared capture guards: longest near-zero run≤1ms, every inspected10ms window RMS≥85% of the run's initial steady RMS, maximum adjacent sample jump≤0.03. These are controlled-signal continuity guards, not psychoacoustic or Serato equivalence limits.

| Actual browser case | Longest near-zero L/R | Minimum10ms RMS ratio L/R | Maximum sample jump L/R | Result |
|---|---|---|---|---|
| Original ordinary loop |10/10ms|0.6222/0.6604|0.1214/0.1666|Fail retained|
| Corrected ordinary loop |one/one sample|0.9772/1.0000|0.009142/0.015234|Pass on this path|
| Corrected forward keylock, rate1.1 |0/0 samples|0.6454/0.8148|0.009194/0.015278|Fail retained|

The ordinary loop's before/after12second captures each retain529,200frames per channel. Corrected acknowledgment position matches the old clock; known-tone phase is unchanged. The keylocked4second capture retains176,400frames per channel. Its acknowledgment clock also matches, but a brief level dip fails the same0.85 floor. Known-tone projections show approximately157.02°/−62.09° before/after phase changes with nearly unchanged steady amplitudes, supporting a replacement-processor phase/priming mismatch as the next hypothesis. This is measurement, not proof of the exact internal cause. No corrective gain, time alignment, threshold change or fitted audio was used.

All retained PCM is hash/finite checked. Each workflow additionally executes all four actual Stems pads off→exact master silence, all on→nonzero original route, then ordinary Stop→exact silence. The original decoded buffer hashes remain unchanged. These checks do not prove every isolated source, transition, Stem FX or model attribution.

Four focused coordination checks execute the real `attachStems` and handoff coordinator with a controlled renderer/clock: two playing decks wait for readiness together while a paused deck stays paused; replacement failure retains previous cache; failure with no prior cache restores absence; superseding Stop is retained. This is control/failure evidence, not an actual WASM fault or two-deck acoustic test. An initial exact binary equality assertion compared1.0999999999999996 with1.1; corrected to a1e−12 clock comparison. No product or audio gate changed for that test correction.

Reports: [before](stem-activation-before-results.json), [ordinary loop](stem-activation-after-results.json), [keylocked failure](stem-activation-pitch-results.json), [coordination](stem-activation-contract-results.json). Commands:`node scripts/test_stem_activation.mjs` and`python3 scripts/inspect_stem_activation.py`; the latter needs ignored originals/capsules. Original report identities:

- Before5,862,858bytes/SHA`d5432278247fdd1909df82eddb0956322b6c19ce6ebeb30de91d4e34287da5b3`.
- Ordinary after5,862,856bytes/SHA`9d2d3182d46dbd392473836694ef588177c8701aee44dbe4c65dc70f48cf6e75`.
- Keylocked failure2,099,721bytes/SHA`9ad14fe163ba1e141443b48db686aa222a126bf72017361ca1e40838afea613a`.

Both after reports were saved through normal browser Download and match byte-for-byte. Six production/source-module hashes match current bytes. Executed diagnostic versions are retained separately under ignored`loop-harness.js` and`pitch-harness.js`; the later query option and a generic “loop” wording correction do not re-execute old captures. Their exact hashes match the raw reports. Current diagnostic replay supports ordinary loop or`?pitch=1`; capture completion explicitly requires separate independent inspection, not an automatic pass. No broad FX/Stems/native matrix was repeated.

## Preserved state and next action

Fresh read-only native observation still shows desktop23, zero decks playing, both00:00.0 and Master−12dB. Its ASAR/profile272mappings/launchers are preserved. Main8768service remains running; isolated18878helper was confirmed live, then exited130 on its own retained session handle; diagnostic tab127closed. Serato was not reopened. No timed physical capture or readiness question while Jason is away.

Next DSP action: inspect old/new live pitch group origins, schedule/seek history and phase at this exact activation boundary; use the retained failing capture to test one specific priming/ownership hypothesis. Do not hide it with extra gain or treat a different path as a pass. Source leakage, negative-other quality, musical listening, long files/resources, simultaneous gestures, reverse/warped/transformed-loop compositions, every controller control and full reference/native/physical parity remain open. Physical re-entry is still left Hercules Play→RCA sound→same button Stop, then cue/mixing/Sync one action at a time. The full independent Claude audit remains unlaunched.
