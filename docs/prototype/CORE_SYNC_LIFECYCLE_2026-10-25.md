# Sync disengagement and manual intent — 25 October 2026

Source **988fd31** repairs reproduced late-commit failures after OFF/mode changes and pending Simple manual Seek. **257/257 Node tests pass**, including36 new cases. Controls, layouts and waveform previews remain. No live UI, real-track playback, native build, normal-profile action or listening was performed.

**A separate overlapping-request rollback defect remains open.** Two pending Simple Sync requests followed by OFF retain the original1×audio, but nominal rate ends1.05×. This exact failure is not covered by257passing tests. It is the next source task under [CORE-FIX-08](https://trello.com/c/GWdwrMCD); audible pops and native stalls also remain open.

## Reproductions and repairs

**Simple OFF and mode changes did not revoke preparation.** The actual controller/settings/render paths cleared public Sync flags while buffers or a validated live ACK remained pending. The old request could later route a new voice and restore Sync roles. Explicit cancellation now deletes only the related request and aborts only its matching engine/track/start-token/current-controller preparation. A related incoming or leader change is handled; an unrelated four-deck pair remains active. Finally removes only the invocation's own request, preserving a newer pending press. Eleven lifecycle cases: immutable RED10fail/1pass→GREEN11/11.

**Pending manual Seek was invisible to snapshots until its ACK.** A newer in-place Seek left anchors/token unchanged while awaiting its live response, letting older Simple Sync commit and retire the old voice first. The existing app manual-position hook now cancels related Simple requests synchronously before Smart manipulation. The newer Seek ACK applies to its retained voice. Eight cases: RED5fail/3pass→GREEN8/8, including incoming/leader at buffer and owned-ACK stages, equal/different-rate owner controls and an unrelated pair.

**Smart OFF/reset could reject publicly but still commit audio.** Revision/mode checks alone happened outside the engine's already-validated start. Internal/external held ACKs could route/retire audio after OFF, including when settings had already switched to Off. A mode-independent preparation-ownership predicate and exact controller guard now revoke the candidate before public state changes. Grid-save cancellation reuses that guard. Committed audio and newer manual ACKs are preserved.

The first warped-primary branch also needed its own preparation record and post-await check. It now aborts the current candidate and restores only its uncommitted nominal rate while retaining OFF/reset flags; changed track/token/voice/rate-owner prevent stale rollback. Seventeen Smart cases: RED10fail/7pass→GREEN17/17. Some compatibility cases already passed baseline and are not claimed as original failures. [CORE-FIX-15](https://trello.com/c/Ytr7kf52).

**OFF remains accessible while preparation is pending.** Simple/Smart pending state is exposed separately from engagement. Existing markup and frame refresh keep OFF enabled and set Sync busy without asserting pressed. No deck/mixer/overview rebuild was added. A separate private actual Smart controller/markup/tick probe passes17assertions; it is not added to the public257count and does not establish screen-reader/native behavior.

## Executed checks and boundaries

- Byte-identical final36cases against immutable fb9f190:25fail/11pass; current36/36. Full current257/257.
- Original live-keylock9, two-barrier handoff4 and pending-Smart start checks pass. Independent Simple lifecycle/Q/range/orientation34, Simple/live preparation20 plus original controller/loop scripts, and Smart/grid/ownership/primary/deadline52 checks pass at their stated controlled scope. The final two primary probes were then retained in the public17-case test.
- Three existing VM harnesses lacked bindings for newly imported pending/cancellation collaborators. Only fixture bindings were added; original assertions remain. Initial fixture failures and the earlier15-case Smart baseline remain privately retained, excluded from accepted final counts.
- Evidence uses actual controller/settings/Sync/engine methods with controlled graph, clock, buffers and live acknowledgements/DOM endpoints. No adapter DSP, PCM continuity, native frame-time gain, physical gestures/MIDI, real music or audible-pop conclusion follows from these tests.
- No dependencies, DSP algorithms, clocks/fades or broad refactor were added. The normal0.1.52/source df48b50 app/profile, originals and unrelated brand files remain separate and untouched.

## Next source repair: original rollback basis

The exact compound probe executes actual controller and engine: hold requestA's live ACK, start requestB, releaseA, verifyB remains pending, press OFF, then releaseB. Both requests reject; pending/processing clear, old voice survives with no retirement. Yet B captured A's optimistic1.05×target as its previous rate, so final nominal1.05×disagrees with audible1×.

Repair the original nominal rollback basis across still-owned pending Sync preparations. Require the same track, retained voice and pending token/controller/rate-owner chain; manual/newer/committed owners break inheritance. Source-local audibleRate alone is insufficient for warped clocks. Add actual overlap→OFF/reject/Stop and later-success/manual-owner regressions before changing engine rollback. Keep this on CORE-FIX-08, with cross-link from15; no duplicate card and no pop attribution.

## Live checks prepared for unlock

Ignored CURRENT_INTEGRATION assets pin988fd31 with23selected modules. Exact prior ea70 readiness copies, earlier5e copies and the legacy99/ba4 twenty-module orientation comparisons remain distinct. Host/server syntax,9trigger/7interval/2injected-script checks, all source manifests and eight-original hashes pass. No HTTP listener or Electron was launched. Generic Run/turn10 does not exercise the new lifecycle or rollback cases by itself.

From the repository directory, after checking the owned port/process and preserving recordings:

```sh
python3 local-evidence/four-deck-stall-capture-2026-10-24/orientation-server.py current
```

In a separate terminal:

```sh
desktop/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron \
  local-evidence/four-deck-stall-capture-2026-10-24/native-orientation-window.cjs current \
  "$PWD/local-evidence/four-deck-stall-capture-2026-10-24/orientation-current-sources.json"
```

Keep normal52 separate. Use visible Import/Run for the varied-track four-deck trace/control/preview observations. Separately capture OFF/Shift Sync and actual settings changes during cold Simple preparation and a held current-source live ACK; incoming/leader manual Seek while ACK is pending; Smart internal/external/first warped-primary revocation; newer/manual/committed voice retention; busy/pressed/OFF state and held gestures. The compound rollback case remains a source failure until the next repair, not an accepted live scenario.

Retain earlier range/Q/orientation, FX/rate-failure and current audio parameter/voice windows. Capture bounded paused/playing incoming Sync with the outgoing master unchanged and retain the next actual pop. Manual transition/EQ/Cue/clean stop, late-song musical grids and independent headphone/master/controller checks remain queued. These ignored local assets are not distributed in the PR. No full-core/parity or native/audio acceptance is claimed.

[Source/test receipt](sync-lifecycle-results.json) · [Trello readback](../delivery/CORE_SYNC_LIFECYCLE_RECONCILIATION_2026-10-25.json) · [previous source repairs](CORE_SIMPLE_SYNC_RELIABILITY_2026-10-25.md).
