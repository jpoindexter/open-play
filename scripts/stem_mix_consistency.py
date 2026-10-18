"""Independent uniform mixture-consistency projection, in bounded scratch blocks.

For fixed mixture x and J estimates, z_j=y_j+(x-sum(y))/J minimizes
sum_j ||z_j-y_j||^2 subject to sum_j z_j=x (before Float32 rounding).
This conserves the mixture; it does not infer or certify source attribution.
Reference concept: Wisdom et al., https://arxiv.org/abs/1811.08521, Eq.7.
No upstream implementation copied.
"""
import math

REVISION = 'uniform-mixture-consistency-v1'


def project_inplace(mixture, estimates, block_frames=65536):
    import numpy as np
    if (not isinstance(mixture, np.ndarray) or mixture.ndim != 2 or
            not isinstance(estimates, np.ndarray) or estimates.ndim != 3 or
            estimates.shape[0] < 1 or estimates.shape[1:] != mixture.T.shape or
            not np.issubdtype(mixture.dtype, np.floating) or
            estimates.dtype != np.float32 or not estimates.flags.writeable or
            not isinstance(block_frames, int) or block_frames < 1 or
            np.shares_memory(mixture, estimates)):
        raise ValueError('Expected independent mixture[frames,channels] and writable Float32 estimates[sources,channels,frames]')
    # Validate the whole result before mutating any source. Rejected input leaves
    # estimates intact; large arrays do not allocate a second complete export.
    for first in range(0, len(mixture), block_frames):
        if not np.isfinite(mixture[first:first+block_frames]).all() or not np.isfinite(estimates[:, :, first:first+block_frames]).all():
            raise ValueError('Non-finite mixture or stem sample')
    count = estimates.shape[0]
    raw_power = corrected_power = input_power = correction_power = 0.0
    for first in range(0, len(mixture), block_frames):
        block = estimates[:, :, first:first+block_frames]
        original = mixture[first:first+block_frames].T.astype(np.float64)
        residual = original - block.sum(axis=0, dtype=np.float64)
        delta = residual / count
        raw_power += float(np.sum(residual**2))
        input_power += float(np.sum(original**2))
        correction_power += float(np.sum(delta**2))
        for stem in block:
            stem[:] = stem.astype(np.float64) + delta
        corrected = original - block.sum(axis=0, dtype=np.float64)
        corrected_power += float(np.sum(corrected**2))
    samples = mixture.size
    return {'algorithm': REVISION, 'sources': count, 'frames': len(mixture),
            'block_frames': block_frames,
            'raw_reconstruction_rms_error': math.sqrt(raw_power / max(1, samples)),
            'raw_reconstruction_relative_rms': math.sqrt(raw_power / max(input_power, 1e-30)),
            'reconstruction_rms_error': math.sqrt(corrected_power / max(1, samples)),
            'reconstruction_relative_rms': math.sqrt(corrected_power / max(input_power, 1e-30)),
            'per_source_correction_rms': math.sqrt(correction_power / max(1, samples)),
            'source_attribution_verified': False}
