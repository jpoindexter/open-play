# Recovered four-deck resources, retained audio failure and disposal counters — checkpoint 151

18 October 2026. **The durable browser export succeeded. Sampled resource bounds pass, but the +3-semitone deck fails the unchanged continuity floor during repeat preparation. That audio gap remains open. A separate actual-browser disposal check accepts the corrected stale decoded-byte counter. Full parity remains false.**

## Recovery and exact original

The first CUA inventory in this turn lists only the two user tabs at port 8768; prior owned tab 138 is absent. `stem-resources-151-target-recovery.json` records that authoritative missing-target observation before a new run. The earlier unrecovered attempt is not reclassified as success or a measured audio failure. Native Mac lock remains reported, but the new browser tab operates normally; this does not prove the cause of the earlier control failure.

The unchanged checkpoint-150 diagnostic/export tooling is then executed against production `8d616d98b9c512e47f2eb62a399cb3cf37ac3c9e`. Tab 139 at port 8790 runs actual Play, four live keylocked owners, three direct production Stem attachments, actual Vocal pads and Stop. The small DOM receipt matches the **complete 24,932,811-byte original**, SHA256 `5839cfbdade0c89a1ef45e8e76812b1ed3f74432c05f4fdb7033961a0995de70`, saved privately as `local-evidence/stem-resource-150/browser-exports/c68b657906904579878d397430627520.json`. The receipt's byte count/hash were checked independently from the file. Export is now actual browser evidence, not only the earlier synthetic HTTP-handler checks.

All four owners survive three new decoded generations, selecting banks 0→1→0. Original stereo tone content is forty-eight seconds at 44.1 kHz; rates are 1/1.1/0.8/1.25, key shifts 0/+3/−2/0. Prepared Melody equals the original, other Stems are silent. Physical destinations are muted. There is no model inference or musical-quality evidence.

The independent analyzer first encountered a NumPy Boolean JSON serialization error after inspection. Its incomplete output is retained privately. Converting that result field to a Python Boolean and serializing before file creation fixes the analyzer; the same original is reanalyzed with unchanged audio thresholds and no browser rerun. Explicit audio/resource/counter subclaims are recorded separately.

## Observed resources

Forty-four sample groups contain actual read-only worklet queries and before/after adapter snapshots. Stable accounting comparisons agree with actual retained PCM extents; queries overlapping refill are not asserted as atomic. Maximum observed source-window span is **11.0000040169 seconds**, below the declared twelve-second diagnostic bound. All four owners advance their retained starts and ends, so this run actually executes refill and drop.

| Owner | Sampled maximum retained ArrayBuffer bytes | Observed WASM capacity bytes |
|---|---:|---:|
| Deck 1 |33,339,600|6,225,920|
| Deck 2, +3 |29,370,168|6,225,920|
| Deck 3, −2 |39,204,432|6,225,920|
| Deck 4 |33,339,600|6,225,920|

Before Stop, explicit decoded roots contain nine unique buffers/152,409,600 bytes: original plus the two most recent four-Stem generations shared by the decks. First-generation IDs are absent from those roots. After actual Stop/disposal, only original plus current cache remain (five buffers); clearing the owned fixture cache leaves the original alone. These are **reference-root observations, not proof of garbage collection or OS memory release**.

WASM capacity is stable across the sampled run. These sampled per-worklet maxima are not simultaneous global peaks, whole-process bounds or all-time allocation limits. The capture takes about 24,006.3 ms wall time; maximum observed excess over the harness's 25 ms main-thread timer is 20.5 ms. That timer measures scheduling delay, **not DSP CPU usage, device deadlines or DAC continuity**. Those acceptance gaps stay open.

## Actual rendered audio failure

Each of the four retained **left-channel** captures contains 1,058,400 finite/hash-checked frames at 44.1 kHz in 8,269 contiguous quanta. Actual Stop windows have exact-zero peak. Final steady carrier frequencies match their requested shifts within the declared 1% bound. Right-channel, master and hardware output are not captured here.

| Deck | Minimum 10 ms RMS / fixed early baseline | Maximum adjacent sample jump | Result |
|---|---:|---:|---|
| 1 |0.9793727066|0.0080724112|Scoped continuity pass|
| 2, +3 |**0.7320637461**|0.0099697676|**Fails 0.85 RMS floor**|
| 3, −2 |0.9887052595|0.0071680013|Scoped continuity pass|
| 4 |0.9765493295|0.0080462283|Scoped continuity pass|

The three below-floor windows start at audio times 9.142063492, 9.152063492 and 9.162063492 seconds. Second preparation starts at 8.826485261 and returns at 10.071655329, so the dip occurs **during inactive-bank preparation, before the final bank switch**. No complete zero gap occurs on that deck. Its final carrier is approximately 392.467592 Hz versus the expected 392.438348 Hz.

The mechanism is unresolved. Shared multichannel DSP analysis reacting to newly populated inactive channels is one hypothesis; resampled input/chunk history and append timing remain alternatives. This capture does not isolate them. Do not change gain, fit phase/time, defer the first pad, relax the floor, hide the window or claim four-deck audio acceptance. The original whole PCM and exact executed sources remain retained.

Metric windows remain capture+50 ms until actual Stop, against the fixed capture+50–150 ms baseline; all retained samples are checked. Frequency uses the fixed steady final 500 ms, Hann window and log-parabolic peak. Stop uses event+100–300 ms. The inspector's nonzero exit reflects the real retained failure, not the corrected serialization issue.

## Disposed-counter defect and focused correction

The same actual run clears each adapter's source references and groups, but its snapshot still reports 152,409,600 decoded bytes per disposed adapter. Source inspection identifies the direct cause: `dispose()` clears `sources` but leaves `sourceGeometry`, from which `snapshot.decodedBytes` is summed, unchanged.

The only production change in this checkpoint calls `describeSources()` immediately after clearing those sources, before emitting the disposed snapshot. It changes accounting metadata only; it does not repair the audio dip or change PCM, DSP, gains, bank switching or WASM.

A separate focused actual AudioContext/WASM check starts an eighteen-channel live owner with five decoded buffers and silent physical routing, verifies it is actually playing, then awaits disposal. On this corrected candidate, decoded bytes change **1,764,000→0**, retained source references **5→0**, source geometry becomes empty, and groups/retained PCM are zero. Its context closes. This is actual adapter disposal, not a repeat of the full app's four-deck run, GC or total-memory evidence.

The diagnostic was initially written over an existing historical disposal-harness filename. That intermediate result/source capsule is retained privately, both historical files were restored byte-for-byte, and the focused run was executed again under separate `keylock-disposal-151-harness.html/.js` names. Historical receipts/sources are preserved.

Artifacts: `stem-resources-151-results.json`, `stem-resources-151-browser-receipt.json`, `stem-resources-151-browser.png`, `keylock-disposal-151-results.json`, `keylock-disposal-151.png`, strict `scripts/inspect_stem_resources.py`. Four-deck source hashes match the saved `local-evidence/stem-resource-151/observed-sources/` capsule; the later counter correction has separate current-source hashes. No claim that the whole four-deck acoustic run was repeated after that metadata change.

## Next exact work and complete scope

Next: isolate the +3 repeat-preparation dip. Capture original and selected Stem outputs plus each actual replacement acknowledgment around the failing interval. Compare inactive-bank population against a no-replacement control with the same prepared source clock, then inspect the smallest actual-WASM reproduction. Preserve each whole failure before trying a fix. Reexecute only the affected acoustic path, then the four-deck workflow after a causal correction; do not rerun unrelated FX/controller matrices.

Continue CPU/device deadline, long-session/GC/process-memory, content/model/cache changes, musical reconstruction failures, reverse/loops/mapped transport/Stem Slip/scratch and native/physical/reference acceptance. The original outcome remains 110 feature groups, 522 requirements, nine beta deltas, 26 release checks, all 55 extended effects and actual Stems/keylock. All full-parity flags stay false. Factory mappings remain 19,252 assignments/145 of197 definitions, Hercules356/18 unresolved; Official Serato and Alternative mapping provenance remain separate from runtime/physical acceptance. Frozen desktop0.1.23/tested272 maps/launchers/user8768 remain unchanged; no hardware capture/output or native packaging.

Plan, model plan, private Trello and Claude handoff record the failed audio criterion and accepted resource/counter subsets. Existing STM-001 Codex `gpt-6.1-sol`/high, Claude `claude-sonnet-5`/high and STM-003 Codex `gpt-6.1-sol`/xhigh, Claude `claude-opus-5`/high recommendations are preserved, not revalidated or launched. Full Claude audit remains unlaunched; complete original prompt suffix stays byte-exact.
