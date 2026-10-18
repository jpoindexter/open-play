"""Inspect the native UI-downloaded original; never substitutes browser evidence."""
import base64, hashlib, json, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'local-evidence/desktop-0.1.17-native'
DOC = ROOT / 'docs/prototype'
original = RAW / 'auto-gain-original.json'
data = json.loads(original.read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
assert data['completed'] and not data['errors'] and len(data['cases']) == 20
assert data['sourceBefore'] == data['sourceAfter'] == data['sourceReload']

def retain(path, content):
    if path.exists():
        assert path.read_bytes() == content, 'Refusing to replace different evidence'
    else:
        path.write_bytes(content)

windows = []
for index, case in enumerate(data['cases']):
    pcm = case['pcm']
    raw = base64.b64decode(pcm['base64'], validate=True)
    assert sha(raw) == pcm['sha256']
    samples = np.frombuffer(raw, dtype='<f4').astype(np.float64)
    assert len(samples) == pcm['frames'] == 13230 and np.isfinite(samples).all()
    retain(RAW / f'case-{index:02}.f32', raw)
    n = np.arange(len(samples), dtype=np.float64)
    amplitudes = []
    for hz in [1000, 8000]:
        phase = 2 * np.pi * hz * n / 44100
        amplitudes.append(float(2 * np.hypot(np.sum(samples * np.cos(phase)), np.sum(samples * np.sin(phase))) / len(samples)))
    assert np.isfinite(amplitudes).all()
    errors = [abs(a - e) / e if e else a for a, e in zip(amplitudes, case['expected'])]
    passed = all(error <= (.02 if expected else 1e-6) for error, expected in zip(errors, case['expected']))
    assert passed and case['passed']
    windows.append({'case': index, 'name': case['name'], 'sha256': sha(raw), 'frames': len(samples),
                    'allFinite': True, 'peak': float(np.abs(samples).max()),
                    'nonzeroSamples': int(np.count_nonzero(samples)), 'expected': case['expected'],
                    'independentAmplitudes': amplitudes, 'errors': errors, 'passed': passed})

recordings = []
for index, recording in enumerate(data['recordings']):
    raw = base64.b64decode(recording['base64'], validate=True)
    assert sha(raw) == recording['sha256'] and len(raw) == recording['bytes']
    source = RAW / f'master-{index}.webm'
    retain(source, raw)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(source)]))
    streams = [s for s in probe['streams'] if s['codec_type'] == 'audio']
    assert len(streams) == 1 and streams[0]['channels'] == 2
    decoded = subprocess.check_output(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(source), '-map', '0:a:0', '-f', 'f32le', '-c:a', 'pcm_f32le', '-'])
    retain(RAW / f'master-{index}.whole.f32', decoded)
    samples = np.frombuffer(decoded, dtype='<f4').reshape(-1, 2)
    assert len(samples) and np.isfinite(samples).all()
    recordings.append({k: v for k, v in recording.items() if k != 'base64'} | {
        'decodedFrames': len(samples), 'decodedSampleRate': int(streams[0]['sample_rate']),
        'decodedSHA256': sha(decoded), 'allFinite': True,
        'peaks': np.abs(samples).max(axis=0).astype(float).tolist()})

def scrub(value):
    if isinstance(value, dict):
        return {k: scrub(v) for k, v in value.items() if k != 'base64'}
    if isinstance(value, list):
        return [scrub(v) for v in value]
    return value

sanitized = scrub(data)
retain(DOC / 'desktop-0.1.17-auto-gain-native-results.json', (json.dumps(sanitized, indent=2) + '\n').encode())
report = {'version': '0.1.17', 'sourceCommit': 'beb4d59b4722ad6f75426f2ff722d3cd71344bb8',
          'ASARSHA256': '76ed78d895b97816117039f78054d009ead8667569c97a6de5db5691dda3cf74',
          'originalSHA256': sha(original.read_bytes()), 'originalBytes': original.stat().st_size,
          'nativeObservation': 'Actual native Checks > Measured Auto Gain > Run > Reload > Verify restored > Download via native Save dialog.',
          'scope': 'Packaged production worker/import/controls/actual audio graph; independent channel0 PCM projections and whole stereo recording decode. Physical graph muted. Original generic harness scope retained verbatim. Not acoustic, physical controls, exact Serato calibration, music quality or full parity acceptance.',
          'windows': windows, 'recordings': recordings,
          'fullParityVerified': False, 'passed': True}
retain(DOC / 'desktop-0.1.17-auto-gain-independent-results.json', (json.dumps(report, indent=2) + '\n').encode())
print(json.dumps({'passed': True, 'windows': len(windows), 'recordings': recordings,
                  'maxRelativeError': max(e for w in windows for e, x in zip(w['errors'], w['expected']) if x),
                  'maxAbsentTone': max(e for w in windows for e, x in zip(w['errors'], w['expected']) if not x)}, indent=2))
