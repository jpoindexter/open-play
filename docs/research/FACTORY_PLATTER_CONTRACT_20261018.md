# Factory platter contract investigation — checkpoint144

18 October2026. **No new jog or full-parity acceptance.** This checkpoint adds a reusable read-only inspection tool and resolves source-level facts. Product code, v3 catalogs, native0.1.23 and its tested272-assignment alternative profile are unchanged.

## Source findings

The recovered factory ACI schema is602,625bytes, SHA256 `5ddc4df831cf5cb5b835163ab01e83a3dc8131f0f0eb508f962c4fdb03234e97`. Its original XML remains private under `local-evidence/serato-mapping-import-140/official-userio-checked/ACI/ACI.xml`.

- Platter movement is a float in−1..1 with default0 and explicit translation. The schema does not specify its physical rotation unit.
- Consecutive platter timing is documented in microseconds. This is a timing-input fact, not a movement-unit calibration.
- Jog mode0 selects nudge and1 selects scratch. Skip mode overrides the current jog mode. A separate skip action can process motion without changing modes; scratch-without-touch is also a distinct mode.
- Virtual platter speed aliases are0=33RPM and1=45RPM. A virtual-speed enum does not establish hardware ticks per revolution.

The same schema supplies defaults omitted by individual device definitions:

| Action | Translation default | Value/default |
|---|---|---|
| play, PFL | toggle on down | integer0..1, initial0 |
| cue, sync, sync off | explicit | integer0..1, initial0 |
| load, cue play | explicit on down | integer0..1, initial0 |
| pitch range | increment wrapped on press | integer1..100, initial8 |

These facts narrow the previously broad “omitted defaults” uncertainty. They do not prove that Open Play's current actions implement every alias, timing, release behavior or range sequence. One later pitch-range extension has no value element; it is not a second contradictory default. No adapter warning or acceptance flag is removed in this checkpoint.

## Native trace

`scripts/trace_macho_typeinfo.py` searches an exact Itanium C++ RTTI name in a thin ARM64 Mach-O, resolves bounded pointer candidates and identifies vtable candidates with nonpositive offset-to-top and executable method slots. It performs two bounded pointer scans rather than indexing every file pointer. It does not run the target, resolve relocations or infer method semantics.

Executed against the private thin binary SHA256 `3c97facac6bc4928d4b3f757ea788b52c1f49bfa05932938cfa995874445abb4`, it reproduced the platter-control class: one exact name, one typeinfo candidate and three vtable candidates. The primary callback table leads to the input dispatcher already inspected with targeted Ghidra. Private receipts and pseudocode remain under `local-evidence/factory-jog-144/`; no native implementation is copied into application code.

Two read-only Ghidra jobs completed successfully. The first inspected five dispatcher/output/reset entries; the second inspected the constructor and three helpers. The constructor registers the relevant input IDs, and the dispatcher contains separate float motion, elapsed-time and boolean-mode paths. A helper's mode-selection branches corroborate a skip override and a scratch-without-touch mode. Mapping those internal numeric case IDs to schema names is an inference from registration order, value shape and behavior; it is not a direct name-bearing symbol association.

The main dispatcher has a Ghidra PIC-call warning and merged helper/control-flow artifacts. Several displayed variables have unresolved types/calling conventions. Numeric calculations seen in this output are therefore **not sufficient to establish a physical angle or copy an exact algorithm**. The next useful check is bounded ARM64 disassembly of the motion dispatch and its scratch-update call, following the virtual-speed input. Do not rerun whole-program analysis or assume a normalized source range means512ticks/revolution.

## Executed checks and limits

- The new CLI ran on the actual private binary and reproduced the previously located table, including its two secondary-table offsets. This establishes structural reproducibility, not runtime behavior.
- Three authored-fixture tests passed: exact-name matching/table boundaries, a negative secondary offset, and malformed command/segment rejection. The initial malformed-segment fixture altered the protection field instead of file size; its expected rejection failed. Correcting that test field produced the final pass. This was a fixture error, not an application failure.
- Product bytes were not changed. No browser/audio matrix was rerun because no runtime behavior changed. No timed capture, physical output, SysEx, initialization, native packaging or controller-profile mutation occurred.

## Preserved behavior and re-entry

The v3 adapter remains19,252 adapted assignments across145/197 definitions, with all197 semantic source trees retained and no fully translated controller. Hercules remains356 assignments and18 unresolved items. The eight factory platter-move inputs and two skip-mode inputs remain inactive. The two separate Double Click definitions also remain unresolved: existing Load already has an independent450ms Instant Double policy, so an additional same-address handler could trigger it twice.

Alternative mappings remain supported as **Alternative mapping — author/project**, separate from authenticated **Official Serato** and **User mapping** labels. Source identity is independent of physical compatibility and semantic equivalence. The existing248-tick community calibration is an alternative-source policy; it must not silently become factory calibration.

Next: resolve the motion unit and duplicate-load ownership before extending the adapter. Keep the schema defaults above as source facts until their translation behavior is implemented and exercised. Continue the original55extendedFX and Stems/keylock work afterward; keylocked Stems browser activation continuity still needs production replacement API/engine/pad integration. The same-instance serial experiment alone does not close it.

The full110-group/522-requirement goal, nine beta deltas and26release checks remain open. Existing per-feature Codex/Claude recommendations remain planning metadata, not a live model-availability check. Full Claude audit remains unlaunched; the handoff retains its complete original prompt suffix.
