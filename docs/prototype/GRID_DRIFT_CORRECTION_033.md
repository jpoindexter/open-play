# Core Sync correction — whole-track grid drift

20 October 2026. Scope: the remaining two-real-track Sync offset. Preserve existing transport, all layouts/custom controls and library previews. Fable's broader repository audit is retained for triage; none of its proposed deletions or advanced-feature work is authorized by this change.

## Evidence checked

Read both returned Fable reports. Independently re-decoded the original tracks and recordings to private scratch PCM, verified original SHA256 identities, and reran the reported per-section bass-attack measurement. The results reproduce Can You Feel It's late-track error: its original grid's20-second section medians reach approximately−18 to−37ms after200seconds. These are algorithmic bass attacks, not human-verified downbeats.

The fine recording-correlation replay supports the captured transport's grid alignment: reliable overlapping windows205–218seconds round to0.0ms at0.1ms reporting precision. The diagnostic script then fails beyond the end of the Moonglow reference; those invalid/low-quality tail windows are excluded. This is evidence for the captured plain BufferSource case, not a universal sample-exact transport certification. No transport/scheduling patch follows from this pass. Pops/clicks remain separately open.

Root cause addressed: the analyzer fits a constant grid inside its configurable window (default180seconds), then previously offered no full-track check or correction when the source tempo moved later. Merely aligning two such grids cannot align off-grid musical attacks.

## Changes

- `tempo-drift.js`: a separate full-track bass-pulse pass, with supported20-second windows, robust residual summaries and a piecewise continuous tempo proposal. It checks beyond the spectral/initial-tempo window without running the long FFT beyond that window. Unsupported sections do not invent a correction. No source filenames or hard-coded song markers enter the detector.
- `analysis.js`: stores the check under `analysisResult.grid.drift` and adds `tempo_drift_detected` when supported sustained residuals exceed10ms. The initial result remains a constant grid; a correction is never auto-installed.
- `grid-drift-controls.js` / existing Edit grid: Check whole-track drift → Stage correction → inspect base BPM/downbeat/marker table → Save grid. Close discards the draft. A locked grid cannot stage/save. Late results cannot enter a replaced/closed dialog. Proposal values are validated before changing the draft; originals are never retagged or rewritten.
- The existing warp-map and Smart Sync playback paths apply saved tempo changes. Their semantics are unchanged. No hidden millisecond bias or cosmetic waveform shift.

## Executed source checks

12 focused tests passed: late drift after the180-second fit, steady/no-invented map, malformed clocks/proposals, proposed-map phase error below10ms on known synthetic attacks, actual staging/lock/closed-dialog handlers, and existing Simple/Smart policy/presentation checks. The existing accented/syncopated tempo script also retains its approximately2.5ms phase error; this is synthetic evidence.

Read-only real-file proposal evaluation: for Can You Feel It, the independent50%-bass-rise section medians from200–300seconds improve from approximately−18…−37ms to−3…−9ms using the proposed grid. This is an independent attack definition relative to the detector's causal pulse rises, but both are algorithmic estimates. Raw PCM, originals and full measurements remain in ignored `local-evidence/sync-grid-correction-033/`. No current musical acceptance is inferred from this offline improvement.

An older `scripts/test_analysis_controller.mjs` could not execute because its VM extraction includes an `export` declaration. That pre-existing harness failure is not counted as a pass and no unrelated harness rewrite is included here. The optional exact-BPM storage change is deferred; proposal/manual grid values retain precision, and existing library data is preserved until an explicit Save.

## Native/listening gate

Actual desktop0.1.33 was packaged and passed5/5 runtime checks. Native Check→Stage→Close preserved the saved grid; fresh Check→Stage→Save persisted five reviewed CYFI markers and reopened correctly. Original bytes were unchanged. The separate corrected musical listening gate remains pending. Broader testing subsequently exposed unsafe proposal cases; guarded follow-through and225-file evidence: [SYNC_CORPUS_034.md](SYNC_CORPUS_034.md). Native acceptance requires: check a real track, stage/cancel without saved changes, reopen/check/stage/save, verify saved markers and unchanged original bytes, then one Smart Sync mix through the formerly drifting section with outgoing master unchanged. Record listening outcome and pop/lag disposition. No broad effects/stems matrix.

CORE-FIX-07 and ANA-002 track this change; full Sync musical acceptance remains open until the actual corrected session. CORE-FIX-01 remains open independently. Hardware/headphone gates are separate.

Skills applied: use, debug, dec-quality-testing, dec-software-principles, dec-accessibility, dec-norman-principles, claude-codex-handoff.
