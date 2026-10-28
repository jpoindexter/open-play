![Audio routing dialog showing output device, stereo layout and master and headphone channel pairs](/assets/screenshots/audio-routing.jpg "Audio devices and routing with System default / Stereo master only. Separate physical headphone outputs remain unverified.")

## Follow the channel labels

Each mixer strip belongs to its labelled deck. Keep track of that label in four-deck mode; a visually nearby control can belong to another channel. Showing/hiding the mixer changes the view, not the audio state.

| Control | Purpose |
|---|---|
| TRIM / GAIN | Adjusts that channel’s input level before mixing. |
| HIGH / MID / LOW | Shapes treble, midrange and bass on that channel. |
| FILTER | Sweeps low-pass/high-pass filtering around a neutral centre. |
| Channel level fader | Changes how much of that deck reaches the mix. |
| Crossfader assignment | Routes a channel to the crossfader’s A side, B side or through. |
| Crossfader | Blends assigned channels; centring it allows both sides. |
| Master level | Sets overall master output. Start low. |

For EQ/filter in rekordbox and Traktor-flat views, double-click the knob to return to neutral. Universal double-click reset for every control is not established; check its tooltip/value.

## Balance a transition

Start with neutral EQ and FILTER. Set comfortable channel levels, then bring the incoming song into the mix. A fully lowered channel fader or an opposing crossfader can silence a deck while its timer keeps advancing.

Use EQ to control overlapping bass and tonal balance. Reset one band at a time when comparing. Laptop speakers can make bass changes difficult to judge; do not overcorrect gain to compensate for their response.

## Headphone CUE

Mixer **headphone CUE** selects a deck for the separate monitor bus. It is different from the deck’s **temporary CUE**, which sets and auditions a transport position.

Headphone cue is taken before the channel-level fader and crossfader. The bottom-bar **MIX** knob blends cue/master monitoring; **LEVEL** controls monitor volume. Computer stereo alone does not create a separate headphone signal.

## Configure a separate output

1. Open **Audio devices and routing**.
2. Refresh outputs if needed, choose the device and select **Use selected output**.
3. For hardware exposing at least four channels, choose **Four channels · master + cue**.
4. Set distinct **Master channels** and **Headphone channels**, then **Apply channels**.
5. Test quietly before a performance. Physical sockets, controller mappings and hot-plug behavior need device-specific verification.

Selecting a different output returns the layout to stereo master; reapply channel pairs afterward. Stereo master mode does not deliberately fold the separate cue bus into speakers. Full physical Hercules/headphone/master acceptance is pending; these settings alone are not compatibility proof.
