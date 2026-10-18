# Reverse tempo continuity and backward Slicer release —170

Actual baseline separated the suspected clock issue from the real defect. Both raw and keyed fixed-domain reverse Slicer release already returned to their correct backward-moving backgrounds within8.882e−16s/10ms. Reverse voices do expose gridTimeline in these executed paths; no Slicer clock patch was warranted. The ordinary reverse tempo path, however, paused and disposed its current voice before preparing the replacement. Whole3s recordings show820ms quiet with keyed reverse Slicer and520ms in keyed nonloop reverse. Nonloop playback also resumed714.286ms behind the continuing source clock. Raw reverse's40ms quiet remained within the predeclared50ms gate; it was a control, not a claimed failing baseline. Before5319203bytes/SHA1d3c1cd8d7a63023531a65ef6c357b92897623f403d62270bd662dd2dae249c7 staysfalse for the actual keyed failures.

## Correction

Only production engine.js changed: reverse is no longer classified with scratch/Stems Slip as requiring the separate gesture-rate fallback. Existing reverse grid starts already accept prepared common start times and prior/position clocks. They now participate in the existing group preparation/future arming barriers, so the current voice continues until the replacement is ready. Scratch and Stems Slip retain their separate path. No Slicer, DSP, model, backend, source resampling, rate-ownership or native package changes.

## Actual executed scope

Normal Import/Load/Preparation/grid/Sync/Q reverse/Slicer/tempo/release controls use exact private6.8s MP3/completed SCNet job8266a41f62fc4fc5b92808dd3d988cec. Original/Vocal0, selected Melody/Bass/Drums. Known120–150–90 warped grid. Two Slicer cases use fixed8beat domain0–4.4666667s to prevent an unintended track endpoint during recording; raw and keylock/key+3. Third affected branch is ordinary nonloop reverse/key+3. Each changes actual relative tempo+6to127.2BPM/1.06rate. Explicit44100Hz diagnostic, physically muted, no controller needed.

Final5319662bytes/SHA92c4ac7f5e82b500e81c89dd20bbd56024834453b47a34a07833f82e93e6940e completes all three. Full transition captures start40ms before the input and retain3s without dropped or stitched samples. All six complete transition channel streams have zero quiet10ms bins at1e−7RMS floor, versus maximum50ms continuous quiet-run gate. These metrics establish absence of that measured silence, not perceptually seamless phase/pitch quality. Independent original-source beat integration across the observed tempo handoff gives background errors≤8.882e−16under10ms, with prior loop/direction/selected slice retained and nonloop714ms lag gone. All requested output remains positive and selected masks/gains unchanged.

Eighteen whole channel streams are finite/SHA/producer-timestamp checked:13230frames/104contiguous quanta for.3s held/after,132300frames/1034quanta for3s transitions. Raw held/restored audio matches known selected exports and independent reverse loop clock within4.309e−8relativeRMS/1e−4 in the declared.05–.25s window. Reversing Nsamples maps source interpolation coordinate p*sampleRate−1; the final reversed sample holds original sample0 when the next index is absent. This offset/edge comes from array indexing, not a fitted signal lag. Keyed positive audio remains transport/control evidence, not musical pitch/source attribution/perceptual acceptance.

The initial inspector incorrectly asserted that this derived coordinate was always interior; its false initial-inspection record, inspector copy/hash and original remain retained. The reference now applies the kernel's known last-sample edge hold and re-inspects the same immutable recording. No live replay, fitted timing/gain/phase, sample repair/dropping or relaxed gates. Input file/decoded original unchanged;22declared module hashes stable and exact capsules retained, not whole-app identity. Same9cache file bytes/SHA/mtimeNs, no inference repeated.

Three focused actual AudioEngine controlled-preparation contracts fail before and pass after: reverse prepared handoff retains old audible owner, mixed forward/reverse keyed members share future time, and reverse preparation failure retains owner/restores uncommitted rate. Mixed-deck/fault behavior is collaborator evidence only, not actual GUI/acoustic acceptance. No solved FX/controller/model/endpoint/overlap matrices or numerical-tail chase.

## Reproduce inspection

```sh
python3 scripts/inspect_reverse_slicer_tempo_170.py local-evidence/stem-resource-150/browser-exports/0a1c43442d404185acc6fd7d74aad2aa.json /tmp/reverse-slicer-tempo-170-reinspection.json --sources local-evidence/reverse-slicer-tempo-170/final-source-capsule/prototype
```

Output must not already exist. Raw music/PCM/capsules remain ignored; actual DOM receipt/screenshot/public stats saved.

## Next boundary and limits

The normal audio sample-rate boundary is still open. Recent musical workflows deliberately construct44100Hz contexts to reuse their exact decoded/cache input; the unplugged Mac's natural default may be48000. Next use an ordinary unforced AudioContext and normal Import/Prepare/selected Stems/keylock/tempo/Stop, inspecting actual decoded/output frame counts/rates/timing and cache identities. Worker models run44100 and browser decodeAudioData can resample outputs; this source path has not established actual default48k acceptance. A new model job is justified only by genuinely new canonical PCM/cache key. Keep the completed44100job intact; do not force44100or alter production rate defaults to obtain a passing reuse test. See handoffs/stems-170-default-sample-rate-followup.md.

Preparation latency remains material despite continuous audio. Exact vendor compound/reference, actual mixed/newer-owner gestures, default48k/context migration/resources/musical quality/native/hardware/full parity remain open. Full110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock goal active; all full-parity flagsfalse. Nine feature evidence rows include DEK-010reverse while preserving formal acceptance/status/routing/models/effort/history. Frozen0.1.23/tested272Alternative/profile/launchers/user8768/18775/18768 preserved; no native package/Claude audit. Full original prompt and all earlier false gates retained.
