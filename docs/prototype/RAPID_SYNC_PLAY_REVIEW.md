# Rapid Smart Sync → Play and queued cancellation

18October2026, source after private `8863c25`. This corrects a reproduced core input-ordering defect. Native0.1.15 is preserved and does not contain this fix; no native or physical acceptance is claimed.

## Reproduced problem and change

Two rapid normal-app inputs, Sync then Play without a readiness wait, previously let playback start before the asynchronous Sync press finished arming. Both GUI and synthetic MIDI reached Tempo Sync rather than Beat Sync. Actual recorded pulses were offset by up to92.154ms (GUI) and206.145ms (MIDI), exceeding the existing10ms criterion. A second immediate Play also missed the asynchronous start gap: playback still started and its play counter advanced from2 to4. Its recorded secondary RMS was0.0142389 rather than the paused threshold<0.0001. These are actual app/recording failures, not inferred from plan111's setup failure.

Smart Sync now tracks its pending press per deck and lets `start` await that specific work. It checks the playback owner, track and transport token before aligning. Canceled/failed Sync cannot silently fall through to an unsynced start. Alignment continues to check the current owner during preparation. The application owns one queued Play intent per deck; a second Play cancels it immediately through the existing Pause path. Load/eject clear the queued owner; a replaced track or reset deck cannot inherit it. Playback history increments only for the current request that actually reached the playing state. Canceled requests leave no late history entry. These maps carry no timers or artificial preparation delays.

The Play button exposes busy state and “Preparing playback” feedback during the wait. GUI and MIDI use the same actions; no controller address, DSP, sample-rate conversion or audio tolerance changed. Other asynchronous action combinations remain subject to their own acceptance.

## Executed evidence

Focused `node scripts/test_pending_smart_sync_start.mjs` executes with controlled rate/synchronize collaborators: wait for pending Sync and align once; current-owner cancellation leaves a stopped armed deck; track replacement or changed transport token aborts a queued start; rate/Sync failure propagates without fallback. These are policy contracts, not real-device or fault-injection audio acceptance.

Actual browser workflow uses owned120BPM/100BPM sources with distinct0.05s/0.17s pulse offsets and an existing keylocked secondary. Primary keeps playing. GUI Sync/Play clicks are dispatched back-to-back without a wait, followed by the same sequence through the real MIDI editor's two Note mappings (channel3 numbers5/7). Each starts once in Beat Sync at rate1.2. Immediate queued state and button aria-busy both read true, then clear. Six audible pulse pairs per case have maximum errors **1.269842ms GUI /1.337868ms MIDI**, within unchanged10ms/minimum5pair gates. No temporal fit or artificial engine delay. Two identical2000Hz highpass biquads/Q0.707, amplitude0.01 and100ms refractory isolate the owned3000Hz pulse carrier.

The same app then receives Sync/Play/Play in one input burst. At600ms the secondary is stopped, not processing or queued, and its count stays2→2. The fixed350–550ms recorded window has RMS **1.98214e-8**, below the unchanged0.0001 gate. This demonstrates cancellation over this wait interval; it is not arbitrary-delay/exhaustive race acceptance.

Whole final master **8.159977s /359855frames /44100Hz /stereo**, **131969bytes**, SHA256 `32a967086f734517a234da5854f5924588f8ddfef3690bd87e6f5cd17772d4c6`. Entire browser decode finite. Six declared served source hashes stable/match saved disk. Both decks stopped afterward; physical graph muted. The before capture has the same phase/count/silence criteria; complete failed/passing originals, encoded recordings and source capsules remain under ignored `local-evidence/rapid-sync-play/{before,final}/`. The final harness adds only an immediate queued/ARIA observation; it does not add a wait between Sync and Play or weaken a criterion.

Receipts: `rapid-sync-play-before-results.json`, `rapid-sync-play-browser-results.json`, `pending-smart-sync-contract-results.json`. Reproduce with `prototype/rapid-sync-play-harness.html` on a fresh isolated loopback origin; do not replace the human's original tab/profile or use this synthetic input as physical-controller proof.

## Remaining scope and next build

This is two-deck, flat-grid, Smart Sync input ordering with a keylocked secondary and known pulses. Simple Sync, warped/looped/reverse/Stem Slip/Censor compositions, arbitrary command bursts, actual device/hotplug/latency, musical quality and exact reference behavior retain their separate acceptance. Existing Censor/SCNet/FX/Video/provider/DVS/filesystem/full hardware gaps remain. Full110feature/522requirement flags stay false/unset; beta deltas remain separate.

Next prepare a fresh approved local desktop test candidate from this checkpoint, preserving0.1.15 and its profile backup. Include the four additional declared modules censor.js, censor-backing.js, reverse-censor-plan.js and pitch-time-map.js, then verify the package and one native core playback/Sync/cancel flow. No new approval is required for the already approved local desktop test scope; no native audio-engine rewrite or public release is authorized. No timed Hercules capture until the human is ready. Full independent Claude completeness audit remains unlaunched; original prompt and per-feature model/effort recommendations are preserved.
