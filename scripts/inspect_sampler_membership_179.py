#!/usr/bin/env python3
"""Whole individual/summed Sampler PCM plus actual group clocks and ownership."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def pcm(p):
 b=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(b).hexdigest()==p['sha256'];x=np.frombuffer(b,'<f4').astype(float);assert np.isfinite(x).all();return x

def position_at(sample,at):
 v=sample['voice'];p=v['anchorPosition']+max(0,at-v['anchorTime'])*v['syncBPM']/120;lo=v['settings']['loopStart'];hi=v['settings']['loopEnd'];return lo+(p-lo)%(hi-lo) if p>=hi else p

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw);assert r['diagnosticCheckpoint']==179 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for n,h in r['sourceBefore'].items():assert hashlib.sha256((sources/n).read_bytes()).hexdigest()==h,n
 info=dict(checkpoint=179,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],errors=r['errors'],uiErrors=r['uiErrors'],workflowCompleted=r['workflowCompleted'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],failureState=r.get('failureState'),fullParityAcceptance=False)
 assert not r['errors'] and not r['uiErrors'] and r['originalUnchanged'] and r['inputFileUnchanged'] and r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3' and r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None
 names=['sample-led-pair','sample-led-deck-join','shared-sample-pitch','stop-first-retains-second','departing-bank-stops-pair','tempo-indicator'];assert [s['name'] for s in r['stages']]==names
 data=[pcm(x) for x in r['inputPCM']];rows=[];shared=r['stages'][2]['before'];beforeJoin=r['stages'][1]['before']
 for stage in r['stages']:
  name=stage['name'];b=stage['before'];target=120 if name in names[:2] else 126;activeKeys=[0,1] if name in names[:3] else [1] if name in ['stop-first-retains-second','tempo-indicator'] else [];state=True;phaseErrors=[];tempoErrors=[]
  for snap in [b]+stage['clocks']+[stage['last']]:
   for key,s in enumerate(snap['samples']):
    if key in activeKeys:
     state=state and s['voice'] is not None and s['slot']['playing'] and s['slot']['sync'] and not s['slot']['processing'];tempoErrors.append(abs(s['voice']['syncBPM']-target))
     if name!='tempo-indicator' and 0 in activeKeys and key==1:
      phaseErrors.append(abs((2*position_at(s,snap['at'])-2*position_at(snap['samples'][0],snap['at'])+2)%4-2)*60/target)
    else:state=state and s['voice'] is None and not s['requestPresent'] and not s['slot']['playing'] and not s['slot']['processing']
   if name!='sample-led-pair':
    d=snap['deck'];state=state and d['playing'] and d['sync'] and not d['processing'];tempoErrors.append(abs(d['bpm']-target))
    if name not in ['departing-bank-stops-pair','tempo-indicator']:
     p=position_at(snap['samples'][activeKeys[0]],snap['at']);deckPosition=d['anchorPosition']+max(0,snap['at']-d['anchorTime'])*d['sourceRate'];phaseErrors.append(abs((2*p-(deckPosition-d['grid'])*d['sourceBPM']/60+2)%4-2)*60/target)
   else:state=state and not snap['deck']['playing']
  if name=='sample-led-deck-join':state=state and [x['voiceID'] for x in b['samples']]==r['pairOwners'] and abs(r['deckArmed']['deck']['bpm']-120)<=1e-6
  if name=='stop-first-retains-second':state=state and b['samples'][1]['voiceID']==shared['samples'][1]['voiceID']
  if name=='departing-bank-stops-pair':state=state and b['bank']==1 and b['deck']['voiceID']==shared['deck']['voiceID']
  visual=True
  if name=='tempo-indicator':
   s=b['samples'][1];v=s['indicator'];visual=s['feedback']=='Tempo Sync' and s['voice']['mode']=='tempo' and v['content'] not in ['none','normal'] and v['background']=='rgb(245, 202, 71)' and v['width']=='36px' and v['height']=='5px'
  expectedFrames=14400 if name in ['departing-bank-stops-pair','tempo-indicator'] else 144000
  assert sorted((p['label'],p['channel']) for p in stage['pcm'])==sorted((label,c) for label in ['bus','sample0','sample1','deck'] for c in [0,1])
  for label in ['bus','sample0','sample1','deck']:assert len({p['startFrame'] for p in stage['pcm'] if p['label']==label})==1
  packets=[]
  for p in stage['pcm']:
   x=pcm(p);assert len(x)==p['frames']==expectedFrames and not p['errors'];cursor=p['startFrame']
   for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and(q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
   assert cursor==p['startFrame']+len(x);t=(p['startFrame']+np.arange(len(x)))/48000
   wants=[]
   for key in activeKeys:
    v=b['samples'][key]['voice'];settings=v['settings'];assert abs(v['gain']-.4)<1e-7 and v['trackGain']==1 and settings['repeat'] and not settings['keylock'];assert b['samples'][key]['voiceID']==stage['last']['samples'][key]['voiceID']
    pos=v['anchorPosition']+np.maximum(0,t-v['anchorTime'])*v['syncBPM']/120;lo=settings['loopStart'];hi=settings['loopEnd'];pos=np.where(pos>=hi,lo+np.mod(pos-lo,hi-lo),pos);f=pos*48000;i=np.floor(f).astype(int);assert np.all(i>=0)&np.all(i<len(data[p['channel']]));u=f-i;want=(data[p['channel']][i]*(1-u)+data[p['channel']][np.minimum(i+1,len(data[p['channel']])-1)]*u)*.4*np.clip((t-v['anchorTime'])/.01,0,1);wants.append((key,want))
   rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));relative=None
   if p['label']=='deck':accepted=rms>1e-5 if name!='sample-led-pair' else peak<1e-7
   else:
    want=sum((a for key,a in wants if p['label']=='bus' or p['label']=='sample'+str(key)),np.zeros(len(x)));ref=float(np.sqrt(np.mean(want**2)));relative=float(np.sqrt(np.mean((x-want)**2))/ref) if ref else None;accepted=relative<=1e-4 if relative is not None else peak<1e-7
   packets.append(dict(label=p['label'],channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak,relativeRMSError=relative,accepted=bool(accepted)))
  phase=max(phaseErrors,default=0);tempo=max(tempoErrors,default=0);rows.append(dict(name=name,stateAccepted=bool(state),maximumSourceClockPhaseSeconds=phase,maximumNominalBPMError=tempo,phaseAccepted=phase<=.01,tempoAccepted=tempo<=1e-6,indicatorAccepted=visual,packets=packets,accepted=bool(state and phase<=.01 and tempo<=1e-6 and visual and all(p['accepted'] for p in packets))))
 return dict(info,passed=all(s['accepted'] for s in rows),observations=rows,scope='whole known-source individual/summed sample PCM and actual group source clocks paired with nonzero deck PCM; deck PCM identity/perceptual quality/complete modes/races separate',exactDeckPCMMatchAccepted=False,pitchQualityAccepted=False,fullSamplerSyncAcceptance=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:([dict(name=x['name'],accepted=x['accepted'],state=x['stateAccepted'],phase=x['maximumSourceClockPhaseSeconds'],tempo=x['maximumNominalBPMError'],indicator=x['indicatorAccepted'],packetFailures=[p['label']+str(p['channel']) for p in x['packets'] if not p['accepted']]) for x in v] if k=='observations' else v) for k,v in r.items() if k!='sourceHashes'}));raise SystemExit(0 if r['passed'] else 1)
