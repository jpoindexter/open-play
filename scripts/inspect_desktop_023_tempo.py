"""Inspect actual native23 reports without rewriting historical browser proof."""
import base64,hashlib,json,subprocess
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];RAW=ROOT/'local-evidence/desktop-0.1.23-native';OUT=ROOT/'docs/prototype'
package=json.loads((OUT/'desktop-0.1.23-playback-package.json').read_text());declared={v['file']:v['sha256']for v in package['prototypeFiles']}
def sha(b):return hashlib.sha256(b).hexdigest()
def frequency(x,sr):
 n=1<<int(np.ceil(np.log2(16*len(x))));s=np.abs(np.fft.rfft((x-x.mean())*np.hanning(len(x)),n));s[:int(20*n/sr)]=0;s[int(20000*n/sr):]=0;k=int(s.argmax());v=np.log(np.maximum(s[k-1:k+2],1e-30));d=.5*(v[0]-v[2])/(v[0]-2*v[1]+v[2]);return float((k+d)*sr/n)
simple=[[1,1.2],[1.21/1.2,1.21],[1.21/1.2,.99],[1.21/1.2,.98],[1.21/1.2,1.21],[1.2312/1.2,1.2312],[1.2312/1.2,1.2312],[1.2412/1.2,1.2412],[1.2412/1.2,.97],[1,.97],[1,.97]]
p=1.199/1.2;gui=[[1,1.2],[p,1.199],[p,1.199],[p,1.2],[p,1],[p,1.16],[p,1],[p,1]]
gui_names=['Synced+20% baseline','Real native Down key changes both synced decks by one0.1%step','First GUI OFF retains relative pitch','Range8→16 and real Up key change only REL deck','Real Control+Home resets actual pitch','Second OFF and real End select ordinary absolute+16%','Actual Command-click resets unsynced pitch','Both normal Play controls stop; export captures silence']
def inspect(kind,expected):
 data=(RAW/f'{kind}-original.json').read_bytes();r=json.loads(data);assert len(r['cases'])==len(expected) and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for f,h in r['sourceAfter'].items():assert declared['prototype/'+f]==h
 cases=[]
 for i,(c,rates) in enumerate(zip(r['cases'],expected)):
  assert all(abs(a-b)<1e-8 for a,b in zip(c['rates'],rates));silent=i==len(expected)-1;measurements=[]
  for ch,pcm in enumerate(c['pcm']):
   b=base64.b64decode(pcm['base64'],validate=True);assert sha(b)==pcm['sha256'];x=np.frombuffer(b,'<f4').astype(float);assert len(x)==13230 and np.isfinite(x).all();(RAW/f'{kind}-{i+1:02d}-ch{ch}.f32').write_bytes(b)
   rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));hz=None if silent else frequency(x,r['sampleRate']);target=0 if silent else (330 if ch==0 else 550)*rates[ch];assert (peak<1e-6 if silent else abs(hz-target)<.3 and rms>=.005),(i,ch,hz,target,rms)
   measurements.append({'channel':ch,'frames':len(x),'allFinite':True,'sha256':sha(b),'rms':rms,'peak':peak,'frequencyHz':hz,'expectedHz':target,'frequencyErrorHz':None if silent else hz-target,'passed':True})
  cases.append({'name':c['name']if kind=='simple-controller' else gui_names[i],'rates':c['rates'],'decks':c.get('decks',c.get('sync')),'measurements':measurements,'passed':True})
 result={'passed':True,'scope':'Actual native Electron0.1.23 isolated Checks window, normal UI inputs and Save dialog, production audio graph with generated buffers and physical output muted. Scoped native execution only; full native/reference/physical/music/latency/phase/continuity/composition acceptance remains open.',
  'genericHarnessScopeVerbatim':r['scope'],'nativeExecution':{'version':package['version'],'sourceCommit':package['sourceCommit'],'ASARSHA256':package['asarSHA256'],'menu':'Checks → Simple Sync Controller → Run → Download'if kind=='simple-controller' else 'Checks → GUI Tempo after Sync → Prepare → native controls/Capture → Stop/export → Download','originalExport':'Normal native Save dialog; no DevTools or injected JavaScript'},
  'inspection':'Independent full-window hashes/finite checks and global20–20000Hz Hann16x FFT without expected-frequency mask. Fixed0.3Hz/.005RMS/1e-6silence, rate1e-8. Snapshot windows only; no acoustic or whole-run continuity proof.',
  'originalBytes':len(data),'originalSHA256':sha(data),'sampleRate':r['sampleRate'],'sourceBefore':r['sourceBefore'],'sourceAfter':r['sourceAfter'],'sourceStable':True,'packageSourceMatches':True,'cases':cases,
  'maxFrequencyErrorHz':max(abs(m['frequencyErrorHz'])for c in cases for m in c['measurements']if m['frequencyErrorHz']is not None),'fullNativeAcceptance':False,'fullParityVerified':False,'physicalAcceptance':False}
 if kind=='simple-controller':
  assert r['completed'] and not r['errors'] and all(c['passed']for c in r['cases']);assert abs(r['unknownPositionAfterOFF']['rate']-1.2412/1.2)<1e-8 and r['unknownPositionAfterOFF']['state']=='off';result['unknownPositionAfterOFF']=r['unknownPositionAfterOFF']
  record=base64.b64decode(r['recording']['base64'],validate=True);assert sha(record)==r['recording']['sha256'];path=RAW/'simple-controller-master.webm';path.write_bytes(record);meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(path)]))['streams'][0];sr=int(meta['sample_rate']);channels=int(meta['channels']);assert channels==2
  decoded=RAW/'simple-controller-master.f32';subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-f','f32le',str(decoded)],check=True);b=decoded.read_bytes();x=np.frombuffer(b,'<f4');assert len(x)%2==0 and np.isfinite(x).all() and np.max(np.abs(x))>.005
  result['wholeRecording']={'bytes':len(record),'sha256':sha(record),'format':r['recording']['format'],'browserDecode':{k:r['recording'][k]for k in ['sampleRate','frames','channels','allFinite']},'independentDecode':{'sampleRate':sr,'channels':channels,'frames':len(x)//channels,'allFinite':True,'peak':float(np.max(np.abs(x))),'pcmSHA256':sha(b)}}
 else:
  assert r['cases'][0]['decks'][1]['slider']['value']=='0'and'Pitch +20.0 percent'in r['cases'][0]['decks'][1]['slider']['ariaValueText'];assert r['cases'][2]['decks'][1]['state']=='relative';assert r['cases'][3]['decks'][1]['pitchRange']==16;assert r['cases'][5]['decks'][1]['state']=='off';assert all(not d['playing']for d in r['cases'][-1]['decks'])
  result['wholeRecording']=None;result['nativeLimits']='Eight native keyboard/pointer states; browser11-state GUI handoff cohort not relabeled. Initial native cohort separately retained: baseline/Down/AXIncrement(+1.0%, coarser than arrow)/stop. Source expired before later manual cases; those were not accepted from that cohort. Final bounded8-state session completes within source duration.'
 return result
for kind,rates in [('simple-controller',simple),('gui',gui)]:
 r=inspect(kind,rates);(OUT/f'desktop-0.1.23-{kind}-native-results.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:r[k]for k in ['nativeExecution','originalBytes','originalSHA256','maxFrequencyErrorHz','wholeRecording']},indent=2))
