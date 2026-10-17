# Video per-file identity dependency and implementation review

Executed 2026-10-17, approximately06:57–07:02UTC. This is a bounded dependency/identity prerequisite for real per-file Video FX save/recall. It does not establish preset-store/UI integration or Serato behavior. No native application work, root package change, Git operation or remote project mutation was performed in this slice.

## Dependency selection and supply-chain evidence

Selected exact stable registry version `@noble/hashes@2.4.0`, independently retrieved from [official npm metadata](https://registry.npmjs.org/@noble/hashes/2.4.0). [Official upstream documentation](https://github.com/paulmillr/noble-hashes) describes incremental SHA256 `create/update/digest`. Original LICENSE in the tarball is MIT, copyright2022 Paul Miller. Package dependencies are absent: zero runtime package dependencies.

Downloaded official tarball was167626 bytes. Its computed SHA512 exactly matched registry integrity and computed SHA1 exactly matched registry shasum. SHA256: `e1946149b780017b2564fcc092cb01c04e1d7f20627d0296c17da8868f4436dc`. Tar archive members were checked for package prefix, parent traversal and symlinks/hardlinks before extraction into ignored evidence. Vendored only the four-module `sha2.js` import closure plus original LICENSE/package.json and provenance. Upstream bytes remain unchanged. All per-file hashes are in [vendor provenance](../../prototype/vendor/noble-hashes/PROVENANCE.md).

Integrity proves correspondence to the registry's fetched metadata, not independent signer identity. Registry signature/SLSA attestation and the registry-reported Git commit were not cryptographically verified. No claim is made that release2.4.0 itself underwent a reviewed third-party audit. No build/install/lifecycle scripts ran.

## Executed known-advisory scans

Created only `local-evidence/npm-identity-audit/package.json` and exact-version lockfile; this entire temporary project is ignored. Installed no application dependency into the root project. Tools: Node22.23.2, npm10.9.8, OSV Scanner2.4.0 / SCALIBR0.4.5. Commands, run from that ignored directory:

```sh
npm install --package-lock-only --ignore-scripts --no-audit --no-fund --save-exact --registry=https://registry.npmjs.org
npm audit --omit=dev --json --registry=https://registry.npmjs.org
npm audit --json --registry=https://registry.npmjs.org
osv-scanner scan source --lockfile=package-lock.json --format=json --all-packages --no-call-analysis=go --no-call-analysis=rust --output-file=osv-audit.json
```

All three scans exited0. Both npm audit reports contain an empty vulnerabilities object and total0. OSV lists exactly `@noble/hashes@2.4.0` from the exact lockfile, with no vulnerability entries. No development/transitive runtime packages exist in this test dependency tree. The four vendored runtime modules are reachable through the identity worker's incremental SHA256 call; unused algorithms within those modules are not invoked by this feature. No automatic remediation or unrelated package upgrade was attempted.

Limits: advisory-database snapshots only, not detection of unpublished vulnerabilities/backdoors; no full upstream test suite, formal cryptographic audit, browser bundle SAST, signer/attestation verification or upstream source/build reproducibility proof. Refresh scans when updating or preparing a release. The prototype runtime loads same-origin local JS modules and makes no online identity service call.

## Identity API and integration boundary

`videoFileIdentity(file, {signal, onProgress}={})` returns a Promise of `sha256:` plus64 lowercase hexadecimal characters. Accepts an actual Blob or File using native Blob intrinsic brand/read methods. Filenames, MIME type and timestamps never enter the digest. No cache. Equal bytes under a new name retain identity; changed bytes with the same name differ.

Each request creates one dedicated module Worker. Core reads one real Blob slice of at most1048576 bytes at a time and updates a persistent incremental hasher; it never asks for the whole file's arrayBuffer. No arbitrary product file-size limit; native Blob offsets/sizes must remain exactly representable safe integers. This is a bounded-read algorithm claim, not a measured browser heap ceiling or throughput guarantee. Small files naturally fit within one slice.

`onProgress({loaded,total,ratio})` receives fresh finite numeric data, first0 bytes and then every completed slice; ratio is loaded/total, or1 for the empty file. Main wrapper validates monotonic worker byte progress against the real file size. Completion requires final byte progress and a correctly formed digest. Callback errors reject that owner and terminate its worker.

Abort before start or during a request rejects `AbortError`; the wrapper removes the abort listener, nulls handlers and terminates its owned worker exactly once. Late messages cannot resolve or update the old owner. No main-thread hashing fallback: missing Worker rejects with code `VIDEO_IDENTITY_WORKER_UNAVAILABLE`. Worker startup/load/read/protocol errors reject visibly. Module import and a running same-origin local server are required.

Parent integration must retain its own slot/load generation checks after awaiting identity. Abort on replacement/disposal, and verify the currently loaded asset again before save or recalled-FX assignment. Identity alone does not authorize stale-owner mutation. Index only when save/recall/known-record lookup requires it; do not block every unrelated load. Never persist raw media bytes, runtime Worker/AbortController handles or progress data as preset metadata.

## Executed test evidence

`node scripts/test_video_file_identity.mjs`:13/13 groups passed. Actual Node Blob/File core tests include published empty/abc/quick-brown-fox vectors, independent Node crypto across SHA block and1MiB chunk boundaries, rename/changed-byte identities, real intrinsic brand rejection of duck/prototype spoofs, own method override rejection, instrumented intrinsic slice reads of exactly1MiB/1MiB/1MiB/9 bytes, finite progress, abort and retry. Controlled Worker tests cover module request shape, termination/handler cleanup, late message isolation, startup/error/protocol failure, callback failure and pre-abort. Controlled Worker is not actual browser execution.

Initial run12/13 is retained in ignored evidence: the test incorrectly assumed Node's Blob intrinsic rejects a Proxy forwarding to a real Node Blob. This Node implementation accepts that forwarding and hashes the genuine bytes. The test was corrected to assert meaningful duck/prototype spoof rejection; production brand handling was not weakened or changed. Browser WebIDL proxy behavior is not inferred from Node.

New public [actual Worker harness](../../prototype/video-file-identity-harness.html) has10 checks for real browser module workers, generated Blob/File vectors, multichunk oracle, concurrency, mid-file abort/no late progress, retry, pre-abort, forged Blob rejection and callback cleanup. Parent browser execution is pending at this file's writing. Parent must preserve raw failures before repair. No actual per-file save/recall or UI preset persistence acceptance is claimed.

Syntax checks passed for the three production identity modules and harness. No whole-library/native acceptance claim follows.

## Raw evidence location and hashes

Local raw evidence lives under ignored `local-evidence/npm-identity-audit/`; it is not shipped or exposed by the prototype server. Exact fetched tarball, extracted package, lockfile, audit JSON/stdout/stderr and Node results remain there for local review. Hashes:

| Artifact | SHA256 |
|---|---|
| `registry-latest.json` | `f335f4cd79ac84185b74e6fad9439ebbfb29c96fdb101fbfd99e729cd5fbe2c8` |
| `package-lock.json` | `a70c459a8ab3806555d611bb4545ef2e5d86a0cf2725bd9335abe9f8710113a6` |
| `npm-audit-runtime.json` | `846fc260eb0bf70e6b21419d4cab9fcc61c224c7362324d4cbc8aebf8355f9bd` |
| `npm-audit-full.json` | `846fc260eb0bf70e6b21419d4cab9fcc61c224c7362324d4cbc8aebf8355f9bd` |
| `osv-audit.json` | `201e2fa6d53dfe2e23ec0641dacb161a82585540904702481436803de2123957` |
| `node-identity-initial.json` | `c555f602824743c87b8d5b02a897a84a6c3ba260410a04fb59463860947ac7ba` |
| `node-identity-results.json` | `997131cce8534a23778586be4aa5eb59a6d8bfabe1c168f07e920a061fa7f2d7` |

Skills applied: use, dependency-audit, dec-software-principles, dec-quality-testing.


## Parent actual browser execution — 2026-10-17

The parent executed the public identity harness in the in-app browser:10/10 actual
module Worker checks, preserved in docs/prototype/video-file-identity-browser-results.json.
A separate actual per-file harness15/15 and main UI save/import/reload/recall checks
are recorded in docs/prototype/VIDEO_FILE_FX_REVIEW.md. Those behavioral results
supplement the narrower Node/advisory scope above; they do not establish security,
very large file performance, vendor metadata interoperability or native acceptance.
