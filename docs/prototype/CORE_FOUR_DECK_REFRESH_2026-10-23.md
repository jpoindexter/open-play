# Four-deck replacement and preview refresh — 23 October 2026

Core DJ reliability only. Preserve every control/layout, waveform pixels and library preview. No audio engine, Sync clock or analyzer changes in this slice. Diagnostic outputs are physically muted and session/thumbnail stores use separate labeled namespaces. Original music and normal desktop profile remain unchanged.

## Reproduced cause and smallest repairs

Play/Pause rebuilt all four decks, canvases and mixer, invoking layout adapters and replacing focusable controls during mixing. Preview refresh also rewrote the page-wide `data-library-waveforms` attribute even when its value was unchanged, invalidating style before subsequent geometry reads. Prior native trace tied dispatch/layout/preview refresh to long replacement tasks; the current actual-workspace baseline observes **66 deck replacement mutation records and90 redundant visibility writes across15rotations**.

- Ordinary Play, Pause, pending-start and Cue/Pitch latch update existing transport controls. The shared20-line presentation helper also serves frame refresh and processing notifications. Preserve focus, Play label/active/busy/title, Censor availability and PREPARING/PROCESSING/local/device status. Retain Sync reconciliation and library play-count/history/Prepare updates.
- Keep structural redraw for actual loads and cancellation of a held Slicer or pending Stem Slip request, because these restore other control/pad/output state. Do not blindly suppress redraws globally.
- Only change the library-preview visibility attribute when the preference changes. Thumbnail generation/cache, retry, identity-based completion, column toggle and lazy visibility remain.

Tests failed before unnecessary Play redraws, redundant shown/hidden attribute writes, and the exceptional pending-Stem-Slip cancellation fallback. **98/98 Node checks pass.** Controlled collaborators are separate from actual DOM/real-audio evidence below.

## Actual workspace verification

The before session completed309.22seconds using eight real MP3s different from the prior eight-track set,15replacements, Horizontal/Vertical, two then four key locks. The after session uses the same eight sources and asserts deck/mixer/waveform node identity, keyboard focus, Play state and Censor availability at each start. Both use fresh isolated state and thumbnail namespaces. AFTER additionally captures paused-incoming and playing-incoming Sync against the existing master after the performance sequence.

Eight tracks: Circulation “Cherry”; Dr Dunks/Zopelar “Slow One Eleven”; Ian Pooley “303 (2 Bars)”; Radio Slave/Kameelah Waheed “All Rize (The People In Fog Remix)”; Recondite “Caldera”; “Revival”; “Strange (To Stability)”; Jewel Kid “In The Dance”. Selection uses existing native-analysis support to make the session executable, not a claim of complete corpus accuracy. No measured grid is cosmetically snapped.

The repaired session completed317.31seconds with15replacements and two additional Sync capture episodes. All20Play starts preserved the original deck/mixer/canvas nodes, keyboard focus, busy/active state and Censor availability. Source hashes record the exact loaded modules. Both runs keep all four Play/tempo/EQ/scrub controls and six lazy preview images visible in the four-deck viewport.

| Measurement | Before | After |
|---|---:|---:|
| Deck replacement mutation records |66|21|
| Redundant page-wide preview writes |90|0|
| Long Animation Frame entries |60|35|
| Forced style/layout attributed to those entries |1373.7ms|801.4ms|
| Per-window waveform callback p95 |1.0–1.5ms|0.8–1.2ms|
| Worst animation interval |149.9ms|108.3ms|
| Maximum sampled source-grid phase error |3.495µs|3.371µs|
| Non-finite samples / post-startup exact-zero telemetry gaps |0/0|0/0|

These are single-machine instrumented sessions, not universal frame-rate guarantees. AFTER includes additional node/focus assertions and two4s Sync captures after the performance sequence; its total runtime is therefore longer. Both use new thumbnail/state namespaces. Actual load, key-lock and orientation changes retain structural rendering, accounting for the remaining21replacement records. The108.3ms worst interval is still a stall; broad lag remains open.

Paused-incoming and playing-incoming Sync each retained the outgoing master voice/rate, then completed with source-grid phase within5ms. Eight whole4s repaired Float32 master captures (plus six before) were independently inspected for finite samples and hashed. A transient in music is not automatically a pop; no new acoustic acceptance or all-pop-cause claim is made. Eight original SHA-256/size/nanosecond-mtime checks passed.

[Comparison and loaded sources](four-deck-refresh-results.json) · [Independent PCM/original inspection](four-deck-refresh-pcm-inspection.json). Raw receipts, fourteen complete PCM windows and the source snapshots stay in ignored `local-evidence/four-deck-refresh-2026-10-23/`. The two focused RED/GREEN suites are retained there and under `local-evidence/four-deck-preview-refresh-2026-10-23/`. No original music is committed.

The visible Astryx Columns proxy did not open its dialog through IAB automation; native preference-toggle acceptance is pending separately. The preview generation/viewport assertions above executed; they must not be reported as a full dialog/UI pass.

## Limits and next acceptance

No new listening or physical headphone/master/controller acceptance is claimed. Declared-grid agreement is not proof of kick alignment. Finite/nonzero master output cannot rule out all clicks, device underruns or musical artifacts. Keep broader Sync-pop, waveform-lag and human manual/EQ/Cue acceptance open; preserve actual occurrence recording/event context.
