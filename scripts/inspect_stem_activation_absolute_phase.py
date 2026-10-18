"""Resolve the review's time-axis question using retained PCM; never alter audio."""
import base64
import hashlib
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'local-evidence/stem-activation-137/pitch-original.json'
OUT = ROOT / 'docs/prototype/stem-activation-absolute-phase-results.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


original = RAW.read_bytes()
record = json.loads(original)
assert sha(original) == '9ad14fe163ba1e141443b48db686aa222a126bf72017361ca1e40838afea613a'
sr = record['sampleRate']
channels = []
for index, packet in enumerate(record['pcm']):
    data = base64.b64decode(packet['base64'], validate=True)
    assert sha(data) == packet['sha256']
    audio = np.frombuffer(data, '<f4').astype(float)
    assert len(audio) == packet['frames'] and np.isfinite(audio).all()
    hz = [330, 550][index]
    fits = []
    for start, end in [(.05, .25), (.8, 1.0)]:
        frames = np.arange(round(start * sr), round(end * sr))
        # Same AudioContext sample axis in both windows, as in the old inspector.
        time = (frames + packet['startFrame']) / sr
        basis = np.column_stack((np.cos(2 * np.pi * hz * time),
                                 np.sin(2 * np.pi * hz * time), np.ones(len(time))))
        coefficients, _, rank, _ = np.linalg.lstsq(basis, audio[frames], rcond=None)
        assert rank == 3 and np.isfinite(coefficients).all()
        phasor = complex(coefficients[0], -coefficients[1])
        residual = audio[frames] - np.sum(basis * coefficients, axis=1)
        assert np.isfinite(residual).all()
        fits.append({'captureWindowSeconds': [start, end],
                     'audioWindowSeconds': [float(time[0]), float(time[-1] + 1 / sr)],
                     'amplitude': abs(phasor), 'phaseDegrees': float(np.angle(phasor, deg=True)),
                     'DC': float(coefficients[2]),
                     'residualRMS': float(np.sqrt(np.mean(residual ** 2)))})
    delta = (fits[1]['phaseDegrees'] - fits[0]['phaseDegrees'] + 180) % 360 - 180
    channels.append({'channel': index, 'knownToneHz': hz, 'frames': len(audio),
                     'sha256': packet['sha256'], 'allFinite': True, 'fits': fits,
                     'phaseChangeDegrees': delta,
                     'amplitudeRatio': fits[1]['amplitude'] / fits[0]['amplitude']})

report = {'scope': 'Independent least-squares fits on retained actual browser PCM; no new render, alignment, gain adjustment or changed acceptance thresholds.',
          'originalSHA256': sha(original), 'sampleRate': sr,
          'captureStartFrame': record['pcm'][0]['startFrame'],
          'activation': record['activation'], 'channels': channels,
          'finding': 'The prior inspector already uses absolute audio sample times. Independent fits retain the phase changes; a capture-relative time-axis mistake does not explain the activation failure.',
          'reviewDecision': 'Do not accept deferred transfer as a continuity fix: it explicitly moves the cross-instance dip to the first partial Stem action. Preserve the failure until the real activation and pad workflows meet their unchanged requirements.',
          'fullParityAccepted': False}
if OUT.exists():
    assert json.loads(OUT.read_text())['originalSHA256'] == sha(original)
OUT.write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
print(json.dumps({'phaseChangeDegrees': [row['phaseChangeDegrees'] for row in channels],
                  'amplitudeRatios': [row['amplitudeRatio'] for row in channels],
                  'report': str(OUT)}, indent=2))
