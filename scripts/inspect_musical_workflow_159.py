#!/usr/bin/env python3
"""Whole musical captures and fixed-anchor solo reconstruction; no fitting."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CRITERIA = dict(captureSeconds=2, sourceWindow=[1.3, 2.3], maximumReconstructionRelativeRMS=1e-4,
                minimumFullMixRMS=1e-4, minimumControlRMS=1e-5, maximumMutedStoppedPeak=1e-7)


def sha(data): return hashlib.sha256(data).hexdigest()
def rms(x): return float(np.sqrt(np.mean(x * x)))


def inspect(path, sources):
    raw = path.read_bytes(); r = json.loads(raw)
    assert r['diagnosticCheckpoint'] == 159 and r['workflowCompleted'] and not r['errors']
    assert r['criteria'] == CRITERIA and r['sourceStable'] and r['sourceBefore'] == r['sourceAfter']
    for name, digest in r['sourceBefore'].items(): assert sha((sources / name).read_bytes()) == digest, name
    assert r['originalUnchanged'] and r['importedFileUnchanged']
    imported = ROOT / 'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3'
    assert sha(imported.read_bytes()) == r['import']['contentHash'] == 'cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['import']['type'] == 'MP3' and r['import']['storage'] == 'saved'
    assert r['input'] == dict(frames=299880, sampleRate=44100, channels=2, duration=6.8)
    job = ROOT / 'local-evidence/stem-jobs' / r['ready']['job']
    manifest = json.loads((job / 'output/manifest.json').read_text())
    input_path = job / 'input.wav'
    assert sha(input_path.read_bytes()) == manifest['source_sha256']
    pcm = np.memmap(input_path, mode='r', dtype='<f4', offset=44, shape=(299880, 2))
    assert [sha(pcm[:, c].tobytes()) for c in range(2)] == r['originalHashes']
    for stem in manifest['stems']: assert sha((job / 'output' / stem['file']).read_bytes()) == stem['sha256']
    assert r['job']['state'] == 'complete' and manifest['model'] == 'SCNet-large official'
    assert all(b == dict(frames=299880, sampleRate=44100, channels=2, duration=6.8) for b in r['ready']['buffers']) and len(r['ready']['buffers']) == 4
    sr = r['sampleRate']; integrity = []
    def decode(p, label):
        data = base64.b64decode(p['base64'], validate=True)
        assert sha(data) == p['sha256'] and not p['errors']
        x = np.frombuffer(data, '<f4').astype(float)
        assert len(x) == p['frames'] == round(2 * sr) and np.isfinite(x).all()
        cursor = p['startFrame']
        for i, q in enumerate(p['quanta']):
            assert q['frame'] == cursor and 0 < q['count'] <= 128
            assert q['count'] == 128 or i == len(p['quanta']) - 1
            cursor += q['count']
        assert cursor == p['startFrame'] + len(x)
        integrity.append(dict(label=label, channel=p['channel'], frames=len(x), sha256=p['sha256'], contiguousQuanta=len(p['quanta'])))
        return x
    def window(p, x, a, b):
        begin, end = round(a * sr) - p['startFrame'], round(b * sr) - p['startFrame']
        assert 0 <= begin < end <= len(x), (begin, end, len(x))
        return x[begin:end]
    stages = {row['name']: row for row in r['stages']}; decoded = {}
    for name, row in stages.items():
        assert len(row['pcm']) == 2 and len({p['startFrame'] for p in row['pcm']}) == 1
        decoded[name] = [decode(p, name) for p in row['pcm']]
    selected_only = r.get('variant') == 'selected-stems-composition'
    reconstruction = []
    for channel in range(0 if selected_only else 2):
        signals = {}
        for name in ['full', 'vocals', 'other', 'bass', 'drums']:
            row = stages[name]; assert row['rate'] == 1 and not row['keylock'] and row['keyShift'] == 0
            assert row['anchorPosition'] == 1 and abs(row['anchorTime'] * sr - round(row['anchorTime'] * sr)) < 1e-5
            p = row['pcm'][channel]
            signals[name] = window(p, decoded[name][channel], row['anchorTime'] + .3, row['anchorTime'] + 1.3)
            if name == 'full': assert row['mask'] == [True] * 4 and row['gains'][0] > .999
            else:
                index = ['vocals', 'other', 'bass', 'drums'].index(name)
                assert row['mask'] == [i == index for i in range(4)]
                assert row['gains'][0] < 1e-6 and row['gains'][index + 1] > .999
        full = signals['full']; summed = sum(signals[name] for name in ['vocals', 'other', 'bass', 'drums'])
        level = rms(full); error = rms(summed - full) / max(level, 1e-30)
        reconstruction.append(dict(channel=channel, frames=len(full), fullRMS=level, relativeRMS=error,
                                   soloRMS={name:rms(signals[name]) for name in ['vocals', 'other', 'bass', 'drums']},
                                   passed=level > 1e-4 and error <= 1e-4))
    composition = []
    for name, semitones in [('keylock-plus6', 0), ('keylock-plus6-key3', 3)]:
        row = stages[name]
        assert row['keylock'] and abs(row['rate'] - 1.06) < 1e-8 and row['keyShift'] == semitones
        assert row['live'] and row['live']['groups'] and all(g['processorChannels'] == 18 for g in row['live']['groups'])
        if selected_only:
            assert row['mask'] == [False,True,True,True]
            assert row['gains'][0] < 1e-6 and row['gains'][1] < 1e-6 and all(g > .999 for g in row['gains'][2:])
        levels = [rms(window(p, x, p['startFrame'] / sr + .3, p['startFrame'] / sr + 1.3)) for p, x in zip(row['pcm'], decoded[name])]
        composition.append(dict(name=name, rate=row['rate'], keyShift=semitones, mask=row['mask'], gains=row['gains'],
                                channelRMS=levels, passed=all(level > 1e-5 for level in levels), pitchAccuracyAccepted=False))
    control = []
    assert len(r['controlPCM']) == 2
    for p in r['controlPCM']:
        x = decode(p, 'mute-restore-stop')
        muted = float(np.max(np.abs(window(p, x, r['muteAt'] + .1, r['muteAt'] + .2))))
        restored = rms(window(p, x, r['restoreAt'] + .1, r['restoreAt'] + .2))
        stopped = float(np.max(np.abs(window(p, x, r['stopAt'] + .1, r['stopAt'] + .25))))
        control.append(dict(channel=p['channel'], mutedPeak=muted, restoredRMS=restored, stoppedPeak=stopped,
                            passed=muted < 1e-7 and restored > 1e-5 and stopped < 1e-7))
    return dict(checkpoint=159, passed=all(row['passed'] for row in reconstruction + composition + control),
                scope=r['scope'], originalBytes=len(raw), originalSHA256=sha(raw), sourceHashes=r['sourceBefore'],
                importIdentity=r['import'], decodedInput=r['input'], job=r['ready']['job'],
                canonicalInputSHA256=manifest['source_sha256'], model=manifest['model'], timing=manifest['timing'],
                exports=[dict(name=s['name'],sha256=s['sha256']) for s in manifest['stems']],
                wholeCaptureIntegrity=integrity, criteria=CRITERIA, reconstruction=reconstruction,
                composition=composition, control=control, originalAndImportedFileUnchanged=True,
                alignment='Only scheduled anchor frames/declared source1.3–2.3seconds; no delay/gain/phase fitting.',
                musicalAttributionQualityAccepted=False, musicalPitchAccuracyAccepted=False,
                continuityOrExactAudibleCursorAccepted=False, nativeAcceptance=False, hardwareAcceptance=False,
                fullParityAcceptance=False)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('original',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--sources',type=Path,default=ROOT / 'prototype')
    args = p.parse_args(); report = inspect(args.original,args.sources)
    with args.output.open('x') as stream: json.dump(report,stream,indent=2,allow_nan=False);stream.write('\n')
    print(json.dumps({k:report[k] for k in ['passed','reconstruction','composition','control']},indent=2))
    raise SystemExit(0 if report['passed'] else 1)
