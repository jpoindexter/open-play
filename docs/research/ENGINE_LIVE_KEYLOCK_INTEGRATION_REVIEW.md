# Focused engine live-keylock integration review

17 October2026. Read-only production review; only this new report, its raw result and the new focused test were written by the reviewer. Parent owns ongoing engine changes and actual browser integration acceptance. No native/reverse/loop implementation work.

## Current outcome

[Fresh focused regressions](../../scripts/test_engine_live_keylock_review.mjs) executed **7/7** against identical start/end engine SHA256 `59df85253c4a731559e6d52bb2e1ca7a4d2797121016172a9fe4a1aeb6fc2e36`; [raw result](ENGINE_LIVE_KEYLOCK_REVIEW_NODE_RESULTS.json). These execute actual AudioEngine orchestration/routing/retirement methods with controlled adapter, graph, clock and acknowledgement collaborators. They do **not** establish actual integrated browser audio, UI, physical hardware or production acceptance. The parent may change this WIP after that hash.

No remaining reproduction of the corrected handoff/configuration/history issues below was found in these7 cases. One concrete scheduling concern remains: FX tempo is applied at the command acknowledgement rather than the audio rate's future output boundary. That is a control-path finding, not a newly measured audible artifact.

## Remaining scheduling concern: FX tempo can lead audible rate

In the live `setRate` branch, `live.update({rate})` returns an acknowledgement with `ack.when`. The method immediately sets `nodes[index].channelBpm` and awaits `applyChannelFX`, then updates `fxState` and `configureFX`. It does not wait for, or schedule these parameter changes at, `ack.when`. The actual adapter intentionally changes audio rate at that future context time.

The controlled test observed a240BPM channel-effect update at context time10 while its accepted rate-change boundary was10.17. The exact timing depends on queried adapter latency and RPC duration; this is not a universal170ms offset. With beat-synced channel/unit effects active, effect timing can temporarily use the new tempo while heard source playback still uses the preceding rate. The standalone adapter8/8 and earlier static FX checks do not cover this integration boundary.

Smallest correction to evaluate: make FX timing follow the owned live clock's **effective** rate at its scheduled boundary, or schedule effect parameters for that same AudioContext time if the effect API supports it. Any pending effect update must retain voice/track/request ownership and must not let an old rate callback overwrite a newer voice. Do not substitute an unowned wall-clock timeout for an audio-clock boundary.

Acceptance: with an active beat-synced channel/unit effect, capture a known source marker/modulation and the effect timing through a live1→2 or1→1.25 rate change. Assert the old tempo remains effective before the accepted audio boundary and the new tempo follows the actual new-rate interval. Keep this distinct from requested BPM in the UI. Parent's integration harness must determine the audible size/importance; no effect implementation changes were made here.

## Corrected paths verified at the reviewed hash

1. **Before-handoff clock:** while the new adapter is still held and the old source is audible, `position()` uses `handoffBefore`. `voiceClock` composes an existing bridge instead of replacing it with a muted candidate's held cursor. Controlled preparation advancing context10→11 reports11 before the future11.17 handoff.
2. **Old effective rate:** new target position uses the old voice's piecewise `voiceClock(when)`, rather than extrapolating with optimistic/new `d.rate`. The controlled old1x/new requested2x case targets10.17, not10.34.
3. **End acknowledgement:** helper copies `ack.playing`; a position clamped to original duration with a nonplaying acknowledgement does not set the deck playing true.
4. **Pending configuration ownership:** actual outer `start` plus `setRate`/`setPitch` during processing creates owned replacement requests; old uncommitted candidates dispose, latest starts2x/+12. This matters because a direct helper call bypassing `d.processing` is not the production pending-start path.
5. **Independent commands:** live rate update sends only `{rate}`; key update sends only `{keylock,semitones}`. Expected AbortError from superseded work is swallowed. The test records those exact requests and latest fields.
6. **Legacy history ownership:** the actual legacy5-source constructor sets `stemHistoryState`; `routeOrdinaryVoice` transfers its one existing history-output gain group to the new voice, emptying the retiring owner's gain array. The controlled graph retains exactly one output connection per history, preventing the earlier duplicate-output path. This structural check still needs the parent's actual5-source handoff amplitude/history test.
7. **Rapid restart:** a new preparation waits for an existing scheduled retirement instead of prematurely deleting its still-audible grandparent. At context10.01, no second candidate is created and the grandparent remains alive; after context advances past its retirement, creation proceeds. The composed old clock remains authoritative while waiting. The5s wait timeout is explicit prototype policy and should remain a failure, not permission to cut old audio early.

These corrections arose during the review. Earlier controlled snapshots demonstrated the defects, but those earlier snapshots are not claims about the current reviewed hash. The fresh test re-exercises the corrected actual engine paths rather than treating source inspection alone as acceptance.

## Stop/pause, route and ownership checks

`stopSource` retires current and scheduled old voices; `disposeVoice` aborts the live owner and terminally disposes its adapter. Adapter disposal synchronously gates its outputs before asynchronous acknowledgements finish. Per-voice history ownership avoids disconnecting the new owner's transferred history output gains. External source gates act before shared stem history, preserving the existing histories/gain/FX routes through a timed handoff. Ordinary channel crossfade remains the standard path; no `stemSlipTransport` alias was introduced.

These are source-path observations plus the controlled retirement/history tests above. Real five-source mute/FX history capture, candidate-error while old audible, pause/eject/global stop during pending preparation, shared other-deck survival and the timed gain ramps still require actual integrated browser evidence. Disposal of11 diagnostic ports in the separate lifecycle harness is not proof that every engine-owned retirement path is correct.

## Adapter acceptance remains separate

Parent's [actual standalone adapter result](../prototype/keylock-live-adapter-browser-results.json) is8/8, completed true, no fatal errors, source module `a96cd1d244e402957b4daedb823cb2015f759d4a46df9672954b9bba1f944e78`,13.447s run. The captured onset differs by−0.004s from the requested output time; measured far-handoff low-RMS run is0ms. Actual4x refill retains3,648,000 acknowledged PCM bytes with logical window33..42.5 while position34.19. These verify the bounded adapter fixture, not this engine integration or listening quality.

The first live engine slice stays forward, unlooped and outside selected-stem Slip. Reverse/loop/Stem Slip remain existing buffered paths, not closed parity gaps. Rate.25..4,±24 requested/effective pitch,1..8 channels, bounded SRC policy and whole decoded input memory remain visible limitations. No native app approval or native work is implied by browser acceptance.

Skills applied: use, dec-software-principles, dec-quality-testing.


## FX clock amendment:9-case controlled review at9004

This section supersedes the prior active-live setRate ACK-tempo concern at the newer reviewed code. The original7/7 report/result remains unchanged as its59df snapshot. The focused host now implements the adapter's public `stateAt(at)` as an actual scheduled piecewise clock rather than changing its fake rate immediately. It also exercises the engine's `handoffBefore.rate` composition. The prior host mismatch was missing this new public collaborator method, not evidence that the new production clock should be weakened.

[Fresh raw result](ENGINE_LIVE_KEYLOCK_FX_CLOCK_REVIEW_NODE_RESULTS.json): **9/9**, engine start/end SHA256 `9004f179934fa7570b509c915fd946bfcae3fd5c3e347b566aa8fd3a67156eb6`, identical across execution. The same7 orchestration criteria still pass, with two added clock cases. Before a new adapter's boundary the engine reports the old bridge's1x rate, and at the boundary reports the prepared2x rate.

For a live1→2 rate update, the controlled accepted boundary is10.17. At ACK time10, requested `d.rate` is2 but `audibleRate` remains1; channel and unit FX remain120BPM. A refresh one sample before the boundary remains120. A refresh at10.17 sets both channel and unit tempo240BPM; afterward it stays240. Recorded channel updates are `{at:10,bpm:120}` and `{at:10.17,bpm:240}`. Recorded unit tempo updates follow the same old/new boundary. There remains exactly one source command `{rate:2}`. Reapplying an unchanged, valid effect tempo at ACK is not counted as an extra source command or a failure. This preserves the timing criterion rather than requiring an obsolete number of effect update calls.

Parent's app tick now supplies `engine.audibleRate` to `updateFXBPMs`, which refreshes channel effects as well as unit FX. This closes the observed requested-tempo-at-ACK control-path error for an already active live voice. The controlled test invokes refresh at exact chosen context times; it does **not** establish that a real requestAnimationFrame callback arrives at the exact audio sample. rAF delay, background throttling and actual captured source/effect phase around the rate change remain quality/acceptance gaps. No sample-accurate or universal latency claim follows from this9/9.

One additional source-only edge was reported to parent: outer `start()` still assigns channelBpm from captured requested `tempo` before preparation. When rate/key input supersedes a pending live start, the old voice remains audible, so this assignment can transiently use requested tempo until app refresh restores the audible rate. It has not been measured as an audible artifact; evaluate using old `audibleRate` when an existing voice owns sound. This is distinct from the corrected already-active live `setRate` branch and should not be hidden by its green clock case.

No production implementation files changed in this follow-up; only the owned host script, new raw review result and this appended review were updated. Actual integrated browser witness remains parent-owned, with its candidate hash/count/source scope preserved separately.


## Final outer-start clock amendment at ea3d

[Final controlled raw result](ENGINE_LIVE_KEYLOCK_FINAL_CLOCK_REVIEW_NODE_RESULTS.json): **9/9**, with identical engine start/end SHA256 `ea3d2d3b26ad5f63879ca5ad03ffbc7f86270ca353baa8da77962bb47702a28f`. The preceding7-case and9004 nine-case raw reports remain preserved unchanged. The pending-configuration case now additionally records every channel FX preparation write from the actual outer `start()` path: all three are120BPM at context time10 while the old1x voice is audible, including the superseding requested2x and+12 preparations. The first two candidates dispose; the latest candidate starts with rate2 and semitones12.

The outer-start requested-tempo concern above is therefore closed at this executed control-path layer after parent changed its BPM assignment to `audibleRate(d)`. The future-rate boundary and unchanged-source-command criteria still pass. These nine tests use a controlled graph/adapter host; they establish neither actual browser audio nor sample-accurate effect timing. Parent's actual integrated browser run at9004 is a separate candidate snapshot; no claim that it executed this final ea3d hash is made here. rAF delay and captured transition/effect quality remain separate evidence requirements.

The review script and these owned review artifacts are frozen for parent integration. No production implementation, native app, browser, Git or remote actions were performed by this reviewer.

Skills applied: use, dec-software-principles, dec-quality-testing.
