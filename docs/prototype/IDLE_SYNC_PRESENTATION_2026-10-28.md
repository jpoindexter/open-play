# Redundant Sync frame attributes — 28 October 2026

An actual four-deck Compact workspace at baseline8b05aa1 rewrites unchanged Sync-control attributes3360times in1001.1ms/120observed animation frames while every deck is stopped. All3360records have identical old/current values: Sync data-state/busy/pressed/title, OFF disabled and MASTER pressed/title. This is unnecessary DOM/observer work; it does not by itself establish the cause of historical stalls or audible pops.

The existing frame presentation moves into28-line `sync-presentation.js`. It retains the same status text, beat dots, active classes, disabled rules, tooltips, master labels and accessibility values, writing attributes/properties only when they differ. Beat-phase calculation still occurs only when its indicator exists. The main app shrinks; the package module catalog declares the helper. No transport, DSP, clock, routing, layout or new dependency.

The same actual one-second capture after repair observes121frames/1000.6ms and zero targeted attribute writes, with354/354controls,4Play controls and3materialized library waveform previews retained. Physical output stays muted; all decks remain stopped with no processing/queued starts. Source data is generated; no original music is read or copied.

Actual GUI Simple Sync on B changes its selected state and enables OFF; OFF clears it/disables itself; selecting B MASTER clears A and shows Selected master. Two focused module checks cover unchanged refresh and changed pending/master/phase/relative/missing-grid/Simple states with controlled DOM endpoints. No broad suite or soak. A read-only child-document probe was unavailable after the first GUI action; the actual visible accessibility state, retained in the receipt, supplies that witness instead.

This proves removal of this specific idle mutation churn and preservation of these state changes. It does not prove lower total CPU, zero moving-waveform stalls, native frame timing, musical alignment, absence of pops, long-session stability or physical-controller behavior. Those parent criteria remain open. Owned frame/storage/tab/server are stopped/cleared; temporary fixture sources are retained privately and removed from the product tree.

[Structured evidence](idle-sync-presentation-2026-10-28.json). Raw results/screenshots, fixture copies and the two-check log remain private under `local-evidence/idle-sync-presentation-2026-10-28/`.
