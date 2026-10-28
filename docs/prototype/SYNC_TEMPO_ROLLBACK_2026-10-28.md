# Synced tempo failure overwrites a newer master — 28 October 2026

An older failed synced-tempo request unconditionally restored its captured Smart Sync tempo, even after a newer explicit MASTER/Sync action had established another tempo. The newer master indicator stayed selected while the shared planned BPM reverted. This is a reproduced state-ownership defect, not established audible-pop or waveform-stall causation.

## Actual failing and repaired paths

The original app request closure plus actual Smart Sync module reproduced requested132BPM→new primary90BPM→old failure restoring120BPM. The transport failure was controlled; this did not exercise audio output.

The same defect was then observed in the actual four-deck Compact workspace on an isolated localhost origin with generated demo audio only. Normal Settings changed Sync mode; normal load/MASTER/Sync/tempo controls drove the requests. A diagnostic held and rejected only the group transport endpoint. Baseline app.js/smart-sync.js were served from frozen copies of source95833b3; all other workspace modules were current. This is not a checkout-wide old-build comparison.

| Observation | Original | Repaired |
|---|---|---|
| Initial A/B shared tempo |124.0|124.0|
| Pending A tempo adjustment |125.2|125.2|
| New C MASTER, then B Sync |122.0|122.0|
| After older controlled failure |**124.0, wrong**|**122.0, retained**|
| C MASTER role / pressed state |primary / true|primary / true|
| Original connected controls |423/423|423/423|
| Play controls |4|4|
| Original materialized preview images retained |1/1|1/1|
| Playing decks / master volume |0 /0|0 /0|

Only one preview was materialized at the measured instant; this is not all-library preview-readiness proof. The error remains visible in both runs. No user music, normal app/profile, recordings or existing browser session was accessed. Physical output was muted through the diagnostic master-volume setting before resume and remained0; all decks stayed paused.

## Small repair and ownership

The former inline queue is now the25-line `prototype/sync-tempo-requests.js`, installed as the unchanged `engine.onRateRequest` hook. Queue coalescing, independent/Simple Sync routing, Slicer coordination, sampler participants, range validation, failure propagation and cleanup remain. The desktop packager declares the module; no dependency, clock, waveform, DSP or fade changes.

Smart Sync now gives every shared-tempo write a fresh owner. The request captures its owner immediately after setting a tempo and passes it to rollback. A newer write, even the same numerical BPM, revokes that rollback. Unowned legacy setup calls retain their old restore behavior. The owner changes on primary/external/tempo/reset/restore paths; readers still receive the same numeric captureTempo result.

One23-line composed regression passes for current-owner failure rollback, newer different-tempo master and newer same-tempo master. One directly affected existing primary-start rejection case also passes. Syntax and diff checks pass; no full suite, soak or repeated clean Sync/listening runs.

Private raw evidence: `local-evidence/sync-tempo-rollback-2026-10-28/`, including baseline source copies, controlled Node reproduction, actual browser JSON/screenshots, fixed-route server/fixture and cleanup. Owned frame closed, origin storage cleared and server stopped; no temporary sources/media were added to the product tree.

## Current delivery boundary

This is a source/browser repair after current desktop0.1.88/source1fecc28. **0.1.88 does not contain it; no new desktop package was created this pass.** The normal paused session remains preserved. Include this declared module in the next immutable candidate; observe protected native startup and relevant native ownership/listening behavior before broad acceptance.

CORE-FIX-42 tracks this distinct defect. CORE-FIX-01/07 retain intermittent audible pop/beat alignment/stall reports. Current owner/controller work remains deferred; ordinary0.1.53manual/jog/A-B EQ/Cue/stop acceptance keeps its original scope. No full-core/public-beta/parity claim.
