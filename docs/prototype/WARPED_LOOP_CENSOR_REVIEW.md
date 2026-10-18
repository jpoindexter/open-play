# Warped-loop Censor: reverse wrap and forward-owner return

Plan114, 18October2026, browser source after f7799dd. The frozen desktop0.1.16 is unchanged; these source changes are not in that package.

## Behavior and reference boundary

The [official Censor manual](https://support.serato.com/hc/en-us/articles/234970288-Censor) documents held reverse and resuming the timeline that would have played without Censor; U/J are its shortcuts and Absolute mode is excluded. It does not specify warped-loop boundary behavior. The loop composition here is an independent implementation of that contract, not an observed Serato equivalence result.

Previously beginWarpedCensor explicitly rejected an active loop. It now maps the original loop and tempo markers into reversed source coordinates. Raw PCM uses the existing audio-thread musical loop kernel; keylock/key shift use the existing periodic warp-loop renderer, then reverse that rendered cycle. Original plus four prepared sources share the reverse clock. Forward transport and grid continue through a silent pull; release restores the exact retained voice/grid, loop bounds and stem-mute state. The mapped reverse loop has no finite UI-timer event queue. Non-loop Censor still uses its previous live adapter.

The forward loop worklet error callback now recognizes its retained Censor backing owner. Temporary pull outputs support named input connection/disconnection, so all five source buses are consumed independently and can detach on return. New handling does not change controller addresses, native assets or the reference app. Existing whole decoded/reversed buffers, rendered cycles, processor copies and caches are additional memory; no total-memory or low-latency guarantee is claimed.

## Executed checks

One focused contract checks a known eight-beat reverse loop at independently calculated source positions/rates over27cycles, actual five-bus PCM ramp decreasing/wrapping in the real loop kernel, plus existing forward-owner early release/cancellation checks. This is controlled kernel/ownership evidence, separate from browser audio. Receipt: reverse-censor-loop-contract-results.json.

Final actual browser app grid/Setup/Smart Sync/U/Stem-pad workflow: source loop has two beats at120BPM, two at150BPM, four at90BPM; target120. Raw, keylocked+2 and unlocked+2 each reverse across90→150→120 and wrap to90. The fixture has distinct440/330/220Hz source regions so recorded section order tests direction rather than relying only on cursor display. All five prepared buses run; one of three equal sources is muted while held and remains muted on return. Normal app controls release Censor, preserve Beat Sync and original forward owner/grid/loop bounds. Return cursor matches that retained analytical clock within the existing10ms state criterion. It does not establish first-audible-frame/sample-phase equivalence.

Whole final master **29.819977s /1315061frames /44100Hz /stereo**, **481533bytes**, SHA256 **603d97dffc28a89953da0347915cafbd4733cd20c04c01a9381459c9d3b87a71**. Entire browser decode checked finite. Eighteen fixed windows use unchanged1Hz/RMS>0.005 gates, including opposite550Hz deck and forward-return carrier. Maximum left carrier error **0.481314Hz**; six reverse/return mute ratios **0.665434–0.667088**, within0.60–0.73. The release windows prove expected carrier/output/mute after restoring the owner; a steady tone is not a unique audible source-cursor or signed direction witness. No seamless-transition, acoustic or musical-quality claim.

All three temporary pulls report five independently populated stereo inputs (the deliberately silent fourth stem stays zero), production return sets retired before the harness awaits the same disposal promise, and each actual worklet acknowledges disposed. Thirteen declared served hashes remain stable/match disk. Final app stopped, physical graph muted. The browser workflow is isolated on port18860; main desktop profile/route and port8768 remain unchanged.

## Evidence history and remaining work

First scoped recording passed reverse/wrap/pitch/mute but lacked an audible-return assertion; a second passed the added return windows. Code review then found the output wrappers omitted disconnect/target-input forwarding. Final source corrects it and the same focused workflow verifies return/disposal. Earlier complete reports/audio/source capsules are retained under ignored local-evidence/warped-loop-censor/{initial,return-check,final}/; they are not mislabeled failures or relabeled as final-source results. The initial large DOM extraction was truncated; bounded reads saved complete originals. No old green FX/keylock/MIDI matrix was repeated.

[Final result](warped-loop-censor-browser-results.json) retains criteria, windows, source hashes and full metadata; encoded masters/profiles stay local. The final capsule includes all declared source bytes, harness HTML, base commit and patch. Package16 remains the prepared physical-test candidate. Full feature flags, model/effort routing and full original prompt remain unchanged.

Still open: selected-stem Slip/Censor, persistent reverse with warped loops, in-hold rate/key/cue/loop edits and overlap/Flip, arbitrary/short loops and track boundaries, preparation latency/long sessions/resource pressure/error injection, music/model-separation quality, reference-native UI/hardware/DVS/HID/streaming and full Serato parity. Full110groups/522requirements and9beta deltas/26release checks remain unaccepted. Full independent Claude audit remains unlaunched. Human is away; physical re-entry stays left Hercules Play→deck1/RCA sound→same-button stop when ready.
