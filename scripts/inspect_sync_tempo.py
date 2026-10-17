#!/usr/bin/env python3
import argparse,json,hashlib,subprocess
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('report');p.add_argument('audio');p.add_argument('output');a=p.parse_args();r=json.loads(Path(a.report).read_text());out=Path(a.output);pcm=out.with_suffix('.f32');sr=44100
subprocess.run(['ffmpeg','-v','error','-y','-i',a.audio,'-ac','2','-ar',str(sr),'-f','f32le',str(pcm)],check=True);x=np.fromfile(pcm,'<f4').reshape(-1,2);assert np.isfinite(x).all()
def peak(y):
 n=1<<int(np.ceil(np.log2(16*len(y))));s=np.abs(np.fft.rfft((y-y.mean())*np.hanning(len(y)),n));s[:int(20*n/sr)]=0;s[int(20000*n/sr):]=0;k=s.argmax();v=np.log(np.maximum(s[k-1:k+2],1e-30));d=.5*(v[0]-v[2])/(v[0]-2*v[1]+v[2]);return float((k+d)*sr/n)
def at(name):return next(e['time'] for e in r['events'] if e['name']==name)
carrier=440*2**(3/12);windows=[]
for name,rate in [('first-ready',1.05),('latest-ready',1.04)]:
 start=at(name)+.3;end=start+1;y=x[round(start*sr):round(end*sr)];assert len(y)==sr;hz=[peak(y[:,c]) for c in range(2)];expected=[carrier*rate,carrier];windows.append({'name':name,'from':start,'to':end,'hz':hz,'expected':expected,'errorsHz':[hz[c]-expected[c] for c in range(2)]})
continuity=[];first=round(.1*sr);last=round((r['pauseAt']-.02)*sr);hop=44
for c in range(2):
 vals=x[first:last,c];vals=vals[:len(vals)//hop*hop].reshape(-1,hop);rms=np.sqrt(np.mean(vals.astype(float)**2,axis=1));longest=run=0
 for quiet in rms<1e-4:run=run+1 if quiet else 0;longest=max(longest,run)
 continuity.append({'channel':c,'from':first/sr,'to':last/sr,'minimum1msRMS':float(rms.min()),'maximumQuietRunSeconds':longest*hop/sr})
s=x[round((r['pauseAt']+.08)*sr):round((r['pauseAt']+.22)*sr)];pauseRMS=np.sqrt(np.mean(s.astype(float)**2,axis=0)).tolist();phase=[{'name':s['name'],'pairs':len(s['pairs']),'maxErrorSeconds':max(p['errorSeconds'] for p in s['pairs'])} for s in r['audio']['sections']]
passed=all(abs(e)<1 for w in windows for e in w['errorsHz'])and all(c['maximumQuietRunSeconds']<=.02 for c in continuity)and pauseRMS[0]<1e-4 and pauseRMS[1]>.001 and all(s['pairs']>=3 and s['maxErrorSeconds']<=.01 for s in phase)
result={'scope':'Independent complete FFmpeg44100Hz PCM decode/finite; fixed1ms continuity and event-relative1s global20–20000Hz Hann16x peak; no waveform fitting/expected-frequency mask. No native/hardware/listening acceptance.','criteria':{'maxPitchErrorHz':1,'maxPhaseErrorSeconds':.01,'maxQuietRunSeconds':.02,'quietRMS':1e-4,'pausedLeftRMS':1e-4,'playingRightRMS':.001},'passed':passed,'audioSHA256':hashlib.sha256(Path(a.audio).read_bytes()).hexdigest(),'pcmSHA256':hashlib.sha256(pcm.read_bytes()).hexdigest(),'frames':len(x),'wholeFinite':True,'windows':windows,'phase':phase,'continuity':continuity,'pauseRMS':pauseRMS};out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
