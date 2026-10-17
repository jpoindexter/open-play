"""Decode the entire saved native original; retain every spectral window."""
import hashlib,json,math,subprocess,datetime,argparse
from pathlib import Path
import numpy as np
args=argparse.ArgumentParser();args.add_argument('--plan',default='docs/prototype/desktop-0.1.7-phase-runtime-plan.json');args.add_argument('--output',default='docs/prototype/desktop-0.1.7-phase-audio-inspection.json');args=args.parse_args()
R=Path(__file__).resolve().parents[1];plan=json.loads((R/args.plan).read_text());out=R/args.output;assert not out.exists()
D=R/'local-evidence/desktop-0.1.7-phase-audio';D.mkdir(exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def hz(x,sr):
 x=np.asarray(x,dtype=np.float64);x=x-x.mean();n=1<<math.ceil(math.log2(len(x)*16));m=np.abs(np.fft.rfft(x*np.hanning(len(x)),n));lo=max(1,math.ceil(20*n/sr));hi=min(len(m)-2,math.floor(min(20000,sr/2-1)*n/sr));k=lo+int(np.argmax(m[lo:hi+1]));a,b,c=np.log(np.maximum(m[k-1:k+2],1e-300));den=a-2*b+c;delta=.5*(a-c)/den if den else 0;return float((k+delta)*sr/n)
def rms(x):return float(np.sqrt(np.mean(np.asarray(x,dtype=np.float64)**2)))
checks=[]
for sr in [44100,48000]:
 for f in [330,550,330*2**(2/12),550*2**(2/12)]:
  got=hz(.1*np.sin(np.arange(sr*2)*2*np.pi*f/sr+.31),sr);assert abs(got-f)<.001;checks.append({'sr':sr,'expected':f,'measured':got})
records=[]
for case in plan['audio_cases']:
 source=Path('/Users/jasonpoindexter/Downloads')/case['file'];b=source.read_bytes();copy=D/source.name
 with copy.open('xb') as f:f.write(b)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(source)]));stream=[s for s in probe['streams'] if s['codec_type']=='audio'];assert len(stream)==1;sr=int(stream[0]['sample_rate']);channels=int(stream[0]['channels']);assert channels==2
 raw=D/(source.name+'.whole-f32le');subprocess.run(['ffmpeg','-v','error','-nostdin','-n','-i',str(source),'-map','0:a:0','-c:a','pcm_f32le','-f','f32le',str(raw)],check=True);x=np.fromfile(raw,dtype='<f4').reshape(-1,channels);finite=bool(np.isfinite(x).all());windows=[]
 for start in range(0,len(x),sr):
  end=min(len(x),start+sr);vals=[]
  for ch in range(channels):
   a=x[start:end,ch];level=rms(a);f=None if level<case['minimumRMS'] else hz(a,sr);vals.append({'channel':ch,'RMS':level,'Hz':f,'errorHz':None if f is None else abs(f-case['expectedHz'][ch])})
  windows.append({'startSample':start,'endExclusive':end,'partial':end-start<sr,'channels':vals})
 a,b=case['windowSeconds'];measure=[]
 for ch in range(channels):
  y=x[a*sr:b*sr,ch];assert len(y)==(b-a)*sr;f=hz(y,sr);level=rms(y);err=abs(f-case['expectedHz'][ch]);measure.append({'channel':ch,'expectedHz':case['expectedHz'][ch],'Hz':f,'RMS':level,'errorHz':err,'passed':err<=case['frequencyErrorHzMax'] and level>case['minimumRMS']})
 records.append({'original':str(source),'originalSHA256':sha(source.read_bytes()),'bytes':source.stat().st_size,'retainedCopy':str(copy.relative_to(R)),'copySHA256':sha(copy.read_bytes()),'probe':probe,'wholeDecode':{'path':str(raw.relative_to(R)),'bytes':raw.stat().st_size,'sha256':sha(raw.read_bytes()),'sampleRate':sr,'channels':channels,'frames':len(x),'seconds':len(x)/sr,'allFinite':finite,'RMS':[rms(x[:,c]) for c in range(channels)],'peak':[float(np.max(np.abs(x[:,c]))) for c in range(channels)]},'declaredWindowSeconds':[a,b],'declaredWindow':measure,'every1sWindowIncludingFinalPartial':windows,'passed':finite and all(v['passed'] for v in measure)})
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'plan':plan,'frequencyMethod':'Global20–20000Hz peak,16x-or-more power-of-two Hann FFT and log-parabolic interpolation; never restrict search near expected tone','estimatorSelfChecks':checks,'records':records,'declaredCriteriaPassed':all(r['passed'] for r in records),'scope':'Actual saved main-app master original decoded wholly, steady declared frequency criterion. Not acoustic/native cursor/instantaneous continuity/music or full parity proof.','fullParityVerified':False}
with out.open('x') as f:json.dump(report,f,indent=2);f.write('\n')
print(json.dumps({'out':str(out.relative_to(R)),'passed':report['declaredCriteriaPassed'],'records':[{'sha':r['originalSHA256'],'decode':r['wholeDecode'],'declaredWindow':r['declaredWindow']} for r in records]},indent=2))
