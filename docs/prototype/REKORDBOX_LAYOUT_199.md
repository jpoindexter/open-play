# rekordbox-style HTML view199 — flat visual correction

19 October2026. Jason requested a separate rekordbox version, then rejected the first raised/beveled treatment: “rekordbox is flat like Serato.” This final revision removes the simulated hardware bevels, panel/button shadows and layered jog rings. Solid black/gray surfaces, thin dividers, flat dials/fader caps, restrained blue active states and single-outline circular scratch platters are the current review candidate. **User visual acceptance is still pending.**

## Open and compare

http://127.0.0.1:8848/prototype/layout-preview.html

Default is **rekordbox style**, Full, Horizontal. Hybrid, Serato style and Traktor style remain available. Hybrid keeps its own Vertical/Compact preference. Choose Waveforms Vertical for adjacent A/B above the mixer; Full/Compact controls optional pad banks. Loops/beat jumps, transport/Sync/CUE, tempo, key/shift/sync/reset, quantize/key lock/slip, track gain/utilities and mixer controls stay directly accessible. No Deck tools accordion remains. More panels retains the previous global secondary-panel menu.

## Reference basis and limits

Installed rekordbox found at `/Applications/rekordbox 7/rekordbox.app`, Info.plist version7.2.19.0342. Its Export/2 PLAYER UI was inspected. Automated mode selection did not establish its Performance screen. The official rekordbox7 manual's printed page122 Performance diagram was rendered and visually inspected; its horizontal/vertical/Browse choices and track information are documented on pages123–126/172. This manual covers7.0+, not a verified exact screenshot of installed7.2.19.

Research and source links: [DJ_LAYOUT_REFERENCES_199.md](../research/DJ_LAYOUT_REFERENCES_199.md). No proprietary screenshots/assets ship in the HTML. The paired vertical-over-mixer and Full/Compact interpretations are our adaptations. This is not a 1:1 visual or feature-parity claim.

## Executed evidence

At1440×1000, two saved real MP3s loaded through the existing library. Final Full/Horizontal and Compact/Vertical were visually inspected. **82 selected deck/mixer buttons, inputs and selects had visible boxes in each state; zero hidden in that selected set; zero deck accordions.** This excludes optional pad/mode controls and does not establish every mode or overlay. Actual keyboard Pads open/close revealed the original five performance modes.

Full/Horizontal: waves132px, mixer196px wide, deck/mixer bottom643px, library begins647px. Compact/Vertical: paired waves240×128px, mixer240×204px, decks308px high, library begins466px. The vertical mixer uses available width to shorten its bank and avoid the earlier large empty band.

Before the final cosmetic-only pass, actual direct track gain arrows changed0.9→1.0→0.9dB; loop sizing4→2→4; level-range input and visible cap followed0.8→0→1→0.8. Muted real-track playback advanced deck1 while deck2 stayed at1s, including Hybrid/rekordbox switching65.4→65.8→66.2s; then paused. Final cosmetic changes were followed by real-track loading, visibility/geometry, keyboard Pads and screenshots, not a repeated DSP matrix. No audible mix/controller/headphone acceptance is inferred.

Final browser has both real tracks paused3s, levels0.8, Master−12dB, Sync off, key honestly Unknown. Private screenshots/audit: `local-evidence/rekordbox-layout-199/flat-horizontal.png`, `flat-compact-vertical.png`, `layout-audit.json`. Structured result: [REKORDBOX_LAYOUT_199.json](REKORDBOX_LAYOUT_199.json).

## Preservation and next action

Only the four separate preview files and project records changed. Production player/engine/MIDI/renderer source unchanged. Native0.1.27 ASAR SHA256 remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`; no build/package/launcher/profile/mapping change.

Review the flat HTML direction with Jason before integrating or rebuilding. Core DJ experience remains the only implementation focus. Keep exact installed Performance comparison, four-deck/responsive/all-state controls, original Extended/Stack/Library parity, key accuracy and musical/hardware acceptance open. Preserve historical observer issue; no clean-console claim. Do not turn this layout request into a stems/FX feature sprint.

Skills applied: design (composition, grid/spacing), dec (Gestalt proximity and common region), components-and-states, vd-done-is-executed.
