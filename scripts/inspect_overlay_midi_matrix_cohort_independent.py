#!/usr/bin/env python3
"""Cross-report identity/accounting only; does not execute browser operations."""
import hashlib,json,sys
from pathlib import Path
initial,restored,out=map(Path,sys.argv[1:4])
if out.exists():raise SystemExit('Choose a new immutable output')
a,b=[json.loads(p.read_text()) for p in [initial,restored]]
actions=['select','opacity','scale','x','y','animation','option','on','route left','route master','route right','preset select','save preset','load preset']
expected={f'Video {kind} overlay {action}' for kind in ['text','image'] for action in actions}
first=b['checks'][0]['evidence']
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mapping=a['savedMappings']
result={
 'scope':'Cross-report immutable metadata and current-file identity; browser reload/actions are parent observations, not independently re-executed.',
 'inputs':{str(p):digest(p) for p in [initial,restored]},
 'initialChecks':len(a['checks']),'restoredChecks':len(b['checks']),
 'initialExecutedTargetsUnique':len(a['executedTargets'])==len(set(a['executedTargets'])),
 'initialExecutedTargetsExactly28OverlayTargets':set(a['executedTargets'])==expected,
 'initialMappingCount':len(mapping),
 'restoredMappingCount':len(b['savedMappings']),
 'allMappingsExactlyPreserved':mapping==first['mappings']==b['savedMappings'],
 'mappingsExpected':len(mapping)==29 and {m['target'] for m in mapping}==expected|{'Video crossfader'},
 'overlayMapsAllScoped7bitCC':all(m.get('deviceId')=='overlay-matrix-controlled-input' and m['type']=='CC' and m['encoding']=='7-bit absolute' and m['channel']==1 for m in mapping if m['target'] in expected),
 'initialSelectionEqualsFrozenReloadEntry':a['savedSelection']==first['selection'],
 'reloadEntryIsDistinctFromFinalSelection':first['selection']!=b['savedSelection'],
 'reloadFinalImageRoute':b['savedSelection']['image']['target'],
 'fixtureOriginalsEqualAcrossPhases':a['fixtures']==b['fixtures'],
 'sourceBeforeAfterStableBoth':a['sourceBefore']==a['sourceAfter'] and b['sourceBefore']==b['sourceAfter'],
 'sourceCohortIdenticalAcrossPhases':a['sourceBefore']==b['sourceBefore'],
 'sourceCount':len(a['sourceBefore']),
 'currentSourceDeltas':[{ 'path':'prototype/'+name,'runtimeSHA256':sha,'currentSHA256':digest(Path('prototype')/name)} for name,sha in a['sourceBefore'].items() if digest(Path('prototype')/name)!=sha],
 'initialFinalAudioSnapshotEqual':a['audioBefore']==a['checks'][-1]['evidence']['after'],
 'importantLimits':['Metadata equality verifies saved evidence, not an independently observed page reload.','Current post-matrix source deltas are not regraded as old-run bugs.','No all72 Video/fullREQ516/native/physical/reference parity inference.']}
out.open('x').write(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
