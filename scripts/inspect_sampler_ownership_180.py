#!/usr/bin/env python3
"""Actual Stop/load authority and post-schedule feedback with native audio."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw);assert r['diagnosticCheckpoint']==180 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for n,h in r['sourceBefore'].items():assert hashlib.sha256((sources/n).read_bytes()).hexdigest()==h,n
 info=dict(checkpoint=180,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],workflowCompleted=r['workflowCompleted'],errors=r['errors'],uiErrors=r['uiErrors'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],failureState=r.get('failureState'),fullParityAcceptance=False)
 assert not r['errors'] and not r['uiErrors'] and r['inputFileUnchanged'] and r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3' and r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None
 names=['preparation-own-stop','preparation-load','scheduled-own-stop','scheduled-source-stop'];assert [s['name'] for s in r['stages']]==names;rows=[]
 for s in r['stages']:
  name=s['name'];committed=name=='scheduled-source-stop';expectedTrack='demo-0' if name=='preparation-load' else 'local-'+r['inputFile']['sha256'];state=True;source=True;event=s['events'];assert len(event)==1 and s['before']['deck']['keylock'] and not s['before']['deck']['playing']
  assert event[0]['boundary']==('actual-keylock-creation' if name.startswith('preparation') else 'actual-synchronize-resolved')
  if name.startswith('preparation'):assert not event[0]['signalAborted'] and s['actionBefore']['deck']['processing']
  else:assert s['actionBefore']['deck']['playing'] and s['actionBefore']['deck']['queued'] and event[0]['at']<=event[0]['result']['when']
  for snap in [s['after'],s['last']]:
   d=snap['deck'];state=state and d['track']==expectedTrack and not d['processing'] and not d['queued'] and not d['hasTransform']
   if committed:state=state and d['playing'] and d['voiceID'] is not None and d['sync'] and d['state'] in ['beat','tempo'] and d['voiceID']==s['actionBefore']['deck']['voiceID']
   else:state=state and not d['playing'] and d['voiceID'] is None
   a,b=snap['samples'];source=source and b['voiceID']==r['bystanderOwner'] and b['slot']['playing'] and not b['slot']['processing'] and not b['slot']['sync'] and b['request']
   if committed:source=source and a['voiceID'] is None and not a['request'] and not a['slot']['playing'] and not a['slot']['processing']
   else:source=source and a['voiceID']==s['before']['samples'][0]['voiceID'] and a['slot']['playing'] and a['slot']['sync'] and not a['slot']['processing']
  assert sorted((p['label'],p['channel']) for p in s['pcm'])==sorted((label,c) for label in ['bus','sample0','sample1','deck'] for c in [0,1]);packets=[]
  for label in ['bus','sample0','sample1','deck']:assert len({p['startFrame'] for p in s['pcm'] if p['label']==label})==1
  for p in s['pcm']:
   data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256'];x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==(72000 if committed else 14400) and np.isfinite(x).all() and not p['errors'];cursor=p['startFrame']
   for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and(q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
   assert cursor==p['startFrame']+len(x);rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));active=p['label'] in ['bus','sample1'] or (p['label']=='deck' and committed) or (p['label']=='sample0' and not committed);accepted=rms>1e-5 if active else peak<1e-7
   packets.append(dict(label=p['label'],channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak,expected='active' if active else 'silent',accepted=bool(accepted)))
  rows.append(dict(name=name,deckStateAccepted=bool(state),sourceAndBystanderAccepted=bool(source),actionAt=s['actionBefore']['at'],scheduledWhen=event[0].get('result',{}).get('when'),after=s['after'],packets=packets,accepted=bool(state and source and all(p['accepted'] for p in packets))))
 return dict(info,passed=all(s['accepted'] for s in rows),observations=rows,scope='actual own Stop/load cancellation and source loss after logical scheduling commit; active/silent audio and owner/feedback, exact vendor race semantics/PCM/quality unverified',exactVendorRaceSemanticsAccepted=False,pitchQualityAccepted=False,fullSamplerSyncAcceptance=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:([dict(name=x['name'],accepted=x['accepted'],deck=x['deckStateAccepted'],other=x['sourceAndBystanderAccepted'],packetFailures=[p['label']+str(p['channel']) for p in x['packets'] if not p['accepted']]) for x in v] if k=='observations' else v) for k,v in r.items() if k!='sourceHashes'}));raise SystemExit(0 if r['passed'] else 1)
