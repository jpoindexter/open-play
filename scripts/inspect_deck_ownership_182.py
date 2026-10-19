#!/usr/bin/env python3
"""Whole native PCM and actual ownership after deck-led Sync cancellation."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from inspect_deck_playing_182 import pcm, actual_deck, interp

def inspect(path, sources):
    raw=path.read_bytes(); r=json.loads(raw)
    assert r['diagnosticCheckpoint']==182 and r['cohort']=='deck-ownership'
    assert r['workflowCompleted'] and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    assert not r['errors'] and not r['uiErrors'] and r['inputUnchanged'] and r['decodedUnchanged']
    assert r['context']==dict(sampleRate=48000,requestedSampleRate=None)
    assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    for name,digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    assert [s['name'] for s in r['stages']]==['preparation-own-stop','preparation-load','later-unsynced-raw-play']
    original=[pcm(c) for c in r['inputPCM']['channels']]; rows=[]
    for row in r['stages']:
        cancelled=row['name']!='later-unsynced-raw-play'
        state=True
        if cancelled:
            assert row['boundary']['kind']=='actual-warp-render-request'
            assert row['actionBefore']['deck']['processing'] and row['before']['deck']['playing']
        for snap in [row['after'],row['last']]:
            d=snap['deck']; p=snap['primary']
            state=state and p['playing'] and p['sync'] and p['role']=='primary' and p['voiceID']==r['sourceOwner']
            state=state and not d['processing'] and not d['queued'] and not d['sync'] and d['gridBPM'] is None and not d['hasWarpTransport']
            state=state and (not d['playing'] and d['voiceID'] is None if cancelled else d['playing'] and not d['keylock'] and d['voiceID'] is not None)
        if row['name']=='preparation-load':state=state and row['trackAfter']=='demo-0'
        packets=[]
        for group in ['prePCM','pcm'] if cancelled else ['pcm']:
            assert sorted((p['label'],p['channel']) for p in row[group])==sorted((l,c) for l in ['primary','deck'] for c in [0,1])
            for label in ['primary','deck']:
                assert len({p['startFrame'] for p in row[group] if p['label']==label})==1
            for p in row[group]:
                x=pcm(p); assert len(x)==p['frames']==14400 and not p['errors']
                cursor=p['startFrame']; times=[]
                for i,q in enumerate(p['quanta']):
                    assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1)
                    times.append(q['frame']/48000+np.arange(q['count'])/48000);cursor+=q['count']
                assert cursor==p['startFrame']+len(x)
                rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));relative=None
                silent=cancelled and group=='pcm' and p['label']=='deck'
                accepted=peak<=1e-7 if silent else rms>1e-5
                if not cancelled and p['label']=='deck':
                    pos=actual_deck(row['after']['deck'],np.concatenate(times))
                    want=interp(original[p['channel']],pos*48000)
                    relative=float(np.sqrt(np.mean((x-want)**2))/np.sqrt(np.mean(want**2)))
                    accepted=accepted and relative<=1e-4
                packets.append(dict(group=group,label=p['label'],channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak,relativeRMSError=relative,expectedSilent=silent,accepted=bool(accepted)))
        rows.append(dict(name=row['name'],stateAccepted=bool(state),packets=packets,accepted=bool(state and all(p['accepted'] for p in packets))))
    return dict(checkpoint=182,cohort='deck-ownership',originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],passed=all(x['accepted'] for x in rows),observations=rows,scope='Actual Stop/load during keyed warped deck-led Sync preparation; primary positive audio/owner, settled500ms cancellation silence, later unsynced raw Play/known PCM; exact primary waveform and immediate cancellation transient ungraded',immediateStopTransientAccepted=False,fullTransitionContinuityAccepted=False,pitchQualityAccepted=False,exactVendorRaceSemanticsAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps(dict(passed=r['passed'],originalSHA256=r['originalSHA256'],observations=[dict(name=x['name'],state=x['stateAccepted'],accepted=x['accepted'],packets=[dict(label=p['label'],group=p['group'],peak=p['peak'],relative=p['relativeRMSError'],accepted=p['accepted']) for p in x['packets']]) for x in r['observations']])));raise SystemExit(0 if r['passed'] else 1)
