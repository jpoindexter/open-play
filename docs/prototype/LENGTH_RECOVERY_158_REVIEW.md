# Length and upload recovery — checkpoint158

18 October2026. **A resource-feasible630second input now reaches actual real Stems/playback beyond the old600second cutoff. Newly owned temporary uploads also recover after a real uploader-process crash without removing live or unknown files.** Full110groups/522requirements/55extendedFX/Stems/keylock parity remains open.

## Production change

The browser's hard600second rejection is removed. `scripts/stem_limits.py` reads and validates the canonical float-WAV header/actual byte length, derives frames and duration from audio rather than library metadata, allows at most1GiB of decoded44.1kHz stereo working input, and checks disk capacity for decoded audio/four outputs plus headroom. The metadata field `reservedOutputDiskBytes` is an admission estimate/check, not an OS disk reservation or measured RAM budget. The worker decode ceiling is ceil(actual duration); timeout is max(900,ceil(3×duration+120))seconds. This input therefore uses630seconds/2010seconds, observed in the actual worker command and returned preparation budget. The standalone worker CLI still has its existing default; the app supplies its source-derived allowance.

Worker/model/postprocessor/DSP code is unchanged, preserving old exact-input/pipeline cache compatibility. Full worker input/separated arrays and full browser original/four outputs still occupy memory. Sampled worker RSS reached13751248KiB (~13.11GiB), not a measured peak or resource acceptance.1GiB upload/decoded-input bounds and resource failures are still explicit implementation limits; this is not an unlimited-memory claim.

New temporary upload directories contain a held POSIX advisory lock and schema/ID/PID ownership receipt. Startup and new upload admission reclaim only canonical directories with exactly the generated files, a valid dead owner and an obtainable exclusive lock. Live/ambiguous/legacy layouts and symlinks are preserved. Normal cancellation/commit removes its generated lock/part/directory and closes the handle. This establishes process-crash recovery for the new layout, not arbitrary legacy cleanup, power-loss or corrupt-filesystem recovery.

## Executed recovery and focused regressions

`stem-recovery-158-results.json`: a real separate Python uploader holds its lock and writes a partial fixture. Reinitialization while it is alive preserves the upload. Only that created child is killed (exit−9); fresh reinitialization removes its dead-owned directory. A legacy unknown partial, symlink/original and unrelated completed-layout fixture retain exact contents. No model was involved in this recovery test.

`stem-budget-158-results.json`: actual admission helper executes on owned sparse canonical WAV containers;630s gives630/2010 allowances. Controlled low-disk and excessive resampled-working-input cases reject before a worker. These are helper/controlled-resource checks, not actual disk exhaustion or inference.

`stem-uploads-158-results.json`: real HTTP old/chunked routes reuse the old eight-second job with all nine files/hashes/mtimes unchanged; offset/incomplete-commit refusal, repeated commit, cancellation ownership and generated-directory cleanup pass. The queued commit/cancel race uses real service methods with a recorder, not inference or HTTP-race timing proof. No broad FX/controller/DSP matrices were repeated.

## Actual630second path and retained test-fixture failure

The actual browser uses an owned630second330Hz-left/550Hz-right .12-amplitude AudioBuffer:27783000frames, two channels,44100Hz,222264000PCMbytes/222264044WAVbytes. Actual Prepare cancels the first acknowledged partial upload at1%, creates no job/publication and shows the preserved-audio notice; retry sends53ordered chunks≤4194304bytes. Job`1d5ad6be799945acad7997aaafbcbb2e` runs real SCNet-large once: model load.746962375s, inference412.963183708s, total416.001196583s. Four actual exports each contain the full27783000frames/630seconds.

The first harness mistakenly retained420second track metadata while extending its actual buffer to630seconds. Production `attachStems` correctly rejected that mismatch. Original48436bytes/SHA`5cad4864d3d16f0d5ce0b4a68aac7bee3002fa5db030a664c186a3b8f62390dc`, receipt, screenshot, result and exact source capsule are retained. This was a fixture error, not a production DSP regression. The only correction sets fixture metadata from actual buffer.duration and asserts that precondition before preparation. No production duration guard was bypassed or changed to accept inconsistent sources.

The corrected actual UI path reuses the completed real job; nine files/content hashes/mtimes remain unchanged and no second model process runs. It loads all four full-length buffers, plays, changes actual Stems pads, records all-pad mute/restore and stops. Original989975bytes/SHA`ddba41cc282b9728107cf27359b98990fbda0898f29224dd97e83282d9aa3895` is private; public `length-recovery-158-results.json`/browser receipt/screenshot/cache receipts retain metadata. Returned model timing in this repeat belongs to the first job, not repeat inference performance.

Independent inspection hashes the canonical uploaded input and both complete original PCM channels against the unchanged browser source, hashes all four full exports against the worker manifest, and verifies both entire recorded88200sample channels/690contiguous quanta. Source-before/after hashes match. Left/right baseline RMS.2427841148/.2427841159; restored RMS matches within reported precision; mute/Stop peaks0. Existing predeclared windows/bounds remain: baseline capture+50–150ms RMS>.005, mute/restore+100–200ms peak<1e−7/RMS>.005, Stop+100–250ms peak<1e−7. No fitting/cropping/PCM repair/bit-zero demand, musical-quality or cursor/continuity/reference inference.

A browser observation deadline expired while waiting for completion; the same worker/status was rechecked and showed terminal complete. No job/server restart was made from that observation timeout.

## Next and preserved scope

The artificial10minute/15minute processing cutoffs are replaced by input-derived admission/time allowances; actual630second preparation/playback now has scoped evidence. Whole-model/browser memory, failed-job lifecycle, legacy ambiguous files, musical attribution/leakage, context/compound transports, all other FX/reference/native/hardware requirements remain open. Current projected musical exports previously met the sum constraint around2.4e−8; the raw3.025%versus3%failure/source-attribution limits remain preserved. Do not describe that raw historical failure as a current projected-export sum failure, or call the projection a source-quality improvement.

Next packet: `handoffs/stems-158-musical-workflow-followup.md`. Prioritize actual musical import/preparation/control/keylock workflow evidence over another arbitrary long-tone matrix; keep resource optimization visible and act on measured blockers. Frozen0.1.23/tested272alternative profile/launchers/user8768/18775/18768 remain unchanged. New endpoints were tested on owned8797; existing backend imports were not hot-reloaded. Physical output remained muted, and no new native package/Claude consultation/full audit was launched. Official Serato versus Alternative mapping provenance stays separate; full parity remains false.
