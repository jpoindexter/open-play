#!/usr/bin/env python3
"""Keep failed originals; inspect clean loop-exit streams, native SRC and master EOF."""
import argparse
import base64
import json
from pathlib import Path
import subprocess
import numpy as np
from inspect_reverse_exit_161 import ROOT, sha, rms, beat, clock, wav

def inspect(original,master_original,reference_original):
    records=[]
    for path,variant,capsule in [(original,'warped-reverse-loop-exit','final'),(master_original,'native-reference-and-natural-end-master','followup'),(reference_original,'native-reference-only','reference-only')]:
        data=path.read_bytes();r=json.loads(data);assert r['diagnosticCheckpoint']==161 and r['variant']==variant and r['workflowCompleted'] and not r['errors']
        assert r['sourceStable'] and r['sourceBefore']==r['sourceAfter'] and r['originalUnchanged'] and r['importedFileUnchanged']
        for name,digest in r['sourceBefore'].items():assert sha((ROOT/f'local-evidence/reverse-exit-161/{capsule}-source-capsule/prototype'/name).read_bytes())==digest,name
        assert r['ready']['job']=='8266a41f62fc4fc5b92808dd3d988cec' and r['input']==dict(frames=299880,sampleRate=44100,channels=2,duration=6.8)
        records.append((r,dict(path=str(path.resolve().relative_to(ROOT)),bytes=len(data),sha256=sha(data))))
    (r,main_id),(master,master_id),(reference,reference_id)=records
    for other in [master,reference]:
        assert other['prior']['bytes']==main_id['bytes'] and other['prior']['sha256']==main_id['sha256']
        for name,digest in r['sourceBefore'].items():
            if name!='stem-reverse-161-harness.js':assert other['sourceBefore'][name]==digest
    assert sha((ROOT/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes())==r['import']['contentHash']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    job=ROOT/'local-evidence/stem-jobs'/r['ready']['job'];manifest=json.loads((job/'output/manifest.json').read_bytes());assert sha((job/'input.wav').read_bytes())==manifest['source_sha256']
    for stem in manifest['stems']:assert sha((job/'output'/stem['file']).read_bytes())==stem['sha256']
    assert [row['name'] for row in r['stages']]==['raw-loop-exit-reverse','raw-forward-return','raw-natural-start','keylock-key3-loop-exit-reverse','keylock-key3-forward-return','keylock-key3-natural-start']
    integrity=[]
    def decode(p,label,seconds):
        data=base64.b64decode(p['base64'],validate=True);assert sha(data)==p['sha256'];x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==seconds*r['sampleRate'] and np.isfinite(x).all()
        cursor=p['startFrame'];errors=[]
        for i,q in enumerate(p['quanta']):
            if q['frame']!=cursor:errors.append(dict(expected=cursor,actual=q['frame']))
            assert 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
        assert cursor==p['startFrame']+len(x) and errors==p['errors']
        integrity.append(dict(label=label,channel=p['channel'],frames=len(x),sha256=p['sha256'],producerQuanta=len(p['quanta']),contiguous=not errors,errors=errors,accepted=not errors))
        return x,not errors
    observations=[];comparisons=[]
    for row in r['stages']:
        natural=row['name'].endswith('natural-start');reverse=row['name'].endswith('reverse') or natural;keylock=row['name'].startswith('keylock-')
        assert not row['loop'] and not row['warpLoop'] and row['reverse']==reverse and row['keylock']==keylock and row['keyShift']==(3 if keylock else 0) and row['syncState']=='tempo'
        assert row['mask']==[False,True,True,True] and row['gains']==[0,0,1,1,1]
        if keylock:assert row['live']['groups'] and all(g['processorChannels']==18 for g in row['live']['groups'])
        if natural:assert row['after']==dict(position=0,playing=False,voice=False)
        selected=[p for p in row['positions'] if p['at']>=row['anchorTime']];assert len(selected)>10
        actual=np.array([p['position'] for p in selected]);expected=clock(row,[p['at'] for p in selected]);error=float(np.max(np.abs(actual-expected)));assert error<=.01
        audio=[]
        for p in row['pcm']:
            x,valid=decode(p,row['name'],3 if natural else 2)
            if natural:assert not valid;continue  # Never repair or grade this failed acquisition.
            assert valid;sr=r['sampleRate'];level=rms(x[round(.3*sr):round(1.3*sr)]);assert level>1e-5;audio.append(dict(channel=p['channel'],settledRMS=level))
            if not keylock:
                ref=next(v for v in reference['nativeReferences'] if v['name']==row['name'] and v['channel']==p['channel']);data=base64.b64decode(ref['base64'],validate=True);assert sha(data)==ref['sha256'] and ref['originalPCM_SHA256']==p['sha256']
                y=np.frombuffer(data,'<f4').astype(float);assert len(y)==ref['frames']==len(x) and np.isfinite(y).all()
                origin=min(int(np.floor(row['anchorTime']*sr/128))*128,*[v['startFrame'] for v in row['pcm']]);assert ref['originFrame']==origin and ref['anchorTime']==row['anchorTime'] and ref['anchorPosition']==row['anchorPosition'] and ref['reverse']==reverse
                start=row['anchorTime']-origin/sr;assert ref['startWhen']==start
                events=[dict(when=start,rate=120/(120 if row['anchorPosition']<1 else 150 if row['anchorPosition']<1.8 else 90))]
                for marker in ([1.8,1] if reverse else [1,1.8]):
                    if (marker<row['anchorPosition']) if reverse else (marker>row['anchorPosition']):events.append(dict(when=start+abs(float(beat(marker)-beat(row['anchorPosition'])))/2,rate=(.8 if marker==1.8 else 1) if reverse else (.8 if marker==1 else 4/3)))
                assert len(events)==len(ref['events'])
                for a,b in zip(events,ref['events']):assert abs(a['when']-b['when'])<1e-12 and abs(a['rate']-b['rate'])<1e-12
                window=slice(round(.3*sr),round(1.3*sr));relative=rms(x[window]-y[window])/rms(y[window]);comparisons.append(dict(name=row['name'],channel=p['channel'],relativeRMSError=relative,passed=relative<1e-4,referenceSHA256=ref['sha256']))
        observations.append(dict(name=row['name'],sourceClockMaximumErrorAfterAnchor=error,preAnchorSamplesNotGradedAgainstNewOwner=len(row['positions'])-len(selected),audio=audio,naturalStateEndsAtZero=natural))
    stopped=[]
    for p in r['controlPCM']:
        x,valid=decode(p,'Explicit Stop',2);assert valid;times=(np.arange(len(x))+p['startFrame'])/r['sampleRate'];window=(times>=r['stopAt']+.1)&(times<r['stopAt']+.25);assert window.any();peak=float(np.max(np.abs(x[window])));stopped.append(dict(channel=p['channel'],peak=peak,passed=peak<1e-7))
    assert len(integrity)==14 and sum(v['accepted'] for v in integrity)==10
    blob=base64.b64decode(master['master']['base64'],validate=True);assert len(blob)==master['master']['bytes'] and sha(blob)==master['master']['sha256']
    target=ROOT/'local-evidence/reverse-exit-161'/('master-'+sha(blob)+'.webm');target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():assert target.read_bytes()==blob
    else:target.write_bytes(blob)
    command=['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-i',str(target),'-f','f32le','-acodec','pcm_f32le','-ar','44100','-ac','2','pipe:1'];pcm=subprocess.run(command,check=True,capture_output=True).stdout
    decoded=np.frombuffer(pcm,'<f4').reshape(-1,2).astype(float);assert len(decoded)>44100*4 and np.isfinite(decoded).all();natural_audio=[]
    for row in master['natural']:
        assert row['mask']==[False,True,True,True] and row['gains']==[0,0,1,1,1] and row['end']['position']==0 and not row['end']['voice']
        audible=(row['anchorTime']-master['recordStarted']+.3,row['anchorTime']-master['recordStarted']+.8);quiet=(row['end']['at']-master['recordStarted']+.3,row['end']['at']-master['recordStarted']+.6)
        def cut(bounds):
            a,b=[round(v*44100) for v in bounds];assert 0<=a<b<=len(decoded);return decoded[a:b]
        levels=[rms(cut(audible)[:,c]) for c in range(2)];peaks=[float(np.max(np.abs(cut(quiet)[:,c]))) for c in range(2)];natural_audio.append(dict(name=row['name'],audibleWindow=list(audible),quietWindow=list(quiet),channelRMS=levels,channelSilentPeaks=peaks,passed=all(v>1e-5 for v in levels) and all(v<1e-7 for v in peaks)))
    passed=all(v['passed'] for v in comparisons+stopped+natural_audio)
    return dict(checkpoint=161,passed=passed,originals=[main_id,master_id,reference_id],observations=observations,wholeInitialCaptureIntegrity=integrity,initialWholeStreamAcceptance=False,invalidInitialNaturalStreamsRetained=4,nativeSRCComparisons=comparisons,explicitStop=stopped,naturalEndMaster=dict(bytes=len(blob),sha256=sha(blob),decodedFrames=len(decoded),sampleRate=44100,channels=2,allFinite=True,decodedFloat32SHA256=sha(pcm),windows=natural_audio,producerQuantumClaim=False,codecTimingOrFirstAudibleFrameAccepted=False),noPCMRepairOrDelayGainFitting=True,musicalPitchAccuracyAccepted=False,musicalSourceQualityAccepted=False,seamlessTransitionAccepted=False,exactSeratoCompositionAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('master_original',type=Path);p.add_argument('reference_original',type=Path);p.add_argument('output',type=Path);args=p.parse_args();report=inspect(args.original,args.master_original,args.reference_original)
    with args.output.open('x') as f:json.dump(report,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({k:report[k] for k in ['passed','nativeSRCComparisons','explicitStop','naturalEndMaster']},indent=2));raise SystemExit(0 if report['passed'] else 1)
