#!/usr/bin/env python3
"""Inspect exact original actual-control evidence; never repair captured samples."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np


def inspect(path, sources):
    raw = path.read_bytes()
    r = json.loads(raw)
    assert r['diagnosticCheckpoint'] == 162 and r['sourceStable']
    assert r['sourceBefore'] == r['sourceAfter']
    for name, digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources / name).read_bytes()).hexdigest() == digest, name
    root = Path(__file__).resolve().parents[1]
    media = root / 'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3'
    assert hashlib.sha256(media.read_bytes()).hexdigest() == r['import']['contentHash'] == 'cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['input'] == dict(frames=299880, sampleRate=44100, channels=2, duration=6.8)
    job = root / 'local-evidence/stem-jobs' / r['ready']['job']
    manifest = json.loads((job / 'output/manifest.json').read_bytes())
    assert manifest['model'] == 'SCNet-large official'
    assert hashlib.sha256((job / 'input.wav').read_bytes()).hexdigest() == manifest['source_sha256']
    for stem in manifest['stems']:
        assert hashlib.sha256((job / 'output' / stem['file']).read_bytes()).hexdigest() == stem['sha256']
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']] == ['reverse-seek-across-marker', 'reverse-tempo-change', 'reverse-key-change', 'stop-during-reverse-key-preparation', 'reverse-from-track-end']
        assert r['home']['position'] == 0 and not r['home']['playing'] and not r['home']['voice']
    rows = []
    for stage in r['stages']:
        packets = []
        clock_error = None
        for packet in stage.get('pcm', []):
            data = base64.b64decode(packet['base64'], validate=True)
            assert hashlib.sha256(data).hexdigest() == packet['sha256']
            x = np.frombuffer(data, '<f4').astype(float)
            assert len(x) == packet['frames'] == round(.4 * r['sampleRate'])
            assert np.isfinite(x).all() and not packet['errors'], packet['errors']
            cursor = packet['startFrame']
            for i, q in enumerate(packet['quanta']):
                assert q['frame'] == cursor and 0 < q['count'] <= 128
                assert q['count'] == 128 or i == len(packet['quanta']) - 1
                cursor += q['count']
            assert cursor == packet['startFrame'] + len(x)
            level = float(np.sqrt(np.mean(x * x)))
            peak = float(np.max(np.abs(x)))
            stopped = stage['name'] == 'stop-during-reverse-key-preparation'
            assert peak < r['criteria']['maximumStoppedPeak'] if stopped else level > r['criteria']['minimumRMS']
            packets.append(dict(channel=packet['channel'], frames=len(x), rms=level, peak=peak, sha256=packet['sha256'], contiguousQuanta=len(packet['quanta'])))
        if packets:
            assert len(packets) == 2
        if stage['name'] == 'stop-during-reverse-key-preparation':
            assert stage['pending']['processing'] and stage['pending']['pending']
            for name in ['stopped', 'settled', 'after']:
                s = stage[name]
                assert all(not s[k] for k in ['playing', 'processing', 'voice', 'pending', 'retiring'])
        elif packets:
            before, after = stage['before'], stage['after']
            assert before['playing'] and after['playing'] and before['reverse'] and after['reverse']
            assert before['rate'] > 0 and after['rate'] > 0 and before['position'] > after['position']
            assert before['mask'] == after['mask'] == [False, True, True, True]
            assert np.allclose(before['gains'], [0, 0, 1, 1, 1], atol=1e-7, rtol=0)
            # Declared120/150/90 grid and observed anchors, with no fitted lag.
            # Initial Sync is pressed in the90BPM region; slider6 currently
            # requests base120*1.06. This checks that observed policy, not its
            # correctness as a relative slider (that separate gap stays open).
            bpm = 90 if stage['name'] == 'reverse-seek-across-marker' else 127.2
            def beat(p):
                return 2*p if p < 1 else 2+(p-1)*2.5 if p < 1.8 else 4+(p-1.8)*1.5
            def source(b):
                return b/2 if b < 2 else 1+(b-2)/2.5 if b < 4 else 1.8+(b-4)/1.5
            clock_error = max(abs(s['position'] - source(max(0, beat(s['anchorPosition']) - bpm/60*max(0, s['at']-s['anchorTime'])))) for s in [before, after])
            assert clock_error < r['criteria']['maximumPositionError'], clock_error
        rows.append(dict(name=stage['name'], sourceClockMaximumError=clock_error, packets=packets))
    return dict(checkpoint=162, passed=r['workflowCompleted'] and not r['errors'], originalBytes=len(raw), originalSHA256=hashlib.sha256(raw).hexdigest(), sourceHashes=r['sourceBefore'], observations=rows, errors=r['errors'], failureState=r.get('failureState'), criteria=r['criteria'], tempoBasisFollowup={'initialSyncBPM':90,'afterSliderSixBPM':127.2,'scope':'Observed source-clock behavior; relative tempo basis still needs correction/acceptance.'}, relativeTempoContinuityAccepted=False, musicalPitchAccuracyAccepted=False, sourceAttributionAccepted=False, exactSeratoParityAccepted=False, seamlessTransitionAccepted=False, nativeAcceptance=False, hardwareAcceptance=False, fullParityAcceptance=False)


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
