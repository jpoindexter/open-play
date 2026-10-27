# Instant Double completion controls — 27 October 2026

[CORE-FIX-32](https://trello.com/c/SQZGGHZV) remains open for desktop/native/held/listening acceptance. Current native 0.1.78 / source `ae84a50` is unchanged; this repair is ahead of that candidate.

## Reproduction and repair

Actual isolated four-deck Compact on baseline `75e2e39`: the legitimate incoming Double load first creates the track's controls, then asynchronous incoming FX preparation is held. Controls are recorded after that load. Releasing preparation completes Double and its unqualified final `render()` replaces 241 of 355 observed controls. The outgoing source voice/rate and three visible library preview images remain. Generated source audio loops and physical output stays muted throughout.

The helper now passes the current deck to its completion callback. The existing app wiring refreshes key metadata, deck switches and loop/transport feedback through existing shared modules. Track-load replacement and structural fallback remain. No new runtime module, dependency, layout, audio clock or DSP implementation was added. The repaired same-path completion retains 355/355 controls and 3/3 preview images; outgoing voice/rate remain unchanged and incoming playback completes. Existing app.js size debt is not claimed resolved by this two-line routing change.

Focus is ungraded: the first probe selected a disabled empty-deck tempo control; the corrected probe confirms focus before release, but the separate parent-panel button itself changes focus. Neither reading establishes product focus retention or loss. The node-replacement measurements remain valid. No native held pointer or listening claim follows from the muted browser result.

## Focused verification and cleanup

One existing queued-Stop regression plus one regression composing the actual app completion wiring and actual Double helper pass 2/2 in `instant-double-stop.test.mjs`. The latter confirms copied key/switch/loop presentation routes without the global rebuild, while the prior test retains cancellation and normal playing/paused-source completion. No broad suite or clean-song soak was run.

The copied owned diagnostic stopped all generated decks, closed its frame, cleared only its isolated origin, closed its tab/server, and removed its two byte-matched temporary prototype files. Raw JSON and fixture sources remain ignored under `local-evidence/instant-double-controls-2026-10-27/`. No normal profile, original music, recordings, desktop bundle or Downloads files were changed.

[Compact receipt](instant-double-controls-2026-10-27.json). Next: include this source repair in the next normal immutable desktop candidate, then exercise relevant native held/playing Double use within the existing owner session. Keep intermittent Sync pops/stalls open; no causal audio claim or full Double/parity completion.
