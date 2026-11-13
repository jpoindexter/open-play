# Private desktop 0.1.73 — prepared, not launched

Source a91d657; ASAR a3da5a354e8f5c8ef19ac1d41b41190b13a907a690203aedda8d983242bf1519. Archive/controlled-host inspection 5/5. Both narrow core repairs are included. No public release.

- Reverse Play at original position zero now starts from the end, mirroring the existing forward-end restart. Actual isolated four-deck GUI changes stopped/no voice to playing/backward clock 47.866s from48s, with210/210controls retained. Three focused engine offset checks pass. [Report](REVERSE_RESTART_2026-10-27.md).
- Ordinary forward natural end updates existing controls instead of rebuilding deck/mixer trees. Same actual isolated GUI changes0/225retained to225/225, with unrelated fader focus/value, four Play controls and library previews retained. Playback stops at48s with no voice and the correct Play label. [Report](NATURAL_END_CONTROLS_2026-10-27.md).

Diagnostics use generated audio, asserted physical mute and stopped/no-queued-Play cleanup. No normal-profile/original-media changes; no broad suite/soak, listening, measured frame-time, Sync-pop cause or native-playing claim. Repeat/Autoplay branch bodies remain unchanged; their runtime cases were not rerun. No new runtime module; diagnostic254lines/regression23lines. Existing oversized app/engine remain MOD-001 debt.

The last observed running/default app remains71/sourcee92e3d6, paused with the existing four real tracks. This pass did not quit it or launch73. Before the owner session, preserve any new recording/work, do the normal recording preflight/closed-profile backup, launch the exact inspected73bundle and verify restored paused tracks/controls/previews. The named73starter is syntax checked only; Current defaults remain71 until native startup is observed.

[One practical owner checklist](../delivery/OWNER_CORE_SESSION_2026-10-27.md) / [CORE-LIVE-01](https://trello.com/c/yJ8r9kCD) holds the remaining native held/playing/controller/headphone/master/listening work. [CORE-FIX-26](https://trello.com/c/nVVTC4og) and [CORE-FIX-27](https://trello.com/c/gV1a1ixD) remain open for their live criteria. Prior53ordinary manual/jog/EQ/Cue/stop acceptance is retained; do not repeat every old test. Intermittent Sync pops/stalls stay open independently.

Latest native preflight:71is visible with the same paused four-track session/2,3,4,5s/controls/previews. Recording AX click had no visible effect; coordinate fallback returned noWindowsAvailable. Recording clearance was not established, so no quit/73launch/main Play/Sync/REC Start was attempted. Preserve the existing session and complete this preflight on return.
