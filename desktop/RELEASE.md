# Public Mac preview release

The public channel is **Open Play Preview**: a separate app identity, profile,
partition and loopback port18776. Private Playback Test builds keep port18775
and their existing library. Preserve every control, layout and waveform preview.

This is a maintainer procedure, not a fresh-clone one-command build. The current
packager requires its independently hashed, generated auto-gain WAV fixtures.
Install the pinned desktop dependencies with `npm ci --prefix desktop` first.
No original songs, credentials, profiles, recordings or local evidence belong
in a release. Original source is MIT; third-party terms remain in force.

## Prepare immutable source

1. Read the current handoff/known issues. A public preview is not stable-release,
   musical, physical-controller or full vendor-parity acceptance.
2. Retain the running app and profile recovery. Review and remove only inactive
   generated packages before creating another full bundle.
3. Commit and push the approved source. Set a new numeric public version in the
   packager and matching inspector; never overwrite an existing artifact.
4. Build and inspect from the repository root:

```sh
node desktop/package-playback.mjs --public-preview
node scripts/inspect_playback_package.mjs 0.1.152 public-preview-inspection
```

## Sign, notarize and seal

Use an existing valid **Developer ID Application** certificate by exact SHA1
because duplicate common names can select the wrong identity. The signing tool
uses hardened runtime, secure timestamps and only the JIT entitlement needed by
Electron/V8. Browser sandboxing and the existing device-permission policy remain.
Never export private keys or put credentials in Git, shell arguments or logs.
Use a securely configured `notarytool` Keychain profile for the same team.

```sh
node desktop/preview-installer.mjs prepare 0.1.152 CERTIFICATE_SHA1
xcrun notarytool submit local-evidence/releases/0.1.152/Open-Play-Preview-0.1.152-arm64.dmg --keychain-profile PROFILE --output-format json > local-evidence/releases/0.1.152/submission.json
xcrun notarytool wait SUBMISSION_ID --keychain-profile PROFILE
node desktop/preview-installer.mjs finalize 0.1.152 PROFILE
```

Save the returned submission ID; wait for that request instead of uploading
duplicates. `finalize` requires Accepted, no reported issues and Apple's exact
submitted SHA256; it staples and validates the DMG, assesses Gatekeeper and writes
final checksums. Do not bypass a rejection or publish a notarization claim early.
Electron/Chromium sidecar notices are copied into the app before signing, so
dragging it to Applications retains them. Root MIT/NOTICE and vendored terms are
also preserved in the archive.

## Verify and publish

- Mount the exact DMG read-only; install to an absent destination, preserving the
  running private app. Check signature, Gatekeeper, app identity and ASAR hash.
- With output muted, use the actual native app for fresh first launch, two owned
  local imports, normal quit/restart and stopped persistence. Record gaps without
  substituting archive or browser checks for native behavior.
- Publish a GitHub **prerelease** with a versioned tag, the finalized DMG and
  SHA256SUMS. Include architecture, installation, known issues, source revision,
  profile separation and listening/controller limits. Read back public downloads
  and compare the remote asset digest to the actual local artifact.
- Update README, the live manual and the existing release/provenance cards.
  Keep broad hardware, updater, listening and parity criteria open.
- Remove temporary mount/staging/download copies; retain only the current private
  app and public candidate, release artifact, bounded receipts and recoveries.

Signing/notarization verifies distribution trust; it does not prove DJ audio quality.
