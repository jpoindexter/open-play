#!/usr/bin/env python3
"""Read-only original phase-cohort audit; exclusively creates one new result."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,hashlib,math
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'docs/research'))
from SOUNDTOUCH_ENGINE_BROWSER_INSPECTOR_20261017 import H,J,stats,src_section,selected
from SOUNDTOUCH_COUNTER_ENGINE_INSPECTOR_20261017 import sources
OUT=ROOT/'docs/research/SOUNDTOUCH_PHASE_ENGINE_INDEPENDENT_RESULTS_20261017.json'
FACTOR=2**(2/12)

def clock_check(c):
 assert c['nextFrame']==c['anchorFrame']+c['blocks']*128
 assert c['wraps']==(c['nextFrame']-c['anchorFrame'])//c['periodFrames']
 return c

def release(p):
 assert p['disposed'] and p['store']['disposed'] and p['store']['retainedPCMBytes']==p['store']['retainedChunks']==0
 assert p['transport']['disposed'] and p['transport']['sourceBytes']==0 and p['transport']['epochs']==[]
 c=clock_check(p['renderClock']);assert c['nextFrame']==p['transport']['nextFrame']
 assert p['phaseControl']['disposed'] and p['phaseControl']['sharedBufferPCMBytes']==c['periodFrames']*4
 return {'processorPayloadBytes':0,'epochs':[],'clock':c,'nodeOwnedPhaseSourceDisposed':True,'sharedBuffer':p['phaseControl']}

def inspect_case(c,spec,long):
 assert all(c[k]==v for k,v in spec.items())
 cap=c['capture'];path=ROOT/cap['retained']['path'];sr=spec['sampleRate'];ch=2*(spec['sources']+1)+2
 assert H(path)==cap['sha256']==cap['retained']['sha256']
 assert path.stat().st_size==cap['retained']['bytes']==cap['frames']*ch*4 and cap['channels']==ch
 assert sr==cap['sampleRate']==c['environment']['sampleRate']
 a=np.memmap(path,dtype='<f4',mode='r',shape=(cap['frames'],ch));assert all(np.isfinite(a[n:n+100000]).all() for n in range(0,len(a),100000))
 blocks=c['blocks'];assert len(a)==len(blocks)*128
 schedule=c['framePhaseSchedule'];anchor=schedule['anchorFrame'];period=schedule['periodFrames'];first=cap['firstFrame']
 assert anchor%128==period%128==0 and period==round(sr*4/128)*128 and schedule['issuedAtFrame']<anchor
 assert c['configureClock']['clock']['nextFrame'] is None and c['configureClock']['clock']['anchorFrame']==anchor
 assert c['arm']['frames']==c['arm']['sequence']==0 and first==c['arm']['frame']>=anchor+256
 clock_check(c['arm']['clock']);clock_check(c['captureStop']['clock'])
 assert c['captureStop']['sequence']==len(blocks) and c['captureStop']['frames']==len(a) and c['captureStop']['frame']==first+len(a)
 anomalies=[];globalrows=[]
 for i,b in enumerate(blocks):
  assert b['sequence']==i and b['frames']==128 and b['frameSource']=='declared-anchor-integer-counter-checked-looping-phase'
  if b['frame']!=first+i*128:anomalies.append({'ordinal':i,'row':b,'expectedCounter':first+i*128})
  assert isinstance(b['globalFrame'],int) and b['globalFrame']>=0 and math.isfinite(b['globalTime'])
  if b['globalFrame']!=b['frame'] or abs(b['globalTime']*sr-b['frame'])>.25:globalrows.append(b)
  if long:assert abs(b['globalFrame']-b['frame'])<=256
 maxphase=0.;maxstep=0.;wraps=0;previous=None
 for n in range(0,len(a),100000):
  phase=a[n:n+100000,-1].astype(float);assert np.all((phase>=0)&(phase<1))
  local=phase*period;expected=(first+np.arange(n,n+len(phase),dtype=np.int64)-anchor)%period
  maxphase=max(maxphase,float(np.max(np.abs(local-expected))))
  diff=np.diff(np.concatenate(([previous],local)) if previous is not None else local);wraps+=int(np.count_nonzero(diff<0));cyclic=np.where(diff<0,diff+period,diff)
  maxstep=max(maxstep,float(np.max(np.abs(cyclic-1))))
  previous=local[-1]
 assert maxphase==cap['maxFrameTagError'] and cap['contiguous']==(not anomalies)
 captureok=not anomalies and maxphase<=.25;assert captureok==cap['valid'] and len(a)/sr<(115 if long else 30)
 events={e['label']:e for e in c['events']}
 wanted={'neutral':[330,550],'shifted':[330*FACTOR,550*FACTOR],'keylock-off':[412.5,687.5],'warm-follow':[412.5,687.5],'rebase':[825,1100],'resume':[660*FACTOR,880*FACTOR],'long-neutral':[330,550]}
 measured=[]
 for m in c['measurements']:
  label=m['label']
  if long and label.startswith('long-neutral-'):
   offset=int(label.split('-')[-1][:-1]);assert offset in [30,60,90];when=events['long-neutral']['state']['when']+offset;expected=[660,880]
  else:when=events[label]['state']['when'];expected=wanted[label]
  assert m['window']==[when+.5,when+1.5] and m['expectedHz']==expected
  lo,hi=[round(t*sr)-first for t in m['window']];assert 0<=lo<hi<=len(a) and len(m['channels'])==ch-2
  for j,old in enumerate(m['channels']):
   z=stats(a[lo:hi,j],sr);passed=z['RMS']>.01 and abs(z['crossingHz']-expected[j%2])<=1
   assert abs(z['crossingHz']-old['hz'])<1e-7 and abs(z['RMS']-old['rms'])<1e-10 and passed==old['passed']
   assert old['source']==j//2 and old['channel']==j%2
   measured.append({'label':label,'source':j//2,'channel':j%2,'windowSeconds':m['window'],'expectedHz':expected[j%2],**z,'crossingErrorHz':z['crossingHz']-expected[j%2],'HannErrorHz':z['HannHz']-expected[j%2],'crossingPassed':passed,'HannPassed':z['RMS']>.01 and abs(z['HannHz']-expected[j%2])<=1})
 assert len(c['measurements'])==(5 if long else 6)
 lo,hi=[round(t*sr)-first for t in c['pause']['window']];assert 0<=lo<hi<=len(a)
 assert c['pause']['window']==[c['pause']['pausedAt']+.2,c['pause']['pausedAt']+.6]
 pausepeak=float(np.max(np.abs(a[lo:hi,:-2])));assert (pausepeak==0)==c['pause']['passed']
 control=stats(a[:,-2],sr,False);control['HannFirst2SecondsHz']=stats(a[:sr*2,-2],sr)['HannHz']
 assert abs(control['crossingHz']-c['control']['hz'])<1e-7;controlok=abs(control['crossingHz']-307)<=.01;assert controlok==c['control']['passed']
 lc=c['lifecycle'];assert lc['canceled']['name']=='AbortError' and lc['canceled']['elapsedMs']<400 and lc['otherWaiterSurvived'] and lc['before']['store']['retainedPCMBytes']>0 and lc['idempotent'] and lc['terminal']['name']=='AbortError'
 survivor=release(lc['disposal']);cleanup=[]
 assert [e['label'] for e in c['releaseEvidence']]==['middle-pause','final-pause']
 for e in c['releaseEvidence']:
  assert e['release']['disposed'] and e['release']['retainedPCMBytes']==0 and e['adapter']['disposed'] and e['adapter']['groups']==[] and e['adapter']['retainedPCMBytes']==e['adapter']['inFlightPCMBytes']==0
  assert len(e['processors'])>=spec['sources']
  cleanup.append({'label':e['label'],'at':e['at'],'acknowledgements':[release(p) for p in e['processors']]})
 assert c['cleaned'] and c['pausedVoiceAbsent'] and not any(d['type']=='fatal' for d in c['factoryDiagnostics'])
 extended=None
 if long:
  lc_=c['longClock'];g=next(g for g in lc_['adapter']['groups'] if g['role']=='selected');old=2**22
  assert lc_['observedContextFrame']>old and first<old<first+len(a) and lc_['crossedOldLimit']
  assert c['pause']['pausedAt']-events['long-neutral']['state']['when']>=100
  assert g['start']>90 and g['end']>110 and g['end']-g['start']<=11 and g['retainedPCMBytes']<=sr*11*2*4
  active=cleanup[0]['acknowledgements'][0]['clock'];assert active['nextFrame']>old and active['wraps']>=25
  extended={'actualContextFrame':lc_['observedContextFrame'],'originalRawSpansOld2Power22Boundary':True,'steadyPlaybackSecondsBeforePause':c['pause']['pausedAt']-events['long-neutral']['state']['when'],'acknowledgedWindow':g,'processorClockAtMiddlePause':active,'boundIsSnapshotNotContinuousMemoryProfiler':True}
 else:
  owners=[selected(events[k]['after']) for k in ['neutral','shifted','keylock-off','warm-follow']];assert owners==[c['warmOwner']]*4
  assert selected(events['rebase']['after'])!=owners[0] and len(events['rebase']['after']['groups'])==1 and c['beforeRebase']['groups'][0]['start']>0 and c['beforeRebase']['groups'][0]['end']>8
 accepted=captureok and all(m['crossingPassed'] for m in measured) and pausepeak==0 and controlok and not c['errors'] and c['cleaned']
 assert accepted==c['criteriaPassed']
 return {'id':c['id'],'rawSHA256':H(path),'rawBytes':path.stat().st_size,'frames':len(a),'rows':len(blocks),'channels':ch,'wholeFinite':True,'captureCriterionPassed':captureok,'counterAnomalies':anomalies,'maxPhaseErrorSamples':maxphase,'maxCyclicPhaseIncrementErrorSamples':maxstep,'observedRawPhaseWraps':wraps,'originalGlobalDisagreements':globalrows,'maxOriginalGlobalDifference':max([abs(b['frame']-b['globalFrame']) for b in globalrows] or [0]),'observerStopClock':c['captureStop']['clock'],'measurements':measured,'pausePeak':pausepeak,'control':control,'registrationAbortElapsedMs':lc['canceled']['elapsedMs'],'sharedRegistrationOtherWaiterSurvived':True,'survivorAcknowledgement':survivor,'actualEnginePauseCleanup':cleanup,'extendedRuntime':extended,'errors':c['errors'],'acceptedUnderThisCohortCriterion':accepted}

def inspect(cohort,long):
 p=ROOT/f'docs/prototype/soundtouch-engine-browser-{cohort}-results.json';r=J(p);assert r['completed'] and not r['fatalErrors'] and r['full_parity_verified'] is False
 base,graph=sources(r,cohort,True);assert H(base/'prototype/engine.js')==H(ROOT/'prototype/engine.js')=='b4683c245c6314432c06f891e85106cf0a1a5c0a615435516930ab5b38f64adf'
 assert src_section((base/'prototype/keylock-shadow-live.js').read_text())==src_section((ROOT/'prototype/keylock-shadow-live.js').read_text())
 assert J(base/'plan.json')==r['plan'] and r['servedSources']['moduleDelaySeconds']==.5
 plan=r['plan'];assert plan['criteria']['pitch_error_hz']==1 and plan['criteria']['control_error_hz']==.01 and plan['criteria']['frame_tag_error_samples']==.25
 clock=(base/'experiments/keylock-soundtouch/phase-render-clock.mjs').read_text();ctl=(base/'experiments/keylock-soundtouch/phase-control.mjs').read_text()
 assert 'for (let i = 0; i < frames; i++)' in clock and 'Math.abs(tags[i] * this.#period - phase) > .25' in clock
 assert ('coarseGlobalFenceFrames:256' in clock)==long and ('future();' in ctl)==long
 observer=(base/'experiments/keylock-soundtouch/phase-capture.mjs').read_text();assert 'this.clock.begin' in observer and 'this.clock.nextFrame===null' in observer and "this.armed=true;this.sequence=0;this.frames=0;" in observer
 cases=[inspect_case(c,spec,long) for c,spec in zip(r['cases'],plan['cases'])];assert len(cases)==len(r['cases'])==len(plan['cases'])==(2 if long else 4)
 accepted=sum(c['acceptedUnderThisCohortCriterion'] for c in cases);assert accepted==r['acceptedCases']
 return {'cohort':cohort,'reportSHA256':H(p),'plan':plan,'sourceGraph':graph,'sourceIdentities':{n:H(base/'experiments/keylock-soundtouch'/n) for n in ['phase-render-clock.mjs','phase-control.mjs','phase-capture.mjs','node-factory.mjs','node-worklet.mjs']},'coarseGlobal256FenceIncluded':long,'lateAnchorGuardsIncluded':long,'sourceSnapshotsVerified':True,'productionEngineAndSRCUnchanged':True,'cases':cases,'acceptedCases':accepted,'frames':sum(c['frames'] for c in cases),'rows':sum(c['rows'] for c in cases),'rawBytes':sum(c['rawBytes'] for c in cases),'toneChannelWindows':sum(len(c['measurements']) for c in cases)}

def main():
 assert H(ROOT/'docs/research/SOUNDTOUCH_ENGINE_BROWSER_INSPECTOR_20261017.py')=='718d9d595aa0a9ea39e90a8319145feb1c155e474f4b5864f628410aa8cdf89f'
 assert H(ROOT/'docs/research/SOUNDTOUCH_COUNTER_ENGINE_INSPECTOR_20261017.py')=='b30eb6a60746fb2b8d3f8d705b05c71081780f6aba0d7464d49de2e20f9f9b99'
 early=inspect('phase-engine',False)
 if '--early-only' in sys.argv:
  print(json.dumps({'cohort':early['cohort'],'acceptedCases':early['acceptedCases'],'frames':early['frames'],'rows':early['rows'],'toneChannelWindows':early['toneChannelWindows'],'cases':[{'id':c['id'],'phaseError':c['maxPhaseErrorSamples'],'maxCrossing':max(abs(m['crossingErrorHz']) for m in c['measurements']),'maxHann':max(abs(m['HannErrorHz']) for m in c['measurements'])} for c in early['cases']]},indent=2));return
 assert not OUT.exists(),'Refuse to overwrite an independent result'
 long=inspect('phase-long',True)
 history=[]
 for suffix,count in [('initial',0),('preflight',3),('lifecycle',3),('clock-probe',0),('counter-clock',4),('counter-full',4)]:
  p=ROOT/f'docs/prototype/soundtouch-engine-browser-{suffix}-results.json';r=J(p);assert r['acceptedCases']==count
  raws=[]
  for c in r['cases']:
   q=ROOT/c['capture']['retained']['path'];assert H(q)==c['capture']['sha256'];raws.append({'id':c['id'],'rawSHA256':H(q),'reportedAccepted':c['criteriaPassed']})
  history.append({'cohort':suffix,'reportSHA256':H(p),'acceptedCases':count,'raws':raws,'regraded':False})
 result={'scope':'Independent whole-original browser evidence inspection of two distinct prospective phase cohorts. Browser operated by parent. No native/music/hours/physical/audiblecursor/fullparity acceptance.','cohorts':[early,long],'oldCohortsPreservedNotRegraded':history,'internalProcessorParameterArraysIndependentlyReplayed':False,'observerOriginalWholePhaseArraysIndependentlyReplayed':True,'sharedPhaseBuffersDecodedInputsSRCAndOpaqueHeapsExcludedFromZeroStoreClaim':True,'earlierUnguardedRunCreditedWithLaterGuards':False,'fullParityAccepted':False}
 with OUT.open('x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'sha256':H(OUT),'cohorts':[{'name':x['cohort'],'accepted':x['acceptedCases'],'frames':x['frames'],'rows':x['rows'],'rawBytes':x['rawBytes'],'toneWindows':x['toneChannelWindows'],'cases':[{'id':c['id'],'phaseError':c['maxPhaseErrorSamples'],'wraps':c['observedRawPhaseWraps'],'globalDisagreementRows':len(c['originalGlobalDisagreements']),'maxCrossing':max(abs(m['crossingErrorHz']) for m in c['measurements']),'maxHann':max(abs(m['HannErrorHz']) for m in c['measurements'])} for c in x['cases']]} for x in [early,long]]},indent=2))
def allocation_expiry_repro():
 import subprocess
 factory=ROOT/'local-evidence/soundtouch-engine-browser-phase-long/source-snapshots/experiments/keylock-soundtouch/node-factory.mjs'
 assert H(factory)=='023c517052f87a00307b2d54381d13046a3fbe56b930e5180d576d01e6f7b6d2'
 code="""const {default:factory}=await import(process.argv[1]);let created=[];
 globalThis.AudioWorkletNode=class{constructor(){this.disconnects=0;this.closes=0;this.parameters=new Map([['renderClock',{setValueAtTime(){}}]]);this.port={close:()=>this.closes++};created.push(this)}disconnect(){this.disconnects++}};
 const context={sampleRate:48000,currentTime:0,audioWorklet:{addModule:async()=>{}},createBuffer(ch,length){this.currentTime=1;return{length,getChannelData:()=>new Float32Array(length)}}};
 const r=await factory(context,{outputChannelCount:[2]},{durationFrames:48000}).then(()=>({resolved:true}),e=>({rejection:e.name,message:e.message}));
 console.log(JSON.stringify({...r,constructedNodes:created.length,disconnects:created.map(n=>n.disconnects),portCloses:created.map(n=>n.closes)}));"""
 data=json.loads(subprocess.check_output(['node','--input-type=module','-e',code,factory.as_uri()],text=True))
 assert data['rejection']=='LateScheduleError' and data['constructedNodes']==1 and data['disconnects']==data['portCloses']==[0]
 print(json.dumps({'frozenFactorySHA256':H(factory),'scope':'Controlled actual factory/helper allocation-expiry path, not measured native heap or audible leak','observed':data,'desiredExplicitRetirementObserved':False},indent=2))
if __name__=='__main__':
 if '--allocation-expiry' in sys.argv:allocation_expiry_repro()
 else:main()
