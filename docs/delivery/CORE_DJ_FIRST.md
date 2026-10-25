## Current status — core four-deck reliability, 25 October 2026

**Current source candidates — core reliability:** Desktop0.1.56/source3667d6f saves Prepare/manual History edits in a focused39-line session-panels module. Actual native insertion and Prepare add survived quit/process exit/reopen; original96history entries retained plus inserted97,16tracks/previews/controls present,0playing. [Evidence and limits](../prototype/desktop-0.1.56-session-panels.json). New session archive/read/export passes isolated handler/storage checks; native archive interaction remains open. Prior53listening/focus,54fader resets and55play-count evidence retain scope. Hardware deferred; software continues. Rare Sync pops/stalls and broad feature criteria remain open; no clean-case repeats or broad matrices.

**Previously delivered native52 evidence:** Desktop0.1.52/source df48b50: archive/host5/5 and actual normal native startup observed with16savedtracks/14viewport AX waveform previews,0playing decks,Horizontal/Compact and no shown save/recovery warning. Normal48 was quit only after fresh REC00:00/Start available/Download disabled inspection; closed245-file/120391863B profile backup hashes match. Current/versioned52 launchers syntax checked; exact bundle launch observed, launchers not executed. Terminal analysis removes one redundant global overview redraw while retaining per-result controls, focus, status/cancel/re-enqueue and global changed-selection tick recovery. Full Node148/148 plus14original controller-harness checks; matched4→0geometry visits/10.4–14.6→0–0.1ms. Full323.066s/15rotations/8fresh workers on8new songs distinct from44prior sources;43Load/20Play/24stoppedlayouts retain controls/previews. Independent23wholePCMwindows/148s and source/original/session hashes pass. Broader stalls remain:23longframes,worst242.5ms; largest two unattributed. Separate native3.0065s first-job window retains254nodes/focus/gain/master; largest COMPLETE main task22.869ms, actual199.1ms native long frame outside capture. No GC/CSS/DSP cause established. Physical output muted in diagnostics; normal-profile music not started. Trello148cards, two narrow software defects complete, six summaries/comment exact; prior146dispositions unchanged. Audible pops, native moving frames/held gestures, late-song grids, manual listening and hardware remain OPEN.

[Delivery/re-entry](../prototype/desktop-0.1.52-playback-delivery.json), [executed report/limits](../prototype/CORE_TERMINAL_ANALYSIS_REFRESH_2026-10-24.md), [runtime/source](../prototype/terminal-analysis-results.json), [PCM](../prototype/terminal-analysis-pcm-inspection.json), [native window](../prototype/terminal-analysis-native-window.json), [Trello reconciliation](CORE_TERMINAL_ANALYSIS_RECONCILIATION_2026-10-24.json).

Now: sourcef061853 skips geometry for cached library previews. One actual-pump RED(12reads)→GREEN(0reads), affected file3/3; two owned four-real-track Compact V→H captures retain270nodes/12previews/values/public4playing and32source pins. Preview callback style/layout6.021ms→0; whole event70.901→80.907ms, so broader lag/pop remain OPEN. Private57/source9c964e6 now packaged, inspection5/5; normal56/session/Current launcher retained. New57launcher unexecuted; native57startup remains pending. See CACHED_LIBRARY_PREVIEW_GEOMETRY_2026-10-25.md and its JSON. Reuse accepted53manual/EQ/Cue/stop evidence; hardware deferred. Header request stays UI-TOOL-01; no header rebuild. Goal active.
---

## Historical status — core audit and priorities, 21 October 2026

Current desktop test remains **0.1.37 / source ce5c124**. Jason accepted Jewel Kid/Prism as “Aligned and clean; easier to follow.” Preserve the chosen rekordbox layout, all controls/layout variants and library waveform previews. Existing accepted playback, fader, filter, tempo and jog evidence is retained; no new runtime/listening claim is made by this audit.

Current audit: **docs/prototype/CORE_DJ_AUDIT_2026-10-21.md**. Fresh 35/35 Node checks and focused tempo/jog/pending-Sync scripts passed. Isolated actual-handler checks reproduced malformed restore mutation/persistence and unbounded decoded retention; save failure visibility and saved-state validation remain inadequate. Exact real crash/quota thresholds and pop causation are unmeasured. The analysis dialog DOES read grid.beats; do not blindly delete it. Existing pending-Sync cancellation coverage includes startTokens.

Execution order: LIB-011/SYS-002 narrow restore/boot/color/save-failure safety; then remaining manual transition without Sync, audible EQ, temporary Cue/release/latch and final clean stop. AUD-006 is a gate before wider imports/long practice, not a reason to postpone a protected short listening session. Sync/pop/lag and unsupported/ambiguous grids remain open. Suitable hardware is required for independent headphone/master and controller acceptance. Full core reliability and parity are not complete.

This pass audits and reconciles Trello only. No app code, audio, profile, originals or desktop build changes. All 140 card dispositions are recorded in docs/delivery/CORE_DJ_RECONCILIATION_2026-10-21.json. Core26 / Next22 / Later85 / Blocked4 / Approvals2 / Evidence1 was verified by live readback. Local desktop testing remains authorized; historical HTML-only instructions below are superseded. Public release is not authorized by this audit. Settings navigation/toolbar/reset/spacing, full manual/site and global modularization skill/repo remain queued; no new layout exploration or broad refactor.

Exact re-entry: implement and verify the bounded LIB-011/SYS-002 safety slice, then collect missing practical acceptance. Refresh the actual app state before interaction; last paused positions are historical observations, not permanent live state.

---

# Historical checkpoint — Sync pop remains intermittent and open

20 October: HTML224 incoming tempo matching is confirmed by Jason, but he reports a glitch/pop on BEAT SYNC even with the incoming deck paused. A subsequent actual real-track retry in visible tab212 (LEFT Moonglow playing121BPM, RIGHT paused, RIGHT Sync) had **no pop per Jason**; LEFT stayed121 and RIGHT matched121 without starting. This is not a verified fix. Two-second base/full-preview and six-second trusted-pointer postmaster tone captures stayed continuous and retained the outgoing voice/rate. These do not rule out intermittent device-output dropouts or prove musical quality. No production audio change was made on this evidence. CORE-FIX-01 https://trello.com/c/6cK0v0iy remains OPEN and updated. Detailed evidence and exact next reproduction: docs/prototype/SYNC_POP_INVESTIGATION.md. Current visible real tracks are paused, both matched121/Sync engaged; final recording585545bytes remains available in the Recording panel, but its filesystem download was not verified. HTML only; native0.1.27 unchanged. Preserve previews/all controls; no stems/FX expansion. Direct mouse-pitch feel, manual beatmatch/jog, EQ/cue, suitable hardware routing and full shortcuts remain open. Avoid repeating clean tone checks without new evidence; capture the next actual pop.

---

## Historical checkpoint — HTML224 deck controls and stable Sync master

Jason's new screenshots/report supersede the previously optimistic manual-return checkpoint: later state had RIGHT still synced, and Sync could slow the outgoing playing deck. Four separate Core Now fixes are implemented/tracked: master ownership6cK0v0iy, deck-owned vertical tempo railsK8UGCT2P, BPMfine−/+902sYCVG and deck groupingdHVXccVC (trello.com/c/<id>). Existing native0.1.27 unchanged. Actual real-track UI checks preserve outgoingLEFT130.7 while incomingRIGHT matches130.7, and reversed outgoingRIGHT124.8 while incomingLEFT matches124.8. MASTER explicit/AUTO and BPM+0.1%/0%reset execute. Original input/transport/loop/utility nodes and ten library previews retained. Compact2/4decks H/V containment observed after correcting vertical intrinsic sizing and inherited right-side grid columns. Fresh user listening, direct mouse-rail feel and broader Smart/warp configurations remain unaccepted; no full-core/parity claim. Current visible tab212 is2DeckHorizontal/Compact, both real tracks paused0, SyncOFF/pitch0. Next re-run Jason's incoming-track listening scenario with the visibleMASTER indication, then continue manual beatmatch/jog/EQ/cue/hardware as available. Full keyboard shortcuts stay OPEN on UI-002. Review/evidence: docs/prototype/CORE_DECK_SYNC_224.md. No desktop rebuild or extras.


# Core DJ first — 19 October 2026

**Sole active goal: core DJ experience.** Stop any off-goal activity immediately and return to the next core blocker. Quick wins and full parity are parked until this goal is achieved or Jason explicitly changes scope.

**Current milestone: [CORE-001 — Load two local MP3s, cue, mix and beatmatch](https://trello.com/c/LGGdtSa3/114-core-001-load-two-local-mp3s-cue-mix-and-beatmatch).**

This supersedes older instructions to continue keyed Stems, sampler compositions or advanced FX next. Jason's current priority is a usable two-deck DJ workflow, with quick wins and the full independent Serato parity backlog afterward. His two Technics 1200s and a mixer analogy defines the everyday mixing workflow; actual timecode/DVS support remains in its separate later cards.

## Current direction — 20 October 2026

Jason selected the **rekordbox layout** and explicitly requested one active goal: finish the core DJ loop, HTML only. This supersedes prior layout recommendations and earlier desktop-test authority for new work: **do not rebuild or integrate the desktop app**. Preserve the other HTML variants, every existing core control/custom interaction and decoded library waveform preview. No further comparative layout/cosmetic work, stems, advanced FX, video, DVS or broad mapping catalog work while this goal is open.

Default entry is rekordbox / 2 decks / Horizontal / Compact / mixer visible. The selected view had actually hidden both channel filter knobs; HTML220 restores those original controls. Recent custom centered fader ticks and 28×14 caps are preserved. Core listening is underway on two existing saved real local MP3s: Earlier user playback confirmations were on generated demos in an older user-facing browser tab. That tab has now been refreshed and loaded with the two saved real MP3s; fresh real-track listening confirmation is pending. A2px horizontal-pitch input was corrected to15px by clearing inherited vertical writing mode; actual pointer direction/center and keyboard0.1% adjustment executed and restored. Hercules is disconnected; current output is computer audio. Right-deck independent playback, actual routing/headphone blend, manual and synced transitions, core controller checks and final stop remain pending. Do not mark the whole workflow accepted from this first observation.

## Constraint ledger

- Outcome: load two different music files from Jason's hard drive onto separate decks and complete manual and synced transitions with audible master/headphone separation.
- Target: existing production audio/transport in the rekordbox HTML prototype. Preserve the original engine, control bindings and other variants; change presentation only to remove a concrete core-workflow obstruction. No desktop build/integration.
- Must: local import/load, independent Play/Pause/seek and cue, channel gain/faders, crossfader, master/meters, headphone cue/mix/level, pitch/range/direction, jog/nudge, Sync/manual return, EQ/filter/cutoff, basic waveforms/BPM/grids and Hercules core controls.
- Must not: let stems, sampler combinations, 55-FX completeness, video, broad device catalogs or full parity research delay this usable milestone; replace music with generated demos and claim this session passed; change original music; repeat solved matrices without a relevant change.
- Authority: Jason's 20 October selection of rekordbox, explicit goal request and HTML-only/no-desktop-rebuild boundary. Earlier instructions do not override this latest scope. No public release approval.
- Done evidence: exact HTML candidate and two real files, actual normal UI workflow, concise audio/control observations and Jason's physical/headphone/manual-mix confirmation. Historical scoped checks are reusable evidence, not acceptance of the entire session.

## Now, Next, Later

| Horizon | Outcome | Work / checkpoint |
| --- | --- | --- |
| Now | A useful two-deck DJ session | CORE-001 and its 22 existing linked dependency cards. Import/load/play first, then mixer/PFL, manual beatmatch, Sync, EQ/filter and controller coverage. Fix any concrete failure immediately. |
| Next | Reduce everyday library friction | Three provisional quick-win candidates: LIB-003 search/sort, LIB-004 simple crates, SYS-002 session persistence. Check current behavior first; if already sufficient, no change. Pick a small actual gap after core acceptance. Effort unestimated. |
| Later | Complete independent parity incrementally | Remaining 85 feature cards, including stems, advanced FX, sampler, video, four decks, DVS/HID/CDJs, provider integrations and broader compatibility. Existing criteria, evidence and model/effort recommendations stay intact. |

Owner: Codex prepares and fixes the software; Jason provides musical listening/manual-mix and physical-control confirmation when available. One active workstream. Review the sequence after a real two-track mix, or immediately when a core blocker appears. Quick wins do not outrank the core even if easy.

## Practical session

- Import two different real local MP3s through the normal file chooser; original files remain untouched. Load A on deck 1 and B on deck 2, with readable titles/waveforms and independent transport.
- Play/pause and seek both decks independently; temporary cue/hold/release and track replacement behave predictably.
- Listen to one deck on master while privately cueing the other at channel fader zero. Check cue selection, headphone level and cue/master mix, then both cue combinations. Speakers/master and headphone routing are separate.
- Mix with both channel gains/faders, crossfader, master level and meters. Confirm channel/crossfader endpoints and no unexpected clipping at the declared test levels.
- With Sync off, change pitch in the correct direction, nudge/jog to align beats, and complete an audible manual transition. Pitch range/reset must not unexpectedly jump.
- Engage/disengage Sync with two musical tracks and usable BPM/grids; establish and sustain a transition, then return to manual control. A Sync label or matching BPM number alone does not pass.
- Hear low/mid/high EQ and filter/cutoff changes on each channel; return controls to neutral. Main channel filtering is core; the 55-effect catalog is later.
- Exercise the Hercules core controls in this same workflow: browse/load both decks, Play/Cue, pitch, jog/nudge, channel/crossfaders, gain/EQ/filter and headphone controls that the device actually exposes. Record unsupported/unverified controls explicitly.
- Stop both decks and confirm silence/no queued restart. Capture exact app version/source and concise observed results; retain any real blocker.

These are acceptance observations in one useful session, not a request for a fresh exhaustive matrix. Where a focused technical check is needed for a changed audio/routing/transport boundary, run that check and resume the user workflow. Do not retest advanced stems/FX while this is pending. Record failures plainly; do not infer sound, beat stability or physical behavior from labels.

## Open core fix — waveform visual quality

19 October: Jason reports that the waveforms look very bad. Track on [ANA-001](https://trello.com/c/IBU50NY2), already in Core DJ — Now. Improve the actual two-real-track view for accurate waveform detail/transients, useful zoom, contrast/deck distinction and readable beatgrid/playhead/phase alignment. Preserve seek/timing/audio behavior. Actual rendered inspection and Jason's visual confirmation are required; Jason rejected190/0.1.24 as visually unlike the reference and mostly salmon. Core194 replaces that rendering using the supplied Serato docs/image; native25 rendering/control observations are recorded, with visual-user acceptance still open. Keep playback/BPM blockers moving; no unrelated redesign.

## Current waveform195 / desktop0.1.27

Desktop27 adds main detailed-waveform positioning to194RGB spectrum rendering. Native paused real-track gestures move only their target deck in both orientations; Horizontal forward/back returns to the original position. A short-drag timing gap observed in26 is covered by pending-final-position ownership and focused regressions. Native keyboard audition/release while playing is observed, but interrupted/confounded playing pointer inputs are not accepted. Read [gesture review](../prototype/CORE_WAVEFORM_SCRUB_195_REVIEW.md) and [current guide](../prototype/TRY_PLAYBACK_DESKTOP_0.1.27.md). User visual/musical/headphone/physical acceptance remains open. Do not substitute more matrices or advanced features for that session.

Both real tracks are currently paused20s in Horizontal; actual live controls are both Sync on at121BPM, deck1pitch+4.7%, deck1low−24dB, master−12dB, crossfader center. These settings changed during live checks and are preserved, not attributed to an accepted sequence.25/26and profile backups remain. Original songs and maps are unchanged by this work. Pointer-while-playing and native Shift fine adjustment remain to observe; Extended-view size toggle is documented but unimplemented here.

## Historical waveform194 / desktop0.1.25

The browser tempo/grid correction now analyzes both real songs and permits actual two-deck Sync/play and OFF/manual return. It is not packaged into native0.1.23 and does not establish perceptual musical alignment. Read [review](../prototype/CORE_TEMPO_189_REVIEW.md). Latest requested work: extract and implement Serato’s visual system for the core screen, including readable source waveforms. Preserve behavior/bindings rather than the old appearance; no reskinning or unrelated feature expansion. Checkpoint190 now implements77 reference-derived tokens, core styling, continuous decoded-source waveforms and zoom. Read [visual review](../prototype/CORE_DESIGN_190_REVIEW.md). Desktop0.1.24 now combines and executes these changes: real-song selected analysis, both Play/Sync/OFF/manual/Pause, source seek and zoom. Both real tracks are paused at20s, ready for Jason. [Current guide](../prototype/TRY_PLAYBACK_DESKTOP_0.1.24.md). Perceptual mixing, current hardware/headphone and visual acceptance remain open.

## Core192 and191 software controls — hardware deferred

Jason asked to continue without the Hercules. Actual0.1.24 temporary-cue audition/release and isolated deck1EQ/filter responses are captured and independently decoded; [review](../prototype/CORE_CONTROLS_191_REVIEW.md). Core192 now independently matches actual native keyboard jog audio to the original source at1.000/1.040/0.960/1.000×. [Jog review](../prototype/CORE_JOG_192_REVIEW.md). This is not physical jog, other-mode/quality or musical beatmatch acceptance. Both real decks are restored paused at20s with EQ/filter neutral; original files unchanged. Do not repeat these solved checks. Practical musical listening, monitor blend and current physical/headphone confirmation remain pending.

## Previous executed core checkpoint188

Actual desktop0.1.23 imported two real MP3s, loaded separate decks and played/paused both independently and simultaneously. Fader/crossfader master isolation/restoration observed; normal capture decodes finite stereo. Files reports2saved/0session-only. Both songs currently have unknown BPM/grid; fix that core path next. Disconnected-Hercules pending Play recovered through normal default-output selection. Both decks are stopped; manual/Sync musical transition and current physical/headphone acceptance remain open. Read [observation](../prototype/CORE_DJ_188_OBSERVATION.json).

## Starting point and evidence boundaries

The current running candidate is0.1.27 froma20059d5d3b2c3041e80900428e2995d28da3d08, with corrected RGB waveform194 and detailed scrub195. The following25observations are retained historical evidence. Actual native source bytes, both real files, Play/Sync/zoom/Pause and rendered colors were observed. Previous24/23remain. Read [current guide](../prototype/TRY_PLAYBACK_DESKTOP_0.1.25.md). Refresh the currently running version/profile/device and file-import state before playback or packaging decisions.

Jason previously confirmed individual 0.1.23 left/right Play/Pause, right fader and headphone cue, and corrected right tempo direction. Earlier versions also have cue/master isolation evidence. These are historical per-control observations, not a completed two-real-track musical mixing session or all-controller acceptance. Preserve the profile, 272 Alternative mappings (including pitch inversion), previous bundles and launchers. A new narrowly justified local candidate is within earlier desktop-test authority; preserve the known build and record what changes before any candidate switch.

Software preparation can continue with the controller unplugged. Use headphones/speakers and the actual Hercules only when Jason is available; ask one action at a time with no surprise timed captures. Do not start or restart user apps/servers just for board administration.

## Trello layout and completeness

Board: [Open Play — Serato parity](https://trello.com/b/OqMGEjpe/open-play-serato-parity).

1. Core DJ — Now: CORE-001 plus 22 existing feature cards, ordered by the practical workflow.
2. Next — quick-win candidates: 3 existing cards; no promise that unmeasured work is easy.
3. Later — full parity & advanced features: 85 existing cards.
4. Approvals & release boundaries: historical parity and current desktop/release authority.
5. Verified evidence: retained scoped research/hardware record.
6. Blocked / unknown: reserved for actual blockers; no invented blockers.

All 113 previous cards are retained. CORE-001 is a new integration/acceptance milestone, not a 111th feature group. The feature inventory remains 110 groups / 522 requirements, with full acceptance false. All moved descriptions retain the previous bytes after a short priority prefix, including formal acceptance and per-feature Codex/Claude model recommendations. No feature was marked complete as part of reorganization.

## Model routing

Routine import, UI, mapping and focused implementation: Codex gpt-6.1-sol / high. Only escalate a reproduced unresolved DSP/clock/routing problem to gpt-6-astra / high with the failing artifact. Claude Code optional reviewer: claude-sonnet-5 / high; unresolved DSP review claude-opus-5 / high. Existing linked feature-specific recommendations remain; confirm installed equivalents before invocation. Recommendations are not executions and do not launch another agent.

## Re-entry

Read this file and handoffs/core-dj-first.md, refresh the actual desktop candidate, then execute normal import of two different real local MP3s and load one per deck. Fix the first real blocker, then continue toward an audible manual transition and Sync transition. Do not resume the old keyed-Stems follow-up first.

Board mutation and readback evidence: core-dj-board-reorganization-20261019.json and core-dj-board-readback-20261019.json. Original full project prompt and all prior evidence remain preserved.

