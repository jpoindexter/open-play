"""Alternative installed native DSP, one exact known input; no product integration."""
import ctypes as C,hashlib,json,datetime,time,math,subprocess
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[1];out=R/'docs/prototype/rubberband-grouped-realtime-mode-results.json';D=R/'local-evidence/rubberband-grouped-realtime-mode';assert not out.exists() and not D.exists();D.mkdir()
source=json.loads((R/'docs/prototype/soundtouch-group-resume-diagnostic2-results.json').read_text());library=Path('/opt/homebrew/lib/librubberband.dylib').resolve();header=Path('/opt/homebrew/include/rubberband/rubberband-c.h');sr=48000;channels=10;rate=1.25;pitch=2**(2/12);options=0x20000000|0x10000000|0x04000000|0x00010000|0x00000001
plan={'declaredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Installed Rubber Band4.0.0 CAPI RealTime MODE driven by offlinePythoncaller. Not physical audio callbacks/deadlines/browser/nativeapp acceptance or regrading oldcohorts.','library':str(library),'librarySHA256':hashlib.sha256(library.read_bytes()).hexdigest(),'headerSHA256':hashlib.sha256(header.read_bytes()).hexdigest(),'input':source['normalized'],'inputStartFrame':round(source['plan']['relativePositionSeconds']*sr),'sampleRate':sr,'channels':channels,'optionsHex':hex(options),'options':['RealTime','EngineFinerR3','ChannelsTogether','PitchHighConsistency','ThreadingNever'],'timeRatio':1/rate,'pitchScale':pitch,'measurementOutputSeconds':[2.506,3.506],'criteria':{'frequencyErrorHzMax':1,'relativeReconstructionRMSMax':.03,'RMSMin':.001,'wholeFinite':True,'exactDurationFrames':True},'noAlignmentGainPhaseFit':True,'scriptSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'latencyCompensation':'Query librarypreferredstartpad/startdelay with initialrate/pitch; send exactlythatmanyleadingzeros and measure at statedAPIoutputdelay. Whole originaloutput includingpadding retained; no fitted trim.','fullParityVerified':False};(R/'docs/prototype/rubberband-grouped-realtime-mode-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
b=(R/plan['input']['file']).read_bytes();assert hashlib.sha256(b).hexdigest()==plan['input']['sha256'];x=np.frombuffer(b,dtype='<f4').reshape(-1,10)[plan['inputStartFrame']:];input=np.ascontiguousarray(x.T);frames=input.shape[1];floatptr=C.POINTER(C.c_float);pointers=floatptr*channels;L=C.CDLL(str(library))
def fn(name,rest,args):f=getattr(L,name);f.restype=rest;f.argtypes=args;return f
new=fn('rubberband_new',C.c_void_p,[C.c_uint,C.c_uint,C.c_int,C.c_double,C.c_double]);delete=fn('rubberband_delete',None,[C.c_void_p]);engine=fn('rubberband_get_engine_version',C.c_int,[C.c_void_p]);duration=fn('rubberband_set_expected_input_duration',None,[C.c_void_p,C.c_uint]);maxsize=fn('rubberband_set_max_process_size',None,[C.c_void_p,C.c_uint]);study=fn('rubberband_study',None,[C.c_void_p,C.POINTER(floatptr),C.c_uint,C.c_int]);process=fn('rubberband_process',None,[C.c_void_p,C.POINTER(floatptr),C.c_uint,C.c_int]);available=fn('rubberband_available',C.c_int,[C.c_void_p]);retrieve=fn('rubberband_retrieve',C.c_uint,[C.c_void_p,C.POINTER(floatptr),C.c_uint]);getchannels=fn('rubberband_get_channel_count',C.c_uint,[C.c_void_p]);padfn=fn('rubberband_get_preferred_start_pad',C.c_uint,[C.c_void_p]);delayfn=fn('rubberband_get_start_delay',C.c_uint,[C.c_void_p]);state=new(sr,channels,options,1/rate,pitch);assert state
blocks=[];events=[];started=time.perf_counter()
def ptrs(a,offset=0):return pointers(*[C.cast(C.c_void_p(int(a[c].ctypes.data)+offset*4),floatptr) for c in range(channels)])
def drain():
 for _ in range(1000):
  count=available(state)
  if count<=0:return count
  assert count<sr*20
  chunk=np.empty((channels,count),dtype=np.float32);got=retrieve(state,ptrs(chunk),count);assert got==count;blocks.append(chunk.copy());events.append({'available':count,'retrieved':got})
 raise RuntimeError('Drain bound exceeded')
try:
 actualEngine=engine(state);assert actualEngine==3 and getchannels(state)==channels;duration(state,frames);maxsize(state,2048)
 preferredPad=padfn(state);startDelay=delayfn(state);initial=np.zeros((channels,preferredPad),dtype=np.float32)
 for at in range(0,preferredPad,2048):count=min(2048,preferredPad-at);process(state,ptrs(initial,at),count,0);drain()
 studied=time.perf_counter()
 for at in range(0,frames,2048):count=min(2048,frames-at);process(state,ptrs(input,at),count,int(at+count==frames));drain()
 finalAvailable=drain();assert finalAvailable==-1
finally:delete(state)
finished=time.perf_counter();y=np.concatenate(blocks,axis=1).T.copy();finite=bool(np.isfinite(y).all());raw=D/'whole-output.f32le';raw.write_bytes(y.astype('<f4').tobytes());a,z=[round(t*sr)+startDelay for t in plan['measurementOutputSeconds']];assert z<=len(y)
def hz(v):
 v=np.asarray(v,dtype=float);v-=v.mean();n=1<<math.ceil(math.log2(len(v)*16));m=np.abs(np.fft.rfft(v*np.hanning(len(v)),n));lo=math.ceil(20*n/sr);hi=min(len(m)-2,math.floor(20000*n/sr));k=lo+int(np.argmax(m[lo:hi+1]));p,q,r=np.log(np.maximum(m[k-1:k+2],1e-300));return float((k+.5*(p-r)/(p-2*q+r))*sr/n)
measurements=[]
for s in range(4):
 for c in range(2):
  v=y[a:z,(s+1)*2+c];freq=hz(v);expected=[[197,311,463,719],[257,383,593,887]][c][s]*2*pitch;level=float(np.sqrt(np.mean(v.astype(float)**2)));error=abs(freq-expected);measurements.append({'stem':s,'channel':c,'expectedHz':expected,'Hz':freq,'errorHz':error,'RMS':level,'passed':error<=1 and level>.001})
recomb=[]
for c in range(2):
 ref=y[a:z,c].astype(float);delta=sum(y[a:z,s*2+c].astype(float) for s in range(1,5))-ref;ratio=float(np.sqrt(np.mean(delta**2)/np.mean(ref**2)));recomb.append({'channel':c,'relativeRMS':ratio,'passed':ratio<=.03})
expectedFrames=round(frames/rate);report={'plan':plan,'actualEngineVersion':actualEngine,'inputFrames':frames,'expectedOutputFrames':expectedFrames,'actualOutputFrames':len(y),'preferredStartPad':preferredPad,'startDelay':startDelay,'postAPIDelayFrames':len(y)-startDelay,'durationExact':len(y)-startDelay==expectedFrames,'wholeFinite':finite,'output':{'path':str(raw.relative_to(R)),'frames':len(y),'channels':10,'sampleRate':sr,'bytes':raw.stat().st_size,'sha256':hashlib.sha256(raw.read_bytes()).hexdigest()},'studyMilliseconds':(studied-started)*1000,'processRetrieveMilliseconds':(finished-studied)*1000,'offlineTimingNotRealtimeAcceptance':True,'retrieveEvents':events,'measurements':measurements,'reconstruction':recomb,'criteriaPassed':finite and len(y)-startDelay==expectedFrames and all(v['passed'] for v in measurements+recomb),'fullParityVerified':False};out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':report['criteriaPassed'],'expectedFrames':expectedFrames,'actualFrames':len(y),'preferredStartPad':preferredPad,'startDelay':startDelay,'postAPIDelayFrames':len(y)-startDelay,'reconstruction':recomb,'frequencyFailures':[v for v in measurements if not v['passed']],'maxPitchErrorHz':max(v['errorHz'] for v in measurements),'timingMs':report['processRetrieveMilliseconds']},indent=2))
