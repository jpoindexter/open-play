#!/usr/bin/env python3
"""Known-sequence unity-rate source coordinates; no fitted alignment."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from inspect_deck_playing_182 import pcm

def unity_reference(data, frames, start_frame, offset_frame, loop=None, rounded=True):
    frames=np.asarray(frames);active=frames>=start_frame
    first=np.floor(offset_frame+.5) if rounded else offset_frame
    position=first+np.maximum(0,frames-start_frame)
    if loop:
        lo,hi=loop;span=hi-lo
        position=np.where(position>=hi,lo+np.mod(position-lo,span),position)
    i=np.floor(position).astype(int);u=position-i;j=i+1
    if loop:
        crossing=(i<hi)&(j>=hi)
        j=np.where(crossing,np.floor(np.maximum(0,position+1-span)).astype(int),j)
    assert np.all(i>=0) and np.all(i<len(data))
    j=np.minimum(j,len(data)-1)
    return np.where(active,data[i]*(1-u)+data[j]*u,0)

def inspect(path,sources):
    raw=path.read_bytes();r=json.loads(raw)
    assert r['diagnosticCheckpoint']==184 and r['workflowCompleted'] and not r['errors'] and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    assert r['context']==dict(sampleRate=48000,requestedSampleRate=None) and r['physicalMute']==0
    assert [x['name']for x in r['stages']]==['integer','fractional','fractional-loop']
    data=[pcm(x)for x in r['generatedPCM']['channels']];i=np.arange(32768)
    independent=[(np.sin(i*.103)*.3+((i*17%997)/997-.5)*.2).astype('<f4'),(np.cos(i*.071)*.25+((i*31%991)/991-.5)*.2).astype('<f4')]
    generator_error=max(float(np.max(np.abs(a-b)))for a,b in zip(data,independent));assert generator_error<=1e-7
    rows=[]
    for row in r['stages']:
        assert row['playbackRate']==1 and row['detune']==0 and row['bufferRate']==48000 and row['when']*48000==row['startFrame']
        assert len({p['startFrame']for p in row['pcm']})==1
        packets=[]
        for p in row['pcm']:
            x=pcm(p);assert len(x)==p['frames']==14400 and not p['errors'];cursor=p['startFrame'];frames=[]
            for n,q in enumerate(p['quanta']):
                assert q['frame']==cursor and 0<q['count']<=128 and(q['count']==128 or n==len(p['quanta'])-1)
                frames.extend(range(q['frame'],q['frame']+q['count']));cursor+=q['count']
            assert cursor==p['startFrame']+len(x);frames=np.array(frames)
            loop=(row['loopStart']*48000,row['loopEnd']*48000)if row['loop']else None
            want=unity_reference(data[p['channel']],frames,row['startFrame'],row['offset']*48000,loop)
            naive=unity_reference(data[p['channel']],frames,row['startFrame'],row['offset']*48000,loop,False)
            denom=float(np.sqrt(np.mean(want*want)));assert denom>1e-5
            relative=float(np.sqrt(np.mean((x-want)**2))/denom);naive_error=float(np.sqrt(np.mean((x-naive)**2))/denom)
            accepted=relative<=1e-4 and(row['name']=='integer' or naive_error>1e-4)
            packets.append(dict(channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],relativeRMSError=relative,naiveFloatingOffsetRelativeRMSError=naive_error,accepted=bool(accepted)))
        rows.append(dict(name=row['name'],packets=packets,accepted=all(x['accepted']for x in packets)))
    return dict(checkpoint=184,passed=all(x['accepted']for x in rows),originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],browser=r['browser'],sampleRate=48000,generatorMaximumAbsoluteError=generator_error,observations=rows,referenceModel='Unity/no-detune source starts at nearest integer source frame; fractional loop coordinates and interpolation-neighbor wrapping; integer native start epoch; no optimized alignment',exactBinaryToSourceRevisionAccepted=False,pitchQualityAccepted=False,nativeAppAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x')as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({k:v for k,v in r.items()if k!='sourceHashes'}));raise SystemExit(0 if r['passed']else 1)
