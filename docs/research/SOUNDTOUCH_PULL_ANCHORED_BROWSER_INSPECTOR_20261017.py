#!/usr/bin/env python3
"""Offline whole-artifact checks; never renders or writes an input artifact."""
from pathlib import Path
import hashlib,json,math,sys
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
sys.dont_write_bytecode=True;sys.path.insert(0,str(ROOT/'scripts'))
from inspect_keylock_pitch_isolation_independent import frequency
OUT=ROOT/'docs/research/SOUNDTOUCH_PULL_ANCHORED_BROWSER_INDEPENDENT_RESULTS_20261017.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
def metrics(a,sr):
 x=a.astype(float);power=float(np.mean(x*x));peak=float(np.max(np.abs(x)));x-=x.mean();i=np.flatnonzero((x[:-1]<0)&(x[1:]>=0));v=i-x[i]/(x[i+1]-x[i]);return {'RMS':math.sqrt(power),'peak':peak,'crossingHz':float((len(v)-1)*sr/(v[-1]-v[0])) if len(v)>1 else None,'HannHz':frequency(a,sr)}
def main():
 assert not OUT.exists(),'Refusing to overwrite an inspection'
 reportPath=ROOT/'docs/prototype/soundtouch-transport-browser-anchored-results.json';r=J(reportPath);plan=J(ROOT/'docs/prototype/soundtouch-transport-browser-anchored-plan.json');assert r['plan']==plan and r['completed'] and not r['fatalErrors'] and r['full_parity_verified'] is False
 routes=[]
 for url,m in r['servedSources']['routes'].items():
  p=ROOT/m['path'];assert H(p)==m['sourceSHA256'];data=p.read_bytes()
  if m['importSpecifierOnlyRewrite']:
   old=b"from '@soundtouchjs/interpolation-strategy-lanczos'";assert data.count(old)==1;data=data.replace(old,b"from '/official/lanczos/index.js'")
  assert hashlib.sha256(data).hexdigest()==m['servedSHA256'];routes.append({'url':url,**m})
 assert sum(x['importSpecifierOnlyRewrite'] for x in routes)==1
 cases=[]
 for row,spec in zip(r['cases'],plan['cases']):
  assert all(row[k]==v for k,v in spec.items());assert row['errors']==[];cap=row['capture'];p=ROOT/cap['retained']['path'];assert H(p)==cap['sha256']==cap['retained']['sha256'];ch=spec['sources']*2+2;sr=spec['sampleRate'];assert cap['sampleRate']==row['environment']['sampleRate']==sr and cap['channels']==ch;assert p.stat().st_size==cap['retained']['bytes']==cap['frames']*ch*4
  a=np.fromfile(p,dtype='<f4').reshape(-1,ch);assert len(a)==cap['frames'] and np.isfinite(a).all();blocks=row['blocks'];assert len(a)==len(blocks)*128
  for i,b in enumerate(blocks):assert b=={'sequence':i,'frame':cap['firstFrame']+128*i,'frames':128} and b['frame']%128==0
  assert row['arm']['frames']==row['arm']['sequence']==0;assert row['stop']['frames']==len(a) and row['stop']['sequence']==len(blocks)
  expected=np.arange(cap['firstFrame'],cap['firstFrame']+len(a),dtype=np.float64);tag=a[:,-1].astype(float);globalError=float(np.max(np.abs(tag-expected)));stepError=float(np.max(np.abs(np.diff(tag)-1)));assert globalError==cap['maxFrameTagError'];capturePassed=globalError<=.25;assert cap['valid'] is capturePassed
  schedule=row['frameTagSchedule'];declared=plan['frame_tag_schedule'];assert schedule['startFrame']%128==0 and schedule['endFrame']==schedule['startFrame']+round(declared['ramp_seconds']*sr);assert schedule['issuedAtContextFrame']<schedule['startFrame'];assert schedule['armObservedContextFrame']>=schedule['startFrame']+declared['arm_after_anchor_frames'];assert row['arm']['frame']>=schedule['startFrame']+declared['arm_after_anchor_frames'];assert cap['firstFrame']>=row['arm']['frame'] and cap['firstFrame']+len(a)<=schedule['endFrame'];assert capturePassed and declared['producer_residual_limit_samples']==.25
  assert row['commandAckContextFrame']<row['startFrame'];assert len(row['accepted']['acks'])==7 and all(x['ready'] for x in row['accepted']['acks']);assert all(x['preparationMilliseconds'] is None and x['preparationClock']=='unavailable' for x in row['accepted']['acks'])
  for cmd,declared in zip(row['commands'],plan['timeline']):assert cmd=={k:v for k,v in declared.items() if k!='offset'}|{'frame':row['startFrame']+round(declared['offset']*sr)}
  measure=[];n=0
  for test in plan['measurements']:
   first,last=[round(row['startFrame']+t*sr)-cap['firstFrame'] for t in test['window']];assert 0<=first<last<=len(a)
   for c in range(spec['sources']*2):
    x=a[first:last,c];m=metrics(x,sr);reported=row['measurements'][n];n+=1;wanted=test['expectedHz'][c%2];assert abs(m['crossingHz']-reported['hz'])<1e-7 and abs(m['RMS']-reported['rms'])<1e-10;assert reported['label']==test['label'] and reported['channel']==c and reported['expectedHz']==wanted
    measure.append({'label':test['label'],'channel':c,'expectedHz':wanted,**m,'crossingErrorHz':m['crossingHz']-wanted,'HannErrorHz':m['HannHz']-wanted,'crossingPassed':abs(m['crossingHz']-wanted)<=1 and m['RMS']>.001,'HannPassed':abs(m['HannHz']-wanted)<=1 and m['RMS']>.001})
  assert n==len(row['measurements'])==10*spec['sources'];silence=[]
  for window,old in zip(plan['silence_windows'],row['silence']):
   first,last=[round(row['startFrame']+t*sr)-cap['firstFrame'] for t in window];peak=float(np.max(np.abs(a[first:last,:spec['sources']*2])));assert peak==old['peak']==0;silence.append({'window':window,'peak':peak})
  first,last=[round(row['startFrame']+t*sr)-cap['firstFrame'] for t in [.5,2.5]];control=metrics(a[first:last,-2],sr);assert abs(control['crossingHz']-row['control']['hz'])<1e-7;assert abs(control['crossingHz']-307)<=.01 and control['RMS']>.001
  hashes=[hashlib.sha256(a[:,c].tobytes()).hexdigest() for c in range(spec['sources']*2)];assert all(hashes[c]==hashes[c%2] for c in range(len(hashes)));assert all(h==row['inputHashes'][0] for h in row['inputHashes']);assert row['disposed']['disposed'] and row['disposed']['sourceBytes']==0 and row['disposed']['epochs']==[]
  cases.append({'id':row['id'],'wholeRawSHA256':H(p),'frames':len(a),'channels':ch,'rows':len(blocks),'wholeFinite':True,'strictProducerClock':True,'frameTagMaxGlobalErrorSamples':globalError,'frameTagMaxStepErrorSamples':stepError,'capturePassed':capturePassed,'reportedCaseAccepted':row['criteriaPassed'],'futureFrameTagSchedule':schedule,'scheduleContractPassed':True,'commandAcksBeforeStart':True,'realPreparationTimingAvailable':False,'measurements':measure,'silence':silence,'control':control,'wholeChannelSHA256':hashes,'sourceCloneChannelsByteIdentical':True,'borrowedFixtureInputHashes':row['inputHashes'],'disposed':True,'crossingPassed':all(x['crossingPassed'] for x in measure),'HannPassed':all(x['HannPassed'] for x in measure)})
 assert len(cases)==len(r['cases'])==4;assert all(c['capturePassed'] and c['crossingPassed'] and c['reportedCaseAccepted'] for c in cases)
 portable=ROOT/'docs/prototype/soundtouch-transport-browser-portable-results.json';portableReport=J(portable);assert all(not c['criteriaPassed'] and not c['capture']['valid'] for c in portableReport['cases'])
 initial=ROOT/'docs/prototype/soundtouch-transport-browser-initial-results.json';initialReport=J(initial);assert all(c['criteriaPassed'] is False for c in initialReport['cases'])
 result={'scope':'Independent offline whole preserved anchored AudioWorklet transport cohort. Parent executed browser UI. Same predeclared windows and1Hz/.01Hz/.25sample gates; independent16xHann supplementary. No production/native/audiblecursor/EOS tails/music/CPU acceptance. Initial failed cohort not regraded.','reportSHA256':H(reportPath),'planSHA256':H(ROOT/'docs/prototype/soundtouch-transport-browser-anchored-plan.json'),'sourceRoutes':routes,'portableFailedReportSHA256':H(portable),'portableFailedCaseCount':len(portableReport['cases']),'initialFailedReportSHA256':H(initial),'initialFailedCases':len(initialReport['cases']),'cases':cases,'totalFrames':sum(c['frames'] for c in cases),'totalRows':sum(c['rows'] for c in cases),'crossingCasePasses':sum(c['crossingPassed'] for c in cases),'HannCasePasses':sum(c['HannPassed'] for c in cases),'capturePasses':sum(c['capturePassed'] for c in cases),'acceptedCases':sum(c['reportedCaseAccepted'] for c in cases),'productionAccepted':False}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'sha256':H(OUT),'totalFrames':result['totalFrames'],'totalRows':result['totalRows'],'crossingPasses':result['crossingCasePasses'],'HannPasses':result['HannCasePasses'],'capturePasses':result['capturePasses'],'acceptedCases':result['acceptedCases'],'cases':[{'id':c['id'],'maxGlobalFrameTagError':c['frameTagMaxGlobalErrorSamples'],'maxStepFrameTagError':c['frameTagMaxStepErrorSamples'],'maxCrossingErrorHz':max(abs(m['crossingErrorHz']) for m in c['measurements']),'maxHannErrorHz':max(abs(m['HannErrorHz']) for m in c['measurements'])} for c in cases]},indent=2))
if __name__=='__main__':main()
