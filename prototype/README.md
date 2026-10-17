# Open Play HTML review candidate

Run `python3 scripts/serve_prototype.py` from the repository root, then open
http://127.0.0.1:8768/prototype/. On macOS, double-click `Start Open Play.command`.
Requires Python 3.9+ for the launcher and a modern browser with Web Audio; recording
also requires MediaRecorder. Core browser playback needs no package install or hosted service. Optional local stem preparation requires the documented Python environment and licensed model checkpoint; no audio is uploaded.

This is an independently written HTML/CSS/JavaScript review prototype. **It does
not establish 1:1 Serato parity.** All 110 inventoried feature groups have a
review destination, explicit simulation, or a documented gap. The evidence browser
contains 507 source-linked requirements and per-feature Codex/Claude recommendations.
Some routes explicitly describe missing workflows; they are not implementation passes.

## Try it

1. Play either original demo track. Set a cue, toggle a loop, change tempo, or mix
   two decks. The browser uses its default audio output; headphone routing is simulated.
2. Import your own local audio, search the library, double-click to load the focused
   deck, or use its Load button. Right-click a track for metadata. Imported bytes stay
   in memory and must be re-imported after reload. Browser decoder support varies.
3. Open REC, start recording, play decks, stop, then download the actual browser
   master capture. The browser chooses WebM/Opus or a supported fallback, not native WAV/AIFF.
4. Open the performance panels, all eight Setup tabs, Devices, MIDI and provider
   fixtures. Simulations are labeled and do not connect accounts or control hardware.
5. Open Coverage & evidence and search a feature ID. Each entry retains native
   acceptance, recommended development models, source links and its current boundary.

Demo sounds are original generated fixtures, not copied music. BPM/key are known
annotations. Actual PCM analysis and local SCNet stem preparation are now available; estimates and quality limits are reported separately. No Serato binary,
source code, artwork, library or extracted audio ships in this prototype.

## Preserve / reset

Library tools exports a JSON metadata backup. It does not contain audio bytes.
Settings, demo annotations and crates persist under the browser-local key
`openplay-review-v1`; saved per-track Flip slots, Prepare/history and mappings also persist. Sampler voices and imported media bytes are temporary. Reset demo clears
only that prototype key after the visible confirmation. Closing/reloading the page
stops browser audio. Control-C in the launcher terminal stops the server.

## Evidence and next gate

- [Executed review and known gaps](../docs/prototype/REVIEW_REPORT.md)
- [Full build plan](../FULL_BUILD_PLAN.md)
- [Coverage manifest](../docs/prototype/coverage-manifest.json)
- [Independent Claude audit](../handoffs/codex-to-claude-completeness-audit.md)

Native development remains blocked until Jason approves an identified prototype
revision. No public publication is authorized.

## Functional closure pass

Reverse/Slip/cue-hold, sampler gating/pitch/gain, timed Flip, slicer, nested and
multi-rule crates, 55 independent DJ audio FX plus four Channel processors, real buffered keylock/pitch, local stem separation, and local video composition/capture
now execute actual behavior. Web MIDI has a real connection path, but access timed
out in the tested browser; hardware compatibility remains unverified.

Run [the 20-check audio/module harness](behavior-tests.html). Its audio does not
reach the speakers. Read [the functional review](../docs/prototype/FUNCTIONAL_REVIEW.md)
for earlier UI evidence. Read [the DSP continuation](../docs/prototype/DSP_FUNCTIONAL_REVIEW.md)
for new checks and active findings. All 59 named processors produce real audio, but
exact reference parameters and sound remain open; no route or simulation counts as parity.

Current follow-up: all 220 observed extended controls and 16 original-effect controls
have separate audio contrasts. Run `fx-adversarial-test.html` for the nine longer
Worklet regressions and `native-fx-controls-test.html` for the original 16 controls.
Stems preparation starts from its first pad action, the Analyze Stems load preference
or a drop into Prepared stems. Cancellation preserves the original audio. All paths
require the documented local service/model setup; a visible control is not proof of
reference-equivalent behavior. The latest measured paths and failures remain in the
DSP continuation report.

Stem Slip now uses actual independent selected/backing PCM transport. Open Stems,
select Vocal or Instrumental, choose a release length, then use the scratch range
or hold a cue. The mode remains armed after release. Run
`stem-slip-integration-test.html` for 30 actual audio/controller checks. Read
`../docs/prototype/STEM_SLIP_FUNCTIONAL_REVIEW.md` for independent policies, retained
failures, resource bounds and unverified T10/reference/combined workflows.

## Video, karaoke and Media Crate

Open Video for local-video inputs, two real FX slots per input and two master
slots, transitions, channel/master text and image layers, and recording of the
processed output plus browser master audio. Media Crate selects session files
when audio has no explicit video association; Random/Next and automatic transition
selection are separate controls. MP3+CDG import pairs actual audio with graphics
on the selected deck without autoplay. File bytes require reimport after reload.

Run `video-effects-test.html`, `video-transitions-harness.html`,
`video-overlays-harness.html`, `video-pipeline-harness.html`, `cdg-harness.html`,
`karaoke-integration-harness.html` and `video-media-harness.html` for the scoped
public browser checks. Current results are81/81,65/65,32/32,32/32,21/21,19/19 and
32/32 respectively. The pipeline actually records and decodes output video/audio;
requested30fps and720p/1080p canvas size are not sustained/HD capture acceptance.
See [the current review](../docs/prototype/VIDEO_FUNCTIONAL_REVIEW.md) for reference
unknowns, retained failures, technical limits and exact main UI evidence. Original
algorithms do not establish visual equivalence. Current native menu observation separately confirms55 FX names/29 transitions; four other resource-only transition names remain labeled.

Opt-in “Link audio Echo / Distortion” now reads actual DJ-FX identity/assignment/
timing and applies original visual counterparts; other names/routes remain gaps.
Media treatment provides actual Preserve/Stretch/Center-Cut/Letterbox geometry.
Run `video-audio-fx-harness.html`(24/24) and `video-treatment-harness.html`(21/21).
Read [the continuation review](../docs/prototype/VIDEO_LINK_TREATMENT_REVIEW.md)
for scope, retained failures, settings inventory and the keyboard acceptance gap.

Finite left/right fades have an independent speed slider and separate audio
crossfader link. Use Stop fade to hold the current position; saved endpoint/speed/
link state survives reload. Continuous mix is a separate Open Play extension.
Run `video-crossfade-harness.html` (11/11) for actual pixels/audio/hidden-panel
checks. Read [current color/traversal/fade review](../docs/prototype/VIDEO_COLOR_CROSSFADE_REVIEW.md).
Remaining per-channel opacity links and manual semantics stay explicit gaps;
full parity and native approval remain false.
