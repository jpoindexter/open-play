#!/usr/bin/env python3
"""Offline refutation of preserved serial-WASM pitch/history experiment artifacts."""
from pathlib import Path
import hashlib,json,math,wave,subprocess
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/research/KEYLOCK_PITCH_ISOLATION_INDEPENDENT_RESULTS_20261017.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
def frequency(x,sr):
 x=x.astype(np.float64);x-=x.mean();n=1<<math.ceil(math.log2(len(x)*16));v=np.abs(np.fft.rfft(x*np.hanning(len(x)),n));lo=math.ceil(20*n/sr);hi=math.floor(min(20000,sr/2-1)*n/sr);k=lo+int(np.argmax(v[lo:hi+1]));a,b,c=np.log(np.maximum(v[k-1:k+2],1e-300));return float((k+.5*(a-c)/(a-2*b+c))*sr/n)
def pcm(meta):
 p=ROOT/meta['path'];assert H(p)==meta['sha256'];assert p.stat().st_size==meta['bytes'];a=np.fromfile(p,dtype='<f4').reshape(-1,meta['channels']);assert a.shape==(meta['frames'],2);assert np.isfinite(a).all();return a
def main():
 assert not OUT.exists(),'Refusing to overwrite independent output'
 source=ROOT/'local-evidence/keylock-native-fixtures/native-keylock-stereo-120s.wav';assert H(source)=='99833309d13090de63a9fcdb7ca8f6bcf601975bfb8cb2e3ef691bb369a0a119'
 with wave.open(str(source),'rb') as w:
  assert (w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes())==(2,2,44100,5292000);original=np.frombuffer(w.readframes(14*44100),dtype='<i2').reshape(-1,2).astype(np.float32)/32768
 reports=[];arrays={}
 for cohort,base in [('isolation','keylock-pitch-isolation'),('history','keylock-seek-history')]:
  render_path=ROOT/f'docs/prototype/{base}-initial-render.json';analysis_path=ROOT/f'docs/prototype/{base}-initial-analysis.json';plan_path=ROOT/f'docs/prototype/{base}-plan.json';render=J(render_path);analysis=J(analysis_path);assert render['planSHA256']==H(plan_path);sr=44100;assert render['quantum']==128
  for m in render['modules'].values():assert H(ROOT/m['path'])==m['sha256']
  prefix=pcm(render['source']['prefix']);assert np.array_equal(prefix,original);source_f=[frequency(prefix[5*sr:7*sr,c],sr) for c in range(2)]
  comparisons=[];parent={x['id']:x for x in analysis['results']}
  for row in render['results']:
   a=pcm(row);assert row['sampleRate']==sr;assert row['frames']==math.ceil(sr*10/128)*128;assert row['command']=={'active':True,'input':0,'output':.25,'rate':row['rate'],'semitones':row['semitones']};assert row['accepted']['rate']==row['rate'];assert row['accepted']['semitones']==row['semitones'];assert row['latency']==.12
   arrays[(cohort,row['id'])]=a;measured=[frequency(a[5*sr:7*sr,c],sr) for c in range(2)];expected=[f*2**(row['semitones']/12) for f in [330,550]];errors=[measured[c]-expected[c] for c in range(2)];p=parent[row['id']];delta=[measured[c]-p['measuredHz'][c] for c in range(2)];assert max(abs(x) for x in delta)<.001
   comparisons.append({'id':row['id'],'inputRate':row['rate'],'semitones':row['semitones'],'historyFrames':row.get('bufferLength',5292),'SHA256':row['sha256'],'frames':len(a),'sampleValues':int(a.size),'wholeFinite':True,'wholeRMS':np.sqrt(np.mean(a.astype(np.float64)**2,axis=0)).tolist(),'expectedHz':expected,'measuredHz':measured,'errorHz':errors,'maximumDeviationFromParentEstimatorHz':max(abs(x) for x in delta),'channelCriterionPassed':[abs(x)<=1 for x in errors]})
  assert len(comparisons)==(10 if cohort=='isolation' else 8)
  reports.append({'cohort':cohort,'plan':{'path':str(plan_path.relative_to(ROOT)),'SHA256':H(plan_path)},'render':{'path':str(render_path.relative_to(ROOT)),'SHA256':H(render_path)},'analysis':{'path':str(analysis_path.relative_to(ROOT)),'SHA256':H(analysis_path)},'original14sPrefixExactPCM16Normalization':True,'sourceFrequencyHz':source_f,'records':comparisons})
 pairs=[]
 for shift in [0,2]:
  one=arrays[('isolation',f'production-rate1.08-shift{shift}-whole')];other=arrays[('isolation',f'production-rate1.08-shift{shift}-half-second-chunks')];assert np.array_equal(one,other);pairs.append({'semitones':shift,'entireWholeVsHalfSecondChunkOutputBitIdentical':True})
 js="""(async()=>{global.sampleRate=44100;global.currentTime=0;let C,resolve;global.AudioWorkletProcessor=class{constructor(){this.ready=new Promise(r=>resolve=r);this.port={onmessage:null,postMessage:m=>{if(m[0]==='ready')resolve();}}}};global.registerProcessor=(n,c)=>C=c;await import('./prototype/vendor/signalsmith-stretch/SignalsmithStretch.mjs');const p=new C({numberOfOutputs:1,outputChannelCount:[2]});await p.ready;console.log(JSON.stringify({sampleRate,bufferLength:p.bufferLength,inputLatency:p.wasmModule._inputLatency(),outputLatency:p.wasmModule._outputLatency(),blockSamples:p.wasmModule._blockSamples(),intervalSamples:p.wasmModule._intervalSamples()}));})()"""
 geometry=json.loads(subprocess.check_output(['node','-e',js],cwd=ROOT,text=True));assert geometry=={'sampleRate':44100,'bufferLength':5292,'inputLatency':2646,'outputLatency':2646,'blockSamples':5292,'intervalSamples':1323}
 header=ROOT/'local-evidence/keylock-pitch-upstream-source/signalsmith-stretch.h';assert H(header)=='1188667959ac19dd40c0a6abbce694e44705615ec4f0e8db8af0f1cfb4c5dea7'
 result={'scope':'Whole preserved raw/input hash/finite checks and independent16x globalHann estimator in fixed5–7s. Live actual upstreamWASM geometry query only, no new audio render/native/UI/production change. Prior native0061Hzfailure not regraded.','frequencyMethod':'Mean removal,Hann,global20–20000Hz maximum,>=16xpower-of-two padding,log-parabolic interpolation. Parent4xmeasurements comparedwithin.001Hz numericalanalysis tolerance; unchanged1Hz gate.','originalSource':{'path':str(source.relative_to(ROOT)),'SHA256':H(source)},'cohorts':reports,'chunkComparisons':pairs,'actualWASMGeometry':geometry,'pinnedOfficialHeader':{'path':str(header.relative_to(ROOT)),'SHA256':H(header),'fullHistoryFrames':6615,'shortfallFrames':1323,'shortfallSeconds':.03,'compiledWASMExactSourceCommitProven':False},'findings':{'rawPrecodecPitchMissReproduced':True,'neutralHistoryInterventionRemovesMeasuredOffset':True,'shiftedFailurePersistsAfterHistoryIntervention':True,'historyShortfallSufficientCauseOfNativePitchFailure':False,'fullNativeOrReferenceAcceptance':False}}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'SHA256':H(OUT),'cohorts':[{'name':r['cohort'],'sourceHz':r['sourceFrequencyHz'],'records':[{k:x[k] for k in ['id','measuredHz','errorHz','channelCriterionPassed']} for x in r['records']]} for r in reports],'geometry':geometry},indent=2))
if __name__=='__main__':main()
