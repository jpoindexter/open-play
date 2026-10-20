# Core deck and Sync corrections224 — 20 October 2026

Scope: user supplied four current reference/prototype screenshots and requested separate tracked fixes. HTML only; no desktop/native rebuild. Preserve the existing player, tracks, controls and waveform previews.

1. Sync master selection: Simple Sync currently treats the opposite deck as leader based on the clicked Sync button, so Sync on an outgoing deck can retime it to an incoming deck. Implement stable auto master from earliest active playback and explicit MASTER choice; incoming deck follows. Core bug, not cosmetic.
2. Tempo fader: replace floating footer range with a clearly deck-owned vertical rail and matching channel-style cap, centered marks/range/reset. Preserve keyboard and original tempo semantics.
3. BPM fine adjustment: visible/discoverable minus/plus near each platter, focus-accessible and no inadvertent scratch/play; same engine path. Do not guess proprietary step size.
4. Group deck actions: Sync/MASTER/OFF together, Play/Cue together, loops together, secondary utility actions within the same deck. Preserve all core controls in Compact2/4decks and both waveform orientations.

Prior manual-return reply was positive, but subsequent accessibility showed leftSync off/rightSync still on and pitch sliders at opposite endpoints. Treat manual-return acceptance as user-reported only; current numeric/Sync state was not corroborated. Keep the newly reported scenario distinct from the earlier audible synced transition.

Status: implementation and executed subsets are recorded below; fresh listening/mouse acceptance and the broader core milestone remain open. No all-parity or full-core completion claim. Existing keyboard completeness UI-002 remains open.


## Implemented and executed

- `sync-master.js` records successful playback order and a track-owned explicit choice. Sync now targets the incoming follower even if the outgoing deck's Sync button is pressed. MASTER shows the current selection; selecting another deck pins it, Shift-activating returns to automatic selection. New track load cannot inherit an old explicit selection. No leader audio-rate call is added.
- Simple Sync uses the chosen leader/follower through the existing `synchronizeSimple` engine path. Smart Sync receives a master choice without retiming it; external clocks retain priority. Controlled Simple/Smart tempo tests show only the follower receives a rate update; this does not establish all Smart/warp/external-clock audio behavior.
- Actual normal browser UI, real Moonglow and Can You Feel It: outgoing LEFT130.7BPM/+8%, incoming RIGHT115.5BPM. Start LEFT then RIGHT, press LEFT Sync: LEFT remains130.7/+8%, RIGHT changes130.7/+13.1%; both timers advance and LEFT remainsMASTER. Reversed order from explicit0% reset: outgoingRIGHT124.8BPM, incomingLEFT121.0; RIGHT Sync leavesRIGHT124.8 and changesLEFT124.8. These are executed display/transport observations, not a fresh user listening-quality pass.
- Actual keyboard MASTER selection choosesRIGHT; Shift+Enter returnsAUTO withLEFT selected when idle. No playback starts from this operation.
- BPM+ button takes real LEFT121.0→121.1 at+0.1%; 0%reset restores original speed. Existing original range, relative/absolute tempo logic and audio handler retained.
- Original pitch input is moved into a labelled A/B/C/D TEMPO rail along its own deck's outer edge. Same channel-style cap and centered ticks; range and0%reset stay beside it. BPM−/+ are adjacent to each platter, ordinary focusable buttons. Original transport, loop, key and utility nodes/handlers remain; tools are visibly deck-labelled.
- Actual Compact geometry after corrections:2H212px,2V224px,4H/4V208px deck heights.132px rails; two fine controls per deck; all rendered original action/tempo controls checked lie within their own deck. Ten library previews remain. No extra empty deck rows. These checks establish containment and retained controls at the current1440logical-width review, not every viewport or human visual acceptance.
- Two layout problems found and corrected before delivery: unconstrained vertical input inflated deck height to970.5px; a132px bounded rail removes the intrinsic sizing cycle. Right-deck label inherited grid-column3 and protruded; rail children now explicitly share their single grid column.

## Retained limitations and test setup

The first reverse-order check omitted explicit0%reset after OFF; OFF retained prior matched tempo, and both later showed139.9. That was not the intended neutral124.8 setup. The actual declared reversed case above was then executed from explicit0%reset. OFF and0%reset are deliberately distinct controls; do not infer0%native speed from merely disengaging Sync.

Browser coordinate/AX clicks intermittently selected other rows or detached nodes in the narrowed panel. Actual keyboard library navigation and focused native button Enter actions were used instead, with real track identities checked before accepting results. Initial wrong/demo loads are not accepted musical evidence.

Focused checks: `node prototype/sync-master.test.mjs` (selection scenarios and real Simple/Smart tempo functions with controlled engine), `node prototype/fader-preview.test.mjs` (existing detents), JS syntax and whitespace checks. No broader FX/stems/DSP matrix. Final visible setup: rekordbox2DeckHorizontal/Compact; both real tracks paused0, SyncOFF, pitches0%, master output−12dB, crossfader centre. Latest source tests do not prove physical Hercules/headphone separation, direct mouse-rail feel, full shortcut coverage, all Smart/warped configurations or renewed perceptual Sync acceptance. No desktop/native rebuild.

## Separate tracking

- CORE-FIX-01 Sync master: https://trello.com/c/6cK0v0iy
- CORE-FIX-02 Vertical pitch rails/caps: https://trello.com/c/K8UGCT2P
- CORE-FIX-03 BPM fine controls: https://trello.com/c/902sYCVG
- CORE-FIX-04 Deck action grouping: https://trello.com/c/dHVXccVC

All remain open for the explicitly stated acceptance gaps; implementation and executed subsets are recorded, not full-core/full-parity completion. Core keyboard completeness stays on UI-002 https://trello.com/c/jRUbfpKM. Private screenshot: local-evidence/core-deck-sync-224/two-deck-horizontal.png.


## Reference and keyboard focus

Official current manual: https://cdn.rekordbox.com/files/20260409151936/rekordbox7.214_manual_EN.pdf . PDF pages125/149 describe platter tempo−/+ and tempo reset separately from held pitch bend; page115 describes the first playing deck as Sync Master and the incoming player following it. This supports the ownership/affordance distinction, not an exact proprietary algorithm or numerical step. Open Play's new step is explicitly labelled0.1%, using its existing ranges.

New MASTER and BPM-step actions update the existing controls without rebuilding the focused button. Actual first Enter on BPM+ plus another native Return with no refocus gives+0.2%/121.3BPM; activeElement remains the same BPM+ button. Reset returns the original tempo. Full keyboard coverage remains on UI-002, not closed by this focused result.
