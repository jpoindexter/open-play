![Deck A and B transport, tempo faders, channel EQ and bottom crossfader](/assets/screenshots/workspace-two-decks.jpg "Two-deck Compact view. Locate each deck’s Play, CUE and TEMPO controls, then the mixer and crossfader between them.")

## Prepare two songs

1. Open your supplied private build and lower the computer output volume.
2. Choose **2 decks**. For a familiar starting point, use **Settings → Layouts → rekordbox style**, Horizontal waveforms and Compact decks.
3. Click **Import**, choose two local songs and retain your original files separately.
4. Open **Files** and check storage. If a track is **session-only**, use **Retry local audio storage**. Do not assume a session-only import will survive quitting.
5. Select a library row and click the left deck’s **Load**. Select the other song and load the right deck. Wait for audio preparation.
6. The library **Preview** column is a full-song waveform. [Previews have their own preparation and retry states](/library/#waveform-previews).

## Make a manual transition

1. Turn Sync **OFF** on both decks. Smart Sync may require a second OFF to leave relative tempo. Explicitly reset each TEMPO fader to **0%**.
2. Route the left channel to crossfader **A**, the right to **B**. Centre EQ and FILTER, raise the channel levels sensibly, and keep master output low.
3. Move the crossfader left and start the left deck. Its timer should advance and you should hear it.
4. Start the right deck. Adjust its TEMPO toward the left BPM; the outgoing left song should retain its speed.
5. Click the right track title to leave the tempo input. Briefly hold **G** to slow the right song or **H** to speed it up. Release to return to its selected tempo.
6. Listen to the beats, then move the crossfader left → right → centre. Matching displayed BPM alone is not a successful beatmatch.

Laptop speakers let you hear both songs through the master. Auditioning the incoming song privately needs a [separate headphone output](/mixer/#headphone-cue).

## Try Sync

Keep the outgoing deck as **MASTER** and press Sync on the incoming deck. [Simple and Smart Sync differ](/sync/): paused Simple Sync matches tempo; Smart Sync can arm an aligned launch using a valid beatgrid.

The white **NOW** line marks playback. Long numbered marks are bars, short marks are beats. Different bar numbers can be normal. If it sounds off, use your ears and inspect the grid instead of repeatedly pressing Sync.

## Finish the session

- Pause all decks, including hidden C/D decks, and stop any Sampler slots. Check stopped timers and a silent master meter.
- If you recorded, **Stop recording → Download capture** before quitting.
- Export a [metadata backup](/backup/) and retain the original songs. A metadata backup contains no music or recordings.

For play/pause, jog and Cue keys, see [Keyboard shortcuts](/keyboard/). For pops or stalls, preserve one actual failure and follow [Troubleshooting](/troubleshooting/).
