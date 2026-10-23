# Sync pop investigation — 20 October 2026

## Current disposition — 23 October 2026

**OPEN for the broader intermittent report.** Desktop0.1.46/source57bc6c4 changes renderer work only: ordinary transport updates preserve controls and unchanged library visibility no longer invalidates page-wide style. Prior ordinary/key-lock/warped deadline guards and owned rollback remain. Matched8different-real-track/15rotation browser sessions complete; extra4s Sync captures use paused Circulation/Cherry and playing Dr Dunks/Slow One Eleven against Jewel Kid/In The Dance, preserving outgoing master voice/rate.14whole PCM windows finite; no post-startup exact-zero telemetry; source-grid phase≤3.371µs.98Node/package5 and normal-profile stopped native startup pass.

These are not fresh listening, device-output or every-pop-cause proof. LoAF60→35 and worst149.9→108.3ms, with remaining load/row-refresh stalls open. Continue event-aligned actual-pop capture and remaining renderer investigation; no cosmetic grid snapping or speculative audio changes. [Current report](CORE_FOUR_DECK_REFRESH_2026-10-23.md), [comparison](four-deck-refresh-results.json), [PCM inspection](four-deck-refresh-pcm-inspection.json), [prior handoff repair](CORE_FOUR_DECK_TRACE_2026-10-23.md).

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
