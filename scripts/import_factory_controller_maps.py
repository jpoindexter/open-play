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
import re
from pathlib import Path
import xml.etree.ElementTree as ET
from import_serato_maps import tree, integer, digest, ENCODINGS

VERSION = 'open-play-factory-adapter-v3'
PAD_MODES = {0: 'hot cues', 2: 'loop roll', 5: 'sampler', 9: 'manual loop',
             11: 'auto loop', 14: 'pitch play', 23: 'scratch bank', 25: 'stems'}
MODE_NAMES = {'Hot Cues Mode': 'hot cues', 'Loop Roll Mode': 'loop roll',
              'Sampler Mode': 'sampler', 'Manual Loop Mode': 'manual loop',
              'Auto Loop Mode': 'auto loop', 'Pitch Play Mode': 'pitch play',
              'Scratch Bank Mode': 'scratch bank', 'Stems Pad Mode': 'stems'}
FIELDS = ['adapterVersion', 'name', 'sourceFile', 'sourceSHA256', 'sourceEnvelope',
          'controls', 'mappings', 'issues', 'outputBranches']
BUTTONS = {'play': 'play', 'load_track': 'load', 'cue': 'cue', 'sync': 'sync',
           'sync_off': 'sync off', 'pfl': 'headphone cue', 'slip_mode': 'slip',
           'quantize': 'quantize', 'platter_jog_mode': 'vinyl',
           'previous_track': 'previous', 'pitch_range': 'tempo range',
           'auto_loop_enable': 'auto loop four', 'loop_in': 'loop in',
           'loop_out': 'loop out', 'loop_length_half': 'loop half',
           'loop_length_double': 'loop double', 'platter_touch': 'jog touch',
           'cue_play': 'stutter', 'tap_tempo': 'tap tempo',
           'upfader_start_enable': 'fader start enable'}
CONTINUOUS = {'upfader': 'level', 'deck_eq_hi': 'high', 'deck_eq_mid': 'mid',
              'deck_eq_lo': 'low', 'trim': 'trim', 'deck_filter_auto': 'filter',
              'pitch_slider': 'tempo', 'pitch_slider_shift': 'tempo ignore'}
TOGGLES = {'play', 'pfl', 'slip_mode', 'quantize', 'platter_jog_mode', 'auto_loop_enable'}
GLOBALS = {'master_volume': 'Master volume', 'cue_gain': 'Cue volume',
           'tab_library': 'Library backward'}
FX_ACTIONS = {'effect_level_1_slot_enable', 'effect_level_1_slot_parameter_1',
              'effect_scroll', 'effect_bank_beats_multiplier'}


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


def adapt(control, action, *, hercules=False):
    if set(control.attrib) - {'channel', 'event_type', 'control', 'data_type', 'complement_control', 'access'}:
        raise ValueError('Additional input attributes retained; no adapter')
    if control.get('access') not in [None, 'read only', 'read write']:
        raise ValueError('Non-input access retained')
    name = action.tag
    fx = name in FX_ACTIONS
    if fx and not hercules: raise ValueError('FX slot/level addressing needs a verified device-specific policy')
    if set(action.attrib) - {'deck_set', 'deck_id', 'slot_id'} or action.get('deck_set', 'Default') != 'Default':
        raise ValueError('Additional action addressing retained')
    slot = integer(action.get('slot_id', '0'), 0, 127, 'Slot')
    modifier = re.fullmatch(r'modifier_([1-9]|1[0-6])', name)
    grid = name in ['grid_control_mode_input', 'grid_control_pad', 'grid_control_pad_shift']
    if slot != 0 and not grid and not fx: raise ValueError('Nonzero slot needs a separate adapter')
    global_action = name in ['library_scroll', 'fast_library_scroll', 'crossfader', 'add_song_to_prepare_crate', 'library_prepare_tab', *GLOBALS] or bool(modifier and action.get('deck_id') is None)
    if global_action:
        if action.attrib: raise ValueError('Global action has additional addressing')
        target = {'library_scroll': 'Library browse', 'fast_library_scroll': 'Library fast browse',
                  'crossfader': 'Crossfader', 'add_song_to_prepare_crate': 'Prepare add',
                  'library_prepare_tab': 'Prepare open', **GLOBALS}.get(name, f'Controller modifier {modifier[1]}' if modifier else '')
    elif fx:
        unit = integer(action.get('deck_id'), 0, 1, 'FX unit')+1
        if name == 'effect_bank_beats_multiplier':
            if slot: raise ValueError('FX unit beat action has unexpected slot')
            target = f'FX unit {unit} beat multiplier'
        else:
            # Exact Hercules resource plus official quickstart identify these
            # controls with its first slot; the legacy schema slot note conflicts.
            if slot != 1: raise ValueError('Other FX slot numbering remains unresolved')
            suffix = {'effect_level_1_slot_enable': 'enable', 'effect_level_1_slot_parameter_1': 'depth',
                      'effect_scroll': 'menu' if control.get('event_type') == 'Note On' else 'select'}[name]
            target = f'FX unit {unit} slot 1 {suffix}'
    else:
        deck = integer(action.get('deck_id'), 0, 3, 'Deck') + 1
        if name == 'grid_control_mode_input':
            if slot not in PAD_MODES: raise ValueError('Unknown pad mode identity retained')
            suffix = 'pad mode '+PAD_MODES[slot]
        elif name.startswith('grid_control_pad'):
            if slot > 7: raise ValueError('Pad slot exceeds eight supported pads')
            suffix = f'active {"shift " if name.endswith("_shift") else ""}pad {slot+1}'
        elif modifier: suffix = f'controller modifier {modifier[1]}'
        else: suffix = BUTTONS.get(name) or CONTINUOUS.get(name)
        if suffix is None: raise ValueError('Action needs a separate adapter')
        target = f'Deck {deck} {suffix}'
    event = control.get('event_type')
    if event not in ['Note On', 'Control Change']: raise ValueError('MIDI event needs an adapter')
    channel = integer(control.get('channel'), 1, 16, 'Channel')
    number = integer(control.get('control'), 0, 127, 'Controller')
    kind = 'Note' if event == 'Note On' else 'CC'
    if (grid or modifier or name in ['add_song_to_prepare_crate', 'library_prepare_tab', 'tab_library', 'upfader_start_enable']) and kind != 'Note':
        raise ValueError('Performance/modifier/library button requires Note press and release')
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
        if name not in BUTTONS and not grid and not modifier and name not in ['add_song_to_prepare_crate', 'library_prepare_tab', 'tab_library', 'effect_level_1_slot_enable', 'effect_scroll']: raise ValueError('Button action needs an adapter')
        if encoding != '7-bit absolute': raise ValueError('Button encoding needs an adapter')
        if rule is not None:
            toggle = not len(rule) and dict(rule.attrib) == {'action_on': 'press', 'behaviour': 'toggle'} and name in TOGGLES|{'effect_level_1_slot_enable', 'effect_scroll'}
            explicit = not len(rule) and dict(rule.attrib) in [{'behaviour': 'explicit'}, {'behaviour': 'explicit', 'action_on': 'any'}] and (grid or modifier or name == 'upfader_start_enable')
            prepare = name == 'library_prepare_tab' and not rule.attrib and all(c.tag == 'alias' and c.attrib in [{'name': 'on', 'value': '127'}, {'name': 'off', 'value': '0'}] for c in rule) and len(rule) == 2
            backward = name == 'tab_library' and not len(rule) and rule.attrib == {'action_on': 'press', 'behaviour': 'static', 'static_value': 'Backward'}
            if not (toggle or explicit or prepare or backward): raise ValueError('Button translation semantics need an adapter')
    else:
        if name not in CONTINUOUS and not global_action and not fx: raise ValueError('CC command semantics need an adapter')
        if name in ['library_scroll', 'fast_library_scroll']:
            if not encoding.startswith('Relative') or rule is not None: raise ValueError('Relative library translation needs an adapter')
        elif encoding not in ['7-bit absolute', '14-bit absolute']:
            raise ValueError('Continuous encoding needs an adapter')
        if rule is not None:
            maximum = '16383' if encoding == '14-bit absolute' else '127'
            if name == 'effect_scroll' and not len(rule) and rule.attrib == {'action_on': 'any', 'behaviour': 'explicit_on_down'}:
                return dict(target=target, type=kind, channel=channel, number=number, encoding=encoding, invert=False), False
            if rule.attrib or len(rule) != 1 or rule[0].tag != 'range': raise ValueError('Continuous translation needs an adapter')
            attrs = rule[0].attrib
            if len(rule[0]) or dict(attrs) not in [
                {'in_min': '0', 'in_max': maximum, 'out_min': '0', 'out_max': '1'},
                {'in_min': '0', 'in_max': maximum, 'out_min': '1', 'out_max': '0'}]:
                raise ValueError('Non-normalized range retained; no adapter')
            invert = attrs['out_min'] == '1'
    return dict(target=target, type=kind, channel=channel, number=number,
                encoding=encoding, invert=invert), rule is None


def conditions(node):
    """Compile only known conjunctions; app predicates target DJ Pro explicitly."""
    if node is None or node.attrib or not len(node): raise ValueError('Condition structure needs an adapter')
    predicates = []
    for term in node:
        if len(term) or set(term.attrib)-{'cmp_value', 'operator', 'deck_id', 'deck_set'}:
            raise ValueError('Additional condition semantics retained')
        operator = term.get('operator', 'equal')
        if operator not in ['equal', 'not equal']: raise ValueError('Condition operator needs an adapter')
        value = term.get('cmp_value'); negate = operator == 'not equal'
        if term.tag == 'current_active_app':
            if set(term.attrib)-{'cmp_value', 'operator'}: raise ValueError('App condition addressing retained')
            if value not in ['Serato DJ', 'Serato DJ Pro', 'Serato DJ Lite']: raise ValueError('Unknown app identity retained')
            matches = value in ['Serato DJ', 'Serato DJ Pro']
            if matches == negate: return None
            continue
        if term.get('deck_set', 'Default') != 'Default': raise ValueError('Condition deck layer needs an adapter')
        modifier = re.fullmatch(r'modifier_([1-9]|1[0-6])', term.tag)
        if modifier:
            if value not in ['on', 'off']: raise ValueError('Modifier value needs an adapter')
            deck = integer(term.get('deck_id'), 0, 3, 'Condition deck')+1 if term.get('deck_id') is not None else 0
            predicates.append(dict(kind='modifier', number=int(modifier[1]), deck=deck, equals=(value == 'on') != negate))
        elif term.tag == 'grid_control_mode':
            if value not in MODE_NAMES: raise ValueError('Unknown condition pad mode retained')
            deck = integer(term.get('deck_id'), 0, 3, 'Condition deck')+1
            predicates.append(dict(kind='padMode', deck=deck, equals=MODE_NAMES[value], negate=negate))
        else: raise ValueError('Condition state needs an adapter')
    if len(predicates) > 16: raise ValueError('Too many condition predicates')
    return predicates


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
    hercules = any(d.find('vendor_id') is not None and d.find('product_id') is not None and
                   int(d.find('vendor_id').get('value', '-1'), 0) == 0x06f8 and
                   int(d.find('product_id').get('value', '-1'), 0) == 0xb12f
                   for d in root if d.tag.endswith('_device'))
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
            if any(child.tag not in ['userio', 'case'] for child in control):
                issues.append({'controlIndex': index, 'reason': 'Additional control branches retained; no adapter'}); continue
            branches = [(control, None)] if not control.findall('case') else []
            if control.findall('case') and control.findall('userio'):
                issues.append({'controlIndex': index, 'reason': 'Mixed direct/case branches retained; no adapter'}); continue
            for case_index, case in enumerate(control.findall('case')):
                try:
                    if case.attrib or any(c.tag not in ['condition', 'userio'] for c in case) or len(case.findall('condition')) != 1: raise ValueError('Case structure needs an adapter')
                    predicates = conditions(case.find('condition'))
                    if predicates is not None: branches.append((case, (case_index, predicates)))
                except ValueError as error: issues.append({'controlIndex': index, 'caseIndex': case_index, 'reason': str(error)})
            for branch, condition in branches:
                clicks = [child for child in branch if child.tag == 'userio' and child.get('event') == 'click']
                if not clicks: continue
                if len(clicks) != 1 or set(clicks[0].attrib) != {'event'} or any(c.tag == 'userio' and c.get('event') not in ['click', 'output'] for c in branch):
                    issues.append({'controlIndex': index, 'reason': 'Additional input event semantics retained'}); continue
                for action in clicks[0]:
                    try:
                        mapping, default = adapt(control, action, hercules=hercules)
                        mapping.update(sourceControlIndex=index, sourceAction=action.tag)
                        if condition is not None: mapping.update(sourceCaseIndex=condition[0], conditions=condition[1])
                        mappings.append(mapping)
                        if default: defaults.add(action.tag)
                    except ValueError as error:
                        issues.append({'controlIndex': index, 'action': action.tag, 'reason': str(error)})
    if defaults:
        issues.append({'reason': 'Source omits translation: Open Play uses its named action behavior; vendor default equivalence unverified', 'actions': sorted(defaults)})
    outputs = sum(node.get('event') == 'output' for node in root.iter('userio'))
    if outputs: issues.append({'reason': 'All output/lighting branches retained but inactive', 'branches': outputs})
    issues.append({'reason': 'Device metadata, initialization and global semantics retained; no hardware initialization or compatibility claim'})
    issues.append({'reason': 'Adapter targets DJ Pro app branches. Runtime predicates cover conjunctions of supported modifiers/pad modes only. Other app/state branches retained inactive; compound events may be partially adapted. Initial Hot Cues is Open Play policy, not proved vendor initialization.'})
    if hercules:
        issues.append({'reason': 'Hercules first FX slot follows its official device guide despite conflicting legacy schema slot notes. FX selection timeout2s, normalized effect-list selection and cue/master tapers are independent Open Play policies; hardware and exact vendor response unverified.'})
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
    parser.add_argument('--previous-registry', type=Path, help='Reviewed earlier digest registry; preserve import compatibility')
    args = parser.parse_args()
    if args.output_dir.exists() or args.registry.exists() or args.report.exists(): raise ValueError('Refusing overwrite')
    inventory = json.loads(args.inventory.read_text())
    profiles, registry = [], {}
    previous = {}
    if args.previous_registry:
        previous = json.loads(args.previous_registry.read_text().split('export const officialFactoryDigests=', 1)[1].strip().removesuffix(';'))
    for record in inventory['files']:
        if record.get('root') != 'root' or Path(record['path']).parts[0] not in ['midi', 'hid', 'audio']: continue
        path = args.root / record['path']
        if path.is_symlink() or not path.resolve().is_relative_to(args.root.resolve()): raise ValueError('Unsafe definition path')
        data = path.read_bytes()
        if digest(data) != record['sha256']: raise ValueError('Definition differs from reviewed inventory')
        profile = parse_factory(data, record['path'])
        if node_count(profile) > 450000: raise ValueError('Single profile exceeds catalog node budget')
        profiles.append(profile)
        old = previous.get(profile['sourceSHA256'], [])
        old = [old] if isinstance(old, str) else old
        registry[profile['sourceSHA256']] = list(dict.fromkeys(old+[profile_digest(profile)]))
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
              'profiles': [{'sourceFile': p['sourceFile'], 'sourceSHA256': p['id'], 'normalizedSHA256': profile_digest(p), 'controls': len(p['controls']), 'mappings': len(p['mappings']), 'conditionalMappings': sum('conditions' in m for m in p['mappings']), 'issues': len(p['issues'])} for p in profiles]}
    args.report.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({key: report[key] for key in ['definitions', 'sourceGraphsReconstructed', 'translatedAssignments', 'fullyTranslatedDefinitions']}))
    print(f'{len(shards)} private catalog shards written')


if __name__ == '__main__': main()
