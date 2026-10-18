# GUI tempo after out-of-range Sync

18 October 2026, browser work based on31bc09f. **Desktop0.1.22 is unchanged and does not contain this GUI patch. Physical/controller, exact Serato GUI and full parity acceptance remain open.**

The original app put actual pitch directly into an HTML range limited to the selected±8/16/50%. With a100BPM track synced to120BPM, actual pitch was+20% but the native input clamped its value to+8%. A real browser ArrowDown then requested+7.9% instead of+19.9%, changing both synced decks. This was reproduced before editing production code: rates1/1.2 became0.8991666667/1.079, and retained actual master-output samples measured296.725/593.45Hz instead of330/660Hz. This was an audible transport defect, not only a display label.

The new browser-only`tempo-slider.js` separates GUI position from actual pitch. While synced, in Smart Sync REL, or outside the selected range, it starts a relative adjustment around current tempo. Native slider arrows and pointer travel change that tempo by the selected movement. The visible label says`±8% · REL`; accessible value text reports actual pitch, relative adjustment and the same BPM function used by the platter. Ordinary unsynced, in-range control remains absolute. A range change preserves the actual tempo and recenters its relative coordinate. An external tempo change rebases subsequent movement against the last GUI position. Requests accumulate/coalesce while audio work is pending; rejected requests rebase at the actual rate. Saturated transport travel is consumed, allowing immediate reversal. Track replacement establishes a fresh coordinate.

Control/Command-click resets actual pitch to zero. Control/Command+Home provides a keyboard equivalent; ordinary Home/End and arrow behavior remain native input behavior. Empty decks disable the slider. This layer calls the existing production`engine.setRate`, including its shared Sync handler; it does not change DSP, MIDI pickup, controller addresses, permissions or native packages.

## Reference boundary

The installed Serato reference was inspected with two paused bundled demo tracks and the Hercules connected. Both selected±8% while the secondary displayed−17.1% pitch after Sync, matching99.5BPM; REL was blue. One right OFF returned119.0BPM/−0.9%. Final both OFF and both00:00.0 were visually observed. The selected Sync preference was not inspected in this sequence, so its one-OFF result is not evidence for Smart Sync first-OFF behavior. No Play was pressed. Raw screenshots stay ignored/private; sanitized observations and hashes are in[the reference record](../research/RELATIVE_TEMPO_REFERENCE_20261018.json).

Serato documents[relative hardware movement and shared Sync tempo](https://support.serato.com/hc/en-us/articles/227561947-Relative-Pitch-Tempo-Control-Smart-Sync), and separately documents[Practice-mode BPM-box dragging/fine adjustment and Control/Command-click reset](https://support.serato.com/hc/en-us/articles/360001274635-Practice-mode). A separate vertical GUI fader was not visible in the connected layout inspected. Open Play's relative GUI coordinate/recentering policy is independently implemented and **is not proved to match Serato's GUI gesture mapping or taper**. The new reset's outcome follows the documented zero-pitch action; its control surface differs.

## Executed checks

Eight focused controlled model cases pass: original no-jump step, ordinary absolute input/external update, shared/MIDI rebasing, REL/reset/range/new-track coordinates, pending rapid movement, limit reversal, rejected request recovery and reset/empty deck. These use an engine collaborator and establish no audio by themselves.

One final actual production browser workflow uses normal Play/Sync/OFF/range controls, real browser ArrowDown/ArrowUp/End/Control+Home key input and actual Command-click on the tempo slider. Two generated stereo engine buffers isolate330Hz on the left and550Hz on the right. Physical output is muted before playback. Eleven captured states cover:

1. Synced+20% baseline, GUI centered with accurate accessible pitch.
2. ArrowDown to+19.9%, both synced decks changing coherently.
3. ArrowUp restoring+20%.
4. First OFF and ArrowDown changing only the REL deck.
5. Range8→16 then ArrowUp preserving the offset.
6. Primary GUI movement changing shared tempo.
7. Secondary GUI movement after that external change, without a jump.
8. Control+Home resetting actual pitch and shared tempo.
9. Second OFF then End using ordinary absolute+16%.
10. Command-click resetting only that unsynced deck.
11. Both normal Play buttons stopping, followed by captured silence.

All22post-master Float32 windows contain13230finite samples per channel at44100Hz. An independent Python inspector rehashes every window, checks every sample, and estimates the global20–20000Hz Hann16xFFT peak without an expected-frequency mask. Worst frequency error0.000031331686Hz is below the fixed0.3Hz criterion; active RMS exceeds0.005. Both stopped windows are exactly zero. These are snapshots, not a whole-run continuity or acoustic latency measurement.

Original final JSON1573336bytes, SHA`aa105447d785fa1c0c4ce9758fb63fe4257f69400ea828e7ea6bb45e2d1fc207`. Raw original and22extracted`.f32`windows are retained in ignored`local-evidence/gui-tempo-132/`. The first after-fix cohort remains separately retained: the final candidate changed accessible BPM text to use the platter's existing BPM function and restricted pointer reset to the left button, then repeated the affected workflow once. No broad effects, stems or native matrix was repeated.

Seven fetched module hashes match before/after and final local bytes. Final production`app.js`SHA`87f35027b4daca098b481b5232294fe8ab3af0e9088a8565cbc079167aba55ad`;`tempo-slider.js`SHA`b83de88ef715f7bdd68d9d7745862f9ecaac80c41f53e91c7041b01f1576f7cf`. No whole master recording was made for this GUI regression; retained PCM is limited to the declared22windows.

## Remaining scope and re-entry

This does not establish physical MIDI, native22 GUI behavior, music quality, every pointer/touch drag, screen-reader interaction, exact vendor GUI/taper, shared-tempo races during pending engine work, or keylock/warp/StemSlip/loop compositions. The GUI accessor uses the existing platter BPM function, but those variable-grid combinations were not newly exercised. Relative GUI travel remains bounded by the selected range around its current anchor; a general Shift-reposition GUI gesture is not implemented or represented as vendor parity.

The official[Simple Sync description](https://support.serato.com/hc/en-us/articles/203056994-SYNC-with-Serato-DJ) also documents shared relative controller movement and controller OFF returning to absolute pitch. Source review shows Open Play's MIDI relative branch is currently Smart-Sync-only, and Simple OFF does not call the cached absolute reset. **Treat those as separate open core requirements, not fixed by this GUI change.** Next independent step: reproduce those Simple Sync controller paths with the production MIDI router/app, implement their correct mode-specific behavior and measure it. Keep22ready for the pending human leftPlay→RCA sound→samebuttonstop check; no timed capture while Jason is away. Add`tempo-slider.js`to declared critical package assets in the next justified desktop batch; do not rebuild merely to repeat green checks.

[Before reproduction](gui-tempo-before-results.json) · [Controlled checks](gui-tempo-policy-results.json) · [Actual browser audio](gui-tempo-browser-results.json) · [Current desktop test](TRY_CURRENT_DESKTOP.md) · [Full plan](../../FULL_BUILD_PLAN.md)
