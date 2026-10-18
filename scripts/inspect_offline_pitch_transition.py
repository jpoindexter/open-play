#!/usr/bin/env python3
"""Inspect fixed request/preparation intervals in the whole retained master PCM."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('report');p.add_argument('pcm');p.add_argument('output');a=p.parse_args()
r=json.loads(Path(a.report).read_text());raw=Path(a.pcm);out=Path(a.output);assert not out.exists()
x=np.fromfile(raw,dtype='<f4').reshape(-1,2);assert np.isfinite(x).all();sr=44100
rows=[];step=round(sr*.01)
for action in r['pitchActions']:
    first=action['callAudioTime']-r['recordStartAudioTime'];last=action['settledAudioTime']-r['recordStartAudioTime']+.1
    data=x[round(first*sr):round(last*sr)];bins=[];run=longest=0
    for n in range(0,len(data)-step+1,step):
        rms=np.sqrt(np.mean(data[n:n+step].astype(float)**2,axis=0)).tolist();quiet=max(rms)<.001
        run=run+1 if quiet else 0;longest=max(longest,run);bins.append({'fromSeconds':first+n/sr,'rms':rms,'quiet':quiet})
    rows.append({'semitones':action['semitones'],'fromSeconds':first,'toSeconds':last,'frames':len(data),'preparationMs':action['preparationMs'],'longestQuietSeconds':longest*step/sr,'quietBins':sum(b['quiet'] for b in bins),'bins':bins,'gapCriterionPassed':longest*step/sr<=.02})
result={'scope':'Whole recorded PCM, fixed actual key-request through settled+100ms windows;10ms bins, quiet when both channel RMS<0.001,20ms maximum consecutive quiet. No fitted offset/gain, loop-boundary, sample-phase, physical latency or general music acceptance.','pcmSHA256':hashlib.sha256(raw.read_bytes()).hexdigest(),'rows':rows,'gapCriterionPassed':all(z['gapCriterionPassed'] for z in rows)}
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'gapCriterionPassed':result['gapCriterionPassed'],'rows':[{k:v for k,v in row.items() if k!='bins'} for row in rows]},indent=2))
