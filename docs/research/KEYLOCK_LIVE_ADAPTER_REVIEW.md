# Bounded forward live keylock adapter

17 October2026. Browser-only first vertical slice; production AudioEngine integration and actual browser adapter acceptance are pending parent execution. No native work. This adapter is an independent implementation with remaining limits, not complete Serato parity or a no-limits achievement.

## Current artifacts and proof

- `prototype/keylock-live.js`: SHA256 `a96cd1d244e402957b4daedb823cb2015f759d4a46df9672954b9bba1f944e78`.
- Dependency remains the amended disposable module `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e`; original and two-fix bytes remain unchanged. Existing MIT/provenance notices apply; no new remote dependency or online runtime service.
- [Focused executed result](KEYLOCK_LIVE_ADAPTER_NODE_RESULTS.json):19/19. Real unchanged WASM/processor runs in a serial Node message bridge; native AudioBuffer and gain scheduling are represented by explicit test collaborators. This is **not** real browser AudioContext/AudioBuffer proof.
- [Initial failed result](KEYLOCK_LIVE_ADAPTER_INITIAL_NODE_RESULTS.json):18/19, retained. Successful terminal disposal incorrectly inherited an already-reported append-operation failure from its awaited refill barrier. Current cleanup still awaits the canceled refill but only a disposal-ack failure rejects cleanup; the original operation rejection and error event remain observable.
- Syntax checks executed for the adapter, Node test and browser harness.
- [Actual browser harness](../../prototype/keylock-live-harness.html): parent execution pending. Expected8/8, completed true, no fatal errors,7 complete armed capture spans with coverage1.

## Exact API

```js
import {createLiveKeylock} from './keylock-live.js';
const live = await createLiveKeylock(context, {
  buffers: [original], // or original plus the FOUR supplied aligned stems, unchanged order
  position: 0, rate: 1, keylock: true, semitones: 0,
  signal: owner.signal,
  onEvent(event) { /* check deck/track/load owner before changing engine/UI */ }
});
// live.outputs: stable GainNode[1] or GainNode[5], source channel counts preserved.
const scheduled = await live.start({position, when});
await live.update({rate:1.25, keylock:true, semitones:0});
await live.seek(originalSeconds); // same nodes if covered; bounded replacement otherwise
await live.pause();
const originalSecondsNow = live.position();
const detail = live.snapshot();
await live.dispose(); // terminal, idempotent Promise
```

Do not reorder or label the buffers inside the adapter. Parent's actual array is `[original,vocal,other/melody,bass,drums]`. Each source retains1..8 channels; there is no invented stereo mixdown. Source count stays fixed for an adapter. When prepared stems become available, parent creates a new5-output adapter and performs an owned handoff, preserving the supplied array.

Five-source validation matches the existing prepared contract: all four stems share sample rate and length; their duration may differ from the original by at most0.1s. Original rate may differ. Original audible duration is authoritative. Longer stem boundary samples are trimmed; missing boundary samples are zero inputs to SRC; `sourceGeometry` reports each index's original sample rate, frames, channels, duration, trimmed/padded tail and decoded byte geometry. This preserves the existing tolerance rather than imposing a new1-sample hurdle. It does not prove that semantically unaligned content is aligned merely because durations fit.

Event shapes:

```js
{type:'ended', contextTime, position: originalDuration}
{type:'error', contextTime, error:{name, message}}
```

Error immediately mutes and terminally disposes the adapter; an UnderrunError never silently starts a full-file render. Other events are `preparing` (group/position/origin), `prepared` (snapshot), `scheduled` (actual accepted mapping), `paused` (mapping), `late-ack` (requestedOutput/acknowledgedAt/group) and `disposed` (snapshot). Observer exceptions cannot revive or alter an audio owner. `ended` is clock/driver based after scheduling the processor's original-end stop; browser end/tail timing still requires the actual harness.

## Caller integration and timing contract

`start/update/seek` return `{when,position,playing,rate,keylock,semitones,effectiveSemitones,group,origin,latencyLead,transitionSeconds,superseded}` after all processor command acknowledgements, before that future output time where practical. Acknowledgements prove accepted commands, not audible output. Default `when` is computed after window preparation from the maximum **queried** node latency plus two128-frame quanta. There is no hardcoded120ms correction. An explicit time earlier than that current policy rejects LateScheduleError; if preparation consumes an explicit caller deadline the prior audible owner remains intact. A late acknowledgement is emitted as a separate diagnostic, not silently called zero-delay playback.

The supplied `start.position` is the desired original position **at its output time**. To hand off an advancing external old voice, parent must choose an output time with preparation/command margin and use the old voice's original position at that time. Do not reuse the stale position captured before asynchronous preparation. Parent retains old voice, routes and immutable clock until the new start is accepted and still belongs to the same deck/track/load/request; schedule its gain/stop handoff at returned `when`. `transitionSeconds:0` for initial activation means this adapter does not itself own the external old voice's fade. Internal far-seek replacements use10ms crossfades behind stable outputs. Physical onset/transition quality is measured by the public harness rather than inferred from this mapping.

Parent routes original output into its existing original gain/input path, and each stem output through the existing per-stem history then gain/FX route. The adapter does not change those gains, history, channel effects, crossfader, master capture or stem mute semantics. Do not identify this object as `stemSlipTransport`; that property has different crossfader/backing-clock behavior. Suggested ordinary voice property is separately named, parent-owned.

The application clock is piecewise committed input/output mapping in original-track seconds. It uses AudioContext time; vendor early inputTime callbacks are unused. Accepted active commands stay reflected in that clock even if a newer request arrives while their RPC acknowledgements are pending. Obsolete muted replacement groups are discarded before unmute/clock commitment. Pause cancels pending future starts, gates all owned audio and freezes the clock. Dispose freezes it again at the current original position. Context suspension uses the context clock, not wall-clock extrapolation. This is not an unrestricted historical-timeline query API; old clock segments are pruned as time advances.

## Bounded window and SRC mechanics

Each group owns separate buffered nodes for the1 or5 supplied sources. Context-rate chunks are0.5s. The selected forward window retains approximately1s source preroll and8s source lookahead, rounded to whole chunks. Whole old chunks drop **before** new copies append. Near seeks reuse a node only if preroll and immediate analysis/lookahead safety fit the retained window; refill restores the target lookahead. Far seeks create a muted group with a context-frame-aligned logical origin near the new position, rather than padding silence from zero to that file position. All sources receive identical frame geometry and output mappings.

At most selected+one preparing/retiring group are permitted. Replacement waits for the previous retirement acknowledgement before allocating another group. Group refill work is serialized; the50ms driver coalesces its activity and never overlaps one group's copy stream. Each in-flight chunk is bounded; yielding SRC checks owner/group cancellation before and after yields, factory awaits, transfers and RPCs. Abort/replace/dispose cancel candidate controllers, driver timers and future starts, mute outputs and invoke the already-tested terminal node disposal. Late factories cannot return live owners. A prepared-notification abort has an explicit post-await owner check.

Equal-rate sources use bounded direct sample copies. Differing rates use an independently chosen32-tap Hann-windowed sinc with1024 fractional phases and a0.94 cutoff factor (downsample cutoff scales to target Nyquist). Every output uses the same absolute source phase and reads a bounded halo directly from the existing source array, so independently copied neighboring chunks agree exactly. No complete resampled input or stretched output track is created. The eight-entry Float64 coefficient-table cache is separately bounded at approximately2MiB; it is not included in transferred PCM counters. This prototype SRC is not claimed to match Serato or provide universal perceptual transparency.

`snapshot.retainedPCMBytes` counts acknowledged processor source chunks; `inFlightPCMBytes` counts copied/transfer staging. These exclude existing decoded inputs, coefficient tables and opaque WASM heaps. Nominal retained PCM is at most10s × contextSampleRate × sum(sourceChannels) ×4 bytes per group; selected+candidate may temporarily double that. At48kHz: stereo original up to3.84MB/group; original+four stereo stems up to19.2MB/group; general1..8-channel sources scale by their actual sum. The serviced4x Node fixture observed maximum3,648,000bytes (9.5s stereo) before drop. This is explicit PCM ownership accounting, not measured total peak process memory or GC proof.

Decoded AudioBuffers remain whole-file caller inputs and may dominate memory. Existing browser decoding/separation allocations are not repaired here. Background throttling or a main-thread stall can still overtake this finite forward window; the adapter detects the missed deadline, reports UnderrunError and stops. It does not copy an unbounded skipped interval or hide a whole-track fallback. The50ms driver and lookahead are independent prototype policy, not vendor timing or a proven general reliability guarantee.

## Executed19-case evidence

-22050→48000 SRC: adjacent chunks exactly equal one combined SRC operation,440Hz retained, source-end zero halo tested.
-96000→48000:35kHz far-stopband fixture attenuated63.23dB relative to1kHz passband fixture. This checks that example, not a full alias/quality sweep.
-Same-rate8-channel copy preserves order/explicit zero boundary; actual8-channel WASM outputs preserve eight distinct tones.
-SRC yields then aborts before completion.
-Five positional sources preserve original/stem order, common stem geometry and reported0.05s permitted boundary padding; five actual WASM output tones are distinct.
-One live node retains approximately440.39/440.36/440.41Hz through1→1.25→.8 rates; +12 keyshift measured881.14Hz. No whole-track output render or node replacement occurred.
-Near seek reuses nodes; far seek rebases to origin19 for position20 and measures880.50Hz, stable output identity, old group retired.
-Serviced4x refill advances/drops old chunks within the stated PCM bound.
-Pause before future start stays silent/frozen; owner abort before future start retires nodes, yields0 retained/in-flight PCM and no clock/audio resurrection.
-Queued and already-constructing superseded candidates reject/dispose while retaining the prior owner and latest request.
-Immediate preparation abort cannot return a late adapter; prepared-notification abort cannot cross the factory await boundary.
-Partial active schedule or window-append RPC errors mute/dispose the entire positional group instead of leaving stems out of sync.
-Late explicit far-seek deadline rejects/disposes the candidate while prior owner remains audible.
-Missed refill deadline reports UnderrunError and stops without unbounded gap copies.

These tests execute the real WASM but use an explicit serial host, AudioBuffer-shaped source collaborator and simplified gain graph. They do not prove real browser timing, native AudioBuffer branding, onset, crossfade audio, timer performance or engine routing.

## Actual browser acceptance handoff

Open `prototype/keylock-live-harness.html`, click Run. Expected8/8, completed true, fatalErrors empty,7 full armed capture integrity records with coverage1. It uses native22050Hz/48kHz AudioBuffers, actual uninstrumented frozen vendor nodes, fixed-stereo buses with actual zero-source input, a307Hz continuing control, and source regions440→550→880. Preflight requires64 actual contiguous process quanta after readiness; startup gaps remain recorded; every frame and producer sequence after arm through final FIFO fence is mandatory.

The eight criteria cover initial normalization/onset (explicit independent±30ms budget), same-group dynamic rates/pitch and measured4Hz source modulation, live keyshift/restoration, near/far source-region seeks and explicit20ms maximum low-RMS handoff gap budget, actual4x refill/drop bound, five supplied positional outputs and tolerated boundary geometry, owner abort before future5-source playback, and pause canceling future original playback while the control remains audible. Preserve the full raw failures; do not loosen tolerances after observing a failure. These quantitative onset/gap checks still do not replace listening/perceptual evaluation.

Only after actual browser acceptance and an exact checkpoint may parent integrate ordinary forward `!reverse && !loop && stemSlipOff` voices in AudioEngine. Reverse, ordinary loops and existing Stem Slip remain on their present buffered paths until separately implemented and verified. Current.25..4 rate/±24 requested/effective pitch,1..8 channels, fixed chunk/SRC/driver budgets and whole decoded input memory are visible remaining gaps. Native app approval remains unchanged; this browser work is not gated by native approval.

Skills applied: use, dec-software-principles, dec-quality-testing, dec-web-performance.
