#!/usr/bin/env python3
"""Inspect actual sparse-loop selector, restored metadata and sampler audio."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

def inspect(path,sources):
    raw=path.read_bytes();r=json.loads(raw)
    assert r['diagnosticCheckpoint']==174 and r['sourceStable'] and r['sourceBefore']==r['sourceAfter']
    for name,digest in r['sourceBefore'].items():assert hashlib.sha256((sources/name).read_bytes()).hexdigest()==digest,name
    info=dict(checkpoint=174,phase=r['phase'],originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],context=r['context'],inputFile=r['inputFile'],metadata=r.get('metadata'),options=r.get('options'),errors=r['errors'],uiErrors=r['uiErrors'])
    assert r['inputFile']['sha256']=='cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3' and r['inputFile']['bytes']==167100
    rate=r['context']['sampleRate'];assert rate==48000 and r['context']['requestedSampleRate'] is None and r['context']['constructor']=='AudioContext'
    assert r['metadata']['loopKeys']==['1'] if r['phase']=='fresh' else r['metadata']['loopKeys']==['0','1']
    loops=r['metadata']['loops'];assert len(loops)==2 and loops[0] is None and loops[1]['start']==1 and abs(loops[1]['end']-47/15)<1e-8
    assert r['metadata']['cues'][0] is None and r['metadata']['cues'][1] is None and abs(r['metadata']['cues'][2]['position']-1.8)<1e-8
    assert r['persistedMetadata']['savedLoops']==loops
    if not r['workflowCompleted']:
        assert not r.get('advancedOpened') and r['uiErrors'];return dict(info,passed=False,kind='actual Advanced selector did not open',observations=[],nativeAcceptance=False,fullParityAcceptance=False)
    assert r['witnessZeroKeepAlive']['offset']==0 and r['witnessZeroKeepAlive']['channels']==2
    assert not r['errors'] and not r['uiErrors'] and r['originalUnchanged'] and r['inputFileUnchanged'] and r['advancedOpened']
    assert [o['value'] for o in r['options']]==['start','cue:2','loop:1']
    if r['phase']=='restored':assert not r['inputFile']['hasDirectFile'] and r['inputFile']['storage']=='saved'
    decoded=[]
    for channel,p in enumerate(r['inputPCM']):
        data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256'];x=np.frombuffer(data,'<f4').astype(float);assert len(x)==326400 and np.isfinite(x).all();decoded.append(x)
    assert [s['name'] for s in r['stages']]==['raw-repeat','keylock-repeat','stop'];observations=[]
    for s in r['stages']:
        a=s['after'];stop=s['name']=='stop';keyed=s['name']!='raw-repeat';row={'name':s['name']};errors=[];wraps=0
        assert a['slot']['from']=='loop:1' and a['slot']['repeat']
        if stop:assert not a['voice'] and not a['slot']['playing']
        else:
            v=a['voice'];settings=v['settings'];expected_rate=1.1 if keyed else 1
            assert settings['keylock']==keyed and abs(settings['rate']-expected_rate)<1e-8 and settings['start']==settings['loopStart']==1 and abs(settings['loopEnd']-47/15)<1e-8
            assert v['sourceLoop'] and abs(v['scale']-expected_rate if keyed else v['scale']-1)<1e-8
            assert abs(v['sourceLoopStart']-1/v['scale'])<1e-8 and abs(v['sourceLoopEnd']-47/15/v['scale'])<1e-8 and abs(v['sourceRate']-1)<1e-8 and abs(v['gain']-.4)<1e-7 and abs(v['trackGain']-1)<1e-7
            samples=[a]+s['clockSamples']+[s['last']]
            for x in samples:
                vv=x['voice'];st=vv['settings'];p=vv['anchorPosition']+(x['at']-vv['anchorTime'])*st['rate'];p=st['loopStart']+(p-st['loopStart'])%(st['loopEnd']-st['loopStart']);errors.append(abs(x['position']-p))
            wraps=sum(b['position']<a['position']-.1 for a,b in zip(samples,samples[1:]));assert wraps>=1 and max(errors)<r['criteria']['maximumClockError'];row.update(observedWraps=wraps,clockSamples=len(samples),maximumClockErrorSeconds=max(errors))
        packets=[]
        for p in s['pcm']:
            data=base64.b64decode(p['base64'],validate=True);assert hashlib.sha256(data).hexdigest()==p['sha256'];x=np.frombuffer(data,'<f4').astype(float);assert len(x)==p['frames']==round((.3 if stop else 3)*rate) and np.isfinite(x).all() and not p['errors'];cursor=p['startFrame']
            for i,q in enumerate(p['quanta']):assert q['frame']==cursor and 0<q['count']<=128 and (q['count']==128 or i==len(p['quanta'])-1);cursor+=q['count']
            assert cursor==p['startFrame']+len(x);rms=float(np.sqrt(np.mean(x*x)));peak=float(np.max(np.abs(x)));assert peak<r['criteria']['maximumStoppedPeak'] if stop else rms>r['criteria']['minimumRMS']
            packet=dict(channel=p['channel'],frames=len(x),quanta=len(p['quanta']),sha256=p['sha256'],rms=rms,peak=peak)
            if s['name']=='raw-repeat':
                anchor=a['voice']['anchorTime']*rate;assert abs(anchor-round(anchor))<1e-6
                first=round(a['voice']['settings']['loopStart']*rate);end=round(a['voice']['settings']['loopEnd']*rate)
                indices=first+(p['startFrame']+np.arange(len(x))-round(anchor))%(end-first)
                want=decoded[p['channel']][indices]*.4;relative=float(np.sqrt(np.mean((x-want)**2))/np.sqrt(np.mean(want**2)));packet.update(knownOriginalRelativeRMSError=relative,rawSourceAccepted=relative<r['criteria']['rawRelativeRMS'])
            packets.append(packet)
        row['packets']=packets;observations.append(row)
    passed=all(p.get('rawSourceAccepted',True) for s in observations for p in s['packets'])
    return dict(info,passed=passed,observations=observations,witnessZeroKeepAlive=r['witnessZeroKeepAlive'],decodedOriginalSHA256=[p['sha256'] for p in r['inputPCM']],rawSourceWindow='whole raw3seconds, fixed known gain/start/native frame mapping; no fitted lag/gain/phase',pitchQualityAccepted=False,sourceSeparationAccepted=False,exactVendorTimingAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True);a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as f:json.dump(r,f,indent=2,allow_nan=False);f.write('\n')
    print(json.dumps({'passed':r['passed'],'phase':r['phase'],'errors':r['errors'],'uiErrors':r['uiErrors'],'observations':r['observations']}));raise SystemExit(0 if r['passed'] else 1)
