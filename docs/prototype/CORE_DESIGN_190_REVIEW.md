# Core design190 — reference extraction and implemented performance screen

Jason explicitly asked to apply Serato's visual system now and reskin later. The implementation changes the existing vanilla interface; transport, audio engine, mapping/profile and input bindings stay in place. This is an implemented reference-derived core screen, not exact visual or functional parity.

## Evidence and confidence

Installed Serato4.0.10.213 current empty practice screenshot plus the retained loaded Vertical screenshot inform this extraction. Source screenshots remain private under local-evidence; their SHA256 identities are in prototype/design-tokens/serato-core.tokens.json. No Serato branding, raster control assets or font binaries are included.

| System | Evidence | Implementation / boundary |
| --- | --- | --- |
| Night neutrals | Sampled black, #111111, #1d1d1d, #222222, #444444; selected #1f4b78 | Primitive → semantic → component aliases; observed values and inferred roles labeled |
| Type | Compact sans text, strong white BPM/time hierarchy | Arial/Helvetica Neue fallback; exact source font/weight unverified |
| Density | 2x Retina capture normalized to logical spacing | 24px buttons, compact headers/pads, 128px platter, dense library; responsive behavior inferred |
| Deck anatomy | Header, pads/loop controls, adjacent transport/platter/pitch, central scrolling waves | Existing bindings retained; short red marker no longer crosses all numeric text |
| States | Loaded/empty/selected/disabled reference | Gray/black surfaces and blue selection; visible keyboard focus retained; unseen source focus/hover inferred |
| Waveforms | Continuous frequency-colored source shapes, grid, fixed playhead | Independent decoded PCM peak/energy implementation; no proprietary algorithm equivalence claim |

77 source tokens export to CSS custom properties and canvas JS through scripts/build_performance_tokens.mjs. This dependency-free exporter matches the existing plain-CSS application. No framework migration or other-platform exporter is claimed. Generated files should not be edited directly.

## Actual waveform change

The previous overview skipped samples and drew separated bars. An actual impulse between its strides was missed. The new asynchronous profile visits every sample, unions peaks and energy across stereo channels, and caches256-frame peak/three-band energy buckets per live AudioBuffer. Original PCM is read only. Rendering fills continuous symmetric source shapes with warm lows, green mids and cool highs; source peaks provide a faint outer boundary. Colors are a broad250/2500Hz filter decomposition with display normalization, not audio processing or Serato's proprietary spectral display.

Overview retains source-position seek, cue/loop overlays and sparse downbeat ticks. The scrolling window uses one shared1–16second zoom for waveform/grid/cues. Canvas backing follows devicePixelRatio while coordinates stay logical pixels. A pending real-file waveform is labeled as preparing instead of drawing fake generated bars. Existing selected-Stems detail receives the shared span only to avoid coordinate misalignment; no Stems feature work was resumed.

## Focused executed checks

- scripts/test_source_waveform.mjs reproduces the old missed transient and checks retention, stereo cancellation avoidance, unrelated/outside intervals, finite output, work yielding and unchanged source arrays. Non-finite input is rejected. Passed.
- Actual browser normal controls with two imported real MP3s: both Play, positive master meter, Sync at115.5BPM, OFF/manual tempo115.7 on deck2 while deck1 stays115.5, then both Pause. No hidden state mutation. This establishes UI behavior, not perceptual musical alignment.
- Actual zoom2s→4s and both source-position sliders to20s; labels and scrolling waveform geometry update. DPR2 observed:508x40→1016x80 overview and222x319→444x638 detail backing. Analyze/search toolbar stays visible after fixing intrinsic grid row overflow.
- Node syntax and git whitespace checks passed. Unchanged analysis/audio matrices were not rerun for CSS.

Private rendered before/after and browser observations: local-evidence/core-design-190/. Source-color pass inspected with the actual songs. Jason's visual acceptance remains open. Native packaging/runtime observations belong to the next version's receipt; browser success does not transfer automatically.

## Next core checkpoint

Package these visuals plus tempo189 in local desktop0.1.24, preserve the shared playback-test profile/mappings and prior0.1.23, then observe the real saved-track workflow in that exact candidate. Continue toward Jason's manual and synced two-track transition, EQ/filter listening and controller/headphone checks. No advanced feature work.
