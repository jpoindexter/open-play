#!/usr/bin/env python3
"""Whole actual mixed raw/keyed Sampler group, independent clocks and PCM."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from inspect_deck_playing_182 import pcm,beat,warped,interp

def deck_position(d,t):return warped(d,t,d['gridBPM'],d['loopIn'],d['loopOut'])
def sample_position(s,t):
 v=s['voice'];return warped(v,t,v['syncBPM'],v['settings']['loopStart'],v['settings']['loopEnd'])
def deck_output(d,t,original,c):return interp(original[c],deck_position(d,t)*48000)
def sample_output(s,t,original,keyed,c):
 v=s['voice'];p=sample_position(s,t);settings=v['settings']
 if settings['keylock']:
  data=pcm(keyed['channels'][c]);f=(beat(p)-beat(settings['loopStart']))/(beat(settings['loopEnd'])-beat(settings['loopStart']))*len(data)
 else:data=original[c];f=p*48000
 return interp(data,f)*v['gain']*v['trackGain']

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw)
 assert r['diagnosticCheckpoint']==186 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
 info=dict(checkpoint=186,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],workflowCompleted=r['workflowCompleted'],errors=r['errors'],uiErrors=r['uiErrors'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],failureState=r.get('failureState'),fullParityAcceptance=False)
 assert not r['errors']and not r['uiErrors']and r['originalUnchanged']and r['inputFileUnchanged']
 assert r['context']==dict(sampleRate=48000,requestedSampleRate=None)
 assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
 assert [s['name']for s in r['stages']]==['mixed-members','shared-tempo-transition','after-shared-tempo']
 original=[pcm(x)for x in r['inputPCM']];assert len(original[0])==len(original[1])==326400
 for a in [r['keyedBeforeAudio'],r['keyedAfterAudio']]:assert a['sampleRate']==48000 and len(a['channels'])==2
 rows=[]
 for row in r['stages']:
  transition=row['name']=='shared-tempo-transition';old=row['before'];new=row['last'];target=126 if row['name']=='mixed-members'else 127.2
  state=True;phase=0;readback=0;tempo=0
  settled=[new]if transition else [old]+row['clocks']+[new]
  for snap in settled:
   d=snap['deck'];state=state and d['playing']and d['sync']and not d['processing']and d['role']=='primary'and d['hasWarpTransport']
   tempo=max(tempo,abs(d['bpm']-target),abs(d['gridBPM']-target))
   for k,s in enumerate(snap['samples']):
    v=s['voice'];state=state and s['slot']['playing']and s['slot']['sync']and not s['slot']['processing']and v is not None and v['mode']=='beat'and bool(v['settings']['keylock'])==(k==1)
    tempo=max(tempo,abs(v['syncBPM']-target));assert abs(v['gain']-.4)<1e-7 and v['trackGain']==1
  when=new['deck']['anchorTime']if transition else None;continuities=[];commit_spread=None
  if transition:
   epochs=[new['deck']['anchorTime']]+[s['voice']['anchorTime']for s in new['samples']];commit_spread=max(epochs)-min(epochs)
   continuities.append(float(abs(deck_position(old['deck'],np.array([when]))[0]-new['deck']['anchorPosition'])))
   for k in [0,1]:continuities.append(float(abs(sample_position(old['samples'][k],np.array([when]))[0]-new['samples'][k]['voice']['anchorPosition'])))
   state=state and old['deck']['voiceID']!=new['deck']['voiceID']and all(old['samples'][k]['voiceID']!=new['samples'][k]['voiceID']for k in [0,1])and row['sliderBefore']==5
  for snap in [old]+row['clocks']+[new]:
   at=snap['at'];model=old if not transition or at<when else new;t=np.array([at]);dp=deck_position(model['deck'],t)[0];db=float(beat(dp));bpm=model['deck']['gridBPM']
   readback=max(readback,float(abs((float(beat(snap['deck']['position']))-db+2)%4-2)*60/bpm))
   for k in [0,1]:
    sp=sample_position(model['samples'][k],t)[0];sb=float(beat(sp));phase=max(phase,float(abs((sb-db+2)%4-2)*60/bpm));readback=max(readback,float(abs((float(beat(snap['samples'][k]['position']))-sb+2)%4-2)*60/bpm))
  packets=[];frames=288000 if transition else 144000
  assert sorted((p['label'],p['channel'])for p in row['pcm'])==sorted((l,c)for l in ['bus','sample0','sample1','deck']for c in [0,1])
  for label in ['bus','sample0','sample1','deck']:assert len({p['startFrame']for p in row['pcm']if p['label']==label})==1
  for packet in row['pcm']:
   x=pcm(packet);assert len(x)==packet['frames']==frames;cursor=packet['startFrame'];times=[];continuous=not packet['errors']
   for i,q in enumerate(packet['quanta']):
    assert 0<q['count']<=128 and(q['count']==128 or i==len(packet['quanta'])-1);continuous=continuous and q['frame']==cursor;times.append(q['frame']/48000+np.arange(q['count'])/48000);cursor=q['frame']+q['count']
   continuous=continuous and cursor==packet['startFrame']+len(x);t=np.concatenate(times);c=packet['channel'];label=packet['label']
   def output(snap,a):
    if label=='deck':return deck_output(snap['deck'],t,original,c)
    if label=='bus':return sample_output(snap['samples'][0],t,original,a,c)+sample_output(snap['samples'][1],t,original,a,c)
    return sample_output(snap['samples'][int(label[-1])],t,original,a,c)
   before_audio=r['keyedBeforeAudio']if transition or row['name']=='mixed-members'else r['keyedAfterAudio']
   want=output(old,before_audio)
   masks={'whole':np.ones(len(x),bool)}
   if transition:
    after=output(new,r['keyedAfterAudio']);u=np.clip((t-when)/.01,0,1);want=want*(1-u)+after*u
    assert t[0]+.1<row['actionAt']<when<t[-1]-.3
    masks.update(preparation=(t>=row['actionAt'])&(t<when),crossfade=(t>=when)&(t<when+.01),after=t>=when+.01)
   windows={}
   for name,mask in masks.items():
    assert mask.sum()>0;ref=float(np.sqrt(np.mean(want[mask]**2)));error=float(np.sqrt(np.mean((x[mask]-want[mask])**2)));relative=error/ref if ref else float('inf');windows[name]=dict(frames=int(mask.sum()),referenceRMS=ref,relativeRMSError=relative,accepted=bool(ref>1e-5 and relative<=1e-4))
   packets.append(dict(label=label,channel=c,frames=frames,quanta=len(packet['quanta']),sha256=packet['sha256'],continuous=bool(continuous),captureErrorCount=len(packet['errors']),windows=windows,accepted=bool(continuous and all(v['accepted']for v in windows.values()))))
  accepted=state and phase<=.01 and readback<=.01 and tempo<=1e-6 and(commit_spread is None or commit_spread<1e-8)and all(v<1e-8 for v in continuities)and all(p['accepted']for p in packets)
  rows.append(dict(name=row['name'],stateAccepted=bool(state),nominalBPM=target,maximumNominalBPMError=tempo,maximumBarPhaseSeconds=phase,maximumClockReadbackSeconds=readback,commonCommitSpreadSeconds=commit_spread,sourceContinuitySeconds=continuities,packets=packets,accepted=bool(accepted)))
 return dict(info,passed=all(s['accepted']for s in rows),observations=rows,scope='Actual warped deck plus raw/keylocked sample membership and grouped126→127.2BPM change; whole native original/rendered-reference PCM, per-output/bus and preparation/crossfade/after windows; no fitted alignment',scopedMixedGroupTransitionAccepted=all(s['accepted']for s in rows),pitchQualityAccepted=False,fullSamplerSyncAcceptance=False,exactVendorSemanticsAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x')as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:([dict(name=x['name'],accepted=x['accepted'],state=x['stateAccepted'],phase=x['maximumBarPhaseSeconds'],readback=x['maximumClockReadbackSeconds'],continuity=x['sourceContinuitySeconds'],commitSpread=x['commonCommitSpreadSeconds'],packets=[dict(label=p['label'],channel=p['channel'],accepted=p['accepted'],maxRelative=max(w['relativeRMSError']for w in p['windows'].values()))for p in x['packets']])for x in v]if k=='observations'else v)for k,v in r.items()if k!='sourceHashes'}));raise SystemExit(0 if r['passed']else 1)
