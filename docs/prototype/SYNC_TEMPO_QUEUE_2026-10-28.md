# Preserve a newer tempo adjustment after a Sync request fails

28 October2026. Source/browser repair after private0.1.89. Current89does not contain this change; native failure/playing/listening acceptance remains pending.

## Reproduced failure

The shared Sync tempo queue returned the same promise for its active request and every newer queued input. Rejecting the active transport preparation threw out of the drain, cleared the queue and rejected the newer callers without applying their latest adjustment.

One focused regression executes the real request module and Smart Sync state: A requests132BPM and waits; B queues125then130BPM. Rejecting A also rejects both B calls and never sends their latest130BPM to transport. The original failure output is retained privately.

The same loss was observed through normal input handlers in an isolated actual four-deck Compact workspace. Generated tracks, physical masterVolume0, all decks paused. A/B start at124BPM. A’s pending+1% request shows125.2; B then requests+3% relative adjustment. Reject only the first group endpoint. Baseline sends one endpoint call and drops B’s input, returning124.0. Repaired sends two calls, with B’s endpoint using the actual engine, and reaches127.8BPM (127.78unrounded). The error notification stays visible in both runs.

| Observed property | Original | Repaired |
|---|---:|---:|
| Group requests executed |1|2|
| Final A/B displayed BPM |124.0|127.8|
| Original controls retained |423/423|423/423|
| Play controls |4|4|
| Original materialized preview retained |1/1|1/1|
| Playing decks / masterVolume |0 /0|0 /0|

Only one preview was materialized at measurement; this is not all-library readiness proof. No user music, ordinary profile, recordings or main desktop input was used.

## Repair and scope

The existing request module owns each operation’s completion instead of one shared success/failure. Waiting inputs still coalesce to the latest requested tempo; their callers settle with that operation. An active failure rolls back only its own still-owned Smart Sync write and rejects its own callers. The queue then processes the latest waiting input. It does not retry the failed request. Queue ownership is released synchronously at drain completion so settlement callbacks can start a fresh drain.

Existing independent/Simple routing, validation, Slicer/sampler participation and current-owner rollback remain. No new dependency, DSP, fade, clock, layout or desktop host change. Module35lines; regression27lines.

Executed: one new failed-then-passing composed regression plus the existing CORE-FIX-42rollback-ownership test; actual GUI path before/after; syntax/diff checks. No whole Node suite, soak or clean listening repeat, following the user’s focused-verification instruction. Cleanup closed the owned iframe/context, cleared its origin and stopped its server. Private raw evidence: `local-evidence/sync-tempo-queue-2026-10-28/`.

This distinct defect is not established pop/stall causation. CORE-FIX-43tracks it; intermittent Sync pops/beat alignment and waveform lag remain with CORE-FIX-01/07. Relevant native playing/listening acceptance remains open. Prior53manual/jog/EQ/Cue/stop evidence retains its original scope. Owner listening/controller work remains deferred.

Re-entry: include the repair in the next immutable private candidate, preserve the ordinary paused session during promotion, then keep the pending current-candidate listening/native failure check in the existing owner session.
