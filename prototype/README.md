# Open Play HTML review candidate

**Current HTML follow-through — 26 October2026:** Track Details BPM edits now use existing grid ownership hooks and preserve active controls. Actual four-playing-real-track pending Sync→Save details RED (old Sync commits;5nodes retained)→GREEN (old Sync canceled;4voices/master and233nodes retained), then fresh Sync reaches edited BPM at its scheduled handoff. Four focused checks pass; originals/session unchanged. [Evidence](TRACK_DETAILS_PENDING_SYNC_2026-10-26.md). New CORE-FIX-17 remains open for native/held-gesture acceptance. This repair is newer than unchanged private0.1.59; no build/listening/pop-free claim.

Active core view: [rekordbox layout preview](http://127.0.0.1:8848/prototype/workspace-preview.html). Keep an existing server/session running; do not restart or reload it for board administration. If a server is needed, run `python3 scripts/serve_prototype.py --port 8848` from the repository root and open `/prototype/workspace-preview.html`.

**Current private desktop0.1.59/sourceb10bc82:** actual native four-real-track Load/keyboard seek and clean Command-Q/process-exit/reopen preserve paused2/3/4/5s, four deck slots and16library tracks; controls/previews retained. Current and unversioned playback starters target59; syntax checked, not executed. [Guide](TRY_PLAYBACK_DESKTOP_0.1.59.md) / [executed recovery and limits](CORE_NATIVE_059_RECOVERY_2026-10-26.md). Metadata/grid rendering fixes are included but not separately native-operated by that recovery check. Prior0.1.53human mixing/EQ/Cue/stop evidence retains its version scope. Hardware deferred; rare pops/stalls and current listening/held-gesture gates remain open. No broad clean matrices or full-core/public beta claim.

Core playback needs a modern browser with Web Audio and no package install or hosted service. Recording uses MediaRecorder. Optional stems/model services are outside the current core workflow. See [the audit and implementation sequence](../docs/prototype/CORE_DJ_AUDIT_2026-10-20.md) and [current status](../docs/delivery/CORE_DJ_FIRST.md). The 21 October audit reconciliation is historical evidence. Desktop0.1.52/source df48b50: archive/host5/5 and actual normal native startup observed with16savedtracks/14viewport AX waveform previews,0playing decks,Horizontal/Compact and no shown save/recovery warning. Normal48 was quit only after fresh REC00:00/Start available/Download disabled inspection; closed245-file/120391863B profile backup hashes match. Current/versioned52 launchers syntax checked; exact bundle launch observed, launchers not executed. Terminal analysis removes one redundant global overview redraw while retaining per-result controls, focus, status/cancel/re-enqueue and global changed-selection tick recovery. Full Node148/148 plus14original controller-harness checks; matched4→0geometry visits/10.4–14.6→0–0.1ms. Full323.066s/15rotations/8fresh workers on8new songs distinct from44prior sources;43Load/20Play/24stoppedlayouts retain controls/previews. Independent23wholePCMwindows/148s and source/original/session hashes pass. Broader stalls remain:23longframes,worst242.5ms; largest two unattributed. Separate native3.0065s first-job window retains254nodes/focus/gain/master; largest COMPLETE main task22.869ms, actual199.1ms native long frame outside capture. No GC/CSS/DSP cause established. Physical output muted in diagnostics; normal-profile music not started. Trello148cards, two narrow software defects complete, six summaries/comment exact; prior146dispositions unchanged. Audible pops, native moving frames/held gestures, late-song grids, manual listening and hardware remain OPEN. [Delivery/re-entry](../docs/prototype/desktop-0.1.52-playback-delivery.json), [executed report/limits](../docs/prototype/CORE_TERMINAL_ANALYSIS_REFRESH_2026-10-24.md), [runtime/source](../docs/prototype/terminal-analysis-results.json), [PCM](../docs/prototype/terminal-analysis-pcm-inspection.json), [native window](../docs/prototype/terminal-analysis-native-window.json), [Trello reconciliation](../docs/delivery/CORE_TERMINAL_ANALYSIS_RECONCILIATION_2026-10-24.json).

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
