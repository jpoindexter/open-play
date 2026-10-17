# Independent Video MIDI review — 2026-10-17

Scope: actual router, mapper dispatcher/editor, control synchronization and test-only harness. No product edits, browser/native/device actions, Git or reference-parity acceptance. Applied adversarial verification, integration-level testing and least-astonishment principles.

## Confirmed integration failures (initial independent execution)

`node scripts/test_video_midi_dispatch_independent_review.mjs docs/prototype/video-midi-dispatch-independent-initial-results.json` executed two desired-state regressions; **0/2**, both genuine failures with actual extracted callbacks and the real Video router. The sampler collaborator records play/stop calls; this is a controlled dispatch result, not rendered/captured audio acceptance.

1. **A pending Video save reorders another mapping after its release.** `prototype/panels.js:1573–1577` awaits each matching Video action before continuing the same message's mappings. `prototype/panels.js:1609–1614` controls Hold sampler onset/release. With a Video Save mapping preceding a Hold Sampler mapping on Note60, NoteOn awaits the file-identity save; concurrent NoteOff calls sampler-stop; finishing the save then calls sampler-play. The retained call sequence is `[sampler-stop,sampler-play]`, final playing true. This refutes a blanket claim that Video commands cannot affect unrelated audio behavior: the router itself exposes no AudioEngine methods, but its awaited integration postpones another mapping. Invoke all matching handlers before awaiting asynchronous completions, with independent rejection handling; do not let one slow/failed target block another target's input delivery.

2. **Unrelated mapping edits rearm an already-held toggle.** Actual Add callback at `prototype/panels.js:1682–1683` calls global `resetInput`; Remove does likewise at1690-era code (`1689` at initial freeze). The router `prototype/video-midi.js:99` clears all held-edge state. Hold CC20 at127 toggles crossfader-link false→true; adding unrelated Library Browse CC21 then receiving the unchanged held CC20=127 toggles it true→false. The independent test executes the real Add callback, not a simulated direct reset. Preserve unaffected edges through edits. `prototype/panels.js:1628–1629` also resets all devices on every enumeration state update; source path has the same risk, although no actual device-change run was performed. Explicit input disconnect/reconnect may deliberately reset that input; this finding does not reject that lifecycle policy.

The initial immutable result records exact hashes: router `10850e6090471d6f72068fe319c5e1dc78367f6f2edc2faf3ced0a7136a7dd4c`, panels `b7deea43b18b2219b235cd0d0b53e3548d9f98ced1133af8345d3cecc68ffd64`, controls `33d94445ef1581371f4a6badab8112048ee38ba5ce55828bc097475cd5945255`, MIDI `bd1b0ffd6ade3f118b06f4131307ea55e420317c0f3334a1053f710aa7583dc1`. Parent is responsible for production corrections and subsequent runtime evidence.

## Earlier findings corrected before this independent dispatch run

An initial14-bit command press keyed MSB/LSB as two independent buttons, toggling crossfader-link twice for one CC pair. Parent changed commands to require7-bit absolute CC/Note (`prototype/video-midi.js:49–54`, mapper validation `prototype/panels.js:1677–1679`) and retained red/fixed controlled artifacts. Per-device14-bit continuous pair caches now use source identity (`prototype/video-midi.js:32–40`), avoiding MSB/LSB contamination between devices. These source corrections do not establish physical-controller acceptance. Parent's exact original pair-red/fixed results are separate from this independent test.

## Defended scope and refuted overclaims

- Linked crossfader rejection precedes stop/mutation (`prototype/video-midi.js:74–76`); opacity routes through existing mixer authority (`85–88`). Source inspection supports these ownership boundaries, not transfer/taper parity with Serato.
- Save/recall route through existing file-identity methods (`89–94`); the router's per-target pending Set suppresses duplicate pending commands (`61–62`, `97`). No new independent actual file-load cancellation race was executed here. Association is synchronous in the actual mixer; a deferred mock association test alone would not prove a production async association race.
- `video-controls.js` synchronizes DOM values without dispatching change/input events, so no code-path evidence of a control-sync feedback loop was found.
- The parent browser harness checks stopped deck transport plus selected audio settings, not PCM, all audio processing state or hardware output. Its scoped no-setting-change result cannot prove blanket acoustic independence, and it omitted the same-input pending-save/Sampler combination reproduced above.
- Opening the overlays dialog is not overlay-specific MIDI mapping. Fullscreen, actual MIDI devices, click-to-learn, overlay target coverage, reference XML import/export and the historical26-group scope remain outside this unit's acceptance.

## Correction verification — independent controlled execution

After parent production corrections, the same two regressions plus three boundary cases executed **5/5** in `docs/prototype/video-midi-dispatch-independent-final-results.json` using the expanded owned test. No original red result was overwritten.

- `prototype/panels.js:1573–1577` now starts matching tasks before `Promise.allSettled` at1628; original single errors and multiple `AggregateError` reasons are retained. The deferred Save+Hold test now records `[sampler-play,sampler-stop]` before Save resolves and remains stopped afterward. Tests additionally confirm a refused linked fader and two refused targets cannot suppress a valid matching sampler action, with the actual original error(s) propagated.
- Add/Remove preserve existing edges (`prototype/panels.js:1690–1696` at corrected freeze). Actual `onState` now compares source IDs and resets only removed sources (`1634–1637`); enumeration includes the existing native input ID (`prototype/midi.js:71`). Actual callback regression holds A/B, adds unrelated C, removes B and repeats held A without retrigger; reconnecting B permits B's new press. This is controlled lifecycle execution, not physical-device acceptance.
- Router scoped reset deletes only the selected source's cache/edges (`prototype/video-midi.js:99–102`); explicit full reset remains available for deliberate clear.

Corrected independent run hashes: router `ed536567cc52e0275ea3712d65c463c661920b5f3e851a9c8402e988cda45115`; panels `c690f08528ac3380c2995be86e378555b5eb9c3cd1d7afe5a32dea6e0efeecfe`; MIDI `a93852152e272a4da19c7062585e53cca20dc073f784324bfb1b542f5c739b9c`; controls remain `33d94445ef1581371f4a6badab8112048ee38ba5ce55828bc097475cd5945255`. No remaining concrete source blocker was identified in this bounded review. Current-browser acceptance still requires the corrected bytes; earlier browser results cannot be promoted across these changes.

## Independent inspection of preserved expanded browser artifacts

Parent executed `video-midi-browser-expanded-results.json` (SHA256 `9cc287903a78edbc1aeecfbcd94ab7b10a402c89684a936ae3f202e4258bc7b4`), reporting13/13 and stable before/after source identities at its earlier candidate. I independently decoded **all14 complete original PNGs** with Pillow, verified every original SHA256/dimension and recorded center against decoded pixels. Saved source-red→Negative-cyan→recalled-red centers are `[254,0,0,255]`, `[1,255,255,255]`, `[254,0,0,255]`. All pixel manifests match their original bytes.

The original619-byte generated VP8 fixture (SHA256 `1b78c1b1fcbb60c68a56fe148f553444cffc563305dc80fd1d2ee5b07e632fd8`) was decoded whole with ffmpeg: **one320×180 frame**, ffprobe duration0.001s, complete172800 RGB bytes. The static canvas emitted one frame despite the600ms recording wait. This supports a genuine static-video decoder/save/recall workflow; it does **not** establish moving-video transport. Offline ffmpeg red center247 differs from browser-decoded254 under their conversion paths; no decoder correctness/reference-equivalence conclusion is drawn.

Full offline measurements are retained in `docs/prototype/video-midi-expanded-independent-artifact-inspection.json`. The original browser harness lacked the subsequently added transition-pixel assertion, and panels/MIDI/router/harness differ from current bytes. These checks validate preserved artifacts, not a new execution of the corrected candidate or acceptance of missing behaviors.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
