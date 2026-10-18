#!/usr/bin/env python3
"""One actual pinned SCNet API job, normal service restart, verified cache reuse.

Starts/stops only its own temporary loopback server. Does not touch port8768,
Electron, profiles, controller or model defaults. Raw WAVs stay ignored locally.
"""
from pathlib import Path
import argparse
import hashlib
import http.client
import json
import signal
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('output',type=Path);parser.add_argument('--port',type=int,default=18862);args=parser.parse_args()
output=args.output.resolve();output.mkdir(parents=True,exist_ok=False)
port=args.port;process=None;log=None
sha=lambda b:hashlib.sha256(b).hexdigest()
def request(method,path,body=None):
 connection=http.client.HTTPConnection('127.0.0.1',port,timeout=30)
 headers={'Origin':f'http://127.0.0.1:{port}','X-Open-Play':'local-prototype','Content-Type':'audio/wav'}
 connection.request(method,path,body=body,headers=headers);response=connection.getresponse();data=response.read();connection.close()
 if response.status!=200 and response.status!=202:raise RuntimeError(f'HTTP {response.status}: {data[:200]!r}')
 return data

def launch(name):
 global process,log
 log=(output/(name+'.log')).open('wb');process=subprocess.Popen([sys.executable,str(ROOT/'scripts/serve_prototype.py'),'--port',str(port)],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT)
 end=time.monotonic()+30
 while time.monotonic()<end:
  if process.poll() is not None:raise RuntimeError('Owned temporary service exited before ready')
  try:request('GET','/prototype/');return process.pid
  except (ConnectionError,OSError):time.sleep(.05)
 raise TimeoutError('Owned temporary service not ready')

def stop():
 global process,log
 if process and process.poll() is None:
  process.send_signal(signal.SIGINT)
  try:process.wait(timeout=8)
  except subprocess.TimeoutExpired:process.terminate();process.wait(timeout=5)
 if log:log.close()

report={'scope':'Actual local HTTP/SCNet inference/export then normal service-process restart and immutable completed-cache reuse; not browser/native/audio/hardware/quality acceptance.', 'production_service_port_8768_untouched':True,'port':port}
try:
 report['first_pid']=launch('first-service')
 # The changed service lifecycle plus existing request/cancellation boundary.
 check=subprocess.run([sys.executable,str(ROOT/'scripts/test_stem_service.py'),'--port',str(port)],cwd=ROOT,capture_output=True,text=True,check=True)
 (output/'service-checks.json').write_text(check.stdout)
 payload=(ROOT/'local-evidence/stems-runtime/real-fixtures/track2/mixture.wav').read_bytes();report['input_sha256']=sha(payload)
 initial=json.loads(request('POST','/api/stems?model=scnet',payload));report['initial_state']=initial['state'];assert initial['state'] in {'queued','running'},'Expected one fresh inference, not an old completed cache'
 ident=initial['id'];deadline=time.monotonic()+180;last=None
 while True:
  status=json.loads(request('GET','/api/stems/'+ident))
  if status['state']!=last:print('actual job: '+status['state'],file=sys.stderr,flush=True);last=status['state']
  if status['state']=='complete':break
  if status['state'] in {'failed','cancelled'} or time.monotonic()>deadline:raise RuntimeError(str(status))
  time.sleep(.25)
 assert 'cache_warning' not in status
 directory=ROOT/'local-evidence/stem-jobs'/ident
 receipt=json.loads((directory/'service-cache.json').read_text());manifest=json.loads((directory/'output/manifest.json').read_text())
 report.update(job_id=ident,model=status['model'],receipt=receipt,model_sha256=manifest['model_sha256'],timing=manifest['timing'])
 files={}
 for stem in manifest['stems']:
  data=request('GET',f'/api/stems/{ident}/{stem["name"]}.wav');assert sha(data)==stem['sha256'];files[stem['name']]=sha(data);(output/stem['file']).write_bytes(data)
 status_before=(directory/'status.json').read_bytes();worker_before=(directory/'worker.log').read_bytes();manifest_before=(directory/'output/manifest.json').read_bytes()
 stop();report['second_pid']=launch('restarted-service');assert report['second_pid']!=report['first_pid']
 restored=json.loads(request('GET','/api/stems/'+ident));assert restored['state']=='complete' and len(restored['stems'])==4
 begin=time.monotonic();cached=json.loads(request('POST','/api/stems?model=scnet',payload));report['cache_request_seconds']=time.monotonic()-begin
 assert cached['id']==ident and cached['state']=='complete'
 for name,expected in files.items():assert sha(request('GET',f'/api/stems/{ident}/{name}.wav'))==expected
 assert (directory/'status.json').read_bytes()==status_before and (directory/'worker.log').read_bytes()==worker_before and (directory/'output/manifest.json').read_bytes()==manifest_before
 report.update(completed=True,restored_job_id_matches=True,all_four_download_hashes_unchanged=True,worker_status_log_manifest_unchanged=True,exports=files,service_checks=json.loads(check.stdout),source_sha256={name:sha((ROOT/'scripts'/name).read_bytes()) for name in ['stem_service.py','stem_job_cache.py','stem_worker.py','stem_mix_consistency.py','serve_prototype.py','verify_stem_job_cache_restart.py']})
 print(json.dumps({k:v for k,v in report.items() if k not in {'receipt','service_checks','source_sha256','timing'}}))
finally:
 stop();(output/'report.json').write_text(json.dumps(report,indent=2)+'\n')
