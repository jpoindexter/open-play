# Open Play HTML review candidate

## Current core delivery — 26 October2026

Private **0.1.61/source2c1c35e is staged, not launched**. Actual archive/controlled-host inspection passed5/5. It includes the metadata, Tap and reanalysis ownership/refresh repairs. Running0.1.59 and both unversioned launchers remain. [61guide](../docs/prototype/TRY_PLAYBACK_DESKTOP_0.1.61.md) · [delivery and source links](../docs/prototype/desktop-0.1.61-playback-delivery.json).

**Required cleanup:** the native59 library retains the temporary Title `BX 3 · metadata check`; restore it to `BX 3` without changing124.98471158160582BPM or other metadata. Native Save retained that exact BPM, but stale/window/AX errors prevented confirmed restoration. No forced quit, profile-file rewrite or lock bypass. [Native result and cleanup](../docs/prototype/PRECISE_BPM_NATIVE_059_2026-10-26.md).

**27 October blocker:** the native tool now explicitly reports a locked Mac. Raising the window and opening the correct BX3 form succeeded just before that report, but title restoration is unconfirmed. No further native input until manual unlock. [Recorded next step](../docs/prototype/native-input-blocker-2026-10-27.json).

Current HTML metadata and replacement-analysis pending-Sync workflows retained four voices/master and233observed controls/previews on real tracks; Tap has scoped callback/module evidence. [Metadata](../docs/prototype/TRACK_DETAILS_PENDING_SYNC_2026-10-26.md) · [Tap](../docs/prototype/TAP_CONTROL_REFRESH_2026-10-26.md) · [analysis](../docs/prototype/ANALYSIS_PENDING_SYNC_2026-10-26.md). These source results are separate from native61startup/held gestures, independent PCM and owner listening. Prior59paused2/3/4/5s recovery and53human manual/jog/EQ/Cue/stop evidence retain their version scope.

Next: restore the temporary title when native input is reliable, preserve unsaved recording/work, then cleanly switch to61 and check only changed native paths. Capture the next actual pop/stall; do not repeat clean soaks or speculate about DSP. Hardware remains deferred. Public beta is the target; native/listening/pop/stall and release gates remain open, with no merge/publication. [Beta scope](../docs/delivery/PUBLIC_BETA_PLAN.md).

Prior entry summaries are archived in [the dated prefix history](../docs/delivery/ENTRY_PREFIXES_BEFORE_061_2026-10-26.md); historical bodies and original prompt tails below are preserved.

For HTML review, reuse the existing server/session. If none is running, `python3 scripts/serve_prototype.py --port 8848` serves `/prototype/workspace-preview.html` from the repository root. Do not reload a live session for board administration.

This is an independently written HTML/CSS/JavaScript review prototype. **It does
not establish 1:1 Serato parity.** All 110 inventoried feature groups have a
review destination, explicit simulation, or a documented gap. The evidence browser
contains source-linked requirements (historical counts vary; use the current registry) and per-feature Codex/Claude recommendations.
Some routes explicitly describe missing workflows; they are not implementation passes.

## Try it

1. Play either original demo track. Set a cue, toggle a loop, change tempo, or mix
   two decks. The browser uses its selected/default output. The existing monitor bus supports explicit channel routing, but independent physical headphone/master isolation needs suitable hardware and its own acceptance test.
2. Import your own local audio, search the library, double-click to load the focused
   deck, or use its Load button. Right-click a track for metadata. Imported bytes are copied to this origin's local IndexedDB when saving succeeds. Files reports saved versus session-only failures; keep the original songs. Saved imports can survive reload, but session-only imports need reimport. Browser decoder support varies.
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
`openplay-review-v1`; saved per-track Flip slots, Prepare/history and mappings also persist. Sampler voices and video/media attachments are temporary. Saved local-audio originals are stored separately in IndexedDB when saving succeeds; library JSON backups contain metadata, not audio bytes. Reset demo clears
only that prototype key after the visible confirmation. Closing/reloading the page
stops browser audio. Control-C in the launcher terminal stops the server.

## Evidence and next gate

- [Executed review and known gaps](../docs/prototype/REVIEW_REPORT.md)
- [Full build plan](../FULL_BUILD_PLAN.md)
- [Coverage manifest](../docs/prototype/coverage-manifest.json)
- [Independent Claude audit](../handoffs/codex-to-claude-completeness-audit.md)

Historical local desktop approvals are retained in `../docs/approvals.md`. Current work includes the authorized private local desktop candidate; no public release or full native acceptance. Source checks and historical native evidence do not establish current musical/hardware or full vendor parity.

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
public browser checks. Current results are102/102,65/65,32/32,32/32,21/21,19/19 and
32/32 respectively (the current expanded pipeline suite is33/33). The pipeline actually records and decodes output video/audio;
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
Remaining output/workflow controls and other manual semantics stay explicit gaps;
full parity and native approval remain false.

Real eight-band Analyzer, finite Frame Freeze and bass hue isolation now execute
with saved Earlier Open Play compatibility. Independent per-channel Video
opacity/audio links are separate from playback and crossfade links. Run
`video-spectrum8-harness.html` (17/17) and `video-opacity-harness.html` (13/13).
Current FX102/102 and assembled pipeline33/33; see
[executed spectrum/opacity review](../docs/prototype/VIDEO_SPECTRUM_OPACITY_REVIEW.md).
Reference algorithms, physical compatibility and full parity remain unverified.


## Saved Video FX

Load a local video, configure its two channel FX, then choose Save left/right FX.
Recall restores only that channel. Reimporting matching bytes automatically
recalls saved FX after reload; renaming a clip does not change its content key.
Use Saved video FX to export/import metadata separately from the library backup.
Media bytes remain temporary. Read [the executed review](../docs/prototype/VIDEO_FILE_FX_REVIEW.md)
and run [the actual15-check File/Worker/GPU harness](video-fx-presets-harness.html).
Exact Serato metadata format/owner and reference visual behavior remain unverified.


- [FX Tap BPM and stem-responsive waveform evidence](../docs/prototype/FX_TEMPO_WAVEFORM_REVIEW.md): actual timing/audio/source-display behavior; full reference parity remains open.
