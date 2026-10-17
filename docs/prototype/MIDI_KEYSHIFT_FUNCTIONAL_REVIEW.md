# MIDI Key Shift — browser implementation and evidence

**The browser candidate now dispatches Key Shift for all four decks and changes actual rendered stereo audio.** This is a scoped implementation gain, not full Serato parity. The installed Open Play0.1.5 package remains unchanged and does not include this code. Video MIDI targets remain absent.

The criterion for this unit was mapper selection → learn without triggering → add/save → mapped message → addressed deck pitch changes in recorded audio without changing its tempo or the other decks → actual page reload → saved mapping dispatches without relearning. Controlled failure/ownership cases supplement that browser path. Physical MIDI Key Shift, a new native package, vendor taper, all transport combinations and musical quality remain unverified.

## Implementation

- `midi.js`: existing decoder and encodings now feed an independent semitone conversion. Absolute travel maps to−24…+24; relative units move by semitones. Note-off is ignored. Synthetic review messages pass through the same decoder and validate fields. Fourteen-bit CC matching accepts only its actual MSB/LSB pair within0–63; unrelated CC80/112 cannot alias CC16/48.
- `panels.js`: all four deck Key Shift targets dispatch through the shared app action. The review input accepts explicit message/channel/number/value and remains labeled synthetic. Add validates/canonicalizes MIDI addresses, preserving existing mappings.
- `app.js`: MIDI and existing Key+/−/Reset share the pitch-control action. A same-track per-deck intent reservation preserves rapid relative steps while the existing engine awaits a pending stem-mode commit. Only the owning request clears that reservation; stale track/request completion cannot persist or erase a newer request. The engine keeps ownership of its own audio state and rollback.

The production audio engine is unchanged, SHA-256 `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf`. No licensing/entitlement path or proprietary Serato code was changed or copied. This is Open Play’s declared mapping policy, not a recovered Serato response curve.

## Executed browser evidence

The test loads the actual index DOM and main app module on isolated loopback origins. Its known330/550Hz and440/660Hz buffers replace the two demo sources for measurement; this does not test file import. Physical output is muted before any playback. Mapper/learn/Add/injection callbacks are driven through programmatic DOM interactions, and complete stereo recordings come from the actual postmaster bus with the real engine and WASM. No engine pitch method is substituted.

- Final initial phase: **8/8 checks**, no fatal errors, seven complete encoded recordings. Includes+8% tempo with neutral/+12/−12 pitch; relative deck2+1/reset at−8% tempo; deck3+12 and deck4−12 in four-deck mode; unchanged browse mapping.
- Actual page reload, then restored phase: **3/3 checks**, no fatal errors, one complete encoded recording. All five mappings restored unchanged, and the saved deck2 relative mapping changed real pitch without relearning.
- Both phases have identical before/after module hashes matching the frozen source. All recordings, decoded dimensions, measured windows, budgets, hashes and original encoded bytes remain in the downloaded JSON. The pitch criterion uses declared0.2–1.1s steady windows; it does not establish first-sample response, transition continuity, cursor or latency.
- Separate actual CUA main-interface inspection selected Deck1 Key Shift, CC1/16/value96 and clicked Inject synthetic message. The paused main view displayed+12 with both tempo controls0. This proves the main entrypoint UI path; its screenshot alone does not prove audio.

Read [initial phase](midi-keyshift-browser-final-initial-results.json), [restored phase](midi-keyshift-browser-restored-results.json), [candidate identity](midi-keyshift-candidate.json), [main UI AX](midi-keyshift-current-main-after-message-ax.txt) and [main screenshot](screenshots/midi-keyshift-current-main-plus12.png). Independent decoding/source review is recorded separately; do not treat the producer’s own measurements as that review.

## Controlled and failure evidence

`scripts/test_midi_keyshift.mjs`: **10/10** actual decoder/conversion/matching checks. `scripts/test_midi_keyshift_dispatch_review.mjs`: **11/11** actual extracted mapper/app action plus actual AudioEngine.setPitch with controlled pending commits and no-audio collaborators. These cover rapid+1/+1, direction reversal, newer request ownership, failed commits, stale-track/newer GUI intent, note-off, unloaded decks, valid/invalid14-bit pairs, browse preservation and decks3/4. They do not establish real WebAudio/stem DSP, storage, hardware or reference behavior.

Preserved failures: initial missing-function RED, corrected error-type RED, signed-zero normalization defect, missing configurable synthetic input, and actual pending-relative/Deck3/4 dispatch failures. The earliest decoder-test invalid-input assertion accidentally accepted a missing-function TypeError; the later RED requires RangeError and preserves the initial result without treating it as a valid pass. The review’s first VM-import fixture failure is also preserved and is not a production defect.

The first browser run safely stopped before playback because the physical-mute AudioParam had not yet reached its observed value. The harness now waits for actual mute. A later pre-review7/7 browser run remains saved separately; it does not replace the final eight-case cohort or cover the reviewer-discovered edge cases. Source review also corrected test evidence retention: original encoded bytes are saved before decode, and identity/cleanup failures are bounded and retained before final publication.

## Remaining acceptance

Native0.1.5 still lacks the new targets. A future new local package must preserve0.1.5, the approved interface and existing mapping/storage, then execute the relevant native path. Physical Key Shift on Hercules, controller ranges/tapers, feedback, all MIDI presets/modifiers/undo/import, Video targets and other mappings remain open. No full HW-002, HW-012 or DEK-007 acceptance follows from this unit. Full110groups/522requirements, nine separate beta deltas and26provisional release checks retain their broader gates.

Reproduce controlled checks with `node scripts/test_midi_keyshift.mjs`; give the independent dispatcher script a fresh output path to preserve prior records. To rerun browser integration, use the existing local asset server with a fresh isolated origin, open `prototype/midi-keyshift-harness.html`, click Run, save the complete report, reload the actual page, run the restoration phase and save that report. Do not reuse an already populated origin for a new initial cohort or compare different source hashes as one candidate.

Skills applied: use, test-driven-development, dec-software-principles, dec-quality-testing, adversarial-verify, claude-codex-handoff, verified-done family.

Independent reviews are now frozen: [source review](../research/MIDI_KEYSHIFT_SOURCE_REVIEW_20261017.md) and [whole-recording audio review](../research/MIDI_KEYSHIFT_AUDIO_REVIEW_20261017.md). All eight originals/573,120 stereo frames decode finite; all16declared sustained-channel criteria pass. Independent FFT confirms offsets up to+1.160701Hz; these meet the original tolerance and are not exact tuning or explained-away estimator bias. Deck4clip is1.440s, others1.500s, with no repaired/trimmed originals. [Execution/cleanup observations](midi-keyshift-browser-observation.json) distinguish harness DOM actions, real page reload and subsequent CUA main-entrypoint actions. Both owned test hosts terminated and their ports closed; old native0.1.5 remains running.
