# Hybrid layout refinement197 — HTML review only

19 October2026. Jason likes Hybrid, requests vertical waveforms and real compact modes, then corrects the composition: A/B must be adjacent above the mixer. This revision supersedes the initial separated vertical-wave experiment. No desktop rebuild or production entry-point integration is authorized by this layout request.

## Constraint ledger

- Outcome: refine the existing Hybrid decks, source waveforms and mixer for visual review.
- Target: prototype/layout-preview.html → workspace-preview.html, layout-preview.js and layout-preview.css only.
- Must: preserve the existing player, controls, real imports, mappings and all three workspace choices; make compact controls discoverable; keep key and transport visible.
- Must not: rebuild native, replace the audio engine, fabricate track keys, treat visual work as full product parity, or drift into advanced DSP work.
- Authority: Jason's current HTML-only request and subsequent adjacent-waveform/key correction.
- Done evidence: actual browser composition and control checks below. User visual approval and core musical/hardware acceptance remain open.

## Visible changes

Hybrid defaults to paired vertical A/B waveforms directly above the central mixer. One genuine vertical source canvas renders both columns with a common center needle, beat grids and cue marks; its original focusable Y-axis scrub surfaces stay with it. Horizontal returns the shared stacked comparison lanes. This is the existing renderer, not a rotated bitmap or second audio engine.

Visible controls: Horizontal/Vertical; Expanded/Compact decks; Small/Medium/Large waveform size; Library focus; Crates sidebar; Reset layout. Per-deck disclosure opens cues/loops independently. Compact reduces optional panels and chrome while retaining track title, time, BPM/pitch, key controls, overview, tempo, Play/Cue/Sync and mixer. Reset restores paired vertical, expanded, medium, crates visible.

The deck key has a labeled row with the existing semitone down/up, Key Sync and reset controls. Known fixture metadata shows Am/Em. The two saved real tracks show Unknown because no recognized confident key is available; their files/metadata were not rewritten to fill the design. Native key analysis accuracy remains a separate open issue.

Deck tools exposes original per-track gain, Reverse, Repeat, Censor and Double controls. Existing Cues/Loops/Stems/Pitch/Slicer tabs are reachable when the performance panel is expanded; no new algorithms were implemented or accepted. Existing crossfader A/Thru/B assignment is visible. Mixer gains/EQ/filter, vertical level faders and CUE retain their actual inputs. Neutral EQ now points to twelve o'clock despite asymmetric cut/boost ranges. Headphones & routing opens the existing Devices dialog, which contains the Cue mix & volume entry. Smart Sync beat status is no longer suppressed when that existing mode supplies it.

## Core feature visibility audit

| Feature | Current presentation | Evidence / limit |
|---|---|---|
| Title, artist, duration | Deck header; full title tooltip | Real saved tracks rendered; metadata remains source-derived |
| BPM, pitch, elapsed/remaining time | Main deck readout and tempo slider | Actual timer continuity during display switches |
| Track key | Explicit key row, also in compact | Known Am/Em fixtures observed; real tracks honestly Unknown |
| Key lock, key shift/sync/reset | Existing key/transport controls | Reachability observed; no new pitch-quality acceptance |
| Detail/overview waveforms | Shared source display plus per-deck overview | Genuine RGB PCM renderer, both orientations; no proprietary rendering claim |
| Waveform size and zoom | Visible controls | Small/medium/large geometry and 4s→2s→4s zoom observed |
| Play/Cue/Sync/OFF, tempo | Kept in compact | Muted real-track Play and state preservation observed; not a musical mix acceptance |
| Cues/loops/performance tabs | Per-deck disclosure | Open/collapsed states observed; optional existing modes restored to navigation |
| Gain/EQ/filter/levels/CUE/crossfader | Central mixer | Real input values preserved; physical/acoustic acceptance not repeated |
| Crossfader assignment | A/Thru/B per channel | Visibility observed; routing algorithm unchanged |
| Auto/manual track gain and secondary controls | Deck tools disclosure | Opening reveals actual controls; Censor retains its real disabled rules |
| Headphone routing/mix/volume | Headphones & routing → Devices | Dialog opened and its Cue mix & volume entry observed; output selection unchanged |
| Library/crates/import/search | Library; Crates toggle; Library focus | Focus and sidebar transitions preserve tracks/playback |

Advanced panels/features outside this core layout audit retain their earlier implementation and evidence limits. This audit is not an all-feature parity pass. No added channel meters or analysis results are faked to make the design look complete.

## Executed checks and limits

Actual IAB at1440×1000, two saved real MP3s, source preview on8848. With deck1 fader0, deck2 paused at15s: final stylesheet path shows deck1 advancing16.430→17.910→19.024 through Horizontal/Compact/Small → Library focus/Crates hidden → Reset/paired Vertical. Exactly two Play buttons and one crossfader; titles, key rows and fader0 preserved. Paused afterward; deck1level restored0.8, filter0, deck1position19.228s/deck2position15s. No acoustic or physical inference from a muted test.

Final paired geometry: A x579,width141; B x720,width141; same y184,height158. A's right edge equals B's left edge; mixer x578,y349 sits underneath. Body/scroll widths both1440. Large pair height230 observed. Final compact horizontal main cards281px vs492px expanded vertical composition; library422px vs305px at the checked desktop viewport. These compare two display presets, not isolated density-only measurements. Known-key fixtures and Serato→Traktor→Hybrid switching observed. Per-deck disclosure, Deck tools and Devices access observed. Earlier independent disclosure/playback checks remain in the private evidence folder.

A final cosmetic library-focus width alignment was changed from232 to284px after the live focus check; that exact focus width has not been re-observed. The final paired/compact screenshots reflect the rest of the current stylesheet. Existing IAB observer-console error from196 remains unresolved; no clean-console claim. One long UI sequence timed out, was inspected and resumed from actual state; interrupted actions are not counted as a completed test. Four-deck/responsive/touch/all-state reference parity, pointer drag in this new composition, native behavior and hardware/musical acceptance remain unverified. No full regression/DSP matrix repeated.

Private evidence: local-evidence/hybrid-layout-197/final-live-layout-checks.json; live-layout-checks.json (earlier separated experiment, superseded); hybrid-vertical-paired.png; hybrid-compact.png. Raw audio is not committed.

## Reference and skill use

Observed installed Traktor Pro3 3.11.1 17 Mixer layout and its menu: Essential, Extended, Browser, Mixer, Parallel, Preparation. Read-only inspection; menu dismissed. Serato documents frequency RGB, pitch-scaled detail and its Extended-view small/large waveform toggle: https://support.serato.com/hc/en-us/articles/224969307-Main-Waveform-Display . Our visible sizing controls are an independent design choice, not a claim to copy every reference gesture.

find-skills was explicitly invoked: read its installed SKILL.md and checked https://skills.sh/ leaderboard. Existing local skills cover the needed layout work; no new global skill installation. Applied design dispatcher routes: layout-and-composition, grid-and-spacing, color-and-elevation; plus components-and-states, dense-no-scroll-layout, design-system-extraction and dec (accessibility, cognitive load, CSS architecture, Gestalt). Proximity/common region place A/B together; common scales align controls; progressive disclosure reduces density without deleting controls. Existing reference palette/type are preserved. Frontier model recommendations on UI-001 remain unchanged; this revision does not authorize launching another agent.

## Preservation and handoff

Production index.html/app.js/engine.js/MIDI/waveform/DSP/theme files unchanged. Native0.1.27 ASAR remains a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb. No package/version/launcher/profile/mapping edits. Browser preview uses the existing engine exactly once.

Claude: inspect this HTML revision and these evidence limits first. Review core feature discoverability, matched A/B time coordinates, key known/unknown states and compact disclosure; inspect existing mappings/runtime only when needed. Do not rebuild or integrate into native until Jason approves this refined layout. Do not mistake older separated-wave screenshots for the current paired design. Keep core DJ acceptance open; do not restart an all-feature implementation sprint. The full original PROJECT_PROMPT.md remains the byte-exact suffix of the completeness handoff.
