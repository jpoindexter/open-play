"""Inspect retained production Save/error/cancel audio without trusting harness verdicts."""
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'local-evidence/lpf-validation-136'
OUT = ROOT / 'docs/prototype'
BASELINE = {'Resonance': '1.77', 'Slope': '12 dB', 'Min Freq': '400 Hz', 'Max Freq': '400 Hz'}
CORRECTED = {'Resonance': '2', 'Slope': '18 dB', 'Min Freq': '400 Hz', 'Max Freq': '400 Hz'}
def sha(value): return hashlib.sha256(value).hexdigest()

def response(hz, sample_rate, cutoff, slope, resonance):
    # Independent bilinear one-pole + Web Audio biquad cascade from plan135.
    z = np.exp(-2j * np.pi * hz / sample_rate)
    stages = slope // 12
    h = 1 + 0j
    if stages:
        w = 2 * np.pi * cutoff / sample_rate
        alpha = np.sin(w) / (2 * 10 ** (resonance / stages / 20))
        h = (((1-np.cos(w))/2) * (1+2*z+z*z) / (1+alpha-2*np.cos(w)*z+(1-alpha)*z*z)) ** stages
    if slope % 12 == 6:
        k = np.tan(np.pi * cutoff / sample_rate)
        h *= k/(1+k) * (1+z) / (1+(k-1)/(k+1)*z)
    return abs(h)

def inspect(name):
    original = (RAW / f'{name}-original.json').read_bytes()
    r = json.loads(original)
    assert r['sourceStable'] and not r['errors']
    assert len(r['cases']) == (3 if name == 'before' else 7)
    rows = []
    for index, case in enumerate(r['cases']):
        if name == 'after':
            assert case['spec']['params'] == (BASELINE if index < 4 else CORRECTED)
            if index in [1, 2, 3]:
                form = case['form']
                assert form['open'] and form['error'] and case['paramsUnchanged']
                expected_focus = 'Resonance' if index == 3 else 'Min Freq'
                assert form['focus'] == expected_focus
                invalid = [f for f in form['fields'] if f['invalid'] == 'true']
                assert len(invalid) == (1 if index == 1 else 2)
                assert all(not f['validity'] and 'fx-parameter-error' in f['describedBy'] for f in invalid)
            if index == 4: assert not case['form']['open'] and not case['form']['error']
            if index == 5:
                assert case['paramsUnchanged'] and r['cancelReadback']['open'] and not r['cancelReadback']['error']
                assert {f['name']: f['value'] for f in r['cancelReadback']['fields']} == CORRECTED
                assert all(f['validity'] and f['invalid'] is None for f in r['cancelReadback']['fields'])
        elif index == 1:
            assert not case['paramsUnchanged'] and not case['form']['open'] and not case['form']['error']
            assert case['spec']['params']['Min Freq'] == 'NaN'
        metrics = []
        for channel, p in enumerate(case['pcm']):
            data = base64.b64decode(p['base64'], validate=True)
            assert sha(data) == p['sha256']
            x = np.frombuffer(data, '<f4').astype(float)
            assert np.isfinite(x).all() and len(x) == p['frames'] == round(r['sampleRate'] * .3)
            peak = float(np.max(np.abs(x)))
            tones = []
            if case['silence']:
                assert peak == 0 and not case['playing']
            else:
                assert case['playing'] and case['voicePreserved']
                gain = float(x.mean()) / .15
                # Before-fix NaN fell back silently to200Hz; all other values saved.
                cutoff, slope, resonance = (200, 18, 1.77) if name == 'before' and index == 1 else (400, 12, 1.77) if index < 4 else (400, 18, 2)
                for hz in [100, 2000]:
                    amplitude = float(abs(np.sum((x-x.mean()) * np.exp(-2j*np.pi*hz*np.arange(len(x))/r['sampleRate']))) * 2 / len(x))
                    expected = .02 * gain * response(hz, r['sampleRate'], cutoff, slope, resonance)
                    relative = abs(amplitude-expected) / expected
                    assert relative < .01, (name, index, channel, hz, amplitude, expected, relative)
                    tones.append({'hz': hz, 'measuredAmplitude': amplitude, 'expectedAmplitude': expected, 'relativeError': relative})
            metrics.append({'channel': channel, 'frames': len(x), 'sha256': p['sha256'], 'allFinite': True, 'peak': peak, 'mean': float(x.mean()), 'tones': tones})
        rows.append({'name': case['name'], 'savedParams': case['spec']['params'], 'form': case.get('form'), 'paramsUnchanged': case['paramsUnchanged'], 'voicePreserved': case['voicePreserved'], 'playing': case['playing'], 'metrics': metrics})
    if name == 'after':
        for file, digest in r['sourceAfter'].items(): assert sha((ROOT/'prototype'/file).read_bytes()) == digest
        assert r['completed']
        # Invalid edits and Cancel preserve the prior *audio*, not just saved text.
        for row in [1, 2, 3]:
            for channel in range(2):
                a, b = rows[0]['metrics'][channel], rows[row]['metrics'][channel]
                assert abs(a['mean']-b['mean']) < .0001
                for tone in range(2): assert abs(a['tones'][tone]['measuredAmplitude']-b['tones'][tone]['measuredAmplitude']) / a['tones'][tone]['measuredAmplitude'] < .01
        for channel in range(2):
            a, b = rows[4]['metrics'][channel], rows[5]['metrics'][channel]
            for tone in range(2): assert abs(a['tones'][tone]['measuredAmplitude']-b['tones'][tone]['measuredAmplitude']) / a['tones'][tone]['measuredAmplitude'] < .01
    maximum = max(t['relativeError'] for row in rows for m in row['metrics'] for t in m['tones'])
    report = {'passed': name == 'after', 'bugReproduced': name == 'before', 'scope': r['scope'], 'inspection': 'Full retained Float32 hash/finite checks, independent100/2000Hz amplitude projection versus requested native-chain transfer with fixed1%relative tolerance; explicit transactional values/error/focus/ARIA/cancel and exact stopped silence. No vendor ranges/sonics, screen-reader, native or physical acceptance.', 'originalBytes': len(original), 'originalSHA256': sha(original), 'sampleRate': r['sampleRate'], 'sourceBefore': r['sourceBefore'], 'sourceAfter': r['sourceAfter'], 'sourceStable': True, 'currentSourceMatches': name == 'after', 'maxEndpointAmplitudeRelativeError': maximum, 'cases': rows}
    if name == 'after':
        downloaded = (RAW/'after-downloaded.json').read_bytes()
        assert downloaded == original
        report['normalDownloadByteIdentical'] = True
    (OUT/f'lpf-validation-{name}-results.json').write_text(json.dumps(report, indent=2)+'\n')
    return {k: report[k] for k in ['passed', 'bugReproduced', 'originalBytes', 'originalSHA256', 'maxEndpointAmplitudeRelativeError']}

print(json.dumps({name: inspect(name) for name in ['before', 'after']}, indent=2))
