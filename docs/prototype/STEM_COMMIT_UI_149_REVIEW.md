# Actual Prepare screen at the final Stem handover — checkpoint 149

18 October 2026. **The actual Prepare screen now distinguishes cancellable activation from its final committed handover. The corrected local-cache mixed-deck workflow and four rendered audio channels pass their declared scoped criteria. Full Stems/keylock, musical quality, native/hardware and Serato parity remain open.**

## Reproduced UI failure

The baseline is production `af1e8a5078f7f974468f8deafe5361ec9d40197b`. One deck uses live keylock and the other ordinary playback, both at rate 1.1 on the same owned eight-second stereo 330/550 Hz tone. The actual Prepare control calls the actual local API, reuses completed SCNet-large job `a2877adfbffa4ece8ec544451917a589`, downloads/decodes its four real Stem exports and calls the production engine. No model inference is started for these runs.

The first preparation is cancelled by the actual Cancel button during the live bank's warm-up. Cancel is enabled and both original voices/absent prepared cache are preserved. On retry, a diagnostic wrapper around the actual cache's `set` records the final commit and queues an observation microtask; it returns the original result and does not change preparation, cache or scheduling. During the existing future handover, the baseline still shows “Activating separated audio…” with Cancel enabled. Clicking it generates one actual click event and aborts the job's signal, although the already committed handover completes and the screen subsequently says Ready. This is a reproduced misleading affordance, not an inferred race.

The baseline is UI-only: its whole workflow and exact source capsule are retained, **with no PCM captured**. It must not be presented as an acoustic failure. The prior checkpoint 148 has a separate retained first-pad audio failure and correction.

## Production change

- The engine provides an optional `onCommitted` notification after the final cache/voice commit and rollback scope, before waiting for the audible handover. An observer cannot throw an already committed activation back into rollback.
- The preparation adapter marks that job committed and reports “Finishing audio handover…”. A direct late cancellation request returns `false` without aborting its signal or deleting completed cache files. Cancellation remains available before this boundary.
- The actual panel uses a native disabled Cancel button only for that final status. Prepare and moving prepared files to Trash remain disabled while work is active. Ready restores them. A subscriber attaching during the handover receives the current status; reopening the panel uses that same subscription behavior.

Only `prototype/engine.js`, `prototype/stems.js` and `prototype/panels.js` change in production. The DSP, Stem bank preparation/crossfade, controller mappings, inference service and native package do not change. Existing warm-up Cancel is not disabled by the new, narrower final-phase rule.

## Actual corrected workflow

The same owned harness runs the actual Prepare/API/cache/decode path, cancels once during warm-up, retries, observes commit, attempts the actual disabled button, then reaches Ready with both decks playing. At commit audio time 1.555736961, the screen says “Finishing audio handover…”, all three preparation controls are disabled, the attempted Cancel generates zero click events and the activation signal stays un-aborted. The scheduled cutover is 1.655736962, the awaited engine call returns at 1.677641723 after the ten-millisecond fade, and the UI is observed Ready at 1.689251701. Cancel, Prepare and Trash are then restored. The live voice is retained; the ordinary voice is replaced as intended.

This corrected run also captures both actual per-deck stereo monitor buses after EQ. The capture begins **after** the earlier warm-up cancellation. It includes retry preparation, final handover, actual four-pad mute/restore on each deck and Stop. Cancellation's current evidence is the UI/owner/cache state; do not claim this recording contains that earlier cancellation. Physical destinations remain muted.

| Channel | Minimum 10 ms RMS ratio before mute | Maximum adjacent jump | Mute / Stop peak |
|---|---:|---:|---:|
| Live deck left |0.9766462263|0.0162492130|0 / 0|
| Live deck right |0.9771965035|0.0269684885|0 / 0|
| Ordinary deck left |0.9859532565|0.0177542558|0 / 0|
| Ordinary deck right |0.9959477161|0.0295806555|0 / 0|

All four channels retain 176,400 finite/hash-checked frames at 44.1 kHz in 1,379 contiguous quanta, with zero pre-mute near-zero runs. Continuity limits stay ratio ≥0.85, jump ≤0.03 and near-zero duration ≤1 ms. The fixed early baseline is capture+50–150 ms; continuity is inspected from capture+50 ms until the actual mute operation. Mute/restore use event+100–200 ms, Stop uses event+100–250 ms. Restored RMS exceeds 0.242 on every channel. Every retained sample is checked, including samples outside the named metric windows. No timing/gain/pitch fit, repaired PCM or relaxed threshold is used.

This does not repeat the checkpoint 148 immediate-first-Vocal acoustic criterion, because these actual SCNet exports do not put all signal in Vocal. It checks the real preparation controls plus continuity and four-pad routing; earlier fixtures/receipts retain their exact source identities. This is not master, speaker/headphone, exact audible cursor, musical separation, reference sonic or full native acceptance.

## Checks and artifacts

The real preparation adapter passes thirteen controlled checks, including existing activation cancellation and one new committed-cancellation/shared-subscriber case. These mock network/decode/activation boundaries; the actual browser run supplies the separate UI/service/rendered-audio evidence. No unrelated FX, source-rate or broad controller matrix is repeated.

Public evidence: `stem-commit-ui-149-initial-results.json`, `stem-commit-ui-149-results.json`, `stem-preparation-149-results.json`, `stem-commit-ui-149-source-manifest.json`, `stem-commit-ui-149.png`; strict independent analyzer `scripts/inspect_stem_commit_ui.py`. Complete raw JSON, PCM and baseline source capsule remain ignored under `local-evidence/stem-commit-149/`. Before/after source hashes match each executed candidate. The baseline and corrected harness bytes are identical; the corrected run explicitly adds `?capture=1` for audio retention. Both use the same UI criteria. The repository's private status was checked live before publishing this evidence.

## Remaining work and re-entry

Next: bounded CPU/memory observations for the eighteen-channel layout, including overlapping decks and repeated cache generations. Accounting snapshots exclude opaque WASM heaps, decoded-buffer aliases, browser overhead and GC behavior; they alone do not prove process memory or audio deadlines. Continue other content/model/cache transitions, retained musical reconstruction failures, transport/reverse/loops/mapped paths/Stem Slip/scratch and native/physical/reference acceptance. Context suspension/closed-output errors and final-phase panel close/reopen remain separate acceptance cases; the shared-subscriber unit is not a browser reopen execution.

The full goal remains 110 feature groups, 522 requirements, nine beta deltas, 26 release checks, all 55 extended effects and actual Stems/keylock. All full-parity flags remain false. Factory mapping coverage stays 19,252 assignments across 145/197 definitions; Hercules 356 assignments/18 unresolved. Official Serato source authentication and Alternative mapping author/project labels remain distinct from runtime/physical compatibility. Frozen desktop 0.1.23, tested 272 mappings, launchers and the user's main port 8768 remain untouched; no hardware capture/output or packaging occurs.

Build plan, model plan, private Trello and Claude handoff remain current. STM-001 recommendations remain Codex `gpt-6.1-sol`/high and Claude `claude-sonnet-5`/high; STM-003 Codex `gpt-6.1-sol`/xhigh and Claude `claude-opus-5`/high. These are preserved planning metadata, not a fresh model-account availability check or launch. Full Claude audit remains unlaunched and the complete original prompt stays the byte-exact handoff suffix.
