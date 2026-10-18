#!/usr/bin/env python3
"""Independent whole-PCM and fixed-window inspection of the resampling experiment."""
import hashlib,json
from pathlib import Path
import numpy as np
from inspect_keylock_pitch_isolation_independent import frequency

root=Path(__file__).resolve().parents[1]
plan=json.loads((root/'docs/prototype/keylock-resampled-pitch-plan.json').read_text())
render_path=root/'docs/prototype/keylock-resampled-pitch-initial-render.json'
r=json.loads(render_path.read_text())
assert r['planSHA256']==hashlib.sha256((root/r['planPath']).read_bytes()).hexdigest()
out=root/'docs/prototype/keylock-resampled-pitch-initial-inspection.json';assert not out.exists()
def load(row):
    p=root/row['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'] and p.stat().st_size==row['bytes']
    x=np.fromfile(p,dtype='<f4').reshape(-1,row['channels']);assert len(x)==row['frames'] and np.isfinite(x).all();return x
sources=[]
for row in r['sources']:
    x=load(row);sr=row['sampleRate'];measured=[frequency(x[5*sr:7*sr,c],sr) for c in range(2)]
    assert max(abs(measured[c]-row['tonesHz'][c]) for c in range(2))<.001
    sources.append({'id':row['id'],'sha256':row['sha256'],'measuredHz':measured})
rows=[]
for row in r['results']:
    x=load(row);sr=row['sampleRate'];first,last=[round(t*sr) for t in plan['measurementSeconds']];data=x[first:last]
    measured=[frequency(data[:,c],sr) for c in range(2)];expected=[hz*2**(row['requestedSemitones']/12) for hz in row['tonesHz']];errors=[measured[c]-expected[c] for c in range(2)];rms=np.sqrt(np.mean(data.astype(float)**2,axis=0)).tolist()
    rows.append({'id':row['id'],'variant':row['variant'],'frames':len(x),'wholeFinite':True,'rawSHA256':row['sha256'],'expectedHz':expected,'measuredHz':measured,'errorHz':errors,'rms':rms,'criterionPassed':all(abs(e)<=plan['maximumFrequencyErrorHz'] for e in errors) and min(rms)>plan['minimumRMS']})
result={'scope':plan['scope'],'method':'Whole raw PCM hash/geometry/finite checks; independent global20–20000Hz Hann16x/log-parabolic maximum in fixed5–7s. No expected-frequency mask, tuning or aligned/trimmed capture.','renderSHA256':hashlib.sha256(render_path.read_bytes()).hexdigest(),'criteria':{'maximumFrequencyErrorHz':plan['maximumFrequencyErrorHz'],'minimumRMS':plan['minimumRMS']},'sources':sources,'results':rows,'fullKeylockAccepted':False}
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'results':rows},indent=2))
