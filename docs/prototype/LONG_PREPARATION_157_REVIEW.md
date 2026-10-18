# Seven-minute real Stems preparation — checkpoint157

18 October2026. **The reproduced seven-minute decoded-upload refusal is closed in the current browser/service path.** An actual local SCNet run produced four full-length420second stereo outputs; the browser loaded and played them, and recorded Stems mute/restore/Stop passed the predeclared functional bounds. This is owned-tone preparation/control evidence, not musical attribution, compressed-file import, unrestricted length, hardware/native or full Serato parity acceptance.

## Change and preserved identity

`prototype/stems.js` keeps the existing ≤128MiB single POST route and uses sequential ≤4MiB chunks above that size. Encoding keeps the exact float-WAV serialization and yields between uploads; one complete large WAV is no longer allocated for transport. The already decoded source still occupies memory.

`scripts/stem_uploads.py` owns at most two incomplete uploads, each ≤1GiB, with free-disk reservation checks and ordered/acknowledged byte boundaries. Files are private generated `.uploads/<id>/input.part` paths, never user-supplied paths. Commit verifies the declared WAV size/header, hands the file to `StemJobs.create_file`, and removes the temporary upload directory. Input hashing reads1MiB blocks; the generated file moves into its canonical job. The cache fingerprint remains exact backend + SHA(worker/postprocessor) + actual WAV bytes. Existing completed exports remain reusable. The worker/model/audio algorithms themselves did not change.

Partial cancellation discards incomplete transport without a worker. Retained upload-to-job ownership also lets cancellation by upload ID cancel a queued/running job when commit won the race before the caller learned its job ID. Completed upload receipts have no files and bounded in-memory retention. Idle cleanup is triggered by subsequent upload operations; graceful normal service shutdown cleans known sessions. **Crash/restart orphan cleanup is not yet implemented/accepted**, and remains next work rather than a claimed crash-recovery guarantee.

New POST/DELETE routes remain behind the existing loopback Host/Origin/custom-header gate. UI feedback reports byte progress and discloses10minutes/1GiB plus decoded-memory needs. No package or hardware mapping changes.

## Actual first long run

Owned source:420s/18522000frames/two channels/44100Hz,148176000PCMbytes and148176044encoded bytes,330Hz left/550Hz right at.12 amplitude. Through the actual Stems/Prepare/queue controls, Cancel occurred after the first acknowledged chunk at2%; no job/publication/playback was created. Retry sent36 ordered chunks, maximum4194304bytes, into job`cbe37073f6de40baa40f4b0fe1581200`. The real SCNet-large official worker ran once: load1.15212375s, inference289.493433333s, total292.066749s. Sampled RSS reached9170720KiB during inference; this is a sampled value, not a measured peak or a memory budget acceptance. Full-model memory optimization remains open.

All four downloaded exports decoded into exact420second/18522000frame stereo buffers. The independent inspector hashes the actual canonical uploaded input and both strided PCM channels against the unchanged browser source; it also hashes all four complete WAV exports against the worker manifest. It checks full recorded samples and producer quanta without PCM repair/fitting.

Initial original: `local-evidence/stem-resource-150/browser-exports/3abac68ae4a8465d8263d78d98d546be.json`,1020032bytes/SHA`c6a793bd8abcfae484336b408fe058e98880b190235b2b543289d6dccaee71eb`. Read `long-preparation-157-initial-results.json`, receipt and screenshot. Actual long preparation and audio criteria passed, but the UI also displayed the browser's generic abort-message toast after cancellation. That observation is retained; it was not ignored because the audio checks were green.

## Correction and actual completed-cache repeat

The adapter now normalizes cancelled errors to “Preparation cancelled. Original audio is preserved.” The updated real browser flow asserts that exact visible notice after partial-upload Cancel and repeats the long path using the completed real SCNet cache. **No second model run occurred.** Nine files, content hashes and modification times remained unchanged; job ID and outputs are identical. Timing returned in the repeat belongs to the initial model job and is not a new inference performance measurement.

Final original: `local-evidence/stem-resource-150/browser-exports/b409b01de22e4594810046ca425134bc.json`,988412bytes/SHA`c06c021445595e8854bf346360bf60bef3151328a1c65de997e30c32b20fbf06`. Read `long-preparation-157-results.json`, browser receipt/screenshot and cache before/after repeat. Initial and final exact executed source capsules remain private; the current inspector supports the initial capsule and reproduces its canonical result unchanged.

| Final recorded output | Baseline RMS | Muted peak | Restored RMS | Stopped peak |
|---|---:|---:|---:|---:|
| Left |0.2427841148|0|0.2427841148|0|
| Right |0.2427841159|0|0.2427841159|0|

Each entire channel has88200finite/hash-checked samples and690contiguous quanta. Fixed baseline capture+50–150ms; mute/restore+100–200ms; Stop+100–250ms. Criteria were declared before the first capture: RMS>.005 and mute/Stop peak<1e−7. No numerical bit-zero demand, broad FX/controller matrix, musical-quality inference or exact audible-cursor claim.

## Focused regressions and remaining work

`stem-serialization-157-results.json`: current single/chunked serialization is byte-identical to the previous committed encoder and exact2822444byte eight-second cached input SHA`e5c0fc92deeac94124df695a13133ff69d83a466849a4cb47a230dd49f5230da`.

`stem-uploads-157-results.json`: real HTTP old POST/chunked short input/repeated commit reuse that old completed job without changing any of nine files; offset/incomplete-commit errors do not create jobs and temporary directories are removed. Separate real service-method cancellation after commit uses a queue recorder, explicitly not model/HTTP timing proof. `stem-adapter-157-results.json`:13 existing adapter lifecycle assertions pass with mocked network/decode/activation. Static syntax/whitespace checks supplement these; they are not user-path acceptance.

The browser/service600second duration ceiling,1GiB upload limit,900second worker timeout, full decoded source plus four decoded outputs, full worker accumulation, and crash/restart partial-file cleanup still need work for the requested unrestricted application. Musical source attribution/reconstruction, context recovery, compound transports, other FX/reference/native/hardware requirements remain open. Old151and musical SCNet3.025%versus3%results are not retroactively repaired. No additional bit-zero work is warranted.

Verification used a separate owned loopback server8796. Existing user8768 and native18775/18768 processes were preserved; their running backend imports were not hot-reloaded. A fresh review-server process is required to use the new upload endpoints on another port. Frozen desktop0.1.23 does not contain this browser work. No native package, new Claude consultation/full completeness audit or hardware output was launched.

Keep110groups/522requirements/9beta/26release/55extendedFX/Stems/keylock and all full-parity flags false. Official Serato mappings versus Alternative mappings remain separate. Exact next packet: `handoffs/stems-157-length-resource-followup.md`.
