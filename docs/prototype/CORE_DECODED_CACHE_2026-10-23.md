# Core decoded-audio resource slice — 23 October 2026

Outcome: bound inactive decoded originals without removing tracks, original media, measurements, DJ controls or library waveform previews. AUD-006 remains open for broader soak/latency and resource work. Jason requested software-only continuation; no fresh listening acceptance.

## Root cause and change

The original AudioEngine.buffer retained every distinct decode in a Map; fifty controlled requests reproduced retention. Concurrent requests for one ID also decoded twice. Existing keylock render cache already had a128 MiB bound; original PCM had none.

- Keep the existing decoded Map, add shared in-flight requests, and evict least-recently-requested inactive originals when over256 MiB. Loaded paused/playing decks, scratch preparation, pending decodes and current/retiring sample owners are protected. Releasing a loaded deck makes it eligible; eviction does not modify the AudioBuffer or stop an owner already holding it.
- 256 MiB is an internal cache policy, **not a process memory ceiling**. Protected originals may exceed it; decoder transient allocations, scratch/worklet copies, stems, encoded originals, GPU/video and other caches are outside this budget. Budget/ownership byte counts are inspectable through existing engine diagnostics access. No new user preference or dependency.
- Cache-clear action now clears inactive originals while preserving loaded decks and previews. Ejected decks trigger pruning. Original files and IndexedDB media remain available for re-decoding; no catalog limit or data deletion.
- Separate26-line decoded-cache module; small AudioEngine/caller changes. Existing waveform implementation and transport/DSP/Sync scheduling are retained.

## Executed verification

- Four initial regression cases failed before implementation: unbounded sequential decodes, missing protected pruning, duplicate concurrent decode, recency eviction. A further failing regression caught duration metadata on an equivalent object sharing a decode; corrected. Final suite: **56/56 Node tests** including six cache cases.
- Existing scratch cache/owner/kernel suite12/12; tempo-slider8checks, pending Smart Sync start/cancellation and keyboard bend/release checks pass. These use controlled collaborators and do not establish physical hardware or acoustic quality.
- Actual workspace harness on dedicated empty/owned origin127.0.0.1:8873. Imports12distinct generated24s stereo WAVs through the real file-input handler, normal UI loads two decks, and reimports ten through the real importer. Scaled24MiB cache budget. Controlled eviction-disabled baseline101,606,400B/12entries; after pruning16,934,400B/two protected entries. Repeat imports leave those two originals identity-equal and playing with advancing source clocks.
- Actual master capture during repeat imports:529,200frames at44,100Hz (12seconds), all finite, peak0.10195036, minimum100ms RMS0.04935534. No silent 100 ms windows or clipping under the declared fixture. This does not rule out short clicks, prove musical beatmatching or imply a device-output measurement. Physical monitor muted; measurement worklet outputs silence.
- Production256 MiB policy: eight further distinct120s stereo WAV imports. Resident original cache228,614,400B/7entries, including16,934,400B of loaded originals; below268,435,456B. No total-process RAM, GC deadline or long-session plateau claim.
- Evicted local original successfully re-decodes.28metadata tracks retained, library previews retained, Play/mixer inputs retained in2/4decks×horizontal/vertical Compact. Existing cache-clear button executed and feedback observed; loaded previews remained. Final software fixture stopped all decks and queued starts.
- First integration attempt tested title assignment before asynchronous decode completion and failed “Loaded originals”; corrected the fixture to await decoded identity and reran the complete path. The final four groups pass.

Private results/screenshots:local-evidence/core-resource-2026-10-23/. Harness:prototype/decoded-cache-harness.html, refuses normal ports/unowned data. Generated fixtures are confined to this isolated test origin.

## Desktop / board / next

Desktop 0.1.39 initially showed an empty existing window after the overnight gap; a cold quit/reopen restored its16-track library and stopped transports. Cause was not established; no claim that cache changes fix it. Preserve as a SYS-002 follow-up if it recurs.

Versioned 0.1.40/source 6fdaef969fe6735d19c93beb43e3e0c20bdd634f passed archive/host5/5. ASAR95d460d2ad41aa03f75788bb0f3dbd9dc63ed39f685121d498dc2cdf352f7844. Actual native startup restored16tracks/55:45.6, two stopped decks, master/headphone preferences, controls and14visible library preview images without recovery warning; no music was started in the normal native profile. See package, safety and observation receipts. Earlier bundles remain available. No fresh listening or hardware test is inferred from packaging.

Trello access recovered23October. LIB-011/SYS-002/CORE-001 pending safety updates applied and read back, preserving history/models/criteria. Broad cards stay open. CORE-001 needed a shorter current summary plus linked comment because its full description approached Trello's length limit. No duplicate comment from the failed22October attempt was present. Board still140open:Core26,Next22,Later85,Blocked4,Approvals2,Evidence1. AUD-006 current evidence and CORE-001 version/comment were also applied/read back after commit; SYS-002 has the blank-window follow-up. Receipts: docs/delivery/CORE_STATE_SAFETY_RECONCILIATION_2026-10-23.json and CORE_RESOURCE_RECONCILIATION_2026-10-23.json.

Next user gate: one manual Sync-OFF transition, per-channel EQ, temporary Cue/release/latch and clean stop. Intermittent Sync-pop/lag remains OPEN. Hardware-dependent headphone/master isolation and controller acceptance remain separate. Defer stems/video, broad layout redesign, full parity, repository-wide refactor and arbitrary file-size enforcement.
