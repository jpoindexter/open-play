"""Declared markers through installed R3 C API. Offline caller, never audio callback acceptance."""
import ctypes as C, datetime, hashlib, json, math, time
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[1]; tag='rubberband-endpoint-markers'; D=R/'local-evidence'/tag
out=R/'docs/prototype'/f'{tag}-results.json'; planfile=R/'docs/prototype'/f'{tag}-plan.json'
assert not D.exists() and not out.exists() and not planfile.exists(); D.mkdir()
library=Path('/opt/homebrew/lib/librubberband.dylib').resolve(); header=Path('/opt/homebrew/include/rubberband/rubberband-c.h'); cppheader=header.parent/'RubberBandStretcher.h'
sha=lambda b:hashlib.sha256(b).hexdigest()
plan={'declaredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Known gated tones through installed native R3 C API in RealTime mode, driven by offline Python. Whole untrimmed outputs. No app integration, physical callbacks, realtime deadlines, music/reference/seek acceptance.','library':str(library),'librarySHA256':sha(library.read_bytes()),'headerSHA256':sha(header.read_bytes()),'cppHeaderSHA256':sha(cppheader.read_bytes()),'scriptSHA256':sha(Path(__file__).read_bytes()),'sampleRates':[44100,48000],'rates':[1,1.08,1.25],'pitchSemitones':2,'channels':10,'sourceDurationSeconds':4,'markersSeconds':[[.2,.3],[1.5,1.6],[3.9,4]],'fadeSeconds':.005,'stemAmplitude':.025,'leftHz':[197,311,463,719],'rightHz':[257,383,593,887],'sourcePhases':[.13,.37,.73,1.17],'inputProcessBlockFrames':2048,'optionsHex':hex(0x20000000|0x10000000|0x04000000|0x00010000|1),'compensation':'Prepend getPreferredStartPad zeros; analytical output coordinates add getStartDelay. Do not fit/crop output or alter input endpoint.','markerMeasurement':'Energy centroid of each isolated stem/channel within fixed source-marker start/rate-.15 .. end/rate+.15 output seconds, API delay added. Compare with exact input energy centroid divided by rate. No alignment/gain/phase fit.','criteria':{'wholeFinite':True,'markerCentroidErrorSecondsMax':.010,'exactPostAPIDelayDurationFrames':True},'fullParityVerified':False}
planfile.write_text(json.dumps(plan,indent=2)+'\n')
L=C.CDLL(str(library)); FP=C.POINTER(C.c_float); channels=10; PP=FP*channels

def fn(name,rest,args):
 f=getattr(L,name); f.restype=rest; f.argtypes=args; return f
new=fn('rubberband_new',C.c_void_p,[C.c_uint,C.c_uint,C.c_int,C.c_double,C.c_double]); delete=fn('rubberband_delete',None,[C.c_void_p]); engine=fn('rubberband_get_engine_version',C.c_int,[C.c_void_p]); expectedDuration=fn('rubberband_set_expected_input_duration',None,[C.c_void_p,C.c_uint]); maxsize=fn('rubberband_set_max_process_size',None,[C.c_void_p,C.c_uint]); process=fn('rubberband_process',None,[C.c_void_p,C.POINTER(FP),C.c_uint,C.c_int]); available=fn('rubberband_available',C.c_int,[C.c_void_p]); retrieve=fn('rubberband_retrieve',C.c_uint,[C.c_void_p,C.POINTER(FP),C.c_uint]); padfn=fn('rubberband_get_preferred_start_pad',C.c_uint,[C.c_void_p]); delayfn=fn('rubberband_get_start_delay',C.c_uint,[C.c_void_p])
def ptrs(a,offset=0): return PP(*[C.cast(C.c_void_p(a[c].ctypes.data+offset*4),FP) for c in range(channels)])
def receipt(p,a):
 p.write_bytes(a.astype('<f4').tobytes()); return {'path':str(p.relative_to(R)),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size,'frames':len(a),'channels':channels}
results=[]
for sr in plan['sampleRates']:
 frames=sr*4; t=np.arange(frames)/sr; gate=np.zeros(frames)
 for a,b in plan['markersSeconds']:
  at=np.arange(round(a*sr),round(b*sr)); envelope=np.ones(len(at)); fade=round(plan['fadeSeconds']*sr); ramp=.5-.5*np.cos(np.pi*np.arange(fade)/fade); envelope[:fade]=ramp;envelope[-fade:]=ramp[::-1];gate[at]=envelope
 stems=[np.column_stack([(.025*np.sin(2*np.pi*hz*t+phase)*gate).astype('float32') for hz in pair]) for phase,pair in zip(plan['sourcePhases'],zip(plan['leftHz'],plan['rightHz']))]
 original=sum(stems,np.zeros_like(stems[0])); x=np.column_stack([original,*stems]); inputReceipt=receipt(D/f'input-{sr}.f32le',x); inp=np.ascontiguousarray(x.T)
 for rate in plan['rates']:
  state=new(sr,channels,int(plan['optionsHex'],16),1/rate,2**(2/12)); assert state
  blocks=[]; times=[]; events=[]
  def drain():
   for _ in range(1000):
    n=available(state)
    if n<=0:return n
    assert n<sr*20; block=np.empty((channels,n),dtype='float32');got=retrieve(state,ptrs(block),n);assert got==n;blocks.append(block);events.append(n)
   raise RuntimeError('Drain bound')
  def feed(a,final=False):
   for offset in range(0,a.shape[1],2048):
    count=min(2048,a.shape[1]-offset); started=time.perf_counter();process(state,ptrs(a,offset),count,int(final and offset+count==a.shape[1]));drain();times.append((time.perf_counter()-started)*1000)
  try:
   assert engine(state)==3;expectedDuration(state,frames);maxsize(state,2048);pad=padfn(state);delay=delayfn(state);feed(np.zeros((channels,pad),dtype='float32'));feed(inp,True);assert drain()==-1
  finally:delete(state)
  y=np.concatenate(blocks,axis=1).T.copy();expected=round(frames/rate);endpoint=delay+expected;marks=[]
  for marker,(a,b) in enumerate(plan['markersSeconds']):
   ai,bi=round(a*sr),round(b*sr);lo=max(0,round((a/rate-.15)*sr)+delay);hi=min(len(y),round((b/rate+.15)*sr)+delay)
   for channel in range(2,10):
    inputEnergy=x[ai:bi,channel].astype(float)**2;expectedCenter=float(np.dot(np.arange(ai,bi),inputEnergy)/sum(inputEnergy)/sr/rate);outputEnergy=y[lo:hi,channel].astype(float)**2;observed=float(np.dot(np.arange(lo,hi)-delay,outputEnergy)/sum(outputEnergy)/sr);error=observed-expectedCenter;marks.append({'marker':marker,'channel':channel,'windowFrames':[lo,hi],'expectedSeconds':expectedCenter,'observedSeconds':observed,'errorSeconds':error,'passed':abs(error)<=.010})
  tail=y[endpoint:].astype(float);outputReceipt=receipt(D/f'output-{sr}-{rate}.f32le',y);finite=bool(np.isfinite(y).all());durationExact=len(y)-delay==expected
  results.append({'sampleRate':sr,'rate':rate,'input':inputReceipt,'output':outputReceipt,'preferredStartPad':pad,'startDelay':delay,'expectedFrames':expected,'postAPIDelayFrames':len(y)-delay,'extraFrames':len(y)-delay-expected,'durationExact':durationExact,'wholeFinite':finite,'markers':marks,'tailBeyondNominal':{'frames':len(tail),'RMS':np.sqrt(np.mean(tail*tail,axis=0)).tolist() if len(tail) else [],'peak':np.max(np.abs(tail),axis=0).tolist() if len(tail) else []},'offlineCallTimingsMs':{'count':len(times),'median':float(np.median(times)),'p95':float(np.percentile(times,95)),'max':max(times),'notRealtimeCallbackAcceptance':True},'retrieveFrameCounts':events,'criteriaPassed':finite and durationExact and all(m['passed'] for m in marks)})
report={'plan':plan,'cases':results,'passed':sum(r['criteriaPassed'] for r in results),'failed':sum(not r['criteriaPassed'] for r in results),'fullParityVerified':False};out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':report['passed'],'failed':report['failed'],'cases':[{'sampleRate':r['sampleRate'],'rate':r['rate'],'extraFrames':r['extraFrames'],'markerFailures':sum(not m['passed'] for m in r['markers']),'maxMarkerErrorSeconds':max(abs(m['errorSeconds']) for m in r['markers']),'tailPeakMax':max(r['tailBeyondNominal']['peak'],default=0)} for r in results]},indent=2))
