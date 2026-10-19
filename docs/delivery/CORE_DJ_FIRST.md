# Core DJ first — 19 October 2026

**Sole active goal: core DJ experience.** Stop any off-goal activity immediately and return to the next core blocker. Quick wins and full parity are parked until this goal is achieved or Jason explicitly changes scope.

**Current milestone: [CORE-001 — Load two local MP3s, cue, mix and beatmatch](https://trello.com/c/LGGdtSa3/114-core-001-load-two-local-mp3s-cue-mix-and-beatmatch).**

This supersedes older instructions to continue keyed Stems, sampler compositions or advanced FX next. Jason's current priority is a usable two-deck DJ workflow, with quick wins and the full independent Serato parity backlog afterward. His two Technics 1200s and a mixer analogy defines the everyday mixing workflow; actual timecode/DVS support remains in its separate later cards.

## Constraint ledger

- Outcome: load two different music files from Jason's hard drive onto separate decks and complete manual and synced transitions with audible master/headphone separation.
- Target: existing Open Play interface, production audio/transport and approved local desktop test path. Preserve code and working behavior; fix measured blockers rather than rewrite.
- Must: local import/load, independent Play/Pause/seek and cue, channel gain/faders, crossfader, master/meters, headphone cue/mix/level, pitch/range/direction, jog/nudge, Sync/manual return, EQ/filter/cutoff, basic waveforms/BPM/grids and Hercules core controls.
- Must not: let stems, sampler combinations, 55-FX completeness, video, broad device catalogs or full parity research delay this usable milestone; replace music with generated demos and claim this session passed; change original music; repeat solved matrices without a relevant change.
- Authority: Jason's 19 October core-first correction and Trello reorganization request; earlier explicit local desktop-test approval persists. This is not public release approval.
- Done evidence: exact app candidate and two real files, actual normal UI workflow, concise audio/control observations and Jason's physical/headphone/manual-mix confirmation. Historical scoped checks are reusable evidence, not acceptance of the entire session.

## Now, Next, Later

| Horizon | Outcome | Work / checkpoint |
| --- | --- | --- |
| Now | A useful two-deck DJ session | CORE-001 and its 21 existing linked dependency cards. Import/load/play first, then mixer/PFL, manual beatmatch, Sync, EQ/filter and controller coverage. Fix any concrete failure immediately. |
| Next | Reduce everyday library friction | Three provisional quick-win candidates: LIB-003 search/sort, LIB-004 simple crates, SYS-002 session persistence. Check current behavior first; if already sufficient, no change. Pick a small actual gap after core acceptance. Effort unestimated. |
| Later | Complete independent parity incrementally | Remaining 86 feature cards, including stems, advanced FX, sampler, video, four decks, DVS/HID/CDJs, provider integrations and broader compatibility. Existing criteria, evidence and model/effort recommendations stay intact. |

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

19 October: Jason reports that the waveforms look very bad. Track on [ANA-001](https://trello.com/c/IBU50NY2), already in Core DJ — Now. Improve the actual two-real-track view for accurate waveform detail/transients, useful zoom, contrast/deck distinction and readable beatgrid/playhead/phase alignment. Preserve seek/timing/audio behavior. Actual rendered inspection and Jason's visual confirmation are required; this report is not an implemented or accepted fix. Keep playback/BPM blockers moving; no unrelated redesign.

## Current executed core checkpoint188

Actual desktop0.1.23 imported two real MP3s, loaded separate decks and played/paused both independently and simultaneously. Fader/crossfader master isolation/restoration observed; normal capture decodes finite stereo. Files reports2saved/0session-only. Both songs currently have unknown BPM/grid; fix that core path next. Disconnected-Hercules pending Play recovered through normal default-output selection. Both decks are stopped; manual/Sync musical transition and current physical/headphone acceptance remain open. Read [observation](../prototype/CORE_DJ_188_OBSERVATION.json).

## Starting point and evidence boundaries

The known baseline is the versioned 0.1.23 desktop test bundle; its source snapshot is 2a334132ca1a423029fceb8aa3e39953655df525. Later browser Sync fixes are not automatically in that package. Refresh the currently running version/profile/device and file-import state before playback or packaging decisions.

Jason previously confirmed individual 0.1.23 left/right Play/Pause, right fader and headphone cue, and corrected right tempo direction. Earlier versions also have cue/master isolation evidence. These are historical per-control observations, not a completed two-real-track musical mixing session or all-controller acceptance. Preserve the profile, 272 Alternative mappings (including pitch inversion), previous bundles and launchers. A new narrowly justified local candidate is within earlier desktop-test authority; preserve the known build and record what changes before any candidate switch.

Software preparation can continue with the controller unplugged. Use headphones/speakers and the actual Hercules only when Jason is available; ask one action at a time with no surprise timed captures. Do not start or restart user apps/servers just for board administration.

## Trello layout and completeness

Board: [Open Play — Serato parity](https://trello.com/b/OqMGEjpe/open-play-serato-parity).

1. Core DJ — Now: CORE-001 plus 21 existing feature cards, ordered by the practical workflow.
2. Next — quick-win candidates: 3 existing cards; no promise that unmeasured work is easy.
3. Later — full parity & advanced features: 86 existing cards.
4. Approvals & release boundaries: historical parity and current desktop/release authority.
5. Verified evidence: retained scoped research/hardware record.
6. Blocked / unknown: reserved for actual blockers; no invented blockers.

All 113 previous cards are retained. CORE-001 is a new integration/acceptance milestone, not a 111th feature group. The feature inventory remains 110 groups / 522 requirements, with full acceptance false. All moved descriptions retain the previous bytes after a short priority prefix, including formal acceptance and per-feature Codex/Claude model recommendations. No feature was marked complete as part of reorganization.

## Model routing

Routine import, UI, mapping and focused implementation: Codex gpt-6.1-sol / high. Only escalate a reproduced unresolved DSP/clock/routing problem to gpt-6-astra / high with the failing artifact. Claude Code optional reviewer: claude-sonnet-5 / high; unresolved DSP review claude-opus-5 / high. Existing linked feature-specific recommendations remain; confirm installed equivalents before invocation. Recommendations are not executions and do not launch another agent.

## Re-entry

Read this file and handoffs/core-dj-first.md, refresh the actual desktop candidate, then execute normal import of two different real local MP3s and load one per deck. Fix the first real blocker, then continue toward an audible manual transition and Sync transition. Do not resume the old keyed-Stems follow-up first.

Board mutation and readback evidence: core-dj-board-reorganization-20261019.json and core-dj-board-readback-20261019.json. Original full project prompt and all prior evidence remain preserved.

