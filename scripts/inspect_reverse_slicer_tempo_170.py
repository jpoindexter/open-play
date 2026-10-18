#!/usr/bin/env python3
"""Inspect original reverse-rate audio continuity, source clock and Slicer return."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from inspect_slicer_warp_164 import beat, source
from inspect_reverse_exit_161 import wav


def wrap_reverse(beats, snap):
    if snap['loop']:
        lo,hi=beat(snap['loopIn']),beat(snap['loopOut'])
        beats=np.where(beats<=lo,hi-(hi-beats)%(hi-lo),beats)
    return np.clip(beats,0,beat(6.8))


def clock(snap,times):
    return source(wrap_reverse(beat(snap['anchorPosition'])-snap['gridBPM']/60*np.maximum(0,np.asarray(times)-snap['anchorTime']),snap))


def longest_quiet(x,rate,seconds,floor):
    width=round(rate*seconds);assert len(x)%width==0
    bins=np.sqrt(np.mean(x.reshape(-1,width)**2,axis=1));run=longest=0
    for value in bins:
        run=run+1 if value<floor else 0;longest=max(longest,run)
    return longest*seconds,float(bins.min())


def inspect(path,sources):
    raw=path.read_bytes();r=json.loads(raw);root=Path(__file__).resolve().parents[1]
    assert r['diagnosticCheckpoint']==170 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for n,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/n).read_bytes()).hexdigest()==digest,n
    assert r['sampleRate']==44100 and r['input']==dict(frames=299880,sampleRate=44100,channels=2,duration=6.8)
    assert hashlib.sha256((root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes()).hexdigest()==r['import']['contentHash']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['ready']['job']=='8266a41f62fc4fc5b92808dd3d988cec'
    job=root/'local-evidence/stem-jobs'/r['ready']['job'];manifest=json.loads((job/'output/manifest.json').read_bytes());stems={}
    assert manifest['model']=='SCNet-large official' and hashlib.sha256((job/'input.wav').read_bytes()).hexdigest()==manifest['source_sha256']
    for s in manifest['stems']:
        p=job/'output'/s['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256'];stems[s['name']]=wav(p)
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']]==['raw-reverse-slicer-tempo','keyed-reverse-slicer-tempo','keyed-reverse-nonloop-tempo']
    rows=[]
    for s in r['stages']:
        before,held,retimed,after=s['before'],s['held'],s['retimed'],s['after'];keyed=s['keyed']
        assert all(p['reverse'] and p['trackId']==r['import']['id'] and p['keylock']==keyed and p['keyShift']==(3 if keyed else 0) and p['mask']==[False,True,True,True] for p in [before,held,retimed,after])
        assert before['gridBPM']==held['gridBPM']==120 and abs(retimed['gridBPM']-127.2)<1e-8
        if s['slicer']:
            assert before['loop'] and abs(before['loopOut']-(1.8+8/3))<1e-8 and before['loopIn']==0
            slice_ok=held['slice']==retimed['slice']==0 and held['loopIn']==retimed['loopIn']==0 and held['loopOut']==retimed['loopOut']==.25
        else:slice_ok=not held['loop'] and not retimed['loop'] and held['slice'] is retimed['slice'] is None
        beats=beat(before['anchorPosition'])-(retimed['anchorTime']-before['anchorTime'])*2-(after['at']-retimed['anchorTime'])*127.2/60
        expected=float(source(wrap_reverse(beats,before)));error=abs(after['position']-expected)
        state_ok=after['playing'] and after['voice'] and not after['processing'] and not after['pending'] and after['slice'] is None and after['loop']==before['loop'] and abs(after['rate']-1.06)<1e-8 and abs(after['gridBPM']-127.2)<1e-8
        if before['loop']:state_ok &= after['loopIn']==before['loopIn'] and after['loopOut']==before['loopOut']
        packets=[]
        for kind,snap in [('heldPCM',held),('transitionPCM',None),('afterPCM',after)]:
            if snap:assert np.allclose(snap['gains'],[0,0,1,1,1],atol=1e-7,rtol=0)
            for p in s[kind]:
                data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256']
                x=np.frombuffer(data,'<f4').astype(float);frames=132300 if kind=='transitionPCM' else 13230
                assert len(x)==p['frames']==frames and np.isfinite(x).all() and not p['errors']
                cursor=p['startFrame']
                for i,q in enumerate(p['quanta']):
                    assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
                assert cursor==p['startFrame']+len(x)
                rms=float(np.sqrt(np.mean(x*x)));assert rms>r['criteria']['minimumRMS']
                quiet,minimum=longest_quiet(x,44100,r['criteria']['continuityBinSeconds'],r['criteria']['continuityRMSFloor'])
                row=dict(kind=kind,channel=p['channel'],frames=len(x),contiguousQuanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=float(np.max(np.abs(x))),maximumQuietRunSeconds=quiet,minimumBinRMS=minimum)
                if kind=='transitionPCM':row['continuousAudioCorrect']=quiet<=r['criteria']['maximumSilentRunSeconds']
                if not keyed and kind!='transitionPCM':
                    window=(np.arange(len(x))>=2205)&(np.arange(len(x))<11025);times=(np.arange(len(x))[window]+p['startFrame'])/44100
                    # Reversing N original samples maps z to N-1-z, hence the
                    # original interpolation coordinate is p*sr-1. No fitted lag.
                    positions=np.maximum(0,clock(snap,times)*44100-1);index=np.floor(positions).astype(int);fraction=positions-index;assert index.min()>=0 and index.max()<299880
                    # The kernel repeats its final reversed sample when the
                    # next array index is absent: this is original sample0.
                    following=np.minimum(index+1,299879)
                    want=sum(stems[n][index,p['channel']]*(1-fraction)+stems[n][following,p['channel']]*fraction for n in ['other','bass','drums'])
                    relative=float(np.sqrt(np.mean((x[window]-want)**2))/np.sqrt(np.mean(want**2)));row.update(rawRelativeRMSError=relative,rawSelectedSourceCorrect=relative<1e-4)
                packets.append(row)
        rows.append(dict(name=s['name'],selectedSliceCorrect=bool(slice_ok),releasedTransportCorrect=bool(state_ok),expectedBackgroundPosition=expected,observedPosition=after['position'],backgroundClockErrorSeconds=error,backgroundClockCorrect=error<.01,packets=packets))
    passed=bool(r['workflowCompleted'] and not r['errors'] and len(rows)==3 and all(s['selectedSliceCorrect'] and s['releasedTransportCorrect'] and s['backgroundClockCorrect'] and all(p.get('continuousAudioCorrect',True) and p.get('rawSelectedSourceCorrect',True) for p in s['packets']) for s in rows))
    return dict(checkpoint=170,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],criteria=r['criteria'],rawReferenceCriterion={'windowSeconds':[.05,.25],'maximumRelativeRMS':1e-4,'alignment':'Known exports/grid/anchors/reverse sample mapping, no fit.'},observations=rows,errors=r['errors'],default48000Acceptance=False,musicalPitchQualityAccepted=False,sourceAttributionAccepted=False,exactSeratoParityAccepted=False,perceptuallySeamlessAcceptance=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({'passed':r['passed'],'observations':[{k:v for k,v in s.items() if k!='packets'}|{'maximumTransitionQuietSeconds':max(p['maximumQuietRunSeconds'] for p in s['packets'] if p['kind']=='transitionPCM')} for s in r['observations']],'errors':r['errors']}));raise SystemExit(0 if r['passed'] else 1)
