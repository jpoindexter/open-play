"""Independent continuity checks over retained full-channel Float32 captures."""
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT/'local-evidence/stem-activation-137'
OUT = ROOT/'docs/prototype'
def sha(data): return hashlib.sha256(data).hexdigest()
def pcm(p):
    data = base64.b64decode(p['base64'], validate=True)
    assert sha(data) == p['sha256']
    x = np.frombuffer(data, '<f4').astype(float)
    assert len(x) == p['frames'] and np.isfinite(x).all()
    return x

def inspect(name, expected_pass):
    original = (RAW/f'{name}-original.json').read_bytes()
    r = json.loads(original)
    assert r['workflowCompleted'] and r['sourceStable'] and not r['errors'] and r['originalUnchanged']
    assert r['job']['state'] == 'complete' and r['job']['model'] == 'SCNet-large official'
    assert len(r['job']['stems']) == 4
    sr = r['sampleRate']
    rows = []
    for channel, p in enumerate(r['pcm']):
        x = pcm(p)
        assert len(x) == round(r['criteria']['captureSeconds'] * sr)
        start, end = round(.05*sr), round((r['criteria']['captureSeconds']-.1)*sr)
        v = x[start:end]
        baseline = float(np.sqrt(np.mean(x[round(.05*sr):round(.25*sr)]**2)))
        assert baseline > .005
        transitions = np.diff(np.r_[False, np.abs(v)<r['criteria']['nearZeroAbsolute'], False].astype(int))
        runs = np.where(transitions == -1)[0] - np.where(transitions == 1)[0]
        near_zero = int(max(runs, default=0)) / sr
        step = round(.01*sr)
        windows = [(start+i, float(np.sqrt(np.mean(v[i:i+step]**2)))/baseline) for i in range(0, len(v)-step, step)]
        worst_frame, minimum = min(windows, key=lambda w: w[1])
        jump = float(np.max(np.abs(np.diff(v))))
        hz = [330, 550][channel]
        projections = []
        for a, b in [(.05,.25),(.8,1.0)]:
            indexes = np.arange(round(a*sr),round(b*sr))
            z = 2*np.mean(x[indexes]*np.exp(-2j*np.pi*hz*(indexes+p['startFrame'])/sr))
            projections.append(z)
        phase_change = float(np.angle(projections[1]/projections[0])*180/np.pi)
        passed = near_zero <= r['criteria']['maximumNearZeroRunSeconds'] and minimum >= r['criteria']['minimum10msRMSRatio'] and jump <= r['criteria']['maximumAdjacentJump']
        rows.append({'channel':channel,'frames':len(x),'sha256':p['sha256'],'allFinite':True,'baselineRMS':baseline,'longestNearZeroRunSeconds':near_zero,'maxAdjacentSampleJump':jump,'minimum10msRMSRatio':minimum,'worstWindowAudioTime':(p['startFrame']+worst_frame)/sr,'knownToneHz':hz,'toneAmplitudeBeforeAfter':[float(abs(z)) for z in projections],'tonePhaseChangeDegrees':phase_change,'passed':passed})
    tail = {}
    for key in ['muted','restored','stopped']:
        tail[key] = []
        for channel, p in enumerate(r[key]['pcm']):
            x = pcm(p)
            peak = float(np.max(np.abs(x)))
            rms = float(np.sqrt(np.mean(x*x)))
            assert peak == 0 if key in ['muted','stopped'] else rms > .005
            tail[key].append({'channel':channel,'frames':len(x),'sha256':p['sha256'],'allFinite':True,'peak':peak,'rms':rms})
    assert r['muted']['enabled'] == [False]*4 and r['restored']['enabled'] == [True]*4 and not r['stopped']['playing']
    passed = all(row['passed'] for row in rows)
    assert passed == expected_pass, (name, rows)
    current = {}
    if name != 'before':
        for file, digest in r['sourceAfter'].items():
            target = RAW/('loop-harness.js' if name == 'after' else 'pitch-harness.js') if file == 'stem-activation-harness.js' else ROOT/'prototype'/file
            assert sha(target.read_bytes()) == digest, file
            current[file] = 'retained executed diagnostic capsule' if file == 'stem-activation-harness.js' else 'current source bytes'
        assert (RAW/f'{name}-downloaded.json').read_bytes() == original
    report = {'passed':passed,'workflowCompleted':True,'scope':r['scope'],'inspection':'Full retained Float32 hashes/finite; fixed1ms near-zero,0.85 ten-ms RMS ratio and0.03 adjacent-jump guards across complete bounded capture except first50/last100ms. Known-tone phase/amplitude projections explain failure; no fitted alignment or modified audio. All-muted/Stop exact zero, restored nonzero. Not source-attribution/listening, every transport, native or physical acceptance.','criteria':r['criteria'],'transport':r.get('transport',{'rate':1,'keylock':False,'loop':True}),'originalBytes':len(original),'originalSHA256':sha(original),'sampleRate':sr,'job':r['job'],'activation':r['activation'],'clockDifferenceAtAcknowledgment':r['activation']['actualPosition']-r['activation']['originalExpectedPosition'],'sourceBefore':r['sourceBefore'],'sourceAfter':r['sourceAfter'],'sourceStable':True,'sourceIdentityChecks':current,'normalDownloadByteIdentical':name!='before','originalDecodedAudioUnchanged':True,'channels':rows,'tail':tail,'remaining':'Keylocked replacement fails the unchanged RMS floor; ordinary loop success does not establish full Stems/keylock parity.' if name=='pitch' else 'Other gestures/reverse/warped or transformed loops/races/resources/music/native/reference/hardware remain open.'}
    (OUT/f'stem-activation-{name}-results.json').write_text(json.dumps(report,indent=2)+'\n')
    return {key:report[key] for key in ['passed','originalBytes','originalSHA256','clockDifferenceAtAcknowledgment']} | {'channels':rows}

print(json.dumps({name:inspect(name,expected) for name,expected in [('before',False),('after',True),('pitch',False)]},indent=2))
