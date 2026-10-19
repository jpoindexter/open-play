> Historical revision200: superseded for Vertical, filters and four-deck/footer composition by revision201. Read docs/prototype/REKORDBOX_LAYOUT_201.md.

# Installed rekordbox layout200 — observed Performance screen

19 October2026. User rejected a color-only approximation and asked to inspect the actual app. Native app: `/Applications/rekordbox 7/rekordbox.app`, version7.2.19.0342 from the earlier installed plist read. CUA accessibility and native screenshots now establish **PERFORMANCE / 2Deck Horizontal**. The user opened this mode after the custom mode dropdown ignored automation and the previously authorized System Events fallback. Regular panel buttons did respond: Mixer Off→On was executed and both states captured. Native Mixer was restored Off afterward, preserving the user's reference state. Deck1 demo remains paused13.5s; no library, account or subscription changes.

## Observed composition

- One full-width detailed waveform area above the two deck information/overview bands.
- Each deck has a flat title/artist/time band, with Key Sync/semitone/current-key controls and Beat Sync toward its inner edge.
- A full-track overview directly below the information band.
- The lower consoles are mirrored: the hot-cue lists sit toward the outside edges; loop controls, CUE/Play, jog and Slip/Quantize/Master Tempo occupy the inner portion.
- Hot-cue slots use two vertical columns showing A–D / E–H in the current viewport. The native app exposes additional cue pages/slots; the HTML preserves its existing eight working cue controls and does not invent more.
- Mixer On inserts a very narrow central pair of channels. Each stacks Trim, High, Mid, Low, CUE, then the channel fader. The fader is below CUE, not alongside the EQ bank.
- Crossfader, assignments and headphone Mix/Level live in a separate strip below both decks. Mixer Off removes this and widens the decks.
- Library/browser begins below that strip; it does not sit underneath an extra large block of per-deck transport rows.

Private original screenshots and AX tree: `local-evidence/rekordbox-layout-200/native-performance-mixer-hidden.png`, `native-performance-mixer-on.png`, `native-performance-mixer-on.ax.txt`. They are reference evidence, not shipped application assets.

## HTML adaptation and remaining differences

The dedicated horizontal adapter moves original player nodes into that hierarchy. It adds the working mode select as a route to original mode buttons; no second transport or audio engine. Mirrored consoles, vertical cue lists, header key/sync, CUE above channel faders, a full-width lower mixer strip and explicit Mixer show/hide follow the observed composition.

This is a closer independent layout, not exact product parity. Original Open Play RGB analysis/rendering remains; the native reference currently uses a different waveform color display. Existing eight cues/five modes and original Sync/OFF behavior are retained; OFF is not mislabeled as rekordbox's Master. Headphone Mix/Level opens the original Setup→Mixer controls rather than adding unbound knob drawings. Actual filter inputs, horizontal tempo sliders and secondary utility rails remain as core-DJ adaptations. No FX, stems, hardware or native feature sprint.

The previous vertical variation is preserved. It is not claimed as a newly matched native Vertical layout. Exact visual acceptance, native feature parity, mode-specific/four-deck/small-window layouts and perceptual mixing remain open. User approval is required before main-app integration/repackaging.
