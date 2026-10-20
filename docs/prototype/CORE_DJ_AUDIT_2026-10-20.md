# Core DJ workflow audit and implementation plan

Date: 20 October 2026. Audited source: `2bd8164`. Expected load: one local Mac user mixing two real, approximately six-minute MP3s. Active candidate: rekordbox HTML / Horizontal / Compact. This is not a desktop or vendor-parity acceptance report.

## Execution boundary

Jason approved this plan with an explicit stop condition: **save the audit, update current documentation/handoffs, reconcile Trello, verify those changes, then stop**. The code fixes, listening session, broad cleanup and desktop build are not part of this reconciliation pass. All implementation work below remains queued. No production HTML/CSS/JavaScript or native package is changed by this pass.

Preserve custom DJ controls, every layout variant, RGB source waveforms and decoded library previews. Keep the intermittent Sync pop open. Existing desktop approval is historical authorization for named local test builds; the latest instruction for this work is HTML only and no rebuild.

## What this repo does and verdict

Open Play plays and mixes local audio through a browser audio engine and has an existing Electron test host. The engine is substantially implemented. The next useful implementation block is two targeted safety fixes followed by one practical mixing session, not another rewrite or advanced-feature expansion.

Five independent advisors and five fresh anonymous reviewers completed a same-model LLM Council. The responses were presented with shuffled A–E identities and formatting normalized for peer review. This corroborates reasoning, not empirical application behavior or statistically independent model agreement. They agreed on a bounded two-track session and retaining prior evidence. Some would investigate Sync before everything else; the selected sequence allows manual mixing work to advance while retaining the pop as an unresolved acceptance limitation. Peer review demanded exact actions, evidence boundaries and a stopping rule for clean, inconclusive retries.

## Audit findings

### Must fix before claiming the affected behavior safe

1. **An old cue request can start a replacement track** (`prototype/holds.js:72`; integration in `prototype/app.js` load/Play paths).
   - What this is: temporary cue seeks before starting audition.
   - Problem: a controlled execution of the real cue module replaced track A with B while seek was pending; resolving it started B. Ownership is not rechecked after the await. Stale holds can also intercept Play.
   - Fix: synchronously revoke cue ownership on load/eject/explicit stop, validate track/request generation after asynchronous work, and latch only current holds.
   - If skipped: replacement can cause unwanted playback or consume the next Play command.
2. **Modified shortcuts can trigger unrelated DJ actions** (`prototype/app.js:1892`).
   - What this is: global keyboard dispatch.
   - Problem: controlled execution of the actual handler showed Command+I invoking temporary cue and Ctrl+O invoking Loop In.
   - Fix: explicitly allow intended modified bindings, then reject unrelated Command/Ctrl/Alt combinations before playback dispatch; guard typing/modal/composition and preserve held-action cleanup. Intentional cue-delete bindings are not classified as accidental actions.
   - If skipped: browser/system shortcuts can change playback.
3. **Sync has an intermittent audible-pop report** (`docs/prototype/SYNC_POP_INVESTIGATION.md`).
   - What this is: incoming tempo matching now preserves the outgoing master.
   - Problem: Jason reported a pop, including with incoming paused. Subsequent captured attempts and his real-track retry did not reproduce it.
   - Fix: retain the defect and capture an actual failing event with transport/tempo timing; change audio code against concrete failure evidence.
   - If skipped: matching BPM numbers can be mistaken for reliable audio.
4. **Malformed backup restore can save invalid state** (`prototype/panels.js:465`).
   - What this is: importing library metadata/settings.
   - Problem: a controlled execution accepted `cues: null`, replaced prior state and reached persistence before render failed. This did not modify the user's actual profile.
   - Fix: validate the complete payload in temporary state before applying it; reject malformed cue/settings/metadata values without mutation.
   - If skipped: bad backup data can leave the UI broken after reload. This is tracked separately; restore is not required for the next mixing test.

### Should fix, sequenced by the core boundary

5. **Sync replaces focused controls** (`prototype/app.js:1078`).
   - What this is: Sync completion redraws all decks/mixer.
   - Problem: replacing their DOM elements loses focus and adds layout work.
   - Fix: refresh existing Sync/MASTER/OFF/tempo presentation in place.
   - If skipped: keyboard operation remains disruptive. This is not a demonstrated cause of the pop.
6. **Mixer headphone CUE lacks deck-specific accessible state** (`prototype/app.js:634`).
   - What this is: channel headphone-monitor selection.
   - Problem: selected state is conveyed through styling without a deck-specific name or `aria-pressed`.
   - Fix: use “Headphone cue deck N”, expose selected state, distinguish it from temporary deck Cue and explain both in Help.
   - If skipped: identifying/confirming monitor selection remains difficult. Physical routing needs its separate device test.
7. **The wrapper shrinks small controls** (`prototype/layout-preview.html:7`).
   - What this is: a 1440-pixel logical workspace scaled into narrow windows.
   - Problem: a 24×20 logical-pixel button becomes about 13×11 pixels at an 800-pixel viewport. This is source-derived geometry, not a new live observation.
   - Fix: address rendered target sizes under the existing scaling policy without overlapping controls or starting another layout redesign.
   - If skipped: narrow-panel fine adjustments remain difficult. Live inspection was blocked by browser URL policy; no workaround was attempted.
8. **Decoded audio has no automatic cache bound** (`prototype/engine.js:149`).
   - What this is: decoded tracks remain in the engine buffer Map until manual cache clearing.
   - Problem: six minutes of stereo 44.1kHz Float32 audio uses about 127MB; successive loads accumulate memory.
   - Fix: later bound inactive buffers while protecting active/pending users.
   - If skipped: longer practice sessions can become memory-heavy. The immediate two-track session is not blocked by this finding.
9. **Layout adapters bypass design tokens** (six preview adapter stylesheets).
   - What this is: generated tokens coexist with several layout CSS layers.
   - Problem: lexical inventory found557 color literals,1981 pixel literals and115 `!important` declarations. These counts are not automatically proven violations; deliberate microspacing and custom DJ geometry remain valid.
   - Fix: consolidate repeated semantic values/conflicting rules when touching affected controls; retain custom DJ controls and Astryx for standard UI.
   - If skipped: cross-layout corrections stay difficult. A global token rewrite is deferred.
10. **Entry documentation and Trello summaries are stale** (`README.md`, `prototype/README.md`, current-status card headers).
    - What this is: documents/cards describe historical candidates as current.
    - Problem: README advertises desktop0.1.23; prototype instructions say imports require reimport after reload; Sync's header omits the latest pop disposition.
    - Fix: one current summary first, historical evidence linked/retained, and reconciled card summaries.
    - If skipped: future work follows obsolete launch/status instructions and repeats accepted checks.

## Evidence from the audit pass

- Controlled source/module reproductions: pending cue plus replacement; modified-key dispatch; malformed backup restore. These establish the specified code-path defects, not current native/device behavior.
- Existing GUI tempo-slider checks:8/8 in a controlled coordinate/async-engine model.
- Existing jog-policy checks: passed controlled ownership, bounded bend, idle/disconnect return, old-voice protection and error restoration. Not audible/physical acceptance.
- Desktop lockfile dependency audit: zero reported advisories. This is not a complete security or vendored-component provenance audit.
- No fresh listening, current live geometry, VoiceOver, physical Hercules/headphone routing, packaged desktop run or line-by-line audit of every advanced DSP implementation was performed. No full security/accessibility/parity certification. No deletion/dependency removal justified.

Design review applied Nielsen visibility/consistency, Norman control mapping/feedback, accessible names/states and project token ownership. The generic design-system rule to replace custom UI does not apply to the explicitly preserved DJ controls; standard UI remains Astryx.

## Next implementation block — not executed in this pass

### 1. Repair core control safety

- Add internal `cueHolds.cancelDeck(deck)` with synchronous ownership revocation. Invoke before replacement/eject/explicit stop; protect each asynchronous completion and current-only latch.
- Correct shortcut modifiers, typing/editable focus, modal/composition guards. Preserve intended modified bindings and release held actions even if focus/modifiers change before keyup.
- Refresh Sync presentation without rebuilding decks. Add accurate headphone-CUE state/names and temporary-Cue help.
- Keep regressions narrow: pending seek/replacement; subsequent Play; quick release before preparation; unintended modified shortcuts; normal cue/jog release and blur cleanup.
- No backend/native interface or audio-format change.

### 2. One current-HTML mixing session

Use the saved real Moonglow and Can You Feel It tracks in rekordbox Horizontal/Compact. Refresh actual runtime state; do not assume the historical paused setup remains current. Preserve the current recording before reload if it is still needed; its prior filesystem download was not verified.

| Check | Action and observable pass |
|---|---|
| Manual tempo | SyncOFF both, explicit0%reset both; change incoming pitch independently while outgoing speed stays unchanged. OFF alone is not a pitch reset. |
| Jog nudge | T/Y left, G/H right: hear temporary slowing/speeding, nominal rate restored on release; check focus-loss cleanup once. |
| Manual beatmatch | Align tempo/phase by ear and complete a short transition without Sync; matching labels alone does not pass. |
| EQ | LOW/MID/HIGH cuts on each channel one at a time, hear the intended channel change, reset neutral. |
| Temporary Cue | Paused set; hold audition; release returns paused; hold Cue then Play latches playback beyond release. |
| Clean stop | Both paused, audible silence, stopped timers and no queued restart. |

Reuse accepted independent playback/fader/crossfader/filter evidence unless changed. Repeat only a failed segment after its fix. No stems/effects/broad DSP matrix. Computer audio can establish temporary-Cue audition and main mix; it cannot establish independent physical headphone routing.

### 3. Bounded Sync follow-up

Retain CORE-FIX-01. During that session capture one paused-incoming and one playing-incoming Sync action, preserving outgoing master tempo. Record revision, positions/rates/play states/clicked deck and what Jason hears. Retain a failing recording and investigate it if a pop occurs. If both are clean, stop repeating clean attempts and leave the intermittent defect open. Manual acceptance may advance; full core completion cannot be claimed without an explicit disposition of the pop.

## Trello reconciliation contract

Inventory:131 existing incomplete/unarchived cards, all retaining Codex/Claude model guidance. Preserve every card, criterion, history and model recommendation. Review all dispositions; change stale summaries or actual sequencing, not unaffected history.

| Destination | Target after two new cards |
|---|---:|
| Core DJ — Now |22|
| Next — quick-win candidates |17|
| Later — full parity & advanced features |87|
| Blocked / unknown |4|
| Approvals & release boundaries |2|
| Verified evidence |1|
| Total |133|

Retain20 core cards: CORE-001; LIB-001; DEK-001/002/003/006/008/009/015; MIX-001/002/003/005; AUD-001; ANA-001/002/003; CORE-FIX-01/02/03. Add only CORE-FIX-05 cue ownership and CORE-FIX-06 safe core shortcuts.

Move13 to Next: UI-001, UI-RB-01 through08, LIB-RB-01, UI-AS-01, UI-XN-01 and CORE-FIX-04. Existing controls/previews remain enabled and retained; moving a card is not removing implementation or accepting its full criteria. Retain current four Next cards.

Move DEK-018 full Smart Sync and UI-HY-01 Traktor-flat refinement to Later alongside the85 existing cards. Move MIX-004/AUD-003/HW-003/HW-011 to Blocked for physical acceptance with Hercules disconnected; this does not imply software-only subwork cannot proceed.

Link malformed restore to LIB-011, cache growth to AUD-006, scaling to UI-006 and cue semantics to UI-004/MIX-004. Retain full keyboard coverage in UI-002 and link its core subset to CORE-FIX-06. Preserve approval/evidence records and qualify latest scope HTML-only.

Use Codex `gpt-6.1-sol/high` for the new routine fixes; existing Claude alternative `claude-sonnet-5/medium` remains a recommendation subject to availability. No agent invocation is implied. Preserve existing per-feature routing. Escalate only a reproduced unresolved problem with a failure artifact.

Read before write; replace stale current summaries rather than repeatedly prepending histories. Near description limits, use linked comments. Record accepted behavior as scoped checklist evidence; no broad card completion. Verify identity/count/list assignment, description preservation and no duplicate defects by readback. The machine-readable reconciliation ledger records exact results.

## Handoff and stopping rule

From Codex to the next Codex/Claude executor. Read this audit, `docs/delivery/CORE_DJ_FIRST.md` and `handoffs/current.md`. Next exact task after this reconciliation is implementing CORE-FIX-05 cue ownership and CORE-FIX-06 shortcut safety; then remaining focused presentation fixes and the single listening session. Do not begin that task automatically at the end of this pass.

Return changed files, actual tests/results and evidence scope, any unresolved defect, and next exact action. Distinguish temporary Cue from headphone monitoring. Preserve the original `PROJECT_PROMPT.md` suffix in the full Claude completeness handoff. No native build, reference asset copying, parity completion, new provider integration, global cleanup or unrelated feature work.

Skills applied in the preceding audit: use, llm-council, ponytail-audit, design-system-audit, dec, frontend-code-review, accessibility-audit, gap-analysis. Reconciliation uses use and claude-codex-handoff; the council is not rerun.

## Reconciliation execution — verified 20 October 2026

Applied and read back: all131 original cards retained,19 planned moves, two unique new defects,133 total cards. Counts:Core22 / Next17 / Later87 / hardware-blocked4 / approvals2 / evidence1. All original criteria/model/history preserved by exact description/suffix comparison; CORE-001's replaced short header is archived verbatim in a verified comment. Twelve status/finding/history comments were read back. The parent checklist has five scoped prior observations checked and five future safety/listening gates unchecked; no broad card completed or archived.

New cards: [CORE-FIX-05 cue ownership](https://trello.com/c/x35fpHyL) and [CORE-FIX-06 safe shortcuts](https://trello.com/c/7qQ76Z2V). The Sync card now foregrounds the unresolved intermittent pop. Full verification: [machine-readable reconciliation ledger](../delivery/core-dj-reconciliation-20261020.json). Entry READMEs, build/core plan and current/full Claude handoffs now foreground the HTML-only scope and stop boundary. Original prompt suffix remains byte-exact.

**Stopped after reconciliation.** No code fix, new listening run, app reload, native build, global cleanup or further council/agent invocation in this pass. Those remain next-block work. Documentation verification does not close any audio, accessibility, hardware or parity gap.
