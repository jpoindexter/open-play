# HTML209 — Compact decks and mixer from the REA reference

20 October 2026. Applies the installed rekordbox interface captured through REA208 to the existing HTML preview. No native build or integration. Original player/audio engine, waveform renderer, mappings, imported music and vendor app remain untouched.

## Layout changes

- Four-deck Compact rows are **208px**, down from HTML207's 224px at the normal 1440 CSS-pixel canvas. Two-deck Horizontal measures 212px; Two-deck Vertical 224px, down from 240px. These are measured browser results, not just declared token values.
- Center column follows the reference's approximately 16.8% width, bounded to 240–280px; at the tested width it is approximately **242px**, previously 280px. Original deck controls gain the released width.
- Four-deck Vertical uses A/B/C/D channel order under the shared vertical waveforms. Horizontal retains the observed C/A/B/D order. CSS presentation does not alter channel indices, mixer assignment values or MIDI mapping.
- Each channel keeps aligned TRIM/HIGH/MID/LOW, headphone CUE and fader. Compact rotary rows are 32px with 18px rings, 10px label line height and measured 4px ring-to-label clearance. Hit areas remain separate. Two-channel mode retains the mirrored trim/CUE/fader and EQ composition. Horizontal four-deck faders use their available height rather than floating inside a centered group.
- Decks retain the actual eight A–H cue controls, narrow 64px loop block, stacked mode/CUE/Play, 80px jog and mirrored Slip/Q/MT. Utilities and footer use 20px rows and 2px structural gaps. Load, eject, tempo, range, key controls, gain, beat jump, roll, grid and loop Save remain accessible. No decorative cue placeholders or new accordion.
- The shared headphone/crossfader bar is 44px in Compact. Crossfader remains centered in the full workspace, with MIX/LEVEL and assignments alongside it. Mixer-off reclaims the center column; channels retain their values.

The captured native layout has fewer Open Play utility controls. Its proportions are adapted around those existing controls rather than claiming recovered native layout constants. These are dense desktop controls; no touch-target/accessibility conformance claim.

## Loop mode and density

Hot Cue and Loops now both work in Compact. Selecting Loops grows the shared row to 240px to make room for Saved loops / Auto Loop / Loop Roll and range controls. Full → Compact preserves Loops, correcting the previously unexecuted207 state branch. Returning to Cues restores the short rows. Selecting another performance mode retains the existing Full behavior; requesting Compact while one is selected keeps Full and preserves that mode. The density control's title explains this boundary. No mode is silently reset to Cues or remapped to another controller pad mode merely to fit the layout.

## Executed verification

At the normal 1440 CSS-pixel canvas, rendered 2/4 decks × Horizontal/Vertical Compact. Selected 72/144 core nodes were visible and within their deck/mixer bounds; rotary hit areas did not overlap; crossfader center offset was0px; two monitor knobs and ten library waveform previews remained present. Two-deck test caught inherited mixer padding causing fader input overflow; corrected it and reran the affected path. Full four-deck core bounds also checked after the density transition change.

Original EQ input keyboard0→0.3→0, channel fader0.8→0.79→0.8, headphone CUE off→on→off, loop length4→2→4 executed and restored. Mixer hide/show reclaimed the middle column and retained208px rows. Saved and Auto Loop navigation exposed the existing bound controls, all inspected within the deck; Full→Compact retained Loops. Four-deck Small/Large waveform paths checked without core clipping; Large grows rows to248px. Pitch mode selected Full, and subsequent Compact request retained Full/Pitch; then restored Cues/Compact. All decks left paused. These are browser interaction/layout checks, not fresh acoustic or controller acceptance.

Evidence: `local-evidence/compact-rekordbox-209/verification.json`, `four-vertical.png`, `two-vertical.png`. Compact public receipt: `REKORDBOX_COMPACT_209.json`. Current four-deck Vertical Compact remains open at `http://127.0.0.1:8848/prototype/layout-preview.html`.

## Tracking and next boundary

[UI-RB-06](https://trello.com/c/miElcJk0) and [UI-RB-04](https://trello.com/c/Rx4NWhjG) track this correction, linked to the REA208 extraction. Build plan and Claude handoffs updated; original project prompt suffix retained. Existing model recommendations remain Codex gpt-6.1-sol/high and Claude Code Sonnet5/medium for implementation, availability to be checked before invocation. No new agents launched. User visual approval, broad viewport/accessibility coverage and full native/feature parity remain open. Continue only the core DJ priority; HTML-only approval gate remains active.
