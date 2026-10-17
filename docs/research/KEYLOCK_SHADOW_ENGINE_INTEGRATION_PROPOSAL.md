# Conditional AudioEngine shadow-return integration proposal

17 October2026. **Proposal only; no engine, adapter, harness or native implementation.** Reviewed engine SHA256 `0b61a4f9411c78254f6ec02e972cec835c4c10ddb4ce4a5d936ef57bfc6e8057`. Line references below identify that exact snapshot. Parent must first accept the revised real-browser shadow candidate; neither this document nor source inspection accepts it.

Skills matched (3): use, dec-quality-testing, dec-software-principles.

## Evidence and bounded target

[Initial actual shadow JSON](../prototype/keylock-shadow-return-browser-initial-results.json) completed with no fatal/cleanup errors. [Independent initial inspection](../prototype/keylock-shadow-return-browser-initial-inspection.json) reports all ten audio/cursor rows passing, but only3/10 overall due extra groups and overlong quick gestures. All21 retained stereo PCM captures are separate evidence. That is promising bounded audio evidence, **not** acceptance of the group/quick failures. Revised2second retention/quick stimulus experiment is pending parent execution/acceptance at this proposal's creation.

Target: while a playing, forward, unlooped transformed deck is scratched through the existing raw transport, retain its live pitch-correct owner active but inaudible; on release expose that active signal without an unshifted raw bridge, and align its original-seconds cursor to the authoritative returned scratch clock at the future output time. Preserve original plus four positional outputs `[original,vocal,other/melody,bass,drums]`, histories, stem/Channel/unit FX, crossfade and other decks.

The actual fixture verifies cursor at release+200ms with a calibrated nonperiodic marker, not sample-exact position from the first released frame. Its40ms FFT pitch window also cannot prove every sample's pitch or absence of low-level mixed raw energy. These remain explicit integration measurement requirements. Reverse, loops, selected-stem Slip, arbitrary ±16 scratch velocity/out-of-window return, other key/rate combinations, five-source cost and musical quality are not closed by this proposal.

## Concrete current seams and hazards

| Current source | Required change or invariant |
| --- | --- |
| Constructor16–51 | Add one per-deck shadow-lease map; reuse existing request/start/cache ownership rather than a second public deck state |
| `position`161–174, `voiceClock`253–262 | Raw scratch clock owns UI during gesture; after release the accepted adapter clock owns forward playback; do not expose muted follower as deck position |
| `stopSource`193–208; `disposeVoice`210–235 | Terminal paths must also find an off-map shadow; retained shadow must not pass through generic stop/dispose on scratch commit |
| `retireVoiceAt`236–251 | It sets gates to1 before fading. Reusing it on already-muted raw release would reopen raw sound; release needs zero-preserving retirement |
| `createForwardKeylock`283–285; start helper287–316 | Select a reviewed shadow-capable adapter at ordinary forward preparation, not build a second factory per gesture; normal controls keep their current guard |
| `start`318–458 | Invalidate an old scratch lease before generic start; preserve a selected committed live owner's lifetime when merely canceling a different pending preparation |
| `pause`462–474 | Mute/invalidate both current raw voice and off-map live owner synchronously before any awaited cleanup |
| `setRate`498–567; `setPitch`849–876 | Never send new settings to raw while retaining an incompatible old-pitch shadow; initial slice explicitly invalidates gesture/shadow and uses existing owned restart |
| `attachStems`878–894; `ensureStemState`896 onward | Original/stem identity changes invalidate cache and shadow; no1→5 or stem-order mutation underneath a retained instance |
| `cancelDeckScratchRequest`997–1007 | Stop follower/closing alignment as well as gesture request; distinguish normal release/adoption from destructive invalidation |
| `routeOrdinaryVoice`1037–1067 | Transfer exactly one history-output gain group; never call it naively again on a saved shadow whose old source gates still exist |
| Begin1069–1123; update1125–1130 | Save/mute committed live owner at raw commit instead of `stopSource`1101; coalesce one bounded active follow, using actual scratch cursor/clock |
| End1132–1147 | Mute raw source gates **before** posting End; active-shadow3ms fade and original-time predicted alignment replace raw-running/fresh-start bridge |
| Reverse981–993; Stem Slip start1230 onward; `silence`1579–1589 | Every incompatible transport transition/global stop invalidates all off-map leases; preserve existing captured stem tails only where already authorized |

## Required adapter seam; existing instance cannot do this unchanged

Existing production `keylock-live.js` validates ordinary seek against queried latency plus two128-frame quanta: approximately125.33ms at48kHz. The accepted experimental shadow uses40ms. **Calling existing production `seek` for output now+40ms raises LateScheduleError.** Do not mutate `experimentalLeadSeconds` on a live instance or silently replace it with a second factory.

Smallest coherent new reviewed variant:

- Preserve public ordinary `start/update/seek/pause/stateAt/position/snapshot/dispose` behavior and queried-latency guard. Ordinary playback/control regression remains mandatory after promotion.
- Retain2seconds source history from initial preparation, with required coverage still1second, as the revised isolated candidate does. This changes bounded memory/retention policy, not WASM or channel order; report the extra retained PCM and all replacements.
- Add an explicit `followSeek(position,{when})` operation with the **accepted**40ms minimum for shadow follow/alignment only. It uses the existing owned serial scheduling/window logic, updates the real application clock and returns the actual accepted `{position,when,playing,...}` receipt. No full-buffer render/reset or pause. It must reject rather than silently reschedule an already-too-late explicit output. No implication that40ms is a universal vendor minimum.
- Expose an immutable capability/version such as `supportsShadowFollow`, so engine never attempts this on an older instance. An older/current voice is ineligible until an ordinary owned restart prepares the reviewed variant. No per-gesture migration/factory is hidden from the UI or evidence.

`createForwardKeylock` becomes the one import/factory seam. It prepares exactly one shadow-capable forward owner during the ordinary start path. Normal methods still schedule as before; only engine's explicit follower calls use `followSeek`. Re-run ordinary engine rate/key/seek/handoff tests on the promoted variant; success of an experimental40ms-only clone cannot establish preservation of the125ms ordinary path.

## Minimal ownership record

One `deckScratchShadows: Map<deckIndex,lease>` is sufficient. Each lease stores `{track, originalBuffer, stemBufferRefs, config:{rate,keylock,keyShift,reverse,loop,stemSlip}, liveVoice, rawVoice, requestOwner, revision, phase, desired, pendingFollow, followTimer, pullSink, disposed}`. Reuse the gesture request's identity/generation; `request.shadowLease` is just a reference. One selected lease per deck, at most one follow request in flight and one coalesced desired position; no accumulated timer/job queues.

The live voice's existing `liveOwnerController` is its adapter lifetime. It must **not** be the gesture controller: ordinary release aborts the gesture request without disposing the adopted adapter. Terminal invalidation aborts both. A pending normal preparation may have a different controller in `transforms`; cancel that candidate, not the retained committed voice. In the narrow post-commit/before-start-finally race, `transforms.get(index)` can still be the selected live owner's controller: compare identity before aborting. Source existence alone is insufficient to decide it is a disposable pending candidate.

A lease's validity requires exact track object/buffer refs, scratch generation and owner/revision, current raw/live object identity as appropriate, unchanged config/source count, no aborted lifetime, and appropriate phase. Recheck after **every** await. Token success never revives a stopped deck or recreates removed routes.

## Begin and stem graph ownership

Only the first slice with existing playing forward/unlooped live adapter and capability is eligible. Keep existing live audio during raw-cache preparation/Begin ACK. If canceled before commit, preserve old audible owner and never open raw gates. At commit, synchronously mute existing live `sourceGates` without `adapter.pause()` and save it in the lease. Route the raw voice through the existing `routeOrdinaryVoice(...,{reuseVoice:savedLive})`, then make raw current. Do not call `stopSource` or abort the saved live lifetime.

Five-source graph invariant:

`source[i] → this voice's gate[i] → shared history[i−1] → exactly one owned history output gain[i] → existing stem route` for i1..4; original0 uses the same existing original gain path. On Begin the existing helper transfers the five output gains to raw and empties savedLive.stemGains. The old live gates remain connected upstream of histories but are zero; raw gates supply those same histories. Shadow processing must not record its muted audition into histories or create a second history→gain connection. `stemInitialized` and state identity travel with the sole gain owner, keeping current selected/muted stem/exit FX behavior.

The adapter also needs an actual pulled silent path while source gates are zero. Use the verified experiment's principle: a separate lightweight input-consuming Worklet sink, whose output samples are always zero and which is connected to the context output, taps each positional live output **before** its muted source gate. It must not feed histories, FX or an audible gain path, and must handle1 or5 independent inputs with original channels. A zero gain connection alone is not accepted proof that every browser keeps upstream DSP/window processing active. The integrated capture must witness pre-gate real shifted PCM during the hold. Sink/taps have explicit disposal; this is additional measured processing cost, not free work.

Follower samples actual scratch transport state at a bounded25ms cadence and uses original-time cursor, not `d.rate × elapsed` as a bound on arbitrary scratch velocity. Coalesce latest desired state and keep one pending follow. Loop/reverse/Stem Slip are excluded here. Adapt required-cursor/output-time projection to the accepted candidate; never claim a generic25ms×deck-rate bound. A real window replacement is recorded and either meets tested behavior or fails this bounded slice; hiding a replacement under an old group ID is prohibited.

## Release and adoption without raw bridge

1. Validate current owner/revision and mark closing. Stop the timer and prevent its pending `finally` from pumping another desired position. Cancel any raw gate automation and set all raw **source** gates to0 at release context time before posting `transport.command('end',...)`. Captured history/FX tails may continue by existing design; that is distinct from new unshifted source input.
2. Keep the shadow active. Ramp its already-connected source gates0→1 over3ms as the accepted experiment does, rather than waiting40ms in silence or allowing raw to run. This is a zero→shadow fade; once raw is zero it must never be raised by a generic retirement helper. If request was paused/audition-only or a terminal stop won, do not open it.
3. Obtain authoritative End receipt `{position,audioTime,rate,playing,loop,reverse,...}`. It accounts for ordinary Slip's backing-clock return; do not substitute last pointer position when Slip is enabled. Recheck lease/track/current identities. Stop/coalesce already pending follows in bounded order before alignment; no stale completion may post after alignment.
4. Choose explicit future output `when` under the accepted follow API. Predict in original seconds: for eligible playing forward/no-loop receipt, `positionAtOutput = clamp(result.position + result.rate * max(0, when − result.audioTime))`. Use the actual End clock, not full-array/source sample indices, wall milliseconds, early vendor callback or stale release cursor. For ended/paused receipts, preserve their playing/end semantics and mute accordingly. A direct `followSeek(result.position,{when})` would introduce rate×lead lag.
5. Await `followSeek(positionAtOutput,{when})`; verify current lease and exact accepted receipt. If serialization/fill made the chosen output late, retain the failure—do not claim projection remains correct. Actual source barcode must validate cursor against the intended clock, independently of its ACK. A controlled ACK identity does not prove heard position.
6. Transfer sole stem output-gain ownership raw→saved live and clear raw.stemGains. **Reuse the live owner's existing source gates/connections.** Calling `routeOrdinaryVoice` again on that object overwrites its `sourceGates` array and leaks the old muted routes; simply use a small ownership-transfer/adopt helper. Install saved live in `voices`, refresh deck/FX clocks and existing stem gain selection, detach lease bookkeeping/sink when safely no longer needed. Source windows remain active/owned normally.
7. Retire raw with a helper that disconnects its already-zero gates and respects cached transport adoption checks at210–222. Never use unmodified `retireVoiceAt`, which sets raw gates1 before fading. A newly begun owner may already be using that cached node through new gates; old disposal must not pause or disconnect its routes.

Immediate shadow opening precedes precise future alignment in the accepted experiment. This can expose a bounded stale source cursor before alignment even with correct pitch. Existing+200ms barcode acceptance does not prove first-frame cursor; integrated early marker/phase measurements must report that limitation. On alignment/follower error, do not resume raw as a silent fallback. The proposed first slice pauses/mutes the deck with its existing processing/error status and terminally cleans the lease; it does not call the result seamless.

## Invalidation and pending-ACK races

Central terminal invalidator synchronously removes the map entry/increments revision, stops timers, clears desired work and mutes both sets of gates **before** abort/dispose awaits. Dispose the off-map live owner and sink exactly once; existing current/retired voice cleanup then owns its own routes. The invalidator must not disconnect shared history outputs that have already been transferred to the surviving owner. Terminal ACKs prove disposal mechanics, not immediate GC/heap free.

Call it from stopSource/pause/start/explicit seek or track replacement/eject, rate/key changes, loop/reverse change, Stem Slip entry, attachStems/cache clear, adapter/raw error, track-end and silence. `setPitch` currently lacks a leading scratch cancel on its active-live branch; do not assume rate's cancellation covers it. Error callbacks currently ignore an adapter if it is not current at296: route off-map shadow errors through the matching lease as well, without stopping another newer track/voice. Pause/eject/global stop never interpret pending End ACK as permission to reopen output.

A new Begin during closing must adopt a still-valid same-track/config lease with a **new revision/owner**, or terminally replace it through a visible normal start. Do not queue an old release behind it and later commit old gain ramps. Cancel old pending gate automation at adoption, reassert shadow0, and retain raw ownership/generation ordering. Old End ACK may finish cleanup only. Normal user cancel/release that resumes playback is distinct from terminal cancellation due stop/track/config change. A stale owner never cancels the new lease.

`silence` must visit off-map leases even if `voices` is empty, in addition to existing scratch cache, deck states, transforms, histories and effects cleanup. Scheduled ramps/retirement timers are canceled; no late factory/PCM/follow/end/alignment event recreates a source. Keep unrelated deck playback and captured exit tails according to existing explicit-stop policy.

## Adversarial end-to-end acceptance before a readiness claim

1. Main UI synthetic440,+12,1.08 hold1s/release and actual pointer move/release: short-window pitch, raw475.2 energy, silence/level bins, pre-gate shadow witness and barcode cursor at early intervals and+200ms; strict thresholds unchanged. Preserve actual master recording and source-bus captures.
2. Exact quick50ms stationary gesture, long hold, ±.5 motion,3second throw and true out-of-window ±16 movement: record requested/actual duration, groups, memory, lead, source-cursor confidence; unaccepted high-velocity behavior remains a gap.
3. Original plus all four distinct stems; selected/muted stems and echo/brake states through Begin/release. One history→output gain group before/during/after, no doubled level, no shadow input recorded while raw scratch feeds history; no order/channel/sample-rate reinterpretation.
4. Release while a follow/fill RPC is pending, delayed End ACK, stale Begin ACK, double End, End then new Begin before ACK/retirement, and old request-finally pump. Exactly one current owner, no raw gate reopened, no stale output/position/tempo commit.
5. Pause/eject/global silence/track replacement at each await boundary, and a cached node adopted by a new gesture before old raw disposal. No output revival, no cached-new-owner pause, no leftover off-map lease/timer/sink; other deck survives.
6. Key/rate change, loop/reverse/Stem Slip entry and attachStems mid-hold and mid-release. Explicit invalidation/restart, matching source/config only, no stale pitch/state restoration; existing buffered unsupported paths remain labeled.
7. Source-end while holding/following, before future alignment and during fade. Playing remains false where appropriate; once-only End, no replay from zero unless the established ordinary user action requests it.
8. Shadow/raw processor error, unavailable follower capability, late schedule, window replacement failure and terminal-dispose timeout. Visible existing error/processing state, gates zero, no raw fallback or swallowed non-AbortError; bounded cleanup/source counts.
9. Existing ordinary live engine rate/key/seek/future-tempo/history tests and actual main-UI playback rerun against the new reviewed adapter/API; no global40ms policy introduced accidentally. Separate active-muted CPU/refill/retained bytes, five-source cost and silent-sink counts from opaque WASM heap claims.

Source-level plan only. No test above was implemented or executed by this review. Parent owns candidate acceptance, concrete production edits, actual browser/main-UI/hardware evidence, build plan and Claude handoff updates. Native app development remains gated.

Skills applied: use, dec-quality-testing, dec-software-principles.
