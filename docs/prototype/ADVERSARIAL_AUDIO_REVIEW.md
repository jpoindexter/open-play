# Independent audio and local-service review

2026-10-16. Scope: current AudioEngine integration, Key Lock, four-source Stems routing, cancellation, loopback server access and process ownership. Reviewer made no changes to shared implementation. Parent implemented fixes in response to findings.

## Executed findings and retests

| Finding | Evidence | Status at review |
| --- | --- | --- |
| P1 static-file allowlist traversal exposed blocked repository paths | `curl --path-as-is http://127.0.0.1:8768/prototype/../.git/HEAD` initially returned 200 and the branch ref. No secrets read. After canonical allowlist fix/restart, both this path and `/prototype/%2e%2e/.git/HEAD` returned 404. | Fix verified by executed HTTP requests. This does not certify every possible server input. |
| P2 cancellation reported success while child kept running | A benign subprocess deliberately ignored SIGTERM. Initial `StemJobs.cancel` returned `cancelled`, but `process.poll()` remained null. After parent added bounded escalation/reaping, the same test returned exit code −9, no live process, in 2.012 seconds. | Fix verified against actual subprocess behavior. It does not prove a full real-model cancellation path. |
| P2 active-job deduplication shared cancellation ownership | Two `StemJobs.create` calls for identical bytes initially returned the same queued job ID; cancelling one cancelled both. After completed-only reuse, two active identical uploads receive independent IDs and cancellation leaves the other queued. | Fix verified through actual service methods with a queue recorder; no model inference in this test. |

## Audio race findings from code inspection

These were concrete asynchronous paths, not initially executed browser failures:

1. Start awaited resume/decode before marking processing, so an immediate pause could leave stale `processing=true` after the cancelled request resumed. Parent moved preparation state before the first await, moved decoding within try/finally and added generation/signal checks.
2. Emergency silence did not invalidate an untransformed pending start, which could start audio after silence. Parent now tracks deck state and pauses/increments generations during silence.
3. Reverse, seek, stem attachment and full-mix restore considered only `playing`; during preparation they cancelled playback intent. Parent includes `processing` in those restart decisions.
4. Consecutive rate changes could cancel the first request while the second saw no playback intent. Parent sets preparation synchronously and restarts pending unlocked as well as transformed requests.

Code inspection confirms those changes are present. Parent subsequently executed the actual browser integration page and saved its complete result; see below.

## Actual-engine integration test artifact

Open `http://127.0.0.1:8768/prototype/audio-integration-test.html` and click **Run engine integration checks**. The page imports the real AudioEngine, creates known audio buffers, runs actual keylock Workers, measures the master AnalyserNode FFT and timeline, and prints every result. The analyser is disconnected from speakers for the test; the measured audio graph is active.

Fourteen checks in the first executed revision:

- 440 Hz retained at 1.5× tempo through actual engine output.
- Reverse crosses a source's 880 Hz region into its earlier 440 Hz region.
- Keylocked loop wraps its original timeline and outputs the expected tone.
- Two rapid tempo changes leave the latest rate audible and advancing correctly.
- All Stems on initially selects the original master source.
- Vocal isolation reaches master while removing other frequencies.
- All Stems muted produces silence at master.
- Instrumental mode passes three instrument sources while removing vocals.
- All-on restore uses original audio rather than the imperfect separated sum.
- Explicit full-mix restoration returns to a single original source.
- Immediate start → reverse → seek preserves requested playback.
- Immediate unlocked rate change preserves playback and changes actual pitch.
- Pause during asynchronous start leaves no source or preparation state.
- Emergency silence defeats a pending untransformed start.

Status: **parent CUA execution passed18/18**, with full actual master FFT/timeline evidence in `audio-integration-browser-results.txt`, read and checked by this reviewer. Examples: keylocked1.5× measured439.453Hz; unlocked1.2× measured527.344Hz; all-source mute measured RMS0; vocal isolation reduced440Hz to−149.79dB while220Hz remained−40.00dB. Module-level8/8 signal results remain separately recorded in `keylock-signal-results.json`; they are not substitutes for these integrated checks.

The reviewer subsequently extended the page to18 checks: changing a live FX slot must replace its algorithm and remain audible; changing depth must preserve an existing extended Echo tail; emergency silence must clear feedback tails; and the original native-node Delay must also preserve its tail during depth changes. The saved fresh browser run includes all four additions and passes18/18; the reviewer read its full measured output. Extended Echo tail measured−34.12dB, legacy Delay tail−38.61dB, and emergency silence RMS0.

The reviewer also executed `python3 scripts/test_stem_service.py`: **10/10 passed**. `stem-service-review-results.json` records live HTTP allowlist/Origin/Host/custom-header/size rejection tests, active-job ownership and immutable-completed-cache reuse, plus a real SIGTERM-resistant process termination/reaping test. Queue ownership tests deliberately record jobs without model inference; the report labels that boundary.

## Remaining issues / boundaries

- **Final stem attachment cancellation clarified:** parent added an explicit `committing` phase. Cancellation then rejects with a meaningful activation-in-progress message, and the UI disables Cancel during the Activating status. This resolves the previously misleading acceptance of cancellation on code inspection. It is intentionally not cancellable during activation; the actual button transition still needs its user-workflow check if claimed.
- Model quality, leakage, transient quality, perceived Key Lock quality and Serato algorithm equivalence are not established by synthetic FFT tests.
- Real-model prepare → cancel → retry → playback needs the actual service/browser workflow; service-level termination tests do not establish it.
- Sampler Key Lock was subsequently integrated and its17 actual-engine checks executed; see `SAMPLER_DSP_EVALUATION.md` and the follow-up below.
- Long-file rendering, continuous tempo sweeps, low-latency hardware operation and exact reference behavior remain separate acceptance requirements. This review does not grant native-app approval.

## Extended FX independent review

The existing extended-FX suite was independently executed before and after review: initially76/76, then79/79 with the added regressions passed. That establishes its defined tests, including useful family-specific signal checks. The browser59-processor test checks finite/nonzero/non-passthrough output, not exact effect behavior. Distinct default outputs across55 names do not establish55 faithful effects. At the original implementation checkpoint only four reference parameter strips had been observed; any newly captured strips must be transcribed and compared before the independent controls/defaults can claim reference fidelity.

Additional actual-kernel counterexamples were found and saved in `fx-adversarial-results.json`; reproduce with `node --experimental-default-type=module scripts/test_fx_adversarial.mjs`:

1. **P2 Slip Roll ignores subdivision change.** `extended-effects-kernel.js` updatesT but the Slip variant does not useT and does not recapture on beat change. After a220Hz capture, changing1/2 to1/8 while880Hz enters produced exactly RMS0 difference versus unchanged subdivision. This contradicts its own written contract requiring current-fragment recapture on subdivision change.
2. **P2 Slow Roll Out loses captured ownership after12s.** At exposed Duration8, its effective fade lasts16s, but its captured fragment is read from the ordinary12s rolling ring. A new880Hz marker at12s changed the final4s by RMS0.0761; a preserved capture should be unaffected. Keep captured data separate from rolling history.
3. **P2 exposed capture length silently truncates.** Roll Length8 at60BPM requests8s; kernel caps capture at `size/3`, or4s. At5s it replayed the old220Hz segment instead of the still-capturing880Hz live segment. Its beat delay also caps at4s. Support the exposed range or constrain and disclose supported values; do not count a slider's generic audio difference as its duration contract passing.

These findings are executable independent-design mismatches, not guesses about Serato's proprietary algorithms. Broader sonic parity still requires reference captures, parameter inventory and comparison; this review does not close those gaps.

Retest after the FX owner changed capture ownership and range handling: **3/3 independent adversarial checks pass** (Slip Roll differenceRMS0.2001; late-marker leakageRMS0; eight-beat capture retains the live880Hz tone at5s with amplitude0.20 and old220Hz amplitude below1e−14). The updated JSON report records all three passes. The owner added corresponding regressions to its suite; this reviewer independently reran that suite at79/79.

Two further integration findings were reported from code paths:

- **P1 effect-type change:** the engine reused an extended processor and called its `update` method with a different name. The wrapper posted that name, while the kernel explicitly throws on name changes. The wrapper must return false on incompatible type so the engine reconstructs it. A separate-context-per-effect test never exercises this path.
- **P2 emergency silence with tails:** stopping sources leaves FX feedback/reverb state processing. `silence()` must dispose/reset active FX and preserve a clean graph for later playback. Source-only silence tests cannot prove this behavior.

Parent and FX owner implemented the type guard, graph disposal/reconstruction with FX bypass on silence, and live parameter updates for the original four effects. Code inspection confirms these fixes. The saved18-check CUA rerun establishes those actual combined paths under the synthetic fixture conditions.

## Channel FX and Stems FX follow-up

Parent saved an18/18 CUA run in `audio-integration-browser-results.txt`; this reviewer read the detailed FFT/RMS evidence.

New isolated page: `prototype/channel-stems-integration-test.html` (expanded19 checks executed by parent CUA; full result read by reviewer). It measures actual master FFT/RMS through AudioEngine for all four Channel FX and all four Stems FX. Speaker output is disconnected. No inference model is used in this routing test; synthetic stem buffers make leakage and routing errors falsifiable.

Review findings reported before fixes:

- **Channel Filter zero:** current code sets a20Hz high-pass at knob zero, rather than a neutral path. The test compares20Hz master RMS against zero-depth Dub Echo bypass, then checks bipolar low/high filtering separately.
- **Channel tempo propagation:** `channelBpm` had no assignment, so all Channel FX received the120BPM fallback regardless of deck tempo. The implementer must define and verify tempo behavior rather than assuming the effects inherit deck rate.
- **Stems echo-out semantics:** the [official Using Stems manual](https://support.serato.com/hc/en-us/articles/5700921209615-Using-Stems) states that the Echo pads mute the affected stems and apply an echo out; Braker mutes and brakes instruments. The original patch applied ongoing live Delay at55% and Braker at80%, leaving45%/20% dry audio. Changing the sound was insufficient. Tests now require post-trigger markers to disappear, a captured echo to remain initially, and braking instruments to reach silence. They do not claim exact vendor envelopes or algorithms.
- **Unrelated-pad state preservation:** rebuilding every stem effect in `updateStems()` can retrigger a previously activated Vocal Echo when an unrelated bass pad changes. The test changes the vocal source to a later marker, then changes the bass mute state; that later vocal marker must remain excluded.

The17 checks cover Filter bass neutrality and two-band response; Dub Echo tail preservation and zero bypass; Space decay and zero bypass; Noise generation/fader/zero/silence; Vocal Echo marker rejection and unrelated-pad preservation; Instrumental Echo marker rejection with vocals continuing; Instrumental Braker pitch reduction and eventual silence; Drums Echo marker rejection with vocals continuing; and final emergency silence. Instrumental FX includes drums: parent visually inspected the official instrumental echo/braker GIFs, where Vocal remains enabled and Melody/Bass/Drums disable. The17-check saved result explicitly tests this membership.


### Follow-up transport defects and live-history implementation

The initial saved Channel/Stems run recorded **17/17 actual-engine checks passing** (subsequently superseded by the19-check rerun). Examples: Filter zero bass ratio1.019; Space tail RMS0.0193; Vocal Echo later marker−191.74dB; Instrumental Braker pitch328.125Hz followed by RMS0; all three instrumental later markers below−164dB while vocals continue. This evidence predates the live-history follow-up below.

Two concrete code-path defects remained outside those initial tests:

1. Source restart created fresh empty exit modes, so an active pad retriggered a new tail after keylocked tempo/pitch/reverse/seek operations, even after its earlier exit had finished.
2. Reading the source-buffer interval before the playhead did not represent actual played history after a loop wrap or seek. It could introduce unplayed pre-loop audio into an echo.

Parent authorized this reviewer to implement fixes in `engine.js` and new `stem-history.js` / `stem-history-worklet.js`. Each stem now passes through a stereo worklet history ring after source playback-rate/pitch processing. The four-second ring records actual inputs and disconnected-source silence, retains continuity across source replacement, and captures by the trigger's audio timestamp to exclude later samples received during message latency. Missing near-start history is zero padded. Captured history is passed to the exit renderer at rate1 because it already represents rendered audio. Persistent per-deck modes prevent transport restarts from rearming an exit; disabling the pad rearms it. Emergency silence clears history. New-track history is separate.

**Executed isolated proof:** `node scripts/test_stem_history.mjs` passes4/4 using the actual processor class with deterministic stereo blocks: near-start zero padding, delayed-message timestamp cutoff, ring wrap ordering, and emergency clear. This establishes the ring algorithm, not browser scheduling or AudioEngine routing. Output is `stem-history-signal-results.json`.

**Executed actual-engine proof:** parent CUA ran the expanded Channel/Stems page and saved **19/19 passing** in `channel-stems-browser-results.txt`, which this reviewer read. Finished-Braker persistence across pitch preparation measured RMS0. The short220Hz vocal loop remained audible at−42.01dB while its unplayed1370Hz pre-loop prefix measured−192.71dB; final emergency silence measured RMS0. Initial exit checks now play600ms before triggering rather than relying on unplayed source prefix data. File timestamps confirm trigger-timestamp cutoff changes preceded this run. These tests establish the specified browser signal paths; they do not establish exact vendor timing/envelopes, subjective sound quality, or native hardware parity.

### Analysis API and integration review

Independent execution of `node --experimental-default-type=module scripts/test_analysis.mjs` passes58/58. These are generated-signal checks, not real-music accuracy or reference parity. Code inspection of the current UI confirms revision/value guards around asynchronous metadata updates, locked-grid protection, explicit replacement options, null-result preservation, confidence/provenance/partial-window labels, and actual deck gain routing.

Reported edge cases: enqueueing during the short cancel-to-settle window can leave newly queued analysis jobs stranded when the old loop breaks; `analyzeBuffer`'s Worker-absent fallback ignores a pre-aborted signal. The latter is outside the current browser Worker path. Neither issue was silently counted as passing. Tempo/key default to the first180seconds, grid phase is not a verified downbeat, and level is ungated PCM RMS/sample peak rather than LUFS/true peak.


Implementation ownership note: after the19/19 browser result, this reviewer released `engine.js` back to the parent. The history modules and regression suite are browser prototype work only; no native application was started. Active exit tails are currently stopped when transport source replacement invokes pause/stop, while their exit latch remains armed until disabled; uninterrupted tails across all transport changes and exact reference policy are separate behavior checks.


## Sampler follow-up implementation and acceptance

Parent subsequently authorized sampler Key Lock and browser bus routing implementation. `engine.js` now uses per-slot cancellable renderer requests, original-timeline cue/loop mapping, latest-rate ownership, gain updates during preparation, stop-all cancellation of pending requests, and global sampler routing after its FX chain. The sampler section of `panels.js` exposes actual Key Lock/processing state, global Master/Deck1–4 selection and Stop all. Manual references and API boundaries are documented in `../research/SAMPLER_DSP_EVALUATION.md`.

Parent CUA executed **17/17 actual-engine checks passing** in `sampler-browser-results.txt`; this reviewer/implementer read the full result. Key Lock1.5x produced439.453Hz, unlocked1.5x produced662.109Hz, cue-based completion occurred0.5013s after a0.5s expected duration, in-flight rendering cancellation left no voices/requests, gain during preparation and all-stop measured RMS0. Routing obeyed the selected deck fader and survived FX graph reconstruction. This is no longer an independent implementation review of the sampler: the reviewer authored its implementation; actual execution was performed separately by the parent.

The first sampler run exposed a test timing error rather than an accepted engine failure:150ms was shorter than the analyser's170.67ms historical window. The corrected test waits the full measured window plus two audio quanta, retains its silence threshold and passes at RMS0. Main UI interactions, device/headphone routes and vendor sonic equivalence remain separate acceptance layers.


## Pitch Play and harmonic-key follow-up

Parent authorized this reviewer/implementer to add `pitchplay.js`, actual App controls and isolated integration tests. The connected Hercules official guide supplies the three8-pad maps; its Middle arrangement conflicts with the generic article, and this discrepancy is preserved in `../research/PITCH_PLAY_EVALUATION.md`. Key Sync uses explicit independent harmonic-policy rules and refuses unknown or incompatible inputs rather than converting major/minor mode or pretending every key can match.

**Executed:**20/20 Node policy checks and parent CUA13/13 actual-engine checks. `pitchplay-browser-results.txt` was read in full: +7 measured662.11Hz,−7 measured292.97Hz, compatible−1 measured416.02Hz, and reset439.45Hz. Paused release produced RMS0 at its cue; release during Worker preparation left no source; newer-pad ownership, Play latch, already-playing continuation and Shift cue selection/creation passed. This implementer authored the module; parent performed separate browser execution. Native reference timing, hardware pad mapping, exact tie-breaking and subjective DSP equivalence remain unverified.

## Follow-up review after observed-control implementation

The parent executed all 220 observed-control contrasts and 16 original-effect
control contrasts. A fresh reviewer then reproduced four failures in the real
extended-effects kernel, proving those short tests insufficient for acceptance:

- P1: Multi Tap Delay Feedback90 had return gain greater than one. A 0.1s DC pulse
  grew during 40s of silence; internal feedback exceeded26million and output clipped.
- P2: updating Even-pattern timing to T=8s allocated only18.2s of history and lost
  its24s third tap; a fresh final-state processor rendered it.
- P2: Direction was applied after a wrapped base phase, resetting fractional
  sweeps at each base beat. Equivalent sweep-velocity settings diverged.
- P2: Stretch exit mode wrapped reads through the initial one-beat loop extent,
  dropping a source marker at0.7s that Vinyl mode reproduced.

All four corrections now pass 33 targeted kernel checks, the full 80-check kernel
suite, and nine real browser AudioWorklet regressions. Multi Tap feedback decays
over 45 seconds in all three tested patterns; the updated 24-second tap matches
fresh construction exactly; four equivalent sweep velocities differ by zero;
Stretch reproduces the late marker forward and backward while rejecting later input.
The frozen runtime also passed 220 control contrasts and 59 effect graphs.
No sonic parity or universal stability pass is inferred.

The initial browser adversarial result was 8/9 and remains saved in
`fx-adversarial-browser-results-initial.json`. Its update test posted before the
offline processor had started, retaining the old two-second tap. The revised test
starts rendering, suspends at 0.256 seconds, posts the public update, then resumes
before its impulse at 1.024 seconds. Strict assertions remain: difference below
1e-6, old tap exactly zero, third tap present at 25.024 seconds. Actual browser
execution passed 9/9; see `fx-adversarial-browser-results.json`.

Separately, the Stems transport-tail fix passed27/27 actual browser checks after
review required a real natural-end path and a fresh audible emergency-stop fixture.
Deferred-capture lifecycle checks against real engine methods with mocked audio
dependencies found no resurrection after explicit pause, silence or track load;
these are narrower than the parent's acoustic tests.
