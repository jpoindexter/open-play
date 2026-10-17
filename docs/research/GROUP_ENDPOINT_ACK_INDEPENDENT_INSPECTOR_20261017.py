"""Whole endpoint artifacts and actual-class ACK boundary, without parent writers."""
import sys
sys.dont_write_bytecode=True
import hashlib, json, math, subprocess, tempfile
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/research/GROUP_ENDPOINT_ACK_INDEPENDENT_RESULTS_20261017.json'
H=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()

def load(name): return json.loads((ROOT/('docs/prototype/'+name+'.json')).read_text())
def readraw(m):
 p=ROOT/m['path'];b=p.read_bytes();assert len(b)==m['bytes'] and hashlib.sha256(b).hexdigest()==m['sha256']
 x=np.frombuffer(b,dtype='<f4').reshape(-1,10);assert len(x)==m['frames'] and np.isfinite(x).all()
 return x

NODE=r'''
import fs from 'node:fs';import crypto from 'node:crypto';
let source='';for await(const chunk of process.stdin)source+=chunk;
const original=source,rewritten=source.replace("import Stretch from '/experiments/keylock-soundtouch/group-node-factory.mjs';","const Stretch=(...args)=>globalThis.__groupAckFactory(...args);")+'\nexport {LiveKeylock as BoundaryAdapter};';
if(rewritten===source)throw Error('Import substitution failed');
const {BoundaryAdapter}=await import('data:text/javascript;base64,'+Buffer.from(rewritten).toString('base64'));
class B{constructor(){this.sampleRate=48000;this.length=480000;this.numberOfChannels=2;this.channels=[new Float32Array(this.length),new Float32Array(this.length)];}getChannelData(c){return this.channels[c];}}
globalThis.AudioBuffer=B;const gain=()=>({gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}),records=[];
for(const mode of ['NaN','undefined','numeric-string']){
 let calls=0;globalThis.__groupAckFactory=async()=>({connect(){},latency:async()=>.05,dispose:async()=>{},addBuffers:async()=>{const end=++calls*.5;return mode==='NaN'?NaN:mode==='undefined'?undefined:String(end);}});
 const a=new BoundaryAdapter({sampleRate:48000,currentTime:0,createGain:gain},{buffers:Array.from({length:5},()=>new B()),position:0,rate:1,keylock:true,semitones:0,onEvent(){}});
 let rejected=false,error;try{await a.prepare();}catch(e){rejected=true;error=e.message;}
 const before=a.snapshot();await a.dispose();const after=a.snapshot();
 records.push({mode,rejected,error,appendCalls:calls,retainedAfterPrepare:before.retainedPCMBytes,inFlightAfterPrepare:before.inFlightPCMBytes,retainedAfterDispose:after.retainedPCMBytes,inFlightAfterDispose:after.inFlightPCMBytes,desiredPassed:rejected&&before.retainedPCMBytes===0});
}
console.log(JSON.stringify({sourceSHA256:crypto.createHash('sha256').update(original).digest('hex'),records}));
'''

def main():
 assert not OUT.exists(),'Preserve existing independently owned output'
 source=ROOT/'experiments/keylock-soundtouch/group-live-adapter.js';source_text=source.read_text()
 malformed=json.loads(subprocess.check_output(['node','--input-type=module','-e',NODE],input=source_text.encode(),cwd=ROOT,timeout=30))
 # Explicitly authorized new ignored path; parent report paths are untouched.
 temp=Path(tempfile.mkdtemp(prefix='group-endpoint-ack-independent-',dir=ROOT/'local-evidence'))
 parent_path=temp/'parent-accounting.json'
 subprocess.check_output(['node','scripts/test_group_adapter_ack_accounting.mjs','--report='+str(parent_path)],cwd=ROOT,timeout=30)
 parent=json.loads(parent_path.read_text());assert parent['passed']==4 and parent['failed']==0
 assert parent['sourceSHA256']==malformed['sourceSHA256']==H(source)
 p=load('rubberband-endpoint-markers-plan');r=load('rubberband-endpoint-markers-results');assert r['plan']==p
 assert H(p['library'])==p['librarySHA256']
 assert H('/opt/homebrew/include/rubberband/rubberband-c.h')==p['headerSHA256']
 assert H('/opt/homebrew/include/rubberband/RubberBandStretcher.h')==p['cppHeaderSHA256']
 assert H(ROOT/'scripts/test_rubberband_endpoint_markers.py')==p['scriptSHA256']
 assert p['sampleRates']==[44100,48000] and p['rates']==[1,1.08,1.25] and p['markersSeconds']==[[.2,.3],[1.5,1.6],[3.9,4]]
 assert p['criteria']['markerCentroidErrorSecondsMax']==.010 and p['criteria']['exactPostAPIDelayDurationFrames'] is True
 assert p['optionsHex']==hex(0x34010001)
 inputs={};records=[];failures=[]
 for case in r['cases']:
  sr=case['sampleRate'];rate=case['rate'];x=readraw(case['input']);y=readraw(case['output'])
  if sr not in inputs:
   # Rebuild precisely the declared gated float32 source, independently of CAPI output.
   n=4*sr;t=np.arange(n)/sr;gate=np.zeros(n)
   for a,b in p['markersSeconds']:
    at=np.arange(round(a*sr),round(b*sr));env=np.ones(len(at));fade=round(.005*sr);ramp=.5-.5*np.cos(np.pi*np.arange(fade)/fade);env[:fade]=ramp;env[-fade:]=ramp[::-1];gate[at]=env
   stems=[np.column_stack([(.025*np.sin(2*np.pi*hz*t+phase)*gate).astype('float32') for hz in hzpair]) for phase,hzpair in zip(p['sourcePhases'],zip(p['leftHz'],p['rightHz']))]
   generated=np.column_stack([sum(stems,np.zeros_like(stems[0])),*stems])
   assert generated.astype('<f4').tobytes()==x.tobytes()
   inputs[sr]={'receipt':case['input'],'regeneratedByteExact':True,'wholeFinite':True}
  expected=round(len(x)/rate);delay=case['startDelay'];endpoint=delay+expected
  assert expected==case['expectedFrames'] and len(y)-delay==case['postAPIDelayFrames']
  assert len(y)-delay-expected==case['extraFrames'] and sum(case['retrieveFrameCounts'])==len(y)
  assert all(isinstance(v,int) and v>0 for v in case['retrieveFrameCounts'])
  marks=[]
  for marker,(a,b) in enumerate(p['markersSeconds']):
   ia,iz=round(a*sr),round(b*sr);lo=max(0,round((a/rate-.15)*sr)+delay);hi=min(len(y),round((b/rate+.15)*sr)+delay)
   for channel in range(2,10):
    ie=x[ia:iz,channel].astype(float)**2;oe=y[lo:hi,channel].astype(float)**2
    ec=float(np.dot(np.arange(ia,iz),ie)/ie.sum()/sr/rate);oc=float(np.dot(np.arange(lo,hi)-delay,oe)/oe.sum()/sr);error=oc-ec
    mark={'marker':marker,'channel':channel,'windowFrames':[lo,hi],'expectedSeconds':ec,'observedSeconds':oc,'errorSeconds':error,'passed':abs(error)<=.010}
    old=case['markers'][marker*8+channel-2]
    assert mark['windowFrames']==old['windowFrames'] and max(abs(mark[k]-old[k]) for k in ['expectedSeconds','observedSeconds','errorSeconds'])<1e-12 and mark['passed']==old['passed']
    marks.append(mark)
    if not mark['passed']: failures.append({'sampleRate':sr,'rate':rate,**mark})
  tail=y[endpoint:].astype(float);rms=np.sqrt(np.mean(tail*tail,axis=0));peak=np.max(np.abs(tail),axis=0)
  assert len(tail)==case['tailBeyondNominal']['frames'] and np.allclose(rms,case['tailBeyondNominal']['RMS'],rtol=0,atol=1e-14) and np.array_equal(peak,case['tailBeyondNominal']['peak'])
  passed=len(y)-delay==expected and all(m['passed'] for m in marks);assert passed==case['criteriaPassed']
  records.append({'sampleRate':sr,'rate':rate,'input':case['input'],'output':case['output'],'wholeFinite':True,'APIStartPad':case['preferredStartPad'],'APIStartDelay':delay,'expectedFrames':expected,'postAPIDelayFrames':len(y)-delay,'extraFrames':len(tail),'markers':marks,'tailRMS':rms.tolist(),'tailPeak':peak.tolist(),'tailNonzeroSamples':int(np.count_nonzero(tail)),'criteriaPassed':passed})
 assert len(records)==6 and r['passed']==0 and r['failed']==6 and len(failures)==1
 result={'scope':'Independent whole endpoint artifacts plus controlled actual-class ACK boundary. Not browser/heap/native/realtime-callback acceptance.',
 'inspectorSHA256':H(__file__),'planSHA256':H(ROOT/'docs/prototype/rubberband-endpoint-markers-plan.json'),'reportSHA256':H(ROOT/'docs/prototype/rubberband-endpoint-markers-results.json'),
 'inputs':inputs,'cases':records,'markerChecks':sum(len(c['markers']) for c in records),'markerFailures':failures,'primaryAcceptedCases':0,
 'parentACKTest':{'newIgnoredReport':str(parent_path.relative_to(ROOT)),'sha256':H(parent_path),'report':parent},
 'malformedACKInitial':malformed,'frozenAdapterSourceText':source_text,'fullParityVerified':False}
 OUT.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({'cases':len(records),'markerChecks':144,'markerFailures':failures,'extraFrames':[c['extraFrames'] for c in records],'parentACK':parent['passed'],'malformedACK':malformed},indent=2))

def fixed_check():
 # Parent explicitly authorized appending an independently executed resolution;
 # original RED source/records and endpoint evidence remain byte-value intact.
 result=json.loads(OUT.read_text());assert 'malformedACKFixed' not in result
 source=ROOT/'experiments/keylock-soundtouch/group-live-adapter.js';text=source.read_text()
 assert H(source)=='b82a073039a4b710dcfa789b91c20389f351b3bb06fde4466b97ec13a592f7ea'
 assert text==result['frozenAdapterSourceText'].replace('if(Math.abs(extent-expected)>1/this.sampleRate)', 'if(!Number.isFinite(extent)||Math.abs(extent-expected)>1/this.sampleRate)')
 fixed=json.loads(subprocess.check_output(['node','--input-type=module','-e',NODE],input=text.encode(),cwd=ROOT,timeout=30))
 assert all(r['desiredPassed'] and r['retainedAfterDispose']==r['inFlightAfterDispose']==0 for r in fixed['records'])
 temp=Path(tempfile.mkdtemp(prefix='group-endpoint-ack-independent-fixed-',dir=ROOT/'local-evidence'));path=temp/'parent-accounting.json'
 subprocess.check_output(['node','scripts/test_group_adapter_ack_accounting.mjs','--report='+str(path)],cwd=ROOT,timeout=30)
 parent=json.loads(path.read_text());assert parent['passed']==4 and parent['failed']==0 and parent['sourceSHA256']==fixed['sourceSHA256']
 result['inspectorSHA256']=H(__file__);result['malformedACKFixed']=fixed
 result['parentACKTestFixed']={'newIgnoredReport':str(path.relative_to(ROOT)),'sha256':H(path),'report':parent}
 result['resolutionScope']='Only Number.isFinite added to frozen5f adapter; controlled ACK guards only, no new browser/native evidence.'
 OUT.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(fixed,indent=2))

if __name__=='__main__':
 if '--fixed-only' in sys.argv:fixed_check()
 else:main()
