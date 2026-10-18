# Held Slicer survives tempo changes and releases its background —167

The two actual baseline workflows demonstrated a production failure: selected musical Stems/raw and keylock/key+3 Slicer both accepted relative tempo+6, changed to127.2BPM and1.06rate, then cleared the pad on release while leaving its0–0.0625s temporary loop active. Expected advancing background positions were1.041276372/2.361148904; observed positions remained0.010240590/0.058270975. Baseline original897455bytes/SHA4a21210b1281b66695422b8fc221beb0aebf430f996d1650fd7527029423840d staysfalse. A first partial454348bytes/SHA84340cdd597b9de5a1f4fb0fe75289bf8ee3861356d2385bc99cd99af78d8b8e records the same raw defect, then a diagnostic setup error: tempo was not reset between cases. The diagnostic now uses the actual Control+Home reset handler; no production reset behavior was altered.

## Change and ownership

Production changes are limited to `prototype/slicer.js` and two call sites in `prototype/app.js`. The Slicer-aware rate wrapper captures currently owned holds, invokes the existing individual/shared rate operation and adopts that operation's transport token before waiting. After the audio handoff it re-anchors the retained background at the new voice's actual anchor time, retaining the old clock for earlier times. Grid voices use continuous beat coordinates/current common BPM; ordinary voices use source-time rate. Retained prior loop and direction are respected by the clock equation. No broad acceptance of reverse/fixed/unsynced combinations is inferred from this code path.

Release waits for its hold's current rate operation before restoring the prior transport. Completion updates only the same active track/token/hold; a later Stop, Load or pad owner is not adopted. App single-deck and synchronized-group rate requests use the wrapper; the existing engine preparation/group handoff logic is unchanged. No new DSP/model/backend/native package or rewrite.

## Actual executed evidence

Normal Import/Load/Prepare/grid/Sync/Slicer uses the exact6.8s private real musical MP3 and completed SCNet job8266a41f62fc4fc5b92808dd3d988cec. Selected Melody/Bass/Drums; original/Vocal0. Explicit44100Hz diagnostic, physical audio muted, no controller required. Pointer-hold pad0→actual relative tempo+6→wait for actual new anchor→release executes in raw and keylock/key+3 modes. No mocked production callbacks or direct transport commands.

Final original897445bytes/SHAd780cf37284320dc22892760d355bb75970593c59c7371efe9876e6f070696ee completes both cases. Selected slice and held127.2BPM remain correct; release exits the temporary loop, clears slice/request/processing and continues playback at1.06. Independent piecewise background calculation uses known120–150–90 grid and observed new handoff time, not PCM fitting. Expected1.5026104308390031/4.754197430083143s equals observed within1.777e−15 under unchanged10ms.

Twelve whole0.3s/13230-frame channel streams each have104contiguous producer quanta, finite samples and exactSHA checks. Raw held/retimed selected-export interpolation agrees within4.303e−8 relative RMS under1e−4, declared.05–.25s window, no fitted lag/gain/phase. Released/raw and all keyed output is positive; exact after-release native-SRC waveform/pitch/perceptual/source attribution acceptance is not claimed. Input file and decoded original unchanged;22declared module hashes stable and exact private source capsule retained. Same9completed-cache file bytes/SHA/mtimeNs, no inference repeated.

First inspection accidentally reused164's fixed120BPM clock for the new127.2BPM retimed recording, producing a false raw reference failure. Its JSON staysfalse in initial-inspection.json; the inspector now derives speed directly from declared observed gridBPM. It re-inspects the same immutable recording without fitted alignment, relaxed criteria or live replay. Both real stale-loop state failures remainfalse in before-results.json. No data repaired/dropped/stitched.

Fourteen controlled-collaborator Slicer cases pass. Three new cases were red before implementation: owned tempo clock, release while tempo task is pending, Stop while pending. The latter two are collaborator evidence only; actual pending GUI interactions are the next exact task. Prior11geometry/ownership/endpoint tests pass without replaying their browser matrices.

## Inspect again

```sh
python3 scripts/inspect_slicer_tempo_167.py local-evidence/stem-resource-150/browser-exports/e0159f97c18d43cdab5575e187ee84e4.json /tmp/slicer-tempo-167-reinspection.json --sources local-evidence/slicer-tempo-167/final-source-capsule/prototype
```

Output must not already exist. Raw music/PCM/source capsules are ignored private artifacts. Actual DOM receipt and browser interface screenshot saved; no full native/runtime parity claim.

## Remaining scope

Actual pending-tempo release/Stop, fixed/reverse/unsynced/multiple-deck composition, pre-grid and context migration/default48k/resources/reference/musical quality/native/hardware remain independently open. Full110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock objective active; all full-parity flagsfalse. Frozen0.1.23/tested272Alternative/profile/launchers/user8768/18775/18768 unchanged; no native package/Claude audit. Original prompt/models/effort/card histories and166/161/164failed records preserved. See handoffs/stems-167-pending-tempo-followup.md.
