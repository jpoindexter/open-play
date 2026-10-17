#!/usr/bin/env python3
"""Offline, non-writing-to-inputs SoundTouch package/serial/browser inspection."""
from pathlib import Path
import json,hashlib,base64,tarfile,math,sys
import numpy as np
ROOT=Path(__file__).resolve().parents[2];sys.dont_write_bytecode=True;sys.path.insert(0,str(ROOT/'scripts'))
from inspect_keylock_pitch_isolation_independent import frequency
from inspect_desktop_016_midi_audio_independent import dominant
OUT=ROOT/'docs/research/SOUNDTOUCH_KEYLOCK_INDEPENDENT_FINAL_RESULTS_20261017.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
def cross(x,sr):
 x=x.astype(float);x-=x.mean();i=np.flatnonzero((x[:-1]<0)&(x[1:]>=0));v=i-x[i]/(x[i+1]-x[i]);return float((len(v)-1)*sr/(v[-1]-v[0]))
def main():
 assert not OUT.exists(),'Refusing to overwrite an inspection'
 packages=[]
 for n in ['SOUNDTOUCH_KEYLOCK_EXPERIMENT_PROVENANCE_20261017.json','SOUNDTOUCH_WORKLET_EXPERIMENT_PROVENANCE_20261017.json']:
  for pkg in J(ROOT/'docs/research'/n)['packages']:
   arc=ROOT/pkg['archive'];assert H(arc)==pkg['archiveSHA256'];integrity=pkg['metadata']['dist']['integrity'];assert integrity=='sha512-'+base64.b64encode(hashlib.sha512(arc.read_bytes()).digest()).decode();assert pkg['version']=='2.1.1' and pkg['license']=='MPL-2.0'
   for f in pkg['files']:assert H(ROOT/f['path'])==f['sha256']
   installed=ROOT/'local-evidence/keylock-soundtouch-source/node_modules'/pkg['name'];count=0
   with tarfile.open(arc) as tar:
    for m in tar:
     if not m.isfile():continue
     assert m.name.startswith('package/');rel=m.name.removeprefix('package/');b=tar.extractfile(m).read();assert (installed/rel).read_bytes()==b,m.name;count+=1
   packages.append({'name':pkg['name'],'version':pkg['version'],'declaredLicense':pkg['license'],'archiveSHA256':H(arc),'registrySHA512IntegrityMatches':True,'allExtractedFilesMatchArchive':True,'archiveFileCount':count,'recordedFileHashesVerified':len(pkg['files']),'publisherSignatureIndependentlyVerified':False})
 inputs=[]
 for source in J(ROOT/'docs/prototype/keylock-holdout-initial-render.json')['sources']:
  p=ROOT/source['path'];assert H(p)==source['sha256'] and p.stat().st_size==source['bytes']==source['frames']*8;a=np.fromfile(p,dtype='<f4').reshape(-1,2);sr=source['sampleRate'];assert a.shape==(14*sr,2) and np.isfinite(a).all();errors=[]
  for c in [0,1]:
   expected=.14*np.sin(2*np.pi*source['tones'][c]*np.arange(14*sr)/sr+[.17,.53][c]);errors.append(float(np.max(np.abs(a[:,c]-expected))));assert errors[-1]<1e-7
  inputs.append({'id':source['id'],'SHA256':H(p),'frames':len(a),'channels':2,'finite':True,'maximumPointwiseDifferenceFromAnalyticFormula':errors})
 assert len(inputs)==8
 serial_path=ROOT/'docs/prototype/keylock-soundtouch-initial-render.json';analysis_path=ROOT/'docs/prototype/keylock-soundtouch-initial-analysis.json';srpt=J(serial_path);assert H(ROOT/srpt['planPath'])==srpt['planSHA256'];pa={x['id']:x for x in J(analysis_path)['results']};serial=[]
 for row in srpt['results']:
  p=ROOT/row['path'];assert H(p)==row['sha256'];assert p.stat().st_size==row['bytes']==row['frames']*8;sr=row['sampleRate'];a=np.fromfile(p,dtype='<f4').reshape(-1,2);assert len(a)==math.ceil(sr*10/128)*128;assert np.isfinite(a).all();assert row['pitchFactor']==2**(row['semitones']/12);assert abs(row['stretchTempo']-row['rate']/row['pitchFactor'])<1e-12
  underflows=[x for x in row['underflows'] if x['outputFrame']<7*sr and x['outputFrame']+128>5*sr];assert not underflows
  measurements=[]
  for ch in [0,1]:
   x=a[5*sr:7*sr,ch];hz=frequency(x,sr);expected=row['tones'][ch]*2**(row['semitones']/12);rms=float(np.sqrt(np.mean(x.astype(float)**2)));h4=dominant(x,sr);assert abs(h4-pa[row['id']]['measuredHz'][ch])<1e-9;measurements.append({'channel':ch,'expectedHz':expected,'HannHz':hz,'independentlyRecomputed4xHz':h4,'difference16xMinus4xHz':hz-h4,'errorHz':hz-expected,'RMS':rms,'passed':abs(hz-expected)<=1 and rms>.001})
  serial.append({'id':row['id'],'rawSHA256':H(p),'sampleRate':sr,'frames':len(a),'wholeFinite':True,'totalUnderflowBlocks':len(row['underflows']),'steady5to7SecondUnderflowBlocks':0,'parameters':{k:row[k] for k in ['rate','semitones','pitchFactor','stretchTempo']},'measurements':measurements,'passed':all(x['passed'] for x in measurements)})
 assert len(serial)==28 and all(x['passed'] for x in serial)
 browser_path=ROOT/'docs/prototype/keylock-soundtouch-browser-initial-results.json';r=J(browser_path);assert r['completed'] is True and r['fatalErrors']==[] and r['full_parity_verified'] is False;assert r['plan']==J(ROOT/'docs/prototype/keylock-soundtouch-browser-plan.json');package='local-evidence/keylock-soundtouch-source/node_modules/@soundtouchjs/audio-worklet/.dist/'
 mapping={'/harness.js':'experiments/keylock-soundtouch/harness.js','/capture.js':'experiments/keylock-history/capture.js','/SoundTouchNode.js':package+'SoundTouchNode.js','/constants.js':package+'constants.js','/soundtouch-processor.js':package+'soundtouch-processor.js','/plan.json':'docs/prototype/keylock-soundtouch-browser-plan.json'}
 for url,path in mapping.items():assert H(ROOT/path)==r['sourceHashes'][url]
 browser=[]
 for row,spec in zip(r['cases'],r['plan']['cases']):
  assert all(row[k]==v for k,v in spec.items());cap=row['capture'];p=ROOT/cap['retained']['path'];assert H(p)==cap['sha256']==cap['retained']['sha256'];assert p.stat().st_size==cap['retained']['bytes']==cap['frames']*16;sr=cap['sampleRate'];assert sr==spec['sampleRate']==row['runtime']['sampleRate'];a=np.fromfile(p,dtype='<f4').reshape(-1,4);assert len(a)/sr>=8.25 and np.isfinite(a).all();blocks=row['blocks']
  for i,b in enumerate(blocks):assert b['sequence']==i and b['frames']==128 and b['frame']==blocks[0]['frame']+128*i and b['frame']%128==0
  assert len(a)==sum(x['frames'] for x in blocks)==row['stop']['frames'];assert len(blocks)==row['stop']['blocks'];assert row['arm']['frames']==row['arm']['blocks']==0;assert row['errors']==[] and row['criteriaPassed'] is True;assert np.array_equal(a[:,2],a[:,3]);assert row['parameters']['playbackRate']==row['command']['sourceRate'];assert abs(row['parameters']['playbackRate']-row['rate'])<1e-6;assert row['parameters']['pitch']==1 and row['parameters']['pitchSemitones']==row['semitones']
  measurements=[]
  for ch in range(4):
   x=a[5*sr:7*sr,ch];cr=cross(x,sr);hz=frequency(x,sr);expected=row['tones'][ch]*2**(row['semitones']/12) if ch<2 else 307;budget=1 if ch<2 else .01;rms=float(np.sqrt(np.mean(x.astype(float)**2)));m=row['measurements'][ch];assert abs(cr-m['hz'])<1e-7;assert abs(rms-m['rms'])<1e-10;measurements.append({'channel':ch,'expectedHz':expected,'reportedCrossingHz':cr,'independentHannHz':hz,'HannErrorHz':hz-expected,'RMS':rms,'budgetHz':budget,'crossingPassed':abs(cr-expected)<=budget and rms>.001,'HannPassed':abs(hz-expected)<=budget and rms>.001,'neutralHannDiagnosticWithin001Hz':abs(hz-expected)<=.01 if ch<2 and row['semitones']==0 else None})
  browser.append({'id':row['id'],'rawSHA256':H(p),'sampleRate':sr,'frames':len(a),'rows':len(blocks),'firstRow':blocks[0],'lastRow':blocks[-1],'wholeFinite':True,'allRowsStrictlyContiguous':True,'armStopCountersMatch':True,'controlChannelsBitIdentical':True,'parameters':row['parameters'],'measurements':measurements,'HannCasePassed':all(x['HannPassed'] for x in measurements),'crossingCasePassed':all(x['crossingPassed'] for x in measurements),'metricsRetainedCount':len(row['metrics'])})
 assert len(browser)==6
 result={'scope':'Independent local package/archive/hash/API-source inspection and whole serial28/browser6 rawfinite/geometry/clock/control/frequency checks. Parentexecuted browserRun; no reviewerUI/native/process/network/production edits. No firstsample/cursor/music/CPU/native/reference/fullparity acceptance.','packages':packages,'holdoutSourceInputs':inputs,'serial':{'renderSHA256':H(serial_path),'analysisSHA256':H(analysis_path),'cases':serial,'passed':sum(x['passed'] for x in serial)},'browser':{'reportSHA256':H(browser_path),'sourceMapping':mapping,'sourceHashes':r['sourceHashes'],'cases':browser,'crossingPassed':sum(x['crossingCasePassed'] for x in browser),'HannPassed':sum(x['HannCasePassed'] for x in browser),'totalFrames':sum(x['frames'] for x in browser),'totalRows':sum(x['rows'] for x in browser)},'fullParityVerified':False,'productionKeylockFixed':False,'originalNative006Regraded':False}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'SHA256':H(OUT),'packages':packages,'serialPasses':result['serial']['passed'],'browserPasses':{'crossing':result['browser']['crossingPassed'],'Hann':result['browser']['HannPassed']},'browser':[{'id':x['id'],'Hann':[m['independentHannHz'] for m in x['measurements']],'crossing':[m['reportedCrossingHz'] for m in x['measurements']]} for x in browser]},indent=2))
if __name__=='__main__':main()
