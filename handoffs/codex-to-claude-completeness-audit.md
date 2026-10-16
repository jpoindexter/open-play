# Codex → Claude: independent Serato completeness audit

**Status: READY FOR INDEPENDENT AUDIT — browser candidate exists; exact parity and investigation remain open.**
This is a review handoff, not a claim that every Serato feature is implemented or that exhaustive discovery passed. Do not launch native development. Claude has not been run automatically.

Project: `/Users/jasonpoindexter/Documents/GitHub/Open Play`  
From: Codex  
To: Claude Code, launched by Jason  
Prepared: 2026-10-16  
Reviewed browser candidate: `b8c1afd48630f005d24f56efd30a0d5707c3655a` on `main`
Prototype content hashes: `docs/prototype/candidate-hashes.json`
Worktree was clean immediately after that candidate commit; subsequent handoff-only changes do not change prototype bytes.

## Goal and authority

Run the same project brief below as an independent investigation and completeness review. Determine what Codex missed, misinterpreted, assumed without evidence, or represented inadequately in the HTML prototype. Reproduce accessible reference and prototype behavior. Do not limit your review to Codex's known gaps or existing feature count.

The original prompt is reproduced verbatim below. The following subsequent instructions supersede its initial “do not execute yet” language:

- Jason approved investigation, private GitHub/Trello resources, maintenance of the full build plan, and a full HTML prototype after feature inventory.
- Latest instruction: “keep going and close the remaining parity gaps. i want everything serato does, not just labels and placeholders. update the prototype and claude handoff, still no native app until i approve”. This supersedes treating a routed placeholder as sufficient implementation.
- Everything Serato DJ Pro does remains in scope, including expansions, secondary controls, hardware modes, provider workflows and failures. No simplified replacement dashboard or silent feature cuts.
- Fully inventoried, explicitly labeled documented/simulated behavior is permitted for unavailable CDJs, DVS hardware, provider accounts and audio algorithms. Simulation is not physical or DSP verification.
- Native development remains prohibited until Jason approves the specific HTML prototype. Receiving this handoff does not grant that approval.
- Hercules DJControl Inpulse 300 MK2 is the connected test controller; Jason reported speakers on RCA and headphones on 3.5 mm. Refresh connection state before testing. He reports that the browser knob moves Serato's selection, including during the otherwise empty passive capture.
- Ghidra is available; Hopper is a demo and supplementary. Use REA and the best available inspection tools without buying or activating tools.
- Jason authorized app navigation and specifically AppleScript/System Events as an alternate control route after native accessibility clicks failed. Observe current UI before acting; preserve the app, music, settings and hardware mappings.
- Reuse the existing private repository and board. Do not create duplicates or publish either.

The audit deliverable is an independent report. Do not silently edit Codex's implementation or mark Trello work accepted while reviewing. Report proposed corrections and evidence first. Never weaken the native approval gate.

## Review process — independent first, compare second

1. Read this brief and `docs/approvals.md`, applicable repository instructions, and exact-version inventory. Pin the candidate revision and inspect `git status`; preserve all user changes.
2. Independently derive a feature/control/state checklist from the installed reference, official main manual, expansion guides, hardware guides and release history. Record sources and version applicability before consulting Codex's conclusions. Existing manifests are navigation aids, not proof of completeness.
3. Compare that independent checklist against the saved feature registry, interaction requirements, source crosswalk, full build plan and every prototype route. Look beyond 110 feature groups or any requirement count in this draft.
4. Read the binary investigation and reproduce selected static/runtime claims. Distinguish linked libraries, reachable code paths, observed behavior, user reports, documented behavior, inference and unknowns. Do not equate device enumeration with MIDI input, LED output, headphone/master separation or latency.
5. Run the HTML prototype at the supplied final revision. Exercise normal, alternate, empty, loading, disconnected, error, cancellation, persistence and recovery paths. Check mouse, keyboard/modifiers, drag/drop, context menus, resizing and visual comparisons at matching reference dimensions. A visible label, toast or static panel does not implement a workflow.
6. Audit every known domain, including all named effects and parameters, Channel FX, stems, sampler, Scratch Banks, Flip, Pitch Play, slicer, Video, Link, DVS modes, CDJs, controller mapping and feedback, provider-specific capabilities, and settings with hardware-dependent availability.
7. Challenge the open-source foundation, exact dependency/model licenses, local ML choice and resource assumptions. Verify current model names and supported effort settings for Codex and Claude Code; compare every feature/card recommendation. Recommendations are not actual execution evidence.
8. Check source conflicts, historical gating claims, privacy/proprietary-asset exclusions, no artificial local paywalls, offline operation, required/optional services, and GitHub/Trello consistency. Keep third-party service restrictions separate from local feature gates.
9. Report findings with exact evidence. Distinguish reference uncertainty from an omission, implementation defect, intentional approved product difference, or unsupported claim. Do not call the project complete solely because file checks or a build pass.

## Read during comparison

All paths are relative to the project root above:

- `PROJECT_PROMPT.md`, `FULL_BUILD_PLAN.md`, `docs/approvals.md`
- `docs/research/FULL_SCOPE_CONTRACT.md`, `FEATURE_COVERAGE.md`, `PARITY_GATE.md`
- `docs/research/interaction-requirements.json`, `INTERACTION_REQUIREMENTS.md`
- `docs/research/manual-feature-crosswalk.json`, `MANUAL_FEATURE_CROSSWALK.md`
- `docs/research/UI_OBSERVATIONS.md`, `fx-catalog.json`, `SOURCE_CONFLICTS.md`
- `docs/research/EVIDENCE_LEDGER.md`, `BINARY_FINDINGS.md`, `HARDWARE_HERCULES.md`, `HISTORICAL_GATING.md`
- `docs/delivery/feature-registry.json`, `FEATURE_MODEL_PLAN.md`, `trello-source-sync.json`
- `docs/decisions/001-foundation-and-models.md`
- `prototype/README.md`, `prototype/index.html`, `app.js`, `engine.js`, `panels.js`, `fixtures.js`, `styles.css`, `inventory.js`, `effects.js`, `flip.js`, `holds.js`, `library.js`, `midi.js`, `slicer.js`, `video.js`, `behavior-tests.html`, `behavior-tests.js`
- `docs/prototype/FUNCTIONAL_REVIEW.md`, `behavior-results-2026-10-16.txt`, `PARITY_CLOSURE.md`, historical `REVIEW_REPORT.md`, `coverage-manifest.json`, `candidate-hashes.json`, `screenshots/`
- `scripts/serve_prototype.py`, `scripts/update_prototype_inventory.py`, `Start Open Play.command`
- `docs/delivery/trello-pending-updates.json`, `trello-functional-sync.json` (remaining unsent changes, with separately verified gate/crate status)

Private repository: https://github.com/jpoindexter/open-play  
Private board: https://trello.com/b/OqMGEjpe/open-play-serato-parity

## Current state and unresolved questions

Research remains unfinished. The candidate accounts for 110 feature groups, 354 interaction requirements and 168 indexed main-manual articles. These counts do not establish exhaustive coverage. All five reference display layouts and eight Setup tabs were inspected; many conditional/loaded/error states remain open. Only four of 59 FX parameter strips were inspected. Twenty-four feature groups lack detailed interaction rows. Exact Video catalogs, physical device/audio behavior and full workflow equivalence remain unverified.

The HTML prototype exists and has executed browser evidence. It combines real local audio/library interactions with explicitly simulated controls and gap disclosures. This is not a successful strict 1:1 parity gate. Investigate any missing or inadequate destination rather than accepting a routed title as implementation. No native application exists.

Ghidra analysis and selected CoreMIDI call sites have evidence; they do not establish complete vendor mapping or hidden DSP behavior. Passive hardware capture saw zero messages despite user-confirmed knob activity. Virtual receiver self-tests passed. Reproduce the discrepancy without modifying the device firmware or Serato activation.

All 110 Trello feature cards have model recommendations from the verified earlier checkpoint. Source-link synchronization is 59/87 verified, 28 pending. This pass updated GATE-P and LIB-004 functional descriptions and verified exact readback. Other feature writes again hit 429 and a board read ended in transport failure. Seventeen new functional annotations are queued in trello-functional-sync.json in addition to the 28 historical source updates. The browser fallback account was denied access to the private board; no access request/account switch was attempted. The exact pending descriptions and gate status are preserved locally; do not replay the older gate draft over the newer verified functional status. Reconcile readback before claiming remote consistency. The GitHub repository was freshly verified private with `gh repo view`.

## Launch, fixtures, stop and reset

```sh
cd '/Users/jasonpoindexter/Documents/GitHub/Open Play'
python3 scripts/serve_prototype.py
```

URL: http://127.0.0.1:8768/prototype/ . If the existing server is still running, reuse it. It binds loopback only and blocks Git/raw evidence paths. macOS shortcut: `Start Open Play.command`. Control-C in its terminal stops the server. Closing/reloading the browser stops its audio.

Eight original generated 48-second demo tracks are included. Imported local audio bytes are session-only. No vendor music/assets/binaries ship. Settings, crates, selected demo metadata including saved Flip slots, Prepare/history and MIDI mappings persist at the browser-local key `openplay-review-v1`. Library tools → Export prototype backup preserves metadata; Reset demo → Reset prototype clears only this demo's stored state. Do not reset Jason's Serato library/preferences. The final browser view was reset to clean demo data after testing; test metadata backup remains in Downloads. Subsequent playback checks changed play counts; source files remain untouched.

Executed fixture files on this host:
- `/tmp/open-play-review-tone.wav`: generated original 3-second stereo WAV, re-create if missing.
- `/Users/jasonpoindexter/Downloads/Open Play session.webm`: 235,667-byte original browser mix capture, decoded as 14.5 seconds and replayed.
- `/Users/jasonpoindexter/Downloads/open-play-library.json`: 8,495-byte prototype metadata backup, restored through the actual file picker.
These are test outputs, not required product assets. Do not upload user music or unrelated Downloads files.

## Verification already executed

Read `docs/prototype/FUNCTIONAL_REVIEW.md` and `behavior-results-2026-10-16.txt` for this revision. `REVIEW_REPORT.md` is the first-candidate baseline. Browser tests were visible CUA interactions on macOS 26.7 (25G224), Codex in-app browser, 1512×982 desktop viewport and a narrow ~637×845 view; embedded browser version was not exposed. AudioContext reported 48 kHz.

Observed paths include local import/double-click load/play/end, cue/loop/tempo, two-deck master capture/download/re-import/replay with nonzero signal, crates, multi-rule smart crate and nested parent membership, metadata, backup/restore, all eight Setup tabs, all primary panels, six provider failure fixtures, synthetic MIDI/DVS/Link states, Flip cue-event save and video text preview. Initial syntax, double-click and hidden-focus defects were fixed and retested. The report explicitly identifies code-path-only/unexecuted claims.

Terminal checks:
- `python3 scripts/update_prototype_inventory.py`: generated 110 routes, 354 requirements, 59 effects.
- JSON integrity: unique feature/requirement IDs, valid feature references, both model/effort fields, all route/native-block fields and no false parity flag.
- `python3 -m py_compile scripts/serve_prototype.py scripts/update_prototype_inventory.py`: passed.
- HTTP GET: prototype, app.js and manifest returned 200; `.git/config`, `local-evidence/` and traversal path returned 404.
- `git diff --check`: passed before candidate commit.
- `gh repo view jpoindexter/open-play --json nameWithOwner,isPrivate,url`: private repository confirmed.

None of this proves real controller compatibility, physical cue/master separation, low latency, actual stem separation or Serato-equivalent FX, service access, exact visual parity, all keyboard/drag/drop cases or a long-session soak. The browser's independent DSP approximations are not measured equivalents of Serato algorithms.

## Decisions and files changed

- Original HTML/CSS/JavaScript + Web Audio makes the review runnable with no package installation or service. Native C++/Qt/Mixxx remains provisional and separately gated.
- All known groups remain visible through `prototype/inventory.js` and `coverage-manifest.json`; explicit gaps stay open.
- No artificial local feature paywall/account requirement was added. External provider limits remain separate dependencies.
- Product ML: HTDemucs baseline and SCNet/RoFormer challengers remain an evaluation plan; no benchmark winner or weights license is assumed.
- Development routing: per-feature Codex and Claude Code model/effort fields are recommendations, not evidence those models were executed. Revalidate current availability.

Inspect exact changed files with:

```sh
git diff --name-status 944f69a47678190d28487ff140ba0383b463af62 b8c1afd48630f005d24f56efd30a0d5707c3655a
```

Primary changes are `prototype/*`, the local launcher/server, generated coverage, 10 additional research requirements, updated plan/approval/evidence/gate documents, browser screenshots and pending Trello updates. Source screenshots/disassembly remain in ignored local evidence. Handoff delivery is a later documentation-only commit; preserve any newer work.

## New functional candidate: what to challenge first

This pass added independently written browser behavior, not a native app:
- Reverse PCM/transport; Slip loop/reverse/cue recovery; cue-hold/release/Play latch with cancellation tokens.
- Sampler Hold/Trigger/OnOff, pitch, volume/gain/mute and cue/loop start controls.
- Timed cue/reverse Flip playback and six per-track saved slots; eight-pad slicer with domain/quantize and timeline return.
- Nested/collapsible crates and multi-rule all/any live/cached queries with cycle protection.
- LPF, Delay, Reverb and Wah browser DSP routed through two units to decks/sampler/master. Remaining 55 effects have DSP enable disabled; none is accepted by name alone.
- Local video decode, two-source Canvas compositing, overlays, audio-linked controls, and actual video/master recording.
- Standard Web MIDI input/learn/mapping code with timestamps and encodings; input access timed out in the tested browser. Synthetic input changed actual playback but is not hardware evidence.

Executed: 20/20 actual Web Audio/module tests; selected main UI tests; a recorded
1,921,409-byte VP9/Opus video downloaded and re-imported for playback; reset followed
by another reload; clean console at checked points. Screenshot
`docs/prototype/screenshots/functional-desktop-review.jpg` shows the 1512×982 overview.
The suite was rerun after the final tempo/routing fixes at 13:50 UTC. Run it yourself
at http://127.0.0.1:8768/prototype/behavior-tests.html using its button; tests do not
send audio to speakers. Do not confuse these module paths with complete UI acceptance.

Prioritize adversarial checks of pending asynchronous starts, release after pointer
cancel/blur/track replacement, overlapping holds, Flip On vs Start and Censor,
variable-tempo recording, tempo changes during slicing, FX rebuild/tail discontinuities,
route changes while recording, same-media gain sharing, MIDI CC14/device isolation,
video decoder errors and unknown-duration captures, persisted state and reset/restore.
Some are implemented code paths without exhaustive executed proof. Report failures
rather than inferring acceptance from the 20-check suite.

Keep remaining large gaps explicit: 55 effect schemas/processors, exact Video FX and
transition catalogs, stems/keylock/Pitch Play/automatic analysis, native library/file
interoperability, Smart Sync edge semantics, actual MIDI feedback and cue/master output,
DVS/CDJ/Phase tests, Link networking and provider service access. The present four FX
and video recorder reduce gaps; they do not close those domains. No “everything done”
claim or native approval is warranted.

## Next exact task and finish line

Independently derive the reference inventory first, then compare the candidate. Deliver `handoffs/claude-to-codex-completeness-audit.md` with prioritized, reproducible findings, additions to the inventory and a coverage verdict. Start with the largest omission risks: complete FX parameter/Video catalogs, all conditional settings, correct cue/loop/sync semantics, filesystem and hardware workflows, and any controls that merely display a label.

A useful completed audit enumerates examined sources/screens/states, what actually ran, what remained inaccessible, concrete discrepancies with expected/actual evidence, and proposed next fixes. It must not call parity complete because the UI contains 110 entries. Do not edit implementation, approve the prototype, launch native work, purchase services, change accounts or publish anything as part of this review.

## Required Claude return

Write `handoffs/claude-to-codex-completeness-audit.md` and a machine-readable findings companion. Return:

1. Verdict and unverified boundaries first; exact audited revision/environment and sources inspected.
2. An independent coverage matrix, including features absent from Codex's registry.
3. Findings ranked by impact: ID, affected feature/requirement/route/card, category, claim, source or file/line, reproduction, expected versus observed result, evidence class, proposed correction and verification criterion.
4. An explicit list of unsupported completeness claims, unresolved contradictions and simulations that conceal missing behavior.
5. Foundation/model/license/card inconsistencies and changed recommendations with primary sources.
6. What was reproduced, what was only traced/read, and what could not be checked. Do not bury inaccessible hardware/provider states in a passing summary.
7. Proposed plan/Trello changes; no native implementation or automatic acceptance.

Codex must triage every finding as accepted, rejected with evidence, or unresolved, apply authorized corrections, re-run affected workflows, and preserve that disposition with the prototype review packet. A clean Claude review is additional evidence, not proof that no omissions exist.

## Original full project prompt — verbatim snapshot

Prompt SHA-256: `699d5f1556d148800fda22362be86b6f4acdcaac06dca0f5801b025af1291c8e`

---

# Open Play — complete project prompt

Investigate **Serato DJ Pro for macOS**, then design an independently implemented, **open-source DJ application that closely matches Serato’s interface and functionality without artificial feature limits, subscriptions, paid device unlocks, or a mandatory account**.

**Do not execute this prompt yet. First present your proposed approach and wait for my approval. Once approved, complete the investigation and a full interactive HTML prototype. I must review and approve that prototype before native application development begins.**

### 1. Locate and inspect Serato

Find Serato in my `~/Desktop` folder, including application bundles, installers, disk images, or aliases. Identify the exact product, version, architecture, and available artifacts. If multiple versions exist, inventory them and explain which will serve as the reference.

Use **REA** as the primary inspection tool. I also have **Hopper and Ghidra** installed; select the best tool for each investigation question.

Inspect relevant resources, frameworks, libraries, configuration, device definitions, and executable code. Combine static inspection with controlled runtime observation where appropriate.

Use these official sources as background, checking their applicability to the installed version:

- [Serato website](https://serato.com/)
- [Serato DJ Pro manual](https://support.serato.com/hc/en-us/categories/202698038-Serato-DJ-Pro-manual)

Preserve the installed application and existing music libraries, settings, and device configurations.

### 2. Build a comprehensive feature inventory

Document every discoverable user-facing feature, including:

- **Music libraries:** importing, MP3 and other formats, metadata, artwork, search, sorting, crates, smart crates, playlists, missing files, and external drives.
- **Track analysis:** BPM, beat grids, key detection, waveforms, gain analysis, and caching.
- **Deck operation:** playback, cueing, hot cues, loops, beat jump, sync, pitch, key lock, scratching, slip mode, and transport controls.
- **Performance:** multiple decks, mixing, EQ, filters, effects, sampler, stems, recording, and routing.
- **Audio:** interfaces, master output, headphone monitoring, latency, buffering, sample rates, and device changes.
- **Hardware:** controllers, mixers, CDJs/media players, turntables, and digital vinyl systems.
- **Connectivity:** MIDI, HID, USB audio, drivers, device identification, mappings, handshakes, hot plugging, and reconnection.
- **Access and integrations:** activation, subscriptions, expansions, hardware entitlements, streaming services, and offline operation.
- **Application behavior:** preferences, shortcuts, accessibility, layouts, recovery, and error states.

Distinguish USB storage from USB audio and control devices. Explain how analog turntables, timecode signals, and audio interfaces work together.

Assign each feature a stable ID. Record its user workflow, inputs, outputs, implementation evidence, dependencies, failure modes, and verification method. Maintain a coverage ledger so uninspected features remain visible.

### 3. Trace hardware support and feature restrictions

Trace representative workflows from a user action or hardware connection through the relevant application components to the observable result.

Investigate how Serato identifies devices and determines which capabilities become available. Distinguish:

- Hardware and technical limitations.
- Driver, protocol, and operating-system requirements.
- Account, subscription, expansion, and hardware entitlement checks.
- Commercial partnerships and third-party service restrictions.

I am particularly interested in features that previously worked with a device but later became restricted. Treat this as a hypothesis to verify using version-specific evidence.

Inspect these mechanisms without patching Serato or bypassing activation. Use the findings to inform an independent implementation.

### 4. Separate evidence from uncertainty

Label findings consistently:

- **Observed:** reproduced directly in the running application.
- **Verified in files:** supported by identifiable artifacts or code.
- **Documented:** stated by an official source relevant to the specified version.
- **Inferred:** a supported interpretation that needs further verification.
- **Unknown:** inaccessible or unverified behavior.

Cite documentation URLs, versions, file paths, symbols or addresses where useful, and reproduction steps.

Identify anything requiring physical hardware, proprietary protocol information, server access, or additional testing. Static inspection must not be presented as proof of runtime behavior.

### 5. Select the best open-source foundation, product models, and technology stack

Research current options and make a concrete recommendation. Do not assume building everything from scratch or adding an LLM is necessary.

Compare extending or forking an existing open-source DJ application with building a new application around reusable open-source components. Assess licensing, architecture, maintenance, hardware support, contributor activity, and the effort required to achieve reliable live performance.

Evaluate components and models for:

- Real-time audio, decoding, mixing, routing, and device integration.
- Time stretching, pitch shifting, effects, and digital vinyl processing.
- BPM, beat tracking, key detection, and track analysis.
- Stem separation and other features where machine learning provides measurable value.
- Optional local language-model features only where they address a concrete need.

Distinguish **open-source code, open-weight models, and licenses with usage or redistribution restrictions**. Check code and model-weight licenses separately, including compatibility with the proposed application license.

Rank the top three viable approaches, then recommend one using:

- Audio quality, latency, reliability, and resource use.
- Apple Silicon and Intel Mac support.
- Offline operation and realistic minimum hardware.
- License compatibility, redistribution, maintenance, and integration effort.
- Reproducible benchmarks or focused technical experiments where feasible.

Recommend exact components and versions with primary sources. Label untested recommendations. Keep inference and unpredictable work outside the real-time audio callback.

**Distinguish models shipped inside the DJ application from models used in Codex or Claude Code to develop it.** Development tools must not become mandatory runtime dependencies of the finished application.

### 6. Recommend a Codex and Claude Code model for every feature

For **every feature and actionable work item**, recommend:

- The exact model to use in **Codex**.
- The supported **Codex reasoning-effort setting**.
- The exact model to use in **Claude Code**.
- The supported **Claude Code effort or thinking configuration**.
- Which tool/model combination should be the primary choice.
- A concise explanation based on task difficulty, ambiguity, risk, context needs, expected quality, latency, and cost.
- When to escalate to a stronger model or higher effort.
- Whether independent review is warranted, and the recommended reviewer model and setting.

Verify model names, availability, and supported settings against the installed tools and current official documentation when the work begins. Date the recommendations. Do not invent model identifiers, assume both tools use the same reasoning levels, or claim a setting is available without checking.

If a model or setting cannot be verified, mark it **unverified** and provide a verified alternative where possible. Do not change subscriptions, purchase credits, or modify account settings.

Choose the least expensive configuration likely to meet the acceptance criterion reliably. Reserve stronger models and higher effort for work such as ambiguous reverse engineering, real-time audio architecture, DSP, concurrency, device protocols, and difficult debugging.

Where investigation, implementation, and verification need different configurations, specify them separately. Do not assign one expensive model indiscriminately to every task.

Include these recommendations in:

1. The feature inventory.
2. The implementation plan and milestone breakdown.
3. Every corresponding Trello card.

Keep recommendations synchronized using stable feature and task IDs. Record any later model changes and the reason.

These are **recommendations for executing the work**, not proof that the recommended model has performed it. Distinguish recommended assignments from actual execution history.

### 7. Match Serato’s design and functionality

Use the inspected Serato version as the reference for **visual design, interaction patterns, workflows, and functional behavior**.

Closely match:

- Screen layout, panel arrangement, information hierarchy, density, colors, typography, spacing, and control placement.
- Deck views, waveforms, library browser, mixer controls, cues, loops, effects, sampler, and settings.
- Mouse interactions, keyboard shortcuts, drag and drop, contextual menus, resizing, and visual feedback.
- Hardware connection flows, mappings, routing, playback behavior, and recovery.

Do not replace this with a simplified dashboard or an unrelated redesign. Someone familiar with Serato should recognize where controls are and how common tasks work.

Create a **screen-by-screen and feature-by-feature parity matrix** connecting reference behavior to implementation plans and acceptance tests. Capture reference screenshots and interaction sequences where accessible. Mark inaccessible states explicitly.

Use an original application name, branding, and independently created assets. Implement behavior independently using compatible open-source components.

### 8. Build a full interactive HTML prototype before the native app

After the investigation, create a **complete, locally runnable HTML/CSS/JavaScript prototype** demonstrating the proposed application. It must be a coherent interactive experience, not a landing page, static mockup, or collection of disconnected screens.

Include:

- The main performance interface and supported deck layouts.
- Library browsing, search, sorting, crates, track selection, and loading tracks onto decks.
- Transport controls, waveforms, playheads, cues, loops, tempo controls, mixer controls, and headphone-monitoring controls.
- Effects, sampler, stems controls, recording controls, and relevant panels.
- Preferences, audio routing, controller mappings, device connection states, and hardware setup flows.
- Empty, loading, analysis, disconnected-device, missing-file, and error states.
- Keyboard shortcuts, drag and drop, menus, panel toggles, and resizing.
- Representative demo content and a clear way to reset the demonstration.

Where practical, implement real browser behavior, including local audio-file import, playback, seeking, gain control, and basic mixing. Keep imported audio local.

Where browser APIs, unavailable hardware, or project scope prevent genuine functionality, provide an explicit simulation. Document the boundary between **working browser behavior, simulated behavior, and planned native functionality**.

Do not imply that an animated waveform or simulated device proves audio processing or hardware integration.

Cover every inventoried feature with an interactive implementation, a clearly identified simulation, or an explicit gap with its reason.

Deliver:

- Prototype source and simple launch instructions.
- A running local preview opened for my review.
- A guided walkthrough of the main workflows.
- Screenshots compared with the reference at matching window sizes.
- A feature coverage report and known limitations.
- Results from executing the prototype’s key workflows.
- Codex and Claude Code model recommendations for remaining prototype work and the proposed native implementation.

**Stop at the prototype review gate. Do not begin native application development until I explicitly approve the prototype.** Research experiments and browser prototype code are permitted during this phase; they do not authorize building the native product.

### 9. Specify the unrestricted open-source application

The proposed application should provide:

- All implemented core features without payment or subscription gates.
- No artificial limits on decks, tracks, crates, cues, loops, recordings, or sessions.
- Hardware support based on technical compatibility, without paid device unlocks.
- Local library management and playback without an account or internet connection.
- User-editable mappings and extensible device support.
- Open source code, reproducible builds, and a clear contribution process.

“No limits” means **no artificial product restrictions**. Document practical resource limits and external service restrictions honestly.

Specify the language, desktop framework, audio engine, storage, extension architecture, model runtime, packaging, updates, and testing strategy. Prioritize macOS and assess a practical path to Windows and Linux.

Separate required and optional services. Prefer **no mandatory backend**. Explain unavoidable third-party costs or dependencies.

Define a smallest usable release, followed by milestones covering the full inventory. Include acceptance criteria, hardware tests, performance targets, dependencies, risks, and effort ranges.

For every implementation task, include the recommended Codex model and reasoning effort, Claude Code model and effort configuration, primary choice, rationale, and escalation conditions.

### 10. Create and maintain the repository and Trello board

After execution is approved, create a **private GitHub repository** and a **new Trello board**. Verify their visibility and return their links.

Keep the repository private during investigation and development. Prepare it for an eventual open-source release without publishing it automatically.

Store:

- Research scope and installed-version inventory.
- Feature and visual parity matrices.
- Evidence ledger and reproduction instructions.
- Hardware compatibility and test matrices.
- Component, product-model, and technology-stack comparisons.
- License decisions and dependency inventory.
- Architecture, prototype source, and launch instructions.
- Validation results, known gaps, and implementation roadmap.
- A dated Codex and Claude Code model-selection matrix.

Do not commit Serato binaries, extracted proprietary code or assets, credentials, or sensitive local data.

Organize Trello around research, prototype, review, implementation, hardware validation, and completion. Keep native implementation work pending until prototype approval.

Each actionable card must contain:

- **Task ID and related feature IDs.**
- **Outcome and scope.**
- **Reference behavior and supporting evidence.**
- **Dependencies and blockers.**
- **Implementation approach and relevant components.**
- **Codex recommendation:** exact model, supported reasoning effort, and rationale.
- **Claude Code recommendation:** exact model, supported effort/thinking configuration, and rationale.
- **Primary execution choice and escalation trigger.**
- **Reviewer recommendation**, or an explanation that separate review is unnecessary.
- **Acceptance criteria and concrete verification steps.**
- **Required hardware, fixtures, or test data.**
- **Estimated effort and uncertainty.**
- **Actual execution and verification results**, populated only after the work occurs.

If Trello custom fields are unavailable, include these as clearly labeled sections in the card description. Do not omit model recommendations because a board feature is unavailable.

### 11. Completion criteria for the first approved phase

The first phase is ready for my review when:

- The inspected Serato version and investigation coverage are documented.
- Features, hardware behavior, restrictions, and unknowns are traceable to evidence.
- A specific open-source foundation, product-model selection, and technology stack are recommended.
- Every feature and actionable plan item has a Codex and Claude Code model recommendation with supported effort settings and reasoning.
- Those recommendations appear consistently in the repository plan and corresponding Trello cards.
- The full interactive HTML prototype is runnable and available for inspection.
- Key prototype workflows have been executed and their results recorded.
- Visual and functional differences, simulations, and unverified hardware behavior are clearly listed.
- The private repository and Trello board contain the research, prototype, and proposed build plan.

Report what was actually observed and tested. Clearly distinguish **proposed, implemented, simulated, and verified functionality**, as well as **recommended versus actually used development models**.

**Do not execute anything yet. Present the approach first and wait for my approval. After approval, investigate and deliver the HTML prototype for review before building the native application.**

### 12. Deliver and maintain a thorough Markdown build plan

Create a standalone **FULL_BUILD_PLAN.md** in the project repository, in addition to the interactive HTML prototype and Trello board. It must be a complete, usable planning artifact rather than a brief summary or a promise to document later.

Start with a clearly labeled provisional plan, then update it with verified findings after investigation. Preserve the distinction between a planning assumption and a selected, tested implementation. A pre-approval planning file does not authorize execution of the investigation or build.

Include:

- Project outcome, user workflows, scope, constraints, authority, approval gates, and explicit definitions of done.
- Reference product/version inventory; evidence labels, sources, uncertainties, and a coverage ledger.
- Every discoverable feature, stable IDs, behavior/state requirements, visual and functional parity, dependencies, failure/recovery behavior, and acceptance tests.
- Comparative open-source foundation and technology-stack evaluation, exact chosen versions when verified, license compatibility, tradeoffs, alternatives, and architecture decisions.
- Audio engine, DSP, timing, concurrency, decoding, analysis, caching, library data, persistence, routing, device protocols, and extension architecture.
- Product-model evaluation for stems and analysis, including exact code/weight licenses, runtime, resource budgets, quality evaluation, and offline provisioning.
- A full HTML prototype specification, screen/state inventory, real versus simulated behavior, launch instructions, user walkthroughs, and prototype review criteria.
- A per-feature and per-task Codex/Claude Code model matrix: exact model, supported reasoning/effort setting, verification date/source, primary choice, rationale, escalation/fallback, reviewer, and actual execution history.
- Native delivery milestones, smallest usable vertical slice, task dependencies, best/realistic/worst estimates with assumptions, and re-estimation checkpoints.
- Hardware compatibility matrix and access requirements, including turntables/DVS, mixers, controllers, CDJs, USB audio and storage; no unsupported universal compatibility claims.
- Performance targets, test fixtures, DSP and audio tests, visual comparisons, keyboard/accessibility checks, offline tests, failure recovery, installed runtime tests, and release evidence.
- Required versus optional services, account-free local operation, security/privacy boundaries, packaging, updates, reproducible builds, and eventual open-source release preparation.
- GitHub/Trello structure, required card template, task IDs, synchronization rules, complete task/model recommendations, blockers, decisions, risks, handoffs, and exact re-entry steps.

Use readable sections, a navigation list, and tables for comparison. Be thorough without repeating the same requirements in multiple places. Put detailed supporting inventories and raw evidence in linked companion documents as they are created. Keep this Markdown plan the canonical source of scope and sequencing; reconcile Trello with it without overwriting human changes.

Every feature and task must resolve to actual verified model recommendations before execution. Do not fill unknown Claude Code model names, reasoning settings, prices, licenses, or hardware results with guesses. State unresolved fields plainly and specify the action needed to resolve them.

Return clickable links to the full Markdown build plan, the complete saved project prompt, and—only after execution approval—the running HTML prototype, private repository, and Trello board. Document checks prove the files exist and are structurally complete; they do not prove the proposed application works.

**Maintain both approval gates: obtain execution approval before investigation/prototype work, and explicit approval of the presented HTML prototype before native application development.**
