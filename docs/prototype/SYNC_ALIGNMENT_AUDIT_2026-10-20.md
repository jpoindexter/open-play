# Beatmatching and Sync alignment audit — 20 October 2026

**OPEN: the real-track musical failure is not resolved.** Jason reports an audible trainwreck after an on-beat manual start/release and supplies misaligned beat/bar-line screenshots. This outweighs historical smooth-transition acceptance for the current session. [CORE-FIX-07](https://trello.com/c/QGW47XIJ) tracks this separately from the intermittent [Sync pop](https://trello.com/c/6cK0v0iy).

## Captured environment

Actual desktop 0.1.30, source `9447710`. At the first read-only capture both decks were paused: Moonglow at 42.687 s / follower −3.8%, Can You Feel It at 211.357 s / explicitly selected MASTER +0.8%; both displayed 116.5 BPM and Sync engaged. Setup showed **Simple Sync / Snap to Beatgrid on**. Later observations had different playhead/rate values, so the capture is historical state, not an assertion about the current window. Private screenshot and AX evidence: `local-evidence/sync-alignment-030/`.

Read-only Edit Grid inspection: Moonglow 121.01 BPM, offset 0.3495964 s; Can You Feel It 115.54 BPM, offset 0.509729 s. No grid values or original files were changed. Hardware remains unavailable for physical acceptance; current listening uses computer audio.

## What the actual source paths establish

| Path | Result / remaining limitation |
|---|---|
| MASTER selection | `sync-master.js` chooses an explicit loaded master first, otherwise the earliest-started currently playing deck. Pressing either Sync button plans a follower without changing the outgoing clock. Explicit selection can intentionally override playback order. |
| Simple Sync, both playing | `sync.js` matches source tempo and schedules a follower position against the leader voice clock. Grid mode aligns the nearest beat, not necessarily a four-beat downbeat. Transient mode uses nearest detected energy-rise events; those need not both be kicks. |
| Simple Sync, either paused | Tempo matching only. Normal Play does not automatically phase-align this mode. This is a defined behavioral distinction, not proof of the reported fault. |
| Smart Sync | `smart-sync.js` arms paused followers and aligns bar phase at Play. It depends on accurate beatgrids. Controlled clocks establish this scheduling policy, not musical quality. |
| Grid interpretation | Auto-analysis labels its result as estimated constant pulse; downbeats are explicitly unverified. Equal BPM cannot establish good grids. Different absolute bar numbers on different song sections need not match. |
| Renderer | `drawDetailWave()` reads each deck position separately and uses nominal `d.rate` for source span. It draws warp-aware `createBeatgrid` lines; Simple Sync's grid helper uses constant BPM/grid. Warped grids and temporary/variable audible rates need targeted comparison if involved. No evidence yet attributes this real-track failure to those cases. |

Three executed checks in `prototype/sync-alignment.test.mjs` call the production Simple/Smart modules with controlled transport collaborators: playing Simple Sync achieves equal fractional beat phase without altering the leader; paused Simple Sync changes tempo only; Smart Sync arms and aligns bar phase on launch. **3/3 passed.** They do not prove the native audio, real-grid correctness, waveform rendering, or listening acceptance. No speculative transport/DSP change was made.

Primary reference: [Serato Sync behavior](https://support.serato.com/hc/en-us/articles/203056994-SYNC-with-Serato-DJ) distinguishes transient Simple Sync, tempo-only preparation before manual drop, and armed Smart Sync launches. [Sync preferences](https://support.serato.com/hc/en-us/articles/227785587-Sync-Preferences) identifies Snap to Beatgrid as grid-based rather than transient alignment. These are reference semantics, not evidence Open Play has full parity.

## Independent real-file check

Decoded both original local MP3s through FFmpeg to mono 11025 Hz, checked finite PCM, and used an independent causal 40–180 Hz bandpass plus positive 5 ms RMS rises. Peak candidates have at least 170 ms separation. Five fixed 40 s windows begin at 20, 80, 140, 200 and 260 s. For each, weighted circular onset periodicity searches within ±2 BPM of the prior saved fine-grained tempo estimates (121.00969677 / 115.53569812); the current UI exposes only two-decimal BPM. No results were written into the app.

Estimated local periodic tempos ranged 120.72–121.13 for Moonglow and 115.46–115.68 for Can You Feel It. Dominant saved-grid residual histogram bins ranged approximately −4 to +19 ms and −37 to +61 ms respectively. These are **candidate bass-energy attacks, not independently verified beats/downbeats**; modest periodic concentration and changing arrangement make a stronger claim unjustified. The results support the broad tempo neighborhoods but neither prove accurate musical grids nor identify the trainwreck's cause. Full private numeric result: `local-evidence/sync-alignment-030/independent-onset-check.json`.

## Next discriminating step and stop rule

The user has been asked whether the failure followed Sync while both decks played or a paused tempo match followed by manual start. Capture one actual failing sequence with both source positions, playing states, mode, rate, selected master, grid phase and clicked deck. Preserve its master recording before reload. Compare audible kick timing against displayed grid timing; distinguish a fixed phase error, progressive drift, wrong downbeat and a renderer discrepancy.

If the playing-deck Sync path fails, investigate that event rather than changing defaults to conceal it. If only a paused Simple Sync launch is involved, communicate tempo-only vs armed behavior and verify the user's intended mode in the app. Do not silently replace Simple Sync with Smart Sync, silently rewrite metadata, or cosmetically align lines over out-of-time audio. One meaningful corrected real-track transition and explicit listening acceptance are required; do not repeat clean matrices. Keep the intermittent pop open if not reproduced.

## Separate Cue integration correction

The audit also found that ordinary Play/stop missed `cueHolds.cancelDeck(d)` although other transport replacement callers already revoked ownership. An executed regression extracting the actual Play handler reproduced a released, latched pending Cue request restarting after explicit stop. The shared stop branch now revokes Cue ownership before pausing. The regression failed before the one-line correction and passed afterward; the focused Cue/keyboard suite is 11/11. This is controlled asynchronous ownership evidence, not fresh native Cue+Play listening acceptance.
