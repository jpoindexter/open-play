"""Inspect the fixed-layout, same-instance serial experiment without fitting audio."""
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT/'local-evidence/stem-activation-inplace-138'
original = (RAW/'original.json').read_bytes()
record = json.loads(original)
assert hashlib.sha256((ROOT/record['modulePath']).read_bytes()).hexdigest() == record['moduleSHA256']
assert hashlib.sha256((ROOT/'experiments/stem_activation_inplace.mjs').read_bytes()).hexdigest() == record['experimentSHA256']
sr, data = record['sampleRate'], {}
for row in record['results']:
    data[row['name']] = []
    for packet in row['pcm']:
        raw = (RAW/packet['file']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == packet['sha256']
        pcm = np.frombuffer(raw, '<f4').astype(float)
        assert len(pcm) == packet['frames'] and np.isfinite(pcm).all()
        data[row['name']].append(pcm)
rows = []
hot = data['inplace-real-stems']
for channel in range(2):
    x, reference = hot[channel], data['control-silent-stems'][channel]
    assert np.array_equal(x[:record['attachFrame']], reference[:record['attachFrame']])
    baseline = float(np.sqrt(np.mean(reference[round(.5*sr):round(.7*sr)]**2)))
    first, last, step = round(.4*sr), round(1.9*sr), round(.01*sr)
    ratios = [float(np.sqrt(np.mean(x[i:i+step]**2))/baseline) for i in range(first, last-step, step)]
    jump = float(np.max(np.abs(np.diff(x[first:last]))))
    edges = np.diff(np.r_[False, np.abs(x[first:last]) < 1e-7, False].astype(int))
    runs = np.where(edges == -1)[0] - np.where(edges == 1)[0]
    longest = int(max(runs, default=0))/sr
    a, b = round(1.3*sr), round(1.8*sr)
    total = sum(hot[index+channel] for index in [2, 4, 6, 8])
    relative = float(np.sqrt(np.mean((x[a:b]-total[a:b])**2)/np.mean(x[a:b]**2)))
    hz = [330, 550][channel]
    kernel = np.exp(-2j*np.pi*hz*np.arange(a, b)/sr)
    phase = float(np.angle(np.mean(x[a:b]*kernel)/np.mean(reference[a:b]*kernel), deg=True))
    rows.append({'channel': channel, 'beforeAttachByteIdentical': True,
                 'originalOutputByteIdenticalForWholeCapture': bool(np.array_equal(x, reference)),
                 'maximumOriginalDifference': float(np.max(np.abs(x-reference))),
                 'minimum10msRMSRatio': min(ratios), 'maximumAdjacentJump': jump,
                 'longestNearZeroRunSeconds': longest, 'postAttachPhaseVsControlDegrees': phase,
                 'postAttachStemSumRelativeRMSError': relative,
                 'boundedSerialContinuityPassed': min(ratios) >= .85 and jump <= .03 and longest <= .001})
report = {'scope': record['scope'], 'originalSHA256': hashlib.sha256(original).hexdigest(),
          'sampleRate': sr, 'moduleSHA256': record['moduleSHA256'],
          'attachTime': record['attachTime'], 'fixedGeometryChannels': 10,
          'allRetainedChannelsHashCheckedAndFinite': True, 'channels': rows,
          'stemOutputRMSAfterAttach': [float(np.sqrt(np.mean(channel[round(1.3*sr):round(1.8*sr)]**2))) for channel in hot[2:]],
          'finding': 'Keeping one10-channel processor and replacing only silent Stem inputs avoids the large cold-instance phase jump in this bounded serial tone experiment. Original output is not byte-identical after the new channel content arrives. Browser replacement API and actual engine/pad/transport integration are not implemented.',
          'prototypeFixAccepted': False, 'nativeAccepted': False, 'fullParityAccepted': False}
(ROOT/'docs/prototype/stem-activation-inplace-138-results.json').write_text(json.dumps(report, indent=2, allow_nan=False)+'\n')
print(json.dumps({'channels': rows, 'prototypeFixAccepted': False}, indent=2))
