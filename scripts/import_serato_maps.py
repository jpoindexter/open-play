#!/usr/bin/env python3
"""Batch inventory/translate Serato XML as data; never run controller scripts.

The normalized catalog keeps every XML control, condition and output branch.
Only explicitly supported action semantics become executable Open Play mappings.
No vendor source or normalized private mapping catalog belongs in Git.
"""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

MAX_FILE_BYTES = 8 * 1024 * 1024
MAX_FILES = 4096
MAX_TOTAL_BYTES = 128 * 1024 * 1024
ENCODINGS = {'Absolute 7': '7-bit absolute', 'Absolute 14': '14-bit absolute',
             "Relative 2's Complement": 'Relative two’s complement',
             'Relative Binary Offset': 'Relative offset'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def integer(value, low, high, label):
    if value is None or not value.isascii() or not value.isdecimal():
        raise ValueError(f'{label} must be a decimal integer')
    result = int(value)
    if not low <= result <= high:
        raise ValueError(f'{label} is outside {low}..{high}')
    return result


def tree(node):
    return {'tag': node.tag, 'attributes': dict(node.attrib),
            'text': node.text.strip() if node.text and node.text.strip() else '',
            'children': [tree(child) for child in node]}


def translation(control, action):
    """Return a mapping only when both the MIDI and action behavior are known."""
    if control.tag != 'control':
        raise ValueError('Legacy named-control schema requires a separate adapter')
    if any(key not in ['channel', 'event_type', 'control', 'data_type'] for key in control.attrib):
        raise ValueError('Additional control attributes need a separate adapter')
    if any(key not in ['deck_set', 'deck_id', 'slot_id'] for key in action.attrib):
        raise ValueError('Additional action attributes need a separate adapter')
    event = control.get('event_type')
    if event not in ['Note On', 'Control Change', 'Pitch Bend']:
        raise ValueError(f'Unsupported MIDI event: {event!r}')
    channel = integer(control.get('channel'), 1, 16, 'MIDI channel')
    number = 0 if event == 'Pitch Bend' else integer(control.get('control'), 0, 127, 'Controller/note')
    kind = {'Note On': 'Note', 'Control Change': 'CC', 'Pitch Bend': 'Pitch bend'}[event]
    name = action.tag
    translations = list(action)
    if len(translations) != 1 or translations[0].tag != 'translation':
        raise ValueError('Action needs one explicit translation rule')
    rule = translations[0]
    if len(rule) or any(key not in ['action_on', 'behaviour'] for key in rule.attrib):
        raise ValueError('Aliases, static values or additional translation rules need an adapter')
    behavior, on = rule.get('behaviour'), rule.get('action_on')
    expected = {'play': ('toggle', 'press'), 'load_track': ('explicit', 'press'),
                'cue': ('explicit', 'any'), 'cue_point': ('explicit', 'any'),
                'sync': ('explicit', 'any'), 'sync_off': ('explicit', 'any'),
                'auto_loop_enable': ('toggle', 'press'),
                'midi_library_scroll': ('explicit', 'any')}
    if name not in expected:
        raise ValueError(f'No action adapter for {name}')
    if (behavior, on) != expected[name]:
        raise ValueError(f'Unsupported {name} behavior/action_on: {behavior!r}/{on!r}')
    if action.get('deck_set') != 'Default':
        raise ValueError('Non-default deck set requires a separate adapter')
    deck = integer(action.get('deck_id'), 0, 3, 'Deck index') + 1
    slot = integer(action.get('slot_id', '0'), 0, 127, 'Slot index')
    if name == 'cue_point' and slot > 7:
        raise ValueError('Hot cue slot exceeds eight supported pads')
    if name != 'cue_point' and slot != 0:
        raise ValueError('Nonzero slot semantics need an adapter')
    data_type = control.get('data_type')
    if kind == 'Note':
        if data_type not in [None, 'Absolute 7']:
            raise ValueError('Note command uses unsupported encoding')
        encoding = '7-bit absolute'
    else:
        encoding = ENCODINGS.get(data_type)
        if not encoding:
            raise ValueError(f'Unsupported or unspecified MIDI encoding: {data_type!r}')
    if name == 'midi_library_scroll':
        if kind != 'CC' or not encoding.startswith('Relative'):
            raise ValueError('Library scroll requires an explicit supported relative CC encoding')
        target = 'Library browse'
    else:
        if kind != 'Note':
            raise ValueError('Command CC/pitch edge semantics need a separate adapter')
        target = f'Deck {deck} ' + {'play': 'play', 'load_track': 'load', 'cue': 'cue',
                                  'cue_point': f'hot cue {slot+1}', 'sync': 'sync',
                                  'sync_off': 'sync off', 'auto_loop_enable': 'loop'}[name]
    return {'target': target, 'type': kind, 'channel': channel, 'number': number,
            'encoding': encoding, 'invert': False}


def parse_map(data, filename):
    if not 1 <= len(data) <= MAX_FILE_BYTES:
        raise ValueError('XML must contain 1 byte to 8 MiB')
    # XML entities are data, never a reason to access other files or the network.
    text = data.decode('utf-8-sig')
    if '<!DOCTYPE' in text.upper() or '<!ENTITY' in text.upper():
        raise ValueError('DTD and entity declarations are not supported')
    root = ET.fromstring(text)
    if root.tag != 'midi':
        raise ValueError('Not a Serato MIDI XML root')
    stack, nodes = [(root, 0)], 0
    while stack:
        node, depth = stack.pop(); nodes += 1
        if depth > 48 or nodes > 100000:
            raise ValueError('XML nesting/node limit exceeded')
        stack.extend((child, depth+1) for child in node)
    controls, mappings, issues, outputs = [], [], [], 0
    if any(key != 'app' for key in root.attrib):
        issues.append({'reason': 'Additional root attributes retained; global semantics need review'})
        return {'id': digest(data), 'name': Path(filename).stem, 'sourceFile': Path(filename).name,
                'sourceSHA256': digest(data), 'sourceApp': root.get('app'), 'rootAttributes': dict(root.attrib),
                'controls': [tree(control) for control in root], 'mappings': [], 'issues': issues,
                'outputBranches': sum(1 for node in root.iter('userio') if node.get('event') == 'output'),
                'deviceMatch': None, 'bindingRequired': True, 'fullyTranslated': False,
                'physicalCompatibilityVerified': False}
    for index, control in enumerate(root):
        controls.append(tree(control))
        if control.tag not in ['control', 'Control']:
            issues.append({'controlIndex': index, 'reason': 'Unknown top-level element retained'}); continue
        outputs += sum(1 for userio in control.iter('userio') if userio.get('event') == 'output')
        direct = [userio for userio in control if userio.tag == 'userio' and userio.get('event') == 'click']
        if any(child.tag == 'userio' and child.get('event') not in ['click', 'output'] for child in control):
            issues.append({'controlIndex': index, 'reason': 'Unknown userio event retained; control not activated'}); continue
        if any(child.tag != 'userio' for child in control) or not direct:
            issues.append({'controlIndex': index, 'reason': 'Conditional, legacy or non-click control retained; not activated'}); continue
        for userio in direct:
            if any(key != 'event' for key in userio.attrib) or not len(userio):
                issues.append({'controlIndex': index, 'reason': 'Additional or empty userio semantics retained'}); continue
            for action in userio:
                try:
                    mapping = translation(control, action)
                    mapping['sourceControlIndex'] = index
                    mapping['sourceAction'] = action.tag
                    mappings.append(mapping)
                except ValueError as error:
                    issues.append({'controlIndex': index, 'action': action.tag, 'reason': str(error)})
    if outputs:
        issues.append({'reason': 'Output/lighting branches retained; no MIDI output adapter yet', 'branches': outputs})
    return {'id': digest(data), 'name': Path(filename).stem, 'sourceFile': Path(filename).name,
            'sourceSHA256': digest(data), 'sourceApp': root.get('app'),
            'rootAttributes': dict(root.attrib), 'controls': controls, 'mappings': mappings,
            'issues': issues, 'outputBranches': outputs, 'deviceMatch': None,
            'bindingRequired': True, 'fullyTranslated': bool(controls) and not issues,
            'physicalCompatibilityVerified': False}


def discover(roots):
    files, skipped = {}, []
    for root_name in roots:
        root = Path(root_name).expanduser().absolute()
        if not root.exists():
            skipped.append({'root': str(root), 'reason': 'Missing'}); continue
        if root.is_symlink():
            skipped.append({'root': str(root), 'reason': 'Symlink root not followed'}); continue
        candidates = [root] if root.is_file() else root.rglob('*')
        for path in candidates:
            if path.is_symlink() or not path.is_file() or path.suffix.lower() != '.xml':
                continue
            files[str(path)] = path
            if len(files) > MAX_FILES:
                raise ValueError('More than4096 XML files; select narrower roots')
    return sorted(files.values()), skipped


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('roots', nargs='+', help='Explicit Serato MIDI directories, XML files, or installed app bundle')
    parser.add_argument('--output', required=True, help='New private catalog JSON; refuses overwrite')
    parser.add_argument('--summary', help='New summary JSON without control/source content')
    args = parser.parse_args()
    files, skipped = discover(args.roots)
    profiles, other, total = [], [], 0
    for path in files:
        size = path.stat().st_size
        total += size
        if total > MAX_TOTAL_BYTES:
            raise ValueError('XML input batch exceeds128MiB')
        try:
            if size > MAX_FILE_BYTES:
                raise ValueError('XML exceeds8MiB')
            profiles.append(parse_map(path.read_bytes(), path.name))
        except (ValueError, ET.ParseError) as error:
            other.append({'sourceFile': path.name, 'reason': str(error)})
    unique = {profile['id']: profile for profile in profiles}
    catalog = {'format': 'open-play-controller-catalog-v1', 'profiles': list(unique.values()),
               'untranslatedFiles': other, 'skippedRoots': skipped,
               'scope': 'Explicit-root XML discovery/normalization and supported action translation. Built-in binary/HID mappings are not decoded by this XML adapter. No controller test or default-map completeness claim.'}
    summary = {'format': catalog['format'], 'xmlFilesExamined': len(files),
               'seratoFilesFound': len(profiles), 'uniqueProfiles': len(unique),
               'duplicateSourceFiles': len(profiles)-len(unique), 'otherFiles': other,
               'profiles': [{'name': p['name'], 'sourceSHA256': p['sourceSHA256'],
                             'controlsRetained': len(p['controls']), 'mappingsTranslated': len(p['mappings']),
                             'issuesRetained': len(p['issues']), 'outputBranches': p['outputBranches'],
                             'fullyTranslated': p['fullyTranslated'], 'bindingRequired': True}
                            for p in unique.values()], 'scope': catalog['scope']}
    # Compute everything first; do not truncate an older catalog after a failure.
    catalog_bytes = (json.dumps(catalog, indent=2, allow_nan=False)+'\n').encode()
    summary_bytes = (json.dumps(summary, indent=2, allow_nan=False)+'\n').encode()
    if Path(args.output).exists() or args.summary and Path(args.summary).exists():
        raise FileExistsError('Use fresh output paths; earlier results are preserved')
    with Path(args.output).open('xb') as file:
        file.write(catalog_bytes)
    if args.summary:
        with Path(args.summary).open('xb') as file:
            file.write(summary_bytes)
    print(summary_bytes.decode(), end='')


if __name__ == '__main__':
    main()
