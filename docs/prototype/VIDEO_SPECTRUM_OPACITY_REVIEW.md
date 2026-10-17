# Real spectrum, finite Freeze and channel-opacity checkpoint

2026-10-17. **Full Serato parity NOT PASSED. Native approval NOT GRANTED.**
The executed criterion is independent browser behavior through real audio, GPU,
controls and persistence. Vendor transfer functions and hardware are separate.

## Executed evidence

| Actual path | Result | Boundary |
|---|---|---|
| Isolator Bass / finite Frame Freeze cohort | [88/88 GPU](video-isolator-freeze-browser-results.json) | Original semantic contracts and actual PCM bass input; not vendor math |
| Eight-band analysis | [17/17 real AudioEngine](video-spectrum8-browser-results.json) | Eight actual PCM tones, routing, pause/silence and RMS; no pixels inferred from this suite |
| Expanded FX including Analyzer | [102/102 GPU + PCM](video-analyzer8-browser-results.json) | Eight separate FFT inputs and real rendered bars; independent bands/palette/gain |
| Channel opacity | [13/13 actual mixer/GPU/AudioEngine](video-opacity-browser-results.json) | Real decoded original PNGs, alpha and audio noninterference; no source-video AV or physical device proof |
| Current assembled pipeline | [33/33](video-analyzer8-pipeline-browser-results.json) | Real decoding, six slots, source ownership, actual captured video/master audio and getter bypass; short browser run only |
| Main opacity UI | [6 observations](video-opacity-main-ui-results.json) | Real keyboard sliders, audio faders, separate links, active fade and reload |
| Main Analyzer UI | [3 observations](video-analyzer8-main-ui-results.json) | Actual hue/gain/mode persistence and visible unavailable reason; real tones tested separately |
| Compatibility/recapture UI | [5 observations](video-fx-mode-main-ui-results.json) | Earlier-mode controls disabled, finite recapture identity increments and survives metadata reload |

The [current Node record](video-spectrum-opacity-node-regressions.json) reports21
scripts exiting0. These scripts declare pure/controlled scope and do not establish
browser behavior on their own. Prior raw evidence remains dated history.

## Independent contracts that now execute

**Isolator Bass:** the nonselected hue complement becomes display-RGB grayscale;
selected hue saturation follows actual measured bass. Hue/width/softness and the
linear bass mapping are original choices. Real low-frequency PCM and a high-band
negative control are measured through AudioEngine before pixel comparison.
Earlier saved presets retain the previous warm-color attenuation branch.

**Frame Freeze:** one captured upstream frame per slot, finite duration.05..16s
(default1s), then live until explicit recapture. Editing duration retains the
original capture time; an expired hold cannot resurrect. Duplicate frame IDs
still allow time to expire; source/slot/mode/OFF/zero/reset/backward-time rules
are explicit. Paused-source time policy is independent presentation time. Earlier
saved presets stay indefinite. Only declared scalar controls persist, never
capture pixels, timer timestamps, hold flags or GPU objects. The UI disables
finite duration in the earlier mode while retaining Capture a new frame.

**Analyzer:** eight independent FFT power sums, boundaries
20/63/125/250/500/1000/2000/4000/20000Hz, clipped at Nyquist. Existing2048 FFT,
three coarse bands, RMS and graph connections remain. These frequency ranges,
window response and bar mapping are independent. Real vectors travel unchanged
through engine→channel/master context→eight shader uniforms. Hue and gain change
the bars without synthesizing extra frequency bands from the coarse three.
Valid zeros represent silence. Missing, sparse, inherited, accessor, wrong-length,
nonfinite or out-of-range vectors bypass the corrected Analyzer with explicit
diagnostics. The main panel displays an unavailable/bypassed explanation. Earlier
saved presets retain their three-bar fixed-color behavior; hue/gain are disabled
in that mode. Actual eight-tone checks retain measured vectors, sample rate,
FFT size, leakage, bar heights and unchanged-audio comparisons.

**Channel opacity:** each channel has its own manual0..1 and literal audio-link
flag, separate from playback and crossfade linking. Unlink snapshots the current
effective gain; linked mode reads the real audio gain while retaining the saved
manual value. Video-only writes never change audio levels/crossfader. Fresh
fields inherit the prior combined link flag for compatibility, then persist
independently. The Video upfader context follows the effective Video level. The
transition applies those levels in premultiplied alpha after channel processing;
unmixed channel previews retain their existing pre-fader policy. Exact reference
gain curves, preview details and hardware authority remain unknown.

## Retained failures and review

The opacity harness initially failed5/13. A half-alpha PNG had been composited
over the opaque empty-deck placeholder, so its transition input was opaque; its
oracle incorrectly expected half alpha. The original injected tone was also too
small to reach the harness's activity threshold. The second run failed3/13:
keying the placeholder correctly filled its holes with the other input under
the pipeline's existing secondary-source policy, so it still was not a transparent
fixture. Both raw results remain:
[first](video-opacity-browser-initial-results.json),
[second](video-opacity-browser-second-results.json).

The final fixture uses Audio Fade at actual silent RMS to clear the base before
the decoded half-alpha PNG. It therefore supplies an actual partial-alpha channel
to the transition. The tone's injected gain increased; the activity threshold and
±2 pixel/.015 RMS tolerances did not widen. A five-sample measured stationarity
predicate precedes the unchanged-audio comparison. No production opacity shader
repair was inferred from these fixture errors. Final13/13 passes include exact
manual/link ownership, half-alpha multiplication and audio noninterference.

[Opacity independent review](VIDEO_OPACITY_INDEPENDENT_REVIEW.md) executed9/9
actual-controls/mixer checks with controlled collaborators and found no defended
production bug. Its pixel conclusions are explicitly parent-owned observations.

[Spectrum independent review](VIDEO_SPECTRUM_ANALYZER_INDEPENDENT_REVIEW.md)
found one real public pipeline boundary defect: object spread executed an enumerable
spectrum getter before the FX validator. The actual pipeline now copies only own
data descriptors before combining root/channel/master contexts. The initial
reproduction is retained in the review. Controlled8/8 checks confirm zero getter
calls and correct uniforms/availability; the actual33-case GPU pipeline adds exact
pixel bypass and per-target reasons. This does not imply every arbitrary nested
third-party object or JavaScript Proxy is a supported runtime context.

## Main UI observations

Unlinking left and using its keyboard range set50% while right stayed audio-linked.
Moving both real UI audio faders to0 retained left50% and made right0%. Right could
then unlink and become100% independently. Changing playback linking preserved an
active directional fade and both opacity owners. Reload restored these states.

Fresh Analyzer exposed Manual Meaning, hue and gain; actual edits hue0/gain2 and
enabled state survived reload. With the audio context unavailable, the main panel
showed the exact bypass reason. Earlier mode disabled hue/gain and returning to
corrected mode retained values. Frame Freeze accepted.25s and its actual Capture
button advanced identity0→1; mode/duration/identity survived metadata reload.
That identity persistence is not capture-pixel persistence or reference timing.

After evidence capture the prototype's original Filter-OFF selection, audio
levels.8/.8, linked Video opacities, playback link and prior Video mix were restored
through actual UI controls ([readback](video-spectrum-opacity-ui-cleanup.json)). Any unverified restoration is reported separately;
Serato's prior window/fullscreen mode remains unverified from the native-menu run.

## Remaining gaps and re-entry

These passes close the independently specified seven FX corrections and separate
Video fader authority, not full reference parity. Current native menus remain
55 observed names/29 transitions, with four other resource transitions labeled.
Other crosswalk meanings/parameters, per-file FX save/recall, output/window/quality/
arrangement/Syphon, MIDI/shortcuts, codecs/long sessions, library, actual hardware,
providers and model-quality gates remain active. The SCNet reconstruction-quality
failure is not changed by this Video checkpoint. Inventory110/521 remains incomplete.

Next: reconcile remaining manual semantics, implement per-file Video FX save/recall
with explicit metadata identity and file-reimport policy, then output/window and
remaining source-conditioned workflows. No native application until Jason approves
an identified HTML candidate. Preserve the complete original prompt and handoff.

Routing stays VID002 Codex gpt-6.1-sol/high, Claude Code claude-sonnet-5/medium;
VID001 transport/ownership gpt-6.1-sol/xhigh and claude-opus-5/high. Recommendations
are recorded per feature/requirement/card, require invocation-time availability
checks, and are distinct from actual model execution. The bounded Fable research
is separate from the unlaunched full Claude completeness audit.
