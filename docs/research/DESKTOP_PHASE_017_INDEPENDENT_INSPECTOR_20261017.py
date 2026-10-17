#!/usr/bin/env python3
"""Independent ASAR parsing and whole-original audio decoding; no product writes."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import hashlib,json,struct,subprocess,math,posixpath
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/research/DESKTOP_PHASE_017_INDEPENDENT_RESULTS_20261017.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
class Asar:
 def __init__(self,path):
  self.path=path;self.f=path.open('rb');a,b,c,d=struct.unpack('<IIII',self.f.read(16));assert a==4 and c+4==b and d<=c-4
  self.header=json.loads(self.f.read(d));self.base=8+b;self.files={}
  def walk(node,prefix=''):
   for name,item in node['files'].items():
    path=prefix+name
    if 'files' in item:walk(item,path+'/')
    else:self.files[path]=item
  walk(self.header)
 def read(self,name):
  x=self.files[name];assert not x.get('unpacked') and 'link' not in x
  off=self.base+int(x['offset']);size=x['size'];assert 0<=off<=off+size<=self.path.stat().st_size
  self.f.seek(off);data=self.f.read(size);assert len(data)==size;return data
 def sha(self,name):return hashlib.sha256(self.read(name)).hexdigest()
def freq(x,sr):
 a=x.astype(float);a-=a.mean();n=1<<(len(a)*16-1).bit_length();power=np.abs(np.fft.rfft(a*np.hanning(len(a)),n));lo=math.ceil(20*n/sr);hi=min(len(power)-2,math.floor(20000*n/sr));k=lo+int(np.argmax(power[lo:hi+1]));v=np.log(np.maximum(power[k-1:k+2],1e-300));delta=.5*(v[0]-v[2])/(v[0]-2*v[1]+v[2]);return float((k+delta)*sr/n)
def audio_stats(x,sr):
 y=x.astype(float);rms=float(np.sqrt(np.mean(y*y)));result={'RMS':rms,'peak':float(np.max(np.abs(y))),'Hz':freq(x,sr) if rms>.001 else None}
 y-=y.mean();ii=np.flatnonzero((y[:-1]<0)&(y[1:]>=0));cross=ii-y[ii]/(y[ii+1]-y[ii]);result['crossingHz']=float((len(cross)-1)*sr/(cross[-1]-cross[0])) if len(cross)>1 else None
 return result
def main():
 assert not OUT.exists(),'Refuse to overwrite an independent result'
 plan=J(ROOT/'docs/prototype/desktop-0.1.7-phase-runtime-plan.json');meta=J(ROOT/'docs/prototype/desktop-0.1.7-phase-package.json');parent=J(ROOT/'docs/prototype/desktop-0.1.7-phase-audio-inspection.json');inspection=J(ROOT/'docs/prototype/desktop-0.1.7-phase-package-inspection-final.json')
 archive=ROOT/inspection['archive'];assert H(archive)==inspection['archiveSHA256']==plan['ASAR_sha256']=='6d79bff7d0c33a827ff3734ba2485293571a90102275e3fbebe3212b4592b025'
 new=Asar(archive);verified=[]
 for e in meta['stagedWrites']:
  if e['file']=='package.json':continue
  assert len(new.read(e['file']))==e['bytes'] and new.sha(e['file'])==e['sha256'];verified.append({'file':e['file'],'sha256':e['sha256']})
 assert len(verified)==83
 pkg=json.loads(new.read('package.json'));assert pkg=={'name':'open-play-keylock-phase-test','productName':'Open Play Keylock Test','version':'0.1.7','description':'Optional isolated phase keylock test; previous app and profile retained','main':'main.cjs'}
 oldPath=ROOT/'local-evidence/desktop-builds/0.1.6/Open Play Test-darwin-arm64/Open Play Test.app/Contents/Resources/app.asar';assert H(oldPath)=='f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e';old=Asar(oldPath)
 baseline=[n for n in old.files if n.startswith('assets/prototype/')];assert len(baseline)==222
 differences=[n for n in baseline if new.sha(n)!=old.sha(n)];assert differences==['assets/prototype/keylock-shadow-live.js']
 engine=new.read('assets/prototype/engine.js').decode();assert new.sha('assets/prototype/engine.js')=='b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf'
 adapter=new.read('assets/prototype/keylock-shadow-live.js').decode();assert "import Stretch from './vendor/open-play-soundtouch/node-factory.mjs'" in adapter
 factory=new.read('assets/prototype/vendor/open-play-soundtouch/node-factory.mjs').decode();worklet=new.read('assets/prototype/vendor/open-play-soundtouch/node-worklet.mjs').decode();pull=new.read('assets/prototype/vendor/open-play-soundtouch/pull-transport.mjs').decode();registry=new.read('assets/prototype/vendor/soundtouch/core/.dist/interpolationStrategyRegistry.js').decode()
 assert "from './phase-control.mjs'" in factory and "new URL('./node-worklet.mjs', import.meta.url)" in factory and "from './phase-render-clock.mjs'" in worklet and "from './node-controller.mjs'" in worklet
 assert "from '../soundtouch/core/.dist/SoundTouch.js'" in pull and "from '../../lanczos/.dist/index.js'" in registry
 for file in ['assets/prototype/vendor/open-play-soundtouch/node-factory.mjs','assets/prototype/vendor/open-play-soundtouch/node-worklet.mjs','assets/prototype/vendor/open-play-soundtouch/node-controller.mjs','assets/prototype/vendor/open-play-soundtouch/pull-transport.mjs','assets/prototype/vendor/open-play-soundtouch/phase-render-clock.mjs','assets/prototype/vendor/open-play-soundtouch/phase-control.mjs','assets/prototype/vendor/soundtouch/core/.dist/SoundTouch.js','assets/prototype/vendor/soundtouch/lanczos/.dist/index.js']:
  assert file in new.files
 host=new.read('main.cjs').decode();assert "'Open Play Keylock Test 0.1.7'" in host and "port:18770" in host and "persist:open-play-keylock-phase-017" in host and 'nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true' in host
 fixture=ROOT/plan['fixture'];assert H(fixture)==plan['fixtureSHA256']=='99833309d13090de63a9fcdb7ca8f6bcf601975bfb8cb2e3ef691bb369a0a119'
 rec=parent['records'][0];original=Path(rec['original']);copy=ROOT/rec['retainedCopy'];assert H(original)==H(copy)==rec['originalSHA256']=='9a4573635e102822bee93065bb469c9112539131bcde0d8290e6372b920d77a9' and original.stat().st_size==rec['bytes']==291217
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(original)]));streams=[s for s in probe['streams'] if s['codec_type']=='audio'];assert len(streams)==1 and streams[0]['channels']==2 and streams[0]['codec_name']=='opus';sr=int(streams[0]['sample_rate']);assert sr==48000
 decoded=subprocess.run(['ffmpeg','-v','error','-i',str(original),'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','pipe:1'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 raw=decoded.stdout;assert len(raw)%8==0;a=np.frombuffer(raw,dtype='<f4').reshape(-1,2);assert np.isfinite(a).all() and len(a)==rec['wholeDecode']['frames']==1393920
 assert hashlib.sha256(raw).hexdigest()==rec['wholeDecode']['sha256']=='e6a9ed0ac2b622600ee9153833f41173f78a2e70b4c2ac308f92c4da17b7a140'
 expected=[330*2**(2/12),550*2**(2/12)];case=plan['audio_cases'][0];assert case['expectedHz']==expected and case['windowSeconds']==[8,10] and case['frequencyErrorHzMax']==1 and case['minimumRMS']==.001
 window=[]
 for c in range(2):
  z=audio_stats(a[8*sr:10*sr,c],sr);z.update(channel=c,expectedHz=expected[c],errorHz=z['Hz']-expected[c],passed=abs(z['Hz']-expected[c])<=1 and z['RMS']>.001);assert abs(z['Hz']-rec['declaredWindow'][c]['Hz'])<1e-7;window.append(z)
 slices=[]
 for start in range(0,len(a),sr):
  end=min(start+sr,len(a));channels=[audio_stats(a[start:end,c],sr) for c in range(2)];entry={'startSample':start,'endExclusive':end,'partial':end-start<sr,'channels':channels};slices.append(entry)
  previous=rec['every1sWindowIncludingFinalPartial'][len(slices)-1];assert previous['startSample']==start and previous['endExclusive']==end
  for c,z in enumerate(channels):
   assert abs(z['RMS']-previous['channels'][c]['RMS'])<1e-12
   if z['Hz'] is not None:assert abs(z['Hz']-previous['channels'][c]['Hz'])<1e-7
 assert len(slices)==len(rec['every1sWindowIncludingFinalPartial'])==30 and all(z['passed'] for z in window) and parent['declaredCriteriaPassed']
 result={'scope':'Independent actual ASAR bytes and whole original native-recording decode. Parent performed native UI. One declared synthetic stereo tone window only; no music/hardware/cursor/fullparity acceptance.','planSHA256':H(ROOT/'docs/prototype/desktop-0.1.7-phase-runtime-plan.json'),'archiveSHA256':H(archive),'archiveFiles':len(new.files),'verifiedStagedHashCount':83,'sanitizedPackageIndependentlyChecked':pkg,'stageHashes':verified,'old016ASARSHA256':H(oldPath),'baselinePrototypeFiles':222,'baselinePrototypeDifferences':differences,'engineSHA256':new.sha('assets/prototype/engine.js'),'adapterSHA256':new.sha('assets/prototype/keylock-shadow-live.js'),'factorySHA256':new.sha('assets/prototype/vendor/open-play-soundtouch/node-factory.mjs'),'isolatedProfilePortPartitionAndSandboxPresentInPackagedHost':True,'permissionCallback144CasesIndependentlyRerun':False,'fixtureSHA256':H(fixture),'originalSHA256':H(original),'copySHA256':H(copy),'wholeOriginalBytes':len(original.read_bytes()),'decodedWhole':{'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'frames':len(a),'seconds':len(a)/sr,'sampleRate':sr,'channels':2,'allFinite':True,'RMS':[float(np.sqrt(np.mean(a[:,c].astype(float)**2))) for c in range(2)],'peak':[float(np.max(np.abs(a[:,c]))) for c in range(2)]},'frequencyMethod':'Global20..20000Hz Hann peak, >=16x power-of-two FFT with log-parabolic interpolation; additional interpolated crossings, never restrict near expected tone.','declaredWindowSeconds':[8,10],'declaredWindow':window,'every1sWindowIncludingFinalPartial':slices,'acceptedDeclaredAudioCase':True,'nativeUIIndependentlyOperated':False,'physicalMusicCursorOrFullParityAccepted':False,'defaultLauncherAndProfilesIndependentlyObserved':False}
 OUT.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
 print(json.dumps({'resultSHA256':H(OUT),'archive':result['archiveSHA256'],'old016':result['old016ASARSHA256'],'stagedHashes':83,'wholeDecode':result['decodedWhole'],'declaredWindow':window,'allWindowsRetained':len(slices)},indent=2))
if __name__=='__main__':main()
