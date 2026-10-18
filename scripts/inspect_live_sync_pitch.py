#!/usr/bin/env python3
"""Independent global pitch and pulse-phase inspection of a whole two-deck recording."""
import argparse,hashlib,json,subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
from inspect_keylock_pitch_isolation_independent import frequency
p=argparse.ArgumentParser();p.add_argument('report');p.add_argument('audio');p.add_argument('output');a=p.parse_args()
r=json.loads(Path(a.report).read_text());audio=Path(a.audio);out=Path(a.output);assert not out.exists();pcm=audio.with_suffix('.f32');assert not pcm.exists()
assert hashlib.sha256(audio.read_bytes()).hexdigest()==r['recording']['sha256'];sr=44100
subprocess.run(['ffmpeg','-v','error','-i',str(audio),'-ac','2','-ar',str(sr),'-f','f32le',str(pcm)],check=True)
x=np.fromfile(pcm,dtype='<f4').reshape(-1,2);assert np.isfinite(x).all()
# Deliberately independent from the browser's two Biquad nodes. This fixed
# common filter suppresses both carriers without estimating or shifting time.
band=sosfilt(butter(4,2000,'highpass',fs=sr,output='sos'),x,axis=0)
times=[]
for c in range(2):
    found=[];previous=-sr
    for n,value in enumerate(band[:,c]):
        if abs(value)>.01 and n-previous>.1*sr:found.append(n/sr);previous=n
    times.append(found)
rows=[]
for w in r['audio']['sections']:
    first=w['from'];last=w['to'];pairs=[{'time':t,'errorSeconds':min(abs(t-z) for z in times[1])} for t in times[0] if first<=t<=last]
    start=first+.1;end=min(last,first+1.1);data=x[round(start*sr):round(end*sr)]
    assert len(data)>.5*sr
    hz=[frequency(data[:,c],sr) for c in range(2)];expected=r['fixture']['expectedCarrierHz'];errors=[hz[c]-expected[c] for c in range(2)]
    rows.append({'name':w['name'],'fromSeconds':first,'toSeconds':last,'pairs':pairs,'maximumPhaseErrorSeconds':max((v['errorSeconds'] for v in pairs),default=None),'carrierWindow':[start,end],'carrierHz':hz,'expectedHz':expected,'errorHz':errors,'phaseCriterionPassed':len(pairs)>=3 and all(v['errorSeconds']<=.01 for v in pairs),'pitchCriterionPassed':all(abs(e)<=1 for e in errors)})
transition=r.get('tempoTransition');quiet=[]
if transition:
    first=transition['callAudioTime']-r['recordStart'];last=transition['settledAudioTime']-r['recordStart']+.1;step=round(sr*.001)
    for c in range(2):
        data=x[round(first*sr):round(last*sr),c];data=data[:len(data)//step*step].reshape(-1,step);rms=np.sqrt(np.mean(data.astype(float)**2,axis=1));run=longest=0
        for b in rms<1e-4:run=run+1 if b else 0;longest=max(longest,run)
        quiet.append({'channel':c,'fromSeconds':first,'toSeconds':last,'minimum1msRMS':float(rms.min()),'longestQuietSeconds':longest*step/sr,'criterionPassed':longest*step/sr<=.02})
result={'scope':'Whole finite FFmpeg decode; independent fixed4th-order Butterworth2kHz highpass and0.01threshold/100ms refractory pulse detector, no timing fit. Global20–20000Hz Hann16x/log-parabolic carrier peaks; fixed1Hz/10ms/3pair criteria. Shared-tempo continuity uses1ms bins/RMS1e-4/20ms limit. Not native/physical/music/full-reference or sample-phase acceptance.','audioSHA256':hashlib.sha256(audio.read_bytes()).hexdigest(),'pcmSHA256':hashlib.sha256(pcm.read_bytes()).hexdigest(),'frames':len(x),'sampleRate':sr,'wholeFinite':True,'sections':rows,'tempoContinuity':quiet,'criteriaPassed':all(z['phaseCriterionPassed'] and z['pitchCriterionPassed'] for z in rows) and all(z['criterionPassed'] for z in quiet),'fullParityVerified':False}
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
