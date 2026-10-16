# Additions discovered during reference review

2026-10-16. These extend the original 74-feature planning backlog. They are requirements, not implemented or proven parity. Source article IDs resolve in manual-index.json; external guides are linked below. This remains an open inventory until the prototype gate is explicitly recorded as passed.

| Feature ID | Scope to investigate/build | Native stage* | Specialist profile | Observable acceptance criterion |
|---|---|---|---|---|
| LIB-012 | Favorite crates, crate search, colors and sort modes | N2 | U | Create a favorite hierarchy, filter crates, reveal containing crates, clear filter and restore order; source 227561407. |
| LIB-013 | Ratings, emoji ratings and iTunes rating import | N2 | S | Preview overwrite scope, apply only selected authorized changes and preserve rollback; source 223364427. |
| LIB-014 | Track lock versus beatgrid lock | N1 | S | Prevent persisted edits to read-only tracks while distinguishing temporary session changes and analysis locks; source 14361544561167. |
| LIB-015 | Files panel copy, move, rescan and volume portability | N2 | S | Test on disposable files; preserve identities and clearly distinguish reference removal from disk deletion; sources 14362305508239, 227561687, 227916927. |
| LIB-016 | History session editing, inserted tracks and exports | N2 | U | Start/end a session, insert a non-file entry, export CSV/TXT/M3U and verify M3U omits non-file entries; source 223455687. |
| LIB-017 | Live playlists and optional sharing | N3 | S | Preview and explicitly publish an opted-in session; stop sharing immediately while local playback continues; source 223455827. |
| ANA-007 | Analyze-on-import, ranges and selective reanalysis | N1 | S | Verify automatic import queue, per-field overwrite rules, locked exclusions and cancel/restart; sources 14361068095759, 14361435885327. |
| DEK-013 | Instant doubles across decks and sampler | N2 | A | Duplicate track, position, gain, rate and sync into another destination and compare alignment; source 227629908. |
| DEK-014 | Autoplay, repeat, offline player and practice layouts | N1 | U | End a track, observe correct repeat/next-track choice and library selection; sources 224969667, 235211327. |
| DEK-015 | Temporary cue hold/release and continued playback | N1 | A | Set temp cue, hold audition, release to return, then latch playback without returning; source 233435527. |
| DEK-016 | Cue/loop names, colors, order and chronological preference | N2 | U | Edit labels, reorder, toggle chronological order and verify persisted association; sources 233435487, 226514988, 115003652768. |
| DEK-017 | Loop roll and underlying timeline | N2 | A | Hold a roll, change its length, release and measure resumed timeline independently of loop position; source 235208967. |
| DEK-018 | Smart sync state machine and relative-pitch takeover | N2 | A | Exercise armed, beat, tempo, disengaged-relative and absolute states, including a missing-grid load; sources 227627128, 227627168, 227561927, 227561947. |
| DEK-019 | Pitch Play and key sync | N2 | A | Select cue and pitch range, trigger transposed notes and restore original playback state; hardware quickstart and Pitch n Time documentation required. |
| DEK-020 | Slicer and slicer loop | N2 | A | Define region, slice selection and release behavior from a supported-device guide; inspect separately from a pad labeled Slicer that maps to Stems. |
| FX-003 | Advanced FX parameters, favorites and named presets | N2 | U | Change parameters, save/recall/rename/delete a preset and verify reset and fine adjustment; sources 10326824275087, 223364287. |
| FX-004 | Channel FX and hardware filter-knob assignment | N2 | A | Select channel effect, test both sides of neutral and return to neutral without unintended residual sound; source 224970027. |
| SMP-003 | Sampler advanced pitch, sync, cue/loop start and gain | N2 | A | Exercise each slot mode and output route, distinguish stored track gain from slot volume, and stop voices on bank switch; sampler manual section. |
| SCR-001 | Scratch Banks, per-slot load settings and previous-track return | N2 | U | Assign scratch media, set start/repeat/keylock, load to correct deck and restore previous track with modifier; official Scratch Banks guide. |
| FLP-001 | Flip recording, playback, loop, save and edit | N3 | A | Capture cue/censor sequence, replay against a declared musical timeline and restore saved sequence; expansion guide needed. |
| VID-001 | Video decks, linked AV playback and external display | N3 | S | Verify decode, frame/audio synchronization, second-display placement and recovery; Serato Video manual needed. |
| VID-002 | Video transitions, effects, text and image overlays | N3 | U | Inventory each control and test compositing, persistence and recovery with original test media; expansion guide needed. |
| LNK-001 | Ableton Link session, tempo and phase integration | N3 | A | Join/leave a local session, change tempo from either peer, verify phase and continue standalone after disconnect; sources 227839727, 228009488, 228009728. |
| STM-004 | Stem effects, waveform response and hardware pad replacement | N3 | A | Route mute/echo/brake to intended stem group and preserve timing; sources 5700921209615, 5700970589583. |
| STM-005 | Stem Slip introduced in 4.0.10 | N3 | A | Establish exact reference state transitions and audible return behavior before implementation; release notes plus runtime proof required. |
| HW-011 | Hercules Inpulse 300 MK2 full default mapping | N3 | H | Verify every physical control, modifier, pad mode, jog touch, guide LED, reconnect and four-output route on this connected unit. |
| HW-012 | MIDI many-to-one, one-to-many and data encodings | N3 | H | Verify absolute, relative and switch encodings with conflict resolution and explicit replace/add behavior; sources 225065768, 360001990956, 360001990936. |
| HW-013 | DVS THRU, changeover and emergency internal mode | N3 | H | Test passthrough processing, preserved state, muted changeover and end-of-control-media recovery on supported physical DVS equipment; sources 234760848, 234760868, 234760888. |
| AUD-007 | Microphone/auxiliary routes and virtual audio output | N3 | H | Inspect every available route, verify monitor/record destinations and permission failures without installing drivers automatically; sources 223447488, 223446728. |
| REC-003 | Pre-master recording tap, input selection and split files | N2 | A | Compare recorded levels before/after master-gain change, test alternate input and recover unsaved recording; sources 223459407, 115003927267. |
| UI-007 | Vertical, horizontal, extended, stack and library modes | P | U | Compare each layout at identical viewport, preserve deck focus, and report panels closed by layout constraints; source 225122768. |
| UI-008 | Day mode, library-only mode and display preferences | P | U | Compare both themes and retained settings at supported scaling and text sizes; sources 360001045656, 223364427. |
| UI-009 | Help, shortcut overlay, tooltips and diagnostics status | P | U | Execute keyboard help and contextual tooltips with accessible focus and no performance interruption; Getting Started manual section. |
| UI-010 | Complete setup tabs and hardware-dependent controls | P | U | Map every option and dependency in DJ, Sync, Audio, CD/Vinyl, Library, Mixer, FX, MIDI and Expansions; Setup Screen manual section. |
| SYS-009 | Streaming provider-specific capabilities and failures | N3 | S | Record provider-by-provider search, load, offline-cache, stems, recording and logout limitations; no provider entitlement bypass. |
| SYS-010 | Version comparison and historical removed/gated features | R | H | Compare 4.0.9 and 4.0.10 evidence plus earlier official sources; distinguish changed licensing from drivers, OS support and hardware limits. |

## Primary external references

- [Hercules Pro quickstart](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide)
- [Scratch Banks](https://support.serato.com/hc/en-us/articles/360002234676-Using-Scratch-Banks-with-Serato-DJ-Pro)
- [Expansions](https://serato.com/dj/pro/expansions)
- [Current release](https://serato.com/dj/pro/downloads)

## Version traps to preserve

The corpus contains both 3.0 and 4.0 software-overview articles. Several preferences explicitly apply only to older releases. Do not merge those into a supposedly current screen. The Hercules Pro guide includes an unrelated DDJ-FLX4 promotion; do not treat that sentence as evidence of Hercules licensing. The Mixxx upstream mapping filename names Inpulse 300, not MK2; neither a shared manufacturer nor similar controls establishes MK2 protocol equivalence.
