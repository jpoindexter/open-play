# Same-fader companion to CORE-FIX-44

28 October2026. https://trello.com/c/ACAfgdKX . Same stale-input defect as44, at the outer GUI queue rather than the shared Sync request queue; no duplicate card.

## Reproduction and cause

The GUI fader keeps its own latest movement while an earlier call waits. A second movement on that same fader has not reached the shared request queue yet. Selecting another MASTER can therefore precede its later submission; the shared guard then mistakes the older movement for new input.

Actual composed modules (GUI slider, selected-master module, Smart Sync and shared request queue): A+1% pending, same A+3% queued, choose C90, reject older preparation. Baseline overwrites90 with123.6BPM, still showing C as primary.

Actual four-deck Compact workspace, generated tracks, paused/masterVolume0: A/B124 → A pending125.2 → same A fader+3% → C MASTER → reject first endpoint. Baseline incorrectly makes a second call and reaches127.7BPM. Repaired makes one call and restores124.0; C MASTER stays selected. All423observed controls,4Play and1materialized library thumbnail remain connected. The original error notice stays visible. One visible thumbnail is not proof of full-library readiness.

## Repair and executed checks

The existing GUI slider now cancels waiting input synchronously before explicit Sync, OFF, MASTER or Sync-mode changes. It drops only a pending record; idle fader coordinates are retained. Older active calls keep their own error handling and cannot consume the newly created GUI record. Fresh post-choice movement starts from the current deck rate and new relative coordinate and can proceed even while the older failure is pending. Shared engine/Sync ownership still governs active audio operations; this does not blindly abort a playing voice.

One narrow composed regression failed on baseline and passes afterward; fresh input after cancellation is checked both during and after old-request settlement. The existing same-fader failed-request regression and shared queued-master regression also pass (3tests total). Idle-coordinate preservation is asserted. The actual normal GUI failure path above is executed before/after; syntax/diff checks pass. No broad suite or soak. Module61lines, new regression29lines, two app wiring lines; two affected rendering collaborators now expose the required cancellation method.

No DSP/clock/fade/layout/dependency change. Physical output stayed muted; own context/frame/storage/server cleaned. Normal native92/profile/recordings and original audio untouched. The Mac's session-lock flag was observed true; no native input, Quit or launch was issued.

## Delivery and limits

Private93 lacks this companion and must not be promoted as the complete44candidate. Replace that never-launched staged build with a single94candidate after immutable packaging; keep current92/default/session intact. Relevant native failure/playing/listening and broad pop/stall/hardware gates remain open. This is not established audible-pop causation. Prior53manual/jog/EQ/Cue/stop acceptance retains scope. Goal remains active.

[Compact observations](TEMPO_SLIDER_MASTER_QUEUE_2026-10-28.json). Private original reproduction and captures: `local-evidence/tempo-slider-master-2026-10-28/`.
