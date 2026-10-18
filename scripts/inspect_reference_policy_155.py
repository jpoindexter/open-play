#!/usr/bin/env python3
"""Inspect recorded-quantum replacement controls without fitted audio alignment."""
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
    return float(np.sqrt(np.mean(x.astype(float) ** 2)))


def compare(a, b, first_frame):
    assert len(a) == len(b) and len(a) and np.isfinite(a).all() and np.isfinite(b).all()
    delta = a.astype(float) - b.astype(float)
    differing = np.flatnonzero(a.view('<u4') != b.view('<u4'))
    return dict(frames=len(a), bitIdentical=not len(differing), nonidenticalSamples=len(differing),
                maximumAbsoluteDifference=float(np.max(np.abs(delta))), rmsDifference=rms(delta),
                firstDifferentGlobalFrame=int(first_frame + differing[0]) if len(differing) else None,
                lastDifferentGlobalFrame=int(first_frame + differing[-1]) if len(differing) else None)


def inspect(original, browser):
    raw = original.read_bytes(); r = json.loads(raw)
    browser_raw = browser.read_bytes(); b = json.loads(browser_raw)
    assert sha(browser_raw) == r['browserOriginalSHA256'] and b['diagnosticCheckpoint'] == 154 and r['checkpoint'] == 155
    assert b['sourceBefore'] == b['sourceAfter'] and b['workflowCompleted'] and not b['errors']
    for name, digest in r['sourceHashes'].items():
        assert sha((ROOT / name).read_bytes()) == digest, name
    sr = r['sampleRate']; cases = []
    for case in r['cases']:
        deck = case['deck']; first = case['firstRenderFrame']; arrays = {}; hashes = []; future = []
        observed = b['samples'][0]['decks'][deck]['remote']['startup']
        assert observed == case['observedStartup']
        assert first == observed['firstActiveFrame'] - observed['inactiveQuantaBeforeFirstActive'] * 128
        calls = sorted([c for c in b['calls'] if c['deck'] == deck], key=lambda c: c['appliedRenderQuanta'])
        assert calls == case['recordedCalls'] and len(calls) == case['replacementCount']
        assert all(c['appliedFrame'] == first + 128 * c['appliedRenderQuanta'] for c in calls)
        for result in case['results']:
            expected = calls if result['name'] == 'both-recorded-banks' else [c for c in calls if c['firstChannel'] == 2]
            assert result['acknowledgments'] == [{k: c[k] for k in ['startFrame', 'endFrame', 'firstChannel', 'channels', 'appliedFrame', 'appliedRenderQuanta']} for c in expected]
            availability = result.get('futureSourceAvailability', [])
            if availability:
                last = next(c for c in reversed(calls) if c['firstChannel'] == 2)
                assert availability[0]['startFrame'] == last['endFrame']
                assert all(a['firstChannel'] == 2 and a['channels'] == 8 and a['appliedFrame'] == last['appliedFrame'] and
                           a['appliedRenderQuanta'] == last['appliedRenderQuanta'] for a in availability)
                assert all(a['endFrame'] == b['startFrame'] for a, b in zip(availability, availability[1:]))
                command = observed['firstActiveCommand']
                first_seek_visibility = (last['endFrame']/sr-command['input']-observed['inputLatencySeconds'])/command['rate']-observed['outputLatencySeconds']+command['output']
                assert last['appliedFrame']/sr < first_seek_visibility
                future.append(dict(case=result['name'], syntheticOperations=len(availability), startFrame=availability[0]['startFrame'],
                                   endFrame=availability[-1]['endFrame'], availableAtFrame=last['appliedFrame'], firstSeekVisibilitySeconds=first_seek_visibility))
            for p in result['pcm']:
                assert Path(p['file']).name == p['file']
                data = (original.parent / p['file']).read_bytes()
                assert sha(data) == p['sha256']
                x = np.frombuffer(data, '<f4')
                assert len(x) == case['frames'] == p['frames'] and np.isfinite(x).all()
                arrays[result['name'], p['channel']] = x
                hashes.append(dict(case=result['name'], channel=p['channel'], frames=len(x), sha256=sha(data)))
        active = [dict(channel=c, **compare(arrays['first-bank-only', c], arrays['both-recorded-banks', c], first)) for c in [0, 4]]
        start = round((b['generations'][1]['startedAt'] - .2) * sr)
        end = round((b['generations'][1]['returnedAt'] + .2) * sr)
        baseline = round((b['generations'][0]['returnedAt'] + .3) * sr)
        ratios = []
        for name in ['first-bank-only', 'both-recorded-banks']:
            for channel in [0, 4]:
                x = arrays[name, channel]
                base = rms(x[baseline-first:baseline-first+round(.2*sr)])
                assert base > .005 and 0 <= start-first < end-first <= len(x)
                step = round(.01 * sr)
                values = [rms(x[i:i+step])/base for i in range(start-first, end-first-step, step)]
                ratios.append(dict(case=name, channel=channel, baselineRMS=base, minimum10msRMSRatio=min(values),
                                   minimumAt=(start + int(np.argmin(values)) * step)/sr))
        assert not np.count_nonzero(arrays['first-bank-only', 12])
        new_bank_rms = rms(arrays['both-recorded-banks', 12][round((b['generations'][1]['returnedAt']+.3)*sr)-first:round((b['generations'][1]['returnedAt']+.5)*sr)-first])
        assert new_bank_rms > .005
        browser_comparisons = []
        if deck == 1:
            for channel, trace in [(0, 'deck1-original'), (4, 'deck1-bank0-melody'), (12, 'deck1-bank1-melody')]:
                p = next(p for p in b['pcm'] if p['trace'] == trace)
                data = base64.b64decode(p['base64'], validate=True)
                assert sha(data) == p['sha256'] and not p['errors']
                x = np.frombuffer(data, '<f4'); assert len(x) == p['frames']
                cursor = p['startFrame']
                for i, quantum in enumerate(p['quanta']):
                    assert quantum['frame'] == cursor and 0 < quantum['count'] <= 128
                    assert quantum['count'] == 128 or i == len(p['quanta'])-1
                    cursor += quantum['count']
                assert cursor == p['startFrame']+len(x) <= round(b['stopAt']*sr)
                lo = p['startFrame']-first; hi = lo+len(x)
                assert 0 <= lo < hi <= case['frames']
                browser_comparisons.append(dict(trace=trace, channel=channel, **compare(arrays['both-recorded-banks', channel][lo:hi], x, p['startFrame'])))
        cases.append(dict(deck=deck, keyShift=case['keyShift'], observedStartup=observed, firstRenderFrame=first,
                          replacementCount=len(calls), recordedFirstBankCalls=sum(c['firstChannel'] == 2 for c in calls),
                          recordedSecondBankCalls=sum(c['firstChannel'] == 10 for c in calls), outputHashes=hashes,
                          syntheticFutureSourceAvailability=future,
                          activeControlTreatment=active, ratios=ratios, newBankPositiveControlRMS=new_bank_rms,
                          browserComparisons=browser_comparisons,
                          inactivePopulationChangedObservedActiveOutputs=any(not c['bitIdentical'] for c in active)))
    return dict(checkpoint=155, variant=r['variant'], buildRecord=r['buildRecord'], scope=r['scope'], originalSHA256=sha(raw), browserOriginalSHA256=sha(browser_raw),
                sourceHashes=r['sourceHashes'], inspection=dict(baselineStart=b['generations'][0]['returnedAt']+.3,
                baselineSeconds=.2, intervalStart=start/sr, intervalEnd=end/sr, windowSeconds=.01,
                alignment='Recorded global frames only. Complete component PCM and three full browser raw streams; no offset/gain/phase fitting.'), cases=cases,
                allActiveControlsBitIdentical=all(c['bitIdentical'] for case in cases for c in case['activeControlTreatment']),
                allComparedBrowserStreamsBitIdentical=all(c['bitIdentical'] for case in cases for c in case['browserComparisons']),
                original151FailureStillOpen=True, rootCauseResolved=False, fullParityAcceptance=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original', type=Path); parser.add_argument('browser', type=Path); parser.add_argument('output', type=Path)
    args = parser.parse_args(); result = inspect(args.original, args.browser)
    with args.output.open('x') as output:
        output.write(json.dumps(result, indent=2, allow_nan=False)+'\n')
    print(json.dumps({k: result[k] for k in ['allActiveControlsBitIdentical', 'allComparedBrowserStreamsBitIdentical', 'cases']}, indent=2))
