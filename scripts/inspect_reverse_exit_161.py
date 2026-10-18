#!/usr/bin/env python3
"""Independent musical reverse PCM/clock and complete-capture inspection. No fit."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import struct
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
def sha(data): return hashlib.sha256(data).hexdigest()
def rms(x): return float(np.sqrt(np.mean(x*x)))
def beat(p):
    p=np.asarray(p)
    return np.where(p<1,2*p,np.where(p<1.8,2+(p-1)*2.5,4+(p-1.8)*1.5))
def source(b):
    return np.where(b<2,b/2,np.where(b<4,1+(b-2)/2.5,1.8+(b-4)/1.5))
def clock(row,at):
    sign=-1 if row['reverse'] else 1
    return source(np.clip(beat(row['anchorPosition'])+sign*2*np.maximum(0,np.asarray(at)-row['anchorTime']),0,beat(6.8)))
def wav(path):
    data=path.read_bytes();assert data[:4]==b'RIFF' and data[8:12]==b'WAVE'
    pos=12;fmt=None;pcm=None
    while pos<len(data):
        tag,n=struct.unpack_from('<4sI',data,pos);chunk=data[pos+8:pos+8+n]
        if tag==b'fmt ':fmt=struct.unpack_from('<HHIIHH',chunk)
        if tag==b'data':pcm=chunk
        pos+=8+n+n%2
    assert fmt==(3,2,44100,352800,8,32) and pcm is not None
    return np.frombuffer(pcm,'<f4').reshape(-1,2)

def inspect(path,sources):
    raw=path.read_bytes();r=json.loads(raw)
    assert r['diagnosticCheckpoint']==161 and r['workflowCompleted'] and not r['errors']
    assert r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():assert sha((sources/name).read_bytes())==digest,name
    assert r['criteria']==dict(minimumRMS=1e-5,maximumStoppedPeak=1e-7,sourceClockErrorSeconds=.01,rawComparisonWindow=[.3,1.3],maximumRawRelativeRMS=1e-4)
    assert r['originalUnchanged'] and r['importedFileUnchanged']
    assert r['import']['contentHash']==sha((ROOT/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes())=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['input']==dict(frames=299880,sampleRate=44100,channels=2,duration=6.8)
    assert r['loopBounds']==dict(start=0,end=1.8+8/3) and r['grid']==dict(bpm=120,offset=0,markers=[dict(time=1,bpm=150),dict(time=1.8,bpm=90)])
    job=ROOT/'local-evidence/stem-jobs'/r['ready']['job'];manifest=json.loads((job/'output/manifest.json').read_bytes())
    assert manifest['model']=='SCNet-large official' and sha((job/'input.wav').read_bytes())==manifest['source_sha256']
    stems={}
    for stem in manifest['stems']:
        p=job/'output'/stem['file'];assert sha(p.read_bytes())==stem['sha256'];stems[stem['name']]=wav(p)
    integrity=[];observations=[]
    def decode(p,label,seconds):
        data=base64.b64decode(p['base64'],validate=True);assert sha(data)==p['sha256'] and not p['errors']
        x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==seconds*r['sampleRate'] and np.isfinite(x).all()
        cursor=p['startFrame']
        for i,q in enumerate(p['quanta']):
            assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
        assert cursor==p['startFrame']+len(x)
        integrity.append(dict(label=label,channel=p['channel'],frames=len(x),sha256=p['sha256'],contiguousQuanta=len(p['quanta'])))
        return x
    assert [row['name'] for row in r['stages']]==['raw-loop-exit-reverse','raw-forward-return','raw-natural-start','keylock-key3-loop-exit-reverse','keylock-key3-forward-return','keylock-key3-natural-start']
    for row in r['stages']:
        natural=row['name'].endswith('-natural-start');reverse=row['name'].endswith('-reverse') or natural;keylock=row['name'].startswith('keylock-')
        assert row['reverse']==reverse and row['keylock']==keylock and row['keyShift']==(3 if keylock else 0)
        assert not row['warpLoop'] and not row['loop'] and row['syncState']=='tempo' and row['mask']==[False,True,True,True]
        if keylock:assert row['live'] and row['live']['groups'] and all(g['processorChannels']==18 for g in row['live']['groups'])
        if natural:assert not row['after']['playing'] and not row['after']['voice'] and abs(row['after']['position'])<1e-7
        assert len(row['gains'])==5 and max(abs(g) for g in row['gains'][:2])<1e-6 and all(abs(g-1)<1e-6 for g in row['gains'][2:])
        positions=row['positions'];assert len(positions)>10
        actual=np.array([p['position'] for p in positions]);expected=clock(row,[p['at'] for p in positions]);error=float(np.max(np.abs(actual-expected)));assert error<.01,error
        differences=np.diff(actual);assert np.sum(differences<-.005)>10 if reverse else np.sum(differences>.005)>10
        for p in positions:
            expected_rate=120/(120 if p['position']<1 else 150 if p['position']<1.8 else 90)
            assert abs(p['rate']-expected_rate)<1e-6
        audio=[]
        for packet in row['pcm']:
            x=decode(packet,row['name'],3 if natural else 2);sr=r['sampleRate'];start=packet['startFrame'];times=(np.arange(len(x))+start)/sr
            window=(times>=start/sr+.3)&(times<start/sr+1.3);level=rms(x[window]);assert level>1e-5
            observation=dict(channel=packet['channel'],settledRMS=level)
            if not keylock:
                positions_expected=clock(row,times[window])*44100-(1 if reverse else 0)
                index=np.floor(positions_expected).astype(int);fraction=positions_expected-index;c=packet['channel']
                # Exact reverse-buffer convention: sample i maps to N-1-i.
                # This is a declared one-frame endpoint, never an optimized lag.
                expected=np.zeros(len(index))
                for name in ['other','bass','drums']:
                    data=stems[name][:,c];expected+=data[index]*(1-fraction)+data[index+1]*fraction
                rel=rms(x[window]-expected)/rms(expected);observation['rawRelativeRMSError']=rel
                observation['rawDirectionPassed']=rel<1e-4
            audio.append(observation)
        observations.append(dict(name=row['name'],sourceClockMaximumError=error,sourceStartStoppedAtZero=natural and not row['after']['playing'] and row['after']['position']==0,audio=audio))
    stopped=[]
    for p in r['controlPCM']:
        x=decode(p,'Stop',2);times=(np.arange(len(x))+p['startFrame'])/r['sampleRate'];window=(times>=r['stopAt']+.1)&(times<r['stopAt']+.25);assert window.any();peak=float(np.max(np.abs(x[window])));stopped.append(dict(channel=p['channel'],peak=peak,passed=peak<1e-7))
    passed=all(v.get('rawDirectionPassed',True) for row in observations for v in row['audio']) and all(v['passed'] for v in stopped)
    return dict(checkpoint=161,passed=passed,originalBytes=len(raw),originalSHA256=sha(raw),job=r['ready']['job'],canonicalInputSHA256=manifest['source_sha256'],sourceHashes=r['sourceBefore'],criteria=r['criteria'],wholeCaptureIntegrity=integrity,observations=observations,stop=stopped,originalInputUnchanged=True,alignment='Observed anchors only; fixed declared windows; one-frame reverse endpoint convention, no fitting.',musicalPitchAccuracyAccepted=False,musicalSourceQualityAccepted=False,exactSeratoCompositionAccepted=False,seamlessTransitionAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,default=ROOT/'prototype');args=p.parse_args()
    result=inspect(args.original,args.sources)
    with args.output.open('x') as out:json.dump(result,out,indent=2,allow_nan=False);out.write('\n')
    print(json.dumps({k:result[k] for k in ['passed','observations','stop']},indent=2));raise SystemExit(0 if result['passed'] else 1)
