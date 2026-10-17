# Desktop 0.1.6 host and ASAR independent review — 17 October 2026

Skills matched (4): use, adversarial-verify, dec-quality-testing, dec-software-principles.

**No blocking host/package regression found in the executed scope. Actual native mapping, reload, storage/audio behavior and title propagation are not established by this review.** The prelaunch criterion here was to extract the actual 0.1.6 ASAR, compare its prototype bytes to the immutable candidate manifest, evaluate the actual main-process source with controlled Electron callbacks, and verify that existing host/dependency/package boundaries remain intact. That bounded criterion executed: **8/8 checks**, with no production edits, UI/device actions, Git commands or prior evidence rewrites.

## Actual packaged identity

- Actual ASAR: `local-evidence/desktop-builds/0.1.6/Open Play Test-darwin-arm64/Open Play Test.app/Contents/Resources/app.asar`, SHA-256 **`f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e`**.
- Extracted provenance identifies immutable source **`dd068e4dc9338d1f4f131e0c64c9195073fbebed`**, host version **0.1.6**, and original HTML approval **`f8b0abf33c8e8468c7bec27eabc5be2930ed0086`** separately. This agrees with `desktop/package.mjs:8` and `:10`; packaging scope explicitly does not award main-app or parity acceptance (`:16`). Both native bundle version fields equal 0.1.6.
- Independently extracted and SHA-256-compared **all 222 prototype files**, with no extra/missing prototype files, against the parent-provided immutable-candidate manifest. The expected source identities come from that manifest; this reviewer did not independently run Git to rederive the candidate tree. All **1,043 actual ASAR files** remain under the declared host/export roots; no `.git`, `node_modules`, `.env` or `local-evidence` path was included. This path inventory is not a general content/privacy audit of every document.
- Actual main/server match the frozen disk bytes, and runtime package metadata exactly matches the sanitized package (build scripts/devDependencies/private fields removed). The newer Key Shift/Video/assignment modules are present, but presence does not execute them.

## Host/dependency findings

**Refuted: this unit changes sandbox, permission or storage authority.** Actual packaged old/new main sources have equal line counts and differ only at title line 7 and About/menu line 34. The server is byte-identical to the reviewed 0.1.5 server, SHA `2326805cd31fc2c0e8ee73a7f559b64eac64b6cef2670caa3dd1f06d30ada4ef`. Actual window callbacks retain `persist:open-play-test`, sandbox/context isolation/web security enabled and node integration disabled (`desktop/main.cjs:15`). Controlled permission checks compare 159 combinations of permission, origin, frame and WebContents ownership against the actual old source. Only the pre-existing MIDI/midiSysex/speaker-selection authority remains allowed for the owned main frame (`:24`–`:26`). This is callback execution, not a real permission-prompt or OS security proof.

**Refuted: the title correction moved back to the wrong event owner.** The version comes from `app.getVersion()` (`desktop/main.cjs:7`), and `page-title-updated` remains bound to BrowserWindow (`:27`). Controlled 0.1.6 and 9.8.7 fixtures both preserve title/About version agreement and call `preventDefault` once. A controlled callback does not establish native event propagation; the parent must observe the launched window title separately. About identifies the seven-character `dd068e4` candidate, retains the original approval and prior 0.1.5, and qualifies native mapping/reload/audio and hardware acceptance (`:34`).

**Refuted: dependency or navigation scope silently broadened.** Version-normalizing only the lock's two root version fields to 0.1.5 reproduces the reviewed prior lock SHA `feae75369bff0f20f43bcc752e68f90248895b192a0bbc5749eb64ef025aedac`. Electron 44.9.0 and packager 20.3.0 remain exact (`desktop/package.json:14`). Actual callback execution denies popup/external navigation, permits the owned origin, prevents a second host/window when the single-instance lock fails, and retains qualified crash recovery copy (`desktop/main.cjs:8`, `:28`–`:30`). Server bytes are unchanged; this unit did not repeat the earlier complete server/security audit.

The original 0.1.5 ASAR still hashes to **`251bcc16caf9cfb42a3967db058717373a8c6fcb9ff97d56c330058ec8301b03`**. All reviewed disk-source, manifest and ASAR identities remained unchanged across these checks. This does not independently verify the parent's profile backup or actual process quit/relaunch; those require their own runtime evidence.

## Retained test history and outputs

The first independent run was **7/8**, retained unchanged as `docs/prototype/desktop-0.1.6-host-independent-results.json` (SHA `ac2e6df05d3fa81eecb34054246a0ce545887a754806d150ab63fab1b7c536b6`). Its single failure was an erroneous reviewer predicate requiring an eight-character About revision abbreviation. The source/provenance identify the correct candidate; the visible About text correctly uses the valid seven-character `dd068e4`. This was not a product defect or a failed native title observation. The new owned test predicate now checks that actual seven-character label; no product bytes or acceptance boundary changed.

Final executed result: `docs/prototype/desktop-0.1.6-host-independent-final-results.json`, **8/8**, SHA **`eb614da117121c12f90ec137f3ab123a039ee929ba1fcaaddfd7993429b90980`**. Owned script `scripts/test_desktop_016_host_review.cjs` SHA **`340d5e794aa222a55695494c372c19e4edcebb18620708f23d817f71326d3952`**. Script syntax was also checked. Results use exclusive creation to avoid replacing existing evidence.

The next authorized path is the parent's actual separate 0.1.6 main-app launch with retained user storage, then visible new MIDI targets/assignment, actual reload and complete audio evidence. Packaging/control-host checks award none of those outcomes, and no full Serato parity, hardware equivalence, production release or native DSP rewrite follows.

Skills applied: use, adversarial-verify, dec-quality-testing, dec-software-principles.
