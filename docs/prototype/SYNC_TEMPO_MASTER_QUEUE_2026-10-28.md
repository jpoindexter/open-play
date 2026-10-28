# Queued tempo yields to a newer MASTER or Sync choice

28 October 2026. CORE-FIX-44: https://trello.com/c/ACAfgdKX . Source/browser repair only; current native0.1.92 does not contain this change. Its owner session was left untouched.

## Reproduced failure

An active Sync-tempo request waits for transport preparation. A second deck queues an adjustment. Selecting another MASTER or establishing a newer Smart Sync tempo supersedes that old queued input, but the queue previously checked only the input deck's track and Sync state. It could replay the old command after the active request failed and overwrite the newer choice.

The composed source reproduction executes the real Smart Sync and request modules: A132 waits; B130 queues; C90 becomes master; the older preparation rejects. Baseline replaces90 with130. A second case selects132 again to distinguish ownership from numeric equality. A third case queues input after choosing the new master; that genuinely new input must still execute.

The actual GUI MASTER button updates the selected-master module before the next Sync press updates Smart Sync. Therefore a Smart Sync tempo token alone cannot guard the GUI case. The request captures the selected-master deck and track as well as Sync mode and Smart Sync tempo owner.

## Actual four-deck Compact path

Isolated current workspace, normal controls, generated tracks, all decks paused and masterVolume0. Start A/B124; hold A's+1% group endpoint; queue B+3%; click C MASTER; reject only the held older endpoint. Subsequent endpoints use the actual engine.

| Observed | Baseline | Repaired |
|---|---:|---:|
| Group endpoint calls |2|1|
| A/B final displayed BPM |127.8|124.0|
| C MASTER selected |true|true|
| Original controls connected |423/423|423/423|
| Play controls |4|4|
| Materialized library preview retained |1/1|1/1|
| Playing decks / masterVolume |0 /0|0 /0|

Both runs retain the original controlled-failure notice. One materialized thumbnail is a preservation observation, not all-library readiness proof. No private music, ordinary profile, main native input or recordings were used.

## Small shared repair

Before a queued request reaches transport, compare its captured mode, selected-master deck/track and Smart Sync owner with current state. Superseded requests reject with AbortError. Queue-owned tempo writes and successful owned rollback advance only waiting requests that belonged to that prior owner, preserving CORE-FIX-43's valid latest-input behavior. Input made after a newer master choice remains valid.

Runtime module41lines; regression25lines; one selected-master getter wired at the existing app caller. Existing validation, error propagation, independent/Simple routing and Slicer/sampler participants remain. No dependency, DSP, audio-clock, fade, renderer or layout change.

Executed: new regression failed on baseline then passed after repair; two directly affected42/43 regressions also pass (3tests total), actual normal GUI path before/after, syntax and diff checks. No broad suite, soak or repeated clean listening pass. Private raw evidence under `local-evidence/queued-tempo-master-2026-10-28/`; public compact observations in the adjacent JSON. Owned context/frame/storage and server were stopped/cleared after evidence capture.

## Remaining gate / exact re-entry

Include this source repair in the next immutable native candidate when promotion can preserve the owner session. Relevant native failure/playing/listening acceptance is still open. This is not established pop/stall causation and does not close CORE-FIX-01/07 or broad core/beta gates. Prior accepted53manual/jog/EQ/Cue/stop evidence retains its original scope; listening/controller work remains deferred. Goal remains active.
