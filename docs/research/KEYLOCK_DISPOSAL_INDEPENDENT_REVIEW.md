# Independent disposable Signalsmith review

2026-10-17. Independent source/test review of the separate disposable variant, its Node lifecycle host and public browser harness. This agent did not edit the implementation, instrumentation, existing test or browser harness, and did not run a browser/native build. Parent subsequently authorized one new focused regression test in addition to this report.

## Verdict

**One blocking cancellation-contract defect was reproduced in the initial frozen `a710…` variant.** The implementation owner amended it during review. The exact amended JavaScript factory passes the independent focused regression. Actual amended browser lifecycle/PCM acceptance remains a separate gate; this review does not approve production or native integration.

No additional blocking terminal-disposal defect was defended in this bounded review. That is not an exhaustive correctness, security, performance or heap-release claim.

| Artifact | Verified SHA256 / status |
|---|---|
| Initial reviewed disposable variant | `a71073ef4d07278e3eda6b09f63132ce2b075c081b1d23bea2dfd6cb9aa4bd38` |
| Parent-preserved initial source | `local-evidence/keylock-disposable-initial-a71073ef.mjs`, independently hash-asserted by reproduction mode |
| Amended variant observed during review | `b2811c519f067cc5a1abd6cdccab46578d1eeef8aba42f666fab2830a9d6f46e` |
| Preserved two-fix base | `4c02e593d01dcdf014841382880b11dd7fcbaa485821e8b36b02e0fcabd2a00a` |
| Original upstream local artifact | `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46` |

The source diff skipped printing the giant embedded-WASM line but independently compared it byte-for-byte against the preserved two-fix module: identical. The initial module digest matched the requested frozen review target. Amendment attribution belongs to the implementation owner; only the regression and this report were written by this reviewer.

## Confirmed defect: readiness wins the race, then abort returns a terminal node

Initial `SignalsmithStretch-open-play-disposable.mjs:384` starts terminal disposal when its owner aborts. The readiness message resolves the private ready Promise at `:431`–`:434`. Initial `:439` awaited `Promise.race([ready,canceled])` and immediately returned the resulting node, without checking cancellation again.

The failing ordering is:

1. The node's ready message fulfills the ready Promise.
2. An independent queued microtask aborts the owner before the factory returns ownership.
3. Cancellation starts the existing terminal disposal operation. Rejecting the already fulfilled ready Promise cannot reverse fulfillment; the ready race reaction still wins.
4. The factory returns a now-disposing/disposed node instead of rejecting the owner cancellation.

This was executed against the **exact unchanged factory**, using an intentionally controlled `AudioWorkletNode`/MessagePort collaborator. The original observed result was:

```json
{"factory":"resolved","aborted":true,"closed":true}
```

The defect does **not** demonstrate revived DSP or leaked WASM memory: disposal still occurred. It violates the factory's cancellation/ownership contract and could cause an adapter to accept an unusable candidate unless it separately validates owner generations. Existing application generation checks remain necessary even after the repair.

The original 12/12 Node lifecycle suite was independently rerun and passed at initial hash `a710…`. Its immediate/pre-ready abort cases do not cover this readiness-versus-factory-return ordering. A green suite therefore did not refute this reproduction. Parent confirmed the defect and authorized the implementation owner to amend it.

### Preserved regression and repair evidence

New `scripts/test_keylock_disposal_abort_race.mjs:18`–`:30` queues the exact ready/abort ordering; `:48`–`:65` distinguishes the initial defect from the required repaired result. A no-abort control first proves ordinary readiness and acknowledged disposal still operate in the same controlled host.

```sh
# Exact old behavior, pinned to parent's preserved a710 source.
node scripts/test_keylock_disposal_abort_race.mjs --initial-reproduction

# Requires the repair in the current implementation; never treats old failure as a pass.
node scripts/test_keylock_disposal_abort_race.mjs
```

Both modes were executed. Initial reproduction mode asserted the observed defect at the exact pinned initial hash. Default mode at amended hash `b281…` passed both checks and observed:

```json
{"factory":"rejected","error":"AbortError","aborted":true,"closed":true,"disposalRequests":1}
```

Amended implementation `:439` rechecks `cancelError` immediately after the awaited race, before returning the candidate. Its existing `:440`–`:443` catch path then waits for the same bounded disposal Promise before rejecting the original AbortError. The independent regression asserts no resolved node, local closure following terminal acknowledgement, and exactly one disposal request. This is JavaScript factory ordering proof, **not** actual browser worklet/PCM acceptance of the new hash.

## Other paths reviewed and limits

| Candidate issue | Disposition and evidence |
|---|---|
| Dispose before delayed initialization can configure/revive the processor | Not defended. Initial processor `:173`–`:179` marks terminal and clears queued/source/module fields; delayed module resolution checks terminal at `:190`–`:191` before assignment/main/configuration. Existing executed Node case delays actual WASM resolution and observes zero later `_main` calls. No browser-native compile cancellation is claimed. |
| Late replies/time callbacks update an already disposed node | Not defended. `:425`–`:428` rejects the terminal states before normal message handling; `:414`–`:419` clears the callback and pending request map. Existing executed held-RPC case settles once and ignores replayed late messages. |
| Normal dispose hangs forever if terminal ACK disappears | Not defended. `:417`–`:419` creates one shared disposal Promise with a 2,000 ms failure path; close removes local handlers/port. Existing missing-ACK case independently took about 2,000 ms and rejected. A timeout is failed acknowledgement, never confirmation that a real processor received the command. |
| Late module registration creates a canceled owner | Not defended. `:398`–`:400` checks cancellation after registration awaits and before constructing a node. The executed Node deferred-registration case observes zero late candidates. Native registration itself can finish later and is not canceled by Promise deadlines. |
| Disconnect alone proves terminal processing stopped | Rejected as a proof claim. The processor terminal guard at `:239` zeros outputs and returns false before any DSP. Existing Node block execution observes false/zeros and no additional DSP calls. Browser instrumentation attempts actual terminal-return and later DSP observations through its separate diagnostic channel; that browser evidence belongs to the parent run. |
| Source/module null assignments prove physical heap free | Rejected. They clear explicit processor-owned references. Neither this wrapper nor the reviewed tests establishes allocator-level destruction, synchronous browser memory reclamation or GC. The Node host deliberately retains diagnostic module records. |

Normal RPC requests (`post`, `:409`–`:412`) have no independent command deadline; they settle by reply or explicit disposal/processor failure. That is a **narrow API boundary**, not a reproduced failure of the bounded disposal contract. A future adapter must own deck/track/load generations, cancel/await terminal cleanup on owner replacement and avoid treating a generic pending RPC as a deadline-backed transport. Do not infer a bound for every command from the factory/disposal deadlines.

## Browser acceptance coverage boundary

At initial inspection, the browser disposal check captured real candidate tone **before** disposal, then requested acknowledged terminal state, actual process-false/no-later-DSP observations, no further time callback and continuing control tone. It did not measure a post-ACK candidate PCM window. Its initial capture worklet only posted when input channels existed, so an absent block stream could not prove captured zero samples.

This was reported as an **acceptance gap, not a second implementation bug**. The harness owner is amending capture preflight/arming/fences and post-disposal evidence separately. This reviewer did not execute those browser changes. Do not carry an earlier `a710…` Node/browser result forward as acceptance of `b281…`, or call a no-data interval measured silence. Real post-ACK silence requires valid, contiguous captured frames and explicit zero measurements, alongside the independent terminal/DSP observations. Startup/armed gaps and failed fences must remain visible failures.

The browser harness is intentionally instrumented and isolated: the constructor hook attaches each actual processor to its own diagnostic port; that port survives vendor RPC closure. The subclass observes real process/DSP calls and explicit retained-field state, but may change timing. Its observations cannot substitute for an uninstrumented functional quality run. The harness does not integrate the disposable variant into the engine/application, and this review grants no such integration authority.

## Review closure and remaining gate

Findings submitted: **1**. Independently reproduced with exact source and confirmed by parent: **1**. The focused amended-factory regression passed; no shared implementation was edited by this reviewer.

Files frozen by this reviewer: this report and `scripts/test_keylock_disposal_abort_race.mjs`. Existing source/tests/harness ownership remains with the implementation owner. Parent must retain separate initial/amended raw results, execute actual browser acceptance at the amended hash and preserve the user's prototype-approval gate before any native application work.

Skills applied: use, dec-software-principles, adversarial-verify. Findings were submitted to the separate parent and implementation owner for refutation; parent confirmed the reproduced cancellation defect. Browser acceptance and heap reclamation remain explicitly unverified here.
