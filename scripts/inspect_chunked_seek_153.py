#!/usr/bin/env python3
"""Inspect complete recorded-startup replay and global-frame browser comparisons."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def difference(a, b):
    assert len(a) == len(b) and len(a)
    delta = a.astype(float) - b.astype(float)
    return dict(frames=len(a), bitIdentical=a.tobytes() == b.tobytes(),
                nonidenticalSamples=int(np.count_nonzero(a.view('<u4') != b.view('<u4'))),
                maximumAbsoluteDifference=float(np.max(np.abs(delta))),
                rmsDifference=float(np.sqrt(np.mean(delta * delta))))


def inspect(original, browser):
    raw = original.read_bytes(); r = json.loads(raw)
    browser_raw = browser.read_bytes(); b = json.loads(browser_raw)
    assert sha(browser_raw) == r['browserOriginalSHA256']
    assert b['diagnosticCheckpoint'] == r['checkpoint'] == 153
    assert b['sourceBefore'] == b['sourceAfter'] and not b['errors']
    for name, digest in r['sourceHashes'].items():
        assert sha((ROOT / name).read_bytes()) == digest, name
    assert r['observedStartup'] == b['samples'][0]['decks'][1]['remote']['startup']
    assert r['firstRenderFrame'] == r['observedStartup']['firstActiveFrame'] - 128 * r['observedStartup']['inactiveQuantaBeforeFirstActive']
    assert r['minimumHistoryMarginFrames'] >= 0 and r['minimumFutureMarginFrames'] >= 0
    assert r['appendedChunks'] == len(r['chunkLengths'])
    arrays = {}; outputs = []
    for case in r['results']:
        assert case['startup']['firstActiveFrame'] == r['observedStartup']['firstActiveFrame']
        for p in case['pcm']:
            assert Path(p['file']).name == p['file']
            data = (original.parent / p['file']).read_bytes()
            assert sha(data) == p['sha256']
            x = np.frombuffer(data, '<f4')
            assert len(x) == r['frames'] == p['frames'] and np.isfinite(x).all()
            arrays[case['name'], p['channel']] = x
            outputs.append(dict(case=case['name'], channel=p['channel'], frames=len(x), sha256=sha(data)))
    bounded = [dict(channel=c, **difference(arrays['whole', c], arrays['bounded-chunks', c])) for c in [0, 4]]
    traces = {}
    for p in b['pcm']:
        data = base64.b64decode(p['base64'], validate=True)
        assert sha(data) == p['sha256']
        x = np.frombuffer(data, '<f4')
        assert len(x) == p['frames'] and np.isfinite(x).all() and not p['errors']
        cursor = p['startFrame']
        for i, q in enumerate(p['quanta']):
            assert q['frame'] == cursor and (q['count'] == 128 or i == len(p['quanta']) - 1)
            assert 0 < q['count'] <= 128
            cursor += q['count']
        assert cursor == p['startFrame'] + p['frames'] <= round(b['stopAt'] * b['sampleRate'])
        traces[p['trace']] = (p, x)
    assert b['sampleRate'] == r['sampleRate']
    def aligned(trace, channel, start=None, end=None):
        p, x = traces[trace]
        lo = p['startFrame'] if start is None else start
        hi = p['startFrame'] + p['frames'] if end is None else end
        assert p['startFrame'] <= lo < hi <= p['startFrame'] + p['frames']
        assert r['firstRenderFrame'] <= lo < hi <= r['endFrame']
        # Recorded audio-context frames only: no fitted offset, gain or phase.
        return dict(trace=trace, channel=channel, startFrame=lo, endFrame=hi,
                    **difference(arrays['whole', channel][lo-r['firstRenderFrame']:hi-r['firstRenderFrame']],
                                 x[lo-p['startFrame']:hi-p['startFrame']]))
    start = round((b['generations'][0]['returnedAt'] + .3) * r['sampleRate'])
    end = round((b['generations'][1]['startedAt'] - .2) * r['sampleRate'])
    browser_comparisons = [aligned('deck1-original', 0), aligned('deck1-original', 0, start, end),
                           aligned('deck1-bank0-melody', 4, start, end)]
    assert all(x['bitIdentical'] for x in bounded + browser_comparisons)
    return dict(checkpoint=153, scope=r['scope'], originalSHA256=sha(raw), browserOriginalSHA256=sha(browser_raw),
                sourceHashes=r['sourceHashes'], frames=r['frames'], recordedStartup=r['observedStartup'],
                firstRenderFrameDerivedFromRecordedActiveHistory=r['firstRenderFrame'],
                appendedChunks=r['appendedChunks'], dropOperations=r['dropOperations'],
                oneFrameChunks=r['chunkLengths'].count(1), minimumHistoryMarginFrames=r['minimumHistoryMarginFrames'],
                minimumFutureMarginFrames=r['minimumFutureMarginFrames'], outputs=outputs,
                wholeVersusBounded=bounded, browserComparisons=browser_comparisons,
                comparisonPolicy='Full retained component PCM; browser alignment uses recorded global frames only. Steady interval is first readiness +300ms to second preparation -200ms. No fitted audio/time/gain corrections.',
                allDeclaredComparisonsBitIdentical=True, original151FailureStillOpen=True,
                asynchronousBrowserReplacementReproduced=False, fullParityAcceptance=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original', type=Path)
    parser.add_argument('browser', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    result = inspect(args.original, args.browser)
    with args.output.open('x') as target:
        target.write(json.dumps(result, indent=2, allow_nan=False) + '\n')
    print(json.dumps({k: result[k] for k in ['frames', 'appendedChunks', 'dropOperations', 'oneFrameChunks',
                                           'wholeVersusBounded', 'browserComparisons', 'allDeclaredComparisonsBitIdentical']}, indent=2))
