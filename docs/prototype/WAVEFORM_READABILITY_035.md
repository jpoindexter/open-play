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

## Remaining execution

Actual0.1.36 confirmed the4V faders contained, but2V retained only72px of waveform height. The final0.1.37 uses the existing vertical wave-size scale (136/176/216px) for2V too. Package and inspect that immutable source. Verify actual2/4deck Horizontal/Vertical Compact, core controls and library previews; retain screenshots. Use different real songs for a current native Sync check and distinguish displayed grid agreement from human listening. Reuse the225-file corpus evidence; do not rerun unchanged analysis simply to produce another green count.

CORE-FIX-07 and ANA-001 stay open for scoped current evidence. BPM ambiguities, unsupported grids, intermittent pop/lag and physical headphone/controller routing remain separate. No claim of complete vendor parity.

Principles applied: position on a common scale; Gestalt continuity/figure-ground; cognitive-load reduction; redundant text/thickness rather than frequency-color-only timing cues. Skills: use, debug, design, dec (data-visualization, color-and-elevation, accessibility, cognitive-load, Gestalt, quality-testing). The generic frontend-testing skill was inspected and discarded because its Dify/Vitest conventions do not apply to this plain-JavaScript project.
