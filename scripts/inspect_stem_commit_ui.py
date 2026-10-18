#!/usr/bin/env python3
"""Inspect actual Prepare controls and optional complete per-deck PCM."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CRITERIA = dict(captureSeconds=4,minimum10msRMSRatio=.85,maximumAdjacentJump=.03,
                maximumNearZeroRunSeconds=.001,nearZeroAbsolute=1e-7,maximumMutedPeak=1e-7)


def inspect(path,sources):
    raw = path.read_bytes()
    r = json.loads(raw)
    assert r['workflowCompleted'] and not r['errors'] and r['originalUnchanged']
    assert r['sourceStable'] and r['sourceBefore'] == r['sourceAfter']
    assert r['criteria'] == CRITERIA
    for name,digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest() == digest,name
    assert r['initialLive']['groups'][0]['processorChannels'] == 18
    pre,commit,ready = r['precommit'],r['committed'],r['ready']
    assert pre['clicked'] and pre['cancelEnabled'] and pre['sameOwners'] == [True,True] and pre['cacheAbsent']
    assert ready['sameOwners'] == [True,False] and ready['playing'] == [True,True]
    assert r['job']['state'] == 'complete' and r['job']['model'] == 'SCNet-large official'
    controls = dict(warmupCancelAvailable=True,warmupOwnersAndCachePreserved=True,
                    committedCancelDisabled=commit['cancelDisabled'],
                    committedPrepareAndTrashDisabled=commit['queueDisabled'] and commit['clearDisabled'],
                    committedClickIgnored=commit['clickEvents'] == 0 and not commit['signalAbortedAfterClick'],
                    committedStatusExplicit=commit['status'].startswith('Finishing audio handover'),
                    readyControlsRestored=not any(ready[k] for k in ['cancelDisabled','queueDisabled','clearDisabled']),
                    readyAfterAudibleHandover=r['attachReturnedAt'] >= commit['handoffUntil']+.01,
                    readyStatusExplicit=ready['status'].startswith('Ready'))
    assert bool(r['controlsPassed']) == all(controls.values())
    rows = []
    if r['captureAudio']:
        packets = r['pcm'];sr = r['sampleRate']
        assert len(packets) == 4 and len({p['startFrame'] for p in packets}) == 1
        assert r['muted'] == [[False]*4]*2
        for p in packets:
            data = base64.b64decode(p['base64'],validate=True)
            assert hashlib.sha256(data).hexdigest() == p['sha256']
            x = np.frombuffer(data,'<f4').astype(float)
            assert len(x) == p['frames'] == round(4*sr) and np.isfinite(x).all() and not p['errors']
            cursor = p['startFrame']
            for i,q in enumerate(p['quanta']):
                assert q['frame'] == cursor and 0 < q['count'] <= 128
                assert q['count'] == 128 or i == len(p['quanta'])-1
                cursor += q['count']
            assert cursor == p['startFrame']+len(x)
            def window(a,b):
                start,end = round(a*sr)-p['startFrame'],round(b*sr)-p['startFrame']
                assert 0 <= start < end <= len(x),(start,end,len(x))
                return x[start:end]
            def rms(v):
                return float(np.sqrt(np.mean(v*v)))
            start = p['startFrame']/sr
            baseline = rms(window(start+.05,start+.15));assert baseline > .005
            continuous = window(start+.05,r['muteAt'])
            step = round(.01*sr)
            ratios = [rms(continuous[i:i+step])/baseline for i in range(0,len(continuous)-step,step)]
            edges = np.diff(np.r_[False,np.abs(continuous)<1e-7,False].astype(int))
            longest = int(max(np.where(edges == -1)[0]-np.where(edges == 1)[0],default=0))/sr
            jump = float(np.max(np.abs(np.diff(continuous))))
            muted = window(r['muteAt']+.10,r['muteAt']+.20)
            restored = window(r['restoreAt']+.10,r['restoreAt']+.20)
            stopped = window(r['stopAt']+.10,r['stopAt']+.25)
            row = dict(deck=p['deck'],channel=p['channel'],frames=len(x),sha256=p['sha256'],
                       contiguousQuanta=len(p['quanta']),baselineRMS=baseline,
                       minimum10msRMSRatio=min(ratios),maximumAdjacentJump=jump,
                       longestNearZeroRunSeconds=longest,mutedPeak=float(np.max(np.abs(muted))),
                       restoredRMS=rms(restored),stoppedPeak=float(np.max(np.abs(stopped))))
            row['passed'] = min(ratios) >= .85 and jump <= .03 and longest <= .001 and row['mutedPeak'] < 1e-7 and row['restoredRMS'] > .005 and row['stoppedPeak'] < 1e-7
            rows.append(row)
    else:
        assert 'pcm' not in r
    return dict(checkpoint=149,passed=all(controls.values()) and all(row['passed'] for row in rows),
                scope=r['scope'],controls=controls,committed=commit,ready=ready,precommit=pre,
                audioCaptured=r['captureAudio'],channels=rows,criteria=CRITERIA,
                sampleRate=r['sampleRate'],attachReturnedAt=r['attachReturnedAt'],readyAt=r['readyAt'],
                originalSHA256=hashlib.sha256(raw).hexdigest(),originalBytes=len(raw),
                sourceHashes=r['sourceBefore'],sourceStable=True,originalDecodedAudioUnchanged=True,
                model=r['job']['model'],completedJob=r['ready']['job'],
                inspection='Whole retained samples finite/hash/quantum checked. Audio starts after the warm-up Cancel; continuity capture+50ms to actual mute with fixed+50–150ms baseline. Mute/restore+100–200ms, Stop+100–250ms. No fitting/PCM repair or threshold relaxation.',
                nativeAcceptance=False,hardwareAcceptance=False,musicalSeparationQualityAcceptance=False,
                exactAudibleCursorAcceptance=False,fullParityAcceptance=False)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('original',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--sources',type=Path,default=ROOT/'prototype')
    args = p.parse_args();r = inspect(args.original,args.sources)
    with args.output.open('x') as f:
        json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({k:r[k] for k in ['passed','controls','audioCaptured','channels']},indent=2))
    raise SystemExit(0 if r['passed'] else 1)
