# Separate terminal lifecycle variant: browser verification pending

## Outcome and boundary

New `prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs` derives from the preserved two-fix module and adds explicit terminal lifecycle control. It is a separate local variant, not an upstream release. Original and two-fix modules, shared PATCHES.md, production engine/app, and existing capture probe remain untouched by this task. Native implementation remains gated by user approval.

**Executed:**13/13 lifecycle checks using actual unchanged embedded WASM in a serial Node processor host and the exact main-thread factory over a Node message bridge. **Not executed:** actual browser AudioWorklet lifecycle/CPU, browser capture, physical heap release, garbage collection, hardware, production integration or listening quality. The separate parent-executed startup diagnosis and preflight-corrected functional11/11 are documented in AUDIO_CAPTURE_STARTUP_DIAGNOSIS.md; this lifecycle work does not repair or accept it.

## Provenance

| Artifact | SHA256 |
|---|---|
| Original `SignalsmithStretch.mjs` | `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46` |
| Preserved two-fix `SignalsmithStretch-open-play.mjs` | `4c02e593d01dcdf014841382880b11dd7fcbaa485821e8b36b02e0fcabd2a00a` |
| New disposable module | `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e` |
| Byte-identical MIT license copy | `ee2ef82481ffb445ecdd4b3a4c1f82c0cddb2da8fe39d8e8dc384fffb3e7f06f` |

The embedded WASM/Module line remains byte-identical to the original/two-fix module. No DSP algorithm or compiled WASM changed. Existing vendor PROVENANCE.md records upstream1.3.2 and the separately recovered official MIT license. New `SignalsmithStretch-open-play-disposable.LICENSE.txt` is a byte-identical local copy. No online dependency/advisory scan, upstream endorsement, release-tag attestation or security audit was performed in this bounded offline task.

Distinct AudioWorklet registration: `signalsmith-stretch-open-play-disposable`. Static local module loading uses `new URL('./SignalsmithStretch-open-play-disposable.mjs', import.meta.url).href`; the factory generates no Blob URLs. Both module and worklet branches remain ESM. Actual browser loading of this exact path remains required.

## Exact API and finite timing

```js
import SignalsmithStretchDisposable from './vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs';
const owner = new AbortController();
const node = await SignalsmithStretchDisposable(context, {
  numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2]
}, {signal: owner.signal, timeoutMs: 10000});
// Existing documented schedule/addBuffers/dropBuffers/latency/setUpdateInterval APIs.
const acknowledged = await node.dispose();
// {disposed:true, retainedSourceBuffers:0, retainedModule:false}
```

The third argument is new; existing first/second arguments retain their role. Factory readiness has a finite default10000ms deadline (allowed finite1..60000ms), covering module registration and readiness. Signal abort applies before module loading, during readiness and after returned-node ownership. A module-load timeout/abort prevents any late continuation from constructing a processor; platform addModule registration itself may finish later. A readiness timeout/abort sends terminal disposal and awaits its bounded acknowledgement before factory rejection. If the native WASM instantiation is already running it may complete; a terminal guard prevents late `_main`, configuration, readiness, queued-command replay or DSP resurrection. No promise deadline is claimed to cancel browser-native compilation itself.

`node.dispose(reason?)` is terminal and idempotent, returning the same Promise on repeated calls. It immediately disconnects, removes callbacks and rejects pending logical RPCs, requests processor disposal, then resolves only after its terminal acknowledgement. Acknowledgement has a finite2000ms deadline. Timeout rejects with TimeoutError, closes the local port and does **not** claim confirmed processor receipt/termination; applications must treat that as a failed disposal requiring explicit recovery, rather than silently count a dead owner. The observed Node missing-ACK case took2000.760ms. Signal abort during a pending disposal returns/retains that same bounded disposal operation, rather than spawning another owner. Normal `stop()` remains reusable and distinct from terminal dispose.

Pending normal RPCs are rejected once with the disposal reason (default AbortError). Future RPC/schedule calls reject InvalidStateError. Processor command errors use a serialized error response and reject their matching promises. Initialization/processor errors reject readiness and pending work and trigger the same bounded disposal. Time callbacks and late replies cannot update a disposing/disposed node. The caller must still implement deck/track/load generation ownership before connecting or committing candidates; this API is not a replacement for application ownership checks.

## Processor terminal invariant

Dispose works before or after WASM readiness. It clears queued commands, source buffer lists, time-map segments, input/output views and the module reference, and resets source extents/channels. Every later process call produces zeros and returns false **before** any WASM call or telemetry. Delayed initialization detects terminal state before assigning the module, calling `_main`, configuring or emitting readiness. A subsequent schedule cannot revive it.

This clears explicit processor-owned references and stops further DSP through that process path. It does not prove synchronous physical heap deallocation. WebAssembly memory is reclaimed according to browser/JS reachability and garbage collection; this wrapper exposes no verified allocator-level destroy/free API. Node tests deliberately retain diagnostic records, so their host memory use is not a heap-release measurement. Disconnect alone is not the asserted terminal criterion; acknowledged disposed state and return-false/no-DSP are.

## Executed proof

Run `node scripts/test_keylock_disposal.mjs`. Current [amended results](KEYLOCK_DISPOSAL_AMENDED_NODE_RESULTS.json) record13/13. The original [12-case result](KEYLOCK_DISPOSAL_NODE_RESULTS.json) remains unchanged and did not cover the newly reproduced ready-resolution race:

- Original/two-fix hashes and embedded WASM unchanged.
- Dispose during actual WASM-resolution delay clears queued PCM and prevents late main/configure/ready. The delay is explicit test-only instrumentation around real WASM resolution, not a simulated DSP engine.
- Real pre-disposal stereo audio reached maximum0.121033;50 later blocks returned false/zeros, with0 further instrumented DSP calls,0 source arrays and no processor module reference.
- Static local factory module URL; pre-aborted owner creates0 processors.
- Abort/timeout during deferred module load creates0 late processors after registration resolves.
- Abort during readiness acknowledges disposal; delayed actual initialization makes0 `_main` calls.
- One pending real RPC rejects exactly once; late replies/time callbacks do not update; repeated dispose returns the same promise; post-dispose schedule rejects.
- Owner abort after ready prevents restart.
- Readiness timeout acknowledges terminal disposal before factory rejection.
- Missing disposal ACK produces bounded error without revival; Node confirms terminal receipt separately, which an actual timeout alone cannot prove.
-20 distinct repeated ownership cycles with rate changes:20 terminal identities,0 retained source buffers and0 processor module references. This is ownership accounting, not browser heap/GC proof.

## Required actual browser acceptance before production integration

A separate public browser harness must exercise the exact new file in one shared live AudioContext with speakers forced to zero and actual PCM capture. Prove static URL registration, actual sound before disposal, acknowledged terminal silence/no callbacks, no scheduled resurrection, late-ready abort, module-load cancellation, pending RPC cancellation, and repeated current/replaced owners. Keep original and two-fix fixtures side-by-side so lifecycle acceptance cannot conceal a transport regression. Test many rate changes on a reused owner and repeated canceled candidates; measure retained source accounting and live processor/DSP activity. A finite timeout must stay a failure, not become a synthetic pass.

Use the independently corrected capture start/fence protocol only after that measurement path is validated; the parent has independently validated the preflight-corrected functional capture; this new disposal harness still needs its own real run. Parent owns browser execution and deciding any shared documentation/prototype integration. No production integration follows from this report.

Skills applied: use, dependency-audit, dec-software-principles, dec-quality-testing.


## Authorized ready-resolution race amendment

An independent reviewer identified an owner-abort microtask between readiness resolution and the factory await continuation. The old factory could return a node already entering disposal. The new test independently reproduced this with the real WASM/factory bridge: [initial regression result](KEYLOCK_DISPOSAL_READY_RACE_INITIAL_RESULTS.json),12 passes/1 failure, resolved true/aborted true/processor disposed true. This is retained beside the original12-case report; those12 cases did not cover this race.

The authorized amendment checks `cancelError` immediately after awaiting readiness/cancellation and before returning the node. It throws through the existing catch, which awaits the bounded terminal disposal acknowledgement. [Amended executed13-case result](KEYLOCK_DISPOSAL_AMENDED_NODE_RESULTS.json) records resolved false/AbortError/processor disposed true/port closed true. Current module hash is `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e`; the old `a71073ef4d07278e3eda6b09f63132ce2b075c081b1d23bea2dfd6cb9aa4bd38` artifact is preserved by parent in ignored local evidence. Original and two-fix modules remain unchanged. This is a new tested case, not a retroactive claim about the old12.


## Parent-executed actual browser result,17 October2026

This section supersedes the earlier pending-browser status for this bounded harness only. Parent executed the exact amended module `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e` and saved [full browser JSON](../prototype/keylock-disposal-browser-results.json) plus [screenshot](../prototype/keylock-disposal-browser.png). Read-only review independently checked the reported criteria and frame/sequence arithmetic: **5/5, completed:true, fatalErrors:[], constructorRestored:true,11 recorded node identities and11 diagnostic ports closed**,48000Hz,3583.9ms elapsed. This is parent-executed browser evidence reviewed from its raw artifact, not a second browser run by this child.

The initial candidate genuinely produced660.433563Hz at RMS0.0847237; control produced440.390575Hz. In the simultaneous300ms post-ACK window starting1.495333s, candidate fixed-stereo bus RMS and peak were exactly0 with coverage1; control remained440.389734Hz, RMS0.0847290, peak0.120078, coverage1. Both capture inputs retained actual explicit stereo via the live zero-valued bus source. Thus missing channels or missing capture messages did not provide the silence result.

Separate diagnostic evidence supports terminal processing rather than silence alone: candidate identity2 had one actual disposed process call returning false,495 total process calls and492 DSP calls. Its later snapshot retained exactly those counts,0 source buffers, no module reference and0 queued processor commands. Callback count stayed11 before disposal/at ACK/after the later window. The pending-RPC identity3 observed one actual held reply and exactly one caller rejection; after adversarial late delivery its terminal snapshots remained5 process calls/4 DSP calls, with the same zero ownership fields. Post-dispose schedule rejected.

Four ready-owner cancellations (identities4..7) each observed WASM ready before abort and one terminal return afterward, with0 retained source/module/queued-command references and no later DSP. These were ready/prepared owners, not four independently playing audio fixtures. Four immediate factory cancellations (identities8..11) each rejected AbortError and observed exactly one disposed/terminal process call with0 DSP calls, no late revival and the same zero ownership fields. The control remained440.389703Hz after ready cancellations and440.390218Hz after immediate cancellations. Across10 retired tested identities, every compared second snapshot retained its first terminal DSP count. The continuously playing control identity1 was retired only in final cleanup; this run does not contain a separate terminal-counter snapshot for that control, so11 closed ports must not be restated as11 observed terminal returns.

Both capture preflights preserved the startup jump expected128→actual640 at producer sequence1, then observed64 contiguous quanta1024..9216 before arm. Full control armed span9216..171648 contains1269 blocks/162432 frames; candidate span9216..172160 contains1273 blocks/162944 frames. Both exact sequence ranges match their block counts, final fences, coverage1 and empty armed-gap lists. No armed gap was dropped or filled.

Accepted scope: the isolated, instrumented browser factory/disposal/RPC/cancellation/retained-reference path and its bounded actual PCM/control-survival checks. Instrumentation and adversarial zero-gain reconnection remain part of this proof. It does **not** establish production AudioEngine integration, ordinary scratch, uninstrumented third-variant musical quality, long-duration CPU/memory stability, immediate physical heap reclamation/GC, hardware output, native app acceptance or complete Serato parity. The separately accepted uninstrumented two-fix11-case functional result remains separate evidence. No implementation changes follow from this read-only review.
