#!/usr/bin/env python3
"""Compare complete matched-build controls/treatments; no fitted corrections."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np


def arrays(path):
    raw = path.read_bytes(); receipt = json.loads(raw); result = {}
    for case in receipt['cases']:
        for variant in case['results']:
            for p in variant['pcm']:
                data = (path.parent/p['file']).read_bytes()
                assert hashlib.sha256(data).hexdigest() == p['sha256']
                x = np.frombuffer(data, '<f4'); assert len(x) == p['frames'] and np.isfinite(x).all()
                result[case['deck'], variant['name'], p['channel']] = x
    return receipt, result, hashlib.sha256(raw).hexdigest()


def compare(a, b):
    assert len(a) == len(b)
    return dict(frames=len(a), bitIdentical=a.tobytes() == b.tobytes(),
                maximumAbsoluteDifference=float(np.max(np.abs(a.astype(float)-b.astype(float)))))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('stock', type=Path)
    parser.add_argument('candidate', type=Path); parser.add_argument('output', type=Path); args = parser.parse_args()
    stock, a, stock_sha = arrays(args.stock); candidate, b, candidate_sha = arrays(args.candidate)
    assert stock['variant'] == 'stock' and candidate['variant'] == 'candidate'
    assert stock['browserOriginalSHA256'] == candidate['browserOriginalSHA256']
    for s, c in zip(stock['cases'], candidate['cases']):
        assert all(s[k] == c[k] for k in ['deck', 'observedStartup', 'firstRenderFrame', 'endFrame', 'frames', 'recordedCalls'])
    cases = []
    for deck in [1, 2]:
        controls = [dict(channel=c, **compare(a[deck, 'first-bank-only', c], b[deck, 'first-bank-only', c])) for c in [0, 4, 12]]
        assert all(row['bitIdentical'] for row in controls)
        stock_active = [dict(channel=c, **compare(a[deck, 'first-bank-only', c], a[deck, 'both-recorded-banks', c])) for c in [0, 4]]
        candidate_active = [dict(channel=c, **compare(b[deck, 'first-bank-only', c], b[deck, 'both-recorded-banks', c])) for c in [0, 4]]
        assert all(row['bitIdentical'] for row in candidate_active)
        new_bank = b[deck, 'both-recorded-banks', 12]
        assert np.max(np.abs(new_bank)) > .005
        if deck == 2:
            assert all(not row['bitIdentical'] for row in stock_active)
        cases.append(dict(deck=deck, stockCandidateControlComparison=controls, stockActiveComparison=stock_active,
                          candidateActiveComparison=candidate_active, candidateNewBankNonzero=True))
    result = dict(checkpoint=155, scope='Complete actual matched-build WASM recordings; control identity and inactive-bank effect only. No offset/gain/phase fitting; not browser/music/native/physical/full parity.',
                  stockOriginalSHA256=stock_sha, candidateOriginalSHA256=candidate_sha,
                  browserInputOriginalSHA256=stock['browserOriginalSHA256'], cases=cases,
                  rebuiltStockMinus2InteractionReproduced=True, candidateObservedInactiveInfluenceRemoved=True,
                  unchangedControlOutputsBitIdentical=True, fullParityAcceptance=False)
    with args.output.open('x') as output:
        output.write(json.dumps(result, indent=2, allow_nan=False)+'\n')
    print(json.dumps({k: result[k] for k in ['rebuiltStockMinus2InteractionReproduced', 'candidateObservedInactiveInfluenceRemoved', 'unchangedControlOutputsBitIdentical']}))
