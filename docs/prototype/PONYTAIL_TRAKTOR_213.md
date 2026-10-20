# HTML213 — Ponytail review and simplification

What this change does: Reviews the Traktor flat HTML presentation against its shared adapters, then simplifies that presentation without replacing the player, controls, waveform analysis or audio engine. The existing layout and six workspace choices remain; this is a maintenance pass, not a new native build or a new visual direction.

20 October 2026. Applied the installed Ponytail5.3.2 full-mode rules and Ponytail review skill. Design reasoning: CUBE-style composition/exception separation (dec-css-architecture), Nielsen consistency and recognition, semantic controls/native keyboard access, and the existing four-pixel field grid. Scope: `traktor-flat-preview.css`, `layout-preview.js`, `rekordbox-preview.js`. No dependency, framework, audio/DSP/MIDI/source-waveform or native-app changes.

## Should fix — addressed

1. **Repeated CSS scope and superseded rules.** What this is: almost every rule repeated the same preview-root selector, with an unused accent token, duplicate knob defaults, superseded four-deck defaults and duplicate vertical/Library Focus declarations. Problem: subsequent layout edits had to be traced through unnecessary cascade patches. Fix: use one native CSS nesting scope while preserving selector specificity and rule order; remove the proven superseded declarations. If skipped: future density corrections remain harder to assess. Result: stylesheet29,451→21,465bytes; eight rendered state comparisons retained geometry.

2. **Controls moved between two parents on a refresh.** What this is: the common deck adapter moved Key Reset into the key row before the flat adapter returned it to utilities; the rekordbox adapter also moved Traktor's tempo rail into utilities before its final adapter moved it back. Problem: redundant DOM work and two competing ownership paths for the same controls. Fix: keep flat Key Reset in utilities and let the Traktor adapter own its tempo rail; preserve the settled control ordering. If skipped: further refresh paths can inadvertently reorder the controls. Result: one tempo rail and one Key Reset per deck; no control clones, new handlers or alternate state. Browser keyboard tempo path still changes actual BPM.

3. **Repeated flat-workspace membership lists.** What this is: ten controller paths independently tested the same three workspace names. Problem: adding a flat layout required updating each list, despite an existing `data-preview-shell=flat` hook. Fix: a local `flat()` predicate reads that existing hook for deck disclosure, reset, panel placement and adapter selection. If skipped: a future variant could acquire only some flat behaviors. Result: all six existing choices opened and retained their original transport/tempo controls.

## Executed verification

Done criterion for this pass: simplified source, unchanged selected layout geometry and control inventory, working affected UI paths, retained decoded library previews, updated tracking, and unchanged native package.

- **Executed:** before/after snapshots in all eight2/4deck × Horizontal/Vertical × Compact/Full cases:3,444 element snapshots, no changed recorded geometry/style/order/labels after excluding the transient deck-focus class. Separate selected core-control/knob bounds checks had no errors; each deck retained eight cue pads. This establishes the recorded states/properties, not every possible interaction or pixel.
- **Executed:** Glass Transit search retained its matching decoded waveform image and loaded into deckB. All ten row images loaded after sorting, including the two existing local MP3s. Preview-column hide/show, crates hide/show and Import visibility retained. Search cleared and ascending sort restored. No thumbnail audition/seek capability is claimed.
- **Executed:** deckB tempo keyboard step0→+0.1% changed126→126.1BPM, then restored0. Play timer advanced00:00.1→00:11.9, then paused and Home restored00:00.0. This verifies playback UI/clock, not acoustic output or beatmatching quality.
- **Executed:** Loops stayed Compact; Pitch selected Full and its original Pitch range field remained available. Mixer hide/show in horizontal/vertical, Library Focus→Pads restore, Large vertical waveform core bounds, and FX panel placement passed the selected checks. Modes restored to Cues; final default is two-deck Horizontal Compact with mixer/previews visible.
- **Executed:** final A/B timers00:00.0, tempo0, master−12dB, original track gains retained. JavaScript syntax and Git whitespace checks passed. Native0.1.27 ASAR SHA256 remains `a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb`.
- **Code-path:** original source nodes, delegated handlers, audio engine, RGB renderer, rotary behavior, headphone controls, library cache/error/retry handling and user preferences remain. Unchanged source is preservation evidence, not fresh end-to-end proof of every feature.

Receipts: `PONYTAIL_TRAKTOR_213.json`; raw before/after/delta/check/extra/final-state JSON and two/four-deck screenshots in private `local-evidence/ponytail-213/`. No new test framework or dependency. Net source reduction8,532bytes; only two net physical lines because existing CSS uses compact declaration rows. Do not describe byte reduction as a measured runtime speedup.

Verdict: the selected prototype checks support this cleanup. User visual approval and native integration remain open. Existing tiny four-deck Compact targets and1440CSSpx scaled review shell are not a broad accessibility/reflow solution; preserving them does not establish WCAG conformance. Native CSS nesting was exercised in the current browser; older engines without nesting support were not checked. Full/FX panels may require scrolling.

Lean: -2 lines applied;8,532 source bytes removed.

Not checked: fresh acoustic output, physical MIDI/controller, advanced DSP algorithms, complete assistive-technology/responsive conformance, older browser engines, full product parity. No native build/integration before explicit approval. Keep core DJ priority.

## Tracking and Claude re-entry

Trello [UI-HY-01](https://trello.com/c/FkrLm4fa), parent UI-001. Keep HTML212/211 evidence and all existing layouts. Review URL `http://127.0.0.1:8848/prototype/layout-preview.html`. Compare this cleanup to `a8e8a94`; inspect original-node ownership, Compact control access and library preview identity, then report any concrete remaining defect. Do not rebuild native. Recommendations remain Codex gpt-6.1-sol/high; Claude Code Sonnet5/medium, verify actual availability before invoking. The original project prompt remains the exact suffix of the completeness-audit handoff.
