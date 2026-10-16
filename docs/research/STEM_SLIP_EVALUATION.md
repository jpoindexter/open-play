# Stem Slip evaluation — documented conflict and independent browser contract

Research date: **2026-10-16**. Target: Serato DJ Pro **4.0.10.213**, T10 reference. Status: **primary-source research; reference runtime untested**. No T10 hardware or Serato audio path was operated. This evaluation authorizes no native implementation or parity-completion claim.

**Stem Slip is selected-stem transport, with a documented latched hardware workflow. It is more than a temporary mute or ordinary whole-deck Slip.** The official sources disagree on release wording; exact initial-state polarity remains open.

## Primary evidence and dates

- [Serato4.0.10 release copy](https://serato.com/dj/pro/downloads), retrieved16October2026, describes scratching/cueing one stem while the rest continues. Its retrieved text exposes no publication date.
- [Hercules T10 manual](https://ts.hercules.com/download/sound/manuals/DJC_T10/HERCULES_DJC_T10_USER_MANUAL_-_EN_FR_DE_NL_IT_ES_PT_PL_JP_CNM_KO.pdf#page=39): printed38/PDF39 specifies hold Slip, press a Stem button, then **“Release both buttons”**; both lights remain on. A Slip press disables the mode. Printed39/PDF40 says vocal follows deck/crossfader while instrumental continues independently, then vocal realigns after scratching. Printed35/PDF36 lists release0/½/1/2/4, default0; printed38 applies this to Stem Slip. Printed37/PDF38 describes the ordinary latched isolation buttons. Retrieved16October2026; PDF metadata created12October2026 12:26:21CEST, modified12:33:55CEST. These metadata dates are not a verified publication date. PDF pages39–40 were also visually inspected.
- [Serato T10 quickstart](https://support.serato.com/hc/en-us/articles/17616872214799-Hercules-DJControl-T10-Quickstart-Guide-for-Serato-DJ-Pro), current text retrieved16October2026: its Stem Slip section describes temporary vocal isolation/muting and release restoring full track; the instrumental chord cuts backing music for a vocal drop. Its Slip Release section describes a quantized roll before return. No initial-state table or exact key-up order appears; no publication date is exposed.
- [Ordinary Slip](https://support.serato.com/hc/en-us/articles/235191207-Slip-Mode) returns whole-deck manipulation to the unmanipulated timeline and disables on new track load. [DJ Preferences](https://support.serato.com/hc/en-us/articles/223363407-DJ-Preferences) separately says enabled Slip Release waits for the selected period. Both retrieved16October2026; publication dates unavailable in retrieved text.

Official PDF SHA256: `3a81264c2b9fe97f2d89f3761664cd3417b325aceefc5075e1c1473512d70012`. Full source records and page numbering are in [the JSON companion](stem-slip-evaluation.json).

## Conflict with the current requirements

`interaction-requirements.json` REQ-265 records release roll timing; this remains documentation evidence, with quantization details unmeasured. REQ-266 currently describes a held temporary isolation/mute that restores the full track on release. That row does not capture the hardware manual’s latched mode or selected-stem timeline/crossfader split. `SOURCE_CONFLICTS.md` SC-12 already preserves initial-state uncertainty, and STM-005 remains research-pending in the delivery registry.

Do not close the conflict by treating button release, scratch release and mode disable as the same event. The strongest concrete hardware procedure is latched; the Serato quickstart has not been proven wrong by runtime observation. Keep its apparent momentary behavior as a conflicting documented branch until a T10/4.0.10.213 test or authoritative clarification resolves it. This hardware procedure is not proven on Inpulse300MK2 or as a hardware-free Serato UI control.

## Independent implementation contract

The following is a **proposed Open Play behavior**, not a recovered complete Serato state table.

1. Keep mode selection (`off`, `vocal`, `instrumental`) separate from gesture (`idle`, `manipulating`, `releasing`). Consume Slip+Stem as a chord; releasing the buttons leaves the mode selected. A separate Slip press disarms. Ordinary deck Slip and Stem Slip are mutually exclusive prototype modes.
2. From a full mix, arming a group selects its manipulation target; it does not mute the complement. Preserve pre-existing stem masks/gains, including custom combinations. Whether Serato preserves or resets those initial states is unknown.
3. Maintain a canonical deck clock and selected-group cursor. Scratch and hot cue affect the selected cursor; complementary stems continue on the canonical timeline. Crossfader applies to the selected group only. Instrumental-mode symmetry and retaining shared channel gain/EQ/FX processing are independent choices; the PDF explicitly establishes only the vocal crossfader example.
4. Gesture release0 realigns the selected cursor immediately and keeps the mode armed. For releaseN, roll only the selected group forN elapsed deck beats, then align to the current canonical clock. Use the advancing beat clock across tempo changes. Immediate roll start and captured-fragment selection are independent policies, not measured Serato quantization.
5. A paused deck may be armed without advancing. Pause cancels a gesture/roll, aligns cursors and freezes both clocks while keeping the mode selected. Resume starts cleanly. Seek invalidates pending releases and moves both clocks to the requested position. Stop/load/unload/disconnect/end cancels and disarms; subsequent stale button releases cannot resume audio or seek backward. Only ordinary Slip’s new-load reset is directly documented.
6. Use a gesture owner and deck-generation token. Pointer cancel, lost capture or blur ends a gesture once and aligns the selected cursor; explicit disarm also clears selection. Preserve the base stem mask. If changing selected group mid-gesture is supported, first end/rejoin the old selection, then arm the new group. All cancellation/switching rules are declared independent policies.

### Concrete scope for the first independent implementation

- **Selected group:** Vocal means the vocal source; Instrumental means melody+bass+drums as one selected group. The other group stays audible and advances on the canonical clock. The vocal split is documented; inverse routing for Instrumental is a proposed symmetry, not a measured reference result.
- **Rate, reverse, loops, cues:** Canonical position integrates the deck’s ordinary baseline rate, including tempo changes, without scratch/jog/cue displacement. Scratch, temporary reverse, held cue and performance loop/roll alter only the selected cursor. Exposing permanent reverse/loop controls to that selected scope is an independent policy; official4.0.10 copy explicitly supports scratch/cues, not every loop/reverse interaction. Existing reverse/loop states on mode entry remain a reference gap and must be represented in tests rather than silently reset. Global play/pause/seek commands retain the lifecycle authority described above.
- **Mixer:** Only crossfader bypass for the complementary instrumental in Vocal mode is explicitly documented. Proposed Instrumental mode swaps those roles. Channel gain, channel fader/mute, EQ/filter, ordinary deck FX routing and headphone/PFL assignment retain their normal shared behavior for both groups. Their vendor Stem Slip topology is unknown; do not infer that every mixer control bypasses the backing track.
- **Release amount and grid:** For a concrete first contract, releaseN captures the selected source fragment ofN beats ending at the gesture-release cursor, plays oneN-beat roll beginning immediately, then rejoins. Use the canonical beat clock to count the duration. Do not add an unobserved wait to the next beat/bar; the exact reference quantized start boundary and roll capture are unknown. General cue/loop Quantize remains separate from this independent release policy.
- **Key ordering:** Both activation-key release orders leave the selected mode latched. Releasing the platter or held-cue key ends the current manipulation; it does not disable the mode. A separate Slip press disarms and aligns immediately, skipping any pending roll. Cancellation/lost capture/blur use immediate alignment, not the configured musical release roll. These cancellation and precedence choices are independent.

## Observable acceptance

| Case | Done evidence |
|---|---|
| SS-01 chord/latch | Release both chord buttons; selected mode stays active, then a separate Slip press disables it. |
| SS-02 independent time | Four distinguishable synthetic stems: vocal marker order changes under scratch/cue; instrumental timing matches an untouched reference. |
| SS-03 crossfader | With Vocal selected, cutting crossfader removes vocal while that deck’s instrumental retains its timing/level. Other deck unaffected. |
| SS-04 gesture release | Release0 rejoins the current canonical marker; a second gesture works without rearming. |
| SS-05 release lengths | Test0/½/1/2/4 at60/120/180BPM, selected-only roll and a tempo change during release. At120BPM nonzero durations are0.25/0.5/1/2seconds under the declared clock policy. |
| SS-06 initial masks | Full, vocal-only, instrumental-only and custom masks remain unchanged after gesture release/cancel; this proves the independent preservation policy only. |
| SS-07 transport | Pause/resume, seek, stop, load/unload, disconnect and track end during gesture/release leave no orphan playback or stale seek. |
| SS-08 cancellation | Pointer leaves control, pointercancel, lost capture and blur each terminate once; finite output and no pending stale timer. |
| SS-09 ordinary Slip | Whole-deck Slip and selected-stem Slip render measurably different manipulation scope. |
| SS-10 group switch | The old selection rejoins once before the new group is selected; base masks unchanged. |

Browser graph tests must render actual separate stem sources and exercise the real controls/transport path. Label/state assertions or muting a combined deck buffer cannot establish selected-stem transport. Hardware parity additionally needs the real T10/4.0.10.213 state matrix, latency and routing observations.

## Remaining reference unknowns

Initial mute-mask polarity; simultaneous Stem buttons; entry with ordinary Slip already enabled; modifier ordering; exact quantization boundary/roll fragment; mode release versus scratch release; pause/seek/cancel/disconnect behavior; instrumental crossfader symmetry; channel fader/EQ/FX/PFL topology; separation latency; supported non-T10 controls/MIDI bytes. These are not inferred from ordinary Slip or the vocal example.

## Execution routing recommendation

These are recommendations only, not claims that a model is installed, currently available or already used. Existing IDs/efforts were read from `docs/delivery/FEATURE_MODEL_PLAN.md` and the REQ-265/266 routing records.

| Feature work | Codex recommendation | Optional fresh Claude review |
|---|---|---|
| STM-005/REQ-266 disputed state/DSP evidence audit | `gpt-6-astra` / high, bounded to the dispute | Existing `claude-opus-5` / high |
| STM-005 chord/latch UI and routine lifecycle implementation | `gpt-6.1-sol` / high | Existing `claude-sonnet-5` / medium |
| REQ-265 selected-group release and deterministic tests | `gpt-6.1-sol` / high; Astra high only for a measured unresolved state/DSP issue | Existing `claude-opus-5` / high |
| DEK-010/STM-005 transport and cancellation regressions | `gpt-6.1-sol` / high | Existing `claude-opus-5` / high |

Skills applied: use, dec-discovery-validation, dec-quality-testing. Conducting-research was read and discarded as a branding-specific dispatcher; its research-before-decision principle was not needed as a separate workflow.
