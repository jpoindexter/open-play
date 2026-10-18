#!/usr/bin/env python3
"""Inspect actual browser failed-repeat, warm-cancel and successful-retry capture."""
import argparse
import json
from pathlib import Path
from inspect_stem_activation_browser_inplace import inspect, ROOT


def inspect_banks(path, sources):
    raw = json.loads(path.read_text())
    result = inspect(path, sources, processor_channels=18)
    initial = raw['initialLive']; activation = raw['activation']['live']
    assert initial['stemBanks'] == activation['stemBanks'] == 2
    assert initial['publicOutputs'] == activation['publicOutputs'] == 5
    assert len(initial['sourceGeometry']) == len(activation['sourceGeometry']) == 9
    failed = raw['repeatFailure']
    assert failed['error'] == 'Controlled sixth replacement failure' and failed['calls'] == 6
    assert failed['voiceRetained'] and failed['cacheRestored'] and failed['activeBank'] == 0
    cancelled = raw['cancelWarmup']
    assert cancelled['clicked'] and cancelled['bankBefore'] == cancelled['bankAfter'] == 0
    assert cancelled['cacheRetained'] and cancelled['voiceRetained'] and cancelled['stageCleared']
    assert cancelled['warming']['acknowledgedAt'] <= cancelled['clickedAt'] < cancelled['warming']['readyAt']
    retried = raw['repeatSuccess']
    assert retried['bankBefore'] == 0 and retried['bankAfter'] == 1
    assert retried['voiceRetained'] and retried['cacheReplaced']
    assert retried['live']['groups'][0]['id'] == initial['groups'][0]['id']
    assert retried['live']['groups'][0]['processorChannels'] == 18
    assert retried['live']['stagedStemBank'] is None
    assert any(event['message'].startswith('Cancelled') for event in raw['progress'])
    result.update(checkpoint=146,repeatFailure=failed,cancelWarmup=cancelled,repeatSuccess=retried,
                  fixedProcessorChannels=18,stemBanks=2,publicOutputs=5,
                  remaining='Nonzero-origin refill/drop, SRC/pitch maps, other rates/key shifts/music/resources, gestures/loops/StemSlip/native/hardware/reference and full parity remain separate.')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path); parser.add_argument('output', type=Path)
    parser.add_argument('--sources', type=Path, default=ROOT/'prototype')
    args = parser.parse_args(); result = inspect_banks(args.capture,args.sources)
    with args.output.open('x') as output:
        json.dump(result, output, indent=2, allow_nan=False); output.write('\n')
    print(json.dumps({key:result[key] for key in ['passed','channels','cancelWarmup','clockDifferenceAtAcknowledgment']},indent=2))
    raise SystemExit(0 if result['passed'] else 1)
