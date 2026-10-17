# Independent native engine keylock evidence review — 17 October 2026

**The exported shifted-release PCM independently satisfies the existing five bounded pitch/gap criteria.** The parent-executed native harness reports 7/7 checks and zero fatal errors. This review corroborates its source identity, capture-manifest accounting and exported release analysis; it does not independently replay native actions or reconstruct the four complete stereo captures, which are not exported in this artifact. No production, GUI, device, Git or remote operation was performed.

The parent navigated the existing Electron 0.1.5 renderer to its own packaged `prototype/keylock-engine-harness.html`, closed DevTools and clicked Run. This is an actual native-renderer harness run, **separate from main-interface operation** and physical audio output. The harness mutes both its engine master and final capture destination (`prototype/keylock-engine-harness.js:8`, `:21–22`). The unchanged harness's inherited “No native/hardware” copy at `:9` cannot itself establish or refute runtime provenance; native execution is the parent's observed evidence. It still correctly supplies no hardware or main-interface acceptance.

## Evidence identity executed

Input: `docs/prototype/keylock-engine-native-0.1.5-results.json`, 190,638 bytes, SHA-256 `489f514c2ebc4e5ef664324364705bfcc9a625bfb31eb68fb89f3b64f7c78dd7`. The result reports 44,100 Hz, 12,735.3 ms, seven successful checks and no fatal errors (`:1445–1448`).

The actual local ASAR was independently rehashed to `251bcc16caf9cfb42a3967db058717373a8c6fcb9ff97d56c330058ec8301b03`, matching the previous immutable package manifest for prototype commit `48a6d4dad2f217a8ba166b9ca890a287aabc4feb`. All eight runtime-reported source hashes match bytes extracted from that actual ASAR, local source bytes and the immutable package manifest. This is a source identity check, not a repetition of the host/security audit or a new proof of every dynamically loaded dependency.

| Critical source | Matching runtime / packaged SHA-256 |
| --- | --- |
| `engine.js` | `b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf` |
| `keylock-engine-harness.js` | `f5aae828a61cbe27b8c3c255fe5da2dac4db683642e0ce561a9d3302c19f28f9` |
| `keylock-release-analysis.js` | `2957a90303441cade061107affaee8b3ae4b68d3724fff72a5a9ca1ac30b6e5f` |

The unique result JSON records all eight comparisons. The actual source rejects the buffered whole-output fallback in this harness (`keylock-engine-harness.js:24`), exercises production methods and samples their deck-input route. The fixture is generated synthetic audio, not user music.

## Independently reconstructed exported release PCM

The case at input lines 403–1180 tests a stationary one-second raw hold, release at rate 1.08 with keylock on and +12 semitones, expected 880 Hz versus the distinguishable raw rate-only 475.2 Hz. Source lines 30–46 retain the shadow, verify zero held output and nonzero silently consumed input, release through the real engine, and export the complete left deck-input interval before checking its result. Only this mono release interval is exported as raw PCM.

Base64 was strictly decoded to **105,840 bytes / 26,460 little-endian Float32 samples**, all finite, exactly 0.600 seconds at 44,100 Hz. Its complete SHA-256 is `2a37d1bc624c2e25288ab59862dab6f147b9441db75bc2a0a423ad0c5f5824e4`, matching input `:1170–1177`. The full interval starts at 8.20469387755102 s; the release request is 8.25469387755102 s and scheduled output anchor 8.30469387755102 s. The pre-release 50 ms was not trimmed or used to redefine the release time.

An independently written NumPy implementation recalculated all 57 overlapping spectral windows from those bytes: Hann window, power-of-two FFT padding at least twice the 40 ms window, global non-DC peak, three-bin log-power interpolation, 10 ms hops. Expected frequency is applied only after peak estimation. It independently retained the production analyzer's five criteria and original release-relative time origin (`prototype/keylock-release-analysis.js:3–6`). Maximum difference from the reported frequency estimates is `1.14e-13` Hz, and every spectral classification agrees.

| Existing criterion | Independent result |
| --- | --- |
| First correct 40 ms window starts within release +30 ms | Yes; first qualifying window starts at release +0 ms |
| Initial below-0.005 RMS gap ≤20 ms | Yes; 0 measured gap bins |
| Any below-0.005 RMS gap ≤20 ms | Yes; 0 measured gap bins |
| At least five settled windows, all correct | Yes; 15 qualifying settled windows |
| No wrong-pitch audible window starting after release +30 ms | Yes; zero |
| Additional distinct raw 475.2 Hz window check | Zero qualifying raw-pitch windows |

These reproduce the reported five booleans (`input:1162–1167`) and gap/raw counts (`:530–532`). All original samples, window measurements and gap-bin measurements remain represented or accounted for in the unique independent JSON; the downloaded input retains the complete Base64 bytes.

At 44,100 Hz, the analyzer's nominal one-millisecond gap bin is rounded to **44 frames = 0.997732 ms**. There are 551 complete analyzed bins after the release-relative starting index and ten final frames outside a complete gap bin. Those ten frames remain in the raw payload and were included in the all-sample finite/identity checks; the original criterion does not analyze a partial final gap bin. No threshold, time origin or sample was changed to obtain agreement.

The first exact nonzero exported sample is index 2,206, approximately release +22.676 microseconds under the reported clock arithmetic. That sample marker is **not an end-to-end release-latency claim**. The first correct classification covers 40 ms of audio, and zero qualifying 475.2 Hz windows does not prove zero wrong-pitch samples. Neither a periodic tone nor this finite interval can identify the exact earliest audible source cursor or prove arbitrary musical release quality.

## Four capture manifests and their limits

Every manifest records 64 contiguous preflight quanta, then arms at frame 8,960 / sequence 68. The independently checked algebra is inclusive in sequence count and exclusive in final frame:

| Capture | Blocks | Armed frames | Final frame / final sequence |
| --- | ---: | ---: | --- |
| Engine deck bus | 4,297 | 550,016 | 558,976 / 4,364 |
| Independent control | 4,307 | 551,296 | 560,256 / 4,374 |
| Silent pull output | 4,309 | 551,552 | 560,512 / 4,376 |
| Shadow pre-gate | 4,311 | 551,808 | 560,768 / 4,378 |

For each row, `finalFrame−firstFrame = blocks×128` and `finalSequence−firstSequence+1 = blocks`. Reported coverage is one. The retained startup gap expected frame 128 → actual frame 384 at sequence 1 predates the preflight beginning at frame 768 and the later arm. It is a real retained startup discontinuity; it is not an armed-span gap or grounds to drop an armed failure.

Source `keylock-engine-harness.js:12–18` verifies every in-memory armed block's frame, sequence and two-channel input before producing these manifests; `:61–63` makes any capture-integrity or cleanup error fatal to aggregate completion. **The exported artifact omits those complete stereo block arrays.** This review therefore independently checks the manifest algebra and source assertions, but cannot independently reconstruct every block or sample of the four armed streams. The mono release payload is the only offline raw audio reconstruction here.

## Five-source and aggregate claim boundary

The fifth-source case's transition interval begins at `anchor−80 ms`, deliberately including the preceding hold. The report preserves an 80 ms low-RMS measurement (`input:1183–1231`). The executed assertions check selected 173 Hz vocal before/after, bounded RMS/transition peak and five outputs (`keylock-engine-harness.js:49–55`). They do **not** assert a seamless five-source release. Treating this green case as 20 ms five-source continuity acceptance would be unsupported. No raw five-source interval is exported for independent remeasurement.

The pause case reports zero deck output, no current/pending/retiring ownership and a surviving 307 Hz independent control (`source:57`; input `:1235–1270`). This is useful scoped runtime evidence, but its raw interval is not exported either. This review does not promote its summary metrics to independently reconstructed audio.

The actual native 7/7 result is a new runtime observation against the frozen candidate. It does not repair, erase or reclassify earlier reviewed-source browser capture-integrity failures, including the preserved 3/7 and 2/7 attempts. It does not substitute for main-interface tests, early cursor verification, full stereo/compound transport continuity, music, resource limits, controller response, physical outputs or Serato comparison. Full parity remains open.

## Review freeze

Only new `docs/research/ENGINE_KEYLOCK_NATIVE_REVIEW.md` and `docs/prototype/desktop-0.1.5-engine-keylock-independent-results.json` were written for this follow-up. The latter SHA-256 is `099c9407c85923b8934b2ede0071b2574abccf526d782c7981559119eb369f8c`. Prior main-interface recording reviews are unchanged. No production fix or expanded acceptance is proposed from this bounded positive result.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.
