# Censor with selected-stem Slip

Plan115, 18October2026, browser source after d4ea2a5. Frozen desktop0.1.16 remains unchanged; this feature is not in that package.

## Reference boundary and behavior

The [official Censor manual](https://support.serato.com/hc/en-us/articles/234970288-Censor) describes held reverse followed by return to the otherwise advancing timeline. [Serato’s T10 guide](https://support.serato.com/hc/en-us/articles/17616872214799-Hercules-DJControl-T10-Quickstart-Guide-for-Serato-DJ-Pro) describes Stem Slip/release differently from the manufacturer material retained in [the evaluation](../research/STEM_SLIP_EVALUATION.md). The exact T10/4.0.10 combination remains unobserved. This implementation extends the existing independent selected-group model; it is not a vendor-parity decision.

Previously Censor explicitly rejected an armed selected-stem Slip mode. The actual Censor/U/J/MIDI ownership path now delegates to the existing split transport: reverse Vocal alone, or Melody/Bass/Drums together in Instrumental mode, while complementary audio advances on the canonical clock. Release rejoins immediately and retains mode/voice. It deliberately bypasses a configured Slip Release roll, consistent with this independent Censor policy; the exact vendor composition is unknown. No new separation model, DSP algorithm or hardware address was added.

A Censor request owns its track, selected mode and gesture. Early release aborts pending begin; it cannot later post reverse. Mode replacement, a newer selected gesture, explicit stop and canonical track end invalidate the old request/visible held state. A stale release cannot end a replacement owner. Already-active selected gestures must be released before Censor; arbitrary overlap and persistent loop/reverse restoration remain open.

## Executed evidence

Focused actual engine request/gesture methods with the real four-source PCM kernel: Vocal/Instrumental selected ramp reverses while complement advances; immediate rejoin despite4beat release; release before Begin acknowledgment; newer owner; mode replacement. Worklet scheduling is separate. Receipt: stem-slip-censor-contract-results.json. No old full Stem Slip/keylock/FX matrix repeated.

Final actual app workflow uses Stems mode/release selectors, Play, U/key release into Search, mode replacement and canonical end. Two prepared synthetic four-source cases: Vocal raw at1.08rate, Instrumental keylocked+2 at1.08rate. A linear-frequency chirp is placed in selected left audio and a550Hz original carrier in complementary right audio. Eight fixed200ms master windows check forward, early reverse, late reverse and forward return in each case, against unchanged1Hz/RMS>0.005 gates. This distinguishes reverse direction through chirp frequency change rather than just a negative displayed velocity.

Whole master **7.679977s /338687frames /44100Hz /stereo**, **74398bytes**, SHA256 **b0f709527761be219ab279eb6df38ce778e2157619db95359379f96603ee7a08**. Entire browser decode checked finite. Maximum selected frequency error **0.430648Hz**; complementary error **0.012973Hz**. Measured reverse drops **9.319718/9.678880Hz**, above6Hz criterion. Complementary carrier is verified in the fixed windows, not as a gap-free guarantee over every sample/transition. Return state is idle/aligned within5ms despite4beat Slip Release; expected forward chirp is audible in the return window. The steady/short-window data are not earliest-frame/sample-exact cursor or acoustic-latency proof.

Both selected mode replacements clear visible Censor/requests and preserve the transport; stale U release leaves replacement idle/forward. Canonical end in the second case leaves playingfalse, modeoff, censorfalse, heldfalse and0requests. Eleven declared served hashes stay stable/match disk. Final app stopped and physical graph muted. No physical controller, native16, listening, model-quality or full reference acceptance.

## Retained failure and remaining work

Initial workflow reached the Vocal audio windows but failed on a test-page reference to an unexposed internal controller object. Corrected harness observes the actual Censor button’s pressed state plus request/deck state, and requires both cases before accepting its audio group. Production code/criteria did not change for that harness fix. Initial original recording/report/source are retained under ignored local-evidence/stem-slip-censor/initial; its over-broad partial audio-group check string is not full acceptance. Final complete report/master/source capsule/base commit/patch are separate under final. Public-safe receipts remove encoded audio only.

[Final browser receipt](stem-slip-censor-browser-results.json) · [Initial failure](stem-slip-censor-initial-results.json) · [Focused contract](stem-slip-censor-contract-results.json).

Open: exact vendor initial masks/release/Censor interaction, T10 hardware, musical separation/transients/quality, warped Sync with selected-stem Slip, loops/other overlaps, cold arming and in-hold rate/key/cue edits, full edge/latency/pressure/session behavior, and all native/hardware/reference acceptance. The native test package/profile/launchers remain untouched. Full110groups/522requirements plus9beta deltas/26release checks, full flags/model+effort routing and original prompt stay unchanged. Full independent Claude audit unlaunched. Human away; physical re-entry remains one left Hercules Play→RCA sound→same-button stop action when ready.
