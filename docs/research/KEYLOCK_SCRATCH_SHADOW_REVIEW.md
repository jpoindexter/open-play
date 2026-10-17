# Keylock scratch shadow: independent ownership review

2026-10-17. Review of the actual shadow lease and AudioEngine integration. The review adds only its new controlled test, this report, and separately authorized new result JSON artifacts. It does not edit production, vendor, prior tests/harnesses, or native code. No browser/GUI/Git/remote operations were performed by the reviewer.

## Criteria and host boundary

`scripts/test_keylock_scratch_shadow_review.mjs` executes the actual AudioEngine, `KeylockScratchShadow`, raw scratch wrapper, and raw PCM kernel. Serial port ACKs, gain/history graph objects, live-adapter promises, and pull callbacks are controlled. Tests require current gesture/source ownership, no stale adoption or new command after ownership loss, exact history-gain transfer, cleanup after pause/error/end, and preservation of other decks.

This is not actual live-adapter/WASM audio rendering or native graph scheduling. It cannot establish pitch, source-cursor accuracy, inaudible shadow pull continuity, transition quality, release deadline, or hardware/vendor/native parity. The parent's separately executed browser captures remain the acceptance evidence for those behaviors.

## Initial concrete defects: 6 of 8 checks passed

Initial reviewed source hashes: engine `74434df2b0f0bca5ff66cdd1e08db54e3a3ba0cdb24a6a0cde35d3e9515b7a2a`; lease `55fb7ba9e1932fdedaa6fd192c5d3f1c43c34437c15326cf62e7045c73d0e90b`.

### Prepared silent-pull failure ignored until a dead pull was claimed

Reproduction: preload raw PCM; hold the actual raw Configure ACK after silent-pull preparation succeeds; mark that prepared pull failed and invoke its supplied `onError`; release the Configure ACK. Begin returned `{owner: "preparing", generation: 1}` and the engine committed a shadow with `ownsLive: true` backed by the failed, retired pull. No error was reported. The failure can occur after `prepare()` has returned while raw Configure/Begin ACKs remain outstanding.

Initial lease `prepare` only forwarded pull errors when `ownsLive` was already true (`keylock-scratch-shadow.js:42–44` in this snapshot). `claim` lacked a final pull/source-health guard (`:49–55`). The practical correction is to remember preownership pull failure and revalidate healthy pull, current selected live/raw source, request, source identities, and configuration before any ownership/gate mutation. This finding demonstrates invalid ownership, not measured DSP interruption from the controlled host.

### Natural live end during pending Begin resurrected expired playback

Reproduction: hold the same Configure ACK, emit the real callback supplied by `startForwardKeylock` with `type: "ended"`, then release the ACK. The callback first set `deck.playing` false and disposed the original live adapter. Begin then returned `{owner: "at-end", generation: 1}`, set `deck.playing` true again, and claimed a shadow whose live adapter was already disposed. `onEnd` had fired once.

Initial normal live-ended handling set stopped state and called `stopSource` but did not cancel the pending scratch request (`engine.js:314` in this snapshot). Initial claim did not revalidate the selected live voice. Practical correction: end processing owns cancellation of pending gesture activation, and final claim must not adopt a retired or replaced source. Preserve the ended event rather than restoring the Begin request's earlier playing intent.

The original 8-check execution had three fixture-only TypeErrors on the first exploratory run because its fake stem-history state omitted `effects`/`generations`. Those fixture arrays were corrected before the defended 6-pass/2-fail result. The fixture errors are not production findings.

Initial observations are retained in `docs/prototype/keylock-scratch-shadow-independent-initial-observations.json`, explicitly labeled a structured transcription of the actual session tool output rather than original stdout bytes or a rerun of old source.

## First corrections and remaining stale-rebase command

The parent added error retention, preownership abort, final claim validation, and normal source-end cancellation. Fresh execution against engine `f08598c9af95048fe0c6d66239d6b6da5283be4f13e0bf1cf12f8f33d23f93b2` and lease `e074109361d1d5af2b635632674c08f12a5380532204ffd29f024c0650366922` yielded **8 passing and 1 failing** checks. Exact stdout is saved in `docs/prototype/keylock-scratch-shadow-independent-stale-rebase-results.json`.

The prepared-error test now observes either a returned result or rejection before checking invalid ownership. The new valid original-error rejection is recorded, not treated as a production defect. Its original decisive assertion—no shadow owning a failed pull—remains. Natural source end now returns Begin false, leaves stopped state, and never claims the disposed adapter.

### Confirmed: superseded far-return await issued another alignment command

Reproduction: end owner `old`; force final follow to reject `FollowCoverageError`; hold the subsequent rebase `seek` promise. Start owner `fresh` on the same retained raw transport and hold its actual Begin ACK, so the lease is reserved for the newer owner but the live adapter has not received any newer follower operation. Resolve the old rebase. Old End correctly returns false, yet it issues a fresh stale adapter command: `followSeek(5.6588, {when: .55})` after the new owner was reserved.

At this snapshot `align` rechecks ownership before starting the rebase and after the second follow, but not between the awaited rebase and that second follow (`keylock-scratch-shadow.js`, former lines 114–120). A final adoption guard cannot undo a new command already sent to the shared adapter. Unlike a case where newer adapter operations cancel older operations, this controlled timing deliberately holds the new raw Begin ACK; no newer adapter operation has canceled the old rebase. The actual adapter may therefore finish it before a fresh follower starts.

Practical correction: recheck `current(owner, revision)` and closing phase immediately after awaited rebase completion, before issuing the second follow. The test asserts zero extra old alignment commands under the reserved new owner. No audible cursor or sound-quality consequence is claimed from this host.

## Other executed checks

- Five-source raw routing transfers the same five stem gains from live to raw and back exactly once. Four existing history-output connections remain single; old raw cleanup removes its node routes without disposing the surviving live adapter or aborting its controller.
- Old delayed alignment cannot adopt over a fresh Begin on the same shadow. The fresh raw kernel owner, engine request, and lease owner remain aligned.
- A pending reused Begin followed by End/new Begin retains the newest owner under ordered delayed ACKs. The observed protocol includes a duplicate old End from cancellation; it does not revive that owner or displace the newer gesture.
- Pause during a held far rebase clears lease/request/voice and disposes live/pull. Resolving the old promise afterward cannot adopt.
- Track/config changes plus pause prevent a stale alignment from overwriting a replacement cursor of 11 seconds.
- Active pull error clears only its deck. Another deck remains selected; a late error on the retired lease cannot affect a replacement voice/cursor of 13 seconds.

Raw wrapper and kernel remain respectively `0f875b8ed8a2f0b0373455e8758fe150be937fa3311a6b35142a7d15622f189a` and `428c677a90114d6a23479ad0789825c7cd45bcaed3806fbafec32aba6a68d08c`. Correction/re-execution of the stale-rebase case should be appended below; the retained failing stdout must not be replaced by a passing run.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.

## Final bounded review result: 9 of 9 controlled checks pass

The parent added the ownership/closing check immediately after awaited return rebase and before issuing another follow. Fresh `node scripts/test_keylock_scratch_shadow_review.mjs` execution now reports **9 passed, 0 failed**, saved as exact stdout in `docs/prototype/keylock-scratch-shadow-independent-results.json`.

The previously failing stale-rebase test now observes zero extra old follow commands while the fresh raw Begin ACK is held. Fresh owner remains current and becomes ready when its ACK is released. Prepared pull failure now records the original error and never owns a shadow backed by that failed pull. Natural source end cancels pending activation, leaves stopped state, and never claims the disposed live source. The other six previously passing cases continue to pass.

| Final reviewed artifact | SHA-256 |
| --- | --- |
| Engine | `f08598c9af95048fe0c6d66239d6b6da5283be4f13e0bf1cf12f8f33d23f93b2` |
| Shadow lease | `6e4f0d8e108705676944722ea625959b4477fb40c91c8024a3d7d48b24c6ed31` |
| Independent test | `594a9ffd8904b5c086e54ca8876b176942edb9cf170149b01656f97bbb81b117` |
| Fresh 9/9 stdout JSON | `37ce8c5757ab1a2bbe76da4f2f45142e3d9c32adb21370e6d436ffaef6916771` |
| Preserved stale-rebase 8/9 stdout JSON | `23ba997d4b389250f6c0da2c54c03bd20d2e1c8a7c8afb71454d609c5a2c9737` |
| Initial 6/8 observation transcription | `b7a957b4037e8cdc757e0c0c5d555ccf4982adefb9aaf77b523174c2c0e513fc` |

The bounded ownership review is frozen here to support the user's priority of an early hands-on mixing test with the existing stack. No further feature expansion was introduced. These nine controlled checks do not replace the parent's current-source browser regression or hands-on test; pitch, acoustic quality, cursor accuracy, shadow pull continuity, and real latency remain separate evidence. The native-app approval gate is unchanged.
