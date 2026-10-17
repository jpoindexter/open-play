# Vendored noble-hashes SHA-256 module closure

Retrieved 2026-10-17 from the official npm registry. Exact package: `@noble/hashes@2.4.0`, MIT, no runtime package dependencies. [Upstream](https://github.com/paulmillr/noble-hashes), [exact registry metadata](https://registry.npmjs.org/@noble/hashes/2.4.0), [tarball](https://registry.npmjs.org/@noble/hashes/-/hashes-2.4.0.tgz).

Tarball: 167626 bytes; SHA256 `e1946149b780017b2564fcc092cb01c04e1d7f20627d0296c17da8868f4436dc`.

Registry SHA512 integrity (verified against downloaded bytes): `sha512-X5XaVWZIBCT7HHZGm5I7ZQXDwLG+bGXuSrMQAW+7Zvl87h1kmc1ZB1VSRJcpUfoUrGQp4Fkoxm5kZ+Ms+aW+eA==`.
Registry SHA1 (also verified): `e6a3e98edbed3c8659b28bb8f9b18ca02ec8ea4b`.
Registry-reported gitHead: `663c2aeeffc308ac0cded59bd32f7c212adacfc2`; not independently matched to Git contents or a verified signature/attestation.

The six upstream files below are byte-for-byte copies extracted from that integrity-checked tarball. No edits, bundling or generated replacement crypto. `sha2.js` imports `_md.js`, `_u64.js` and `utils.js`; those files close its relative import graph. Unused functions within these four upstream modules remain intact. Other algorithms, tests, TypeScript declarations, build/dev tooling and upstream source tree are not vendored. Original package.json is retained for version/license provenance; its build/test scripts were not run, and some exports refer to intentionally unvendored files. The application imports only `sha2.js` through a relative local module path.

| Upstream file | Bytes | SHA256 |
|---|---:|---|
| sha2.js | 18997 | `471746bba6ec4c6238ca41358d1d3b40b6ff31cf3363f0b4d550c649c1a8e83b` |
| _md.js | 9175 | `60cf3010fda89e3e4d3f0e7ff1ce249e9c467f34b4fd41b6fd6101d9f69be763` |
| _u64.js | 4794 | `b09da8c07fe8187c07649494cdb7cd0bcf13df90b506a9473d19e4d5f8c2e102` |
| utils.js | 26035 | `037ad49adb78168b6b699598fd33f85f7877456b1d28b4d032e2a1a16807947c` |
| LICENSE | 1109 | `4f221aee6e072336700c408c68ab3b96a3fc09f6aebe6f48f1bd99e5ef13faec` |
| package.json | 2583 | `3e361734f5269de162fa362483d7f45dee7efb533ec217157945338f7591baaf` |

Known-advisory scans of an ignored exact-version npm lockfile on 2026-10-17: npm10.9.8 runtime/full both0 findings; OSV Scanner2.4.0 exact lockfile scan reported this package and no vulnerabilities. These are database snapshots, not proof of absence of vulnerabilities or a new cryptographic audit of release2.4.0. See [review](../../../docs/research/VIDEO_IDENTITY_DEPENDENCY_REVIEW.md).

Runtime behavior: local module Worker hashes real Blob/File data in1MiB slices with incremental `sha256.create().update().digest()`. No online hashing service, main-thread hashing fallback or npm install is needed by the prototype.
