#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import hashlib,json,subprocess,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(Path(__file__).parent))
from SOUNDTOUCH_ENGINE_BROWSER_INSPECTOR_20261017 import H,J,stats,src_section,selected
from SOUNDTOUCH_COUNTER_ENGINE_INSPECTOR_20261017 import sources
OUT=ROOT/'docs/research/SOUNDTOUCH_GROUP_ENGINE_INDEPENDENT_RESULTS_20261017.json'
def released(p,sourceCount):
 assert p['disposed'] and p['store']['disposed'] and p['store']['retainedPCMBytes']==p['store']['retainedChunks']==0 and p['store']['channelCounts']==[2]*sourceCount
 assert p['transport']['disposed'] and p['transport']['sourceBytes']==0 and p['transport']['epochs']==[] and p['phaseControl']['disposed']
 k=p['renderClock'];assert k['nextFrame']==k['anchorFrame']+128*k['blocks']==p['transport']['nextFrame'];return {'sourceCount':sourceCount,'storeBytes':0,'epochs':[],'clock':k,'nodeOwnedPhaseSourceDisposed':True,'sharedPhaseBufferBytesExcluded':p['phaseControl']['sharedBufferPCMBytes']}
def main():
 assert not OUT.exists();rp=ROOT/'docs/prototype/soundtouch-engine-browser-group-engine-results.json';r=J(rp);plan=J(ROOT/'docs/prototype/soundtouch-group-engine-plan.json');assert r['plan']==plan and r['completed'] and r['acceptedCases']==1 and not r['fatalErrors'] and not r['full_parity_verified']
 base,graph=sources(r,'group-engine',True);assert graph['count']==256 and H(base/'prototype/engine.js')=='b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf'==H(ROOT/'prototype/engine.js');assert src_section((base/'prototype/keylock-shadow-live.js').read_text())==src_section((ROOT/'prototype/keylock-shadow-live.js').read_text());assert r['servedSources']['moduleDelaySeconds']==.5
 fixtureCode="""import crypto from 'node:crypto';let s='';for await(const c of process.stdin)s+=c;const p=JSON.parse(s),out=[];const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer)).digest('hex');for(const sr of[44100,48000]){const stems=Array.from({length:4},(_,stem)=>[0,1].map(c=>Float32Array.from({length:sr*32},(_,i)=>.025*Math.sin(2*Math.PI*[p.fixture.leftHz,p.fixture.rightHz][c][stem]*(i<sr*16?1:2)*i/sr+p.fixture.phases[stem]))));const original=[0,1].map(c=>Float32Array.from({length:sr*32},(_,i)=>stems.reduce((sum,stem)=>sum+stem[c][i],0)));out.push({sourceSampleRate:sr,hashes:[original,...stems].map(s=>s.map(hash))})}console.log(JSON.stringify(out));"""
 fixtures=json.loads(subprocess.check_output(['node','--input-type=module','-e',fixtureCode],input=json.dumps(plan),text=True));fixtureHashes={f['sourceSampleRate']:f['hashes'] for f in fixtures};cases=[]
 for c,spec in zip(r['cases'],plan['cases']):
  assert all(c[k]==v for k,v in spec.items()) and c['inputHashes']==fixtureHashes[c['sourceSampleRate']] and not c['errors'];sr=c['sampleRate'];cap=c['capture'];p=ROOT/cap['retained']['path'];assert H(p)==cap['sha256']==cap['retained']['sha256'] and p.stat().st_size==cap['retained']['bytes']==cap['frames']*14*4
  a=np.fromfile(p,dtype='<f4').reshape(-1,14);assert np.isfinite(a).all() and len(a)==128*len(c['blocks']);first=cap['firstFrame'];anchor=c['framePhaseSchedule']['anchorFrame'];period=c['framePhaseSchedule']['periodFrames'];assert first==c['arm']['frame']>=anchor+256
  globals_=[]
  for i,b in enumerate(c['blocks']):
   assert b['sequence']==i and b['frames']==128 and b['frame']==first+i*128 and abs(b['globalFrame']-b['frame'])<=256
   if b['globalFrame']!=b['frame'] or abs(b['globalTime']*sr-b['frame'])>.25:globals_.append(b)
  phase=a[:,-1].astype(float)*period;expected=(first+np.arange(len(a),dtype=np.int64)-anchor)%period;pe=float(np.max(np.abs(phase-expected)));diff=np.diff(phase);se=float(np.max(np.abs(np.where(diff<0,diff+period,diff)-1)));assert pe==cap['maxFrameTagError']<=.25 and cap['valid'] and cap['contiguous'] and c['captureStop']['frame']==first+len(a) and c['captureStop']['frames']==len(a)
  measures=[];accepted=True;failed=[]
  for event,m in zip(c['events'],c['measurements']):
   assert event['label']==m['label'] and m['window']==[event['state']['when']+.5,event['state']['when']+1.5];lo,hi=[round(t*sr)-first for t in m['window']];assert 0<=lo<hi<=len(a);region=2 if m['label'] in ['rebase','resume','solo'] else 1;pitch=2**(event['state']['effectiveSemitones']/12);tones=[];reconstruction=[];monitor=[]
   for source in range(1,5):
    for ch in range(2):
     x=a[lo:hi,source*2+ch];z=stats(x,sr);wanted=[plan['fixture']['leftHz'],plan['fixture']['rightHz']][ch][source-1]*region*pitch;old=m['channels'][(source-1)*2+ch];passed=z['RMS']>.001 and abs(z['crossingHz']-wanted)<=1;assert abs(z['crossingHz']-old['hz'])<1e-7 and abs(z['RMS']-old['rms'])<1e-12 and wanted==old['expectedHz'] and passed==old['passed']
     entry={'source':source,'channel':ch,'expectedHz':wanted,**z,'crossingErrorHz':z['crossingHz']-wanted,'HannErrorHz':z['HannHz']-wanted,'declaredCrossingPassed':passed,'supplementaryHannWithin1Hz':abs(z['HannHz']-wanted)<=1};tones.append(entry)
     if not passed:
      y=x.astype(float);y-=y.mean();i=np.flatnonzero((y[:-1]<0)&(y[1:]>=0));v=i-y[i]/(y[i+1]-y[i]);per=np.diff(v);entry['periodDiagnostic']={'crossingCount':len(v),'expectedPeriodFrames':sr/wanted,'periodQuantilesFrames':np.quantile(per,[0,.1,.5,.9,1]).tolist(),'cumulativeExpectedCycleResidual':float((v[-1]-v[0])*wanted/sr-(len(v)-1))};failed.append({'label':m['label'],'windowSeconds':m['window'],**entry})
   for ch in range(2):
    ref=a[lo:hi,ch].astype(float);d=sum(a[lo:hi,s*2+ch].astype(float) for s in range(1,5))-ref;rr=float(np.sqrt(np.mean(ref*ref)));dr=float(np.sqrt(np.mean(d*d)));ratio=dr/rr;assert rr>0 and ratio<=.03 and abs(ratio-m['reconstruction'][ch]['relativeRMS'])<1e-12;reconstruction.append({'channel':ch,'referenceRMS':rr,'residualRMS':dr,'relativeRMS':ratio})
    z=stats(a[lo:hi,10+ch],sr,m['label']=='solo');old=m['monitor'][ch];assert abs(z['crossingHz']-old['hz'])<1e-7 and abs(z['RMS']-old['rms'])<1e-12
    if m['label']=='solo':
     wanted=[plan['fixture']['leftHz'],plan['fixture']['rightHz']][ch][2]*region*pitch;assert old['expectedHz']==wanted and abs(z['crossingHz']-wanted)<=1 and old['passed'];assert np.array_equal(a[lo:hi,10+ch],a[lo:hi,6+ch]);z.update(expectedHz=wanted,HannErrorHz=z['HannHz']-wanted,exactSampleEqualityWithSelectedStemIndex2=True)
    monitor.append({'channel':ch,**z})
   mp=all(t['declaredCrossingPassed'] for t in tones);assert mp==m['passed'];accepted=accepted and mp;measures.append({'label':m['label'],'windowSeconds':m['window'],'actualState':event['state'],'legacyUnusedExpectedHzField':m.get('expectedHz'),'tones':tones,'reconstruction':reconstruction,'monitor':monitor,'declaredWindowPassed':mp})
  assert len(measures)==7 and accepted==c['criteriaPassed'];lo,hi=[round(t*sr)-first for t in c['pause']['window']];peak=float(np.max(np.abs(a[lo:hi,:12])));assert peak==0 and c['pause']['passed'];control=stats(a[:,-2],sr,False);control['HannFirst2SecondsHz']=stats(a[:2*sr,-2],sr)['HannHz'];assert abs(control['crossingHz']-307)<=.01
  lc=c['lifecycle'];assert lc['canceled']['name']=='AbortError' and lc['canceled']['elapsedMs']<400 and lc['otherWaiterSurvived'] and lc['idempotent'] and lc['terminal']['name']=='AbortError';helper=released(lc['disposal'],1);releases=[]
  for e in c['releaseEvidence']:
   assert e['adapter']['groups']==[] and e['adapter']['retainedPCMBytes']==e['adapter']['inFlightPCMBytes']==0;assert len(e['processors'])==1;releases.append({'label':e['label'],'at':e['at'],'processor':released(e['processors'][0],5)})
  events={e['label']:e for e in c['events']};owners=[selected(events[k]['after']) for k in ['neutral','shifted','keylock-off','warm-follow']];assert owners==[c['warmOwner']]*4 and selected(events['rebase']['after'])!=owners[0];assert c['beforeRebase']['groups'][0]['start']>0 and c['beforeRebase']['groups'][0]['end']>8
  assert c['cleaned'] and c['pausedVoiceAbsent'] and not any(d['type']=='fatal' for d in c['factoryDiagnostics'])
  cases.append({'id':c['id'],'rawSHA256':H(p),'rawBytes':p.stat().st_size,'frames':len(a),'rows':len(c['blocks']),'wholeFinite':True,'maxPhaseErrorSamples':pe,'maxCyclicPhaseIncrementErrorSamples':se,'originalGlobalsDisagreements':globals_,'measurements':measures,'failedDeclaredMeasurements':failed,'pausePeak':peak,'control':control,'actualModuleAbortElapsedMs':lc['canceled']['elapsedMs'],'sharedRegistrationSurvivorAndTerminalRetirement':helper,'actualEngineReleaseEvidence':releases,'warmOwners':owners,'rebaseOwner':selected(events['rebase']['after']),'retainedCaseAccepted':accepted})
 out={'scope':'Independent whole original unchanged AudioEngine with server-selected grouped adapter. Original1/2 retained; supplementary FFT/diagnostics do not regrade. No native/music/cursor/physical acceptance.','reportSHA256':H(rp),'planSHA256':H(ROOT/'docs/prototype/soundtouch-group-engine-plan.json'),'sourceGraph':graph,'unchangedEngineSHA256':H(base/'prototype/engine.js'),'unchangedProductionSRCRegionVerified':True,'fixtureHashesIndependentlyRegenerated':fixtures,'cases':cases,'acceptedCases':sum(c['retainedCaseAccepted'] for c in cases),'frames':sum(c['frames'] for c in cases),'rows':sum(c['rows'] for c in cases),'rawBytes':sum(c['rawBytes'] for c in cases),'internalGuideOffsetTranscriptOrPreDSPInputCaptured':False,'soloIsGainOnlyNotNewProcessorSchedule':True,'legacyUnusedTopLevelExpectedHzMustNotBeReadAsActualCriterion':True}
 OUT.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n');print(json.dumps({'resultSHA256':H(OUT),'accepted':out['acceptedCases'],'frames':out['frames'],'rows':out['rows'],'rawBytes':out['rawBytes'],'failed':[f for c in cases for f in c['failedDeclaredMeasurements']],'supplementaryHannFailures':[{'id':c['id'],'label':m['label'],**t} for c in cases for m in c['measurements'] for t in m['tones'] if not t['supplementaryHannWithin1Hz']]},indent=2))
if __name__=='__main__':main()
