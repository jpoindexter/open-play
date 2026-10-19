#!/usr/bin/env python3
"""Inspect actual bank/Off/owner lifecycle with whole native-rate audio."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw)
 assert r['diagnosticCheckpoint']==176 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
 info=dict(checkpoint=176,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],context=r['context'],errors=r['errors'],uiErrors=r['uiErrors'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],workflowCompleted=False,failureState=r['failureState'],fullParityAcceptance=False)
 assert not r['errors'] and not r['uiErrors'] and r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None
 assert r['originalUnchanged'] and r['inputFileUnchanged'] and r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
 names=['same-bank-retains-audio','different-bank-stops-audio','live-sync-off-keeps-audio','off-does-not-follow-tempo','setup-off-keeps-audio-and-controls','older-pointer-release-retains-sync','older-keyboard-release-retains-sync','bank-switch-cancels-preparation','cancel-sync-keeps-ordinary-request','ordinary-gain-still-controls-after-cancel']
 assert [s['name'] for s in r['stages']]==names
 observations=[]
 for s in r['stages']:
  a=s['after'];b=s.get('before');name=s['name'];state=True
  if name=='same-bank-retains-audio':state=a['bank']==0 and a['voiceID']==b['voiceID'] and a['slot']['playing']
  elif name in ['different-bank-stops-audio','bank-switch-cancels-preparation']:
   state=a['bank']==1 and a['voice'] is None and not a['requestPresent'] and not a['slot']['playing'] and not a['slot']['processing']
   if name=='different-bank-stops-audio':
    for k in ['track','mode','from','repeat','keylock','volume','pitch','sync']:state=state and a['slot'].get(k)==b['slot'].get(k)
  elif name=='live-sync-off-keeps-audio':state=not a['slot']['sync'] and a['voiceID']==b['voiceID'] and a['modeEnabled'] and a['slot']['playing']
  elif name=='off-does-not-follow-tempo':state=not a['slot']['sync'] and a['voiceID']==b['voiceID'] and abs(a['voice']['syncBPM']-b['voice']['syncBPM'])<1e-8 and abs(a['leader']['bpm']-a['voice']['syncBPM'])>.01
  elif name=='setup-off-keeps-audio-and-controls':state=not a['slot']['sync'] and a['voiceID']==b['voiceID'] and a['modeEnabled'] and not a['syncEnabled']
  elif name.startswith('older-'):state=a['voiceID']==b['voiceID'] and a['voice'] is not None and a['voice']['syncTransport'] and a['slot']['sync'] and a['slot']['playing']
  elif name=='cancel-sync-keeps-ordinary-request':state=a['voiceID']==b['voiceID'] and a['voice'] is not None and not a['voice']['syncTransport'] and a['requestPresent'] and a['requestMatchesVoice'] and not a['slot']['sync'] and a['slot']['playing']
  elif name=='ordinary-gain-still-controls-after-cancel':state=a['slot']['volume']==0 and a['voice'] is not None and a['requestPresent'] and a['slot']['playing']
  packets=[]
  for p in s['pcm']:
   data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256'];x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==14400 and np.isfinite(x).all() and not p['errors'];cursor=p['startFrame']
   for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
   assert cursor==p['startFrame']+len(x);rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));accepted=peak<1e-7 if s['expected']=='stopped' else rms>1e-5
   packets.append(dict(channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak,accepted=accepted))
  observations.append(dict(name=name,expected=s['expected'],stateAccepted=bool(state),before=b,after=a,packets=packets,accepted=bool(state and all(p['accepted'] for p in packets))))
 assert len(r['renderActions'])==2 and all(not e['signalAborted'] and e['actionAt']>=e['at'] for e in r['renderActions'])
 for e in r['renderActions']:
  for key in e['cacheKeys']:
   try:k=json.loads(key)
   except (ValueError,TypeError):continue
   assert not(isinstance(k,list) and k[0]=='warp-loop' and abs(k[6]-e['bpm'])<1e-8),'Expected a genuinely uncached render request'
 return dict(info,passed=all(s['accepted'] for s in observations),workflowCompleted=True,observations=observations,renderActions=r['renderActions'],fullSamplerSyncAcceptance=False,transitionContinuityAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'passed':r['passed'],'errors':r['errors'],'observations':[dict(name=s['name'],accepted=s['accepted'],stateAccepted=s['stateAccepted'],rms=[p['rms'] for p in s['packets']]) for s in r['observations']]}));raise SystemExit(0 if r['passed'] else 1)
