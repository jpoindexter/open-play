# Original-stereo reference backend: bounded interaction removed — checkpoint155

18 October2026. **The candidate removes the reproduced inactive-bank influence in the matched-build +3/−2cases, and the actual four-deck browser continuity/carrier/restore/Stop checks pass. The strict post-mix bit-zero mute criterion remains false for extremely small residues. Old151's exact +3startup is still unknown; full parity is not claimed.**

## Cause-targeted implementation

The previous154turn was progress: exact replacement-clock observations, a causal−2differential and a source-aware +3replay changed the next action to a bounded DSP-reference policy. This turn implements that policy in pinned MIT source, using the already installed official Emscripten4.0.18 toolchain. No native app/package or controller changes.

`reference-policy.patch` changes the maximum-energy phase-reference search and aggregate mapped-frequency energy to the original stereo pair for reserved eighteen-channel groups. Each channel retains its own input/prediction energy and synthesis. Other channel geometries retain upstream reference policy. The replacement worklet selects the new backend only for18configured outputs; the original published embedded factory remains for other geometries. No source-clock, gain, SRC, bank-fade, cache-publication or owner logic was rewritten.

Recipe:`scripts/build_reference_keylock_155.py`. Pinned Stretch commit/header1.3.2:a670068d9aeb64913331d5cc29337b19a457a7df; Linear commit146b26f91b48835d665fa0498d64d9617818d27a. Stock/candidate use the same copied source, compiler and flags; the policy definition is0/1. Current recipe reproduced the vendored module byte for byte. Source/toolchain inputs are recorded in154receipts;155build receipt records full commands/hashes. Both MIT licenses are retained with the backend. No Serato implementation is incorporated.

## Actual matched-build differential

`experiments/reference_policy_155.mjs` replays the154original's startup, commands, source ranges and applied replacement render counts. The same declared future first-bank availability is retained; it is not an actual asynchronous append/transfer replay. All complete original/old/new streams remain private. Independent inspections are `reference-policy-155-{stock,candidate}-results.json` and `reference-policy-155-comparison-results.json`.

The rebuilt stock reproduces the−2interaction at exactly global frame407437. Its original/old-Melody maximum differences are0.0111466241/0.0111456400 and minimum ratios approximately0.917497656/0.917497179, versus control approximately0.9896830. The stock waveform differs numerically from the published package's0.9351931result and has no bit-identity claim against that browser recording; compiler/dependency build drift is retained explicitly.

The candidate's original and active old Melody are bit-identical between first-bank-only control and both-banks treatment in both recorded cases:545664frames each for +3and540544for−2. Candidate new-bank RMS is nonzero (~0.0424263/0.0424100), ruling out a silent/no-op treatment. Every stock/candidate control output is bit-identical, including the silent new-bank control. Thus the policy removes the observed dependency without changing these control outputs. This is bounded actual-WASM proof, not all music/rates/reference parity.

Two/ten-channel production-before/current actual-WASM outputs also match bit for bit across all channels,44160frames/channel at rate1.1/semitones2 with distinct authored carriers. This checks the preserved published-factory branch; it does not establish every legacy setting or native/hardware acceptance. See `reference-policy-155-legacy-results.json`.

## First browser failure and loader correction

The first actual browser workflow fails before deck1 starts. The durable3363byte original, SHA256`1488a3dacf7ac515169c8b2dd4e935799cc238c3894dc55d00f78e51857a21d8`, is retained at `local-evidence/stem-resource-150/browser-exports/1f29ea05c22c4d93af66d8e994c71738.json`, with exact executed source capsule and screenshot. The UI reports `os is not defined`; the harness later reports `Play 0 timed out`. These are separate observed facts, not an accepted playback run.

The generated Emscripten4loader classifies a global with neither window nor WorkerGlobalScope as a shell, then its random-device initialization tries d8's `os.system`. AudioWorklet has neither of those globals. The copied upstream `pre.js` now selects worker/not-shell when AudioWorkletProcessor exists outside Node. Both stock/candidate builds receive that same environment correction. It does not alter the DSP policy or decoded WASM: whole payload comparisons are exact for both builds. Candidate decoded WASM79354bytes/SHA256`1036c1f5deb845696bc6f8b4ef912c24a1444adede15dee96eb25ee8ce83c084`; final JS100664bytes/SHA256`0512cae2a33873956026e64cb47854c1c677baf1beb1bc0242edfb9557987f21`.

A first extraction assumption expected base64, but Emscripten4emits a binary string. No vendor file was changed by that failed check. The final independent loader comparator evaluates only the observed generated string literal and reproduces its byte decoder, checks WASM magic and compares every byte. Raw checks/logs/build inputs remain private. A diagnostic wrapper-generation alias was also corrected before its execution; the current full recipe was rebuilt and reproduced the actual vendored module exactly.

## Actual four-deck production browser path

After correcting the loader, a fresh owned browser tab executes actual Play/Stems pads, production `attachStems`, bank0→1→0repeat, all-pad mute/restore and Stop on four decks. Rates1/1.1/0.8/1.25, shifts0/+3/−2/0; all original owners remain. Authored48second330/550Hz stereo, Melody=original/other Stems zero. Physical outputs are muted. This is direct prepared-buffer routing, not SCNet inference, real music, headphones/controller or reference behavior.

The exact27598916byte original/SHA256`ffd0b0b1728fc0e193959564e88a1b74f18fca289d49879ce495b706cb51e734` is retained at `local-evidence/stem-resource-150/browser-exports/07137b86ec584542ba2796708a90d02c.json` and matches its small browser receipt. Source-before/after hashes and original decoded PCM remain unchanged.

The first capture retains seven full twelve-second left streams,529200samples each. A separate declared six-second capture retains four complete monitor streams,264600samples each, through third preparation, mute/restore and Stop. Raw adapter taps are disconnected only after their first capture has completed; the monitor capture runs through Stop. No old capture is cropped or repaired. All eleven full recordings have finite/hash/contiguous-quantum checks and zero producer errors, including the post-Stop monitor clocks. This does not fix or supersede152's separately retained old post-Stop clock failure.

Second/third-preparation minimum10msRMS ratios respectively:

| Deck/rate/shift | Second | Third |
|---|---:|---:|
|1 /1 /0 |0.9791809610|0.9792856812|
|2 /1.1 /+3 |0.9904373461|0.9905415899|
|3 /0.8 /−2 |0.9903254183|0.9903011664|
|4 /1.25 /0 |0.9786770350|0.9795087828|

All exceed the unchanged0.85floor; maximum adjacent jump≤0.009624<0.03 and no near-zero run in those intervals. The four measured carriers are within the existing1%bound; restored RMS is approximately0.1213–0.1214. Stop+100–300ms and every remaining captured tail sample are exactzero. The second interval's baseline/time policy and third interval's capture-start boundary are declared in the inspector; no offsets/gain/phase are fitted. Left-only authored tones do not prove right-channel, cursor, musical quality or all other transports.

## Strict mute failure retained, without an unnecessary DSP change

The unchanged exact post-mix mute check fails: maximum residues during mute+50–250ms are approximately1.01e−27/3.49e−24/2.56e−24/8.23e−23. The original already declared near-zero bound is1e−7; every residue is far below it. The residue's precise source has not been established. No claim of bit-zero mute or human-audible verification is made.

`declaredPlaybackCriterionPassed` and `exactPostMixMuteCriterionPassed` remain **false**. The independently executed continuity/carrier/restore/Stop checks and below-existing-near-zero comparisons are reported separately as true. This is not a threshold relaxation or a repaired PCM result. Do not add a global tail-cutting gate or rerun broad matrices merely to remove this numerical residue; first establish whether a stricter zero requirement applies at this post-mix point. Jason explicitly asked for pragmatic testing.

An inspector-only NumPy boolean JSON serialization error initially left an empty output file. That partial file/log is retained privately; converting the boolean to a native value fixes serialization. The same complete original was inspected again without rerunning the app. The earlier strict result is retained privately before adding explanatory fields; its failure flag/measurements remain unchanged in the canonical result.

The executed source capsule is `local-evidence/reference-policy-155/browser-source-capsule`. One trailing diagnostic-harness space was removed after the run; audio code is unchanged. To reproduce source checks after this formatting edit or future source changes, pass `--source-root` with that exact capsule to `scripts/inspect_reference_browser_155.py`. The same original/capsule reproduces every canonical result exactly; no audio rerun was needed. Unified-diff patch context whitespace is intentionally exempted through a single-path Git attribute, preserving the exact MIT patch.

## Next work and preserved scope

The next changed boundary is actual preparation-service/Cancel/retry/owner/context behavior with this backend, then musical/source-reconstruction quality and remaining transport compositions. Do not call direct decoded-buffer attachment a completed preparation/model test. Keep old151's exact unrecorded-startup failure and all failed cohorts. The strict mute flag is an explicit numerical residual, not grounds to broaden audio architecture without a requirement. Do not infer full parity from these fixtures.

Canonical registry and read-only coverage merge existing evidence only for DEK-007/STM-001/STM-003; every other feature row, requirement and FX value is preserved. The broad generator exposed pre-existing evidence divergence; its unrelated replacements were not retained. Exact next packet: `handoffs/keylock-reference-155-followup.md`.

Plan, model plan, three private Trello records and Claude handoff retain every remaining scope:110groups/522requirements/9beta/26release,55extendedFX and actual Stems/keylock; all full-parity flags false and goal active. Factory19252assignments/145of197definitions, Hercules356/18unresolved and official versus Alternative provenance unchanged. Frozen desktop0.1.23/tested272mappings/launchers/user8768 preserved; no new native package/hardware output/capture/readiness question. Per-feature Codex/Claude recommendations remain dated planning metadata. No new Claude consultation/full audit launched. Preserve the exact original20996byte prompt suffix.
