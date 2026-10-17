# FX clock authority and stem-responsive waveforms

2026-10-17. **Full1:1 parity remains NOT PASSED; no native development is approved.** This checkpoint closes bounded independent browser behavior, not source-separation quality, exact reference algorithms or all keylock/Stems requirements.

## Per-unit Tap BPM — REQ178 / FX002

The [official DJ-FX manual](https://support.serato.com/hc/en-us/articles/224970027-Using-DJ-FX) documents automatic/manual Tap, range establishment and hold/X return to automatic timing. Open Play now has independent bank clocks. A first tap arms without changing the held clock; two valid taps establish manual BPM. Later steady subdivisions fold toward the first pair's range. Auto× or a600ms pointer/keyboard hold restores current routed track timing. The20–400BPM range, five-interval median,25% normalization tolerance and idle/outlier policy are declared original behavior, not recovered Serato code.

Only normalized `{mode,bpm}` scalars persist. Tap timestamps, armed state and interval history are transient. Manual timing survives track tempo changes and reload. Both new/existing effect slots and semantic Video Echo use the same effective clock, preserving existing routing/slot ownership. Master/Sampler automatic timing retains the existing Deck1 fallback; multi-channel assignment and all favorite-bank/reference workflows remain separate gaps.

Actual [audio harness9/9](fx-tempo-browser-results.json) measures Echo repeats at Auto120=.5s, Manual100=.6s, heldManual100 while the actual deck rate changes track timing to144, restoredAuto144=5/12s, edited metadataAuto180=1/3s, and independent bank2Auto180=1/3s. Three captured repeats per case decay and keep spacing within the unchanged .0005s tolerance. The measurement Worklet emits zeros and speaker routing is disconnected. Captured PCM, raw timing, settings, semantic snapshots and slot/input/output identity evidence are retained; deterministic tap timestamps in this harness are distinct from real UI gestures.

The [main UI evidence](fx-tempo-ui-results.json) executes actual first-click arming, below-hold-threshold timed tapping, manual141BPM held through a deck-rate change, full browser reload restoration,650ms pointer hold and750ms Enter hold returning Auto, short Enter arming and Auto× following the current deck. Automation overhead determines the measured tap BPM; no exact human100BPM claim is made. [Visible controls](fx-tempo-ui.png).

Independent review exposed a real propagation defect: grid/details/analysis metadata could change displayed Auto BPM while engine effects retained the old one. Shared `engine.updateFXBPMs` now synchronizes canonical deck tempos before panel status, skips unchanged values and preserves manual settings/topology. [Review](FX_TEMPO_INDEPENDENT_REVIEW.md) retains the original wrong-clock reproduction and6/6 controlled actual-handler regressions. Parent engine regressions8/8 and pure clock12/12 pass. Initial actual8/8 audio results remain [historical](fx-tempo-browser-initial-results.json); final9/9 adds the real edited-metadata path. No exact vendor estimator, sonic response, processor-internal continuity or physical MIDI acceptance is inferred.

## Stem-responsive source waveforms — partial REQ183 / STM003

Both overview and scrolling detail now reflect the signed sum of surviving aligned prepared PCM before taking channel peaks. Opposite source phase cancels; right-only stereo remains visible; mono upmix follows the existing source route. All-on/no-exitFX preserves actual original-mix routing instead of assuming ML reconstruction equals the original. The original branch now samples both channels independently. All-muted gives zero bars immediately.

Profiles build in yielding chunks, retain one maximum per256frames and at most four completed masks per deck. Selection/source/scope changes cancel pending work. Pending promises are not retained after eviction. Queries use prepared sample rate even when the original rate differs, and clamp at the original audible track end. These properties do not prove sustained four-deck performance or total browser/decoder memory limits.

Independent review found two retained boundaries that would mislead users: full mix read only the left channel, and accepted stem padding could show content after the original track ended. Both have actual production-painter/helper regressions;12/12 Node waveform checks pass. [Evaluation](../research/STEM_WAVEFORM_EVALUATION.md) preserves scope, accepted findings, geometry and timing limits.

Actual [browser9/9](stem-waveform-browser-results.json) uses real AudioEngine attachStems/mutes and stereo pre-EQ captured PCM with the same production overview/detail painters. It proves original≠reconstruction routing, cancellation, right-only subset, no-prepared and all-on right-only original, all-muted silence and restoration. The scope-label case explicitly declines FX-tail/dual-clock acceptance. Prior7/7 is [retained](stem-waveform-browser-initial-results.json).

The [real local SCNet check](stem-waveform-scnet-browser-results.json) passes1/1: preparation adapter→installed SCNet→decoded aligned outputs→strongest actual source/audio/waveform→all-muted. This is pipeline coupling, not an accuracy benchmark. [Full UI](stem-waveform-ui-results.json) imports the original6s WAV, explicitly loads Deck1, prepares from the Vocal pad and verifies all-on/all-muted/Vocal-only source scope and visible overview changes. Screenshot bounds comparison finds9,509 changed pixels between initial all-on/all-muted and2,279 between muted/Vocal; this compares actual visible screenshot pixels, not private canvas evaluation. Fresh main UI reload/reimport/preparation/all-muted/restoration also executes after the original stereo repair: [all-on](stem-waveform-ui-all-on-v2.png), [muted](stem-waveform-ui-all-muted-v2.png). UI tests stay paused; standalone captured audio is separate evidence.

Labels explicitly retain original-source context for captured exit FX/tails and Stem Slip dual clocks. Frequency-color styling, those moving/captured source representations, post-keylock/post-FX envelopes, sustained resources and reference waveform equivalence remain open. The existing SCNet reconstruction error3.025% against3%, and other-source SI-SDR−1.01dB, are not repaired by waveform correctness.

## Live keylock investigation remains open

The unchanged vendor live probe initially passed4/10; after isolating a dead append processor, it passed9/11. Both [initial](keylock-live-probe-initial-results.json) and [isolated](keylock-live-probe-results.json) failures remain. Actual browser append produces a processor error, and two future output schedules lose the intended octave interval. A matching actual Node/WASM exception identifies the chunk reader. See [architecture/reproduction](../research/KEYLOCK_LIVE_PATH_REVIEW.md).

Live rate/seek/scheduling support is a browser path, not a native-approval prerequisite. These are isolated experiments; the production engine retains its prior buffered renderer. Ordinary-deck signed scratch, keylock bypass/handoff and uninterrupted multi-deck performance remain unimplemented acceptance. A tested dependency correction and an ownership-safe adapter must precede production integration. No upstream issue or message has been submitted.


## Broader regression checkpoint

[All43 FX/waveform cohort Node scripts exit0](fx-tempo-stem-waveform-node-results.json), spanning
actual synthetic DSP and narrower pure/controlled modules. The [initial42-script
run](fx-tempo-stem-waveform-node-initial-results.json) retained one controller-fixture
failure: extracted `persist()` lacked its actual Video/FX normalizer imports in the
VM context, so storage was not written. The fixture now supplies the real imported
normalizers; actual controller14/14 and the final43-script batch execute. No assertions
or numerical tolerances were removed. This is not browser/hardware/native acceptance.


## Separate wrapper follow-up: measurement gate still fails

A separately named two-fix variant preserves the original vendor and embedded WASM.
Parent independently reran [actual-WASM14/14](keylock-live-patch-parent-node-results.json).
The browser meets11 functional assertions but **completed=false** because its full
capture skips startup frames128–383. The [error-only initial](keylock-live-patched-browser-initial-error.txt),
[fenced initial](keylock-live-patched-browser-fenced-initial-results.json) and
[explicit-arm result](keylock-live-patched-browser-results.json) remain preserved.
No full-span acceptance, production integration or ordinary-scratch completion follows.

After three related failed capture approaches, Jason's existing conditional permission
was used: a NEW local Claude Code conversation, **Keylock capture gap debugging**,
observed Fable5.1/High, session `local_4d4c6b17-ae76-40be-a92f-36b9acfe61b9`.
Exact prompt: docs/research/claude-fable/keylock-capture-debug-prompt.md. It is bounded
to new findings/isolated diagnostic files, with no existing source, Git, remote, UI or
native edits. This is a debugging fallback, not the full Claude completeness audit.
