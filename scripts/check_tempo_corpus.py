"""Read-only corpus triage; offline estimates do not establish audible Sync acceptance."""
import argparse, hashlib, json, math, os, subprocess, sys, time
from pathlib import Path
import numpy as np
from scipy.signal import lfilter
RATE = 22050

def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1024*1024), b''): h.update(block)
    return h.hexdigest()

def attacks(pcm, channel, beats):
    # Independent zero-phase bass energy, with complete interior 50% crossings only.
    rows = []
    duration = len(pcm)/RATE
    hp = math.exp(-2*math.pi*35/RATE); lp = 1-math.exp(-2*math.pi*250/RATE)
    def filt(x): return lfilter([lp], [1, -(1-lp)], lfilter([hp, -hp], [1, -hp], x))
    for start in range(0, math.ceil(duration), 20):
        lo=max(0,int((start-1)*RATE)); hi=min(len(pcm),int((start+21)*RATE))
        x=np.asarray(pcm[lo:hi,channel],dtype=np.float64)
        y=filt(filt(x)[::-1])[::-1]
        size=round(.005*RATE); c=np.r_[0,np.cumsum(y*y)]
        env=np.sqrt(np.maximum(0,(c[size:]-c[:-size])/size))
        origin=lo/RATE+size/(2*RATE)
        for b in beats:
            if not start<=b['before']<start+20: continue
            left=max(0,round((b['before']-.08-origin)*RATE)); right=min(len(env),round((b['before']+.12-origin)*RATE))
            seg=env[left:right]
            if len(seg)<round(.18*RATE): continue
            peak=int(np.argmax(seg)); maximum=float(seg[peak]); threshold=.5*maximum
            if maximum<1e-5 or peak<round(.02*RATE) or peak>len(seg)-round(.02*RATE): continue
            if seg[0]>=threshold or maximum<2.5*float(np.min(seg)): continue
            cross=np.flatnonzero((seg[:-1]<threshold)&(seg[1:]>=threshold))
            cross=cross[cross<peak]
            if not len(cross): continue
            at=int(cross[-1]); fraction=(threshold-seg[at])/(seg[at+1]-seg[at])
            event=origin+(left+at+fraction)/RATE
            if event<=b['before']-.075 or event>=b['before']+.115: continue
            rows.append({'section':start,'beforeMs':1000*(event-b['before']),
                         'afterMs':None if b['after'] is None else 1000*(event-b['after'])})
    return rows

def observed(rows, duration):
    sections=[]
    for section in sorted({r['section'] for r in rows}):
        subset=[r for r in rows if r['section']==section]
        if len(subset)<8: continue
        sections.append({'from':section,'events':len(subset),
            'beforeMedianMs':float(np.median([r['beforeMs'] for r in subset])),
            'afterMedianMs':None if subset[0]['afterMs'] is None else float(np.median([r['afterMs'] for r in subset]))})
    result={'events':len(rows),'sections':sections,'classification':'insufficient_complete_onsets'}
    if len(sections)<3 or len(rows)<100: return result
    before=np.abs([s['beforeMedianMs'] for s in sections]); after=[s['afterMedianMs'] for s in sections]
    result.update(beforeMedianAbsMs=float(np.median(before)),beforeP95Ms=float(np.percentile(before,95)))
    if after[0] is None: result['classification']='no_proposal'; return result
    after=np.abs(after)
    result.update(afterMedianAbsMs=float(np.median(after)),afterP95Ms=float(np.percentile(after,95)))
    median_delta=result['afterMedianAbsMs']-result['beforeMedianAbsMs']
    p95_delta=result['afterP95Ms']-result['beforeP95Ms']
    result['classification']='worse' if median_delta>3 or p95_delta>3 else ('improved' if median_delta<-3 or p95_delta<-5 else 'inconclusive')
    return result

def self_check():
    pcm=np.zeros((RATE*80,2),np.float32); beats=[]
    for i in range(1,159):
        t=i*.5; n=round((t+.025)*RATE); size=round(.08*RATE)
        pcm[n:n+size,0]=np.sin(2*np.pi*80*np.arange(size)/RATE)*np.exp(-np.arange(size)/(RATE*.012))
        beats.append({'beat':i,'before':t,'after':t+.025})
    report=observed(attacks(pcm,0,beats),80)
    assert report['classification']=='improved',report
    assert report['afterMedianAbsMs']<10,report
    assert observed([],80)['classification']=='insufficient_complete_onsets'
    print('observer self-check: known +25ms onsets improve; silence remains unknown',flush=True)

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('folder',type=Path); parser.add_argument('output',type=Path); args=parser.parse_args()
    self_check(); args.output.mkdir(parents=True,exist_ok=True)
    files=sorted(p for p in args.folder.rglob('*') if p.suffix.lower() in {'.mp3','.wav','.aif','.aiff','.m4a','.flac','.ogg'})
    source_files=['prototype/analysis.js','prototype/tempo-drift.js','prototype/beatgrid.js']
    protocol={'started':time.time(),'tracks':len(files),'sampleRate':RATE,'channels':2,'processing':'sequential; fresh Node process per track; FFmpeg stereo resampling; initial tempo fit 180s, drift check full file',
      'limitations':'Offline resampled PCM, not native 44.1k decode or musical ground truth. Independent energy onsets are not verified kicks/downbeats. No library/grid/original writes.',
      'proposalCriterion':'Fixed same onsets/beat IDs before and after. Worse if median or P95 absolute section-median error grows >3ms; improved if no worse and median falls >3ms or P95 >5ms. Otherwise inconclusive. <3 supported onset sections or <100 events is unknown.',
      'sources':{p:digest(Path(p)) for p in source_files},'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()}
    protocol_path=args.output/'protocol.json'
    if protocol_path.exists():
        previous=json.loads(protocol_path.read_text())
        assert previous['sources']==protocol['sources'], 'Source changed during corpus run; use a new output folder'
        protocol=previous
    else: protocol_path.write_text(json.dumps(protocol,indent=2))
    summaries=[]; scratch=args.output/'scratch.f32'
    for index,path in enumerate(files):
        output=args.output/f'{index:03d}.json'; start=time.time()
        if output.exists() and json.loads(output.read_text()).get('status')=='analyzed':
            record=json.loads(output.read_text())
            if record.get('sha256')!=digest(path): raise RuntimeError('Source changed before resume: '+str(path))
        else:
            record={'file':str(path.relative_to(args.folder)),'sha256':digest(path),'status':'error'}
            try:
                subprocess.run(['ffmpeg','-nostdin','-v','error','-threads','1','-i',str(path),'-f','f32le','-ac','2','-ar',str(RATE),'-y',str(scratch)],check=True,timeout=180,capture_output=True)
                subprocess.run(['node','--max-old-space-size=1024','scripts/check_tempo_corpus_track.mjs',str(scratch),str(args.output/'analysis.json')],check=True,timeout=240,capture_output=True)
                data=json.loads((args.output/'analysis.json').read_text()); result=data['result']
                pcm=np.memmap(scratch,dtype='<f4',mode='r').reshape(-1,2)
                obs=observed(attacks(pcm,data['chosenChannel'],data['beats']),result['duration']); del pcm
                record.update(status='analyzed',duration=result['duration'],bpm=result['bpm'],confidence=(result.get('tempo') or {}).get('confidence'),drift=(result.get('grid') or {}).get('drift'),observation=obs,warnings=result['warnings'])
            except Exception as error:
                record['error']=str(error)[:700]
                if isinstance(error,subprocess.CalledProcessError): record['stderr']=error.stderr.decode(errors='replace')[-1000:]
            record.update(seconds=round(time.time()-start,2),sourceUnchanged=digest(path)==record['sha256'])
            output.write_text(json.dumps(record,indent=2))
        summaries.append({k:v for k,v in record.items() if k!='drift'}|{'supported':(record.get('drift') or {}).get('supported',False),'detected':(record.get('drift') or {}).get('detected',False),'proposal':bool((record.get('drift') or {}).get('suggestion'))})
        (args.output/'summary.json').write_text(json.dumps(summaries,indent=2))
        print(f"{index+1}/{len(files)} {record['status']} {record.get('bpm')} {record.get('observation',{}).get('classification')} {record['file']}",flush=True)
    scratch.unlink(missing_ok=True); (args.output/'analysis.json').unlink(missing_ok=True)
    print('Corpus completed; original identities checked before and after each track.',flush=True)
if __name__=='__main__': main()
