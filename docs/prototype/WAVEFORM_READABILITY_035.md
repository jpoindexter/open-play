# Core waveform followability — 0.1.35–0.1.37

21October2026. Scope: make the real source waveforms/beatgrids easier to follow, preserve all controls/layouts/library previews, and check another song pair. No audio scheduling, grid metadata, Sync algorithm or analysis thresholds changed by this rendering pass.

## Target and change

The previous scrolling view used9px bar numbers, low-contrast beat lines and a1px red playhead over RGB bass peaks. Four-deck horizontal detail was100px total (25px per lane), or76px in Small. This made musical alignment difficult to follow even when listening sounded on point.

A focused `detail-waveform.js` renderer keeps the existing engine-provided positions and per-deck rates. A separate ruler distinguishes short beat ticks from longer, numbered bar ticks; each lane displays its letter and local bar.beat. A white2px NOW line with black surround stays visible across frequency colors. Passed audio is slightly dimmed; no source-time shift or invented alignment is applied. Vertical rendering preserves the same center time and uses a narrow side ruler. Waveforms remain frequency-colored and source-derived.

Four-deck horizontal Small/Medium/Large are144/168/200px total, giving each lane enough room for the ruler and audio. No deck control or preview is removed. Accessible scrub descriptions explain the shared NOW position and why different absolute bar numbers can still be aligned. No per-frame live-region announcements are added.

## Source evidence

Four focused drawing checks execute the real renderer with real beatgrids: matched different-tempo grids share beat coordinates without equal bar numbers; an injected24ms source phase error stays visible; four clipped vertical lanes preserve the same NOW position including an empty deck; ruler text/marks meet measured contrast thresholds. Existing decoded-source renderer tests retain transient/stereo integrity and red-low/green-mid/blue-high encoding. These source checks do not establish native readability or listening acceptance.

## First native pass and follow-through

Actual0.1.35 launch and2/4Horizontal Compact were inspected; core controls and library previews remain visible.4Vertical exposed clipped empty-lane text and mixer faders overlapping the bottom bar. Empty narrow lanes now use a dash, the shared vertical NOW label is shown once, and medium4V receives20px more per deck row so all five existing knob rows/Cue/fader fit. Small/Large and the existing Loop-specific height remain unchanged. This correction is packaged separately as0.1.36; earlier immutable builds are retained.

## Final native execution — 0.1.37

Built immutable source `ce5c12420b3bbf0dda388e44bfc758126cd20972`; ASAR `4f3fcdb6340dafa8030b2ecd061bdd970a6e036b4df64bb053f3ed8ed93c8a7a`. Package/source checks5/5. Actual native2/4Horizontal and Vertical Compact Medium inspected with Jewel Kid “In The Dance” and Anika Kunst “Prism”; original core controls and15 library previews remain.4V faders sit above the bottom bar;2V uses176px of detail height instead of72. Its taller center stack also increases the adjacent deck height; further deck packing remains a UI refinement, not hidden completion. No Small/Large, every layout variant, frame-time/CPU or VoiceOver runtime certification is implied.

Both imports ran production analysis through the native Import workflow:131 and129.99BPM respectively. Original hashes match the earlier read-only corpus. Jewel Kid had supported full-track pulse coverage in that corpus; Prism did not. Prism is therefore a useful additional uncertain case, not an established accurate-grid control. No correction marker or source metadata edit was added. The225-file corpus was not rerun.

Actual paused-incoming sequence: A played131BPM, B Sync entered ARMED at131, B Play entered BEAT while A remained primary131. Both native beat states agreed; distinct local bar numbers and bar-line positions were visible in2V/4V/4H/2H. One playing-incoming re-Sync also observed. Both stopped at A140.436s/B130.256s and master meter returned to−∞. These UI/meter observations do not establish sample-accurate audio alignment or clean acoustic output. Jason subsequently answered “Aligned and clean; easier to follow.” This is scoped audible/visual acceptance for this pair/session; exact timing and intermittent defects remain open. The master capture includes the paused Sync, launch, playing re-Sync and layout changes; no exact event timestamps or independent waveform-correlation analysis were executed.

Private evidence: `local-evidence/waveform-readability-037/` contains the actual native screenshots, AX states, source hashes and observation receipt. The capture `jewel-prism-master-037.webm` is1,317,184bytes, SHA256 `12137d7746f064cea6f7c6a58a3a7f6fe436e0d36c4d6aae5cc7bc6bb11a18b3`. The macOS Save dialog converted an absolute filename into a colon-separated Downloads filename; that exact newly generated file was moved to the intended private evidence folder and hashed. Original audio files were not moved or changed.

Source/drawing evidence:4/4 focused renderer tests and existing source-waveform checks pass. A duplicate packaging invocation exited because immutable0.1.36 already existed; its completed original receipt was read and inspected instead of overwritten. Some background-window screenshots during0.1.35 were stale despite AX changes; final0.1.37 captures were taken after raising the actual native window. Do not use the stale0352V image as evidence.

## Trello readback

Updated existing ANA-001 and CORE-FIX-07 descriptions with0.1.37 current evidence and limits. Both read back with the new header, retained model guidance and open state. ANA-001 prior current checkpoint was preserved in a linked card comment; existing criteria/history remain. No card was created, closed or moved.

## Current boundary and re-entry

Current launcher targets0.1.37. Both new songs remain loaded/paused, Horizontal/Compact/Medium, Sync engaged, master about−10dB, crossfader centered. On restart demo decks load; saved imports/previews persist. For manual beatmatching explicitly disengage Sync and reset pitch first. Prior native/listening evidence stays scoped to its version.

ANA-001 and CORE-FIX-07 remain open. The new-pair listening/readability check is accepted by Jason. Preserve this capture and resume the remaining manual transition, per-channel EQ and temporary Cue session. Independent headphone/controller routing needs suitable hardware. Unsupported grids, BPM/downbeat ambiguity, intermittent pops/lag and broad parity are not cleared by a visual pass.

Principles applied: position on a common scale; Gestalt continuity/figure-ground; cognitive-load reduction; redundant text/thickness rather than frequency-color-only timing cues. Skills: use, debug, design, dec (data-visualization, color-and-elevation, accessibility, cognitive-load, Gestalt, quality-testing). The generic frontend-testing skill was inspected and discarded because its Dify/Vitest conventions do not apply to this plain-JavaScript project.
