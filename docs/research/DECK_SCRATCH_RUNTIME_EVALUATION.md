# Ordinary whole-deck scratch prerequisite

Status: **21/21 instrumented Node checks executed**, JavaScript syntax checks executed. A public actual-browser raw PCM harness is ready for parent execution. This unit does **not** integrate AudioEngine, app controls or native code. Ordinary scratch/Serato parity is not closed by these results.

## Outcome and boundary

The independent transport renders signed PCM on one audible whole-deck timeline. It supplies five fixed raw outputs: original, vocals, other, bass, drums. The parent can replace existing sources while preserving the current original-versus-stem gains, per-stem history/exit-FX routes, mixer and other deck routing. The kernel itself never mixes original plus stems, applies mutes, changes another deck, renders ML, or attaches a speaker path.

This is ordinary whole-deck scratch, **not selected-stem Slip**. Stem Slip's kernel was read for time/interpolation context but not changed or reused as its semantics. During an ordinary gesture all raw outputs follow the same audible cursor. Ordinary Slip can keep a separate prior transport clock for the *whole deck*; no complementary stem is independently manipulated here.

Linear interpolation, a short head-jump crossfade and amplitude ramps are independently chosen policies. No anti-aliasing, keylock during scratching, high-speed scratch sound, precise vendor response, hardware/DVS, native real-time performance or all-boundary click suppression is established. Natural source ends and ordinary loop boundaries do not receive a separately recovered vendor treatment.

## Public files and API

New production prerequisite files only:

- `prototype/deck-scratch-kernel.js`: `DeckScratchKernel`, source-domain position math and documented policy.
- `prototype/deck-scratch-worklet.js`: `open-play-deck-scratch-v1`, five raw outputs, command acknowledgements, periodic state and terminal processor return.
- `prototype/deck-scratch.js`: `prepareDeckScratch(ctx)` and `createDeckScratchTransport(ctx, options)`.

Caller sequence:

```js
await prepareDeckScratch(ctx);
const transport = createDeckScratchTransport(ctx, {
  outputChannels: 2,
  onState: snapshot => { /* check generation/owner before using it */ },
  onError: error => { /* preserve the other deck and report failure */ },
});
// Parent connects outputs to its existing gain/history routes. No route is
// connected by this module, and PCM is copied only on loaded-source changes.
await transport.replaceBuffers({
  generation: 1,
  original: originalAudioBuffer,       // or { sampleRate, channels: Float32Array[] }
  stems: preparedAudioBuffersOrNull,    // exactly four, or null
  signal: abortController.signal,
});
await transport.command('configure', {
  generation: 1, position: 12, rate: 1, reverse: false,
  loop: null, playing: true, slip: false,
  startAt: ctx.currentTime + 0.01,
});
const touch = await transport.command('begin', {
  generation: 1, owner: 'deck-0-pointer-unique-gesture-17',
});
await transport.command('scratch', {
  generation: 1, owner: touch.owner, gesture: touch.gesture,
  position: 11.9, velocity: -1.4,
});
await transport.command('end', {
  generation: 1, owner: touch.owner, gesture: touch.gesture,
});
const latest = transport.state();
transport.dispose();
```

Resume the context from the approved user interaction, prepare the module, and connect the required graph before relying on bounded command acknowledgements. The module does not resume a suspended context automatically.

Output indices always exist, independent of available sources. Missing stems produce zeros on outputs 1–4. `outputChannels` supports 1–8. Mono duplicates into requested output channels; multichannel sources map matching discrete channel indices and zero-fill any missing channels. **No speaker-layout downmix** is invented. The parent initially integrates ordinary mono/stereo sources; a stereo node does not claim full multichannel mixing fidelity.

Sources use their own sample rates. Positions, velocities, loop positions and state values use **original-track seconds**, not source frame indices, rendered/keylocked-buffer seconds or output sample counts. Rate is finite >0 through 16, and signed scratch velocity is finite ±16. These are explicit independent supported ranges, not vendor-recovered response curves. Positions clamp to the original source duration; loops must be finite, ordered and inside that source.

`command` supports configure, begin, scratch, end, play, pause, seek, rate, reverse, loop, slip and cancel; dispose is terminal. Required command fields are generation plus the fields named above (`loop` takes `{loop:{start,end}}` or `{loop:null}`, `rate` takes `{rate}`, reverse/slip take strict booleans). Invalid scalar configuration validates before changing an existing live state. Global transport commands end/invalidate a gesture and own their new outcome; late gesture releases cannot resume or undo that explicit command.

`state()` is the latest acknowledged/periodic snapshot, **not extrapolated**. `position` is the ordinary canonical cursor, or backing clock during Slip. `audiblePosition` is the scratch head. `audioTime` marks the snapshot's next render-frame boundary; periodic snapshots arrive every eight quanta. Parent integration must account for that finite age and preserve source/gesture ownership. No animation-state estimate is presented as an observed audio sample.

## Ownership and source lifetime

Load generations are strictly positive safe integers and increase monotonically. A failed/canceled wrapper load still reserves its requested generation; retry with a higher generation. New loads replace all previous source/gesture state only when a valid payload commits. Stale source generations cannot begin or release a new gesture.

Every begin also carries a monotonically increasing gesture sequence. The wrapper assigns one if omitted and returns it. The kernel rejects older/equal begins even after a gesture ends, preventing delayed touch requests from reviving a stale owner. Move/end require generation, owner and gesture equality. **Pass the returned stable gesture token**, particularly if reusing an owner string; alternatively use a unique owner string for every gesture. The wrapper's convenience token completion cannot infer which old physical event a reused owner string meant.

A transport is allocated/reused for a loaded deck source. Pointer moves transfer only command scalars. `replaceBuffers` copies immutable source PCM once, validates finite samples in main-thread chunks, and transfers the copies. Original caller buffers are not detached. The worklet validates metadata and sanitizes each sampled value; it does not scan an entire multi-minute file synchronously on the audio thread. Four prepared sources must share sample rate/frame length and lie within the existing 0.1s original-duration contract. The original and prepared sample rates may differ.

Copy-stage supersession/AbortSignal/disposal settles the pending operation and never posts obsolete PCM. If an already-posted load is canceled or its RPC times out, an internal generation-scoped `invalidate` retires that payload, clears its PCM/owner and leaves silence. It cannot erase a newer committed generation. This prevents rejected/unacknowledged source loads from remaining available to late play/begin messages.

Dispose settles pending operations, clears state/ownership, disconnects and closes the node port. The actual worklet's terminal command clears PCM/transition/hidden-clock references and `process` returns false. Controlled host tests verify these code paths; browser node disconnection or silent PCM alone would not prove garbage collection.

## Ordinary release and held-pointer policy

Touch begins with zero velocity. A move supplies the absolute source cursor and signed velocity. A zero-velocity move fades amplitude to exact zero over the short ramp; it never continuously emits the held sample as DC. If moves stop while held, the transport's **120ms default watchdog** sets velocity to zero and fades to silence. Parent UI may issue an earlier zero-velocity command. A future scheduled start anchors the watchdog at the scheduled audio start, so pre-start waiting does not expire the gesture before it can sound.

Without Slip, release commits the final audible cursor. If initially paused, audition stops and the deck remains paused at that cursor. If initially playing, ordinary playback resumes at its prior rate/direction. An active loop is retained if the final cursor remains inside; if the scratch leaves it, release clears the loop and reports `released-outside-loop-cleared`, preserving the performed position instead of silently wrapping it away. This is an independent explicit policy; exact vendor loop interaction remains unknown.

With ordinary Slip, a hidden clock advances with the prior playing state, signed rate, reverse direction and loop. Release rejoins that clock and retains its loop/direction. A paused Slip backing clock stays frozen and remains paused after audition. Global play/pause/seek/rate/reverse/loop/slip commands invalidate the gesture first and then apply their requested outcome.

## Resource and RPC bounds

Defaults are 32 pending RPCs, 5s acknowledgement timeout, 65,536-frame main-thread copy chunks and a configurable **512MiB combined copied-PCM memory budget**. These bound staging/messaging resources, not entitlements. Large-file/multi-deck memory, actual preparation latency and sustained render CPU remain unmeasured. The source PCM already held by the caller is additional memory. A production/native design may need streaming or shared-memory windows rather than increasing copies without limit.

Pending calls reject on queue overflow, timeout, postMessage failure, processor failure, cancellation or disposal as applicable. Timeout IDs and abort listeners are removed when settled. Late timed-out acknowledgements cannot revive wrapper state. Retained state contains no PCM. No artificial account, payment or feature unlock is introduced by this prerequisite.

## Executed Node evidence

Run `node scripts/test_deck_scratch.mjs`. **21/21 executed**. The script uses the actual kernel and actual worklet class, an instrumented deterministic host and actual wrapper module. A structured-clone transfer boundary verifies caller PCM is retained while posted copies transfer.

The cases cover:

- Signed forward/reverse PCM and five actual raw sources; differing original/stem/render rates and linear interpolation.
- Input/output channels 1–8, mono/discrete/zero-fill and absent-stem zeros.
- Nonzero held samples fading to exact zero, watchdog silence and independently advancing Slip clock.
- Paused audition/release, non-Slip final cursor, inside/outside-loop policy, reverse/loop Slip and frozen paused Slip.
- Another independent kernel remaining audible and PCM-bit-identical during first-deck manipulation.
- Short head-jump crossfade, strict generation/owner/gesture ordering and explicit global transport outcomes.
- Invalid scalars/geometry, finite sanitation, original end versus padded stems, scheduled start and reverse end.
- Terminal source/reference release, false processor return, actual worklet error acknowledgements and command-clock synchronization before first processing.
- One-time module/source preparation, source-memory reuse across gestures, chunk-copy cancellation, RPC queue/timeout/post failure/dispose/processor error, posted-load invalidation, newer generation survival.
- Actual capture processor retaining 64 preflight rows and an intentionally gappy armed span with every finite PCM sample retained (300 samples across three rows, including the gap).

These are deterministic execution checks, **not browser scheduling, captured browser PCM, AudioEngine/UI behavior, musical quality or reference acceptance**.

## Public actual-browser acceptance

Open `/prototype/deck-scratch-harness.html` on the existing approved loopback server and click `#run`. Exported `runDeckScratchChecks()` returns the JSON report and also sets `window.deckScratchHarnessResult`. `window.deckScratchHarnessPCM` retains all raw finite capture vectors. Each capture provides a downloadable planar Float32 binary with input/channel order, frame count, sample rate and source start frame in the report.

The sink captures seven stereo inputs: raw original plus four raw stems, their external gain-node mix and a second independent deck. Its only destination route is through **gain zero**. No speaker-connected nonzero route is created.

There are **seven checks**, with multiple finite captures:

1. Actual modules/five-output construction, paused first-deck zeros and nonzero independent other-deck PCM.
2. A 12,000Hz source's three marked events at forward/reverse 2×: all three captured, reversed amplitude order, measured 10ms spacing within two render samples, absent-stem outputs zero.
3. Paused motion at a deliberately nonzero source, captured moving audio followed by watchdog-held exact zeros; explicit hold/release keeps pause and final cursor.
4. Non-Slip release preserves the performed cursor outside a loop, reports loop removal and resumes captured audio.
5. Ordinary Slip's prior reverse loop clock rejoins at an independently calculated position; subsequent actual captured source phase must match (RMSE <0.002 after the declared 3ms control ramp, all raw frames retained).
6. Five independent actual raw sources with external gains selecting original, full separated reconstruction and subset. Captured mix must match the captured weighted raw sum within 1e-6, with fixture headroom bounded below 0.2.
7. Late owners/begins cannot alter a newer gesture; disposed first deck is silent while actual other-deck PCM remains nonzero and new commands reject.

Each capture first observes **64 process quanta of preflight**. Preflight rows/gaps are retained. The entire armed span retains currentFrame/size rows and full PCM; a discontinuity fails that case without dropping, masking or replacing the gappy interval. The finite capture maximum is two seconds per arm for this test-only sink. Raw frame spans remain available even when a musical/position assertion fails.

Thresholds test declared fixture properties, not perceptual quality. Startup/preflight gaps are diagnostic evidence; they are not silently counted as a continuous armed capture. Full AudioEngine routing, visible platter interactions, keylock handoffs, hardware and musical listening still need separate parent-owned tests after this prerequisite.

## Frozen source candidate before parent browser execution

```text
428c677a90114d6a23479ad0789825c7cd45bcaed3806fbafec32aba6a68d08c  prototype/deck-scratch-kernel.js
0f875b8ed8a2f0b0373455e8758fe150be937fa3311a6b35142a7d15622f189a  prototype/deck-scratch.js
55201aa5eb1e6db5ab0f23ff47e307ca53e1c65aabe572eb9cdd8e9ab10a8b87  prototype/deck-scratch-worklet.js
dbb540f6be6f38fc6143c1f4fa2606455f55e4b313b84557298dd3548c75cbff  prototype/deck-scratch-capture-worklet.js
795548dd60a8f417cd37950e98fb80822091509d10dfcbcd166411fdc020abd6  prototype/deck-scratch-harness.js
d7c0ae7ba48832e7a5a9f9a256f7f07d2cf658bb41b2ea747befbc237a74c5d1  scripts/test_deck_scratch.mjs
```

Only these newly owned prerequisite/test/harness/document files were changed for this slice. No shared engine/app, browser, native, Git or remote actions were taken.

## First actual browser attempt — operational failure retained

Parent's first actual run started at **08:07:16** (parent-observed clock). The initial setup check passed, including actual captured independent other-deck PCM. The page reached visible case 4, Non-Slip release, around 08:08, and then its agent-created tab 24 became unresponsive to control. Two DOM reads timed out through CDP Runtime evaluate/dispatch at 3s; a subsequent native screenshot request hung for 30s and the CUA REPL was reset. No final JSON was retrieved. **This was not a completed/passing seven-case run.** Parent owns tab/UI recovery.

Initial harness source was SHA-256 `795548dd60a8f417cd37950e98fb80822091509d10dfcbcd166411fdc020abd6`; kernel/wrapper/worklet/capture hashes above remained unchanged. Parent observed an accessibility tree of approximately 40,000 lines due to live full capture logs.

A controlled payload-size reproduction using the same 48kHz report shape after three checks/four captures produced **916,074 pretty-JSON characters / 41,551 lines**, versus 194,953 compact characters. Capture rows occurred twice in JSON: once in report.captures and again inside check evidence. Node serialization itself measured about 2.4ms in that size reproduction. This establishes large/repeated reporting output; it **does not prove** that DOM layout/accessibility processing caused the actual browser stall. No unbounded algorithmic loop was found in source inspection of the 128-frame PCM renderer, finite capture processor or seven-case runner. Periodic source state runs about 46.9 times/second at 48kHz per worklet; no separate actual message-flood diagnosis was established.

## Reporting correction and recovery candidate

`prototype/deck-scratch-report.js` now produces a **≤8KB live DOM summary** with all ordinary seven-case outcomes/errors and capture/frame-gap counts. The live pre has a bounded scroll area. Full preflight/armed rows, state logs, failed evidence and PCM remain in the actual `#full-report` downloadable JSON checkpoints and existing raw PCM files. The full report object is assigned to `window.deckScratchHarnessResult` from run start, not only on completion. Small `window.deckScratchHarnessSummary` and `window.deckScratchHarnessProgress` objects support compact control reads. Full report checkpoints are available from setup and after each retained capture/case.

The harness now has a **90-second whole-run failure deadline** and an explicit 8,192-state telemetry bound. Overflow records its first overflowing state, aborts and cleans up; it does not silently sample state or remove armed PCM. Deadline abort rejects pending preflight/capture-start/capture-done and setup waits, disposes both transports, posts capture stop, disconnects the capture/sink and closes its port **before** awaiting bounded context close (2s). Close failure is recorded and a bounded suspend fallback (1s) is attempted. Cleanup is idempotent; cleanup errors count as failure. A blocked browser main thread still cannot be preempted by a JavaScript timer, so these are cooperative cleanup paths, not a guarantee that arbitrary browser hangs self-recover.

The finite audio plus preflight durations total roughly five seconds; RPC/source-copy/host overhead adds time. A normal run is expected to be in the tens of seconds, not minutes. That expectation is not a measured performance pass threshold; deadline expiration is an explicit failure.

`node scripts/test_deck_scratch_reporting.mjs` executed **5/5**:

1. Summary retains all normal case outcomes/gap counts and leaves original evidence unchanged.
2. Increasing armed rows to thousands does not expand live DOM into full logs.
3. Actual reporter's downloadable JSON retains every full failed row/state; superseded Blob URLs are released.
4. Extracted actual abort cleanup settles every pending capture stage and disconnects/transports before close; complete gappy evidence is retained.
5. Close timeout records its error and attempts bounded suspend after disconnection.

Original `scripts/test_deck_scratch.mjs` was rerun **21/21** with unchanged audio source files and thresholds. No raw audio/frame-continuity assertion was weakened, no gappy armed span removed, and no browser pass claimed for the reporting correction. Parent will run a fresh tab after recovery.

Recovery candidate SHA-256:

```text
2624f53a4120a87a05919581c26eec85be1a169f2e38252e1f788faa0b123aa2  prototype/deck-scratch-harness.js
485bea5d4e1b99a2f223458f30897b2e2fa609f4a4193e96d66de716df73b4f0  prototype/deck-scratch-harness.html
eb3112ceea31915e53d506c3e3778d3998fd75db04c71db756313e7fba20f8ba  prototype/deck-scratch-report.js
74467b571473d8421dd606d2743502471f41d6fa7a6aa6c4169b3fb096172a14  scripts/test_deck_scratch_reporting.mjs
```

## Parent-executed bounded-reporter browser run — independent saved-report review

Parent executed the fresh bounded-reporter candidate and saved the actual full JSON download as `docs/prototype/deck-scratch-browser-results.json` (initial completed-run SHA-256 `513a12b3488a3b24bffc2e5aef0c25a3d0e3030a5947aa306d1f7f18a5e8e688`) and screenshot `docs/prototype/deck-scratch-browser.png`. Parent reported a responsive UI and working actual download control. This reviewer read the saved JSON without browser tools; the report is **7 reported passes / 0 failures, 4,489.5ms at 48,000Hz, 13 finite captures, 236 state snapshots and cleanupErrors=[]**. This completed run is separate from the first tab-24 operational failure above, which remains preserved. Giant live reporting is a plausible explanation for the earlier stall, not a proven complete root cause.

Independent report-structure checks confirmed all 13 captures have exactly 64 preflight rows (832 total), 809 armed rows, and **103,202 captured frames per channel in total**. Every saved armed currentFrame sequence is contiguous, begins at its reported startFrame and covers the declared finite frame count with only the expected final partial quantum. No continuity/coverage error was found; preflight and armed gap arrays are empty. Those checks recompute coverage from saved rows, rather than trusting the top-level passing count.

The saved metrics are nonvacuous for these bounded claims:

- **Signed source time/rate:** all three marker events were captured in both directions, with amplitudes approximately 0.1→0.2→0.3 forward and 0.3→0.2→0.1 reverse. Measured spacing is 0.01s for 2× traversal of the 0.02s source spacing. Relative to the scheduled start, forward marker centres occur at 0.005/0.015/0.025s to floating-point precision; reverse centres are each one 48kHz render sample later. The input source is 12kHz and output 48kHz. This supports original-source seconds and signed traversal for this fixture, not arbitrary-rate anti-aliasing quality.
- **Paused motion and held zero:** the declared 2,400-frame moving window has RMS 0.20000000298, while the subsequent **13,472-frame held window has peak exactly zero**. State shows the watchdog held the cursor at 1.1200000000001467s and paused release keeps that cursor with playing=false/audition=false/owner=null. This proves moving versus held-zero behavior for the known nonzero constant source. Because the watchdog had already silenced the gesture, the case does not independently measure a separate moving-to-release fade envelope.
- **Ordinary non-Slip release:** the held capture is zero, release reports position=1, loop=null, playing=true and `released-outside-loop-cleared`; the post-release original capture has stereo RMS about 0.05632/0.05644. This establishes a nonzero resumed output and the reported final-cursor/loop policy. Unlike the Slip case, it does not independently verify the post-release sample phase against source PCM.
- **Ordinary Slip reverse loop:** elapsed backing time is 0.2133333333s at rate −1.5 through the 2–2.2s loop. Independently calculated release is 2.18s, reported release 2.179999999998473s. The subsequent captured original has RMS about 0.05640/0.05648; all **1,920 captured phase frames** were evaluated and RMSE is 1.5101003882e−9. This is not a zero/empty-window pass. The four-millisecond ramp guard excluded no frames in this capture because the 64-quanta preflight had already elapsed after release.
- **External raw gain routing:** all five raw source RMS values are nonzero. Original-only, all-four-stem and subset mix maximum errors versus the weighted captured raw outputs are respectively 0, 7.4505805969e−9 and 1.8626451492e−9. Full stem-mix peak is below 0.1. These measurements support gain routing/no duplicated summing in this external graph; they are not a spectral identity test of each raw output or proof that the parent AudioEngine's actual mute/history/FX graph is integrated.
- **Ownership and other-deck independence:** stale end is reported `stale-owner`, stale begin `stale-gesture`, while the newer owner remains `fresh`. Other-deck captures remain nonzero before and after retirement, around RMS 0.0282, and the wrapper rejects subsequent commands after disposal.

The report contains calculated metrics and full process-row evidence, with Blob download references for raw PCM. This reviewer did **not** independently retrieve/recompute the raw binary PCM, inspect the screenshot visually, execute the browser or run real engine/UI integration. Those boundaries matter: a saved 7/7 count is not vendor, musical or full application acceptance.

### Confirmed disposal oracle gap and minimal correction

The initial completed run's case 7 had **already-zero first-deck original and mixed PCM before disposal**, because its fresh gesture was deliberately held at zero velocity. Its post-dispose zeros therefore did not prove an active-audio→silence transition. The other-deck continuity, ownership rejection and wrapper terminal-state checks remain meaningful, but the broader active retirement claim was not established by that initial 7/7 report.

Parent authorized one minimal harness correction: after the stale-owner assertions, end the fresh gesture to resume the already-playing ordinary deck; require both original and external-mix **stereo RMS >0.01 before disposal**, then retain the existing all-zero retired-output and nonzero other-deck assertions. The resumed state is retained in evidence. No kernel, wrapper, capture, reporting/deadline or audio tolerance was changed.

The corrected harness is frozen at SHA-256 `1f0759f07deabae1c01e7e56eda23f2e4766d4629521ec673b69c1bf98e7918f`; syntax check executed. It still expects seven checks and 13 captures. **A new parent actual browser run is required** before claiming active retirement acceptance. The initial completed JSON should be retained as `docs/prototype/deck-scratch-browser-initial-results.json` when the new run replaces the current results path.

Unchanged current runtime/reporting hashes:

```text
428c677a90114d6a23479ad0789825c7cd45bcaed3806fbafec32aba6a68d08c  prototype/deck-scratch-kernel.js
0f875b8ed8a2f0b0373455e8758fe150be937fa3311a6b35142a7d15622f189a  prototype/deck-scratch.js
55201aa5eb1e6db5ab0f23ff47e307ca53e1c65aabe572eb9cdd8e9ab10a8b87  prototype/deck-scratch-worklet.js
dbb540f6be6f38fc6143c1f4fa2606455f55e4b313b84557298dd3548c75cbff  prototype/deck-scratch-capture-worklet.js
eb3112ceea31915e53d506c3e3778d3998fd75db04c71db756313e7fba20f8ba  prototype/deck-scratch-report.js
```

Instrumented Node evidence remains the previously executed 21/21 runtime tests and 5/5 reporting/cleanup tests; those do not replace the corrected browser rerun. Ordinary AudioEngine/UI scratch integration, keylock/raw handoffs, real musical listening, hardware and native parity remain open.

## Parent actual strengthened retirement check

The fresh run of the amended harness also reports7/7, with all13 captured spans contiguous and no cleanup errors. [Current full downloaded JSON](../prototype/deck-scratch-browser-results.json) now records an explicitly resumed active voice before disposal: raw original and external mix RMS are0.056260/0.056731 across stereo; afterward their peaks are exactly0 while the independent other deck continues. This closes the initial silent-before-disposal oracle gap without changing kernel behavior or loosening criteria. [Initial7/7 JSON](../prototype/deck-scratch-browser-initial-results.json) remains unchanged and narrower. The current screenshot is `../prototype/deck-scratch-browser-v2.png`.

This accepts the isolated raw transport and its declared routing/owner/release policies. Engine integration, actual platter gestures, keylock bypass/recovery, device jogs and musical/high-speed/reference quality are still open.
