# Local audio persistence independent review

2026-10-17. Bounded review of `local-audio-library.js`, the app import/restore/retry path, `AudioEngine.buffer`, and Files status. No production edits, GUI/native operation, physical devices, Git mutations, or dependencies added.

## Final bounded result

**12/12 controlled checks passed; the reproduced retry-state defect is resolved in the current source.** Final store SHA-256: `38814be027c5a4e614d972ffd814df9760106ca27e374a288a0ccc3d6bca0a21`; app SHA-256: `221131cff9da50c199180f951466ded89750c79f98d095494572625e831fc5a5`. Both hashes were unchanged during the run. The result is in `docs/prototype/local-audio-independent-results.json`, with the red candidate retained as `local-audio-independent-failure-results.json`. It is not browser IndexedDB or native restart acceptance.

### Historical confirmed retry-state defect, resolved

At reviewed app SHA-256 `8a909e187343471b33757e341b1129c96b565dd3bb5f9af2750aa7f36f1384db`, startup restore catches a failed `localAudio.list()` into the shared error (`app.js:135–142`). The retry function only visits tracks that already have session File bytes (`app.js:865–868`) and then clears the shared error whenever no session-only rows remain (`app.js:869`).

**Executed controlled repro:** extract the actual current `retryLocalAudio()` function, start with `tracks:[]` and the startup blocked-database warning, then invoke Retry. It returns zero saves, invokes no save/list operation, and changes the warning to `null`. A previously saved catalog that could not open at startup remains invisible while its failure indication disappears. The function test fails the requirement that recovery not silently erase an unresolved restore failure.

The parent corrected this by introducing `restoreLocalAudio()` and separate restore/save errors. Retry now retries catalog restoration; hydration skips existing content IDs, preserving session tracks and edits. The current-function controlled regression confirms the blocked error remains visible when restoration still fails. Recovery adds missing saved IDs without eagerly reading media, retries saving session bytes once, and does not duplicate rows on repeated Retry. Invalid catalog metadata retains its restoration warning. These are controlled-function checks, not actual app UI/reload proof.

### Passed controlled checks

- Blocked open rejects, a retry can open, and a late successful result from the blocked request is closed without replacing the newer connection.
- Timed-out open rejects; late old success is closed while the retry remains usable.
- Version change closes the old connection and the next operation opens a new one.
- Closing during a pending open rejects its eventual success and closes that connection.
- Closing an owner with an active transaction aborts and settles the pending operation.
- Actual `AudioEngine.buffer()` lazily invokes a restored `readFile()` once, decodes once, attaches the File and caches decoded audio; subsequent reads use the cache.
- A failed restored File read propagates before decode and leaves neither File nor decoded cache falsely populated.
- Retry preserves a still-failing catalog restore warning even if there are zero session tracks.
- Successful retry restores missing IDs lazily, preserves current duplicate edits and File ownership, and does not duplicate rows on another retry.
- Invalid saved metadata keeps its restore warning.
- Late upgrade callbacks after blocked opening or owner close abort their upgrade transaction before creating stores.

The store lifecycle tests use controlled IndexedDB request/transaction callbacks. The decoder tests use controlled File/decoder collaborators. They verify ownership and app control behavior, not actual storage or audio output.

## Source conclusions and remaining proof

- **Code-path:** `save()` writes catalog and Blob media within one readwrite transaction across both stores (`local-audio-library.js:37–45`). Its Promise resolves on transaction completion and rejects on abort (`local-audio-library.js:26–34`). This is the correct atomic boundary, but the parent-owned actual IndexedDB tests must establish real commit/rollback behavior.
- **Code-path:** `list()` reads only catalog metadata (`local-audio-library.js:36`). Actual audio is retrieved on demand, reconstructed only after SHA-256/size/identity verification (`local-audio-library.js:47–55`), then decoded by the engine (`engine.js:127–136`). Startup does not intentionally decode the whole library.
- **Code-path:** original content identity is SHA-256; catalog and media keys are shared. Duplicate app imports are serialized with `importTail` (`app.js:859–863`). Saves strip transient File/readFile/storage fields. No store delete or remote transport is present in this module. This does not claim arbitrary imported metadata validation or full browser-storage durability.
- **Code-path:** a failed save marks that imported row session-only and retains its in-memory File (`app.js:864–867`). Files exposes a visible status and Retry. Parent must run the real failure → retry → reload/play path, including the corrected restoration-failure recovery.
- **Not established here:** real quota exhaustion, actual IndexedDB transactions, browser reload/native restart, edited metadata persistence when localStorage itself fails, simultaneous import/retry last-intent ordering, storage eviction, long-session memory, or acoustic/device behavior. Existing files are not intentionally deleted by this change.

Run `node scripts/test_local_audio_review.mjs` for the controlled checks. Each report stores start/end hashes for all four reviewed sources to distinguish concurrent parent edits.

Skills applied: use, dec-quality-testing, adversarial-verify.
