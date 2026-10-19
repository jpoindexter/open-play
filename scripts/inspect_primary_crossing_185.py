#!/usr/bin/env python3
"""Actual warped primary, unity keyed secondary and independent musical phase."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from inspect_deck_playing_182 import pcm,beat,warped,interp
from inspect_native_buffer_185 import native_buffer_reference

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw)
 assert r['diagnosticCheckpoint']==185 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
 info=dict(checkpoint=185,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],workflowCompleted=r['workflowCompleted'],errors=r['errors'],uiErrors=r['uiErrors'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],failureState=r.get('failureState'),fullParityAcceptance=False)
 assert not r['errors'] and not r['uiErrors'] and r['inputUnchanged'] and r['decodedUnchanged']
 assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
 assert r['context']==dict(sampleRate=48000,requestedSampleRate=None)
 assert [x['name']for x in r['stages']]==['no-crossing-control','crossing150-to90']
 original=[pcm(x)for x in r['inputPCM']['channels']];rendered=[pcm(x)for x in r['secondaryPCM']['channels']];rows=[]
 for row in r['stages']:
  before=row['before'];assert before['deck']['playing'] and not before['deck']['sync'] and before['deck']['keylock'] and before['primary']['playing'] and before['primary']['hasWarpTransport']
  assert row['futureProbe'];cross=row['name']=='crossing150-to90';rate_delta=abs(row['futureProbe']['primaryLocalRate']-before['primary']['effectiveRate'])
  interval=1.78<=before['primary']['position']<1.8 if cross else 2.1<=before['primary']['position']<2.2
  probe=interval and (rate_delta>.1 if cross else rate_delta<1e-7) and abs(row['futureProbe']['primaryNominalBPM']-126)<1e-6
  state=True;phases=[];tempo=0
  for snap in [row['after']]+row['clocks']+[row['last']]:
   d=snap['deck'];p=snap['primary'];state=state and d['playing'] and d['sync'] and d['state']=='beat' and d['role']=='secondary' and not d['processing'] and not d['queued'] and d['voiceID']!=before['deck']['voiceID'] and p['playing'] and p['sync'] and p['voiceID']==r['sourceOwner'] and p['gridBPM']==126
   tempo=max(tempo,abs(d['bpm']*d['rate']-126),abs(p['bpm']*p['rate']-126))
   t=np.array([snap['at']]);pp=warped(p,t,p['gridBPM'],p['loopIn'],p['loopOut']);dp=d['anchorPosition']+np.maximum(0,t-d['anchorTime'])*d['effectiveRate'];dp=np.where(dp>=d['loopOut'],d['loopIn']+np.mod(dp-d['loopIn'],d['loopOut']-d['loopIn']),dp);phases.append(float(abs(((dp[0]-d['grid'])*d['bpm']/60-beat(pp)[0]+2)%4-2)*60/126))
  assert row['referenceHashes']==[x['sha256']for x in r['secondaryPCM']['channels']]
  packets=[]
  for group,frames in [('prePCM',14400),('pcm',144000)]:
   assert sorted((p['label'],p['channel'])for p in row[group])==sorted((l,c)for l in ['primary','deck']for c in [0,1])
   for label in ['primary','deck']:assert len({p['startFrame']for p in row[group]if p['label']==label})==1
   for packet in row[group]:
    x=pcm(packet);assert len(x)==packet['frames']==frames;cursor=packet['startFrame'];native=[];continuous=not packet['errors']
    for i,q in enumerate(packet['quanta']):
     assert 0<q['count']<=128 and(q['count']==128 or i==len(packet['quanta'])-1);continuous=continuous and q['frame']==cursor;native.extend(range(q['frame'],q['frame']+q['count']));cursor=q['frame']+q['count']
    continuous=continuous and cursor==packet['startFrame']+len(x);native=np.array(native);rms=float(np.sqrt(np.mean(x*x)));relative=None
    if group=='pcm':
     t=np.concatenate([q['frame']/48000+np.arange(q['count'])/48000 for q in packet['quanta']]);c=packet['channel']
     if packet['label']=='primary':
      p=row['after']['primary'];pos=warped(p,t,126,p['loopIn'],p['loopOut']);want=interp(original[c],pos*48000)
     else:
      d=row['after']['deck'];assert abs(d['effectiveRate']/d['timelineScale']-1)<1e-12;start=d['anchorTime']*48000;assert abs(start-round(start))<1e-7
      want=native_buffer_reference(rendered[c],native,round(start),d['anchorPosition']/d['timelineScale'],r['secondaryPCM']['sampleRate'],48000,(d['loopIn']/d['timelineScale'],d['loopOut']/d['timelineScale']))
     relative=float(np.sqrt(np.mean((x-want)**2))/np.sqrt(np.mean(want*want)))
    accepted=continuous and rms>1e-5 and(group=='prePCM' or relative<=1e-4)
    packets.append(dict(group=group,label=packet['label'],channel=packet['channel'],frames=frames,quanta=len(packet['quanta']),sha256=packet['sha256'],continuous=bool(continuous),captureErrorCount=len(packet['errors']),rms=rms,relativeRMSError=relative,accepted=bool(accepted)))
  phase=max(phases);rows.append(dict(name=row['name'],probeAccepted=bool(probe),primaryLocalRateDelta=rate_delta,futureProbe=row['futureProbe'],syncRejected=row.get('syncRejected'),stateAccepted=bool(state),maximumMusicalPhaseSeconds=phase,maximumNominalBPMError=tempo,packets=packets,accepted=bool(probe and state and phase<=.01 and tempo<=1e-6 and all(x['accepted']for x in packets))))
 return dict(info,passed=all(x['accepted']for x in rows),observations=rows,scope='Real keyed flat secondary joins warped primary at stable nominal126BPM, stable-source and local-marker-crossing cases; whole known original/real rendered-buffer transport PCM, not pitch/perceptual/vendor/native/hardware/full parity',fullTransitionContinuityAccepted=False,pitchQualityAccepted=False,exactVendorRaceSemanticsAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x')as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:([dict(name=x['name'],accepted=x['accepted'],probe=x['probeAccepted'],state=x['stateAccepted'],phase=x['maximumMusicalPhaseSeconds'],localRateDelta=x['primaryLocalRateDelta'],rejected=x['syncRejected'],post=[dict(label=p['label'],channel=p['channel'],relative=p['relativeRMSError'],accepted=p['accepted'])for p in x['packets']if p['group']=='pcm'])for x in v]if k=='observations' else v)for k,v in r.items()if k!='sourceHashes'}));raise SystemExit(0 if r['passed']else 1)
