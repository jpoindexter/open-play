#!/usr/bin/env python3
"""Inspect the complete fixed-layout browser replacement capture, without fitting PCM."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def inspect(path):
    raw = path.read_bytes(); record = json.loads(raw)
    assert record['workflowCompleted'] and record['sourceStable'] and not record['errors']
    assert record['originalUnchanged']
    for name, sha in record['sourceBefore'].items():
        assert hashlib.sha256((ROOT/'prototype'/name).read_bytes()).hexdigest() == sha
    capture = record['capture']; assert not capture['errors']
    sr = record['sampleRate']; frames = capture['frames']; cursor = capture['startFrame']
    assert frames == 4 * sr and len(record['pcm']) == 12
    for i, quantum in enumerate(capture['quanta']):
        assert quantum['frame'] == cursor
        assert 0 < quantum['count'] <= 128 and (quantum['count'] == 128 or i == len(capture['quanta']) - 1)
        cursor += quantum['count']
    assert cursor == capture['startFrame'] + frames
    data = []
    for index, packet in enumerate(record['pcm']):
        assert packet['channel'] == index
        block = base64.b64decode(packet['base64'], validate=True)
        assert hashlib.sha256(block).hexdigest() == packet['sha256']
        pcm = np.frombuffer(block, '<f4').astype(float)
        assert len(pcm) == frames and np.isfinite(pcm).all()
        data.append(pcm)
    acks = record['acknowledgments']; assert len(acks) == 16
    for i, ack in enumerate(acks):
        assert ack['startFrame'] == i * sr // 2 and ack['endFrame'] == (i + 1) * sr // 2
        assert ack['firstChannel'] == 2 and ack['channels'] == 8
    criteria = record['criteria']; rows = []
    for channel in range(2):
        reference, candidate = data[channel], data[channel+2]
        baseline = float(np.sqrt(np.mean(candidate[round(.2*sr):round(.7*sr)]**2)))
        assert baseline > .01
        step = round(.01*sr)
        ratios = [float(np.sqrt(np.mean(candidate[i:i+step]**2))/baseline)
                  for i in range(0, frames-step+1, step)]
        edges = np.diff(np.r_[False, np.abs(candidate) < 1e-7, False].astype(int))
        runs = np.where(edges == -1)[0] - np.where(edges == 1)[0]
        longest = int(max(runs, default=0))/sr
        jump = float(np.max(np.abs(np.diff(candidate))))
        passed = min(ratios) >= criteria['minimum10msRMSRatio'] and jump <= criteria['maximumAdjacentJump'] and longest <= criteria['maximumNearZeroRunSeconds']
        rows.append(dict(channel=channel, baselineRMS=baseline, minimum10msRMSRatio=min(ratios),
                         maximumAdjacentJump=jump, longestNearZeroRunSeconds=longest,
                         maximumDifferenceVsIndependentControl=float(np.max(np.abs(candidate-reference))),
                         boundedBrowserContinuityPassed=passed))
    pre = [float(np.max(np.abs(c[:round(.8*sr)]))) for c in data[4:]]
    post = [float(np.sqrt(np.mean(c[round(2*sr):]**2))) for c in data[4:]]
    stem_sum = [sum(data[4+channel::2]) for channel in range(2)]
    sum_rms = [float(np.sqrt(np.mean(c[round(2*sr):]**2))) for c in stem_sum]
    assert max(pre) == 0 and min(sum_rms) > .01
    return dict(checkpoint=145, scope=record['scope'], originalSHA256=hashlib.sha256(raw).hexdigest(),
                sampleRate=sr, framesPerChannel=frames, channelsHashCheckedAndFinite=12,
                contiguousQuanta=len(capture['quanta']), sourceHashes=record['sourceBefore'],
                replacementChunks=len(acks), replacementAcknowledgmentSeconds=record['replaceAcknowledgedAt']-record['replaceStartedAt'],
                originalInputsUnchanged=True, originalChannels=rows, preReplacementStemPeaks=pre,
                postReplacementStemRMS=post, postReplacementStemSumRMS=sum_rms,
                componentContinuityAccepted=all(row['boundedBrowserContinuityPassed'] for row in rows),
                productionEngineIntegrated=False, padAcceptance=False, nativeAcceptance=False,
                musicalSeparationQualityAcceptance=False, fullParityAcceptance=False,
                scopeLimits='One4second44.1kHz browser capture at rate1.1, neutral key shift, generated original tone and prior real SCNet cache. No live refill/drop/seek/abort integration, production adapter/engine/pad transfer, music quality or hardware evidence.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path); parser.add_argument('output', type=Path)
    args = parser.parse_args(); result = inspect(args.capture)
    with args.output.open('x') as output:
        json.dump(result, output, indent=2, allow_nan=False); output.write('\n')
    print(json.dumps(result, indent=2, allow_nan=False))
