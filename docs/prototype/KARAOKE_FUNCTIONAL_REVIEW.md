# Karaoke functional review

Checkpoint: **2026-10-16**. Bounded independent browser behavior is verified in the paths below; the candidate is pinned in `candidate-hashes.json` and the Claude packet. Native/reference/full-Video acceptance remains open. The separate Media Crate suite now passes32/32; this does not imply vendor equivalence.

## Executed evidence

| Layer | Result | What it establishes | Limit |
|---|---|---|---|
| Original packet interpreter | 22/22, `node scripts/test_cdg.mjs` | Packet timing, index/palette state, tiles/XOR, scroll, transparency policies, replay and malformed-input cases on original bytes. | Pure decoder evidence; no browser, audio or reference runtime. |
| Decoder → real Canvas / PNG | [21/21](cdg-browser-results.json) | Actual Canvas bytes, alpha, orientation, timing, replay and PNG encode/decode. | No pairing or audible synchronization proof. |
| Track-owned bridge | 19/19, `node scripts/test_video_karaoke.mjs` | Actual decoder with controlled Canvas/clock collaborators; ownership, generations, shared-track/private-deck views, cancellation, configuration and disposal. | Controlled collaborator evidence, not real browser transport. |
| Real engine → karaoke → GPU mixer → capture | [19/19](karaoke-integration-browser-results.json) | Real decoded WAV BufferSource, named CDG File, actual engine play/pause/seek/reverse/loop, pixels, profile/crop changes, cancellation, capture video and captured audio decode. | Original synthetic fixtures, one browser and a short run; fresh decoder comparison validates bridge timing/routing rather than independently proving the decoder specification. |
| Main UI MP3 + CDG import and transport | [Saved UI observations](karaoke-main-ui-results.json), [screenshot](video-karaoke-main-ui.png) | Explicit paired import onto **Deck 2**, no autoplay, then the paired deck's play and pause clock. | Does not execute the entire harness through main controls, prove reload recovery, or establish physical audiovisual synchronization. |

The pure state suite is now **15/15**. The separate [Video pipeline integration](video-pipeline-browser-results.json) is **31/31**, including actual reverse seeks, last-decoded-frame retention, continuous reverse, 720p and one actual 1080p render/readback. Those results retain their own scopes; neither requested dimensions nor a short capture establishes sustained HD throughput.

## Main UI import: correct target and provenance

The parent generated an MP3 locally with the installed FFmpeg from the harness's original WAV: **10,592 bytes, four seconds**. This was an original signal conversion for the fixture; no FFmpeg decoder code, commercial karaoke media, lyrics or vendor assets were added. The saved UI JSON records exact original MP3/CDG/WAV hashes, byte counts and the encoding command. Those original bytes remain in ignored local evidence; no commercial media was included.

The explicit MP3/CDG pair produced **one imported library item with graphics**, targeted to **Deck 2**. The UI reported “Pair imported. Playback remains controlled from the audio deck.” Before playback it showed **zero decks playing** and **CDG graphics · 0.00s · audio deck 2 clock**. The paired deck then showed **one deck playing** and **0.37s** on the graphics clock. Pausing returned to **zero decks playing**, with the graphics clock at **0.43s**.

The saved file also contains an earlier Deck 1 probe and a “No media loaded” graphics reading. **Deck 1 was unrelated to the imported pair. That probe does not test pairing and supports no inference about the pair's success or failure.** Only the explicit `targetDeck: 2` and `pair*` observations above support this UI claim. The screenshot is supporting visual context, not a substitute for those transport observations.

## Implemented independent contract

`createCDGDecoder(bytes, {transparency})` provides `renderAt(originalTrackSeconds, {crop})`, `reset()`, `dispose()` and diagnostics. It copies input, keeps indexed graphics/palette state, preserves every complete packet's timeline slot, and processes packet `floor(t * 300)` inclusively at time `t`, clamped to the stream. Packet 0 applies at time 0. Backward time replays state; graphics EOF holds the last frame.

The actual mixer APIs are `loadKaraoke(index, file, trackId, {transparency, crop})`, `configureKaraoke(index, options)`, `clearKaraoke(index)` and `karaokeDiagnostics(index)`. A real named Blob/File and at least one complete 24-byte packet are required. Unknown/timing packets remain timeline data; a nonempty stream does not imply graphics already exist in the current prefix. Invalid files/configuration preserve the previously committed association.

Copied session CDG bytes and configuration belong to an audio **track ID**. Each deck gets a private decoder/canvas and uses the actual engine's original-track position. Deck/track identity, audio load generation and association version prevent stale views or late File reads attaching to a newer selection. Reconfigure/reload/generation changes produce fresh source identities. A shared track's configuration/clear affects its association; each deck refreshes its own view. Clear and disposal release the applicable association/view, invalidate pending work and do not start audio. File bytes and blob URLs are session resources; scalar metadata cannot restore missing bytes after reload.

CDG frames letterbox into the channel's raw surface, before ordinary channel FX, overlays, transition and master processing. Karaoke time follows the audio deck even when ordinary `video.linked` is false; manual video crossfade remains independent in that mode. Main UI import explicitly selects an audio file, CDG, target deck, transparency profile and crop. Differing basenames are allowed with a warning; this is an independent explicit-pair policy, not a recovered vendor filename-matching rule.

## Actual integration observations

The harness uses original **28,800-byte CDG** and **128,044-byte WAV** Files, with public download anchors retaining those originals after Run. The WAV decoded to a real four-second mono buffer at 48 kHz in this browser. The real engine BufferSource drove changing graphics after the 0.5-second command, pause, forward/backward seeks, reverse and loop wrap. Output pixels and packet cursors matched a fresh decoder at the bridge's sampled position; recorded comparison differences in the inspected cases were zero.

The explicit `index` profile produced alpha **255** on the green fixture background at 0.9 seconds. The same bytes under `alpha-table` produced alpha **127** there. Crop changed the source from **300 × 216** to **288 × 192** and changed source identity. These are executed independent compatibility policies, not an automatic profile detector or proof of Serato's choice.

The real mixer recorded **35,718 bytes** of `video/webm;codecs=vp9,opus`: **42 processed frames over 1,434.6 ms**. Actual replay decoded **640 × 360** frames at media times **0.00** and **0.58 seconds**, with distinct frame hashes and **7,452 / 7,499** white marker pixels in the inspected regions. Captured-container audio decoded at **48 kHz, two channels, 1.38 seconds**, with RMS **0.04641**, 440 Hz amplitude **0.06584** and 880 Hz amplitude approximately **0.00000317**. This establishes actual encoded graphics and the engine tone, beyond merely seeing an input audio track. It is a short synthetic capture, not sustained frame-rate, codec-matrix, lip-sync or device proof.

## Source conflicts and open boundaries

The prior [remaining-workflow research](../research/VIDEO_REMAINING_WORKFLOWS.md) and [source JSON](../research/VIDEO_REMAINING_WORKFLOWS.json) remain the provenance for primary format/public product sources. They were not replaced by memory or silently upgraded to current reference observations in this review.

- **Crop:** informal safe-area prose contains 294 × 204, while the explicit rectangle `[6,12,294,204)` and inspected implementation sources yield 288 × 192 within 300 × 216 storage. Full storage remains available; crop is explicit.
- **Transparency:** inspected implementations disagree. The index profile keys one palette index; the inspected FFmpeg alpha-table mapping is `255 - ((value & 63) << 2)`, reaching alpha 3 at maximum input; the inspected VLC implementation omits instruction 28. No single comparator establishes universal behavior, and Serato 4.0.10's policy is unknown.
- **Channels/parity:** all tile channels play together. Selective-channel mapping/filtering is open. Parity bytes may be diagnosed, but no parity repair is implemented or claimed. Bounds checks, packet alignment and replay are not error correction.
- **Pairing/import:** the exercised path is explicit local MP3/CDG selection. ZIP import, automatic matching under ambiguous names/case/Unicode, large/hostile/corrupt file matrices, session reopening, and general codec compatibility remain separate work. Main-UI profile/crop/clear/cancellation controls were not all executed by the saved import/play/pause observation.
- **Reference/native:** no reference runtime pixels, transfer functions, installed-version pairing policy, exact synchronization, native package, physical audio/video output, hardware, Syphon or user acceptance was established. Public documentation establishes feature existence; it does not establish parity.
- **Other Video workflows:** [Media Crate's initial result](video-media-browser-results-initial.json) remains **17 passed / 9 failed / 26 total**, awaiting diagnosis at this cutoff. Audio/video FX semantic coupling and reference catalog/runtime gaps retain their separate gates. Karaoke does not imply the whole Video feature is accepted.

## Snapshot and next evidence

[Implementation contracts](../research/video-implementation-contracts.json) preserve the existing 55 independent effects, 34 transitions including the separate Open Play baseline, catalog source distinctions and model-routing recommendations. Added karaoke APIs/evidence are scoped here. Its source hashes identify bytes read at this working cutoff; they do not retroactively bind every historical browser result to current files. The parent must refresh hashes and rerun affected paths for the final named candidate after media changes settle.

## Final runtime/UI continuation

The final real-engine karaoke retest passed19/19 after Video first-frame and Media
ownership fixes. The latest explicit main MP3+CDG import reported no autoplay,
then Deck2 graphics advanced to0.35s and paused at0.41s with0 decks playing. The
original0.37/0.43s observations are retained as earlier executions; the screenshot
shows the latest paused state. The actual import callback also passes14 controlled
async tests covering later ordinary loads/ejects, same-ID reloads, lock changes,
concurrent pairs and changes during graphics import. Controlled adapters do not
establish browser decoding; the main UI and19-case browser run supply that layer.
Read `video-node-checks.json` for all executed Node script scopes.

### Final import ownership review

A late older `app.load` could overwrite a newer track after awaiting Stem Slip
disarm. Per-deck request ownership is now claimed before that await, rechecked
before commit and invalidated by eject; the playing-deck lock is rechecked too.
The retained red result and final10/10 extracted real load/eject/pair-callback
checks are `video-import-ownership-results-initial.json` and
`video-import-ownership-results.json`. Controlled collaborators establish the
scheduling correction, not a timed browser race. The actual main UI separately
reimported MP3+CDG without autoplay, advanced to0.24s and paused at0.28s with zero
decks playing: `karaoke-import-ownership-main-ui-results.json`.
