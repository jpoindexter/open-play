#!/usr/bin/env python3
"""Changed upload contracts only; HTTP cache reuse plus isolated queue-race test.

The HTTP checks use the real local handler/cache. The queue-race check executes
real service methods with a recorder instead of inference; it is labeled below.
"""
import argparse
import hashlib
import http.client
import json
from pathlib import Path
import struct
import sys
import tempfile
import stem_service


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    checks = []

    def request(method, path, body=None, expected=200):
        connection = http.client.HTTPConnection('127.0.0.1', args.port, timeout=30)
        connection.request(method, path, body=body, headers={'X-Open-Play': 'local-prototype'})
        response = connection.getresponse()
        data = json.loads(response.read())
        assert response.status == expected, (response.status, data)
        connection.close()
        return data

    root = Path(__file__).resolve().parents[1]
    directory = root / 'local-evidence/stem-jobs/a2877adfbffa4ece8ec544451917a589'
    def snapshot():
        return {str(p.relative_to(directory)): (p.stat().st_size, p.stat().st_mtime_ns,
                hashlib.sha256(p.read_bytes()).hexdigest()) for p in directory.rglob('*') if p.is_file()}
    before = snapshot()
    data = (directory / 'input.wav').read_bytes()
    old = request('POST', '/api/stems?model=scnet', data, 202)
    assert old['id'] == directory.name and old['state'] == 'complete'
    upload = request('POST', '/api/stems/uploads?model=scnet', json.dumps({'size': len(data)}))
    ident = upload['id']
    assert upload['chunkBytes'] == 4 * 1024 * 1024
    # Out-of-order writes and premature commit must not create a model job.
    request('POST', f'/api/stems/uploads/{ident}?offset=1', b'x', 400)
    request('POST', f'/api/stems/uploads/{ident}/commit', expected=400)
    result = request('POST', f'/api/stems/uploads/{ident}?offset=0', data)
    assert result['received'] == len(data)
    result = request('POST', f'/api/stems/uploads/{ident}/commit', expected=202)
    assert result['id'] == old['id'] and result['state'] == 'complete'
    repeated = request('POST', f'/api/stems/uploads/{ident}/commit', expected=202)
    assert repeated['id'] == result['id']
    request('DELETE', f'/api/stems/uploads/{ident}')
    assert not (directory.parent / '.uploads' / ident).exists()
    assert snapshot() == before
    checks.append(dict(name='Real HTTP short POST and chunked commit reuse identical completed cache; repeated commit, offset/incomplete refusal and temp cleanup', passed=True, job=directory.name, exactFilesUnchanged=len(before), scope='Actual HTTP and completed-cache reuse; no model inference started by this check'))

    class QueueRecorder:
        def __init__(self): self.pending = []
        def submit(self, fn, job): self.pending.append((fn, job))
        def shutdown(self, **kwargs): pass

    with tempfile.TemporaryDirectory() as temporary:
        previous = stem_service.JOBS_ROOT
        stem_service.JOBS_ROOT = Path(temporary)
        jobs = stem_service.StemJobs()
        jobs.pool.shutdown(wait=True)
        jobs.pool = QueueRecorder()
        jobs.runtime = lambda *args: (Path(sys.executable), [])
        try:
            wav = bytearray(60)
            wav[:4] = b'RIFF'; struct.pack_into('<I', wav, 4, 52); wav[8:16] = b'WAVEfmt '
            struct.pack_into('<IHHIIHH', wav, 16, 16, 3, 2, 44100, 352800, 8, 32)
            wav[36:40] = b'data'; struct.pack_into('<I', wav, 40, 16)
            upload = jobs.uploads.begin(len(wav), 'scnet')
            jobs.uploads.append(upload['id'], 0, bytes(wav))
            committed = jobs.uploads.commit(upload['id'])
            assert len(jobs.pool.pending) == 1 and committed['state'] == 'queued'
            cancellation = jobs.uploads.cancel(upload['id'])
            assert cancellation['job'] == committed['id'] and jobs.get(committed['id'])['state'] == 'cancelled'
            assert (Path(temporary) / committed['id'] / 'input.wav').read_bytes() == bytes(wav)
            assert not list((Path(temporary) / '.uploads').iterdir())
            checks.append(dict(name='Cancel by upload ID after commit but before caller learns job ID cancels queued owner', passed=True, scope='Actual upload/service methods with queue recorder; no inference, HTTP timing or physical audio acceptance'))
        finally:
            jobs.close()
            stem_service.JOBS_ROOT = previous
    report = dict(checkpoint=157, checks=checks, passed=all(c['passed'] for c in checks), fullParityAcceptance=False)
    with args.output.open('x') as stream:
        json.dump(report, stream, indent=2); stream.write('\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
