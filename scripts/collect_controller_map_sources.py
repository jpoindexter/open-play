#!/usr/bin/env python3
"""Download pinned XML mapping data for private inspection, never executable code."""
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'local-evidence/serato-mapping-import-139'
MAX_BYTES = 8 * 1024 * 1024


def fetch(url):
    with urlopen(Request(url, headers={'User-Agent': 'Open-Play-private-controller-map-review'}), timeout=20) as response:
        data = response.read(MAX_BYTES+1)
    if len(data) > MAX_BYTES:
        raise ValueError('Source exceeds8MiB')
    return data


def collect(spec):
    repo, commit, path, blob = spec
    url = f'https://raw.githubusercontent.com/{repo}/{commit}/{quote(path)}'
    destination = CACHE/'sources'/repo/path
    try:
        data = destination.read_bytes() if destination.exists() else fetch(url)
        actual = hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
        if actual != blob:
            raise ValueError('Git blob identity mismatch')
        if not destination.exists():
            destination.parent.mkdir(parents=True, exist_ok=True)
            with destination.open('xb') as file:
                file.write(data)
        return {'repository': repo, 'revision': commit, 'path': path, 'url': url,
                'gitBlobSHA1': blob, 'sha256': hashlib.sha256(data).hexdigest(),
                'bytes': len(data), 'status': 'retained_private_unexecuted',
                'format': ET.fromstring(data).tag, 'runtimeAccepted': False,
                'sourceKind': 'alternative_mapping', 'officialSeratoFactoryMapping': False}
    except Exception as error:
        return {'repository': repo, 'revision': commit, 'path': path, 'url': url,
                'status': 'fetch_failed', 'error': str(error), 'runtimeAccepted': False}


def main():
    specs, sources = [], []
    for repo, treefile in [('mixxxdj/mixxx', 'mixxx-tree.json'),
                           ('OpenRsG/OpenFadeR-Map', 'openfader-map-tree.json')]:
        record = json.loads((CACHE/treefile).read_text())
        if record.get('truncated'):
            raise ValueError('Repository tree is truncated')
        commit = record['sha']
        for item in record['tree']:
            path = item['path']
            if path.lower().endswith('.xml') and (repo != 'mixxxdj/mixxx' or path.startswith('res/controllers/')):
                specs.append((repo, commit, path, item['sha']))
        sources.append({'repository': repo, 'treeSHA': commit,
                        'scope': 'Alternative-app mapping data, not Serato factory maps; no compatibility claim'})
    repo = 'marscanbueno/serato-dj-pro-midi-maps'
    tree_data = fetch(f'https://api.github.com/repos/{repo}/git/trees/master?recursive=1')
    tree = json.loads(tree_data)
    (CACHE/'serato-public-repository-tree.json').write_bytes(tree_data)
    if tree.get('truncated'):
        raise ValueError('Serato mapping repository tree is truncated')
    for item in tree['tree']:
        if item['path'].lower().endswith('.xml'):
            specs.append((repo, tree['sha'], item['path'], item['sha']))
    sources.append({'repository': repo, 'treeSHA': tree['sha'],
                    'scope': 'Author-posted custom Serato mappings, not factory defaults'})
    results = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        pending = [pool.submit(collect, spec) for spec in specs]
        for future in as_completed(pending):
            results.append(future.result())
            if len(results) % 40 == 0:
                print(f'Retained/attempted {len(results)}/{len(specs)} XML sources', flush=True)
    results.sort(key=lambda row: (row['repository'], row['path']))
    report = {'scope': 'Pinned public XML source collection, private raw cache only; no scripts executed, profiles installed, controller compatibility or full Serato map extraction claimed.',
              'sources': sources, 'attempted': len(specs),
              'retained': sum(row['status'] == 'retained_private_unexecuted' for row in results),
              'files': results}
    output = ROOT/'docs/research/controller-map-online-sources-139.json'
    output.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'attempted': report['attempted'], 'retained': report['retained'],
                      'report': str(output)}), flush=True)


if __name__ == '__main__':
    main()
