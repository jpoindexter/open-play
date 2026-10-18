"""Inspect retained actual browser PCM with fixed, predeclared GUI actions."""
import base64, hashlib, json
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'local-evidence/gui-tempo-132'
OUT=ROOT/'docs/prototype'
names=['Synced +20% baseline','ArrowDown: one relative step, both synced decks',
 'ArrowUp: return to synced baseline','First OFF and ArrowDown: only REL deck changes',
 'Range8→16 and ArrowUp preserve tempo offset','Primary GUI step changes shared tempo',
 'Secondary GUI step rebases after primary change','Control+Home resets actual pitch and shared tempo',
 'Second OFF and End use ordinary absolute +16%','Command-click resets only unsynced deck',
 'Both normal Play buttons stop; captured silence']
expected=[[1,1.2],[1.199/1.2,1.199],[1,1.2],[1,1.199],[1,1.2],
 [1.001,1.2012],[1.2002/1.2,1.2002],[1/1.2,1],[1/1.2,1.16],[1/1.2,1],[1/1.2,1]]
def digest(b):return hashlib.sha256(b).hexdigest()
def spectral_peak(x,sr):
 n=1<<int(np.ceil(np.log2(16*len(x))))
 spectrum=np.abs(np.fft.rfft((x-x.mean())*np.hanning(len(x)),n))
 spectrum[:int(20*n/sr)]=0;spectrum[int(20000*n/sr):]=0
 k=int(spectrum.argmax());v=np.log(np.maximum(spectrum[k-1:k+2],1e-30))
 delta=.5*(v[0]-v[2])/(v[0]-2*v[1]+v[2])
 return float((k+delta)*sr/n)
def inspect(file,exp,case_names):
 data=file.read_bytes();r=json.loads(data);assert r['sourceStable']
 assert len(r['cases'])==len(exp)
 cases=[]
 for i,(c,rates) in enumerate(zip(r['cases'],exp)):
  assert all(abs(a-b)<1e-8 for a,b in zip(c['rates'],rates))
  measurements=[]
  for channel,pcm in enumerate(c['pcm']):
   b=base64.b64decode(pcm['base64'],validate=True);assert digest(b)==pcm['sha256']
   x=np.frombuffer(b,'<f4').astype(float);assert len(x)==13230 and np.isfinite(x).all()
   (RAW/f'{file.stem}-{i+1:02d}-ch{channel}.f32').write_bytes(b)
   silence=i==len(exp)-1;hz=None if silence else spectral_peak(x,r['sampleRate'])
   target=0 if silence else (330 if channel==0 else 550)*rates[channel]
   peak=float(np.max(np.abs(x)));rms=float(np.sqrt(np.mean(x*x)))
   passed=peak<1e-6 if silence else abs(hz-target)<=.3 and rms>=.005
   assert passed,(i,channel,hz,target,peak,rms)
   measurements.append({'channel':channel,'frames':len(x),'sha256':digest(b),'allFinite':True,
    'rms':rms,'peak':peak,'frequencyHz':hz,'expectedHz':target,'frequencyErrorHz':None if silence else hz-target,'passed':True})
  cases.append({'name':case_names[i],'rates':c['rates'],'decks':c['decks'],'measurements':measurements,'passed':True})
 return{'passed':True,'scope':r['scope'],'inspection':'Independent Python full-window hash/finite checks and global20–20000Hz Hann16x FFT peak. No expected-frequency mask or fitted waveform; fixed0.3Hz/.005RMS/1e-6silence criteria. Snapshot windows only, not whole-run continuity.',
  'originalBytes':len(data),'originalSHA256':digest(data),'sampleRate':r['sampleRate'],
  'sourceBefore':r['sourceBefore'],'sourceAfter':r['sourceAfter'],'sourceStable':True,
  'cases':cases,'maxFrequencyErrorHz':max(abs(m['frequencyErrorHz']) for c in cases for m in c['measurements'] if m['frequencyErrorHz'] is not None)}
before=inspect(RAW/'before-original.json',[[1,1.2],[1.079/1.2,1.079],[1.079/1.2,1.079]],['Before: actual +20%, slider incorrectly clamped to +8%','Before: ArrowDown jumps to +7.9%, changing both synced decks','Before: stopped'])
before['bugReproduced']=True;before['passed']=False
(OUT/'gui-tempo-before-results.json').write_text(json.dumps(before,indent=2)+'\n')
after=inspect(RAW/'after-original.json',expected,names)
for name,sha in after['sourceAfter'].items():assert digest((ROOT/'prototype'/name).read_bytes())==sha
after['currentSourceMatches']=True
assert after['cases'][0]['decks'][1]['slider']['value']=='0'
assert after['cases'][0]['decks'][1]['slider']['label']=='±8% · REL'
assert 'Pitch +20.0 percent' in after['cases'][0]['decks'][1]['slider']['ariaValueText']
assert '120.0 BPM' in after['cases'][0]['decks'][1]['slider']['ariaValueText']
assert after['cases'][3]['decks'][1]['state']=='relative'
assert after['cases'][4]['decks'][1]['pitchRange']==16
assert after['cases'][8]['decks'][1]['slider']['value']=='16'
assert all(not d['playing'] for d in after['cases'][-1]['decks'])
(OUT/'gui-tempo-browser-results.json').write_text(json.dumps(after,indent=2)+'\n')
print(json.dumps({'beforeBugReproduced':True,'afterPassed':after['passed'],'cases':len(after['cases']),
 'windows':sum(len(c['measurements'])for c in after['cases']),'maxFrequencyErrorHz':after['maxFrequencyErrorHz'],
 'originalBytes':after['originalBytes'],'originalSHA256':after['originalSHA256'],'sourceStable':True,'currentSourceMatches':True},indent=2))
