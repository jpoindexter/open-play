# Retained-pause first-frame boundary diagnosis

2026-10-17. Independent bounded diagnosis; no engine, adapter, vendor, existing harness, or existing result files changed. Browser AudioParam diagnostic is authorized; native application development is not.

## Current conclusion

The three one-sample failures are consistent with a difference between the capture's `Math.round(time * sampleRate)` and native gain automation quantization, but correlation is not causal proof. Native GainNode-only browser evidence is pending. Original failures remain failures under their original strict criterion; this review does not trim, repair, or reclassify them.

Executed arithmetic establishes that these are not merely spurious positive multiplication residues: the IEEE-754 requested times themselves lie fractionally after their integer frames. However, **some successful pauses also have positive exact-rational offsets**, with their JavaScript product rounded to an integer. Therefore “the requested double lies after the exact frame” is insufficient to predict the observed failures. A sharper candidate is an implementation using `ceil` of the double-precision product versus capture using `round` of that same product.

| Failed pause | Requested double | JS product at 48 kHz | Exact requested-double offset after frame | Exact ceiling |
| --- | --- | --- | --- | --- |
| 43 | 66.26133333333334 | 3180544.0000000005 | 3.2378011383116245e-10 frames | 3180545 |
| 46 | 71.168 | 3416064.0000000005 | 3.055902197957039e-10 frames | 3416065 |
| 51 | 79.09866666666667 | 3796736.0000000005 | 3.310560714453459e-10 frames | 3796737 |

All three times have one next-double ULP of `1.4210854715202004e-14` seconds. Their bit patterns are `0x405090b9af72015e`, `0x4051cac083126e98`, and `0x4053c6508dfea27a`. The predecessor doubles lie below their respective exact rational sample boundaries. The independent helper decomposes exponent/mantissa and multiplies with BigInt, preserving exact numerator/denominator rather than deciding from the floating product alone.

## Existing source and observed evidence

- `prototype/keylock-live-lead-experiment.js:36,101` schedules native GainNode gain 0 using `setValueAtTime(0, at)` and returns the same pause time.
- `prototype/keylock-retained-return-harness.js:25,30` selects the capture start using `Math.round(holdStart * context.sampleRate)`; `:31–34` preserves metrics before the unchanged strict mute assertion rejects.
- The immutable observable result has 51 pause attempts. Exactly the three positive JS-product fractions correspond to failed pauses 43/46/51. Their one nonzero left sample is at the selected capture's first frame; the other 47,999 left samples are zero. This does not establish the old right-channel sample values or exact native scheduling mechanism.
- Existing pause 13, for example, passes while its requested double has positive exact-rational offset `1.0459189070388675e-11` frame and its JS product has zero fractional offset. This is a disconfirming case against using exact-rational ceiling alone as an explanation.

## New isolated diagnostic

Open `prototype/pause-frame-boundary-harness.html` in the prototype server and press **Run diagnostic**. It imports no engine, keylock adapter, WASM, or vendor module. It reports measurements, not a parity pass.

1. **Native offline render:** four independent mono GainNode lanes in one OfflineAudioContext at 48 kHz, covering all three original late epochs, offsets 0/.25/.75, the preceding IEEE doubles, exact early controls, and three late controls where the JavaScript product is an integer while the exact double is after that integer frame. Eighteen events total. The full rendered four-channel PCM is retained for download, approximately 61 MB.
2. **Native realtime render:** actual stereo buffer source (left constant .25, right .125), native gain, and a silent AudioWorklet capture. After 64 consecutive preflight quanta, six future-scheduled events cover offsets 0/.25/.75, positive/negative JS-product fractions, and a zero-product-but-positive-exact-offset control. All armed rows must be contiguous and have stereo input. Full stereo capture PCM is downloadable. The capture processor emits zeros and a separate destination gain is zero.
3. **Report:** each event retains the requested gain time, bit representation, ULP, exact rational details, round/product-ceil/exact-ceil frame candidates, raw 113-sample boundary neighborhoods, each channel's unmodified first rounded sample, and first zero frame. Realtime gain scheduling also records invocation and restore times. Full offline/realtime PCM is downloaded separately as planar Float32 data, with geometry in JSON. No samples are trimmed to produce a preferred outcome.

The standalone diagnostic bounds offline render (20 seconds), module load/preflight/capture (5 seconds each), and context close (3 seconds). Failed measurements are reported. The native offline render itself is finite; Web Audio provides no cancel-render operation here. Offline results do not substitute for realtime results. Realtime early-epoch results do not by themselves establish the late-epoch engine behavior.

## Executed checks and remaining decision

`node scripts/test_pause_frame_boundary.mjs`: **6 checks passed**. These execute exact IEEE arithmetic, original-report correlation, offset controls, predecessor-double discrimination, and extraction that retains the pre-event first sample while detecting an injected genuinely post-ceiling residual. `node --check prototype/pause-frame-boundary-harness.js` also succeeds. Neither command executes a native AudioParam.

If the actual native gain first-zero frame follows product-ceil, including the discriminating zero-product controls, that supports a capture/event-boundary mismatch explanation for the three old first samples. It still does not prove the complete old keylock chain or turn the original strict test green. If samples persist beyond the independently observed native effective frame, that supports a real residual or another mechanism. Any revised acceptance interval must be explicit, justified by new native measurements, and retain the old failing results alongside it.

| Artifact | SHA-256 |
| --- | --- |
| Original observable results | `bbc56be77700a5add4c28bb9af50e79e37e2ac417f06280c1c61e61d997a95dd` |
| New diagnostic HTML | `e30c9c9afdddbe57939ea55e8416b77471dea094f56cd1b0eb3927bea3b2c828` |
| New diagnostic JS | `1e6a4aed6604d4a6530b7b32e900a3da2c325764cd72d8b1b71a5627dc9db08c` |
| New arithmetic/report test | `cf293d703578b045d9b398e06d6da46de04012d8b18b9333aa87c43120015f30` |

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.

## Native browser evidence and independent raw inspection

Appended 2026-10-17 after the parent executed the standalone native GainNode diagnostic. This resolves the earlier pending native diagnostic only. The parent-retrieved browser JSON reports `completed: true`, `errors: []`, and 1,127.5 ms runtime. The reviewer independently read the downloaded binary PCM rather than accepting that completion flag or the reported first-zero fields.

The independent inspection is `docs/prototype/pause-frame-boundary-independent-inspection.json`. Its source report is `docs/prototype/pause-frame-boundary-browser-results.json`. Exact binary geometry and full-sample comparisons were executed:

| Download | Geometry | Independently compared samples | SHA-256 |
| --- | --- | --- | --- |
| Offline raw | 4 planar Float32 channels × 3,800,224 frames; 60,803,584 bytes | 15,200,896 | `55e28d3b5be4aa743b27f97d08c0492b85ce9ff72d860380d26bea010ca7d278` |
| Realtime raw | 2 planar Float32 channels × 43,200 frames; 345,600 bytes; first frame 8,192 | 86,400 | `51ef372d45e60f8744e79a5296075d44dd52093decdde984adb1004e2ec3141b` |

Every downloaded sample matches the native gain model with zero beginning at `Math.ceil(time * 48000)` and gain restoration beginning at `Math.ceil(restoreTime * 48000)`. This was checked over the complete captures, including active baseline, each zero interval, and each restored tail. Every reported 113-sample boundary neighborhood equals its corresponding raw-binary samples exactly. The realtime data retains 64 contiguous preflight quanta with no preflight gaps and 338 contiguous armed rows with actual stereo input; the final row contributes 64 of its 128 frames to the finite 43,200-frame capture. No armed sample or row was omitted to obtain the result.

At **each of the three original late-epoch pause times**, offline native gain reproduces a nonzero `.25` at rounded frame N followed by the first zero at N+1. It needs no WASM, keylock algorithm, transform tail, or vendor code to reproduce that shape. The native realtime positive-product case independently shows `.25` left and `.125` right at rounded frame 24,992, followed by zero in both channels at 24,993. Its positive product fraction is only `3.637978807091713e-12` frame. Negative-product and zero-product controls are already zero at rounded frame N.

The discriminating controls reject exact-rational ceiling as the native rule in this run:

| Control | Rounded/product-ceil frame | Exact-rational ceiling | Observed first zero |
| --- | --- | --- | --- |
| Offline 3,182,592 | 3,182,592 | 3,182,593 | 3,182,592 |
| Offline 3,418,112 | 3,418,112 | 3,418,113 | 3,418,112 |
| Offline 3,798,784 | 3,798,784 | 3,798,785 | 3,798,784 |
| Realtime 29,792 | 29,792 | 29,793 | 29,792, both channels |

All 18 offline and six realtime events match the double-product ceiling model. Their requested times, IEEE representations, exact offsets, unmodified first samples, raw neighborhoods, and observed first-zero frames remain in the inspection JSON. This is stronger than the original correlation: changing the scheduled native gain event across a sample boundary reproduces the one-sample shape, and controls distinguish two competing quantization explanations.

The supported conclusion is that **native gain scheduling versus the rounded capture boundary can causally reproduce the three old failure shapes without any WASM residual**. It strongly supports that boundary mechanism for those specific first samples. It does not establish the unrecorded old right channel, prove every part of the old keylock chain, characterize all browsers or rates, or explain unrelated release/gap/latency failures. It does not reclassify the old 51 pause attempts or complete the 54-condition return acceptance. Those original strict failures and blocked conditions remain preserved.

The original observable report hash is still `bbc56be77700a5add4c28bb9af50e79e37e2ac417f06280c1c61e61d997a95dd`. The new native browser JSON hash is `b4dc2fc28edafd65ee5fc8c84506be9cfea8a5509eb32f622fc89bfead0d9263`. The independent inspection JSON hash is `863cf3f24f01773428b3369c3c3ae19381e0fedca7726bc98694d344b395fe15`. The diagnostic JS remains `1e6a4aed6604d4a6530b7b32e900a3da2c325764cd72d8b1b71a5627dc9db08c`. Only this review appendix and the new inspection JSON were written for this follow-up; no production or harness changes were made.
