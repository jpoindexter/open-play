#!/usr/bin/env python3
"""Inspect actual app PCM and acknowledged replacement addresses after window drop."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def inspect(path):
    raw = path.read_bytes(); r = json.loads(raw)
    assert r['workflowCompleted'] and r['sourceStable'] and r['originalUnchanged'] and not r['errors']
    assert r['sourceBefore'] == r['sourceAfter']
    assert r['criteria'] == dict(captureSeconds=2.5,minimum10msRMSRatio=.85,maximumAdjacentJump=.03,maximumNearZeroRunSeconds=.001,nearZeroAbsolute=1e-7,maximumFrequencyRelativeError=.01)
    assert (r['sourceRate'], r['semitones']) in [(44100, 0), (22050, 3)]
    assert r['startPosition'] == 4 and r['rate'] == 1.1
    for file, sha in r['sourceBefore'].items():
        assert hashlib.sha256((ROOT/'prototype'/file).read_bytes()).hexdigest() == sha, file
    initial, before, after, repeated = [r[key]['groups'][0] for key in ['initial','before','afterInitial','afterRepeat']]
    assert initial['origin'] > 0 and before['start'] > before['origin']
    assert len({group['id'] for group in [initial,before,after,repeated]}) == 1
    assert all(group['processorChannels'] == 18 and group['nodeCount'] == 1 for group in [initial,before,after,repeated])
    assert r['afterInitial']['activeStemBank'] == 0 and r['afterRepeat']['activeStemBank'] == 1
    assert r['initial']['publicOutputs'] == r['afterRepeat']['publicOutputs'] == 5
    assert r['initial']['sourceGeometry'][0]['sampleRate'] == r['sourceRate']
    assert r['initial']['sourceGeometry'][0]['frames'] == r['sourceRate']*8
    factor = 2**(r['semitones']/12)
    assert abs(before['pitchFactor']-factor) < 1e-12
    sr = r['sampleRate']; batches = []
    for index, prior in [(0,before),(1,r['beforeRepeat']['groups'][0])]:
        calls = [call for call in r['calls'] if call['batch'] == index]
        assert calls and calls[0]['startFrame'] > 0
        cursor = calls[0]['startFrame']
        for call in calls:
            assert call['startFrame'] == cursor and call['endFrame'] > cursor
            assert call['firstChannel'] == 2+8*index and call['channels'] == 8
            cursor = call['endFrame']
        source_start = prior['origin']+calls[0]['startFrame']*factor/sr
        source_end = prior['origin']+calls[-1]['endFrame']*factor/sr
        assert source_start >= prior['start']-factor/sr and source_end <= 8+factor/sr
        batches.append(dict(bank=index,chunks=len(calls),firstProcessorFrame=calls[0]['startFrame'],
                            lastProcessorFrame=calls[-1]['endFrame'],firstSourceSeconds=source_start,
                            lastSourceSeconds=source_end,observedRetainedStart=prior['start']))
    assert max(abs(r[key]['error']) for key in ['clockAfterInitial','clockAfterRepeat']) < 1e-9
    assert r['selectedGains'][0] < 1e-6 and all(v > .999 for v in r['selectedGains'][2:])

    def pcm(packet):
        data = base64.b64decode(packet['base64'],validate=True)
        assert hashlib.sha256(data).hexdigest() == packet['sha256']
        x = np.frombuffer(data,'<f4').astype(float)
        assert len(x) == packet['frames'] and np.isfinite(x).all() and not packet['errors']
        cursor = packet['startFrame']
        for index, quantum in enumerate(packet['quanta']):
            assert quantum['frame'] == cursor and 0 < quantum['count'] <= 128
            assert quantum['count'] == 128 or index == len(packet['quanta'])-1
            cursor += quantum['count']
        assert cursor == packet['startFrame']+len(x)
        return x

    criteria = r['criteria']; rows = []
    assert len(r['pcm']) == 2 and r['pcm'][0]['startFrame'] == r['pcm'][1]['startFrame']
    for channel, packet in enumerate(r['pcm']):
        x = pcm(packet); assert len(x) == round(criteria['captureSeconds']*sr)
        first, last = round(.05*sr),round((criteria['captureSeconds']-.1)*sr)
        baseline = float(np.sqrt(np.mean(x[round(.05*sr):round(.25*sr)]**2))); assert baseline > .005
        v = x[first:last]; step = round(.01*sr)
        ratios = [float(np.sqrt(np.mean(v[i:i+step]**2))/baseline) for i in range(0,len(v)-step,step)]
        edges = np.diff(np.r_[False,np.abs(v)<criteria['nearZeroAbsolute'],False].astype(int))
        runs = np.where(edges == -1)[0]-np.where(edges == 1)[0]
        near_zero = int(max(runs,default=0))/sr; jump = float(np.max(np.abs(np.diff(v))))
        # Fixed final stable interval; no fitted timing or gain correction.
        start, end = round((criteria['captureSeconds']-.7)*sr),round((criteria['captureSeconds']-.2)*sr)
        assert (packet['startFrame']+start)/sr > r['repeatReadyAt']+.2
        tone = x[start:end]; spectrum = np.abs(np.fft.rfft(tone*np.hanning(len(tone))))
        frequencies = np.fft.rfftfreq(len(tone),1/sr); expected = [330,550][channel]*factor
        allowed = np.where((frequencies >= expected*.95)&(frequencies <= expected*1.05))[0]
        peak = allowed[np.argmax(spectrum[allowed])]; assert 0 < peak < len(spectrum)-1
        logs = np.log(np.maximum(spectrum[peak-1:peak+2],1e-30))
        fraction = .5*(logs[0]-logs[2])/(logs[0]-2*logs[1]+logs[2])
        measured = float((peak+fraction)*sr/len(tone)); frequency_error = abs(measured-expected)/expected
        passed = min(ratios)>=criteria['minimum10msRMSRatio'] and jump<=criteria['maximumAdjacentJump'] and near_zero<=criteria['maximumNearZeroRunSeconds'] and frequency_error<=criteria['maximumFrequencyRelativeError']
        rows.append(dict(channel=channel,frames=len(x),sha256=packet['sha256'],contiguousQuanta=len(packet['quanta']),
                         baselineRMS=baseline,minimum10msRMSRatio=min(ratios),maximumAdjacentJump=jump,
                         longestNearZeroRunSeconds=near_zero,expectedFrequencyHz=expected,
                         measuredFrequencyHz=measured,relativeFrequencyError=frequency_error,passed=passed))
    tail = {}
    for key in ['muted','restored','stopped']:
        tail[key] = []
        for channel, packet in enumerate(r[key]['pcm']):
            x = pcm(packet); peak = float(np.max(np.abs(x))); rms = float(np.sqrt(np.mean(x*x)))
            assert peak == 0 if key in ['muted','stopped'] else rms > .005
            tail[key].append(dict(channel=channel,frames=len(x),peak=peak,rms=rms,sha256=packet['sha256']))
    assert r['muted']['enabled'] == [False]*4 and r['restored']['enabled'] == [True]*4 and not r['stopped']['playing']
    return dict(checkpoint=147,passed=all(row['passed'] for row in rows),scope=r['scope'],
                originalSHA256=hashlib.sha256(raw).hexdigest(),originalBytes=len(raw),criteria=criteria,
                inspectionInterval='Same50ms startup/100ms end exclusions for continuity; every retained sample hash/finite checked. Fixed final500ms Hann FFT; no PCM repair, timing or gain fit.',
                sourceRate=r['sourceRate'],sampleRate=sr,semitones=r['semitones'],rate=r['rate'],
                actualOriginalSampleRate=r['initial']['sourceGeometry'][0]['sampleRate'],
                groupOriginSeconds=before['origin'],retainedWindowStartSeconds=before['start'],batches=batches,
                clockAfterInitial=r['clockAfterInitial'],clockAfterRepeat=r['clockAfterRepeat'],
                channels=rows,tail=tail,sourceHashes=r['sourceBefore'],sourceStable=True,
                originalDecodedAudioUnchanged=True,nativeAcceptance=False,hardwareAcceptance=False,
                musicalSeparationQualityAcceptance=False,exactAudibleCursorAcceptance=False,fullParityAcceptance=False,
                remaining='One source/tempo/pitch geometry per declared fixture; variable pitch maps, other rates/formats, long/multi-deck resources, musical quality and other transport/native/hardware/reference gaps remain.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture',type=Path); parser.add_argument('output',type=Path)
    args = parser.parse_args(); result = inspect(args.capture)
    with args.output.open('x') as output:
        json.dump(result,output,indent=2,allow_nan=False); output.write('\n')
    print(json.dumps({key:result[key] for key in ['passed','groupOriginSeconds','retainedWindowStartSeconds','batches','channels']},indent=2))
    raise SystemExit(0 if result['passed'] else 1)
