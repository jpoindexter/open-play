#!/usr/bin/env python3
"""Inspect real sample/leader audio-clock phase and complete captured packets."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def beat(p):return 2*p if p<1 else 2+(p-1)*2.5 if p<1.8 else 4+(p-1.8)*1.5

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw)
 assert r['diagnosticCheckpoint']==175 and r['workflowCompleted'] and r['sourceStable'] and not r['errors'] and not r['uiErrors'] and r['sourceBefore']==r['sourceAfter']
 for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
 assert r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None
 assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3' and r['originalUnchanged'] and r['inputFileUnchanged']
 assert [s['name'] for s in r['stages']]==['initial-sync','leader-tempo-change','stop']
 observations=[]
 for s in r['stages']:
  stopped=s['name']=='stop';a=s['after'];row={'name':s['name']};phaseErrors=[];tempoErrors=[]
  if not stopped:
   for x in [a]+s['clockSamples']+[s['last']]:
    lead=x['leader'];assert lead['playing'] and lead['sync'] and x['voice']
    phase=(beat(x['position'])-(lead['position']-lead['grid'])*lead['sourceBPM']/60+2)%4-2
    phaseErrors.append(abs(phase)*60/lead['bpm']);tempoErrors.append(abs(x['voice']['syncBPM']-lead['bpm']))
   row.update(leaderBPM=a['leader']['bpm'],sampleBPM=a['voice']['syncBPM'],syncState=a['slot'].get('syncState'),maximumBarPhaseErrorSeconds=max(phaseErrors),maximumNominalTempoError=max(tempoErrors),persistentMember=bool(a['slot'].get('sync')),phaseAccepted=max(phaseErrors)<=.01,tempoAccepted=max(tempoErrors)<=1e-6)
  else:assert not a['voice'] and not a['slot']['playing']
  row['packets']=[]
  for p in s['pcm']:
   data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256'];x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==round((.3 if stopped else 3)*48000) and np.isfinite(x).all() and not p['errors'];cursor=p['startFrame']
   for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
   assert cursor==p['startFrame']+len(x);rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));assert peak<1e-7 if stopped else rms>1e-5
   row['packets'].append(dict(channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak))
  row['accepted']=stopped or row['phaseAccepted'] and row['tempoAccepted'] and row['persistentMember'] and row['syncState']=='beat';observations.append(row)
 passed=bool(r['persistentSyncControlPresent'] and all(s['accepted'] for s in observations))
 return dict(checkpoint=175,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],persistentSyncControlPresent=r['persistentSyncControlPresent'],context=r['context'],observations=observations,scope='actual keyed warped saved-loop initial/following tempo clock and settled audio; transition continuity, Off/lifecycle/fallback/nonloop/multiple-slot acceptance remain separate',fullSamplerSyncAcceptance=False,exactVendorTimingAccepted=False,pitchQualityAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'passed':r['passed'],'observations':r['observations']}));raise SystemExit(0 if r['passed'] else 1)
