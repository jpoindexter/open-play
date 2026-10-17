# Desktop cue host independent review

2026-10-17. Review limited to desktop 0.1.2/0.1.3 host callbacks, packaging source/provenance and the actual local ASAR. No GUI, hardware, native launch, production edits, commits, or unchanged HTTP-server test reruns.

## Final result: 0.1.3

**Nine of nine controlled/packaging checks passed.** Final host SHA-256: `7db5b1c815ca49f2d9125c941f46e7bf5f90a03460dc5116edcc85c21aed1469`. Final actual ASAR SHA-256: `cd9577b63de60caadcf2b4df70caea8c20daaaac22066ea7690b36ad99f98966`. All 197 prototype files still match a8fe82e. Both host code files and normalized runtime package metadata match current 0.1.3 source.

The parent fixed the permission boundary and retained the old 0.1.2 bundle. Both callbacks now require `details.isMainFrame===true`; requests additionally require an owned `details.requestingUrl`. For each of MIDI, MIDI SysEx and speaker selection, eight malformed/missing/foreign/subframe cases were rejected; authorized owned-main-frame requests passed. No unresolved defect established in this bounded review.

## Historical confirmed issue: 0.1.2, resolved in 0.1.3

Eight of nine checks passed before the fix. One defense-boundary issue was confirmed in reviewed `desktop/main.cjs` SHA-256 `17425ab59fae9d787396a4dab6301b853fa145eafc3063697b09901e2fafc6c7`:

- **Executed controlled callback, resolved afterward:** `desktop/main.cjs:25` ignores the fourth permission-request `details` argument. With owned top-level webContents and a foreign `details.requestingUrl`, its callback grants `speaker-selection`. The permission-check callback separately rejects foreign origins (`desktop/main.cjs:24`), but the request callback does not independently enforce the requesting frame origin. Installed Electron types document `PermissionRequest.isMainFrame` and `requestingUrl` at `desktop/node_modules/electron/electron.d.ts:11267–11278`. Require the requesting URL to match the owned origin, and restrict device permissions to the main frame for this app's main-renderer-only use.

This is an executed permission-handler boundary, **not an exploit demonstration**. The app's CSP and Chromium permission policy may prevent a foreign frame from reaching it. It does not grant microphone, camera, USB, HID, or arbitrary permission names. The same ignored-details behavior also predated this cue change for MIDI categories.

## Packaging evidence

- **Executed actual ASAR extraction:** all 197 prototype files match immutable candidate `a8fe82e3651757b4661eb5f7122603224e859552`, including `audio-monitor.js`, `audio-output.js`, and `engine.js`. No missing new module established.
- **Executed actual provenance:** `BUILD_PROVENANCE.json` distinguishes that implementation candidate from original approved baseline `f8b0abf33c8e8468c7bec27eabc5be2930ed0086`, host version `0.1.3` on the final reviewed bundle, and local-only unverified physical-audio scope.
- **Executed actual host comparison:** packaged `main.cjs` and `server.cjs` bytes match reviewed files. Five runtime package metadata fields match current `package.json`. Packager strips build-only fields (`private`, scripts, devDependencies); that is expected normalization, not stale packaging. An initial byte-for-byte package metadata assertion was corrected for this reason.
- Historical 0.1.2 ASAR SHA-256: `fcd8b5f390627c1ead43a9d5b9f56c17dbe65fc9b3fef3138b1f72e756fd24c2`. The final 0.1.3 hash is above.
- **Executed controlled callbacks:** sandbox, context isolation, web security, disabled Node integration, exact permission-name allowlist, foreign webContents rejection, popup denial, and foreign top navigation prevention passed.
- **Executed lock comparison:** final package and lock version are 0.1.3; exact development dependencies remain Electron 44.9.0 and packager 20.3.0. Parent-saved all-dependency and runtime-only audit reports show zero findings. This review did not rerun the audit or claim general absence of vulnerabilities. Electron is a build dependency but its runtime is shipped in the app, so its security relevance must not be dismissed as dev-only.

## Reproduction

Run `node scripts/test_desktop_cue_host_review.cjs`. It evaluates the actual host with controlled Electron callbacks, then extracts the actual ASAR and compares package contents to the immutable Git candidate. No app launch or device operation occurs. Source hashes delimit the reviewed candidate.

Evidence: `docs/prototype/desktop-cue-host-independent-results.json`; retained permission failure: `desktop-cue-host-permission-failure-results.json`. Initial assertion-development output is retained separately in `desktop-cue-host-initial-review-results.json` and must not be counted as a second app defect.

Final-host ASAR comparison after the fix was executed and passed. Remaining real paths: actual native startup, actual speaker selection and permissions, native cue capture, and physical socket/latency testing. A green callback or ASAR test does not establish these.

Skills applied: use, adversarial-verify, dependency-audit.
