#!/usr/bin/env python3
"""Inventory installed factory XML definitions without executing controller code.

Explicit decoded ZIP input; private raw output and metadata-only public report.
Never infer physical compatibility or completed translation from source recovery.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import xml.etree.ElementTree as ET
import zipfile


def describe(content, name):
    identity = {'path': name, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest(),
                'sourceKind': 'official_serato_installed_resource', 'sourceRecovered': True,
                'fullyTranslated': False, 'physicalCompatibilityVerified': False}
    if b'<!DOCTYPE' in content.upper() or b'<!ENTITY' in content.upper():
        # Retain unsupported input as bytes, never resolve its external URI or
        # silently discard the rest of the controller archive.
        return {**identity, 'root': 'xml_dtd_retained_unparsed',
                'reason': 'DTD/entity declarations retained as data; external references not resolved'}
    root = ET.fromstring(content)
    stack, nodes = [(root, 0)], 0
    while stack:
        node, depth = stack.pop(); nodes += 1
        if depth > 64 or nodes > 200000: raise ValueError('XML tree limit exceeded')
        stack.extend((child, depth+1) for child in node)
    tags = Counter(node.tag for node in root.iter())
    result = {**identity, 'root': root.tag, 'nodes': nodes}
    if root.tag == 'root':
        descriptors = [node for node in root if node.tag in ('native_intro_device','native_pro_device','osa_device')]
        result.update(supportedApps=[app.get('value') for app in root.findall('./supported_apps/app')],
                      descriptors=[{'kind': node.tag, 'name': node.get('name'), 'displayName': node.get('display_name'),
                                    'properties': {child.tag:dict(child.attrib) for child in node if child.tag in ('vendor_id','product_id','midi_name','num_decks','mac_audio_api','win_audio_api','hardware_mixer')}} for node in descriptors],
                      sections=[node.tag for node in root if node.tag in ('midi','hid','audio')],
                      controlElements=tags['control'], conditions=tags['condition'],
                      outputBranches=sum(node.get('event')=='output' for node in root.iter('userio')),
                      actionKinds=sorted({action.tag for userio in root.iter('userio') for action in userio}),
                      initMessages=tags['init_midi_string'], finalMessages=tags['final_midi_string'])
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive'); parser.add_argument('--private-output', required=True)
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    source, output, report_path = Path(args.archive), Path(args.private_output), Path(args.report)
    if source.is_symlink() or source.stat().st_size > 128*1024*1024: raise ValueError('Use a regular archive of at most128MiB')
    if output.exists() or report_path.exists(): raise ValueError('Use new output paths; earlier evidence is preserved')
    pending, records, total = [], [], 0
    with zipfile.ZipFile(source) as archive:
        entries = archive.infolist()
        if len(entries)>4096: raise ValueError('Archive entry limit exceeded')
        paths = set()
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if not path.parts or path==PurePosixPath('.') or path.is_absolute() or '..' in path.parts or '\\' in entry.filename or '\0' in entry.filename or stat.S_ISLNK(entry.external_attr>>16): raise ValueError('Unsafe archive path/symlink')
            if entry.is_dir(): continue
            if str(path) in paths: raise ValueError('Duplicate archive path')
            paths.add(str(path))
            if not 0 <= entry.file_size <= 16*1024*1024: raise ValueError('Entry exceeds16MiB')
            total += entry.file_size
            if total>256*1024*1024: raise ValueError('Uncompressed batch exceeds256MiB')
            data = archive.read(entry) # CRC is checked by the standard ZIP reader.
            if len(data)!=entry.file_size: raise ValueError('Archive entry length mismatch')
            record = describe(data, entry.filename) if path.suffix.lower() in ('.xml','.xsd') else {'path':entry.filename,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'root':'unparsed_non_xml'}
            record['zipCRC32']=f'{entry.CRC:08x}';records.append(record);pending.append((path,data))
    output.mkdir()
    for relative, content in pending:
        destination=output.joinpath(*relative.parts);destination.parent.mkdir(parents=True,exist_ok=True)
        with destination.open('xb') as file:file.write(content)
    definitions=[row for row in records if row['root']=='root']
    report={'date':'2026-10-18','archiveSHA256':hashlib.file_digest(source.open('rb'),'sha256').hexdigest(),
            'entries':len(records),'totalUncompressedBytes':total,'allEntryCRCsChecked':True,
            'rootKinds':dict(Counter(row['path'].split('/')[0]+'/'+row['root'] for row in records)),
            'hardwareDefinitions':len(definitions),'definitionControlElements':sum(row['controlElements'] for row in definitions),
            'definitionConditions':sum(row['conditions'] for row in definitions),
            'fullyTranslatedDefinitions':0,'physicalCompatibilityVerified':False,
            'files':records,'scope':'All entries in this installed userio archive recovered and parsed as bounded data. Definition files, supporting color/schema/OSC/ACI resources are separate. Not every historical/partner/embedded-native controller, completed action translation, physical operation or full Serato parity.'}
    with report_path.open('x') as file:json.dump(report,file,indent=2);file.write('\n')
    print(json.dumps({key:report[key] for key in ['entries','hardwareDefinitions','definitionControlElements','definitionConditions','rootKinds']}))


if __name__=='__main__':main()
