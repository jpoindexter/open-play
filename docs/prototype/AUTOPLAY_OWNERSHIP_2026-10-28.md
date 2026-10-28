# Core DJ order and Autoplay ownership repair

28 October 2026. Existing core objective retained. Goal tool reports paused; user's instruction to continue authorizes this work, not a new or completed objective.

## Core-first board order

Core now begins with CORE-001 → CORE-FIX-45 → Sync ownership/pop (01) → alignment/stalls (07) → queued Sync/MASTER defects (44/43/42) → resource stability (AUD-006) → ordinary transport/load/Sync/grid and persistence. Other active core cards remain below these. Completed core evidence cards are at the bottom of the same list; none archived or reopened.

UI-DS-01 and UI-TOOL-01 moved Core → Next. Reference catalogs ANA-RB-01, LIB-RB-02 and REF-RB-01, plus optional custom colors, moved to Later. AI/fingerprint/phrase/vocal/Automix work stays Later. Metadata/artwork, key reliability, library search/crates and essential toolbar/settings usability lead Next. Existing controls are retained regardless of card placement. Deferred controller/headphone/listening gates stay visible in Blocked / unknown.

Final board readback: **206 cards / 17 complete**, one new defect card, no closures. Original descriptions/completion/archive states preserved except the explicit parent status update; near-limit DEK-002 received an exact-readback linked comment rather than overflowing/replacing history. [Receipt](../delivery/CORE_DJ_ORDER_2026-10-28.json).

## Reproduction and root cause

The old onEnd handler awaited next-track load, then invoked Play as a toggle without checking whether the user had issued a newer command. Actual extracted End/Play/cancellation handlers with controlled decode/audio/presentation reproduced two failures: canceling a newer manual start and restarting after manual Play→Stop during loading. Baseline 3/5 pass, 2 fail; raw output retained under ignored local-evidence/autoplay-ownership-2026-10-28/.

A per-deck request identity now owns pending Autoplay. Manual Play and existing load/eject/Stop cancellation revoke it synchronously; only the current request may complete, and finally cleanup cannot remove a newer request. No new dependency/module/framework or audio algorithm. New lifecycle logic stays beside the existing Play-request owner; broad legacy modularization remains MOD-001, not a claim that app.js is under300lines.

## Executed evidence and limits

- Same focused actual-handler file after repair: 5/5. Existing failed-load, Autoplay-OFF and ordinary next-start behavior retained.
- Three extracted Play/cancellation fixture files required the new collaborator. Their affected checks ran once: 22/22. No full suite, broad soak or repeated clean Sync test.
- One isolated workspace, four-deck Compact, new loopback origin18849 and separate browser profile. Actual workspace buttons, AudioEngine and End callback, controlled buffer-completion boundary, generated demo audio.
- Manual Play witness: playing true before/after completion; start token4 unchanged; position0.03644→0.12932seconds; same voice and play count.
- Manual Stop witness: stopped before/after completion; token9 unchanged; position0.01902seconds unchanged; no voice or queued restart.
- Both cases retain217observed controls/previews and all8materialized library preview images. Master volume0 asserted before/after; all decks stopped at cleanup. No owner audio/profile/recording/session used.
- Browser navigation returned to about:blank and owned server stopped. No desktop build or main candidate interaction.

The browser's default configured test executable was absent; switched to installed official Google Chrome in a fresh headless muted profile. No dependency download, sandbox bypass or desktop-input workaround.

This does **not** establish natural-end timing, music/listening, packaged-native behavior, full layout/control breadth, headphone/controller acceptance or Sync-pop/stall resolution. Current desktop0.1.94 is unchanged. [CORE-FIX-45](https://trello.com/c/wIgeBekE) stays open for relevant desktop/live acceptance. Parents DEK-002/014 retain their broad criteria.

Next: integrate this verified source slice into the next justified immutable desktop candidate; use the deferred practical session for affected current-native transport and Sync outcomes. Do not repeat unrelated EQ/Cue/manual-mix checks already accepted in0.1.53.

