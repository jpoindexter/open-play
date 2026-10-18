#!/usr/bin/env python3
"""Inspect full app activation PCM using the unchanged checkpoint137 thresholds."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def inspect(path, sources, processor_channels=10):
    original = path.read_bytes(); r = json.loads(original)
    assert r['workflowCompleted'] and r['sourceStable'] and not r['errors'] and r['originalUnchanged']
    assert r['job']['state'] == 'complete' and r['job']['model'] == 'SCNet-large official'
    assert not r['activation']['voiceChanged'] and r['initialLive']['reservedStems']
    assert r['activation']['live']['stemsReady']
    assert r['initialLive']['groups'][0]['id'] == r['activation']['live']['groups'][0]['id']
    assert r['initialLive']['groups'][0]['processorChannels'] == r['activation']['live']['groups'][0]['processorChannels'] == processor_channels
    assert r['firstPad']['enabled'] == [False, True, True, True]
    assert r['firstPad']['restored'] == [True]*4 and r['firstPad']['gainValues'] == [0, 0, 1, 1, 1]
    for name, sha in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest() == sha, name
    sr = r['sampleRate']; criteria = r['criteria']; rows = []

    def pcm(packet):
        data = base64.b64decode(packet['base64'], validate=True)
        assert hashlib.sha256(data).hexdigest() == packet['sha256']
        array = np.frombuffer(data, '<f4').astype(float)
        assert len(array) == packet['frames'] and np.isfinite(array).all() and not packet['errors']
        cursor = packet['startFrame']
        for index, quantum in enumerate(packet['quanta']):
            assert quantum['frame'] == cursor and 0 < quantum['count'] <= 128
            assert quantum['count'] == 128 or index == len(packet['quanta']) - 1
            cursor += quantum['count']
        assert cursor == packet['startFrame'] + len(array)
        return array

    assert len(r['pcm']) == 2 and r['pcm'][0]['startFrame'] == r['pcm'][1]['startFrame']
    for channel, packet in enumerate(r['pcm']):
        x = pcm(packet); assert len(x) == round(criteria['captureSeconds']*sr)
        # Same declared startup/end exclusions as the prior failed capture.
        # All samples, including these intervals, remain hash/finite checked.
        first, last = round(.05*sr), round((criteria['captureSeconds']-.1)*sr)
        v = x[first:last]; baseline = float(np.sqrt(np.mean(x[round(.05*sr):round(.25*sr)]**2)))
        assert baseline > .005
        step = round(.01*sr)
        ratios = [float(np.sqrt(np.mean(v[i:i+step]**2))/baseline) for i in range(0, len(v)-step, step)]
        edges = np.diff(np.r_[False, np.abs(v) < criteria['nearZeroAbsolute'], False].astype(int))
        runs = np.where(edges == -1)[0] - np.where(edges == 1)[0]
        longest = int(max(runs, default=0))/sr; jump = float(np.max(np.abs(np.diff(v))))
        passed = min(ratios) >= criteria['minimum10msRMSRatio'] and longest <= criteria['maximumNearZeroRunSeconds'] and jump <= criteria['maximumAdjacentJump']
        rows.append(dict(channel=channel,frames=len(x),sha256=packet['sha256'],baselineRMS=baseline,
                         minimum10msRMSRatio=min(ratios),maxAdjacentSampleJump=jump,
                         longestNearZeroRunSeconds=longest,passed=passed,contiguousQuanta=len(packet['quanta'])))
    tail = {}
    for key in ['muted', 'restored', 'stopped']:
        tail[key] = []
        for channel, packet in enumerate(r[key]['pcm']):
            x = pcm(packet); peak = float(np.max(np.abs(x))); rms = float(np.sqrt(np.mean(x*x)))
            assert peak == 0 if key in ['muted', 'stopped'] else rms > .005
            tail[key].append(dict(channel=channel,frames=len(x),sha256=packet['sha256'],peak=peak,rms=rms))
    assert r['muted']['enabled'] == [False]*4 and r['restored']['enabled'] == [True]*4 and not r['stopped']['playing']
    return dict(checkpoint=145,passed=all(row['passed'] for row in rows),scope=r['scope'],
                originalSHA256=hashlib.sha256(original).hexdigest(),originalBytes=len(original),
                criteria=criteria,inspectionInterval='Same prior criterion: first50ms/last100ms excluded from continuity metrics; every retained sample hash/finite checked. No PCM repair/alignment/fitting.',
                sampleRate=sr,transport=r['transport'],channels=rows,tail=tail,
                activation=r['activation'],firstPad=r['firstPad'],
                clockDifferenceAtAcknowledgment=r['activation']['actualPosition']-r['activation']['originalExpectedPosition'],
                sourceHashes=r['sourceBefore'],sourceStable=True,originalDecodedAudioUnchanged=True,
                nativeAcceptance=False,hardwareAcceptance=False,musicalSeparationQualityAcceptance=False,fullParityAcceptance=False,
                remaining='Other rates/key shifts, mono/SRC/refill/drop and abort races, repeat preparation, reverse/loop/warped/StemSlip and music/native/controller/reference acceptance remain separate.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path); parser.add_argument('output', type=Path)
    parser.add_argument('--sources', type=Path, default=ROOT/'prototype')
    args = parser.parse_args(); result = inspect(args.capture,args.sources)
    with args.output.open('x') as output:
        json.dump(result, output, indent=2, allow_nan=False); output.write('\n')
    print(json.dumps({key:result[key] for key in ['passed','channels','firstPad','clockDifferenceAtAcknowledgment']},indent=2))
