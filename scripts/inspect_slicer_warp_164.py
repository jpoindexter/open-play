#!/usr/bin/env python3
"""Inspect actual Slicer geometry, backing clock and unmodified musical PCM."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from inspect_reverse_exit_161 import wav


def beat(p):
    p = np.asarray(p)
    return np.where(p < 1, 2*p, np.where(p < 1.8, 2+(p-1)*2.5, 4+(p-1.8)*1.5))


def source(b):
    b = np.asarray(b)
    return np.where(b < 2, b/2, np.where(b < 4, 1+(b-2)/2.5, 1.8+(b-4)/1.5))


def clock(s, times):
    b = beat(s['anchorPosition']) + 2*np.maximum(0, np.asarray(times)-s['anchorTime'])
    if s['loop']:
        start, end = beat(s['loopIn']), beat(s['loopOut'])
        b = np.where(b >= end, start+(b-start) % (end-start), b)
    return source(np.clip(b, 0, beat(6.8)))


def inspect(path, sources):
    raw = path.read_bytes()
    r = json.loads(raw)
    assert r['diagnosticCheckpoint'] == 164 and r['sourceStable']
    assert r['sourceBefore'] == r['sourceAfter']
    for name, digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest() == digest, name
    root = Path(__file__).resolve().parents[1]
    media = root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3'
    assert hashlib.sha256(media.read_bytes()).hexdigest() == r['import']['contentHash'] == 'cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['ready']['job'] == '8266a41f62fc4fc5b92808dd3d988cec'
    assert r['input'] == dict(frames=299880, sampleRate=44100, channels=2, duration=6.8)
    assert r['sampleRate'] == 44100
    job = root/'local-evidence/stem-jobs'/r['ready']['job']
    manifest = json.loads((job/'output/manifest.json').read_bytes())
    assert manifest['model'] == 'SCNet-large official'
    assert hashlib.sha256((job/'input.wav').read_bytes()).hexdigest() == manifest['source_sha256']
    stems = {}
    for stem in manifest['stems']:
        p = job/'output'/stem['file']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == stem['sha256']
        stems[stem['name']] = wav(p)
    observations = []
    for stage in r['stages']:
        stopped = stage['name'] == 'stop-during-slice-preparation'
        packets = []
        bounds_correct = stopped or (abs(stage['held']['loopIn']-1.4) < 1e-8 and abs(stage['held']['loopOut']-1.6) < 1e-8)
        error = None if stopped else float(abs(stage['after']['position']-clock(stage['before'], stage['after']['at'])))
        for kind in ['heldPCM', 'afterPCM']:
            if kind not in stage:
                continue
            for packet in stage[kind]:
                data = base64.b64decode(packet['base64'], validate=True)
                assert hashlib.sha256(data).hexdigest() == packet['sha256']
                x = np.frombuffer(data, '<f4').astype(float)
                seconds = .6 if kind == 'heldPCM' else .3
                assert len(x) == packet['frames'] == round(seconds*r['sampleRate'])
                assert np.isfinite(x).all() and not packet['errors'], packet['errors']
                cursor = packet['startFrame']
                for i, q in enumerate(packet['quanta']):
                    assert q['frame'] == cursor and 0 < q['count'] <= 128
                    assert q['count'] == 128 or i == len(packet['quanta'])-1
                    cursor += q['count']
                assert cursor == packet['startFrame']+len(x)
                rms = float(np.sqrt(np.mean(x*x)))
                peak = float(np.max(np.abs(x)))
                assert peak < r['criteria']['maximumStoppedPeak'] if stopped else rms > r['criteria']['minimumRMS']
                row = dict(kind=kind, channel=packet['channel'], frames=len(x), rms=rms, peak=peak, sha256=packet['sha256'], contiguousQuanta=len(packet['quanta']))
                if stage['name'] == 'raw-slice-release' and kind == 'heldPCM':
                    # Fixed .1–.5s window, known original sources, observed
                    # anchor and independent beat math. No lag/gain/phase fit.
                    window = (np.arange(len(x)) >= round(.1*r['sampleRate'])) & (np.arange(len(x)) < round(.5*r['sampleRate']))
                    times = (np.arange(len(x))[window]+packet['startFrame'])/r['sampleRate']
                    position = clock(stage['held'], times)*44100
                    index = np.floor(position).astype(int)
                    fraction = position-index
                    expected = sum(stems[name][index, packet['channel']]*(1-fraction)+stems[name][index+1, packet['channel']]*fraction for name in ['other', 'bass', 'drums'])
                    relative = float(np.sqrt(np.mean((x[window]-expected)**2))/np.sqrt(np.mean(expected**2)))
                    row['rawRelativeRMSError'] = relative
                    row['rawSelectedSliceAudioCorrect'] = relative < 1e-4
                packets.append(row)
        after = stage['after']
        if stopped:
            assert stage['pending']['processing']
            assert all(not after[k] for k in ['playing', 'processing', 'voice', 'pending'])
        else:
            assert after['playing'] and not after['processing'] and after['mask'] == [False, True, True, True]
            assert np.allclose(after['gains'], [0, 0, 1, 1, 1], atol=1e-7, rtol=0)
        observations.append(dict(name=stage['name'], sliceBoundsCorrect=bounds_correct, releaseSourceClockError=error, releaseClockCorrect=stopped or error < r['criteria']['maximumPositionError'], packets=packets))
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']] == ['raw-slice-release', 'keyed-slice-release', 'fixed-slice-release', 'stop-during-slice-preparation']
        assert abs(r['fixedDomain']['loopIn']) < 1e-8 and abs(r['fixedDomain']['loopOut']-(1.8+8/3)) < 1e-8
    passed = bool(r['workflowCompleted'] and not r['errors'] and all(s['sliceBoundsCorrect'] and s['releaseClockCorrect'] and all(p.get('rawSelectedSliceAudioCorrect', True) for p in s['packets']) for s in observations))
    return dict(checkpoint=164, passed=passed, originalBytes=len(raw), originalSHA256=hashlib.sha256(raw).hexdigest(), sourceHashes=r['sourceBefore'], criteria=r['criteria'], rawReferenceCriterion={'windowSeconds':[.1,.5], 'maximumRelativeRMS':1e-4, 'alignment':'Observed anchor/known grid/linear loop kernel; no fitting.'}, observations=observations, errors=r['errors'], failureState=r.get('failureState'), default48000Acceptance=False, musicalPitchAccuracyAccepted=False, sourceAttributionAccepted=False, exactSeratoParityAccepted=False, seamlessTransitionAccepted=False, nativeAcceptance=False, hardwareAcceptance=False, fullParityAcceptance=False)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('original', type=Path)
    p.add_argument('output', type=Path)
    p.add_argument('--sources', type=Path, required=True)
    a = p.parse_args()
    r = inspect(a.original, a.sources)
    with a.output.open('x') as out:
        json.dump(r, out, indent=2, allow_nan=False)
        out.write('\n')
    print(json.dumps({k:r[k] for k in ['passed','observations','errors']}))
    raise SystemExit(0 if r['passed'] else 1)
