# Retained-window, source-rate and mapped-pitch Stem banks — checkpoint 147

18 October 2026. **Three actual browser paths passed their declared, scoped audio criteria against production checkpoint `93191d97f1c1bd38579eadee7f43a43f6daf96c2`. No production code changed in this checkpoint. Full Stems/keylock, musical quality, native/hardware and Serato parity remain open.**

## Nonzero origin and retained-window replacement

The new owned `stem-bank-window-harness.html/.js` boots the production app, starts the actual deck through Play, attaches actual decoded buffers through production `engine.attachStems`, then selects Vocal mute through the actual Stem pad. It repeats attachment into the other inactive bank, restores/mutes pads and stops through the actual controls. The attachment call is direct harness instrumentation; these runs do not repeat the Prepare/API/cancellation workflow already executed in checkpoint 146.

The generated original is eight seconds of stereo 330/550 Hz tones. Playback starts at source position 4 seconds, rate 1.1, with keylock enabled. The live group origin is 2 seconds. Preparation waits until the retained window has dropped beyond that origin. Both attachments preserve the same voice, group, eighteen-channel processor and five public outputs. A wrapper records actual `replaceBufferChannels` frame addresses and returns the unmodified production acknowledgment. All physical destinations remain muted.

| Actual browser path | Original 44,100 Hz, shift 0 | Original 22,050 Hz, shift +3 |
|---|---:|---:|
| AudioContext rate |44,100 Hz|44,100 Hz|
| Retained source start at first preparation |2.5 s|2.49997934510806 s|
| First bank processor frame range |22,050–264,600|18,541–222,502|
| Repeat bank processor frame range |22,050–264,600|37,082–222,502|
| Chunks, first/repeat |11 / 11|12 / 11|
| Minimum 10 ms RMS ratio, L / R |0.9757297572 / 0.9989104273|0.9897990936 / 0.9959470462|
| Maximum adjacent sample jump, L / R |0.0093356563 / 0.0154662589|0.0112077748 / 0.0185907949|
| Longest near-zero run |0 / 0|0 / 0|
| Measured carrier Hz, L / R |329.9999207 / 550.0001303|392.4675288 / 654.0692577|

The shifted repeat window advances again to source 2.9999586902 seconds while preparing; its later start is expected and is checked against the actual acknowledgment, not the earlier snapshot. With pitch factor 1.1892071150, the translated final source address is 8.0000218028 seconds, within one prepared frame of the eight-second endpoint. No PCM is trimmed to repair this padding.

Each run retains 110,250 frames per channel in 862 contiguous render quanta. Thresholds are fixed at RMS ratio ≥0.85, sample jump ≤0.03, near-zero duration ≤1 ms and relative carrier error ≤1%. The existing first-50 ms/last-100 ms continuity metric exclusions are unchanged; every retained sample is finite/hash checked. Frequency uses the fixed final 500 ms with a Hann window and logarithmic interpolated FFT peak. There is no fitted alignment, gain correction or PCM repair.

Clock differences from the declared source-clock formula are zero at both attachments. All-pad mute and Stop direct captures are exact zero; restore is nonzero. Original decoded hashes are unchanged. These periodic-tone and source-clock checks **do not establish sample-exact audible cursor position** or repair the retained failed native cursor cohort.

The 22,050 Hz run generates a new original at that rate but decodes the already completed SCNet cache prepared for the corresponding 44,100 Hz tone. This deliberately exercises the direct buffer/format/routing path. It is **not** automatic input-fingerprint/cache matching, new model inference, musical separation quality or arbitrary sample-rate acceptance.

## Variable tempo map, bank switch, Key+ and Delay

The new `stem-variable-banks-harness.html/.js` preserves the historical mapped-pitch harness and its receipts. It updates structural assertions to eighteen internal channels/nine gains/five public outputs and adds a same-instance bank 0→1 replacement while the actual mapped deck is playing. Its prepared buffers are authored fixtures, not model output: opposing Vocal/Melody 550 Hz components, Melody 330 Hz, Bass 110 Hz and short 3 kHz drum bursts. The original equals their sum.

Actual Smart Sync markers exercise rates 1, 0.8 and 4/3 with three pitch-map nodes, initially keylock off and key shift +2. This executes the mapped-window copy path during bank replacement. Later the actual Key+ control enables keylock and moves to +3. **That later key change intentionally replaces the voice; no same-instance or gap-free transition claim is made for it.** Fixed steady-state windows exclude that transition. Actual Vocal mute supplies a dry Melody positive control; the actual normal FX controls enable Delay at 50% depth, deck 1 routing and a half-beat interval. Muting all Stems leaves an audible wet tail that subsequently decays.

The whole actual master MediaRecorder file was decoded without fitting by FFmpeg and inspected independently with the unchanged `scripts/inspect_stem_resampled.py`. It contains 830,844 finite stereo frames at 44.1 kHz, 18.84 seconds. Five steady-state coherence sections pass: maximum opposing-component/carrier ratio 0.0000189275 versus a 0.01 ceiling; maximum carrier error 0.00124355 Hz versus 1 Hz; maximum Bass/carrier ratio 0.0000329660. The dry Melody positive control's minimum opposing/carrier ratio is 1.33269336, above the existing 0.5 floor.

Delay-tail RMS is 0.0325090858/0.0324508789, above the existing 0.0005 floor. Late RMS is 0.00000531902/0.00000532229, below the existing 0.00001 ceiling. This codec/Delay late window is **not exact zero**. The whole recording and decoded PCM are hash checked; no timing/gain/pitch fit or synthesized evidence substitutes for rendered output. This accepts the exercised Delay composition only, not all 55 effects or reference sonic equivalence.

## Evidence and reproducibility

- `stem-bank-window-147-44100-shift0-results.json` and `stem-bank-window-147-22050-shift3-results.json`: independently derived summaries, addresses, whole-capture identities, source hashes and explicit nonacceptance flags.
- `stem-bank-variable-map-147-workflow.json`: actual app workflow, recording payload removed; complete original retained privately.
- `stem-bank-variable-map-147-audio-results.json`: independent whole-recording inspection and actual map/bank/key-change geometry.
- `stem-bank-window-147.png`: stopped browser UI after the shifted source-rate run.
- `scripts/inspect_stem_bank_window.py`: strict current-file/source geometry, bank addresses, clock, whole PCM and unchanged continuity criteria. It rejects a report if any declared contract fails. The historical inspectors remain intact.

Original JSON, render PCM, WebM and decoded PCM remain ignored under `local-evidence/stem-bank-window-147/`. Public reports contain no raw audio/base64. Source before/after hashes match current production files. No broad FX/coordinator matrix was rerun because production bytes did not change. No native packaging, controller capture, MIDI output or hardware acceptance occurred; frozen 0.1.23 and its tested 272-map profile remain untouched.

## Remaining work and re-entry

Next: actual mixed two-deck staged/cold activation, immediate first-pad behavior and cancellation/rollback with per-deck rendered audio; then bounded CPU/memory observations for the eighteen-channel layout. Existing controlled mixed-owner tests are not acoustic evidence. Continue other input/cache/model transitions, musical quality/reconstruction failures, reverse, loops, mapped transport, Stem Slip/scratch and native/physical/reference acceptance. Do not turn these three paths into an all-format, all-rate or exact-cursor claim.

The terminal goal remains 110 feature groups, 522 requirements, nine beta deltas, 26 release checks, all 55 extended effects and actual Stems/keylock. All full-parity flags remain false. Factory mapping coverage is unchanged: 19,252 assignments across 145/197 definitions; Hercules 356 assignments with 18 unresolved items. Official Serato source authentication and Alternative mapping author/project labels remain distinct from runtime and physical acceptance. Full Claude audit remains unlaunched and the handoff preserves the complete original prompt.

Per-feature recommendations are preserved, not revalidated as live account availability: STM-001 Codex `gpt-6.1-sol`/high, Claude `claude-sonnet-5`/high; STM-003 Codex `gpt-6.1-sol`/xhigh, Claude `claude-opus-5`/high; DEK-007 Codex `gpt-6-astra`/high, Claude `claude-opus-5`/high. These metadata do not launch agents.
