#!/usr/bin/env python3
"""Inspect unforced-rate source identities, real separation conversion and audio."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import struct
import numpy as np
from inspect_slicer_warp_164 import beat, source


def read_wave(path):
    data=path.read_bytes();assert data[:4]==b'RIFF' and data[8:12]==b'WAVE';at=12;fmt=pcm=None
    while at+8<=len(data):
        name=data[at:at+4];size=struct.unpack_from('<I',data,at+4)[0]
        if name==b'fmt ':
            fmt=struct.unpack_from('<HHIIHH',data,at+8)
        if name==b'data':pcm=data[at+8:at+8+size]
        at+=8+size+(size%2)
    assert fmt is not None and pcm is not None
    code,channels,rate,average,align,bits=fmt;assert code==3 and channels==2 and average==rate*8 and align==8 and bits==32
    x=np.frombuffer(pcm,'<f4').reshape(-1,2);assert np.isfinite(x).all();return rate,x


def inspect(path,sources):
    raw=path.read_bytes();r=json.loads(raw);root=Path(__file__).resolve().parents[1]
    assert r['diagnosticCheckpoint']==171 and r['workflowCompleted'] and r['sourceStable'] and not r['errors'] and r['sourceBefore']==r['sourceAfter']
    for n,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/n).read_bytes()).hexdigest()==digest,n
    harness=(sources/'stem-natural-171-harness.js').read_text();assert 'window.AudioContext=' not in harness and 'super({...options,sampleRate:' not in harness
    rate=r['context']['sampleRate'];assert r['context']['requestedSampleRate'] is None and r['context']['constructor']=='AudioContext' and rate==r['sampleRate']==r['input']['sampleRate']
    assert r['input']['channels']==2 and abs(r['input']['duration']-6.8)<=1/rate and r['input']['frames']==round(6.8*rate)
    assert hashlib.sha256((root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes()).hexdigest()==r['import']['contentHash']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    job=root/'local-evidence/stem-jobs'/r['ready']['job'];m=json.loads((job/'output/manifest.json').read_bytes())
    assert m['state']=='complete' and m['backend']=='scnet' and m['model']=='SCNet-large official' and m['model_sha256']=='719e5abb8ed920305dad546ac3cd6fb0b1e9c3092d14ce21827bfc0423af3070'
    worker_hash=hashlib.sha256((root/'scripts/stem_worker.py').read_bytes()).hexdigest()
    expected_key=hashlib.sha256(json.dumps({'input':m['source_sha256'],'model':m['model_sha256'],'parameters':m['parameters'],'worker_sha256':worker_hash},sort_keys=True).encode()).hexdigest()
    assert m['cache_key']==expected_key
    assert hashlib.sha256((job/'input.wav').read_bytes()).hexdigest()==r['canonicalUpload']['sha256']==m['source_sha256']
    input_rate,input_pcm=read_wave(job/'input.wav')
    assert (job/'input.wav').stat().st_size==r['canonicalUpload']['bytes'] and input_rate==rate and len(input_pcm)==r['input']['frames']
    assert r['newCanonicalInput']==(m['source_sha256']!=r['prior44100SourceSHA256'])
    if r['newCanonicalInput']:assert r['ready']['job']!='8266a41f62fc4fc5b92808dd3d988cec'
    worker=[]
    for s in m['stems']:
        p=job/'output'/s['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256'];output_rate,x=read_wave(p)
        assert output_rate==m['sample_rate']==44100 and x.shape==(m['frames'],2) and m['frames']==299880 and np.isfinite(x).all()
        worker.append(dict(name=s['name'],sampleRate=44100,frames=len(x),sha256=s['sha256']))
    decoded={};decoded_info=[]
    for s in r['decodedStemPCM']:
        assert s['sampleRate']==rate and abs(s['frames']-r['input']['frames'])<=r['criteria']['maximumFrameMismatch'] and len(s['channels'])==2
        channels=[]
        for c in s['channels']:
            data=base64.b64decode(c['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==c['sha256'];x=np.frombuffer(data,'<f4').astype(float)
            assert len(x)==s['frames'] and np.isfinite(x).all();channels.append(x)
        decoded[s['name']]=np.stack(channels,axis=1);decoded_info.append(dict(name=s['name'],frames=s['frames'],sampleRate=rate,channelSHA256=[c['sha256'] for c in s['channels']]))
    assert set(decoded)=={'vocals','other','bass','drums'} and r['originalUnchanged'] and r['importedFileUnchanged'] and r['decodedStemsUnchanged']
    assert [s['name'] for s in r['stages']]==['raw-selected-play','keylock-key3-play','keylock-relative-tempo','stop']
    observations=[];keyed=r['stages'][1]['after']
    for s in r['stages']:
        a=s['after'];stopped=s['name']=='stop';tempo=s['name']=='keylock-relative-tempo';raw_stage=s['name']=='raw-selected-play'
        assert a['trackId']==r['import']['id'] and a['mask']==[False,True,True,True] and not a['reverse'] and not a['loop'] and not a['processing'] and not a['pending']
        assert a['keylock']==(not raw_stage) and a['keyShift']==(0 if raw_stage else 3)
        if stopped:
            assert not a['playing'] and not a['voice'];expected=s['immediate']['position']
        else:
            assert a['playing'] and a['voice'] and np.allclose(a['gains'],[0,0,1,1,1],atol=1e-7,rtol=0)
            bpm=127.2 if tempo else 120;assert abs(a['gridBPM']-bpm)<1e-8 and abs(a['nominalBPM']-bpm)<1e-8 and abs(a['shownBPM']-bpm)<.05
            beats=beat(a['anchorPosition'])+(a['at']-a['anchorTime'])*bpm/60
            if tempo:beats=beat(keyed['anchorPosition'])+(a['anchorTime']-keyed['anchorTime'])*2+(a['at']-a['anchorTime'])*bpm/60
            expected=float(source(beats))
        clock_error=abs(a['position']-expected);assert clock_error<r['criteria']['maximumPositionError']
        packets=[]
        for p in s['pcm']:
            data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256'];x=np.frombuffer(data,'<f4').astype(float)
            assert len(x)==p['frames']==round(.3*rate) and np.isfinite(x).all() and not p['errors'];cursor=p['startFrame']
            for i,q in enumerate(p['quanta']):
                assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
            assert cursor==p['startFrame']+len(x)
            rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));assert peak<r['criteria']['maximumStoppedPeak'] if stopped else rms>r['criteria']['minimumRMS']
            row=dict(channel=p['channel'],frames=len(x),contiguousQuanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak)
            if raw_stage:
                anchor_frame=a['anchorTime']*rate;assert abs(anchor_frame-round(anchor_frame))<1e-6 and a['anchorPosition']==0 and a['gridBPM']==120
                window=(np.arange(len(x))>=round(.05*rate))&(np.arange(len(x))<round(.25*rate));indices=p['startFrame']+np.arange(len(x))[window]-round(anchor_frame)
                assert indices.min()>=0 and indices.max()<rate
                want=sum(decoded[n][indices,p['channel']] for n in ['other','bass','drums']);relative=float(np.sqrt(np.mean((x[window]-want)**2))/np.sqrt(np.mean(want**2)))
                row.update(rawSelectedDecodedSourceRelativeRMSError=relative,rawSelectedDecodedSourceCorrect=relative<r['criteria']['rawReferenceMaxRelativeRMS'])
            packets.append(row)
        observations.append(dict(name=s['name'],sourceClockErrorSeconds=clock_error,expectedPosition=expected,observedPosition=a['position'],packets=packets))
    passed=all(p.get('rawSelectedDecodedSourceCorrect',True) for s in observations for p in s['packets'])
    return dict(checkpoint=171,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],context=r['context'],input=r['input'],canonicalUpload=r['canonicalUpload'],newCanonicalInput=r['newCanonicalInput'],job=r['ready']['job'],model={'name':m['model'],'sha256':m['model_sha256'],'revision':m['model_revision'],'runtime':m['runtime'],'timing':m['timing'],'cached':m['cached'],'cacheKey':m['cache_key']},workerOutputs=worker,decodedOutputs=decoded_info,maximumDecodedFrameMismatch=max(abs(x['frames']-r['input']['frames']) for x in decoded_info),criteria=r['criteria'],observations=observations,natural48000ScopedWorkflowAccepted=bool(passed and rate==48000),default48000FullParityAcceptance=False,contextMigrationAccepted=False,musicalPitchQualityAccepted=False,sourceAttributionAccepted=False,newMusicalHoldout=False,exactSeratoParityAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({'passed':r['passed'],'context':r['context'],'job':r['job'],'maximumDecodedFrameMismatch':r['maximumDecodedFrameMismatch'],'observations':r['observations']}));raise SystemExit(0 if r['passed'] else 1)
