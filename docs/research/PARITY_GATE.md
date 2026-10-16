# Parity and prototype review gate

Updated 2026-10-16. **Exact 1:1 parity status: not passed.** An annotated HTML review candidate now exists, following the user’s explicit continuation instruction and permitted simulation/gap boundary. No native application has been started.

Jason requires 1:1 feature coverage before prototype implementation. The inventory must account for controls, modes, state transitions, secondary actions, settings, failures and hardware-specific behaviors. A list of feature titles is insufficient. A screenshot does not establish transport, DSP or hardware behavior.

## Current coverage

- 168 official manual articles across 23 sections, all explicitly mapped to feature IDs; semantic review remains open.
- 354 selected interaction requirements have explicit triggers, expected outcomes and evidence boundaries.
- 74 initial feature groups plus 36 research additions, each with explicit Codex/Claude model and effort recommendations.
- Installed reference pinned to 4.0.10.213, with executable and installer hashes.
- All five display layouts and all eight Setup tabs observed; connected Hercules enumerated through USB, audio and MIDI interfaces.
- Expansion, hardware and release documentation is being reconciled separately from the main manual.

## Unresolved obligations

| ID | Gap | Why it matters | Evidence needed to close |
|---|---|---|---|
| PG-01 | Full control/state crosswalk not yet reviewed | 110 broad groups do not guarantee every secondary action is covered | Article-level and screen-level requirements mapped to feature IDs, with omissions reviewed |
| PG-02 | Navigation blocker resolved; screen coverage still partial | All eight Setup tabs, four advanced FX parameter strips, empty sampler and Scratch Banks are observed | User-authorized JXA/CoreGraphics navigation works with fresh screenshot verification. Complete remaining screen/state observations in UI_OBSERVATIONS.md |
| PG-03 | Device-specific binary trace incomplete | Ghidra pass and CoreMIDI call sites are now established, but manufacturer dispatch and audio paths remain unresolved | Continue from retained call sites into mapping/capability decisions, preserving decompiler limitations |
| PG-04 | Hercules physical input/output tests pending | Enumeration is not input, feedback or separate headphone/master proof | Browser action is user-confirmed in Serato, but raw capture remains unresolved despite passing virtual-source and destination self-tests; complete correlated controls and separate physical outputs |
| PG-05 | Exact advanced FX/video/Flip/streaming/Phase behavior incomplete | A generic panel would conceal parity gaps | Version-appropriate expansion sources and observable states; unavailable conditions explicitly marked |
| PG-06 | Reference inconsistencies unresolved | Choosing a convenient documented value could reproduce the wrong behavior | For example, right-deck loop shortcuts differ between shortcut and manual-loop articles; test the installed reference |
| PG-07 | Historical gating claim not established | Current paid upgrade is not proof of a removed entitlement | Version-specific official release/support evidence and comparable historical device behavior |

## Pass record required before HTML implementation

Record the dated source corpus, every discovered requirement ID, its screen/state/interaction destination, its evidence class and the planned prototype behavior. Known untestable conditions must remain explicit; they cannot be counted as verified reference behavior. Do not use successful metadata enumeration as a semantic-review pass.

If a strict 1:1 requirement cannot be established because the reference state is inaccessible, report that gap to Jason. Do not silently replace it with a generic design or claim full parity. Native acceptance remains a later independent gate even after prototype approval.

## Approval boundary

The user has authorized investigation, private project resources and an HTML prototype after this inventory gate. No native implementation is authorized until the specific prototype version is approved. Prototype approval, when obtained, must be recorded in docs/approvals.md.


### Approved prototype evidence boundary

Jason explicitly approved representing unavailable physical/DSP/provider behaviors as labeled documented simulations after inventory. He reinforced full feature scope. This permits simulation without claiming physical proof; it does not close incomplete control or feature enumeration. See [source conflicts](SOURCE_CONFLICTS.md) and [historical gating evidence](HISTORICAL_GATING.md).

## HTML review delivery record

All 110 currently known feature groups have a destination in `docs/prototype/coverage-manifest.json`. The browser index includes sources, model routing, implementation boundaries and open gaps. Some routes are gap disclosures, not working equivalents. The strict completeness/behavioral pass above has NOT been awarded. Twenty-four groups still lack detailed interaction rows; 55 of 59 advanced FX schemas remain unobserved.

The [executed review report](../prototype/REVIEW_REPORT.md) separates observed browser workflows from code-path claims, simulations and untested native behavior. Jason can review the candidate now while Claude independently challenges completeness. No reduction of full scope and no native approval is inferred.

## Functional follow-up

The [second functional review](../prototype/FUNCTIONAL_REVIEW.md) records actual
browser implementations replacing earlier placeholders and 20/20 executed audio/module
checks. This narrows several implementation gaps without passing the global gate.
The latest user instruction explicitly requires behavior, not labels/placeholders.
Four independent processors do not close the 59-effect scope; MIDI access timed out;
missing native/hardware/provider acceptance remains visible.
