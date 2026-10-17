# Silent audio pull: independent lifecycle review

2026-10-17. Bounded review of `prototype/silent-audio-pull.js` and its actual AudioWorklet processor. No production, engine, vendor, GUI, Git, remote, or native-app changes by this reviewer. Owned additions are this report and `scripts/test_silent_audio_pull_review.mjs`.

## Initial executed result: 7 checks pass; 4 desired-state checks fail

The four failing checks reproduce three lifecycle defects. They do not invalidate the separately exercised zero-output arithmetic. They do prevent treating this initial wrapper snapshot as accepted for owner lifecycle.

### Confirmed: processor failure starts redundant cleanup on an already closed port

Source at initial `silent-audio-pull.js:31–32` marks retired, disconnects exact routes, rejects readiness/disposal, and closes the port. Before readiness, the create catch (`:40`) then calls `dispose()`. Since no disposal promise exists, `:19–22` posts `dispose` to that closed port and waits an unnecessary disposal timeout. After readiness, calling the returned lease's `dispose()` has the same problem and manufactures a `TimeoutError` after the already reported processor failure.

Executed using the production wrapper and processor with an ordered controlled port. The closed port discards posts; the host does not invent a synchronous exception. Before-ready failure produced one closed-port `dispose` post and remained unsettled until the 20 ms test disposal deadline, then rejected with the original processor error. After-ready failure produced one closed-port `dispose` post and later `TimeoutError`. Both tests assert the desired absence of a closed-port command and redundant deadline and fail on this initial snapshot.

Practical correction: record terminal processor failure/disposal state before detaching, settle in-flight readiness/disposal exactly once, and make future `dispose()` return a stable terminal result without posting or creating a new timer. Preserve the original error notification. These findings do not require an actual audio rendering callback to reproduce.

### Confirmed: owner abort is trapped behind pending shared module loading

Initial `silent-audio-pull.js:12` awaits `prepareSilentAudioPull(context)` before adding the owner abort listener (`:35`). With a deliberately unresolved `addModule` promise, aborting the owner does not settle creation. It only rejects with `AbortError` after the shared module eventually resolves. No node has been allocated yet, but the canceled owner's caller remains pending for an unbounded module await; the later readiness timer does not cover it.

Executed reproduction records `settledBeforeModule: false`, `nodesBeforeModule: 0`, and eventual `finalError: AbortError` only after the controlled module gate is released. Desired-state check requires prompt owner rejection and fails initially.

Practical correction: race only the caller's wait against its abort/deadline while leaving shared module loading intact for other owners. Remove temporary listeners/timers on every outcome; retain the existing failed-preparation retry behavior. Do not abort the shared module operation when one owner cancels.

### Confirmed: synchronous connection failure leaves an unhandled readiness rejection

Initial `silent-audio-pull.js:37` connects sources before executing `await ready` (`:38`). If a source connection throws, catch calls `dispose()`, which rejects `ready` (`:21`) even though nothing has yet attached a rejection handler to that promise. Creation itself rejects with the connection error and disconnects the graph, but an extra unhandled `AbortError` escapes.

The first executed review run exited under Node's default unhandled-rejection behavior. The review harness then installed an observation handler so it can preserve the event and finish the other checks; the desired-state assertion still fails. Exact observed unhandled rejection: `{name: "AbortError", message: "Silent pull owner was canceled."}`. The connection error itself remains `Controlled connection failed`.

Practical correction: attach an observation handler to readiness at creation, or restructure setup so synchronous setup failure cannot reject an unobserved readiness promise. Continue reporting the original connection error and preserving existing source routes.

## What the passing controlled checks establish

- The actual processor consumes one or five input buses and produces zero in every supplied output channel. The five-input fixture uses 1, 2, 8, 3, and 4 channels respectively. Independent RMS/peak calculation equals the processor's telemetry after 64 actual process calls. Output arrays are prefilled nonzero on every call; all three tested output channels become exactly zero. This tests the processor body, not actual browser graph pulling.
- Wiring is `source.connect(pullNode, 0, inputIndex)` for each bus. Disconnection uses `source.disconnect(pullNode, 0, inputIndex)` and preserves a separate pre-existing external route on every source. Source nodes are never stopped. One normal disposal command serves repeated `dispose()` calls.
- Successful disposal clears processor diagnostic references, and subsequent processor calls zero outputs and return `false`.
- Abort after readiness and abort before readiness with late ordered ready/disposal messages retire exact routes without activating a late owner.
- Readiness and disposal-ACK stalls are bounded once the module is loaded; their routes and ports detach. The second case confirms the processor actually accepted terminal disposal even though its ACK is withheld.
- Shared preparation deduplicates module loading. Failed preparation is evicted, allowing a subsequent successful module retry and an actually ready/retired lease.
- Throwing event/error callbacks do not escape or block controlled zero-output/terminal cleanup.

The host executes the real processor source in a VM and the production wrapper as a module. It substitutes AudioContext graph objects and serial port delivery. Consequently these checks do not establish actual browser pull continuity, actual realtime zero destination PCM, engine shadow-lease handoff, music/DSP quality, CPU load, acoustic silence, controller behavior, or vendor/native parity. Those require the parent's actual engine/audio acceptance path. No standalone browser harness was added for this review.

## Initial source snapshot

| Artifact | SHA-256 |
| --- | --- |
| Wrapper with reproduced defects | `e58e549b7a7c93cd6e1ed467392aff1cc6eb0a0f3ddacf265022b954ca56c414` |
| Actual worklet processor | `00f8d094b63f3eab16874fedf576edf1eec316706e2d7e88c4371d7c9f26f73b` |
| Review test after successful-retry strengthening | `071b0319b76b6271594641c5ec882b643fe03c68fd7c4ea7c831b8f62a439555` |

Initial command: `node scripts/test_silent_audio_pull_review.mjs`. Expected exit is nonzero while the four desired-state lifecycle assertions fail; these assertions were not changed to accept the failures. The initial seven/four output preceded a small strengthening of the already passing retry case so the retry must actually reach ready rather than merely attempt another module load. Corrections and a fresh execution should be appended below, preserving these initial observations.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.

## Parent corrections and independent fresh execution

The parent corrected the wrapper. Fresh command `node scripts/test_silent_audio_pull_review.mjs` now executes **15 checks with 15 passing, 0 failing**, saved verbatim as `docs/prototype/silent-audio-pull-independent-results.json`. This includes the same four desired-state assertions that initially failed; their criteria were not changed to accept closed-port posts, deferred cancellation, or unhandled rejections.

Initial observations remain above and in `docs/prototype/silent-audio-pull-independent-initial-observations.json`. That latter file is explicitly labeled a structured transcription of the initial executed tool output, not byte-for-byte stdout or a rerun of the old wrapper. The original stdout is in the session tool result. No old result is overwritten or silently relabeled as passing.

Corrected code and executed outcomes:

- `silent-audio-pull.js:3–12,25` wraps each caller's shared module wait with its own abort/deadline and removes that temporary listener/timer on settlement. Aborting during unresolved module preparation now settles before the module gate is released and allocates no node.
- `:28–31` immediately observes the readiness promise. The same partial-connect failure still rejects with its original connection error and cleans graph routes, with **zero unhandled rejections**.
- `:47–51` records terminal processor cleanup. Before-ready error rejects promptly with the original processor error and no closed-port posts. After-ready disposal returns the terminal result promptly, with no fabricated timeout or closed-port post. During an already outstanding disposal, processor failure settles that same disposal promise with the original error; subsequent disposal returns the same promise and issues no second command.
- `:24` snapshots the output list before awaiting preparation. Mutating the caller's five-source array into a one-source array during module loading does not retarget the lease; all five original input indices connect and disconnect exactly, and the injected source never connects. Mutating the argument array again before disposal likewise cannot prevent original-route cleanup.

Four new executed cases strengthen the original 11:

1. A 10 ms module-load deadline rejects with the module preparation `TimeoutError`, allocates no node, and cannot allocate a late old node after the module completes. A later owner reuses the now-finished shared module and actually reaches ready; only one module load occurred.
2. Two callers wait on the same module operation. Canceling the first promptly returns `AbortError` while the second remains pending. Releasing the module gives the second a usable lease; exactly one node is allocated, only the second source connects, and its normal disposal preserves the source's existing external route.
3. The five-source array-mutation case described above tests immutable cleanup ownership.
4. A processor error while its actual disposal ACK is held settles the original promise once without a second disposal command or closed-port post.

The strengthened shared-preparation retry test also now performs a successful second module load, creates a ready lease, and retires it. It does not merely count another attempted load. All 15 cases observe unhandled-rejection events and report none on the corrected snapshot.

No additional defended lifecycle bug remained in these controlled cases. The untouched worklet still zeroes every supplied output channel while the measured input metrics prove its actual body iterated the supplied PCM. This remains distinct from proving that a real browser pulls a detached/shadow engine source continuously; that acceptance must use the parent's real engine path and actual captured PCM.

| Corrected artifact | SHA-256 |
| --- | --- |
| Wrapper | `44e0999cde51efa66708adf8ffd7a4c466d35f819b163b4730ce04f4d9be1c00` |
| Worklet, unchanged | `00f8d094b63f3eab16874fedf576edf1eec316706e2d7e88c4371d7c9f26f73b` |
| Independent 15-case test | `dc623a4ee1bf19a992476a0ce85af243eba159b08f98eaf8fcd8336aa740861e` |
| Fresh full executed stdout JSON | `06f6a8788cdde04bb2e0dbab022ef9a4c1d9f33d2506e3efc363a009b275d745` |
| Initial-observation transcription | `46ae9d87b4dd18dbaf398ae896f4fe16ee06593cbc7ca7f5c545228e196e95cd` |

Only this report, the owned new test, and new review result JSON files were written. No production/helper edits or GUI/native/Git/remote operations were performed.
