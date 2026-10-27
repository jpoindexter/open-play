# Reject invalid loops before changing transport — 27 October2026

Fable20October finding11 remains in repo1e33d71: setLoop trusts ordinary raw bounds; Smart Sync's optional validation guards only engaged warped decks. The actual valid-user path is paused Quantize-off End→Loop. One isolated four-deck GUI creates loop=true/In48/Out48on a48s generated track and replaces most controls. That is an invalid active span; no audible-mismatch cause or pop was inferred.

The first diagnostic setup used an ignored saved quantize field, so Quantize stayed on and produced a valid47.903225806→48span. Its failed assertion is excluded and retained as setup-excluded-ui.json. Corrected explicit per-deck Quantize toggle preceded the actual baseline above. No product change was made before that corrected reproduction.

One existing-engine validateLoop method rejects nonfinite, equal/inverted, negative and out-of-track enabled spans. setLoop calls it before optional Sync hooks/state/source changes; start calls it for a loaded deck before cancellation/preparation. The Loop UI calls the same method before beginning Slip. Disabled loops retain their existing off behavior, including default0/0bounds; valid spans proceed normally. Seven product lines/three call sites, no new runtime module/dependency or clock/DSP/routing/layout change. Existing oversized engine/app remain modularization debt.

Two focused actual-engine/actual-controller regressions fail before and pass after. Controlled graph endpoints check malformed bounds reject without changing deck/voice/hook state, stale invalid starts reject, valid on/off works and the UI does not begin Slip or redraw after rejection. These are not PCM/physical tests.

Actual corrected workspace after repair leaves loopfalse/In0/Out0/position48, shows the explicit bounds error, retains236/236observed deck/mixer/waveform/library nodes,4Play and2lazy previews. The preceding paused-only repaired observation retained237/237nodes/3previews; async preview pumping changes independently captured sets. Valid Home→Play then starts A; invalid active setLoop5→5rejects RangeError while retaining its exact Web Audio voice/start token/rate and advancing finite clock. Physical mute asserted; final all decks stopped. This does not prove musical loop quality, waveform-frame latency, absence of pops, or native held/controller acceptance.

Reused core-controls-harness with a narrow button; broad Run core controls was NOT pressed. Diagnostic223lines/regression21lines. No normal profile/original music touched by the diagnostic; only generated owned audio. No broad suite, matrix or clean soak. [Compact evidence](loop-bounds-2026-10-27.json); raw setup/baseline/repair logs in ignored local-evidence/loop-bounds-2026-10-27/. Broader DEK-004, Sync/pop/four-deck and owner hardware/listening gates remain open.

## Exact private native delivery and scoped closure

Private71/sourcee92e3d6 actual archive/controlled-host5/5;613prototype files/101selected declared modules. Protected70recording preflight clear/normal quit/process exit; closed254-file/120546148Bprofile backup hashes equal before/after/copy. Settled71startup preserves same4real tracks/16library tracks/exact BX3 metadata/core controls/decoded detail/overviews/previews; master silent/Autoplay off.

Actual current native Compact main interface: A Quantize changedon→off; trusted End seeks337.0377s; Loop shows exact bounds error. Master stays silent. Trusted Home/Right/Right restores2s, Quantize restoreson; B/C/D remain3/4/5s.4Play/tempo/filter/level/12EQ and5viewport AX preview images retained. No main Play/Sync/REC. Native message/position proves that UI branch, not direct loop-bound/DOM/pointer/acoustic inspection. [Delivery](desktop-0.1.71-playback-delivery.json). Defaults71/named starter syntax checked only. Owned diagnostic tab/server closed.

[CORE-FIX-25](https://trello.com/c/eOgKtAwN) is closed only for stated invalid-loop safety criteria after exact readback. DEK-004 valid-loop/reference/controller/listening and Sync-pop/four-deck/hardware/release criteria remain open. [One owner session](https://trello.com/c/yJ8r9kCD); do not repeat the covered paused error.
