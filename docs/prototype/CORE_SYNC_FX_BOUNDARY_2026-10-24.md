# Core Sync effect-tempo ownership — 24 October 2026

Source **6980024** repairs reproduced effect-parameter timing and ownership errors during grouped tempo changes. Focused checks pass **7/7**, full Node **168/168**, and independent narrow review found no concrete introduced regression. The live-keylock review fixture is separately repaired in **9a8451a**, retaining all nine original checks. **Actual native parameter timing and audible Sync pops remain unverified.**

## Reproduction and repair

Two independent controlled executions of the actual `AudioEngine.setSyncedRates`/start/handoff methods observed effect BPM changing while old audio was still current. At audio clock10s with a committed future handoff10.17s, the parent case reported audible120BPM but channel/unit FX240BPM. A mixed keylocked/raw playing pair plus paused deck similarly received132BPM before the playing pair left120. The existing app tick then corrected the playing effect tempo until the boundary.

A warped preparation also multiplied base120BPM by local audible rate0.8, producing96 rather than local150×0.8=120BPM. Finally, an older group's per-channel await allowed a replacement track to establish81BPM, then the old continuation overwrote its unit-FX metadata with132BPM. The replacement track/rate/transport survived; its effect tempo did not.

The engine now reuses the existing pure `currentDeckBPM` calculation. Running effects follow the local grid and audible voice; stopped engaged decks retain planned nominal tempo. Group completion seeds from current channel values, updates only current track/rate/request/generation owners and calls the existing `updateFXBPMs` once. This removes the serial await followed by stale unit writes. A revoked start checks ownership immediately after resume before touching FX. Existing live and ordinary/restart FX writers use the same calculation. Stem Slip/gesture branches, clocks, DSP and fades are unchanged.

Seven regressions executed RED6fail/1pass, then GREEN7/7: flat/warped mixed members, no unit state, replacement during a paused channel callback, a newer paused-rate owner, FX error reporting without rejecting committed audio, and revoked resume after replacement. The original parent fixture initially lacked `deckInput`; that setup failure is excluded before the corrected parent reproduction.

## Separate QA and remaining stalls

The original live-keylock review also lacked that graph input. An immutable ba4f0de archive and current source both reproduced its pre-existing failure. The repair adds only a controlled getter alias and its boundary comment; production creates a distinct real gain node. All nine original check statements/assertions and source-boundary hash labels remain; the original current-engine script passes9/9 with matching engine hashes. This is a narrow QA completion, not native routing acceptance.

Parallel performance review found three queued overview draws for three pre-frame orientation changes and repeated unchanged sizing metadata assignments in projected Traktor-flat painting. These remain observations on existing cards, with no product changes. Their controlled work counts do not establish reflow cost, a native stall or an audible-pop mechanism. No per-frame decoration loop was found; the other rotary/fader/headphone synchronizers already cache unchanged values.

## Live checks prepared for unlock

The user asked to leave live checks until the Mac is unlocked; no new UI, real playback, normal-profile mutation or desktop build was attempted in this slice.

1. Resume the prepared source-pinned orientation comparison: baseline99abf2a versus ba4f0de isolates that repair, with20-module manifests and a duration-independent turn10 event capture. It is not a test of the later6980024 FX repair.
2. In a separate fresh isolated current-source session, use different real songs, two keylocked and two raw decks, with one of those four paused and engaged. Change shared tempo through its real deck control. Retain actual channel/unit parameter events, audible voice/grid clocks, future handoff times, master, controls/previews and source identities before/at/after the boundary. Exercise replacement/newer rate ownership separately. The expected result is no premature future or stale-owner BPM write; the recorded parameter window must be inspected before runtime acceptance.
3. Continue the existing bounded incoming-paused/playing Sync captures. Retain the next actual reported pop; clean attempts do not close the intermittent defect. Preserve recordings/originals/session, physical mute for unattended diagnostics, and later manual/headphone/controller gates.

The current renderer-tick refresh remains. These source checks do not prove sample-accurate FX scheduling during a main-thread stall, pop-free audio, musical downbeats, late-song grids or hardware behavior. Other unattributed217.3/242.5/189.8ms events remain separate from the [retained100.3ms orientation incident](CORE_NATIVE_STALL_CAPTURE_2026-10-24.md).

[Source/test receipt](sync-fx-boundary-results.json) · [CORE-FIX-11](https://trello.com/c/NQaqOSUX) · [QA-FIX-03](https://trello.com/c/xFPtWDOd). CORE-FIX-01/07/09/10/11 remain open; only the narrow QA repair can close. Normal desktop0.1.52/source df48b50 remains separate from these newer source commits.
