# Open Play HTML review candidate

Run `python3 scripts/serve_prototype.py` from the repository root, then open
http://127.0.0.1:8768/prototype/. On macOS, double-click `Start Open Play.command`.
Requires Python 3.9+ for the launcher and a modern browser with Web Audio; recording
also requires MediaRecorder. Core browser playback needs no package install or hosted service. Optional local stem preparation requires the documented Python environment and licensed model checkpoint; no audio is uploaded.

This is an independently written HTML/CSS/JavaScript review prototype. **It does
not establish 1:1 Serato parity.** All 110 inventoried feature groups have a
review destination, explicit simulation, or a documented gap. The evidence browser
contains 492 source-linked requirements and per-feature Codex/Claude recommendations.
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
multi-rule crates, 59 independent DJ audio FX, real buffered keylock/pitch, local stem separation, and local video composition/capture
now execute actual behavior. Web MIDI has a real connection path, but access timed
out in the tested browser; hardware compatibility remains unverified.

Run [the 20-check audio/module harness](behavior-tests.html). Its audio does not
reach the speakers. Read [the functional review](../docs/prototype/FUNCTIONAL_REVIEW.md)
for earlier UI evidence. Read [the DSP continuation](../docs/prototype/DSP_FUNCTIONAL_REVIEW.md)
for new checks and active findings. All 59 named processors produce real audio, but
exact reference parameters and sound remain open; no route or simulation counts as parity.
