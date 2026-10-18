#!/usr/bin/env python3
"""Focused completed-cache persistence with actual files and a fresh process.

Worker-shaped tiny WAV fixture only; no model inference or HTTP proof here.
The separate actual API restart check uses the pinned SCNet worker.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import tempfile
import wave
import stem_service
from stem_job_cache import restore_complete, save_complete

ROOT = Path(__file__).resolve().parents[1]
checks = []
class Queue:
    def __init__(self): self.pending=[]
    def submit(self, fn, job): self.pending.append(job['id'])
    def shutdown(self, **kwargs): pass

def service():
    value=stem_service.StemJobs();value.pool.shutdown(wait=True);value.pool=Queue()
    value.runtime=lambda *a:(Path(sys.executable),[])
    return value

with tempfile.TemporaryDirectory() as directory:
    root=Path(directory);stem_service.JOBS_ROOT=root
    jobs=service();payload=b'RIFF'+b'\0'*4+b'WAVE'+b'\0'*32
    created=jobs.create(payload);job=jobs.jobs[created['id']];output=job['directory']/'output';output.mkdir()
    stems=[]
    for i,name in enumerate(['drums','bass','other','vocals']):
        path=output/(name+'.wav')
        with wave.open(str(path),'wb') as f:
            f.setnchannels(2);f.setsampwidth(2);f.setframerate(44100);f.writeframes(bytes([i,0])*8)
        stems.append({'name':name,'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    manifest={'state':'complete','backend':'scnet','frames':4,'channels':2,'sample_rate':44100,'duration':4/44100,'stems':stems}
    (output/'manifest.json').write_text(json.dumps(manifest))
    try: save_complete(job)
    except ValueError: pass
    else: raise AssertionError('Queued job must never have a durable completion receipt')
    assert not (job['directory']/'service-cache.json').exists()
    job['state']='complete';save_complete(job);ident=created['id'];jobs.close()
    child='''import json,sys\nfrom pathlib import Path\nsys.path.insert(0,sys.argv[1])\nimport stem_service\nstem_service.JOBS_ROOT=Path(sys.argv[2])\nj=stem_service.StemJobs()\ndef forbidden(*a):raise AssertionError("Cache hit attempted to start inference")\nj.runtime=forbidden\npayload=b'RIFF'+b'\\0'*4+b'WAVE'+b'\\0'*32\nr=j.create(payload)\nassert r['id']==sys.argv[3] and r['state']=='complete'\nprint(json.dumps({'id':r['id'],'sources':len(r['stems'])}))\nj.close()\n'''
    result=subprocess.run([sys.executable,'-c',child,str(ROOT/'scripts'),str(root),ident],check=True,capture_output=True,text=True)
    restored=json.loads(result.stdout);assert restored['sources']==4
    checks.append({'name':'Fresh interpreter restores verified complete cache; identical request bypasses worker startup','passed':True})
    jobs=service();assert ident in jobs.jobs
    corrupted=output/'other.wav';corrupted.write_bytes(corrupted.read_bytes()+b'changed')
    assert jobs.get(ident)['state']=='failed'
    replacement=jobs.create(payload);assert replacement['id']!=ident and jobs.jobs[ident]['state']=='failed' and corrupted.read_bytes().endswith(b'changed')
    jobs.close();assert ident not in restore_complete(root)
    checks.append({'name':'Status read detects changed source hash; new preparation creates a new owner without deleting old evidence','passed':True})
    # Corrupt/symlink metadata must not become API jobs or block startup.
    malformed=root/('a'*32);malformed.mkdir();(malformed/'service-cache.json').write_text('{')
    linked=root/('b'*32);linked.symlink_to(job['directory'],target_is_directory=True)
    assert restore_complete(root)=={}
    checks.append({'name':'Malformed receipt, linked job folder and unfinished jobs are not restored','passed':True})
print(json.dumps({'passed':True,'scope':'Actual files, production cache/service methods and fresh interpreter; controlled queued worker, not real inference/API/native/device acceptance','checks':checks},indent=2))
