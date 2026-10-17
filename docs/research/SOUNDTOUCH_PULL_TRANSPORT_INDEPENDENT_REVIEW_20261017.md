# Independent SoundTouch pull-transport review — 2026-10-17

Verdict: one source-ownership defect was reproduced, retained, corrected by the parent and independently retested. The final six controlled checks pass. No additional concrete blocker was reproduced in this bounded serial review; this does not accept the upcoming browser adapter or production keylock.

## Preserved finding and correction

The f05 boundary candidate returned caller-owned channel-list descriptors directly from construction (`pull-transport-boundaries.mjs:101–108`). Reassigning `channels[0]` after an already prepared Start changed a later Seek from original+.25 PCM to replacement−.25 without a load/source-generation change. Appending two channel descriptors also produced mappings for channels0 and2 although validated `channelCounts` stayed1. These are descriptor identity/geometry failures, not a demand to deep-copy PCM sample storage.

Executed the independent six-case script twice against that candidate: initial4/6 and explicitly pinned boundary-module4/6. Both original reports are preserved. Parent corrected only the owned experimental module: `pull-transport.mjs:107–114,122` snapshots the descriptor lists and derives geometry/memory metadata from that snapshot. Its `snapshot():235` explicitly requires borrowed PCM samples to remain immutable. The worklet's claimed exclusive transferred-storage ownership is a future boundary to verify, not established here.

Executed the same six predicates against final8a91095c:6/6. The destination mean remains+.25 after caller descriptor replacement, and appended descriptors no longer change prepared geometry. Actual original sample-array mutation remains outside the documented immutable-borrow contract.

## Other executed counterexamples

- A Start at256/rate.75/shift2, future Seek4000/shift12, then earlier Update1000/rate1.08 inherits shift2 and position.0126530612 from the surviving Start; it supersedes the future Seek. This exercises actual prepared epochs, not just a state table (`schedule:151–170`).
- A rejected rate0 replacement leaves the complete pending snapshot and prepared generation unchanged. Preparation precedes supersession retirement/commit; serial errors do not erase the previous pending owner.
- Replacing an uncommitted Start at the same frame with Pause retires that Start and emits exact zero PCM; nominal position remains0.
- Eight successive rate changes while epochs overlap preserve identical DC gain: observed output range0.2499999851–0.25. This refutes gain overshoot for this fixture; it does not accept musical phase alignment, transient quality or unlimited update rates (`apply:186–195`).

## Contract and test limits

Read the preserved initial module and its boundary revision. The boundary changes clamp every source read to originalFrames (`ensure:62`), retain the true previous clock anchor (`apply:188`), use anchorPosition for nominal EOS (`render:210–211`) and retain bounded retired counters (`retireEpoch:180–184`). Existing parent reports retain initial13positive, boundary6RED then6GREEN and reset-default0/2 versus fresh-instance2/2. Those are not recast as this reviewer's executed suites.

Fresh `PullPipe` instances avoid the reproduced upstream circular-clear defect; construction primes real DSP output before an epoch can commit (`prepareEpoch:135–144`, `PullPipe:29–50`). Queue depth, iteration count, padding and retired-diagnostic bounds are explicit. Older clock queries reject rather than fabricate history. These are useful engineering contracts, not an audio render-deadline measurement.

Position and EOS remain explicitly nominal (`stateAt:130–133`, `snapshot:239`). The250ms preroll/discard policy, finite output endpoint and retained padding counters do not prove earliest audible source position, complete EOS tail preservation, no missing/duplicated markers or phase continuity. The all-silence EOS fixture in the parent suite cannot establish those properties. Separate processors for original and stems preserve addressable outputs; identical-source hashes do not establish real separated-stem alignment through dynamic WSOLA decisions.

Constructor source scanning and epoch priming are synchronous; the serial readiness ACK therefore does not prove browser responsiveness, command cancellation during work, render-budget headroom or real-time multideck throughput. The upcoming actual AudioWorklet test must establish its own command ownership, scheduled output fence, continuous capture and cleanup. No main-app/native/MIDI/device/music/reference parity or repaired0.1.6 pitch claim follows.

## Frozen identities and re-entry

- Final module `experiments/keylock-soundtouch/pull-transport.mjs`: `8a91095c7cfc8e8c7171f09475a7863437ffadcb1345464c212a16490e840fd3`.
- Preserved boundary module: `f05d24db0567cac539c4a8fc0565b54730e70cd4ffda0b7e0dbd0eb2be460f44`; preserved initial: `d1182e5e936df833398754b95bd8edda6a8a11550faab421b5ea02238f946eb6`.
- Owned test `scripts/test_soundtouch_transport_independent_review.mjs`: `428625e28c2c0b97d50026edcb72f0647aca292cbf98066d6ada51661707b3e4`.
- Initial RED `docs/prototype/soundtouch-transport-independent-initial-results.json`: `8af173b7a2aa964c3da1a06b683401fece01c7a0ab19a710141db56dd6a45262`.
- Pinned boundary RED `docs/prototype/soundtouch-transport-independent-boundaries-red-results.json`: `88ab486cb6e67f058c0e142ba7fb8c5240488cd078ba2e8301dbeafc9c1e14c2`.
- Final GREEN `docs/prototype/soundtouch-transport-independent-final-results.json`: `01e26f29b1c1855858b1c187f1fdb2d49119116ee5c2be70434162f9b5624b5a`.

Re-entry: run the owned test with a NEW `--report=` path; optional `--module=` selects the preserved boundary candidate. Existing outputs intentionally refuse overwrite. No product, existing evidence, UI, process, network, Git or device action occurred in this review.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
