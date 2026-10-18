"""Bounded development experiment; never changes the running worker or default.

Independently averages the current unshifted estimate with two deterministic
left-padded predictions, cropping only the known padding. No truth-dependent
alignment, source gain, offset search, weight change or model training.
Run with the existing isolated stems-runtime/venv Python.
"""
from pathlib import Path
import hashlib
import json
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from stem_worker import SCNET_DEFAULT, SCNET_SOURCE, SCNET_SHA256, SCNET_FILES, digest
from stem_mix_consistency import project_inplace

OFFSETS_SECONDS = [0, .25, .5]
CRITERIA = {'minimum_mean_improvement_db_per_track': .2,
            'maximum_source_degradation_db': .1,
            'maximum_reconstruction_relative_rms': 1e-6}
NAMES = ['drums', 'bass', 'other', 'vocals']


def score(reference, estimate):
    import numpy as np
    target = reference.astype('float64').reshape(-1)
    prediction = estimate.astype('float64').reshape(-1)
    target -= target.mean(); prediction -= prediction.mean()
    scaled = target * (prediction @ target) / (target @ target)
    return float(10 * np.log10((scaled @ scaled) / max(1e-20, np.sum((prediction - scaled)**2))))


def run(output):
    import numpy as np
    import soundfile as sf
    import torch
    output.mkdir(parents=True, exist_ok=False)
    if digest(SCNET_DEFAULT) != SCNET_SHA256:
        raise ValueError('Pinned checkpoint mismatch')
    for name, expected in SCNET_FILES.items():
        if digest(SCNET_SOURCE / name) != expected:
            raise ValueError('Pinned architecture mismatch: ' + name)
    sys.path.insert(0, str(SCNET_SOURCE))
    from scnet.SCNet import SCNet
    torch.set_num_threads(4); torch.manual_seed(0)
    model = SCNet(dims=[4, 64, 128, 256], band_SR=[.225, .372, .403]).eval()
    checkpoint = torch.load(SCNET_DEFAULT, map_location='cpu', weights_only=True)
    model.load_state_dict({k.removeprefix('module.'): v for k, v in checkpoint['best_state'].items()})
    assert model.sources == NAMES
    report = {'experiment': 'fixed-time-shift-average-development-v1',
              'scope': 'Two previously inspected same-band MUSDB18 CC BY-NC-SA3.0 previews; development only, no model training or reference-product/listening/general-quality acceptance.',
              'criteria': CRITERIA, 'offsets_seconds': OFFSETS_SECONDS,
              'metric': 'Full stereo flattened mean-removed SI-SDR; known padding cropped, no post-hoc temporal alignment/filtering.',
              'model_sha256': SCNET_SHA256, 'source_commit': '5d95bf96b19c3eede63248d171efeca8e3abb948',
              'experiment_sha256': digest(Path(__file__)), 'tracks': [],
              'runtime': {'torch': torch.__version__, 'device': 'cpu', 'threads': 4},
              'production_changed': False, 'full_parity_verified': False}
    for folder in ['track1', 'track2']:
        directory = ROOT / 'local-evidence/stems-runtime/real-fixtures' / folder
        provenance = json.loads((directory / 'provenance.json').read_text())
        if provenance['license'] != 'CC BY-NC-SA 3.0':
            raise ValueError('Unexpected development audio license')
        audio, sr = sf.read(directory / 'mixture.wav', dtype='float32', always_2d=True)
        assert sr == 44100 and audio.shape[1] == 2
        saved = json.loads((directory / 'scnet/manifest.json').read_text())
        assert saved['model_sha256'] == SCNET_SHA256 and saved['backend'] == 'scnet'
        assert saved['parameters'].get('mixture_consistency', 'none') == 'none'
        for stem in saved['stems']:
            assert digest(directory / 'scnet' / stem['file']) == stem['sha256']
        baseline_raw = np.stack([sf.read(directory / 'scnet' / (n + '.wav'), dtype='float32', always_2d=True)[0].T for n in NAMES])
        assert baseline_raw.shape == (4, 2, len(audio)) and np.isfinite(baseline_raw).all()
        reference = [sf.read(directory / (n + '.wav'), dtype='float32', always_2d=True)[0] for n in NAMES]
        assert all(a.shape == audio.shape for a in reference)
        mixture = torch.from_numpy(audio.T.copy()); mono = mixture.mean(0)
        mean, std = mono.mean(), mono.std() + 1e-8
        normalized = ((mixture - mean) / std)[None]
        total = baseline_raw.astype('float64'); views = [{'left_padding_frames': 0, 'reused_baseline_manifest': digest(directory / 'scnet/manifest.json')}]
        for seconds in OFFSETS_SECONDS[1:]:
            frames = round(seconds * sr); before = time.monotonic()
            with torch.inference_mode():
                result = model(torch.nn.functional.pad(normalized, (frames, 0)))[0, :, :, frames:frames + len(audio)]
                result = (result * std + mean).numpy()
            assert result.shape == baseline_raw.shape and np.isfinite(result).all()
            total += result
            elapsed = time.monotonic() - before
            views.append({'left_padding_frames': frames, 'inference_seconds': elapsed})
            print(f'{folder}: fixed padding {seconds}s complete ({elapsed:.3f}s)', file=sys.stderr, flush=True)
        averaged = (total / len(OFFSETS_SECONDS)).astype('float32')
        baseline = baseline_raw.copy(); baseline_projection = project_inplace(audio, baseline)
        candidate_projection = project_inplace(audio, averaged)
        before_scores = {n: score(ref, b.T) for n, ref, b in zip(NAMES, reference, baseline)}
        after_scores = {n: score(ref, b.T) for n, ref, b in zip(NAMES, reference, averaged)}
        deltas = {n: after_scores[n] - before_scores[n] for n in NAMES}
        mean_delta = sum(deltas.values()) / 4
        accepted = (mean_delta >= CRITERIA['minimum_mean_improvement_db_per_track'] and
                    min(deltas.values()) >= -CRITERIA['maximum_source_degradation_db'] and
                    candidate_projection['reconstruction_relative_rms'] <= CRITERIA['maximum_reconstruction_relative_rms'])
        item = {'source': provenance, 'mixture_sha256': digest(directory / 'mixture.wav'),
                'views': views, 'baseline_si_sdr_db': before_scores, 'candidate_si_sdr_db': after_scores,
                'delta_db': deltas, 'mean_delta_db': mean_delta, 'development_guard_passed': accepted,
                'baseline_projection': baseline_projection, 'candidate_projection': candidate_projection}
        destination = output / folder; destination.mkdir()
        for name, value in zip(NAMES, averaged): sf.write(destination / (name + '.wav'), value.T, sr, subtype='FLOAT')
        item['candidate_exports'] = [{'name': n, 'sha256': digest(destination / (n + '.wav'))} for n in NAMES]
        report['tracks'].append(item)
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    report['development_guard_passed'] = all(x['development_guard_passed'] for x in report['tracks'])
    report['verdict'] = ('Development guards passed; independent licensed corpus/listening and integration still required before promotion.' if report['development_guard_passed'] else 'Reject promotion under the declared guards; production default remains unchanged.')
    (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'guard_passed': report['development_guard_passed'], 'tracks': [{'title': t['source']['title'], 'delta_db': t['delta_db'], 'mean_delta_db': t['mean_delta_db']} for t in report['tracks']], 'verdict': report['verdict']}))

if __name__ == '__main__':
    if len(sys.argv) != 2: raise SystemExit('Pass one new ignored output directory')
    run(Path(sys.argv[1]).resolve())
