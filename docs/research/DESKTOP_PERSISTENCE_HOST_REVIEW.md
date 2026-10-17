# Desktop persistence test host: independent review

2026-10-17. The parent requested a bounded review of 0.1.4, then changed the final candidate to **0.1.5** after an actual native title failure. The existing interface/audio implementation remains source commit `48a6d4dad2f217a8ba166b9ca890a287aabc4feb`; original approved HTML baseline `f8b0abf33c8e8468c7bec27eabc5be2930ed0086` remains separately recorded. No production, dependencies, prior tests/results, Git, GUI, or devices were changed by this reviewer.

## Final executed result: 10 checks pass

`node scripts/test_desktop_persistence_host_review.cjs` executes **10 passing, 0 failing** checks for actual 0.1.5 ASAR bytes and controlled host callbacks. Exact stdout is `docs/prototype/desktop-0.1.5-host-independent-results.json`.

This is package/host evidence. It does **not** establish native page-title propagation, actual permission prompts, imported-audio quit/reopen/playback, correct physical outputs, or full parity. Those real application paths remain the parent's runtime acceptance. No new dependency audit was performed or needed for this bounded change.

## Retained actual 0.1.4 title failure

The parent reported that actual 0.1.4 process 42963 was launched from the correct bundle and displayed the persistence footer/eight restored 44,100 Hz tracks, but its AX native window title remained **“Open Play — DJ prototype.”** The reviewer did not operate or directly observe that UI. This parent-observed result defeats a claim that locally invoking the WebContents handler proves native title freezing.

The installed Electron 44.9 declaration distinguishes the two event namespaces: `desktop/node_modules/electron/electron.d.ts:4980–4984` explicitly says BrowserWindow `page-title-updated` plus `preventDefault()` prevents native title changes; `:17867–17870` describes the WebContents event without that promise. The parent moved the handler to BrowserWindow and preserved the failed 0.1.4 bundle while creating 0.1.5.

The first controlled review had invoked the old WebContents callback and observed its local `preventDefault` call. That was insufficient native acceptance. It also had one reviewer fixture error: ASAR `statFile` needs paths without the leading slash returned by `listPackage`; the fixture initially passed the slash. That error is not a missing packaged file. Initial 9-pass/1-fail output is preserved as `docs/prototype/desktop-0.1.4-host-independent-initial-results.json`, including its original limited scope. The revised mock records **separate BrowserWindow and WebContents listener maps** and requires the BrowserWindow binding. It explicitly reports `nativeTitlePropagationProven: false` even when that source-level callback check passes.

The reviewed 0.1.4 ASAR hash was `ba6e76a69958bc2e9ed5b04f6e30f94c3e2216b7ea3cfa7f0f9a1dae2aba897a`, and its packaged main hash was `0fb2e9c491d14e8d820997f359e0908b5b6b14aa5f9b16be14f9bc6d3396c7cc`. Its bytes are not regraded against newer 0.1.5 disk source.

## Actual 0.1.5 host and package checks

| Check | Executed evidence |
| --- | --- |
| Renderer isolation | Actual packaged main evaluated in controlled Electron host: sandbox/context isolation/web security enabled, Node integration disabled, same `persist:open-play-test` partition and loopback prototype origin. Source: `desktop/main.cjs:14–16`. |
| Permission boundary | Only MIDI, coarse MIDI-SysEx and speaker-selection on owned main frame; foreign origins/frames/contents and nine other permissions denied. Forty-two permission-check truth cases equal the actual packaged 0.1.3 host. Source: `:24–26`. This tests callbacks, not actual prompts or permitted SysEx transmission. |
| Title/version | `app.getVersion` fixtures 0.1.5 and 9.8.7 produce corresponding window/About titles. BrowserWindow event binding exists and locally calls `preventDefault`; WebContents does not own that handler. Source: `:7,16,27,34`. Native propagation remains unproved by this test. |
| Navigation/crash scope | Popups/external navigation denied; same-origin navigation retained. Crash copy says saved imports will be checked and originals retained, rather than claiming guaranteed recovery or mandatory reimport. Source: `:28–30`. |
| Single instance | Failed single-instance lock quits without starting another host or window. Source: `:8–9`. |
| Dependency graph | Package and lock versions are 0.1.5; exact pins remain Electron 44.9.0 and packager 20.3.0. Normalizing **only** the two root lock version fields back to 0.1.3 reproduces the exact previously reviewed lock SHA-256 `00750a039bd3271ef4443769826cc5b7d3fc61b776bb2675e2fcc5225677c99e`. All dependency resolution content is unchanged. |
| Provenance/version | Actual extracted `BUILD_PROVENANCE.json` separates original approval, reviewed source and host 0.1.5. Actual bundle Info.plist `CFBundleVersion` and `CFBundleShortVersionString` are both 0.1.5. |
| Prototype bytes | All **200** actual packaged prototype files match every expected hash in the parent's immutable-candidate `desktop-0.1.5-package-inspection.json`; actual ASAR listing has no extra prototype files. This includes storage module/harness plus app/engine/panels. The reviewer uses that root-generated Git-comparison manifest as the expected evidence ledger and executes no Git command. |
| Host/runtime metadata | Actual packaged main/server equal current reviewed disk bytes. Server is also byte-identical to actual 0.1.3 packaged server. Packaged package.json equals the exact expected sanitized JSON bytes after only build fields `devDependencies`, `scripts`, `private` are removed. |
| Stability | Actual ASAR and main source hashes stay unchanged throughout these checks. |

The preserved 0.1.3 test and its result were not rerun or overwritten. The new test evaluates **the target ASAR's actual main source**, avoiding an old-bundle/new-disk callback mismatch. The root-generated immutable-source manifest is independently checked against every extracted byte; it is not an independently executed Git retrieval by this reviewer.

No additional defended host/package defect was observed in these bounded 0.1.5 checks. Existing actual runtime evidence from 0.1.1/0.1.3 remains historical and does not become new 0.1.5 persistence/device acceptance merely through packaging or unchanged callbacks.

## Snapshot

| Artifact | SHA-256 |
| --- | --- |
| 0.1.5 ASAR | `251bcc16caf9cfb42a3967db058717373a8c6fcb9ff97d56c330058ec8301b03` |
| Actual 0.1.5 main | `32c30cab2ee181e1dc219653e802b42d07b30c1ed6f36edd66879813641787a4` |
| Unchanged server | `2326805cd31fc2c0e8ee73a7f559b64eac64b6cef2670caa3dd1f06d30ada4ef` |
| Packager source | `a1d4829715c3cd6b260bac32f92e91a5e72aa6414c8aa7ba0e482f0b461146ad` |
| Current 0.1.5 lock | `feae75369bff0f20f43bcc752e68f90248895b192a0bbc5749eb64ef025aedac` |
| Owned independent test | `aff18a2ca09d864e1b27de12c7894a3a3b7082d9319bb82f773d787d8cbd775e` |
| Final 0.1.5 result JSON | `7312e2a8d8e34235e18358bfe571fb38746b4e346fcdf97c03a10783172e2ded` |
| Retained initial 0.1.4 result | `791905d8c94d2ae34d0eace561051f7e7a0f98857425bb6efd23c65f61867659` |

Actual 0.1.5 native title observation and complete import→quit→reopen→load→audible-play remain separate parent-run gates. This review neither substitutes mock evidence for them nor asserts full application acceptance.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.
