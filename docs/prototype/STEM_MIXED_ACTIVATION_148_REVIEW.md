# Mixed live/ordinary Stem activation and first-pad readiness — checkpoint 148

18 October 2026. **An actual mixed-deck browser capture reproduced a first-pad readiness defect. The corrected capture passes the same declared criteria on all four per-deck stereo channels. Full Stems/keylock, musical quality, native/hardware and Serato parity remain open.**

## Failure and root cause

Both decks play the same authored sixteen-second stereo 330/550 Hz original at rate 1.1. Deck 1 uses the eighteen-channel live keylock processor; deck 2 uses ordinary BufferSources with keylock off. Prepared fixtures deliberately contain the entire original in Vocal and silence in the other three Stems. This makes the first actual Vocal mute's acoustic result falsifiable. It is not model output or a separation-quality experiment. Physical outputs remain muted.

The owned harness uses actual app Play and Stem pad handlers and production `engine.attachStems`. It first aborts attachment during the live bank's warm-up. Both original voices and absent cache remain intact. It then retries successfully and immediately presses each actual Vocal pad after attachment resolves. It restores the pads and stops both decks. The abort timing hook and direct attachment are explicit harness instrumentation; this does not repeat the local service/Prepare UI workflow from checkpoint 146.

On production checkpoint `bd054d36933012e657095f1674a13239bf0738cf`, cancellation and pre-pad playback continuity pass, but the ordinary deck's first mute fails: RMS 0.2411436683/0.2416168910 against the fixed 0.0001 ceiling in the pad+30–80 ms window. The live deck's corresponding RMS is approximately 0.0000017/0.0000016. The ordinary deck's pad is pressed at audio time 0.876553288 while its old source remains audible until the scheduled handoff at 0.970748299, approximately 94 ms later. The later mute, restore and Stop work. This is a reproduced timing defect, not a conjecture based only on source inspection.

The shared readiness/arming barrier schedules a future cutover. `attachStems` previously resolved as soon as it published the prepared cache and scheduled that cutover. Pads controlled the new voice while the ordinary old original still played directly into the deck bus. This made activation completion earlier than audible ownership.

## Focused production change

Only `prototype/engine.js` changes in production. After the successful final commit, attachment now waits for each still-current, still-playing cold replacement's existing `handoffBefore.until` plus the ten-millisecond fade. It does not modify, reset, phase-fit or delay the pad handler. Stop or replacement ownership changes end that owner's wait without restarting it. A closed/nonadvancing audio context produces an explicit error after the existing bounded five-second style of wait; it does not pretend the committed audio/cache were rolled back.

Preparation cancellation remains effective before final commit, as rendered here. **The commit is final: a Cancel arriving after commit cannot restore the retired old voice.** The new wait occurs after the commit/rollback scope and signal detachment, so it does not falsely report “original audio preserved” for that phase. The preparation adapter's awaited engine call delays its Ready message; that connection is inspected code-path evidence. This run does not separately execute a real service Prepare UI completion on the mixed fixture. The final committed-handover Cancel affordance/status still needs a focused UI review; do not claim all cancellation phases accepted.

## Actual corrected browser result

The same unchanged harness and independent inspector run against the corrected engine. Each channel retains all 176,400 frames at 44.1 kHz in 1,379 contiguous quanta. Every retained sample is hash/finite checked. The original decoded audio and before/after source identities are unchanged within each run.

| Rendered channel | Minimum 10 ms RMS ratio before pad | Maximum adjacent jump | First mute RMS, pad+30–80 ms |
|---|---:|---:|---:|
| Live deck left |0.9758488716|0.016210000|0.00000158163|
| Live deck right |0.9996744405|0.026962594|0.00000159253|
| Ordinary deck left |0.9858364677|0.017754258|0.00000181141|
| Ordinary deck right |0.9959220107|0.029580656|0.00000151715|

All pre-pad near-zero runs are zero. Limits remain minimum ratio 0.85, maximum jump 0.03 and maximum near-zero duration 1 ms. These continuity metrics cover capture+50 ms until each actual pad press, against the fixed capture+50–150 ms RMS baseline. They include cancellation, retry preparation and the committed handover; intentional pad mutes and Stop are evaluated separately rather than counted as continuity failures.

The first mute ceiling remains 0.0001. Later mute at pad+160–250 ms and Stop at Stop+100–250 ms have exact-zero peak on all four channels; restored RMS exceeds 0.24. Retry returns at audio time 0.969433107, after the scheduled 0.959138322 handoff plus its fade. Both actual pads are pressed at 0.969433107. No fitted alignment, compensating gain, threshold relaxation or repaired PCM is used. Each run has its own fixed early baseline; the reported absolute gains differ slightly between runs and are not normalized to force a pass.

This is actual per-deck audio after the production EQ/monitor bus, not a master recording or speaker/headphone test. It accepts the authored fixture's mixed activation/first-pad path only. It does not prove exact acoustic cursor position, all rates, musical transients, source separation, four-deck CPU/memory or vendor equivalence.

## Focused checks and retained evidence

- `stem-mixed-148-initial-results.json`: complete failed scoped result and its executed source hashes. Full original JSON/PCM and an exact source capsule remain private under `local-evidence/stem-mixed-148/initial-*`.
- `stem-mixed-148-results.json`: corrected whole-capture inspection, actual handoff geometry, cancellation/owner/cache assertions and explicit nonacceptance flags.
- `stem-mixed-148.png`: actual stopped browser UI after the corrected run.
- `scripts/inspect_stem_mixed_activation.py`: fixed event-relative windows, whole PCM/quantum/hash checks, declared criteria and nonzero exit on failure. No historical inspector or failure receipt is overwritten.
- Two new controlled real-engine checks execute the readiness boundary and Stop during committed settlement. Four existing ordinary coordination checks and five staged-bank checks pass against the changed engine. These are ownership/clock tests, not substitutes for the actual rendered capture.

The new wait did not require changing the processor, Stem bank staging, MIDI, mappings, panels, inference service or native bundle. No unrelated FX matrix or unaffected source-rate cohort was repeated. The 147 source-hash receipts describe that earlier candidate; they are not relabeled as executions of this new engine.

## Next and full scope

Next: review the final committed-handover Cancel/status affordance with the actual Prepare UI, then bounded resource observations for the eighteen-channel layout. Continue mixed content/model/cache transitions, musical reconstruction failures, reverse/loops/mapped transport/Stem Slip/scratch, and native/physical/reference acceptance. No new inference or controller participation is needed for the current authored audio check.

The goal remains 110 feature groups, 522 requirements, nine beta deltas, 26 release checks, all 55 extended effects and actual Stems/keylock. Full parity remains false. Factory coverage remains 19,252 assignments across 145/197 definitions; Hercules 356 assignments/18 unresolved. Official Serato and Alternative mapping author/project provenance remain distinct from executed runtime/physical compatibility. Frozen desktop 0.1.23, its tested 272-map profile, launchers and the user's main port 8768 are preserved.

Build plan, feature/model plan, private Trello and Claude handoff are maintained. Existing per-feature recommendations remain STM-001 Codex `gpt-6.1-sol`/high and Claude `claude-sonnet-5`/high; STM-003 Codex `gpt-6.1-sol`/xhigh and Claude `claude-opus-5`/high; DEK-007 Codex `gpt-6-astra`/high and Claude `claude-opus-5`/high. These are retained planning metadata, not a fresh live account check or agent launch. Full Claude audit remains unlaunched; the complete original prompt stays the byte-exact handoff suffix.
