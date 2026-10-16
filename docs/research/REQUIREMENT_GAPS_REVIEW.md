# Review of missing interaction requirements

On 16 October 2026, the canonical inventory had 354 interactions across 86 of 110 feature groups. This pass inspected all **24 groups with no direct rows** and adds **138 source-backed interactions across 22 groups**, using 34 distinct official articles, with the official 4.0.4 release notes as additional confirmation. It does not establish complete manual coverage, implementation, acoustic accuracy or hardware parity.

`interaction-requirements-additions.json` is the merge artifact. `ADD-*` IDs are provisional. The canonical JSON, registry, crosswalk, prototype and native files were not edited in this pass.

## Evidence discipline

Each addition records a named screen or control, a concrete action/condition and a documented outcome. All are DOCUMENTED, with runtime verification separate. Sources were inspected in the existing same-session official manual corpus and through live official support pages. No community mapping code or inferred binary behavior supplies these rows. Existing Codex/Claude routing is preserved from the feature registry; this pass does not independently certify model availability.

For reconstruction, preserve behavior while respecting deliberate Open Play differences. Serato account, activation and paid-entitlement conditions are reference facts, not instructions to add paywalls. The user explicitly requires unrestricted independently implemented local functionality. Provider authorization, catalogs and offline entitlements remain external dependencies.

## Coverage and remaining gaps

| Group | New rows | Review outcome |
|---|---:|---|
| LIB-007 — Duplicates and content identity | 2 | Relocation duplication is documented; content hashes, duplicate reconciliation and changed-file identity rules are not. |
| LIB-010 — Large library virtualization | 2 | Large-library import status is documented; virtualization internals, maximum track counts and search/scroll performance guarantees are not. |
| ANA-004 — Musical key analysis | 3 | Key calculation/overwrite/lock rules are documented; detector algorithm, accuracy, confidence and tuning behavior remain hidden. |
| MIX-006 — Internal/external mixing modes | 5 | Conditional software/hardware mixer ownership is documented; exact per-model channel maps and internal/external routing need hardware guides and measurement. |
| REC-002 — Recording limits and recovery | 4 | Space display, unsaved temp file and 2 GB rollover are documented; disk-full, permission-loss, crash finalization and damaged-file recovery are not established. |
| AUD-004 — Hot plug and route recovery | 3 | Connection failures are documented; uninterrupted hot-plug recovery, safe rerouting and transient/burst behavior are not. |
| AUD-005 — Clock drift and multiple devices | 0 | No official source found for general independent-device audio-clock synchronization, drift correction or aggregate-device guarantees. DVS Anti-Drift concerns control-tone flutter and is not evidence of this feature. |
| AUD-006 — Long-session resource stability | 2 | CPU/dropout indicators are documented; long-session memory, callback scheduling and soak guarantees are engineering acceptance goals, not established reference contracts. |
| HW-001 — Device inventory and capabilities | 5 | Startup/MIDI detection and hardware-dependent ranges are documented; universal capability enumeration and unsupported-device reporting are not. |
| HW-003 — MIDI timing and control semantics | 6 | MIDI interpretation modes are documented; numerical byte semantics, clock/timestamp accuracy, 14-bit resolution, soft takeover and jitter require additional sources or captures. |
| HW-006 — CDJ/media-player integration | 7 | HID setup and one firmware boundary are documented; each supported player/firmware/control/feedback combination still requires its guide and physical test. |
| HW-009 — USB storage behavior | 5 | Portable-library attach/absence/eject behavior is documented; surprise removal during playback, write interruption and filesystem corruption recovery remain unknown. |
| UI-001 — Reference shell and layouts | 6 | Named display/control outcomes are documented; exact dimensions, pixel matching, responsive layout and transitions still require installed-version observation. |
| UI-003 — Preferences and reset | 8 | Concrete preferences and conditional tabs are documented; global preference reset, undo scope and every preference persistence edge case remain unknown. |
| UI-004 — Accessibility and reduced motion | 1 | Text resizing is documented; screen-reader semantics, complete focus behavior, contrast and reduced-motion support are not established as reference behavior. |
| SYS-001 — Offline account-free operation | 3 | Reference activation conditions are documented. Unrestricted account-free local behavior is an explicit Open Play product requirement and deliberate departure, not a Serato parity fact. |
| SYS-002 — Session persistence and recovery | 3 | Manual backup/migration is documented; transactional crash recovery and restored transport/session state are not. |
| SYS-003 — Optional provider integrations | 14 | Selected provider authorization/offline/failure restrictions are documented; all provider/account/region combinations, credentials, APIs and local-playback isolation are not tested. |
| SYS-004 — Installer, permissions and updates | 4 | Installer and update-check entry points are documented; current full OS matrix, permission-denial paths, automatic updates, rollback and data-preserving failures remain open. |
| SYS-006 — Open-source build and provenance | 0 | Open-source reproducibility/provenance is an Open Play engineering requirement. The Serato manual introduction does not support such a feature. No fabricated reference row added. |
| SYS-007 — Mappings/extensions compatibility | 8 | MIDI preset management is documented; arbitrary extension compatibility, invalid-preset rejection, parser recovery and isolation remain unverified. |
| DEK-017 — Loop roll and underlying timeline | 4 | Momentary roll and underlying timeline are documented; right-deck/four-deck shortcut text has a contradiction and simultaneous input edge cases remain unverified. |
| HW-011 — Hercules Inpulse 300 MK2 full default mapping | 38 | Core controls and eight-mode entry paths are now explicit. Fine-grained pad-slot semantics, remaining modifiers, MIDI encodings, LED packets, reconnect and four-output physical verification still require further detailed rows/tests. |
| SYS-010 — Version comparison and historical removed/gated features | 5 | Specific FX and provider transitions are documented; no verified personal entitlement-loss history or complete 4.0.9-to-4.0.10 behavior diff exists. |

## Source conflicts and consequential findings

- **Locked key analysis:** the official [Analysis setting](https://support.serato.com/hc/en-us/articles/14361435885327-Analysis-setting) page excludes locked files from key recalculation as well as beatgrid recalculation. This is distinct from merely preserving an existing library value after computing a new estimate.
- **Streaming crates require patch-version precedence:** the generic [4.0 crates guide](https://support.serato.com/hc/en-us/articles/227561407-Crates-in-Serato-DJ-Pro-Serato-DJ-Lite-4-0) retains a superseded Spotify exclusion. The [Spotify-specific guide](https://support.serato.com/hc/en-us/articles/13413236937999-Using-Spotify-streaming-in-Serato-DJ-Pro) and [official 4.0.4 release notes](https://serato.com/dj/pro/downloads/4.0.4) explicitly introduce Spotify crate support. That later rule applies to the installed 4.0.10 inventory. REQ-433 now records dragging a Spotify track into a crate; REQ-431/432 retain general connectivity behavior with the conflict marked. The old restriction is preserved only as historical pre-4.0.4 evidence, never as current expected behavior. Older Beatport setup restrictions also do not override later version-specific behavior.
- **Hardware guide contamination:** the Inpulse guide contains a promotional sentence naming DDJ-FLX4. It was excluded. The controller mapping is documentation evidence, not a captured MIDI/LED protocol.
- **Loop-roll shortcut contradiction:** [Loop Roll](https://support.serato.com/hc/en-us/articles/235208967-Loop-Roll) repeats active-left-deck wording in the right-deck shortcut description. The additions retain momentary/timeline behavior but do not invent a corrected four-deck shortcut.
- **Clock-drift terminology:** DVS Anti-Drift addresses control-tone tempo fluctuation. It does not establish synchronization of independent audio-device clocks. AUD-005 therefore receives no fabricated row.
- **Open-source provenance:** the Serato introduction describes its product; it supplies no reproducible open-source build contract. SYS-006 remains an explicit Open Play engineering obligation.

## Verification and merge boundary

Executed structural validation passed: 138 unique provisional IDs; required fields present; every feature is in the requested missing-group set; all article IDs match official URLs; each row retains Codex and Claude routing; all 24 groups have an explicit outcome. This validates the artifact structure, not the application behavior.

Parent merge steps:

1. Review the additions against their cited source and assign unused canonical REQ IDs. Merge by meaning, retaining source conflicts and conditional states.
2. Recompute the source crosswalk and coverage counts. Treat a populated group as partially documented, not semantically complete or implemented.
3. Keep AUD-005 and SYS-006 visible as unsupported reference mappings while retaining their independent engineering acceptance goals.
4. Link each accepted interaction to actual prototype behavior and executed tests separately. Provider, hardware, crash, timing and OS-dependent cases need their relevant environment; fixtures do not close them.

No native implementation or external account/hardware changes occurred.

## Version-conflict correction verification

The review correction changed only canonical REQ-431, REQ-432 and REQ-433, plus their three provisional additions and this document. Parsed-object comparison confirmed every other canonical requirement, including REQ-001–354, remained unchanged. The canonical total stays 492 and additions stay 138. No account operation or provider playback was executed.

## Official sources used

- [10173727435151](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide)
- [10245865629583](https://support.serato.com/hc/en-us/articles/10245865629583-3-2-0-DJ-FX-Channel-FX-FAQ)
- [115002472573](https://support.serato.com/hc/en-us/articles/115002472573-Using-Serato-DJ-CDJ-s-Media-players-with-HID-mode)
- [115003927267](https://support.serato.com/hc/en-us/articles/115003927267-Rec-Location)
- [14173738028175](https://support.serato.com/hc/en-us/articles/14173738028175-Software-Overview-Serato-DJ-Pro-4-0)
- [14359604291599](https://support.serato.com/hc/en-us/articles/14359604291599-Relocate-Lost-Files)
- [14361435885327](https://support.serato.com/hc/en-us/articles/14361435885327-Analysis-setting)
- [202304844](https://support.serato.com/hc/en-us/articles/202304844-Using-a-USB-external-hard-drive-for-your-portable-library)
- [202305054](https://support.serato.com/hc/en-us/articles/202305054-Backing-up-and-moving-your-library-to-a-new-computer)
- [203189300](https://support.serato.com/hc/en-us/articles/203189300-Troubleshooting-Connection-on-macOS)
- [209377487](https://support.serato.com/hc/en-us/articles/209377487-MIDI-mapping-with-Serato-DJ-Pro)
- [223363407](https://support.serato.com/hc/en-us/articles/223363407-DJ-Preferences)
- [223364427](https://support.serato.com/hc/en-us/articles/223364427-Library-Display)
- [223445888](https://support.serato.com/hc/en-us/articles/223445888-Installation-macOS)
- [223446728](https://support.serato.com/hc/en-us/articles/223446728-Mixer)
- [223446808](https://support.serato.com/hc/en-us/articles/223446808-MIDI)
- [224301987](https://support.serato.com/hc/en-us/articles/224301987-Activation)
- [224858107](https://support.serato.com/hc/en-us/articles/224858107-Starting-the-Software)
- [224966387](https://support.serato.com/hc/en-us/articles/224966387-Virtual-Deck)
- [224968947](https://support.serato.com/hc/en-us/articles/224968947-Track-Display)
- [225065768](https://support.serato.com/hc/en-us/articles/225065768-MIDI-Data-Types)
- [227561407](https://support.serato.com/hc/en-us/articles/227561407-Crates-in-Serato-DJ-Pro-Serato-DJ-Lite-4-0)
- [227883448](https://support.serato.com/hc/en-us/articles/227883448-Activating-Serato-DJ-Pro)
- [227916927](https://support.serato.com/hc/en-us/articles/227916927-External-Hard-Drives)
- [234774408](https://support.serato.com/hc/en-us/articles/234774408-Using-a-DJ-Controller)
- [234992348](https://support.serato.com/hc/en-us/articles/234992348-Setup-screen)
- [235208967](https://support.serato.com/hc/en-us/articles/235208967-Loop-Roll)
- [360000156476](https://support.serato.com/hc/en-us/articles/360000156476-Drivers-and-Firmware-why-do-I-need-them-and-how-do-I-get-them)
- [360000588435](https://support.serato.com/hc/en-us/articles/360000588435-Serato-DJ-Pro-Tidal-Music-Frequently-Asked-Questions)
- [360001929056](https://support.serato.com/hc/en-us/articles/360001929056-Beatport-Streaming-FAQ)
- [360001931276](https://support.serato.com/hc/en-us/articles/360001931276-Using-Beatport-Streaming-with-Serato-DJ-Pro)
- [4404985863055](https://support.serato.com/hc/en-us/articles/4404985863055-Pioneer-DJ-CDJ-3000-Firmware-update-guide)
- [6285026922639](https://support.serato.com/hc/en-us/articles/6285026922639-Converting-your-iTunes-library-to-a-Music-library-when-moving-to-a-new-macOS-computer-with-Serato-DJ-Pro-or-Lite)

- [13413236937999](https://support.serato.com/hc/en-us/articles/13413236937999-Using-Spotify-streaming-in-Serato-DJ-Pro)
- [Serato DJ Pro 4.0.4 release notes](https://serato.com/dj/pro/downloads/4.0.4)

Skills applied: use, dec-discovery-validation, dec-quality-testing.
