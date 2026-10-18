#!/usr/bin/env python3
"""Inspect cancelled shared tempo, actual restart and relative control direction."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from inspect_slicer_warp_164 import beat
from inspect_slicer_tempo_167 import source_time


def inspect(path, sources):
    raw=path.read_bytes();r=json.loads(raw);root=Path(__file__).resolve().parents[1]
    assert r['diagnosticCheckpoint']==169 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    assert r['sampleRate']==44100 and r['input']==dict(frames=299880,sampleRate=44100,channels=2,duration=6.8)
    assert hashlib.sha256((root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes()).hexdigest()==r['import']['contentHash']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['ready']['job']=='8266a41f62fc4fc5b92808dd3d988cec'
    job=root/'local-evidence/stem-jobs'/r['ready']['job'];m=json.loads((job/'output/manifest.json').read_bytes())
    assert m['model']=='SCNet-large official' and hashlib.sha256((job/'input.wav').read_bytes()).hexdigest()==m['source_sha256']
    for s in m['stems']:assert hashlib.sha256((job/'output'/s['file']).read_bytes()).hexdigest()==s['sha256']
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']]==['cancelled-slicer-rate-restart','cancelled-ordinary-rate-restart']
    rows=[]
    for s in r['stages']:
        before,stopped,restarted,after=s['before'],s['stopped'],s['restarted'],s['afterNextInput'];assert before['rate']==1 and before['gridBPM']==120
        assert s['pending']['processing'] and s['pending']['pending'] and stopped['tempoValue']==6 and after['tempoValue']==2
        assert all(snap['trackId']==r['import']['id'] and snap['mask']==[False,True,True,True] and snap['keylock'] and snap['keyShift']==3 for snap in [before,stopped,restarted,after])
        stop_ok=not any(stopped[k] for k in ['playing','processing','voice','pending','loop']) and stopped['slice'] is None
        nominal_ok=abs(stopped['rate']-1)<1e-8 and abs(stopped['nominalBPM']-stopped['shownBPM'])<.05
        restart_ok=restarted['playing'] and restarted['voice'] and not any(restarted[k] for k in ['processing','pending','loop']) and restarted['slice'] is None and abs(restarted['rate']-1)<1e-8 and abs(restarted['nominalBPM']-120)<1e-8 and abs(restarted['gridBPM']-120)<1e-8 and abs(restarted['shownBPM']-120)<.05
        next_ok=after['playing'] and after['voice'] and not any(after[k] for k in ['processing','pending','loop']) and abs(after['rate']-.96)<1e-8 and abs(after['nominalBPM']-115.2)<1e-8 and abs(after['gridBPM']-115.2)<1e-8 and abs(after['shownBPM']-115.2)<.05
        lowered=after['gridBPM']<restarted['gridBPM']
        restart_expected=source_time(float(beat(restarted['anchorPosition']))+(restarted['at']-restarted['anchorTime'])*2)
        next_expected=source_time(float(beat(restarted['anchorPosition']))+(after['anchorTime']-restarted['anchorTime'])*2+(after['at']-after['anchorTime'])*115.2/60)
        restart_error=abs(restarted['position']-restart_expected);next_error=abs(after['position']-next_expected)
        packets=[]
        for kind,snap in [('beforePCM',s['audibleBefore']),('stoppedPCM',stopped),('restartPCM',restarted),('afterPCM',after)]:
            if kind!='stoppedPCM':assert np.allclose(snap['gains'],[0,0,1,1,1],atol=1e-7,rtol=0)
            for p in s[kind]:
                data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256']
                x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==13230 and np.isfinite(x).all() and not p['errors']
                cursor=p['startFrame']
                for i,q in enumerate(p['quanta']):
                    assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
                assert cursor==p['startFrame']+len(x)
                rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)))
                assert peak<r['criteria']['maximumStoppedPeak'] if kind=='stoppedPCM' else rms>r['criteria']['minimumRMS']
                packets.append(dict(kind=kind,channel=p['channel'],frames=len(x),contiguousQuanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak))
        rows.append(dict(name=s['name'],stopRetirementCorrect=bool(stop_ok),cancelledNominalRestored=bool(nominal_ok),restartTempoCoherent=bool(restart_ok),nextRelativeTempoCorrect=bool(next_ok),lowerControlLowersActualTempo=bool(lowered),stoppedNominalBPM=stopped['nominalBPM'],stoppedShownBPM=stopped['shownBPM'],restartNominalBPM=restarted['nominalBPM'],restartGridBPM=restarted['gridBPM'],nextNominalBPM=after['nominalBPM'],nextGridBPM=after['gridBPM'],restartSourceClockErrorSeconds=restart_error,nextSourceClockErrorSeconds=next_error,packets=packets))
    passed=bool(r['workflowCompleted'] and not r['errors'] and len(rows)==2 and all(all(s[k] for k in ['stopRetirementCorrect','cancelledNominalRestored','restartTempoCoherent','nextRelativeTempoCorrect','lowerControlLowersActualTempo']) and s['restartSourceClockErrorSeconds']<.01 and s['nextSourceClockErrorSeconds']<.01 for s in rows))
    return dict(checkpoint=169,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],criteria={'maximumSourceClockErrorSeconds':.01,'nominalTolerance':1e-8,'shownBPMTolerance':.05,'stoppedPeak':1e-7,'minimumRMS':1e-5,'cancelledPriorBPM':120,'relativeInputFrom':6,'relativeInputTo':2,'expectedNextBPM':115.2,'alignment':'Known warp grid and observed anchors; no fitted alignment.'},observations=rows,errors=r['errors'],default48000Acceptance=False,musicalPitchQualityAccepted=False,sourceAttributionAccepted=False,exactSeratoParityAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({'passed':r['passed'],'observations':[{k:v for k,v in s.items() if k!='packets'} for s in r['observations']],'errors':r['errors']}));raise SystemExit(0 if r['passed'] else 1)
