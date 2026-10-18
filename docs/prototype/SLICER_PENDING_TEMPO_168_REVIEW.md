# Pending Slicer tempo release, Stop and endpoint priority —168

The precise baseline exposed two remaining defects. Normal release during pending tempo preparation already restored the advancing background, and Stop already retired its voice/request without resurrection. However Stop surfaced an expected “Synced tempo preparation superseded.” cancellation as an error. An already-ended background release also waited0.8707482993s for the now-unused tempo preparation before invoking natural End. Both fail the unit criteria; baseline902830bytes/SHA3ce7d361c1a7b070c25733b76fba3bc824e6b7ac01d1b700763c620e9ab3ae36 staysfalse.

## Correction

Only production slicer.js and app.js changed. Slicer release arms its existing owned background-end watcher before awaiting a held tempo task, so the endpoint can cancel unused work promptly. It reuses that watcher through the subsequent transition, handles the resulting expected AbortError and respects existing Stop/Load/new-owner guards. Three tempo input/reset catch handlers ignore AbortError while still reporting other errors. No change to engine/group handoff/DSP/model/backend/native.

## Executed evidence

Actual normal Import/Load/Preparation/grid/Sync/Slicer controls used exact private6.8s musical MP3/completed SCNet job8266a41f62fc4fc5b92808dd3d988cec. Selected Melody/Bass/Drums, original/Vocal0, keylock/key+3, known120–150–90 grid. Explicit44100Hz diagnostic, physical output muted; controller not needed. Each tempo input was followed by an observed processing=true and actual transform request before release or Stop, rather than inferring pending behavior from a settled state.

Three final cases pass independent inspection. Pending rate release exits its slice and resumes the predicted background4.570217989417989s exactly under10ms. Pending rate Stop plus late pointer release remains paused at0.03804421768707478s after1s, with no voice/request/loop/processing or end callback. Expired background release while rate preparation is pending stops at6.8 and invokes the normal end callback once at the same observed audio-clock instant as release,0ms against declared50ms. This clock is quantized; no zero physical/acoustic latency claim. Both stopped after-captures have complete stereo peak0 under unchanged1e−7. No cancellation error notice appears in final cases. Other genuine error notices remain enabled.

Final original902499bytes/SHAdbabc5e7bbc486bdbd6243ceaf622e4b8585d1e4391e17d06ea48a2c4f8e21cf. Twelve whole0.3s/13230-frame channel streams,104contiguous producer quanta each, finite and exactSHA checked; held/resumed positive output exceeds1e−5RMS. Keyed positive audio is transport/control evidence, not musical pitch/perceptual/source attribution or exact after-release waveform reference acceptance. Input file/decoded original unchanged. All22declared module hashes stable and exact private capsules retained. Same9cache files bytes/SHA/mtimeNs, no inference repeated.

The first457182bytes/SHA18b44929fb79cdb2deafec0c28d5ffe505453138b94929b1c540b0f4d04f0101 partial run records one completed pending release; the next cached rate preparation completed between10ms polls, so the diagnostic timed out without observing its pending state. That terminal original and initial-diagnostic.json stayfalse; it is not a production Stop failure. The diagnostic now checks normal microtask progression, then forwards and records the real onProcessing handler plus a5ms observation fallback to retain actual handoff anchors. It does not delay workers, mock completions, inject a transport result or change the audio clock. The corrected complete baseline reproduces the real delay/notice failures. No fitted/dropped/repaired/stitched samples, relaxed gates or broad solved matrices.

Sixteen focused controlled-collaborator contracts pass; two new cases were red before the patch: already expired release before its rate gate completes, and background end reached while the tempo gate remains pending. The actual GUI covers expired pending release; the future-end pending variant remains controlled-collaborator evidence only. Do not promote it to separate actual GUI acceptance.

## Reproduce inspection

```sh
python3 scripts/inspect_slicer_pending_tempo_168.py local-evidence/stem-resource-150/browser-exports/1cf392e8a47543a0b813a772fdd187a9.json /tmp/slicer-pending-tempo-168-reinspection.json --sources local-evidence/slicer-pending-tempo-168/final-source-capsule/prototype
```

Output must not already exist. Raw music/PCM/capsules ignored; actual DOM receipt/screenshot and public independent stats saved.

## Next obligation and limits

After cancellation, actual stopped nominal rate remains1.06. App onRateRequest catch restores prior shared tempo120. The stopped display also shows120; whether Play/next relative tempo yields coherent nominal/common/audible rates has not been executed. Check cancellation→restart/next adjustment before moving to reverse Slicer tempo; do not claim this unit fixes nominal-rate rollback. See handoffs/stems-168-cancelled-tempo-followup.md. Preparation latency remains material and unaccepted as full DJ performance.

Reverse/fixed/unsynced/multiple-deck/pre-grid composition, default48k/context migration/resources/vendor reference/musical quality/native/hardware/full parity remain independently open. Full110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock objective active; all full-parity flagsfalse. Frozen0.1.23/tested272Alternative/profile/launchers/user8768/18775/18768 preserved. No native build/Claude session. Models/effort/card histories/full original prompt and166/167/older failed gates retained.
