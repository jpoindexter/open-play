# Independent final Video MIDI artifact review — 2026-10-17

**Verdict:** the saved final browser artifacts support the bounded pixel/fixture/source-identity claims. No artifact corruption, source drift or contradictory recorded pixel was found. Parent executed the browser run and reload; this review independently decoded their original saved bytes and compared metadata/current files. It did not execute the browser, native app, controller or audio path.

## Final initial phase

Input `docs/prototype/video-midi-browser-final-results.json`, SHA256 `4654fc96a1f6bb935a4a2678fc0e1dee1e3c9a84ee236529c68fe544fe9d8e67`, reports 14/14, no fatal errors and completed true. All 11 `sourceBefore` hashes equal `sourceAfter` and current workspace files at inspection. In particular, this is the corrected dispatcher/edge candidate: panels `c690f08528ac3380c2995be86e378555b5eb9c3cd1d7afe5a32dea6e0efeecfe`; MIDI `a93852152e272a4da19c7062585e53cca20dc073f784324bfb1b542f5c739b9c`; Video router `ed536567cc52e0275ea3712d65c463c661920b5f3e851a9c8402e988cda45115`; controls `33d94445ef1581371f4a6badab8112048ee38ba5ce55828bc097475cd5945255`; harness `5b105a3b4b502dac9ed26958a17e5befc666c619d6cfd6cfb701b2ea47baa959`.

I decoded all 17 complete original 640×360 PNGs with Pillow. Every SHA256, dimension and recorded center equals its decoded artifact. Independent expected source, inverse-color, alpha and transition-color comparisons have maximum error 1, within the original tolerance 2 (`prototype/video-midi-harness.js:23–24`). Original baseline and restored transition images are identical over **every RGBA byte**, as are decoded source-red and recalled-red images. The relative selection case (`36`) records baseline `[37,41,49,255]`→UpfadersOnly `[74,83,98,255]`→baseline. The summed source color agrees with the decoded left/right source colors. Save/edit/recall (`51–54`) records `[254,0,0,255]`→`[1,255,255,255]`→`[254,0,0,255]`. Six slot inverse-color artifacts match the addressed source color's complement; actual state exclusivity is parent harness evidence (`37`), not an additional offline execution.

The complete original VP8 fixture is 2067 bytes, SHA256 `51f24451b9450cf28f53949a38cd83bee04fd5ace85039e894e7c58f0ae7ee0d`. Whole ffmpeg decode with passthrough frame timing yields **18 distinct 320×180 RGB frames**, 3110400 decoded bytes; ffprobe container duration 0.570692s, monotonic frame PTS 0..0.570s. Every decoded center is red `[247,0,0]`; corner green remains 255 while corner red progresses 9→80. Thus this candidate supplies a genuine multiframe changing-video fixture, unlike the historical one-frame fixture. The recorded 74 paint calls are canvas requestAnimationFrame calls (`43–48`), **not** an encoded-frame count. The requested 600ms is not asserted as exact media duration. Offline decoder red 247 versus browser center 254 is preserved; no cross-decoder color-equivalence claim is made.

These results are saved immutably in `docs/prototype/video-midi-final-independent-artifact-inspection.json`, SHA256 `89282fc9dbf5ecbf22983d4916ef6283cff97aaabe3ff2038cf6e94ea4056d2e`. Original bytes remain in the parent's JSON. Nothing was trimmed or substituted.

## Restored phase: artifact verification versus observed reload

Parent reported an actual page reload. Independent inspection of `docs/prototype/video-midi-browser-final-restored-results.json` confirms its artifact SHA256 `a321fc9826ba20ffcb7d5ab33d0ec641387b4605a93c5b01aa4518b74cece76f`, 4/4 reported checks, no fatal errors, 37 saved mappings identical in content/order to the initial phase, and all four before/after source manifests equal each other/current files. This verifies saved metadata consistency. **It does not independently establish that a reload occurred**; the actual reload is the parent's observed runtime evidence. The harness restoration assertions are at `prototype/video-midi-harness.js:69–72`.

All three complete restored PNGs decode and match their recorded hashes, 640×360 dimensions and centers. Per-artifact independent measurements follow:

```json
{
  "inputSHA256": "a321fc9826ba20ffcb7d5ab33d0ec641387b4605a93c5b01aa4518b74cece76f",
  "completed": true,
  "sourceStable": true,
  "checks": 4,
  "allChecksReportedPassed": true,
  "fatalErrors": [],
  "mappingCount": 37,
  "mappingsExactlyEqualInitial": true,
  "allFourSourceManifestsEqual": true,
  "allSourcesCurrent": true,
  "frames": [
    {
      "label": "restored-left",
      "bytes": 8476,
      "sha256": "598c930d80e744936b7ef406aa1859c384690af4410d8c102540ec1a48d8d7d4",
      "hashMatches": true,
      "size": [
        640,
        360
      ],
      "sizeMatches": true,
      "recordedCenterMatches": true,
      "center": [
        23,
        50,
        59,
        255
      ],
      "expected": [
        23,
        50,
        59,
        255
      ],
      "maxCenterError": 0
    },
    {
      "label": "restored-right",
      "bytes": 8897,
      "sha256": "357a35a05a9dcdf50601d608be5c04b379c52c2595c3264ddb4ff99731c52cd0",
      "hashMatches": true,
      "size": [
        640,
        360
      ],
      "sizeMatches": true,
      "recordedCenterMatches": true,
      "center": [
        51,
        33,
        39,
        255
      ],
      "expected": [
        51,
        33,
        39,
        255
      ],
      "maxCenterError": 0
    },
    {
      "label": "restored-left-negative",
      "bytes": 8469,
      "sha256": "3804b1e44590cf6903489d0fb69e12642413b56933094ecc666c2bc187f91edb",
      "hashMatches": true,
      "size": [
        640,
        360
      ],
      "sizeMatches": true,
      "recordedCenterMatches": true,
      "center": [
        232,
        205,
        196,
        255
      ],
      "expected": [
        232,
        205,
        196,
        255
      ],
      "maxCenterError": 0
    }
  ]
}
```

## Boundaries

The decoded multiframe fixture and saved GPU frames do not demonstrate sustained moving-video playback: the actual checks examine selected center pixels while audio deck transports are stopped (`prototype/video-midi-harness.js:22`, `73`). The animated corner proves the original fixture contains changing frames; no temporal sequence from the app's output was exported. Likewise, selected audio-state equality cannot establish acoustic independence, musical quality or all DSP invariants. The earlier independent controlled 5/5 dispatcher ownership/refusal checks remain separate evidence, and the corrected browser held-edit case at 40 is additional parent-executed evidence.

No physical MIDI, native package, fullscreen, overlay-specific MIDI targets, historical 26-group completeness, vendor mapping transfer, complete REQ-516 parity or full Serato equivalence is accepted here. Source integrity is equality against local bytes and saved manifests, not a signed/provenance attestation. Earlier failed and narrower reports remain preserved and are not relabeled by this final candidate.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
