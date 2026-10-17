"""Read-only input inspection; writes only this review's unique results file."""
import sys
sys.dont_write_bytecode = True
import ctypes as C
import hashlib
import json
import math
import subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'docs/research/GROUP_RESUME_RUBBERBAND_INDEPENDENT_RESULTS_20261017.json'

def digest(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def readj(name):
    return json.loads((ROOT / ('docs/prototype/' + name + '.json')).read_text())

def raw(meta):
    p = ROOT / meta.get('file', meta.get('path', ''))
    b = p.read_bytes()
    assert len(b) == meta['bytes'] and hashlib.sha256(b).hexdigest() == meta['sha256']
    a = np.frombuffer(b, dtype='<f4').reshape(-1, meta['channels'])
    assert len(a) == meta['frames'] and np.isfinite(a).all()
    return a, {'path': str(p.relative_to(ROOT)), 'sha256': digest(p), 'bytes': len(b),
               'frames': len(a), 'channels': a.shape[1], 'wholeFinite': True}

def frequency(v, sr=48000):
    x = np.array(v, dtype=np.float64)
    x -= x.mean()
    n = 1 << (16 * len(x) - 1).bit_length()
    spectrum = abs(np.fft.rfft(x * np.hanning(len(x)), n=n))
    lo, hi = math.ceil(20*n/sr), min(len(spectrum)-2, math.floor(20000*n/sr))
    k = lo + int(spectrum[lo:hi+1].argmax())
    a, b, c = np.log(np.maximum(spectrum[k-1:k+2], 1e-300))
    return float((k + .5*(a-c)/(a-2*b+c))*sr/n)

def tones(a, first, last, pitch=1):
    assert 0 <= first < last <= len(a)
    out = []
    for stem in range(4):
        for c in range(2):
            v = a[first:last, 2+2*stem+c]
            expected = [[197,311,463,719],[257,383,593,887]][c][stem]*2*pitch
            hz = frequency(v)
            out.append({'stem': stem, 'channel': c, 'Hz': hz, 'expectedHz': expected,
                        'errorHz': abs(hz-expected), 'RMS': float(np.sqrt(np.mean(v.astype(float)**2)))})
    return out

def reconstruction(a, first, last):
    x = a[first:last].astype(np.float64)
    return [float(np.sqrt(np.mean((sum(x[:,2*s+c] for s in range(1,5))-x[:,c])**2)
                          /np.mean(x[:,c]**2))) for c in range(2)]

def main():
    assert not DEST.exists(), 'Preserve prior output; use a new filename for another run'
    d = readj('soundtouch-group-resume-diagnostic2-results')
    source_checks = []
    for f in d['sources']:
        p = ROOT / f['snapshot']
        assert p.stat().st_size == f['bytes'] and digest(p) == f['sha256']
        source_checks.append({'snapshot': f['snapshot'], 'sha256': digest(p)})
    x, xm = raw(d['normalized'])
    y, ym = raw(d['output'])
    parent = readj('soundtouch-engine-browser-group-engine-results')
    assert digest(ROOT / d['plan']['parentReport']) == d['plan']['parentReportSHA256']
    oldcase = next(c for c in parent['cases'] if c['sampleRate'] == 48000)
    oldmeta = dict(oldcase['capture']['retained'], channels=oldcase['capture']['channels'],
                   frames=oldcase['capture']['frames'])
    old, om = raw(oldmeta)
    assert d['fixtureHashes'] == oldcase['inputHashes']
    start = d['alignment']['oldStartOffset']
    a, z = [round(t*48000) for t in d['plan']['comparisonSeconds']]
    exact = []
    for c in range(10):
        exact.append(old[start+a:start+z,c].tobytes() == y[256+a:256+z,c].tobytes())
    assert all(exact)
    # Execute the actual immutable module twice; no project writer script is executed.
    node = r'''
import fs from 'node:fs'; import crypto from 'node:crypto'; import {pathToFileURL} from 'node:url';
const root=process.cwd(),base=root+'/local-evidence/soundtouch-group-resume-diagnostic2/source-snapshots/experiments/keylock-soundtouch/';
const {SoundTouchTransport}=await import(pathToFileURL(base+'grouped-fullseek-pull-transport.mjs'));
const {SharedOverlapGuide}=await import(pathToFileURL(base+'shared-overlap-guide.mjs'));
const b=fs.readFileSync(root+'/local-evidence/soundtouch-group-resume-diagnostic2/normalized-input.f32le');
const v=new Float32Array(b.buffer,b.byteOffset,b.byteLength/4),frames=v.length/10;
const buffers=Array.from({length:5},(_,s)=>[0,1].map(c=>Float32Array.from({length:frames},(_,i)=>v[i*10+s*2+c])));
const H=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer)).digest('hex');
function render(log){ const events=[],attach=SharedOverlapGuide.prototype.attach;let t;
 if(log)SharedOverlapGuide.prototype.attach=function(stretch){const leader=this.readers.length===0,detach=attach.call(this,stretch),wrapped=stretch.seekBestOverlapPosition,g=this;if(leader)stretch.seekBestOverlapPosition=function(input){const before=g.next,value=wrapped.call(this,input);events.push({sequence:before,offset:value,inputStartIndex:input.startIndex,inputFrameCount:input.frameCount,overlapLength:this.overlapLength,seekWindowLength:this.seekWindowLength,seekLength:this.seekLength,nominalSkip:this.nominalSkip,skipFract:this.skipFract});return value;};return detach;};
 try{t=new SoundTouchTransport({sampleRate:48000,buffers});t.schedule({type:'start',frame:256,position:2.0066666666666677,rate:1.25,keylock:true,semitones:2});const pcm=new Float32Array(192256*10);for(let at=0;at<192256;at+=128){const q=t.render(at,128);for(let i=0;i<128;i++)for(let s=0;s<5;s++)for(let c=0;c<2;c++)pcm[(at+i)*10+s*2+c]=q[s][c][i];}return{sha256:H(pcm),events,snapshot:t.snapshot()};}finally{SharedOverlapGuide.prototype.attach=attach;t?.dispose();}}
const plain=render(false),logged=render(true);console.log(JSON.stringify({plainSHA256:plain.sha256,loggedSHA256:logged.sha256,events:logged.events,snapshot:plain.snapshot}));
'''
    rerun = json.loads(subprocess.check_output(['node','--input-type=module','-e',node], cwd=ROOT, timeout=60))
    assert rerun['plainSHA256'] == rerun['loggedSHA256'] == ym['sha256']
    assert rerun['events'] == d['guideOffsetTranscript'] and len(rerun['events']) == 48
    assert rerun['snapshot'] == d['actualTransportSnapshot']
    input_tones = tones(x,240000,336000)
    output_tones = tones(y,120544,168544,2**(2/12))
    spectra = readj('soundtouch-group-resume-diagnostic2-spectra')
    for actual, saved in zip([input_tones,output_tones], spectra['records']):
        assert max(abs(a['Hz']-b['Hz']) for a,b in zip(actual,saved['channels'])) < 1e-8
    rb = []
    header = Path('/opt/homebrew/include/rubberband/rubberband-c.h')
    for mode in ['offline','realtime-mode']:
        r = readj('rubberband-grouped-'+mode+'-results');p=r['plan'];lib=Path(p['library'])
        assert digest(lib)==p['librarySHA256'] and digest(header)==p['headerSHA256']
        assert p['input']==d['normalized'] and p['inputStartFrame']==96320
        assert p['timeRatio']==.8 and p['pitchScale']==2**(2/12)
        assert int(p['optionsHex'],16)==({'offline':0x32010000,'realtime-mode':0x34010001}[mode])
        q,qm=raw(r['output']);delay=r.get('startDelay',0)
        first,last=[round(t*48000)+delay for t in p['measurementOutputSeconds']]
        measured=tones(q,first,last,p['pitchScale']);recomb=reconstruction(q,first,last)
        assert max(abs(a['Hz']-b['Hz']) for a,b in zip(measured,r['measurements']))<1e-8
        assert all(abs(a-b['relativeRMS'])<1e-12 for a,b in zip(recomb,r['reconstruction']))
        assert sum(e['retrieved'] for e in r['retrieveEvents'])==len(q)
        assert all(e['retrieved']==e['available'] for e in r['retrieveEvents'])
        expected=round((len(x)-96320)*.8)
        passed=len(q)-delay==expected and all(t['errorHz']<=1 and t['RMS']>.001 for t in measured) and max(recomb)<=.03
        assert passed==r['criteriaPassed']
        L=C.CDLL(str(lib));new=L.rubberband_new;new.argtypes=[C.c_uint,C.c_uint,C.c_int,C.c_double,C.c_double];new.restype=C.c_void_p
        state=new(48000,10,int(p['optionsHex'],16),.8,2**(2/12));assert state
        api={}
        try:
            for key,name in [('engine','rubberband_get_engine_version'),('channels','rubberband_get_channel_count'),('pad','rubberband_get_preferred_start_pad'),('delay','rubberband_get_start_delay')]:
                f=getattr(L,name);f.argtypes=[C.c_void_p];f.restype=C.c_uint;api[key]=int(f(state))
        finally:
            L.rubberband_delete.argtypes=[C.c_void_p];L.rubberband_delete(state)
        assert api['engine']==3 and api['channels']==10 and api['delay']==delay
        assert api['pad']==r.get('preferredStartPad',0)
        rb.append({'mode':mode,'raw':qm,'planSHA256':digest(ROOT/('docs/prototype/rubberband-grouped-'+mode+'-plan.json')),
                   'resultsSHA256':digest(ROOT/('docs/prototype/rubberband-grouped-'+mode+'-results.json')),
                   'librarySHA256':digest(lib),'headerSHA256':digest(header),'actualAPI':api,
                   'tones':measured,'maxPitchErrorHz':max(t['errorHz'] for t in measured),'reconstruction':recomb,
                   'expectedFrames':expected,'postAPIDelayFrames':len(q)-delay,'extraFrames':len(q)-delay-expected,
                   'criteriaPassed':passed,'retrieveEventCount':len(r['retrieveEvents'])})
    result={'scope':'Independent offline inspection and immutable SoundTouch reexecution. No browser/native/application acceptance or old cohort regrading.',
            'inspectorSHA256':digest(__file__),'sourceCapsuleFilesVerified':len(source_checks),'sources':source_checks,
            'parentRaw':om,'normalizedInput':xm,'savedReplay':ym,'allTenChannelsByteExact':exact,
            'comparisonRelativeFrames':[a,z],'oldStartOffset':start,'newScheduledFrame':256,
            'independentImmutableRerun':rerun,'inputTones':input_tones,'outputTones':output_tones,
            'outputFailures':[t for t in output_tones if t['errorHz']>1],
            'inputMaxErrorHz':max(t['errorHz'] for t in input_tones),'rubberband':rb,'fullParityVerified':False}
    DEST.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'sources':len(source_checks),'replayByteExact':all(exact),'rerunSHA':rerun['plainSHA256'],
                      'guideOffsets':len(rerun['events']),'inputMaxErrorHz':result['inputMaxErrorHz'],
                      'outputFailures':result['outputFailures'],
                      'rubberband':[{k:r[k] for k in ['mode','maxPitchErrorHz','reconstruction','extraFrames','criteriaPassed']} for r in rb]},indent=2))

if __name__ == '__main__':
    main()
