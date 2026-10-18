#!/usr/bin/env python3
"""Inspect actual long UI original, exact upload bytes and recorded Stems control."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def inspect(original, log, source_root):
    raw = original.read_bytes()
    r = json.loads(raw)
    assert r['diagnosticCheckpoint'] == 158 and r['workflowCompleted'] and not r['errors']
    assert r['sourceStable'] and r['sourceBefore'] == r['sourceAfter']
    for name, digest in r['sourceBefore'].items():
        assert sha((source_root / name).read_bytes()) == digest, name
    assert r['physicalMuted'] and r['originalUnchanged']
    assert r['input'] == dict(duration=630, frames=27783000, channels=2, sampleRate=44100,
                            decodedPCMBytes=222264000, encodedWavBytes=222264044)
    assert r['cancel']['afterStatus'].startswith('Cancelled') and not r['cancel']['jobBefore']
    assert not r['cancel']['jobAfter'] and not r['cancel']['decodedPublicationPresent'] and not r['cancel']['playing']
    assert r['job']['preparationBudget']['maximumDecodeSeconds'] == 630 and r['job']['preparationBudget']['workerTimeoutSeconds'] == 2010
    assert r['job']['state'] == 'complete' and r['job']['model'] == 'SCNet-large official'
    assert len(r['ready']['buffers']) == 4 and all(b == dict(frames=27783000, channels=2, sampleRate=44100, duration=630) for b in r['ready']['buffers'])
    job = ROOT / 'local-evidence/stem-jobs' / r['ready']['job']
    manifest = json.loads((job / 'output/manifest.json').read_text())
    assert manifest['duration'] == 630 and manifest['frames'] == 27783000 and manifest['backend'] == 'scnet'
    input_path = job / 'input.wav'
    assert input_path.stat().st_size == 222264044
    fingerprint = hashlib.sha256()
    with input_path.open('rb') as stream:
        header = stream.read(44)
        fingerprint.update(header)
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            fingerprint.update(block)
    assert fingerprint.hexdigest() == manifest['source_sha256']
    assert header[:4] == b'RIFF' and header[36:40] == b'data'
    # Memory-map the actual canonical uploaded PCM. Hash both strided original channels exactly.
    samples = np.memmap(input_path, mode='r', dtype='<f4', offset=44, shape=(27783000, 2))
    assert [sha(samples[:, c].tobytes()) for c in range(2)] == r['originalHashes']
    exports = []
    for stem in manifest['stems']:
        path = job / 'output' / stem['file']
        digest = hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(block)
        assert digest.hexdigest() == stem['sha256']
        exports.append(dict(name=stem['name'], bytes=path.stat().st_size, sha256=stem['sha256']))
    text = log.read_text()
    uploads = {}
    for ident, offset in re.findall(r'POST /api/stems/uploads/([a-f0-9]{32})\?offset=(\d+) HTTP/1.1" 200', text):
        uploads.setdefault(ident, []).append(int(offset))
    completed = [ident for ident, offsets in uploads.items() if len(offsets) > 10]
    # Each independent run has one full upload. Select the one immediately preceding
    # that run's retained evidence POST; do not mix cache-repeat upload logs.
    evidence_id = original.stem
    end = text.index(f'POST /api/test-evidence/stem-resource-150/{evidence_id} ')
    completed = [key for key in completed if text.index(f'POST /api/stems/uploads/{key}/commit ') < end]
    assert completed
    ident = max(completed, key=lambda key: text.index(f'POST /api/stems/uploads/{key}/commit '))
    offsets = uploads[ident]
    assert offsets[0] == 0
    payloads = np.diff(offsets + [222264044]).tolist()
    assert all(0 < n <= 4194304 for n in payloads) and sum(payloads) == 222264044
    assert f'POST /api/stems/uploads/{ident}/commit HTTP/1.1" 202' in text
    cancelled = [key for key, offsets in uploads.items() if len(offsets) == 1 and key != ident]
    # The later short HTTP regression also has a single chunk, so identify the pre-long cancellation.
    first_long_post = text.index(f'POST /api/stems/uploads/{ident}?offset=0 ')
    cancelled = [key for key in cancelled if text.index(f'POST /api/stems/uploads/{key}?offset=0 ') < first_long_post]
    assert cancelled
    cancelled = [max(cancelled, key=lambda key: text.index(f'POST /api/stems/uploads/{key}?offset=0 '))]
    assert f'DELETE /api/stems/uploads/{cancelled[0]} HTTP/1.1" 200' in text
    assert not (job.parent / '.uploads' / cancelled[0]).exists() and not (job.parent / '.uploads' / ident).exists()
    assert r['muted'] == [False] * 4 and r['restored'] == [True] * 4
    assert len(r['pcm']) == 2 and len({p['startFrame'] for p in r['pcm']}) == 1
    rows = []
    for p in r['pcm']:
        data = base64.b64decode(p['base64'], validate=True)
        assert sha(data) == p['sha256'] and not p['errors']
        x = np.frombuffer(data, '<f4').astype(float)
        assert len(x) == p['frames'] == round(2 * r['sampleRate']) and np.isfinite(x).all()
        cursor = p['startFrame']
        for i, quantum in enumerate(p['quanta']):
            assert quantum['frame'] == cursor and 0 < quantum['count'] <= 128
            assert quantum['count'] == 128 or i == len(p['quanta']) - 1
            cursor += quantum['count']
        assert cursor == p['startFrame'] + len(x)
        def window(start, end):
            a, b = round(start * r['sampleRate']) - p['startFrame'], round(end * r['sampleRate']) - p['startFrame']
            assert 0 <= a < b <= len(x)
            return x[a:b]
        def rms(values): return float(np.sqrt(np.mean(values * values)))
        start = p['startFrame'] / r['sampleRate']
        baseline = rms(window(start + .05, start + .15))
        muted = float(np.max(np.abs(window(r['muteAt'] + .10, r['muteAt'] + .20))))
        restored = rms(window(r['restoreAt'] + .10, r['restoreAt'] + .20))
        stopped = float(np.max(np.abs(window(r['stopAt'] + .10, r['stopAt'] + .25))))
        assert baseline > .005 and restored > .005 and muted < 1e-7 and stopped < 1e-7
        rows.append(dict(channel=p['channel'], frames=len(x), sha256=p['sha256'], quanta=len(p['quanta']),
                         baselineRMS=baseline, mutedPeak=muted, restoredRMS=restored, stoppedPeak=stopped))
    assert len(rows) == 2
    return dict(checkpoint=158, passed=True, originalBytes=len(raw), originalSHA256=sha(raw),
                scope=r['scope'], sourceHashes=r['sourceBefore'], originalPCMUnchanged=True,
                partialUploadCancelledAndRetrySucceeded=True, uploadedBytes=222264044, chunkRequests=len(payloads),
                largestChunkBytes=max(payloads), exactInputSHA256=manifest['source_sha256'],
                actualModel=manifest['model'], modelSHA256=manifest['model_sha256'], timing=manifest['timing'],
                job=r['ready']['job'], input=r['input'], preparationBudget=r['job']['preparationBudget'], outputs=exports, channels=rows,
                physicalOutputMuted=True, limits='1GiB upload/decoded working input; input-derived decode ceiling/timeout and free-disk guard; original plus four decoded outputs still require memory.',
                musicalSourceQualityAcceptance=False, unlimitedDurationAcceptance=False, nativeAcceptance=False,
                hardwareAcceptance=False, fullParityAcceptance=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original', type=Path)
    parser.add_argument('log', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--sources', type=Path, default=ROOT / 'prototype')
    args = parser.parse_args()
    report = inspect(args.original, args.log, args.sources)
    with args.output.open('x') as stream:
        json.dump(report, stream, indent=2, allow_nan=False); stream.write('\n')
    print(json.dumps({key: report[key] for key in ['passed', 'chunkRequests', 'largestChunkBytes', 'job', 'timing', 'channels']}, indent=2))
