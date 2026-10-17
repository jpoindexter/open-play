"""Recreate/check the isolated pinned experiment cache; never install product dependencies.

Default is read-only verification. --fetch downloads exact recorded npm tarballs only
when a package is absent, verifies registry SHA512 plus recorded SHA256, and rejects
links, traversal and special files. No package scripts or subprocesses are run.
"""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import tarfile
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'local-evidence/keylock-soundtouch-source/node_modules'
RECORDS = [ROOT / 'docs/research' / name for name in (
    'SOUNDTOUCH_KEYLOCK_EXPERIMENT_PROVENANCE_20261017.json',
    'SOUNDTOUCH_WORKLET_EXPERIMENT_PROVENANCE_20261017.json')]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    args = parser.parse_args()
    packages = [p for record in RECORDS for p in json.loads(record.read_text())['packages']]
    results = []
    for package in packages:
        name = package['name']
        assert name.startswith('@soundtouchjs/') and '/' not in name.split('/', 1)[1]
        assert package['version'] == '2.1.1'
        destination = CACHE / name
        if not destination.exists():
            assert args.fetch, f'Missing {name}; use --fetch for pinned official registry download'
            url = package['metadata']['dist']['tarball']
            parsed = urllib.parse.urlparse(url)
            assert parsed.scheme == 'https' and parsed.hostname == 'registry.npmjs.org'
            with urllib.request.urlopen(url, timeout=30) as response:
                assert urllib.parse.urlparse(response.url).hostname == 'registry.npmjs.org'
                archive = response.read(4 * 1024 * 1024 + 1)
            assert len(archive) <= 4 * 1024 * 1024
            assert hashlib.sha256(archive).hexdigest() == package['archiveSHA256']
            integrity = package['metadata']['dist']['integrity']
            assert integrity == 'sha512-' + base64.b64encode(hashlib.sha512(archive).digest()).decode()
            # Validate the full archive before creating the package directory.
            entries = []
            with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
                for member in tar.getmembers():
                    path = PurePosixPath(member.name)
                    assert not path.is_absolute() and path.parts[0] == 'package'
                    assert '..' not in path.parts and not member.issym() and not member.islnk()
                    assert member.isfile() or member.isdir()
                    if member.isfile():
                        assert len(path.parts) > 1
                        entries.append((Path(*path.parts[1:]), tar.extractfile(member).read()))
            assert len(entries) == len({str(path) for path, _ in entries})
            destination.mkdir(parents=True)
            for relative, data in entries:
                target = destination / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open('xb') as handle:
                    handle.write(data)
        manifest = json.loads((destination / 'package.json').read_text())
        assert manifest['name'] == name and manifest['version'] == package['version']
        for record in package['files']:
            path = ROOT / record['path']
            assert path.is_relative_to(destination), path
            assert not path.is_symlink()
            assert hashlib.sha256(path.read_bytes()).hexdigest() == record['sha256'], path
        results.append({'package': name, 'version': package['version'], 'files_verified': len(package['files'])})
    print(json.dumps({'isolated_cache': str(CACHE.relative_to(ROOT)), 'packages': results,
                      'product_changed': False, 'scripts_executed': False}, indent=2))


if __name__ == '__main__':
    main()
