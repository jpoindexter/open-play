#!/usr/bin/env python3
"""Inspect all eleven complete reference-policy browser streams and real controls."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def rms(x):
    return float(np.sqrt(np.mean(x.astype(float)**2)))


def longest_zero(x, threshold):
    mask = np.abs(x) < threshold
    padded = np.r_[False, mask, False].astype(int)
    return int(max(np.flatnonzero(np.diff(padded) == -1)-np.flatnonzero(np.diff(padded) == 1), default=0))


def decode(packet, frames):
    data = base64.b64decode(packet['base64'], validate=True)
    assert sha(data) == packet['sha256'], packet['trace']+' hash'
    x = np.frombuffer(data, '<f4').astype(float)
    assert len(x) == packet['frames'] == frames and np.isfinite(x).all()
    cursor = packet['startFrame']
    issues = []
    for i, q in enumerate(packet['quanta']):
        assert 0 < q['count'] <= 128 and (q['count'] == 128 or i == len(packet['quanta'])-1)
        if q['frame'] != cursor:
            issues.append(dict(quantum=i, expected=cursor, actual=q['frame']))
        cursor += q['count']
    assert cursor == packet['startFrame']+len(x)
    return x, dict(trace=packet['trace'], frames=len(x), sha256=packet['sha256'],
                   quanta=len(packet['quanta']), clockIssues=issues, producerErrors=packet['errors'],
                   wholeCaptureIntegrityPassed=not issues and not packet['errors'])


def inspect(path, source_root=ROOT/'prototype'):
    raw = path.read_bytes(); r = json.loads(raw); sr = r['sampleRate']
    assert r['diagnosticCheckpoint'] == 155 and r['workflowCompleted'] and r['sourceStable'] and not r['errors']
    assert r['sourceBefore'] == r['sourceAfter'] and r['originalUnchanged']
    for name, digest in r['sourceBefore'].items():
        assert sha((source_root/name).read_bytes()) == digest, name
    assert [g['banks'] for g in r['generations']] == [[0]*4, [1]*4, [0]*4]
    assert all(all(g['sameOwners']) for g in r['generations'])
    assert r['criteria']['minimum10msRMSRatio'] == .85 and r['criteria']['maximumAdjacentJump'] == .03
    assert r['criteria']['maximumNearZeroRunSeconds'] == .001 and r['criteria']['nearZeroAbsolute'] == 1e-7
    assert len(r['pcm']) == 7 and len(r['transportPcm']) == 4
    arrays = {}; integrity = []
    for packet in r['pcm']+r['transportPcm']:
        x, status = decode(packet, (6 if packet in r['transportPcm'] else 12)*sr)
        arrays[packet['trace']] = (packet, x); integrity.append(status)
    complete = all(row['wholeCaptureIntegrityPassed'] for row in integrity)
    rows = []
    if complete:
        def window(trace, start, end):
            p, x = arrays[trace]; lo = round(start*sr)-p['startFrame']; hi = round(end*sr)-p['startFrame']
            assert 0 <= lo < hi <= len(x), (trace, start, end)
            return x[lo:hi]
        mute = next(e['at'] for e in r['transportEvents'] if e['type'] == 'mute')
        restore = next(e['at'] for e in r['transportEvents'] if e['type'] == 'restore')
        assert r['generations'][2]['returnedAt']+.2 < mute < restore < r['stopAt']
        for deck in range(4):
            monitor = f'deck{deck}-monitor'; transport = f'deck{deck}-transport'
            baseline_start = r['generations'][0]['returnedAt']+.3
            baseline = rms(window(monitor, baseline_start, baseline_start+.2)); assert baseline > .005
            intervals = []
            for gen, trace in [(r['generations'][1], monitor), (r['generations'][2], transport)]:
                start, end = gen['startedAt']-.2, gen['returnedAt']+.2
                # Third preparation begins just after capture is armed. Its
                # declared interval starts at capture start, never by fitted audio.
                if trace == transport:
                    start = max(start, arrays[trace][0]['startFrame']/sr)
                x = window(trace, start, end); step = round(.01*sr)
                ratios = [rms(x[i:i+step])/baseline for i in range(0, len(x)-step, step)]
                jump = float(np.max(np.abs(np.diff(x))))
                zero = longest_zero(x, 1e-7)/sr
                intervals.append(dict(generation=gen['generation'], trace=trace, start=start, end=end,
                                      minimum10msRMSRatio=min(ratios), maximumAdjacentJump=jump,
                                      longestNearZeroRunSeconds=zero,
                                      passed=min(ratios)>=.85 and jump<=.03 and zero<=.001))
            muted = window(transport, mute+.05, mute+.25)
            restored = window(transport, restore+.05, restore+.25)
            stopped = window(transport, r['stopAt']+.10, r['stopAt']+.30)
            stop_tail = window(transport, r['stopAt']+.10,
                               (arrays[transport][0]['startFrame']+arrays[transport][0]['frames'])/sr)
            # The steady input is an authored tone, with a fixed500ms Hann FFT.
            steady = window(monitor, baseline_start, baseline_start+.5)
            magnitude = np.abs(np.fft.rfft(steady*np.hanning(len(steady))))
            peak = int(np.argmax(magnitude[1:])+1)
            assert 0 < peak < len(magnitude)-1
            bins = np.log(np.maximum(magnitude[peak-1:peak+2], 1e-30))
            delta = .5*(bins[0]-bins[2])/(bins[0]-2*bins[1]+bins[2])
            hz = (peak+delta)*sr/len(steady); expected = 330*2**(r['transport'][deck]['keyShift']/12)
            carrier_ok = bool(abs(hz-expected)/expected <= .01)
            controls = dict(allPadMuteMaximumAbsolute=float(np.max(np.abs(muted))),
                            bitZeroMuteObserved=bool(np.max(np.abs(muted)) == 0),
                            muteBelowExistingNearZeroBound=bool(np.max(np.abs(muted)) < r['criteria']['nearZeroAbsolute']),
                            restoredRMS=rms(restored), stop100To300msMaximumAbsolute=float(np.max(np.abs(stopped))),
                            entireRemainingStopTailMaximumAbsolute=float(np.max(np.abs(stop_tail))),
                            carrierHz=float(hz), expectedCarrierHz=expected, carrierWithinOnePercent=carrier_ok)
            passed = all(i['passed'] for i in intervals) and controls['allPadMuteMaximumAbsolute'] == 0 and controls['restoredRMS'] > .005 and controls['entireRemainingStopTailMaximumAbsolute'] == 0 and carrier_ok
            core = all(i['passed'] for i in intervals) and controls['restoredRMS'] > .005 and controls['entireRemainingStopTailMaximumAbsolute'] == 0 and carrier_ok
            rows.append(dict(deck=deck, baselineRMS=baseline, intervals=intervals, controls=controls,
                             continuityCarrierRestoreStopPassed=core, passed=passed))
    return dict(checkpoint=155, scope=r['scope'], originalBytes=len(raw), originalSHA256=sha(raw),
                sourceHashes=r['sourceBefore'], dspPolicy=r['dspPolicy'], sourceStable=True,
                integrity=integrity, wholeCaptureIntegrityPassed=complete, decks=rows,
                criteria=r['criteria'], workflowBanks=[g['banks'] for g in r['generations']],
                observedControlEvents=r['transportEvents'], stopAt=r['stopAt'],
                inspection='All11complete streams finite/hash/quantum/producer-error checked. No fitting/cropping/PCM repair. Declared second/third preparation intervals; mute/restore+50–250ms, Stop+100–300ms plus entire remaining tail. Steady500ms carrier only; left channels/authored fixture, not model/music/native/hardware/reference acceptance.',
                declaredPlaybackCriterionPassed=complete and len(rows)==4 and all(row['passed'] for row in rows),
                continuityCarrierRestoreStopPassed=complete and len(rows)==4 and all(row['continuityCarrierRestoreStopPassed'] for row in rows),
                exactPostMixMuteCriterionPassed=complete and len(rows)==4 and all(row['controls']['bitZeroMuteObserved'] for row in rows),
                allMutesBelowExistingNearZeroBound=complete and len(rows)==4 and all(row['controls']['muteBelowExistingNearZeroBound'] for row in rows),
                prior151FailureStillOpen=True, fullParityAcceptance=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('original', type=Path); parser.add_argument('output', type=Path)
    parser.add_argument('--source-root', type=Path, default=ROOT/'prototype', help='Exact executed prototype source or preserved source capsule')
    args = parser.parse_args(); result = inspect(args.original, args.source_root)
    with args.output.open('x') as output:
        output.write(json.dumps(result, indent=2, allow_nan=False)+'\n')
    print(json.dumps({k: result[k] for k in ['wholeCaptureIntegrityPassed', 'declaredPlaybackCriterionPassed', 'decks']}, indent=2))
    raise SystemExit(0 if result['declaredPlaybackCriterionPassed'] else 1)
