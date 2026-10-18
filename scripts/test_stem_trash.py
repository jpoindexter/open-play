"""Production trash ownership checks with controlled OS Trash collaborator."""
from pathlib import Path
import sys,tempfile,types,json
import stem_service
class Queue:
 def submit(self,*args):pass
 def shutdown(self,**kwargs):pass
with tempfile.TemporaryDirectory() as directory:
 root=Path(directory)/'jobs';root.mkdir();stem_service.JOBS_ROOT=root;j=stem_service.StemJobs();j.pool.shutdown(wait=True);j.pool=Queue();j.runtime=lambda *a:(Path(sys.executable),[])
 payload=b'RIFF'+b'\0'*4+b'WAVE'+b'\0'*32;r=j.create(payload);job=j.jobs[r['id']];source=job['directory'];recycle=Path(directory)/'recycle';recycle.mkdir();moves=[]
 original=sys.modules.get('send2trash')
 def move(path):moves.append(path);Path(path).rename(recycle/Path(path).name)
 sys.modules['send2trash']=types.SimpleNamespace(send2trash=move)
 try:
  try:j.trash(r['id'])
  except ValueError:pass
  else:raise AssertionError('Active job was moved')
  assert source.exists() and not moves
  job['state']='complete';assert j.trash(r['id'])['state']=='trashed';assert not source.exists() and (recycle/r['id']/'input.wav').read_bytes()==payload
  assert j.trash(r['id'])['state']=='trashed' and len(moves)==1
  new=j.create(payload);assert new['id']!=r['id'];newjob=j.jobs[new['id']];newjob['state']='complete'
  def unavailable(path):raise OSError('Trash unavailable')
  sys.modules['send2trash']=types.SimpleNamespace(send2trash=unavailable)
  try:j.trash(new['id'])
  except OSError:pass
  else:raise AssertionError('Trash failure hidden')
  assert newjob['state']=='complete' and newjob['directory'].is_dir()
  newjob['directory']=recycle/r['id']
  try:j.trash(new['id'])
  except ValueError:pass
  else:raise AssertionError('Noncanonical folder accepted')
  assert (recycle/r['id']/'input.wav').read_bytes()==payload
 finally:
  if original is None:sys.modules.pop('send2trash',None)
  else:sys.modules['send2trash']=original
  # The deliberately malformed fixture is not part of close/public behavior.
  newjob['directory']=root/new['id'];newjob['state']='cancelled';j.close()
print(json.dumps({'passed':True,'scope':'Actual service and file moves, controlled OS Trash function; real native Trash/API/browser verified separately','checks':['Active preparation refused; canonical completed folder moved once, idempotent repeat','Cleared key creates a fresh job owner; decoded input copy remains recoverable in controlled recycle folder','OS failure preserves state/files; noncanonical folder rejected']},indent=2))
