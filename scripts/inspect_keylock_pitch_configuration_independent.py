#!/usr/bin/env python3
"""Read-only numerical review of preserved incremental/configuration/holdout PCM."""
import json,math,subprocess,hashlib
from pathlib import Path
import numpy as np
from inspect_keylock_pitch_isolation_independent import ROOT,H,J,frequency
OUT=ROOT/'docs/research/KEYLOCK_PITCH_CONFIGURATION_INDEPENDENT_RESULTS_20261017.json'
def read_raw(row,sr):
 p=ROOT/row['path'];assert H(p)==row['sha256'];assert p.stat().st_size==row['bytes'];a=np.fromfile(p,dtype='<f4').reshape(-1,2);assert len(a)==row['frames']==math.ceil(10*sr/128)*128;assert np.isfinite(a).all();return a
def measure(a,sr,tones,shift):
 x=a[5*sr:7*sr];expected=[v*2**(shift/12) for v in tones];f=[frequency(x[:,c],sr) for c in [0,1]];level=np.sqrt(np.mean(x.astype(float)**2,axis=0)).tolist();err=[f[c]-expected[c] for c in [0,1]];return {'expectedHz':expected,'measuredHz':f,'errorHz':err,'steadyRMS':level,'caseCriterionPassed':all(abs(e)<=1 for e in err) and min(level)>.001}
def main():
 assert not OUT.exists(),'Refusing to overwrite independent evidence'
 records=[]
 for name,count in [('incremental',4),('resolution',6)]:
  render_path=ROOT/f'docs/prototype/keylock-{name}-initial-render.json';analysis_path=ROOT/f'docs/prototype/keylock-{name}-initial-analysis.json';plan_path=ROOT/f'docs/prototype/keylock-{name}-plan.json';r=J(render_path);parent={x['id']:x for x in J(analysis_path)['results']};assert r['planSHA256']==H(plan_path)
  for m in r['modules'].values():assert H(ROOT/m['path'])==m['sha256']
  rows=[]
  for row in r['results']:
   assert row['sampleRate']==44100;a=read_raw(row,44100);v=measure(a,44100,[330,550],row['semitones']);assert max(abs(v['measuredHz'][c]-parent[row['id']]['measuredHz'][c]) for c in [0,1])<.001;assert v['caseCriterionPassed']==parent[row['id']]['passed'];rows.append({'id':row['id'],'rawSHA256':row['sha256'],'frames':len(a),'allSamplesFinite':True,'config':row['config'],'latencySeconds':row['latency'],**v})
  assert len(rows)==count;records.append({'cohort':name,'renderSHA256':H(render_path),'analysisSHA256':H(analysis_path),'planSHA256':H(plan_path),'results':rows})
 plan_path=ROOT/'docs/prototype/keylock-holdout-plan.json';render_path=ROOT/'docs/prototype/keylock-holdout-initial-render.json';analysis_path=ROOT/'docs/prototype/keylock-holdout-initial-analysis.json';plan=J(plan_path);r=J(render_path);pa=J(analysis_path);assert r['planSHA256']==H(plan_path);assert H(ROOT/r['modulePath'])==r['moduleSHA256'];parent={x['id']:x for x in pa['results']};sources={x['id']:x for x in r['sources']};assert len(sources)==8
 source_checks=[]
 for s in sources.values():
  sr=s['sampleRate'];p=ROOT/s['path'];assert H(p)==s['sha256'];a=np.fromfile(p,dtype='<f4').reshape(-1,2);assert a.shape==(14*sr,2);assert np.isfinite(a).all();t=np.arange(len(a),dtype=float)/sr
  rebuilt=np.stack([.14*np.sin(2*np.pi*s['tones'][c]*np.arange(len(a))/sr+[.17,.53][c]) for c in [0,1]],axis=1).astype(np.float32);max_error=float(np.max(np.abs(a-rebuilt)));assert max_error<3e-8;f=[frequency(a[5*sr:7*sr,c],sr) for c in [0,1]];assert max(abs(f[c]-s['tones'][c]) for c in [0,1])<.001;source_checks.append({'id':s['id'],'SHA256':s['sha256'],'frames':len(a),'sampleRate':sr,'measuredHz':f,'expectedHz':s['tones'],'analyticReconstructionMaximumSampleError':max_error,'allSamplesFinite':True})
 rows=[];seen=set()
 for row in r['results']:
  key=(row['sourceID'],row['rate'],row['semitones'],row['variant']);assert key not in seen;seen.add(key);sr=row['sampleRate'];s=sources[row['sourceID']];assert sr==s['sampleRate'];assert row['tones']==s['tones'];a=read_raw(row,sr);v=measure(a,sr,row['tones'],row['semitones']);p=parent[row['id']];pf=p.get('measuredHz',p.get('measured'));assert max(abs(v['measuredHz'][c]-pf[c]) for c in [0,1])<.001
  assert row['block']==round(.12*sr);assert row['interval']==round((.01 if row['variant']=='dense-analysis' else .03)*sr);assert row['latency']==.12;assert row['bufferLength']==row['block']+(0 if row['variant']=='baseline' else row['interval']);rows.append({'id':row['id'],'variant':row['variant'],'rawSHA256':row['sha256'],'frames':len(a),'allSamplesFinite':True,'block':row['block'],'interval':row['interval'],'bufferLength':row['bufferLength'],'latencySeconds':row['latency'],**v})
 expected={(s['id'],st['rate'],st['semitones'],v) for s in r['sources'] for st in plan['states'] for v in ['baseline','history-only','dense-analysis']};assert seen==expected and len(rows)==72
 summary={v:{'cases':len([x for x in rows if x['variant']==v]),'passed':sum(x['caseCriterionPassed'] for x in rows if x['variant']==v),'failed':[x['id'] for x in rows if x['variant']==v and not x['caseCriterionPassed']]} for v in ['baseline','history-only','dense-analysis']};assert [summary[v]['passed'] for v in summary]==[13,15,23]
 result={'scope':'Independent offline inspection of4incremental+6configuration+72heldout complete rawWASM outputs; no new audio rendering/native/CPU/UI/production changes. Same5–7s/1Hz/RMS gate. Independent16xglobalHann estimator compared within.001Hz numerical tolerance to parent4x; not acceptance relaxation.','cohorts':records,'holdout':{'planSHA256':H(plan_path),'renderSHA256':H(render_path),'analysisSHA256':H(analysis_path),'sources':source_checks,'results':rows,'summary':summary},'findings':{'residualExistsWithoutConstantSeek':True,'residualConfigurationSensitive':True,'denseConfigurationAllCasesPass':False,'nativeCPUOrQualityProven':False,'frozenNative006Regraded':False,'fullParityVerified':False}}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'SHA256':H(OUT),'summary':summary,'incrementalAndResolution':records},indent=2))
if __name__=='__main__':main()
