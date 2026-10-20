# Core listening session — desktop0.1.30

20 October2026. Current native source9447710, ASAR50b2ace08404218204b5ac70fcd34c1ea0f170b36f0a575374d92d77f27102b3. Actual native window is Open Play Playback Test0.1.30; browser panel is a separate session. Last hardware report: computer audio, Hercules disconnected. No physical cue/master isolation acceptance.

Jason replied “Yes—ready to listen” to the pending readiness question. Proceed one short step at a time; do not repeat previously accepted playback/filter/crossfader checks unless a current failure justifies it.

| Criterion | Current evidence |
|---|---|
| Independent manual right tempo/reset, SyncOFF | **User confirmed:** “Yes—speed changes independently and resets.” Instruction: startRIGHT, moveBTEMPOeach way, restore0%, leaveLEFTpaused. |
| Jog G/H temporary slower/faster and nominal return | **User confirmed:** “yes” to G slowing, H speeding and normal speed after each release. ClickedRIGHTtrack title first to leave the tempo input. |
| Per-channel LOW/MID/HIGH cuts and neutral reset | Native UI cut/reset observations already recorded; current audible acceptance pending. |
| Manual beatmatch and transition without Sync | Pending; reset both pitch controls before setting incoming tempo. |
| Temporary Cue audition/release and Cue+Play latch | Pending current hands-on native listening. Controlled pending-preparation regression passes; automation cannot hold two non-modifier keys together. |
| Clean stop, silence, no queued restart | Prior native meter/timer observations exist; current practical final stop pending. |
| Sync pop disposition | OPEN; earlier intermittent report, latest quiet retry. No speculative patch or repeated clean captures. |

Read-only observation during the tempo check: RIGHTposition43.028s/playing, RIGHTpitch0/115.5BPM, LEFTpaused0butpitch+8%/130.7BPM, bothSyncOFF. User's tempo confirmation is scoped to the instructed audible behavior; this observation does not prove untouched LEFTpitch. Reset LEFTto0before the manual mixing segment. Do not change controls while Jason is performing the pending jog check.

Re-entry: collect the current jog result, then EQ, Cue and one manual transition/clean-stop segment. Preserve all controls, layout variants and waveform previews. No desktop rebuild or source change is needed just to run these listening checks. Record failures before changing code.

## New core failure reported during the session

Jason supplied a screenshot of misaligned waveform beat/bar lines, initially describing approximate audible sync. He then clarified: “yeah i just manual matching by clicking and releasing it on beat, it doesnt synch100% sounds off like a tranwreck as they say”. Treat current beatmatch/Sync acceptance as FAILED/unresolved; earlier smooth-transition evidence remains historical/scoped. Both audible phase and visual beat-line alignment require audit. Do not draw aligned lines to conceal an audio/grid fault.

Native captured state before any change: both paused; Moonglow42.687s, followerpitch−3.8%/116.5BPM; Can You Feel It211.357s, explicitly selectedMASTERpitch+0.8%/116.5BPM; bothSyncengaged. ActualSetupshowsSimpleSyncandSnaptoBeatgridchecked. Original screenshot/AX in ignored `local-evidence/sync-alignment-030/`.

Additional requested scope: remove top style bar and put all six layouts in a dedicated Settings tab; add separate Trello cards for double-click defaults and mixer wasted-space/control-spacing. Preserve the active core goal and the pending EQ/Cue/manual musical gates.

## Toolbar cleanup and verified backlog order

The latest screenshot shows three stacked toolbar rows. Jason requested a tracked cleanup: distinguish actual performance controls from reference/testing controls, place real controls in their relevant interface regions with icons, and remove testing clutter from normal performance. Preserve accessible names, tooltips, selected state, all core controls, layout choices and library waveform previews. Inventory behavior before deciding which controls are diagnostic; do not delete working features merely to simplify the bar.

Created and read back [UI-TOOL-01](https://trello.com/c/HEKvQ7iv). The card includes the control inventory, placement/accessibility criteria, compact/full and two/four-deck acceptance, and model recommendations. This records requested work; it does not claim the toolbar is implemented or visually accepted.

Verified board readback: 138 open cards, no pagination remaining; Core Now 23, Next 21, Later 87, Blocked 4, Approvals 2, Evidence 1. Existing history and broad acceptance criteria remain intact.

Execution priority:

1. [CORE-FIX-07](https://trello.com/c/QGW47XIJ): audible beatmatching/Sync and grid/display alignment; retain the separate intermittent-pop defect.
2. Remaining core Cue/keyboard safety and practical EQ/Cue/manual-mixing acceptance.
3. Next list, in saved order: [UI-001 layouts](https://trello.com/c/FhNUL2TA), [UI-SET-01 Settings navigation](https://trello.com/c/pBDYCLui), [UI-TOOL-01 toolbar cleanup](https://trello.com/c/HEKvQ7iv), [UI-MIX-01 mixer spacing](https://trello.com/c/XxPtK57b), [UI-RESET-01 default resets](https://trello.com/c/0E3HXFPl).

Decision rule: audible reliability and safe transport precede visual cleanup. Revisit this order if a new core failure appears; advanced features remain deferred. Owner: current Open Play implementation task, with Jason providing musical listening acceptance. Re-entry is the Sync failure audit, not another layout redesign. Source changes to move layout selection into Settings are still uncommitted and unverified in a new desktop build.


## Follow-through to31/32

Actual31source7b95948packaged/inspected5of5/launched. Native Settings→Layouts initially listed six choices and Serato selection updated the shell/selected state. Startup rekordbox displayed ten waveform previews; source32must additionally verify repeated dialog reopening because31later reproduced blank Settings controls. The user restored the rekordbox layout and both real songs during the session; subsequent native state showed both real songs at matching121BPM, then both paused. A210.42s master capture from the clean-attempt user report was saved and decoded finite stereo; see SYNC_ALIGNMENT_AUDIT_2026-10-20.md. Earlier audible failure, new lag/pops and thick-grid offset remain open. Actual mode clarification: failures happened both ways, not only paused launch.

Source32corrects the reproduced Astryx new-control identity omission and removes the unconditional BEAT SYNC label override. These are controlled-regression/source changes, not proof of good musical sync. Next: actual32Settings reopen, explicitly select phase-aware Smart Sync, one practical real-track phase/quality check. No silently rewritten track grids, no broad advanced DSP matrices. Native REA reference attempt timed out; native accessibility and official primary docs were inspected separately.
