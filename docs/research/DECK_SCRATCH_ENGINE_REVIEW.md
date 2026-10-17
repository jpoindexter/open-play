# Independent ordinary scratch engine integration review

Scope: parent WIP ordinary whole-deck scratch ownership, pending Begin/End, global transport cancellation, raw source routing and terminal failure. No engine, parent tests or app source edited by this reviewer. Only the new owned `scripts/test_deck_scratch_engine_races.mjs` and this report were added. No browser, native, Git or remote tools used.

**Four concrete defects were reproduced and parent corrected them. Current owned regression: 7/7 executed. Parent's existing controlled engine suite: 8/8 independently executed.** These are instrumented host checks, not actual browser audio/UI acceptance. Parent was adding live-forward/keylock integration concurrently; that new cohort is explicitly outside this review.

## 1. Pending reused Begin release left an orphan silent gesture

Initial path: complete a first scratch/release so its raw transport remains as the current ordinary voice, then start another gesture and release while its Begin acknowledgement is in flight. The existing pending-release test only covered a newly prepared, uncommitted transport.

Executed initial reproduction delayed the reused Begin ACK after the actual kernel accepted the gesture. `endDeckScratch` saw request.ready=false and canceled the request; after ACK, Begin returned false. However, the reused transport was considered committed and never ended/disposed:

```json
{
  "endReturned": false,
  "beginReturned": false,
  "requests": 0,
  "voiceStillPresent": true,
  "owner": "quick",
  "phase": "scratching",
  "playing": true,
  "audition": true,
  "velocity": 0
}
```

The result was a playing deck held in silence without an owner request that could release it.

Parent correction: `cancelDeckScratchRequest` queues matching End for a reused pending Begin before a newer Begin can be sent. The actual wrapper supplies its retained gesture token. The owned test host preserves MessagePort response order: a held old Begin ACK also holds subsequent ACK delivery; it does not invent out-of-order browser acknowledgements.

Executed regressions cover playing and paused quick-release, plus replacement owner ordering. Playing quick-release now returns kernel phase=idle, owner=null, audition=false, playing=true and actual kernel output RMS=0.1985503 from the known 0.2 source after the short ramp. Paused quick-release remains paused. Replacement trace is Begin(slow), End(slow), Begin(fresh), and late slow release cannot alter fresh ownership.

## 2. Scratch could discard an already requested Play during buffered preparation

Initial path: d.playing=false and d.processing=true while an earlier buffered Play is preparing. Beginning scratch aborted the old transform and set processing=false before configuring the raw transport with playing=!!d.playing. The pending Play intent was lost.

Executed initial state: begin succeeded, release at 7s returned playing=false, and both d.playing/d.processing were false. This differed from ordinary operations which preserve playing||processing intent.

Parent correction: capture request.wasPlaying from playing||processing before aborting the old transform, pass it into raw transport configuration and retain it on commit. The current owned regression executes the actual engine and actual wrapper/kernel, confirms the previous AbortController is aborted, then scratches/releases at 7s with playing=true. This case is raw transport ownership, not live-keylock render acceptance.

## 3. Worklet failure left a dead transport marked playing in the engine

Initial `prepareOrdinaryScratch` forwarded onError without retiring the current engine voice/request. The actual wrapper correctly entered terminal/disposed state, but the engine still reported a playing voice and read the terminal wrapper's reset cursor.

Executed initial reproduction used the actual `prepareOrdinaryScratch` method and actual `deck-scratch.js` wrapper with an instrumented worklet node, then invoked its processor-error event:

```json
{
  "errors": ["Ordinary scratch audio processor failed."],
  "voicePresent": true,
  "requestCount": 1,
  "deckPlaying": true,
  "reportedPosition": 0,
  "transportPhase": "disposed"
}
```

Parent correction: retain the last observed audible position; only if this transport is still current, pause/retire its voice, clear ownership and restore that position before forwarding the error. Current owned regression observes source position 7s, triggers the actual wrapper error path and obtains playing=false, position=7, no first-deck voice/request, one forwarded error and an untouched other-deck voice. A separate regression confirms a late old processor's error cannot pause/retire a newer active source.

The test establishes engine state and ownership recovery. It does not measure the error transition's real audio samples or browser garbage collection.

## 4. Global silence missed a first paused scratch still preparing

`silence()` iterated deckStates, but ordinary scratch initially registered a deck only after source routing committed. A never-played paused deck with pending first preparation was absent from that map.

Executed initial reproduction: defer first preparation, call engine.silence(), resolve preparation. Begin then succeeded with owner=`pending-globalstop`, one voice and one request **after silence**.

Parent correction: register the deck at the beginning of ordinary scratch ownership, before awaiting preparation. Current owned regression confirms global silence aborts that pending request: late preparation returns false, voices=0, requests=0 and scratchPreparing=false. No later owner can use the canceled request.

## Executed controlled test boundary

Run:

```sh
node scripts/test_deck_scratch_engine_races.mjs
node scripts/test_deck_scratch_engine.mjs
```

The new race suite uses the **actual AudioEngine, actual transport wrapper and actual PCM kernel**. Its host instruments graph objects, source copying/structured-clone transfer, ordered message responses and delayed ACKs. Source PCM assertions use the actual kernel render seam. This is materially stronger than replacing the production ownership methods with equivalent mocks, but it is still not browser scheduling or actual AudioContext processing.

Seven current owned cases execute:

1. Playing reused Begin released before ACK → no orphan audition; nonzero resumed PCM.
2. Same cancellation while paused → no unwanted resume.
3. Old End ordered before fresh Begin; late owner cannot release fresh gesture.
4. Pending buffered Play intent survives scratch ownership and release.
5. Current processor failure clears engine ownership and restores last observed cursor without touching another deck.
6. Late obsolete processor failure cannot retire a new voice.
7. Global silence prevents first paused pending preparation from committing afterward.

Parent's existing eight controlled tests additionally cover newly prepared pending release, paused release cursor, basic Slip backing state, stale owner rejection, track replacement during loading, pause retirement, five distinct bus connection indices and pending tempo-change cancellation. Those eight passed in this review session. Their routing check observes connection calls; it is not actual captured proof of the parent engine's stem histories, mute gains, exit tails or channel FX audio.

## Source snapshot and remaining limits

At this review's successful controlled run:

```text
1ac382d8327b44bb754fd2b217c617bc90c25786731ca8806871f4c1a8134aa6  prototype/engine.js
0f875b8ed8a2f0b0373455e8758fe150be937fa3311a6b35142a7d15622f189a  prototype/deck-scratch.js
428c677a90114d6a23479ad0789825c7cd45bcaed3806fbafec32aba6a68d08c  prototype/deck-scratch-kernel.js
7b5c552833770045f3a92846301ebd2fc4cf43145c9d89c2e10d9e84f14ccf6a  scripts/test_deck_scratch_engine_races.mjs
6d9960eb07c30ea88df8586ba2c39e174253e0b70a5588ef327306c8c26c882b  scripts/test_deck_scratch_engine.mjs
```

The whole engine file was actively changing for the parent's separate live-forward integration, so this hash identifies the observed snapshot, not a claim that the entire file was frozen or reviewed. Function-level raw ownership findings/corrections above are the reviewed scope. Existing transformed release through the buffered renderer was an acknowledged open boundary; this review did not treat it as a newly discovered bug or validate the new live path.

Actual parent engine/browser PCM, visible interaction, latency, keylock/raw handoffs, sustained musical quality, hardware and native acceptance remain separate required evidence. Neither the prerequisite raw-worklet harness nor these controlled engine tests establish those outcomes.
