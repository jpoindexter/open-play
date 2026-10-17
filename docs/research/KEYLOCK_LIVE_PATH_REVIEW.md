# Ordinary deck scratch and browser live keylock: architecture review

2026-10-17. Source inspection only at this writing; no production engine/UI/test/vendor edits, native application work or new audio acceptance. The new isolated browser probe described below awaits parent execution. REQ-118 requires tempo-preserving keylock plus temporary scratch bypass; REQ-057 also retains independent key shift/key sync without entitlement checks. Installed Serato scratch detection, thresholds, recovery timing and sonic equivalence remain unverified.

## Current seams and the actual gap

- `engine.js:start` (around201–335): normal voices are AudioBufferSources. With keylock/keyShift, it renders complete PCM buffers first, maps original seconds through `timelineScale=tempo`, and starts at `originalPosition/tempo`. This is a functioning independent offline transform path, not a continuous scratch transport.
- `engine.js:setRate` (around367–425) and `setPitch` (around686–705): keylocked changes pause/restart and call that full render. `seek` (around352–365) also pauses/restarts. Pointer-move calls to these functions would repeatedly cancel/recreate processing and cannot provide continuous bidirectional vinyl motion.
- `engine.js:position` (around150): the ordinary anchor clock is authoritative; Stem Slip uses a separate backing-clock state. Ordinary scratch needs an explicit audible position, not accidental reuse of the backing clock.
- `stem-slip-kernel.js`: reusable signed PCM sampling in original-track seconds, linear interpolation,3ms transitions and owner-gated scratch commands. Its existing four stereo outputs, selected-group behavior, continuously advancing hidden `position`, `align()` on release and selected-stem release rolls are not ordinary non-Slip scratch semantics.
- `engine.js:startStemSlip` (around903): existing mode requires four prepared stems and special routing. Ordinary scratch must not require separation or alter `d.stemSlip`. Reusing that public method unchanged would impose the wrong prerequisite and release behavior. It also interacts with `setCross`, which treats a `voice.stemSlipTransport` specially; disguising an ordinary voice as this property would bypass normal channel crossfade authority.

## Recommended browser transport

Reuse the signed PCM sampler/ownership pattern in an explicitly ordinary/all-selected transport; do not synthesize scratch by repeatedly calling seek or assigning negative BufferSource playbackRate. A dedicated one-output worklet for an unseparated original track is the smallest correct slice. If generalized alongside Stem Slip, ordinary mode must have explicit selected/all-source and resume policies, with separate tests preserving existing Stem Slip behavior.

For prepared stems, scratch must preserve their enabled/muted/FX routing. A raw original-only bypass would resurrect muted material. The generic path therefore needs original plus four aligned stems, routed through the existing original/stem buses and gains, or an equally explicit source-group solution. Do not fake stems by copying the original four times. Preserve supported source channel policy: current Stem Slip is fixed stereo, whereas keylock validation accepts1–8 channels.

Suggested engine seams: `beginDeckScratch(deck,owner)`, `updateDeckScratch(deck,{position,velocity},owner)`, `endDeckScratch(deck,owner,{cancel})`, a query of audible and optional backing positions, and a distinct voice transport property. Keep all positions in original-track seconds and velocity in original-track seconds/context-second. Retain finite/range validation; the existing Stem Slip±16 velocity bound is an independent policy, not a reference measurement.

Gesture entry snapshots track identity, load generation, prior playing state, rate, loop/reverse and pitch configuration. Reuse the current raw decoded PCM for scratch, bypassing time stretch while preserving the user's keylock preference. Whether independent key shift also bypasses during scratch is a separate source/runtime question; choose and label the original policy before tests. A zero-velocity held sample must fade to silence rather than emit a nonzero DC sample indefinitely.

For non-Slip release, commit the final audible scratch position and resume from there if the deck was playing; a paused deck auditions during motion then remains paused at the final position. With ordinary Slip enabled, retain a separate hidden timeline and resume there. Do not use Stem Slip's unconditional `align()` for both cases. Explicit stop/eject/load/cancel owns the outcome; a late pointerup never starts or restores an old track.

A raw BufferSource fallback would need both forward and reversed buffers, a new source on every direction reversal, offset conversion, zero-speed muting and ramped handoffs. It can provide a bounded jog approximation, but it is a poor primary mechanism for frequent signed velocity/position changes. A signed PCM worklet avoids that reconstruction churn; linear interpolation still needs measured high-speed aliasing/quality evaluation rather than a high-quality claim.

## Streaming keylock is already supported by the vendored browser dependency

[Vendored upstream README](../../prototype/vendor/signalsmith-stretch/UPSTREAM_README.md) explicitly supports AudioWorklet live input **and buffered streaming**. This needs no native application and is not gated by prototype approval. The current whole-buffer transform limit is our adapter design, not a browser capability conclusion.

Use the unmodified `signalsmith-stretch@1.3.2` browser factory and buffered mode, not an incoming live AudioNode: the README says rate/input/loop controls are ignored in live-input mode. Public API:

- `await SignalsmithStretch(ctx, channelOptions)` creates the AudioNode.
- `addBuffers(channelArrays)` appends equal-length channel chunks; returned end time identifies available data. `dropBuffers(beforeSeconds)` releases whole old chunks without resetting the end time; no-argument drop resets the timeline to0.
- `schedule({active,input,output,rate,semitones,loopStart,loopEnd})` controls context-output/original-input mapping. For keylock, rate changes while semitones remains the requested key shift. With keylock off and vinyl tempo behavior, use the independently selected relationship between rate and transposition, matching current semantics and verifying audio.
- `latency()` supplies the processor's recommended scheduling lead; configure block/interval/preset before measuring. `setUpdateInterval` offers position telemetry.

A practical first path streams bounded copied PCM chunks from the already decoded AudioBuffer, retains a preroll/lookahead window around the scheduled input, and discards obsolete processor chunks. Dynamic rate/pitch/seek uses schedules on the same node, avoiding full-track rerenders. Main-thread AudioBuffer decoding is still whole-file today: bounded processor windows remove duplicate rendered-track cost but do not by themselves provide bounded compressed-file decoding. Full file streaming needs a separate browser demux/decoder path, not native approval.

Sample-rate seam: addBuffers has no sample-rate argument and indexes chunks in context-rate samples. Normal decodeAudioData commonly supplies that rate, but this engine's demo generator explicitly creates22050Hz AudioBuffers. Resample or normalize those inputs before feeding a context-rate streaming node. Never reinterpret22050 samples as48000 samples.

Far seeks require an explicit window origin. Appended chunks have contiguous internal timestamps; after drop-all, internal time starts at0. Refill around a new logical origin and schedule `input=logicalPosition-origin`, retaining enough preceding material for the processor's analysis window. Do not fill a huge seek gap with silence just to preserve indices. Reverse/loop ranges spanning discarded data need refills and ownership-aware prefetch; arbitrary negative-rate quality is not proven by the README.

For scratch handoff, keep raw signed playback audible and the streaming stretch node muted/prepared. On release, schedule the normal node at a matching original input position and future output time, then crossfade at that same position. Continue advancing the deck's intended normal clock during any handoff lead. Measure/label the restoration delay and transient quality; do not pause the entire deck while preparing a complete transform.

### Two version-specific source suspicions requiring an actual probe

1. In `SignalsmithStretch.mjs` around87–125, schedule pruning uses `objIn.outputTime` (line88), while the README documents `output`; line100 later copies `output` into the new segment. Multiple future schedules may therefore discard an earlier future segment that should remain. This is source-level suspicion, not an observed failure. The probe uses documented `output` and separately measures two future changes; it does not silently patch the vendor or assume an undocumented workaround.
2. Processing adds input latency before posting periodic inputTime (around295,340); schedule acknowledgements post another derived time (around123–125). Compare callback telemetry with audible markers and the scheduled output mapping before treating inputTime as a sample-exact audible UI clock. Node factory promises also have no application-level cancellation/error rejection wrapper; add generation/error/cleanup ownership in an eventual adapter.

Provenance is already recorded in [vendor notice](../../prototype/vendor/signalsmith-stretch/PROVENANCE.md): exact1.3.2 module hash `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46`, MIT notice, embedded WASM. This review does not refresh dependency advisories or attestations.

## Ownership and cancellation requirements

Each preparation/gesture/stream window belongs to a deck+track object+load generation+operation revision. Keep the old audible voice alive while preparing a muted candidate; commit only if all owners still match. Stop/eject/load/track replacement/blur/pointercancel/lost capture invalidate pending commands and buffers. Latest motion commands supersede queued old motion; release cannot resurrect a canceled owner. Reject pending port promises and release node/port/gains/buffer references on processor error/disposal. Rate/key changes during preparation update an explicit revision, not the immutable clock of the voice currently heard.

Only one audible transport controls each source group. Preserve ordinary channel EQ/filter/fader, crossfader, stem mutes/effects, master capture and FX timing. Store scratch temporary bypass separately from persistent `d.keylock`; do not rewrite the saved preference merely to get raw scratch audio. UI pointer coordinates are inputs, not proof of sound.

## Largest present runtime limits

`keylock.js` rejects nonidentity full transforms if input+predicted output exceeds512MiB, retains at most128MiB of transformed cache, and creates extra copies plus a WASM heap. For stereo48kHz at0.25x, that guard alone rejects above about279.62 seconds; it is not a measured safe peak-memory limit. The no-op1x/zero-shift path returns before this guard. Existing validation independently restricts tempo0.25–4, pitch±24semitones and1–8 channels. Prepared original+four-stem paths multiply aggregate memory/work beyond a per-buffer check.

Live bounded-window processing can remove the full transformed-track allocation and make rate changes continuous. Remaining work is actual browser node scheduling/latency/quality evidence, aggregate resource ownership and eventually incremental source decoding. None requires starting a native app.

## Required actual audio acceptance

Use actual AudioContext/AudioWorklet captured PCM from original stereo tone+asymmetric marker fixtures, with speakers disconnected before connection. Test normal keylocked rate1→1.25→0.8 retains440/660Hz, measured onset/rate-position continuity, dynamic seek into a different-frequency region, repeated rate/pitch changes, multiple future schedules, stop/cancel without resurrection, and bounded append/drop windows. Preserve full failed measurements before fixes.

Then integrated scratch must prove: raw+2x produces880/1320Hz from440/660Hz; negative motion reverses asymmetric markers; zero-speed hold is silent/DC-safe; release restores keylocked pitch and the correct selected or Slip backing position; paused audition stays paused after release; source replacement/eject/release races cannot restart old audio; other deck/master/stem routes retain intended behavior. Measure real handoff gaps/latency and listen/evaluate artifacts. Existing offline signal tests or a moving waveform do not establish those paths.

New isolated [live API probe](../../prototype/keylock-live-probe.html) measures unchanged vendor APIs only. Parent execution is pending; it does not modify the production engine or close ordinary-scratch acceptance.

Skills applied: use, dec-software-principles, dec-quality-testing.

## First actual live probe: append failure isolated before integration

Parent executed the initial browser probe and retained [raw first result](../prototype/keylock-live-probe-initial-results.json):4/10 reported passes,48000Hz, latency0.12s, complete captured coverage. Factory and initial single-chunk playback produced actual440.371/660.403Hz, initial onset approximately−0.001333s relative to requested output, and modulation4Hz. In that initial1x window, callback inputTime led the scheduled input estimate by approximately0.1173–0.1200s. This is one observed configuration, not a general latency correction formula.

The apparent append pass checked returned buffer-end acknowledgements only. Every subsequent audible rate/seek/future/drop window was exactly silent despite coverage1; periodic input-time callbacks stopped while command acknowledgements still arrived. The apparent stop/cancel pass observed silence after that loss of sound and therefore cannot establish cancellation of a working transport. Those two green proxy checks are not accepted as behavioral evidence.

### Defended diagnostic, vendor bytes unchanged

Executed the actual vendored1.3.2 WASM processor in the existing serial Node AudioWorklet host pattern, with48000Hz stereo PCM,128-frame blocks and matching public command protocol. A single3s chunk processed25600 frames with maximum output sample0.1509753615. Appending a second3s chunk and processing the next block threw:

```text
RangeError: offset is out of bounds
    at Float32Array.set (<anonymous>)
    at SignalsmithStretch.mjs:320:38
    at Array.forEach (<anonymous>)
    at WasmProcessor.process (SignalsmithStretch.mjs:318:15)
```

The source loop around305–327 does not advance `inputSamples` after a copied range, and increments `audioSamples` by the copied count rather than moving to the next chunk's actual origin. With additional chunks present it can copy a full analysis window from the first chunk, continue the loop because its bookkeeping still indicates unfilled input, then attempt another nonempty `.set()` on an exhausted destination subarray. This directly reproduces a multi-chunk reader exception in the unchanged processor. It does not establish that every release of Signalsmith is affected or replace an actual browser processorerror trace.

No upstream module was patched. SHA256 remains `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46`. The first browser result remains untouched. The source-level future-schedule suspicion is independent and was not resolved by the initial silent run.

### Revised isolated probe, parent execution pending

The probe now expects11 checks and records each AudioWorklet `processorerror` with node generation and context time. Active multi-chunk append must retain actual sound and produce no processor error; returned end times alone cannot pass. It remains a strict test and may fail. Rate/seek/future scheduling uses a fresh node with one18s synthetic PCM buffer per channel, explicitly labeled **not multi-chunk streaming acceptance**, so a dead append experiment cannot contaminate it. This tests live processing/dynamic schedules without offline stretched-track rendering, but still retains a whole bounded fixture in the processor.

Stop/cancel now requires measured audible output before stopping, preventing vacuous silence acceptance. The drop-before experiment uses a fresh inactive two-chunk node, drops the first whole chunk before activating the remaining one, and verifies its retained3s origin through actual audio. This tests documented drop semantics without silently claiming that the failing active multi-chunk path was repaired. Drop-all replacement still requires actual330Hz output.

Pitch, modulation-rate, coverage and silence thresholds are unchanged. No production integration, vendor modification or tolerance relaxation follows from this investigation. If the browser confirms the append exception, the next streaming step is a tested upstream correction/update or an explicitly versioned local adapter fix, with dependency provenance and full audio regressions; replacing many chunks with one whole-file array is not a completed bounded-streaming solution.


## Revised browser result and separate two-fix candidate

Parent executed the revised unchanged module: [raw result](../prototype/keylock-live-probe-results.json),9/11. The multi-chunk experiment now records an actual `processorerror`; the two queued future schedules measure about880.5Hz in the window expected to be1760Hz. Subsequent isolated single-buffer rate/seek/drop/cancel cases remain genuine measured passes. The original4/10 and9/11 raw records are unchanged.

The separate [local controller/reader variant](../../prototype/vendor/signalsmith-stretch/PATCHES.md) repairs only those two defects and uses a distinct processor registration. Original module SHA256 remains `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46`; separate variant SHA256 `4c02e593d01dcdf014841382880b11dd7fcbaa485821e8b36b02e0fcabd2a00a`. Embedded WASM/Module bytes and MIT license are unchanged.

[Actual-WASM Node regression](../../scripts/test_keylock_live_patch.mjs) executed14/14 checks: original RangeError reproduced, byte-exact real WASM input windows across irregular chunks/rates/appends/forward and backward seeks/loop/drop, exact output where an unchanged control supports that oracle, future octave interval and cancellation/restart. [Frozen measurements](../prototype/keylock-live-patch-node-results.json) retain measured outputs. The0.25 independent-original control already diverges in phase despite identical input windows, so that case proves reader inputs and meaningful finite real output rather than a sample-exact signal or perceptual-quality result. Browser thresholds have not changed. The dropped-window test uses immediate output0 to isolate reader timestamps from original future-start behavior.

The browser probe now visibly selects **Original unchanged1.3.2** or **Open Play two-fix variant (separate copy)** and reports the selected variant/hash. Expected browser count remains11, with exactly the same captured PCM pitch, modulation-rate, coverage, append/no-error, seek, future-order and cancellation criteria. Actual patched browser verification is pending the parent; no production AudioEngine changes are included.

## Production lifecycle gate: explicit shutdown still missing

Source review: the processor returns true from its normal `process()` path even when inactive, including silence processing. Public `stop()` only schedules inactive state. `dropBuffers()` transfers stored source ArrayBuffers back and resets their timeline, but keeps the WASM module/analysis buffers alive. There is no public destroy/dispose command or documented WASM free export in this wrapper. Closing the main-thread port and disconnecting the node does not establish processor termination, immediate WASM heap release or bounded CPU under repeated canceled candidates. The isolated probe closes its entire AudioContext after each run; that cleanup cannot be reused as acceptance for a shared production context.

An eventual adapter should reuse one bounded transport per current source where possible, own deck/track/load/operation generations, bound preparation/commands, reject its own pending operations once on cancellation, and immediately dispose a late-resolving factory candidate. Never let stale callbacks commit or unmute a replaced source. Use a static local factory `moduleUrl` for worklet loading rather than the wrapper's auto-generated Blob URL, which this version never revokes; loading the existing module file can avoid that URL allocation without modifying vendor code.

Before production integration, a **separate explicitly reviewed third lifecycle patch** is needed unless a demonstrated alternative actually terminates processors. Candidate design: terminal idempotent `dispose` command; clear stored source buffers, time map and input/output views; suppress time callbacks; release the module reference; return false from all subsequent `process()` calls; guard delayed WASM initialization so a disposed processor cannot configure or revive. Acknowledge disposal before port closure; the adapter must also reject pending logical requests without waiting forever for vendor acknowledgements. Dropping JS references enables garbage collection, not deterministic immediate heap deallocation; measure a bounded processor/buffer ownership invariant and repeated actual-browser worklet activity, and do not claim immediate physical-memory free from null assignments. Preserve the original module and the accepted two-fix variant when evaluating that third change.

Required lifecycle evidence: repeated cancel-before-ready and cancel-after-ready, stop/eject/load replacement and many rate changes; no later PCM/telemetry from disposed owners, terminal process false/no further DSP calls, no retained source arrays/pending logical operations, no ever-growing live processor count, and stable bounded retained-buffer accounting. Parent must run real browser scheduling and shared-context reuse, not only serial Node checks. No shutdown patch is included here.

## Audible UI clock must remain application-owned

The initial browser callback lead of approximately0.12s was measured at1x in one configuration. Periodic telemetry adds analysis/input latency and can arrive later on the main thread; it is not the audible playhead. The adapter must retain its committed source-origin and piecewise input/output schedule, sample the AudioContext clock, distinguish scheduled-versus-audible ownership during handoff, and handle loop/discontinuity maps explicitly. Calibrate onset/latency with captured asymmetric markers across rate/pitch/configurations before deriving a correction. Treat callbacks as diagnostic/preload progress, not an unverified universal `inputTime-minus0.12` UI formula.

Skills applied: use, dependency-audit, dec-software-principles, dec-quality-testing.


## Patched browser attempt: final-capture completion error retained

Parent ran the separate two-fix browser variant and retained [initial patched completion error](../prototype/keylock-live-patched-browser-initial-error.txt): final WAV extraction threw `Captured PCM has missing frames:801792/802048`. The11 checks had apparently accumulated, but this error prevented a final JSON report. This is a measurement-completion failure; it does not establish11/11 acceptance, and the original error record remains unchanged. The exact missing-frame location was not retained, so an IPC-tail race is a hypothesis until the new report identifies the frame sequence.

The capture processor now receives a finish request, posts one final actual128-frame PCM block and then a same-port FIFO fence containing that block's absolute end frame, returns false, and posts no later PCM. The main thread waits for that processed-frame acknowledgement before disconnecting/closing the port or context. Final extraction uses only those received processor frames, independently checks every block is contiguous and the final end equals the acknowledged fence, and still requires coverage1. No context-clock estimate, ignored missing quanta, silence fill or relaxed coverage threshold is used.

Any fence, cleanup or final-extraction failure is retained in `fatalErrors` alongside all accumulated checks. Final reporting publishes JSON even when WAV extraction fails; the outer runner preserves existing JSON rather than replacing the entire record with an error string. The11 functional criteria/tolerances remain unchanged. A serial host execution of the exact capture processor source verified PCM-before-fence ordering, end-frame acknowledgement, terminal false/no later messages and zero output; this is not actual browser IPC proof. Parent must rerun the patched browser probe and require11/11, no fatal errors, a completed fence and contiguous coverage1 before acceptance.


## Explicit measurement start after observed startup gap

The fenced patched browser run measured11 passing functional checks and0 failed checks, but `completed:false`: strict final validation found a gap from frame128 to384. The full JSON is preserved as [fenced initial result](../prototype/keylock-live-patched-browser-fenced-initial-results.json). This identifies a startup scheduling gap; the earlier proposed IPC-tail explanation is not established and must not be reported as the observed cause. The11/11 functional results alone still do not establish a completed capture.

The capture processor now announces readiness, emits zero output from construction and collects no PCM until an explicit arm command. The probe waits for the vendor factory and capture processor to be ready, then requests arm **before the first audible start**. The worklet acknowledges the exact first processed frame and starts PCM collection in that same block. Final validation requires that acknowledged first frame, every subsequent128-frame block through the final processed-frame fence, and coverage1. Gaps inside that armed span remain fatal; no samples are filled, discarded or ignored inside it. No functional thresholds changed.

A serial execution of the exact capture processor source exercised deliberately noncontiguous pre-arm process calls, then verified arm acknowledgement640, actual PCM frames640/768/896, final fence1024, zero output and terminal false. This verifies command/state logic rather than actual browser scheduling. A new actual browser run must independently report11/11, completed true, empty fatalErrors, coverage1 and matching arm/fence span before acceptance. If an armed-span gap remains, investigate that distinct runtime failure instead of discarding another interval.
