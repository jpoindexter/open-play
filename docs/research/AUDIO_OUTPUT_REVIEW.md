# Audio output controller: independent lifecycle review

2026-10-17. Bounded read-only production review of output selection and source-route ownership. Owned additions are `scripts/test_audio_output_review.mjs`, this report, and the authorized new result JSON files. No devices were accessed, unplugged, or changed; no UI, native runtime, Git, or remote actions were performed.

## Executed result and limits

`node scripts/test_audio_output_review.mjs` now executes **13 checks passing, 0 failing** against the actual output-selection controller. Exact final stdout is saved as `docs/prototype/audio-output-independent-results.json`. A concrete earlier failure is preserved unchanged in `docs/prototype/audio-output-independent-failure-results.json`.

The host controls the context's `setSinkId` promises, device enumeration/events, and monitor API. The tests exercise real controller scheduling, identity bookkeeping, and cleanup, but they do not render PCM or operate a real device. Consequently this report does not establish physical headphone/master sockets, real OS fallback timing, click-free switching, actual hot-unplug safety, browser permissions, engine MediaRecorder isolation, or musical acceptance. The parent's actual monitor/engine audio harnesses remain separate evidence; their checks were not run by this reviewer.

## Confirmed initial defect: enumeration failure left an already drifted cue route open

Reproduced against controller `d727f9d964806dd5d9850b39210e590b807bebac89d379563ecd1de85eacb8be`:

1. Explicitly select device A, then enable four-channel master/cue routing.
2. Change the controlled context's observed sink identity to system default (`''`).
3. Request routing again; hold the pending enumeration promise, then reject it with `Enumeration unavailable`.
4. The controller propagated the error before reaching its sink-identity mute guard. Actual controller state remained `deviceId: A`, physical layout `four-channel`, cue channels `[3,4]`, **physicalMuted: false**, while observed actual sink was default.

The prior twelve-case run had **11 passing, 1 failing** checks. Its complete executed output, including the unmodified failure assertion and state, is the immutable failure JSON. This establishes an incorrect live-route state under the controlled context; it is not a claim that real cue audio was heard through speakers.

The parent corrected `prototype/audio-output.js:39–43`: known sink mismatch mutes before asynchronous enumeration; enumeration failure mutes and records the error while the current request still owns validation. The desired-state regression now checks both the mute **while validation is pending** and the mute/master-only condition after rejection. It passes without accepting an open quad route. A separate capacity-failure regression confirms that rejecting quad on a two-channel destination still preserves the known valid prior stereo route and its unmuted master playback.

## Other executed lifecycle cases

| Case | Executed criterion |
| --- | --- |
| Explicit A→B output selection from quad | Observed B identity committed; layout resets to stereo master before reopening; cue output is absent. |
| Overlapping A/B selections | Physical route stays muted until the latest native call commits; final actual and selected identities are B. |
| Pending A selection followed by route | Actual successful A identity is reflected, and queued routing finishes without indefinite mute. |
| Superseded A succeeds, later B rejects | Retained actual A identity is displayed if playback reopens; it is never unmuted under stale X/default identity. |
| Rejected/aborted native selection | Confirmed available retained sink may reopen only stereo master; prior quad cue is not blindly restored. |
| Rejected selection after missing retained device or changed default sink | Physical output remains muted. |
| Device change during pending B selection | Confirmed attached B may resume stereo master; missing B remains muted with explicit disconnected/changed status. |
| Disappearance/default fallback, then explicit default selection | Event handling mutes; later default selection reopens only stereo master, with no cue channels. |
| Invalid quad before specific selection | Empty/default identities reject four-channel routing. |
| Disposal during native selection/list | No callbacks or node reopen after settlement; pending selection remains physically muted; event listener is removed. |
| Disposal during route/device-change validation | No late graph calls or callbacks; device-change mute is not undone. |

The device-change case initially asserted unconditional mute even when the completed native switch had become confirmed, attached B and reset to stereo. That was an overstrict fixture expectation. It was corrected to the task-derived criterion: either remain muted or reopen only confirmed master-only selected output. A missing-B branch explicitly requires mute. This was not a production defect or relaxation allowing cue on default.

The initial source inspection also identified pending-selection/route identity and superseded-success/rejected-latest bookkeeping candidates. The parent corrected those before this review's first controlled execution. The passing regressions verify their current behavior; this reviewer does not claim an executed old-code failure for those candidates.

## Graph source inspection: ownership and remaining boundary

Code-path observations, not executed PCM acceptance:

- `prototype/engine.js:79–81` connects master separately to its analyser and MediaStream recording destination. New cue monitoring is created from analyser master and deck monitor taps (`:116`); this source path does not attach the headphone bus to the recording destination.
- Ordinary deck routing goes through EQ/effect/filter into `monitorTap`, then channel gain (`:98–102,687,691,715`). The cue tap therefore precedes ordinary channel level/crossfader gain. PFL trim is explicitly passed to the monitor (`:633,649`). Channel-effect rebuilds continue to target `monitorTap` rather than bypassing it.
- `prototype/audio-monitor.js:22–30` constructs distinct cue, headphone, and physical master paths. Only four-channel physical mapping connects the headphone split (`:51–52`); stereo physical mapping connects master only. Mono processing now feeds the normal master headphone path through `masterOutput` (`:28`).
- Physical route replacement disconnects exact old merger edges, preserving unrelated master/recording connections (`:54–57`). Disposal removes exact source→owned-input edges and disconnects its owned nodes (`:65`); it does not issue a blanket disconnect on the caller-owned master or deck taps.

One specific boundary was forwarded to the parent for actual engine PCM coverage: StemSlip selected-source route gains receive crossfader gain upstream of deck input (`engine.js:641–643`, route construction around `:943–946`). The new cue tap is downstream of that input. Thus ordinary pre-crossfader PFL source inspection alone does not establish the same behavior for selected StemSlip material. This review did not execute that audio path or classify it as a confirmed PCM defect. Full pre-crossfader cue claims should retain that boundary until the parent tests it.

## Final reviewed snapshot

Source files were under active parent development. These hashes identify the snapshot read at final execution; they do not assert that other source files are permanently frozen.

| Artifact | SHA-256 |
| --- | --- |
| Actual controller executed | `8c71a48f800393951f66cf481b2f83b195616d5b8d6174f335b5071007f96150` |
| Monitor source inspected | `31a07bd6277bf19ec05495d207f7228505c8c948a9314531702706596bf4eada` |
| Engine source inspected | `8d110197bdafd97b11eb01e2199ff5542f5372e5da27f4b5562c14bedfc1a295` |
| Panels source inspected | `aa9ad663f657030a64bedda5b14ba3fcb670ca093f3b63da712cc3406343a86e` |
| Independent 13-case test | `d16fb2fcdc026971999877245a2562508f2d0374cc5e7061b92a4b91bc613ff8` |
| Final 13/13 actual controller result | `9dcfd6e6a556e961cd458e46e069d49e9500b999722adfb211a1a27b8438c763` |
| Preserved 11/12 failure result | `875e93d94cf094b3f3c4c85049a1ecdd557c4dcc7d3821f179cea11595ca6a1c` |

No additional defended controller defect remained in the bounded cases. The final result authorizes no claim beyond controlled selection lifecycle and the stated source inspection. Existing application stack and authorized project scope are preserved.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.
