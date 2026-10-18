# Natural48k real Stems, keylock, tempo and Stop —171

The ordinary browser AudioContext selected48000Hz without an options override or production setting change. The normal MP3 Import/Load/Prepare workflow decoded326400stereo frames/6.8s, sent a2611244byte float32WAV at48000Hz, ran the real local model and decoded all four separated outputs back to326400frames/48000Hz. Alignment error is exactly0frames. No production failure was observed and no production patch or extra regression matrix was introduced.

## Input, model and conversion identities

Research source remains the same private SDRNR6.8s MP3/SHAcb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3; it is not a new musical holdout. Natural48000canonical input SHA8bd922074bc1df1e87f00cb967ce6e30c7183f1eed41d74763e9613c5f496df7 differs from prior44100SHAafbbca4ce1d2268bdf9020087983b4808582f9dbcc03073bc8a262a26144e9c5. Actual service input.wav independently matches the new byte count/hash/rate/frame count. Existing prior job8266a41f62fc4fc5b92808dd3d988cec retains all9file bytes/SHA/mtimeNs.

New normal UI job539aeee35cbe4518a7800f4ebbb004c5 has distinct cache key840cff788f9abaa8ddc333af0d956f09afb87d24430ea816892931921aa421a4 and uncached model execution. SCNet-large official weights SHA719e5abb8ed920305dad546ac3cd6fb0b1e9c3092d14ce21827bfc0423af3070/revision5d95bf96b19c3eede63248d171efeca8e3abb948; Torch2.5.1CPU. Inference7.207185s, total8.713870s. Worker output files are actual float32/stereo299880frames/44100Hz/6.8s with verified hashes. The browser's normal decodeAudioData converted each to48000Hz/326400frames; complete decoded channel samples/hashes retained privately, with no original/Stems mutation afterward. Current new manifest/cache receipts retain exact output/model/runtime identities. Existing installed weights were used; no download or repeat of the old44100inference. This does not accept source-attribution or model perceptual quality; previous raw/projection/source-quality distinctions remain.

## Executed actual workflow

Normal Import/Load/Preparation, selected Melody/Bass/Drums (original/Vocal0), actual grid120–150–90/Smart Sync, raw Play/Pause, paused keylock/key+3 setup then Play, actual relative+6to127.2BPM/1.06rate and Stop. One unforced-rate vertical slice; no direct transport-result injection/model completion mock. Physical output muted, controller not needed.

Eight whole.3s/14400-frame channel recordings each contain113contiguous producer quanta, finite samples and exactSHA checks. Playing output exceeds1e−5RMS, Stop after1s retains its source position/no voice/request and complete stereo peaks0under1e−7. Raw selected output matches the actual retained browser-decoded other/bass/drums sum within3.589e−8relativeRMS/1e−4 in the declared.05–.25s window. The source starts at its known integer native frame and rate1before the first warp marker; no fitted lag/gain/phase, resampled capture or dropped samples. Keyed+3/tempo output is positive and source clocks agree exactly with independent known-grid/observed-anchor equations under10ms. This proves transport/control/routing at natural48k, not actual musical pitch accuracy, acoustic routing, context migration or all effects/features at48k.

Original14582227bytes/SHA1677c8b5f675947133324d1b8f0ed9e67f309b329abdb318681b5a437e58e954 stays private and immutable, including complete decoded Stems and recorded PCM. All22declared served module hashes are stable; exact observed source capsule retained, not whole-app identity. Actual DOM receipt/screenshot saved. The first inspection reused161's WAV helper, which explicitly requires44100; it rejected the correctly encoded48000input before audio grading. The false initial-inspection record and initial inspector copy/hash are retained. A rate-aware independent float32WAV parser reads the same actual file/capture; no product changes, live replay, additional inference or threshold relaxation. The full recording passes corrected inspection.

## Reproduce inspection

```sh
python3 scripts/inspect_natural_rate_171.py local-evidence/stem-resource-150/browser-exports/b601d3dbddca42b4a8f83cb5bb3cb645.json /tmp/natural-rate-171-reinspection.json --sources local-evidence/natural-rate-171/before-source-capsule/prototype
```

Output must not already exist. Raw music/decoded Stems/PCM/cache artifacts remain ignored. Public stats, source/input/model/output hashes and archived card descriptions contain no audio payloads.

## Records and next obligation

STM-001/003and DEK-018were near Trello's description limit. Their fresh complete descriptions are archived byte-for-byte under docs/delivery/trello-history/*-before-plan171.md with plan171-archive-receipt.json. Their formal acceptance/dependencies/model/source blocks remain verbatim in the updated card, with explicit full-history links. No completion/list/formal status/model/effort changes. Eight affected evidence rows include local MP3 import, playback, tempo, keylock, Sync and Stems/cache.

Next actual Auto Loop behavior across a warped grid: app.jsloop/half/double calculates end from base seconds-per-beat. Current known grid's8beats from0end4.4666667, while base120BPM8beats gives4seconds. Establish exact intended semantics from existing official/cached reference and, if needed, installed app evidence before calling this a parity defect. Then execute actual normal loop/half/double controls, preserve before recordings and fix only an observed discrepancy. See handoffs/stems-171-warped-auto-loop-followup.md. This source concern was not executed in171. Current natural48k job may be reused if canonical input matches; no unnecessary model job.

Full110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock objective active; all full-parity flagsfalse. Default48k full-feature/migration/live activation/pitch/perceptual/source quality/resource/reference/native/hardware remain separately open. Frozen0.1.23/tested272Alternative/profile/launchers/user8768/18775/18768 preserved, controller may stay unplugged. No native package/Claude audit. Original prompt/models/effort/earlier false gates retained.
