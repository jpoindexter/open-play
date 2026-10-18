# Prepared Stems: native Trash, original mix and regeneration

Plan117, 18October2026, browser source after accb207. Native0.1.16 remains unchanged. The external service is updated on the normal port after the separate browser workflow.

## Reference and implementation

[Serato’s preparation guide](https://support.serato.com/hc/en-us/articles/5700969287183-Preparing-tracks-for-use-with-Stems) describes removing prepared Stems data while retaining the library track. This implementation adds **Move prepared files to Trash** in the existing preparation dialog; it is not a claim that the complete vendor crate/keyboard/layout behavior is matched. It uses recoverable system Trash. Storage is reclaimed when the operator empties system Trash; the application does not empty it.

The service accepts only an existing canonical job-ID directory under its own generated jobs root, refuses queued/running/still-live workers, and uses installed Send2Trash1.8.3. No original library path is accepted by this endpoint. OS failure retains the job state/files; repeat successful calls are idempotent. Trashed jobs cannot satisfy completed-cache lookup, and a new request creates a new owner. Metadata/export/input copies move together. Existing generation/model/cache identities remain unchanged.

Frontend preparation saves the opaque job association/model in ordinary track metadata. Clear removes that association only after a confirmed matching service reply, persists it, and leaves decoded buffers/voices available. Pending clear blocks same-track preparation/duplicate clear. The user can continue playing loaded Stems or prepare again. This does not claim browser audio buffers survive application restart.

The old Restore full mix action unloaded buffers but left selected-stem Slip armed, so restarting it required the buffers it had just removed. New engine restoration stops matching decks, clears Stem Slip ownership/cache and Stem masks/FX, then resumes only matching decks that had been playing. Paused/unrelated decks stay as they were. It retains the original decoded source and disk-cache association when files were not separately trashed. This is a pause/restart path; no seamless transition or cold-keylock-latency guarantee.

## Dependency

The running service uses already-installed **Send2Trash1.8.3**, BSD-3-Clause, from /opt/homebrew/lib/python3.11/site-packages/send2trash. No package was installed globally or added to the model worker. [Official repository](https://github.com/arsenetar/send2trash) describes native platform Trash integration. A future standalone service package needs this dependency/notices; if absent, the operation reports the missing dependency and keeps files. Native Finder recovery/Put Back was not exercised.

## Executed evidence

Focused service contract checks actual canonical folder moves with a controlled OS collaborator: active refusal, one move/idempotence, a new job after eviction, failed Trash retention and noncanonical-path rejection. Adapter/engine contract checks pending-clear serialization/acknowledgment/failure, loaded-buffer retention and disarming Stem Slip before resuming only previously playing matching decks. Existing preparation ownership/cancellation12/12 executed once; new cache DELETE rejects cross-origin and missing-custom-header requests. These controlled checks are separate from actual macOS/model/UI/audio proof.

The final actual app workflow uses generated8second stereo330/550Hz tones, normal Prepare, Play, Vocal Stem Slip, Move prepared files to Trash, Restore full mix and Prepare again. Both preparations traverse the actual local pinned SCNet-large worker and four WAV decode/activation. First job **dd7f4a2b27e3482aba2331c918674b24** is moved to native macOS Trash; its original cache directory is absent and the exact generated folder is independently observed in ~/.Trash, with all four exports matching its manifest and its generated input copy matching the regenerated input. Only this newly generated disposable job is moved; no original user audio file was involved. Source AudioBuffer and library track remain, with unchanged source PCM hash.

During Trash, the same loaded Stem Slip voice continues playing, prepared buffers remain, mode stays Vocal, and canonical position advances1.674988662→1.785283447 over0.110294785seconds, meeting20ms state jump guard. This is state evidence, not first-frame/sample-phase or every-sample gap detection. Restore then remains playing/looping, with Stem Slipoff, no split voice and no prepared buffers. New job **a2877adfbffa4ece8ec544451917a589** completes on regeneration and reattaches sources. Track-job association is observed saved, cleared, then replaced.

Whole master **10.799977s /476279frames /44100Hz /stereo**, **174601bytes**, SHA256 **6db3c2a5ebabeefb4bc5ce861391b2136ed606412dbd65e0390bbf266a20fbfc**. Entire decode finite; four fixed300ms windows before/after Trash, restored full mix and regeneration pass1Hz/RMS>0.005, maximum carrier error **0.006092Hz**. Seven declared served hashes stable/match disk. These tonal windows establish the scoped playback/routing path, not separation quality, perceptual music, every transition sample, acoustic or controller acceptance. Final decks stopped/physical graph muted. Source, original report/master/screenshot and receipts remain ignored under local-evidence/stem-clear/final. No broad green audio matrix repeated.

After testing, temporary18863server exited. Normal8768service was observed idle; old23214/session1199 exited normally and current25079/session8983 launched. Existing desktop HTTP proxy18775 restores the regenerated job and returns four files matching its worker manifest. The new route returns404 for a deliberately unknown cache ID without moving anything else. Native0.1.16/process/profile/routing/mappings untouched. This last check is API/service proof, not new native GUI/audio acceptance.

Receipts: [browser/audio](stem-clear-browser-results.json), [actual Trash filesystem](stem-trash-filesystem-results.json), [adapter/engine contract](stem-clear-contract-results.json), [service contract](stem-trash-contract-results.json), [preparation regression](stem-preparation-clear-regression-results.json), [HTTP guards](stem-trash-http-guards-results.json), [current service](stem-clear-live-service-results.json).

## Remaining scope

Exact vendor Stems-crate removal/keyboard/icons, persisted crate membership/readiness and external/stale cache reconciliation, Finder recovery, large-cache/volume/error/concurrent-client behavior, musical quality, compound/latency/physical/native/reference acceptance remain open. Loaded buffers intentionally survive disk Trash until restored/unloaded; the current prepared-view filter still includes them. No full cache/Stem Slip feature flag is promoted. Full110groups/522requirements plus9beta deltas/26release checks and model routing/original prompt remain intact; full Claude audit unlaunched. Keep main service8983 running and native16 prepared for the human’s next Play test.

Current plan118 follow-up: [persistent crate/removal review](STEM_CRATE_REVIEW.md) replaces the former buffer-only view. Current main service27522/session82214 supersedes prior8983. Historical plan117 results above stay unchanged.
