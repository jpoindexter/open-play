# Refresh effects from the audible owner

A requested rate can precede its audio-time handoff. Updating effect BPM from that request exposes the new tempo while the old voice is still audible; a later renderer tick can then change it back. A warped source also needs its local grid BPM multiplied by its audible source rate, rather than its base BPM.

Reuse `currentDeckBPM` for that distinction. At group completion, retain current node values for newer owners, update only members whose track/rate/request/generation still belongs to the group, and refresh through the existing `updateFXBPMs` path. Avoid an old per-channel await followed by writes from saved unit metadata. A revoked start must check ownership after resume before touching FX.

Evidence: actual engine methods with controlled clocks/adapters reproduced premature120→240 BPM writes before a10.17s handoff at clock10s, warped96 versus120 BPM, and an older group's132 BPM overwrite of a replacement owner's81 BPM. Seven focused cases went from6 failures/1 pass to7 passes; the full Node suite passed168. See `docs/prototype/sync-fx-boundary-results.json`.

These checks concern parameter timing/ownership. The existing renderer tick remains; sample-accurate effect scheduling during a main-thread stall, actual native parameter capture, audible pops and physical output remain separate checks.
