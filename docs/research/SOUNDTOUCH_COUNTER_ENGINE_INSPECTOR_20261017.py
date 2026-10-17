#!/usr/bin/env python3
"""Offline whole-artifact audit; writes only one new immutable result."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,hashlib,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'docs/research'))
from SOUNDTOUCH_ENGINE_BROWSER_INSPECTOR_20261017 import H,J,stats,src_section,selected
OUT=ROOT/'docs/research/SOUNDTOUCH_COUNTER_ENGINE_INDEPENDENT_RESULTS_20261017.json'

def sources(r,cohort,full=False):
 base=ROOT/f'local-evidence/soundtouch-engine-browser-{cohort}/source-snapshots';rows=[];differences=[]
 for url,m in r['servedSources']['routes'].items():
  p=base/(url.lstrip('/') or 'index.html');assert H(p)==m['servedSHA256'];data=p.read_bytes()
  if m['importSpecifierOnlyRewrite']:
   old=b"from '/official/lanczos/index.js'";assert data.count(old)==1;data=data.replace(old,b"from '@soundtouchjs/interpolation-strategy-lanczos'")
  assert hashlib.sha256(data).hexdigest()==m['sourceSHA256']
  if H(ROOT/m['path'])!=m['sourceSHA256']:differences.append({'url':url,'frozenSHA256':m['sourceSHA256'],'currentSHA256':H(ROOT/m['path']),'laterBytesCredited':False})
  if full:rows.append({'url':url,**m,'preservedSnapshot':str(p.relative_to(ROOT))})
 return base,{'count':len(r['servedSources']['routes']),'routes':rows,'currentDifferences':differences}

def raw(c):
 cap=c['capture'];p=ROOT/cap['retained']['path'];assert H(p)==cap['sha256']==cap['retained']['sha256'];assert p.stat().st_size==cap['retained']['bytes']==cap['frames']*cap['channels']*4
 a=np.fromfile(p,dtype='<f4').reshape(-1,cap['channels']);assert len(a)==cap['frames'] and np.isfinite(a).all();blocks=c['blocks'];assert len(a)==128*len(blocks);anomalies=[];globals_=[]
 for i,b in enumerate(blocks):
  assert b['sequence']==i and b['frames']==128
  if i and b['frame']!=blocks[i-1]['frame']+128:anomalies.append({'index':i,'previous':blocks[i-1],'actual':b})
  if 'globalFrame' in b:
   assert b['frameSource']=='one-anchor-then-callback-counter' and NumberLike(b['globalFrame']) and math.isfinite(b['globalTime'])
   if b['globalFrame']!=b['frame'] or abs(b['globalTime']*cap['sampleRate']-b['frame'])>.25:globals_.append(b)
 expected=np.concatenate([np.arange(b['frame'],b['frame']+128,dtype=float) for b in blocks]);tag=a[:,-1].astype(float);globalError=float(np.max(np.abs(tag-expected)));stepError=float(np.max(np.abs(np.diff(tag)-1)));assert globalError==cap['maxFrameTagError'];assert cap['contiguous']==(not anomalies)
 return a,{'rawSHA256':H(p),'frames':len(a),'channels':cap['channels'],'rows':len(blocks),'wholeFinite':True,'labelMode':'prospective-one-anchor-callback-counter' if 'globalFrame' in blocks[0] else 'original-global-frame','sequenceLabelAnomalies':anomalies,'counterTagMaxResidualSamples':globalError,'tagStepMaxResidualSamples':stepError,'originalGlobalDisagreements':globals_,'originalGlobalDisagreementCount':len(globals_),'maxOriginalGlobalDifferenceSamples':max([abs(b['globalFrame']-b['frame']) for b in globals_] or [0]),'captureCriterionPassed':not anomalies and globalError<=.25}
def NumberLike(x):return isinstance(x,(int,float)) and math.isfinite(x) and x==int(x)
def released(p):
 assert p['disposed'] and p['store']['disposed'] and p['store']['retainedPCMBytes']==p['store']['retainedChunks']==0
 assert p['transport']['disposed'] and p['transport']['sourceBytes']==0 and p['transport']['epochs']==[]
 clock=p['renderClock'];assert clock['nextFrame']==clock['anchorFrame']+128*clock['blocks']==p['transport']['nextFrame'];assert clock['nextFrame']<=2**22
 assert 'every sample' in clock['scope']
 return {'retainedPCMBytes':0,'epochs':[],'renderClock':clock,'actualProcessorAckRetained':True}

def main():
 assert not OUT.exists(),'Refusing to overwrite a prior result'
 assert H(ROOT/'docs/research/SOUNDTOUCH_ENGINE_BROWSER_INSPECTOR_20261017.py')=='718d9d595aa0a9ea39e90a8319145feb1c155e474f4b5864f628410aa8cdf89f'
 path=ROOT/'docs/prototype/soundtouch-engine-browser-counter-full-results.json';r=J(path);assert r['completed'] and r['fatalErrors']==[] and r['acceptedCases']==4 and r['full_parity_verified'] is False
 base,sourceGraph=sources(r,'counter-full',True);assert sourceGraph['count']==248;assert H(base/'prototype/engine.js')==H(ROOT/'prototype/engine.js')=='b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf'
 assert src_section((base/'prototype/keylock-shadow-live.js').read_text())==src_section((ROOT/'prototype/keylock-shadow-live.js').read_text())
 render=(base/'experiments/keylock-soundtouch/render-clock.mjs').read_text();factory=(base/'experiments/keylock-soundtouch/node-factory.mjs').read_text();assert 'for (let i = 0; i < frames; i++)' in render and 'tags[i] - (expected + i)' in render and 'export const CLOCK_LIMIT = 2 ** 22' in render;assert 'anchorFrame + context.sampleRate * 2 >= endFrame' in factory
 plan=J(base/'plan.json');assert r['plan']==plan and r['servedSources']['moduleDelaySeconds']==plan['registration_lifecycle']['server_delays_node_worklet_seconds']==.5;assert plan['criteria']['pitch_error_hz']==1 and plan['criteria']['control_error_hz']==.01 and plan['criteria']['frame_tag_error_samples']==.25
 factor=2**(2/12);wanted={'neutral':[330,550],'shifted':[330*factor,550*factor],'keylock-off':[412.5,687.5],'warm-follow':[412.5,687.5],'rebase':[825,1100],'resume':[660*factor,880*factor]};cases=[]
 for c,spec in zip(r['cases'],plan['cases']):
  assert all(c[k]==v for k,v in spec.items()) and c['errors']==[] and c['criteriaPassed'];a,v=raw(c);sr=spec['sampleRate'];assert v['captureCriterionPassed'] and v['labelMode']=='prospective-one-anchor-callback-counter';assert v['channels']==2*(spec['sources']+1)+2
  first=c['blocks'][0]['frame'];assert abs(round(float(a[0,-1]))-float(a[0,-1]))<=.25 and round(float(a[0,-1]))==first and first%128==0;assert c['arm']['frames']==c['arm']['sequence']==0 and c['arm']['frame'] is None;assert c['captureStop']['frames']==len(a) and c['captureStop']['sequence']==len(c['blocks'])
  sched=c['frameTagSchedule'];assert sched['startFrame']%128==0 and sched['issuedAtFrame']<sched['startFrame'] and sched['endFrame']==sched['startFrame']+60*sr and first>=sched['startFrame']+256 and first+len(a)<sched['endFrame']
  measurements=[]
  for event,m in zip(c['events'],c['measurements']):
   label=m['label'];assert label==event['label'] and m['expectedHz']==wanted[label] and m['window']==[event['state']['when']+.5,event['state']['when']+1.5];lo,hi=[round(t*sr)-first for t in m['window']];assert 0<=lo<hi<=len(a);assert len(m['channels'])==2*(spec['sources']+1)
   for j,old in enumerate(m['channels']):
    z=stats(a[lo:hi,j],sr);expected=wanted[label][j%2];assert abs(z['crossingHz']-old['hz'])<1e-7 and abs(z['RMS']-old['rms'])<1e-10;assert old['passed'] and abs(z['crossingHz']-expected)<=1 and z['RMS']>.01
    measurements.append({'label':label,'source':j//2,'channel':j%2,'windowSeconds':m['window'],'expectedHz':expected,**z,'crossingErrorHz':z['crossingHz']-expected,'HannErrorHz':z['HannHz']-expected,'HannPassed':abs(z['HannHz']-expected)<=1})
  assert len(c['events'])==len(c['measurements'])==6
  lo,hi=[round(t*sr)-first for t in c['pause']['window']];pausePeak=float(np.max(np.abs(a[lo:hi,:-2])));assert pausePeak==0 and c['pause']['passed'];assert c['pause']['window']==[c['pause']['pausedAt']+.2,c['pause']['pausedAt']+.6]
  control=stats(a[:,-2],sr,False);control['HannFirst2SecondsHz']=stats(a[:2*sr,-2],sr)['HannHz'];assert abs(control['crossingHz']-c['control']['hz'])<1e-7 and abs(control['crossingHz']-307)<=.01
  events={e['label']:e for e in c['events']};owners=[selected(events[k]['after']) for k in ['neutral','shifted','keylock-off','warm-follow']];assert owners==[c['warmOwner']]*4;assert selected(events['rebase']['after'])!=owners[0] and len(events['rebase']['after']['groups'])==1;assert c['beforeRebase']['groups'][0]['start']>0 and c['beforeRebase']['groups'][0]['end']>8
  lc=c['lifecycle'];assert lc['canceled']['name']=='AbortError' and lc['canceled']['elapsedMs']<400 and lc['otherWaiterSurvived'] and lc['before']['store']['retainedPCMBytes']>0 and lc['idempotent'] and lc['terminal']['name']=='AbortError';survivor=released(lc['disposal'])
  cleanup=[];assert [e['label'] for e in c['releaseEvidence']]==['middle-pause','final-pause']
  for e in c['releaseEvidence']:
   assert e['release']['disposed'] and e['release']['retainedPCMBytes']==0 and e['adapter']['disposed'] and e['adapter']['groups']==[] and e['adapter']['retainedPCMBytes']==e['adapter']['inFlightPCMBytes']==0;assert len(e['processors'])>=spec['sources'];cleanup.append({'label':e['label'],'at':e['at'],'adapterRetainedPCMBytes':0,'processorAcknowledgements':[released(p) for p in e['processors']]})
  assert c['cleaned'] and c['pausedVoiceAbsent'] and not any(d['type']=='fatal' for d in c['factoryDiagnostics'])
  cases.append({'id':c['id'],**v,'inputSourceSampleRate':spec['sourceSampleRate'],'contextSampleRate':sr,'measurements':measurements,'pausePeak':pausePeak,'control':control,'warmSelectedGroups':owners,'rebaseSelectedGroup':selected(events['rebase']['after']),'registrationAbortElapsedMs':lc['canceled']['elapsedMs'],'sharedRegistrationOtherWaiterSurvived':True,'survivorRelease':survivor,'terminalRevivalRefused':True,'cachedDisposalIdempotenceReportedAndSourceVerified':True,'actualEnginePauseCleanup':cleanup,'factoryDiagnostics':c['factoryDiagnostics'],'acceptedUnderNewProspectiveCriteria':True})
 assert len(cases)==4
 history=[]
 for cohort,count in [('clock-probe',0),('counter-clock',4)]:
  p=ROOT/f'docs/prototype/soundtouch-engine-browser-{cohort}-results.json';old=J(p);assert old['acceptedCases']==count;baseOld,graph=sources(old,cohort);entries=[]
  for c in old['cases']:
   a,v=raw(c);sr=c['sampleRate'];control=stats(a[:,-2],sr,False);assert abs(control['crossingHz']-c['control']['hz'])<1e-7 and abs(control['crossingHz']-307)<=.01;assert np.count_nonzero(a[:,:2])==0 and len(c['cycles'])==40
   assert c['criteriaPassed']==v['captureCriterionPassed'];entries.append({'id':c['id'],**v,'sourceWholePeak':0,'control':control,'cycles':40,'reportedAccepted':c['criteriaPassed']})
  if cohort=='counter-clock':
   oldClock=(baseOld/'experiments/keylock-soundtouch/render-clock.mjs').read_text();assert 'Math.abs(tags[0] - expected)' in oldClock and 'tags[i] - (expected + i)' not in oldClock
  else:
   bare=(baseOld/'experiments/keylock-soundtouch/bare-clock-worklet.mjs').read_text();assert 'import ' not in bare
  history.append({'cohort':cohort,'reportSHA256':H(p),'acceptedCases':count,'sourceSnapshotCountVerified':graph['count'],'processorFence':'quantum-start-only' if cohort=='counter-clock' else 'original-global-diagnostic','retrospectivelyUpgraded':False,'cases':entries})
 preserved=[]
 for cohort,count in [('initial',0),('preflight',3),('lifecycle',3)]:
  p=ROOT/f'docs/prototype/soundtouch-engine-browser-{cohort}-results.json';old=J(p);assert old['acceptedCases']==count;items=[]
  for c in old['cases']:
   q=ROOT/c['capture']['retained']['path'];assert H(q)==c['capture']['sha256'];items.append({'id':c['id'],'rawSHA256':H(q),'frames':c['capture']['frames'],'reportedAccepted':c['criteriaPassed'],'errors':c['errors']})
  preserved.append({'cohort':cohort,'reportSHA256':H(p),'acceptedCases':count,'cases':items,'regraded':False})
 result={'scope':'New prospective counter-full browser cohort only. Independent original PCM/tag/clock/audio/cleanup artifact inspection; actual UI performed by parent. Counter labels were created at capture time, never used to repair historical global-label runs. No physical/native/music/audiblecursor/longsession acceptance.','reportSHA256':H(path),'plan':plan,'sourceGraph':sourceGraph,'productionEngineSHA256':H(base/'prototype/engine.js'),'SRCRegionMatchesProduction':True,'fullQuantumProcessorClockSourceSHA256':H(base/'experiments/keylock-soundtouch/render-clock.mjs'),'internalProcessorParameterArraysExportedForIndependentOfflineReplay':False,'captureObserverRawParameterArraysIndependentlyChecked':True,'serverDeclaredModuleDelaySeconds':r['servedSources']['moduleDelaySeconds'],'cases':cases,'acceptedCases':4,'totalFrames':sum(c['frames'] for c in cases),'totalRows':sum(c['rows'] for c in cases),'toneChannelWindows':sum(len(c['measurements']) for c in cases),'zeroRetainedProcessorStoreAcknowledgements':sum(len(e['processorAcknowledgements']) for c in cases for e in c['actualEnginePauseCleanup']),'graphProbeHistory':history,'otherPreservedCohorts':preserved,'priorPreflightCleanupCriterionRetroactivelyAccepted':False,'initialRenderClockErrorUniversalCauseOrRepairProven':False,'productionOrNativeAccepted':False}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'sha256':H(OUT),'frames':result['totalFrames'],'rows':result['totalRows'],'toneWindows':result['toneChannelWindows'],'accepted':4,'cleanupAcks':result['zeroRetainedProcessorStoreAcknowledgements'],'cases':[{'id':c['id'],'tagError':c['counterTagMaxResidualSamples'],'globalDisagreements':c['originalGlobalDisagreementCount'],'maxCrossingErrorHz':max(abs(m['crossingErrorHz']) for m in c['measurements']),'maxHannErrorHz':max(abs(m['HannErrorHz']) for m in c['measurements']),'allHannPassed':all(m['HannPassed'] for m in c['measurements'])} for c in cases]},indent=2))
if __name__=='__main__':main()
