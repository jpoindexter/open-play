#!/usr/bin/env python3
"""Actual source-loss boundaries, feedback, owners and whole native PCM."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from inspect_deck_playing_182 import pcm,beat,warped,actual_deck,interp
from inspect_buffer_offset_184 import unity_reference

def inspect(path,sources,calibration):
 calibration_raw=calibration.read_bytes();proof=json.loads(calibration_raw);assert proof["checkpoint"]==184 and proof["passed"] and proof["sampleRate"]==48000
 assert proof["originalSHA256"]=="241574c09d68c023ca0b937f7a0f275da6526a46146507dbcdb5161aae957bf9"
 raw=path.read_bytes();r=json.loads(raw)
 assert r['diagnosticCheckpoint']==183 and r['cohort']=='deck-source-loss'
 assert r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
 info=dict(checkpoint=184,originalDiagnosticCheckpoint=183,referenceCalibrationSHA256=hashlib.sha256(calibration_raw).hexdigest(),referenceCalibrationBrowser=proof["browser"],originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],workflowCompleted=r['workflowCompleted'],errors=r['errors'],uiErrors=r['uiErrors'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],failureState=r.get('failureState'),fullParityAcceptance=False)
 assert not r['errors'] and not r['uiErrors'] and r['inputUnchanged'] and r['decodedUnchanged']
 assert r['context']==dict(sampleRate=48000,requestedSampleRate=None)
 assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
 assert [s['name'] for s in r['stages']]==['preparation-primary-pause','scheduled-primary-pause','scheduled-primary-off','scheduled-own-stop','scheduled-load']
 rows=[]
 for row in r['stages']:
  name=row['name'];preparation=name.startswith('preparation');cancelled=name in ['scheduled-own-stop','scheduled-load'];pause='primary-pause' in name;committed=not preparation and not cancelled
  assert row['before']['deck']['playing'] and row['before']['deck']['keylock'] and not row['before']['deck']['sync'] and row['before']['primary']['playing'] and row['before']['primary']['sync']
  assert row['boundary']['kind']==('actual-warp-render-request' if preparation else 'actual-synchronize-resolved-before-caller')
  state=True;phase=None;tempo=0
  if preparation:assert row.get('scheduled') is None
  else:assert row['scheduled']
  for snap in [row['after'],row['last']]:
   d=snap['deck'];p=snap['primary'];state=state and not d['processing'] and not d['queued']
   if cancelled:state=state and not d['playing'] and d['voiceID'] is None and not d['sync'] and not d['hasWarpTransport']
   elif preparation:state=state and d['playing'] and not d['sync'] and d['voiceID']==row['before']['deck']['voiceID'] and d['gridBPM'] is None and not d['hasWarpTransport']
   else:
    state=state and d['playing'] and d['sync'] and d['state']=='beat' and d['hasWarpTransport'] and d['gridBPM']==126 and d['voiceID']!=row['before']['deck']['voiceID'] and d['role']==('primary' if name=='scheduled-primary-off' else 'secondary')
    tempo=max(tempo,abs(d['rate']*120-126))
   if pause:state=state and not p['playing'] and p['voiceID'] is None and p['sync'] and p['state']=='armed'
   else:state=state and p['playing'] and p['voiceID']==row['before']['primary']['voiceID'] and p['sync']==(name!='scheduled-primary-off')
  if name=='scheduled-load':state=state and row['trackAfter']=='demo-0'
  if committed:
   p=row['before']['primary'];at=row['scheduled']['when'];sourcepos=p['anchorPosition']+max(0,at-p['anchorTime'])*p['effectiveRate'];pb=(sourcepos-p['grid'])*p['bpm']/60
   phase=float(abs((float(beat(row['scheduled']['position']))-pb+2)%4-2)*60/126)
  packets=[]
  for group,frames in [('prePCM',14400),('pcm',24000)]:
   assert sorted((p['label'],p['channel']) for p in row[group])==sorted((l,c) for l in ['primary','deck'] for c in [0,1])
   for label in ['primary','deck']:assert len({p['startFrame'] for p in row[group] if p['label']==label})==1
   for p in row[group]:
    x=pcm(p);assert len(x)==p['frames']==frames;cursor=p['startFrame'];times=[];continuous=not p['errors']
    for i,q in enumerate(p['quanta']):
     assert 0<q['count']<=128 and(q['count']==128 or i==len(p['quanta'])-1);continuous=continuous and q['frame']==cursor;times.append(q['frame']/48000+np.arange(q['count'])/48000);cursor=q['frame']+q['count']
    continuous=continuous and cursor==p['startFrame']+len(x)
    rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));relative=None;silent=group=='pcm' and (p['label']=='primary' and pause or p['label']=='deck' and cancelled)
    accepted=continuous and (peak<=1e-7 if silent else rms>1e-5)
    if group=='pcm' and p['label']=='deck' and not cancelled:
     d=row['after']['deck'];t=np.concatenate(times);data=pcm(row['audio']['channels'][p['channel']])
     if preparation:
      assert row['referenceKind']=='uniform-buffer' and abs(d['effectiveRate']/d['timelineScale']-1)<1e-12;sr=row['audio']['sampleRate'];assert sr==48000
      native=t*sr;start=d['anchorTime']*sr;assert np.max(np.abs(native-np.rint(native)))<1e-7 and abs(start-round(start))<1e-7
      want=unity_reference(data,np.rint(native).astype(int),round(start),d['anchorPosition']/d['timelineScale']*sr,(d['loopIn']/d['timelineScale']*sr,d['loopOut']/d['timelineScale']*sr))
     else:
      assert row['referenceKind']=='warped-render' and row.get('renderEvent');pos=warped(d,t,126,d['loopIn'],d['loopOut']);f=(beat(pos)-beat(d['loopIn']))/(beat(d['loopOut'])-beat(d['loopIn']))*len(data)
     if not preparation:want=interp(data,f)
     relative=float(np.sqrt(np.mean((x-want)**2))/np.sqrt(np.mean(want**2)));accepted=accepted and relative<=1e-4
    packets.append(dict(group=group,label=p['label'],channel=p['channel'],frames=frames,quanta=len(p['quanta']),sha256=p['sha256'],continuous=bool(continuous),captureErrorCount=len(p['errors']),rms=rms,peak=peak,relativeRMSError=relative,expectedSilent=silent,accepted=bool(accepted)))
  rows.append(dict(name=name,stateAccepted=bool(state),scheduledBarPhaseSeconds=phase,maximumNominalBPMError=tempo,packets=packets,accepted=bool(state and(phase is None or phase<=.01)and tempo<=1e-6 and all(p['accepted'] for p in packets))))
 return dict(info,passed=all(s['accepted'] for s in rows),observations=rows,scope='Actual primary Pause before/after scheduling, primary Off, own Stop/load;500ms-settled .5s whole native48k secondary rendered-transport PCM and positive/silent primary audio; exact primary waveform and immediate join/Stop transients ungraded',fullTransitionContinuityAccepted=False,pitchQualityAccepted=False,exactVendorRaceSemanticsAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);p.add_argument('--calibration',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources,a.calibration)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:([dict(name=x['name'],accepted=x['accepted'],state=x['stateAccepted'],phase=x['scheduledBarPhaseSeconds'],post=[dict(label=p['label'],channel=p['channel'],peak=p['peak'],relative=p['relativeRMSError'],accepted=p['accepted'])for p in x['packets'] if p['group']=='pcm'])for x in v]if k=='observations' else v)for k,v in r.items()if k!='sourceHashes'}));raise SystemExit(0 if r['passed'] else 1)
