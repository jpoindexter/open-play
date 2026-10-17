# Desktop local host: bounded independent review

2026-10-17. The user approved a desktop test of HTML revision `f8b0abf33c8e8468c7bec27eabc5be2930ed0086`. This review covers the new local HTTP host plus source inspection of its Electron launcher/packager. It does not change approved prototype assets, architecture, or production host files.

## Executed result

`node scripts/test_desktop_server_review.cjs` executes **11 passing checks, 0 failing** on actual Node HTTP sockets bound to ephemeral `127.0.0.1` ports. Exact output is saved in `docs/prototype/desktop-host-server-review-results.json`. The tested server source hash is `2326805cd31fc2c0e8ee73a7f559b64eac64b6cef2670caa3dd1f06d30ada4ef`; it remained unchanged throughout that run.

The integration creates isolated temporary assets, private sibling/outside-root sentinels, real filesystem symlinks, and an actual optional upstream HTTP server. It removes its fixtures and closes sockets afterward. It does not run Electron or inspect the packaged application.

| Boundary | Actual observed result |
| --- | --- |
| Bind/authority | Server binds `127.0.0.1`; wrong Host, external Origin, `Origin: null`, and genuinely empty Host return 403. Exact expected Origin succeeds. |
| Static allowlist | Prototype index, docs, handoffs, README and an allowed-to-allowed symlink succeed. Root redirects to `/prototype/`. Direct private, outside-root symlink, malformed escape/NUL, and traversal outside served folders are denied. |
| Encoded traversal | `/prototype/..%2fprivate/secret.txt` returns 404, with no sentinel bytes. |
| Internal symlink | `/prototype/private-link.txt` pointing to a disallowed sibling inside overall root returns 404. |
| Methods | POST, PUT, DELETE and OPTIONS on static assets return 405. |
| Headers/MIME | Correct inline-script SHA-256 appears in CSP; `nosniff`, `no-store`, JavaScript and WASM content types are observed. HEAD declares exact file length and returns no body. |
| Ranges | `2-5`, `12-`, `-4`, and clipped `0-999` return 206 and exact bytes/Content-Range/length. HEAD range declares four bytes and returns none. Seven invalid/unsatisfiable ranges return 416 with `bytes */16`. Empty file returns zero bytes and its range fails 416. |
| API forwarding | An actual 44-byte POST reaches only the stub upstream with unchanged bytes/query, expected authority/Origin/token, forced WAV content type, and status 202. Upstream 404 is preserved; permitted DELETE reaches it. |
| API admission | Missing mutation tokens, unsupported method/route, zero/43/134,217,729 declared-byte uploads are rejected before upstream forwarding. Invalid upload lengths return 413. |
| Optional API unavailable | Connection refusal returns explicit JSON 503; static JavaScript still serves 200. |
| Optional API truncation | A real upstream sends a partial declared response then destroys its socket. The isolated child observes no uncaught exception, client response aborts rather than pretending completion, and static service continues 200. |

These are executed HTTP/filesystem outcomes, not only mocked route conditions. The truncated-response child installs an exception observer to capture a possible escaped error as a test failure; its final observed array is empty. It does not turn a real unhandled error into a passing result.

## Source candidates corrected before first independent execution

The initial source inspection found two concrete code paths worth testing: decoded-prefix permission before canonical resolution could admit an encoded traversal/internal symlink into a disallowed sibling, and the proxy initially lacked upstream-response `error`/`aborted` handlers. The parent added canonical served-folder/root-file validation and reply-error cleanup before this review's first integration execution.

The corrected implementation is at `desktop/server.cjs:36` (canonical allowlist) and `:25` (upstream response failure handlers). The actual tests verify the corrected outcomes. **This reviewer did not execute a failing old-server reproduction**, so those candidates are not represented as independently observed pre-fix failures. No reconstructed legacy server was run, and no fabricated initial red artifact is claimed.

The first integration run on the already-corrected server had two fixture failures, resolved in the test rather than production: Node automatically replaced an empty Host header with its valid default authority; a deliberately incomplete 43-byte body plus keepalive contaminated a subsequent synthetic request. The test now disables automatic Host injection, uses isolated connections, and actually sends the 43-byte invalid fixture. The final eleven cases pass. These fixture errors are not desktop server defects.

## Launcher/packager source inspection

Code-path observations only:

- `desktop/main.cjs` creates the window with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and `webSecurity: true`; denies new windows/external navigation; limits its permission callbacks to owned-origin standard MIDI. Actual Electron permission and controller operation remain the parent's GUI/device test, not established here.
- `desktop/package.mjs:8–14` stages an archive of the explicit approved revision for prototype/docs/handoffs and three root Markdown files, copies host files separately, and writes build provenance. It requests Electron `44.9.0`, ASAR, no overwrite, and no signing. This review did not execute its archive/build or verify packaged asset byte parity.
- Reading the installed package manifests confirms Electron **44.9.0** and `@electron/packager` **20.3.0** are present. This does not establish the runtime version of a previously built bundle.

No remaining defended server defect was observed in this bounded suite. Passing localhost server checks do not establish packaged startup, retained localStorage, import/export dialogs, controller permissions/operation, headphone/master routing, playback audio, latency, musical quality, or full parity. The parent is conducting the actual desktop/hands-on acceptance. No public release, signing, or distribution is implied.

## Snapshot hashes

| File | SHA-256 |
| --- | --- |
| Executed server | `2326805cd31fc2c0e8ee73a7f559b64eac64b6cef2670caa3dd1f06d30ada4ef` |
| Inspected launcher (parent may continue editing) | `37709a166139516684e7f747555dead331f5179ac1dc714f8aec86492ff938a4` |
| Inspected packager | `fabca095295833b6bc6080a6b080d2506611c6380073b2d20bc06186f5b180b2` |
| Desktop package manifest | `59c53794a4788160263bc4072249e634bb70c76789b82f1e3038fbcaeaf1c4fb` |
| Independent integration test | `72edb5adfa8963ce6761d6ce85ce8f80854a40f7d9517bd6a79599529026fd7a` |
| Final executed result JSON | `2d22c18dc0fdeec929a5a8e5be210ca296658db469ac00e1f1dcb7adb96e8fc5` |

Only the new owned test, this report and its authorized raw result were written; temporary test fixtures were removed. No GUI, remote, Git, or existing-file edits by this reviewer.

Skills applied: dec-quality-testing, dec-software-principles, adversarial-verify.
