#!/usr/bin/env python3
"""Independent offline examination of original bounded browser raw capture."""
from pathlib import Path
import json,hashlib,sys,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT/'scripts'))
from inspect_keylock_pitch_isolation_independent import frequency
OUT=ROOT/'docs/research/KEYLOCK_BROWSER_PITCH_INDEPENDENT_FINAL_RESULTS_20261017.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
def crossing(x,sr):
 x=x.astype(np.float64);x-=x.mean();i=np.flatnonzero((x[:-1]<0)&(x[1:]>=0));positions=i-x[i]/(x[i+1]-x[i]);return float((len(positions)-1)*sr/(positions[-1]-positions[0]))
def main():
 assert not OUT.exists(),'Refusing to overwrite inspection'
 report_path=ROOT/'docs/prototype/keylock-browser-isolation-bounded-results.json';r=J(report_path);plan_path=ROOT/'docs/prototype/keylock-browser-isolation-plan.json';assert r['plan']==J(plan_path);assert r['completed'] is True and not r['fatalErrors'];assert r['full_parity_verified'] is False
 paths={'/harness.js':'experiments/keylock-history/harness-bounded.js','/capture.js':'experiments/keylock-history/capture.js','/SignalsmithStretch-open-play-disposable.mjs':'prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs','/SignalsmithStretch-open-play-history.mjs':'experiments/keylock-history/SignalsmithStretch-open-play-history.mjs','/plan.json':str(plan_path.relative_to(ROOT))}
 for url,p in paths.items():assert H(ROOT/p)==r['sourceHashes'][url],p
 relocation=J(ROOT/'docs/prototype/keylock-history-candidate-location.json')
 for x in relocation['moves']:assert H(ROOT/x['retained_experiment_path'])==x['sha256'];assert x['bytes_identical'] is True
 assert len(r['cases'])==6;sr=r['runtime']['sampleRate'];assert sr==44100;rows=[]
 for c,spec in zip(r['cases'],r['plan']['cases']):
  assert all(c[k]==v for k,v in spec.items());cap=c['capture'];p=ROOT/cap['retained']['path'];assert H(p)==cap['sha256']==cap['retained']['sha256'];assert p.stat().st_size==cap['retained']['bytes']==cap['frames']*4*4
  a=np.fromfile(p,dtype='<f4').reshape(-1,4);assert a.shape==(cap['frames'],4);assert np.isfinite(a).all();blocks=c['blocks'];assert blocks
  for i,b in enumerate(blocks):assert b['sequence']==i and b['frames']==128 and isinstance(b['frame'],int) and b['frame']%128==0 and b['frame']==blocks[0]['frame']+i*128
  assert sum(b['frames'] for b in blocks)==len(a)==c['stop']['frames'];assert c['stop']['blocks']==len(blocks);assert blocks[-1]['frame']+128-blocks[0]['frame']==len(a);assert c['arm']['frames']==c['arm']['blocks']==0;assert cap['contiguous'] is True and cap['nonfinite']==0 and c['errors']==[];assert len(a)/sr>=8.25;assert c['queriedLatency']==.12;assert c['command']['rate']==c['rate'] and c['command']['semitones']==c['semitones'];assert np.array_equal(a[:,2],a[:,3])
  measurements=[]
  for ch in range(4):
   x=a[5*sr:7*sr,ch];expected=(c['tones'][ch]*2**(c['semitones']/12)) if ch<2 else 307;budget=c['maximum_error_hz'] if ch<2 else .01;cross=crossing(x,sr);fft=frequency(x,sr);rms=float(np.sqrt(np.mean(x.astype(float)**2)));prior=c['measurements'][ch];assert prior['channel']==ch and prior['frames']==2*sr and prior['windowSeconds']==[5,7];assert abs(cross-prior['hz'])<1e-7;assert abs(rms-prior['rms'])<1e-10;passed=abs(cross-expected)<=budget and rms>.001;assert passed==prior['passed'];measurements.append({'channel':ch,'expectedHz':expected,'budgetHz':budget,'positiveCrossingHz':cross,'independentGlobalHannHz':fft,'HannErrorHz':fft-expected,'RMS':rms,'crossingCriterionPassed':passed,'HannCriterionPassed':abs(fft-expected)<=budget and rms>.001})
  actual=all(x['crossingCriterionPassed'] for x in measurements);assert actual==c['criteriaPassed'];assert actual==all(x['HannCriterionPassed'] for x in measurements)
  # Descriptive independent control phase fit, not a newly invented acceptance gate.
  t=np.arange(len(a),dtype=float)/sr;basis=np.stack([np.sin(2*np.pi*307*t),np.cos(2*np.pi*307*t),np.ones(len(a))],axis=1);coef=np.linalg.lstsq(basis[:2048],a[:2048,2],rcond=None)[0];assert np.isfinite(coef).all();predicted=basis[:,0]*coef[0]+basis[:,1]*coef[1]+coef[2];residual=a[:,2]-predicted;assert np.isfinite(residual).all()
  rows.append({'id':c['id'],'variant':c['variant'],'originalRaw':{'path':str(p.relative_to(ROOT)),'SHA256':H(p),'bytes':p.stat().st_size},'frames':len(a),'channels':4,'durationSeconds':len(a)/sr,'allSamplesFinite':True,'rows':len(blocks),'firstRow':blocks[0],'lastRow':blocks[-1],'everySequenceAndFrameContiguous':True,'armAndStopCounterAgreement':True,'completeControlChannelsBitIdentical':True,'controlFirst2048FitThenWholeSpanResidual':{'RMS':float(np.sqrt(np.mean(residual**2))),'maximumAbsolute':float(np.max(np.abs(residual))),'descriptiveOnly':True},'measurements':measurements,'individualCaseCriterionPassed':actual})
 initial_path=ROOT/'docs/prototype/keylock-browser-isolation-initial-results.json';initial=J(initial_path);assert initial['completed'] is False;assert len(initial['cases'])==4;assert len(initial['fatalErrors'])>0;old=[]
 for c in initial['cases']:
  cap=c.get('capture');entry={'id':c['id'],'completeRawRetained':cap is not None}
  if cap:assert H(ROOT/cap['retained']['path'])==cap['sha256']==cap['retained']['sha256'];entry['SHA256']=cap['sha256']
  old.append(entry)
 assert [x['completeRawRetained'] for x in old]==[True,True,True,False]
 result={'scope':'Independent offline whole4channel browserPCM/rowclock/armstop/control/frequency comparison. Parent performed browserRun; inspector did not runUI/browser/audio/native/hardware. No output repair,trimming,thresholdchange or productionpromotion.','report':{'path':str(report_path.relative_to(ROOT)),'SHA256':H(report_path)},'planSHA256':H(plan_path),'sourceMapping':paths,'sourceHashes':r['sourceHashes'],'relocationMapSHA256':H(ROOT/'docs/prototype/keylock-history-candidate-location.json'),'runtime':r['runtime'],'cases':rows,'summary':{'allSixCapturesCompleted':True,'capturedCases':6,'individualCasePasses':sum(x['individualCaseCriterionPassed'] for x in rows),'totalFrames':sum(x['frames'] for x in rows),'totalProducerRows':sum(x['rows'] for x in rows),'fullParityVerified':False,'physicalSoundOrInputVerified':False},'preservedInitialFailure':{'path':str(initial_path.relative_to(ROOT)),'SHA256':H(initial_path),'completed':False,'cases':old,'fourthPartialPCMUnavailableNotReconstructed':True},'limits':['CurrentFrame row continuity and controlphase do not provide independenthardwareclock or repair earliernativeclockfailures.','NativeCPU/music/mainapp/MIDI/compound/reference acceptance unexecuted.','Cleanupawaitsdisposebeforeupload; partialflushisnotguaranteedifcleanupthrowsorhangs, although allsixcurrentrawfilesareavailable.']}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'SHA256':H(OUT),'summary':result['summary'],'cases':[{'id':x['id'],'HannHz':[m['independentGlobalHannHz'] for m in x['measurements']],'crossingHz':[m['positiveCrossingHz'] for m in x['measurements']],'controlResidual':x['controlFirst2048FitThenWholeSpanResidual'],'passes':x['individualCaseCriterionPassed']} for x in rows]},indent=2))
if __name__=='__main__':main()
