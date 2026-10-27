# Superseded app builds and staging cleanup — 27 October 2026

Jason authorized removing all old versions and continuing software work while controller/listening checks wait. Only the running/current0.1.74 bundle and its three working launchers remain. Earlier binary retention instructions are superseded by this explicit cleanup; historical receipts, source commits and evidence remain available. Old builds must be rebuilt from their recorded source if needed later.

## Executed removal

74validated generated app builds (versions0.1.0–0.1.73) permanently removed;59stale launcher files removed from the working tree, retained in Git history and a private cleanup copy. No Open Play app bundles were found in the inspected Applications/user Applications/Downloads tree outside this build root. Build-root contents were validated before deletion, and no targeted build process was running.

Four old version folders also contained profile-before-native backups. These were moved to local-evidence/profile-backups/build-0.1.53-before-native through build-0.1.56-before-native with identical per-file hash manifests. They were not deleted. Normal Application Support profile, music and recordings were outside every cleanup target.

The build directory fell from39134298112allocated bytes to551972864bytes.485564416bytes of that reduction are relocated backups, not deleted data; generated old builds removed38096760832bytes. Another35attributable finished packaging stages used9934671872bytes and were removed after validating package identity, path containment, no profile folders and no active Node packager. Total generated allocations removed48031432704bytes (~44.73GiB). Actual whole-filesystem free-space gain was not measured; these are file allocation counts, not an APFS snapshot or system-storage claim.

Current0.1.74 ASAR before/after remains8ec36b15394daff63b5b5ee58ae57faeca7b743cd2754e39ffe894f9130d69ce and its process stayed running. Current launchers still point to that existing bundle. No app reload, replacement, Play, Sync, Record or settings write was made by cleanup. The user’s native session later showed two decks/different positions; it was preserved instead of restoring the earlier four-deck state.

## Root repair

The builder removed its tar archive but retained its complete mkdtemp staging directory on success and thrown errors. A shared outer try/finally now removes only that owned staging path through node:fs/promises rm, preserving outputs outside it. No new runtime module/dependency, DJ audio code or layout changes. Builder77lines; focused regression27lines.

Two focused checks execute the actual builder body with real owned filesystem operations and controlled archive/packager/fixture endpoints. Both fail before cleanup and pass after: staging disappears, successful output remains, original packaging failure propagates, and the parent test directory remains. This is not a new real Electron build. Next ordinary packaging must observe staging cleanup; no extra build/full suite/soak was run for this cleanup.

[Compact receipt](build-cleanup-2026-10-27.json). Raw inventories, original launcher copies and focused output remain ignored in local-evidence/old-build-cleanup-2026-10-27/. The current private app and existing controller/listening limits remain unchanged.
