#!/usr/bin/env python3
"""Inspect whole actual Auto Loop captures without timing/audio fitting."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def beat(t):
    return 2*t if t<1 else 2+(t-1)*2.5 if t<1.8 else 4+(t-1.8)*1.5

def source(b):
    return b/2 if b<2 else 1+(b-2)/2.5 if b<4 else 1.8+(b-4)/1.5

def inspect(path,sources):
    raw=path.read_bytes();r=json.loads(raw)
    assert r['diagnosticCheckpoint']==172 and r['sourceStable'] and r['workflowCompleted'] and not r['errors']
    assert r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    assert r['sampleRate']==r['context']['sampleRate']==48000 and r['context']['requestedSampleRate'] is None
    assert r['ready']['job']=='539aeee35cbe4518a7800f4ebbb004c5' and r['originalUnchanged'] and r['importedFileUnchanged'] and r['decodedStemsUnchanged']
    assert r['grid']=={'bpm':120,'offset':0,'markers':[{'time':1,'bpm':150},{'time':1.8,'bpm':90}]}
    expected_names=[kind+'-'+action for kind in ['raw','keylock-key3'] for action in ['loop','loopHalf','loopDouble']]+['stop']
    assert [s['name'] for s in r['stages']]==expected_names
    observations=[]
    for s in r['stages']:
        a=s['after'];stopped=s['name']=='stop';keyed=s['name'].startswith('keylock-key3') or stopped
        assert a['mask']==[False,True,True,True] and a['keylock']==keyed and a['keyShift']==(3 if keyed else 0) and not a['processing'] and not a['reverse']
        row={'name':s['name']};clock_errors=[];wraps=0;geometry=True
        if stopped:assert not a['playing'] and not a['voice']
        else:
            assert a['playing'] and a['loop'] and a['loopLength']==s['requestedBeats'] and a['gridBPM']==120 and a['rate']==1
            actual=beat(a['loopOut'])-beat(a['loopIn']);wanted=source(beat(a['loopIn'])+s['requestedBeats']);geometry=abs(actual-s['requestedBeats'])<=1e-8
            row.update(requestedBeats=s['requestedBeats'],observedBeats=actual,observedStart=a['loopIn'],observedEnd=a['loopOut'],expectedEnd=wanted,geometryAccepted=geometry)
            samples=[a]+s['clockSamples']+[s['last']]
            for x in samples:
                b=beat(x['anchorPosition'])+max(0,x['at']-x['anchorTime'])*2
                start,end=beat(x['loopIn']),beat(x['loopOut'])
                if b>=end:b=start+(b-start)%(end-start)
                clock_errors.append(abs(x['position']-source(b)))
            wraps=sum(right['position']<left['position']-.1 for left,right in zip(samples,samples[1:]))
            row.update(clockSamples=len(samples),maximumClockErrorSeconds=max(clock_errors),observedWraps=wraps)
        packets=[]
        for p in s['pcm']:
            data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256'];x=np.frombuffer(data,'<f4').astype(float)
            seconds=.3 if stopped else 2.5 if s['requestedBeats']==4 else 5
            assert len(x)==p['frames']==round(seconds*r['sampleRate']) and np.isfinite(x).all() and not p['errors'];cursor=p['startFrame']
            for i,q in enumerate(p['quanta']):
                assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
            assert cursor==p['startFrame']+len(x)
            rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)))
            good=peak<r['criteria']['maximumStoppedPeak'] if stopped else rms>r['criteria']['minimumRMS']
            packets.append(dict(channel=p['channel'],frames=len(x),contiguousQuanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak,audioAccepted=good))
        row['packets']=packets;row['accepted']=geometry and all(p['audioAccepted'] for p in packets) and (stopped or wraps>=1 and max(clock_errors)<r['criteria']['maximumPositionError']);observations.append(row)
    return dict(checkpoint=172,passed=all(s['accepted'] for s in observations),originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),context=r['context'],sourceHashes=r['sourceBefore'],job=r['ready']['job'],observations=observations,exactVendorCompositionAccepted=False,sourceAttributionAccepted=False,pitchQualityAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps(r));raise SystemExit(0 if r['passed'] else 1)
