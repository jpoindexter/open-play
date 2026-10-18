#!/usr/bin/env python3
"""Reproduce the declared inactive-bank component and browser trace analyses."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def rms(x):
    return float(np.sqrt(np.mean(x*x)))


def component(path,baseline_start,interval_start,interval_end):
    raw = path.read_bytes();r = json.loads(raw);sr = r['sampleRate'];arrays = {};rows = []
    for name,digest in r['sourceHashes'].items():
        assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest() == digest,name
    for case in r['results']:
        for p in case['pcm']:
            assert Path(p['file']).name == p['file']
            data = (path.parent/p['file']).read_bytes()
            assert hashlib.sha256(data).hexdigest() == p['sha256']
            x = np.frombuffer(data,'<f4').astype(float)
            assert len(x) == r['frames'] and np.isfinite(x).all()
            arrays[(case['name'],p['channel'])] = x
            if p['channel'] == 12:
                continue
            baseline = rms(x[round(baseline_start*sr):round((baseline_start+.2)*sr)])
            assert baseline > .005
            step = round(.01*sr);start = round(interval_start*sr);end = round(interval_end*sr)
            ratios = [rms(x[i:i+step])/baseline for i in range(start,end-step,step)]
            rows.append(dict(case=case['name'],channel=p['channel'],frames=len(x),sha256=p['sha256'],baselineRMS=baseline,
                             minimum10msRMSRatio=min(ratios),minimumAt=(start+int(np.argmin(ratios))*step)/sr))
    comparisons = []
    for channel in [0,4]:
        a = arrays[('unchanged-inactive-bank',channel)];b = arrays[('populated-inactive-bank',channel)];at = r['changedAtFrame']
        comparisons.append(dict(channel=channel,maximumDifferenceBeforeChange=float(np.max(np.abs(a[:at]-b[:at]))),
                                maximumDifferenceAfterChange=float(np.max(np.abs(a[at:]-b[at:])))))
    return dict(checkpoint=152,scope=r['scope'],originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceHashes'],
                inspection=dict(baselineStart=baseline_start,baselineSeconds=.2,intervalStart=interval_start,intervalEnd=interval_end,windowSeconds=.01),
                rows=rows,comparisons=comparisons,inactivePopulationChangedObservedOutputs=any(c['maximumDifferenceAfterChange']>0 for c in comparisons),
                browserDipExplained=False,productionChanged=False,fullParityAcceptance=False)


def browser(path):
    raw = path.read_bytes();r = json.loads(raw);sr = r['sampleRate']
    assert r['workflowCompleted'] and r['sourceStable'] and not r['errors'] and r['originalUnchanged']
    assert r['sourceBefore'] == r['sourceAfter'] and len(r['pcm']) == 7 and r['criteria']['captureSeconds'] == 12
    for name,digest in r['sourceBefore'].items():
        assert hashlib.sha256((ROOT/'prototype'/name).read_bytes()).hexdigest() == digest,name
    assert [g['banks'] for g in r['generations']] == [[0]*4,[1]*4]
    assert all(all(g['sameOwners']) for g in r['generations'])
    start = r['generations'][1]['startedAt']-.2;end = r['generations'][1]['returnedAt']+.2
    baseline_start = r['generations'][0]['returnedAt']+.3
    rows = [];integrity = []
    assert len({p['startFrame'] for p in r['pcm']}) == 1
    for p in r['pcm']:
        data = base64.b64decode(p['base64'],validate=True)
        assert hashlib.sha256(data).hexdigest() == p['sha256']
        x = np.frombuffer(data,'<f4').astype(float)
        assert len(x) == p['frames'] == 12*sr and np.isfinite(x).all()
        cursor = p['startFrame'];issues = []
        for i,q in enumerate(p['quanta']):
            assert 0 < q['count'] <= 128
            if q['frame'] != cursor:
                issues.append(dict(quantum=i,expected=cursor,actual=q['frame']))
            assert q['count'] == 128 or i == len(p['quanta'])-1
            cursor += q['count']
        assert cursor == p['startFrame']+len(x)
        stop_frame = round(r['stopAt']*sr)
        pre_stop_valid = not any(min(v['expected'],v['actual']) < stop_frame for v in issues)
        pre_stop_errors = [e for e in p['errors'] if e.get('frame',min(e.get('expected',stop_frame),e.get('actual',stop_frame))) < stop_frame]
        assert pre_stop_valid and not pre_stop_errors
        missing = [e for e in p['errors'] if e.get('inputMissing')]
        integrity.append(dict(trace=p['trace'],wholeQuantumContinuityPassed=not issues,preStopQuantumContinuityPassed=True,
                              continuityIssues=issues,expectedInputDisconnectAfterStop=len(missing),producerErrorCount=len(p['errors']),
                              firstProducerError=p['errors'][0] if p['errors'] else None,lastProducerError=p['errors'][-1] if p['errors'] else None))
        epoch = p['startFrame']/sr
        def window(a,b):
            lo,hi = round((a-epoch)*sr),round((b-epoch)*sr)
            assert 0 <= lo < hi <= len(x)
            return x[lo:hi]
        baseline = rms(window(baseline_start,baseline_start+.2))
        row = dict(trace=p['trace'],frames=len(x),sha256=p['sha256'],contiguousQuanta=len(p['quanta']),baselineRMS=baseline)
        if p['trace'] != 'deck1-bank1-melody':
            assert baseline > .005
            lo,hi = round((start-epoch)*sr),round((end-epoch)*sr);step = round(.01*sr)
            ratios = [rms(x[n:n+step])/baseline for n in range(lo,hi-step,step)]
            row.update(minimum10msRMSRatio=min(ratios),minimumAt=epoch+(lo+int(np.argmin(ratios))*step)/sr,
                       belowOriginalFloor=min(ratios)<.85)
        else:
            assert baseline == 0
            row.update(afterPreparationRMS=rms(window(r['generations'][1]['returnedAt']+.3,r['generations'][1]['returnedAt']+.5)))
        rows.append(row)
    calls = [c for c in r['calls'] if c['deck'] == 1 and c['firstChannel'] == 10]
    assert calls and all(c['channels'] == 8 and c['endFrame'] > c['startFrame'] for c in calls)
    gains = [g for g in r['mainThreadTimerDelays'] if r['generations'][1]['startedAt'] <= g['audioTime'] <= r['generations'][1]['returnedAt']]
    assert gains
    return dict(checkpoint=152,scope=r['scope'],originalSHA256=hashlib.sha256(raw).hexdigest(),originalBytes=len(raw),sourceHashes=r['sourceBefore'],
                inspection=dict(baselineStart=baseline_start,baselineSeconds=.2,intervalStart=start,intervalEnd=end,windowSeconds=.01,
                                note='Full original PCM finite/hash/quanta checked; these fixed event-relative windows diagnose the second preparation only. No fitted alignment/gain or repaired PCM.'),
                rows=rows,captureIntegrity=integrity,wholeCaptureQuantumContinuityPassed=all(v['wholeQuantumContinuityPassed'] for v in integrity),
                preStopDiagnosticIntervalValid=True,replacementCalls=len(calls),replacementStart=calls[0]['submittedAt'],replacementEnd=calls[-1]['acknowledgedAt'],
                chunkFrames=[c['endFrame']-c['startFrame'] for c in calls],gainSamplesDuringPreparation=len(gains),
                sampledGainsStableDuringPreparation=all(g['deck1StemGains']==[0,0,1,1,1] and g['bankGains']==[[1]*4,[0]*4] and g['groupGains']==[1]*9 for g in gains),
                dipReproducedInThisTrace=any(row.get('belowOriginalFloor',False) for row in rows),
                prior151FailureStillOpen=True,productionChanged=False,browserDipExplained=False,fullParityAcceptance=False)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__);p.add_argument('mode',choices=['component','browser']);p.add_argument('original',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--baseline-start',type=float,default=.6);p.add_argument('--interval-start',type=float,default=2.7);p.add_argument('--interval-end',type=float,default=3.7)
    a = p.parse_args();r = browser(a.original) if a.mode=='browser' else component(a.original,a.baseline_start,a.interval_start,a.interval_end)
    payload = json.dumps(r,indent=2,allow_nan=False)+'\n'
    with a.output.open('x') as f:
        f.write(payload)
    print(json.dumps({k:v for k,v in r.items() if k not in ['sourceHashes','scope','inspection']},indent=2))
    raise SystemExit(1 if a.mode=='browser' and not r['wholeCaptureQuantumContinuityPassed'] else 0)
