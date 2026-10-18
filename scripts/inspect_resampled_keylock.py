#!/usr/bin/env python3
"""Whole returned PCM inspection; pitch only in the two preselected fixed windows."""
import hashlib,json
from pathlib import Path
import numpy as np
from inspect_keylock_pitch_isolation_independent import frequency
root=Path(__file__).resolve().parents[1]
p=root/'docs/prototype/keylock-resampled-production-render.json';r=json.loads(p.read_text())
out=root/'docs/prototype/keylock-resampled-production-inspection.json';assert not out.exists()
rows=[]
for row in r['rows']:
    raw=root/row['rawPath'];assert raw.stat().st_size==row['bytes'] and hashlib.sha256(raw.read_bytes()).hexdigest()==row['sha256']
    x=np.fromfile(raw,dtype='<f4').reshape(-1,2);assert len(x)==row['frames'] and np.isfinite(x).all()
    result={'id':row['id'],'frames':len(x),'wholeFinite':True,'sourceUnchanged':row['inputUnchanged'],'rawSHA256':row['sha256'],'pitchGraded':row['gradePitch']}
    if row['gradePitch']:
        sr=row['sr'];data=x[5*sr:7*sr];expected=[f*2**(row['semitones']/12) for f in row['tones']];measured=[frequency(data[:,c],sr) for c in range(2)];errors=[measured[c]-expected[c] for c in range(2)];rms=np.sqrt(np.mean(data.astype(float)**2,axis=0)).tolist()
        result.update(expectedHz=expected,measuredHz=measured,errorHz=errors,rms=rms,pitchCriterionPassed=all(abs(e)<=1 for e in errors) and min(rms)>.001)
    rows.append(result)
result={'scope':r['scope'],'method':'Whole finite/hash/geometry check. Two fixed5–7s global20–20000Hz Hann16x/log-parabolic pitch checks,1Hz limit. Internal-rate extremes are NOT pitch or musical acceptance.','renderSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'rows':rows,'fullKeylockAccepted':False}
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(rows,indent=2))
