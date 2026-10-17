# Native 0.1.6 Video artifact review — 17 October 2026

Skills matched (4): use, adversarial-verify, dec-quality-testing, dec-software-principles.

**The declared initial text-opacity screenshot criterion passes, 3/3.** Independent full-image decoding finds **8,318 → 0 → 8,318** bright pixels in the fixed output-text region, with restored mask and all decoded region pixels exactly equal to baseline. The original mapping export also matches its Downloads original and contains the expected three mappings. This is a bounded initial native artifact result, not independently executed UI, persistence/restart, physical MIDI, all Video targets or REQ-516 acceptance. The separate +2-left audio accuracy failure remains unchanged.

## Original-image format and identity

The three files have `.png` names but are **actual JPEG/JFIF bytes**, magic `ffd8ffe000104a464946…`. The first inspection stopped at its PNG-format assertion before writing a pixel verdict. That format-only stop is preserved in `docs/prototype/desktop-0.1.6-video-artifact-initial-format-check.json`, SHA `331b8e84dce16513ac7655441249db7685cfb9233b053c9c0714038ce1981177`. No original was converted, renamed, edited or discarded; the inspection now records the actual decoder format. Calling these encoded artifacts PNGs would be inaccurate. This correction does not change the pixel predicate or evidence window.

All three originals fully decode as opaque RGB, **2880 × 1898**, **5,466,240 pixels each**. The actual file hashes are:

| Original screenshot filename | Bytes | SHA-256 |
| --- | ---: | --- |
| `desktop-0.1.6-video-output-baseline.png` | 636,950 | `09b5b05772f766acad24884dc9a3db3c3924842c513228d44ab6d4a5680207ba` |
| `desktop-0.1.6-video-output-off.png` | 627,566 | `39e8b07a725cbbc2d1317e4c545d03fb97678d3b0a1f7f5a9054cb1684c8ba74` |
| `desktop-0.1.6-video-output-restored.png` | 636,958 | `ffa6dddfaaff7e09676e1609a24b205c0da736bb7b3003f5406eff84cbd74fdf` |

Paths are under `docs/prototype/screenshots/`. The complete originals remain intact, including all UI and pixels outside the measurement region. A read-only visual inspection of the complete baseline places `MIDI TEST 016` inside the output canvas, rather than treating editor text or status labels as rendered output proof. The unrelated wrong-scroll screenshot `desktop-0.1.6-video-text-visible.png` is not used.

## Executed fixed pixel criterion

The frozen plan fixes ROI **[2100, 1370, 2750, 1510]**, containing 91,000 pixels, and requires each R/G/B component **> 180**, baseline at least 100, off exactly zero and restored bright mask equal to baseline (`docs/prototype/desktop-0.1.6-video-pixel-plan.json:4`). No threshold, region, output sample or whole image was substituted after measurement.

| State | Bright pixels | Bright text bounding box, image coordinates/exclusive end | Criterion |
| --- | ---: | --- | --- |
| Baseline | 8,318 | [2154, 1413, 2628, 1466] | Pass, ≥100 |
| Opacity 0 | 0 | None | Pass, exactly zero |
| Restored | 8,318 | [2154, 1413, 2628, 1466] | Pass, exact baseline mask |

Baseline and restored mask hashes both equal `389a1242bd6bf4dc5f527bc6828078ac7c1ad64be4ea025aeddccdcee204ba89`. Their complete decoded RGBA ROI hashes also match, `c290b61c9fd858c25a3bc53c47342b020158f7adf2b28955c927c3310156fd79`, with **zero changed ROI pixels**. Baseline-to-off has 20,956 changed ROI pixels. Whole screenshots are not identical: baseline-to-restored has 3,749 changed pixels elsewhere, explicitly retained in the result. No whole-window identity claim follows from this ROI result.

JPEG is lossy and these screenshots are observations at three times. This check does not measure intermediate opacity levels, temporal smoothness, canvas alpha, GPU/export fidelity, native external-display composition or reference-pixel identity.

## Original mapping export

Independently compared `/Users/jasonpoindexter/Downloads/open-play-native-016-midi-initial.json` byte-for-byte with `docs/prototype/desktop-0.1.6-midi-initial-export.json`: identical, **SHA `2b3935a876e55db3a0c0cce2b01f0b3c18e93cbf795b6446bc7ae1a4566ff117`**. Parsed format is `open-play-midi-v1`; all three expected records match exactly:

- Prior Library browse, Relative two’s complement, CC channel 1 / number 1.
- Deck 2 key shift, Relative offset, CC channel 16 / number 119.
- Video text overlay opacity, 7-bit absolute, CC channel 16 / number 118.

The export explicitly keeps `physicalCompatibilityVerified:false` (`docs/prototype/desktop-0.1.6-midi-initial-export.json:3`). These bytes prove saved/exported mapping metadata and retention of the original browse mapping. They do not independently prove learning, event delivery, held/released semantics, hardware identity or reload/relaunch restoration. Those require the parent's actual actions and subsequent runtime evidence; action labels alone describe intent, not success.

## Owned outputs and remaining acceptance

Executed script: `scripts/inspect_desktop_016_video_artifacts_independent.py`. Result: `docs/prototype/desktop-0.1.6-video-artifact-independent-results.json`, SHA **`c18499650fe47dd4349c7d653d13197e01be75e7c6eb654fce0302d8aa6ec974`**. The result retains every original file identity, full-image decode hash/dimensions, ROI and mask hashes/counts/bounds, whole/ROI difference counts, exact plan and original export. Exclusive output creation avoids overwriting prior evidence.

The parent reports native creation of the master text, CC opacity zero/127 injection and native Export; this inspector did not control or independently observe those actions. No postrestart artifact was reviewed in this initial unit. Failed numeric-entry attempts, the −24 screenshot and wrong-scroll Video screenshot must remain distinct from corrected observations. Current evidence earns only the stated initial static text-opacity/export subset. It does not close all 72 Video target workflows, full REQ-516/manual-group parity, physical controller/output coverage, external display behavior, broader audiovisual quality or the existing strict audio pitch failure.

Skills applied: use, adversarial-verify, dec-quality-testing, dec-software-principles.
