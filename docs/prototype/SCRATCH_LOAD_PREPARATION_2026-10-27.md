# Scratch load and preparation — 27 October2026

The recent paused native starts showed Preparing scratch alongside initially blank deck waveforms. That is an observation, not proof that scratch caused every blank frame. The earlier Fable audit independently identified unconditional app-load scratch preparation. This pass checks the actual request/copy path and first-touch tradeoff, without a broad soak or speculative Sync/DSP rewrite.

## Executed real-track check

Reuse the existing core-controls harness with one narrow button on guarded8874. Four pinned real originals (different from the normal four-track session), imported through the actual file-input handler, then loaded on A–D. Analysis/stems/auto gain disabled for this load-preparation check; all4loads report decoded-cache misses. Physical output muted; normal desktop profile/original music untouched.

Original ordinary loads request4scratch preparations and retain4scratch cache entries/518937024bytes (~495MiB) of logical scratch input before any gesture. All overviews eventually paint, first prewarmed Space gesture acknowledges1source, controls/previews survive and cleanup stops/clears the owned cache. Source load regression3pass/1fail reproduces the unrequested call.

Remove the eager app-load request, retaining the engine’s existing lazy first-touch path. Intermediate timer-based first cold scratch takes2351.7ms; that result is retained. A first native-yield observation reports66.3ms but is NOT a matched comparison: those runs omitted decoded geometry and their duration precision differs. Cross-run waveform-ready times are observations only, not a measured universal speedup.

Final single same-buffer comparison captures24000Hz,2channels,8377295frames. Native task yield:68.9ms/254observed yields. Clear the scratch cache, retain exactly the same decoded AudioBuffer and use the existing timer fallback:1255.9ms. The fallback follows the native path and benefits from the prepared worklet module; these are single probe observations, not p75, device latency or physical scratch feel. The primary gestureRequests field is recorded before this second comparison gesture; the final warm log contains both requests.

Ordinary loads now request0scratch sources/entries/bytes before intent. All4source overviews paint, first gesture acknowledges1source and returns stopped;246/246observed control/waveform/library nodes/4Play/9lazy previews retained. Physical mute/all stopped/0scratch entries at cleanup asserted. All4original SHA256/size/mtime records match afterward. Logical scratch bytes are not total RSS/GC or all active audio memory.

## Small repair and preserved behavior

Delete2lines starting eager preparation in app.load. First actual scratch/censor still calls the existing engine preload/cache owner. Scratch wrapper’s default chunk yield prefers scheduler.yield when available, retaining setTimeout fallback. Same65536-frame copy bounds, finite-sample/type/size checks, exact PCM and transfer ownership, cancellation, worklet/kernel/DSP/clocks/routing. No new runtime module/dependency/option. Other preload callers and shared cache APIs unchanged. UI Preparing whole-deck scratch remains for actual first use; unsupported scheduler platforms can still be slow. This does not establish pop causation.

Six focused checks pass:4actual-source load/overview cases,2actual-wrapper cases covering native/fallback scheduling, exact PCM/original non-detachment, cancellation and nonfinite rejection before posting. Baselines are3pass/1fail and1pass/1fail respectively. No full Node suite, broad matrix, clean soak or fresh listening.

[HTML timer specification](https://html.spec.whatwg.org/dev/timers-and-user-prompts.html) documents nested timer delays. [Google’s task-yield guidance](https://web.dev/articles/optimize-long-tasks) explains yielding through a future browser task; it is used with feature detection and a fallback. These explain the scheduling choice, not application acoustic reliability.

## Delivery and re-entry

Private build/archive/native startup identity is recorded separately. CORE-FIX-23 https://trello.com/c/r0WBBUZs remains open for current native playing-load/controller first-touch acceptance; CORE-LIVE-01 https://trello.com/c/yJ8r9kCD holds the later session. Keep AUD-006 total-resource/GC and intermittent Sync pop/stall cards open. Retain the next actual event; do not repeat clean matrices. Receipt: scratch-load-preparation-2026-10-27.json. Raw original paths/audio/checks/screenshots remain ignored under local-evidence/scratch-load-2026-10-27/.
