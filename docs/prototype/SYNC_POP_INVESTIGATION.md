# Sync pop investigation

## Current disposition — 28 October 2026

**OPEN: intermittent audible pop, broader Sync alignment and four-deck stalls.** Current/default94/sourceaa07a04 now has exact archive/host5/5 and actual native paused startup: Constant Change/DJ W!LD50.716/62.715s,16tracks/12materialized previews. Closed92profile256files/120945306bytes revalidated before launch; no main Play/Sync/REC Start or restore. Mac locked again after settled capture, preventing final native reread; no later native input.

CORE-FIX-44covers shared and outer same-fader queued-tempo ownership. Actual paused/muted four-deck failures repaired in source/browser, controls/previews and valid fresh movement retained. Relevant94native failure/playing/listening remains open. Neither44nor earlier presentation/Reverse/parameter repairs is established pop causation. No speculative DSP/clock/fade change. Only94bundle remains; default starters94syntax checked, verified inactive92retired.

Historical23long frames, worst242.5ms, remain unattributed. Prior clean tone/music captures and53manual/EQ/Cue/stop acceptance retain their original scope. Capture the next actual pop/stall with original recording, exact version, tracks, positions, rates, transport states, clicked deck/action and event time. Stop repeating clean cases; more green automated runs do not satisfy owner/device gates.

[Current ordered re-entry and full requirement audit](CORE_DJ_REENTRY_2026-10-28.md), [staged94identity](DESKTOP_CORE_094_2026-10-28.md), [closed-profile evidence](CLOSED_092_RECOVERY_2026-10-28.json), [same-fader case](TEMPO_SLIDER_MASTER_QUEUE_2026-10-28.md). Existing owner cardCORE-LIVE-01and defect cards01/07remain open; hardware/listening deferred. Earlier28October86–89checkpoint text remains in [immutable history](https://github.com/jpoindexter/open-play/blob/d15370ae15ece7841a120a0045187ad6b28e1a2a/docs/prototype/SYNC_POP_INVESTIGATION.md); it is not a current launch instruction.

## Historical investigation

Status: **intermittent user-reported defect; not reproduced in the scoped captured attempts; not fixed**. Production revision100ee9f / HTML224. No native rebuild or production audio change. Core-only outcome remains two real local tracks, cue, mix and beatmatch.

## Observed sequence

1. Jason confirmed incoming tempo now matches the outgoing deck, but reported a pop on Sync.
2. He clarified that the pop can occur even with track2 paused. Do not dismiss this as an audible phase jump of two playing sources.
3. Base-player and full rekordbox-preview captures used production Play/Sync handlers, a continuous73Hz tone on outgoing deck1, paused incoming deck2 and actual postmaster Float32 PCM. These stayed continuous.
4. A trusted pointer click through the full preview likewise matched the paused follower without changing the outgoing voice/rate or starting the follower. Six-second capture264600frames at44100Hz: peak0.04043792188, maximum sample step0.000420582277, maximum absolute second difference0.000004384667, zero exactly-silent frames. The declared tone discontinuity threshold was0.001. Metadata is private local-evidence/sync-pop-225/paused-pointer-before.json. This is captured engine-output evidence, not physical-device loopback or proof that the original bug is resolved.
5. Refreshed actual user state: Simple Sync / Snap to Beatgrid enabled, both real MP3s loaded. Neutralized tempo and Sync, started LEFT Moonglow at121BPM, kept RIGHT Can You Feel It paused, then started the app's existing Master mix recorder. Jason clicked RIGHT BEAT SYNC and answered **No pop this time**. Observed LEFT playing121 and RIGHT paused121, both engaged. Stopped recorder and paused LEFT. Final recorder reports585545bytes. It is retained in the current Recording panel. Download capture was invoked, but the expected file was not found in Downloads; no on-disk recording preservation claim. Do not reload that tab before preserving the recording if it is still needed.

## What the code establishes

The paused-follower path calls setRate only on the incoming deck; it does not run transient analysis or synchronize/phase-seek the outgoing deck. The playing-follower path uses a scheduled voice replacement with10ms source-gate fades. These are separate paths. The scoped paused captures preserve outgoing source identity and nominal rate. Effects and presentation still receive updates during Sync. None of those code observations identifies the intermittent audible fault. No speculative fade, graph or buffer changes were made.

## Narrow reproduction tool

Open /prototype/sync-pop-harness.html?pointer on the existing localhost8848 server. Capture paused-deck Sync arms six seconds of physically muted, postmaster PCM using the real full preview and production handlers. Click the visible deck2 Sync control when the capture is armed. The report records whether the click was trusted, rates, play states, outgoing voice ownership and continuity metrics. Controlled fixtures temporarily replace deck objects and are restored in finally; library source files are untouched. The regular user-facing tab remains separate.

The tool also supports a programmatic DOM click without the pointer query for isolation. Neither substitutes for the user's actual music/output acceptance. Do not expand this into a broad effects or hardware matrix.

## Next action and stop condition

CORE-FIX-01 stays open: https://trello.com/c/6cK0v0iy. Preserve the current master's playing tempo. If the pop returns, record that exact real-track event with the existing REC panel, noting which Sync button, which decks were playing, key lock state and whether the captured recording contains the pop. An absent pop in internal output with an audible physical pop would focus investigation on output scheduling/device underruns; that is currently a hypothesis only. A pop retained in the capture would allow sample-level localization. Do not claim either mechanism now. Avoid further clean-case repeats without new evidence; continue the core DJ workflow when the current session remains smooth.

Preserved: all custom DJ controls, library waveform previews, layout variants and core control access. No desktop rebuild. Recommendations remain Codexgpt-6.1-sol/high; alternate reviewer ClaudeSonnet5/medium, escalation only with an actual unresolved failure artifact. No additional agent was invoked.
