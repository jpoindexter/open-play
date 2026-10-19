#!/usr/bin/env python3
"""Grade declared fallback inputs and actual source/end-frame audio independently."""
import argparse,base64,hashlib,json,math
from pathlib import Path
import numpy as np

def pcm(p):
 b=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(b).hexdigest()==p['sha256'];x=np.frombuffer(b,'<f4').astype(float);assert np.isfinite(x).all();return x

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw);assert r['diagnosticCheckpoint']==178 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for n,h in r['sourceBefore'].items():assert hashlib.sha256((sources/n).read_bytes()).hexdigest()==h,n
 info=dict(checkpoint=178,kind=r['phase'],originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],errors=r['errors'],uiErrors=r['uiErrors'],workflowCompleted=r['workflowCompleted'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],fullParityAcceptance=False,failureState=r.get('failureState'))
 assert not r['errors'] and not r['uiErrors'] and r['originalUnchanged'] and r['inputFileUnchanged'] and r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None
 assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3' and r['metadata']['grid']['bpm']==120
 if r['phase']=='bpm-only':assert r['metadata']['grid']['offset'] is None and [x['name'] for x in r['stages']]==['raw-loop','keyed-loop','raw-nonloop','keyed-nonloop']
 else:assert r['metadata']['grid']['offset']==0 and [x['name'] for x in r['stages']]==['raw-loop']
 if r['phase']=='legacy':assert r['metadata']['grid']['legacyMarkers']==[1,1.8] and not r['metadata']['grid']['markers']
 rows=[]
 def grade(s,seconds,follow=False):
  b=s['before'];v=b['voice'];a=s['audio'];settings=v['settings'];assert v['syncTransport'] and abs(v['gain']-.4)<1e-7 and v['trackGain']==1 and a['sampleRate']==48000
  tempoError=abs(v['syncBPM']-b['leader']['bpm']);assert b['slot']['sync'];assert settings['repeat']==(not s.get('name','loop').endswith('nonloop'))
  feedback=b['slot']['syncState']=='tempo' and b['syncFeedback']=='tempo' and b['syncLabel']=='Tempo Sync';state=True
  if not settings['keylock']:
   for c in [0,1]:assert a['channels'][c]['sha256']==r['inputPCM'][c]['sha256']
  repeat=settings['repeat'];duration=r['input']['frames']/48000;when=v['anchorTime'];end=when+(duration-v['anchorPosition'])*120/v['syncBPM'];endframe=math.ceil(end*48000-1e-8);endDelta=None
  if not repeat:
   last=s['last'];events=s['endEventsAfter'];state=len(events)==1 and last['voice'] is None and not last['requestPresent'] and not last['slot']['playing'] and not last['slot']['processing'];endDelta=abs(events[0]['frame']-endframe) if events else None;state=state and endDelta<=1 and last['slot']['endedFrame']==events[0]['frame']
  else:state=s['last']['voice'] is not None and s['last']['slot']['playing'] and not s.get('endEventsAfter',[])
  assert [p['channel'] for p in s['pcm']]==[0,1] and s['pcm'][0]['startFrame']==s['pcm'][1]['startFrame'];packets=[]
  for p in s['pcm']:
   x=pcm(p);assert len(x)==p['frames']==round(seconds*48000) and not p['errors'];cursor=p['startFrame']
   for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and(q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
   assert cursor==p['startFrame']+len(x);t=(p['startFrame']+np.arange(len(x)))/48000;pos=v['anchorPosition']+np.maximum(0,t-when)*v['syncBPM']/120
   if repeat:pos=np.where(pos>=settings['loopEnd'],settings['loopStart']+np.mod(pos-settings['loopStart'],settings['loopEnd']-settings['loopStart']),pos)
   active=(t>=when)&(pos<duration);data=pcm(a['channels'][p['channel']]);spanStart=settings['loopStart'] if repeat else 0;spanEnd=settings['loopEnd'] if repeat else duration
   f=(pos-spanStart)/(spanEnd-spanStart)*len(data) if settings['keylock'] else pos*48000;i=np.floor(f).astype(int);valid=active&(i>=0)&(i<len(data));u=f-i;want=np.zeros(len(x));want[valid]=(data[i[valid]]*(1-u[valid])+data[np.minimum(i[valid]+1,len(data)-1)]*u[valid])*.4*np.clip((t[valid]-when)/.01,0,1)
   ref=float(np.sqrt(np.mean(want**2)));error=float(np.sqrt(np.mean((x-want)**2)));relative=error/ref if ref else float('inf');tailPeak=None
   if not repeat:assert t[0]<end<t[-1]-.3;tailPeak=float(np.max(np.abs(x[(p['startFrame']+np.arange(len(x)))>=endframe+1])))
   packets.append(dict(channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],referenceRMS=ref,relativeRMSError=relative,afterEndPeak=tailPeak,accepted=relative<=1e-4 and (tailPeak is None or tailPeak<1e-7)))
  return dict(name=s.get('name','tempo-follow'),tempoFeedbackAccepted=feedback,nominalTempoError=tempoError,tempoAccepted=tempoError<=1e-6,stateAccepted=bool(state),endFrameDelta=endDelta,commonBPM=v['syncBPM'],packets=packets,accepted=bool(feedback and tempoError<=1e-6 and state and all(p['accepted'] for p in packets)))
 for s in r['stages']:
  rows.append(grade(s,3 if s['repeat'] else 4))
  if s.get('follow'):rows.append(grade(s['follow'],.3,True))
 return dict(info,passed=all(x['accepted'] for x in rows),observations=rows,scope='actual BPM-only/legacy/short-loop feedback and source/rendered output; actual raw/keyed nonloop ending callback/frame/cleanup for tested input only',pitchQualityAccepted=False,fullSamplerSyncAcceptance=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:v for k,v in r.items() if k!='sourceHashes'}));raise SystemExit(0 if r['passed'] else 1)
