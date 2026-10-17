# Ordinary scratch cache: independent lifecycle review

Reviewed 2026-10-17. Scope: the per-loaded-deck raw PCM cache, its ownership in `AudioEngine`, and its interaction with the real scratch wrapper/kernel. No production files were edited by this reviewer. Native development remains gated on prototype approval.

## Result and evidence boundary

Two practical defects were reproduced before the parent corrections: an inactive cache error rewound a paused deck, and retirement of an older raw voice paused/disconnected a fresh gesture using the same cached transport. Both desired-state regressions now pass against the source hashes below.

Executed locally:

| Command | Result | What this establishes |
| --- | --- | --- |
| `node scripts/test_deck_scratch_cache_review.mjs` | 12 checks passed, 0 failed | Actual cache + engine + wrapper + PCM kernel under controlled decoder/preparation gates, ordered port ACKs, graph connections, and a retirement timer. |
| `node scripts/test_deck_scratch_engine_races.mjs` | 7 checks passed, 0 failed | Previously reproduced raw gesture ownership/error/global-stop races remain covered. This file was not changed for the cache review. |
| `node scripts/test_deck_scratch_engine.mjs` | 10 checks passed | Parent-owned controlled engine suite, including its intentionally revised paused/preparation retention expectations. This execution is not an independent review of its live-DSP assertions. |

The controlled host executes the production wrapper and kernel and uses real structured-clone PCM transfers. It substitutes AudioContext/node scheduling and graph objects. These results do **not** establish browser first-touch readiness, audible device silence, live-keylock sound quality, visible preload state, sustained performance, hardware compatibility, or Serato/native parity. The app preload hook was outside this review. No browser, native app, Git, or remote actions were performed.

## Confirmed initial defect 1: inactive warm error overwrote a later paused seek

Initial reproduction: keep the deck paused at 5 seconds; preload raw PCM (whose idle kernel cursor is 0); seek the paused deck to 7 seconds; fire the actual wrapper's processor-error path. Before correction the cache retired, but `deck.position` changed from 7 to **0**. An unrelated ordinary voice could likewise have its cursor replaced by stale cached state.

Cause: the error callback restored its last observed raw cursor whenever that cache entry matched, even when the raw transport did not own the audible voice. Comparing the current track through the same mutable deck object did not establish original-load ownership.

Parent correction is at `prototype/engine.js:1014` and `1025–1030`: capture `loadedTrack`, capture `wasActive` before cache clearing, and restore the raw cursor/processing state only for that active transport and matching loaded track. Inactive warming failures retire the bad cache and report the error without rewriting a paused/live deck position.

Desired-state regressions: `scripts/test_deck_scratch_cache_review.mjs:40` preserves paused position **7** and unrelated voice position **8**; `:44` confirms an **active** failed raw source still restores its observed position **7**, removes its ownership, clears its PCM, and leaves the other deck alone. These invoke the actual wrapper processor-error callback, not a substitute error handler.

## Confirmed initial defect 2: old raw retirement stole a reused cache

Initial reproduction: complete the first raw gesture; leave its voice in the retiring-voice set while another voice becomes current; begin a fresh gesture using the same cached transport. After the fresh Begin, `stopSource()` disposed the retiring raw voice. Old cleanup unconditionally sent Pause and disconnected the shared node. The fresh Begin returned a ready owner, but the kernel was idle with no owner; a move then threw `Gesture sequence is out of range.` The observed command sequence included `end(first) → configure → begin(fresh) → pause → scratch(fresh)`.

Parent correction is at `prototype/engine.js:210–221`, `1102`, and `1113`: raw voices record `scratchOwner`; old cleanup recognizes a different current adopter or a fresh pending Begin owner; it skips the stale Pause and disconnects only that old voice's output-to-gate edges. It does not blanket-disconnect the cached node. Explicit pause still cancels request ownership before disposal. `clearDeckScratchCache` cancels a pending deck gesture before clearing (`:1012`).

Desired-state regressions:

- `scripts/test_deck_scratch_cache_review.mjs:51`: immediate old-retirement cleanup preserves owner **fresh**, and a subsequent move reaches **8** seconds.
- `:54`: the actual retirement timer fires while the fresh Begin ACK is held. The controlled port preserves response ordering. Old gates disappear, fresh ownership survives, and no blanket node disconnect occurs. This covers a delayed cleanup after adoption, rather than just checking a static adoption predicate.

## Other executed lifecycle coverage

1. Concurrent warm requests, pause, and rebegin reuse one transport and one actual PCM buffer-transfer message. An idle warm node has no output connections or audible ownership.
2. Canceling a pre-ready touch may finish warming silently; a newer gesture can reuse it. The old request's `finally` does not dispose the cache-owned transport (`engine.js:1121`). Superseding a touch during in-flight warming retains the fresh owner and still transfers PCM once.
3. Global stop during either the decoder await or worklet-preparation await prevents a later stale source commit. Tests resolve the controlled await after stop and check no cache/voice/request reappears. This does not promise immediate settlement of an external decoder that never resolves.
4. Changed track/stem identities retire old PCM; stale decoder completion and old processor errors cannot modify the replacement. Five-source preparation is checked with actual original-plus-four-stem kernel state.
5. Paused releases at both 0 and the 30-second endpoint retain prepared PCM without firing `onEnd`. A playing natural endpoint fires `onEnd` once. The production guard checks `d.playing` and active raw transport identity (`engine.js:1021`).
6. Warming failure leaves the existing ordinary voice, playing intent, and cursor available; the error phase is recorded, and a later higher-generation preparation can become ready.
7. Re-decoding the same track object with a different original buffer must replace the cache. An in-place array replacement of one stem reference also invalidates it. Actual kernel sample checks distinguish original **0.2 → 0.3** and vocal stem **0.03 → 0.04**, so this is not solely an identity-map assertion.

Paused PCM retention is intentional and was not classified as a leak: a retained cache is nonaudible and reusable until explicit source/stem/eject/global-stop/error retirement. `DeckScratchCache` owns preparation separately from a touch; `clear()` removes the entry and aborts/disposes in `finally` (`prototype/deck-scratch-cache.js:11–14`). Existing-reference matching includes original and per-stem buffer references (`:18–24`).

## Reviewed snapshot

The parent is continuing other engine work; these hashes identify the exact reviewed snapshot, not a claim that the whole engine is frozen.

| File | SHA-256 |
| --- | --- |
| `prototype/deck-scratch-cache.js` | `04ea486f7010df479184d629c14ea3f8cdd81ef595c5d8233c8e407890e2fa99` |
| `prototype/engine.js` | `0b61a4f9411c78254f6ec02e972cec835c4c10ddb4ce4a5d936ef57bfc6e8057` |
| `prototype/deck-scratch.js` | `0f875b8ed8a2f0b0373455e8758fe150be937fa3311a6b35142a7d15622f189a` |
| `prototype/deck-scratch-kernel.js` | `428c677a90114d6a23479ad0789825c7cd45bcaed3806fbafec32aba6a68d08c` |
| `scripts/test_deck_scratch_cache_review.mjs` | `1aed50343de12a123d404f1983da861b5cbc097abb5c45e1a88a320f5dd62f59` |

No additional defended cache defect remained in these exercised cases. Actual browser cache preload/reuse, gesture latency, routing/audio capture, and UI lifecycle remain separate acceptance gates.

Skills applied: dec-quality-testing (real collaborators and behavior over isolated maps), dec-software-principles (separate cache/gesture ownership and narrow cleanup), adversarial-verify (independent reproduced claims with source evidence).
