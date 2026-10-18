"""Fixed production MIDI-controller scenarios; inspect raw retained audio."""
import base64,hashlib,json,subprocess
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];RAW=ROOT/'local-evidence/simple-sync-controller-133';OUT=ROOT/'docs/prototype'
def sha(b):return hashlib.sha256(b).hexdigest()
def peak_hz(x,sr):
 n=1<<int(np.ceil(np.log2(16*len(x))));s=np.abs(np.fft.rfft((x-x.mean())*np.hanning(len(x)),n))
 s[:int(20*n/sr)]=0;s[int(20000*n/sr):]=0;k=int(s.argmax());v=np.log(np.maximum(s[k-1:k+2],1e-30));d=.5*(v[0]-v[2])/(v[0]-2*v[1]+v[2]);return float((k+d)*sr/n)
expected=[[1,1.2],[1.21/1.2,1.21],[1.21/1.2,.99],[1.21/1.2,.98],[1.21/1.2,1.21],[1.2312/1.2,1.2312],[1.2312/1.2,1.2312],[1.2412/1.2,1.2412],[1.2412/1.2,.97],[1,.97],[1,.97]]
def inspect(name,rates,final=False):
 data=(RAW/f'{name}-original.json').read_bytes();r=json.loads(data);assert not r['errors'] and r['sourceStable'];assert len(r['cases'])==len(rates)
 cases=[]
 for i,(c,exp) in enumerate(zip(r['cases'],rates)):
  assert all(abs(a-b)<1e-8 for a,b in zip(c['rates'],exp));silent=i==len(rates)-1;measured=[]
  for ch,p in enumerate(c['pcm']):
   b=base64.b64decode(p['base64'],validate=True);assert sha(b)==p['sha256'];x=np.frombuffer(b,'<f4').astype(float);assert len(x)==13230 and np.isfinite(x).all();(RAW/f'{name}-{i+1:02d}-ch{ch}.f32').write_bytes(b)
   rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));hz=None if silent else peak_hz(x,r['sampleRate']);target=0 if silent else (330 if ch==0 else 550)*exp[ch]
   assert (peak<1e-6 if silent else rms>=.005 and abs(hz-target)<.3),(i,ch,hz,target,peak,rms)
   measured.append({'channel':ch,'frames':len(x),'sha256':sha(b),'allFinite':True,'rms':rms,'peak':peak,'frequencyHz':hz,'expectedActualHz':target,'frequencyErrorHz':None if silent else hz-target,'passed':True})
  cases.append({'name':c['name'],'rates':c['rates'],'harnessExpectedRates':c['expectedRates'],'sync':c['sync'],'measurements':measured})
 recording=base64.b64decode(r['recording']['base64'],validate=True);assert sha(recording)==r['recording']['sha256'];master=RAW/f'{name}-master.webm';master.write_bytes(recording)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(master)]))['streams'][0];sr=int(info['sample_rate']);channels=int(info['channels']);assert channels==2
 decoded=RAW/f'{name}-master.f32';subprocess.run(['ffmpeg','-v','error','-y','-i',str(master),'-f','f32le',str(decoded)],check=True);b=decoded.read_bytes();x=np.frombuffer(b,'<f4');assert len(x)%channels==0 and np.isfinite(x).all() and np.max(np.abs(x))>.005
 result={'passed':final,'bugReproduced':not final,'scope':r['scope'],'inspection':'Independent Python full-window hash/finite checks, global20–20000Hz Hann16x FFT without expected-frequency mask; fixed0.3Hz/.005RMS/1e-6silence, rate1e-8. Complete independent FFmpeg decode finite/nonzero. No acoustic/hardware/phase/continuity or whole-mode acceptance.',
  'originalBytes':len(data),'originalSHA256':sha(data),'sampleRate':r['sampleRate'],'sourceBefore':r['sourceBefore'],'sourceAfter':r['sourceAfter'],'sourceStable':True,'cases':cases,
  'maxFrequencyErrorHz':max(abs(m['frequencyErrorHz']) for c in cases for m in c['measurements'] if m['frequencyErrorHz'] is not None),
  'wholeRecording':{'bytes':len(recording),'sha256':sha(recording),'format':r['recording']['format'],'browserDecode':{k:r['recording'][k] for k in ['sampleRate','frames','channels','allFinite']},'independentDecode':{'sampleRate':sr,'channels':channels,'frames':len(x)//channels,'allFinite':True,'peak':float(np.max(np.abs(x))),'pcmSHA256':sha(b)}}}
 if final:
  assert r['completed'];assert all(c['passed'] for c in r['cases']);assert all(not d['sync'] for d in r['cases'][2]['sync'][1:]);assert r['cases'][2]['sync'][0]['sync'];assert r['cases'][8]['sync'][1]['state']=='off';assert not r['unknownPositionAfterOFF']['sync'] and r['unknownPositionAfterOFF']['state']=='off';assert abs(r['unknownPositionAfterOFF']['rate']-1.2412/1.2)<1e-8;assert all(not d['playing'] for d in r['cases'][-1]['sync'])
  for f,h in r['sourceAfter'].items():assert sha((ROOT/'prototype'/f).read_bytes())==h
  result['currentSourceMatches']=True;result['unknownPositionAfterOFF']=r['unknownPositionAfterOFF']
 else:
  assert not r['completed'] and not r['cases'][1]['passed'] and not r['cases'][2]['passed'];result['failureInterpretation']='Movement stayed at+20% instead of+21%; one OFF also stayed+20% instead of received−1%. Stop audio is exactly zero; its harness case is marked false only because prior failed rates differ from the intended scenario.'
 return result
before=inspect('before',[[1,1.2]]*4);after=inspect('after',expected,True)
(OUT/'simple-sync-controller-before-browser-results.json').write_text(json.dumps(before,indent=2)+'\n');(OUT/'simple-sync-controller-browser-results.json').write_text(json.dumps(after,indent=2)+'\n')
print(json.dumps({'beforeBugsReproduced':True,'afterPassed':True,'cases':len(after['cases']),'windows':sum(len(c['measurements'])for c in after['cases']),'maxFrequencyErrorHz':after['maxFrequencyErrorHz'],'originalBytes':after['originalBytes'],'originalSHA256':after['originalSHA256'],'wholeRecording':after['wholeRecording'],'sourceStable':True,'currentSourceMatches':True},indent=2))
