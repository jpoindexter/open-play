# Feature and model execution plan

Generated from FULL_BUILD_PLAN.md and PARITY_ADDITIONS.md. Jason approved local desktop tests; frozen desktop 0.1.23 and its tested profile remain preserved. Current work targets the browser. No row is a full implemented-parity claim.
Planning-table statuses are a dated baseline. Current scoped implementation evidence is in docs/prototype/DSP_FUNCTIONAL_REVIEW.md and STEM_SLIP_FUNCTIONAL_REVIEW.md; no status implies complete parity. STM-005 routine execution now uses Sol/high, with bounded Astra/high escalation for a measured unresolved dispute.

| ID | Feature | Codex / effort | Claude Code / effort | Status |
|---|---|---|---|---|
| LIB-001 | Local import and supported formats | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-002 | Metadata and artwork | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-003 | Search, filter, sorting and columns | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-004 | Crates and playlists | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-005 | Smart crates | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-006 | Missing files and external volumes | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| LIB-007 | Duplicates and content identity | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| LIB-008 | History and session preparation | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-009 | Library import/export interoperability | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| LIB-010 | Large library virtualization | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-011 | Metadata backup and migrations | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| ANA-001 | Waveform generation and caches | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| ANA-002 | BPM estimation | gpt-6.1-sol / high | claude-sonnet-5 / high | Research pending |
| ANA-003 | Beat grids and editing | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| ANA-004 | Musical key analysis | gpt-6.1-sol / high | claude-sonnet-5 / high | Research pending |
| ANA-005 | Gain/loudness analysis | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| ANA-006 | Analysis queues and cancellation | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| DEK-001 | Load, unload and deck focus | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| DEK-002 | Play, pause, seek and end-of-track | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-003 | Cue and hot cues | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-004 | Manual, automatic and saved loops | gpt-6-astra / high | claude-opus-5 / high | Actual warped Slicer beat geometry/release/fixed-wrap/pending Stop recorded; shifting overlap/reference/quality/native open (plan164) |
| DEK-005 | Beat jump | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-006 | Tempo fader and pitch ranges | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-007 | Key lock and independent key shift | gpt-6-astra / high | claude-opus-5 / high | Actual warped Slicer beat geometry/release/fixed-wrap/pending Stop recorded; shifting overlap/reference/quality/native open (plan164) |
| DEK-008 | Sync, master and phase | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-009 | Jog, nudge and scratching | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-010 | Slip and reverse modes | gpt-6-astra / high | claude-opus-5 / high | Actual coherent warped relative tempo/raw-keyed reverse/forward/two-deck propagation recorded; Slicer/context/quality/reference open (plan163) |
| DEK-011 | Two/four and extensible decks | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| DEK-012 | Quantization and musical timing | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| MIX-001 | Channel gain, faders and mute | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| MIX-002 | Crossfader curves and assignment | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| MIX-003 | EQ and filters | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| MIX-004 | Headphone cue and cue/master blend | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| MIX-005 | Master meters, headroom and clipping | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| MIX-006 | Internal/external mixing modes | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| FX-001 | Effects chains and assignment | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| FX-002 | Tempo-synced effect timing | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| SMP-001 | Sampler slots and banks | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| SMP-002 | Sampler audio modes and routing | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| STM-001 | Local stem separation | gpt-6.1-sol / high | claude-sonnet-5 / high | Actual warped Slicer beat geometry/release/fixed-wrap/pending Stop recorded; shifting overlap/reference/quality/native open (plan164) |
| STM-002 | Stem mute/solo/mix controls | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| STM-003 | Stem cache/cancel/fallback | gpt-6.1-sol / xhigh | claude-opus-5 / high | Actual warped Slicer beat geometry/release/fixed-wrap/pending Stop recorded; shifting overlap/reference/quality/native open (plan164) |
| REC-001 | Record the actual master mix | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| REC-002 | Recording limits and recovery | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| AUD-001 | Output/input device selection | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| AUD-002 | Sample rate and buffer controls | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| AUD-003 | Multichannel routing | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| AUD-004 | Hot plug and route recovery | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| AUD-005 | Clock drift and multiple devices | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| AUD-006 | Long-session resource stability | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| HW-001 | Device inventory and capabilities | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-002 | MIDI learn and mapping editor | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| HW-003 | MIDI timing and control semantics | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-004 | LED and display feedback | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-005 | HID/controller integration | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-006 | CDJ/media-player integration | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-007 | DVS signal and calibration | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-008 | DVS operating modes and dropout | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| HW-009 | USB storage behavior | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| HW-010 | Conflicts and multiple controllers | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| UI-001 | Reference shell and layouts | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-002 | Menus, shortcuts and drag/drop | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-003 | Preferences and reset | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-004 | Accessibility and reduced motion | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-005 | Empty/progress/error/recovery states | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-006 | Long labels, Unicode and scaling | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| SYS-001 | Offline account-free operation | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-002 | Session persistence and recovery | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-003 | Optional provider integrations | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-004 | Installer, permissions and updates | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-005 | Diagnostics and opt-in reporting | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-006 | Open-source build and provenance | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-007 | Mappings/extensions compatibility | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-008 | No artificial feature gates | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| LIB-012 | Favorite crates, crate search, colors and sort modes | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-013 | Ratings, emoji ratings and iTunes rating import | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| LIB-014 | Track lock versus beatgrid lock | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| LIB-015 | Files panel copy, move, rescan and volume portability | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| LIB-016 | History session editing, inserted tracks and exports | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LIB-017 | Live playlists and optional sharing | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| ANA-007 | Analyze-on-import, ranges and selective reanalysis | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| DEK-013 | Instant doubles across decks and sampler | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-014 | Autoplay, repeat, offline player and practice layouts | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| DEK-015 | Temporary cue hold/release and continued playback | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-016 | Cue/loop names, colors, order and chronological preference | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| DEK-017 | Loop roll and underlying timeline | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-018 | Smart sync state machine and relative-pitch takeover | gpt-6-astra / high | claude-opus-5 / high | Actual warped Slicer beat geometry/release/fixed-wrap/pending Stop recorded; shifting overlap/reference/quality/native open (plan164) |
| DEK-019 | Pitch Play and key sync | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| DEK-020 | Slicer and slicer loop | gpt-6-astra / high | claude-opus-5 / high | Actual warped Slicer beat geometry/release/fixed-wrap/pending Stop recorded; shifting overlap/reference/quality/native open (plan164) |
| FX-003 | Advanced FX parameters, favorites and named presets | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| FX-004 | Channel FX and hardware filter-knob assignment | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| SMP-003 | Sampler advanced pitch, sync, cue/loop start and gain | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| SCR-001 | Scratch Banks, per-slot load settings and previous-track return | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| FLP-001 | Flip recording, playback, loop, save and edit | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| VID-001 | Video decks, linked AV playback and external display | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| VID-002 | Video transitions, effects, text and image overlays | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| LNK-001 | Ableton Link session, tempo and phase integration | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| STM-004 | Stem effects, waveform response and hardware pad replacement | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| STM-005 | Stem Slip introduced in 4.0.10 | gpt-6.1-sol / high | claude-opus-5 / high | Independent browser30/30; exactT10 conflict/hardware acceptance open |
| HW-011 | Hercules Inpulse 300 MK2 full default mapping | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-012 | MIDI many-to-one, one-to-many and data encodings | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| HW-013 | DVS THRU, changeover and emergency internal mode | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| AUD-007 | Microphone/auxiliary routes and virtual audio output | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
| REC-003 | Pre-master recording tap, input selection and split files | gpt-6-astra / high | claude-opus-5 / high | Research pending |
| UI-007 | Vertical, horizontal, extended, stack and library modes | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-008 | Day mode, library-only mode and display preferences | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-009 | Help, shortcut overlay, tooltips and diagnostics status | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| UI-010 | Complete setup tabs and hardware-dependent controls | gpt-6.1-sol / high | claude-sonnet-5 / medium | Research pending |
| SYS-009 | Streaming provider-specific capabilities and failures | gpt-6.1-sol / xhigh | claude-opus-5 / high | Research pending |
| SYS-010 | Version comparison and historical removed/gated features | gpt-6-astra / xhigh | claude-opus-5 / xhigh | Research pending |
