# Reference-backend real preparation, Cancel and retry — checkpoint156

18 October2026. **The actual Prepare/API/download/decode/activation flow passes the established control and audio criteria with the integrated reference backend. Capture includes warm-up Cancel, successful retry, first Stems pad, mute/restore and Stop. This is completed-cache/owned-tone evidence; no new inference, musical-quality, native, hardware or full-reference acceptance.**

## Actual source/service path

Previous155turn was progress: it integrated the reserved eighteen-channel original-stereo-reference DSP, reproduced the causal differential, corrected browser-loader initialization and executed four-deck direct-buffer playback. This turn changes no production audio implementation. Its purpose is to execute the actual preparation boundary rather than infer service/model behavior from direct attachment.

Fresh inspection confirms the existing user servers on8768/18775; neither was restarted or changed. An owned loopback resource server on8795loads current preparation code and restores completed job`a2877adfbffa4ece8ec544451917a589`. The job is the previously generated eight-second330Hz-left/550Hz-right owned tone, with four real SCNet-large exports. Two actual UI preparations return the same job; the server records two202responses and eight successful WAV downloads. The browser decodes and attaches those files. Nine exact cache files, sizes, hashes and modification times remain unchanged; pipeline hash and job-directory set also remain unchanged. No model worker was rerun. Returned model timing belongs to that historical completed job, not current inference performance.

Read `prepare-reference-156-{cache-before,cache-after,service-before}.json`. Audio/WAV/model output/log contents stay ignored; these public receipts contain metadata only.

## Executed UI and ownership behavior

`stem-prepare-reference-156-harness.html/.js` runs two actual decks at rate1.1, with live/keylocked reserved Stems on deck1 and ordinary cold attachment on deck2. Physical output is muted. The actual Prepare and Cancel buttons execute production code. The existing observation hooks record adapter warm-up/cache publication and attempt the disabled Cancel button after commit; they do not change audio, buffers or ownership.

The four-channel recording starts before the first Prepare. The actual Cancel occurs during separated-audio activation at audio time1.4048072562, after first Prepare0.4818140590. Both original playing owners remain, the unpublished decoded cache is absent, staged bank is cleared and Stems remain uncommitted. The persistent completed service cache is retained; “cache absent” refers specifically to the active decoded publication, not deleting exported job files.

Retry starts1.4048072562 and reaches Ready1.6892517007. During the committed handover, Cancel/Prepare/Trash are disabled, status explicitly says Finishing audio handover, the attempted disabled Cancel dispatches no click and does not abort the signal. Ready restores controls only after the audible handover settlement. The live owner remains; the cold owner changes through its intended handover.

The first actual Vocal pad is pressed1.6950566893, **5.804988662ms after Ready**, with no deliberate delay. Its state is `[false,true,true,true]` and actual original/Vocal/other-source gains are `[0,0,1,1,1]`. Thus it selects real decoded Stems rather than the original bypass. Both decks then undergo actual all-pad mute, restore and Stop. Original decoded PCM hashes remain unchanged.

## Whole recorded audio and unchanged gates

The durable original is3930170bytes, SHA256`7989b5bb5c6c4ce15667fcc1f8cfc7f85642da345e22a363467ee2caea907726`, at `local-evidence/stem-resource-150/browser-exports/cd8cec2053644ba8832652e5a526dca2.json`. Its small browser receipt matches. All source-before/after hashes match, including the selected reference DSP. Source capsule is retained privately.

All four complete stereo-per-deck streams have176400finite/hash-checked samples and1379contiguous quanta with no producer errors. Capture starts at frame12288 and lasts four seconds; it includes the first preparation/Cancel as well as retry, first pad and Stop. The original149criteria are unchanged: minimum10msRMS0.85, adjacent jump≤0.03, near-zero run≤1ms, mute/Stop peak<1e−7. Fixed baseline is capture+50–150ms; continuity is capture+50ms to intentional all-pad mute. Mute/restore windows are+100–200ms, Stop+100–250ms. No time, gain or phase fitting/cropping/PCM repair.

| Output | Minimum10msRMS ratio | Maximum adjacent jump | Mute/Stop peaks |
|---|---:|---:|---:|
| Live left |0.9761101405|0.0162385255|0/0|
| Live right |0.9989893131|0.0270772493|0/0|
| Cold left |0.9836912873|0.0176379159|0/0|
| Cold right |0.9959746019|0.0293868193|0/0|

All near-zero runs in the continuity interval are0. Restored RMS is positive on all channels. Twelve control/ownership/readiness assertions pass. Independent result:`prepare-reference-156-results.json`; inspector:`scripts/inspect_prepare_reference_156.py`. This extends the earlier149scope by recording through Cancel and verifying actual immediate first-pad routing; no broad FX/controller matrix was repeated.

## Mute-contract clarification

The pre-existing149functional criterion explicitly uses`maximumMutedPeak=1e−7`. Checkpoint155added a stricter post-mix bit-zero diagnostic at mute+50–250ms, which correctly remains false in its retained record because of tiny residues. That additional observation is **not an established functional parity blocker**. This156cohort uses the unchanged prior149contract and observes exactzero in its existing+100–200ms mute window. The different windows/flows are disclosed;155is not relabeled or repaired. No audio change, threshold loosening or global tail-cut was made to chase numerical residue. Future work should follow Jason's pragmatic-testing instruction.

## Newly identified long-track hurdle

The source/arithmetic check in `prepare-size-156-source-limits.json` identifies the whole decoded-WAV request cap of128MiB: stereo44.1kHz/32bit floats plus44byte header permit16777210frames/380.435600907seconds. Browser and service separately limit preparation to600seconds; the worker CLI default is1800.

The actual UI reproduction now exists: `stem-size-156-harness.html/.js` creates a real owned seven-minute AudioBuffer (18522000frames, two channels,44100Hz;148176000PCMbytes/148176044candidate WAVbytes), then uses the production Stems tab/Prepare/queue controls. It observes **Failed · Decoded audio exceeds the 128 MiB local preparation limit.** No job or decoded Stems publication is created; all decks remain stopped, physical output is muted, and the owned long buffer is released from the engine map afterward. No PCM is exported. The server retains exactly two preparation POSTs from the earlier short workflow and the job-directory set is unchanged.

The retained1696byte original at `local-evidence/stem-resource-150/browser-exports/d57833b28ad2452b924b4156ea57d959.json` has SHA256`b5cab58f77678d7ef31dd1b6f3075f27fe766d8a8303dfb1436172273be11356`; source-before/after hashes match. Public result: `prepare-size-156-results.json`, small browser receipt and screenshot. This proves the decoded-input UI refusal, not compressed-file import, accepted long preparation, fresh inference or playback. Next implement a bounded chunked/streamed path with preserved cache/Cancel behavior. Exact packet: `handoffs/stems-156-long-track-followup.md`.

## Next work and preserved scope

Preparation-service Cancel/retry/commit-readiness now has current-backend executed evidence. Context/owner recovery, musical/reconstruction quality, remaining compound transports, resources/deadlines and other feature/reference/hardware/native requirements remain separate and open. Old151's exact startup was unrecorded and its retained +3failure is not declared reproduced/repaired by this cohort. Model-source quality failures, including the prior SCNet3.025%versus3%gate, are not changed by completed-cache reuse.

Keep all110groups/522requirements/9beta/26release,55extendedFX and actual Stems/keylock in scope. Full-parity flags remain false and goal active. Frozen0.1.23/tested272alternative mappings/launchers/user8768 retained; no native package, timed MIDI capture/hardware output/readiness question. Official Serato and Alternative mapping provenance remain separate; factory19252assignments/145of197definitions and Hercules356/18unresolved unchanged. Per-feature Codex/Claude effort/model recommendations remain dated planning metadata; no new Claude consultation/full completeness audit launched. Plan, model/feature records, private Trello and complete Claude handoff retain these distinctions and the exact original prompt suffix.
