# Independent review: per-file Video FX and identity boundary

2026-10-17. Scoped adversarial review of per-file save/recall/automatic lookup, asynchronous ownership, invocation snapshots, metadata import/restoration, controls and incremental Worker identity. Production files and parent/agent harnesses were read only. The reviewer added only this report and [test_video_file_fx_independent_review.mjs](../../scripts/test_video_file_fx_independent_review.mjs). No browser, native application, Git or remote operations were performed.

**Two stale-write paths were reproduced and fixed by the parent.** Both were manifestations of missing ordering at the shared file-identity destination: an older Save on the opposite channel, and an older Save preceding a newer explicit import. The independent desired-state regression now passes **8/8**. No remaining defended production defect survives this bounded review. Browser pixels/UI/reload and exact Serato file-storage behavior remain separate acceptance paths.

## Destination and ownership criterion

The Open Play destination is the decoded **Video File's SHA-256 byte identity**, independent of the associated audio-track metadata. Save/Recall may validly finish when an audio key changes but the same manual/visual-only File remains loaded. Automatic replacement loading still checks its original audio/load owner. This review did not invent an audio-key requirement for a file-only preset.

New visual loads, replacement committed items, explicit cancellation, newer same-side operations and disposal must prevent stale mutation. Newer successful writes/imports for the same byte identity must survive older opposite-side completions. Unrelated file imports must not cancel a valid Save. Save uses the two channel FX slots captured at invocation; subsequent live edits are allowed. Recall must not erase a newer explicit edit of that same channel while identity is pending. No other channel/master FX, transition, overlays, File bytes, runtime identity worker or GPU state belongs in a per-file record.

## Reproduced defects and parent resolution

### Older opposite-channel Save overwrote newer same-byte Save

Initial actual mixer/store reproduction used controlled decoded sources and deferred identity requests. The left older Save captured Negative; the right newer Save captured Sepia. Both were then resolved to the same real-format byte key. Resolving the newer right operation first stored Sepia, but resolving the older left operation later replaced it with Negative and the left filename:

```json
{
  "newerInvocationFirstResult": "Sepia",
  "olderInvocationLateResult": "Negative",
  "recordName": "same-left.mp4"
}
```

Per-channel tokens prevented stale writes on one side but did not order the shared identity key across sides.

### Older pending Save overwrote newer explicit import

The second actual mixer/store reproduction started a deferred Save containing Negative, imported Sepia for that same key, then resolved the old hash. Observed:

```json
{
  "newerImportBeforeLateSave": "Sepia",
  "afterOlderPendingSave": "Negative"
}
```

These were observed stale metadata mutations, not hypothetical timing concerns or filename/audio ownership assumptions.

The parent added monotonically increasing Save/import revisions and a shared per-resolved-identity revision map. `prototype/video.js:227` captures invocation FX plus revision before awaiting identity; `:229` rejects an older revision for a key already written later; `:230` marks the successful write. Import validates/sanitizes first, merges atomically, then marks only the valid imported keys at its newer revision (`:248`–`:253`).

The converted independent regression executes the desired outcome: the older opposite-side Save returns null and the right Sepia record remains; the older Save after same-key import returns null and imported Sepia remains. Importing **another identity** leaves the pending Negative Save valid and produces both records. Thus the fix does not impose a global “any import cancels all Saves” rule. These assertions passed against the actual current mixer/store with controlled decode/hash collaborators.

## Other executed ownership and fallback checks

The same independent **8/8** run also established:

- **Invocation snapshot:** Save captured Negative before deferred hashing, a later live change to Sepia remained live, and saved metadata retained Negative. Right Gamma and master Saturation were unchanged. The edit hook deliberately does not cancel Save.
- **Recall versus newer user edit:** `videoFXEdited('left')` canceled only that channel's pending Recall; its signal aborted, the pending promise settled null and newer live Sepia remained. A later Recall was unaffected by right/master edits and applied saved Gamma only to left. The controls invoke this hook after ordinary FX changes and frame recapture (`prototype/video-controls.js:200`, `:208`); actual dialog interaction was source-inspected, not browser-executed here.
- **Cancel pending automatic hash:** the current old clip remained loaded while identity was pending; Cancel aborted the candidate's signal, the load promise settled null, the candidate URL was revoked, the old clip URL stayed valid and pending state cleared.
- **New visual load / disposal:** starting a new visual load aborted pending Save; it settled null and created no record. Disposal aborted a subsequent pending Save, which also settled null without late store mutation.
- **Genuine identity failure is a deliberate playback fallback:** after the new clip decoded and while hash was pending, the old clip remained current. A genuine Worker/identity failure then committed the decoded new clip, retained current channel FX, left identity null, preserved existing stored records, emitted explicit “Saved FX lookup unavailable” status/notification and only then revoked the old clip URL. No saved recall or fabricated digest was claimed.

The last behavior is intentional parent policy: metadata hashing must not become an additional gate on otherwise valid Video playback. “Keep old clip through pending hash” does not mean “reject decoded playback forever if the hash worker is unavailable.” Cancel/obsolete ownership still discards the candidate; a genuine current identity failure visibly falls back to current FX.

## Metadata, controls and identity review

**Metadata:** `prototype/video-state.js:95` applies `normalizeVideoFXPresets()` with the actual per-effect sanitizer and restore mode. The store reads own record/effect/parameter data, drops malformed envelopes/versions/keys, normalizes exactly two FX slots, detaches records and applies imports atomically before mutation. Its generic scalar filter is not itself the actual effect whitelist; the mixer/state-supplied sanitizer provides that whitelist. Raw Files, URLs, bytes, captures, controllers and progress are absent from the record shape. Real state tests exercise declared bounds and legacy fields, beyond the store's deliberately tiny Demo/Off collaborator tests.

**UI source path:** Save/Recall persist only after a non-null successful record; obsolete operations do not produce a success notification (`prototype/video-controls.js:143`–`:146`). Cancel is separate. The Saved Video FX dialog exports metadata only. Import waits for `file.text()`, then requires that the same input still belongs to the open current dialog before merging; it validates the format/record array and reports counts via text content (`:150`–`:164`). Pending/status button enablement is derived from current slot/operation ownership in the mixer. These handlers were read; no browser control or actual download/import was executed by this reviewer.

**Worker identity:** the public wrapper accepts real Blob/File intrinsic branding, validates signal/callbacks, owns one module Worker per call, validates monotonic bounded byte progress and final digest shape, and removes listeners/handlers and terminates its worker on success, error or abort. The core retains one incremental hasher and reads at most one 1MiB Blob slice per iteration using captured intrinsic methods; abort checks surround reads/progress. Own fake `size`, `slice` or `arrayBuffer` methods cannot redirect reads. The Worker has one hash request and forwards real progress/result; the wrapper's termination handles cancellation. No whole-file/main-thread hash fallback or identity cache is hidden in the public helper.

No new defended failure was found in those reviewed paths. An advisory scan with zero known vulnerabilities is neither a behavioral test nor proof of cryptographic/security completeness. The [dependency review](../research/VIDEO_IDENTITY_DEPENDENCY_REVIEW.md) records exact-version provenance and its verification limits; this reviewer did not repeat network/advisory scans.

## Reviewer-executed checks and parent evidence boundary

- `node scripts/test_video_file_fx_independent_review.mjs`: **8/8**, exit 0. Actual mixer/store, controlled decode/frame/hash/pipeline collaborators; includes both fixed stale-write paths, unrelated import, invocation snapshot, Recall edit cancellation, Cancel settlement/cleanup, graceful identity failure and new-load/disposal abort. **No real browser hash/decode/pixels/UI/storage.**
- `node scripts/test_video_fx_presets_runtime.mjs`: **13/13**, exit 0. Additional actual-mixer controlled lifecycle checks: same-side stale hashes, replacement/automatic-load ownership, explicit target reset, audio-only metadata changes, caching, cancellation, disposal and no-match behavior. **Controlled identity is not real hashing.**
- `node scripts/test_video_fx_presets.mjs`: **15/15**, exit 0. Pure store validation/atomicity/detachment with a small Demo/Off sanitizer. **Does not alone establish the actual application's FX sanitizer.**
- `node scripts/test_video_file_identity.mjs`: **13/13**, exit 0. Actual Node Blob/File incremental reads against independent Node crypto/published vectors, intrinsic method/brand behavior, chunk boundaries, abort/progress and controlled Worker-wrapper lifecycle. **A controlled Worker is not actual browser Worker execution.**
- `node scripts/test_video_state.mjs`: **28/28**, exit 0, including new actual declared per-file FX metadata and malformed/accessor/future-version cases. **Not browser localStorage/reload.**

The parent-owned [video-file-identity-browser-results.json](video-file-identity-browser-results.json) was read: **10/10, 0 failed**, covering actual module Workers and synthetic original Blob/File bytes. This reviewer inspected its counts/scope but did not run that browser path. It does not establish per-file save/recall UI, real video decoding or GPU acceptance. Parent video acceptance was pending during this review; no complete per-file/browser parity claim follows from the controlled checks.

## Reviewed production/test snapshot

| File | SHA256 |
|---|---|
| `prototype/video.js` | `2977c7a5ac5cebb9113f7009805880c1e39f54272ed83e6c2cc7d6e7242738dd` |
| `prototype/video-controls.js` | `289482ac14b3044fe62026c47524adad558215953ccacede55aa3232c4dfd351` |
| `prototype/video-state.js` | `2ce722ae9211bc5e14f81af54a8e28e64b415ac2f31b42fae1f33dc72c8118ec` |
| `prototype/video-fx-presets.js` | `e947ffa6e1a19cf96409cd4efc8f5d866db9b01b757b994ab0dd530de4251900` |
| `prototype/video-file-identity.js` | `23a02242f9e6094973dd3a33ab74eb3cc8f85de2911da8e500c26cf45493d8f7` |
| `prototype/video-file-identity-core.js` | `ec6bd28b86f29e7b3a473579c4eb65ab6039e27fd15ed83e505cd7a6fbd167ef` |
| `prototype/video-file-identity-worker.js` | `8c661116594f4b6627ee8b641c22e2401d6f3efdba4225d91a47f5aaba1b661e` |
| `scripts/test_video_file_fx_independent_review.mjs` | `e65fecfbad23eba2e2db328dd8402f279ce7886d57d70353e3846ed72a8b91ab` |

Scoped review complete and reviewer-owned files frozen: two reproduced stale-write paths fixed by parent and independently re-executed at controlled actual-mixer/store level. No remaining defended production findings in this scope. Actual UI/media/persistence, performance, reference format/interoperability and native hardware acceptance remain separate.

Skills applied: adversarial-verify, dec-quality-testing.
