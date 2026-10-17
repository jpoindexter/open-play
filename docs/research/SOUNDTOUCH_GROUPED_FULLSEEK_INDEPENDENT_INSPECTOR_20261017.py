#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import hashlib,json,subprocess,math,posixpath,re
import numpy as np
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(Path(__file__).parent))
from SOUNDTOUCH_GROUPED_STEMS_INDEPENDENT_INSPECTOR_20261017 import H,J,frequency
OUT=ROOT/'docs/research/SOUNDTOUCH_GROUPED_FULLSEEK_INDEPENDENT_RESULTS_20261017.json'
def main():
 assert not OUT.exists();assert H(ROOT/'docs/research/SOUNDTOUCH_GROUPED_STEMS_INDEPENDENT_INSPECTOR_20261017.py')=='869ccc6abc00837ad0d1d1f4523c208405b15890e6c4517147852676938273b0'
 rp=ROOT/'docs/prototype/soundtouch-grouped-fullseek-stems-results.json';r=J(rp);plan=J(ROOT/'docs/prototype/soundtouch-grouped-fullseek-stems-plan.json');assert r['plan']==plan and not r['fullParityVerified'];manifest=r['sourceIdentities'];assert len(manifest)==70
 sources={}
 for m in manifest:
  p=ROOT/m['snapshot'];assert p.stat().st_size==m['bytes'] and H(p)==m['sha256'];assert H(ROOT/m['file'])==m['sha256'];sources[m['file']]=p
 transport='experiments/keylock-soundtouch/grouped-fullseek-pull-transport.mjs';guide='experiments/keylock-soundtouch/shared-overlap-guide.mjs';assert H(sources[transport])==r['sourceSHA256']=='3e7d9768c5213047432375f8638c4f234f47df164c02175be1114bb380276847'
 quick=(ROOT/'experiments/keylock-soundtouch/grouped-pull-transport.mjs').read_text();full=sources[transport].read_text();assert '\n'.join(full.splitlines()[1:]).replace('    this.pipe.stretch.setStretchParameters({quickSeek:false});\n','')=='\n'.join(quick.splitlines()[1:])
 visited=set();edges=[]
 def walk(name):
  if name in visited:return
  visited.add(name);text=sources[name].read_text()
  for line in text.splitlines():
   match=re.match(r"^(?:import|export)\s.*?\bfrom\s+['\"]([^'\"]+)['\"]",line)
   if not match:continue
   spec=match.group(1)
   if spec.startswith('.'):
    target=posixpath.normpath(posixpath.join(posixpath.dirname(name),spec))
   elif spec.startswith('@soundtouchjs/'):
    root='local-evidence/keylock-soundtouch-source/node_modules/'+spec;package=J(sources[root+'/package.json']);entry=package['exports']['.'];target=posixpath.normpath(root+'/'+entry.get('import',entry.get('default')))
   else:raise AssertionError('Unrecorded runtime dependency '+spec)
   assert target in sources;edges.append({'from':name,'specifier':spec,'to':target});walk(target)
 walk(transport)
 fixtureCode="""import crypto from 'node:crypto';let text='';for await(const c of process.stdin)text+=c;const p=JSON.parse(text),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer)).digest('hex'),result=[];for(const sr of[44100,48000]){const stems=Array.from({length:4},(_,s)=>[0,1].map(ch=>Float32Array.from({length:sr*p.fixture.seconds},(_,i)=>p.fixture.amplitudeEach*Math.sin(2*Math.PI*[p.fixture.stemLeftHz,p.fixture.stemRightHz][ch][s]*i/sr+p.fixture.phasePerStem[s]))));const original=[0,1].map(ch=>Float32Array.from({length:sr*p.fixture.seconds},(_,i)=>stems.reduce((n,s)=>n+s[ch][i],0)));result.push({sampleRate:sr,hashes:[original,...stems].map(s=>s.map(hash))})}console.log(JSON.stringify(result));"""
 fixtures=json.loads(subprocess.check_output(['node','--input-type=module','-e',fixtureCode],input=json.dumps(plan),text=True));hashes={x['sampleRate']:x['hashes'] for x in fixtures}
 script=(ROOT/'scripts/test_shared_overlap_guide.mjs').read_text();body=script[:script.index('const report=')];body=body.replace("from '../experiments/keylock-soundtouch/shared-overlap-guide.mjs'","from '"+sources[guide].as_uri()+"'");body=body.replace("const out='docs/prototype/soundtouch-shared-overlap-guide-contracts.json';assert(!fs.existsSync(out));const checks=[];",'const checks=[];');body+='console.log(JSON.stringify(checks));'
 checks=json.loads(subprocess.check_output(['node','--input-type=module','-e',body],text=True,cwd=ROOT));contracts=J(ROOT/'docs/prototype/soundtouch-shared-overlap-guide-contracts.json');assert len(checks)==6 and all(x['passed'] for x in checks) and checks==contracts['checks'] and contracts['sourceSHA256']==H(sources[guide])
 sp=J(ROOT/'docs/prototype/soundtouch-grouped-fullseek-stems-spectral-plan.json');spectral=J(ROOT/'docs/prototype/soundtouch-grouped-fullseek-stems-spectral-results.json');assert spectral['plan']==sp and sp['frequencyErrorHzMax']==1 and sp['RMSMin']==.001 and sp['windowSeconds']==[.5,2.5]
 cases=[]
 for c,spec,oldspec in zip(r['cases'],plan['cases'],spectral['cases']):
  assert all(c[k]==v for k,v in spec.items()) and c['inputHashes']==hashes[c['sampleRate']] and not c['errors'];sr=c['sampleRate'];raw=c['raw'];path=ROOT/raw['path'];assert H(path)==raw['sha256'] and path.stat().st_size==raw['bytes']==raw['frames']*10*4 and raw['frames']==math.ceil(sr*3/128)*128 and raw['channels']==10
  a=np.fromfile(path,dtype='<f4').reshape(-1,10);assert np.isfinite(a).all() and not np.any(a[:256]);lo,hi=round(.5*sr),round(2.5*sr);chans=[];tones=[]
  for ch,old in enumerate(c['channels']):
   ref=a[lo:hi,ch].astype(float);summed=sum(a[lo:hi,s*2+ch].astype(float) for s in range(1,5));delta=summed-ref;rr=float(np.sqrt(np.mean(ref*ref)));dr=float(np.sqrt(np.mean(delta*delta)));ratio=dr/rr;peak=float(np.max(np.abs(delta)));assert rr>0 and ratio<=.03 and abs(ratio-old['relativeRMS'])<1e-12 and peak==old['peakResidual'];chans.append({'channel':ch,'referenceRMS':rr,'residualRMS':dr,'relativeRMS':ratio,'peakResidual':peak})
  for s in range(4):
   for ch in range(2):
    x=a[lo:hi,(s+1)*2+ch];expected=[plan['fixture']['stemLeftHz'],plan['fixture']['stemRightHz']][ch][s]*2**(c['semitones']/12);hz=frequency(x,sr);rms=float(np.sqrt(np.mean(x.astype(float)**2)));passed=rms>.001 and abs(hz-expected)<=1;old=oldspec['channels'][s*2+ch];assert abs(hz-old['Hz'])<1e-7 and passed==old['passed'];tones.append({'stem':s,'channel':ch,'expectedHz':expected,'Hz':hz,'RMS':rms,'signedErrorHz':hz-expected,'passed':passed})
  g=c['snapshot']['epochs'][0]['overlapGuide'];assert g['participants']==g['registered']==5 and g['produced']*4==g['consumed'] and g['retainedDecisions']==0 and all(x['next']==g['produced'] for x in g['readers']);assert c['disposed']['disposed'] and c['disposed']['sourceBytes']==0 and not c['disposed']['epochs'];assert c['passed'] and oldspec['passed'] and all(t['passed'] for t in tones)
  cases.append({'id':c['id'],'sampleRate':sr,'rawSHA256':H(path),'frames':len(a),'bytes':path.stat().st_size,'wholeFinite':True,'reconstruction':chans,'spectral':tones,'guide':g,'sourceStoreZeroEpochsEmptyAfterDispose':True})
 assert len(cases)==r['passed']==spectral['passed']==6 and r['failed']==0 and spectral['failedMeasurements']==0
 frozenScript=sources['scripts/test_soundtouch_stem_reconstruction.mjs'].read_text();assert frozenScript.index('const sourceIdentities=')<frozenScript.index('for(const c of plan.cases)')
 out={'scope':'Independent serial whole10channel original PCM/source capsule/fixture/guide-contract and48spectral checks. No browser/groupcontroller/AudioEngine/native/music acceptance.','resultSHA256':H(rp),'sourceCapsule':manifest,'sourceFilesVerified':70,'inspectorInitialSchemaAssumptionCorrected':'failedMeasurements is numeric0, not an empty list; first inspector attempt stopped before writing results','reachableRuntimeModuleFiles':sorted(visited),'runtimeImportEdges':edges,'capsuleWritesPrecedeCaseLoopInFrozenScript':True,'fullseekVersusRetainedQuickVariantOnlyFunctionalDelta':'stretch.setStretchParameters({quickSeek:false}) before shared-guide attachment; separate header comment','guideSHA256':H(sources[guide]),'fixtureGeneration':fixtures,'guideContractsReexecutedWithoutOriginalWriter':checks,'guideContractScriptSHA256':H(ROOT/'scripts/test_shared_overlap_guide.mjs'),'cases':cases,'passedReconstructionCases':6,'passedSpectralCases':6,'passedSpectralMeasurements':48,'spectralPlanBeforeAnalysisOfExistingCapturesNotBeforeCapture':True,'reconstructionDoesNotEstablishMusicOrExactCursor':True,'priorQuickFailuresRegraded':False,'native017GroupedIntegrationAccepted':False}
 OUT.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n');print(json.dumps({'resultSHA256':H(OUT),'capsuleFiles':70,'runtimeModules':len(visited),'frames':sum(c['frames'] for c in cases),'rawBytes':sum(c['bytes'] for c in cases),'maxReconstructionRatio':max(x['relativeRMS'] for c in cases for x in c['reconstruction']),'maxSpectralErrorHz':max(abs(x['signedErrorHz']) for c in cases for x in c['spectral']),'contracts':len(checks)},indent=2))
if __name__=='__main__':main()
