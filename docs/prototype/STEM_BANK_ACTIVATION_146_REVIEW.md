# Repeat preparation and cancellation with audible Stems — checkpoint146

18 October2026. **The actual browser failed-repeat → Cancel during warm-up → successful Prepare retry sequence passes the unchanged continuity guards at rate1.1/keylock. Full Stems/keylock, musical quality, native/hardware and Serato parity remain open.**

## Reproduced failure and change

The previous same-instance path kept original playback continuous, but replaced the active Stem channels chunk by chunk. A controlled failure on the sixth chunk during a second preparation restored the cache reference while leaving five changed chunks in the audible processor. The actual browser capture measured minimum10ms RMS ratios0.24412/0.24985. This is a reproduced audio/cache inconsistency, not merely an inferred risk. Its complete4second/channel PCM, source hashes and executed source capsule remain private; the public receipt is `stem-repeat-146-initial-results.json`.

The live adapter now reserves **two four-Stem stereo banks** in the same processor: original stereo plus16 Stem channels,18 total. Public routing still exposes exactly five original/Stem outputs. Preparing a bank fills only the inactive bank, waits for the existing queried-latency readiness bound, and returns a staged owner with validate/commit/cancel operations. A failed or cancelled stage never selects its new bank. A successful stage switches the bank gates with the existing10ms linear fade. Another preparation waits until the previous switch finishes before reusing the old bank.

This changes the previous ten-channel internal layout, but preserves the same live processor throughout each accepted workflow. It retains up to two decoded Stem generations plus bounded processor windows; it does not claim zero extra memory or CPU. The embedded WASM, preset and `SignalsmithStretch-open-play-replace.mjs` bytes are unchanged from checkpoint145.

The engine stages all participating owners before publishing the new cache. Staged and cold-replacement owners share the existing readiness/arming barrier. Cold preparation receives candidate Stem buffers explicitly rather than exposing them through the shared cache early. A failed sibling, Stop or cancellation aborts staged ownership before selection and keeps the old cache. This prevents another transport from seeing an uncommitted preparation through the shared cache.

Preparation now carries an AbortSignal through audio activation. Cancel during activation no longer rejects merely because activation has begun; completed model files are retained rather than sending a worker-cancel request for an already completed cache. The panel's old “disable Cancel during Activating” guard was also removed.

## Actual browser check and retained failures

The first staged-bank browser attempt revealed the remaining UI guard: the timing hook attempted Cancel during `stem-bank-warming`, but the panel still disabled that button. The second preparation completed, and the test timed out waiting for cancellation. Its full workflow/error receipt and exact executed sources are preserved under `local-evidence/stem-activation-146/warm-ui-initial-*`. **That failed workflow did not export PCM**; it is not continuity evidence. The harness now retains an already-started capture even on a later workflow error.

The corrected actual app workflow used production Play and Prepare controls, the local API/completed real SCNet cache, and actual decoded audio:

1. Prepare while the original plays; immediately mute Vocal through its real pad, selecting Stem routes rather than original bypass.
2. Inject a controlled sixth-chunk failure into a second attachment whose candidate Stem PCM is deliberately one-quarter amplitude. The old cache, voice and bank remain selected. The scaled candidate is a diagnostic fixture, not a new model-quality result.
3. Use the actual Prepare button again and the actual Cancel button during the inactive bank's output warm-up. The old cache/voice/bank remain; the stage is cleared.
4. Use Prepare again successfully. The cache is replaced and bank0→1 switches in the same live voice, group and18-channel processor.
5. Restore the first pad, mute all four pads, restore all four, and Stop.

The Cancel timing hook is explicit test instrumentation in the owned harness. The production engine, preparation adapter, panel handlers, service cache, decoding, processor and output path are real. Physical destinations were muted. This is completed-cache evidence, not a fresh inference or musical-separation benchmark.

| Corrected6second app capture | Left | Right |
|---|---:|---:|
| Frames at44.1kHz |264,600|264,600|
| Minimum10ms RMS / baseline |0.9748753174|0.9926985100|
| Maximum adjacent sample jump |0.0093565993|0.0155415405|
| Longest near-zero run |0|0|

Both channels have2,068 contiguous capture quanta and finite, hash-checked PCM. Clock difference at initial activation acknowledgment was0. All-muted and Stop windows are exact zero; restore is nonzero. Original decoded hashes are unchanged. Source hashes before/after match the current executed candidate. Thresholds remain ratio≥0.85, jump≤0.03 and near-zero≤1ms; the prior declared first50ms/last100ms metric exclusions remain unchanged, and every retained sample is hash/finite checked. No PCM repair, fitted alignment, compensating gain or first-pad deferred transfer was introduced.

The capture was extended from4 to6seconds to include the failed preparation, actual Cancel and successful UI retry. It does not turn a longer capture into general stress or all-rate acceptance.

## Focused checks and artifacts

- Five real-engine/coordinator checks with controlled stages passed: two-owner readiness/publication, failed sibling rollback, late Stop, cancellation while prior Stem routes are ready, and mixed cold/staged failure before cold commit.
- The four existing ordinary activation/coordinator checks passed against this candidate, written to a new146 receipt rather than overwriting the145/historical receipt.
- Twelve real preparation-adapter checks with mocked fetch/decode/activation passed, including the updated AbortSignal cancellation contract. These are not browser/model/audio evidence by themselves.
- Source inspection found no production consumer depending on the old ten-channel internal count. Public output count remains five. Three historical resampled/coherence diagnostic harnesses still assert ten internal channels; refresh those structural checks against the new layout when executing the next targeted format/refill work. Do not reinterpret their old evidence as a new18-channel acceptance result.

Evidence: `stem-banks-146-results.json`, `stem-repeat-146-initial-results.json`, `stem-activation-contract-146-results.json` and `stem-banks-146.png` in this directory. Full raw JSON/PCM and145/failed146 source capsules remain ignored/private under `local-evidence/stem-activation-146/`. `scripts/inspect_stem_bank_activation.py` checks the full retained capture, bank transitions, cancellation state and current source identity. The older browser inspector keeps its ten-channel default and accepts an explicit geometry parameter for the new wrapper; its thresholds are unchanged. The serial138 inspector and old failures remain intact.

## Re-entry and scope

Next: execute bank replacement after a nonzero group origin and retained-window drop, then SRC/key-shift/pitch-map paths. The accepted retry snapshot still has origin/start0 and end8; it does **not** prove replacement into a dropped/nonzero-origin window. Verify those addresses and rendered output before claiming that gap closed. Continue multi-deck acoustic/resource cases, differing model/content transitions, source-quality failures, reverse/loops/warped/Stem Slip/scratch, native/controller/headphone and reference acceptance. The eighteen-channel layout has not been accepted for four-deck CPU/memory or every input channel geometry.

The original goal remains110 feature groups/522requirements/9beta deltas/26release checks,55extendedFX and actual Stems/keylock; all full-parity flags remain false. Factory controller coverage is unchanged:19,252 assignments across145/197 retained definitions, Hercules356 assignments/18 unresolved. Factory jog units, HID, feedback and initialization remain open; alternatives retain their distinct source labels. No new native bundle, hardware output or timed capture request occurred. Frozen0.1.23 and its tested272-map profile remain preserved.

Build plan, feature/model plan, private Trello and Claude handoff are maintained. Prior model recommendations remain STM-001 Codex `gpt-6.1-sol`/high and Claude `claude-sonnet-5`/high; STM-003 Codex `gpt-6.1-sol`/xhigh and Claude `claude-opus-5`/high. These are planning metadata, not a fresh availability check or agent launch. Full Claude audit remains unlaunched; the complete original prompt remains the byte-exact handoff suffix.
