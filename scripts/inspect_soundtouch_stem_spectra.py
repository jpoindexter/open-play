import json,datetime,hashlib,math,argparse
from pathlib import Path
import numpy as np
args=argparse.ArgumentParser();args.add_argument('--tag',choices=['grouped-stems','grouped-fullseek-stems'],default='grouped-stems');args=args.parse_args()
R=Path(__file__).resolve().parents[1];P=R/('docs/prototype/soundtouch-'+args.tag+'-spectral-plan.json');O=R/('docs/prototype/soundtouch-'+args.tag+'-spectral-results.json');assert not P.exists() and not O.exists()
plan={'declared_before_spectral_inspection':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Additional spectral inspection of all already retained grouped-stem raw PCM; separate from previously declared recombination criterion. No retrograde of original results; no new capture.','sourceReport':'docs/prototype/soundtouch-'+args.tag+'-results.json','windowSeconds':[.5,2.5],'frequencyErrorHzMax':1,'RMSMin':.001,'method':'Global20–20000Hz Hann FFT at>=16xpadding/logparabolic interpolation, each isolatedstem/stereochannel; no expected-frequency-restrictedsearch','cases':6,'measurements':48,'fullParityVerified':False};P.write_text(json.dumps(plan,indent=2)+'\n');d=json.loads((R/plan['sourceReport']).read_text())
def h(x,sr):
 x=np.asarray(x,dtype=np.float64);x-=x.mean();n=1<<math.ceil(math.log2(len(x)*16));v=np.abs(np.fft.rfft(x*np.hanning(len(x)),n));lo=math.ceil(20*n/sr);hi=min(len(v)-2,math.floor(min(20000,sr/2-1)*n/sr));k=lo+int(np.argmax(v[lo:hi+1]));a,b,c=np.log(np.maximum(v[k-1:k+2],1e-300));return float((k+.5*(a-c)/(a-2*b+c))*sr/n)
selfchecks=[]
for sr in [44100,48000]:
 for freq in [197,311,463,719,257,383,593,887]:
  got=h(.1*np.sin(np.arange(sr*2)*freq*2*np.pi/sr+.13),sr);assert abs(got-freq)<.001;selfchecks.append({'sr':sr,'expected':freq,'got':got})
rows=[]
for case in d['cases']:
 raw=R/case['raw']['path'];b=raw.read_bytes();assert hashlib.sha256(b).hexdigest()==case['raw']['sha256'];x=np.frombuffer(b,dtype='<f4').reshape(-1,10);sr=case['sampleRate'];a,z=[round(t*sr) for t in plan['windowSeconds']];vals=[]
 for s in range(4):
  for c in range(2):
   y=x[a:z,(s+1)*2+c];level=float(np.sqrt(np.mean(y.astype(float)**2)));freq=h(y,sr);expected=[d['plan']['fixture']['stemLeftHz'],d['plan']['fixture']['stemRightHz']][c][s]*2**(case['semitones']/12);error=abs(freq-expected);vals.append({'stem':s,'channel':c,'expectedHz':expected,'Hz':freq,'RMS':level,'errorHz':error,'passed':level>plan['RMSMin'] and error<=plan['frequencyErrorHzMax']})
 rows.append({'id':case['id'],'sampleRate':sr,'rawSHA256':case['raw']['sha256'],'channels':vals,'passed':all(v['passed'] for v in vals)})
out={'plan':plan,'selfchecks':selfchecks,'cases':rows,'passed':sum(r['passed'] for r in rows),'failedMeasurements':sum(not v['passed'] for r in rows for v in r['channels']),'fullParityVerified':False};O.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'acceptedCases':out['passed'],'failedMeasurements':out['failedMeasurements'],'failures':[{'case':r['id'],'sr':r['sampleRate'],**v} for r in rows for v in r['channels'] if not v['passed']]},indent=2))
