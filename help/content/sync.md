## Match tempo and phase

Beatmatching has two parts: **tempo** is how fast beats repeat; **phase** is where those beats land relative to the other song. Equal BPM can still sound like doubled or flamming kicks.

For manual matching, turn Sync OFF, adjust the incoming TEMPO and use brief jog nudges. If an offset stays constant, try phase correction. If it grows, inspect tempo and the beatgrid. Listen to a sustained section rather than judging from one transient.

## Keep the outgoing song as master

The song already playing is the reference for an incoming transition. Confirm the outgoing deck’s **MASTER** indicator, then press Sync on the **incoming** deck. The incoming song should match the outgoing song’s tempo; starting a second song must not be treated as permission to slow the outgoing master.

Explicit MASTER selection lets you choose the reference. If the reference looks wrong, pause the incoming song and check MASTER and Sync mode before trying again.

## Simple Sync

- A paused incoming deck matches tempo. It is not an armed beat-aligned launch.
- With both tracks playing, Sync attempts beat/transient alignment.
- A small manual jog correction can still be needed. Equal displayed numbers do not establish musical alignment.

## Smart Sync

Smart Sync uses the track’s beatgrid and can arm a paused incoming deck for aligned launch. Forward playback can follow tempo changes defined by Beat Warp Markers.

An inaccurate grid produces inaccurate musical alignment even when grid clocks agree. Correct the downbeat and tempo map in [Edit grid](/waveforms/#edit-a-beatgrid); do not compensate for a bad grid by repeatedly syncing.

When leaving Smart Sync, the first **OFF** may retain relative tempo. A second OFF returns to controller pitch. Read the status and explicitly reset pitch before a fresh manual beatmatch.

## Read the visual result

Compare nearby beat marks at the same white NOW line and the audible kicks. Bar numbers identify each song’s own structure; they do not need the same number. Bar-level alignment also does not establish matching phrases or musical keys.

For a constant small offset, nudge the incoming deck. For a growing offset, examine BPM, variable tempo and the grid over the affected section. Grid estimates may fit the beginning better than the end of a song.

## A pop or stall is a separate problem

Intermittent Sync pops and four-deck waveform stalls remain open. Clean later attempts do not erase an earlier failure. Note which deck was clicked, playing states, MASTER, mode, song positions and any concurrent load/analysis; preserve a master capture if available. Follow [Troubleshooting](/troubleshooting/#pops-clicks-or-stalls) instead of repeating clean attempts.
