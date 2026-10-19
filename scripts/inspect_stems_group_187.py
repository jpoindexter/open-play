#!/usr/bin/env python3
"""Whole actual mixed raw/keyed Sampler group, independent clocks and PCM."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from inspect_deck_playing_182 import pcm,beat,warped,interp
from inspect_natural_rate_171 import read_wave

def deck_position(d,t):return warped(d,t,d['gridBPM'],d['loopIn'],d['loopOut'])
def sample_position(s,t):
 v=s['voice'];return warped(v,t,v['syncBPM'],v['settings']['loopStart'],v['settings']['loopEnd'])
def deck_output(d,t,original,c,parts):
 pos=deck_position(d,t)*48000
 if all(d['mask']):return interp(original[c],pos)
 return sum((interp(parts[name][c],pos)for name,active in zip(['vocals','other','bass','drums'],d['mask'])if active),np.zeros(len(t)))
def sample_output(s,t,original,keyed,c):
 v=s['voice'];p=sample_position(s,t);settings=v['settings']
 if settings['keylock']:
  data=pcm(keyed['channels'][c]);f=(beat(p)-beat(settings['loopStart']))/(beat(settings['loopEnd'])-beat(settings['loopStart']))*len(data)
 else:data=original[c];f=p*48000
 return interp(data,f)*v['gain']*v['trackGain']

def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw)
 assert r['diagnosticCheckpoint']==187 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
 info=dict(checkpoint=187,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],workflowCompleted=r['workflowCompleted'],errors=r['errors'],uiErrors=r['uiErrors'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],failureState=r.get('failureState'),fullParityAcceptance=False)
 assert not r['errors']and not r['uiErrors']and r['originalUnchanged']and r['inputFileUnchanged']
 assert r['context']==dict(sampleRate=48000,requestedSampleRate=None) and r['decodedStemsUnchanged']
 assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
 assert [s['name']for s in r['stages']]==['stems-activation','vocals-only','selected-stems-tempo-transition','all-stems-muted','restore-original']
 original=[pcm(x)for x in r['inputPCM']];assert len(original[0])==len(original[1])==326400
 root=Path(__file__).resolve().parents[1];job=root/'local-evidence/stem-jobs'/r['ready']['job'];m=json.loads((job/'output/manifest.json').read_bytes());receipt=json.loads((job/'service-cache.json').read_text())
 assert r['ready']['job']=='539aeee35cbe4518a7800f4ebbb004c5' and r['job']['state']=='complete' and r['job']['model']==m['model']=='SCNet-large official'
 assert m['model_sha256']=='719e5abb8ed920305dad546ac3cd6fb0b1e9c3092d14ce21827bfc0423af3070' and m['model_revision']=='5d95bf96b19c3eede63248d171efeca8e3abb948'
 assert r['canonicalUpload']==dict(bytes=2611244,sha256='8bd922074bc1df1e87f00cb967ce6e30c7183f1eed41d74763e9613c5f496df7',sampleRate=48000,frames=326400)
 assert hashlib.sha256((job/'input.wav').read_bytes()).hexdigest()==r['canonicalUpload']['sha256']==m['source_sha256']
 rate,wav=read_wave(job/'input.wav');assert rate==48000 and np.array_equal(wav[:,0],original[0])and np.array_equal(wav[:,1],original[1])
 pipeline=b''.join((root/'scripts'/n).read_bytes()for n in ['stem_worker.py','stem_mix_consistency.py']);fingerprint=hashlib.sha256(b'scnet'+hashlib.sha256(pipeline).digest());fingerprint.update((job/'input.wav').read_bytes());assert fingerprint.hexdigest()==receipt['hash']
 worker=[]
 for stem in m['stems']:
  p=job/'output'/stem['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==stem['sha256'];sr,x=read_wave(p);assert sr==44100 and x.shape==(299880,2);worker.append(dict(name=stem['name'],sha256=stem['sha256'],frames=299880,sampleRate=44100))
 parts={}
 for stem in r['decodedStemPCM']:
  assert stem['sampleRate']==48000 and stem['frames']==326400;parts[stem['name']]=[pcm(x)for x in stem['channels']];assert all(len(x)==326400 for x in parts[stem['name']])
 assert set(parts)=={'vocals','other','bass','drums'}
 for a in [r['keyedBeforeAudio'],r['keyedAfterAudio']]:assert a['sampleRate']==48000 and len(a['channels'])==2
 rows=[]
 for row in r['stages']:
  activation=row['name']=='stems-activation';transition=activation or row['name']=='selected-stems-tempo-transition';old=row['before'];new=row['last'];target=126 if row['name']in['stems-activation','vocals-only']else 127.2
  state=True;phase=0;readback=0;tempo=0;expected_mask={'stems-activation':[True,True,True,True],'vocals-only':[True,False,False,False],'selected-stems-tempo-transition':[False,True,True,True],'all-stems-muted':[False,False,False,False],'restore-original':[True,True,True,True]}[row['name']]
  settled=[new]if transition else [old]+row['clocks']+[new]
  for snap in settled:
   d=snap['deck'];state=state and d['playing']and d['sync']and not d['processing']and d['role']=='primary'and d['hasWarpTransport']
   tempo=max(tempo,abs(d['bpm']-target),abs(d['gridBPM']-target));state=state and d['stemsReady']and d['mask']==expected_mask and not any(d['stemFX']);expected_gains=[1,0,0,0,0]if all(expected_mask)else[0]+list(map(int,expected_mask));state=state and np.allclose(d['stemGains'],expected_gains,atol=1e-7,rtol=0)
   for k,s in enumerate(snap['samples']):
    v=s['voice'];state=state and s['slot']['playing']and s['slot']['sync']and not s['slot']['processing']and v is not None and v['mode']=='beat'and bool(v['settings']['keylock'])==(k==1)
    tempo=max(tempo,abs(v['syncBPM']-target));assert abs(v['gain']-.4)<1e-7 and v['trackGain']==1
  when=new['deck']['anchorTime']if transition else None;continuities=[];commit_spread=None
  if transition:
   epochs=[new['deck']['anchorTime']]+([]if activation else[s['voice']['anchorTime']for s in new['samples']]);commit_spread=max(epochs)-min(epochs)
   continuities.append(float(abs(deck_position(old['deck'],np.array([when]))[0]-new['deck']['anchorPosition'])))
   if not activation:
    for k in [0,1]:continuities.append(float(abs(sample_position(old['samples'][k],np.array([when]))[0]-new['samples'][k]['voice']['anchorPosition'])))
   state=state and old['deck']['voiceID']!=new['deck']['voiceID']and all((old['samples'][k]['voiceID']==new['samples'][k]['voiceID'])if activation else(old['samples'][k]['voiceID']!=new['samples'][k]['voiceID'])for k in [0,1])and(activation or row['sliderBefore']==5)
  for snap in [old]+row['clocks']+[new]:
   at=snap['at'];model=old if not transition or at<when else new;t=np.array([at]);dp=deck_position(model['deck'],t)[0];db=float(beat(dp));bpm=model['deck']['gridBPM']
   readback=max(readback,float(abs((float(beat(snap['deck']['position']))-db+2)%4-2)*60/bpm))
   for k in [0,1]:
    sp=sample_position(model['samples'][k],t)[0];sb=float(beat(sp));phase=max(phase,float(abs((sb-db+2)%4-2)*60/bpm));readback=max(readback,float(abs((float(beat(snap['samples'][k]['position']))-sb+2)%4-2)*60/bpm))
  packets=[];frames=288000 if transition else 24000 if row['name']=='vocals-only'else 14400
  assert sorted((p['label'],p['channel'])for p in row['pcm'])==sorted((l,c)for l in ['bus','sample0','sample1','deck']for c in [0,1])
  for label in ['bus','sample0','sample1','deck']:assert len({p['startFrame']for p in row['pcm']if p['label']==label})==1
  for packet in row['pcm']:
   x=pcm(packet);assert len(x)==packet['frames']==frames;cursor=packet['startFrame'];times=[];continuous=not packet['errors']
   for i,q in enumerate(packet['quanta']):
    assert 0<q['count']<=128 and(q['count']==128 or i==len(packet['quanta'])-1);continuous=continuous and q['frame']==cursor;times.append(q['frame']/48000+np.arange(q['count'])/48000);cursor=q['frame']+q['count']
   continuous=continuous and cursor==packet['startFrame']+len(x);t=np.concatenate(times);c=packet['channel'];label=packet['label']
   def output(snap,a):
    if label=='deck':return deck_output(snap['deck'],t,original,c,parts)
    if label=='bus':return sample_output(snap['samples'][0],t,original,a,c)+sample_output(snap['samples'][1],t,original,a,c)
    return sample_output(snap['samples'][int(label[-1])],t,original,a,c)
   before_audio=r['keyedBeforeAudio']if transition or row['name']=='vocals-only'else r['keyedAfterAudio']
   want=output(old,before_audio)
   masks={'whole':np.ones(len(x),bool)}
   if transition:
    after=output(new,r['keyedBeforeAudio']if activation else r['keyedAfterAudio']);u=np.clip((t-when)/.01,0,1);want=want*(1-u)+after*u
    assert t[0]+.1<row['actionAt']<when<t[-1]-.3
    masks.update(preparation=(t>=row['actionAt'])&(t<when),crossfade=(t>=when)&(t<when+.01),after=t>=when+.01)
   windows={}
   for name,mask in masks.items():
    assert mask.sum()>0;ref=float(np.sqrt(np.mean(want[mask]**2)));error=float(np.sqrt(np.mean((x[mask]-want[mask])**2)));relative=error/ref if ref else None;windows[name]=dict(frames=int(mask.sum()),referenceRMS=ref,relativeRMSError=relative,accepted=bool((float(np.max(np.abs(x[mask])))<=1e-7)if row['name']=='all-stems-muted'and label=='deck'else(ref>1e-5 and relative is not None and relative<=1e-4)))
   packets.append(dict(label=label,channel=c,frames=frames,quanta=len(packet['quanta']),sha256=packet['sha256'],continuous=bool(continuous),captureErrorCount=len(packet['errors']),windows=windows,accepted=bool(continuous and all(v['accepted']for v in windows.values()))))
  accepted=state and phase<=.01 and readback<=.01 and tempo<=1e-6 and(commit_spread is None or commit_spread<1e-8)and all(v<1e-8 for v in continuities)and all(p['accepted']for p in packets)
  rows.append(dict(name=row['name'],stateAccepted=bool(state),nominalBPM=target,maximumNominalBPMError=tempo,maximumBarPhaseSeconds=phase,maximumClockReadbackSeconds=readback,commonCommitSpreadSeconds=commit_spread,sourceContinuitySeconds=continuities,packets=packets,accepted=bool(accepted)))
 return dict(info,passed=all(s['accepted']for s in rows),observations=rows,model=dict(job=r['ready']['job'],name=m['model'],weightSHA256=m['model_sha256'],revision=m['model_revision'],historicalRuntime=m['runtime'],historicalTiming=m['timing'],historicalManifestCached=m['cached'],manifestCacheKey=m['cache_key'],serviceFingerprint=receipt['hash'],currentCacheHitByExistingJob=True,workerOutputs=worker),decodedOutputs=[dict(name=x['name'],frames=x['frames'],sampleRate=x['sampleRate'],channelSHA256=[c['sha256']for c in x['channels']])for x in r['decodedStemPCM']],scope='Actual cached Stems activation/vocal-only/selected-sum tempo/mute/restore with running raw/keyed samples; whole native original/decoded-part/rendered PCM and scoped handoffs, no fitted alignment',scopedStemsMixedGroupAccepted=all(s['accepted']for s in rows),pitchQualityAccepted=False,separationQualityAccepted=False,sourceAttributionAccepted=False,fullSamplerSyncAcceptance=False,exactVendorSemanticsAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x')as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({k:([dict(name=x['name'],accepted=x['accepted'],state=x['stateAccepted'],phase=x['maximumBarPhaseSeconds'],readback=x['maximumClockReadbackSeconds'],continuity=x['sourceContinuitySeconds'],commitSpread=x['commonCommitSpreadSeconds'],packets=[dict(label=p['label'],channel=p['channel'],accepted=p['accepted'],maxRelative=max((w['relativeRMSError']for w in p['windows'].values()if w['relativeRMSError']is not None),default=None))for p in x['packets']])for x in v]if k=='observations'else v)for k,v in r.items()if k!='sourceHashes'}));raise SystemExit(0 if r['passed']else 1)
