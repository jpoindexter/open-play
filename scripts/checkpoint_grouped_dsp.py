"""Snapshot this scoped investigation; never infer behavior from a hash check."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections
R=Path(__file__).resolve().parents[1];out=R/'docs/delivery/soundtouch-grouped-checkpoint.json';assert not out.exists()
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def rec(p):return {'path':str(p.relative_to(R)),'bytes':p.stat().st_size,'sha256':sha(p)}
# Every current change belongs to this bounded unit. Protect all product payloads.
status=subprocess.check_output(['git','status','--porcelain','-z','--untracked-files=all'],cwd=R).split(b'\0');owned=[]
for item in status:
 if not item:continue
 path=item[3:].decode();assert not path.startswith(('prototype/','desktop/')) and path not in ['Start Open Play Desktop.command','Start Open Play Keylock Test.command','PROJECT_PROMPT.md'],path
 assert path.startswith(('docs/','experiments/keylock-soundtouch/','scripts/','handoffs/')) or path=='FULL_BUILD_PLAN.md',path
 owned.append(R/path)
audit=json.loads((R/'docs/research/CURRENT_PARITY_AUDIT_20261017.json').read_text());features=audit['features'];req=[r for f in features for r in f['requirement_evidence']];assert len(features)==110 and len(req)==522 and all(f['full_feature_parity_verified'] is False for f in features);assert all(r['canonical_reference_parity_verified'] is not True for r in req)
flags=collections.Counter('unset' if r['canonical_reference_parity_verified'] is None else str(r['canonical_reference_parity_verified']).lower() for r in req);assert dict(flags)=={'unset':476,'false':46}
preserved=json.loads((R/'docs/research/SOUNDTOUCH_GROUPED_PRODUCT_PRESERVATION_20261017.json').read_text()); payload=preserved['actual_default016_ASAR_sources'];assert len(payload)==222
for row in payload:assert sha(R/row['source_path'])==row['sha256']
native=[]
for rel,want in [('local-evidence/desktop-builds/0.1.6/Open Play Test-darwin-arm64/Open Play Test.app/Contents/Resources/app.asar','f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e'),('local-evidence/desktop-builds/0.1.7/Open Play Keylock Test-darwin-arm64/Open Play Keylock Test.app/Contents/Resources/app.asar','6d79bff7d0c33a827ff3734ba2485293571a90102275e3fbebe3212b4592b025')]:
 p=R/rel;row=rec(p);assert row['sha256']==want;native.append(row)
prompt=(R/'PROJECT_PROMPT.md').read_bytes();assert len(prompt)==20996 and hashlib.sha256(prompt).hexdigest()=='699d5f1556d148800fda22362be86b6f4acdcaac06dca0f5801b025af1291c8e';assert (R/'handoffs/codex-to-claude-completeness-audit.md').read_bytes().endswith(prompt)
roots=['soundtouch-nonidentical-stems','soundtouch-grouped-stems','soundtouch-grouped-fullseek-stems','soundtouch-engine-browser-group-worklet','soundtouch-engine-browser-group-worklet-owned','soundtouch-engine-browser-group-engine','soundtouch-group-resume-diagnostic','soundtouch-group-resume-diagnostic2','rubberband-grouped-offline','rubberband-grouped-realtime-mode','rubberband-endpoint-markers']
raw=[];frozen=[];localOther=[]
for name in roots:
 d=R/'local-evidence'/name;assert d.is_dir(),name
 for p in sorted(d.rglob('*')):
  if not p.is_file():continue
  row=rec(p)
  if p.suffix in ['.f32','.f32le']:raw.append(row)
  elif 'source-snapshots' in p.parts:frozen.append(row)
  else:localOther.append(row)
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parentGitHEAD':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'scope':'Private scoped investigation checkpoint. Hash/flag preservation is accounting evidence only, not fresh behavior/native/fullparity acceptance. Complete raw and public source capsules remain ignored locally.','fullParityVerified':False,'scopeCounts':{'features':110,'requirements':522,'separateBeta':9,'separateReleaseChecks':26},'requirementFlags':dict(flags),'productionPrototypeCurrentFilesVerified':222,'installedASARsUnchanged':native,'promptSuffixExact':True,'ownedFiles':[rec(p) for p in sorted(owned)],'wholeRaw':raw,'rawTotalBytes':sum(r['bytes'] for r in raw),'frozenSourceFiles':frozen,'frozenSourceFileCount':len(frozen),'otherLocalEvidence':localOther,'acceptance':'Serial/grouped browser subsets pass scoped criteria; actualengine1/2 pitch and R3RealTime-mode duration/marker failures remain. ChangedACKadapter has controlled tests only. No production integration/cardcompletion/publicrelease/fullClaudeaudit.'}
out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'files':len(owned),'rawFiles':len(raw),'rawBytes':report['rawTotalBytes'],'sourceSnapshots':len(frozen),'flags':dict(flags),'prototypePreserved':222,'ASARsPreserved':2,'promptExact':True,'fullParityVerified':False},indent=2))
