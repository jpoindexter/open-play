# Final bounded persistence and parity-claims review

2026-10-17. Read-only production review. No new app tests, result overwrites, UI/native actions, devices, dependency changes or Git mutations. Only this report was authored.

**No additional concrete dangerous regression or false full-parity claim was established in the reviewed diff and current audit.** This is a bounded source/evidence-consistency review, not full Serato equivalence or new end-to-end acceptance.

## Exact reviewed source

| File | SHA-256 |
|---|---|
| `prototype/app.js` | `221131cff9da50c199180f951466ded89750c79f98d095494572625e831fc5a5` |
| `prototype/engine.js` | `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf` |
| `prototype/panels.js` | `2063234fa4d209424ec94df373fca9d66eec23cc917302a8ee8dc27ee4b92d89` |
| `prototype/local-audio-library.js` | `38814be027c5a4e614d972ffd814df9760106ca27e374a288a0ccc3d6bca0a21` |
| `docs/research/CURRENT_PARITY_AUDIT_20261017.md` | `2755ea30a7773f5c009e082b0f4cc3e3546cb2a2b1a0b07d1573907984ffad43` |
| `docs/research/CURRENT_PARITY_AUDIT_20261017.json` | `812d8ee336603384c230580465b31cb6fdcc72bd669f2890c7e2a5488cf25cba` |

## Persistence conclusions

- **Code-path:** the write boundary remains one readwrite transaction across catalog and media, resolved only on completion; synchronous errors abort it (`local-audio-library.js:26–45`). No delete or remote upload was added. Hash/size verification precedes restored File reconstruction (`local-audio-library.js:47–55`). This review did not rerun real transactions.
- **Previously executed controlled checks, re-read against current hashes:** the saved 12/12 report matches all four reviewed production hashes. It covers blocked/timeout/version-change/close ownership, late upgrade aborts, lazy engine reads, and corrected retry restoration. The original failing retry report remains preserved. No claim that these controlled callbacks themselves prove browser durability is accepted.
- **Code-path:** `restoreLocalAudio()` hydrates missing IDs and preserves existing in-memory tracks (`app.js:136–145`). Retry re-reads the catalog and separates restore/save warnings (`app.js:864–877`), so the earlier zero-session warning-loss defect remains corrected. Serialized import batches (`app.js:859–863`) avoid duplicate construction within those batches. Concurrent retry/import last-intent ordering and repeated lazy-read coalescing remain broader unverified behavior, not established defects.
- **Code-path:** the engine's change is limited to lazy `readFile()` fallback before existing decode/cache logic (`engine.js:127–136`). It does not intentionally rewire audio buses. This source observation does not automatically transfer the old desktop audio proofs.
- **Saved real-browser evidence, not independently rerun here:** the 13/13 storage report pins current store hash and identifies quota failure as injected inside a real transaction. Main-UI observation pins the current app/engine/panels/store hashes and distinguishes WAV playback from MP3 catalog restoration. The entire 17.76-second master file was decoded, with the additional 1–3-second 330/550 Hz inspection explicitly bounded. This supports the narrow browser reload → lazy restored WAV load → playback/capture path. It does not prove native quit/reopen, MP3 playback, actual disk exhaustion or crash recovery.

## Claims audit

- The audit explicitly withholds full parity (`CURRENT_PARITY_AUDIT_20261017.md:3`, `:30`) and separates old a8fe82e/desktop 0.1.3 proofs from persistence WIP (`:5`, `:20`). JSON contains 110 groups, 522 requirements, nine separate provisional beta deltas, zero full-feature passes and zero full-requirement passes. Its classification counts are evidence categories, not percent completion.
- Saved evidence and current static inventory are distinguished from fresh runtime behavior (`CURRENT_PARITY_AUDIT_20261017.md:7`, `:14`). Installed/latest-version inventory completeness is explicitly unfinished (`:18`, `:26`). This review did not independently revisit the official website or the reference app.
- The postmaster capture is explicitly distinguished from unmet documented pre-master recording behavior (`CURRENT_PARITY_AUDIT_20261017.md:22`). No reference transfer-function equivalence is established by independent processors or recordings.
- Diagnostics now describe desktop 0.1.3 as historical evidence and explicitly withhold current hardware/full-parity claims (`panels.js:1997–2000`). Files reports local-storage success, session-only failures and retained original-file advice; copy/move/relocate are still visibly fixtures (`panels.js:1365–1370`). Physical Hercules subset claims remain attributed to saved user-confirmed evidence, not current connection telemetry (`panels.js:1908–1935`).

## Remaining acceptance boundaries

No native 1.4/persistence build, native quit/reopen test, full controller mapping, acoustic/latency test, all-format playback, storage eviction/real disk exhaustion, original tag/file rewrite, full metadata interoperability, exact UI match or full reference parity was established by this review. Existing original files and older desktop artifacts remain outside its mutation scope. The current audit and persistence summary retain these limitations rather than converting browser evidence into native acceptance.

Review status: complete for this bounded diff and claims check. New confirmed unresolved findings: 0.

Skills applied: use, dec-quality-testing, adversarial-verify.
