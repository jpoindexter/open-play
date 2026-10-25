# Core four-deck preparation and tempo controls — 25 October 2026

Three reproduced source defects are repaired in **2a9c027 / 5e53ef6**. Current Node checks pass **194/194**, including26 new focused cases. **No new live UI, real playback, native build or normal-profile action was performed.** The user asked to leave those checks until unlock. Audible Sync pops and other native stalls remain open.

## Reproductions and repairs

- **Revoked preparation still requested decoding.** Actual `AudioEngine.start` resumed after channel FX preparation and called `buffer(track)` before checking whether it still owned the start. A replacement was already playing, yet the obsolete path requested the old buffer. Parent buffer calls changed from`[replacement, old]` to`[replacement]` after one ownership check before the request. Five cases cover replacement, newer same-track start, explicit silence, valid preparation and FX failure: RED3fail/2pass → GREEN5/5. This does not cancel decoding already in progress or legitimate shared library-preview work, nor prove a measured native stall reduction. [CORE-FIX-12](https://trello.com/c/ke4CyAKR).
- **Changing a pitch range rebuilt every deck.** Actual range dispatch8→16 fell through to full deck/mixer rendering, removing unrelated controls and active focus. It now refreshes the original range button, slider bounds/value/label/aria/tooltip and focus presentation from the existing tempo view. Valid local changes perform no deck/mixer/overview rebuild; malformed controls or changed structural shape retain full recovery. Eight controlled cases, including two/four decks and pending/REL coordinates: RED5fail/3pass → GREEN8/8. This is node/state evidence, not actual compact pixels, pointer/MIDI delivery or a timing benchmark. [CORE-FIX-13](https://trello.com/c/giwtX0Ih).
- **A bounded tempo adjustment could stop valid playback.** With an active loop or reverse, Key Lock off and Key Shift±24, the actual GUI model's±0.1% request exceeded the fallback renderer's combined-pitch limit. The renderer correctly rejected it, but the old voice had already stopped and the new rate remained stored; another Play rejected until reset. Prepared fallback changes now reuse the existing two-phase group handoff for one deck, retaining old audio/rate on failure and preparing valid changes at the advancing phase. Raw/live/gesture paths remain separate. Numeric transport bounds are checked before delegation or any group member mutation. Thirteen cases, including newer owner and Stop/silence, execute RED11fail/2pass → GREEN13/13. Direct5×/NaN cases are defensive API checks; current GUI/MIDI/Sync callers already bound their inputs. This updates existing [DEK-006](https://trello.com/c/Kf7NCZ4b), with no duplicate rate card.

Absolute GUI coordinates recover to actual pitch after a rejected request. An initial candidate incorrectly rebased relative coordinates to zero; the existing GUI suite caught that regression. The final implementation preserves the established consumed relative coordinate and its next delta. Existing GUI8/8 passes unchanged. Cross-VM preview-array and sub-step floating-point fixture corrections are retained separately; corrected immutable baselines were rerun before acceptance.

## Executed checks and limits

Full Node194/194; focused5+8+13; original GUI8, live-keylock9, handoff4, FX8, relative-MIDI10, Simple Sync controller4, Smart primary5 and analysis controller14 pass. These exercise actual modules with controlled buffers, graph/clock/DOM or engine collaborators. Cached transforms and controlled reversal endpoints do not establish worker/DSP quality or audible output. Original GUI and review assertions remain; rejected intermediate hypotheses are not accepted evidence.

All layouts, controls and waveform-preview implementations remain. Source changes are limited to ownership, range presentation, rate validation, existing-handoff dispatch and absolute error recovery. No dependency, DSP algorithm, new clock/fade, layout redesign or native rebuild was added. The existing renderer-driven FX refresh and any main-thread stalls still need runtime observation.

## Live checks left for unlock

1. Preserve the prior99/ba4 source-pinned orientation comparison as an isolated experiment; its result must not certify later repairs.
2. Run a separate fresh, muted current5e integration session with the prepared source manifest and existing eight-real-track harness. Observe controls/previews and an actual orientation event, then check range changes while another control remains active and the canceled-FX/buffer ordering. Source work counts are not native timing proof.
3. Capture actual allowed and rejected loop/reverse tempo transitions, phase/voice/rate ownership, parameter times and Stop behavior. Continue the bounded paused/playing incoming Sync captures on varied real songs. Retain the next actual pop; clean attempts do not close it.

The local-only server/host assets are prepared with a distinct `current` variant, pinned to5e53ef6 and22 selected modules. Pure trigger/interval, syntax, immutable-manifest and eight-original hash checks pass; no listener or Electron was started. Baseline99/candidateba4 retain their20-module manifests and original experiment. The current Run/turn10 capture alone does not exercise new FX/rate-failure cases.

After unlock, from the repository directory, start the private server in one terminal:

```sh
python3 local-evidence/four-deck-stall-capture-2026-10-24/orientation-server.py current
```

Then start the owned isolated host in another:

```sh
desktop/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron \
  local-evidence/four-deck-stall-capture-2026-10-24/native-orientation-window.cjs current \
  "$PWD/local-evidence/four-deck-stall-capture-2026-10-24/orientation-current-sources.json"
```

These ignored local assets are not included in the PR. Check the named port/owned process before launch; do not reuse or quit the normal app. Parent uses visible Import/Run; do not automate transport behind a locked screen. Capture retention, controls and actual current behavior must still satisfy their gates.

Normal desktop0.1.52/source df48b50 and its profile stay separate. Current-source native integration, manual listening/transition/EQ/Cue/stop, late-song grids, headphone/master/controller and full parity remain unaccepted. No physical-output or perfect-Sync claim is made.

[Source/test receipt](tempo-control-reliability-results.json) · [previous Sync FX evidence](CORE_SYNC_FX_BOUNDARY_2026-10-24.md) · [prior native incident](CORE_NATIVE_STALL_CAPTURE_2026-10-24.md).
