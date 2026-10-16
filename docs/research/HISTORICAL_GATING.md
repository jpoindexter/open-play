# Historical gates and Open Play policy

Updated 2026-10-16. User-reported concern: features previously usable with hardware have become gated. We have not yet established a specific before/after entitlement loss for this user's controller.

## Evidence gathered

The [official 3.2 FX transition FAQ](https://support.serato.com/hc/en-us/articles/10245865629583-3-2-0-DJ-FX-Channel-FX-FAQ) describes a replacement effects engine. Earlier iZotope effects remain associated with 3.1.5 and older; the FAQ explains new advanced-effect access for existing pack owners. This establishes a version transition, not by itself a revoked device entitlement.

The [Inpulse 300 MK2 guide](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide) documents Lite hardware unlocking and a paid Pro upgrade. It also documents expanded pad modes. The connected device and working browser selection are independently established at different evidence levels; neither establishes ownership of every expansion.

Installed 4.0.10.213 has a time-limited trial state. That allows inspection of some controls but is not evidence of perpetual access. Record exact software version, device/firmware, account entitlement and feature state in any future comparison.

## Open Play product requirement

All independently implemented local capabilities belong in the open-source application without subscriptions, trial expiry, paid feature flags or artificial device allowlists. Offline decks, library management, stems, FX, recording and configurable mappings must not require an account. Hardware support is limited by implemented protocols and available testing; it must not be limited by a paid tier.

External music providers remain subject to their own access, playback and recording capabilities. An open-source client cannot promise free provider subscriptions, unavailable APIs, protected-file decoding, or universal hardware compatibility. Show these dependencies plainly and keep local playback usable when providers fail.

Do not alter Serato activation or redistribute its proprietary binaries, DSP, models or assets. Independent equivalents should preserve useful controls and workflows, with original project identity and implementation. Keep any licensed third-party dependency and model-weight provenance in the build decision record.

## Before/after verification template

For each reported regression record: feature; device and firmware; old/new application version; operating system; entitlement state; reproduction actions; observed result; source/screenshot or capture; whether restriction is licensing, technical compatibility, provider policy or unknown; independent Open Play acceptance test. Until both sides are evidenced, label the claim USER-REPORTED or UNRESOLVED.
