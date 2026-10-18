"""Focused batch adapter checks; fixtures are independently authored XML data."""
import json
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET

from import_serato_maps import parse_map, discover


def wrap(action, *, channel='1', event='Note On', number='10', extra=''):
    return f'<midi app="fixture"><control channel="{channel}" event_type="{event}" control="{number}" {extra}><userio event="click">{action}</userio></control></midi>'.encode()


load = '<load_track deck_set="Default" deck_id="3" slot_id="0"><translation action_on="press" behaviour="explicit"/></load_track>'
play = '<play deck_set="Default" deck_id="0" slot_id="0"><translation action_on="press" behaviour="toggle"/></play>'
cases = []


def check(name, run):
    run(); cases.append({'name': name, 'passed': True})


def ordinary():
    r = parse_map(wrap(load), 'controller.xml')
    assert r['mappings'][0]['target'] == 'Deck 4 load'
    assert r['fullyTranslated'] and r['bindingRequired'] and not r['physicalCompatibilityVerified']
    assert 'deviceId' not in r['mappings'][0]


def preserved():
    data = f'<midi><control channel="1" event_type="Note On" control="10"><userio event="click">{play}<future_action><translation static_value="future"/></future_action></userio><userio event="output"><play><translation><alias name="on" value="127"/></translation></play></userio></control></midi>'.encode()
    r = parse_map(data, 'mixed.xml')
    assert len(r['mappings']) == 1 and len(r['issues']) == 2 and r['outputBranches'] == 1
    assert len(r['controls'][0]['children'][0]['children']) == 2
    assert r['controls'][0]['children'][1]['children'][0]['children'][0]['children'][0]['attributes']['value'] == '127'
    assert not r['fullyTranslated']


def conditional():
    r = parse_map(f'<midi><control channel="1" event_type="Note On" control="10"><case><condition><mode value="1"/></condition><userio event="click">{play}</userio></case></control></midi>'.encode(), 'conditional.xml')
    assert not r['mappings'] and r['issues'] and r['controls'][0]['children'][0]['tag'] == 'case'
    extra = wrap(play).replace(b'</control>', b'<userio event="future-condition"/></control>')
    r = parse_map(extra, 'event.xml')
    assert not r['mappings'] and r['issues'] and not r['fullyTranslated']
    r = parse_map(wrap(play).replace(b'<midi app="fixture">', b'<midi app="fixture" mode="conditional">'), 'root.xml')
    assert not r['mappings'] and r['issues'] and not r['fullyTranslated']


def refused():
    for data in [b'<!DOCTYPE midi [<!ENTITY x SYSTEM "file:///never-read">]><midi/>', b'<midi><control>', b'<other/>', b'<midi>'+b'<n>'*50+b'</n>'*50+b'</midi>']:
        try:
            parse_map(data, 'invalid.xml')
        except (ValueError, ET.ParseError):
            continue
        raise AssertionError('Invalid or external-entity XML accepted')


def unsupported():
    for data in [wrap(play, channel='0'), wrap(play, channel='17'), wrap(play, number='128'), wrap(play, extra='invert="true"'), wrap(play.replace('toggle', 'static')), wrap(play.replace('Default', 'Custom'))]:
        r = parse_map(data, 'unsupported.xml')
        assert not r['mappings'] and r['issues'] and not r['fullyTranslated']


def discovery():
    with tempfile.TemporaryDirectory() as folder:
        p = Path(folder); (p/'one.xml').write_bytes(wrap(load)); (p/'ignored.json').write_text('{}'); (p/'link.xml').symlink_to(p/'one.xml')
        files, skipped = discover([str(p), str(p/'missing')])
        assert len(files) == 1 and len(skipped) == 1


check('Known explicit load uses zero-based deck translation and remains unbound', ordinary)
check('Mixed actions and LED branches retained; supported subset identified honestly', preserved)
check('Conditional branches preserved without unconditional dispatch', conditional)
check('Malformed XML, wrong root, DTD/entities and excessive depth rejected', refused)
check('Bad MIDI ranges, inversion/extra attributes and unsupported semantics excluded', unsupported)
check('Batch discovery excludes symlink files and unrelated formats', discovery)
print(json.dumps({'passed': True, 'scope': 'Parser and translation-policy checks; no browser import, physical controller, factory-map extraction or full conversion acceptance.', 'cases': cases}, indent=2))
