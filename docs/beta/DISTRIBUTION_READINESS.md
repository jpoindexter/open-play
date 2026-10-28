# Mac beta distribution readiness

Read-only preflight:28October2026. These are private test artifacts, not a published or approved beta. The inspected snapshot was current86and staged87while the Mac was locked; later artifacts require their own receipt and trust checks. This check did not start/stop apps, sign, install, extract a bundle, access credentials/private keys, or submit to Apple.

## Inspected artifacts

| Item | Private0.1.86 | Staged0.1.87 |
|---|---|---|
| Immutable source | `9ef47e3` | `ce1560a` |
| Main executable | Thin `arm64` | Thin `arm64` |
| Declared minimum macOS in Info.plist |13.0 |13.0 |
| Existing archive/source/controlled-host inspection |5/5 |5/5 |
| Protected native paused startup/recovery |Observed in its receipt |Pending manual unlock |
| Signature metadata |`adhoc`; TeamIdentifier not set; Sealed Resources none |Same |
| Strict deep signature verification |Exit1 |Exit1 |
| Gatekeeper execution assessment |Exit1 |Exit1 |

Both verification/assessment failures report: **“code has no resources but signature indicates they must be present.”** Neither artifact passes public distribution trust checks. Local startup is not evidence that a quarantined download installs or launches successfully. The builder explicitly uses `osxSign:false`.

Apple Silicon is the only inspected architecture. No Intel/universal support is established. The13.0 plist floor is package metadata, not proof that the app works across all macOS13+ releases; publish only the support range actually checked.

## Tool/signing availability

| Read-only command | Result |
|---|---|
| `lipo -archs <app executable>` |Exit0; `arm64` for86and87 |
| `codesign -dv --verbose=4 <app>` |Exit0; metadata above |
| `codesign --verify --deep --strict --verbose=2 <app>` |Exit1; resource-signature error above |
| `spctl --assess --type execute --verbose=2 <app>` |Exit1; same error |
| `security find-identity -v -p codesigning` |Exit0; **2 valid Developer ID Application identities** returned |
| `xcrun --find notarytool` |Exit0; tool available |
| `xcrun notarytool --version` |Exit0;1.1.3(42) |

Identity names/hashes and keychain details were neither printed nor saved. The count does not establish permission to use a particular identity, usable private-key access, the correct team, or configured/working notarization credentials. No Apple account, signing or notarization transaction was attempted.

## Remaining release gates

- Produce one immutable beta artifact containing the chosen reviewed fixes. The current staged87does not automatically include later working-tree changes. Keep every DJ control/layout and library waveform preview; do not silently cut functionality during packaging.
- Choose the authorized signing/distribution identity and trust path. Sign the final nested code/resources consistently, then verify the actual distributed artifact and its notarization/stapling outcome. These private ad-hoc artifacts are not that release candidate.
- Document supported macOS/architecture and an actual install/update/uninstall procedure. The current packager produces an `.app` directory; a consumer installer/archive and update path are not established by its receipts.
- Execute a clean download/install/first-launch/import check on a fresh machine or fresh user profile. Existing developer-profile upgrades do not cover quarantine prompts, permissions or a new library.
- Observe restart and backup/restore behavior using the actual beta artifact. Retain a recovery copy and verify the update does not erase imported audio, metadata, cues or session state. Native failed-save/retry and interrupted-write breadth remain open.
- Verify rollback to the retained known candidate with the documented profile-recovery boundary. No automatic updater/rollback mechanism is established by the inspected private packaging path.
- Include a short first-mix guide, known issues and a working bug-report route. Keep physical controller/headphone/master claims scoped to their actual acceptance. Owner release approval is still required before publication.

No fresh clean-machine, public-download, update/uninstall, notarization, Gatekeeper-success or post-update listening acceptance is claimed. No new bundle or installer was created.

## Evidence

- [Public beta plan](../delivery/PUBLIC_BETA_PLAN.md)
- [Current core re-entry](../prototype/CORE_DJ_REENTRY_2026-10-28.md)
- [86package receipt](../prototype/desktop-0.1.86-playback-package.json), [86inspection](../prototype/desktop-0.1.86-playback-inspection.json), [86native recovery](../prototype/desktop-0.1.86-playback-native.json)
- [87package receipt](../prototype/desktop-0.1.87-playback-package.json), [87inspection](../prototype/desktop-0.1.87-playback-inspection.json), [87staging boundary](../prototype/DESKTOP_087_STAGED_2026-10-28.md)
