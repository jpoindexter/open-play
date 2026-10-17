# Independent review — FX Tap BPM and per-unit clock authority

Reviewed bounded FX-tempo cohort (`fx-tempo.js`, panel controls, app persistence, AudioEngine timing and semantic Video link queries). No browser, native, Git or remote tools were used. One concrete defect was reproduced and parent corrected it; current controlled regression is **6/6 executed**. Actual corrected browser behavior remains parent-owned acceptance.

## Confirmed defect: Auto displayed new metadata BPM but used the previous clock

Before correction, the actual grid-save handler in `prototype/panels.js:539` changed a loaded track's BPM and called persist/render methods, without refreshing the configured AudioEngine BPM table. Track-details submission (`panels.js:336`) and asynchronous analysis (`app.js`, BPM assignment in the analysis completion path) had the same propagation boundary.

At the same time, `panels.js:664–668` derived the live Auto status from current track metadata every tick. The result was a visible authority mismatch: after saving loaded Deck 1 from 120 to 144 BPM, the status said **Auto 144.0 BPM**, but the effect slot still received 120 BPM and the semantic Echo link still requested a 0.5s beat instead of 60/144s.

Executed reproduction (before correction): extracted and invoked the unchanged actual grid-save handler with controlled form cells, then invoked the actual live-status function. Used the real AudioEngine `configureFX` and `videoFXLinks`, with a controlled existing effect-slot update callback:

```json
{
  "actualExtractedHandlerExecuted": true,
  "trackBPM": 144,
  "rendered": 1,
  "persisted": 1,
  "status": "Auto 144.0 BPM",
  "engineAutomaticBPM": 120,
  "effectSlotUpdateBPM": 120,
  "semanticBPM": 120,
  "semanticEchoSeconds": 0.5
}
```

This is a practical wrong-clock issue, not a dispute about the independent tap estimator or a claim about Serato's exact DSP. The controlled reproduction establishes the handler/state/processor-parameter mismatch; it does not itself capture audible repeat timing.

## Correction and executed regression

Parent added `AudioEngine.updateFXBPMs` (`prototype/engine.js:538`), which validates canonical deck tempos, skips identical arrays, and reuses `configureFX` with the held fourth-tuple bank settings. At the parent's request this reviewer added one app-owned integration call at `prototype/app.js:1586`, before panel status updates. It derives all deck tempos centrally, covering grid edits, details edits, asynchronous analysis and other ordinary state changes without reopening FX or resetting tap state.

`scripts/test_fx_tempo_independent_review.mjs` executes six current regressions:

1. Actual extracted grid-save handler → actual app sync call → real engine/semantic query: track, status, effect callback and semantic query all become 144; Echo beat becomes 0.4166666666666667s.
2. Same metadata change with manual100 holds manual100, preserves slot ownership, and 100 unchanged synchronization calls produce zero extra effect updates.
3. Actual status function does not rewrite stable text across 100 ticks; a real Auto BPM change writes the status once. This verifies guarded DOM property writes, not screen-reader announcements.
4. Actual pointercancel/blur handlers clear hold timers; canceled keyboard release does not tap.
5. Held Enter (including repeated keydown) returns Auto exactly once and suppresses its own release tap.
6. Detached controls and closed panels cannot finish obsolete hold timers.

The test invokes extracted actual production handler bodies with controlled DOM/timers, rather than reimplementing their gesture logic. This remains below real browser event dispatch and cannot prove OS focus behavior, pointer capture dispatch, assistive technology output, musical perception or actual audio sample timing.

Also executed existing `scripts/test_fx_tempo.mjs` **12/12** and `scripts/test_fx_tempo_engine.mjs` **6/6**. Their passing results did not catch the initial metadata propagation defect; they had configured the correct BPM table directly or changed tempo via engine.setRate.

## Claims examined without another defended defect

- Manual/Auto settings restore only intended `{mode,bpm}` scalars; tap timestamps/history/armed state are session-local. Independent bank authority survives engine.setRate and ordinary trackload configuration through the fourth tuple.
- Initial range is 20–400 BPM, invalid/nonmonotonic timestamps are rejected, median history is bounded, subdivisions normalize toward the initial anchor, and long idle re-arms while holding established manual BPM until another valid pair. These are explicitly independent policies, not recovered vendor estimator curves.
- Pointer cancellation, keyboard blur, repeat suppression and closed/detached control guards behaved as above in executed handler tests. No broader OS/window interruption guarantee was established.
- Unchanged routing/slot counts preserve AudioEngine slot ownership; actual processor-internal reuse depends on the individual effect update contract. A slot identity check alone is not proof of unchanged processor histories or inaudible updates.
- The semantic Echo query consumes the same effective bank clock and preserved settings tuple. Video Echo remains an independently mapped visual effect, not vendor-equivalent Video linkage.

Parent reported actual original FX harness **8/8** plus pointer/keyboard hold, tap pair, persistence/reload and Auto controls before this review finding. Those reports are separate evidence and do not establish that corrected metadata synchronization has passed browser/audio acceptance. Parent is extending that acceptance.

## Candidate SHA-256

```text
6417ffdaaf05334b906ef22c4e6f10ab90950068796b797ec323a819d838a380  prototype/fx-tempo.js
76fdbd09053ed0abc3c2a28cdec1f10d23781bbe59efd744b929236051aab1fe  prototype/panels.js
df6b8317928994658c6481c874ba424dcb31b6c3c0c516c14cdbc7bfec1687a3  prototype/engine.js
7376fc0cd7de0679fadfb67e1eef93602cd41a17e138aaf21f903ac61ecfe67b  prototype/video-audio-fx-state.js
3dcf9d9aac8a6b419fd4b413a5e407fd50e89a08eba928e4d11deb463ebbbb4e  prototype/app.js
afc5766ca54dc7dff716eadfd8eeecdf8883e10b600f6ecbdf0c858997758e66  scripts/test_fx_tempo_independent_review.mjs
```
