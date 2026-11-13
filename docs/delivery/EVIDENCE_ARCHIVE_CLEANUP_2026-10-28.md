# Old evidence cleanup — 28 October 2026

Removed the unpacked copies of **34 old recovery snapshots and 33 large diagnostic JSON files** after lossless archiving and byte verification. Net file allocations decreased by **1,746,845,696 bytes (1.75 GB / 1.63 GiB)**. This is allocation accounting, not a measured APFS free-space delta. Archives stay ignored in their existing evidence folders; no large data is added to Git.

Every profile file was read from its new tar archive and checked against the source SHA256 before source removal. Every JSON archive was decompressed and checked against the source SHA256 before source removal. Unchanged sources were rechecked immediately before removal. One snapshot that did not shrink was left unpacked. Archive hashes and exact paths are in the [receipt](evidence-archive-cleanup-2026-10-28.json).

Current **0.1.83** remains the only generated app bundle. Its ASAR hash is unchanged: `87d49158a2522bb83f473f5c48a4711abb59740273deca76eea002042ab84dfe`. All **241 latest closed-82 recovery files** match their pre-cleanup hashes and remain unpacked in `local-evidence/package-083/closed-82-profile`. The active Application Support profile was outside the cleanup scope; no app input, playback, reload or recording command was sent. Original music, recordings, custom controls, previews, runtimes, model weights and toolchains were not cleanup targets.

No Open Play names were found at the inspected top levels of Downloads, Applications or user Applications; no matching packaging stage was found in the current macOS temporary directory. Downloads top-level names, sizes and mtimes match before/after. Unrelated downloads were preserved. Previous generated-build removal is recorded separately in [build cleanup](BUILD_CLEANUP_2026-10-27.md).

## Restore historical evidence

The receipt maps each old path to its adjacent `.tar.gz` or `.gz` replacement. Historical inspectors that expect an unpacked path need that item restored first. Do not run an inspector against a missing original and interpret it as a product failure.

For a JSON file, use Python `gzip.open(archive, 'rb')` or `gzip -dc archive.gz` to read it. To recreate its original path, decompress to a new file only after checking that the destination is absent; check its SHA256 against `sourceSha256` in the receipt.

For an old recovery snapshot, extract its adjacent `.tar.gz` into a new empty directory with `tar -xzf archive.tar.gz -C restore-directory`. The archive contains the original snapshot's directory name. Do not extract over the live profile. Keep the current unpacked recovery backup available.

## Preserved core-work re-entry

The previous bounded quantizer repair and private 0.1.83 delivery are preserved. Continue the existing core DJ goal after cleanup. Intermittent Sync pops, long keyed-loop rendering, native edge playback and deferred listening/controller criteria remain open. No DJ source or design changes, new app build, broad suite, soak or listening replay was performed for this cleanup.

Existing [SYS-FIX-01 cleanup card](https://trello.com/c/jrHcYS7I) received this scoped receipt; its exact comment was read back. No new card, move or completion change.
