# Separate Open Play controller/reader variant

This folder preserves `SignalsmithStretch.mjs` unchanged. `SignalsmithStretch-open-play.mjs` is an independently maintained, explicitly named local variant of `signalsmith-stretch@1.3.2`, not an upstream release or an upstream-endorsed fix. Both expose the same documented factory API. The separate processor name allows both to be tested in one context without registration collisions.

## Byte provenance

| Artifact | SHA256 |
|---|---|
| Unchanged original `SignalsmithStretch.mjs` | `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46` |
| Separate local `SignalsmithStretch-open-play.mjs` | `4c02e593d01dcdf014841382880b11dd7fcbaa485821e8b36b02e0fcabd2a00a` |
| Original `LICENSE.txt` and byte-identical `SignalsmithStretch-open-play.LICENSE.txt` | `ee2ef82481ffb445ecdd4b3a4c1f82c0cddb2da8fe39d8e8dc384fffb3e7f06f` |

The embedded WASM/Module line (original line10) remains byte-identical, asserted by the Node regression. No DSP algorithm, compiled WASM, preset, analysis window or curve is modified. Existing [PROVENANCE.md](PROVENANCE.md) records the npm archive and separately recovered MIT license. That license came from the official repository commit recorded there, rather than an attested npm release tag. Parent independently checked the official npm registry on this investigation turn and reported latest still1.3.2 and no GitHub Releases; this child did not perform another remote lookup.

## Two changes, plus isolated registration

1. **Future schedule ordering.** Use the documented `objIn.output` as the new segment change time, retaining `outputTime` as a legacy alias. Prune superseded changes at that change time. Separately retain `currentTime` when discarding already elapsed history and reporting present input-time telemetry. This prevents a later queued future change from removing an earlier future pitch interval. Reusing the requested future time for current-history pruning would also be wrong; it would advance current state prematurely.
2. **Chunk reader bookkeeping and bounds.** Advance the absolute requested input cursor by copied samples; advance each chunk origin to its complete `bufferEnd`; stop once the requested analysis window/destination is filled. Bound leading zero padding and copied destination ranges. Retain the original trailing zero padding. This repairs the actual observed out-of-bounds write with multiple buffers while preserving chunk absolute timestamps after dropping old buffers.
3. **Namespacing only:** register the separate copy as `signalsmith-stretch-open-play`, preserving original `signalsmith-stretch` registration. This is required for explicit side-by-side testing, not another signal-processing change.

## Evidence and limits

Run `node scripts/test_keylock_live_patch.mjs` from the repository root. [Frozen raw Node result](../../../docs/prototype/keylock-live-patch-node-results.json) records14/14 checks at48000Hz/128-frame serial blocks. This executes the actual original/patched processors and unchanged WASM, with original multi-chunk RangeError retained as expected failure evidence; it does not emulate sound with a synthetic expected signal.

Actual input windows passed to WASM `_seek` are hashed before the unchanged function executes, including every invocation after Emscripten replaces its lazy export wrapper. Chunked and single-buffer windows are byte-identical at0.25,0.8,1,1.25,4 rates, during append, forward/backward seek, loop and retained timestamp checks. Exact output comparison remains required at0.8,1,1.25,4 and append/dynamic/drop fixtures (maximum observed difference0; assertion threshold1e-7).

At0.25, independent **unchanged-original versus unchanged-original** instances already produce phase-sensitive nonidentical PCM despite identical WASM input windows. The frozen control measured maximum difference0.303878 and RMS difference0.124220. Consequently0.25 records output differences, requires meaningful finite real output from both processors and byte-identical WASM inputs, and makes no sample-exact-output or listening-quality acceptance claim. This is an invalid-oracle diagnosis, not a relaxed browser pitch/rate threshold. The dropped-timestamp fixture starts at output0 to isolate the reader from the independently tested original future-start scheduling bug; its exact PCM difference is0.

The browser probe explicitly selects original or patched and preserves the same11 captured-audio criteria and tolerances. Actual patched browser execution is pending parent verification; the preserved original browser9/11 result remains unchanged. No production engine integration follows merely from Node checks. See [live path review](../../../docs/research/KEYLOCK_LIVE_PATH_REVIEW.md).

No security audit, advisory refresh for this local variant, upstream fix/endorsement, arbitrary rate quality, compressed-source streaming, deterministic disposal or long-duration memory/CPU acceptance is established. This patch intentionally does not add shutdown; that separate production lifecycle gap is recorded in the review.


## Parent actual browser follow-up — 2026-10-17

Parent actual-WASM re-execution passes14/14 (keylock-live-patch-parent-node-results.json).
The selected separate variant produces all11 requested functional audio outcomes,
but complete browser acceptance FAILS: the full capture has a startup128→384 frame
gap even after acknowledged arming/final fence. completed=false and fatalErrors is
nonempty in docs/prototype/keylock-live-patched-browser-results.json. Two preceding
capture failures remain retained. No frames were fabricated and no tolerance changed.
Fable is providing a separately scoped diagnosis under Jason's conditional permission.
Do not represent this variant as production-integrated or fully browser accepted.
