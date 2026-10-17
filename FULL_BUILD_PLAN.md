# Open Play — full build plan

**Prepared:** 16 October 2026 · **Owner:** Jason · **Status:** HTML review candidate available; investigation and exact parity reconciliation remain open; native build blocked on prototype approval.

This document expands the supplied Serato investigation brief into a proposed delivery plan. Investigation is in progress. Local inspection identifies Serato DJ Pro 4.0.10.213 and Desktop installers 4.0.9/4.0.10. A private GitHub repository and private Trello board have been created and their visibility verified. The official manual index contains 168 articles across 23 sections. The connected Hercules DJControl Inpulse 300 MK2 is visible through USB, CoreAudio and CoreMIDI; Jason reports that its browser knob moves the highlighted Serato track; byte-level input and physical audio-routing tests remain pending. Ghidra completed deep auto-analysis; Hopper remains supplementary and its REA bridge is currently blocked. A runnable HTML candidate now covers all 110 inventoried feature groups through real interactions, explicit simulations or documented gaps. It contains 521 interaction requirements; historical counts below are retained as dated checkpoints. Exact 1:1 parity is not verified; native implementation has not begun. See the [executed prototype review](docs/prototype/REVIEW_REPORT.md). See [evidence ledger](docs/research/EVIDENCE_LEDGER.md) and [project resources](docs/delivery/project-resources.json).

“Open Play” is a working project name taken from this workspace, not a confirmed public brand. This plan is the canonical planning artifact; the accompanying [execution prompt](PROJECT_PROMPT.md) preserves the instructions for the future executing agent.

## Navigation

- [1. Outcome, authority, and current state](#1-outcome-authority-and-current-state)
- [2. Product contract and scope](#2-product-contract-and-scope)
- [3. Evidence and research protocol](#3-evidence-and-research-protocol)
- [4. Stack-selection decision](#4-stack-selection-decision)
- [5. Product ML and model evaluation](#5-product-ml-and-model-evaluation)
- [6. Codex and Claude Code routing](#6-codex-and-claude-code-routing)
- [7. Proposed architecture and invariants](#7-proposed-architecture-and-invariants)
- [8. Full feature backlog](#8-full-feature-backlog)
- [9. Screen and interaction specification](#9-screen-and-interaction-specification)
- [10. HTML prototype specification](#10-html-prototype-specification)
- [11. Native implementation sequence after approval](#11-native-implementation-sequence-after-approval)
- [12. Audio, performance, and reliability acceptance](#12-audio-performance-and-reliability-acceptance)
- [13. Hardware acceptance matrix](#13-hardware-acceptance-matrix)
- [14. Services, privacy, and distribution](#14-services-privacy-and-distribution)
- [15. GitHub and Trello operating plan](#15-github-and-trello-operating-plan)
- [Outcome and scope](#outcome-and-scope)
- [Reference and evidence](#reference-and-evidence)
- [Dependencies](#dependencies)
- [Implementation approach](#implementation-approach)
- [AI execution recommendation](#ai-execution-recommendation)
- [Acceptance and verification](#acceptance-and-verification)
- [Estimate](#estimate)
- [Actual execution record](#actual-execution-record)
- [16. Scheduling, estimates, and risk control](#16-scheduling-estimates-and-risk-control)
- [17. Handoff and change control](#17-handoff-and-change-control)
- [18. Completion and review checklist](#18-completion-and-review-checklist)
- [19. Methods applied](#19-methods-applied)

## 1. Outcome, authority, and current state

**Outcome:** an independently implemented open-source desktop DJ application with Serato-like design and functional behavior, local operation, and no artificial feature or device gates.

**User job:** when preparing and performing a DJ set with my music and compatible equipment, I want familiar controls and dependable playback so I can perform without losing capabilities to account, subscription, or paid device restrictions.

| Constraint | Requirement |
|---|---|
| Target | Serato DJ Pro 4.0.10.213 for macOS; arm64 analysis slice |
| Must | Investigate evidence, map features, recommend stack and models, present full HTML prototype before native build |
| Must | Preserve installed applications, user libraries, metadata, mappings, settings, and existing project work |
| Must | Include Codex and Claude Code model/effort recommendations on every feature, work item, plan entry, and Trello card |
| Must not | Start HTML implementation before completing the feature/screen inventory gate |
| Must not | Start native implementation before explicit prototype approval |
| Must not | Patch Serato, bypass activation, or commit proprietary binaries, code, assets, credentials, or private library data |
| Authority now | G0 approved: investigation, private repository/board, updated plan, then full HTML prototype after parity inventory |
| Authority later | Record the separate prototype approval before native implementation |
| Done evidence now | Evidence-linked inventory, private resources, maintained plan, then an executed HTML prototype; all unresolved parity gaps disclosed |
| Done evidence later | Executed workflows on the exact prototype/native candidate and declared hardware matrix |

**Now:** review the runnable HTML candidate and continue exact-version completeness reconciliation. **Next:** run the independent Claude audit, resolve omissions and obtain explicit prototype approval. **Later:** only after approval, native slices, hardware acceptance, and release preparation. **Re-entry:** read this section, the latest evidence ledger, decisions, and approval record before doing anything else.

### Approval gates

| Gate | Entry condition | Authorized next work | Exit evidence |
|---|---|---|---|
| G0 — execution | User approves the investigation/prototype approach | Read-only inspection, scoped experiments, private repository/board setup, HTML prototype | Approval recorded with date and scope |
| G1 — prototype review | Research package and full prototype presented | Review and reversible prototype revisions | User explicitly approves identified prototype version |
| G2 — native build | G1 approval exists | Native implementation within approved scope | Installed candidate passes agreed native tests |
| G3 — publication | Release candidate and public contents are reviewable | Public repository/release only if explicitly approved | Publication verified; source/license/package links recorded |

Prototype approval does not imply public release, purchases, subscription changes, or unlimited service spending. Unavailable research or hardware is recorded as a gap; it is not silently treated as complete.

## 2. Product contract and scope

Core library management, local playback, mixing, implemented analysis, recording, mappings, and device compatibility must not require payment, sign-in, internet connectivity, or entitlement checks. A feature may be unavailable because it is unimplemented, unsupported by hardware, or missing a required local resource; its status must explain that specific reason.

“No limits” means no artificial product caps. Available RAM, CPU/GPU, ports, device channels, storage, and tested processing budgets still constrain operation. Deck count must be architecturally extensible; initial acceptance covers two and four decks, with additional counts added only after measured validation. Do not replace a product paywall with a resource check that is really a hidden product cap.

| Scope | Treatment |
|---|---|
| Reference design and behavior | Closely match measured layout, density, states, controls, shortcuts, and interactions |
| Brand and implementation | Original name/assets and independently authored implementation |
| macOS | First native target; minimum supported OS and CPU architecture decided from evidence |
| Windows/Linux | Portability constraints documented now; platform release claims require platform testing |
| Hardware | Compatibility declared per tested model, firmware, OS, driver, transport, and use case |
| Streaming | Optional adapter; external subscriptions/rights cannot be represented as unrestricted local functionality |
| Product AI | Local task-specific models only where they earn their complexity; no mandatory LLM |
| Development AI | Codex/Claude Code may assist building; their accounts/models are not product dependencies |
| Full parity | Every discovered feature retained in the coverage ledger, including deferred or blocked items |

The earliest native release is a thin end-to-end performance slice, not an assertion that every Serato feature is already supported. Later work must remain visible, with acceptance conditions and no artificial access gates.

## 3. Evidence and research protocol

Use official background sources after G0:

- [Serato website](https://serato.com/)
- [Serato DJ Pro manual](https://support.serato.com/hc/en-us/categories/202698038-Serato-DJ-Pro-manual)

Official website, download, hardware and manual sources have been retrieved. Manual coverage is being reconciled against 4.0.10; older articles are not automatically treated as current behavior.

### Evidence labels

| Label | Meaning | Does not establish |
|---|---|---|
| OBSERVED | Reproduced behavior with environment and steps | Other versions, devices, or conditions |
| FILE-VERIFIED | Identifiable artifact, import, resource, or code supports the claim | Reachability or actual runtime behavior |
| DOCUMENTED | Version-relevant official source states the behavior | Local reproducibility |
| INFERRED | Reasoned interpretation with supporting evidence and competing explanations | Confirmed implementation |
| UNKNOWN | Not yet accessible or verified | Absence of a feature |
| PROPOSED | Our design or target for Open Play | A fact about Serato or achieved performance |

Each evidence record needs ID, claim, label, reference version, timestamp, source location, reproduction steps, tools, artifact hash where appropriate, result, confidence limits, contradictions, related feature IDs, and next verification action. Screenshots and traces should avoid exposing private music paths, personal metadata, serial numbers, and account information in shared documentation.

### Investigation sequence

1. Inventory Desktop artifacts and aliases; resolve targets without moving or installing anything unexpectedly. Record product name, version, architecture, bundle identifiers, hashes, signatures, and provenance where inspectable.
2. Inventory available REA capabilities and choose the smallest tool that answers each question. Confirm Hopper/Ghidra installations and relevant architecture support only when needed.
3. Map bundled resources, frameworks, dependencies, configuration, device definitions, strings, symbols, and imports. Record absence of symbols as a limitation.
4. Create a manual-derived feature catalogue tied to reference-version coverage. Reconcile it with the running UI and installed resources.
5. Follow representative control/data paths: import → analysis → load → play; hardware attach → identify → map → route; cue/loop → transport; stems request → processing → cache → mix.
6. Use a test library and disposable project settings for runtime work. Before starting the reference app, document any expected writes, account prompts, or migration risks; preserve existing user data.
7. For feature gates, separately test or document capability availability, configuration, driver health, account/entitlement state, and device identity. Do not infer a commercial gate solely from disabled controls or suggestive strings.
8. Investigate alleged regressions with a before/after evidence pair: versions, device/firmware, OS/driver, account state, exact feature, source dates, and reproduction. If older artifacts are unavailable, keep the claim unverified.
9. End each research batch with a concrete evidence entry, diagram, test, or specification update. Do not let broad binary exploration replace feature coverage.

### Research stop rules

- After three similar unsuccessful inspection attempts, change method: documentation, runtime trace, alternative disassembler, or a focused unknown record.
- Missing hardware blocks only the relevant compatibility claim, not unrelated prototype work.
- No guessed proprietary protocol support. Make unresolved protocol feasibility an explicit milestone dependency.
- Before calling a feature absent, check reference version, layout, preferences, hardware mode, and documentation coverage.

## 4. Stack-selection decision

**Decision remains pending.** Select the best available open-source foundation after current source/license review and a bounded comparison. A polished architecture proposal is not evidence that a stack meets live-audio requirements.

Compare three approaches, in this order of likely reuse:

| Approach | What to investigate | Main uncertainty | Decision experiment |
|---|---|---|---|
| Extend/fork an established open-source DJ application | Candidate such as Mixxx; source boundaries, UI flexibility, device mappings, engine tests, license obligations | Cost of achieving reference fidelity while maintaining upstream compatibility | Read architecture and contribution history; after native approval, measure a minimal change/build |
| Build around reusable native audio/UI components | Candidate native languages/frameworks and independently licensed DSP/model runtimes | Integration burden and ownership of realtime behavior | License/dependency review; bounded post-approval audio/device experiment |
| Web interface with native audio/device host | Browser prototype reuse, IPC, lifecycle and packaging costs | Synchronization, memory, accessibility, and audio isolation | Prototype interaction timing first; native-host experiment only after G1 |

Candidate names are investigation leads, not verified endorsements. Do not claim any library or model is currently open source, redistributable, supported, or fastest without checking the exact version and license.

### Selection scorecard

Current provisional recommendation: evaluate a Mixxx-based C++/Qt foundation first; use HTDemucs as an initial four-source evaluation baseline, not a claimed production winner. See [foundation decision](docs/decisions/001-foundation-and-models.md) for evidence, alternatives, service boundaries and unresolved model/license benchmarks.

Apply hard exclusions before weighted comparison: incompatible distribution terms, required hosted core operation, inability to isolate real-time audio, or inability to implement required hardware behavior. Unknowns remain unknown rather than receiving convenient scores.

Proposed weights, to ratify before scoring: audio stability/latency 30%; feature and hardware reuse 20%; maintenance and integration effort 20%; visual/interaction fidelity 15%; portability 10%; packaging/resource overhead 5%. License compatibility is a gate, not a tradeable percentage.

For each shortlisted component record exact version/commit, maintainer, source URL, code license, transitive dependencies, model/data licenses where relevant, redistribution obligations, offline operation, security/update history, architecture support, build requirements, benchmark setup, and replacement cost.

Produce ADR-001 with the winning approach, rejected alternatives, evidence, remaining risks, and a reversal trigger. Do not select a technology solely because a coding agent is familiar with it.

## 5. Product ML and model evaluation

Evaluate ML separately from developer model routing. Many features should use deterministic DSP or conventional software rather than an LLM.

| Product capability | Candidate method to compare | Acceptance evidence |
|---|---|---|
| Stems | Locally executable source-separation models versus existing licensed-compatible engines | Listening evaluation, leakage/artifacts, timing alignment, throughput, memory, model redistribution |
| BPM and beats | DSP baselines versus learned beat/downbeat models | Curated tracks with tempo changes, half/double-time ambiguity, annotation tolerances |
| Key | Conventional chroma/key estimation versus learned approaches | Documented evaluation set, ambiguous/modulating tracks, correction workflow |
| Waveforms/loudness | Deterministic signal analysis first | Output derived from actual decoded samples and repeatable fixtures |
| Library assistance | Search/filter baseline before a local language model | Concrete time-saving task, predictable failure recovery, no effect on playback |

For every model record repository/commit, weight hash, code and weight licenses, attribution, commercial/redistribution terms, dependencies, download size, precision/quantization, supported devices, benchmark protocol, cold/warm time, thermal behavior, memory peak, quality measures, and offline installation path.

Keep heavy work cancellable, queued, and outside the audio callback. Cache by content identity, model/version, parameters, and analysis version. Invalidate stale caches deliberately. Test cancellation, corrupted outputs, disk-full conditions, unavailable accelerators, and recovery. Never switch stems timing or model output into a playing deck in a way that produces an unannounced timing jump.

No product feature requires an online language-model API. Optional online features, if later requested, must remain independent of core performance and separately consented.

## 6. Codex and Claude Code routing

### Verification boundary

The current Codex session advertises `gpt-6-luna`, `gpt-6.1-sol`, and `gpt-6-astra` with the reasoning levels used below. This establishes session-advertised options only, not Claude Code support, subscription pricing, CLI identifiers, or future availability. The table is a **provisional recommendation**, not a claim that those models executed any task.

Claude Code 2.1.222 has been inspected through version/help output. Exact recommendations and supported effort selections are recorded in [development routing](docs/models/DEVELOPMENT_ROUTING.md). Official configuration history supports the installed generation; account access and model quality remain untested. No Claude process has been tasked and no CLI upgrade performed.

After G0, inspect installed CLI versions and available configuration/help without exposing secrets; corroborate exact model and effort support against current official documentation. Record verified-at date and source. Where a tool does not expose an effort setting, say so and record its actual supported configuration instead of inventing a matching level.

### Routing profiles

| Profile | Work | Provisional Codex model / effort | Claude Code recommendation pending exact ID/configuration verification | Escalation and review |
|---|---|---|---|---|
| D | Bounded docs, evidence formatting, mechanical edits | `gpt-6-luna` / medium | `claude-sonnet-5` / low (account execution untested) | Escalate to U when synthesis is ambiguous; evidence spot-check |
| U | UI, browser workflows, library behavior, integration | `gpt-6.1-sol` / high | `claude-sonnet-5` / medium (account execution untested) | Escalate after two materially different failed approaches or unclear state architecture |
| S | Architecture, data integrity, migrations, security, integration boundaries | `gpt-6.1-sol` / xhigh | `claude-opus-5` / high (account execution untested) | Independent review for destructive migrations or concurrency boundaries |
| A | DSP, callback behavior, audio timing and transport | `gpt-6-astra` / high | `claude-opus-5` / high (account execution untested) | Move to xhigh only for unresolved reasoning; independent audio review and measured tests |
| H | Binary investigation, hardware protocols, DVS, difficult device failures | `gpt-6-astra` / xhigh | `claude-opus-5` / xhigh (account execution untested) | Seek missing evidence before more model spend; independent claim review |
| M | Product-model evaluation, stems integration, benchmark interpretation | `gpt-6.1-sol` / high | `claude-sonnet-5` / high (account execution untested) | Escalate to S/A for accelerator concurrency or playback integration |
| V | Independent acceptance review and failure investigation | `gpt-6.1-sol` / xhigh | `claude-opus-5` / high (account execution untested) | Reviewer must inspect actual artifacts/tests and declare unexecuted checks |

Default primary tool is Codex for implementation and reproducible tests; Claude Code is a proposed alternative or reviewer, not an automatically launched collaborator. Final assignment must account for measured task quality, tool access, current availability, and cost. A model's explanation is never a substitute for runtime evidence.

Every feature below references a profile; expand that profile to literal verified model IDs, settings, rationale, primary choice, review configuration, fallback, and verification date in its plan entry and Trello card before execution. Research, prototype, native work, and review can use different profiles. All reference-inspection tasks start with H; routine prototype state work normally uses U; audio-bearing prototype work uses A; the feature table names the native/default specialist.

### Execution and cost policy

- Separate recommendation, assignment, actual model used, and measured result.
- Calibrate profiles on a small representative task set; compare accepted outcomes and elapsed work, not model prestige.
- Record tokens/time/cost only when available. Subscription access does not establish marginal price; missing cost data stays unknown.
- Set task-level review points and agreed spend limits before paid automation. No automatic purchases or account changes.
- Retry transient tool failures narrowly; do not repeatedly retry authentication, unsupported-model, or invalid-setting errors.
- Keep task context concise: relevant evidence, interfaces, target files, invariants, and acceptance tests.
- Do not auto-spawn agents or invoke Claude merely because a card contains a recommended model.

## 7. Proposed architecture and invariants

This section describes boundaries, not a selected implementation stack.

```text
Desktop UI / keyboard / controller events
                 |
        command validation and capability state
                 |
      bounded control queue -> real-time audio engine -> output device
                 ^                    |
     non-real-time state       bounded telemetry snapshots
          |          |
  library database   background decode / analysis / stems workers
          |          |
    files and caches / optional device and service adapters
```

### Audio engine

- Audio clock is authoritative for playback; UI animations reflect snapshots rather than drive transport.
- Use bounded work and preallocated resources in callbacks. No filesystem/network IO, model inference, unbounded allocation, blocking locks, or UI calls in the audio path.
- Define deck transport, source position, playback rate, tempo/key policy, loop boundaries, cue behavior, gain, mute, and route state explicitly.
- Define command timestamps, ordering, ownership, queue saturation behavior, cancellation, and stale-command rejection.
- Specify interpolation/resampling, smoothing, headroom, clipping indication, effect latency, bypass behavior, and channel layout.
- Decoders and caches must tolerate bad/truncated media without bringing down active playback.
- Device changes are controlled transitions with clear audio consequences; avoid accidental output bursts and unwanted routing.

### State and data

Proposed entities: Track, FileLocation, AudioFingerprint/ContentIdentity, Analysis, BeatGrid, Cue, SavedLoop, Crate, CrateMembership, SmartCrateRule, Session, DeckState, DeviceProfile, Mapping, AudioRoute, Recording, Preference, and MigrationRecord.

Document identifiers, ownership, cardinality, persistence, update semantics, and migration policy before schema implementation. Do not write into Serato library formats as an early shortcut. Any later import must be read-only first, optional, documented, and tested against fixtures.

Use transactional updates and tested backups for important user data. Distinguish canonical user edits from disposable analysis caches. A renamed file must not erase cues; a replaced file must not silently inherit incompatible timing metadata.

### Device abstraction

Separate audio transport, control transport, device identity, mappings, capabilities, and entitlement observations. Identity alone is insufficient proof of protocol or feature compatibility. Preserve unsupported devices in the UI with specific status rather than treating every unknown identity as a paid unlock opportunity.

### Packaging and extensions

Select configuration and mapping formats after foundation choice. Prefer declarative mappings over unrestricted executable plugins for the first release. Define extension validation, version compatibility, isolation, and recovery before adding executable extension support.

## 8. Full feature backlog

The registry below is the original **proposed scope**, not a verified Serato feature list. Research has added 36 groups in [Parity additions](docs/research/PARITY_ADDITIONS.md), producing a current [110-feature registry](docs/delivery/feature-registry.json) and [explicit model plan](docs/delivery/FEATURE_MODEL_PLAN.md). Reconcile it with the installed version and add every discovered feature. Initial rows are intentionally retained even when implementation is later.

Stages: P = prototype coverage; N1 = first native performance slice; N2 = advanced performance; N3 = hardware/ML expansion; R = release readiness. Every feature appears in P as real interaction, explicit simulation, or documented gap. A later native stage is sequencing, not a paywall.

Profiles resolve through section 6. Each feature must become one or more actionable cards with distinct research/prototype/native/test tasks rather than a giant unchecked card.

| Feature ID | Scope to investigate/build | Native stage* | Specialist profile | Observable acceptance criterion |
|---|---|---|---|---|
| LIB-001 | Local import and supported formats | N1 | U | Import supported fixtures, reject corrupted/unsupported files clearly, retain original media. |
| LIB-002 | Metadata and artwork | N1 | U | Read Unicode tags/artwork; edit safely with explicit write policy and recover malformed tags. |
| LIB-003 | Search, filter, sorting and columns | N1 | U | Find known fixtures, sort deterministically, preserve selection and column preferences. |
| LIB-004 | Crates and playlists | N1 | U | Create, rename, reorder and remove a crate without deleting its source tracks. |
| LIB-005 | Smart crates | N2 | U | Rule combinations produce expected membership after metadata changes and restart. |
| LIB-006 | Missing files and external volumes | N1 | S | Disconnect a test volume, relink moved files, and preserve cues/analysis identity. |
| LIB-007 | Duplicates and content identity | N2 | S | Differentiate duplicate paths from changed content; offer reversible reconciliation. |
| LIB-008 | History and session preparation | N2 | U | Persist played-track history and restore prepared selections across restart. |
| LIB-009 | Library import/export interoperability | N3 | S | Round-trip documented fixtures without changing the source application database. |
| LIB-010 | Large library virtualization | N2 | U | Measure search/scroll behavior with defined large fixtures during active playback. |
| LIB-011 | Metadata backup and migrations | N1 | S | Migrate and restore a fixture library; demonstrate rollback on interrupted migration. |
| ANA-001 | Waveform generation and caches | N1 | A | Waveform corresponds to decoded samples and remains aligned after seek/rate changes. |
| ANA-002 | BPM estimation | N1 | M | Evaluate annotated varied-tempo fixtures and preserve manual correction. |
| ANA-003 | Beat grids and editing | N2 | A | Set anchors/tempo sections, undo edits, persist them and verify transport alignment. |
| ANA-004 | Musical key analysis | N2 | M | Evaluate annotated corpus and show ambiguous cases without silently overriding edits. |
| ANA-005 | Gain/loudness analysis | N2 | A | Compare known-level fixtures and apply deliberate headroom without unexpected clipping. |
| ANA-006 | Analysis queues and cancellation | N1 | S | Cancel/resume work; recover a worker failure while playing audio without interruption. |
| DEK-001 | Load, unload and deck focus | N1 | U | Load correct file to intended deck and protect a playing deck from accidental replacement. |
| DEK-002 | Play, pause, seek and end-of-track | N1 | A | Verify transport and audible output at start/end, rapid commands and long media. |
| DEK-003 | Cue and hot cues | N1 | A | Set, trigger, label and persist sample-position cues; verify quantized/free behavior. |
| DEK-004 | Manual, automatic and saved loops | N1 | A | Enter/exit/retrigger loops, edit boundaries and verify repeat timing and persistence. |
| DEK-005 | Beat jump | N2 | A | Jump signed beat lengths using current grid without unexpected phase/position errors. |
| DEK-006 | Tempo fader and pitch ranges | N1 | A | Measure rate changes, reset and fine adjustment without audible control discontinuities. |
| DEK-007 | Key lock and independent key shift | N2 | A | Compare pitch/tempo behavior and artifacts across declared musical/rate ranges. |
| DEK-008 | Sync, master and phase | N2 | A | Change leader, disable sync and handle tempo changes with predictable phase behavior. |
| DEK-009 | Jog, nudge and scratching | N2 | A | Verify directional/speed response, touch release and latency with physical controls when claimed. |
| DEK-010 | Slip and reverse modes | N2 | A | Verify underlying timeline and exit position through cue, loop and scratch combinations. |
| DEK-011 | Two/four and extensible decks | N2 | S | Operate two/four decks independently; document measured resource limits and extension path. |
| DEK-012 | Quantization and musical timing | N2 | A | Compare quantized/free commands around beat boundaries and grid corrections. |
| MIX-001 | Channel gain, faders and mute | N1 | A | Measure known-signal gain and smooth fast changes without zipper noise. |
| MIX-002 | Crossfader curves and assignment | N1 | A | Verify curves, side assignment and bypass using independent channel fixtures. |
| MIX-003 | EQ and filters | N1 | A | Measure response, neutral settings and transitions; listen for unstable behavior. |
| MIX-004 | Headphone cue and cue/master blend | N1 | A | Physically verify independent monitor output and correct cue routing. |
| MIX-005 | Master meters, headroom and clipping | N1 | A | Known-level signals produce correct meter/clip behavior without hidden attenuation. |
| MIX-006 | Internal/external mixing modes | N3 | H | Verify channel routes and control ownership against a declared physical mixer. |
| FX-001 | Effects chains and assignment | N2 | A | Assign effects per intended scope; verify ordering, bypass and preserved parameters. |
| FX-002 | Tempo-synced effect timing | N2 | A | Measure delay/modulation timing through tempo changes and sync transitions. |
| SMP-001 | Sampler slots and banks | N2 | U | Load, trigger and switch banks with coherent per-slot state. |
| SMP-002 | Sampler audio modes and routing | N2 | A | Verify one-shot/loop/gate behavior, gain and routes under simultaneous triggers. |
| STM-001 | Local stem separation | N3 | M | Evaluate licensed model output quality, throughput, alignment and memory on declared devices. |
| STM-002 | Stem mute/solo/mix controls | N3 | A | Audible controls affect the intended separated component without timing jumps. |
| STM-003 | Stem cache/cancel/fallback | N3 | S | Cancel or fail inference and continue playback; invalidate incompatible model caches. |
| REC-001 | Record the actual master mix | N1 | A | Capture known mixed output, reopen file, and verify duration/channels/content. |
| REC-002 | Recording limits and recovery | N2 | S | Handle disk full, permission loss and interrupted sessions with recoverable files where possible. |
| AUD-001 | Output/input device selection | N1 | H | Enumerate actual devices/channels and confirm sound travels through selected routes. |
| AUD-002 | Sample rate and buffer controls | N1 | A | Apply supported settings and measure latency/xruns rather than trusting nominal values. |
| AUD-003 | Multichannel routing | N2 | A | Use channel-identification fixtures to confirm every selected bus/output/input. |
| AUD-004 | Hot plug and route recovery | N1 | H | Disconnect/reconnect real hardware; recover predictably without bursts or wrong outputs. |
| AUD-005 | Clock drift and multiple devices | N3 | A | Measure synchronization across declared devices/modes; document unsupported combinations. |
| AUD-006 | Long-session resource stability | R | A | Complete defined soak and stress tests with callback, CPU and memory evidence. |
| HW-001 | Device inventory and capabilities | N3 | H | Show observed audio/control capabilities separately from identity and unsupported status. |
| HW-002 | MIDI learn and mapping editor | N3 | U | Learn, edit, export, import and reset mappings with validation and undo. |
| HW-003 | MIDI timing and control semantics | N3 | H | Verify encoders, pitch messages, modifiers, takeover and deck focus with actual device. |
| HW-004 | LED and display feedback | N3 | H | Physical feedback tracks authoritative app state and recovers on reconnect. |
| HW-005 | HID/controller integration | N3 | H | Verify actual reports, handshake, control mapping and failure/reconnect behavior. |
| HW-006 | CDJ/media-player integration | N3 | H | Validate a named model/firmware/mode including jog, transport and feedback. |
| HW-007 | DVS signal and calibration | N3 | H | Measure input quality/calibration and speed/direction tracking on declared turntable/interface. |
| HW-008 | DVS operating modes and dropout | N3 | A | Test absolute/relative/internal behavior where applicable and loss/recovery of timecode. |
| HW-009 | USB storage behavior | N1 | U | Import and reload from removable storage and handle disappearance without corrupting library. |
| HW-010 | Conflicts and multiple controllers | N3 | H | Resolve overlapping mappings/device changes with visible ownership and predictable state. |
| UI-001 | Reference shell and layouts | P | U | Compare matching reference viewports and verify resizing/panel transitions without state loss. |
| UI-002 | Menus, shortcuts and drag/drop | P | U | Execute mapped workflows, including text-input focus and modal shortcut conflicts. |
| UI-003 | Preferences and reset | P | U | Apply, persist, undo where appropriate and reset only the requested preference scope. |
| UI-004 | Accessibility and reduced motion | P | U | Verify keyboard/focus/names/contrast and non-color status cues in actual rendered interface. |
| UI-005 | Empty/progress/error/recovery states | P | U | Trigger actual or labeled simulated errors and reach a clear recoverable state. |
| UI-006 | Long labels, Unicode and scaling | N2 | U | Test long metadata, Unicode, high DPI and smaller supported windows without hidden core controls. |
| SYS-001 | Offline account-free operation | N1 | S | Cold-launch and perform core workflows with network blocked and no account configured. |
| SYS-002 | Session persistence and recovery | N2 | S | Recover settings/library after interruption; do not auto-start audio unexpectedly. |
| SYS-003 | Optional provider integrations | N3 | S | Provider failure or logout affects only that integration; local playback remains available. |
| SYS-004 | Installer, permissions and updates | R | S | Clean-machine install, launch, update and recovery preserve user data and functionality. |
| SYS-005 | Diagnostics and opt-in reporting | R | S | Export useful redacted local diagnostics and verify reporting consent behavior. |
| SYS-006 | Open-source build and provenance | R | S | Rebuild documented candidate from source and audit dependency/model/asset notices. |
| SYS-007 | Mappings/extensions compatibility | N3 | S | Reject invalid/incompatible extension data and recover without affecting playback. |
| SYS-008 | No artificial feature gates | R | V | Audit feature availability and run core functions with no entitlement/account/network state. |

*P rows are prototype deliverables that continue into the native implementation as applicable. All 74 proposed features require prototype coverage; this count is not a claim about the number of Serato features. Each is currently PROPOSED / reference verification pending.


## 9. Screen and interaction specification

Inventory the exact reference layouts first. Proposed screen/state families:

1. Performance workspace: two/four decks, alternate waveform/deck layouts, mixer and deck focus.
2. Library workspace: source tree, crates, search, sortable table, preview, metadata and missing files.
3. Performance panels: cues/loops, effects, sampler, stems, recording, history.
4. Preferences: audio, controllers/mappings, library/analysis, display, shortcuts, advanced diagnostics.
5. Hardware setup: no device, discovering, connected, configuring, unsupported, disconnected, reconnecting, failed.
6. Overlays and menus: context menus, confirmation for destructive library actions, import/analysis progress, recoverable errors.

For every screen record reference version, viewport, scale/DPI, layout mode, panel dimensions, typography, colors, spacing, icons, labels, tab/focus order, shortcut, state transitions, and unavailable evidence. Maintain a shared token/component inventory derived from observed reference behavior. Do not invent precision measurements from memory.

Reference familiarity must coexist with usable focus indicators, keyboard access, meaningful names, readable contrast, and non-color state cues. Document any deliberate accessibility deviation from the reference. Avoid inserting engineering diagnostics into the performance UI; put simulation detail in a dedicated prototype guide/status area.

Visual acceptance is region-based: shell, deck, waveform, controls, library, overlays. Capture matching size/state screenshots; account for dynamic waveform/time differences; inspect diffs rather than trusting one aggregate similarity percentage. The user approves visible fidelity.

## 10. HTML prototype specification

**Deliverable:** a local HTML/CSS/JavaScript experience with a documented launcher and a complete navigable feature surface. Build tooling is allowed if the deliverable remains easy to run locally. Prefer local assets and no required external CDN.

### Behavior contract

| Capability | Required prototype treatment |
|---|---|
| Library, crates, search, sorting, menus, settings | Real interactive state and coherent persistence/reset behavior |
| Audio import, load, play, pause, seek, level, simple mixing | Real browser audio where supported; verify audible or captured output |
| Waveforms | Derive from actual decoded samples for real audio; clearly label demo fixtures |
| Cues and loops | Real behavior where feasible; explicit simulation if timing/engine is incomplete |
| Tempo/key/sync | Separate real implemented DSP from visual parameter changes |
| Headphone/multichannel routing | Demonstrate UI; prove browser/device routing or mark simulated |
| DVS, HID/CDJ protocols, unsupported devices | Explicit simulated state machine unless actually accessible and tested |
| Stems | Real local model integration only if feasible in prototype scope; otherwise labeled simulation |
| Recording | Real captured mix when implemented; never save silent/demo output as proof of a working recorder |

### Structure and state

Separate reference-derived tokens/components, application state, audio adapter, storage adapter, fixture data, and simulation adapters. Give each action one authoritative state transition. Avoid disconnected click handlers that only animate controls.

Support user-selected local media; do not upload it. Handle browser audio-unlock gestures, unsupported decode, revoked file permissions, reload/re-selection, background throttling, storage limits, and reset. Persist only data actually recoverable on reload; do not promise permanent filesystem access without verifying the chosen browser mechanism.

### User review journeys

| Journey | Observable result |
|---|---|
| J01 — start and explore | Open prototype, identify major regions, switch deck layouts without losing loaded state |
| J02 — prepare library | Import legal test files, create crate, search/sort, edit safe metadata, recover missing-file state |
| J03 — perform a mix | Load two tracks, play, seek/cue, adjust gain/EQ/crossfader; verify sound changes |
| J04 — use performance controls | Trigger cues/loops and panels; disclose precisely which audio behaviors are real |
| J05 — configure equipment | Walk connection, route, mapping, unsupported and disconnect/reconnect states |
| J06 — record/review | Demonstrate real recording if implemented and reopen output; otherwise explicit simulation |
| J07 — keyboard and recovery | Navigate without mouse, dismiss overlays, recover from load error, reset demo safely |
| J08 — unrestricted local use | Turn network off after local setup; demonstrate core available features without account/pay prompts |

### Prototype review packet

Provide running URL, source revision/hash, launcher instructions, screenshots, workflow recordings if practical, feature coverage table, real/simulated/gap map, test results, browser/OS versions, known defects, and the exact decisions requested from Jason. Prototype approval accepts the UX direction and identified limitations; it does not prove native latency, DVS, CDJ support, or production readiness.

## 11. Native implementation sequence after approval

| Milestone | User outcome | Dependencies | Exit evidence | Primary routing |
|---|---|---|---|---|
| M0 | Evidence-based scope | G0 | Reference inventory, evidence ledger, stack/model decisions, hardware gaps | H + S; V review |
| M1 | Reviewable full prototype | M0 | J01–J08 executed with explicit simulation labels; user review packet | U + A; V review |
| M2 | Approved interface direction | M1 | G1 record identifies approved prototype candidate and changes | D/U |
| M3 | Install, import, play, and mix local tracks | M2, native stack selected | Packaged macOS two-deck audio path, local library, stable routing | A + U + S; V review |
| M4 | Prepare and perform a complete set | M3 | Cue/loop/grid/sync, four decks, effects/sampler/recording accepted | A + U; V review |
| M5 | Use declared external equipment | M3, physical test matrix | MIDI/HID/audio routing and representative hardware workflows pass | H + A; V review |
| M6 | Use local advanced analysis/stems | M4, licensed models | Quality/resource benchmarks and uninterrupted playback under load | M + A; V review |
| M7 | Recover and update confidently | M3–M6 | Session recovery, safe migrations, installer/update/rollback tests | S + V |
| M8 | Prepare an open-source release | M7, provenance review | Clean-machine build/install, source/license inventory, docs and release evidence | S + D + V |

M5 and M6 planning may progress independently where dependencies permit; do not imply authorization for parallel agents. Reassess sequence from evidence rather than promising all hardware families simultaneously.

### First native vertical slice

Install candidate → launch without account/network → import two local tracks → analyze enough to render accurate waveform/time → load decks → play and monitor → mix → record → stop and reopen recording → restart and recover library/cues. Use the selected output device and inspect/capture the produced audio. This path is the minimum meaningful proof, not merely a green build.

## 12. Audio, performance, and reliability acceptance

The following numbers are **proposed initial engineering targets**, not measured results, universal promises, or Serato specifications. Ratify them against declared minimum hardware and the actual foundation.

| Area | Proposed acceptance target / protocol |
|---|---|
| Steady playback | Zero observed xruns in a 2-hour two/four-deck test on the declared hardware matrix; extend to 8-hour release soak |
| Callback budget | At a declared 256-frame/48 kHz test setting, period is about 5.33 ms; target callback p99 below half that period and record worst observed time |
| Latency | Measure round-trip and action-to-audio latency with loopback/appropriate hardware; do not equate nominal buffer size with end-to-end latency |
| UI responsiveness | Proposed p95 input-to-visible-feedback below 100 ms under the defined workload; record frame-time distribution during waveform motion |
| Library interaction | Proposed p95 indexed search below 200 ms with a documented 100,000-row metadata fixture; test larger fixtures separately |
| Memory | No sustained unbounded growth across repeated load/unload, cancel/restart, and device cycles; choose a numeric budget after stack/device baseline |
| Recording | No missing frames under declared workload; validate duration/channels/format, reopen output, and compare a known signal |
| Offline operation | Cold launch and core workflows with network unavailable after dependencies/models are provisioned |
| Failure isolation | Bad files, model crashes, disk-full recording, lost device, and failed optional integrations do not corrupt the library |
| Portability | Build success is separate from installed runtime acceptance for each architecture/OS |

### DSP and analysis tests

Use generated impulse, silence, sine, sweep, multichannel, clipping, and known-duration fixtures plus rights-cleared music. Check output duration, frequency response where relevant, discontinuities, channel order, latency compensation, loop boundaries, and rate-change transitions. Listening tests complement signal checks; neither alone proves every musical case.

For BPM/key/stems, publish the test corpus provenance, annotations, tolerance definitions, reference method, ambiguous cases, and results. Avoid a single accuracy percentage without denominator and musical context. Do not force a confidently wrong beat grid; preserve editing and corrections.

### Test layers

Use focused unit tests for DSP/math and data invariants; integration tests for state, routing, import/analysis persistence and UI behavior; a small set of critical end-to-end journeys; visual regression for reference fidelity; installed hardware runs for device claims. Mocks prove application handling, not real device compatibility.

Release evidence must identify source revision, package hash, dependency/model versions, machine, OS, interface/driver/firmware, sample rate, buffer size, test corpus, route configuration, steps, result, logs, and limits of inference.

## 13. Hardware acceptance matrix

| Family | Minimum evidence to claim support |
|---|---|
| USB storage | Enumerate/import actual files, removal/reconnect behavior, missing-volume recovery |
| USB audio interface | Detect actual channels, select route, measure playback/monitor/recording, handle disconnect |
| MIDI controller | Parse messages, map controls, test focus/deck context, pickup/takeover, LED feedback where applicable |
| HID/CDJ/media player | Verify protocol/mode, handshake, platter/transport/jog behavior, display feedback and reconnect |
| Mixer | Verify whether audio, controls, external mixing, and monitoring operate independently or together |
| Analog turntable with DVS | Correct interface/input level, calibration, signal quality, direction/speed tracking, cue/slip behavior and dropout recovery |
| Multiple devices | Clocking, aggregate-device assumptions, route ownership, conflicts, hot plugging and CPU load |

For each concrete device record manufacturer/model, firmware, transport, USB identifiers where relevant, audio/control capabilities, OS/driver, claimed/documented/observed support, borrowed/owned access, reproduction steps, limitations, and evidence links. Avoid promising “all CDJs” or “all turntables.” Generic protocol support and named-device acceptance are separate claims.

Tests requiring unavailable equipment remain blocked with an exact re-entry action. No hardware purchases or firmware updates are assumed authorized by this plan.

## 14. Services, privacy, and distribution

| Service | Proposed necessity | Offline/failure behavior |
|---|---|---|
| Local library/audio/analysis | Required application capabilities | Operate without account or backend |
| Source hosting and CI | Development infrastructure | Not needed to perform a set |
| Package distribution | Release infrastructure | Installed app remains usable when unavailable |
| Update metadata/downloads | Optional convenience | No update requirement to retain features; verify package authenticity |
| Model downloads | Initial/optional provisioning | Support documented local installation; absent models affect only related features |
| Crash reporting | Optional, explicit user control | Local diagnostics/export remain available; redact private paths |
| Streaming providers | Optional third-party integrations | Local tracks remain available; show provider-specific failure honestly |
| License/activation server | Not required | No core entitlement service |

Treat media, tags, mappings, model artifacts, update packages, and library imports as untrusted inputs. Validate bounds and formats. Store any optional provider credentials in the platform's appropriate secure storage. Keep account tokens, private music, raw Serato binaries, and personal library exports out of Git/Trello.

Before public release, produce a software/model bill of materials, exact license texts/attributions, source obligations, asset provenance, build instructions, signed-package/update strategy as applicable, and a clean-machine reproducibility report. Do not claim bit-identical reproducibility unless it was actually demonstrated; otherwise describe the verified repeatable-build level.

## 15. GitHub and Trello operating plan

Created and verified private: [GitHub](https://github.com/jpoindexter/open-play) and [Trello](https://trello.com/b/OqMGEjpe/open-play-serato-parity). Exact IDs are recorded in docs/delivery/project-resources.json. 110 distinct feature cards have been created and read back, with model recommendations present on every card. The first research checkpoint has been pushed to GitHub; subsequent findings are being synchronized.

Suggested repository layout, to create incrementally:

```text
FULL_BUILD_PLAN.md
PROJECT_PROMPT.md
README.md
docs/
  approvals.md
  research/{reference-inventory,evidence,feature-parity,gate-history}.md
  design/{screens,tokens,interaction-contract,prototype-coverage}.md
  architecture/{overview,audio,state-data,hardware,services}.md
  decisions/ADR-*.md
  models/{developer-routing,product-models,benchmarks}.md
  testing/{acceptance,hardware-matrix,results,known-gaps}.md
  delivery/{backlog,trello-sync,release-checklist}.md
  licenses/{dependencies,models,assets}.md
prototype/
native/                    # only after G1
fixtures/                  # generated or redistribution-safe fixtures only
handoffs/
```

Keep the repository backlog canonical; Trello is its execution view. Stable task IDs prevent duplicates. Store card links and last synchronization state. Reconcile before writes, preserve human edits, and never delete/move completed cards based on a guessed status. Start with a small verified batch before generating the full board. Updating this plan is not evidence of a Trello update.

Suggested lists: Research; Ready for Prototype; Prototype In Progress; Prototype Review; Native Awaiting Approval; Ready for Native; In Progress; Hardware Validation; Blocked; Verified Done. Use labels for domain and stage rather than separate duplicate cards for every view.

### Required Trello card template

```markdown
# [TASK-ID] Specific observable outcome

Feature IDs:
Phase / approval gate:
Status:
Owner:

## Outcome and scope
What changes for the user; what is deliberately outside this task.

## Reference and evidence
Version, evidence IDs, URLs/artifacts, observed versus inferred behavior.

## Dependencies
Task IDs, hardware, fixtures, decisions, and current blockers.

## Implementation approach
Relevant components/files/interfaces and non-negotiable invariants.

## AI execution recommendation
- Codex exact model:
- Codex supported reasoning effort:
- Claude Code exact model:
- Claude Code supported effort/thinking configuration:
- Verified-at date and source for both:
- Primary tool/model and task-specific rationale:
- Investigation / implementation / verification differences:
- Escalation condition and exact verified fallback:
- Independent reviewer model/configuration, or reason not required:
- Expected cost/time class; unknowns explicitly marked:

## Acceptance and verification
- User-visible criterion:
- Exact workflow/command and fixture:
- Expected result / threshold:
- Failure and recovery case:
- Evidence to attach:
- What this test does not establish:

## Estimate
Best / realistic / worst range; assumptions; hidden setup/hardware costs.

## Actual execution record
Actual tool/model/effort; candidate revision/package hash; environment;
steps run; results; artifacts; unexecuted checks; remaining gaps.
```

Populate exact model fields before a card becomes Ready. Unverified Claude configuration is a planning gap, not a reason to invent values. High-risk tasks require independent evidence review, but reviewer execution must follow user authorization and available tooling.

## 16. Scheduling, estimates, and risk control

There is no evidence-based calendar estimate yet: reference scope, stack reuse, supported hardware, available engineering time, and model/tool budgets are unknown. Do not disguise that uncertainty as an exact completion date.

Use three-point task estimates after the first representative tasks: best = reuse succeeds; realistic = normal integration and review; worst = one major assumption fails plus recovery. Separate hands-on engineering time from calendar waits for hardware, approvals, downloads, builds, and external access. Reserve explicit capacity for debugging, testing, documentation, and unforeseen integration work.

Re-estimate after reference inventory, stack decision, first browser audio slice, first native installed slice, and each new hardware family. Stop expanding a work item when its acceptance criterion is met; unresolved adjacent concerns become linked work, not endless retesting.

| Risk / unknown | Early evidence action | Stop or change condition |
|---|---|---|
| Reference version differs from current manual | Version-map documentation and screenshots | Do not combine contradictory versions as one behavior |
| Apparent paywall is actually driver/configuration failure | Trace capability and setup conditions separately | Keep attribution unknown without corroboration |
| Full visual fidelity conflicts with chosen foundation | Inspect UI architecture before native choice | Revisit ADR rather than layering fragile hacks |
| DVS/CDJ protocol feasibility unknown | Narrow protocol/hardware spike and access plan | Do not promise compatibility without physical proof |
| Stems harm live playback | Concurrent-load and cache/queue tests | Defer live generation or reduce resources while preserving playback |
| Dependency/model licensing incompatible | Exact-version provenance review | Exclude from distributable stack until resolved |
| Browser prototype overstates native readiness | Explicit real/simulated/gap map | Refuse native claims based on prototype-only evidence |
| AI work drifts or overspends | Bounded task packet, reviewed profile, acceptance gate | Stop/reframe after repeated failure; missing evidence first |
| Library migration causes loss | Fixtures, backups, dry-run and rollback checks | No destructive migration before recovery is demonstrated |
| Broad feature scope overwhelms delivery | Preserve full registry; ship vertical slices | New scope requires feature ID, dependency and acceptance definition |

Decision owner is Jason for product scope, prototype approval, and public release. The executing agent owns evidence integrity, recommendation quality, and keeping blocked items visible. Device/model/license uncertainty must be resolved by the relevant evidence source, not by confidence alone.

## 17. Handoff and change control

Each handoff lives in `handoffs/` and includes absolute workspace path, current candidate revision, approved scope, read-first files, outcome, last verified fact, decisions, changed files, blockers, next exact task, constraints, verification already run, and required return format. Another agent must refresh live state and approvals before acting.

Do not send messages to other chats or invoke another model merely because a handoff exists. Assign ownership explicitly if authorized collaboration is later used. Avoid concurrent edits to the same files.

Maintain ADRs and a change log. Any new feature receives an ID, reference/evidence status, stage, acceptance criterion, hardware/dependency implications, and both developer-model recommendations. Any visual deviation from the reference gets a reason and user-review status. Any scope removal remains in the ledger as deferred/excluded, with the reason.

## 18. Completion and review checklist

### Planning document — current deliverable

- [x] Full supplied brief preserved in PROJECT_PROMPT.md with a required build-plan artifact section.
- [x] Scope, approvals, evidence boundaries, feature backlog, architecture, hardware, prototype, models, Trello, testing, and release plan present.
- [x] Feature IDs unique and every row has acceptance evidence, a stage, and developer-routing profile.
- [x] Links and Markdown structure checked; no claimed investigation or implementation results invented.

### First execution phase — active deliverable

- [ ] Reference app/version inspected; evidence and feature coverage reconciled.
- [ ] Stack decision supported by current sources and experiments within authorized scope.
- [ ] Product models assessed with exact licenses and benchmark plans/results.
- [ ] Every feature and task has verified Codex/Claude Code model IDs and supported settings, or a plainly unresolved blocker.
- [x] Private GitHub repository and Trello board created and visibility verified; 110 feature cards plus three gate/evidence cards read back.
- [ ] Full HTML prototype launched; J01–J08 executed; real/simulated/gap map published.
- [ ] Full build plan updated with discoveries, selected versions, measured results and revised estimates.
- [ ] Review packet presented; stop before native build until G1 approval.

### Native and release — future deliverable

- [ ] Installed candidate executes the native vertical slice on declared hardware.
- [ ] Remaining features classified accepted, deferred, blocked, or unsupported with evidence.
- [ ] Audio/latency, recovery, offline, hardware and accessibility tests executed.
- [ ] Model/resource limits and all known defects disclosed.
- [ ] Clean-machine build/install and license/provenance report recorded.
- [ ] Public release occurs only after explicit approval; published state independently verified.

**Next exact step:** run the HTML candidate and independent Claude completeness audit. Expand the current 354 requirements where source/control gaps remain, complete expansion catalogs and resolve the device input-capture discrepancy. Native coding remains prohibited.

## 19. Methods applied

Skill sweep (`use`); product-prd and product-roadmap via `pm`; Jobs To Be Done and story mapping via dec-discovery-validation; MoSCoW-style sequencing via dec-prioritization-frameworks; familiar/self-evident flows via dec-krug-laws; behavioral integration and visual tests via dec-quality-testing; task-complexity routing via cost-aware-llm-pipeline; explicit file-based continuation via claude-codex-handoff. Skill sample model names and prices were not accepted as verified facts.



## 20. Investigation checkpoint — 16 October 2026

| Deliverable | Verified state | Remaining obligation |
|---|---|---|
| Private resources | GitHub repository and private Trello board exist; 110 feature cards plus prototype/native gates and evidence card read back | Keep remote research updates synchronized; never mark feature acceptance from source indexing |
| Binary investigation | Ghidra auto-analysis completed; CoreMIDI input callback registration and selected source connection cross-checked with LLVM | Manufacturer dispatch, audio scheduling and hidden algorithms remain unresolved |
| Reference UI | Eight Setup tabs, all five display layouts, empty sampler, Scratch Banks and Flip strip inspected | Loaded/playing/failed states, full FX parameters, video and hardware-dependent controls |
| Effects | 59 named effects across eight categories; LPF/Delay/Reverb/Wah Filter advanced parameters inspected | Remaining parameter menus/ranges and independent audible tests |
| Source traceability | All 168 main-manual articles explicitly mapped to feature IDs; 87 feature groups have exact article links | Semantic review, expansion/hardware sources and historical-version conflicts |
| Interaction contract | 344 explicit trigger/result requirements with evidence boundaries and inherited model routing | Expand to all discovered controls and state transitions before prototype gate pass |
| Hercules input | USB/audio/MIDI enumeration; Jason reports browser selection moves in Serato | Physical source capture still zero; both virtual receiver tests pass |
| Hardware output | Four CoreAudio output channels and connected speakers/headphones reported | Separate physical master/headphone, LED, latency and reconnect acceptance not executed |
| Prototype/native | Neither implementation has started | Inventory gate, then full HTML prototype, then Jason's explicit native approval |

Read the [manual crosswalk](docs/research/MANUAL_FEATURE_CROSSWALK.md), [interaction requirements](docs/research/INTERACTION_REQUIREMENTS.md), [installed UI observations](docs/research/UI_OBSERVATIONS.md), [FX catalog](docs/research/fx-catalog.json), [Hercules evidence](docs/research/HARDWARE_HERCULES.md) and [binary findings](docs/research/BINARY_FINDINGS.md) together. These are original specifications and findings, not recovered proprietary implementation.

New scope discoveries are retained under existing feature IDs pending decomposition: Twitch song/artist metadata reporting under AUD-007/SYS-009, External Control activation/device lists under HW-001/UI-010, and Remote/Remote Mini retirement under SYS-010. Their existence is recorded, but exact protocol and historical behavior remain open. No discovered feature should disappear merely because it is absent from the main manual.

Trello source-link synchronization has 59 exact descriptions verified by readback and 28 pending updates after repeated HTTP 429 responses and a transport failure. Completed updates and pending jobs are retained in docs/delivery/trello-source-sync.json; do not assume all remote descriptions already contain the newer crosswalk. The canonical local feature registry remains current.


### Specification checkpoint: expansion and source reconciliation

The interaction specification now contains 344 unique requirements, each with a source, feature ID, trigger/result contract, evidence class and both developer model/effort recommendations. It includes library and analysis, decks and loops, sync and grids, stems and sampler, recording and MIDI, preferences, Video Output/Control, Flip, Pitch Play, Scratch Banks and T10-specific Stem Slip. Native acceptance remains blocked on prototype approval.

[Source conflicts](docs/research/SOURCE_CONFLICTS.md) records 13 unresolved discrepancies or underspecified behaviors. [Historical gating](docs/research/HISTORICAL_GATING.md) separates the confirmed FX-engine version transition from the unproven claim of lost device entitlement, and states the account-free, no-local-feature-paywall requirement.

Jason approved fully inventoried, labeled documented/simulated states for unavailable hardware, provider accounts and audio algorithms, and reinforced that everything Serato DJ Pro does remains in scope. This changes the evidence boundary, not feature coverage. The inventory gate remains open; this checkpoint does not declare 1:1 behavior or authorize native work.


### Full-scope requirement reinforced

Jason explicitly requires everything Serato DJ Pro does. The [full-scope contract](docs/research/FULL_SCOPE_CONTRACT.md) prevents silent omissions and defines per-feature completeness. [Feature coverage accountability](docs/research/FEATURE_COVERAGE.md) retains every current group, its requirement count, acceptance criterion and model routing. There are now 344 requirements, including separate entries for all 59 named DJ effects and provider-specific workflows. This remains incomplete research, not an implemented parity claim.

Spotify crate support is documented from 4.0.4, superseding older blanket restrictions. Current Beatsource/Beatport sources document migration and metadata handling. Keep provider capabilities versioned; their quotas and access requirements do not become local Open Play feature gates. Four FX parameter strips have been observed; the other 55 remain explicitly unobserved.


## 21. Final independent Claude handoff — user requested

Jason requested a Claude handoff when the investigation and full HTML prototype are ready, so Claude can run the same prompt and check for omissions. This is an additional final deliverable; it does not replace the active investigation/prototype objective or authorize native work.

A draft packet is saved at [handoffs/codex-to-claude-completeness-audit.md](handoffs/codex-to-claude-completeness-audit.md). It embeds the complete original prompt, records subsequent approvals and requires an independently derived checklist before comparison against Codex's conclusions. Do not launch Claude automatically now.

Before final delivery, refresh the packet against the exact candidate revision, actual preview/launcher, executed workflow evidence, known gaps and remote synchronization status. Deliver a copy-paste launch prompt with that file path. Claude's report must identify omissions and unsupported claims with sources, reproduction steps and actionable corrections. Record the disposition of each finding and re-test any authorized correction. No review outcome substitutes for Jason's explicit native approval.

## 20. Executed HTML review candidate — 16 October 2026

The latest user instruction was to keep investigating and deliver the full HTML prototype plus Claude handoff, without starting native work. The candidate now includes every current feature group as a review destination; unavailable behavior is labeled simulation or explicit gap. This does not close the strict parity gate or establish exhaustive discovery. Historical checkpoints above retain their then-current counts.

- **Launch:** `python3 scripts/serve_prototype.py`, then http://127.0.0.1:8768/prototype/; macOS launcher `Start Open Play.command`.
- **Implementation:** original HTML/CSS/JavaScript with Web Audio, generated demo audio, local decode and browser master recording. No hosted backend or account is needed. This browser stack is separate from the proposed native C++/Qt foundation.
- **Scope:** 110 feature routes; 354 requirements; 59 FX names; eight Setup tabs; five layouts; two/four deck states; six provider fixtures. The 24 feature groups without detailed interaction rows remain explicitly pending.
- **Observed verification:** local WAV import/load/play, loop/cue/tempo interactions, two-deck recording, download/re-import/replay, crate/smart crate, metadata, backup/restore, settings, all primary panels and provider/hardware failure fixtures. See the exact evidence and limits in [REVIEW_REPORT.md](docs/prototype/REVIEW_REPORT.md).
- **Open gaps:** 55 advanced FX parameter schemas, exact Video catalogs, real stems/DSP, hardware routing/capture, all provider services, library interoperability, complete keyboard/accessibility/visual equivalence, soak testing and full conditional-state discovery. No arbitrary feature paywalls are present in the independent browser implementation. Third-party rights/technical constraints are still real dependencies.
- **Delivery:** private GitHub; existing private Trello with all 110 feature/model cards. Source-link update synchronization remains 59/87 verified; 28 are pending after 429/transport failures. Local update payloads preserve the unsent changes.
- **Claude:** [independent completeness audit handoff](handoffs/codex-to-claude-completeness-audit.md) contains the same original prompt, later authority, exact paths, evidence and a required return format. It has not been launched automatically.
- **Native gate:** pending Jason's explicit approval of an identified prototype revision. An HTML screenshot, audit completion or Git push does not grant that approval.


## 22. Functional closure pass — 16 October 2026

Jason explicitly rejected labels/placeholders as sufficient parity. The active target
remains every Serato capability, with no native build until his approval. This pass
implements actual reverse/Slip/cue audition, sampler gating and controls, timed Flip,
slicer, multi-rule/nested crates, four independent FX processors and local video
composition/capture. Web MIDI code is connected to real browser actions, but actual
device access timed out in this environment. No hardware input is claimed.

The browser audio/module harness passed 20/20 checks; selected main UI paths and a
1,921,409-byte video capture/re-import were executed. Exact actions, numeric results,
proof boundaries, defects and remaining behavior are in
[FUNCTIONAL_REVIEW.md](docs/prototype/FUNCTIONAL_REVIEW.md). The feature registry and
Claude packet now point to this evidence. Historical counts/checkpoints above remain
dated records. Native acceptance, full visual equivalence and full parity are open.

Next dependencies: finish the 55 FX schemas and exact Video catalogs; implement and
measure key-preserving DSP, stems and analysis; finish complex library/metadata and
conditional workflows; resolve actual MIDI input/output and multichannel monitoring;
then obtain the missing CDJ/DVS/provider environments for physical/service acceptance.
Do not reclassify those gaps as completed because their labels are visible. Native
implementation remains prohibited; prototype approval is a separate user decision.

Remote follow-up: GATE-P and LIB-004 functional descriptions were updated and
verified by exact readback. The connector again returned 429 and then a board-read
transport failure. The 28 historical source updates remain pending, plus 17 new
functional feature annotations in `docs/delivery/trello-functional-sync.json`.
Existing per-feature model recommendations are preserved; no card is marked accepted.

## 23. Active goal: effects, stems and keylock closure

Jason explicitly requested a persistent goal to close every gap, starting with the
55 remaining DJ effects and stems/keylock. This work is in progress; section 22 and
its committed candidate are the prior baseline. No native implementation is authorized.

Implemented since that baseline, with current evidence:

- Signalsmith Stretch 1.3.2 (MIT) performs real pitch-preserving tempo changes and
  independent pitch shifts in a cancellable browser Worker. The real browser passed
  12/12 processor checks. The actual AudioEngine passed 18/18 integration checks,
  measuring master-output frequency, reverse, original-time loop mapping, rapid
  tempo replacement, pending-start cancellation and four-stem isolation. See
  `docs/prototype/keylock-browser-results.txt` and `audio-integration-browser-results.txt`.
- A loopback-only preparation service runs a local four-source model and returns
  actual WAV audio to the browser. Main-UI preparation ran successfully with Spleeter and the selected SCNet-large model.
  Original audio is used when every stem is enabled and no stem effect is active;
  isolated sources are mixed independently when controls change. Research compares
  Spleeter, HTDemucs and SCNet; checkpoint license and measured separation quality are
  separate selection gates. See `docs/research/STEMS_RUNTIME_EVALUATION.md`.
- All 55 remaining named DJ processors and four separate Channel processors now have
  independent DSP implementations. Final real AudioWorklet rendering passed 59/59
  (55 DJ + four Channel), plus 5/5 native-processor update/lifecycle checks. The initial
  58/59 fixture failure was investigated and corrected; 80 pure signal/behavior tests
  pass. These establish independent processing, not exact Serato sound equivalence.
- Independent review found and reproduced a static-file traversal and cancellation
  defects. Fixes and retests are tracked in `docs/prototype/ADVERSARIAL_AUDIO_REVIEW.md`.
  Retain failures in the evidence history; do not call nearby tests a closure proof.

Next: finish all-effects signal and routed UI tests, finish reference parameter
extraction, compare licensed models on real held-out audio, refresh the coverage
registry/Trello and pin a new Claude candidate. Then continue the remaining analysis,
library, Video, hardware and provider gaps. The terminal condition remains executed
feature behavior plus explicit external verification; an inventory count is not it.

Current follow-up evidence (16 October, 14:41 UTC): all 59 reference advanced strips
and 236 labels are recorded in `FX_OBSERVED_PARAMETERS.md`; ranges/enums and exact
response remain open. Local SCNet code/checkpoint have explicit MIT authorization;
two held-out music excerpts improved all eight source SI-SDR values over Spleeter,
while one reconstruction-error gate remains failed (3.025% versus 3%). See the model
evaluation rather than interpreting functional preparation as quality parity.

Automatic analysis now has 65/65 pure signal checks and 13/13 executed browser-worker
checks. Its import/reanalysis/manual-protection/reload/reimport UI path has now been exercised. The independent review also found
Stems FX dry-audio leakage and Channel Filter zero/BPM defects: actual live-history
exit capture, persistent mute latch and neutral routing fixes now pass 19/19 routed
engine checks, including loop history and pitch-restart regressions. Sampler keylock now passes 17/17 actual-engine checks; Pitch Play passes
13/13. Observed FX controls pass 9/9 real-worklet contrasts, with 24/55 extended
schemas mapped and 31 still open.

## 24. Current DSP checkpoint and remaining acceptance

This section supersedes the implementation status in historical sections 20–22.
The inventory is now 492 requirements across 110 feature groups; 138 new rows fill
22 previously empty groups. AUD-005 and SYS-006 remain explicitly independent
engineering goals without invented vendor interactions. Spotify crate behavior
uses the 4.0.4+ rule applicable to installed 4.0.10.

Read [DSP_FUNCTIONAL_REVIEW.md](docs/prototype/DSP_FUNCTIONAL_REVIEW.md) for the
actual executed paths, measured limits and evidence files. Sampler uses actual
pitch-preserving Worker processing and a global output bus; Pitch Play performs
real cue-based pitch audition with cancellation and range control. Main UI key
changes, range selection, Shift-cue selection and observed Echo controls were exercised.
Signal tests are independent implementation evidence, not a Serato-equivalence claim.

Remaining dependency order: measure exact FX parameter semantics and sound;
resolve the model quality failure and remaining Stems state contracts; complete library,
Video, conditional settings and keyboard/visual workflow gaps; then verify physical
MIDI/LED/jog/master/headphone and unavailable CDJ/DVS/provider behavior. A device or
service limitation remains an open acceptance item even if browser simulation exists.
The connected Hercules is unnecessary for browser DSP work and may be unplugged;
refresh physical state before hardware checks. No native app work is authorized.

## 25. All observed FX controls and automatic Stems workflow

The remaining 31 extended schemas now have independently implemented controls. All
55 extended effects expose 220 observed labels; 220 actual AudioWorklet contrasts
passed. The original four effects'16 controls passed separate offline Web Audio
contrasts. This closes label-to-executable-control mapping, while exact ranges,
complete modes, DSP equivalence and sustained-load acceptance remain open.

Independent adversarial review exposed four longer-horizon defects that the short
contrast checks missed: Multi Tap feedback stability, history growth after timing
updates, fractional sweep continuity, and Stretch exit source extent. All four
corrections pass 33 targeted kernel checks and nine actual browser Worklet regressions.
The frozen runtime also passed all 220 contrasts, 59 effect graphs and five original
processor lifecycle checks. The current integrated baseline passes 20/20. These
results establish their specific paths, not universal stability or vendor equivalence.

Stems exit lifetime is now independent of source transport replacement. The actual
27-check Channel/Stems suite includes preserved tails across pitch/rate/seek/reverse,
natural end, explicit stop with no ordinary voice, and emergency silence from an
audible active tail. Exact reference policy is a separate comparison.

Stems first action and Analyze Stems-on-load now perform real local preparation;
matching calls coalesce and share progress. Main UI reached four-source SCNet
readiness for both entry paths. Main UI cancellation, retry and two pad actions
joining preparation were exercised. Twelve adapter lifecycle checks are separately
labeled mocked-network proof. A new public sampler route check held Playing while
Deck1/fader-zero measured zero and Master measured 0.01887; this proves browser buses
only. Physical headphone routing remains open.
Prepared-crate dragging now has real drop-event and subsequent four-source readiness evidence. Fast release is accepted on drag entry; a startup guard prevents controls changing before initialization.

Next after this checkpoint: finish Stems request/error/cancellation workflows and
state contracts (including Stem Slip), exact Video catalogs and implementation,
library interoperability and full keyboard/visual state comparison, then physical
device/provider acceptance. No native application until Jason approves a specific
prototype. Keep the existing full-scope goal active.

Current delivery reconciliation: all 87 source-link descriptions have exact remote
readback evidence, with no pending source jobs. Nineteen DSP/sampler descriptions
also have exact readback. Historical functional annotations are being reconciled
separately; none of these synchronization counts marks a feature accepted.

## 26. Stem Slip source correction and next actual implementation

The current working inventory is **495 requirements across110 groups**. Three
new rows (REQ-493–495) capture a latched mode, selected-stem performance clock and
vocal-only crossfader behavior documented in the Hercules T10 manual. Its release
wording conflicts with the Serato quickstart; REQ-266 now retains that conflict
instead of treating temporary muting as the complete feature. See
[STEM_SLIP_EVALUATION.md](docs/research/STEM_SLIP_EVALUATION.md) for exact pages,
state transitions, independent design policies, acceptance cases and model routing.
The current prototype does not yet implement that independent stem transport.

Next: actual selected-group audio manipulation while complementary stems continue,
realignment/release rolls, transport/cancellation and crossfader tests. Keep unknown
reference policies explicit; a mute-only substitute cannot close this feature.

Delivery reconciliation now has zero pending source/functional jobs:87 source-link
descriptions verified,13 historical functional additions exactly read back and four
superseded by newer scoped DSP records. Nineteen DSP/sampler descriptions and the
prototype gate have separate exact-readback evidence. None constitutes acceptance.

## 27. Video catalog evidence recovered

The nested installed Video resources directly declare47 slot effect definitions
and7 transitions. Localization adds8 effect and26 transition names, yielding55/33
name candidates; active menu registration remains unverified. These are factual
resource names/flags, not recovered algorithms or complete runtime catalogs.
The official SP1 guide documents two slots on each channel; expansion guidance
documents two master slots. The HTML target therefore needs six slot positions,
actual effects and transition processing, plus the documented overlay controls.
See [VIDEO_CATALOG_EVALUATION.md](docs/research/VIDEO_CATALOG_EVALUATION.md) for
provenance, names, parameter unknowns and proposed observable acceptance. No vendor
shader/source/assets were copied. Video implementation remains the next scope after
Stem Slip validation; illustrative controls do not close it.

## 28. Actual browser Stem Slip checkpoint

Section26 records the source discovery; the independent browser implementation
now exists. Four real PCM sources have selected/backing clocks, signed scratching,
cue holds, musical release and selected-only crossfader routing. Actual browser
AudioWorklet/engine checks pass30/30; pure kernel/engine-boundary checks pass30/30,
and controller lifecycle checks pass19/19. Main UI real SCNet preparation retained
focus; held and quick keyboard gestures entered release and rejoined, then explicit
pause stopped playback. Existing18 engine and27 Channel/Stems paths and20 ordinary
behavior checks also passed after integration. Read
[STEM_SLIP_FUNCTIONAL_REVIEW.md](docs/prototype/STEM_SLIP_FUNCTIONAL_REVIEW.md)
for exact coverage, retained failures, independent policies and remaining combinations.

T10 source conflict, vendor envelopes/topology, hardware and full musical workflows
remain open. Prototype preparation is still limited to10-minute/128MiB inputs and
a15-minute worker timeout; no-limits product acceptance is not achieved. Sol/high
is the routine STM-005 execution recommendation, with bounded Astra/high escalation
for an unresolved measured DSP/state dispute. Claude recommendations remain review
choices, not automatic launches.

Next: replace illustrative Video controls with independently implemented effects
and transitions from the proven manifest catalog; verify actual pixel output and
six-slot routing. Retain additional localized names as availability candidates.
Continue the full scope afterward; no native app until Jason approves a revision.

## 29. Video implementation in progress — pixel checks and integration gate

The original Video processors now execute real GPU/Canvas transformations. The
frozen standalone browser suites passed **72/72 effects**, **51/51 transitions**
and **32/32 overlay checks**. Catalog boundaries remain47 manifest effects plus8
localized availability candidates,7 manifest transitions plus26 localized
candidates, and a separate Open Play Crossfade baseline. These tests establish the
specified independent pixel contracts, not reference registration, vendor shader
matching, exact controls, or Serato visual equivalence.

A strict transparent-red resize probe failed before correction (FX71/72;
transitions48/49). The corrected implementations store/filter premultiplied
textures and safely return straight-alpha output. The initial failures are retained
next to final results in `docs/prototype/`. Transition history and snapshot tests
also cover repeated frame IDs, threshold changes and backward clocks.

The assembled HTML pipeline is being verified now: two ordered slots per input
channel and two on master, per-target text/image layers, all transition choices,
real per-channel FFT analysis, linked transport, selectable browser output size,
metadata persistence and processed-canvas/master recording. Its processing order,
control ranges and FFT mapping are independently designed and explicitly labeled.
Standalone GPU success does not close this assembled-pipeline gate. Recording
restart/disposal races and reverse-video state are receiving separate lifecycle
checks. A new100-preset application cap introduced during UI work was removed;
browser storage quota is still an environmental limit.

Routine model routing: Codex GPT-6.1 Sol/high for controls, state, tests and records;
Astra/high only for a bounded unresolved measured GPU/DSP dispute. Claude Code:
use its available Sonnet-class model/high effort for implementation/review,
escalating to its available Opus-class model/high only for a defined unresolved
rendering/lifecycle dispute. Verify actual supported model IDs/effort before use;
these recommendations do not assert a current provider catalog. Jason's separate
Cloud Code/Fable permission applies if debugging becomes stuck.

Next gate: execute the assembled pipeline with real decoded local media, measured
channel audio, six-slot routing and recording/replay; exercise the main controls
and save/reload. Then update VID-002, GATE-P and the Claude packet with precise
scope. Video Media Crate behavior, MP3+G karaoke, Syphon, codec/device coverage and
all vendor parity remain open. Continue the full495-requirement scope afterward.
No native app until Jason approves an identified prototype revision.

## 30. Karaoke and Media Crate continuation

The assembled Video pipeline now passes31/31 including actual continuous reverse
and preservation of decoded frames during asynchronous seeks. Initial seeking
failures and the separate harness-dimension diagnostic are retained, not erased.
Karaoke has an original CD+G packet interpreter (22 pure/21 actual Canvas cases),
a track-owned bridge (19 controlled-Canvas cases), and19/19 real audio/GPU/capture
checks. Main UI imported an actual original MP3+CDG pair, played its selected deck
and advanced graphics, then paused. Bytes remain session assets requiring reimport.
Channel selection, parity repair, commercial-disc compatibility, reference visual
matching and physical synchronization are still open. Read
`docs/research/VIDEO_REMAINING_WORKFLOWS.md` for source conflicts and declared
policies; `docs/prototype/VIDEO_FUNCTIONAL_REVIEW.md` for exact executed scope.

Media Crate and automatic transition selection have real runtime code now, but
the first real-media run failed9 of26 cases. Preserve that red evidence, isolate
root causes, correct them and rerun the actual decoder/pixel/clock workflows before
claiming that feature works.25 pure policy and8 controlled mixer cases do not
substitute for those real-media failures. No native application has been started.
The full495-requirement goal, private-record updates and Claude audit remain active.

## 31. Frozen Video, karaoke and Media Crate browser checkpoint

This section supersedes the in-progress gates and red-cutoff statements in§29–30.
All55 independently written Video effects,34 transitions including the separate
Crossfade baseline, six ordered channel/master slots, actual FFT input, text/image
layers, local-file first-frame decoding, linked reverse/seek retention, metadata
persistence, processed recording/replay, CDG playback and Media Crate selection
now have bounded executed evidence. No vendor shaders/assets were copied.

| Actual browser path | Result | Acceptance boundary |
|---|---:|---|
| Video effects |72/72|Independent pixel contracts, not vendor algorithms or controls|
| Transitions |51/51|Original algorithms, history/latch/scratch and alpha handling|
| Overlays |32/32|Canvas/PNG pixels and metadata; session images need reimport|
| Assembled pipeline |32/32|Real local Files/engine/FFT, six slots, queued seek events/pixels and actual recorded-container video/audio decode|
| Karaoke integration |19/19|Real audio clock/CDG/GPU/capture; commercial compatibility and physical AV sync open|
| Media Crate |32/32|Actual files/pixels, association/fallback/random/ownership, six fresh paused imports|

All13 Node scripts in `docs/prototype/video-node-checks.json` exited0; their pure
and controlled-collaborator limits remain explicit. Main UI paths executed actual
FX/preset save/reload, image decode, recording across panel switches and replay,
MP3+CDG import/play/pause, Media association/Next/fallback, and automatic-mode flag
persistence. Read [VIDEO_FUNCTIONAL_REVIEW.md](docs/prototype/VIDEO_FUNCTIONAL_REVIEW.md),
[KARAOKE_FUNCTIONAL_REVIEW.md](docs/prototype/KARAOKE_FUNCTIONAL_REVIEW.md) and
[MEDIA_CRATE_FUNCTIONAL_REVIEW.md](docs/prototype/MEDIA_CRATE_FUNCTIONAL_REVIEW.md).

Initial alpha, seek and Media failures remain saved. The first-frame bug required
an actual presented muted-video frame before replacement; readyState alone was
insufficient. Async ownership and recording session boundaries are guarded. The
latest short capture decoded actual processed pixels plus master440Hz audio;
its≈25.64 processed fps is not sustained30fps or HD/native acceptance.

Reference provenance remains47 manifest Video effects plus8 localized candidates
and7 transitions plus26 localized candidates; current active menus, exact ranges,
defaults, algorithms and visual matching are unknown. Semantic DJ-audio Echo/
Distortion→Video coupling is the next bounded implementation gap; FFT reaction
does not close it. Generic aspect/media-treatment/control/quality workflows,
second-display/Syphon, codec matrix, long sessions, CDG selective channels/parity,
physical hardware and native acceptance remain open. Continue the full495-row
working scope, including library/interoperability/recovery, conditional states,
Flip/sampler combinations, model quality and provider/hardware acceptance. Counts
are not a completeness claim.

VID-002 retains Codex gpt-6.1-sol/high and Claude Code claude-sonnet-5/medium;
VID-001 retains Sol/xhigh and claude-opus-5/high for transport/ownership. Routine
implementation uses Sol/high; Astra/high is reserved for an unresolved measured
GPU/DSP dispute. Verify supported model IDs/effort before invoking; recommendations
are not execution. Jason permits a new Cloud Code/Fable debugging conversation if
stuck; none has been needed for this checkpoint.

The candidate hash manifest and Claude packet pin the frozen code revision.
**Full parity NOT PASSED. Native approval NOT GRANTED.** Keep the goal active,
reconcile private records and obtain Jason's explicit approval of a named HTML
revision before any native development.

Final review also corrected ordinary-load/eject ownership around asynchronous
Stem Slip disarm.10 extracted real callback checks pass; a separate actual UI
pair import/play/pause passed afterward. See `video-import-ownership-results.json`
and `karaoke-import-ownership-main-ui-results.json`.

## 32. Semantic Video links, treatment and inventory correction

The exact-name Echo/Distortion semantic bridge now passes24/24 actual GPU/audio
checks; Media Treatment passes21/21 with decoded4:3/wide Files, geometry/history
checks and captured video/audio. Current pipeline32/32, Media32/32 and karaoke19/19
regressions pass;16 Node scripts exit0 with narrower pure/controlled scopes.
Read [VIDEO_LINK_TREATMENT_REVIEW.md](docs/prototype/VIDEO_LINK_TREATMENT_REVIEW.md)
for declared mappings, retained red runs, corrected zero-feedback shader/seek-resize
failures, actual main UI selection/persistence and the keyboard acceptance gap.
Exact reference mappings/quality/timing/visuals remain unverified.

The detailed inventory grows from495 to507: REQ-496–507 explicitly cover the12
observed Video Setup Output/Control settings omitted from prior detailed rows.
They inherit VID-001 or VID-002 Codex/Claude model/effort recommendations;110
feature groups stay in scope and complete_inventory remainsfalse. Apart from
independent Media Treatment, these new settings remain gaps rather than decorative
selectors. Next work is source reconciliation and the smallest actual independent
recording-quality/control slice, then the remaining library/conditional/provider/
hardware/model-quality scope. Native development is still prohibited pending
Jason's explicit approval of a named HTML revision.

At Jason's request, a new local Claude Code session “Serato Video control semantics
research” was started with actual Fable5.1/High selected, scoped to missing primary
reference evidence and a separate findings file. Prompt:
`docs/research/claude-fable/video-reference-debug-prompt.md`. It is not a full
completeness-audit takeover and has no native/code/remote-write authority. Verify
its conclusions against sources before changing reference claims.

## 33. Primary Video manual recovered — source reconciliation resumes

Fable supplied a successful normal-browser request, and Codex independently
retrieved/validated the official141226 PDF:425,843bytes,SHA-256
`85c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c`.
Its27pages have2015-04-09 PDFmetadata. Read
[VIDEO_MANUAL_RECOVERY.md](docs/research/VIDEO_MANUAL_RECOVERY.md). Earlier403
request logs remain preserved; they are superseded as a general access blocker.
Current official hosting does not prove all historicaldetailsapplyto4.0.10.

The settings prose supports the independent four treatment equations and
separates recording resolution, outputquality and windowaspect. Parent now
reconciles allmanualworkflows/secondarycontrols and FX/transition meanings before
claiming reference parity. A separate actual recording-quality/capture slice is
next. ModelsinheritVID-001 transport/ownership orVID-002 controls/pixelrouting;
exactrecommendedIDs/efforts remaininregistry andmustbecheckedatinvocation.
No native app, licensing changes, public release or completeness claim.


## 34. Recovered-manual behavior corrections and recording resolution

Read [VIDEO_MANUAL_RECORDING_REVIEW.md](docs/prototype/VIDEO_MANUAL_RECORDING_REVIEW.md).
Actual browser checks pass74/74 Video FX,55/55 transitions,32/32 Media Crate,
23/23 recording-quality and32/32 assembled-pipeline regression. Main UI480p
persisted across reload and produced an actual854×480VP9/Opus download with live
640×360 output. Frame Pulse/Split and Center/Latch50/Scratch now implement the
recovered historical broad meanings using explicitly independent curves. Media
Next is ordered even while Random is on. Prior independent result files stay
historical, rather than being relabeled as reference acceptance.

Fable's bounded research completed; parent validated the official manual and
persisted cache and rejected unsupported fresh-registration claims. Installed
Serato Effects/Info screens were inspected and Video restoredOFF. The manual
crosswalk and provisional secondary-workflow gaps remain open evidence work.
REQ-498 now records executed independent recording resolution, not a placeholder.
The recovered manual adds14 distinct workflow requirements (REQ-508–521),
bringing the working detailed inventory to521 across110 groups; complete_inventory=false.
See docs/research/VIDEO_MANUAL_REGISTRY_RECONCILIATION.md and the merge record.
No native development until Jason approves a named HTML revision.


## 35. Current menus, color/traversal corrections and finite Video fades

2026-10-17. Read [the executed review](docs/prototype/VIDEO_COLOR_CROSSFADE_REVIEW.md).
After Jason unlocked the Mac, installed Serato4.0.10 menus were directly inspected:
55 slot effects across five categories and29 transitions. Four additional localized
transition resources were not in the observed menu; Open Play keeps them labeled
resource-only, alongside its separate Crossfade baseline. Visibility proves no
shader, performance or hidden-device behavior. Video was restoredOFF; window-mode
restoration remains unverified. Raw screenshots stay ignored.

Actual corrected FX checks81/81 and transition checks65/65 cover Gamma shadow
darkening, Saturation fresh defaults, radial Smudge, color-gated UV Paint, nine-cell
grids, alternating Box Both, directional Tile Wave and live Scratch Fade. Earlier
saved effect behavior is retained explicitly. Exact reference algorithms stay open.

Finite directional left/right fades now run with independent .25..10s speed,
reversal, stop, endpoint persistence, Reduced Motion and separate crossfader link.
Actual browser11/11 plus main UI measured fast416ms/slow10065ms (including UI
automation), stopped-position reload and completion while another panel replaced
Video. Independent review exposed and verified a fix for suspended hidden-panel
fades: finite control state completes once without hidden GPU frames. The old
sinusoidal mode is explicitly Continuous mix, an Open Play extension.

REQ505/513 have independent executed behavior; REQ512 remains partial because
per-channel opacity links are still open. Isolator Bass, finite Frame Freeze,
eight-band Analyzer, other manual crosswalk meanings, output/window/quality and
the full library/device/provider scope remain active. Inventory110/521,
complete_inventory=false. Native development remains prohibited until named HTML
revision approval. Per-feature Codex/Claude model and effort routing is preserved.


## 36. Real eight-band Analyzer, finite Freeze and channel-opacity authority

2026-10-17. Read [the executed spectrum/opacity review](docs/prototype/VIDEO_SPECTRUM_OPACITY_REVIEW.md).
Isolator Bass now grays the complement of a selected hue and reacts to real bass;
Frame Freeze is a finite one-shot with explicit recapture and legacy indefinite
mode. Eight-band Analyzer receives eight independent FFT power values through
the actual AudioEngine, with hue/gain controls, valid-zero silence and an explicit
source bypass when data is unavailable. These are independent frequency bands,
curves and timing, not recovered Serato transfer functions.

Current actual FX102/102, real-spectrum17/17, opacity13/13 and assembled
pipeline33/33 pass. Main UI6 opacity observations,3 Analyzer observations and
5 compatibility/recapture observations execute and persist. Independent review
found a pipeline spread invoking a spectrum getter before validation; own-data
copy now preserves the guard through the assembled pipeline, with actual pixels
and controlled8/8 regression. Opacity review9/9 found no defended production bug.
21 current Video Node scripts exit0 with their narrower declared scopes.

Separate channel levels/links no longer depend on playback or crossfade links.
Unlink snapshots the displayed audio-controlled level; manual edits leave audio
unchanged. Old combined flags initialize missing channel flags once; saved own
zero/false and earlier FX appearances survive metadata restore. Capture bytes,
images, FFT/runtime clocks and GPU state are not persisted.

REQ512 now records independent executed channel/crossfader ownership, with
physical/reference curves still unverified. Remaining work includes other Video
manual meanings, output/window/quality/Syphon, saved per-file FX/associations,
shortcuts/MIDI authority and the full library/hardware/provider/model-quality
scope. Counts remain110/521 and complete_inventory=false. Native development
remains blocked until Jason approves a named HTML candidate. Model/effort
recommendations remain attached to each feature/requirement and Trello card.


## 37. Per-file Video FX save/recall and streaming content identity

2026-10-17. Read [the executed per-file review](docs/prototype/VIDEO_FILE_FX_REVIEW.md).
REQ515 now has actual independent File→Worker hash→saved channel slots→reload/
reimport→rendered pixels behavior. Actual browser15/15, Worker10/10 and full UI
Save/edit/Recall/export/import/page reload/renamed File paths execute. Different
content sharing a filename stays separate; matching bytes recall onto only their
destination channel. Metadata persists without media bytes or source-file writes.

Independent review reproduced/fixed two stale metadata writes across channels
and newer imports; desired-state8/8 passes. Invocation snapshots, Recall editing,
Cancel/new load/disposal and graceful identity-failure playback fallback have
explicit ownership.25 Node Video scripts exit0 with their narrower pure/controlled
scopes. Assembled actual pipeline regression33/33 also passes. The MIT incremental hashing dependency is locally vendored with exact
provenance/advisory review; no arbitrary hash file-size cap or online service.

Exact installed Serato owner/format/algorithms, arbitrary codecs, very large file
performance and storage quota remain unverified. Output/window/quality/Syphon,
shortcut/MIDI behavior and full library/device/provider/model-quality scope remain
active. Inventory110/521, complete_inventory=false; per-feature Codex/Claude routing
is retained. No native development before named HTML approval.


## 38. Real manual FX timing and ordinary stem-source waveforms

2026-10-17. Read [the executed review](docs/prototype/FX_TEMPO_WAVEFORM_REVIEW.md).
REQ178 has independent per-bank Tap/manual/Auto/hold timing: actual9/9 captured
Echo checks, actual main UI gestures and reload. Independent review reproduced
stale engine timing after metadata edits; shared BPM synchronization now preserves
manual authority while refreshing Auto. Controlled review6/6, engine8/8 and
pure clock12/12 execute; exact vendor estimator/sonics remain unverified.
All43 FX/waveform cohort Node scripts exit0; the initial missing-import controller fixture
failure and its real-dependency correction are retained in the review.

REQ183 has a bounded ordinary-mute source-waveform implementation. Actual9/9
Engine/audio/pixel checks, real local SCNet1/1 and main UI import/preparation/
all-mute/Vocal/restore paths execute. Independent review found/fixed original
right-channel omission and post-end padding bars;12 Node checks execute. ExitFX
captured tails, Stem Slip dual clocks, color styling, sustained performance and
musical/reference quality remain open; existing SCNet quality failure is retained.

The live keylock browser investigation retains first4/10 and isolated9/11 evidence.
Append processor failure and future-schedule ordering need dependency correction;
production keylock remains the earlier buffered path. Browser streaming is not
blocked by native approval. Continue actual ordinary-deck scratch/bypass/continuous
keylock and remaining Video/library/provider/hardware scope.110/521 inventory is
incomplete; per-feature model/effort routing remains; no native app before approval.


## 39. Separate live-wrapper correction and capture blocker

2026-10-17. Unchanged Signalsmith1.3.2 remains preserved; a separately named MIT
wrapper variant corrects the observed multi-chunk input window and future schedule
ordering, without changing embedded WASM. Agent and parent actual-WASM14/14 execute.
All11 browser functional assertions pass, but full-capture acceptance still FAILS
with missing startup frames128–383. Fence and explicit arm did not repair that gap;
no tolerance/coverage relaxation or production integration is permitted by these
results. Deterministic Worklet shutdown, audible-clock mapping and actual signed
scratch remain further adapter requirements.

Jason's already authorized Fable fallback was invoked after three related failures:
new Claude Code session Keylock capture gap debugging, Fable5.1/High, bounded to
new findings and isolated probe files. Full independent Claude audit has not run.

New passive Hercules diagnostic verifies Apple SDK ABI and actual owned virtual
MIDI delivery/counters/lifecycle. Physical input still needs a fresh agreed knob
movement window; it has not been started automatically. Original zero-record
observations remain inconclusive, not proof of unsupported/broken hardware.
Read docs/research/HERCULES_CAPTURE_NEXT_DIAGNOSTIC.md and ACTIVE_EXECUTION.md.
No native application or licensing/device-gate changes.

## 40. Live DSP prerequisites verified; Video Setup connected; fresh Hercules capture

17 October2026. Full1:1 remains NOT PASSED and native approval remains absent. Read `docs/research/AUDIO_CAPTURE_STARTUP_DIAGNOSIS.md`, `KEYLOCK_DISPOSAL_REVIEW.md`, `DECK_SCRATCH_RUNTIME_EVALUATION.md` and `docs/prototype/VIDEO_SETUP_CONSISTENCY_REVIEW.md`.

The isolated two-fix live keylock API now executes11/11 with completed:true, no fatal errors and full armed PCM coverage1. A no-vendor processor-retained diagnostic reproduced the startup frame jump;64 consecutive observed processing blocks are required before explicit arm. The startup jump remains published, and every subsequent frame/producer sequence through the final fence is mandatory. Earlier incomplete runs are preserved. The actual17.016s stereo WAV was downloaded/inspected. This does not yet replace the app's buffered renderer.

A separate MIT lifecycle variant adds terminal disposal without changing embedded WASM. Independent review reproduced a ready/abort microtask race in its initial version; the corrected version rejects ownership before publication. Actual shared-context5/5 verifies real terminal returns/no later DSP on ten retired owners, zero retained processor source/module/queued-command references, post-ACK candidate PCM silence with a continuing440Hz control and two complete contiguous armed spans. Thirteen Node lifecycle checks and the independent factory race regression retain their controlled/actual-WASM boundaries. Reference clearing is not deterministic heap reclamation.

Ordinary raw scratch is now an actual independently tested five-output Worklet prerequisite: current7/7 browser checks,13 contiguous captures, signed low-rate markers, paused audition/watchdog silence, non-Slip final cursor, Slip reverse/loop phase, independent original/stem gain routes and active→silent retirement while another deck continues. Initial giant-report browser stall is retained; bounded visible summaries preserve full JSON/PCM downloads and enforce90s abort cleanup. Independent review found a vacuous disposal assertion; the stronger rerun requires audible input first.21 kernel/transport and5 reporting controlled checks pass. **The app's platter and AudioEngine are not wired to this prerequisite yet.**

Video Setup now shares the existing recording-quality, treatment and fade-speed state/setters with Video. Actual UI edits work both ways and survive reload; screenshot pixels verify320×240 Preserve pillarboxing versus Stretch; Setup720p records/decode1280×720 with live640×360 unchanged. During actual recording, quality is disabled and Reset refuses atomically, preserving unrelated preferences. Successful Reset uses output/stretch/2.5s defaults. Selected5.125s fade moves and reaches its endpoint in the observed interval. Other Video preferences remain simulations and gaps.

After Jason's fresh Ready now, the passive45s all-source Hercules observer executed08:02:42–08:03:27UTC. One exact-name source stayed online/stable across84 scans with successful connection; zero callbacks, no parser errors/notifications/omissions and clean disposal. No hardware output. Fresh confirmation of knob movement and Serato response is still pending; do not substitute earlier reports or claim a broken/unsupported controller. See `HERCULES_CAPTURE_20261017.json`.

Next executable unit: bounded forward live keylock adapter, then actual AudioEngine/platter integration with original/stem mute/FX routes and measured scratch handoff. Whole-file decode memory, current range/resource bounds, reverse/loop/StemSlip integration, SCNet quality failure, remaining Video output/quality/arrangement/shortcuts/MIDI and library/device/provider scope remain open. Fable's bounded capture investigation is separate from the still-unlaunched full Claude audit; source-level backend hypotheses are not proof of this running browser. Every feature keeps its Codex/Claude model+effort routing; recommended settings are not execution claims.
