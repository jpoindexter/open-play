#!/usr/bin/env python3
"""Inspect actual shifting overlap and complete, unchanged musical captures."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np
from inspect_slicer_warp_164 import beat, source, clock
from inspect_reverse_exit_161 import wav


def inspect(path, sources):
    raw = path.read_bytes()
    r = json.loads(raw)
    assert r['diagnosticCheckpoint'] == 165 and r['sourceStable']
    assert r['sourceBefore'] == r['sourceAfter']
    for name, digest in r['sourceBefore'].items():
        assert hashlib.sha256((sources/name).read_bytes()).hexdigest() == digest, name
    root = Path(__file__).resolve().parents[1]
    assert hashlib.sha256((root/'local-evidence/musical-workflow-159/SDRNR-private-research-159.mp3').read_bytes()).hexdigest() == r['import']['contentHash'] == 'cb2e756d1fa4ce264767a4f6adbaf9e3f69a040db7889d830abdb429cc1a5ac3'
    assert r['ready']['job'] == '8266a41f62fc4fc5b92808dd3d988cec'
    assert r['input'] == dict(frames=299880, sampleRate=44100, channels=2, duration=6.8)
    assert r['sampleRate'] == 44100
    job = root/'local-evidence/stem-jobs'/r['ready']['job']
    manifest = json.loads((job/'output/manifest.json').read_bytes())
    assert manifest['model'] == 'SCNet-large official'
    assert hashlib.sha256((job/'input.wav').read_bytes()).hexdigest() == manifest['source_sha256']
    stems = {}
    for stem in manifest['stems']:
        p = job/'output'/stem['file']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == stem['sha256']
        stems[stem['name']] = wav(p)
    observations = []
    for stage in r['stages']:
        root_state = stage['before']
        background_beat = float(beat(root_state['anchorPosition'])+2*max(0, stage['secondPress']['at']-root_state['anchorTime']))
        domain = 2*np.floor(background_beat/2)
        assert domain >= 2
        expected = dict(start=float(source(domain+.5)), end=float(source(domain+.625)))
        actual = stage['second']
        bounds_correct = abs(actual['loopIn']-expected['start']) < 1e-8 and abs(actual['loopOut']-expected['end']) < 1e-8
        assert actual['slice'] == stage['afterOlderRelease']['slice'] == 2
        assert actual['anchorTime'] == stage['afterOlderRelease']['anchorTime']
        assert actual['loopIn'] == stage['afterOlderRelease']['loopIn'] and actual['loopOut'] == stage['afterOlderRelease']['loopOut']
        focus = all(s['focus'] == dict(tag='BUTTON', deck='0', pad='2') for s in [actual, stage['after']])
        assert actual['pressed'] == stage['afterOlderRelease']['pressed'] == 'true' and stage['after']['pressed'] == 'false'
        error = float(abs(stage['after']['position']-clock(root_state, stage['after']['at'])))
        packets = []
        for kind, state_name, seconds in [('firstPCM','first',.15), ('secondPCM','second',.3), ('afterOlderPCM','second',.15), ('afterPCM','after',.3)]:
            state = stage[state_name]
            assert state['playing'] and not state['processing'] and state['mask'] == [False,True,True,True]
            assert np.allclose(state['gains'], [0,0,1,1,1], atol=1e-7, rtol=0)
            for packet in stage[kind]:
                data = base64.b64decode(packet['base64'], validate=True)
                assert hashlib.sha256(data).hexdigest() == packet['sha256']
                x = np.frombuffer(data, '<f4').astype(float)
                assert len(x) == packet['frames'] == round(seconds*r['sampleRate'])
                assert np.isfinite(x).all() and not packet['errors'], packet['errors']
                cursor = packet['startFrame']
                for i, q in enumerate(packet['quanta']):
                    assert q['frame'] == cursor and 0 < q['count'] <= 128
                    assert q['count'] == 128 or i == len(packet['quanta'])-1
                    cursor += q['count']
                assert cursor == packet['startFrame']+len(x)
                rms = float(np.sqrt(np.mean(x*x)))
                assert rms > r['criteria']['minimumRMS']
                row = dict(kind=kind, channel=packet['channel'], frames=len(x), rms=rms, sha256=packet['sha256'], contiguousQuanta=len(packet['quanta']))
                if stage['name'].startswith('raw') and kind != 'afterPCM':
                    # Fixed central window of each declared capture. Known real
                    # exports/observed anchor, no fitted timing/gain/phase.
                    window = (np.arange(len(x)) >= round(seconds/6*r['sampleRate'])) & (np.arange(len(x)) < round(seconds*5/6*r['sampleRate']))
                    times = (np.arange(len(x))[window]+packet['startFrame'])/r['sampleRate']
                    position = clock(state, times)*44100
                    index = np.floor(position).astype(int)
                    fraction = position-index
                    expected_pcm = sum(stems[name][index, packet['channel']]*(1-fraction)+stems[name][index+1, packet['channel']]*fraction for name in ['other','bass','drums'])
                    relative = float(np.sqrt(np.mean((x[window]-expected_pcm)**2))/np.sqrt(np.mean(expected_pcm**2)))
                    row['rawRelativeRMSError'] = relative
                    row['rawAudioMatchesObservedSlice'] = relative < 1e-4
                packets.append(row)
        observations.append(dict(name=stage['name'], backgroundBeatAtSecond=background_beat, expectedDomainBeat=float(domain), expectedBounds=expected, observedBounds=dict(start=actual['loopIn'],end=actual['loopOut']), shiftingDomainCorrect=bool(bounds_correct), olderReleaseRetainsNewerOwner=True, keyboardFocusPreserved=focus, releaseSourceClockError=error, packets=packets))
    if r['workflowCompleted']:
        assert r['originalUnchanged'] and r['importedFileUnchanged']
        assert [s['name'] for s in r['stages']] == ['raw-shifting-overlap','keyed-shifting-overlap']
    passed = bool(r['workflowCompleted'] and not r['errors'] and all(s['shiftingDomainCorrect'] and s['keyboardFocusPreserved'] and s['releaseSourceClockError'] < r['criteria']['maximumPositionError'] and all(p.get('rawAudioMatchesObservedSlice',True) for p in s['packets']) for s in observations))
    return dict(checkpoint=165,passed=passed,originalBytes=len(raw),originalSHA256=hashlib.sha256(raw).hexdigest(),sourceHashes=r['sourceBefore'],criteria=r['criteria'],rawReferenceCriterion={'window':'Central two-thirds of each complete held capture','maximumRelativeRMS':1e-4,'alignment':'Known exports/observed anchors/independent beat clock, no fit.'},observations=observations,errors=r['errors'],failureState=r.get('failureState'),default48000Acceptance=False,musicalPitchAccuracyAccepted=False,sourceAttributionAccepted=False,exactSeratoParityAccepted=False,seamlessTransitionAccepted=False,nativeAcceptance=False,hardwareAcceptance=False,fullParityAcceptance=False)


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('original',type=Path);p.add_argument('output',type=Path);p.add_argument('--sources',type=Path,required=True)
    a=p.parse_args();r=inspect(a.original,a.sources)
    with a.output.open('x') as out:
        json.dump(r,out,indent=2,allow_nan=False);out.write('\n')
    print(json.dumps({k:r[k] for k in ['passed','observations','errors']}));raise SystemExit(0 if r['passed'] else 1)
