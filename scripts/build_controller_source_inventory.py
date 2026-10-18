#!/usr/bin/env python3
"""Cross-reference the retained official hardware index with pinned map sources.

Exact normalized names identify candidates only, never compatibility or factory
provenance. Source XML stays private. Run after collect_controller_map_sources.py.
"""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT/'local-evidence/serato-mapping-import-139'


class HardwareIndex(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows = []; self.row = None; self.heading = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'li' and 'data-company' in attrs:
            self.row = {'manufacturer': attrs['data-company'], 'type': attrs.get('data-type'),
                        'release': attrs.get('data-release'), 'name': '', 'licenses': []}
        if self.row is None:
            return
        if tag == 'a' and attrs.get('href', '').startswith('/dj/hardware/'):
            self.row['url'] = 'https://serato.com'+attrs['href']
        if tag == 'h3' and 'name' in attrs.get('class', '').split():
            self.heading = True
        if 'data-license' in attrs:
            self.row['licenses'].extend(attrs['data-license'].split(','))

    def handle_data(self, data):
        if self.heading and self.row is not None:
            self.row['name'] += data

    def handle_endtag(self, tag):
        if tag == 'h3':
            self.heading = False
        if tag == 'li' and self.row is not None:
            if self.row.get('url'):
                self.row['name'] = ' '.join(self.row['name'].split())
                self.rows.append(self.row)
            self.row = None


def normalized(text):
    return re.sub('[^a-z0-9]', '', text.casefold().replace('&', 'and'))


def model_key(text, manufacturer):
    value = normalized(text)
    aliases = [manufacturer, manufacturer.replace(' DJ', ''), 'Pioneer' if manufacturer == 'Pioneer DJ' else manufacturer]
    for alias in sorted(set(map(normalized, aliases)), key=len, reverse=True):
        if alias and value.startswith(alias):
            return value[len(alias):]
    return value


def main():
    html = (CACHE/'hardware-index.html').read_bytes()
    parser = HardwareIndex(); parser.feed(html.decode())
    assert parser.rows and len({row['url'] for row in parser.rows}) == len(parser.rows)
    sources = json.loads((ROOT/'docs/research/controller-map-online-sources-139.json').read_text())
    for row in parser.rows:
        key = model_key(row['name'], row['manufacturer'])
        row['sourceKind'] = 'official_serato_hardware_listing'
        row['officialFactoryMapping'] = {'status': 'not_recovered', 'installedAppSearch': 'No loose MIDI XML found; built-in native/resource trace pending'}
        row['alternativeCandidates'] = []
        for source in sources['files']:
            name = Path(source['path']).name
            for suffix in ['.midi.xml', '.hid.xml', '.bulk.xml', '.xml']:
                if name.casefold().endswith(suffix):
                    name = name[:-len(suffix)]; break
            if source.get('status') == 'retained_private_unexecuted' and model_key(name, row['manufacturer']) == key:
                row['alternativeCandidates'].append({'repository': source['repository'],
                    'path': source['path'], 'revision': source['revision'], 'url': source['url'],
                    'format': source.get('format'), 'sourceKind': 'alternative_mapping',
                    'matchBasis': 'exact normalized product/model name only',
                    'runtimeAccepted': False})
        row['physicalCompatibilityVerified'] = False
    report = {'date': '2026-10-18', 'officialIndex': 'https://serato.com/dj/hardware',
              'officialIndexSHA256': hashlib.sha256(html).hexdigest(),
              'hardwareProducts': len(parser.rows),
              'productsWithAlternativeNameCandidates': sum(bool(row['alternativeCandidates']) for row in parser.rows),
              'officialFactoryMapsRecovered': 0,
              'labels': ['Official Serato', 'Alternative mapping — named source', 'User mapping'],
              'scope': 'All product cards in this retained unfiltered official hardware index. Includes controllers, mixers, interfaces and accessories; not a MIDI-only list, device support claim or proof of complete installed factory-map inventory. Exact-name alternative matches are candidates only. Actual connected Hercules subset remains in its separate physical receipt.',
              'hardware': parser.rows}
    output = ROOT/'docs/research/controller-map-hardware-coverage-139.json'
    output.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({key: report[key] for key in ['hardwareProducts', 'productsWithAlternativeNameCandidates', 'officialFactoryMapsRecovered']}))


if __name__ == '__main__':
    main()
