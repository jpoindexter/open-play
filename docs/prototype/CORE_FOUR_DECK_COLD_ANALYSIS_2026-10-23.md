# Four-deck analysis-completion refresh — 23 October 2026

Core DJ reliability only. Preserve every existing layout/control and source/library waveform preview. No DSP, Sync clock, analyzer algorithm, CSS, dependency or real-file decoder changes. Original music is unchanged; generated demo PCM is retained byte-for-byte in the checked references. Unattended physical outputs are muted; labeled in-memory session, audio-library and thumbnail stores isolate the normal desktop profile.

## Reproduced cause and repair

The shared analysis runner unconditionally rebuilt every deck and the mixer after any successful measurement, including tracks not loaded on a deck. A real native-worker run failed the unrelated-node preservation assertion during four-deck playback and stopped safely. Five of six focused regressions failed before repair.

The repair reuses `renderDecks(index)` only for visible decks that still contain the measured track when its asynchronous analysis finishes. Unloaded tracks cause no deck redraw. Current ownership is rechecked, including duplicate, hidden and replaced tracks. The analyzed deck still gets its metadata presentation refreshed; shared mixer/canvas, unrelated decks and library previews remain attached. Persistence, library metadata refresh, manual-edit precedence, cancellation/failure cleanup, Auto Gain deferral and transport logic remain.

**110/110 Node checks pass.** Focused tests cover unloaded, loaded/duplicate, hidden and replaced tracks, intervening manual edits, failure/cancellation and yielded fixture preparation with concurrent callers. These are controlled collaborator checks, separate from actual worker/DOM/audio evidence.

## Actual worker session and limits

The matched before/after sequence uses eight additional real MP3s, 15 replacements, Horizontal/Vertical, two then four key locks, and eight fresh worker analyses during four-deck playback. Auto Gain is enabled for the measured sequence; active measurement changes must defer without changing the outgoing master voice/rate. The selected worker jobs cover loaded and unloaded tracks. Three 12-second PCM windows per run target analysis episodes; normal and incoming-Sync captures remain four seconds. Capture bounds are inspected against worker-ready events before claiming coverage.

Existing valid grids are analyzed during setup so four-deck Sync is executable. The measured jobs rerun real workers through Analyze with no result-cache substitution. Load/import call the same runner, but this session does not establish first-ever unknown-grid musical accuracy or automatic load-trigger timing. No grid is cosmetically snapped.

The immutable baseline is `19e6a8f`. Both sessions completed stopped without reported errors (317.60s before;317.07s after), with unchanged original session state. All eight actual worker checks pass after repair: three loaded tracks and five unloaded. The three loaded results defer active gain; all eight preserve the outgoing master voice/rate. The repair passes19setup/measured Load checks,20Play node/focus/busy/Censor checks and24stopped layout combinations adding24Load checks across all six choices,2/4decks and requested H/V Compact. Legacy choices keep their supported orientation; these are preservation checks, not complete visual/feature certification.

| Measurement | Baseline | Analysis-only repair |
|---|---:|---:|
| Deck articles removed |71|42|
| Shared canvases removed |14|6|
| Mixer strips removed |56|24|
| Library rows / preview images removed |0 / 0|0 / 0|
| Analysis-completion scripts attributed within long frames |8|3|
| Long Animation Frames |51|38|
| Attributed forced style/layout in those frames |381.9ms|272.5ms|
| Worst observed frame interval |100.1ms|233.4ms|
| Tick callback p95 range |0.9–1.5ms|1.0–3.0ms|

**The frame-time result is mixed, not a general lag pass.** The repair removes all five unloaded-track redraws and limits the three loaded results to their deck. Completion scripts in baseline long frames take51.1–56.2ms; only three remain after,39.5–48.8ms. The worst after-run frame has no script attribution, while several130ms-plus callbacks are attributed to library-preview Cache.match continuations.14lazy previews are ready after versus8before, so the remaining background work differs; do not treat the worst-frame increase as proven causation by this two-line renderer change or dismiss it as noise. The separate short trace below isolates synchronous fixture preparation and verifies a bounded scheduling repair.

[Comparison, exact module hashes and completion evidence](four-deck-cold-analysis-results.json). [Independent PCM/source-file inspection](four-deck-cold-analysis-pcm-inspection.json).22whole non-silent finite PCM windows total136seconds:16×4s and6×12s. All six measured worker-ready events fall inside their12s windows. No post-startup exact-zero telemetry; sampled source-grid error≤2.687µs after repair. Paused-incoming DJ W!LD/Open Mind and playing-incoming DJ W!LD/End Of My Summer Sync against Tiger Stripes/All Night Long retain outgoing master voice/rate. These are not acoustic or full-corpus acceptance. All eight original hashes/sizes/mtimes are unchanged.

Inputs: DJ W!LD/Open Mind; DJ W!LD/End Of My Summer (Chris Carrier Remix); DJ W!LD/Quand Tu Te Touches (Dan Curtin Remix); Grindhouse (Dubfire Terror Planet Remix); Mathias Kaden/Fyutr and Keep Balance; Radio Slave/The Clone Wars; Tiger Stripes/All Night Long. Raw evidence stays in ignored `local-evidence/four-deck-cold-analysis-2026-10-23/`.

## A second reproduced stall: cold fixture previews

The analysis-only run exposed library-preview Cache.match continuations exceeding130ms. Separate private probes measured synchronous `getChannelData`, `Blob.arrayBuffer` and `decodeAudioData` entry calls below0.5ms; these entry measurements do not measure asynchronous decode elapsed time. A deliberately cold library scroll then isolated the real synchronous work: the `async` demo decoder synthesized a complete48-second stereo fixture before its promise returned. Three actual previews blocked for81.3–87.6ms. This was fixture synthesis, not a demonstrated stall in real-file decode.

The generator now yields every32768frames. It reuses the existing buffer promise/cache, keeps incomplete buffers unpublished and preserves sample math, seed and order. The same three browser preparations return in1.4–2.4ms; worst interval in that short matched probe99.0→49.8ms. Two whole stereo reference buffers are byte-identical before/after (8,467,200bytes each); the scheduled control heartbeat now runs before preparation completes. The real-file decoder, transport and DSP are unchanged. [Diagnostic probe and complete reference-buffer results](demo-preparation-results.json).

These short probes use privately instrumented harness copies, three rotations and seven distinct playing real tracks. They are separate from the full15-rotation/eight-track sessions. Their raw PCM was not independently retained; continuous telemetry does not substitute for the retained full-session PCM windows. This is a bounded scheduling repair, not a guarantee against every GC/decode/preview stall.

## Final full session on both repairs

The final source-matched run completed315.859s and stopped with no queued restart/errors. All8actual worker ownership/master checks pass (3loaded,5unloaded); all3loaded measurements defer active gain.19setup/measured Load and20Play checks pass. A separate stopped matrix covers24layout combinations and adds24Load checks (43total). All six layout choices retain2/4-deck controls and requested H/V Compact behavior within each adapter's supported orientation. Module hashes match the committed candidate source; original prompt and all8music hashes/sizes/mtimes are unchanged.

| Measurement | Baseline | Final both repairs |
|---|---:|---:|
| Deck articles / shared canvases / mixer strips removed |71 / 14 / 56|42 / 6 / 24|
| Library rows / previews removed |0 / 0|0 / 0|
| Analysis-completion scripts attributed within long frames |8|0|
| Long Animation Frames |51|10|
| Attributed forced style/layout |381.9ms|16.3ms|
| Worst observed frame interval |100.1ms|75.5ms|
| Tick callback p95 range |0.9–1.5ms|0.9–1.3ms|

Final lazy preview count6versus baseline8and intermediate14: these are single bounded sessions with different background preview work, not statistical attribution of every frame improvement to the patch. The direct owner-preservation assertion and matched demo-preparation probe establish the specific repaired mechanisms. Six structural redraws and three loaded-deck analysis refreshes remain in this sequence; not every mutation/stall was removed.

Independent inspection now covers **33whole PCM windows totaling204s** across all3full runs (24×4s,9×12s). All9targeted worker-ready events fall within their12s captures. Samples are finite, with no post-startup exact-zero telemetry; final sampled source-grid error≤2.750µs. Incoming paused/playing Sync retains the outgoing master voice/rate. Physically muted software capture does not establish musical alignment, audible-pop resolution or device routing. [Stopped browser evidence](four-deck-cold-analysis-browser.png) includes the diagnostic overlay; it is not native-app evidence.

## Remaining gates

Broader stalls and intermittent Sync pops remain OPEN. The measured track's own deck still replaces its article; target-deck held pointer gestures need separate scrutiny. Explicit structural/schema/Instant Double paths remain. A worker result, source-grid phase or finite PCM does not prove musical downbeats or absence of audible pops.

Human re-entry remains one Sync-OFF manual transition, EQ judgment, temporary Cue hold/release/latch and clean stop. Physical headphone/master/controller output and native long-session performance are separate gates. Native startup accessibility evidence and its unresolved compositor limitation are recorded separately below.

The recurring-job [candidate playbook](../../.agents/skills/open-play-core-reliability/SKILL.md) reuses the existing harness/trace/inspector. It is saved for owner review, not adopted as a standing/global procedure; tests and runtime evidence are not owner sign-off. A separate read-only agent reviewed both product repairs and their tests, finding no actionable regression. It performed no runtime checks; its source review does not replace the executed evidence.

## Delivery and Trello

Candidate **0.1.48/source79b0c5b2bcd393dda20de99e9342ed5246180ea1**, ASAR `4e3643f1e338b984cb5ff3482b286d9b2df75ca08eccdf6941dd8167c8ead812`;5/5package checks pass. Native AX observed48startup,16saved tracks/14previews,2stopped decks/−10dB and no save/recovery warning. Old46recording panel had no active or downloadable capture before native quit. No normal-profile playback. Preview toggle0then14restored is verified in fresh AX, while the compositor screenshot remains an earlier unchecked modal; fresh visible confirmation is pending. No unlock bypass or live profile-file editing. Current/versioned48launchers syntax-checked, not executed; native launch used exact package path. [Delivery/re-entry](desktop-0.1.48-playback-delivery.json).

Five existing Trello current prefixes and parent comment read back exactly.140cards/dispositions unchanged; criteria/history/model guidance retained byte-exact. [Reconciliation](../delivery/CORE_FOUR_DECK_COLD_ANALYSIS_RECONCILIATION_2026-10-23.json). The software slice is delivered; broader pops/stalls and human/hardware gates remain open.
