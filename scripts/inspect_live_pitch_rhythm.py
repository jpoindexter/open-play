#!/usr/bin/env python3
"""Observe actual pulse spacing in fixed steady-state windows; no clock alignment fit."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('report');p.add_argument('pcm');p.add_argument('output');a=p.parse_args();r=json.loads(Path(a.report).read_text());raw=Path(a.pcm);out=Path(a.output);assert not out.exists()
x=np.fromfile(raw,dtype='<f4').reshape(-1,2);sr=44100;assert np.isfinite(x).all()
rows=[]
for name in ['neutral','shifted','afterTempo']:
    state=r[name];first=state['audioTime']-r['recordStartAudioTime']+5;last=first+2;expected=r['criteria']['pulseIntervalOriginalSeconds']/state['rate'];channels=[]
    for c in range(2):
        times=[];previous=-sr
        for n in range(round(first*sr),min(len(x),round(last*sr))):
            if abs(x[n,c])>.01 and n-previous>.1*sr:times.append(n/sr);previous=n
        intervals=np.diff(times).tolist();errors=[v-expected for v in intervals]
        channels.append({'channel':c,'pulseTimes':times,'intervalSeconds':intervals,'errorSeconds':errors,'criterionPassed':len(intervals)>=r['criteria']['minimumIntervalsPerWindow'] and all(abs(e)<=r['criteria']['maximumPulseIntervalErrorSeconds'] for e in errors)})
    rows.append({'name':name,'rate':state['rate'],'fromSeconds':first,'toSeconds':last,'expectedIntervalSeconds':expected,'channels':channels})
result={'scope':'Whole finite PCM; all detected pulse spacings in fixed5–7s-after-settled windows,0.01amplitude threshold/100ms refractory,3intervals per channel minimum,10ms maximum interval error fixed before execution. No timing fit/repair, physical latency, transient fidelity or sample-phase acceptance.','pcmSHA256':hashlib.sha256(raw.read_bytes()).hexdigest(),'criteria':r['criteria'],'rows':rows,'pulseIntervalCriterionPassed':all(c['criterionPassed'] for row in rows for c in row['channels'])}
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
