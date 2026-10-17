# Shadow-live adapter prerequisite — independent browser module

2026-10-17. **New adapter browser acceptance remains pending.** This unit does not change AudioEngine, app wiring, any prior harness, the default production adapter or vendor/WASM. Native development remains forbidden until Jason approves an identified HTML prototype; full Serato parity remains incomplete.

Skills matched (4): use, dec-software-principles, dec-quality-testing, dec-web-performance.

## Evidence and why this separate module exists

Parent's saved `docs/prototype/keylock-shadow-return-browser-retention-results.json` reports the prior isolated retention experiment completed **10/10**, with one group in every cell, both quick gestures measured at 32 ms, all 21 capture fences, matching runtime source hashes and no fatal/cleanup errors. I read and checked those fields. Parent owns its browser execution and independent raw inspection. That result is for retention clone `16707a…d9e4`; it does not automatically accept this new adapter or engine ownership integration.

`prototype/keylock-shadow-live.js` derives from that frozen clone. Ordinary `createLiveKeylock`, `start`, `update`, `seek`, `pause`, output identities, scalar/source policies, source preparation and disposal retain the existing API. Normal start/update/seek regain the default adapter's queried group-latency plus two render-quanta guard. Only the explicit additional `followSeek` operation receives a 40 ms minimum. No mutable instance-wide experimental lead exists, and the caller cannot switch normal operations into the short guard through factory options.

Executed: syntax checks and `node scripts/test_keylock_shadow_live.mjs` exited 0, **29 checks passed /0 failed**: the original 19 checks derived into the new test file, plus 10 additional follow-contract checks. These execute the actual unchanged Signalsmith WASM/processor through a controlled serial Node message/clock/gain host, alongside chunk SRC checks. They are not real-browser scheduling, physical-output, listening-quality or native evidence.

## API and refusal contract

```js
import {createLiveKeylock, copyKeylockChunk} from './keylock-shadow-live.js';
const adapter = await createLiveKeylock(context, existingOptions);
await adapter.start();                       // queried latency +2 quanta
await adapter.update({rate, keylock, semitones});
await adapter.seek(position, {when});        // same normal guard; may rebase
await adapter.followSeek(position, {when});  // explicit40ms, active owner only
```

`followSeek(position, {when?})`:

- Requires a current, accepted, forward-playing owner. A prepared paused owner or an owner merely scheduled to start later is refused with `InvalidStateError`. The requested output clock must also be playing. It never silently starts a paused owner.
- Checks ownership and prepared coverage before joining the operation queue, at serialized execution, and again after asynchronous fill before programming audio. It shares the existing serial/supersession/cancellation mechanism; there is no second factory for a successful follow operation.
- Uses a fixed 40 ms minimum **for that operation**. An explicit earlier `when` is refused with `LateScheduleError`. Default `when` is resolved after fill using the actual then-current context time. Normal operations retain their conservative guard afterward.
- Requires the existing full one-second source-history coverage and existing forward requirement. If that coverage is absent, `FollowCoverageError` includes requested position, required start, retained start and retained end. No replacement is prepared by that operation. An immediate refusal does not change public clock, group identity or retained state.
- Does not claim source alignment at the release instant merely because a schedule was accepted. The caller must predict ideal original-time advancement for future output, and actual capture must measure it. It does not add an audio gate, raw bridge or fallback.

As with the existing adapter's invalid position checks, immediate validation/refusal may throw synchronously; a refusal discovered after queueing/fill rejects the returned promise. Callers should use `try { await adapter.followSeek(...) } catch (...) { ... }`. Owner disposal/abort remains `AbortError`.

Accepted already-issued schedules preserve the existing explicit `superseded` ACK semantics: a newer request can supersede an accepted command while it is waiting on its ACK. A queued command superseded before issuance rejects `AbortError`. A later pause wins through serialized state and ownership rechecks; it cannot be undone by a stale follower.

Far-window policy is deliberate: caller may explicitly issue **normal** `seek` while externally muted to prepare/rebase, then resume follow after that operation is accepted and playing. Its preparation and conservative guard are real latency. Any release gap must stay measured/reported; this adapter supplies no raw fallback and does not claim out-of-window gestures meet the 20 ms budget.

Normal/follow ACKs include `operationKind`, `minimumLeadSeconds`, issue/acknowledgment context times, group/origin and actual scheduled output. `latencyLead` remains the queried group latency, not a substitute for actual output timing. Snapshot policy exposes normal guard, follow-only minimum, owner and coverage requirements.

## Retention and bytes

Source preparation origin and drop retention remain **2 seconds**, while required history remains **1 second**, inherited from the actual-browser-tested retention clone. Lookahead stays 8 seconds, chunk size .5 second, driver 50 ms, and replacement crossfade 10 ms. SRC, gain behavior, vendor/WASM and positional five-source validation are unchanged.

Compared with the default one-second-retention adapter, nominal extra history is one second per source: 384,000 acknowledged PCM bytes for one 48 kHz stereo Float32 source, subject to source boundaries/chunk alignment. Original decoded AudioBuffers remain caller-owned. Snapshot accounting still reports actual retained chunks and in-flight copies, excluding decoded inputs, SRC tables and opaque WASM heaps. No opaque-heap-free claim is made.

The derived original tests change only module/hash target, worklet-test import cache key, far origin expectation 19→18 seconds, and the declared retention bound 10→11 context seconds of PCM. These geometry/accounting changes are necessary consequences of the explicit extra history, not relaxed pitch/quality tolerances. In the serviced rate-4 refill fixture, maximum actual retained PCM was **4,032,000 bytes** (10.5 seconds at 48 kHz stereo). Existing audio/cancellation assertions remain intact.

This finite hysteresis does not guarantee arbitrary signed scratch velocity, indefinite backward movement, out-of-window readiness or complete bounded memory across every application lifecycle. One successful follower does not create another group; ordinary explicit far rebase still can.

## Executed checks and material limits

The original 19 exercised the new factory: adjacent SRC phase and boundaries; anti-aliasing; eight-channel copy; chunk cancellation; five positional sources; actual WASM rate/key changes; near/far seek with stable outputs; serviced forward refill; future-start pause; owner abort; far supersession; preparation abort; actual eight-channel WASM; positional RPC failure; partial replacement cancellation; too-late far output; missed refill; append failure; prepared-notification abort.

Additional executed follow checks:

| Check | Observed contract |
| --- | --- |
| Normal/follow guard separation | Normal guard .125333333 s in the 48 kHz/.12 s latency fixture; follow .04 s. Normal start/update/seek still reject +40 ms afterward; follow rejects +30 ms. Passing obsolete factory lead 0 does not change normal timing. |
| Paused and future-start owner | Immediate refusal, unchanged state, no playback, one node. |
| Near follow actual WASM | Correct settled 880 Hz target at rate 1.08/+12, same output and node. This is settled pitch, not first-window browser acceptance. |
| Far follow/refusal/recovery | `FollowCoverageError`; complete snapshot unchanged, existing 440 Hz owner still audible in the controlled host. Normal far rebase succeeds at its conservative guard; subsequent follow returns correct 880 Hz region with stable output identity. |
| Driver/history boundary | Normal driver plus backward follows retains one group; follow to .9 s, whose cursor is retained but whose full one-second history is absent, is refused without mutation. |
| Same-turn supersession | Unissued stale follow rejects `AbortError`; latest target remains current. |
| Actual schedule-RPC boundary | An issued follow returns explicit `superseded:true`; latest serialized follow returns `superseded:false` with the latest target. |
| Pending pause ACK | Follow is accepted for queueing while old state appears active, then refused at execution after pause applies; captured controlled output stays zero. |
| Async fill crosses scheduled pause | Ownership recheck after actual held `dropBuffers` RPC refuses follow; no follow schedule is emitted and owner remains paused. |
| Owner abort during actual held RPC | Follow rejects `AbortError`, actual processors dispose, acknowledged PCM returns to zero and no late usable ACK is returned. |

The controlled bridge uses AudioBuffer-shaped fixtures and simplified gain/message collaborators. Native AudioBuffer branding, concurrent real worklet/main-thread timing, actual performance under load, opaque heap release, unhandled application ownership races and perceptual music quality remain unverified.

## New isolated actual-browser acceptance path

Open `prototype/keylock-shadow-live-harness.html`, click **Run calibration +10 actual shadow-return cases**, and retain its `keylock-shadow-live-adapter-browser-results.json` plus all 21 continuous `.stereo.f32` downloads. Parent owns this execution. It has not been run here.

The new page derives from the prior frozen `f5c8de…475c` harness. All classifier, fixture and capture-helper bodies are byte-identical; the Node test verifies their shared text hash **`2d6d993026d6d6d1b9914477d6611e713c9813d15b957794ae845b7e18ff36eb`**. No threshold changed. Warm/calibration use normal `start`; only the active follower and release alignment use `followSeek`. The same 10 cells, independent steady barcode calibration, ideal-versus-ACK original-clock oracle, actual stereo zero source, zero speaker route, all raw frames/sequences/fences, 90-second cooperative budget and bounded cleanup remain.

Synchronous follow refusals are converted into retained follow-error rows instead of escaping a timer callback; a cell with any follow error cannot pass. Seven new browser API-refusal rows cover prepared paused follow, normal start/update/seek at +40 ms, follow at +30 ms, far follow without replacement, and paused follow after playback. Overall acceptance additionally requires all seven. Runtime fetched source hashes cover the new harness, this adapter, unchanged lead baseline and unchanged vendor; adapter/vendor hashes must match frozen expected bytes.

Done criterion for this prerequisite is the **identified new** browser run: valid calibration, all 10 cells meeting every unchanged audio/cursor/mute/one-group/actual-quick-duration criterion, seven correct API refusals, all 21 strict continuous capture fences, matching runtime hashes and no fatal/cleanup errors. Node 29/29 is preparation, not that Done criterion. Even a successful isolated browser run does not verify production engine promotion/return ownership, five-source/stem mixing under scratch, other rates/shifts, high-velocity or out-of-window gestures, other-deck isolation, hardware, Serato-reference parity, listening quality or native integration.

## Frozen source hashes

| File | SHA-256 |
| --- | --- |
| `prototype/keylock-shadow-live.js` | `4860d18ec3ccf39474824cbf9d46df259b110631b4c2cfde60c9a1d03e21504b` |
| `prototype/keylock-shadow-live-harness.js` | `1b225ac819b3ce6e502502ba6d06960ba01fefbd511ca6b0fd58d5ec4958a975` |
| `prototype/keylock-shadow-live-harness.html` | `78a004016deefcc59a6da63efdb0c780bf3e3b143365170e469d0794b2d58f49` |
| `scripts/test_keylock_shadow_live.mjs` | `81809ad4d275faaac4fc3997b80fa7cc8b922ed93ceec664b671d4127381b607` |
| Unchanged retention clone | `16707a8f446a503eff022528461ff758b0f47031e34064241bf02d085cd6d9e4` |
| Unchanged vendor/WASM module | `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e` |

Skills applied: use, dec-software-principles, dec-quality-testing, dec-web-performance.
