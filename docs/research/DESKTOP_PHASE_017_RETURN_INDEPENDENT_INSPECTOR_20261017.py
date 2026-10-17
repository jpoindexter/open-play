#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,hashlib,subprocess
import numpy as np
sys.path.insert(0,str(Path(__file__).parent))
from DESKTOP_PHASE_017_INDEPENDENT_INSPECTOR_20261017 import ROOT,H,J,audio_stats
OUT=ROOT/'docs/research/DESKTOP_PHASE_017_RETURN_INDEPENDENT_RESULTS_20261017.json'
assert not OUT.exists()
assert H(ROOT/'docs/research/DESKTOP_PHASE_017_INDEPENDENT_INSPECTOR_20261017.py')=='dde7fc0419da8c72c4dd79f932adc8d47a8fb6d8d07e463e9734d375787a91f1'
planPath=ROOT/'docs/prototype/desktop-0.1.7-phase-return-plan.json';plan=J(planPath);reportPath=ROOT/'docs/prototype/desktop-0.1.7-phase-return-audio-inspection.json';parent=J(reportPath);assert parent['plan']==plan
rec=parent['records'][0];p=Path(rec['original']);copy=ROOT/rec['retainedCopy'];assert H(p)==H(copy)==rec['originalSHA256']=='1df72f455f3352b4f5cd7a4a69958ec32f5667c167ef2b952018fce9be032125' and p.stat().st_size==535362
archive=ROOT/'local-evidence/desktop-builds/0.1.7/Open Play Keylock Test-darwin-arm64/Open Play Keylock Test.app/Contents/Resources/app.asar';assert H(archive)==plan['ASAR_sha256']=='6d79bff7d0c33a827ff3734ba2485293571a90102275e3fbebe3212b4592b025'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(p)]));assert len(probe['streams'])==1 and probe['streams'][0]['sample_rate']=='48000' and probe['streams'][0]['channels']==2 and probe['streams'][0]['codec_name']=='opus'
decode=subprocess.run(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','pipe:1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True);raw=decode.stdout;assert len(raw)%8==0;a=np.frombuffer(raw,dtype='<f4').reshape(-1,2);assert np.isfinite(a).all() and len(a)==2367360
assert hashlib.sha256(raw).hexdigest()==rec['wholeDecode']['sha256']=='9757ea110855fb6dac775da5beeb93d73244406938e948b2b682936834ca0066'
case=plan['audio_cases'][0];assert case['windowSeconds']==[8,10] and case['expectedHz']==[330,550] and case['frequencyErrorHzMax']==1 and case['minimumRMS']==.001
window=[]
for c,wanted in enumerate([330,550]):
 z=audio_stats(a[8*48000:10*48000,c],48000);z.update(channel=c,expectedHz=wanted,errorHz=z['Hz']-wanted,passed=z['RMS']>.001 and abs(z['Hz']-wanted)<=1);assert abs(z['Hz']-rec['declaredWindow'][c]['Hz'])<1e-7;window.append(z)
slices=[]
for start in range(0,len(a),48000):
 end=min(start+48000,len(a));z=[audio_stats(a[start:end,c],48000) for c in range(2)];old=rec['every1sWindowIncludingFinalPartial'][len(slices)];assert old['startSample']==start and old['endExclusive']==end
 for c,v in enumerate(z):
  assert abs(v['RMS']-old['channels'][c]['RMS'])<1e-12
  if v['Hz'] is not None:assert abs(v['Hz']-old['channels'][c]['Hz'])<1e-7
 slices.append({'startSample':start,'endExclusive':end,'partial':end-start<48000,'channels':z})
assert len(slices)==len(rec['every1sWindowIncludingFinalPartial'])==50 and all(x['passed'] for x in window) and parent['declaredCriteriaPassed']
result={'scope':'Second separately predeclared native synthetic tone case, whole original decoded independently; native UI operated by parent. Stationary tones cannot establish seek/source cursor.','planSHA256':H(planPath),'parentReportSHA256':H(reportPath),'archiveStillUnchangedSHA256':H(archive),'originalSHA256':H(p),'copySHA256':H(copy),'wholeOriginalBytes':p.stat().st_size,'decodedWhole':{'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'frames':len(a),'seconds':len(a)/48000,'sampleRate':48000,'channels':2,'allFinite':True,'RMS':[float(np.sqrt(np.mean(a[:,c].astype(float)**2))) for c in range(2)],'peak':[float(np.max(np.abs(a[:,c]))) for c in range(2)]},'declaredWindowSeconds':[8,10],'declaredWindow':window,'every1sWindowIncludingFinalPartial':slices,'acceptedDeclaredAudioCase':True,'seek60Point2SecondsOrAudibleCursorIndependentlyEstablished':False,'UIHardwareMusicFullParityAcceptance':False}
OUT.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n');print(json.dumps({'resultSHA256':H(OUT),'wholeDecode':result['decodedWhole'],'declaredWindow':window,'windowsRetained':len(slices)},indent=2))
