# Learnings

- [2026-10-24 resolve-shared-resource-consumers](2026-10-24-resolve-shared-resource-consumers.md) — Resolve current consumers by resource identity when a shared asynchronous subscription completes.

- [2026-10-24 separate-capture-export-work](2026-10-24-separate-capture-export-work.md) — Preserve acquisition timestamps and yield export work in encoding-aligned chunks before interpreting playback timing traces.

- [2026-10-24 retain-analysis-control-identity](2026-10-24-retain-analysis-control-identity.md) — Refresh metadata without replacing the active target control, including queued overview freshness.
- [2026-10-24 guard-sync-request-ownership](2026-10-24-guard-sync-request-ownership.md) — Equal requested rates need request identity and start-token guards.
- [2026-10-24 yield-analysis-pcm-staging](2026-10-24-yield-analysis-pcm-staging.md) — Bound source copies without retaining detachable channel views and preserve cancellation/Worker cleanup.

- [2026-10-23 bound-synchronous-async-preparation](2026-10-23-bound-synchronous-async-preparation.md) — Measure synchronous work before a preparation function returns its promise and yield proven CPU loops without changing their sample sequence.

- [2026-10-23 scope-async-metadata-refresh](2026-10-23-scope-async-metadata-refresh.md) — Resolve current visible owners after asynchronous metadata work and refresh only those owners.

- [2026-10-23 preserve-adapter-owned-nodes](2026-10-23-preserve-adapter-owned-nodes.md) — Before replacing a container, identify controls projected into it by adapters and preserve their original nodes.
- [2026-10-23 retain-library-preview-cells](2026-10-23-retain-library-preview-cells.md) — Update metadata cells by stable identity while preserving adapter-owned previews and refreshing their accessible names when metadata changes.

- [2026-10-23 batch-waveform-geometry](2026-10-23-batch-waveform-geometry.md) — Batch sibling geometry reads before canvas resizing or presentation writes, then measure the actual frame path.
- [2026-10-23 reject-late-audio-handoffs](2026-10-23-reject-late-audio-handoffs.md) — Reject audio replacements after their commit deadline and restore only metadata still owned by the rejected request.
- [2026-10-23 preserve-transport-node-identity](2026-10-23-preserve-transport-node-identity.md) — Before removing a structural redraw, enumerate its state side effects and preserve any state the frame loop does not refresh.
- [2026-10-23 guard-ancestor-visibility-writes](2026-10-23-guard-ancestor-visibility-writes.md) — Guard unchanged CSS-keyed ancestor attributes before geometry reads and verify both preference transitions and redundant-write counts.
