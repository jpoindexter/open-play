# Slicer preparation lifecycle and background endpoint —166

The actual baseline revealed an endpoint defect: release after the retained background source reached End stopped at3.1495011338s instead of6.8s, reported “Invalid synchronized source position.” and delivered zero natural-end callbacks. Early release and real Load replacement already behaved correctly. Their coverage is recorded, not attributed to the patch. Baseline original605438bytes/SHA0c54188d9ccfb7ba783a4c2e409ca77c92c991a56ba898562e4b8b9f34e335e6 remains immutable and its public before-results staysfalse.

## Change

Only production `prototype/slicer.js` changed. Release detects an expired non-loop background and retires at its original source endpoint. A concurrent owned watcher waits for that endpoint if slow preparation crosses it; successful handoff, Stop or Load invalidates the watcher. It restores the retained loop state, retires voice/request, forgets the hold, then invokes the existing app natural-end callback exactly once. Forgetting before the callback allows existing Repeat and Autoplay to start a new voice without an obsolete pause afterward. Paused auditions and fixed prior loops do not arm endpoint handling. No new model, DSP, service, app, engine or native package.

## Executed criterion

The normal isolated44100Hz browser Import/Load/Preparation/grid/Sync/Slicer controls used the exact private6.8s real musical MP3 and completed SCNet job8266a41f62fc4fc5b92808dd3d988cec. Original/Vocal silent, Melody/Bass/Drums selected. Actual Setup disabled Lock Playing Deck, Maintain Sync on Track Load and Instant Doubles for the replacement control. Physical output muted; controller not needed.

Seven actual cases pass independent inspection: (1) early keyed release during real preparation returns paused/no voice/request; (2) normal Load replacement survives late release; (3–4) raw/key+3 expired release ends exactly6.8/no voice/request; (5) keyed preparation released before End crosses the endpoint and invokes end at+2.653061ms, under the predeclared50ms deadline; (6) keyed Repeat invokes end once and restarts the same musical track; (7) raw Autoplay invokes end once and plays the actual next visible library entry. The latter target is a generated demo control, not a second real musical separation test. Expired cases are deliberately released80ms after End, so their callbacks occur on that later release; this does not establish automatic ending while a pad remains held.

Final original1796221bytes/SHA04c812ed6ad69af53fe7ae2e1a010b17e3c7cffa06dfc5999acd1bf819f93502 is private and immutable. All24whole0.3s13230-frame channel streams are finite/SHA/104contiguous producer-quanta checked; no repaired/dropped/stitched timestamps. Stopped streams peak0 under unchanged1e−7; positive held/repeat/autoplay streams exceed1e−5RMS. Raw selected source interpolation matches actual exports/known grid/observed anchor within4.181e−8 relative RMS under1e−4 in the declared.05–.25s window, without timing/gain fitting. Keyed positive output is control/transport evidence, not musical pitch-quality acceptance. The22declared source hashes reproduce exactly against the final capsule, not a whole-app identity claim. All9cache files retain bytes/SHA/mtimeNs, no inference repeated.

Eleven controlled-collaborator Slicer contracts pass; four new endpoint/cancellation/callback cases fail before the patch. These exercise controlled future preparation/ownership, separately from actual browser evidence. No solved full FX/controller/tone/model/overlap/tempo matrices were repeated. The saved screenshot is the rendered independent report from the immutable original; the prior temporary live tab was closed at a turn boundary, so no original live screenshot is claimed. The small receipt is explicitly reconstructed from the saved raw bytes.

## Reproduce inspection

```sh
python3 scripts/inspect_slicer_end_166.py local-evidence/stem-resource-150/browser-exports/2f3625d79faa49d39cc17d0c2f9fd5b1.json /tmp/slicer-end-166-reinspection.json --sources local-evidence/slicer-end-166/final-source-capsule/prototype
```

The output path must not already exist. `test_slicer_warp.mjs` writes the focused collaborator results. Original raw PCM/music/capsules remain ignored, not distributed in the private repository.

## Limits and next step

Exact installed Serato composition/reference, default48k/context migration, reverse/pre-grid/tempo-change composition, musical pitch/perceptual/source quality, resources/native/hardware and full parity remain open. Context suspension may delay the watcher; no context-recovery acceptance is claimed. Full110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock objective remains active; all full-parity flagsfalse.161producer/codec and164premature-anchor failed gates remainfalse. Frozen0.1.23/tested272Alternative/profile/launchers/user8768/18775/18768 preserved. No native package/Claude session or new hardware request.

Next: actual tempo edits while Slicer is held. The tempo handler currently changes engine tokens without a Slicer-specific transition; reproduce whether release leaves a temporary loop or loses its background. See `handoffs/stems-166-slicer-tempo-followup.md`. This concern is code-path only until executed.
