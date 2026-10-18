"""Hash/finite and fixed-window phase comparison of the actual WASM outputs."""
import hashlib
import json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'local-evidence/stem-activation-phase-138'
def sha(b):return hashlib.sha256(b).hexdigest()
original=(RAW/'original.json').read_bytes();r=json.loads(original)
assert sha((ROOT/r['modulePath']).read_bytes())==r['moduleSHA256']
sr=r['sampleRate'];first,last=[round(v*sr)for v in r['declaredComparisonWindow']];data={}
for row in r['results']:
    data[row['name']]=[]
    for p in row['pcm']:
        b=(RAW/p['file']).read_bytes();assert sha(b)==p['sha256']
        x=np.frombuffer(b,'<f4').astype(float);assert len(x)==p['frames']and np.isfinite(x).all()
        data[row['name']].append(x[first:last])
comparisons=[]
for name in ['late2','warm10','late10']:
    channels=[]
    for ch in range(2):
        a,b=data['warm2'][ch],data[name][ch]
        assert np.mean(a*a)>1e-6 and np.mean(b*b)>1e-6
        hz=[330,550][ch];kernel=np.exp(-2j*np.pi*hz*np.arange(first,last)/sr);za,zb=np.mean(a*kernel),np.mean(b*kernel)
        channels.append({'channel':ch,'knownToneHz':hz,'phaseChangeDegrees':float(np.angle(zb/za)*180/np.pi),'relativeRMSError':float(np.sqrt(np.sum((a-b)**2)/np.sum(a*a))),'maximumSampleDifference':float(np.max(np.abs(a-b))),'amplitudeRatio':float(abs(zb/za))})
    comparisons.append({'reference':'warm2','candidate':name,'channels':channels})
report={'scope':r['scope'],'originalBytes':len(original),'originalSHA256':sha(original),'modulePath':r['modulePath'],'moduleSHA256':r['moduleSHA256'],'currentModuleBytesMatch':True,'sampleRate':sr,'quantum':r['quantum'],'fixedComparisonWindow':r['declaredComparisonWindow'],'inputs':{'job':r['inputJob'],'PCMChannelHashes':r['inputHashes']},'outputs':r['results'],'comparisons':comparisons,'finding':'Both later2channel startup and same-start10channel layout change the first original pair relative to warm2. This disproves a solely misaligned application-clock explanation. Exact internal phase-state mechanism remains an inference; no backend or architecture fix accepted.','fullParityVerified':False}
(ROOT/'docs/prototype/stem-activation-phase-isolation-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'comparisons':comparisons,'currentModuleBytesMatch':True},indent=2))
