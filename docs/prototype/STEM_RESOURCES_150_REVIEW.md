# Worklet memory observations and unrecovered browser run — checkpoint 150

18 October 2026. **The new read-only resource RPC passes five controlled actual-WASM checks across four eighteen-channel processors. The actual four-deck browser run's report could not be recovered; it has no accepted audio/resource result. Full parity remains open.**

## Read-only accounting

`SignalsmithStretch-open-play-replace.mjs` adds one RPC, `resourceSnapshot`. It reports the actual worklet frame, sample rate, channel count, retained chunk boundaries/count, summed Float32 view bytes, unique retained ArrayBuffer bytes, WASM linear-memory **capacity**, and timeline segment count. It does not schedule audio, change buffers, alter configuration or modify the render function. The embedded WASM payload is byte-identical to the preceding committed source.

Capacity is not live allocator usage or process memory. Unique ArrayBuffer accounting avoids counting the same buffer twice when views alias. Neither metric includes browser overhead, decoded app buffers, SRC tables, unrelated workers, GC retention or all transient allocations. Queries are sampled observations, not all-time peaks or deadline measurements.

`scripts/test_keylock_resources.mjs` instantiates four actual eighteen-channel WASM processors over controlled serial ports/clock. The five executed checks establish initialization/accounting, aliased-view accounting, query nonmutation, three bank replacements, and actual drop/disposal ownership behavior. Results:

| Per processor | Observed bytes |
|---|---:|
| WASM linear-memory capacity after initialization |6,225,920|
| Retained PCM after three bank replacements |2,381,400|
| Retained PCM after dropping one acknowledged quarter-second chunk |1,587,600|

All four processors report the same values. Replacements keep capacity/view bytes stable. Repeated queries preserve PCM references, timeline, DSP instance and configuration. A deliberately aliased initial channel produces the expected difference between view bytes and unique ArrayBuffer bytes. Disposal acknowledges no retained module/source buffers and subsequent queries reject with `InvalidStateError`.

These are actual component/RPC results, **not** browser transfer/GC, live adapter resource bounds, playback quality, real-time CPU/deadline or total-process memory acceptance. The process memory/CPU samples in the component receipt cover initialization, allocation and RPC work only; no audio is rendered in that script. They must not be converted into a playback CPU percentage. Public receipt: `keylock-resources-150-component-results.json`.

## Browser attempt and observation failure

The new owned harness starts actual Play on four keylocked decks with rates 1/1.1/0.8/1.25 and key shifts 0/+3/−2/0. It requests three independent decoded Stem generations, retains source-window/resource snapshots and a twenty-four-second left-channel capture per deck, then stops and clears its fixture cache. Physical outputs are muted. This is authored forty-eight-second stereo tone content, not new inference or musical-quality work.

Tab 138 at `http://127.0.0.1:8789/prototype/stem-resource-harness.html` reached initial Ready and its Run click was observed. The server later served the final source-identity fetches. Subsequent DOM observation timed out, another observation expired before dispatch, and a screenshot timed out/reset the CUA kernel. A fresh inventory still listed the tab and reported that the Mac was locked; rebinding the tab timed out during focus emulation. **The cause of the control failure is unresolved**: the large DOM export and locked environment are possible contributors, not established causes.

No original JSON or PCM was recovered. Final workflow completion, three successful generations, resource bounds, audio continuity, Stop and cleanup inside that page are **unverified**. Source fetches do not establish those outcomes. `stem-resources-150-unrecovered-browser.json` records the observation failures and intended file identities without promoting them to confirmed runtime readback. The intended source capsule remains ignored under `local-evidence/stem-resource-150/unrecovered-sources/`. This is an unrecovered observation, not a measured audio failure. Do not restart solely because observation timed out: inspect the existing target first; if it is gone, record that terminal state before a new attempt.

The Mac unlock request is pending asynchronously; hardware/controller participation is not requested. Browser resource acceptance remains open. The existing native desktop and user browser pages are not restarted or repackaged to work around this failure.

## Bounded private export for the next actual run

The diagnostic harness now serializes the full original to a dedicated same-origin loopback endpoint instead of putting megabytes of PCM into the DOM. Only a small summary and exact byte/hash receipt are shown. If saving fails, a Blob download retains the original as an explicit fallback; no successful save is claimed. **This revised browser/export path has not yet been executed in the browser.**

`scripts/serve_resource_observation.py` binds only to 127.0.0.1, inherits the existing Host/Origin/mutation checks, accepts only declared resource-150 JSON with a fixed hex ID and a 64 MiB bound, and writes raw evidence exclusively into ignored `local-evidence/stem-resource-150/browser-exports/`. It never overwrites differing bytes; identical retries are idempotent. Four actual ephemeral-loopback handler checks pass: exact bytes/hash/idempotency, conflicting-byte refusal, foreign-origin/mutation-token refusal, and size/report-shape refusal. Synthetic endpoint fixtures are not browser/audio evidence. Receipt: `resource-evidence-150-server-results.json`.

The export server is diagnostic tooling, not an exposed app service or a change to the normal prototype server. The source harness passes the module syntax check. No broad DSP/FX/controller matrix is repeated. Only the read-only MIT wrapper RPC changes production; app engine/panels/preparation/DSP render/WASM bytes remain unchanged from checkpoint 149.

## Exact re-entry

1. Inspect the current browser inventory and tab 138 before creating another resource run. Recover its original if possible. If the target is missing or terminal, record that fact; retain the unrecovered attempt receipt either way.
2. Start `python3 scripts/serve_resource_observation.py --port 8790`, then open the revised `http://127.0.0.1:8790/prototype/stem-resource-harness.html`. Read the small final DOM receipt and independently inspect the exact private file matching its ID, byte count and SHA. Preserve failed data and executed sources before changing code.
3. Inspect complete captured PCM, three actual generations, per-worklet byte/extent consistency, bounded refill/drop and decoded-buffer ownership. Separate sampled maxima from all-time/process bounds. Check disposed adapter accounting against actual retained references before claiming release; no disposal-accounting bug is established by this unrecovered run.
4. Continue missing CPU/deadline, long-session/GC, musical/content/model/cache/transport/native/physical/reference acceptance. Left-only captures cannot establish right-channel/master/speaker acceptance.

The full outcome remains 110 feature groups/522 requirements/nine beta deltas/26 release checks, all 55 extended FX and actual Stems/keylock. Full-parity flags stay false. Factory mapping coverage remains 19,252 assignments across 145/197 definitions; Hercules 356 assignments/18 unresolved, with Official Serato and Alternative mapping provenance distinct. Frozen desktop 0.1.23/tested 272 maps/launchers/main port 8768 remain preserved. No hardware capture/output or native packaging occurs.

The plan, private Trello, model plan and Claude handoff are updated with this partial evidence and the unrecovered browser result. STM-001 Codex `gpt-6.1-sol`/high, Claude `claude-sonnet-5`/high; STM-003 Codex `gpt-6.1-sol`/xhigh, Claude `claude-opus-5`/high remain prior recommendations, not a new availability check. Full Claude audit remains unlaunched and the exact original prompt suffix remains intact.
