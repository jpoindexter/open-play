#!/usr/bin/env python3
"""Inspect complete musical Slicer hold/tempo/release originals without fitting."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from inspect_slicer_warp_164 import beat, source
from inspect_reverse_exit_161 import wav


def source_time(beats):
    return beats/2 if beats<2 else 1+(beats-2)/2.5 if beats<4 else 1.8+(beats-4)/1.5


def clock(s, times):
    beats=beat(s['anchorPosition'])+s['gridBPM']/60*np.maximum(0,np.asarray(times)-s['anchorTime'])
    if s['loop']:
        lo,hi=beat(s['loopIn']),beat(s['loopOut']);beats=np.where(beats>=hi,lo+(beats-lo)%(hi-lo),beats)
    return source(np.clip(beats,0,beat(6.8)))


def inspect(path, sources):
    raw=path.read_bytes();r=json.loads(raw);root=Path(__file__).resolve().parents[1]
    assert r['diagnosticCheckpoint']==167 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    assert r['sampleRate']==44100 and r['input']==dict(frames=299880,sampleRate=44100,channels=2,duration=6.8)
    assert hashlib.sha256((root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes()).hexdigest()==r['import']['contentHash']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['ready']['job']=='8266a41f62fc4fc5b92808dd3d988cec'
    job=root/'local-evidence/stem-jobs'/r['ready']['job'];manifest=json.loads((job/'output/manifest.json').read_bytes());stems={}
    for s in manifest['stems']:
        p=job/'output'/s['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256'];stems[s['name']]=wav(p)
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']]==['raw-held-tempo','keyed-held-tempo']
    rows=[]
    for s in r['stages']:
        before,retimed,after=s['before'],s['retimed'],s['after'];when=retimed['anchorTime']
        keyed=s['name'].startswith('keyed')
        assert all(snap['keylock']==keyed and snap['keyShift']==(3 if keyed else 0) for snap in [before,s['held'],retimed,after])
        expected=source_time(float(beat(before['anchorPosition']))+(when-before['anchorTime'])*2+(after['at']-when)*2.12)
        error=abs(after['position']-expected)
        state_ok=bool(after['playing'] and after['voice'] and not any(after[k] for k in ['loop','pending','processing']) and after['slice'] is None and after['trackId']==r['import']['id'] and abs(after['rate']-1.06)<1e-8)
        held_ok=retimed['slice']==0 and retimed['loop'] and retimed['loopIn']==s['held']['loopIn'] and retimed['loopOut']==s['held']['loopOut'] and abs(retimed['gridBPM']-127.2)<1e-8
        packets=[]
        for kind,snap in [('heldPCM',s['held']),('retimedPCM',retimed),('afterPCM',after)]:
            assert snap['mask']==[False,True,True,True] and np.allclose(snap['gains'],[0,0,1,1,1],atol=1e-7,rtol=0)
            for p in s[kind]:
                data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256']
                x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==13230 and np.isfinite(x).all() and not p['errors']
                cursor=p['startFrame']
                for i,q in enumerate(p['quanta']):
                    assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
                assert cursor==p['startFrame']+len(x)
                rms=float(np.sqrt(np.mean(x*x)));assert rms>r['criteria']['minimumRMS']
                row=dict(kind=kind,channel=p['channel'],frames=len(x),contiguousQuanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=float(np.max(np.abs(x))))
                if s['name'].startswith('raw') and kind!='afterPCM':
                    win=(np.arange(len(x))>=2205)&(np.arange(len(x))<11025);times=(np.arange(len(x))[win]+p['startFrame'])/44100;positions=clock(snap,times)*44100;index=np.floor(positions).astype(int);fraction=positions-index
                    want=sum(stems[n][index,p['channel']]*(1-fraction)+stems[n][index+1,p['channel']]*fraction for n in ['other','bass','drums'])
                    relative=float(np.sqrt(np.mean((x[win]-want)**2))/np.sqrt(np.mean(want**2)));row.update(rawRelativeRMSError=relative,rawSelectedSliceCorrect=relative<1e-4)
                packets.append(row)
        rows.append(dict(name=s['name'],heldRateAndSliceCorrect=bool(held_ok),temporaryLoopRetired=state_ok,expectedBackgroundSourcePosition=expected,observedSourcePosition=after['position'],sourceClockErrorSeconds=error,sourceClockCorrect=error<r['criteria']['maximumPositionError'],packets=packets))
    passed=bool(r['workflowCompleted'] and not r['errors'] and len(rows)==2 and all(s['heldRateAndSliceCorrect'] and s['temporaryLoopRetired'] and s['sourceClockCorrect'] and all(p.get('rawSelectedSliceCorrect',True) for p in s['packets']) for s in rows))
    return dict(checkpoint=167,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],criteria={'maximumSourceClockErrorSeconds':r['criteria']['maximumPositionError'],'minimumRMS':r['criteria']['minimumRMS'],'rawWindowSeconds':[.05,.25],'maximumRawRelativeRMS':1e-4,'alignment':'Known exports/grid/actual anchors; no fit.'},observations=rows,errors=r['errors'],originalUnchanged=r.get('originalUnchanged',False),importedFileUnchanged=r.get('importedFileUnchanged',False),default48000Acceptance=False,musicalPitchQualityAccepted=False,sourceAttributionAccepted=False,afterReleaseAudioReferenceAccepted=False,exactSeratoParityAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({k:r[k] for k in ['passed','observations','errors']}));raise SystemExit(0 if r['passed'] else 1)
