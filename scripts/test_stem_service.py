#!/usr/bin/env python3
"""Safety/lifecycle checks; never runs or downloads a separation model.

HTTP checks exercise the live loopback server. Ownership checks execute StemJobs
with a queue recorder replacing its executor, so they do not prove inference.
Termination checks execute a real benign SIGTERM-resistant child.
"""
import argparse
import hashlib
import http.client
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import wave
import stem_service

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8768)
args = parser.parse_args()
checks = []

def record(name, passed, **evidence):
    checks.append(dict(name=name, passed=bool(passed), evidence=evidence))

def request(method, path, body=None, headers=None):
    connection = http.client.HTTPConnection('127.0.0.1', args.port, timeout=10)
    connection.request(method, path, body=body, headers=headers or {})
    response = connection.getresponse()
    status = response.status
    response.read()
    connection.close()
    return status

for path in ['/prototype/../.git/HEAD', '/prototype/%2e%2e/.git/HEAD', '/prototype/%2e%2e/local-evidence/stems-runtime/models/955717e8.safetensors']:
    code = request('GET', path)
    record('Blocked canonical path traversal: '+path, code == 404, httpStatus=code)
code = request('GET', '/prototype/', headers={'Host':'example.invalid'})
record('Reject unexpected Host', code == 403, httpStatus=code)
code = request('POST', '/api/stems', body=b'nope', headers={'Origin':'https://example.invalid', 'X-Open-Play':'local-prototype'})
record('Reject cross-origin mutation', code == 403, httpStatus=code)
code = request('POST', '/api/stems', body=b'nope')
record('Reject mutation without custom header', code == 403, httpStatus=code)
code = request('POST', '/api/stems', body=b'nope', headers={'X-Open-Play':'local-prototype'})
record('Reject undersized WAV without starting job', code == 413, httpStatus=code)

class QueueRecorder:
    def __init__(self): self.pending=[]
    def submit(self, fn, job): self.pending.append((fn,job))
    def shutdown(self, **kwargs): pass

with tempfile.TemporaryDirectory() as directory:
    old_root = stem_service.JOBS_ROOT
    stem_service.JOBS_ROOT = Path(directory)
    jobs = stem_service.StemJobs()
    jobs.pool.shutdown(wait=True)
    jobs.pool = QueueRecorder()
    jobs.runtime = lambda *args: (Path(sys.executable), [])
    try:
        payload = b'RIFF'+b'\x00'*4+b'WAVE'+b'\x00'*32
        first, second = jobs.create(payload), jobs.create(payload)
        jobs.cancel(first['id'])
        record('Active identical uploads have independent cancellation ownership', first['id'] != second['id'] and jobs.get(second['id'])['state']=='queued', distinctIds=first['id']!=second['id'], secondState=jobs.get(second['id'])['state'], execution='actual service methods; recorded queue, no inference')
        job=jobs.jobs[second['id']]
        output=job['directory']/'output';output.mkdir()
        stems=[]
        for name in ['vocals','other','bass','drums']:
            path=output/(name+'.wav')
            with wave.open(str(path),'wb') as stream:
                stream.setnchannels(2);stream.setsampwidth(2);stream.setframerate(44100);stream.writeframes(b'\x00'*16)
            stems.append({'name':name,'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        (output/'manifest.json').write_text(json.dumps({'state':'complete','backend':'scnet','frames':4,'sample_rate':44100,'channels':2,'duration':4/44100,'stems':stems}))
        job['state']='complete'
        cached=jobs.create(payload)
        record('Completed immutable job may be reused',cached['id']==second['id'],cachedIdMatches=cached['id']==second['id'])
        process=subprocess.Popen([sys.executable,'-c','import signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);print("ready",flush=True);time.sleep(30)'], stdout=subprocess.PIPE, text=True, start_new_session=True)
        try:
            assert process.stdout.readline().strip()=='ready'
            jobs.jobs['termination']={'id':'termination','hash':'test','state':'running','directory':Path(directory),'process':process,'error':None}
            started=time.monotonic()
            status=jobs.cancel('termination')
            elapsed=time.monotonic()-started
            record('Cancellation escalates and reaps resistant process',status['state']=='cancelled' and process.poll() is not None and elapsed<5, state=status['state'],exitCode=process.poll(),seconds=round(elapsed,3))
        finally:
            if process.poll() is None: os.killpg(process.pid,signal.SIGKILL)
            process.wait()
    finally:
        jobs.close()
        stem_service.JOBS_ROOT=old_root

report={'executedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'passed':sum(c['passed'] for c in checks),'total':len(checks),'checks':checks}
print(json.dumps(report,indent=2))
if not all(c['passed'] for c in checks):sys.exit(1)
