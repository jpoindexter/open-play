# Quantized Cue and loop boundaries — 28 October 2026

An isolated real-song check at source zero exposed a basic Loop failure before the intended pitch-render investigation. At123BPM and downbeat0.3560693446462153s, the shared quantizer chose−0.13173553340256516s. The valid engine guard rejected Loop In with “Loop Out must be after Loop In, with both inside the track.” Resetting key shift to zero reproduced the same rejection, so this was not established pitch-processing failure.

The shared `quantized` helper now clamps the snapped result to zero through track duration using the existing clamp function. Temporary/hot Cue, automatic/manual loops and Pitch Play cue creation keep their existing shared caller/API. Interior/fractional snapping and Quantize-off behavior stay unchanged. The source beatgrid/downbeat is not shifted; at the media edge the legal file boundary takes priority over an out-of-file beat. Engine loop validation remains enabled. Two product lines; no new runtime module, dependency, DSP, clock, fade, layout or format change. Legacy app.js remains debt.

## Executed result

The same real-song Loop at zero now engages with bounds0–1.951219512195122s. Actual keyboard hot-cue creation stores `{position:0,name:'Cue 1'}`. Four Play controls and nine library previews remain, all decks stopped and physical output muted. The real-song input hash and mtime are unchanged. This is full browser UI→quantizer→engine validation behavior, not just an isolated helper check.

One18-line regression composes the actual source quantizer, source clamp and real beatgrid module. The old negative result fails; repaired lower/upper media bounds, interior beat, fractional beat and Quantize-off cases pass in one check. Initial GREEN fixture omitted the new existing clamp collaborator; that fixture error was preserved and corrected without another product change. Per Jason's explicit instruction, no broad suite or clean-song matrix was run.

A native pointer-style browser locator did not create the Cue; it is ungraded. The accepted Cue step uses the existing focused-pad Space handler. Parent capture reports the resulting Cue/loop state. The earlier404 staging-route failure and preparation timeout are retained as setup evidence, not audio errors. The server's private-folder restriction was preserved; only a hash-verified hardlink of the pinned test song was staged under the normal test-fixture route, then removed.

The full-track keylocked-loop renderer finding remains under DEK-007 and is not freshly reproduced here: the first preparation never reached Play because of this separate negative Loop In. Next re-entry for that finding is a single muted long-track keyed-loop Play attempt after this boundary repair; capture the actual renderer failure before changing DSP/time mappings. No claim about the intermittent Sync pop or original unattributed long frames.

Owned session Stop/close/clear returned “Stopped; frame closed; owned origin cleared.” Temporary sources, staged media and diagnostic tab are removed; server is stopped after capture. Normal desktop session, originals and recordings were not used by the diagnostic. [Receipt](quantize-boundary-2026-10-28.json). Private raw input pin/fixture/setup/baseline/repaired/screenshot remain ignored in `local-evidence/keylock-loop-window-2026-10-28/`.
