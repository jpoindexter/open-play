## Three waveform scales

| Display | Scope | Use |
|---|---|---|
| Detailed waveform | A zoomed window around playback | Compare beats and upcoming musical events. |
| Deck overview | The full loaded song | Find sections and seek in a track. |
| Library Preview column | The full song in a library row | Browse track structure before loading. |

The detailed view can be horizontal or vertical. Change orientation in **Settings → Layouts**. Header **− / +** zoom changes the detailed time window; **Wave size** changes available display space.

## Read color and the NOW line

The RGB spectral view uses red for low-frequency bass, green for mids and blue for high-frequency treble. Mixed content blends those colors, so purple, cyan and brighter combinations are expected. Color describes frequency content, not genre or deck ownership.

The white **NOW** line is the playback reference. Compare the two songs’ beat positions against this shared reference instead of comparing unrelated waveform peaks farther apart.

Short grid ticks mark beats. Longer numbered lines mark bars. The number belongs to that track’s grid. Two songs can be beat-aligned while one shows bar 42 and the other bar 29.

## Edit a beatgrid

1. Load the song and open its **Edit grid** control.
2. Enter a positive **BPM** and the first downbeat’s **Downbeat offset (seconds)**.
3. For a tempo change, enter **Marker source time** and **Tempo after marker**, then choose **Set warp marker**.
4. Inspect the staged marker list. Markers must be increasing, after the downbeat, within the track and have valid positive BPM values.
5. Use **Save grid** to apply. Close the editor to cancel a draft. A locked grid must be unlocked before editing.

**½ BPM / ×2 BPM** fixes half/double-tempo interpretations. **Use playhead** copies the current source position into the marker-time field; it does not automatically prove that position is a downbeat.

## Check whole-track drift

**Check whole-track drift** estimates timing beyond the initial analysis section. **Stage correction** replaces the dialog draft, not the saved grid. Review the result and choose **Save grid** to apply.

Pulse estimates can differ from musical kicks. Check the beginning, middle and affected late section by ear. A warp marker changes tempo from its source position while the grid’s accumulated beat coordinate stays continuous.

Do not clear BPM on a track with warp markers. Current validation rejects an invalid clear without saving; older private builds can enter recovery after saving that state.

## Seek and scrub

Use the overview to move through a song. Detailed waveform dragging scrubs in supported views; Shift-drag is fine adjustment and Escape cancels the gesture. Focused overview controls support arrows and Home/End. Seeking while audible can create a deliberate abrupt transition.
