# Functional prototype review — 16 October 2026, second pass

**Full Serato parity remains open. Native development is not approved.** This pass
replaces several former state-only demonstrations with executed browser behavior.
It does not classify the whole feature inventory as implemented. The previous
[review](REVIEW_REPORT.md) is a dated baseline, not current acceptance for changed code.

## Executed evidence

The interactive harness at `/prototype/behavior-tests.html` ran in the Codex in-app
browser on this Mac. Click **Run audio and behavior tests** to reproduce. Its audio
is disconnected from the speakers. The saved [result log](behavior-results-2026-10-16.txt)
records **20/20 passed** at 13:50 UTC after the final routing fixes. These are actual Web Audio renders and module
integration paths; they are not mouse/keyboard automation or a comparison to Serato's
proprietary audio algorithms.

| Area | Implemented behavior and executed observation | Remaining limit |
|---|---|---|
| Reverse | Reverses decoded PCM; descending transport 3.000 → 2.845 seconds; main UI reverse reached 0 and stopped | Scratch response, device jog behavior, sonic transitions and all reverse/repeat combinations unmeasured |
| Slip | Loop/reverse/cue manipulation retains advancing timeline. Harness released a 50 ms loop at 1.229 s; beyond-end release stops at track end | Compound/nested manipulations and exact device-specific semantics unaccepted |
| Temporary cue | Hold audition, release return, Play latch, cancellation of pending start | Module paths executed plus UI quick-key path; all modifier/pointer combinations still need reference comparison |
| Hot cues | Actual seeks, paused audition/release and playing Slip restoration; recorded cue positions feed Flip | Chronological sort/color behavior and all reference edge states remain open |
| Sampler | Trigger, Hold, On/Off, independent repeat, actual pitch/rate, gain/volume/mute, cue/loop start, focused-deck tempo ratio | Hold/mute/cancel output measured; quick keyboard Hold release UI showed Stopped. Every Play From combination, shared file gain semantics, key-preserving stretch and independent headphone routing remain unaccepted |
| Flip | Timed cue/reverse playback, loop, snap duration, six saved per-track slots, load/rename/delete controls | Main UI recorded cues at 0 and 3.6 s; replay jumped from 0 to 27.5 s. Saved slot survived reload. Harness enforced six slots. Censor-hold, On arming semantics, variable-tempo recording, sample accuracy and native metadata remain open |
| Slicer | Eight real slice auditions, domain 2/4/8/16/32/64 beats, quantize 1/8–1 beat, domain-loop control, release returns to timeline | Harness measured 2.060 s slice → 1.123 s underlying position; UI domain/quantize and quick-key release exercised. Multi-pad chords, tempo changes during hold, hardware quantization/LEDs unaccepted |
| Crates | Nested tree, parent membership, collapse, manual ordering, favorites/colors, cycle rejection and reparent-on-remove | UI parent displayed three Warm up tracks; collapse removed child, expansion restored it. Filesystem interoperability and full drag/drop combinations unaccepted |
| Smart crates | Multiple all/any rules, 18 fields, string/numeric/date comparisons, live or cached membership | UI BPM≥124 AND album contains night yielded 2 tracks; OR warm yielded 8. Invalid numeric handling and nested cycle guard passed. Not all field/operator/reference combinations accepted |
| FX | Four independent processors: LPF, beat-timed feedback Delay, convolution Reverb, LFO Wah. Two units route through decks/sampler/master | Offline rendered energy/tails measured; actual engine route RMS 0.1825 → 0.0177 through LPF. Main UI enable/select paths exercised. Other 55 effects have disabled DSP enable; they are not substitutes or accepted implementations |
| Video | Local video decode/play, two sources, canvas crossfade/wipe/zoom, text/image overlay, audio-linked transport/crossfade, canvas+master recording | Imported original 6 s MP4; playback advanced. Downloaded 1,921,409-byte capture: VP9 640×360 + stereo Opus 48 kHz. Re-imported capture played. Source-video audio is muted; full codec matrix, exact vendor catalogs, HD, karaoke, Syphon, external display and AV drift remain open |
| MIDI | Standard Web MIDI input connector, timestamps, channel/CC/note/pitch-bend decoding, 7/14-bit and two relative formats, learn/add/export/persist mappings that call real browser controls | Main UI synthetic mapping started Deck 1. Parser tests passed. **Actual browser access timed out after 10 s; no physical MIDI message or output/LED claim.** No SysEx sent |
| Reset | Reset clears only prototype storage and suppresses before-unload re-saving | UI reset then second reload retained original four crates and empty cue; previous reset bug is fixed in this executed path |

## Numeric audio evidence

- LPF: rendered 6 kHz output/input energy ratio `3.365e-7`.
- Delay: first echo at `0.25 s` for half-beat at 120 BPM; second echo energy `0.16009`.
- Reverb: early tail energy `0.071047`; late tail `0.000023`.
- Wah: output/input energy `0.004368` with the tested modulation settings.
- Sampler: master RMS meter `0.1164 → 0.0000` after stop; muted output below `0.01`.

These establish nontrivial signal processing and actual silence/release behavior.
They do not establish perceptual quality, absence of clicks, native latency,
physical output channel separation, or numerical equivalence to Serato.

## Additional UI checks

Main app CUA checks also covered: saved Flip slot after reload; unavailable Bright
Reverb DSP enable disabled; LPF/Wah enabled in main FX unit; Slicer domain and
quantize selection; sampler Hold quick-key release and On/Off Playing → Stopped toggling; MIDI synthetic provenance;
local video file pickers, capture download/re-import; backup before reset; and
reset persistence. Browser error log was empty at the checked checkpoints.

UI checks ran at the in-app browser's narrow 637 px width. After closing the temporary
test tab, the 1512×982 override applied to the deliverable tab. A fresh full-page
desktop capture was inspected and saved as `screenshots/functional-desktop-review.jpg`.
This confirms the rendered overview at those dimensions, not exact reference pixels.

## Defects caught during this pass

- Smart-rule edits initially retained an empty value: submit now reads actual form values.
- Leaving Slip after the underlying track ended restarted from zero: boundary seeking now stops.
- Pending deck/sample starts could outlive release: cancellation tokens invalidate stale starts.
- Reset re-saved old state during unload: reset suppresses that persistence call.
- Reverse Repeat previously restarted at the wrong boundary: code now starts at the end;
  its full UI repeat-cycle acceptance is still pending.

## Evidence paths and reproducibility

- Test code: `prototype/behavior-tests.js`, `prototype/behavior-tests.html`.
- New modules: `effects.js`, `flip.js`, `holds.js`, `library.js`, `midi.js`, `slicer.js`, `video.js`.
- Original test video on this host: `/tmp/open-play-video-fixture.mp4` (generated with ffmpeg testsrc2, 320×180, 24 fps, six seconds).
- Recorded video: `/Users/jasonpoindexter/Downloads/open-play-video-mix.webm`.
- Preserved test metadata: `/Users/jasonpoindexter/Downloads/open-play-library (1).json`.
- Candidate hashes: `candidate-hashes.json`; exact code revision pinned in Claude handoff.

No user music, proprietary app binary, extracted vendor assets or credentials were
added to Git. Fixture video and downloaded captures are not repository dependencies.

## Reference contracts rechecked

- [Playback Controls](https://support.serato.com/hc/en-us/articles/233088528-Playback-Controls)
- [Slip Mode](https://support.serato.com/hc/en-us/articles/235191207-Slip-Mode)
- [Temporary Cue](https://support.serato.com/hc/en-us/articles/233435527-Temporary-Cue)
- [Sampler Play Modes](https://support.serato.com/hc/en-us/articles/227629728-Sampler-Play-Modes)
- [Sampler Play From](https://support.serato.com/hc/en-us/articles/227629828-Sampler-Play-From-Selector-Advanced-Mode-Options-only)
- [Sampler Pitch Controls](https://support.serato.com/hc/en-us/articles/227564867-Sampler-Pitch-Controls-Advanced-Mode-only)
- [Sampler Gain](https://support.serato.com/hc/en-us/articles/227564887-Individual-Sample-Gain-Advanced-Mode-Options-only)
- [Crates in 4.0](https://support.serato.com/hc/en-us/articles/227561407-Crates-in-Serato-DJ-Pro-Serato-DJ-Lite-4-0)
- [Flip User Guide](https://support.serato.com/hc/en-us/articles/203157550-Serato-Flip-User-Guide)
- [DJ-808 guide: slicer domains and quantization](https://support.serato.com/hc/en-us/articles/10173347873935-Roland-DJ-808-Quickstart-Guide)

Implementation uses browser primitives described by [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
and [Web MIDI](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API).
