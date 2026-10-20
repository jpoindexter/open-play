# Sync corpus validation — broader than two songs

Executed: all173 MP3s recursively discovered under the local `Music/New music` folder, plus52 supplemental files from installed Serato/rekordbox audio folders (225 distinct source hashes). Requested by Jason after the Fable diagnosis. CORE-FIX-07 and ANA-002 remain open. This report records offline analysis evidence; it is not 173 listening passes or a claim of corrected Sync.

## Protocol, fixed before the run

- Sequential decoding and a fresh analysis process per track keep inactive PCM out of the app cache. Originals and saved library metadata are read-only; SHA256 is checked before and after each source.
- Run the actual production `analyzePCM` with initial tempo fitting limited to180 seconds and full-track drift detection. Corpus triage uses FFmpeg22.05kHz stereo PCM. This differs from the native44.1kHz decoder path; selected cases need native-rate verification.
- Detector source identity is frozen in the private protocol receipt. A changed detector requires a separate result directory; do not mix revisions into one score.
- Independent observation uses zero-phase bass energy and complete interior50% rises. It rejects clipped/window-edge crossings and retains the SAME source events and beat IDs when comparing the old and proposed map. These are estimated attacks, not annotated musical kicks or downbeats.
- With at least3 supported onset sections and100 events: classify a proposal as worse if median or95th-percentile absolute section-median error increases by more than3ms; improved if neither worsens and median falls by more than3ms orP95 by more than5ms. Otherwise inconclusive. Insufficient events remain unknown, never a pass. Thresholds were declared before corpus results.
- No proposal is installed automatically. Unsupported pulse coverage, ambiguous tempo, source decoding failure, missing tempo and proposals that fail to improve are reported separately. A successful decode/analysis is not a successful beatmatch.

## Evidence-driven guard already added

Four preliminary additional songs exposed a detector gap: long unreliable sections could be bridged by a proposed full-track map. A synthetic regression reproduced this behavior before the patch. The detector now requires at least75% supported20-second windows, and the editor invalidates cached proposals from the older method. Previously saved manual grids remain intact. Native0.1.33 retains the older detector; the guarded candidate requires a new immutable package.

## Native evidence already executed

On actual0.1.33, Edit grid Check→Stage→Close preserved CYFI's original saved grid; a fresh Check→Stage→Save persisted the reviewed five-marker map and reopened correctly. Original audio bytes were unchanged. Library waveform previews remain present. This establishes the editor path only; corrected audible Sync, other-song transitions and intermittent pop/lag are still open.

## Results

All225 files decoded and analyzed; every original hash matched before/after. Of the supplemental52, many are samples, tones or a recording, not independent full songs.38 files across the whole set are shorter than30seconds. No analysis failure is hidden as a pass.

| Scope | Files | Full-track pulse coverage supported | Missing tempo estimate |
| --- | ---: | ---: | ---: |
| New music | 173 | 86 | 9 |
| Serato starter/sample/recording files | 20 | 0 | 11 |
| PioneerDJ demo tracks | 2 | 2 | 0 |
| rekordbox samples/tones | 30 | 0 | 27 |

The frozen v2 baseline generated48 proposals: independent observation classified38 improved,8 worse,2 inconclusive. The remaining125 main-folder files had no proposal; that does not certify their grids. The first75%-coverage guard was insufficient on its own.

Root of the additional unsafe-proposal class: the causal bass-peak residual can change as the sound/envelope changes; moving the grid to follow that peak need not improve an independently measured attack. Real counterexamples include DJ W!LD's Love Every Day and Andres Remix, J.K. Rollin's Hype the Funk and Nathalie Duchene/Radio Slave remixes. Retained the counterexamples rather than raising thresholds until the count looked green.

`grid-proposal-check.js` now compares the SAME complete energy onsets/beat IDs before and after each candidate using the predeclared3ms/5ms criteria. It processes bounded22-second windows. All48 baseline candidates were re-decoded and checked through this production helper:38 improved,8 worse,2 inconclusive. The v3 detector discards any candidate without an improved check; the editor separately refuses stale/unverified/worsening cached proposals. Existing saved manual grids are preserved. This is a conservative estimate guard, not proof that the38 maps are musically correct.

Four selected cases also ran through full production analysis on44.1kHz stereo PCM: steady Anika Kunst remains uncorrected; BX3 retains a proposal (section P95 approximately23→6.8ms); the DJ W!LD Andres Remix candidate is refused (median absolute section error approximately36→45ms); CYFI retains a measured improvement (P95 approximately46→8.1ms). This is source execution, not the native browser decoder or listening acceptance.

13 focused source tests pass, including a staging regression that failed before the new guard, known offset improvement/worsening, silence, late drift, full-track coverage, lock/closed-dialog ownership and preservation of the saved track. Existing accented/syncopated tempo checks retain approximately2.5ms phase error. The Python observer's assert-based25ms-offset/silence self-check executed in each corpus pass.

Existing BPM tags were present on121 main-folder files;31 estimates differed from the tag by more than2%. Some are half/double or other metrical ambiguities. Tags are not verified ground truth, so this is a disagreement queue, not31 proven analyzer failures. CASSIMM's Club mixes estimate approximately85.316 versus a128 tag, showing why improving drift correction alone cannot establish general Sync reliability. No tag-driven overwrite or forced global tempo range was added.

Per-file compact inventory: [SYNC_CORPUS_034.csv](SYNC_CORPUS_034.csv). Full results, source identities, detector hashes, frozen-baseline checks, validator results and native-rate receipts stay in ignored `local-evidence/sync-corpus-034*/`. The baseline was collected before integrating v3; candidate rejection was replayed on all48 proposals, rather than rerunning all225 unchanged initial fits. Reusable runners are `scripts/check_tempo_corpus.py` and `scripts/check_tempo_corpus_track.mjs`.

## Current acceptance boundary

Desktop0.1.34 packages the guarded path. Packaging/current native UI results follow separately. Other-song pair Anika Kunst/BX3 is imported and paused in the native library with previews preserved. No new human listening result was received during this pass. Automatic musical alignment, metrical BPM/downbeat ambiguity, pops/clicks and waveform lag remain OPEN; no broad Sync completion is claimed.

No raw audio, full corpus dumps or originals are added to Git. No stems, effects, layout redesign or broad cleanup is part of this pass.
