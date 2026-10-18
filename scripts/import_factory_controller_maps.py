#!/usr/bin/env python3
"""Retain recovered factory definitions locally and adapt supported input actions.

Inputs must match the reviewed resource inventory. Output is private, sharded
catalog data; the optional public registry contains digests, never vendor trees.
No controller initialization, scripts, MIDI output or native code is executed.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from import_serato_maps import tree, integer, digest, ENCODINGS

VERSION = 'open-play-factory-adapter-v1'
FIELDS = ['adapterVersion', 'name', 'sourceFile', 'sourceSHA256', 'sourceEnvelope',
          'controls', 'mappings', 'issues', 'outputBranches']
BUTTONS = {'play': 'play', 'load_track': 'load', 'cue': 'cue', 'sync': 'sync',
           'sync_off': 'sync off', 'pfl': 'headphone cue', 'slip_mode': 'slip',
           'quantize': 'quantize', 'platter_jog_mode': 'vinyl',
           'previous_track': 'previous', 'pitch_range': 'tempo range',
           'auto_loop_enable': 'auto loop four', 'loop_in': 'loop in',
           'loop_out': 'loop out', 'loop_length_half': 'loop half',
           'loop_length_double': 'loop double', 'platter_touch': 'jog touch'}
CONTINUOUS = {'upfader': 'level', 'deck_eq_hi': 'high', 'deck_eq_mid': 'mid',
              'deck_eq_lo': 'low', 'trim': 'trim', 'deck_filter_auto': 'filter',
              'pitch_slider': 'tempo', 'pitch_slider_shift': 'tempo ignore'}
TOGGLES = {'play', 'pfl', 'slip_mode', 'quantize', 'platter_jog_mode', 'auto_loop_enable'}


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'))


def profile_digest(profile):
    return digest(canonical({key: profile.get(key) for key in FIELDS}).encode())


def node_count(value):
    stack, count = [value], 0
    while stack:
        item = stack.pop(); count += 1
        if isinstance(item, dict): stack.extend(item.values())
        elif isinstance(item, list): stack.extend(item)
    return count


def adapt(control, action):
    if set(control.attrib) - {'channel', 'event_type', 'control', 'data_type', 'complement_control', 'access'}:
        raise ValueError('Additional input attributes retained; no adapter')
    if control.get('access') not in [None, 'read only', 'read write']:
        raise ValueError('Non-input access retained')
    name = action.tag
    if set(action.attrib) - {'deck_set', 'deck_id', 'slot_id'} or action.get('deck_set', 'Default') != 'Default':
        raise ValueError('Additional action addressing retained')
    slot = integer(action.get('slot_id', '0'), 0, 127, 'Slot')
    if slot != 0: raise ValueError('Nonzero slot needs a separate adapter')
    global_action = name in ['library_scroll', 'crossfader']
    if global_action:
        if action.attrib: raise ValueError('Global action has additional addressing')
        target = 'Library browse' if name == 'library_scroll' else 'Crossfader'
    else:
        deck = integer(action.get('deck_id'), 0, 3, 'Deck') + 1
        suffix = BUTTONS.get(name) or CONTINUOUS.get(name)
        if suffix is None: raise ValueError('Action needs a separate adapter')
        target = f'Deck {deck} {suffix}'
    event = control.get('event_type')
    if event not in ['Note On', 'Control Change']: raise ValueError('MIDI event needs an adapter')
    channel = integer(control.get('channel'), 1, 16, 'Channel')
    number = integer(control.get('control'), 0, 127, 'Controller')
    kind = 'Note' if event == 'Note On' else 'CC'
    encoding = ENCODINGS.get(control.get('data_type', 'Absolute 7'))
    if encoding is None: raise ValueError('MIDI encoding needs an adapter')
    if encoding == '14-bit absolute':
        if kind != 'CC' or number > 31 or control.get('complement_control') != str(number+32):
            raise ValueError('Only standard MSB/LSB CC pairs are supported')
    elif control.get('complement_control') is not None:
        raise ValueError('Unexpected complement control retained')
    rules = list(action)
    if len(rules) > 1 or (rules and rules[0].tag != 'translation'):
        raise ValueError('Additional translation rules retained')
    rule = rules[0] if rules else None
    invert = False
    if kind == 'Note':
        if name not in BUTTONS or encoding != '7-bit absolute': raise ValueError('Button encoding/action needs an adapter')
        if rule is not None and (len(rule) or dict(rule.attrib) != {'action_on': 'press', 'behaviour': 'toggle'} or name not in TOGGLES):
            raise ValueError('Button translation semantics need an adapter')
    else:
        if name not in CONTINUOUS and not global_action: raise ValueError('CC command semantics need an adapter')
        if name == 'library_scroll':
            if not encoding.startswith('Relative') or rule is not None: raise ValueError('Relative library translation needs an adapter')
        elif encoding not in ['7-bit absolute', '14-bit absolute']:
            raise ValueError('Continuous encoding needs an adapter')
        if rule is not None:
            maximum = '16383' if encoding == '14-bit absolute' else '127'
            if rule.attrib or len(rule) != 1 or rule[0].tag != 'range': raise ValueError('Continuous translation needs an adapter')
            attrs = rule[0].attrib
            if len(rule[0]) or dict(attrs) not in [
                {'in_min': '0', 'in_max': maximum, 'out_min': '0', 'out_max': '1'},
                {'in_min': '0', 'in_max': maximum, 'out_min': '1', 'out_max': '0'}]:
                raise ValueError('Non-normalized range retained; no adapter')
            invert = attrs['out_min'] == '1'
    return dict(target=target, type=kind, channel=channel, number=number,
                encoding=encoding, invert=invert), rule is None


def parse_factory(data, filename):
    if not 0 < len(data) <= 8*1024*1024: raise ValueError('Definition exceeds 8MiB')
    text = data.decode('utf-8-sig')
    if '<!DOCTYPE' in text.upper() or '<!ENTITY' in text.upper(): raise ValueError('DTD/entities rejected')
    root = ET.fromstring(text)
    if root.tag != 'root': raise ValueError('Not a factory definition root')
    stack, count = [(root, 0)], 0
    while stack:
        node, depth = stack.pop(); count += 1
        if count > 100000 or depth > 48: raise ValueError('Definition structure exceeds limits')
        stack.extend((child, depth+1) for child in node)
    controls, mappings, issues, defaults = [], [], [], set()
    envelope = tree(root)
    for section_index, section in enumerate(root):
        if section.tag not in ['midi', 'hid', 'audio']: continue
        start = len(controls)
        controls.extend(tree(child) for child in section)
        retained = envelope['children'][section_index]
        retained['children'] = []
        retained['profileControlsRange'] = [start, len(section)]
        for offset, control in enumerate(section):
            index = start+offset
            if section.tag != 'midi' or control.tag != 'control':
                issues.append({'controlIndex': index, 'reason': 'Non-MIDI/control data retained; no runtime adapter'}); continue
            if any(child.tag != 'userio' for child in control):
                issues.append({'controlIndex': index, 'reason': 'Conditional/other branches retained; not flattened'}); continue
            clicks = [child for child in control if child.get('event') == 'click']
            if not clicks: continue  # Output-only remains in the retained source graph.
            if len(clicks) != 1 or set(clicks[0].attrib) != {'event'} or len(clicks[0]) != 1 or any(c.get('event') not in ['click', 'output'] for c in control):
                issues.append({'controlIndex': index, 'reason': 'Compound/other input event retained; no adapter'}); continue
            action = clicks[0][0]
            try:
                mapping, default = adapt(control, action)
                mapping.update(sourceControlIndex=index, sourceAction=action.tag)
                mappings.append(mapping)
                if default: defaults.add(action.tag)
            except ValueError as error:
                issues.append({'controlIndex': index, 'action': action.tag, 'reason': str(error)})
    if defaults:
        issues.append({'reason': 'Source omits translation: Open Play uses its named action behavior; vendor default equivalence unverified', 'actions': sorted(defaults)})
    outputs = sum(node.get('event') == 'output' for node in root.iter('userio'))
    if outputs: issues.append({'reason': 'All output/lighting branches retained but inactive', 'branches': outputs})
    issues.append({'reason': 'Device metadata, initialization and global semantics retained; no hardware initialization or compatibility claim'})
    descriptors = [c for c in root if c.tag.endswith('_device')]
    name = next((c.get('display_name') or c.get('name') for c in descriptors if c.get('display_name') or c.get('name')), Path(filename).stem)
    profile = dict(adapterVersion=VERSION, id=digest(data), name=name, sourceFile=filename,
                   sourceSHA256=digest(data), sourceEnvelope=envelope, controls=controls,
                   mappings=mappings, issues=issues, outputBranches=outputs,
                   bindingRequired=True, deviceMatch=None, fullyTranslated=False,
                   physicalCompatibilityVerified=False)
    reconstructed = copy.deepcopy(envelope)
    for section in reconstructed['children']:
        span = section.pop('profileControlsRange', None)
        if span is not None: section['children'] = controls[span[0]:span[0]+span[1]]
    if reconstructed != tree(root): raise ValueError('Source graph retention failed')
    return profile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--inventory', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--registry', type=Path, required=True, help='New JS digest-only trust registry')
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if args.output_dir.exists() or args.registry.exists() or args.report.exists(): raise ValueError('Refusing overwrite')
    inventory = json.loads(args.inventory.read_text())
    profiles, registry = [], {}
    for record in inventory['files']:
        if record.get('root') != 'root' or Path(record['path']).parts[0] not in ['midi', 'hid', 'audio']: continue
        path = args.root / record['path']
        if path.is_symlink() or not path.resolve().is_relative_to(args.root.resolve()): raise ValueError('Unsafe definition path')
        data = path.read_bytes()
        if digest(data) != record['sha256']: raise ValueError('Definition differs from reviewed inventory')
        profile = parse_factory(data, record['path'])
        if node_count(profile) > 450000: raise ValueError('Single profile exceeds catalog node budget')
        profiles.append(profile); registry[profile['sourceSHA256']] = profile_digest(profile)
    if len(profiles) != inventory['hardwareDefinitions']: raise ValueError('Definition count mismatch')
    batches, batch = [], []
    for profile in profiles:
        candidate = {'format': 'open-play-controller-catalog-v1', 'profiles': batch+[profile]}
        if batch and (node_count(candidate) > 450000 or len(canonical(candidate).encode()) > 30*1024*1024):
            batches.append(batch); batch = []
        batch.append(profile)
    if batch: batches.append(batch)
    args.output_dir.mkdir(parents=True, mode=0o700)
    shards = []
    for index, batch in enumerate(batches, 1):
        output = canonical({'format': 'open-play-controller-catalog-v1', 'profiles': batch}).encode()
        path = args.output_dir / f'factory-{index:03d}.json'; path.write_bytes(output); path.chmod(0o600)
        shards.append({'file': path.name, 'profiles': len(batch), 'bytes': len(output), 'nodes': node_count(json.loads(output)), 'sha256': digest(output)})
    args.registry.write_text('// Reviewed source and normalized-content digests only. No vendor mapping trees.\nexport const officialFactoryDigests='+json.dumps(registry, sort_keys=True, indent=2)+';\n')
    report = {'adapterVersion': VERSION, 'definitions': len(profiles), 'sourceGraphsReconstructed': len(profiles),
              'translatedAssignments': sum(len(p['mappings']) for p in profiles), 'shards': shards,
              'fullyTranslatedDefinitions': 0, 'physicalCompatibilityVerified': False,
              'profiles': [{'sourceFile': p['sourceFile'], 'sourceSHA256': p['id'], 'normalizedSHA256': registry[p['id']], 'controls': len(p['controls']), 'mappings': len(p['mappings']), 'issues': len(p['issues'])} for p in profiles]}
    args.report.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({key: report[key] for key in ['definitions', 'sourceGraphsReconstructed', 'translatedAssignments', 'fullyTranslatedDefinitions']}))
    print(f'{len(shards)} private catalog shards written')


if __name__ == '__main__': main()
