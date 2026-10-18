#!/usr/bin/env python3
"""Inspect exact Slicer lifecycle/end originals, callback and complete PCM."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from inspect_slicer_warp_164 import beat, clock
from inspect_reverse_exit_161 import wav


def inspect(path, sources):
    raw=path.read_bytes();r=json.loads(raw)
    assert r['diagnosticCheckpoint']==166 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    root=Path(__file__).resolve().parents[1]
    assert hashlib.sha256((root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes()).hexdigest()==r['import']['contentHash']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['input']==dict(frames=299880,sampleRate=44100,channels=2,duration=6.8) and r['sampleRate']==44100
    assert r['ready']['job']=='8266a41f62fc4fc5b92808dd3d988cec'
    job=root/'local-evidence/stem-jobs'/r['ready']['job'];manifest=json.loads((job/'output/manifest.json').read_bytes())
    assert manifest['model']=='SCNet-large official' and hashlib.sha256((job/'input.wav').read_bytes()).hexdigest()==manifest['source_sha256']
    stems={}
    for stem in manifest['stems']:
        p=job/'output'/stem['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==stem['sha256'];stems[stem['name']]=wav(p)
    observations=[];music=r['import']['id']
    for stage in r['stages']:
        name=stage['name'];after=stage['after'];ending='expired' in name or '-end-' in name or name=='keyed-preparation-crosses-end'
        positive_after=stage.get('repeat',False) or stage.get('autoplay',False)
        if name=='early-release':
            assert stage['pending']['processing'] and stage['pending']['pending'];state_ok=after['trackId']==music and after['position']==0
        elif name=='replacement-late-release':
            assert stage['pending']['processing'] and stage['pending']['pending'];state_ok=after['trackId']==stage['loaded']['trackId']!=music and after['position']==0
        elif positive_after:
            state_ok=after['playing'] and after['voice'] and not after['processing'] and not after['loop']
            if stage.get('repeat'):state_ok&=after['trackId']==music and 0<=after['position']<1
            else:state_ok&=after['trackId']==stage['expectedNextId']!=music
        else:
            state_ok=after['trackId']==music and abs(after['position']-6.8)<1e-8
        if not positive_after:
            state_ok &= not any(after[k] for k in ['playing','processing','voice','pending','loop'])
        assert after.get('slice') is None
        events=stage.get('endEvents',[]);callback_ok=not events if not ending else len(events)==1 and events[0]['trackId']==music and events[0]['position']==6.8
        deadline_error=None;deadline_ok=True
        if ending:
            expected_end=stage['before']['anchorTime']+float(beat(6.8)-beat(stage['before']['anchorPosition']))/2
            assert abs(expected_end-stage['backgroundEndAt'])<1e-9
            if events:deadline_error=events[0]['at']-expected_end
            if name=='keyed-preparation-crosses-end':
                assert stage['releaseAt']['at']<expected_end
                deadline_ok=deadline_error is not None and -1/r['sampleRate']<=deadline_error<r['criteria']['maximumEndDeadlineLateness']
        packets=[]
        for kind in ['heldPCM','afterPCM']:
            if kind not in stage:continue
            for packet in stage[kind]:
                data=base64.b64decode(packet['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==packet['sha256']
                x=np.frombuffer(data,'<f4').astype(float);assert len(x)==packet['frames']==13230 and np.isfinite(x).all() and not packet['errors'],packet['errors']
                cursor=packet['startFrame']
                for i,q in enumerate(packet['quanta']):
                    assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(packet['quanta'])-1);cursor+=q['count']
                assert cursor==packet['startFrame']+len(x)
                rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));positive=kind=='heldPCM' or positive_after
                assert rms>r['criteria']['minimumRMS'] if positive else peak<r['criteria']['maximumStoppedPeak']
                row=dict(kind=kind,channel=packet['channel'],frames=len(x),rms=rms,peak=peak,sha256=packet['sha256'],contiguousQuanta=len(packet['quanta']))
                if kind=='heldPCM':
                    assert stage['held']['mask']==[False,True,True,True] and np.allclose(stage['held']['gains'],[0,0,1,1,1],atol=1e-7,rtol=0)
                    if name.startswith('raw'):
                        window=(np.arange(len(x))>=2205)&(np.arange(len(x))<11025);times=(np.arange(len(x))[window]+packet['startFrame'])/44100
                        positions=clock(stage['held'],times)*44100;index=np.floor(positions).astype(int);fraction=positions-index
                        expected=sum(stems[n][index,packet['channel']]*(1-fraction)+stems[n][index+1,packet['channel']]*fraction for n in ['other','bass','drums'])
                        relative=float(np.sqrt(np.mean((x[window]-expected)**2))/np.sqrt(np.mean(expected**2)));row['rawRelativeRMSError']=relative;row['rawSelectedSliceAudioCorrect']=relative<1e-4
                packets.append(row)
        observations.append(dict(name=name,terminalOrLifecycleStateCorrect=bool(state_ok),naturalEndCallbackCorrect=bool(callback_ok),naturalEndCount=len(events),endEventMinusBackgroundEnd=deadline_error,preparationDeadlineCorrect=bool(deadline_ok),autoplayTargetIsGeneratedLibraryControl=bool(stage.get('autoplay')),packets=packets))
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']]==['early-release','replacement-late-release','raw-expired','keyed-expired','keyed-preparation-crosses-end','keyed-end-repeat','raw-end-autoplay']
    passed=bool(r['workflowCompleted'] and not r['errors'] and all(s['terminalOrLifecycleStateCorrect'] and s['naturalEndCallbackCorrect'] and s['preparationDeadlineCorrect'] and all(p.get('rawSelectedSliceAudioCorrect',True) for p in s['packets']) for s in observations))
    return dict(checkpoint=166,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],criteria=r['criteria'],rawReferenceCriterion={'windowSeconds':[.05,.25],'maximumRelativeRMS':1e-4,'alignment':'Known selected exports/observed anchor/independent grid, no fitting.'},observations=observations,errors=r['errors'],failureState=r.get('failureState'),default48000Acceptance=False,musicalPitchAccuracyAccepted=False,sourceAttributionAccepted=False,exactSeratoParityAccepted=False,seamlessTransitionAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as out:json.dump(r,out,indent=2,allow_nan=False);out.write('\n')
    print(json.dumps({k:r[k] for k in ['passed','observations','errors']}));raise SystemExit(0 if r['passed'] else 1)
