#!/usr/bin/env python3
"""Full-span finite and fixed-window global-spectrum inspection; never fit alignment."""
import argparse,hashlib,json,subprocess
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('report');p.add_argument('audio');p.add_argument('output');a=p.parse_args();report=json.loads(Path(a.report).read_text());audio=Path(a.audio);out=Path(a.output);pcm=out.with_suffix('.f32')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(audio),'-ac','2','-ar','44100','-f','f32le',str(pcm)],check=True)
x=np.fromfile(pcm,dtype='<f4').reshape(-1,2);sr=44100;assert np.isfinite(x).all();expected=440*2**(3/12)
def spectrum(y):
 n=1<<int(np.ceil(np.log2(16*len(y))));s=np.abs(np.fft.rfft((y-y.mean())*np.hanning(len(y)),n));s[:int(20*n/sr)]=0;s[int(20000*n/sr):]=0;k=int(s.argmax());v=np.log(np.maximum(s[k-1:k+2],1e-30));d=.5*(v[0]-v[2])/(v[0]-2*v[1]+v[2]);return float((k+d)*sr/n)
windows=[]
for start,end in [(.5,1.5),(2.5,3.5),(4.5,5.5),(6.5,7.5),(8.5,9.5)]:
 samples=x[round(start*sr):round(end*sr)];assert len(samples)==sr;hz=[spectrum(samples[:,c]) for c in range(2)];windows.append({'from':start,'to':end,'dominantHz':hz,'errorsHz':[f-expected for f in hz]})
phase=[{'name':s['name'],'pairs':len(s['pairs']),'maxErrorSeconds':max(v['errorSeconds'] for v in s['pairs'])} for s in report['audio']['sections']]
r={'scope':'Independent FFmpeg44100Hz decode, whole-span finite and fixed-window20–20000Hz global Hann16x/log-parabolic peak; no alignment fit or expected-frequency search mask. Not native/hardware/listening proof.','criteria':{'maximumPitchErrorHz':1,'maximumPulsePhaseErrorSeconds':.01,'minimumPairsPerSection':3},'expectedHz':expected,'audioSHA256':hashlib.sha256(audio.read_bytes()).hexdigest(),'pcmSHA256':hashlib.sha256(pcm.read_bytes()).hexdigest(),'frames':len(x),'sampleRate':sr,'wholeFinite':True,'windows':windows,'phase':phase,'passed':all(abs(e)<1 for w in windows for e in w['errorsHz'])and all(v['pairs']>=3 and v['maxErrorSeconds']<=.01 for v in phase)}
out.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'passed':r['passed'],'windows':windows,'phase':phase},indent=2))
