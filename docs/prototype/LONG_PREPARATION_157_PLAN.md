# Long-track preparation: checkpoint 157

Outcome: replace the reproduced seven-minute decoded-WAV transport refusal with a bounded disk-backed upload and actual usable separated sources in the browser. Full110featuregroups/522requirements/55extendedFX/Stems/keylock parity remains open.

Previous goal turn156 was progress: actual cached Prepare/Cancel/retry/audio evidence and an executed seven-minute rejection changed the next action. Base9ce13744f2860736b66f8d88bb9e692e5d1845d6 is clean and pushed privately.

Now: retain the short POST route/cache identity; add sequential4MiB WAV chunks for inputs over128MiB, at most two incomplete uploads and1GiB per upload. Assemble on disk, hash input incrementally, atomically hand ownership to the existing worker queue. Abort/error must discard incomplete transport files and cancel an associated queued/running job if commit raced cancellation. No original files or completed historical exports may be deleted.

Next: execute one actual seven-minute browser Prepare through the real local worker, download/decode/activate four actual exports and use a Stems control/play/Stop with physical output muted. Execute the changed partial-upload cancellation and cache reuse/short route boundaries. Tests of unrelated FX/controller/native matrices are excluded. A substituted worker or upload-only test cannot establish long separation/playback acceptance.

Done for this unit: the retained seven-minute input reaches Ready with real four-source buffers and an actual Stems pad changes recorded output; upload payloads stay within4MiB, concatenated input hashes match, interrupted uploads leave no partial file/job and retry succeeds. State remaining limits explicitly: decoded original and four outputs still reside in browser memory; browser/worker600second duration,1GiB disk upload cap and900second worker timeout remain. This unit cannot establish unrestricted length, musical attribution quality or native/hardware/reference parity.

Before the first long playback/capture: retain two full2second channels with finite values, SHA and contiguous producer quanta. Fixed baseline is capture+50–150ms with RMS>.005; actual all-pad mute+100–200ms peak<1e−7; restore+100–200ms RMS>.005; Stop+100–250ms peak<1e−7. These use the existing functional bounds, without fitting or numerical bit-zero demands. Long-output frame count/channel count/rate must equal the original. No harmonic-quality/continuity/reference claim is inferred from this playback check.

Must: preserve frozen0.1.23/tested272alternative profile/launchers/user8768 and18775; official versus Alternative mapping provenance; exact original prompt suffix; private raw audio/PCM/Serato artifacts. Must not: new native package, hardware output/timed capture/readiness questions while Jason is away, rebuilding the solved DSP, numerical bit-zero chase or broad retesting. No Claude audit launched.

Re-entry: inspect current upload/job/process handles and this packet's actual results before any retry. Update full plan/private Trello/model plan/three affected evidence rows/full Claude handoff from observed results.
