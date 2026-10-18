"""Independent retained-PCM checks; fixed native-chain and live-control criteria."""
import base64,hashlib,json,re
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];RAW=ROOT/'local-evidence/lpf-live-135';OUT=ROOT/'docs/prototype'
def sha(b):return hashlib.sha256(b).hexdigest()
def load(name):
 b=(RAW/f'{name}-original.json').read_bytes();r=json.loads(b);assert r['sourceStable'] and not r['errors'];return b,r
def pcm(p,name):
 b=base64.b64decode(p['base64'],validate=True);assert sha(b)==p['sha256'];x=np.frombuffer(b,'<f4').astype(float);assert len(x)==p['frames']and np.isfinite(x).all();(RAW/name).write_bytes(b);return x
def freq(v):return float(re.match(r'\s*([\d.]+)',str(v))[1])*(1000 if 'khz'in str(v).lower()else 1)
def response(spec,hz,sr):
 p=spec['params'];depth=float(spec['depth'])/100;lo=freq(p['Min Freq']);hi=freq(p['Max Freq']);fc=hi*(lo/hi)**depth;slope=round(freq(p['Slope'])/6)*6;count=slope//12;z=np.exp(-2j*np.pi*hz/sr);h=1+0j
 if count:
  w=2*np.pi*min(fc,sr/2)/sr;alpha=np.sin(w)/(2*10**(float(p.get('Resonance',1.77))/count/20));h=((1-np.cos(w))/2+(1-np.cos(w))*z+(1-np.cos(w))/2*z*z)/(1+alpha-2*np.cos(w)*z+(1-alpha)*z*z);h=h**count
 if slope%12==6:
  k=np.tan(np.pi*min(fc,sr*.49)/sr);b=k/(1+k);h*=b*(1+z)/(1+(k-1)/(k+1)*z)
 return abs(1-depth+depth*h)
def live(name,expected_count):
 b,r=load(name);assert len(r['cases'])==expected_count;rows=[]
 for i,c in enumerate(r['cases']):
  metrics=[]
  for ch,p in enumerate(c['pcm']):
   x=pcm(p,f'{name}-{i+1:02d}-ch{ch}.f32');assert len(x)==r['sampleRate'];jump=float(np.max(np.abs(np.diff(x))));peak=float(np.max(np.abs(x)));sr=r['sampleRate'];pre=x[round(.05*sr):round(.15*sr)];post=x[round(.8*sr):round(.9*sr)];means=[float(pre.mean()),float(post.mean())];delta=abs(means[1]-means[0]);tones=[]
   if not c['silence']:
    gain=means[0]/.15
    for hz in [100,2000]:
     measured=float(abs(np.sum((post-post.mean())*np.exp(-2j*np.pi*hz*np.arange(len(post))/sr)))*2/len(post));target=.02*gain*response(c['specAfter'],hz,sr);error=abs(measured-target)/target;assert error<.01,(name,i,ch,hz,measured,target,error);tones.append({'hz':hz,'measuredAmplitude':measured,'expectedAmplitude':target,'relativeError':error})
   passed=peak<1e-6 if c['silence']else jump<.03 and delta<.005
   if name=='after':assert passed and(c['silence']or c['voicePreserved']and c['playing'])
   metrics.append({'channel':ch,'frames':len(x),'allFinite':True,'sha256':p['sha256'],'maxAdjacentSampleJump':jump,'peak':peak,'meanBefore':means[0],'meanAfter':means[1],'meanChange':delta,'endpointTones':tones,'passed':passed})
  rows.append({'name':c['name'],'specBefore':c['specBefore'],'specAfter':c['specAfter'],'commandBefore':c['commandBefore'],'commandAfter':c['commandAfter'],'voicePreserved':c['voicePreserved'],'playing':c['playing'],'positionBefore':c['positionBefore'],'positionAfter':c['positionAfter'],'metrics':metrics})
 if name=='before':assert rows[0]['metrics'][0]['maxAdjacentSampleJump']>.03 and c['silence']
 if name=='after':
  assert r['completed']
  for f,h in r['sourceAfter'].items():assert sha((ROOT/'prototype'/f).read_bytes())==h
 return{'passed':name=='after','bugReproduced':name=='before','scope':r['scope'],'inspection':'Full retained Float32 hashes/finite/adjacent differences and fixed DC windows. Live endpoint100/2000Hz amplitudes independently projected and compared to W3C native-biquad plus bilinear one-pole/dry-wet transfer;1%relative amplitude,0.03jump,0.005mean-change criteria. No fitted waveform, acoustic/music/full-reference proof.',
  'originalBytes':len(b),'originalSHA256':sha(b),'sampleRate':r['sampleRate'],'sourceBefore':r['sourceBefore'],'sourceAfter':r['sourceAfter'],'sourceStable':True,'currentSourceMatches':name=='after','cases':rows,
  'maxAdjacentSampleJump':max(m['maxAdjacentSampleJump']for c in rows for m in c['metrics']),'maxEndpointAmplitudeRelativeError':max(t['relativeError']for c in rows for m in c['metrics']for t in m['endpointTones'])}
before=live('before',2);after=live('after',7)
(OUT/'lpf-live-before-results.json').write_text(json.dumps(before,indent=2)+'\n');(OUT/'lpf-live-browser-results.json').write_text(json.dumps(after,indent=2)+'\n')
b,r=load('reference');assert r['completed']and len(r['results'])==8;rows=[]
for row in r['results']:
 arrays=[pcm(p,f'reference-{row["slope"]:02d}-ch{p["channel"]}.f32')for p in row['pcm']];measurements=[]
 for ch in range(2):
  x,y=arrays[ch],arrays[ch+2];error=x-y;maximum=float(np.max(np.abs(error)));relative=float(np.sqrt(np.sum(error*error)/np.sum(y*y)));assert maximum<1e-5 and relative<1e-5;measurements.append({'channel':ch,'maxAbsoluteError':maximum,'relativeRMSError':relative})
 rows.append({'slope':row['slope'],'channels':[{k:p[k]for k in ['channel','frames','sha256']}for p in row['pcm']],'comparison':measurements,'passed':True})
for f,h in r['sourceAfter'].items():assert sha((ROOT/'prototype'/f).read_bytes())==h
reference={'passed':True,'scope':r['scope'],'inspection':'Independent full-channel Float32 hashes/finite and sample-by-sample native-node comparison; fixed1e-5 absolute/relative RMS criteria. Native API oracle is prior Open Play policy, not Serato.',
 'originalBytes':len(b),'originalSHA256':sha(b),'sourceBefore':r['sourceBefore'],'sourceAfter':r['sourceAfter'],'sourceStable':True,'currentSourceMatches':True,'results':rows,'maxAbsoluteError':max(m['maxAbsoluteError']for r in rows for m in r['comparison']),'maxRelativeRMSError':max(m['relativeRMSError']for r in rows for m in r['comparison'])}
(OUT/'lpf-native-node-comparison-results.json').write_text(json.dumps(reference,indent=2)+'\n')
print(json.dumps({'beforeJump':before['maxAdjacentSampleJump'],'afterMaxJump':after['maxAdjacentSampleJump'],'afterMaxEndpointAmplitudeRelativeError':after['maxEndpointAmplitudeRelativeError'],'referenceMaxAbsoluteError':reference['maxAbsoluteError'],'referenceMaxRelativeRMSError':reference['maxRelativeRMSError'],'originals':[{k:r[k]for k in ['originalBytes','originalSHA256']}for r in [before,after,reference]]},indent=2))
