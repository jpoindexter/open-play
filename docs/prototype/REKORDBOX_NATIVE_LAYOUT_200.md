> Historical revision200: superseded for Vertical, filters and four-deck/footer composition by revision201. Read docs/prototype/REKORDBOX_LAYOUT_201.md.

# rekordbox native-layout revision200 — HTML review

19 October2026. Jason requested actual installed-app inspection and a structural match, not another color pass. **User visual acceptance remains pending. No native rebuild.**

## Reference now observed

Installed rekordbox7.2.19.0342, Performance /2Deck Horizontal. User opened the mode after automated selection failed; CUA then toggled Mixer Off→On, inspected actual channel/footer placement, captured both states and restored Off. This supersedes199's unverified installed-Performance boundary. Read [native observations](../research/REKORDBOX_NATIVE_LAYOUT_200.md); private original screenshots/AX live in `local-evidence/rekordbox-layout-200/`.

## Structural changes

- Header information/key/sync controls and full-track overview form two flat bands per deck.
- Mirrored lower consoles: outward two-column A–D/E–H cue lists; loop block, CUE/Play, jog and options toward the center.
- Bottom mode dropdown invokes the existing working mode buttons. Eight existing cues remain; no extra placeholder slots.
- Mixer narrows to112px at1440. Trim/High/Mid/Low stack above CUE, with channel fader below.
- Crossfader and assignments move into their own44px strip below both decks. Explicit Mixer toggle hides/shows the panel and widens decks, following native behavior.
- Existing filter controls are retained in that strip; the headphone button opens original Setup→Mixer Mix/Level fields. Existing tempo/gain/secondary controls remain in narrow deck rails.
- Default Full Horizontal; Compact hides optional pads while retaining core controls. Keyboard Pads from Compact reopens Full. The earlier paired Vertical composition is retained; it is not claimed as a new native Vertical match.

Open http://127.0.0.1:8848/prototype/layout-preview.html . Serato, Traktor and Hybrid choices remain.

## Executed checks — scoped to layout changes

Original mode selection reaches Loops then Cues. Headphone button opens actual Cue Mix/Cue Volume settings. Moved filter and crossfader inputs respond0→0.01→0; loop size4→2→4. Muted deck1playback advances3.1→30.4→Hybrid30.8→rekordbox31.1s across Compact/Mixer visibility/layout changes; deck2stays3s, then deck1paused31.6s and level0.8 restored. This establishes UI/transport state continuity, not heard audio or musical quality. No repeat DSP/hardware matrix.

Final1440×1000 checks after scoping the new adapter to Horizontal:84selected original core controls in Horizontal Full and Compact; zero hidden or clipped to their deck bounds. Retained Vertical Compact:82selected controls, zero hidden/clipped. The sets include moved buttons/inputs/selects plus original jog controls; optional pads, hidden original mode buttons and the new optional mode selects are excluded from that core count. Dropdown/Pad routing is checked separately. No duplicate IDs; one new mixer footer in Horizontal, the prior contained footer in Vertical.

Horizontal Full: two658×275px decks,112px central mixer,44px lower strip, library begins585px. Compact: decks247px high, library begins557px. Core rails add height versus native; preview selection toolbars also add overhead. Final two saved real MP3s are paused5s, levels0.8, Master−12dB, Sync off, filters/crossfader neutral. Known key remains honestly Unknown.

Structured observations: [REKORDBOX_NATIVE_LAYOUT_200.json](REKORDBOX_NATIVE_LAYOUT_200.json). Screenshot: private `local-evidence/rekordbox-layout-200/full-horizontal.png`.

## Preservation and limits

New `rekordbox-preview.js/.css` are presentation adapters loaded only by the separate HTML workspace preview. Actual original nodes/handlers and the one existing player are reused. Production entry, app.js, engine, MIDI, renderer and native27 unchanged. Native27 ASAR hash remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.

This is a closer layout adaptation, not exact visual/product parity. Inline headphone knobs, native Master semantics, additional cue slots, typography/icons,4decks and every mode/window remain separate gaps. Existing RGB rendering remains rather than copying native screenshot pixels. Horizontal utility/tempo/filter extras retain the core-DJ workflow. User musical/hardware/headphone acceptance remains open. Review this HTML direction before app integration/packaging; stay on core DJ work.

Skills applied: design (composition/spacing), dec (Gestalt alignment/proximity), components-and-states, vd-done-is-executed.
