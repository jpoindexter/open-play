# Four-deck keyed-loop transitions — 28 October 2026

One targeted check exercised the new CORE-FIX-37 loop-window path while three other real tracks played. Source7358416has the same affected product bytes as current private0.1.84/sourcea69166e. No product edit, new desktop build, unit-suite rerun, broad soak or clean listening replay was needed.

The isolated browser imported four pinned real songs: DJ W!LD “Call Me Later”, Fort Romeau “No Limits”, Fort Romeau “Breathe Trip Mix”, and Mike Shannon “Only Noodles” (448.006/432.054/456.760/395.111seconds, analyzed123/125/127/128BPM). Aliases kept the test separate from the normal library. Physical output was muted before import and asserted muted through preparation, operation and cleanup; all four original hashes and mtimes match afterward. The normal native app/profile was not addressed by this fixture; its84ASAR is unchanged and process remains present.

## Executed interface path

Start B/C/D, focus B's level fader, then Play A with Key LockON/key shift-12 and a1.951219512s loop at zero. Halve it to0.975609756s, double back to1.951219512s, disengage Loop, then press Sync on A. A returns to the actual continuous live-keylock backend before Sync; its rate becomes125/123=1.0162601626. The other three playing voice identities and rates stay unchanged. This does not establish audible or bar-phase alignment.

All241 tracked deck/mixer controls, shared waveform, library rows and materialized preview nodes remain connected; focus stays on B's fader. Four Play controls and three materialized library previews remain. This proves retention of the observed nodes, not every offscreen thumbnail's readiness or every modal/control. The pass ends with four decks running, then pauses every deck and confirms no playing, processing or queued restart.

The loop-half preparation took294.2ms and loop-double44.4ms; no response-time budget is claimed. During this short window,508 actual app tick callbacks have1.5ms p95 /8.6ms maximum execution time;507 frame intervals have17.6ms p95 /34.2ms maximum. No Long Tasks were observed, and the iframe document reported visible. This is a bounded browser observation, not long-session, native moving-waveform or device performance acceptance.

## Whole retained capture and limits

The complete six-second first-master-channel capture contains288,000 float samples at 48 kHz (1,152,000bytes), all finite, RMS0.1919910659 and peak0.9945383668. Independent inspection of every retained sample matches the page summary. The other master channel is unmeasured. Dense mixed-music PCM/peak/finiteness does not prove no audible pops, a seamless keyed loop, correct pitch, musical alignment or stereo quality. No listening occurred.

[CORE-FIX-37](https://trello.com/c/odHQdxS6) and DEK-007 remain open for owner/native-playing keyed-loop entry/seam/exit acceptance, with existing held/MIDI/headphone/master gates on CORE-LIVE-01. Intermittent Sync pops and broader waveform stalls remain open. Accepted0.1.53ordinary manual beatmatch/jog/EQ/Cue/clean-stop evidence retains its original scope; no repeat matrix.

Owned Stop/close/clear returned “Stopped; frame closed; owned origin cleared.” The diagnostic tab/server, staged media and temporary source files were removed after hash checks. No new app version or Downloads file. Private raw fixture, input pins, complete first-channel PCM, report and screenshot remain under local-evidence/four-deck-loop-transitions-2026-10-28 (approximately1.2MB raw PCM). [Compact receipt](four-deck-loop-transitions-2026-10-28.json).
