#!/usr/bin/env python3
"""Whole original stem outputs: recombination, input identity and bounded guide checks."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import hashlib,json,subprocess,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/research/SOUNDTOUCH_GROUPED_STEMS_INDEPENDENT_RESULTS_20261017.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
def frequency(x,sr):
 a=x.astype(float);a-=a.mean();n=1<<(len(a)*16-1).bit_length();fft=np.abs(np.fft.rfft(a*np.hanning(len(a)),n));lo=math.ceil(20*n/sr);hi=math.floor(20000*n/sr);k=lo+int(np.argmax(fft[lo:hi+1]));v=np.log(np.maximum(fft[k-1:k+2],1e-300));return float((k+.5*(v[0]-v[2])/(v[0]-2*v[1]+v[2]))*sr/n)
def controlled(plan):
 code="""import crypto from 'node:crypto';const plan=JSON.parse(await new Promise(r=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>r(s))}));
 const {SoundTouchTransport}=await import(process.argv[1]);const {SharedOverlapGuide}=await import(process.argv[2]);const hash=x=>crypto.createHash('sha256').update(new Uint8Array(x.buffer)).digest('hex');let fixtures=[],saved;
 for(const sr of[44100,48000]){const n=sr*plan.fixture.seconds,stems=[];for(let s=0;s<4;s++){const pair=[];for(let c=0;c<2;c++){const a=new Float32Array(n),hz=[plan.fixture.stemLeftHz,plan.fixture.stemRightHz][c][s];for(let i=0;i<n;i++)a[i]=plan.fixture.amplitudeEach*Math.sin(2*Math.PI*hz*i/sr+plan.fixture.phasePerStem[s]);pair.push(a)}stems.push(pair)}const original=[0,1].map(c=>{const a=new Float32Array(n);for(let i=0;i<n;i++){let sum=0;for(let s=0;s<4;s++)sum+=stems[s][c][i];a[i]=sum}return a});const sources=[original,...stems];fixtures.push({sr,frames:n,hashes:sources.map(p=>p.map(hash))});if(sr===44100)saved=sources}
 const t=new SoundTouchTransport({sampleRate:44100,buffers:saved});t.schedule({type:'start',frame:256,position:0,rate:1.08,keylock:true,semitones:2});for(let f=0;f<1024;f+=128)t.render(f,128);const e=t.voices[0],guide=e.guide,stretches=e.pipes.map(p=>p.pipe.stretch),overridden=stretches.map(s=>s.seekBestOverlapPosition!==Object.getPrototypeOf(s).seekBestOverlapPosition);t.dispose();const restored=stretches.map(s=>s.seekBestOverlapPosition===Object.getPrototypeOf(s).seekBestOverlapPosition);const cleanup={overridden,restored,guide:guide.snapshot(),transport:t.snapshot()};
 const make=()=>({overlapLength:16,seekLength:32,seekWindowLength:64,nominalSkip:48,seekBestOverlapPosition(){return 2}});
 const g=new SharedOverlapGuide(2,{maxPendingDecisions:1}),leader=make(),follower=make(),off0=g.attach(leader),off1=g.attach(follower);leader.seekBestOverlapPosition(null);let queueError;try{leader.seekBestOverlapPosition(null)}catch(e){queueError=e.name}follower.seekLength++;let geometryError;try{follower.seekBestOverlapPosition(null)}catch(e){geometryError=e.name}follower.seekLength--;follower.seekBestOverlapPosition(null);off0();off1();console.log(JSON.stringify({fixtures,cleanup,negativeGuards:{queueError,geometryError,guide:g.snapshot()}}));"""
 r=json.loads(subprocess.check_output(['node','--input-type=module','-e',code,(ROOT/'experiments/keylock-soundtouch/grouped-pull-transport.mjs').as_uri(),(ROOT/'experiments/keylock-soundtouch/shared-overlap-guide.mjs').as_uri()],input=json.dumps(plan),text=True,cwd=ROOT))
 assert all(r['cleanup']['overridden']) and all(r['cleanup']['restored']) and all(x['disposed'] for x in r['cleanup']['guide']['readers']) and r['cleanup']['guide']['retainedDecisions']==0
 assert r['cleanup']['transport']['disposed'] and r['cleanup']['transport']['sourceBytes']==0 and r['cleanup']['transport']['epochs']==[]
 assert r['negativeGuards']['queueError']==r['negativeGuards']['geometryError']=='SharedOverlapError' and r['negativeGuards']['guide']['retainedDecisions']==0
 return r

def main():
 assert not OUT.exists()
 redPlan=J(ROOT/'docs/prototype/soundtouch-nonidentical-stems-plan.json');greenPlan=J(ROOT/'docs/prototype/soundtouch-grouped-stems-plan.json');assert {k:v for k,v in redPlan.items() if k!='declaredAt'}=={k:v for k,v in greenPlan.items() if k!='declaredAt'}
 control=controlled(greenPlan);inputs={f['sr']:f['hashes'] for f in control['fixtures']};reports=[];allRaw={}
 for name,expectedCount in [('nonidentical',0),('grouped',6)]:
  path=ROOT/f'docs/prototype/soundtouch-{name}-stems-results.json';r=J(path);assert r['plan']==(redPlan if name=='nonidentical' else greenPlan) and not r['fullParityVerified']
  src=ROOT/'experiments/keylock-soundtouch'/('pull-transport.mjs' if name=='nonidentical' else 'grouped-pull-transport.mjs');assert H(src)==r['sourceSHA256'];cases=[]
  for c,spec in zip(r['cases'],r['plan']['cases']):
   assert all(c[k]==v for k,v in spec.items()) and c['inputHashes']==inputs[c['sampleRate']] and not c['errors']
   sr=c['sampleRate'];raw=c['raw'];p=ROOT/raw['path'];assert H(p)==raw['sha256'] and p.stat().st_size==raw['bytes']==raw['frames']*10*4 and raw['channels']==10 and raw['frames']==math.ceil(sr*3/128)*128
   a=np.fromfile(p,dtype='<f4').reshape(-1,10);assert np.isfinite(a).all() and not np.any(a[:256]);allRaw[(name,c['id'],sr)]=a
   lo,hi=[round(t*sr) for t in r['plan']['windowSeconds']];channels=[]
   for ch,old in enumerate(c['channels']):
    ref=a[lo:hi,ch].astype(float);summed=sum(a[lo:hi,s*2+ch].astype(float) for s in range(1,5));delta=summed-ref;rr=float(np.sqrt(np.mean(ref*ref)));dr=float(np.sqrt(np.mean(delta*delta)));ratio=dr/rr;peak=float(np.max(np.abs(delta)));passed=rr>0 and ratio<=r['plan']['relativeRMSResidualMax']
    assert old['firstFrame']==lo and old['lastExclusive']==hi and abs(ratio-old['relativeRMS'])<1e-12 and abs(dr-old['residualRMS'])<1e-12 and peak==old['peakResidual'] and passed==old['passed']
    channels.append({'channel':ch,'referenceRMS':rr,'residualRMS':dr,'relativeRMS':ratio,'peakResidual':peak,'passed':passed})
   assert all(x['passed'] for x in channels)==c['passed'] and c['disposed']['disposed'] and c['disposed']['sourceBytes']==0 and c['disposed']['epochs']==[]
   guide=c['snapshot']['epochs'][0].get('overlapGuide')
   if name=='grouped':
    assert guide['participants']==guide['registered']==5 and guide['produced']==guide['nextDecision'] and guide['consumed']==guide['produced']*4 and guide['retainedDecisions']==0 and guide['peakPendingDecisions']<=guide['maxPendingDecisions'] and all(x['next']==guide['produced'] for x in guide['readers'])
   cases.append({'id':c['id'],'sampleRate':sr,'rawSHA256':H(p),'frames':len(a),'bytes':p.stat().st_size,'wholeFinite':True,'scheduleSilenceFirst256FramesVerified':True,'channels':channels,'guideSnapshot':guide,'sourceBytesZeroAndEpochsEmptyOnDispose':True,'acceptedRecombination':c['passed']})
  assert len(cases)==6 and sum(c['acceptedRecombination'] for c in cases)==r['passed']==expectedCount and r['failed']==6-expectedCount
  reports.append({'cohort':name,'planSHA256':H(ROOT/f'docs/prototype/soundtouch-{name}-stems-plan.json'),'resultSHA256':H(path),'recordedTopLevelTransportSHA256':r['sourceSHA256'],'sourceDependencyGraphRecorded':False,'cases':cases,'passed':expectedCount})
 spectralPlan=J(ROOT/'docs/prototype/soundtouch-grouped-stems-spectral-plan.json');spectral=J(ROOT/'docs/prototype/soundtouch-grouped-stems-spectral-results.json');assert spectral['plan']==spectralPlan and spectralPlan['frequencyErrorHzMax']==1 and spectralPlan['RMSMin']==.001 and spectralPlan['windowSeconds']==[.5,2.5]
 sc=[]
 for c,old in zip(J(ROOT/'docs/prototype/soundtouch-grouped-stems-results.json')['cases'],spectral['cases']):
  sr=c['sampleRate'];a=allRaw[('grouped',c['id'],sr)];lo,hi=round(.5*sr),round(2.5*sr);measures=[]
  for s in range(4):
   for ch in range(2):
    x=a[lo:hi,(s+1)*2+ch];wanted=[greenPlan['fixture']['stemLeftHz'],greenPlan['fixture']['stemRightHz']][ch][s]*2**(c['semitones']/12);hz=frequency(x,sr);rms=float(np.sqrt(np.mean(x.astype(float)**2)));passed=abs(hz-wanted)<=1 and rms>.001;prior=old['channels'][s*2+ch];assert abs(hz-prior['Hz'])<1e-7 and passed==prior['passed']
    measures.append({'stem':s,'channel':ch,'expectedHz':wanted,'Hz':hz,'RMS':rms,'errorHz':hz-wanted,'passed':passed})
  assert all(x['passed'] for x in measures)==old['passed'];sc.append({'id':c['id'],'sampleRate':sr,'channels':measures,'passed':old['passed']})
 failures=[{'id':c['id'],'sampleRate':c['sampleRate'],**x} for c in sc for x in c['channels'] if not x['passed']];assert len(failures)==3 and sum(c['passed'] for c in sc)==4
 result={'scope':'Independent complete original10channel serial PCM recombination and fixture/hash audit; separate48spectral measurements, not browser/native/music/cursor acceptance.','cohorts':reports,'fixtureGenerationAndControlledGuideChecks':control,'currentGroupedSourceSHA256':H(ROOT/'experiments/keylock-soundtouch/grouped-pull-transport.mjs'),'currentGuideSHA256':H(ROOT/'experiments/keylock-soundtouch/shared-overlap-guide.mjs'),'dependencySHAAtOriginalRunIndependentlyEstablished':False,'spectralInspection':{'planSHA256':H(ROOT/'docs/prototype/soundtouch-grouped-stems-spectral-plan.json'),'planWasBeforeAnalysisOfExistingCapturesNotBeforeCapture':True,'cases':sc,'passedCases':4,'failedMeasurements':failures},'allRecombinationCasesPromotedToPitchQualityAcceptance':False,'native017ChangedOrAcceptedWithGroupedVariant':False}
 OUT.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n');print(json.dumps({'resultSHA256':H(OUT),'cohorts':[{'name':r['cohort'],'passed':r['passed'],'frames':sum(c['frames'] for c in r['cases']),'maxRatio':max(x['relativeRMS'] for c in r['cases'] for x in c['channels']),'minRatio':min(x['relativeRMS'] for c in r['cases'] for x in c['channels'])} for r in reports],'spectralFailed':failures,'guideCleanupVerified':True},indent=2))
if __name__=='__main__':main()
