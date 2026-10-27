# Pending grid-dialog ownership — 27 October 2026

CORE-FIX-16: https://trello.com/c/qybCEzDj . Preserve controls, library waveform previews and existing grid transaction semantics; no DSP, timing or layout change.

## Reproduced failure

The actual editor handler accepted two Save submissions while its grid realignment callback was pending. Dismissing the editor and opening Setup let the old completion close Setup. A focused actual-source error case also wrote into a newer grid editor’s status. These are dialog ownership defects, not evidence of a Sync-pop cause.

The existing isolated session-safety harness now has a single pending-grid button. It invokes the actual editor and engine callback, then deliberately holds completion AFTER the real callback. Before repair: two transactions, Save enabled, replacement Setup closed. After repair: one transaction, Save disabled while pending, replacement Setup remains open. A subsequent ordinary Save closes its own editor correctly. Generated fixture tracks remain stopped with no queued playback; normal desktop profile and original music were untouched.

## Small repair

Reuse the existing Track Details local saving flag/disabled-button pattern. Capture original Save/status nodes. Completion checks the original Save node’s connection before closing; the shared modal-body wrapper remains connected across dialogs and cannot prove ownership. Errors write to the captured original status. Validation, persistence warning/retry, marker copying, realignment and targeted waveform/library refresh stay intact. No new dependency, abstraction or runtime module. The existing13-line grid transaction helper is unchanged; panels.js remains a tracked legacy size exception under MOD-001.

## Verification and limits

Nine focused actual-source editor/helper checks pass: the six prior transaction/failure/validation cases plus duplicate submit, replacement-dialog close and replacement-status ownership. Corrected baseline fails all three ownership cases without cancellations; repaired checks pass9/9. An earlier fixture awaited the held duplicate before releasing its own gate and canceled three tests; that fixture mistake is retained privately and is not product evidence.

Actual isolated GUI red→green above is executed, including the subsequent normal Save. The callback hold is controlled diagnostic scheduling, not measured native latency, audible phase, pop/stall acceptance or a physical held gesture. No full suite, clean soak, controller or listening session was run. Native delivery identity/startup is recorded separately. CORE-FIX-16 remains open for exact native held/playing acceptance; CORE-LIVE-01 https://trello.com/c/yJ8r9kCD groups owner work for later today.

Receipt: grid-dialog-ownership-2026-10-27.json . Raw traces/screenshots and the ungraded fixture cancellation stay in ignored local-evidence/grid-dialog-ownership-2026-10-27/.
