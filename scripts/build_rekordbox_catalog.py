"""Build a reference catalog from owned, private REA/native captures; never copy raw AX."""
import base64
import hashlib
import json
import re
import shutil
from collections import Counter
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'local-evidence/rekordbox-catalog-2026-10-25'
DEST = ROOT / 'docs/design-system/catalog'


def safe_label(value):
    value = re.sub(r'\S+@\S+', '[account]', value or '')
    value = re.sub(r'/Users/[^\s,]+', '[local path]', value)
    return value.strip()


def build():
    records = json.loads((SOURCE / 'rea-bundle.json').read_text())['records']
    records = {r['evidence_id']: r for r in records}
    images = DEST / 'captures'
    images.mkdir(parents=True, exist_ok=True)
    rows = []

    def add(id, title, group, route, provider, snapshot=None, evidence=None, step=None, private=False):
        path = SOURCE / 'images' / (id + '.png')
        nodes = (snapshot or {}).get('nodes', [])
        if snapshot and snapshot.get('screenshot'):
            path.write_bytes(base64.b64decode(snapshot['screenshot']['base64']))
        row = dict(id=id, title=title, group=group, route=route, provider=provider,
                   status='private' if private else 'captured', evidence=evidence, step=step,
                   components=[], measurements=[], mapping=mapping(group), notes=[])
        if path.exists():
            row['pixels'] = list(Image.open(path).size)
            row['pixelScale'] = 1 if provider == 'REA' else 2
            row['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
            if not private:
                shutil.copy2(path, images / path.name)
                row['image'] = 'captures/' + path.name
        if nodes:
            row['nodeCount'] = len(nodes)
            row['components'] = [dict(role=k, count=v) for k, v in Counter(n['role'] for n in nodes).items()]
            row['labels'] = sorted({safe_label(n.get('title')) for n in nodes if n.get('title')})
        else:
            ax = (SOURCE / 'ax' / (id + '.txt')).read_text()
            roles = re.findall(r'^\s*\d+ (toggle button|radio button|pop up button|text entry area|scroll bar|button|text|row|slider|container|outline|window|dialog|image)\b', ax, re.M)
            row['components'] = [dict(role=k, count=v) for k, v in Counter(roles).items()]
            row['labels'] = sorted({safe_label(m[1]) for m in re.findall(
                r'^\s*\d+ (button|text|toggle button|radio button|pop up button|row|slider)(?: \([^\n]*?\))? ([^\n]+)', ax, re.M)
                if m[0] != 'text'})
            row['notes'].append('Native screenshot and accessibility; not a REA capture. Capture pixels are Retina pixels, not logical dimensions.')
            if group == 'Preferences':
                row['notes'].append('Scroll overflow remains to inspect.')
        rows.append(row)
        return row

    for cap in json.loads((SOURCE / 'captures.json').read_text()):
        id = cap['id']
        title = {'2H': '2 Deck Horizontal', '2V': '2 Deck Vertical', '4H': '4 Deck Horizontal', '4V': '4 Deck Vertical'}[id[5:]]
        record = records[cap['evidenceId']]
        row = add(id, title, 'Performance', 'View → ' + title, 'REA', record['normalized_result']['initial'], cap['evidenceId'])
        row['notes'].append('Fresh empty-deck state, dark appearance; loaded/playing states are separate coverage.')
    fx = records['ev_023c1fc0da3b963390059095de7c1f68926878ff35da97c3a5a7fe312786d2ff']
    add('PANEL-FX', 'FX panel', 'Panels', 'Performance toolbar → FX', 'REA', fx['normalized_result']['steps'][1]['after'], fx['evidence_id'], 1)
    panel = json.loads((SOURCE / 'panel-scenario.json').read_text())
    record = records[panel['evidenceId']]
    for state in panel['states']:
        id = state['id']
        add(id, id[6:].replace('-', ' ').title(), 'Panels', 'Performance toolbar → ' + id[6:], 'REA', record['normalized_result']['steps'][state['step']]['after'], record['evidence_id'], state['step'])
    prefs = json.loads((SOURCE / 'preferences.json').read_text())
    for cap in prefs['captures']:
        id = cap['id']
        private = any(part in id for part in ['CLOUD', 'PLAN', 'ADVANCED'])
        prefix = id.split('-')[0]
        group = {'PREF': 'Preferences', 'VIEW': 'View routes', 'LIB': 'Library'}[prefix]
        title = id[len(prefix)+1:].replace('-', ' ').title()
        row = add(id, title, group, group + ' → ' + title, 'Native CUA', private=private)
        if private:
            row['notes'].append('Image withheld from served catalog: account/library paths or entitlement information. Raw evidence remains private.')
        if id == 'PREF-CLOUD-SETUP':
            row['notes'].append('Read-only notice: Setup Wizard unavailable with current synchronization method. No wizard steps executed.')
    for path in sorted((SOURCE / 'ax').glob('MENU-*.txt')):
        labels = [safe_label(re.sub(r', ID:.*', '', line).strip()) for line in path.read_text().splitlines() if 'ID:' in line]
        rows.append(dict(id=path.stem, title=path.stem[5:].title() + ' menu', group='Menus', route='Menu bar → ' + path.stem[5:].title(),
                         provider='Native CUA', status='observed', labels=labels, components=[], measurements=[],
                         notes=['Accessibility command inventory captured. Menu screenshot unavailable. Disabled entries preserve the no-selection state.'], mapping=mapping('Menus')))
    pending = {
        'View routes': ['Fullscreen'],
        'Deck states': ['Loaded and playing', 'BPM/Grid adjustment', 'Pad mode menu and each available mode', 'Manual loop mode', 'Tempo hover / fine adjustment', 'Memory cue and loop list', 'Key / Beat Sync states', 'STEMS enabled controls'],
        'Library': ['Streaming / external sources', 'Column configuration', 'Track context menu', 'Playlist context menu', 'Search popup', 'Selected-track information editor', 'Import / export dialogs'],
        'Modes': ['EXPORT', 'EDIT', 'LIGHTING'],
        'Preferences overflow': ['View below fold', 'Audio below fold', 'Analysis below fold', 'Controller below fold', 'Keyboard expanded mappings', 'Advanced below fold', 'Extensions below fold'],
    }
    for group, titles in pending.items():
        for i, title in enumerate(titles):
            rows.append(dict(id=f'OPEN-{group.split()[0].upper()}-{i+1}', title=title, group=group,
                             route=group + ' → ' + title, status='unvisited', provider='Not captured',
                             notes=['Coverage queue, not evidence of this screen’s contents. Native pointer input is currently unavailable; custom popup routes did not open reliably.'],
                             components=[], measurements=[], labels=[], mapping=mapping(group)))
    by_id = {row['id']: row for row in rows}
    by_id['PERF-2H']['measurements'] = [
        dict(name='Mixer outer', box=[700,198,110,229], unit='logical px', confidence='pixel-derived ±2px'),
        dict(name='Deck core console', box=[0,295,700,132], unit='logical px', confidence='pixel-derived ±2px'),
        dict(name='Jog outer ring', box=[540,305,110,110], unit='logical px', confidence='pixel-derived ±2px'),
        dict(name='Jog inner blue ring', box=[552,317,86,86], unit='logical px', confidence='pixel-derived ±2px'),
        dict(name='CUE target', box=[492,333,36,36], unit='logical px', confidence='pixel-derived ±2px'),
        dict(name='Play target', box=[492,379,36,36], unit='logical px', confidence='pixel-derived ±2px'),
    ]
    by_id['PERF-4H']['notes'].append('Mixer order observed 3/1/2/4. Its geometry differs from 4 Deck Vertical; do not reuse one width for both.')
    by_id['PERF-4V']['notes'].append('Mixer order observed 1/2/3/4. Numeric dimensions still require measured annotation.')
    for id, boxes in {
        'PERF-2V': [('Deck row', [0,56,628,300]), ('Center waveform and mixer column', [628,56,256,300]), ('Monitor bottom bar', [0,356,1512,42])],
        'PERF-4H': [('Detail waveform band', [0,56,1512,198]), ('Upper deck row', [0,254,660,191]), ('Lower deck row', [0,445,660,191]), ('Mixer', [660,254,192,382]), ('Monitor bottom bar', [0,636,1512,42])],
        'PERF-4V': [('Upper deck row', [0,56,628,209]), ('Lower deck row', [0,265,628,209]), ('Center waveform and mixer column', [628,56,256,418]), ('Monitor bottom bar', [0,474,1512,42])],
    }.items():
        by_id[id]['measurements'] = [dict(name=name, box=box, unit='logical px', confidence='image band boundary ±2px') for name, box in boxes]
    by_id['PERF-4V']['notes'].remove('Mixer order observed 1/2/3/4. Numeric dimensions still require measured annotation.')
    by_id['PERF-4V']['notes'].append('Mixer order observed 1/2/3/4. Only major bands annotated; individual control bounds remain open.')
    data = dict(title='rekordbox interface catalog', version='7.2.19.0342', captured='2026-10-25',
                executableSha256='07dcecbaf304f777e435539c83c7dcc02e41de1eaf2e0a75e8a9852e4411a244',
                scope='Installed macOS interface reference. Coverage is explicit, not an exhaustive parity or original-token export.',
                limitations=['REA does not expose control bounds; dimensions are image measurements.',
                             'Preferences REA capture rejected ambiguous window geometry; native evidence is labeled separately.',
                             'Native pointer input currently reports noWindowsAvailable; some custom popups fail. Unvisited routes remain open.',
                             'No playback, recording, account, audio, cloud or reset settings changed.'], screens=rows)
    assert len(by_id) == len(rows), 'duplicate catalog ids'
    assert all(row.get('image') or row['status'] != 'captured' for row in rows)
    text = json.dumps(data, indent=2)
    assert not re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|/Users/', text)
    (DEST / 'catalog.json').write_text(text + '\n')
    print(json.dumps(dict(screens=len(rows), statuses=dict(Counter(r['status'] for r in rows)))))


def mapping(group):
    return {'Performance': 'Shared deck, mixer, waveform geometry tokens; preserve Open Play extra controls.',
            'Panels': 'Existing FX, Sampler, recording and visibility controls; compare placement without copying vendor assets.',
            'Preferences': 'Astryx standard forms and persistent Settings navigation; custom DJ controls stay custom.'}.get(group, 'Inventory before adapting; preserve existing controls and library waveform previews.')


if __name__ == '__main__':
    build()
