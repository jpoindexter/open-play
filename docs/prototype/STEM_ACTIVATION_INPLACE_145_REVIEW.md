# Live keylocked Stem activation — checkpoint145

18 October2026. **The actual browser Play → Prepare → immediate Stem pad → all-pad mute/restore → Stop path now passes the previously failed rate1.1 continuity criterion. Full Stems/keylock and Serato parity remain open.** Frozen desktop0.1.23 and its tested272-assignment alternative controller profile were not repackaged or changed.

## Change and cause

Checkpoint137 replaced a live keylock processor when prepared Stems arrived. Its retained four-second capture failed the existing0.85 minimum ten-millisecond RMS ratio at0.6454/0.8148 despite a continuous application clock. Checkpoint138's serial experiment showed that one fixed ten-channel processor could retain original stereo audio while receiving eight real separated channels, but it had no browser replacement API or app integration.

The new separately named `SignalsmithStretch-open-play-replace.mjs` variant adds one acknowledged command: replace selected channels of an exactly addressed retained chunk. It validates the entire packet before replacing that chunk's channel references. It does not reset the processor, configuration, schedule or original-channel PCM. The history parent, original upstream module, embedded WASM line, default preset and MIT notices are preserved.

The staged whitespace check reports14 inherited whitespace-only lines in the new vendor-derived copy. Their text matches the preserved parent exactly; the executed source hash is retained. The remaining staged changes pass the whitespace check. This is a formatting exception, not a runtime-test result.

`keylock-shadow-live.js` can now reserve four silent stereo Stem slots alongside the original source, without allocating whole-track silent AudioBuffers. Its ordinary bounded0.5second chunks carry processor-frame addresses. Replacement uses the same SRC/pitch-map coordinates as normal filling, serializes with fill/drop, honors operation ownership and accounts for temporary replacement copies. Only decoded mono/stereo Stems with matching geometry are accepted for reserved stereo slots; mono is duplicated by channel reference. Those additional formats/paths need dedicated runtime evidence below.

`engine.js` reserves the slots for forward live-keylocked playback with original-only input, routes the still-silent Stem outputs through existing Stem histories, and keeps the original route selected while preparation is pending. Attaching prepared Stems fills the selected live processor instead of replacing its voice. Cold replacement remains available for other transport owners. Two-owner readiness is committed only after every transfer succeeds, with a final ownership check so Stop while a sibling prepares cannot publish stale readiness.

## The first app run exposed another real gap

An actual app run with the new replacement command retained its voice, processor and clock, but immediately pressing a Stem pad after the transfer acknowledgment produced a level dip. Minimum ten-millisecond ratios were0.02397/0.02648. The source data had arrived, but the unchanged processor's analysis/output history still contained the earlier silent Stem inputs. The original full capture and executed source capsule are retained privately, and `stem-activation-inplace-145-initial-results.json` records the failure.

Preparation now remains pending for the processor's queried latency plus two render quanta after the final transfer acknowledgment. This happens before the UI reports Ready; it does not defer transfer or construct a processor on the first pad press. The wait follows the audio clock, checks ownership, and has a finite10second failure bound. It uses no compensating gain, PCM edits, fitted alignment, first-pad workaround or relaxed threshold. More rates/configurations still require evidence that this readiness bound is sufficient.

## Executed component and app evidence

A real browser component check ran two fixed ten-channel processors, generated original stereo tones, and the actual previously completed SCNet cache. Sixteen replacement chunks were acknowledged in11.61ms of audio-clock time. All12 retained channels were finite/hash checked over176,400frames each;1,379 render quanta were contiguous. Original-output minimum10ms ratios were0.97395/0.98993; the eight Stem outputs were silent before replacement and produced nonzero separated output afterward. This component result does not establish app integration by itself.

The corrected **actual app** workflow used the production Play and Prepare controls, the local API/completed real SCNet cache, download/decode/attachment, an immediate Vocal pad press, four-pad mute, restore and Stop. Physical destinations were muted. It reused the same live voice, group and ten-channel processor throughout activation. The first pad selected real Stem routes with gains `[0,0,1,1,1]` rather than retaining the original bypass. Its click handler took1.8ms in this run; that is not an acoustic-latency measurement.

| Corrected app capture | Left | Right |
|---|---:|---:|
| Frames,44.1kHz |176,400|176,400|
| Minimum10ms RMS / baseline |0.9736433371|0.9909125301|
| Maximum adjacent sample jump |0.0092541762|0.0155332007|
| Longest near-zero run |0|0|

The unchanged guards are RMS ratio≥0.85, adjacent jump≤0.03 and near-zero run≤1ms. As in checkpoint137, the continuity metric excludes only the declared first50ms/last100ms; every sample, including those intervals, remains hash/finite checked. No repair or alignment was applied. Both channels have1,379 contiguous captured quanta. Clock difference at activation acknowledgment was0. All four pad mutes and Stop produced exact zero; restore produced nonzero output. Original decoded stereo hashes were unchanged. Source identities before and after the run matched current product bytes.

Three new processor-RPC contract checks passed: invalid geometry cannot partially mutate retained channels; valid replacement preserves original references/DSP instance/geometry/schedule; and dropped-window addresses remain absolute with terminal disposal still enforced. Three real-engine/coordinator checks with controlled RPCs passed: both-owner readiness, failed-transfer cache rollback, and a late Stop while a sibling prepares. Four preceding ordinary-coordinator checks also passed before the final ownership guard; their separate source identity is retained. These controlled checks are not multi-deck acoustic proof.

Reports:

- `docs/prototype/keylock-channel-replace-145-results.json` — real browser component PCM.
- `docs/prototype/stem-activation-inplace-145-initial-results.json` — first-pad failure.
- `docs/prototype/stem-activation-inplace-145-results.json` — corrected actual app PCM and ownership.
- `docs/prototype/stem-activation-contract-145-results.json` — preceding ordinary coordinator checks.
- `docs/prototype/stem-activation-inplace-145.png` — actual app stopped after the workflow.

Complete PCM/original JSON and the initial executed source capsule remain private under `local-evidence/keylock-channel-replace-145/`. A first DOM export hit the tool's string-return cap; its truncated text is preserved separately and was not analyzed. The complete export was reconstructed from bounded DOM reads, length checked, parsed and fully hash checked. The original serial138 inspector was preserved; the distinct browser inspector is `scripts/inspect_stem_activation_browser_inplace.py`.

## Remaining work and exact re-entry

Next test the new path's cancellation during warm-up, refill/drop at a nonzero group origin, resampled/key-shifted input and repeated preparation. Repeat preparation after a ready owner deserves particular rollback scrutiny: partially replaced Stem channels may already be audible when a later transfer fails. Preserve current failures and make that state coherent before claiming cache/cancel/fallback parity. The current controlled initial-failure check covers original-only pending routes, not every already-audible Stem rollback case.

Musical SCNet attribution/quality failures, other rates, transient quality, memory/CPU across four decks, reverse/loops/warped loops/Stem Slip, scratch return and native/controller/headphone acceptance remain separate. This run used a completed real SCNet cache, not a new inference or new musical-quality result. No unrelated55-effect matrix was repeated. All full-parity flags remain false.

The bounded Ghidra disassembly also completed this checkpoint and is private under `local-evidence/factory-jog-145/`. It resolves a tail-called motion helper that the prior pseudocode had merged, but leaves indirect switch destinations undecoded in that extraction. The platter's physical unit remains unresolved; do not enable its eight source inputs by assuming512ticks/revolution or relabeling the248-tick alternative calibration. Controller catalog coverage remains19,252 assignments across145/197 definitions; Hercules356 assignments/18 unresolved. Alternative, authenticated Official Serato and User source labels remain distinct.

The full goal remains110groups/522requirements/9beta deltas/26release checks,55extendedFX and actual Stems/keylock. The build plan, feature/model plan, Trello and Claude handoff preserve this scope. STM-001 routing remains Codex `gpt-6.1-sol`/high and Claude `claude-sonnet-5`/high; STM-003 remains Codex `gpt-6.1-sol`/xhigh and Claude `claude-opus-5`/high. These are prior planning recommendations, not a live availability check or permission to launch another agent. Full Claude audit remains unlaunched.
