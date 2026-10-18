#!/usr/bin/env python3
"""Inspect immutable musical pending-rate Slicer lifecycle recordings."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from inspect_slicer_warp_164 import beat
from inspect_slicer_tempo_167 import source_time


def inspect(path, sources):
    raw=path.read_bytes();r=json.loads(raw);root=Path(__file__).resolve().parents[1]
    assert r['diagnosticCheckpoint']==168 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    assert r['sampleRate']==44100 and r['input']==dict(frames=299880,sampleRate=44100,channels=2,duration=6.8)
    assert hashlib.sha256((root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes()).hexdigest()==r['import']['contentHash']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['ready']['job']=='8266a41f62fc4fc5b92808dd3d988cec'
    job=root/'local-evidence/stem-jobs'/r['ready']['job'];m=json.loads((job/'output/manifest.json').read_bytes())
    assert m['model']=='SCNet-large official' and hashlib.sha256((job/'input.wav').read_bytes()).hexdigest()==m['source_sha256']
    for s in m['stems']:assert hashlib.sha256((job/'output'/s['file']).read_bytes()).hexdigest()==s['sha256']
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']]==['pending-rate-release','pending-rate-stop','expired-pending-rate-release']
    rows=[]
    for s in r['stages']:
        before,held,pending,after=s['before'],s['held'],s['pending'],s['after'];stopped=s['stop'] or s['expired']
        assert pending['processing'] and pending['pending'] and pending['slice']==0 and pending['keylock'] and pending['keyShift']==3
        assert all(snap['trackId']==r['import']['id'] and snap['mask']==[False,True,True,True] for snap in [before,held,pending,after])
        assert np.allclose(held['gains'],[0,0,1,1,1],atol=1e-7,rtol=0)
        state_ok=after['slice'] is None and not any(after[k] for k in ['loop','pending','processing'])
        clock_error=None;expected=None;end_delay=None
        if stopped:
            state_ok &= not after['playing'] and not after['voice']
            if s['expired']:
                state_ok &= after['position']==6.8
            else:
                assert not s['stopped']['playing'] and not s['stopped']['processing']
                clock_error=abs(after['position']-s['stopped']['position']);state_ok &= clock_error<1e-8
        else:
            state_ok &= after['playing'] and after['voice'] and abs(after['rate']-1.06)<1e-8
            handoff=next((h for h in s['handoffs'] if h['gridBPM'] is not None and abs(h['gridBPM']-127.2)<1e-8),None)
            assert handoff is not None,'Missing observed actual tempo anchor'
            when=handoff['anchorTime'];expected=source_time(float(beat(before['anchorPosition']))+(when-before['anchorTime'])*2+(after['at']-when)*2.12)
            clock_error=abs(after['position']-expected);state_ok &= clock_error<r['criteria']['maximumPositionError']
        events=s['endEvents'];end_ok=not events
        if s['expired']:
            end_ok=len(events)==1 and events[0]['trackId']==r['import']['id'] and events[0]['position']==6.8
            if events:end_delay=events[0]['at']-s['releaseAt']['at']
            end_ok &= end_delay is not None and -1/44100<=end_delay<r['criteria']['maximumEndDeadlineLateness']
        notice_ok=not any(text in s['noticeAfter'] for text in ['Synced tempo preparation superseded','Invalid synchronized source position','Invalid loop transition position','Slicer background reached its endpoint'])
        packets=[]
        for kind in ['heldPCM','afterPCM']:
            for p in s[kind]:
                data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256']
                x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==13230 and np.isfinite(x).all() and not p['errors']
                cursor=p['startFrame']
                for i,q in enumerate(p['quanta']):
                    assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
                assert cursor==p['startFrame']+len(x)
                rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));positive=kind=='heldPCM' or not stopped
                assert rms>r['criteria']['minimumRMS'] if positive else peak<r['criteria']['maximumStoppedPeak']
                packets.append(dict(kind=kind,channel=p['channel'],frames=len(x),contiguousQuanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak))
        rows.append(dict(name=s['name'],pendingPreparationObserved=True,terminalOrReleaseStateCorrect=bool(state_ok),expectedSourcePosition=expected,observedSourcePosition=after['position'],sourceClockErrorSeconds=clock_error,naturalEndCorrect=bool(end_ok),naturalEndCount=len(events),expiredEndCallbackDelayAfterRelease=end_delay,cancellationNoticeCorrect=notice_ok,notice=s['noticeAfter'],packets=packets))
    passed=bool(r['workflowCompleted'] and not r['errors'] and len(rows)==3 and all(s['terminalOrReleaseStateCorrect'] and s['naturalEndCorrect'] and s['cancellationNoticeCorrect'] for s in rows))
    return dict(checkpoint=168,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],criteria=r['criteria'],observations=rows,errors=r['errors'],default48000Acceptance=False,musicalPitchQualityAccepted=False,sourceAttributionAccepted=False,exactSeratoParityAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({k:r[k] for k in ['passed','observations','errors']}));raise SystemExit(0 if r['passed'] else 1)
