#!/usr/bin/env python3
"""Offline complete-original inspection; never trims or overwrites source evidence."""
import hashlib,json,math,subprocess,sys
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/prototype/desktop-0.1.6-midi-audio-independent-results.json'
TEMP=ROOT/'local-evidence/desktop-0.1.6-midi-audio-independent'
PLAN=ROOT/'docs/prototype/desktop-0.1.6-audio-inspection-plan.json'
IDENTITIES={
 'open-play-native-016-midi-plus2.webm':('6fd70a39e30c9eb76abaecf884552214a84a1936c2ade2bb80eae86e3c538daf',306656),
 'open-play-native-016-midi-minus2-return.webm':('2462ad14b4ec933b0fe809ebacff3ccc39973c285645a836a1a916cc361a86ff',460534),
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dominant(samples,sr):
 x=np.asarray(samples,dtype=np.float64)
 if len(x)<8 or not np.isfinite(x).all():return None
 x=x-x.mean();n=1<<math.ceil(math.log2(len(x)*4));mag=np.abs(np.fft.rfft(x*np.hanning(len(x)),n));lo=max(1,math.ceil(20*n/sr));hi=min(len(mag)-2,math.floor(min(20000,sr/2-1)*n/sr));k=lo+int(np.argmax(mag[lo:hi+1]))
 if mag[k]<=0:return None
 a,b,c=np.log(np.maximum(mag[k-1:k+2],1e-300));den=a-2*b+c;delta=float(.5*(a-c)/den) if den else 0.
 return float((k+delta)*sr/n)
def rms(x):return float(np.sqrt(np.mean(np.asarray(x,dtype=np.float64)**2))) if len(x) else 0.
def quiet_runs(x,sr,threshold):
 # Actual full millisecond bins; this is not instantaneous continuity evidence.
 edges=np.unique(np.rint(np.arange(math.ceil(len(x)/sr*1000)+1)*sr/1000).astype(np.int64));edges=edges[edges<=len(x)]
 if edges[-1]!=len(x):edges=np.append(edges,len(x))
 starts=edges[:-1];ends=edges[1:];power=np.asarray(x,dtype=np.float64)**2;prefix=np.concatenate(([0.],np.cumsum(power)));levels=np.sqrt(np.maximum(0,(prefix[ends]-prefix[starts])/(ends-starts)));quiet=levels<threshold;runs=[];begin=None
 for i,v in enumerate(quiet):
  if v and begin is None:begin=i
  if begin is not None and (not v or i==len(quiet)-1):
   last=i if v else i-1;runs.append({'startSample':int(starts[begin]),'endSampleExclusive':int(ends[last]),'startSeconds':float(starts[begin]/sr),'endSeconds':float(ends[last]/sr),'bins':last-begin+1});begin=None
 return runs

def main():
 assert not OUT.exists(),'Refusing to overwrite prior inspection'
 TEMP.mkdir(parents=True,exist_ok=True);plan=json.loads(PLAN.read_text());assert plan['window_seconds']==[5,7]
 self_checks=[]
 for sr in [44100,48000]:
  for hz in [330,370.4124759420931,550,617.3541265701551]:
   got=dominant(.1*np.sin(2*np.pi*hz*np.arange(sr*2)/sr+.37),sr);error=abs(got-hz);assert error<.01;self_checks.append({'sampleRate':sr,'expectedHz':hz,'measuredHz':got,'errorHz':error})
 records=[]
 for case in plan['cases']:
  name=case['file'];original=Path('/Users/jasonpoindexter/Downloads')/name;copy=ROOT/'local-evidence/desktop-0.1.6-midi-audio'/name;expected_hash,expected_bytes=IDENTITIES[name]
  assert original.stat().st_size==expected_bytes;assert sha(original)==expected_hash;assert original.read_bytes()==copy.read_bytes()
  probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(original)],text=True));streams=[s for s in probe['streams'] if s['codec_type']=='audio'];assert len(streams)==1;stream=streams[0];sr=int(stream['sample_rate']);channels=int(stream['channels']);assert channels==2
  decoded=TEMP/(name+'.whole-f32le');assert not decoded.exists(),'Refusing to overwrite complete decoded artifact'
  subprocess.run(['ffmpeg','-v','error','-nostdin','-n','-i',str(original),'-map','0:a:0','-c:a','pcm_f32le','-f','f32le',str(decoded)],check=True)
  raw=np.fromfile(decoded,dtype='<f4');assert raw.size%channels==0;audio=raw.reshape(-1,channels);finite=np.isfinite(audio);frames=len(audio);duration=frames/sr;expected=case['expected_hz'];nonfinite=int(audio.size-np.count_nonzero(finite));assert nonfinite==0;assert duration>=7
  interval=[]
  for ch in range(channels):
   x=audio[5*sr:7*sr,ch];hz=dominant(x,sr);level=rms(x);error=abs(hz-expected[ch]);interval.append({'channel':ch,'startSample':5*sr,'endSampleExclusive':7*sr,'samples':len(x),'RMS':level,'dominantHz':hz,'expectedHz':expected[ch],'errorHz':error,'passed':error<=plan['frequency_error_hz_max'] and level>plan['minimum_window_RMS']})
  windows=[]
  for start in range(0,frames,sr):
   end=min(start+sr,frames);row={'startSample':start,'endSampleExclusive':end,'startSeconds':start/sr,'endSeconds':end/sr,'partial':end-start<sr,'channels':[]}
   for ch in range(channels):
    x=audio[start:end,ch];level=rms(x);quiet=level<plan['minimum_window_RMS'];hz=None if quiet else dominant(x,sr);row['channels'].append({'channel':ch,'RMS':level,'quietByWindowRMS':quiet,'dominantHz':hz,'errorFromDeclaredExpectedHz':None if hz is None else abs(hz-expected[ch]),'withinDeclaredFrequencyBudget':None if hz is None else abs(hz-expected[ch])<=plan['frequency_error_hz_max']})
   windows.append(row)
  records.append({'file':name,'original':str(original),'retainedCopy':str(copy.relative_to(ROOT)),'SHA256':expected_hash,'encodedBytes':expected_bytes,'originalEqualsRetainedCopy':True,'ffprobe':probe,'completeDecode':{'path':str(decoded.relative_to(ROOT)),'SHA256':sha(decoded),'bytes':decoded.stat().st_size,'sampleRate':sr,'channels':channels,'frames':frames,'durationSeconds':duration,'sampleValues':int(audio.size),'nonfiniteSampleValues':nonfinite,'channelRMS':[rms(audio[:,c]) for c in range(channels)],'channelPeakAbs':[float(np.max(np.abs(audio[:,c]))) for c in range(channels)],'firstStereoSample':audio[0].tolist(),'lastStereoSample':audio[-1].tolist()},'declaredWindow':interval,'everyOneSecondWindowIncludingFinalPartial':windows,'wholeOneMillisecondQuietBins':{'thresholdRMS':plan['minimum_window_RMS'],'notInstantaneousContinuityProof':True,'channels':[{'channel':c,'runs':quiet_runs(audio[:,c],sr,plan['minimum_window_RMS'])} for c in range(channels)]},'declaredCriterionPassed':all(e['passed'] for e in interval)})
 fixture=ROOT/'local-evidence/keylock-native-fixtures/native-keylock-stereo-120s.wav';fixture_hash=sha(fixture);assert fixture_hash=='99833309d13090de63a9fcdb7ca8f6bcf601975bfb8cb2e3ef691bb369a0a119'
 report={'scope':'Independent whole Downloads original decode, all sample values finite, every1s/finalpartial spectral window retained, whole1ms quiet-bin inventory, declared5–7s stereo frequency/RMS criteria. No trimming, source injection, GUI, MIDI event delivery, native cursor/firstsample/instantaneous continuity/music/hardware/reference/fullparity proof. Parent native UI observations are not independent UI execution by this inspector.','plan':{'path':str(PLAN.relative_to(ROOT)),'SHA256':sha(PLAN),'value':plan},'sourceFixture':{'path':str(fixture.relative_to(ROOT)),'SHA256':fixture_hash},'method':{'frequency':'Whole declared interval mean removal, Hann, global20–20000Hz maximum,4x-or-more power-of-two zero padding, log-parabolic spectral interpolation. Search is not restricted near expected tone.','frequencyEstimatorSelfChecks':self_checks,'python':sys.version,'numpy':np.__version__,'ffmpeg':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0]},'records':records,'declaredCriteriaPassed':all(r['declaredCriterionPassed'] for r in records),'fullParityVerified':False,'physicalInputVerified':False,'nativeMIDIDeliveryIndependentlyObserved':False}
 with OUT.open('x') as f:json.dump(report,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'SHA256':sha(OUT),'declaredCriteriaPassed':report['declaredCriteriaPassed'],'records':[{'file':r['file'],'decode':r['completeDecode'],'declaredWindow':r['declaredWindow'],'windows':len(r['everyOneSecondWindowIncludingFinalPartial'])} for r in records]},indent=2))
 if not report['declaredCriteriaPassed']:sys.exit(1)

if __name__=='__main__':main()
