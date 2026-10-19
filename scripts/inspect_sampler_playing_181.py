#!/usr/bin/env python3
"""Actual warped musical clocks and whole native source/rendered PCM."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def pcm(p):
 b=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(b).hexdigest()==p['sha256'];x=np.frombuffer(b,'<f4').astype(float);assert np.isfinite(x).all();return x

def beat(p):return np.where(p<1,2*p,np.where(p<1.8,2+(p-1)*2.5,4+(p-1.8)*1.5))
def source(b):return np.where(b<2,b/2,np.where(b<4,1+(b-2)/2.5,1.8+(b-4)/1.5))
def warped(v,t,bpm,lo,hi):
 b=beat(v['anchorPosition'])+np.maximum(0,t-v['anchorTime'])*bpm/60;first=beat(lo);last=beat(hi);b=np.where(b>=last,first+np.mod(np.mod(b-first,last-first)+(last-first),last-first),b);return source(b)
def actual_deck(d,t):
 if d['gridBPM'] is not None:return warped(d,t,d['gridBPM'],d['loopIn'],d['loopOut'])
 p=d['anchorPosition']+np.maximum(0,t-d['anchorTime'])*d['effectiveRate'];lo=d['loopIn'];hi=d['loopOut'];return np.where(p>=hi,lo+np.mod(p-lo,hi-lo),p)
def interp(data,f):
 i=np.floor(f).astype(int);assert np.all(i>=0)&np.all(i<len(data));u=f-i;return data[i]*(1-u)+data[np.minimum(i+1,len(data)-1)]*u

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw);assert r['diagnosticCheckpoint']==181 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for n,h in r['sourceBefore'].items():assert hashlib.sha256((sources/n).read_bytes()).hexdigest()==h,n
 info=dict(checkpoint=181,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],workflowCompleted=r['workflowCompleted'],errors=r['errors'],uiErrors=r['uiErrors'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],failureState=r.get('failureState'),fullParityAcceptance=False)
 assert not r['errors'] and not r['uiErrors'] and r['inputUnchanged'] and r['decodedUnchanged'] and r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3' and r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None
 assert [s['name'] for s in r['stages']]==['raw-beat-join','keyed-beat-join','keyed-tempo-source-join'];original=[pcm(x) for x in r['inputPCM']['channels']];rows=[]
 for row in r['stages']:
  b=row['after'];deck=b['deck'];sample=b['sample'];assert row['before']['deck']['playing'] and not row['before']['deck']['sync'] and row['before']['sample']['playing'];assert deck['keylock']==row['keyed'];assert row['before']['deck']['voiceID']!=deck['voiceID'];assert row['scheduled'];tempo=0;phases=[];state=True
  for snap in [b]+row['clocks']+[row['last']]:
   d=snap['deck'];s=snap['sample'];state=state and d['playing'] and d['sync'] and not d['processing'] and not d['queued'] and d['state']==('tempo' if row['short'] else 'beat') and s['playing'] and s['voiceID']==sample['voiceID'];tempo=max(tempo,abs(d['rate']*120-120),abs(s['bpm']-120))
   if not row['short']:
    at=np.array([snap['at']]);sp=warped(s,at,s['bpm'],s['settings']['loopStart'],s['settings']['loopEnd']);dp=actual_deck(d,at);phases.append(float(abs((beat(dp)[0]-beat(sp)[0]+2)%4-2)*60/120))
  if not row['short']:state=state and sample['voiceID']==r['sourceOwner']
  else:state=state and sample['mode']=='tempo'
  preserve=abs(row['scheduled']['position']-row['scheduled']['priorAtCommit']) if row['short'] else None
  pre=[];packets=[]
  for group,expectedFrames in [('prePCM',14400),('pcm',144000)]:
   assert sorted((p['label'],p['channel']) for p in row[group])==sorted((label,c) for label in ['sample','deck'] for c in [0,1])
   for label in ['sample','deck']:assert len({p['startFrame'] for p in row[group] if p['label']==label})==1
   for p in row[group]:
    x=pcm(p);assert len(x)==p['frames']==expectedFrames and not p['errors'];cursor=p['startFrame'];times=[]
    for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and(q['count']==128 or i==len(p['quanta'])-1);times.append(q['frame']/48000+np.arange(q['count'])/48000);cursor+=q['count']
    assert cursor==p['startFrame']+len(x);rms=float(np.sqrt(np.mean(x*x)));relative=None;evidence=True
    if group=='pcm':
     t=np.concatenate(times);c=p['channel']
     if p['label']=='sample':pos=warped(sample,t,sample['bpm'],sample['settings']['loopStart'],sample['settings']['loopEnd']);want=interp(original[c],pos*48000)*.4
     else:
      pos=warped(deck,t,120,1,47/15)
      if row['keyed']:
       evidence=row['referenceKind']=='warped-render' and row.get('renderEvent') is not None
       want=interp(pcm(row['audio']['channels'][c]),(beat(pos)-2)/4*row['audio']['frames']) if evidence else None
      else:want=interp(original[c],pos*48000)
     if want is not None:relative=float(np.sqrt(np.mean((x-want)**2))/np.sqrt(np.mean(want**2)))
    accepted=rms>1e-5 and (group=='prePCM' or evidence and relative is not None and relative<=1e-4)
    out=dict(label=p['label'],channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],rms=rms,relativeRMSError=relative,waveformEvidenceAvailable=evidence,accepted=bool(accepted));(pre if group=='prePCM' else packets).append(out)
  phase=max(phases,default=0);rows.append(dict(name=row['name'],stateAccepted=bool(state),maximumMusicalClockPhaseSeconds=phase,maximumNominalBPMError=tempo,tempoPositionPreservationSeconds=preserve,phaseAccepted=phase<=.01,hasWarpTransport=deck['hasWarpTransport'],gridBPM=deck['gridBPM'],referenceKind=row['referenceKind'],preAudio=pre,packets=packets,accepted=bool(state and phase<=.01 and tempo<=1e-6 and (preserve is None or preserve<1e-8) and all(x['accepted'] for x in pre+packets))))
 return dict(info,passed=all(s['accepted'] for s in rows),observations=rows,scope='already-playing raw/keyed warped-loop join and short-loop Tempo source; whole known original/rendered transport PCM and musical clocks, not pitch/perceptual/vendor/native/hardware parity',fullTransitionContinuityAccepted=False,pitchQualityAccepted=False,exactVendorRaceSemanticsAccepted=False,fullSamplerSyncAcceptance=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:([dict(name=x['name'],accepted=x['accepted'],phase=x['maximumMusicalClockPhaseSeconds'],grid=x['gridBPM'],reference=x['referenceKind'],preserve=x['tempoPositionPreservationSeconds'],post=[dict(label=p['label'],channel=p['channel'],relative=p['relativeRMSError'],accepted=p['accepted']) for p in x['packets']]) for x in v] if k=='observations' else v) for k,v in r.items() if k!='sourceHashes'}));raise SystemExit(0 if r['passed'] else 1)
