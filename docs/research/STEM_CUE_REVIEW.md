# Independent Stem Slip cue review

Reviewed 2026-10-17. Read-only production review; no controller, UI, native package, or Git operations. The existing desktop 0.1.1 artifact was not changed.

Source `prototype/engine.js` SHA-256: `a05bd18fe63d6ad0aee041870699a9c6d7ec9a424370798babf6d69f902b5f57` at both start and end of the controlled run. Line references below refer to that source.

## Verdict

No remaining concrete defect was established in the reviewed routing/lifecycle changes. Six controlled checks passed. This is graph and control-method evidence, not actual browser PCM, timing, headphone sockets, native runtime, or Serato sound equivalence acceptance.

The parent owns the separate actual AudioEngine/MediaRecorder browser tests. Do not substitute this report for those results or combine the counts into an end-to-end acceptance total.

## Evidence

- **Executed, controlled graph:** four per-stem inputs tee once into the independent cue strip before the master crossfader route gains (`engine.js:977–980`). Stem Slip sources use those inputs (`engine.js:1373–1379`), as do captured exit effects (`engine.js:1038`). At opposite crossfader the selected vocal master route settled effectively to zero while the cue strip gate settled to unity; the ordinary cue path was muted. The selected/nonselected master routing remains in `engine.js:628–650`.
- **Executed, controlled graph:** Channel Filter activation and neutralization reconnect both strips exactly once. The common strip routine targets `monitorTap`, while `applyChannelFX` copies channel value and BPM to the cue strip (`engine.js:685–730`). Active non-Filter processor sound and tails require actual browser audio evidence.
- **Executed, controlled parameters:** EQ changes after strip creation reached the same target on both strips (`engine.js:668–671`). The first-created strip during an active EQ target ramp also reached the requested target, rather than retaining its intermediate initial value (`engine.js:946–949`). The controlled construction copied about −0.774 dB at 1 ms, and both strips reached −12 dB at 1 s.
- **Executed, controlled lifecycle:** replacing a stem track disconnected all old input tees, master routes, and history output edges, while retaining one deck cue strip (`engine.js:958–963`). New track tees reached the retained strip once each. This does not measure retained processor memory or CPU.
- **Executed, controlled lifecycle:** global silence disposed a captured exit effect, removed voices, reset both strip Channel FX routing, and muted the Stem Slip gate (`engine.js:1679–1702`). Actual processor tail quietness remains a PCM assertion.
- **Code-path:** monitor PFL selection and trim occur downstream of the selected deck cue tap (`audio-monitor.js:27`, `audio-monitor.js:63`); master output and headphone output use separate merger inputs (`audio-monitor.js:51–52`). Stereo physical layout has no headphone connection. This review did not operate a physical output.

## Candidate refuted against current source

Submitted candidate: a cue strip created while EQ automation is settling could hold the current AudioParam value indefinitely. That candidate applied to the earlier construction design; the parent added persisted EQ targets before this controlled test executed. Current `mix()` records those targets (`engine.js:669`) and new cue strip construction applies them (`engine.js:949`). The current-source regression passes. There is **no executed old browser failure** for this candidate, and it must not be reported as one.

Findings submitted: 1. Confirmed unresolved: 0. Refuted against current source: 1. Review status: complete for this bounded source/control review.

## Reproduction and limits

Run `node scripts/test_stem_cue_review.mjs`. It imports actual AudioEngine methods and uses controlled graph nodes and exponential-target AudioParam semantics. Results are written to `docs/prototype/stem-cue-independent-results.json` with source hashes. The initial test used an incorrect exact-zero assertion for an exponential approach; that test assertion was changed to a numerical tolerance. It was not an app defect.

Browser acceptance should retain full audio captures for vocal and instrumental Stem Slip at opposite crossfader, active EQ/filter/Channel FX changes, exit effects, and global silence. First-frame continuity, output-device changes, socket mapping, round-trip latency, and reference sound quality remain separate gates.

Skills applied: use, dec-quality-testing, adversarial-verify.
