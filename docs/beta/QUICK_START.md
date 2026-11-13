# Your first mix in Open Play

This guide covers the private Mac candidate; no public installer is approved. Use the supplied build and check its window-title version. Read the [current limitations](KNOWN_ISSUES.md).

## Prepare two songs

1. Lower your output volume. Choose **2 decks**. Open **Layout and display settings** or **Settings → Layouts** for layout, Compact/Full decks and waveform orientation.
2. Click **Import**, choose two local songs and keep the originals backed up.
3. Open **Files**. For **session-only** tracks, click **Retry local audio storage** before quitting. If saving fails, keep the original and note the warning; the imported copy may not survive restart.
4. Select a row and click the left deck’s **Load**; load the other song on the right. Wait for preparation.
5. The library’s **Preview** column shows the full song. In supported layouts, toggle **Columns → Preview waveform**. Wait for **Preparing waveform…**; use the retry button if it reports **Preview unavailable**.

## Make a manual transition

1. Disengage Sync on both decks with **OFF**. Smart Sync’s first OFF can retain relative tempo; the second restores controller pitch. Reset both **TEMPO** faders to 0%.
2. Assign the left channel to crossfader **A**, right to **B**. Move it left. Start with neutral EQ, centred FILTER and a low master level.
3. Press the left deck’s green **Play**. Check that its timer advances and music is audible.
4. Start the right deck and adjust its TEMPO toward the left BPM. Equal displayed BPM does not guarantee aligned beats.
5. Click a non-input area of the right deck, then briefly hold **G** to slow it or **H** to speed it up. Release to return to its set tempo.
6. Listen through a left → right → centre crossfade. LOW, MID, HIGH and FILTER affect their own channel. In rekordbox/Traktor-flat views, double-click those EQ/filter knobs to reset them.

## Use Sync deliberately

Keep the outgoing song as **MASTER** and press **Sync** on the incoming deck. The selected mode matters:

- **Simple Sync:** paused decks match tempo only. With both playing, Sync attempts beat/transient alignment; jog may still be needed.
- **Smart Sync:** requires a beatgrid and can arm a paused deck’s aligned launch. Inaccurate grids can still produce a musical offset.

The white **NOW** line marks playback. Short ticks are beats; long numbered ticks are bars. Different bar numbers can be normal. Listen as well as watching.

Preserve an actual pop, click or stall once; avoid repeated clean Sync attempts. See [reporting](KNOWN_ISSUES.md#report-a-problem).

## Temporary Cue and headphone CUE

While paused, press deck **CUE** to set the current position. Hold to audition; release to return paused. Hold CUE and press Play to continue after release.

Mixer **headphone CUE** selects a monitor channel, separately from deck Cue. Computer stereo provides no independent headphone output. Physical routing/controller acceptance is [pending](KNOWN_ISSUES.md#devices-and-advanced-modes).

## Save your work and stop

- Open **Performance panels (…) → Library tools → Export prototype backup**. This saves crate/settings/track metadata, including cues/grids. It contains **no audio or recordings** and is not a complete session snapshot.
- Before **Restore backup**, pause all decks/samples and export the current metadata. Restore updates matching entries; import unmatched audio separately. A session-only result will not survive restart.
- In **Recording**, select **Master mix**, then **Start recording**. **Stop recording** and **Download capture** before quitting. Mic/Aux choices are simulated; actual capture is the master mix.
- Pause all decks, including hidden C/D decks, and stop Sampler playback. Confirm stopped timers and a silent master meter. A lowered fader does not stop playback.

## Essential keyboard controls

These current Help bindings are ignored in inputs or open dialogs. If **Playback Keys Use Shift** is enabled, hold Shift or use Caps Lock for playback keys.

| Action | Left deck | Right deck |
|---|---|---|
| Load the selected track | Shift + ← | Shift + → |
| Play / pause | W | S |
| Temporary Cue | I | K |
| Hold jog slower / faster | T / Y | G / H |

**Command + F** focuses search. See **Help** for other implemented bindings; full shortcut parity remains unfinished.
