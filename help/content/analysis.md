## Analyze a track

Select the intended track and use **Analyze**. **Analysis settings** controls available analysis options. Let preparation complete and read warnings before replacing manual edits.

BPM, grid, key and loudness are estimates. An analysis result can be partial or low-confidence. A correct-looking value in the library is not proof that the beatgrid remains accurate through a long song.

## Understand the results

| Field | Meaning |
|---|---|
| BPM | Estimated base tempo, separate from current playback BPM after pitch/Sync. |
| Key | Estimated musical key; unknown remains unknown. |
| Beatgrid | Beat/downbeat positions used for visual timing and grid-based Sync. |
| Gain / loudness | Suggested level adjustment; keep headroom and compare by ear. |
| Warnings / confidence | Limits of the measurement or source, not errors to hide. |

Auto gain is not a substitute for a master meter or a limiter. Two songs can have similar peaks and different perceived loudness.

## Edit track details

Right-click the library track and open **Track Details**. Edit fields such as title, artist, album, BPM, key, rating, comments and color, then Save. These changes are application metadata; do not assume the original file’s embedded tags were rewritten.

On a track with Beat Warp Markers, BPM must remain valid and positive. The current save guard rejects a blank BPM before changing stored metadata. A validation warning should keep the editor open so you can correct it.

## Protect a manual grid

If you have edited a downbeat or tempo markers, inspect locks and analysis options before reanalysis. To address tempo changes later in a song, use [Edit grid and whole-track drift](/waveforms/#check-whole-track-drift), stage a correction and review it before Save.

Wait for a real completion/error status. If analysis overlaps playback, note the affected track and action if a waveform stall or click occurs. Preserve the next actual failure rather than repeatedly running clean analysis passes.
