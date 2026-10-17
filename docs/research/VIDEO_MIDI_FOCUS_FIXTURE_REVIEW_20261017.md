# Independent assignment cancellation/fixture review — 2026-10-17

The instrumented original browser result remains **8/9 and unaccepted**. Parent executed the browser; this review reads saved data and production/harness source, with no UI/product/Git/device action. Applied adversarial verification and test-criterion integrity.

## What the failed record proves

`docs/prototype/overlay-midi-browser-instrumented-results.json` SHA256 `248e53fc2e1c3b6672ea543ab03394379318eb28a39fad6c11d05979ebf5395e` records a scoped VideoCrossfader CC20 mapping, crossLinked false, auto false, and after the nominal Exit click **active true**. Both CC20=127 and0 are logged, but cross remains0 and the strict cross=-1 wait fails. This is consistent with the production assignment receive guard consuming messages while active (`prototype/panels.js:1584`). It does not independently identify why mode was active, because this record omits assignment status/mode immediately before the toggle. No focus-loss cause is inferred from that original failure alone, and it is not relabeled as a pass.

The production toolbar click is a toggle (`prototype/video-midi-assignment-ui.js:25–27`). Focus loss and visibility cancellation are explicit source behavior (`46–47`). Consequently, clicking the toolbar after an earlier cancellation would restart assignment, which explains the failed final state **only if the earlier cancellation is actually observed**. A global modal close listener also cancels (`45`); a generic cancellation label cannot substitute for distinguishing the observed reason. No new production cause is established here.

## Conditional-exit fixture criterion

The revised first check records modeBeforeExit and captureStatus. If still active it must use the real toolbar Exit; if already inactive it must require the explicit focus/hidden cancellation reason, preserve it in the raw JSON, and then require inactive mode and the unchanged exact cross=-1 result. The first branch proves explicit Exit; the second proves subsequent normal dispatch after observed cancellation, **not** explicit Exit for that first case. It is a defensible fixture accommodation only when reports preserve that distinction and original failures.

The remaining assign() helper still unconditionally clicks Exit and asserts mode inactive before later opacity/route dispatch. This keeps strict toolbar-exit execution in other cases. No tolerance, mapping/device requirement or fader endpoint should be relaxed. Programmatic DOM actions with a controlled browser MIDI adapter still do not prove real pointer/physical MIDI behavior or fullREQ-516.

At initial inspection the revised harness SHA256 is `b4b45f55d95e1a1e469ea405ee925f211cfbd836c74272394667442a654b2a2a`. No new actual result was available at this point; browser acceptance remains pending until the new raw is independently inspected. Existing independent five-fix/owner checks remain controlled evidence and cannot promote this browser run.

## Actual cause and corrected ownership

The next preserved `overlay-midi-browser-delayed-dialog-close-red-results.json` records modeBeforeExit false and exact captureStatus **MIDI assignment cancelled when the dialog closed.** Thus the focus/hidden branch intentionally failed; no cancellation workaround was accepted. The prior dialog's delayed close event had canceled a later panel assignment. The parent changed only the production UI owner handling: toolbar start remembers panel/modal; delayed close cancels only a modal owner while that modal is actually closed. A stale event while the dialog is open/reopened is ignored. Explicit close buttons, blur/hidden and Escape still cancel normally.

New independent actual-listener/assignment collaborator checks execute **5/5** in `video-midi-assignment-view-owner-independent-results.json`, at UI SHA256 e7943f249f0b67e1e70018bc4d050a237bc8c1a39407a2808950b74c43aedc2b. They cover delayed close/new panel, closed current modal, reopened-modal old event/explicit close, pointerdown+click single selection plus Enter/Escape/focus restoration, and blur/hidden cancellation. These controlled event buses do not establish native HTMLDialogElement scheduling; the parent's actual corrected browser run provides that separate execution.

The corrected initial report now has9/9 with modeBeforeExit true, the exact Assigned status, Exit active false and cross=-1 after CC20zero, plus actual left pixel[23,50,59,255]. The strict criterion was restored and the source defect addressed; the earlier8/9 results remain failed. See the separate VIDEO_OVERLAY_MIDI_BROWSER_INDEPENDENT_REVIEW_20261017.md for artifact verification and limits.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
