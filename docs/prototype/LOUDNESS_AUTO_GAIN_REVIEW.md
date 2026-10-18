# Integrated loudness and actual Auto Gain — plan123

18 October 2026. Browser source afterdabfd4384d299886e87e0844807a4655a41df3ae. Frozen desktop0.1.16 is unchanged and does not include this implementation.

## Runtime behavior

Auto Gain now uses measured loudness when loading a local file or triggering a sampler voice. `loudness.js` runs in the existing analysis worker, over the full original PCM, separately from the tempo/key analysis window. It applies K-weighting,400ms blocks/75%overlap, an absolute−70LUFS gate and a relative−10LU gate, discarding incomplete final blocks. Mono/stereo are supported; unknown multichannel layouts and insufficient/ungated audio remain explicitly unmeasured. Silence never receives an infinite or fabricated correction. The existing `gain` object remains the separate ungated-RMS recommendation (`lufsMeasured:false`); the new `loudness` object carries integrated LUFS and gating details. Neither is true-peak measurement.

The coefficient construction adapts MIT-licensed libebur1281.2.6; full license and attribution are retained under `prototype/vendor/libebur128/`. Production uses JavaScript and the existing browser worker: no native library, AI model, remote service, account or paid unlock is required for Auto Gain.

Independent reference policy: target=−18+(selected reference−89)LUFS. Thus89 maps to−18,92 to−15,98 to−9. This follows a ReplayGain2-style calibration choice, **not a measured recreation of Serato's proprietary reference calibration**. The resulting track correction is bounded by the existing±24dB control. Mono measurement remains standard mono LUFS; gain calculation adds3.0103LU to account for this stereo player's mono duplication. Thus equivalent mono/stereo files receive matching playback levels. This compensation is not a change to the measurement standard.

Manual and automatic adjustments have separate memories. In Auto mode, a user edit stores an offset from the computed gain; a reference change preserves that offset. Control/Cmd-click gain sets an absolute0dB adjustment; Alt-click restores the computed value. Disabling Auto Gain recalls the manual value. Legacy stored manual gains migrate into an automatic offset without discarding the user's old audible value. A user edit made before loudness is available survives its later arrival. Newly completed analysis during active playback is deferred until the next load/trigger; explicit mode/reference/gain changes apply immediately through the existing smoothed gain nodes. The deferral/pending-edit cases have focused controlled-state evidence, not an actual long-job/hardware timing pass.

Deck labels distinguish AUTO/MANUAL/unmeasured/deferred states. Analysis shows integrated LUFS separately and labels its RMS action explicitly. The existing default Use Auto Gain preference now has an audible effect for newly measured, unadjusted files; old source evidence remains tied to its own candidate and legacy manual values are preserved. Native16/profile/launchers were not changed.

## Primary sources and scope

- [EBU Tech3341](https://tech.ebu.ch/docs/tech/tech3341.pdf): integrated metering/gating requirements. This implementation has not completed its full conformance corpus.
- [libebur128 pinned source](https://github.com/jiixyj/libebur128/tree/67b33abe1558160ed76ada1322329b0e9e058b02): public MIT coefficient construction and independent local C reference.
- [loudgain](https://github.com/Moonbase59/loudgain): ReplayGain2's−18LUFS nominal reference and compatibility discussion. Our full89–98mapping is an explicit independent choice.
- [FFmpeg loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm): distinguishes mono measurement from intended stereo playback/dual-mono compensation.
- [Serato DJ Preferences](https://support.serato.com/hc/en-us/articles/223363407-DJ-Preferences), [Track Gain Adjust](https://support.serato.com/hc/en-us/articles/234774728-Track-Gain-Adjust): reference controls/workflows. Exact proprietary response remains unverified.

Read18 October2026. No proprietary DSP, app assets or entitlement bypass is shipped.

## Executed verification

`loudness-reference-results.json`: actual JS measurement versus an independently compiled libebur1281.2.6C library, pinned commit67b33abe1558160ed76ada1322329b0e9e058b02. Thirteen owned vectors cover mono/stereo/antiphase,8–192kHz, frequency weighting, absolute/relative gating, silence, short input and discarded partial tail. Declared maximum.01LU; observed worst **1.510322534e−9LU**. Actual `analyzePCM` integration verifies whole-input loudness despite a shorter tempo/key window. These focused vectors are not full EBU certification, a musical benchmark or Serato equivalence. The local compiler's ARM manual-FTZ warning is retained in provenance; compilation exited0.

`auto-gain-contract-results.json`: seven focused groups cover the actual controller/reference mapping, legacy migration, separate memories, offset/reference behavior, reset/zero, pending user edits, active-playback deferral, silence/bounds and mono compensation. `auto-gain-manual-regression-results.json` executes the changed shared manual/engine/MIDI layer; no broad green FX/transport matrix repeated.

Final actual app workflow on isolated18870:

- Four generated hash-pinned WAVs (two different stereo frequencies/levels, silence and mono) enter via the production File-input change event, representing synthetic chooser selection. Original Files are saved in IndexedDB; the real worker measures them. Actual worker measurements match their independently compiled C references within **1.215028078e−12LU**.
-20cases cover automatic gain on load,89/98reference shifts,0/computed resets, automatic user offset, mode switching/separate manual memory, reference changes, loading another file, silence/unmeasured state, sampler trigger/edit/shared reset, mono compensation and actual normalized saved-file playback after full reload. Original File hashes, manualA=6, automatic offsets0and reference92restore. No claim that a native picker or physical modifier/MIDI was exercised.
- Independent existing post-output capture worklet records channel0Float32 windows, fixed300ms settling/300ms capture,13230samples at44100Hz. Declared2%relative amplitude/1e−6absent-tone limits; observed worst **5.302842254e−8relative /8.649932483e−10absent**. Equivalent mono/stereo normalized amplitudes differ by **9.714451465e−17** in this fixture. All20whole windows are finite; the two silence windows are exactly zero. This is stationary output-gain evidence, not a direct full-stereo integrated-loudness recording, true-peak, music-quality or acoustic pass.

Whole compressed masters are finite/stereo/44100Hz:

- Final first phase: **11.579977s,510677frames,177701bytes,SHA2561a6e528022a2f48cb2b5176f976753341b2909c6d0d2666ed23ab8ddc1e1b938**.
- Restored playback: **.539977s,23813frames,8871bytes,SHA2566f0acfc222d5d2ba7b0422f3b468d7220203318121af6f99bddfaa5fe212e3d6**.

Ten declared served source hashes remain unchanged through the final recording/reload and match disk. Both recordings use physical graph mute; final screen shows0decks playing. Raw reports/masters/Float32 windows/source capsules remain ignored under `local-evidence/auto-gain/`.

Initial attempt stopped before import because the normal review server correctly blocks `local-evidence`. That boundary was retained. A separate test server exposes only the four generated, hash-checked WAV names; raw-folder/unlisted-file requests still404. `scripts/serve_prototype.py` is unchanged. The first stereo-only19casepass is separately retained under `stereo-before-mono`, not relabeled as the final20casecandidate. Review found the mono playback compensation gap; the final candidate adds that branch and real file case. No tolerance loosening or unrelated broad reruns.

Reports: `loudness-reference-{results,provenance}.json`, `auto-gain-{contract,browser,pcm-inspection,live-source,test-server,initial,manual-regression}-results.json`, `auto-gain-fixture-reference.json` and separately scoped `auto-gain-stereo-before-mono-*.json`.

## Reproduction and remaining work

Pinned local C sources are under `local-evidence/loudness-reference/libebur128/`; hashes/compiler command are in `loudness-reference-provenance.json`. The C library is only a local verification oracle, not a production/native-app dependency. On this Mac:

```sh
clang -std=c99 -fPIC -dynamiclib -O2 local-evidence/loudness-reference/libebur128/ebur128.c -o local-evidence/loudness-reference/libebur128/libebur128-reference.dylib -lm
node scripts/test_loudness.mjs
node scripts/test_auto_gain.mjs
node scripts/prepare_auto_gain_fixtures.mjs
python3 scripts/serve_auto_gain_check.py --port 18870
```

Use the owned harness at`/prototype/auto-gain-harness.html`; Run→Reload→Verify restored playback. These are reproduction commands, not a request to rerun all green checks now.

Remaining: exact Serato calibration/normalization algorithm/mode semantics, full standards corpus, arbitrary multichannel layouts, true peaks/crest-heavy music and limiter interaction, physical/controller/LED/native acceptance, actual delayed-analysis/cancellation/load-race behavior, metadata import/migration UI, all transport/Stem Slip/FX/keylock/routing compositions and musical quality. All110groups/522requirements plus9beta deltas/26release checks/full flags/model+effort routing/original prompt remain intact; full independent Claude audit unlaunched.

Next: prepare a fresh approved local desktop test candidate with these core browser changes. Preserve16/profile/mapping and original launchers, declare `loudness.js`, `auto-gain.js`, `track-gain.js`, three master-output modules,`mixer-curves.js`/`stem-crate.js` as critical, and execute the actual packaged worker/gain/output graph. No native-engine rewrite/public release or timed hardware capture while Jason is away. Human physical re-entry remains left Play→RCA sound→samebuttonstop, one action at a time.
