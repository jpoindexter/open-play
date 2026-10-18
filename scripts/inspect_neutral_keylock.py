#!/usr/bin/env python3
"""Inspect whole retained master audio with fixed, full-band spectral windows."""
import argparse, hashlib, json, subprocess
from pathlib import Path
import numpy as np
from inspect_keylock_pitch_isolation_independent import frequency

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('report');parser.add_argument('audio');parser.add_argument('output')
    args=parser.parse_args()
    report=json.loads(Path(args.report).read_text());audio=Path(args.audio);out=Path(args.output)
    assert not out.exists(), 'Never overwrite a prior inspection'
    assert hashlib.sha256(audio.read_bytes()).hexdigest()==report['recording']['sha256']
    pcm=audio.with_suffix('.f32');assert not pcm.exists(), 'Never overwrite original decoded PCM'
    sr=44100
    subprocess.run(['ffmpeg','-v','error','-i',str(audio),'-ac','2','-ar',str(sr),'-f','f32le',str(pcm)],check=True)
    x=np.fromfile(pcm,dtype='<f4').reshape(-1,2)
    assert np.isfinite(x).all()
    assert report['workflowCompleted'] and report['sourceStable'] and report['physicalOutputMuted']
    windows=[]
    phases=[('neutral',0,report['criteria']['neutralMaximumErrorHz']),('shifted',2,report['criteria']['shiftedMaximumErrorHz'])]
    if 'afterTempo' in report:phases.append(('afterTempo',2,report['criteria']['shiftedMaximumErrorHz']))
    for name,shift,limit in phases:
        offset=report[name]['audioTime']-report['recordStartAudioTime']
        first,last=[offset+t for t in report['criteria']['measurementSecondsAfterSettledState']]
        data=x[round(first*sr):round(last*sr)]
        assert len(data)==2*sr
        rms=np.sqrt(np.mean(data.astype(float)**2,axis=0)).tolist()
        audible=min(rms)>.001
        expected=[f*2**(shift/12) for f in report['fixture']['tonesHz']]
        measured=[frequency(data[:,c],sr) for c in range(2)] if audible else [None,None]
        errors=[measured[c]-expected[c] for c in range(2)] if audible else [None,None]
        windows.append({'name':name,'fromSeconds':first,'toSeconds':last,'frames':len(data),'rms':rms,'audible':audible,'expectedHz':expected,'measuredHz':measured,'errorHz':errors,'maximumErrorHz':limit,'criterionPassed':audible and all(abs(e)<=limit for e in errors)})
    result={'scope':'Actual browser master recording, whole finite44100Hz stereo decode; fixed5–7s after each observed settled state, global20–20000Hz Hann16x/log-parabolic spectral maximum, no frequency mask, fitted alignment or correction. Not native/physical/music/reference acceptance.','audioSHA256':hashlib.sha256(audio.read_bytes()).hexdigest(),'pcmSHA256':hashlib.sha256(pcm.read_bytes()).hexdigest(),'frames':len(x),'sampleRate':sr,'wholeFinite':True,'windows':windows,'neutralCriterionPassed':windows[0]['criterionPassed'],'shiftedCriterionPassed':windows[1]['criterionPassed'],'fullKeylockAccepted':False}
    if len(windows)>2:result['afterTempoCriterionPassed']=windows[2]['criterionPassed']
    out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
