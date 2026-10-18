#!/usr/bin/env python3
"""Join recovered factory names to the retained official product index.

This is an exact-name candidate join, never controller compatibility acceptance.
"""
from copy import deepcopy
import json
from pathlib import Path
from build_controller_source_inventory import model_key

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'docs/research/official-serato-controller-resources-140.json'
index=ROOT/'docs/research/controller-map-hardware-coverage-139.json'
factory=json.loads(source.read_text());previous=json.loads(index.read_text())
hardware=deepcopy(previous['hardware'])
for item in hardware:
    expected=model_key(item['name'],item['manufacturer']);matches=[]
    for definition in factory['files']:
        if definition['root']!='root':continue
        labels={value for d in definition['descriptors'] for value in (d.get('name'),d.get('displayName')) if value}
        for label in labels:
            if model_key(label,item['manufacturer'])==expected:
                matches.append({'path':definition['path'],'sha256':definition['sha256'],
                                'matchedDescriptorLabel':label,'sourceKind':'official_serato_installed_resource',
                                'matchBasis':'exact normalized product/model name only','fullyTranslated':False,
                                'physicalCompatibilityVerified':False})
                break
    item['officialFactoryMapping']={'status':'recovered_name_candidate' if matches else 'not_matched_to_this_archive',
                                    'candidates':matches,'limit':'Name join only. No physical/translation acceptance; unmatched names may use aliases, native compiled descriptors or another provider.'}
report={'date':'2026-10-18','officialIndex':previous['officialIndex'],'officialIndexSHA256':previous['officialIndexSHA256'],
        'hardwareProducts':len(hardware),'recoveredFactoryDefinitionFiles':factory['hardwareDefinitions'],
        'productsWithRecoveredFactoryNameCandidates':sum(bool(x['officialFactoryMapping']['candidates']) for x in hardware),
        'productsWithAlternativeNameCandidates':previous['productsWithAlternativeNameCandidates'],
        'labels':previous['labels'],'hardware':hardware,
        'scope':'Recovered installed factory source names joined to retained195product cards. Includes MIDI/HID/audio/accessories and retained alternative candidates. Not a complete historical/native/partner inventory, source conversion or physical acceptance. Exact app signature/archive evidence is in serato-factory-resource-trace-140.json.'}
output=ROOT/'docs/research/controller-map-hardware-coverage-140.json'
if output.exists():raise FileExistsError('Preserve earlier coverage; use a new report version')
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({key:report[key] for key in ('hardwareProducts','recoveredFactoryDefinitionFiles','productsWithRecoveredFactoryNameCandidates','productsWithAlternativeNameCandidates')}))
