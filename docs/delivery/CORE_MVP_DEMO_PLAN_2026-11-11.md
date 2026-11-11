> Current delivery: **0.1.151 / f0ebf35**. Working public release is the finish line; this document preserves the preceding core milestone and board-audit snapshot. The bounded Repeat repair is complete within its stated source/native scope. Now has four cards: CORE-001, DEK-002, SYS-002 and BETA-REL-01. Minimum public install/trust/license/support work is on the critical path; full parity, AI and Hercules are deferred. [151 Help delivery and limitations](../prototype/HELP_MANUAL_151_2026-11-11.json).

# Core DJ MVP demo — historical goal and board audit

11 November 2026. Jason explicitly set **core DJ experience / MVP demo** as the target. Public beta preparation is a future lane. The new goal is active; its exact tool-readback objective is in [the goal record](CORE_MVP_GOAL_2026-11-11.json).

## Outcome and boundary

Deliver a credible, reliable mixing demo on this Mac using two real local tracks, with a safe stopped ending and preserved session. Keep every existing layout, custom control and waveform preview. The selected current workspace is the demo surface; preserving alternatives does not require another reference-app redesign or full parity audit.

Current private candidate: **0.1.149**, immutable source `205d1ff`, delivered in `c9277dc`; ASAR `dae8f8680971aa960d29d497363973c4bb5d23b9623c8f6042e0ac1e48e020a7`. Its stopped native grid/cache review and whole26-entry main-metadata preservation are [recorded](../prototype/GRID_COVERAGE_149_NATIVE_2026-11-11.json). No new package, product change, listening or native action occurred during this board audit.

Keep audio muted until Jason is ready. Hercules is deferred. Public signing/notarization, licensing, public install/update distribution, full-manual expansion, AI and full competitor parity are **not MVP-demo prerequisites**. Their cards remain intact; this is sequencing, not acceptance or permission to publish.

## Now — four cards

| Order | Owner card | Next evidence |
| --- | --- | --- |
| 1 | [CORE-REPEAT-01 — stale Repeat restart](https://trello.com/c/YQkMoHei) | Repair the reproduced source cancellation/replacement race in a focused module; verify ordinary Repeat and affected cancellation only. |
| 2 | [CORE-001 — core mixing demo](https://trello.com/c/LGGdtSa3) | One coherent current-candidate demo and focused owner musical/volume/visual acceptance, reusing unchanged accepted controls. |
| 3 | [DEK-002 — transport](https://trello.com/c/5Ae8kveX) | Stop/replacement must beat pending Repeat; no queued restart after the final stop. Broad historical transport criteria stay separate. |
| 4 | [SYS-002 — current-session safety](https://trello.com/c/jrimQjEN) | Preserve normal save/reopen, existing track identity/positions and recovery while changing transport; do not claim crash/migration coverage. |

### First repair: Repeat ownership

The actual extracted `engine.onEnd`/`cancelPendingPlay` handlers and real Smart Sync module reproduced two failures with controlled engine collaborators: a newer Stop is followed by a stale start of the old track; replacing the track is followed by a stale start of the replacement. Both regressions failed before any implementation change. This is **source evidence**, not an observed native incident, audible pop or explanation of startup106.

Private re-entry: `node --test local-evidence/repeat-end-owner/repeat-end.regression.mjs`; `red.txt` beside it contains the failures. Restore the focused regression into the normal test location when implementing. Reuse the existing Play-request cancellation ownership; guard request, track/deck identity and each asynchronous continuation. Keep restart logic small and reusable, with app wiring only. No DSP/layout/control/preview rewrite is needed.

### Demo checkpoint

1. Deliver one coherent replacement candidate after the affected source repair. Protect the closed profile, retain a rollback, inspect the exact archive and observe the affected native path. Use focused checks, not another broad suite, corpus or soak.
2. With Jason ready, run one short practical session: outgoing-master-preserving incoming Sync/restart; manual takeover only if affected; a sensible EQ/bass swap and crossfade; expected output level without clipping; readable beat feedback and library previews; clean stop. Include a modest four-deck workload or alternate waveform view where it changes the demonstrated risk, not a new layout matrix.
3. Record heard versus observed results separately. A screenshot/grid score does not prove musical alignment or absence of pops. Preserve the next actual failure once and repair it before accepting that segment.

Unchanged prior53 manual tempo/jog/A-BEQ/Cue/latch/stop and109 restart acceptance remains valid within its scope. Do not rerun those ordinary cases to fill time. Current owner musical alignment, volume and preview-readability checks remain in [CORE-LIVE-01](https://trello.com/c/yJ8r9kCD) and linked existing defect cards. Generic pop/stall and broad parity cards do not become complete from one successful demo.

## Whole-board reconciliation

All **256 existing cards** were read across all six lists, including full descriptions and supplied checklist/comment arrays. Those arrays were empty and all truncation flags were false. Three parallel read-only reviews covered78 core/blocked,125 Next/Later and53 evidence/approval cards. Source/receipt checks were targeted; this is not fresh functional certification of every feature.

Added one distinct source defect, CORE-REPEAT-01, after duplicate review. Applied93 cross-list moves and read back all257 cards. Updated seven current summaries/titles or stale evidence statements; original acceptance/history/model recommendations remain. No completion flag changed, no card was archived/deleted and no unfinished parent was closed.

| List | Before | After |
| --- | ---: | ---: |
| Core DJ — Now | 67 | 4 |
| Next — quick-win candidates | 29 | 33 |
| Later — full parity & advanced features | 96 | 153 |
| Blocked / unknown | 11 | 12 |
| Verified evidence | 51 | 53 |
| Approvals & release boundaries | 2 | 2 |
| **Total** | **256** | **257** |

**52 complete /205 open.** Verified evidence includes one intentionally incomplete reference record. The two completed packaging/cleanup defects were moved from Next to Verified evidence; no new functional acceptance was invented. Completed bounded defects retain their evidence scope even when a broad parent remains open.

The [257-card index](CORE_MVP_CARD_AUDIT_2026-11-11.jsonl) records every reviewed card, disposition, rationale, remaining work and current description hash. [Exact board readback](CORE_MVP_TRELLO_READBACK_2026-11-11.json) records totals and the four active cards. Private source snapshots/move ledger remain in ignored `local-evidence/trello-audit-2026-11-11/`.

## Next, Later and re-entry

Next contains optional or conditional essential usability/metadata/help follow-through, implemented controls awaiting broader acceptance, and future beta-release coordination. Promote a narrow item only if it demonstrably blocks the core mix. Full design migration, global refactoring, reference extraction, AI/crate automation and extended controller/DSP parity stay Later; new implementation must still use focused reusable modules and existing design controls.

Owner listening/visual gates are explicit, with Hercules later. Unreproduced startup60 remains a watch item, separate from Repeat. Public trust/license/install/manual obligations stay under the future release card and existing approval boundaries; they do not block this internal demo.

Reassess after the Repeat repair and the next actual owner session, or on a new reproduced core failure. Update current handoff/Trello and push each coherent delivered change. Do not add broad test matrices or repeatedly prepend history to cards near Trello's description limit; use linked comments when needed.

## Done criterion

The MVP goal is complete only when the latest coherent candidate demonstrates the core mix with owner musical/volume acceptance, a safe stopped ending, usable controls/previews and preserved normal session, and Git/Trello match that artifact with limitations explicit. That does not grant public publication, Hercules acceptance or full Serato/rekordbox parity. The audit/reorganization is executed; the MVP itself remains unfinished.
