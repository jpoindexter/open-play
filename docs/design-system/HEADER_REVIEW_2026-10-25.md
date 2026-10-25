# Shared header slice — 25 October 2026

Executed actual workspace UI through CUA in an isolated loopback browser, not the normal desktop profile. One40px header at1280px; right edge1272px, no clipping. Six layout choices retained in Settings. Core controls are original nodes with original handlers, rehomed rather than cloned. Actual Astryx IconButton and Lucide icons use the installed bundle; no new dependency.

Observed2deckHorizontalCompact and4deckVerticalCompact;4Play controls and32hotcues retained. Library waveform images remain (8initial;7within the final shorter viewport plus lazy offscreen row). Mixer hide/show and zoom4s→2s worked. Full density and Horizontal were selected through the original Settings handlers; Traktor-flat choice worked. Nested Audio routing and MIDI editor returned to their Settings tab via Back. Advanced engine/feature status remained available. Close returned focus to View. Selected tab exposes aria-current. Day-mode modal210/212/215, text22/25/28, selector238/238/238 and muted72/80/90 observed after fixing inherited palette drift. No console errors observed in the final origin.

Found/corrected during this workflow: zoom hosts hidden by an overly broad span selector; hidden Back host made visible by a more specific form rule; missing forwarding of selected-tab state. A fresh no-store origin was used to avoid cached imports from an earlier simple-server run.

Focused check: existing Astryx remount regression1/1; production bundle assertions include actual IconButton and forbid engine ownership. Token generator107tokens with alias/cycle validation; changed JS syntax and git whitespace checks pass. No broad unit/DSP campaign.

Not executed: current-source native package, narrow viewport review, complete six-layout visual sweep, audio listening/PCM, hardware or public beta distribution. Normal0.1.57/current tracks and original music were not changed by this preview. Full authored-style migration is OPEN on UI-DS-01; one stylesheet entry alone does not complete it.

Trello readback: UI-TOOL-01, UI-DS-01 and GATE-N descriptions exact;159cards/10complete, no new completion or duplicate card in this slice. Public beta scope is in docs/delivery/PUBLIC_BETA_PLAN.md.

Follow-through: sourcedabd2ed quiet standard buttons and narrow browser fixes are recorded in [minimal controls review](MINIMAL_CONTROLS_2026-10-25.md). Isolated native1280px UI observed; final1000px native view unaccepted after inconclusive resize and later confirmed screen lock. No normal-profile upgrade or listening claim.
