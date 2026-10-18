Current source follow-up (plan115): [selected-stem Censor review](STEM_SLIP_CENSOR_REVIEW.md) adds recorded reverse/rejoin and lifecycle checks. Local desktop testing is approved; frozen0.1.16 does not include this new path. Historical results/policies below retain their original scope.

Current source follow-up (plan114): [warped-loop Censor review](WARPED_LOOP_CENSOR_REVIEW.md) adds the loop composition. The historical scope/results below remain tied to their original candidate. Frozen native0.1.16 is unchanged.

# Censor — held reverse and forward-clock restoration

18 October2026, source after private checkpoint `6cd3023`. Native0.1.15 remains prepared and unchanged. This browser code is **not in that immutable desktop package**.

## Reference and implementation

The [official Censor manual](https://support.serato.com/hc/en-us/articles/234970288-Censor) documents held reverse playback, restoration to where uncensored playback would have reached, U/J for left/right, and exclusion in Absolute mode. This is the independently implemented behavior target. No proprietary source or assets copied; exact current-reference sonics and all compound states remain unaccepted.

Added a continuous Censor phase to the existing deck PCM worklet/kernel. It runs the audible cursor backwards while an independent hidden clock follows the prior signed rate and loop, even with persistent Slip off. It bypasses the scratch movement watchdog, not the existing ramp and source bounds. Matching End restores the hidden clock and prior playing state; stale owner/gesture commands do not control a newer hold. The five original/prepared-source outputs share the same cursor. Censor preserves persistent Reverse/Slip preferences.

The new release-safe hold controller handles pointer, focused-button Space/Enter, U/J with Playback Keys Use Shift, and a mappable Note/CC Censor target per deck. Multiple inputs share one gesture; releasing one does not end another. Keyup still releases when focus has moved into an input; pointer cancellation, window blur and hidden-document notification release holds. Pending preparation may be canceled before it can route a replacement. Engine cancellation clears the visible held state. Paused decks do not audition and ABS is disabled/rejected. No new Hercules addresses were guessed; its272-entry preset remains unchanged.

For fixed tempo/key processing, Censor prepares the existing renderer's output for original plus all available stems. Its virtual PCM sample rate is rendered sample rate / tempo, so the worklet's coordinates remain original-track seconds while reverse audio retains the requested fixed pitch. Existing per-source renderer and transport copy budgets apply; this is not a whole-process memory bound or a low-latency/long-file guarantee. The existing live keylock shadow follows the hidden forward clock during Censor and restores the live forward owner on release. Ordinary scratch behavior retains its existing path.

## Executed evidence

Focused contract `node scripts/test_censor_transport.mjs`: actual five-output ramp PCM reverses for1s past the120ms movement watchdog with Slip off; hidden clock advances; End restores it; wrong owners are ignored. Loop-clock and paused behavior, multiple-input/early-release/ABS controller behavior, actual AudioEngine preparation cancellation retaining its old voice, and MIDI Note Off captured release execute at their stated layers. The first paused assertion incorrectly included the existing3ms mute ramp; corrected to inspect sustained output after5ms. Initial test source retained. This contract does not establish musical/physical behavior.

The actual browser app workflow uses its normal Censor button, U/J, real MIDI editor, note release and blur. Two source fixtures: a nonstationary owned chirp and then a330Hz carrier, with an untouched550Hz opposite-deck carrier. Continuous reverse moves the actual source cursor backwards while the hidden clock advances. Pointer release leaves a simultaneous U hold active; U/J release targeted at the search field restores both decks. Fixed keylock+2semitones/tempo1.08 produces requested370.412476Hz before/during/after Censor; MIDI release retains U, then blur releases the final hold and restores the live owner. Paused and ABS controls do not start Censor.

Whole recorded master: **5.399977s /238139frames /44100Hz /stereo**, **87373bytes**, SHA256 `c405ee8e9aee2f73c8c48dc4a09ccfc2897cda92afdf3f6740e8e4ad07cd1fd6`. Entire browser decode checked finite. Seven declared250ms windows start100ms after stage markers; expected chirp frequency is specified from its source clock, never fitted after capture. Fixed gates:1Hz frequency error and RMS>0.005. Maximum measured error0.324840Hz. Pitched reverse370.412320Hz; pitched return370.414396Hz. Engine cursor-return state meets10ms in both cases: raw actual6.859206349183374 versus prior forward clock6.8592063492063495; pitched7.568661224486582 on both. This state criterion is not an earliest-audible-cursor proof; a tone cannot identify a unique source cursor. Chirp/audio windows do not establish first-frame10ms accuracy, seamless attacks, acoustic latency or sample-exact phase.

Ten declared served hashes are stable/match disk. Source identity observer confirms the live adapter received the current fixture. Final app audio stopped; test setup mutes its physical graph. No native/controller/speaker acceptance. Original reports, encoded recordings, source capsules and screenshot are ignored under `local-evidence/censor/`.

## Preserved failures

Two complete earlier recordings fail the pitched-before window:625.793Hz, then1400.912Hz versus370.412Hz. The source trace disproved the initial stale-buffer suspicion: source SHA/current-buffer identity matched. The check began before the declared future audio anchor, so zero-crossing pitch estimation included queued-start silence/noise. Final workflow waits until the anchor+50ms before marking the baseline; then its original100–350ms measurement window applies. The1Hz/RMS/cursor-state gates did not change. These are retained pre-start baseline failures, not reclassified passes or proof of startup quality. No production audio tolerance or proprietary reference software changed to make these captures pass.

Receipts: `censor-browser-results.json`, `censor-before-start-results.json`, `censor-transport-results.json`. Reproduce on an isolated unused loopback origin through `prototype/censor-harness.html`; do not reload the human's original review tab/profile.

## Remaining parity

Warped Sync, selected-stem Slip and overlapping scratch gestures currently reject Censor explicitly. In-hold rate/key/cue/loop edits, Flip capture/replay, prepared-stem musical composition, end/beginning boundaries, prolonged holds, failures/resource pressure and all-mode continuity require further implementation/acceptance. Existing loop/key processing uses preparation and can have delays; no low-latency claim. Full keyboard/reference screen parity, vendor sonic equivalence, native/physical controller and DVS/HID acceptance remain open. Full110group/522requirement flags remain false/unset; the nine beta deltas are separate. Separation-quality failures are unchanged. Before the next native package add `censor.js` and `pitch-time-map.js` to the declared module manifest, preserve all earlier builds and use a fresh version.
