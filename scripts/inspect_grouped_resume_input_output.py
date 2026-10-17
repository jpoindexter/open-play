import json,hashlib,math,datetime
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[1];src=R/'docs/prototype/soundtouch-group-resume-diagnostic2-results.json';d=json.loads(src.read_text());out=R/'docs/prototype/soundtouch-group-resume-diagnostic2-spectra.json';assert not out.exists()
plan={'declaredBeforeInspection':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Separate diagnostic inspection of retained exact normalized input and bit-exact replay; no regrading parentengine1/2.','sourceReport':str(src.relative_to(R)),'sourceReportSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'inputWindowSeconds':[5,7],'outputWindowRelativeToResume':d['plan']['failedWindowRelativeToResume'],'method':'Global20–20000Hz HannFFT >=16xpadding/logparabolic; all8isolatedstereo stem components; whole files hash/finite checks','pitchErrorHzDiagnosticBudget':1,'noGainDelayFit':True,'fullParityVerified':False};(R/'docs/prototype/soundtouch-group-resume-diagnostic2-spectra-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
def freq(y,sr):
 y=np.array(y,dtype=float);y-=y.mean();n=1<<math.ceil(math.log2(len(y)*16));m=np.abs(np.fft.rfft(y*np.hanning(len(y)),n));lo=math.ceil(20*n/sr);hi=min(len(m)-2,math.floor(min(20000,sr/2-1)*n/sr));k=lo+int(np.argmax(m[lo:hi+1]));a,b,c=np.log(np.maximum(m[k-1:k+2],1e-300));return float((k+.5*(a-c)/(a-2*b+c))*sr/n)
records=[]
for key in ['normalized','output']:
 rec=d[key];b=(R/rec['file']).read_bytes();assert hashlib.sha256(b).hexdigest()==rec['sha256'];x=np.frombuffer(b,dtype='<f4').reshape(-1,10);assert np.isfinite(x).all();sr=rec['sampleRate'];times=plan['inputWindowSeconds'] if key=='normalized' else plan['outputWindowRelativeToResume'];offset=0 if key=='normalized' else d['plan']['serialStartFrame'];a,z=[round(t*sr)+offset for t in times];values=[]
 for s in range(4):
  for c in range(2):
   y=x[a:z,(s+1)*2+c];hz=freq(y,sr);expected=[[197,311,463,719],[257,383,593,887]][c][s]*2*(1 if key=='normalized' else 2**(d['plan']['semitones']/12));values.append({'stem':s,'channel':c,'expectedHz':expected,'Hz':hz,'errorHz':abs(hz-expected),'RMS':float(np.sqrt(np.mean(y.astype(float)**2)))})
 records.append({'role':key,'raw':rec,'wholeFinite':True,'firstFrame':a,'lastExclusive':z,'channels':values})
result={'plan':plan,'records':records,'inputMaxErrorHz':max(v['errorHz'] for v in records[0]['channels']),'outputFailures':[v for v in records[1]['channels'] if v['errorHz']>1],'scope':'Exact saved SRC output inputs are clean steady tones in this declared interval; actual public grouped DSP output reproduces captured deviations. Does not isolate a particular internal routine or prove music/other sources/native parity.'};out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'inputMaxErrorHz':result['inputMaxErrorHz'],'outputFailures':result['outputFailures']},indent=2))
