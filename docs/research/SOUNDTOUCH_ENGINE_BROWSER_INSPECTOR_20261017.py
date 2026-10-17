#!/usr/bin/env python3
"""Offline inspection of the frozen experimental engine preflight cohort."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,hashlib,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts'))
from inspect_keylock_pitch_isolation_independent import frequency
OUT=ROOT/'docs/research/SOUNDTOUCH_ENGINE_BROWSER_INDEPENDENT_RESULTS_20261017.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
fftCache={}
def stats(x,sr,fft=True):
 a=x.astype(float);rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));a-=a.mean();i=np.flatnonzero((a[:-1]<0)&(a[1:]>=0));v=i-a[i]/(a[i+1]-a[i]);hz=float((len(v)-1)*sr/(v[-1]-v[0])) if len(v)>1 else None
 result={'RMS':rms,'peak':peak,'crossingHz':hz}
 if fft:
  key=(sr,hashlib.sha256(x.tobytes()).hexdigest())
  if key not in fftCache:fftCache[key]=frequency(x,sr)
  result['HannHz']=fftCache[key]
 return result
def src_section(text):return text[text.index('const srcTables=new Map()'):text.index('\nfunction normalize')]
def selected(snapshot):return next(g['id'] for g in snapshot['groups'] if g['role']=='selected')
def main():
 assert not OUT.exists(),'Refusing to overwrite evidence'
 reportPath=ROOT/'docs/prototype/soundtouch-engine-browser-preflight-results.json';r=J(reportPath);assert r['completed'] and not r['fatalErrors'] and r['full_parity_verified'] is False
 base=ROOT/'local-evidence/soundtouch-engine-browser-preflight/source-snapshots';routes=[];currentDifferences=[]
 for url,m in r['servedSources']['routes'].items():
  p=base/(url.lstrip('/') or 'index.html');assert H(p)==m['servedSHA256'];served=p.read_bytes();original=served
  if m['importSpecifierOnlyRewrite']:
   old=b"from '/official/lanczos/index.js'";assert served.count(old)==1;original=served.replace(old,b"from '@soundtouchjs/interpolation-strategy-lanczos'")
  assert hashlib.sha256(original).hexdigest()==m['sourceSHA256']
  current=ROOT/m['path'];currentHash=H(current)
  if currentHash!=m['sourceSHA256']:currentDifferences.append({'url':url,'path':m['path'],'frozenSHA256':m['sourceSHA256'],'currentSHA256':currentHash,'creditedToThisRun':False})
  routes.append({'url':url,**m,'preservedServedSnapshot':str(p.relative_to(ROOT))})
 assert len(routes)==245 and sum(x['importSpecifierOnlyRewrite'] for x in routes)==1
 engine=base/'prototype/engine.js';assert H(engine)==H(ROOT/'prototype/engine.js')=='b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf'
 actualAdapter=(base/'prototype/keylock-shadow-live.js').read_text();productionAdapter=(ROOT/'prototype/keylock-shadow-live.js').read_text();assert src_section(actualAdapter)==src_section(productionAdapter)
 assert r['servedSources']['routes']['/prototype/keylock-shadow-live.js']['path']=='experiments/keylock-soundtouch/live-adapter.js'
 frozenFactory=(base/'experiments/keylock-soundtouch/node-factory.mjs').read_text();assert '\n  await registration;' in frozenFactory
 plan=J(base/'plan.json');assert r['plan']==plan;assert plan['criteria']['pitch_error_hz']==1 and plan['criteria']['control_error_hz']==.01 and plan['criteria']['frame_tag_error_samples']==.25
 factor=2**(2/12);expected={'neutral':[330,550],'shifted':[330*factor,550*factor],'keylock-off':[412.5,687.5],'warm-follow':[412.5,687.5],'rebase':[825,1100],'resume':[660*factor,880*factor]};cases=[]
 for row,spec in zip(r['cases'],plan['cases']):
  assert all(row[k]==v for k,v in spec.items());cap=row['capture'];p=ROOT/cap['retained']['path'];sr=spec['sampleRate'];channels=2*(spec['sources']+1)+2
  assert H(p)==cap['sha256']==cap['retained']['sha256'];assert p.stat().st_size==cap['retained']['bytes']==cap['frames']*channels*4;assert channels==cap['channels'] and sr==cap['sampleRate']==row['environment']['sampleRate'];a=np.fromfile(p,dtype='<f4').reshape(-1,channels);assert np.isfinite(a).all();blocks=row['blocks'];assert len(a)==128*len(blocks)
  anomalies=[]
  for i,b in enumerate(blocks):
   assert b['sequence']==i and b['frames']==128 and b['frame']%128==0
   if i and b['frame']!=blocks[i-1]['frame']+128:anomalies.append({'index':i,'previous':blocks[i-1],'actual':b})
  producer=np.concatenate([np.arange(b['frame'],b['frame']+128,dtype=float) for b in blocks]);tag=a[:,-1].astype(float);globalError=float(np.max(np.abs(tag-producer)));stepError=float(np.max(np.abs(np.diff(tag)-1)));mismatches=int(np.count_nonzero(np.abs(tag-producer)>.25));capturePassed=not anomalies and globalError<=.25
  assert globalError==cap['maxFrameTagError'] and cap['valid']==capturePassed and cap['contiguous']==(not anomalies)
  assert row['arm']['frames']==row['arm']['sequence']==0 and row['captureStop']['frames']==len(a) and row['captureStop']['sequence']==len(blocks)
  sched=row['frameTagSchedule'];assert sched['startFrame']%128==0 and sched['endFrame']==sched['startFrame']+60*sr and sched['issuedAtFrame']<sched['startFrame'];assert cap['firstFrame']>=sched['startFrame']+256 and cap['firstFrame']+len(a)<=sched['endFrame']
  measures=[]
  for event,m in zip(row['events'],row['measurements']):
   label=m['label'];assert label==event['label'] and label in expected and m['window']==[event['state']['when']+.5,event['state']['when']+1.5];assert m['expectedHz']==expected[label];first,last=[round(t*sr)-cap['firstFrame'] for t in m['window']];assert 0<=first<last<=len(a);assert len(m['channels'])==2*(spec['sources']+1)
   for j,old in enumerate(m['channels']):
    x=a[first:last,j];v=stats(x,sr);wanted=expected[label][j%2];assert abs(v['crossingHz']-old['hz'])<1e-7 and abs(v['RMS']-old['rms'])<1e-10;assert old['source']==j//2 and old['channel']==j%2
    passed=abs(v['crossingHz']-wanted)<=1 and v['RMS']>.01;assert old['passed']==passed
    measures.append({'label':label,'source':j//2,'channel':j%2,'windowSeconds':m['window'],'expectedHz':wanted,**v,'crossingErrorHz':v['crossingHz']-wanted,'HannErrorHz':v['HannHz']-wanted,'crossingPassed':passed,'HannPassed':abs(v['HannHz']-wanted)<=1 and v['RMS']>.01,'eligibleForCaseAcceptance':capturePassed})
  assert len(row['events'])==len(row['measurements'])==6
  first,last=[round(t*sr)-cap['firstFrame'] for t in row['pause']['window']];pausePeak=float(np.max(np.abs(a[first:last,:-2])));assert pausePeak==0 and row['pause']['passed'];assert row['pause']['window']==[row['pause']['pausedAt']+.2,row['pause']['pausedAt']+.6]
  control=stats(a[:,-2],sr,False);control['HannFirst2SecondsHz']=frequency(a[:2*sr,-2],sr);assert abs(control['crossingHz']-row['control']['hz'])<1e-7 and abs(control['crossingHz']-307)<=.01
  events={e['label']:e for e in row['events']};owner=[selected(events[k]['after']) for k in ['neutral','shifted','keylock-off','warm-follow']];assert owner==[row['warmOwner']]*4;newOwner=selected(events['rebase']['after']);assert newOwner!=owner[0] and len(events['rebase']['after']['groups'])==1;assert row['beforeRebase']['groups'][0]['start']>0 and row['beforeRebase']['groups'][0]['end']>8
  assert all(e['snapshot']['lastError'] is None and e['after']['lastError'] is None for e in row['events']);assert row['pausedVoiceAbsent'] and row['cleaned'] and row['errors']==[]
  rawNeighborhoods=[]
  for bad in anomalies:
   i=bad['index'];records=[]
   for j in range(max(0,i-1),min(len(blocks),i+2)):
    n=j*128;q=a[n:n+128];prev=a[n-2:n,-2];predict=2*math.cos(2*math.pi*307/sr)*float(prev[-1])-float(prev[-2]);records.append({'row':blocks[j],'rawOrdinalFirstFrameReference':cap['firstFrame']+n,'frameTagFirst8':q[:8,-1].tolist(),'frameTagLast':float(q[-1,-1]),'controlPrevious2':prev.tolist(),'controlFirst8':q[:8,-2].tolist(),'controlOneSampleRecurrenceResidual':float(q[0,-2])-predict,'sourceAndMixPeak':float(np.max(np.abs(q[:,:-2])))})
   rawNeighborhoods.append({'anomaly':bad,'originalNeighbors':records,'usedToRepairOrRegrade':False})
  after=events['resume']['after']['state'];start=events['resume']['state'];inferredAfterTime=start['when']+(after['position']-start['position'])/start['rate']
  accepted=capturePassed and all(m['crossingPassed'] for m in measures) and pausePeak==0;assert accepted==row['criteriaPassed']
  cases.append({'id':row['id'],'wholeRawSHA256':H(p),'frames':len(a),'channels':channels,'rows':len(blocks),'wholeFinite':True,'producerAnomalies':anomalies,'maxFrameTagGlobalErrorSamples':globalError,'maxFrameTagStepErrorSamples':stepError,'frameTagMismatchSamples':mismatches,'capturePassed':capturePassed,'reportedAccepted':row['criteriaPassed'],'independentMeasuredPredicateAccepted':accepted,'measurements':measures,'pausePeak':pausePeak,'control':control,'warmSelectedOwners':owner,'rebaseSelectedOwner':newOwner,'beforeRebase':row['beforeRebase'],'cleanedVoiceMap':row['cleaned'],'declaredZeroRetainedPCMVerified':False,'clockFailureOriginalNeighborhoods':rawNeighborhoods,'resumeTiming':{'invokedAt':events['resume']['issuedAt'],'acknowledgedAt':events['resume']['acknowledgedAt'],'scheduledAt':start['when'],'afterSnapshotContextTimeInferredFromNominalClock':inferredAfterTime,'finalPauseInvocationTimeExplicitlyRecorded':False},'independentHannAllPass':all(m['HannPassed'] for m in measures)})
 assert len(cases)==len(r['cases'])==4 and sum(c['reportedAccepted'] for c in cases)==r['acceptedCases']==3
 initialPath=ROOT/'docs/prototype/soundtouch-engine-browser-initial-results.json';initial=J(initialPath);assert initial['acceptedCases']==0 and not initial['completed'] and all(not c['criteriaPassed'] for c in initial['cases'])
 initialCases=[]
 for c in initial['cases']:
  p=ROOT/c['capture']['retained']['path'];assert H(p)==c['capture']['sha256'];initialCases.append({'id':c['id'],'rawSHA256':H(p),'frames':c['capture']['frames'],'errors':c['errors'],'accepted':False})
 result={'scope':'Independent offline whole original preflight browser artifact checks. Actual unchanged engine/SRC with server-routed experimental adapter; parent executed browser. Three cases meet measured harness predicates; fourth remains clock-invalid. No full declared cleanup/lifecycle/native/cursor/music/physical/CPU acceptance.','reportSHA256':H(reportPath),'plan':plan,'sourceRoutes':routes,'currentSourceDifferencesNotCreditedToRun':currentDifferences,'unchangedProductionEngineSHA256':H(engine),'resamplerRegionMatchesProduction':True,'preflightFactoryRetainsUnboundedRegistrationAwait':True,'cases':cases,'totalFrames':sum(c['frames'] for c in cases),'totalRows':sum(c['rows'] for c in cases),'reportedAcceptedCases':3,'independentlyMeasuredPredicateAcceptedCases':sum(c['independentMeasuredPredicateAccepted'] for c in cases),'fullDeclaredCleanupCriterionVerified':False,'initialFailedReportSHA256':H(initialPath),'initialFailedCases':initialCases,'initialFatalErrors':initial['fatalErrors'],'oldRenderClockErrorCauseProvenOrFixed':False,'productionOrNativeAccepted':False}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'sha256':H(OUT),'frames':result['totalFrames'],'rows':result['totalRows'],'toneChecks':sum(len(c['measurements']) for c in cases),'measuredHarnessAccepted':result['independentlyMeasuredPredicateAcceptedCases'],'fullCleanupCriterionVerified':False,'currentSourceDifferences':currentDifferences,'cases':[{'id':c['id'],'capturePassed':c['capturePassed'],'globalTagError':c['maxFrameTagGlobalErrorSamples'],'stepTagError':c['maxFrameTagStepErrorSamples'],'tagMismatchSamples':c['frameTagMismatchSamples'],'maxCrossingErrorHz':max(abs(m['crossingErrorHz']) for m in c['measurements']),'maxHannErrorHz':max(abs(m['HannErrorHz']) for m in c['measurements']),'HannAllPass':c['independentHannAllPass']} for c in cases]},indent=2))
if __name__=='__main__':main()
