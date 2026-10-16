# Open Play — full build plan

**Prepared:** 16 October 2026 · **Owner:** Jason · **Status:** investigation authorized and in progress; prototype parity gate pending; native build blocked on prototype approval.

This document expands the supplied Serato investigation brief into a proposed delivery plan. Investigation is in progress. Local inspection identifies Serato DJ Pro 4.0.10.213 and Desktop installers 4.0.9/4.0.10. A private GitHub repository and private Trello board have been created and their visibility verified. The official manual index contains 168 articles across 23 sections. The connected Hercules DJControl Inpulse 300 MK2 is visible through USB, CoreAudio and CoreMIDI; Jason reports that its browser knob moves the highlighted Serato track; byte-level input and physical audio-routing tests remain pending. Ghidra completed deep auto-analysis; Hopper remains supplementary and its REA bridge is currently blocked. Prototype/native implementation has not begun. See [evidence ledger](docs/research/EVIDENCE_LEDGER.md) and [project resources](docs/delivery/project-resources.json).

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

**Now:** inspect installed version 4.0.10.213 and reconcile the complete feature/screen parity inventory. **Next:** build the HTML prototype only after that inventory gate is satisfied. **Later:** prototype, review, native slices, hardware acceptance, and release preparation. **Re-entry:** read this section, the latest evidence ledger, decisions, and approval record before doing anything else.

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

**Next exact step:** extend the 60 interaction requirements to the remaining source/control states, complete expansion-specific catalogs and resolve the device input-capture discrepancy. Reconcile the parity gate before HTML implementation. Native coding remains prohibited.

## 19. Methods applied

Skill sweep (`use`); product-prd and product-roadmap via `pm`; Jobs To Be Done and story mapping via dec-discovery-validation; MoSCoW-style sequencing via dec-prioritization-frameworks; familiar/self-evident flows via dec-krug-laws; behavioral integration and visual tests via dec-quality-testing; task-complexity routing via cost-aware-llm-pipeline; explicit file-based continuation via claude-codex-handoff. Skill sample model names and prices were not accepted as verified facts.



## 20. Investigation checkpoint — 16 October 2026

| Deliverable | Verified state | Remaining obligation |
|---|---|---|
| Private resources | GitHub repository and private Trello board exist; 110 feature cards plus prototype/native gates and evidence card read back | Keep remote research updates synchronized; never mark feature acceptance from source indexing |
| Binary investigation | Ghidra auto-analysis completed; CoreMIDI input callback registration and selected source connection cross-checked with LLVM | Manufacturer dispatch, audio scheduling and hidden algorithms remain unresolved |
| Reference UI | Eight Setup tabs, all five display layouts, empty sampler, Scratch Banks and Flip strip inspected | Loaded/playing/failed states, full FX parameters, video and hardware-dependent controls |
| Effects | 59 named effects across eight categories; LPF/Delay/Reverb advanced parameters inspected | Remaining parameter menus/ranges and independent audible tests |
| Source traceability | All 168 main-manual articles explicitly mapped to feature IDs; 87 feature groups have exact article links | Semantic review, expansion/hardware sources and historical-version conflicts |
| Interaction contract | 60 explicit trigger/result requirements with evidence boundaries and inherited model routing | Expand to all discovered controls and state transitions before prototype gate pass |
| Hercules input | USB/audio/MIDI enumeration; Jason reports browser selection moves in Serato | Physical source capture still zero; both virtual receiver tests pass |
| Hardware output | Four CoreAudio output channels and connected speakers/headphones reported | Separate physical master/headphone, LED, latency and reconnect acceptance not executed |
| Prototype/native | Neither implementation has started | Inventory gate, then full HTML prototype, then Jason's explicit native approval |

Read the [manual crosswalk](docs/research/MANUAL_FEATURE_CROSSWALK.md), [interaction requirements](docs/research/INTERACTION_REQUIREMENTS.md), [installed UI observations](docs/research/UI_OBSERVATIONS.md), [FX catalog](docs/research/fx-catalog.json), [Hercules evidence](docs/research/HARDWARE_HERCULES.md) and [binary findings](docs/research/BINARY_FINDINGS.md) together. These are original specifications and findings, not recovered proprietary implementation.

New scope discoveries are retained under existing feature IDs pending decomposition: Twitch song/artist metadata reporting under AUD-007/SYS-009, External Control activation/device lists under HW-001/UI-010, and Remote/Remote Mini retirement under SYS-010. Their existence is recorded, but exact protocol and historical behavior remain open. No discovered feature should disappear merely because it is absent from the main manual.

Trello source-link synchronization has 26 exact descriptions verified by readback and 61 pending updates after repeated HTTP 429 responses and a transport failure. Completed updates and pending jobs are retained in docs/delivery/trello-source-sync.json; do not assume all remote descriptions already contain the newer crosswalk. The canonical local feature registry remains current.
