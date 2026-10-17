# Group resume replay and Rubber Band alternative: independent review

**Verdict:** the exact replay and the bounded offline Rubber Band result are supported. Rubber Band RealTime mode still fails the declared duration criterion. Neither alternative establishes a production fix, realtime callback performance, or native017 acceptance.

Executed `python3 docs/research/GROUP_RESUME_RUBBERBAND_INDEPENDENT_INSPECTOR_20261017.py`. It reads preserved originals, executes the immutable SoundTouch capsule twice without invoking any parent writer, independently computes all 32 declared tone estimates, and writes only its uniquely named result. No UI, service, Git, product, old evidence, or native app changes.

## Exact replay

- Verified all 72 capsule file hashes/sizes and the parent browser-report/raw identities. Normalized input is 552,000 ten-channel frames/22,080,000 bytes, whole finite, SHA `a638ea3d6b93fbea5116577b1ef0667c54151ea0fdc01d3e50420faf69f9ca31`.
- Saved replay is 192,256 ten-channel frames/7,690,240 bytes, whole finite, SHA `ad7429c1540d27eb73a64bc0f7ef891a922f6220048cfaeb32e27294b733da81`.
- Independently compared **channel bytes**, including signed-zero representation, for all ten channels over declared relative frames 4,800–191,999. Browser start offset 759,520 and replay start 256 come from the saved schedule; all bytes match with no searched alignment, phase, delay, or gain fit. Parent comparison source: `scripts/diagnose_grouped_resume_phase.mjs:19`.
- Independently rendered the frozen actual transport with logging disabled and enabled. Both entire outputs equal the saved replay SHA; all 48 offset records and the full transport snapshot equal the originals. Hook/restoration and render logic: frozen `scripts/diagnose_grouped_resume_phase.mjs:16`–`:19`. This is an executed noninterference check for this input, not a universal instrumentation guarantee.
- Fixture generation and old input-hash check are explicit at frozen script `:9`; only the factory import specifier is replaced at `:10`, and the controlled AudioBuffer class/actual SRC helper are used at `:11`–`:12`. I verified the recorded fixture hashes equal the browser fixture hashes; this inspection did not rerun the SRC generator itself.
- Independent global 20–20,000 Hz, at least 16× zero-padded Hann estimates reproduce input max error **0.000000568094 Hz** and two output failures: stem0L **438.931056 vs 442.250047 Hz**, stem1L **701.367893 vs 698.171394 Hz**. Declared windows are unchanged: input frames 240,000–335,999; replay 120,544–168,543. Original scope correctly limits the inference (`soundtouch-group-resume-diagnostic2-spectra.json:201`).

The frozen deterministic grouped DSP path reproduces this browser deviation on the saved input. This supports investigating its processing behavior; it does **not** isolate a particular internal routine, establish a general SRC defect, or regrade the original engine cohort’s 1/2 result. The earlier Node class-guard attempt is outside these successful replay artifacts and receives no audio acceptance here.

## Rubber Band whole outputs and declared window

| Mode | Whole frames | Maximum of 8 pitch errors | Direct L/R reconstruction RMS ratio | Duration criterion |
| --- | ---: | ---: | --- | --- |
| Offline R3 | 364,544 | 0.002372091 Hz | 0.004366767 / 0.005093628 | exact; this case passes |
| RealTime mode, offline caller | 369,976 | 0.002372171 Hz | 0.004370593 / 0.005130334 | **fails:** 368,151 after API delay vs 364,544 expected |

- Verified whole finite ten-channel PCM, bytes/SHA, every retrieve count/sum, declared input start 96,320, ratio 0.8, pitch `2^(2/12)`, RMS >0.001, unchanged 1 Hz/0.03 budgets, and frame rounding. Offline SHA `52c4794d432df9b2e478d7f0ddaf3d5310c93b27ee48c7eb068ba2080df06a0b`; RealTime SHA `058fad4310c829631b846a5aebad6f655859ec2a573282950e3de72638e73b35`.
- Verified installed library SHA `04069acff8ca0db7529cd1b6d73e2bc8a6d2729ea77351a70c3e3f4181c8296c` and C header SHA `ccdb6fbad995ae924219ea89598b2dafbcea2e4fb4bb5e211b3dde589f7b9453`. Header `rubberband-c.h:32` declares library 4.0.0; `:65`, `:82`, `:96`–`:103` establish flags. Actual read-only CAPI instantiation returns engine **3 (R3)** and ten channels; engine 3 does not mean library version 3 (`RubberBandStretcher.h:551`).
- Flags are exactly Offline `0x32010000` and RealTime `0x34010001`; the latter also changes PitchHighQuality to PitchHighConsistency. Therefore this comparison does not isolate the mode bit alone. Both use EngineFiner, ChannelsTogether, ThreadingNever (`scripts/test_rubberband_grouped_offline.py:6`; `scripts/test_rubberband_grouped_realtime_mode.py:6`).
- Offline performs study then process; RealTime performs only process. Actual API re-query confirms pad 2,048 and delay 1,825 for RealTime; offline returns zero for both. Supplied header describes this compensation (`RubberBandStretcher.h:665`–`:714`); parent feeds that pad and offsets only the measurement window (`test_rubberband_grouped_realtime_mode.py:22`–`:28`). All padded output remains saved.
- Independently inspected untrimmed RealTime tail starting frame **366,369**: extra **3,607** frames include audio. First 480 original-channel frames have RMS **0.008989520/0.010639588**, peak **0.063922733/0.060734197**; final 480 frames are all-channel zero. Dropping the excess is not justified by an all-silence assumption. The report correctly keeps `durationExact:false` and `criteriaPassed:false` (`rubberband-grouped-realtime-mode-results.json:52`, `:1045`). No library-internal cause is established.

These are a single known synthetic source, static rate/pitch, one declared steady window and offline API callers. Offline processing timers do not establish callback deadlines; `studyMilliseconds` in the RealTime report measures initial padding/setup rather than a study pass. No EOS/cursor policy, dynamic adapter, music, hardware, long-session, browser/native integration or full parity is accepted. No threshold, gain or delay fit was introduced.

Independent inspector SHA `d2f2fe499d9dea13671db941629c8efed7d643db4f36ac335013859f49e0b8cb`; result SHA `94cde9a526a2c97485762ff4fd11751707cf7c023bfb9e0ad9298a37874c422d`.

Skills applied: use, adversarial-verify, systematic-debugging, dec-quality-testing, dec-software-principles.
