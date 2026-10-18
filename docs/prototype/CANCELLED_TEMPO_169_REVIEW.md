# Cancelled group tempo, restart and relative direction —169

Two actual baseline workflows reproduced a practical tempo defect with real keyed selected musical Stems: ordinary playback and held Slicer. After canceling a pending+6tempo request with Stop, deck rate remained1.06/nominal127.2 while shared display and actual restarted grid voice were120BPM. Lowering the relative control from6to2 then selected1.02/122.4, so playback sped up when the user lowered the control. The1196355byte original/SHA7fdc7559878e7c210b845f66eca3b9b0e4ad7a368febd85e2f8643b9d4a07c57 and public before-results stayfalse.

## Cause and correction

Existing group failure restored shared tempo to its previous value. Nominal rollback, however, required the group's original voice token. Stop intentionally invalidated that token, so the stopped deck's uncommitted rate escaped rollback. The next relative input accumulated against that stale nominal rate.

Only production `prototype/engine.js` changed. A WeakMap records each deck's rate-request owner separately from voice tokens. Prepared groups tag their nominal assignments. Failure may restore their own uncommitted rate when the original voice is still owned or the deck is fully stopped without another voice/processing task. A newer rate request, different track or newer active transport prevents stale rollback. Individual setRate and synchronize revoke prior group rate ownership. Existing voice preparation, source retirement, common start barriers, audio processors/model/services/native remain unchanged.

Policy follows the app's existing common-tempo rollback: an uncommitted canceled group restores the last accepted nominal basis. The relative control retains its input coordinate6; its actual pitch is restored to0percent. Moving that coordinate6→2 is a4percentage-point decrease from the restored rate1, producing.96/115.2BPM. Input coordinate and absolute pitch are deliberately distinct, as in the existing relative control. This is an independent coherent behavior, not a verified exact Serato compound policy.

## Actual executed evidence

Normal Import/Load/Prepare/grid/Sync/Play/tempo/Stop/Play/tempo handlers execute two cases, with and without a real Slicer hold. Exact private6.8s MP3/completed SCNet job8266a41f62fc4fc5b92808dd3d988cec, selected Melody/Bass/Drums, original/Vocal0, keylock/key+3, known120–150–90 warped grid. Pending processing/transform request observed before Stop; late Slicer pointer release delivered where applicable. Explicit44100Hz diagnostic, physically muted; no controller needed.

Both final cases restore nominal1/display120after cancellation; restarted nominal/grid/display120agree. The next lower relative input6→2 produces nominal.96/grid115.2/display115.2. Independent known-grid/actual-anchor source positions agree exactly under10ms at restart and the new handoff. The nominal/grid BPM and direction criteria are separate: the baseline's short post-change clock difference was only5.35–5.49ms, so clock tolerance alone would have missed the incorrect tempo direction. No thresholds were relaxed or tests narrowed to that weaker proxy.

Final1196417bytes/SHA522b4566c4e22406150f508af134a225f282e2c47205402b7983aa35876d37bf. Sixteen whole0.3s/13230-frame channel streams,104contiguous producer quanta each, finite and exactSHA checked. Stopped stereo peaks0under1e−7; original/restarted/adjusted playing audio positive above1e−5RMS. Keyed positive audio is transport/control evidence, not musical pitch/perceptual/source attribution or exact waveform reference acceptance. Input file/decoded original unchanged. All22declared module hashes stable and exact private before/final capsules retained, not a whole-app identity. Same9cache bytes/SHA/mtimeNs, no inference repeated.

Five focused real AudioEngine rollback/pause/setRate contracts use controlled preparation collaborators: stopped member nominal rollback with another audible owner retained; replaced-track protection; newer paused request for the same rate; newer playing transport; ordinary preparation failure retaining both current voices. The stopped rollback case fails before and passes after; the other four prevent a broad unsafe rollback. Their two-deck/newer-owner cases are collaborator evidence only, not actual multiple-deck GUI/acoustic coverage. No solved FX/controller/model/tempo matrices replayed, no fitted/modified/dropped/stitched recordings or numerical-tail chase.

## Reproduce inspection

```sh
python3 scripts/inspect_cancelled_tempo_169.py local-evidence/stem-resource-150/browser-exports/f033d267abe44b9799cb51c4b00e5127.json /tmp/cancelled-tempo-169-reinspection.json --sources local-evidence/cancelled-tempo-169/final-source-capsule/prototype
```

Output must not already exist. Raw music/PCM/capsules remain ignored. Actual DOM receipt/screenshot and public independent stats are retained.

## Remaining scope

Next actual reverse Slicer→tempo→release. Current Slicer rate-clock adaptation recognizes voice.gridTimeline BPM, while reverse playback may expose censorReverse clock metadata instead. That is a source concern, not an observed defect. See handoffs/stems-169-reverse-slicer-followup.md. Actual multi-deck cancellation/newer-rate gesture composition, preparation latency, default48k/context migration/resources/vendor reference/musical quality/native/hardware/full parity remain open independently.

Full110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock objective active; all full-parity flagsfalse. Eight feature evidence rows include general tempo and Sync, preserving formal acceptance/routing/models/effort/status/history. Frozen0.1.23/tested272Alternative/profile/launchers/user8768/18775/18768 preserved; no native package/Claude audit. Full original prompt and168/older false gates retained.
