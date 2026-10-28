# Open Play HTML review candidate

## Current core status — 28 October 2026

**Pending next native candidate:** CORE-FIX-44 rejects an older queued tempo input after a newer MASTER/Sync choice. Actual four-deck Compact before/after: stale second endpoint2→1, wrong127.8→restored124.0BPM, C MASTER retained,423controls/4Play/1materialized preview retained;3targeted regressions pass. Source/browser only; native92and owner session unchanged. [Report](../docs/prototype/SYNC_TEMPO_MASTER_QUEUE_2026-10-28.md).

**Current 0.1.92 is running/default**, source e775aae: readable energy envelopes for deck strips and playlist thumbnails, generated thumbnail cachev2; large scrolling detail pixels match baseline. Exact archive/host5/5 and protected native paused startup preserve13.229/12.426seconds and16tracks. Later owner track/position changes are left intact;16materialized previews observed. Prior91same-fader CORE-FIX-43companion included. [Delivery](../docs/prototype/DESKTOP_CORE_092_2026-10-28.md).

**Focused evidence and limits:** same-fader queue124→127.7after old failure; overview medians36→24/32→22pixels on two original tracks,3focused checks. Prior90native tone/Stop subset retains its scope; native failed-request/listening/pops/stalls remain open. Earlier13.073→13.229position observation remains unattributed; window-only negative probe retained exact13.229/12.426. Listening/controller deferred.

CORE-FIX-41: actual blank-BPM save with tempo markers wrote0and blocked reload. Two preflight lines now preserve track/store, keep the editor/inline warning and reload healthy; source/browser evidence and1focused regression executed. CORE-FIX-40's prior3360→0idle Sync writes and actual states retain scope; one affected pending-OFF fixture is repaired with current collaborators. No broad tests or DSP rewrite. These narrow repairs do not close intermittent Sync pops or long-session stalls. [Executed data save/reload](../docs/prototype/TRACK_DETAILS_GRID_VALIDITY_2026-10-28.md).

Prior84four-real-track loop resize/exit/Sync follow-through retains its bounded source/runtime scope: other three voices/rates,241tracked controls/rows/previews and focus retained, whole6s first-master-channel PCM finite/nonzero, observed maximum tick8.6ms/frame interval34.2ms. No audible, stereo, native or long-session acceptance. [Evidence](../docs/prototype/FOUR_DECK_LOOP_TRANSITIONS_2026-10-28.md).

Trello194cards/17complete after44, ANA-FIX-09 and planned UI-COLOR-01and existing parent/current-summary readback. Broader core/Sync-pop/stall/listening/hardware/release cards remain OPEN; original criteria/history/model guidance retained. Prior53manual/jog/EQ/Cue/stop scope retained. Limited public beta accelerated target3–5working days, safer budget5–10, conditional on current listening/data/install and signing/distribution gates. No public release/full-core/parity claim.

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
