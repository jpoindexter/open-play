# Stems activation on a keylocked original: phase-dip diagnosis and ownership design

18 October 2026 · Open Play · Claude Fable 5.1 (model id `claude-fable-5-1`), High reasoning as selected in the handoff (effort level is not observable from inside the session) · read-only consultation requested by Codex per Jason's standing authorization. Scope: `handoffs/stem-activation-phase-fable-20261018.md`. **Not** the full Serato parity audit. Nothing below is implemented or fixed; recommendations are code-path only.

## 0. Inspected inputs

| Item | SHA-256 / identity |
|---|---|
| Git HEAD | `fd467137045ac1c9f0d06b57c57f9a940ca8549f` (worktree adds only the handoff + serial experiment) |
| `prototype/engine.js` | `a766be018575e2a4481495ddcf0037a3169defe01a0d22dd1d2fd8fd6c9c72c2` |
| `prototype/keylock-shadow-live.js` | `eed7a433632ca6a4523d091b7b08e2530d1fc89d3004531387370a5fdf756745` |
| `prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs` | `1f470f846a993cc750ee2e111817adb08879493025c7322eadc8cf98323e4ef8` |
| `experiments/stem_activation_phase.mjs` | `2b37fc232b86d2b5d9e1deb15653029d4f0185acc3d5dc164426aab09a80f2a6` |
| Retained serial PCM | `local-evidence/stem-activation-phase-138/{warm2,late2,warm10,late10}-{0,1}.f32` + `original.json` (hashes match the receipt) |
| Retained browser failure | `local-evidence/stem-activation-137/pitch-original.json`, `pitch-harness.js`; afterreport `docs/prototype/stem-activation-pitch-results.json` |
| Later Codex additions (read, not re-executed) | `docs/prototype/stem-activation-phase-isolation-results.json`, `stem-activation-phase-repeatability-results.json` |
| Stem job | `local-evidence/stem-jobs/a2877adfbffa4ece8ec544451917a589/` (input.wav + 4 stem WAVs) |

Also read: `docs/prototype/STEM_ACTIVATION_REVIEW.md`, `prototype/sync-tempo-handoff.js`, engine `attachStems`, `startForwardKeylock`, `start`, `routeOrdinaryVoice`, `retireVoiceAt`, `voiceClock`, `setRate`, `setPitch`, `ensureStemState`, `updateStems`.

### Executed diagnostic (the one permitted command)

`python3 -I <scratchpad>/inspect.py` (numpy 2.2.6, ~2 s, read-only; wrote nothing under the repo or `local-evidence/`). It re-derived tone amplitude/phase by least-squares fit on an absolute time axis over 1.0–1.8 s of each serial file, ran a "single common time shift" consistency test across the two tones, computed 10 ms RMS traces, and checked stem mixture consistency. **One sub-check was invalid**: my browser-capture fit used capture-relative time where the afterreport uses audio time (capture starts at frame 30976 = 0.7024 s), so its before/after windows straddled the boundary. Per Jason's instruction I did not re-run; browser numbers below are Codex's, not mine.

## 1. What the evidence proves vs. what is inferred

### Proven (measured on retained PCM)

**P1. Every inter-instance difference is phase/timing only. Amplitude is unchanged.**
Serial, window 1.0–1.8 s, both tones: amplitude ratio to warm2 = 1.00003 / 0.99999 (late2), 1.00002 / 1.00000 (warm10), 1.00002 / 0.99999 (late10). The handoff's "relativeRMS" is the residual RMS of (candidate − warm2) over warm2 RMS and equals **2·sin(Δφ/2)** to three decimals in all six cases (e.g. late2: 1.324 ↔ Δφ −82.89°; late10 ch1: 1.984 ↔ −165.55°). Steady 10 ms RMS over 1.0–1.95 s is 0.0827–0.0870 for all four instances: **no instance has a level dip once running**. The browser afterreport agrees: tone amplitude 0.19440→0.19446 across activation.

**P2. The 10 ms linear crossfade of two phase-offset equal-amplitude signals is sufficient to produce a dip of this order.**
Exact RMS over a linear crossfade of two unit tones offset by θ is √(2/3 + cos θ/3): for Codex's measured 157.02° → 0.600; for −62.09° → 0.907. Measured minimum 10 ms ratios are 0.6454 / 0.8148. Left matches (window not aligned to the fade raises it slightly). **Right does not match** (0.907 predicted vs 0.815 measured); see U2.

**P3. Start time alone changes output phase; channel layout alone changes output phase; both are deterministic.**
late2 vs warm2 (same logical trajectory, same latency 0.12 s): −82.89° / −135.07°. warm10 vs warm2 (same start, 10 vs 2 channels): +13.02° / +24.90°. Repeat runs are byte-identical (Codex repeatability file). So this is not clock lag (clock lag was 0 in the browser), not random, not level.

**P4. The three serial differences are each consistent with one small common time shift for both tones.**
Smallest solution (n=m=0) of Δφ₃₃₀/(360·330) vs Δφ₅₅₀/(360·550):

| pair | implied shift @330 Hz | @550 Hz | disagreement |
|---|---|---|---|
| late2 − warm2 | −0.698 ms | −0.682 ms | 16 µs (<1 sample) |
| late10 − warm2 | −0.842 ms | −0.836 ms | 6 µs |
| warm10 − warm2 | +0.110 ms | +0.126 ms | 16 µs |

With only two tones this test is weak (roughly a 5 % chance per pair of a spurious fit within ±1 ms), but three independent pairs all agreeing at the trivial solution is unlikely by chance. A classic accumulating phase vocoder would predict 180°/180° for late-vs-warm (input anchor 0.55 s vs output offset 0.50 s at rate 1.1); the data refutes that model for this DSP.

**P5. The SCNet export is mixture-consistent to float precision.** Σstems − input: max |d| = 7.6e-9, RMS ratio 2.1e-8. The tone energy is in `other` (RMS 0.0848); vocals/bass/drums ≈ 0.0002.

**P6. Why the ordinary-loop path passes and the keylock path fails.** `AudioBufferSourceNode` output phase is pinned to sample position, so the plan-137 old→new gate crossfade is coherent. A Signalsmith instance's output phase is **not** pinned to input position (P3), so the same crossfade between two instances is incoherent.

### Inferred (mechanism, not proven)

**I1.** The wrapper calls `_seek(bufferLength, rate)` + `_process(0, 128)` every quantum while active, and `_process(128,128)` on zeros while inactive (`process()`, lines ~272–340). Internal stretcher state (hop position / previous output spectrum) is seeded at creation and advanced by every quantum including inactive ones. The resulting sub-ms output offset (P4) is therefore a function of creation frame and the number of quanta before the first active one. Not verified against WASM internals.

**I2.** Signalsmith Stretch computes per-bin phase decisions shared across channels (energy-weighted / dominant channel), which is also why partial stems cancel coherently inside one instance. With stem channels present, the dominant channel per bin changes, perturbing the original pair (warm10 vs warm2). **UNVERIFIED** — recollection of `signalsmith-stretch.h`, not read in this session; the WASM is opaque here.

**I3.** For broadband music the inter-instance difference will not be a single time shift; expect per-bin rotations (comb-filter-like dip during any cross-instance crossfade), unbounded at high frequencies even for the 0.12 ms layout-only case (0.12 ms = 216° at 5 kHz).

### Decisive evidence still missing

- **M1.** Browser before/after phase computed on one absolute axis with the same convention as the serial fits (my attempt was mis-windowed). Codex's 157.02°/−62.09° do **not** fit a common time shift (best disagreement 0.18 ms ≈ 8 samples), unlike every serial pair. Either the browser adds a per-bin component (I2 with real stems, or real-clock quantization) or the inspector's `angle(proj_after/proj_before)` uses segment-relative axes. Resolve by reading `scripts/inspect_stem_activation.py` line ~47 and re-fitting on audio time.
- **M2.** Whether the serial offset depends on `createdFrame mod intervalSamples` (I1). Two or three extra `createdFrame` values in the existing serial harness (new output dir) would decide it; not a sweep.
- **M3.** Any real-music (non-tone) inter-instance measurement.

## 2. Why no replacement-instance strategy can pass

The acceptance criterion measures the **original's** continuity across activation. Any strategy that puts a new processor instance on the original path crossfades two instances whose outputs differ by a deterministic but content/layout/start-dependent phase. P3 shows even a perfectly warm, same-anchor instance differs once the layout changes. Therefore: **the original's processor node must keep running, untouched, through activation.** Stems have to be added beside it, not instead of it.

## 3. Recommended design: in-group stems node with deferred, one-way ownership transfer

All inside the existing `LiveKeylock` adapter (one clock, one `operation()` serial, one driver, one `group`). No second adapter, no second owner.

### States

1. **Original-only** (today): active group `nodes=[N2]` (2-ch), `outputs=[o0]`.
2. **Attached, transfer pending** (new): same group, `nodes=[N2, N10]`, `outputs=[o0,o1..o4]`. `N2`→`o0` at gain 1 (unchanged). `N10` stem channels→`o1..o4` via the existing splitter/merger routing; `N10` original channels→`transferGain` (0)→`o0`. Audible output is bit-for-bit what it was: **zero discontinuity by construction.**
3. **Transferred** (new, one-way): on the first partial-stems route (first time `updateStems` computes `originalMix=false`), the adapter ramps `N2`→0 and `transferGain`→1 over `CROSSFADE_SECONDS` at the engine's ramp instant, then disposes `N2`. The group is now exactly today's 10-ch replacement voice; every later all-on↔partial change is in-instance and coherent, as today.

The cross-instance discontinuity is **relocated** to the first user-initiated pad action and **bounded to once per attach**. It is not eliminated. Say so in acceptance; do not gate it as continuity.

### Why 10-ch (original+stems) rather than an 8-ch stems-only node

10-ch reuses `newGroup`'s existing layout/routing code verbatim and keeps the product rule "all-on uses the original" after transfer. Cost: +2 channels of DSP between attach and first toggle (12 vs today's 10), then 10. The 8-ch variant is CPU-neutral (2+8) but makes post-transfer all-on = Σstems; P5 shows that is exact for this export policy, so it is a legitimate smaller-CPU option **if** you accept Σstems as the all-on route as policy. Recommend 10-ch first.

### What must change (code path only)

`prototype/keylock-shadow-live.js`
- `attachSources(stemBuffers)`: run inside `operation()`; validate 4 buffers with the existing 5-source geometry rule; `this.sources` 1→5; create 4 discrete output gains; on the **active** group only (abort if a replacement op is pending — `checkOperation`), `Stretch(..., outputChannelCount:[10])`; **assert `latency` equals `nodes[0].latency`** (same preset/sampleRate; otherwise fail the op, dispose the new node, original untouched).
- Fill for the new node: replay the group's retained partition `[startFrame, endFrame)` using `group.chunks` boundaries so `dropBuffers` extents stay equal across nodes (the current alignment assert compares all nodes). The wrapper's `audioBuffersStart` only advances by dropping, so either (a) add placeholder chunks for `[originFrame, startFrame)` then `dropBuffers((startFrame−originFrame)/sr)` on the new node only, or (b) make the alignment check per-node-offset aware. (a) is smaller. `chunk.bytes` gains 4 entries; `checkPCMAllocation` unchanged.
- `program(group, state, nodes = group.nodes)`: replay `stateAt(now, group.segments)` anchored at `now` plus every `segments[i].when ≥ now`, and the `stop(end)` for playing segments, to the new node only. The wrapper tolerates a past `output` anchor (it computes `input` from the segment). Startup transient is inaudible: `transferGain=0`.
- `transferOriginal({when})`: the ramp above; then node disposal mirroring `disposeGroup`'s per-node path; `group.nodes=[N10]`; `snapshot()` gains `transferPending`, `nodeCount` already exists.
- `fillWindow`/`fill*` and `newGroup` already iterate `this.sources`, so any later seek-driven `newGroup` builds 10-ch; the retire/crossfade path there is unchanged (seeks are content discontinuities anyway).
- `dispose()` must cover both nodes (it maps `groups`→`disposeGroup`→`group.nodes`, so it already does).

`prototype/engine.js`
- `attachStems`: for decks whose voice is `liveKeylock` **and** forward/non-grid/non-gesture, call `adapter.attachSources(stems)` instead of `start()`; wire returned `outputs[1..4]` into `ensureStemState(d).histories[i].node` exactly as `routeOrdinaryVoice`'s `i>0` branch; set `voice.stemHistoryState`, `voice.stemGains` (5 entries), `voice.stemInitialized=false`; call `updateStems(d)` (all-on → stems 0, original 1). No `createSyncTempoHandoff` barrier for these decks: nothing starts or retires. Failure → the adapter disposed only the new node; the existing `previous` restore logic stands.
- `updateStems`: when `originalMix` flips to false and `voice.liveKeylock?.snapshot().transferPending`, call `transferOriginal({when: ctx.currentTime})` once (engine stem ramps are `setTargetAtTime(…, 0.003)` from `currentTime`; use the same instant).
- `stemGains[0]` for an attached-in-place voice: the original path today is `adapter.outputs[0]→sourceGates[0]→deckInput` with no `stemGains[0]`. Smallest option: let `stemGains[0]` **be** `voice.sourceGates[0]` (it is already a unity series gain on the original path), avoiding any live graph re-route. Check `retireVoiceAt` never touches this voice's gates later (it only runs on retirement, and after transfer the all-on route is the adapter's `outputs[0]` fed by `N10`, so `sourceGates[0]` keeps its meaning). Uncertain; see U4.
- All other paths (`setRate`, `setPitch`, `setLoop`, seek, Sync) are untouched: they talk to the single adapter.

Tests: extend the controlled-renderer coordination suite (`scripts/test_stem_activation.mjs`) with: attach on a live adapter leaves `nodes.length===2`, outputs 5, original gain path unchanged, one `operation` serial; `update({rate})` after attach programs both nodes once each; failure during `attachSources` leaves `nodes.length===1` and outputs 1; `transferOriginal` is idempotent and one-way.

### Rejected approaches

| Approach | Why rejected |
|---|---|
| Gain compensation, equal-power or longer fades | A crossfade of two signals offset by θ dips to \|cos(θ/2)\| at the midpoint regardless of length or law (θ=157° → 0.20). Also forbidden by the handoff. |
| Fit a time shift onto the new instance's `output` anchor | The offset depends on start, layout and (I2) content; warm10≠warm2 proves layout alone shifts it. Tone-fitted; forbidden. |
| Second `LiveKeylock` for stems | Hidden second owner: separate clock/driver/serial drifts on rate, key, seek, Sync. Forbidden. |
| Grow channels on one node | Wrapper's `configure()` on channel-count change re-presets (resets) the stretcher; Web Audio fixes `outputChannelCount` at construction. Equivalent to replacement. |
| Export/import stretcher state into the new instance | Needs a WASM/native change (out of scope); I2 implies stem-channel cold state can still perturb shared per-bin decisions. Park. |
| Transfer immediately at activation | That is the current behavior and the retained failure. |

## 4. One bounded falsifiable next experiment

**Prototype the design off-production** (copy of `keylock-shadow-live.js` + engine attach branch in the harness, or a feature-gated branch; nothing built native), then run the existing browser diagnostic with `?pitch=1` (4 s capture, rate 1.1, keylock on, same job cache). Acceptance, all required, same thresholds as today plus two new ones:

1. Longest near-zero run ≤ 1 ms; every 10 ms window RMS ≥ 0.85 of baseline; max adjacent jump ≤ 0.03; acknowledgment clock lag 0 (unchanged).
2. **New, stricter:** |Δφ| < 2° for both tones across activation on a single audio-time axis (the original node literally continues, so a phase change falsifies the design). Fix M1 first.
3. **One-owner proof:** after activation, `setRate(d, 1.0)` via the real path; `adapter.snapshot()` shows exactly one active group with `nodeCount 2`, one `scheduled` event, and audible position tracks `voiceClock` within 1 ms; no second adapter in `engine.voices`.
4. Pads: all four off → exact silence; all on → nonzero original route; Stop → exact silence (unchanged).
5. **Documented, not gated:** mute `vocals` (near-silent stem, P5) as the first partial toggle; capture 150 ms around it with the same metrics. Expect a once-only cross-instance dip; record its depth. If it is *not* visible the layout/start phase theory is wrong and should be revisited.

If 1–4 fail with the original node provably untouched, the design is wrong. Secondary, optional, cheap: M2 (two extra `createdFrame` values in the serial harness) to learn whether the inter-instance offset is hop-grid alignment that could be designed out for seeks and the transfer.

## 5. Remaining unknowns

- **U1.** Exact Signalsmith internal mechanism (I1, I2) — WASM not inspected.
- **U2.** Right-channel browser dip (0.815) is deeper than the pure phase-crossfade prediction (0.907). Possible: inspector phase convention (M1), real-clock 128-frame quantization of `output` anchors, or an additional ramp overlap I did not find. Left channel is consistent.
- **U3.** Whether real music shows per-bin (not common-shift) inter-instance differences (I3).
- **U4.** Exact engine wiring of `stemGains[0]` for an attached-in-place voice without a live graph re-route; whether Web Audio connect/disconnect of a running path is sample-continuous was not verified here.
- **U5.** `dropBuffers` extent alignment for a node that joins mid-window (two options given; neither executed).
- **U6.** Interaction with a pending replacement operation, grid timelines (`startTimeline` forbids attach while playing), censor/scratch shadows and Stem Slip voices — all excluded from this path; they keep today's replacement behavior.
- **U7.** Serato's actual behavior at stem activation is not known and is not claimed.

## 6. Preserved state

No production, package, service, Git, Trello or hardware state changed. Desktop 0.1.23 remains stopped / Master −12 / Hercules prepared; main 8768 service untouched; original audio, model, profile, mappings and prior recordings intact. Only this file was written.
