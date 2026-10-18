#!/usr/bin/env python3
"""Inspect whole mixed-deck captures with fixed, event-relative audio windows."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CRITERIA = dict(captureSeconds=4, minimum10msRMSRatio=.85,
                maximumAdjacentJump=.03, maximumNearZeroRunSeconds=.001,
                nearZeroAbsolute=1e-7, firstMuteWindowStartSeconds=.03,
                firstMuteWindowEndSeconds=.08, maximumFirstMuteRMS=.0001)


def inspect(path, sources):
    raw = path.read_bytes()
    r = json.loads(raw)
    assert r['workflowCompleted'] and not r['errors'] and r['originalUnchanged']
    assert r['sourceStable'] and r['sourceBefore'] == r['sourceAfter']
    assert r['criteria'] == CRITERIA
    for name, digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest() == digest, name
    assert r['initialLive']['groups'][0]['processorChannels'] == 18
    assert r['cancel']['warmupObserved'] and r['cancel']['error'] == 'AbortError'
    assert r['cancel']['sameOwners'] == [True, True]
    assert r['cancel']['cacheAbsent'] and r['cancel']['stageCleared']
    assert r['retry']['sameOwners'] == [True, False] and r['retry']['cachePublished']
    assert r['initialLive']['groups'][0]['id'] == r['retry']['live']['groups'][0]['id']
    assert [p['enabled'] for p in r['firstPads']] == [[False, True, True, True]]*2
    sr = r['sampleRate']
    packets = r['pcm']
    assert len(packets) == 4 and len({p['startFrame'] for p in packets}) == 1
    rows = []
    for p in packets:
        data = base64.b64decode(p['base64'], validate=True)
        assert hashlib.sha256(data).hexdigest() == p['sha256']
        x = np.frombuffer(data, '<f4').astype(float)
        assert len(x) == p['frames'] == round(4*sr)
        assert np.isfinite(x).all() and not p['errors']
        cursor = p['startFrame']
        for i, q in enumerate(p['quanta']):
            assert q['frame'] == cursor and 0 < q['count'] <= 128
            assert q['count'] == 128 or i == len(p['quanta'])-1
            cursor += q['count']
        assert cursor == p['startFrame'] + len(x)

        def window(start, end):
            a, b = round(start*sr)-p['startFrame'], round(end*sr)-p['startFrame']
            assert 0 <= a < b <= len(x), (a, b, len(x))
            return x[a:b]

        def rms(v):
            return float(np.sqrt(np.mean(v*v)))

        start = p['startFrame']/sr
        baseline = rms(window(start+.05, start+.15))
        assert baseline > .005
        pad = r['firstPads'][p['deck']]['at']
        continuous = window(start+.05, pad)
        step = round(.01*sr)
        ratios = [rms(continuous[i:i+step])/baseline
                  for i in range(0, len(continuous)-step, step)]
        edges = np.diff(np.r_[False, np.abs(continuous) < 1e-7, False].astype(int))
        longest = int(max(np.where(edges == -1)[0]-np.where(edges == 1)[0], default=0))/sr
        jump = float(np.max(np.abs(np.diff(continuous))))
        first = window(pad+.03, pad+.08)
        later = window(pad+.16, pad+.25)
        restored = window(r['restoreAt']+.03, r['restoreAt']+.20)
        stopped = window(r['stopAt']+.10, r['stopAt']+.25)
        first_rms = rms(first)
        row = dict(deck=p['deck'],channel=p['channel'],frames=len(x),
                   sha256=p['sha256'],contiguousQuanta=len(p['quanta']),baselineRMS=baseline,
                   minimum10msRMSRatio=min(ratios),maximumAdjacentJump=jump,
                   longestNearZeroRunSeconds=longest,firstMuteRMS=first_rms,
                   laterMutePeak=float(np.max(np.abs(later))),restoredRMS=rms(restored),
                   stoppedPeak=float(np.max(np.abs(stopped))))
        row['continuityPassed'] = min(ratios) >= .85 and jump <= .03 and longest <= .001
        row['firstPadPassed'] = first_rms <= .0001
        row['laterMuteRestoreStopPassed'] = row['laterMutePeak'] < 1e-7 and row['restoredRMS'] > .005 and row['stoppedPeak'] < 1e-7
        row['passed'] = all(row[k] for k in ['continuityPassed','firstPadPassed','laterMuteRestoreStopPassed'])
        rows.append(row)
    return dict(checkpoint=148,passed=all(row['passed'] for row in rows),
                scope=r['scope'],criteria=CRITERIA,sampleRate=sr,channels=rows,
                originalSHA256=hashlib.sha256(raw).hexdigest(),originalBytes=len(raw),
                sourceHashes=r['sourceBefore'],sourceStable=True,
                cancelledMixedOwnersRetained=True,originalDecodedAudioUnchanged=True,
                retry=r['retry'],firstPads=r['firstPads'],
                inspection='Every original sample finite/hash/quantum checked. Continuity from capture+50ms until actual pad, 10ms windows against fixed capture+50–150ms baseline. Actual pad+30–80ms mute response; later+160–250ms, restore+30–200ms, Stop+100–250ms. No fitted time/gain/pitch or PCM repair.',
                nativeAcceptance=False,hardwareAcceptance=False,
                musicalSeparationQualityAcceptance=False,exactAudibleCursorAcceptance=False,
                fullParityAcceptance=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original',type=Path)
    parser.add_argument('output',type=Path)
    parser.add_argument('--sources',type=Path,default=ROOT/'prototype')
    args = parser.parse_args()
    result = inspect(args.original,args.sources)
    with args.output.open('x') as out:
        json.dump(result,out,indent=2,allow_nan=False)
        out.write('\n')
    print(json.dumps({k:result[k] for k in ['passed','channels']},indent=2))
    raise SystemExit(0 if result['passed'] else 1)
