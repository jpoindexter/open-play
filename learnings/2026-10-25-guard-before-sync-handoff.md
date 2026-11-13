# Guard preparation before claiming the transport

Simple Sync can spend time decoding and extracting transients before it calls the engine's owned start. An engine generation guard cannot protect that earlier work. Capture request/transport/clock ownership before preparing, check it at asynchronous boundaries, and allow only the actual handoff's own token transition.

Keep immutable alignment metadata checks during the engine start's awaits. The old incoming token/rate must change for that handoff, but BPM/grid/revision edits still invalidate its geometry. Original paused collaborators may omit a voices map; preserve that contract.

Reuse existing prepared pitch handoffs for ordinary reverse playback instead of stopping before a fallible render. Preserve explicit gesture exclusions and rollback/newer-owner behavior. Do not equate cached-renderer ownership tests with reversal quality.

Quantize changes snapping flags and local presentation, not layout structure. Refresh active/pressed/mixed/focus states on existing nodes; retain shape recovery. A missing header must not crash fallback, and avoiding that crash does not mean reconstructing the header.

Source ea70bc0 / CORE_SIMPLE_SYNC_RELIABILITY_2026-10-25.md records27 focused cases and221 total tests. Native timing, pending live ACKs/OFF/mode behavior, audible pops and hardware remain separate gates.
