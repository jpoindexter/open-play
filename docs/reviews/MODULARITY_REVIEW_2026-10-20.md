# Modularity review and execution order

What this change does: This report inventories Open Play's application modules and proposes a reusable refactoring policy. It changes no production code. The expected load is one DJ mixing two local tracks on this Mac, with four-deck layouts and advanced features preserved.

**Current priority: finish the core Sync/audio workflow first.** The global skill and its own GitHub repository are prerequisites before broad refactoring, not a reason to interrupt the active musical investigation. This follows Jason's explicit sequencing instruction; the installed code-size skill's blanket split-before-commit rule does not override it.

## Executed inventory

Source: `f11275f61a0184ba841df5520903112837e35902`. [Machine-readable inventory](MODULARITY_INVENTORY_2026-10-20.json).

- 577 tracked JS/CJS/MJS/JSX files inventoried by an existing Babel parser; one additional CJS tool parsed with its legal top-level-return option. No dependency installed.
- Path/name classification identifies 149 runtime files, 19,962 token-backed code lines, 17 files over 200 lines and eight over 300. There are 119 runtime functions over 50 occupied code lines. Nested factories count their enclosed bodies; these are review signals, not 119 proven bugs.
- Tests, harnesses, experiments, tools and vendored/generated output are separated. Static controller digests are data, not executable logic. The video catalog has executable normalization loops and is separately classified as mixed data/code. `fixtures.js` also contains runtime defaults, so it is not blanket-exempt.
- Counts include occupied lines in multiline strings, exclude blank/comment-only lines, and retain physical lines, bytes and longest-line length. Dense one-line markup can hide complexity from a line count.
- Classification is not a complete release-reachability analysis. No ESLint complexity, nesting or dependency-cycle certification was run. The inventory is evidence for prioritization, not a performance diagnosis.

| Module | Code lines | Main responsibilities |
|---|---:|---|
| `prototype/panels.js` | 2,279 | Settings, recording, backup/restore, beatgrid editing, hardware/MIDI/provider panels |
| `prototype/engine.js` | 2,138 | Audio graph, decoded buffers, transport ownership, scheduled voices, monitoring, sampler, advanced backends |
| `prototype/app.js` | 2,093 | Deck rendering, actions, keyboard/pointer events, waveform rendering and UI updates |
| `prototype/extended-effects-kernel.js` | 1,215 | Advanced effects DSP; outside the immediate core gate |
| `prototype/analysis.js` | 438 | Audio-analysis pipeline; phase accuracy needs evidence before extraction |

## Must fix before broad structural work

1. **Preserve a failing musical case before moving transport code** (`prototype/smart-sync.js`, `prototype/engine.js`, `prototype/app.js`).
   - **What this is:** Sync schedules incoming audio against an outgoing clock and displays the corresponding grid.
   - **Problem:** Jason still hears a small fixed beat offset in native 0.1.32, despite aligned displayed downbeat lines. Earlier pops/clicks and waveform lag remain open. A structural move would change the debugging environment without establishing musical correctness.
   - **Fix:** Finish CORE-FIX-07 and retain the separate CORE-FIX-01/ANA-001 evidence. Capture the relevant source/positions/mode/rates and one useful corrected transition; do not repeatedly run clean matrices.
   - **If skipped:** A cleaner file tree can conceal an unresolved audible defect and invalidate comparisons.

## Should fix after the core gate

2. **Separate Settings and panel lifecycles from the giant panel factory** (`prototype/panels.js:30`).
   - **What this is:** `createPanels` encloses almost the entire 2,279-line module, including unrelated forms and workflows.
   - **Problem:** Actual Settings reopening produced hidden backing controls without replacement Astryx portals; equal-value control identity was omitted in the shared adapter. Backup restore also has the separately reproduced invalid-state case on LIB-011. These are concrete lifecycle/trust-boundary defects; file length alone is not their cause.
   - **Fix:** Keep the corrected shared adapter. Extract Settings/navigation as one cohesive module first; then separate restore validation and recording when touched. Preserve validation, cleanup, focus, accessibility and existing caller contracts.
   - **If skipped:** Unrelated dialog changes continue sharing a broad review surface and make safe lifecycle changes harder to isolate.

3. **Separate deck actions and rendering at existing boundaries** (`prototype/app.js:443`, `prototype/app.js:812`, `prototype/app.js:874`).
   - **What this is:** The application coordinator handles transport intent, generated markup and repeated layout/UI work.
   - **Problem:** The real Play-stop caller missed Cue ownership cancellation even though other stop paths revoked it. A layout adapter also relabeled Simple Sync as BEAT SYNC. Both were reproduced and corrected before this report; they show why control semantics must have one owner.
   - **Fix:** After core acceptance, extract deck transport actions and their ownership hooks together, then deck/mixer rendering. Reuse existing `holds.js`, `sync-master.js`, `smart-sync.js`, `tempo-slider.js` and `jog-bend.js`; do not create another event bus or transport framework.
   - **If skipped:** Layout and transport changes remain easy to implement in one path while missing connected callers.

4. **Separate decoded-audio caching and voice scheduling without duplicating clocks** (`prototype/engine.js:149`, `prototype/engine.js:295`, `prototype/engine.js:418`).
   - **What this is:** The engine owns both long-lived audio resources and time-critical voice handoffs.
   - **Problem:** Decoded buffers have no automatic inactive-cache bound (AUD-006). The native renderer also showed over 100% CPU and over 2 GB resident memory in paused observations; the profile does not establish which JavaScript operation caused that load or the reported glitches.
   - **Fix:** Diagnose load first. Later extract cache ownership independently from scheduled voice ownership. Protect active decks and pending preparation; retain one AudioContext and authoritative clock, cancellation, fades and resource disposal.
   - **If skipped:** Longer sessions can retain increasing audio memory, and broad engine changes remain difficult to review safely.

## Proposed global policy, not a universal industry mandate

Use 200 code lines as a file review target and 300 as the new-module limit; use 30/50 as function target/review threshold. A 150-line maximum is unnecessary. Existing oversized modules get a measured baseline and planned cohesive extractions, rather than forcing a rewrite during a core defect fix. Never compress code, split mid-responsibility or drop checks to meet a number.

[ESLint max-lines](https://eslint.org/docs/latest/rules/max-lines) exposes a configurable 300-line default and explicitly says there is no objective acceptable maximum. [max-lines-per-function](https://eslint.org/docs/latest/rules/max-lines-per-function) has a configurable 50-line default. These support a practical project policy, not a claim that every industry codebase must use these values.

Use existing lint tooling where present. Review complexity, nesting and parameter count as maintainability signals; don't add a dependency or mandatory options-object wrapper solely to satisfy a metric. A short function can still have a wrong responsibility or unsafe lifecycle.

## Global skill/repository prerequisite

Before broad refactoring, create the requested documented, reusable skill in its own canonical GitHub repository. Creation/install are **queued after core acceptance**, not completed by this audit. Prefer a private repository unless Jason requests public release.

1. Review existing installed `enforcing-code-size`, `component-refactoring`, `extract-component`, `ponytail-review` and `dec-software-principles` before adding overlapping instructions. `find-skills` found an architecture candidate on skills.sh; its source/compatibility has not been reviewed, so it is not recommended or installed.
2. Write the smallest reusable skill: responsibilities and caller map, size baseline, safe extraction checklist, trust boundaries, error/cleanup preservation, focused verification, documentation and rollback. Keep Open Play-specific audio rules in this repo; the global skill must not inject DJ assumptions into unrelated projects.
3. Include README, SKILL.md, examples, license/provenance, version/changelog, installation/update/uninstall instructions for Codex and Claude Code, and a harmless sample that demonstrates discovery and use in both. Resolve canonical ownership; never edit plugin caches as source or overwrite unrelated global instructions.
4. Verify global installation from the canonical repository and read back both agent locations. Keep updates reversible. Hooks or automatic enforcement need explicit documented scope; do not silently change global trust/security settings.

## Dependency order and Done criterion

**Now:** Core Sync fixed-offset investigation, pop/lag disposition, practical EQ/Cue/manual-mix and clean stop. No broad refactor or new framework.

**Next, before broad refactoring:** Ship and verify the reusable global skill/repository above. Link it and this inventory on the modularity Trello card.

**Then:** Settings/navigation extraction, deck action/render boundaries, cache/voice ownership in separate reviewable changes. Each extraction preserves public calls, validation, error handling, focus/keyboard/MIDI ownership, layouts, custom DJ controls and library waveform previews. Update the module map and handoff in the same change. Test only the changed contract and one affected practical native path; rerun wider checks only when a failure or shared dependency warrants it.

**Later:** Advanced FX/stems/video modularization. No architecture rewrite while the core audio loop is unaccepted.

**Done:** Actual core acceptance recorded; global skill/repo installed and exercised in Codex and Claude; selected extraction reduces mixed responsibilities with no observed user-facing regression; current architecture map and board reflect the exact revision. A green build or shorter files alone does not satisfy this.

Models: Codex `gpt-6.1-sol/high` for focused extractions and skill packaging; Claude Code Sonnet/high as an available alternative/reviewer. Escalate a reproduced unresolved DSP/clock problem using its failing evidence; model agreement is not audio acceptance.

Verdict: Fix the core musical failure first, then complete the global skill prerequisite before extracting application responsibilities.

Not checked: Fresh musical acceptance, complete runtime import reachability, lint complexity/cycles, every advanced module, global skill installation or a new skill GitHub repository. No line-deletion saving is claimed; moving code does not remove its maintenance cost.
