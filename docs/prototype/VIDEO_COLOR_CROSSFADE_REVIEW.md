# Video color, traversal and finite crossfade checkpoint

2026-10-17. **Full Serato parity NOT PASSED; native approval NOT GRANTED.**
The criterion here is actual independent GPU behavior and main browser controls,
with current native menu visibility kept separate from shader equivalence.

## Current reference observation

[Native menu record](../research/VIDEO_CURRENT_MENUS_20261017.json): installed
4.0.10(4010213)arm64 exposed55 effect names in five categories and29 transition
names. All match the persisted cache's effect names. Open Play retains four
additional resource-only transition names with explicit labels, plus its own
Crossfade baseline. Current names/categories are observed; algorithms, loaded
runtime, reference parameters and device-dependent availability remain unverified.
Video was restoredOFF and Setup closed. The prior fullscreen/window mode was not
verified restored; this is recorded rather than described as full restoration.

## Actual executed behavior

| Path | Evidence | Limits |
|---|---|---|
| Corrected color FX | [81/81 browser checks](video-color-corrections-browser-results.json) | Original numeric/geometry/alpha/legacy fixtures; no vendor pixels |
| Corrected transitions | [65/65 browser checks](video-grid-transition-browser-results.json) | Original traversal/ordering/alpha contracts; exact vendor curves/events unknown |
| Finite crossfade | [11/11 browser checks](video-crossfade-browser-results.json) | Actual mixer/GPU, decoded PNG overlays, AudioEngine tone; no source-video AV or physical device proof |
| Main UI | [7 executed observations](video-crossfade-main-ui-results.json) | Real buttons/sliders/link checkboxes/reload/navigation; wall times include automation |

Gamma now darkens shadows in Manual Meaning; Saturation fresh selections increase
chroma while saved0 remains0; Smudge follows radial edge rays; UV Paint brightens
selected colorful hues over black. Explicit Earlier Open Play branches preserve
previous saved Gamma/Smudge/UV rendering. Restore-only migration retains own
zero/OFF/legacy bounds and refuses getters/inherited state.

Grid Simple/Fade/Sequence now use3×3 cells. Sequence has an independently seeded
permutation renewing on observed endpoint departure, stable through interior
reversal. Box Both alternates exact H/V kernels. Tile Wave H/V stagger their
respective axis. Scratch Fade uses live additive upfaders with independently
chosen inclusive5%/95% bands. These choices implement historical broad meanings;
none recovers exact current-reference math.

Directional fades travel to a requested endpoint once, with independent linear
.25..10s durations, duration snapshot at start, reversal from current position,
stop, immediate Reduced Motion and terminal callback ownership. Separate
crossLinked state reads AudioEngine.cross without changing transport/upfader
linking. Continuous mix remains explicitly labeled as an Open Play extension.

Main UI measured fastest416ms and slowest10065ms including click/read overhead;
ordering, not vendor timing equivalence, is the claim. Stop held.75 through later
frames and reload. A10s action was followed by immediate Sampler replacement
(Video canvas absent after279ms); after11584ms away, reload restored exact+1,
proving terminal state persisted without reopening Video to complete it. The
separate link states and speed also survived reload.

## Failures retained and corrected

[Initial GPU fade result](video-crossfade-browser-results-initial.json) failed6/9
because its oracle assumed opaque output while linked source gains were.8, giving
alpha204. Corrected independent premultiplied expectation uses actual source
levels; the ±2 channel tolerance is unchanged. This was an oracle error, not a
production alpha repair. Final suite adds detached and hidden-connected checks.

[Independent finite-fade review](VIDEO_CROSSFADE_INDEPENDENT_REVIEW.md) reproduced
a production lifecycle defect: leaving Video stopped sampling/completion. The
app now schedules while fading; mixer advances controls before detached/render
guards and frame throttling. Hidden connected panels explicitly request control-
only ticks; recording still renders its dedicated capture surface. Controlled
actual mixer confirms zero hidden GPU allocation/frames, exactly one completion
and stable endpoint after reconnect. Actual browser checks cover both hidden
cases; actual main UI panel replacement/reload covers app scheduling.

[Initial assembled regression](video-color-pipeline-initial-results.json) was28/32:
four ordering expectations still calculated the previous reciprocal Gamma while
fresh Gamma now uses shadowPower. Its independent CPU reference and explicit
fresh fixture parameter were corrected to the new declared exponent; thresholds
were not relaxed. [Final assembled regression](video-color-pipeline-browser-results.json)
passed32/32, including real local video decoding, six-slot routing, transport,
recorded container pixels and captured master audio. This remains a short browser
run, with no sustained frame-rate, native or vendor-equivalence claim.

[Independent color/transition review](VIDEO_COLOR_TRANSITION_INDEPENDENT_REVIEW.md)
refuted five scoped failure hypotheses with pure/controlled execution. Its source
hashes predate factual menu metadata additions; it does not assert browser runs
it did not execute. All current test_video*.mjs scripts exited0; pure/controlled
checks are not substitutes for the browser paths above.

## Remaining work and exact re-entry

REQ512 still lacks independent per-channel opacity controls/links. Remaining
manual distinctions include Isolator Bass grayscale complement, finite Frame
Freeze and real eight-band Analyzer, plus downstream crosswalk entries. Other
Video setup/output/window/quality/Syphon, library, codecs, conditional hardware,
providers and model-quality acceptance remain open. Source menu visibility closes
only that observation gap. Inventory110/521 remains incomplete.

Next: implement Isolator Bass/finite Frame Freeze from the existing independent
contracts; implement per-channel opacity authority; then actual eight-band
analysis through real AudioEngine and pixels. Keep old evidence and native gate.
Codex VID002 recommendation gpt-6.1-sol/high; Claude Code claude-sonnet-5/medium.
VID001 transport/ownership recommendation gpt-6.1-sol/xhigh and
claude-opus-5/high. Verify actual invocation support; no model execution follows
from a recommendation. Bounded Fable research is separate from the unlaunched
full independent Claude audit.
