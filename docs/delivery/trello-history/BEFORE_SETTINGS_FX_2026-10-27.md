# UI-SET-01 before the bounded FX-return summary

Card: https://trello.com/c/pBDYCLui

## Current bounded Settings repair — 27 October 2026
OPEN. Actual isolated current browser Audio→nested Devices→keyboard Back selected Audio but lost focus to BODY. Existing toolbar now restores selected-tab focus and prior scroll after Astryx mounts; guards preserve newer focus/view ownership. First strict guard incorrectly rejected the still-focused Back owner; traced/corrected, no debug probe remains.

Same actual path now focuses Audio. Long Library + Display345pxscroll→Provider simulation→keyboard Back preserves same345pxscroll/selected tab/focus. Six Layout choices accessible; Escape closes and focuses Settings trigger. Two generated decks stay0/0,2Play controls/5library previews present; no preference/Play/Sync/REC action. One focused handler ownership check passes; no full suite/soak/new package.

Source ahead of running74; toolbar86lines/test18lines, no new runtime module/DSP/layout change. Native74user session had changed to two decks and was preserved; no native focus/playing acceptance claimed. Other nested destinations including FX, drafts and broad criteria below remain open. Report docs/prototype/SETTINGS_BACK_FOCUS_2026-10-27.md and settings-back-focus-2026-10-27.json. Controller/listening remains for later, independently.

--- Retained criteria and historical evidence ---

## User report — 20 October2026
OPEN. After opening a Settings tab/subpage, navigation is lost and the user cannot get back without closing Settings. Provide visible persistent tabs or a clear Back action to the originating page. New Layouts tab must not introduce this problem.

## Acceptance
- Keep top Settings tabs visible/reachable while tab content scrolls, with selected state and keyboard focus clear.
- From nested Devices, MIDI mapping, FX, provider/calibration and other Settings destinations, return to the originating tab with a labeled Back action or retained navigation. Do not require closing/reopening Setup.
- Preserve settings, form drafts where applicable, scroll/focus context and playing audio; no reset or transport change from navigation.
- Back and Escape/Close have predictable distinct behaviour; no loops or abandoned hidden modal state.
- Check one long tab, Layouts, and representative nested Settings destination through actual native UI and keyboard. Preserve custom controls/library previews.

Models — recommendations: Codex gpt-6.1-sol/high; Claude Code claude-sonnet-5/high subject to availability. Reuse existing Settings/dialog patterns; avoid a new routing framework. No broad audio matrix for navigation-only changes.
