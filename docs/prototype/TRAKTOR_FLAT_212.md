# HTML212 — Traktor structure, flat Serato/rekordbox styling

20 October2026. User approved the Traktor layout with a flat visual treatment, keeping existing functionality and library waveform previews. HTML-only iteration; the native app remains0.1.27. Default review option is **Traktor flat / Horizontal / Compact**. Existing Serato, Traktor, Original hybrid, Serato hybrid211 and rekordbox choices remain available.

## Reference and composition

Observed in the user's installed Traktor screenshot11:39: two deck-local detailed waveforms with adjacent pitch rails, continuous center mixer, transport and loops along deck bottoms, headphone/crossfader strip and dense browser below. The screenshot establishes arrangement in that state, not hidden interactions or exact values. The new flat charcoal surfaces, blue active states, modest rotary rings and four-pixel spacing are authored choices using the existing Open Play/rekordbox presentation system. No vendor assets or identity copied. This is a layout adaptation, not complete Traktor product parity.

Horizontal detailed views crop the **existing** RGB renderer into each deck. The original focusable waveform scrub lanes move with the image; pointer/keyboard handlers and one audio engine remain authoritative. This adds no competing track analysis or transport. Vertical comparison remains selectable above the mixer. A shared `data-preview-shell=flat` hook reuses common mixer/knob/library styling, while the new preview-root scope isolates Traktor geometry from legacy rekordbox overrides.

## Preserved controls and small features

Compact shows eight cue pads per deck, Play/CUE/INT modes, Sync/off, BPM/pitch/time/remaining/key display and key shift/sync/reset, vertical tempo/range, slip/quantize/key lock, loop size/half/double/In/Out, beat jumps/roll/grid/save, gain/auto-gain state, load/eject and reverse/repeat/censor/double. Disabled controls still follow the original engine/track state. Key lock is spelled out. The flat BPM surface retains original scratch interactions. Full and performance-mode selection remain; advanced modes get more space and retain their original fields, rather than being removed.

The central mixer keeps per-channel trim, three-band EQ, filter, headphone CUE and long channel faders. Bottom headphone MIX/LEVEL rotaries, centered crossfader and assignments remain; master output and track gains stay rotary. Gain, EQ and filters retain vertical dragging, fine movement/reset and native range keyboard support. MIDI/Devices/Setup, REC/FX and More panels remain accessible. Existing controller mappings/audio source are unchanged.

Library retains decoded-source row waveform thumbnails for demo and local MP3s, RGB frequency treatment, search/sort/selection, preview-column visibility preference, crates toggle and import access when the sidebar is hidden. This remains an image preview column; no new thumbnail audition/seek claim.

Two-deck Compact height340px accommodates the larger local waveform. Four-deck Compact uses268px decks with all core controls retained; at the1440CSSpx review width the library remains directly below. Explicit Library Focus reduces the deck area; Pads restores a hidden bank. Compact itself never hides the banks. Mixer hide/show reclaims the horizontal column; Vertical keeps the comparison waveform available. Full/advanced/FX panels can require scrolling.

## Executed checks

- Eight2/4 × Horizontal/Vertical × Compact/Full cases: selected72/144 core nodes contained, eight cue nodes per deck, no selected knob hit-area overlaps or mixer/fader escapes. Four-deck Compact268px in both orientations. Existing five workspace choices opened and their transports remained present.
- Compact horizontal and vertical Loop pages, Library Focus, mixer hide/show and open FX panel clear of deck/mixer/monitor region. Pitch selection changes to Full and the existing Pitch range field remains visible. This is UI access testing, not testing the pitch algorithm.
- Library search for Glass Transit retained its matching thumbnail and loaded it into deck2. Ten row images loaded after sorting, including two existing local MP3s. Preview-column hide/show and disk Import with crates hidden executed and restored.
- Actual deck2 Play timer advanced00:00.4→00:21.2, then paused and sought to Home. Dragging deck1's projected detailed waveform moved its timer00:00.0→00:00.6; Home restored start. Tempo0→+0.1% showed126.1BPM, then returned0/126.0. Filter drag0→0.2 then double-click→0; value and ring agreed. Both decks paused at the end; master−12dB and original track-gain values retained.
- Wave sizing retained: Full horizontal Small56px / Large160px, Compact Vertical Large128px; core bounds clear. Final268px four-deck Vertical Loops and FX paths rechecked after density correction.
- JavaScript syntax checks and Git whitespace checks passed. Native0.1.27 ASAR SHA256 unchanged: `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

Initial rendered checks caught two-pixel footer clipping, inherited four-deck Vertical Compact rules, narrow library-focus tracks and insufficient advanced-page space; these were corrected before final geometry receipts. Evidence is `TRAKTOR_FLAT_212.json`, with raw data/screenshots in private `local-evidence/traktor-flat-212/`.

## Limits and next gate

User visual approval remains open. These checks establish selected visible UI/control paths at the review dimensions, not acoustic quality, physical controller behavior, all advanced algorithms, broad responsive/accessibility conformance or full product parity. Do not equate source-node preservation with end-to-end acceptance of every existing feature. Keep core DJ priority and do not integrate/rebuild the native app before explicit approval.

Trello: [UI-HY-01](https://trello.com/c/FkrLm4fa), parent UI-001 linked. Build plan and Claude handoffs updated; original project prompt suffix preserved. Recommendations: Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium, verify actual availability before invoking. Claude should compare native screenshot arrangement, inspect core Compact access and source-node preservation, and report gaps without native rebuild.
