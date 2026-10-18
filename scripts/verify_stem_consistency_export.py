#!/usr/bin/env python3
"""One actual local job/export/cache check; no app UI or physical-audio claim."""
import argparse,hashlib,json,re,time
from pathlib import Path
from urllib.request import Request,urlopen
import numpy as np
import soundfile as sf
p=argparse.ArgumentParser();p.add_argument('fixture',type=Path);p.add_argument('output',type=Path);p.add_argument('--port',type=int,default=18775);a=p.parse_args()
a.output.mkdir(exist_ok=False,parents=True)
base=f'http://127.0.0.1:{a.port}'
def fetch(path,body=None):
 req=Request(base+path,data=body,headers={'X-Open-Play':'local-prototype','Content-Type':'audio/wav'} if body is not None else {})
 with urlopen(req,timeout=15) as r:return r.status,r.read()
payload=(a.fixture/'mixture.wav').read_bytes();_,data=fetch('/api/stems',payload);job=json.loads(data);events=[job]
start=time.monotonic();assert re.fullmatch('[0-9a-f]{32}',job['id'])
while job['state'] not in ['complete','failed','cancelled']:
 assert time.monotonic()-start<120,'Preparation deadline'
 time.sleep(.25);_,data=fetch('/api/stems/'+job['id']);job=json.loads(data)
 if events[-1].get('stage')!=job.get('stage'):events.append(job)
assert job['state']=='complete',job
names=['drums','bass','other','vocals'];files={}
for entry in job['stems']:
 assert entry['name'] in names and entry['url']==f"/api/stems/{job['id']}/{entry['name']}.wav"
 _,wav=fetch(entry['url']);dest=a.output/(entry['name']+'.wav');dest.write_bytes(wav);files[entry['name']]={'bytes':len(wav),'sha256':hashlib.sha256(wav).hexdigest()}
mix,sr=sf.read(a.fixture/'mixture.wav',always_2d=True);stems={n:sf.read(a.output/(n+'.wav'),always_2d=True)[0] for n in names}
assert all(x.shape==mix.shape and np.isfinite(x).all() for x in stems.values())
residual=sum(stems.values())-mix;relative=float(np.sqrt(np.mean(residual**2)/np.mean(mix**2)))
assert relative<1e-6
_,data=fetch('/api/stems',payload);repeat=json.loads(data);assert repeat['id']==job['id'] and repeat['state']=='complete'
manifest=json.loads((Path('local-evidence/stem-jobs')/job['id']/'output/manifest.json').read_text());assert manifest['parameters']['mixture_consistency']=='uniform-mixture-consistency-v1'
assert manifest['mixture_consistency']['raw_reconstruction_relative_rms']>.03
scores={}
for n in names:
 target=sf.read(a.fixture/(n+'.wav'),always_2d=True)[0].flatten();pred=stems[n].flatten();target-=target.mean();pred-=pred.mean();scaled=target*np.dot(pred,target)/np.dot(target,target)
 scores[n]=float(10*np.log10(np.dot(scaled,scaled)/max(1e-20,np.sum((pred-scaled)**2))))
result={'scope':'Actual POST through existing desktop host proxy→loopback service→pinned SCNet inference→uniform projection→four downloaded Float WAV exports→completed job reuse. Data/API path only; not native GUI/browser playback/acoustics/listening/general separation quality/reference parity. Previously inspected development excerpt, not a new holdout.','job':job,'events':events,'seconds':time.monotonic()-start,'sample_rate':sr,'frames':len(mix),'files':files,'manifest':manifest,'export_reconstruction_relative_rms':relative,'export_si_sdr_db':scores,'completed_job_reused':True,'fullParityVerified':False,'source_hashes':{str(f):hashlib.sha256(f.read_bytes()).hexdigest() for f in map(Path,['scripts/stem_worker.py','scripts/stem_service.py','scripts/stem_mix_consistency.py','scripts/verify_stem_consistency_export.py'])}}
(a.output/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'job':job['id'],'exportRelativeRMS':relative,'rawRelativeRMS':manifest['mixture_consistency']['raw_reconstruction_relative_rms'],'scores':scores,'cacheReuse':True,'seconds':result['seconds']}))
