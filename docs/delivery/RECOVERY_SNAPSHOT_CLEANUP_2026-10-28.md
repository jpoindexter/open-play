# Superseded recovery snapshot cleanup — 28 October 2026

Archived only the two explicitly named older closed-profile snapshots, then removed their verified unpacked copies. **Allocation reduction: 6,025,216 bytes (6.03 MB / 5.75 MiB).** This is `st_blocks` file-allocation accounting, not an observed APFS free-space increase. Most stored audio/cache content was already compressed, so these standalone recovery archives save little space.

| Removed unpacked snapshot | Retained adjacent archive | Files verified | Allocation reduction (bytes) |
|---|---|---:|---:|
| `local-evidence/package-084/closed-83-profile` | `local-evidence/package-084/closed-83-profile.tar.gz` | 246 | 2,732,032 |
| `local-evidence/package-085/closed-84-profile` | `local-evidence/package-085/closed-84-profile.tar.gz` | 246 | 3,293,184 |

Each original snapshot matched its existing `closed-profile-backup.json` before archiving. macOS `/usr/bin/tar` preserved native metadata. Every archived original file was read and SHA256/length checked; archive modes/ownership and symlinks were checked. Each archive was then restored into a new private temporary directory, and the entire restored inventory matched the original: file bytes/hashes, permissions, ownership, nanosecond timestamps, flags and `com.apple.provenance` metadata. Original contents and manifest were reverified immediately before removal. No symlinks, special files, hard links or BSD flags occurred in either source. Modes were0600/0644/0700; archive permissions are0600. Temporary verification directories were removed.

Retained unchanged: each original recovery manifest; both adjacent archives; latest unpacked `local-evidence/package-086/closed-85-profile`. The active Application Support profile, both app bundles, original music/recordings, unrelated evidence/toolchains and runtime/product files were outside the mutation scope. No app input, playback, build, browser/native/Trello action, Git commit or push was performed for this cleanup.

## Restore an old snapshot

Do not extract over the active profile or the latest backup. Use macOS `tar` so native metadata is restored. These commands create new empty private restore directories:

```sh
OPEN_PLAY_RECOVERY83=$(mktemp -d /tmp/open-play-closed83-restore.XXXXXX)
/usr/bin/tar -xzpf '/Users/jasonpoindexter/Documents/GitHub/Open Play/local-evidence/package-084/closed-83-profile.tar.gz' -C "$OPEN_PLAY_RECOVERY83"
OPEN_PLAY_RECOVERY84=$(mktemp -d /tmp/open-play-closed84-restore.XXXXXX)
/usr/bin/tar -xzpf '/Users/jasonpoindexter/Documents/GitHub/Open Play/local-evidence/package-085/closed-84-profile.tar.gz' -C "$OPEN_PLAY_RECOVERY84"
```

The restored roots are `$OPEN_PLAY_RECOVERY83/closed-83-profile` and `$OPEN_PLAY_RECOVERY84/closed-84-profile`. Verify the archived SHA256 values in the receipt before extracting if an archive was moved or copied. The exact hashes from this cleanup are:

- Closed83archive: `a985039faf93b4563ab068b5ca198f90994285c3177fc47e811c8cfb9a37ddc8`.
- Closed84archive: `7fae717cfd304f933b70eb92f35ec84fa4a286de8fd09eab16d700f4665a9db5`.

Check restored content against the retained original manifests:

```sh
python3 - "$OPEN_PLAY_RECOVERY83/closed-83-profile" '/Users/jasonpoindexter/Documents/GitHub/Open Play/local-evidence/package-084/closed-profile-backup.json' "$OPEN_PLAY_RECOVERY84/closed-84-profile" '/Users/jasonpoindexter/Documents/GitHub/Open Play/local-evidence/package-085/closed-profile-backup.json' <<'PYTHON'
from pathlib import Path
import hashlib, json, sys
for root, manifest in zip(sys.argv[1::2], sys.argv[2::2]):
    root = Path(root)
    expected = json.loads(Path(manifest).read_text())['manifest']
    actual = {}
    for path in root.rglob('*'):
        if path.is_symlink():
            actual[path.relative_to(root).as_posix()] = {'symlink': str(path.readlink())}
        elif path.is_file():
            digest = hashlib.sha256()
            with path.open('rb') as stream:
                for chunk in iter(lambda: stream.read(1048576), b''):
                    digest.update(chunk)
            actual[path.relative_to(root).as_posix()] = {'bytes': path.stat().st_size, 'sha256': digest.hexdigest()}
    assert actual == expected, 'Restored snapshot differs from its recovery manifest'
    print(root, 'verified', len(actual), 'files')
PYTHON
```

The restore-and-compare path above was executed during cleanup in owned temporary directories; do not infer playback/session quality or active-profile recovery from archival validation. Restoring a snapshot into the real profile requires the separate protected quit/backup/recovery procedure.

[Compact receipt](recovery-snapshot-cleanup-2026-10-28.json).
