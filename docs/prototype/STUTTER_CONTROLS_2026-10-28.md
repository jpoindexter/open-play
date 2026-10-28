# Stutter control retention — 28 October 2026

Actual four-deck Compact stutter previously replaced the shared deck/mixer tree: 114/355 controls survived and the explicitly focused other-channel fader lost focus. The existing command already guarded its asynchronous seek/start against track replacement and request cancellation; the final global redraw caused this separate presentation defect.

The one-line repair calls existing `refreshTransportControls(state)` instead of `renderDecks()`. UI command delegation and mapped controller dispatch retain their existing action/API; no engine, clock, DSP, layout, dependency or ownership change. No new runtime module is needed for one shared-helper call; legacy app.js remains oversized debt.

## Executed behavior

Same actual playing and paused-start actions now retain **355/355 controls, other-fader focus/value and 8/8 library preview nodes**. Stutter returns to cue zero and plays; outgoing deck B remains playing with the same voice and rate. Generated songs, physical output muted throughout. Baseline preserved three previews; the fresh isolated library had finished generating eight by this comparison, so this is retention of each run's existing nodes rather than identical initial library counts.

The prior 25-line composed handler regression fails with the old global redraw and passes with this source for playing, paused, replaced-track and cancelled-request cases. It was not repeated for identical source. This check does not prove real audio or native gestures.

An earlier repaired fixture never reached stutter while waiting for the audio clock; its file contains `Ready`, not acceptance. The resumed fixture explicitly awaits existing `engine.resume()` from its Run gesture. The completed result above is the current evidence. No product clock change or causal attribution of the earlier fixture timeout.

The isolated Stop/close/clear action returned “Stopped; frame closed; owned origin cleared”; diagnostic tab closed. Source fixtures and owned server are removed/stopped after capture. Normal desktop profile, original songs and recordings remain protected.

[Receipt](stutter-controls-2026-10-28.json). Private fixture, raw baseline/result and screenshot: ignored `local-evidence/stutter-controls-2026-10-27/`. Native packaging/playing, physical MIDI and listening remain separate; no claim about Sync pop resolution or full-core completion.
