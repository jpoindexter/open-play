## Outcome and acceptance
Smart sync state machine and relative-pitch takeover
Exercise armed, beat, tempo, disengaged-relative and absolute states, including a missing-grid load; sources 227627128, 227627168, 227561927, 227561947.

## Evidence
- [Beat Sync](https://support.serato.com/hc/en-us/articles/227627128-Beat-Sync)
- [Tempo Sync](https://support.serato.com/hc/en-us/articles/227627168-Tempo-Sync)
- [Disengage Sync](https://support.serato.com/hc/en-us/articles/227561927-Disengage-Sync)
- [Relative Pitch & Tempo Control (Smart Sync)](https://support.serato.com/hc/en-us/articles/227561947-Relative-Pitch-Tempo-Control-Smart-Sync)
Proposed scope; exact-version and runtime checks pending.

## Dependencies and work
- [ ] Reference evidence and subfeature inventory
- [ ] Screen, controls, states, shortcuts and errors
- [ ] HTML behavior after inventory gate; identify simulations
- [ ] Native stage N2, only after Jason approves prototype
- [ ] Execute acceptance on exact candidate and attach results
Dependencies: reference → specification → prototype → approval → native → acceptance. Physical device tests required for hardware claims.

## AI recommendation — 2026-10-16
Primary Codex: gpt-6-astra; reasoning high.
Claude Code alternative/reviewer: claude-opus-5; effort high.
Reason: DSP and transport require numerical reasoning backed by measurements.
Escalation: After two materially different failed approaches: obtain missing evidence, then escalate one effort/model tier; never substitute reasoning for a hardware test
Review: Fresh evidence review; Claude is an optional alternative, not automatically invoked.
Source: host Codex catalog; https://code.claude.com/docs/en/model-config and installed CLI 2.1.222. Account invocation untested. Cost unknown; measure usage. Recommendations do not authorize an agent launch.

## Actual status
Local desktop testing authorized. Scoped implementation/evidence exists; full native and reference acceptance remains unverified. Current feature-specific audit below governs older checkpoint prose.

Plan: https://github.com/jpoindexter/open-play/blob/main/FULL_BUILD_PLAN.md
Feature ID: DEK-018.

## Source links — 2026-10-16
- [Smart Sync (Using Beatgrids)](https://support.serato.com/hc/en-us/articles/227627088-Smart-Sync-Using-Beatgrids)
- [Beat Position Indicator](https://support.serato.com/hc/en-us/articles/227627108-Beat-Position-Indicator)
- [Arm Beat Sync](https://support.serato.com/hc/en-us/articles/227627148-Arm-Beat-Sync)
- [Loading tracks With No Beatgrid](https://support.serato.com/hc/en-us/articles/227561967-Loading-tracks-With-No-Beatgrid)
- [Sync Preferences](https://support.serato.com/hc/en-us/articles/227785587-Sync-Preferences)
Crosswalk: https://github.com/jpoindexter/open-play/blob/main/docs/research/MANUAL_FEATURE_CROSSWALK.md


---
Historical parity updates through plan102 (verbatim, including earlier failures): docs/delivery/trello-history/DEK-018-before-plan103.md in the private Open Play repository. Plans92–102 add loop-aware Simple/Smart Sync, audio-thread warp loops, shared prepared tempo handoff, paused BPM and bounded resampled keylock. All evidence remains scoped; exact Serato reference, full music, native/hardware and races remain open. Original criteria, sources and model routing above preserved.

---
2026-10-18 — plan103: actual two keylocked-deck Smart Sync, secondary+2semitones, source120→150→90BPM, then shared124.8BPM. Whole13.74s stereo master retained; independent22pulse pairs across4stages max2.312925ms vs10ms, global carrier max0.000517Hz vs1Hz; zero quiet1ms bins through shared-tempo preparation. Identical future voice anchor on both decks; GUI366.3ms readiness is metadata, not acoustic latency. docs/prototype/live-sync-pitch-browser-{results,inspection}.json. No native/hardware/music/arbitrary-marker/race/full-reference acceptance; all full flags remain false. Human away, no capture. Preserve model routing and historical failures.

---
2026-10-18 — plan104: actual native0.1.15 source02ddc758/ASAR7430617a,29served hashes match. Normal GUI2keylocked decks/secondarykey+2→+3, Play/Sync124→shared133.9BPM; actual REC/Save46.38s stereo finite/nonzero master602103B SHA1d94e7a4. This grades signal generation/export, not pitch/phase/acoustic/hardware/full parity.272mapping export byte-identical to14; named Hercules connected,1/2master+3/4cue reapplied; stopped/resetA/B,levels0.8,crosscenter. Current launcher15;14/versioned launcher+stable profile backup preserved. Human away; no timed capture. Next human action leftPlay→RCA sound→samebuttonstop. Evidence: docs/prototype/desktop-0.1.15-playback-{package,observation}.json; TRY_CURRENT_DESKTOP.md. All full flags remain false; original model routing/history retained.

---
2026-10-18 — plan106: reproduced unlocked warped+2 pitch error1.069332Hz>1Hz. New bounded piecewise source↔prepared SRC map follows local rate with zero spectral transposition. Actual final2deck13.74s wholemaster SHA6270b38f:4sections/shared124.8BPM,22pulse pairs max1.270ms,global pitch max0.000359Hz; no measured handoff quiet bins. Five-source unlocked→locked key change exposed real LateScheduleError from redundant8s refill after choosing explicit anchor; required coverage now permits deferred top-up. Final5source18.96s SHA5a1a9d97 cancellation/Bass≤0.003692%/0.003391%,carrier≤0.001449Hz,actual Delay tail→late decay pass. Old recordings/source capsules and separate floating metadata assertion retained. Direct-helper future Pause/current-factor underrun margin need focused follow-up; no broader edge/music/model/physical/reference/full acceptance. Native15unchanged/human away/no capture. docs/prototype/variable-pitch-warp-* and stem-variable-pitch-*; plan106/handoff. Existing model/effort routing preserved.

---
2026-10-18 — plan107: direct actual-WASM mapped futurePause/restart0/1→1/1. Before futurestart, paused nominal rate differs from local map; inactive commands now bypass audible-map equality. Queued1s Play cancelled at0 gives exactzero signal through1.5s, same owner remains alive and restarts at2s with493.883313Hz vs493.883301Hz expected/RMS0.084842, dispose0PCMbytes. Controlled serial clock/ports and simplified gain graph; no new GUI/browser/native/physical/music/full parity acceptance. Underrun lead now uses current mapped factor (source-level, real pressure/underruns unverified). Native15/profile untouched, human away/no timed capture. scripts/test_mapped_keylock_pause.mjs; docs/prototype/mapped-keylock-pause-{before-results,results}.json. Plan/handoff updated, old evidence/model routing preserved, full flags unchanged.

## Plan111 — non-loop warped Smart Sync Censor (18Oct2026)
Reversed source coordinate plan crosses markers into their original left-side BPM. Existing bounded processor handles locked and unlocked pitch; original+four prepared sources share ten channels/five outputs. Backing lease keeps the exact old forward voice/grid running under silent pull and restores it without seek/rebuild. Whole decoded/reversed buffers are outside processor-copy accounting.

Actual grid/Setup/Key+/Sync/U/Stem-pad workflow passes in both keylock states/+2. Reverse90→150→120 sections use4/3→0.8→1; Beat Sync remains engaged; original forward voice/grid returns with matching10ms state clock (not audible-cursor/sample-phase proof). Vocal mute survives return. Whole14.939977s stereo241479bytes SHA0591455521280d648a074c6e7b333a17496195605f616862947fc63afe7dff58;14fixed1Hz/RMS windows maxerror0.006861Hz; four mute ratios0.667517–0.668096.11stable hashes. Focused reverse-plan/backing contract executed. No model inference/native/physical/full acceptance.

Initial scheduled-mute/setup and rapid Sync/Play premise failures retained; final setup observes armed/Beat Sync first, unchanged criteria. Rapid Sync→Play is a separate core concern, not fixed here. Warped loops, selected-stem Slip, in-hold edits/Flip/onset/quality/long-run/failures/hardware remain open. Native15/profile/launchers unchanged. Next manifest needs censor.js,censor-backing.js,reverse-censor-plan.js,pitch-time-map.js. See docs/prototype/WARPED_CENSOR_REVIEW.md and warped-censor-browser-results.json. Full110/522 flags/model+effort routing preserved; full Claude audit unlaunched.

## Plan112 — rapid Smart Sync→Play input ordering (18Oct2026)
Actual GUI and MIDI bursts previously entered TempoSync, with pulse offsets92.154/206.145ms (>10ms). Sync/Play/Play still started and counted two extra plays; recorded right RMS0.0142389 failed paused0.0001.

Smart Sync now awaits its pending press and validates owner/track/transport token before alignment. One app-level Play intent can be canceled by a second Play; load/eject clear it, and only its successful current start records history. Play exposes busy feedback. No DSP, controller address or artificial delay changed.

Final actual GUI/MIDI bursts both reach BeatSync/rate1.2, one counted start each, six audible pulse pairs each max1.270/1.338ms at unchanged10ms/min5pair gates. Sync/Play/Play remains stopped/unqueued at600ms, count2→2, recorded350–550ms right RMS1.98214e-8<0.0001. Whole8.159977s stereo131969bytes SHA32a967086f734517a234da5854f5924588f8ddfef3690bd87e6f5cd17772d4c6; finite complete decode;6stable source hashes. Focused controlled cancellation/track/token/failure contract executed. Before evidence retained. See docs/prototype/RAPID_SYNC_PLAY_REVIEW.md and rapid-sync-play-{before,browser}-results.json.

Flat-grid/keylocked-secondary synthetic fixture only; no full-map/native/physical/compound/reference acceptance. Native15/profile/launchers unchanged; fresh approved local desktop package is next. Human away/no capture. Full110/522 flags and model+effort routing preserved; full Claude audit unlaunched.

## Plan113 — desktop0.1.16 core test candidate
Frozen source eaffc59146d40f757ea502f6ac7eb97e0d5a6404; ASAR a2925237fab3fe2f9064bacb6a62b91cf6cc4f6b02cb166534d90952907076df. Actual native Checks/Run/Download workflow: rapid GUI and synthetic MIDI Sync→Play reaches Beat Sync, six pulse pairs each max1.156/1.406ms vs10ms; second Play cancels queued start (count2→2, paused RMS4.059e-8). Whole8.28s stereo master retained. Not physical/acoustic/music/full Sync acceptance. Unique volatile diagnostic session; main272mapping export byte-identical before/after normal restart. Stable profile backup158files/8017227bytes; old15bundle/guide/launcher retained. Main16stopped, Hercules connected and master1/2+cue3/4 selected; routing resets to default stereo after restart. Human away; no timed capture. Re-entry: physical left Play→deck1/RCA sound→same-button stop, one action at a time. Full flags/list/completion/model routing unchanged. Full Claude audit unlaunched.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/DESKTOP_0.1.16_REVIEW.md


## Plan114 — warped-loop Censor, browser source
Active warped loops no longer reject Censor. Reversed grid/loop uses existing audio-thread kernel; keylock/shift reverse periodic rendered cycles. Original forward owner/grid stays running silently and returns with loop/BeatSync/mute intact. Final actual app U/Stem-pad flow covers raw, locked+2 and unlocked+2:18fixed audio windows max0.481314Hz vs1Hz; reverse90→150→120/wrap, audible forward-return carrier, six mute ratios0.665434–0.667088. Whole29.82s master SHA603d97dffc28a89953da0347915cafbd4733cd20c04c01a9381459c9d3b87a71. Five separate pull inputs/three actual disposal ACKs;13stable source hashes. Known8beat/realPCM contract separate. Initial narrower captures preserved; final output wrappers correct disconnect/input-index handling. No broad green matrix repeated. Native16unchanged, human away/no timed capture. Model quality, selected-stem Slip/Censor, other compositions/ranges/music/physical/full-reference acceptance remain open; full flags/model routing unchanged. Full Claude audit unlaunched.
Review: https://github.com/jpoindexter/open-play/blob/main/docs/prototype/WARPED_LOOP_CENSOR_REVIEW.md


Plan130 ·18October2026 CORE FIX: reproduced100→120BPM Sync outside±8% fader range; old absolute pickup ignored all movement. Browser MIDI now uses relative movement in SmartSync/REL, shared-tempo rebasing, Shift-ignore reposition and track-scoped/coalesced requests. SecondOFF and actual reload-from-REL immediately restore a known received physical position. If unknown, next packet gets explicit absolute takeover; no invented position. Disconnect invalidates cache. Ordinary absolute pickup retained. Final10controlled cases and11actual-app synthetic-input/audio cases pass:22retained post-master Float32 windows, maxfrequencyerror.00002349Hz<.3Hz, two stopped windows exactzero. Immediate cachedOFF, unknown-position takeover and actual reload/Play are separately exercised. Whole finite stereo master301644frames/44100Hz SHA b6666406e0f5007c58d3dc88d758462436e4eeca5dce4f92cb8c1d3bb6e54494. Eight stable/served no-store hashes. Initial narrower9/10case runs retained, not reused as later proof. Read docs/prototype/MIDI_RELATIVE_TEMPO_REVIEW.md and midi-relative-tempo-{before,policy,browser}-results.json. Exact vendor taper, GUI out-of-range slider display, keylock/warp/StemSlip compositions and physical/native acceptance remain open. Native21unpatched/stoppedMaster−12; no newbuild this unit. Next: authorized22package with isolated relative-tempo check; preserve21ASAR/profile/272maps. Humanaway/no timedcapture. Full522requirements/statusflags/Codex+Claude model-effort routing unchanged; full Claudeaudit unlaunched.

Plan131 ·18October2026: Current desktop0.1.22 from100eacd6226142ae2ff86876006236991424799d; ASAR28504c15e462e0b2111289991374b7d10506d4c65a3c37dc3f914a8ea2800240. Actual native isolated RelativeControllerTempo Run passes11synthetic-input/generated-tone cases,22post-master Float32 windows; maxfrequencyerror.000034821959Hz<.3Hz, two stopped windows exactzero. ImmediateOFF/unknown-position takeover/Shift/normal RELreload+Play executed. Whole finite master109685B/44100Hz/stereo301644frames/SHAf411589f141f839ce92ce0b5ac13bcc0cd2588156691b5ce6b7f7e001d967e70; original/PCM retained privately via read-only native Elements-copy/local-save, noJSinjection. Five package checks/340prototype files/58critical modules pass; actual58servedbytes match/no-store. Prior21archive/versionedlauncher retained; closedprofilebackup188files/7972892B matches before/after/copy. Main22normal export272entries/64916B/SHA37b61c1dbf16d43a1f14d7d932c88dc3a4d2ba1a062ae23e5175c91d58953864 unchanged. Actual stoppednamedHerculesquadmaster1/2cue3/4,mix0%vol10%,Master−12,0playing/both00:00.0; currentlaunchers22. Physical sound/allcontrols/manualbeatmatch/music/Fileimport/exacttaper/fullparity remain open. Next humanleftPlay→deck1/RCA sound→samebuttonstop; no timedcapturewhileaway. GUI out-of-range slider remains a core displaygap; diagnostic ordinaryexport absent. Read docs/prototype/DESKTOP_0.1.22_REVIEW.md/currentguide/native reports. Full flags/model-effort routing unchanged; full Claudeaudit unlaunched.

Plan132 ·18Oct2026: Reproduced GUI+20%/±8% clamp: real ArrowDown jumped to+7.9% and changed audible shared tempo. Browser GUI now uses labeled relative coordinates, accurate accessible pitch/BPM, range/external-tempo rebasing and queued gestures; ordinary in-range unsynced tempo remains absolute. Control/Command-click and Control/Command+Home reset actual pitch.8controlled cases and11actual browser keyboard/pointer/audio states pass:22finite Float32 windows, globalFFT maxerror0.000031332Hz<.3Hz, stopped exactzero. Original/PCM retained;7stable/current source hashes. See docs/prototype/GUI_TEMPO_REVIEW.md and gui-tempo-{before,policy,browser}-results.json. Native22/bundle/profile/maps/launchers unchanged and stoppedMaster−12. Exact vendor GUI, physical/music/compositions/fullacceptance remain open. Simple Sync controller relative movement/OFF absolute reset is a separate open core gap. No broad reruns; fullflags/model-effort routing unchanged; fullClaudeaudit unlaunched.