#!/usr/bin/env python3
"""Inspect original relative-tempo workflow, exact sources and intact PCM."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np


def inspect(path, sources):
    raw = path.read_bytes()
    r = json.loads(raw)
    assert r['diagnosticCheckpoint'] == 163 and r['sourceStable']
    assert r['sourceBefore'] == r['sourceAfter']
    for name, digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest() == digest, name
    root = Path(__file__).resolve().parents[1]
    media = root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3'
    assert hashlib.sha256(media.read_bytes()).hexdigest() == r['import']['contentHash'] == 'cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['input'] == dict(frames=299880, sampleRate=44100, channels=2, duration=6.8)
    assert r['sampleRate'] == 44100
    job = root/'local-evidence/stem-jobs'/r['ready']['job']
    manifest = json.loads((job/'output/manifest.json').read_bytes())
    assert manifest['model'] == 'SCNet-large official'
    assert hashlib.sha256((job/'input.wav').read_bytes()).hexdigest() == manifest['source_sha256']
    for stem in manifest['stems']:
        assert hashlib.sha256((job/'output'/stem['file']).read_bytes()).hexdigest() == stem['sha256']
    def beat(p):
        return 2*p if p < 1 else 2+(p-1)*2.5 if p < 1.8 else 4+(p-1.8)*1.5
    def source(b):
        return b/2 if b < 2 else 1+(b-2)/2.5 if b < 4 else 1.8+(b-4)/1.5
    rows = []
    for stage in r['stages']:
        tempo_correct = True
        clock_error = 0
        for s in stage['before']+stage['after']:
            assert s['playing'] and s['sync'] and s['voice'] and not s['processing']
            assert s['mask'] == [False, True, True, True]
            assert np.allclose(s['gains'], [0, 0, 1, 1, 1], atol=1e-7, rtol=0)
            tempo_correct &= abs(s['rate']-stage['expectedRate']) < 1e-6 and abs(s['gridBPM']-stage['expectedBPM']) < 1e-6
            sign = -1 if s['reverse'] else 1
            expected = source(max(0, min(beat(6.8), beat(s['anchorPosition'])+sign*s['gridBPM']/60*max(0, s['at']-s['anchorTime']))))
            clock_error = max(clock_error, abs(s['position']-expected))
        assert clock_error < r['criteria']['maximumPositionError'], clock_error
        packets = []
        for packet in stage['pcm']:
            data = base64.b64decode(packet['base64'], validate=True)
            assert hashlib.sha256(data).hexdigest() == packet['sha256']
            x = np.frombuffer(data, '<f4').astype(float)
            assert len(x) == packet['frames'] == round(.3*r['sampleRate'])
            assert np.isfinite(x).all() and not packet['errors'], packet['errors']
            cursor = packet['startFrame']
            for i, q in enumerate(packet['quanta']):
                assert q['frame'] == cursor and 0 < q['count'] <= 128
                assert q['count'] == 128 or i == len(packet['quanta'])-1
                cursor += q['count']
            assert cursor == packet['startFrame']+len(x)
            rms = float(np.sqrt(np.mean(x*x)))
            assert rms > r['criteria']['minimumRMS']
            packets.append(dict(deck=packet['deck'], channel=packet['channel'], frames=len(x), rms=rms, sha256=packet['sha256'], contiguousQuanta=len(packet['quanta'])))
        assert len(packets) == len(stage['before'])*2
        rows.append(dict(name=stage['name'], expectedBPM=stage['expectedBPM'], expectedNominalRate=stage['expectedRate'], observedBPM=[s['gridBPM'] for s in stage['before']], observedNominalRate=[s['rate'] for s in stage['before']], tempoBasisCorrect=bool(tempo_correct), sourceClockMaximumError=clock_error, packets=packets))
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']] == ['raw-reverse-initial', 'raw-reverse-slider6', 'keyed-reverse-slider-minus2', 'keyed-forward-repeated-sync', 'forward-group-secondary-slider2']
        assert abs(r['firstSync']['rate']-.75) < 1e-6
        assert abs(r['repressBefore']['rate']-r['repressAfter']['rate']) < 1e-6
        assert all(s['tempoBasisCorrect'] for s in rows)
    return dict(checkpoint=163, passed=bool(r['workflowCompleted'] and not r['errors'] and all(s['tempoBasisCorrect'] for s in rows)), originalBytes=len(raw), originalSHA256=hashlib.sha256(raw).hexdigest(), sourceHashes=r['sourceBefore'], criteria=r['criteria'], observations=rows, errors=r['errors'], failureState=r.get('failureState'), sampleRateScope='Diagnostic explicitly requests44100Hz to reuse exact musical decoded PCM/cache; default48k/context migration not established.', musicalPitchAccuracyAccepted=False, sourceAttributionAccepted=False, exactSeratoParityAccepted=False, seamlessTransitionAccepted=False, nativeAcceptance=False, hardwareAcceptance=False, fullParityAcceptance=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--sources', type=Path, required=True)
    args = parser.parse_args()
    result = inspect(args.original, args.sources)
    with args.output.open('x') as out:
        json.dump(result, out, indent=2, allow_nan=False)
        out.write('\n')
    print(json.dumps(dict(passed=result['passed'], observations=result['observations'], errors=result['errors'])))
    raise SystemExit(0 if result['passed'] else 1)
