# rekordbox layout 201 — four decks, visibility, centered crossfader

19 October 2026. **HTML review only; user visual approval pending.** This supersedes revision200's retained Vertical composition and footer filters. No native rebuild or audio/mapping/renderer change.

## Changed behavior

Four-channel mixer is one row ordered C / A / B / D, matching the observed native horizontal3 / 1 / 2 / 4 arrangement. All real filter inputs are inside their own strip below LOW and above CUE/fader. Crossfader is independently centered, with labeled channel assignments either side and headphone Mix/Level access to its left. Mixer visibility works with two/four decks in both orientations, hides its shared footer, reclaims space and preserves parameter state. Decks remain mirrored with original control nodes/handlers.

Explicit four-deck row heights prevent overlapping decks. Full keeps eight cue pads; Compact collapses optional pads and retains transport, tempo, loop and mixer controls. The library remains visible. The existing alternatives and original player are preserved. Native additional cue pages, Master semantics and inline monitor knobs are not claimed.

## Executed checks

Actual browser UI transitions, not an engine-only harness: four-deck Full and Compact in both orientations, mixer Off/On in both orientations with two/four decks, Deck3 filter adjustment and restoration, Deck3 performance mode Loops→Cues. Final affected UI audits contain no clipped selected core controls, duplicate IDs, channel-label escapes or deck intersections. Crossfader input center equals1440px viewport center with zero pixel offset in shown states. Four-deck library heights at1440×1000:210px Horizontal Full,254px Horizontal Compact,313px Vertical Full,357px Vertical Compact. Explicit mixer hiding removes only its18/34 selected controls. Counts exclude optional pad buttons and original mode tabs; they are not a claim of every app feature working.

Read `REKORDBOX_LAYOUT_201.json` for state receipts. Private screenshots/full geometry live in `local-evidence/rekordbox-layout-200/`. Two real local MP3s are loaded afterward into A/B, paused; C/D empty. No acoustic, controller, native-package or whole-product parity claim. Existing source and native0.1.27 remain unchanged.

## Tracked missing work

Read [research/inventory and all six Trello links](../research/REKORDBOX_NATIVE_LAYOUT_201.md). Per-track library waveform previews are still unimplemented; REA full extraction is blocked by a retained Hopper document shutdown error. Do not mark either as complete. Continue from each separate card's acceptance criteria, keeping native integration behind user approval.
