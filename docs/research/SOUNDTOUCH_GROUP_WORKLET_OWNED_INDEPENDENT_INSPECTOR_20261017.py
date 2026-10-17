#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import hashlib,json,subprocess,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(Path(__file__).parent))
from SOUNDTOUCH_GROUPED_STEMS_INDEPENDENT_INSPECTOR_20261017 import H,J,frequency
OUT=ROOT/'docs/research/SOUNDTOUCH_GROUP_WORKLET_OWNED_INDEPENDENT_RESULTS_20261017.json'
def crossing(x,sr):
 a=x.astype(float);rms=float(np.sqrt(np.mean(a*a)));a-=a.mean();i=np.flatnonzero((a[:-1]<0)&(a[1:]>=0));v=i-a[i]/(a[i+1]-a[i]);return {'RMS':rms,'crossingHz':float((len(v)-1)*sr/(v[-1]-v[0])) if len(v)>1 else None}
def main():
 assert not OUT.exists();rp=ROOT/'docs/prototype/soundtouch-engine-browser-group-worklet-owned-results.json';r=J(rp);plan=J(ROOT/'docs/prototype/soundtouch-group-worklet-owned-plan.json');assert r['plan']==plan and r['completed'] and r['acceptedCases']==2 and not r['fatalErrors'] and not r['fullParityVerified'];assert plan['criteria']['frequencyErrorHzMax']==1 and plan['criteria']['relativeRMSResidualMax']==.03 and plan['criteria']['framePhaseErrorSamples']==.25
 base=ROOT/'local-evidence/soundtouch-engine-browser-group-worklet-owned/source-snapshots';routes=[];later=[]
 for url,m in r['servedSources']['routes'].items():
  p=base/(url.lstrip('/') or 'index.html');data=p.read_bytes();assert H(p)==m['servedSHA256']
  if m['importSpecifierOnlyRewrite']:
   assert data.count(b"from '/official/lanczos/index.js'")==1;data=data.replace(b"from '/official/lanczos/index.js'",b"from '@soundtouchjs/interpolation-strategy-lanczos'")
  assert hashlib.sha256(data).hexdigest()==m['sourceSHA256'];routes.append({'url':url,**m,'snapshot':str(p.relative_to(ROOT))})
  if H(ROOT/m['path'])!=m['sourceSHA256']:later.append({'url':url,'frozenSHA256':m['sourceSHA256'],'currentSHA256':H(ROOT/m['path']),'creditedToCapture':False})
 assert len(routes)==256
 oldReport=J(ROOT/'docs/prototype/soundtouch-engine-browser-group-worklet-results.json');assert H(ROOT/'docs/prototype/soundtouch-engine-browser-group-worklet-results.json')=='b5a34bf3d61c74d1082a1a467d89fad87e875e826831ef2cfe6430a885218821'
 changed=[u for u,m in r['servedSources']['routes'].items() if oldReport['servedSources']['routes'].get(u,{}).get('sourceSHA256')!=m['sourceSHA256']];assert set(changed)=={'/group-stems-harness.mjs','/plan.json','/experiments/keylock-soundtouch/group-node-factory.mjs'}
 oldFactory=(ROOT/'local-evidence/soundtouch-engine-browser-group-worklet/source-snapshots/experiments/keylock-soundtouch/group-node-factory.mjs').read_text();newFactory=(base/'experiments/keylock-soundtouch/group-node-factory.mjs').read_text();assert oldFactory.replace('const channelCounts = options.outputChannelCount;','const channelCounts = Array.isArray(options.outputChannelCount) ? Object.freeze([...options.outputChannelCount]) : null;')==newFactory
 assert H(base/'experiments/keylock-soundtouch/group-node-factory.mjs')=='894ccc46228bfdd64834aead355b30ce64074ea357e6608b319b553aa843f0cc'
 assert H(base/'experiments/keylock-soundtouch/grouped-fullseek-pull-transport.mjs')=='3e7d9768c5213047432375f8638c4f234f47df164c02175be1114bb380276847'
 clock=(base/'experiments/keylock-soundtouch/phase-render-clock.mjs').read_text();assert 'for (let i = 0; i < frames; i++)' in clock and 'coarseGlobalFenceFrames:256' in clock
 fixtureProof=J(ROOT/'docs/research/SOUNDTOUCH_GROUPED_FULLSEEK_INDEPENDENT_RESULTS_20261017.json');assert H(ROOT/'docs/research/SOUNDTOUCH_GROUPED_FULLSEEK_INDEPENDENT_RESULTS_20261017.json')=='1a9a29d9411503a3651195e6ecb792df7b7e216f159858d995a97198559d515b';fixtures={x['sampleRate']:x['hashes'] for x in fixtureProof['fixtureGeneration']}
 cases=[]
 for c,spec in zip(r['cases'],plan['cases']):
  assert all(c[k]==v for k,v in spec.items()) and c['inputHashes']==fixtures[c['sampleRate']] and not c['errors'] and c['passed'];sr=c['sampleRate'];cap=c['capture'];raw=cap['retained'];p=ROOT/raw['path'];assert H(p)==raw['sha256'] and p.stat().st_size==raw['bytes']==cap['frames']*12*4
  ownership=c['geometryOwnership'];assert ownership=={'requested':[2,2,2,2,2],'mutatedCallerArray':[0,8,2,2,2],'replacedCallerOption':[8],'actualOutputs':5} and c['afterAppend']['store']['channelCounts']==[2,2,2,2,2]
  a=np.fromfile(p,dtype='<f4').reshape(-1,12);assert np.isfinite(a).all() and len(a)==cap['frames']==len(c['blocks'])*128;first=cap['firstFrame'];anchor=c['phaseSchedule']['anchorFrame'];period=c['phaseSchedule']['periodFrames'];assert first==c['arm']['frame'] and first>=anchor+256 and anchor%128==period%128==0
  globals_=[]
  for i,b in enumerate(c['blocks']):
   assert b['sequence']==i and b['frames']==128 and b['frame']==first+i*128 and isinstance(b['globalFrame'],int) and abs(b['globalFrame']-b['frame'])<=256
   if b['globalFrame']!=b['frame'] or abs(b['globalTime']*sr-b['frame'])>.25:globals_.append(b)
  phase=a[:,-1].astype(float)*period;expected=(np.arange(len(a),dtype=np.int64)+first-anchor)%period;phaseErr=float(np.max(np.abs(phase-expected)));diff=np.diff(phase);stepErr=float(np.max(np.abs(np.where(diff<0,diff+period,diff)-1)));assert phaseErr==cap['maxPhaseErrorSamples']<=.25 and cap['strict'] and cap['finite']
  assert c['observerStop']['frame']==first+len(a) and c['observerStop']['frames']==len(a) and c['observerStop']['sequence']==len(c['blocks'])
  arm=c['arm']['clock'];stop=c['observerStop']['clock'];assert arm['nextFrame']==arm['anchorFrame']+128*arm['blocks']==first and stop['nextFrame']==stop['anchorFrame']+128*stop['blocks']==first+len(a)
  measures=[]
  for e,m,phaseSpec in zip(c['events'],c['measurements'],plan['phases']):
   assert all(e[k]==v for k,v in phaseSpec.items()) and m['label']==e['label'] and m['window']==e['window']==[e['ack']['frame']/sr+.5,e['ack']['frame']/sr+2.5] and e['ack']['position']==0
   assert e['ack']['frame']==round((e['issued']+.5)*sr) and e['ack']['ready'];lo,hi=[round(t*sr)-first for t in e['window']];assert 0<=lo<hi<=len(a)
   tones=[];reconstruction=[]
   for stem in range(4):
    for ch in range(2):
     x=a[lo:hi,(stem+1)*2+ch];z=crossing(x,sr);hz=frequency(x,sr);wanted=[plan['fixture']['leftHz'],plan['fixture']['rightHz']][ch][stem]*2**(e['semitones']/12);old=m['channels'][stem*2+ch];assert abs(z['crossingHz']-old['Hz'])<1e-7 and abs(z['RMS']-old['RMS'])<1e-12 and z['RMS']>.001 and abs(z['crossingHz']-wanted)<=1 and old['passed'];tones.append({'source':stem+1,'channel':ch,'expectedHz':wanted,**z,'crossingErrorHz':z['crossingHz']-wanted,'HannHz':hz,'HannErrorHz':hz-wanted,'HannWithin1Hz':abs(hz-wanted)<=1})
   for ch in range(2):
    ref=a[lo:hi,ch].astype(float);delta=sum(a[lo:hi,s*2+ch].astype(float) for s in range(1,5))-ref;rr=float(np.sqrt(np.mean(ref*ref)));dr=float(np.sqrt(np.mean(delta*delta)));ratio=dr/rr;assert rr>0 and ratio<=.03 and abs(ratio-m['reconstruction'][ch]['relativeRMS'])<1e-12;reconstruction.append({'channel':ch,'referenceRMS':rr,'residualRMS':dr,'relativeRMS':ratio})
   epochs=e['after']['transport']['epochs'];assert len(epochs)==1;guide=epochs[0]['overlapGuide'];assert guide['participants']==guide['registered']==5 and guide['consumed']==guide['produced']*4 and guide['retainedDecisions']==0 and all(x['next']==guide['produced'] for x in guide['readers'])
   measures.append({'label':e['label'],'window':e['window'],'tones':tones,'reconstruction':reconstruction,'guide':guide,'epochGeneration':epochs[0]['generation']})
  assert len(measures)==3 and [m['epochGeneration'] for m in measures]==[1,2,3]
  lo,hi=[round(t*sr)-first for t in c['pauseWindow']];assert 0<=lo<hi<=len(a);peak=float(np.max(np.abs(a[lo:hi,:10])));assert peak==c['pause']['peak']==0 and c['pause']['passed'];pausecontrol=crossing(a[lo:hi,10],sr);assert pausecontrol['RMS']>.01
  control=crossing(a[:,10],sr);control['HannFirst2SecondsHz']=frequency(a[:2*sr,10],sr);assert abs(control['crossingHz']-c['control']['Hz'])<1e-7 and abs(control['crossingHz']-307)<=.01 and abs(control['HannFirst2SecondsHz']-307)<=.01
  d=c['release'];assert d['disposed'] and d['store']['disposed'] and d['store']['retainedPCMBytes']==d['store']['retainedChunks']==0 and d['transport']['disposed'] and d['transport']['sourceBytes']==0 and not d['transport']['epochs'] and d['phaseControl']['disposed'];dc=d['renderClock'];assert dc['nextFrame']==dc['anchorFrame']+dc['blocks']*128==d['transport']['nextFrame']
  cases.append({'id':c['id'],'sampleRate':sr,'rawSHA256':H(p),'frames':len(a),'rows':len(c['blocks']),'rawBytes':p.stat().st_size,'wholeFinite':True,'actualPendingRegistrationGeometryOwnership':ownership,'actualProcessorChannelCounts':c['afterAppend']['store']['channelCounts'],'maxPhaseErrorSamples':phaseErr,'maxCyclicPhaseIncrementErrorSamples':stepErr,'originalGlobalDisagreements':globals_,'observerStopClock':stop,'measurements':measures,'pausePeak':peak,'controlDuringPause':pausecontrol,'controlWhole':control,'actualGroupProcessorRelease':{'storeBytes':0,'epochs':[],'nodeOwnedPhaseSourceDisposed':True,'sharedImmutablePhaseBufferBytesExcluded':d['phaseControl']['sharedBufferPCMBytes'],'clock':dc},'acceptedDeclaredBrowserCase':True})
 # Separate desired-state controlled check of fixed geometry ownership, using exact frozen new factory.
 code="""const {default:factory}=await import(process.argv[1]);let finish,observed;const registration=new Promise(r=>finish=r);globalThis.AudioWorkletNode=class{constructor(context,name,options){observed=JSON.parse(JSON.stringify(options));throw Error('Controlled construction stop')}};const ctx={sampleRate:48000,currentTime:0,audioWorklet:{addModule:()=>registration}},counts=[2,2,2,2,2];const options={outputChannelCount:counts};const promise=factory(ctx,options,{durationFrames:48000}).catch(e=>e.message);counts[0]=0;counts[1]=8;options.outputChannelCount=[8];finish();await promise;console.log(JSON.stringify({validatedAtInvocation:[2,2,2,2,2],constructedAfterAwait:observed.outputChannelCount,processorCounts:observed.processorOptions.channelCounts}));"""
 mutation=json.loads(subprocess.check_output(['node','--input-type=module','-e',code,(base/'experiments/keylock-soundtouch/group-node-factory.mjs').as_uri()],text=True));assert mutation['constructedAfterAwait']==mutation['processorCounts']==[2,2,2,2,2]
 out={'scope':'Independent complete original grouped AudioWorklet5output captures only; parent operated browser. Fixed frozen-factory desired geometry regression retained. No engine/liveadapter/native/music acceptance.','reportSHA256':H(rp),'sourceRoutes':routes,'sourceRouteCount':len(routes),'laterSourceDifferencesNotCredited':later,'fixtureHashesMatchIndependentlyRegeneratedSerialInputs':True,'fixtureProofSHA256':H(ROOT/'docs/research/SOUNDTOUCH_GROUPED_FULLSEEK_INDEPENDENT_RESULTS_20261017.json'),'cases':cases,'acceptedDeclaredBrowserCases':2,'frames':sum(c['frames'] for c in cases),'rows':sum(c['rows'] for c in cases),'rawBytes':sum(c['rawBytes'] for c in cases),'toneMeasurements':sum(len(m['tones']) for c in cases for m in c['measurements']),'frozenFactoryCallerArrayOwnershipDesiredStateRegression':mutation,'criticalChangesAgainstPreservedPriorCohort':changed,'priorDefectReportRegraded':False,'internalProcessorPhaseArraysExportedForIndependentReplay':False,'observerWholeOriginalPhaseArraysIndependentlyChecked':True,'native017IntegrationAccepted':False}
 OUT.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n');print(json.dumps({'resultSHA256':H(OUT),'frames':out['frames'],'rows':out['rows'],'rawBytes':out['rawBytes'],'tones':out['toneMeasurements'],'maxCrossingError':max(abs(t['crossingErrorHz']) for c in cases for m in c['measurements'] for t in m['tones']),'maxHannError':max(abs(t['HannErrorHz']) for c in cases for m in c['measurements'] for t in m['tones']),'HannFailures':[t for c in cases for m in c['measurements'] for t in m['tones'] if not t['HannWithin1Hz']],'maxRecombination':max(t['relativeRMS'] for c in cases for m in c['measurements'] for t in m['reconstruction']),'globals':[len(c['originalGlobalDisagreements']) for c in cases],'mutation':mutation},indent=2))
if __name__=='__main__':main()
