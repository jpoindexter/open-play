# Keylocked Stems activation: phase evidence and review decision

18 October 2026. **The keylocked activation failure remains open. No production fix is included in this checkpoint.** Physical controller testing of frozen desktop 0.1.23 takes priority while Jason is present; these diagnostics did not change that app, its mappings, or its audio graph.

The retained actual browser recording fails the unchanged 0.85 minimum 10 ms RMS ratio, at 0.64542 left / 0.81476 right. The original's steady amplitude is almost unchanged across activation, but replacing its processor changes phase. The earlier ordinary loop improvement does not establish keylocked continuity.

The serial experiment runs the unchanged production WASM with a 128-frame clock. At the same logical source trajectory, later two-channel startup changes the original pair by −82.89° / −135.07° relative to a warm two-channel instance. Keeping startup equal but adding eight Stem channels changes it by +13.02° / +24.90°. Same-start duplicates produce byte-identical complete outputs. The difference is deterministic and depends on processor startup/layout; the exact internal DSP mechanism is still inferred. These are serial processor observations, not browser or physical acceptance.

The authorized bounded Fable consultation is saved in `docs/research/claude-fable/stem-activation-phase-20261018.md`. It proposed keeping the old original processor through activation and transferring to a new processor on the first partial Stem-pad action. The report explicitly predicts a once-only discontinuity at that later action. **That recommendation is not accepted as closing the gap:** moving the dip to a normal performance action leaves the requested functionality incomplete. Its claims about opaque WASM internals remain hypotheses, and its final stopped-desktop statement is superseded by the live controller receipt.

The consultation also questioned whether the browser phase measurement accidentally used capture-relative time. The existing inspector already uses `(sampleIndex + startFrame) / sampleRate`. An independent least-squares fit of cosine, sine and DC on that same absolute AudioContext sample axis retains +157.01939° / −62.08805°, with amplitude ratios 1.000311 / 1.000173. Both pre/post windows are explicit in `stem-activation-absolute-phase-results.json`. This resolves that analysis question without generating new audio, aligning samples, changing gains or relaxing thresholds.

The first least-squares run emitted NumPy matrix-product warnings although all reported values were finite. The residual calculation now uses an elementwise sum, checks every coefficient/residual for finiteness and forbids non-finite JSON. One focused rerun produced the same phase/amplitude results without warnings. No broader audio suite was repeated.

Evidence:

- `docs/prototype/stem-activation-phase-isolation-results.json`: original processor output hashes, geometry, timing and measured layout/startup differences.
- `docs/prototype/stem-activation-phase-repeatability-results.json`: duplicate instance controls.
- `docs/prototype/stem-activation-absolute-phase-results.json`: independent actual-browser PCM analysis.
- `experiments/stem_activation_phase.mjs`, `scripts/inspect_stem_activation_phase.py`, `scripts/inspect_stem_activation_absolute_phase.py`: executed diagnostic sources. Original audio and exact output PCM remain private under ignored `local-evidence/`.
- `docs/prototype/controller-physical-20261018-results.json`: separate current physical test scope; not DSP acceptance.

Next DSP work must preserve the original processor's audible continuity and exercise the first partial Stem action, all-off/all-on restoration and Stop through the real engine. A design that merely defers a replacement failure cannot earn acceptance. Existing multi-deck ownership, rollback, rate/key/seek/Sync coordination, window and PCM-budget constraints remain requirements; music, reverse, gestures, transformed loops, native packaging and vendor equivalence remain open. No second unsynchronized playback owner, tone-fitted alignment or gain masking has been introduced.
