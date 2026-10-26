# Replacement analysis and pending Sync ownership

## Controlled reproduction

On product base11672a6 (staged desktop0.1.60 source8bd3d86 has the same analysis path), the actual enqueueAnalysis source and AudioEngine/Smart Sync were executed with a controlled graph/clock, held resume and stub analysis result. IncomingB had120BPM/grid0 and an outgoing126BPM master. While B's Sync was pending, replacement analysis saved100BPM/grid0.1. The older Sync resolved committed instead of AbortError. The failing result and pre-fix app source are retained privately under local-evidence/analysis-sync-2026-10-26.

This is a real controller/ownership failure with controlled scheduling, not an actual-worker, PCM or musical reproduction. Root cause: the analysis queue wrote replacement grid metadata without the existing grid ownership callbacks.

## Repair and focused verification

The existing queue now captures/revokes grid ownership before changing BPM, grid origin or clearing markers. It persists measured metadata, awaits existing realignment and refreshes the current controls/affected waveform even when realignment fails. AbortError retains cancellation semantics; other realignment errors identify saved analysis separately from playback failure. Successful-count accounting follows completion.

Identical grids, protected tracks and manual edits made during analysis retain existing guards and do not touch grid ownership. No new DSP/clock algorithm, duplicated Sync implementation, global renderer replacement or metadata overwrite option. Queue scheduling stays with its current owner; reusable ownership and rendering remain in the existing engine/Sync/presentation modules.

The original controlled path now aborts old Sync, retaining old incoming voice/rate and outgoing master; fresh Sync uses100BPM metadata and reaches1.26× against126BPM. Three targeted cases and the affected existing analysis-refresh, presentation and terminal/cancellation files pass21/21. No full Node suite, broad DSP matrix or timed soak.

## Actual worker integration

The corrected actual-worker attempt passed. [Structured receipt](analysis-pending-sync-2026-10-26.json). Four playing tracks were Disaffected, Fort Romeau Breathe Trip Mix, DJ W!LD Call Me Later and Mike Shannon Only Noodles. This uses different leading tracks from the metadata-save check. The opt-in analysisSave diagnostic uses the existing Track Details and Analysis settings controls. A1% paused BPM edit establishes a grid that the real worker will replace. At its existing100% progress event, the diagnostic requests Sync twice and records whether preparation is actually pending; it neither delays the worker nor holds audio acknowledgments. An unobserved overlap is inconclusive.

Observed pending B had nominal0.99009900990099×, source1×, processing=true, one transform and token7. Actual analysis replaced128.27→127BPM and canceled that old request. All four original voices/rates and outgoing127BPM master remained; incoming Sync was off with nominal/source1×. All233observed controls/preview nodes stayed connected. A fresh Sync used127/127=1× and reached its recorded audio handoff at110.59249433106577; master remained unchanged.

The existing UI reported1measured/0failed. Final DOM retained4Play/4tempo/12EQ/4filter/4level/32pads,16library rows and3lazy preview images; modal closed. Cleanup stopped all4/noqueuedPlay, physical mute asserted and isolated-origin original-session comparison unchanged. All8original SHA256/byte/mtime identities and20runtime source hashes match. Screenshot inspected; the diagnostic overlay covers part of the lower decks, so this is not full layout/visibility acceptance. Source rate/voice identity is not independent PCM continuity or heard musical alignment.

The first setup attempted a non-exported window.openPlay.enqueueAnalysis method and failed before any replacement analysis. All decks stopped, physical mute stayed asserted and isolated session comparison was unchanged. That setup is retained separately; the corrected attempt uses the original Analysis settings replacement checkbox/run handler and does not expose a new product API.

## Delivery boundary

[CORE-FIX-19](https://trello.com/c/ATvPhflV) tracks this analysis surface separately from Track Details CORE-FIX-17 and Edit grid CORE-FIX-09. Current HTML is newer than staged0.1.60; that package and normal native0.1.59 session are unchanged. Do not accept staged60 for replacement analysis during mixing. Native pending/held-gesture and listening acceptance remain open; no attribution of intermittent pops or broad frame-time improvement. No hardware, public release or merge.
