# One real-track pending Sync cancellation

Executed the current HTML workspace through the existing four-deck diagnostic, on dedicated loopback18847 with separate in-memory session, IndexedDB/cache namespaces and physical output mute. No normal native/profile/session controls were operated. Four loaded real tracks: We Are Youth(CASSIMM Remix), Nautical Dub, Phuture/The Horses and Armando/Jack'n' '4' Jazz. Eight imported originals retain their pinned hashes. No audio bytes or original paths enter this report.

## Observed action and result

All four decks play; A is master. B uses key lock, Sync is off and its original nominal/source rate is1×. Two rapid Sync button activations request1.026218729955099×. Before cancellation, B is still playing with `processing:true`, one transform and start token7; its requested nominal rate is1.026218729955099× while its retained adapter/source rate reads1×.

The diagnostic dispatches Shift-Sync through the original production click handler—the same OFF branch. Once preparation settles, B remains playing, Sync off, no processing/queued start, nominal1× and reported adapter/source1×. All four original voice objects and rates survive; outgoing master is unchanged.233existing deck/mixer/control/waveform/preview nodes remain connected. A250mssettled observation follows; this is a bounded window, not a long-session guarantee.

Cleanup stops all four decks and leaves no queued Play; physical mute remains asserted. Actual DOM has4Play/4tempo/12EQ/4filter/4level/32cue pads/4overview surfaces,0active Play buttons and16library rows. Three lazy library preview images were present and retained; do not claim16rasterized images from this viewport. Native58and its normal profile remain separate.

## Diagnostic correction and limits

The first execution had already synced B while establishing A's master state; its before-rate matched the requested target. That passing output did **not** establish the intended different-tempo rollback basis. Original result retained privately as `initial-pre-synced-not-accepted.json`. The setup now explicitly disengages/resets B and asserts a different target before proceeding. Only this short check was repeated; no broad suite or soak.

This establishes one real-workspace pending-preparation cancellation, with actual decoded tracks, live keylock adapter and original GUI handlers. Programmatic clicks/Shift-Sync events are not trusted physical gestures. Transform presence does not identify a specific held audio-ACK, preflight, paused-sampler or warped-primary interleaving. `engine.audibleRate()` is a source/adapter state read, not independent PCM or heard alignment. No pop-free, native latency, musical grid, new hardware or full Sync acceptance follows.

Only diagnostic modules changed: the existing overlap-check module adds this focused check; its harness exposes an opt-in `syncCancelOnly` button.18847is an explicit second diagnostic-only origin; normal workspace origins remain rejected by the harness. No product transport/DSP implementation changed. Source hashes at boot and before/after match18runtime/fivepinned files; all eight original media hashes match. JS syntax/diff checks passed; no Node suite rerun. Owned tab and listener were stopped after capture.

After capture, a reporting-only review caught that the new button consumed the original soak's session-integrity function. Its caller now records the boolean inside `cancellation` and preserves that function, and the new button stays disabled until tracks are ready. One executed source-extracted cleanup check confirms the validator remains callable. This follow-up was not another transport run; the receipt distinguishes captured and final harness hashes. The60-line core check module and all product modules are unchanged from the actual accepted capture.

## Disposition and re-entry

CORE-FIX-08 and CORE-FIX-15 gain this scoped browser evidence and remain open for native/other fault windows. CORE-FIX-01/07 intermittent pop/stall cards stay open. Prior0.1.53human manual mix/EQ/Cue/stop acceptance retains its scope. Native0.1.58startup is separately observed; four-real-track native quit/reopen and reliable input remain pending.

Re-entry for this diagnostic, only if a relevant change or failure warrants repeating it: run the existing local review server on18847, open `four-deck-soak-harness.html?syncCancelOnly&run=<new-owned-label>`, import the eight pinned tracks and choose **Check rapid Sync then OFF once**. Do not press the five/twenty-minute soak control to accept this window. Physical mute and all stopped/ownership/source checks remain required. The direct OFF button, settings-mode changes and newer manual/replacement ownership need their own relevant runtime evidence; do not infer them from this one Shift-Sync case.

[Sanitized receipt](sync-cancel-browser-2026-10-25.json). Private acquisition, original result, source/media pins and screenshot: `local-evidence/sync-cancel-one-2026-10-25/`.
