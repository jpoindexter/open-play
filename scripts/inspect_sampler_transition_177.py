#!/usr/bin/env python3
"""Compare whole actual Sampler transitions at declared, unfitted audio frames."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def pcm(p):
 b=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(b).hexdigest()==p['sha256'];x=np.frombuffer(b,'<f4').astype(float);assert np.isfinite(x).all();return x

def beat(p):return np.where(p<1,2*p,np.where(p<1.8,2+(p-1)*2.5,4+(p-1.8)*1.5))
def source(b):return np.where(b<2,b/2,np.where(b<4,1+(b-2)/2.5,1.8+(b-4)/1.5))
def positions(v,t):
 b=beat(v['anchorPosition'])+np.maximum(0,t-v['anchorTime'])*v['syncBPM']/60
 first=beat(v['settings']['loopStart']);last=beat(v['settings']['loopEnd']);b=np.where(b>=last,first+np.mod(b-first,last-first),b);return source(b)
def output(v,a,c,t):
 p=positions(v,t);x=pcm(a['channels'][c]);f=(beat(p)-beat(v['settings']['loopStart']))/(beat(v['settings']['loopEnd'])-beat(v['settings']['loopStart']))*len(x) if v['settings']['keylock'] else p*a['sampleRate']
 i=np.floor(f).astype(int);assert np.all(i>=0) and np.all(i<len(x));u=f-i;return (x[i]*(1-u)+x[np.minimum(i+1,len(x)-1)]*u)*v['gain']*v['trackGain']
def inspect(path,sources):
 raw=path.read_bytes();r=json.loads(raw);assert r['diagnosticCheckpoint']==177 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
 for n,h in r['sourceBefore'].items():assert hashlib.sha256((sources/n).read_bytes()).hexdigest()==h,n
 info=dict(checkpoint=177,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],errors=r['errors'],uiErrors=r['uiErrors'],workflowCompleted=r['workflowCompleted'])
 if not r['workflowCompleted']:return dict(info,passed=False,observations=[],fullParityAcceptance=False)
 assert not r['errors'] and not r['uiErrors'] and r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None and r['inputFileUnchanged'] and r['originalUnchanged']
 assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
 assert [s['name'] for s in r['stages']]==['raw-tempo-transition','keyed-tempo-transition'];rows=[]
 for s in r['stages']:
  old=s['before']['voice'];new=s['last']['voice'];when=new['anchorTime'];assert old['syncTransport'] and new['syncTransport'];assert old['settings']['keylock']==new['settings']['keylock']==s['keylock']
  assert s['before']['voiceID']!=s['last']['voiceID'] and s['last']['slot']['sync'] and s['last']['slot']['playing'];assert new['gain']>0 and abs(new['syncBPM']-s['last']['leader']['bpm'])<1e-6
  assert [p['channel'] for p in s['pcm']]==[0,1] and s['pcm'][0]['startFrame']==s['pcm'][1]['startFrame']
  for v in [old,new]:assert abs(v['gain']-.4)<1e-7 and v['trackGain']==1 and v['settings']['loopStart']==1 and abs(v['settings']['loopEnd']-47/15)<1e-8
  continuity=float(abs(positions(old,np.array([when]))[0]-new['anchorPosition']));phase=float(abs((beat(s['last']['position'])-(s['last']['leader']['position']-s['last']['leader']['grid'])*s['last']['leader']['sourceBPM']/60+2)%4-2)*60/new['syncBPM']);packets=[]
  # Exported buffers must be unmodified during capture; raw path is original PCM.
  for a in [s['oldAudio'],s['newAudio']]:assert a['sampleRate']==48000 and len(a['channels'])==2
  if not s['keylock']:
   for c in [0,1]:assert s['oldAudio']['channels'][c]['sha256']==s['newAudio']['channels'][c]['sha256']==r['inputPCM'][c]['sha256']
  for p in s['pcm']:
   x=pcm(p);assert len(x)==p['frames']==288000 and not p['errors'];cursor=p['startFrame']
   for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
   assert cursor==p['startFrame']+len(x);t=(p['startFrame']+np.arange(len(x)))/48000;assert t[0]+.1<s['actionAt']<when<t[-1]-.3
   a=output(old,s['oldAudio'],p['channel'],t);b=output(new,s['newAudio'],p['channel'],t);u=np.clip((t-when)/.01,0,1);want=a*(1-u)+b*u
   windows={}
   for name,mask in {'whole':np.ones(len(x),bool),'preparation':(t>=s['actionAt'])&(t<when),'crossfade':(t>=when)&(t<when+.01),'after':t>=when+.01}.items():
    assert mask.sum()>0;ref=float(np.sqrt(np.mean(want[mask]**2)));error=float(np.sqrt(np.mean((x[mask]-want[mask])**2)));relative=error/ref if ref else float('inf');windows[name]=dict(frames=int(mask.sum()),referenceRMS=ref,absoluteRMSError=error,relativeRMSError=relative,accepted=relative<=1e-4)
   packets.append(dict(channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],windows=windows,accepted=all(w['accepted'] for w in windows.values())))
  rows.append(dict(name=s['name'],commitTime=when,actionTime=s['actionAt'],sourceContinuitySeconds=continuity,barPhaseSeconds=phase,commonBPM=new['syncBPM'],packets=packets,accepted=continuity<1e-8 and phase<=.01 and all(p['accepted'] for p in packets)))
 return dict(info,passed=all(x['accepted'] for x in rows),observations=rows,scope='whole raw/keyed warped-loop transport output against exact original/rendered PCM with declared interpolation/gain and10ms scheduled crossfade; no fitted timing/gain/phase',scopedTransitionContinuityAccepted=all(x['accepted'] for x in rows),pitchQualityAccepted=False,fullSamplerSyncAcceptance=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
 with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps(r));raise SystemExit(0 if r['passed'] else 1)
