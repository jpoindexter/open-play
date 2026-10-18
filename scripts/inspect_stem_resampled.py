#!/usr/bin/env python3
"""Independently inspect the complete exported five-source/key/Delay workflow."""
import hashlib,json,sys
from pathlib import Path
import numpy as np
report_path,pcm_path=map(Path,sys.argv[1:3])
r=json.loads(report_path.read_text());sr=44100
x=np.fromfile(pcm_path,dtype='<f4').reshape(-1,2).astype(float)
assert np.isfinite(x).all()
assert r['recording']['sha256']==hashlib.sha256(report_path.with_name('master.webm').read_bytes()).hexdigest()
criteria={'maximumCancellationRatio':.01,'maximumBassLeakRatio':.01,'minimumCarrierAmplitude':.005,'minimumMelodyRatio':.5,'minimumTailRMS':.0005,'maximumLateRMS':.00001,'maximumCarrierPitchErrorHz':1}
def section(w):
 a=x[round(w['from']*sr):round(w['to']*sr)];assert len(a)>=.1*sr
 rows=[]
 for channel in range(2):
  samples=a[:,channel];n=len(samples);window=np.hanning(n)
  size=1<<int(np.ceil(np.log2(n*16)));s=np.abs(np.fft.rfft(samples*window,n=size))*2/window.sum();f=np.fft.rfftfreq(size,1/sr)
  band=(f>=20)&(f<=20000);idx=np.flatnonzero(band)[np.argmax(s[band])]
  logs=np.log(np.maximum(s[idx-1:idx+2],1e-30));den=logs[0]-2*logs[1]+logs[2];shift=.5*(logs[0]-logs[2])/den if den else 0
  peak_hz=(idx+shift)*sr/size
  q=2**(w.get('semitones',0)/12)
  component=lambda hz:float(s[(f>=hz*q-2)&(f<=hz*q+2)].max())
  carrier=component(330);cancelled=component(550);bass=component(110)
  rows.append({'rms':float(np.sqrt(np.mean(samples*samples))),'globalPeakHz':peak_hz,'carrierAmplitude':carrier,'opposingAmplitude':cancelled,'bassAmplitude':bass,'opposingRatio':cancelled/max(carrier,1e-30),'bassRatio':bass/max(carrier,1e-30),'carrierPitchErrorHz':peak_hz-330*q})
 return rows
rows=[]
for w in r['audio']['sections']:
 values=section(w);passed=all(v['carrierAmplitude']>.005 and v['opposingRatio']<=.01 and v['bassRatio']<=.01 and abs(v['carrierPitchErrorHz'])<=1 for v in values)
 rows.append({**{k:v for k,v in w.items() if k!='channels'},'channels':values,'criteriaPassed':passed})
positive=section(r['audio']['melodyOnly']);positive_ok=all(v['carrierAmplitude']>.005 and v['opposingRatio']>=.5 for v in positive)
tail=section(r['audio']['delayTail']);tail_ok=all(v['rms']>=.0005 for v in tail)
late=section(r['audio']['muted']);late_ok=all(v['rms']<=.00001 for v in late)
out={'scope':'Whole finite stereo FFmpeg decode, unchanged event windows. Global20–20000Hz Hann16x FFT/log-parabolic carrier peak; fixed shifted component±2Hz maxima for cancellation and dry positive control; no time/gain/pitch fitting. Whole recording retained. Known separated signals only, no separation/model/music/native/hardware/reference parity.','criteria':criteria,'audioSHA256':r['recording']['sha256'],'pcmSHA256':hashlib.sha256(pcm_path.read_bytes()).hexdigest(),'sampleRate':sr,'frames':len(x),'seconds':len(x)/sr,'wholeFinite':True,'sections':rows,'melodyOnly':{'channels':positive,'criteriaPassed':positive_ok},'delayTail':{'channels':tail,'criteriaPassed':tail_ok},'lateDecay':{'channels':late,'criteriaPassed':late_ok},'criteriaPassed':all(w['criteriaPassed'] for w in rows) and positive_ok and tail_ok and late_ok,'fullParityVerified':False}
output=report_path.with_name('inspection.json');output.write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'sectionsPassed':[w['criteriaPassed'] for w in rows],'maximumOpposingRatio':max(v['opposingRatio'] for w in rows for v in w['channels']),'maximumCarrierPitchErrorHz':max(abs(v['carrierPitchErrorHz']) for w in rows for v in w['channels']),'tailRMS':[v['rms'] for v in tail],'lateRMS':[v['rms'] for v in late],'criteriaPassed':out['criteriaPassed']}))
