# Sampler sparse saved-loop starts —174

Date: 19 October 2026. Full parity remains unaccepted.

The actual Advanced modal failed when slot 2 held a saved loop and slot 1 was empty. A sparse array spread an undefined option into destructuring; restored null entries would also fail when dereferenced. The cue list already used the appropriate flatMap pattern. Only the corresponding saved-loop list in panels.js changed, preserving original slot indexes.

## Executed behavior

Normal Import/Load, manual IN at 1 and quantized OUT at 3.1333333333, save to slot 2, cue 3 at 1.8, then Sampler Load/Advanced/Play from. Exactly Start, cue:2 and loop:1 appear. A normal navigation/reload restores the imported audio from IndexedDB without re-import; metadata holes become null while identifiers remain correct. Restoration is measured before engine.buffer legitimately caches the File.

Fresh and restored runs each exercise raw 1x Repeat, actual keylock at 1.1x Repeat and Stop. Each active stage crosses a wrap at source 1..3.1333333333. Twelve whole channel streams across both runs: active 3s/144000frames/1125 contiguous quanta, stopped .3s/14400frames/113 quanta, all finite and SHA checked. Raw comparison uses every recorded frame, including wraps, against the retained decoded original at known 1s offset, integer native frames and fixed 0.4 gain: maximum relative RMS 3.074e-8 against 1e-4 limit. No fitted lag/gain/phase, cropped/dropped/repaired/stitched samples or threshold changes. Maximum clock error 2.667ms against 10ms; stopped peaks zero after 1s. Input bytes and decoded original unchanged. Keylocked audio is nonzero/finite with correct source clock; pitch/perceptual quality remains ungraded. Sampler uses original audio here, not separated Stems. All 18 model-cache identities and mtimes unchanged; no inference.

## Evidence and retained failures

- before: `local-evidence/stem-resource-150/browser-exports/7158d0bcf71c4d38a62285d3bad5d812.json`, 3490487 bytes, SHA256 `2225de204abaa21042621c4e8ae1a527b9b15ca518fa85a9eed1538fa627a511`.
- fresh: `local-evidence/stem-resource-150/browser-exports/b6d5ab04743342a1b551415fd7d2fcd9.json`, 7309758 bytes, SHA256 `ee062cb01fda738afc666a9257ca47b7c4310bd74e0c71ab6a04388d5d3be510`.
- restored: `local-evidence/stem-resource-150/browser-exports/d29c2076084c4cca8a4f8708c1e30f25.json`, 7367927 bytes, SHA256 `9ccc601db794efc08bf475848b7a4f897d9a75df334b9fd2e8bc294456c80d39`.

Raw PCM stays private. Exact before/fresh/restored capsules are local-evidence/sampler-saved-174/{before,after,restored}-source-capsule/prototype. Source hashes and current inspector hash are in sampler-saved-174-source-manifest.json. Fresh and restored have different recorder hashes because only the restored File precondition changed; production source hashes match.

Three separate false observations remain retained:

- Initial plain cue click did not use required press/release; no Sampler product conclusion. Original/capsule/error: sampler-saved-174-initial-inspection.json and initial-source-capsule.
- First corrected-selector run retained valid active audio but Stop removed incoming channels, so145witness flagged inputMissing. This data was not repaired or accepted. Original/capsule/error: sampler-saved-174-first-after-inspection.json and first-after-source-capsule.
- First restore guard checked track.file after normal engine.buffer cached it. Before-load evidence already showed no direct File and saved storage. Original/error: sampler-saved-174-restored-guard-inspection.json, bound to the fresh after-source capsule.

The final recorder adds exactly-zero ConstantSource through a stereo merger into Sampler output, solely to keep native silent bus channels present after source disconnect. This is declared in every accepted report. It changes no source music, timing or gain. Fresh acceptance was preserved without another replay after only the restore guard changed.

## Primary reference and limits

Sources read 19 October 2026: [Sampler Play From Selector](https://support.serato.com/hc/en-us/articles/227629828-Sampler-Play-From-Selector-Advanced-Mode-Options-only) documents file/cue/loop starts, available choices based on existing markers, and Repeat for selected loops. [Sampler Sync](https://support.serato.com/hc/en-us/articles/227629808-Sampler-Sync-Advanced-Mode-only) describes persistent Sync/Off, beat-position feedback, mode overrides and Beatgrid/BPM fallback; these remain next work. This record does not establish source separation, pitch/perceptual or gap-free quality, embedded media tags, all banks/routes/modes, vendor timing, native/hardware or full parity.

## Reproduce inspection

Use new, nonexisting output paths:

```sh
python3 scripts/inspect_sampler_saved_174.py local-evidence/stem-resource-150/browser-exports/b6d5ab04743342a1b551415fd7d2fcd9.json /tmp/open-play-174-fresh-new.json --sources local-evidence/sampler-saved-174/after-source-capsule/prototype
python3 scripts/inspect_sampler_saved_174.py local-evidence/stem-resource-150/browser-exports/d29c2076084c4cca8a4f8708c1e30f25.json /tmp/open-play-174-restored-new.json --sources local-evidence/sampler-saved-174/restored-source-capsule/prototype
```

Product baseline7158d0bcf71c4d38a62285d3bad5d812/before capsule exits1 with actual UI error. node --check prototype/panels.js passed. No broad sampler/effects/controller matrix or redundant unit mirror was added.
