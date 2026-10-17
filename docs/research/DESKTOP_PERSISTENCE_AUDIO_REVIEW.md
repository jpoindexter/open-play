# Desktop 0.1.5: independent saved-audio and claim review

2026-10-17. Bounded verification of two actual native-saved master captures after the parent's import→clean quit→new process→restore→load/play test. This reviewer independently decoded the original files, compared their retained copies, inspected metrics and reviewed the stated acceptance scope. The reviewer did **not** operate the native UI, observe the process transition, inject source/state, use Git, or touch devices.

## Executed audio result

Both original Downloads files are byte-identical to their retained copies under `local-evidence/desktop-0.1.5-captures/`. Their exact sizes and SHA-256 values match the parent reports:

| Input under test, identified by parent's UI test | Saved recording bytes | SHA-256 | Independently decoded geometry |
| --- | --- | --- | --- |
| Owned WAV | 396,353 | `5ce91c47413159fe79fcea7b2b9379b017d7cbd682b63e564038984389bfb171` | 2,312,640 frames; 48.18 seconds; stereo, 48,000 Hz |
| Owned MP3 | 393,392 | `3e8afeab04e3ff2eb84a1b60178bcc4c2f980a7d4a99f3c027699dfb3cdad6cb` | 2,030,400 frames; 42.30 seconds; stereo, 48,000 Hz |

Each saved file is WebM/Opus; “WAV” and “MP3” identify the restored input fixtures, not the output container. FFprobe independently identifies one stereo Opus stream in each recording. The decoder sample rate is 48 kHz; the parent's observed native AudioContext rate of 44.1 kHz is a separate fact and was not inferred from these files.

Executed decode for each original file was `ffmpeg -v error -i <original> -map 0:a:0 -c:a pcm_f32le -f f32le pipe:1`. There was **no seek, duration limit, resample request, channel reduction or trimming**. Every decoded sample was included in the finite/RMS/peak checks. Detailed commands, full decoded PCM hashes, metrics and differences from parent JSON are saved in `docs/prototype/desktop-0.1.5-audio-independent-results.json`.

| Capture | Whole-file RMS, left / right | Whole-file peak, left / right | Exact trailing zeros, both channels |
| --- | --- | --- | --- |
| WAV-input test | 0.02189978436691496 / 0.021849947831141168 | 0.044179026037454605 / 0.04461264982819557 | 1,148,160 frames, 23.92 seconds |
| MP3-input test | 0.022659484773216495 / 0.022621021871499468 | 0.04281590133905411 / 0.04322491213679314 | 870,720 frames, 18.14 seconds |

All decoded samples are finite. Peak values match the parent reports exactly; the maximum whole-file RMS difference is approximately `4.12e-15`, consistent with summation order. Each final one-second interval is exactly zero. The original natural-end/trailing silence is retained rather than removed to increase RMS or conceal duration. These measurements do not assert the exact source end frame or sample-accurate cursor continuity through codec latency.

## Declared additional tone window

The tone check uses the **predeclared 1–3 second interval**, decoded frames `[48000,144000)`, in addition to the whole-file checks. It does not substitute that interval for the complete stream. An FFT searched the interval's non-DC bins without receiving an expected peak frequency and independently selected **330 Hz left, 550 Hz right** in each recording. Direct sinusoidal projections at 330/550 Hz reproduce the parent amplitudes to approximately `6.04e-16` absolute difference or better.

| Capture | Left 330 Hz / 550 Hz amplitude | Right 550 Hz / 330 Hz amplitude | Intended/opposite ratios, left / right |
| --- | --- | --- | --- |
| WAV-input test | 0.044003621175538674 / 8.627360976852735e-7 | 0.043901624525910996 / 3.555182684136877e-5 | 51,004.73 / 1,234.86 |
| MP3-input test | 0.04266168634924166 / 2.159382995355405e-6 | 0.04258534848227081 / 2.187638366383804e-5 | 19,756.42 / 1,946.64 |

These exceed the declared 10:1 identity criterion. They establish real intended stereo fixture signal in the saved internal master recordings, not just a nonempty Blob or moving meter. The two source formats share the same fixture frequencies; those frequencies alone cannot distinguish the input container or establish that native restoration occurred. Input-format identity and the import/quit/relaunch/load sequence come from the parent's named-file/UI observations. This review independently corroborates the resulting audio, rather than recasting that UI work as its own.

## Claim verdict

The bounded claims are supported, and no scope correction is required in the reviewed wording:

- `docs/prototype/DESKTOP_PERSISTENCE_REVIEW.md:3,9–13` limits acceptance to owned WAV/MP3 clean-restart playback/capture, preserves the parent-observed process transition and separates internal PCM from acoustic/latency/continuity acceptance. The independently decoded bytes and tone metrics support its audio claims.
- `docs/prototype/desktop-0.1.5-runtime-observation.json:23–38` records the parent's first PID 47191, absence of that process/listener after CmdQ, new PID 47465, and restored rows without autoaudio/reimport. Its `scope` explicitly excludes all formats, recovery failures, original-tag writes, acoustic output and new hardware acceptance. Those runtime observations were not rerun by this reviewer.
- `FULL_BUILD_PLAN.md:1434–1442` distinguishes this completed fixture criterion from unfinished formats, metadata, failure recovery, hardware and full parity; it keeps the next transport/quality unit separate. Earlier historical plan sections are not new current acceptance claims.
- `docs/research/CURRENT_PARITY_AUDIT_20261017.md:14,20,34,101` describes a native persistence **subset**, not a full LIB-001/SYS-002 pass. Historical 0.1.3 physical outputs and 0.1.1 knob evidence are not promoted to fresh 0.1.5 hardware proof.

The recordings do not prove all WAV/MP3 variants, metadata integrity, other codecs, crash/eviction/disk-full recovery, corrupted-file handling, long-session stability, onset/gap/cursor accuracy, musical quality, separate physical sockets, or full Serato parity. A clean process restart is a narrower recovery event than a crash or interrupted transaction. The declared early tone window is not evidence for every later audio interval. The whole-file checks establish finite data and retained duration/silence, not dropout-free musical acceptance.

## Evidence hashes and preservation

| Artifact | SHA-256 |
| --- | --- |
| Independent audio result JSON | `d94aef1e027335e4c6f98171c8c09a9d004e47ae0998e8a1c03c3e0d2c95c61a` |
| Parent WAV inspection JSON | `73705648081ac92d03e6bee4c1dcf3a06f580e280a5297bf65108c242d8d553d` |
| Parent MP3 inspection JSON | `a89cbe5f0fe602e5efcb92ae9ff7d4a5fd7886ce739ef3cc5f77d8ba976ec85d` |

Original downloads and ignored retained copies were read without modification. No extra decoded file was needed; FFmpeg's complete decoded output was analyzed in memory. Only this owned report and the authorized new independent result JSON were written. Host/security/package checks were not repeated in this unit.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.
