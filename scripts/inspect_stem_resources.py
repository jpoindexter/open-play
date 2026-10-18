#!/usr/bin/env python3
"""Inspect complete durable four-deck resource/left-channel evidence."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CRITERIA = dict(captureSeconds=24,minimum10msRMSRatio=.85,maximumAdjacentJump=.03,
                maximumNearZeroRunSeconds=.001,nearZeroAbsolute=1e-7,
                maximumRetainedWindowSourceSeconds=12,maximumWASMCapacityBytesPerWorklet=128*1024*1024)


def inspect(path,sources):
    raw = path.read_bytes();r = json.loads(raw)
    assert r['workflowCompleted'] and not r['errors'] and r['originalUnchanged']
    assert r['sourceStable'] and r['sourceBefore'] == r['sourceAfter'] and r['criteria'] == CRITERIA
    for name,digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest() == digest,name
    assert [g['generation'] for g in r['generations']] == [1,2,3]
    assert [g['banks'] for g in r['generations']] == [[0]*4,[1]*4,[0]*4]
    assert all(all(g['sameOwners']) for g in r['generations'])
    assert r['transport'] == [dict(rate=rate,keyShift=key,keylock=True) for rate,key in zip([1,1.1,.8,1.25],[0,3,-2,0])]
    rows = [];stable = [0]*4;max_window = 0;max_remote_pcm = [0]*4;wasm = [set() for _ in range(4)]
    for sample in r['samples']:
        assert sample['decoded']['uniqueBuffers'] <= 9
        for d in sample['decks']:
            before,after,remote = d['before'],d['after'],d['remote'];index = d['index']
            if after['disposed']:
                assert not after['groups'] and after['retainedPCMBytes'] == 0 and remote is None
                continue
            assert before['publicOutputs'] == after['publicOutputs'] == 5
            assert remote and remote['channels'] == 18 and len(after['groups']) == 1
            group = after['groups'][0]
            assert group['processorChannels'] == 18 and group['nodeCount'] == 1
            span = group['end']-group['start'];max_window = max(max_window,span)
            assert span <= 12
            assert remote['retainedPCMViewBytes'] == (remote['endFrame']-remote['startFrame'])*18*4
            assert 0 < remote['uniqueRetainedArrayBufferBytes'] <= remote['retainedPCMViewBytes']
            assert 0 < remote['wasmLinearMemoryCapacityBytes'] <= 128*1024*1024
            max_remote_pcm[index] = max(max_remote_pcm[index],remote['uniqueRetainedArrayBufferBytes'])
            wasm[index].add(remote['wasmLinearMemoryCapacityBytes'])
            # Compare accounting only when the sampled before/after count and
            # transfer state are unchanged; remote queries can overlap refill.
            if before['retainedPCMBytes'] == after['retainedPCMBytes'] and before['inFlightPCMBytes'] == after['inFlightPCMBytes'] == 0:
                assert remote['retainedPCMViewBytes'] == after['retainedPCMBytes']
                stable[index] += 1
    assert all(n > 0 for n in stable)
    for i in range(4):
        initial = r['samples'][0]['decks'][i]['after']['groups'][0]
        final = r['beforeStop']['decks'][i]['after']['groups'][0]
        assert final['start'] > initial['start'] and final['end'] > initial['end']
        assert r['beforeStop']['decks'][i]['after']['state']['playing']
    assert r['beforeStop']['decoded']['uniqueBuffers'] == 9
    assert not set(r['generations'][0]['bufferIDs']) & {o['id'] for o in r['beforeStop']['decoded']['owners']}
    assert r['afterStop']['decoded']['uniqueBuffers'] == 5
    assert not any(o['owner'].startswith('deck') for o in r['afterStop']['decoded']['owners'])
    assert r['afterCacheClear']['decoded']['uniqueBuffers'] == 1
    sr = r['sampleRate'];packets = r['pcm'];assert len(packets) == 4
    assert len({p['startFrame'] for p in packets}) == 1
    for p in packets:
        data = base64.b64decode(p['base64'],validate=True)
        assert hashlib.sha256(data).hexdigest() == p['sha256']
        x = np.frombuffer(data,'<f4').astype(float)
        assert len(x) == p['frames'] == 24*sr and np.isfinite(x).all() and not p['errors']
        cursor = p['startFrame']
        for i,q in enumerate(p['quanta']):
            assert q['frame'] == cursor and 0 < q['count'] <= 128
            assert q['count'] == 128 or i == len(p['quanta'])-1
            cursor += q['count']
        assert cursor == p['startFrame']+len(x)
        def window(a,b):
            start,end = round(a*sr)-p['startFrame'],round(b*sr)-p['startFrame']
            assert 0 <= start < end <= len(x),(start,end,len(x))
            return x[start:end]
        def rms(v):
            return float(np.sqrt(np.mean(v*v)))
        start = p['startFrame']/sr;baseline = rms(window(start+.05,start+.15));assert baseline > .005
        continuous = window(start+.05,r['stopAt']);step = round(.01*sr)
        ratios = [rms(continuous[i:i+step])/baseline for i in range(0,len(continuous)-step,step)]
        edges = np.diff(np.r_[False,np.abs(continuous)<1e-7,False].astype(int))
        longest = int(max(np.where(edges == -1)[0]-np.where(edges == 1)[0],default=0))/sr
        jump = float(np.max(np.abs(np.diff(continuous))))
        tail = window(r['stopAt']+.10,r['stopAt']+.30)
        section = window(r['stopAt']-.60,r['stopAt']-.10)
        spectrum = np.abs(np.fft.rfft(section*np.hanning(len(section))))
        bin_index = int(np.argmax(spectrum[1:])+1)
        a,b,c = np.log(np.maximum(spectrum[bin_index-1:bin_index+2],1e-300))
        peak = (bin_index+.5*(a-c)/(a-2*b+c))*sr/len(section)
        expected = 330*2**(r['transport'][p['deck']]['keyShift']/12)
        row = dict(deck=p['deck'],channel=0,frames=len(x),sha256=p['sha256'],contiguousQuanta=len(p['quanta']),baselineRMS=baseline,
                   minimum10msRMSRatio=min(ratios),maximumAdjacentJump=jump,longestNearZeroRunSeconds=longest,
                   minimumRMSWindowAudioTime=(p['startFrame']+round(.05*sr)+int(np.argmin(ratios))*step)/sr,
                   stoppedPeak=float(np.max(np.abs(tail))),expectedFrequencyHz=expected,measuredFrequencyHz=float(peak))
        row['passed'] = bool(min(ratios) >= .85 and jump <= .03 and longest <= .001 and row['stoppedPeak'] < 1e-7 and abs(peak/expected-1) <= .01)
        rows.append(row)
    disposed_accounting = [d['after']['decodedBytes'] == 0 for d in r['afterStop']['decks']]
    return dict(checkpoint=151,passed=all(row['passed'] for row in rows) and all(disposed_accounting),audioPassed=all(row['passed'] for row in rows),sampledResourceBoundsPassed=True,scope=r['scope'],criteria=CRITERIA,
                originalSHA256=hashlib.sha256(raw).hexdigest(),originalBytes=len(raw),sourceHashes=r['sourceBefore'],sourceStable=True,
                generations=r['generations'],sampleCount=len(r['samples']),sampledMaximumSourceWindowSeconds=max_window,
                sampledMaximumRetainedArrayBufferBytesPerWorklet=max_remote_pcm,observedWASMCapacityBytesPerWorklet=[sorted(values) for values in wasm],
                stableAccountingComparisonsPerDeck=stable,uniqueDecodedBuffersBeforeStop=9,uniqueDecodedBuffersAfterStop=5,uniqueDecodedBuffersAfterCacheClear=1,
                disposedAdapterDecodedCounterIsZero=disposed_accounting,disposedCounterConsistencyPassed=all(disposed_accounting),
                channels=rows,mainThreadTimerMaximumExcessMs=max(d['excessMilliseconds'] for d in r['mainThreadTimerDelays']),
                captureWallMilliseconds=r['captureWallEnd']-r['captureWallStart'],
                inspection='All retained PCM finite/hash/quantum checked. Continuity+50ms to actual Stop; fixed+50–150ms baseline. Stop+100–300ms. Last steady500ms Hann/log-parabolic FFT. No fitting/PCM repair. Sampled resource maxima are not all-time/process bounds. Decoded ownership is explicit roots, not GC proof.',
                cpuDeadlineAcceptance=False,totalProcessMemoryAcceptance=False,garbageCollectionAcceptance=False,
                rightChannelAcousticAcceptance=False,musicalSeparationQualityAcceptance=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--sources',type=Path,default=ROOT/'prototype');a = p.parse_args();r = inspect(a.original,a.sources)
    payload = json.dumps(r,indent=2,allow_nan=False)+'\n'
    with a.output.open('x') as f:
        f.write(payload)
    print(json.dumps({k:r[k] for k in ['passed','sampleCount','sampledMaximumSourceWindowSeconds','sampledMaximumRetainedArrayBufferBytesPerWorklet','observedWASMCapacityBytesPerWorklet','disposedAdapterDecodedCounterIsZero','channels']},indent=2))
    raise SystemExit(0 if r['passed'] else 1)
