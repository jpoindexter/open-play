# Keep preparation transactional

Check current ownership after each awaited stage before starting another costly stage. Checking only after buffer preparation prevents stale playback but can still schedule an obsolete decode after FX readiness. Source2a9c027's actual start cases establish that distinction; they do not measure actual decoder cost.

A rate operation that can reject during rendering must retain the current voice until preparation succeeds. Reuse the existing prepared handoff and its request/generation rollback; do not pause first and leave the rejected rate installed. Source5e53ef6 covers bounded GUI loop/reverse rejection, a newer owner and explicit Stop without changing DSP.

Range changes are presentation metadata: update the existing coordinate bounds, labels and accessibility state while retaining active nodes. Preserve structural fallback and the existing relative-coordinate contract. The original GUI suite caught an incorrect relative reset; that hypothesis was discarded.

See `docs/prototype/CORE_TEMPO_RELIABILITY_2026-10-25.md` and its194-check receipt. Native pointer/latency/audio, audible pops and hardware remain separate gates.
